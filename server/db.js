import { neon } from '@neondatabase/serverless';
import { requireEnv } from './config.js';

let sqlClient;
let schemaPromise;

export function db() {
  if (!sqlClient) sqlClient = neon(requireEnv('DATABASE_URL'));
  return sqlClient;
}

export function ensureSchema() {
  if (!schemaPromise) {
    const sql = db();
    schemaPromise = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS tm_users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL DEFAULT '',
        picture TEXT NOT NULL DEFAULT '',
        stripe_customer_id TEXT UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`;
      await sql`ALTER TABLE tm_users ADD COLUMN IF NOT EXISTS password_hash TEXT`;
      await sql`CREATE TABLE IF NOT EXISTS tm_entitlements (
        user_id TEXT PRIMARY KEY REFERENCES tm_users(id) ON DELETE CASCADE,
        stripe_subscription_id TEXT UNIQUE,
        status TEXT NOT NULL DEFAULT 'inactive',
        current_period_end TIMESTAMPTZ,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`;
      await sql`CREATE TABLE IF NOT EXISTS tm_stripe_events (
        id TEXT PRIMARY KEY,
        processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`;
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  return schemaPromise;
}

export async function upsertUser(user) {
  await ensureSchema();
  const sql = db();
  const rows = await sql`
    INSERT INTO tm_users (id, email, name, picture, updated_at)
    VALUES (${user.id}, ${user.email}, ${user.name || ''}, ${user.picture || ''}, NOW())
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      name = EXCLUDED.name,
      picture = EXCLUDED.picture,
      updated_at = NOW()
    RETURNING *
  `;
  return rows[0];
}

export async function getUserByEmail(email) {
  await ensureSchema();
  const rows = await db()`SELECT * FROM tm_users WHERE email = ${email} LIMIT 1`;
  return rows[0] || null;
}

export async function createPasswordUser({ id, email, name, passwordHash }) {
  await ensureSchema();
  const rows = await db()`
    INSERT INTO tm_users (id, email, name, password_hash, updated_at)
    VALUES (${id}, ${email}, ${name || ''}, ${passwordHash}, NOW())
    RETURNING *
  `;
  return rows[0];
}

export async function getUser(id) {
  await ensureSchema();
  const rows = await db()`SELECT * FROM tm_users WHERE id = ${id} LIMIT 1`;
  return rows[0] || null;
}

export async function setStripeCustomer(userId, customerId) {
  await ensureSchema();
  await db()`UPDATE tm_users SET stripe_customer_id = ${customerId}, updated_at = NOW() WHERE id = ${userId}`;
}

export async function getUserByStripeCustomer(customerId) {
  await ensureSchema();
  const rows = await db()`SELECT * FROM tm_users WHERE stripe_customer_id = ${customerId} LIMIT 1`;
  return rows[0] || null;
}

export async function getEntitlement(userId) {
  await ensureSchema();
  const rows = await db()`SELECT * FROM tm_entitlements WHERE user_id = ${userId} LIMIT 1`;
  return rows[0] || null;
}

export function entitlementIsActive(entitlement) {
  if (!entitlement || !['active', 'trialing'].includes(entitlement.status)) return false;
  if (!entitlement.current_period_end) return true;
  return new Date(entitlement.current_period_end).getTime() > Date.now();
}

export async function saveEntitlement({ userId, subscriptionId, status, currentPeriodEnd }) {
  await ensureSchema();
  await db()`
    INSERT INTO tm_entitlements (user_id, stripe_subscription_id, status, current_period_end, updated_at)
    VALUES (${userId}, ${subscriptionId}, ${status}, ${currentPeriodEnd}, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      stripe_subscription_id = EXCLUDED.stripe_subscription_id,
      status = EXCLUDED.status,
      current_period_end = EXCLUDED.current_period_end,
      updated_at = NOW()
  `;
}

export async function claimStripeEvent(eventId) {
  await ensureSchema();
  const rows = await db()`
    INSERT INTO tm_stripe_events (id) VALUES (${eventId})
    ON CONFLICT (id) DO NOTHING
    RETURNING id
  `;
  return rows.length === 1;
}

export async function releaseStripeEvent(eventId) {
  await ensureSchema();
  await db()`DELETE FROM tm_stripe_events WHERE id = ${eventId}`;
}
