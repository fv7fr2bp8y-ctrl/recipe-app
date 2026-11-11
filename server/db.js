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
      await sql`CREATE TABLE IF NOT EXISTS tm_funnel_events (
        id BIGSERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        plan TEXT,
        user_id TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`;
      await sql`ALTER TABLE tm_users ADD COLUMN IF NOT EXISTS attribution JSONB`;
      await sql`ALTER TABLE tm_funnel_events ADD COLUMN IF NOT EXISTS utm_source TEXT`;
      await sql`ALTER TABLE tm_funnel_events ADD COLUMN IF NOT EXISTS utm_campaign TEXT`;
      await sql`ALTER TABLE tm_funnel_events ADD COLUMN IF NOT EXISTS gclid TEXT`;
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

export async function createPasswordUser({ id, email, name, passwordHash, attribution = null }) {
  await ensureSchema();
  const rows = await db()`
    INSERT INTO tm_users (id, email, name, password_hash, attribution, updated_at)
    VALUES (${id}, ${email}, ${name || ''}, ${passwordHash}, ${attribution ? JSON.stringify(attribution) : null}::jsonb, NOW())
    RETURNING *
  `;
  return rows[0];
}

// Fills in the source only for accounts that have none yet (first touch wins).
export async function setUserAttributionIfEmpty(userId, attribution) {
  if (!attribution) return;
  await ensureSchema();
  await db()`
    UPDATE tm_users SET attribution = ${JSON.stringify(attribution)}::jsonb
    WHERE id = ${userId} AND attribution IS NULL
  `;
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

export async function recordFunnelEvent({ name, plan = null, userId = null, attribution = null }) {
  await ensureSchema();
  const source = attribution?.utm_source || null;
  const campaign = attribution?.utm_campaign || null;
  const gclid = attribution?.gclid || attribution?.gbraid || attribution?.wbraid || null;
  await db()`
    INSERT INTO tm_funnel_events (name, plan, user_id, utm_source, utm_campaign, gclid)
    VALUES (${name}, ${plan}, ${userId}, ${source}, ${campaign}, ${gclid})
  `;
}

export async function funnelStats(days) {
  await ensureSchema();
  return db()`
    SELECT name, COALESCE(plan, '') AS plan,
      COALESCE(utm_campaign, CASE WHEN gclid IS NOT NULL THEN '(google ads)' END, '') AS campaign,
      COUNT(*)::int AS count
    FROM tm_funnel_events
    WHERE created_at > NOW() - make_interval(days => ${days})
    GROUP BY 1, 2, 3
    ORDER BY 1, 2, 3
  `;
}
