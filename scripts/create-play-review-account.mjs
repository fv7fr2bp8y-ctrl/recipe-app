import { randomBytes, randomUUID } from 'node:crypto';
import fs from 'node:fs';
import { createPasswordUser, db, getUserByEmail, saveEntitlement } from '../server/db.js';
import { hashPassword } from '../server/password.js';

const [credentialsOutput] = process.argv.slice(2);
if (!credentialsOutput) {
  throw new Error('Usage: node scripts/create-play-review-account.mjs <private-credentials-output>');
}

const email = (process.env.PLAY_REVIEW_EMAIL || 'googleplay-review@tastemaster.eu').toLowerCase();
const password = process.env.PLAY_REVIEW_PASSWORD || `Tm!${randomBytes(18).toString('base64url')}`;
const passwordHash = await hashPassword(password);
let user = await getUserByEmail(email);

if (user) {
  const rows = await db()`
    UPDATE tm_users
    SET name = 'Google Play Review', password_hash = ${passwordHash}, updated_at = NOW()
    WHERE id = ${user.id}
    RETURNING *
  `;
  [user] = rows;
} else {
  user = await createPasswordUser({
    id: `password:${randomUUID()}`,
    email,
    name: 'Google Play Review',
    passwordHash,
  });
}

await saveEntitlement({
  userId: user.id,
  subscriptionId: null,
  status: 'active',
  currentPeriodEnd: new Date('2036-01-01T00:00:00.000Z'),
});

fs.writeFileSync(
  credentialsOutput,
  [
    'TasteMaster 365 Google Play review account',
    `Email: ${email}`,
    `Password: ${password}`,
    'Access: Premium review entitlement (no purchase required)',
    '',
  ].join('\n'),
  { mode: 0o600 },
);

console.log(`Review account is ready: ${email}`);
