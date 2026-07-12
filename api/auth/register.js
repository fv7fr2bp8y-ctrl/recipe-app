import { createHash, randomUUID } from 'node:crypto';
import { createSessionToken, setSessionCookie } from '../../server/session.js';
import { createPasswordUser, getUserByEmail } from '../../server/db.js';
import { hashPassword } from '../../server/password.js';
import { jsonError, methodNotAllowed, readJson } from '../../server/http.js';

function normalizeEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return '';
  return email;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  try {
    const { email: rawEmail, password, name: rawName } = await readJson(req);
    const email = normalizeEmail(rawEmail);
    const name = String(rawName || '').trim().slice(0, 100);
    if (!email) return jsonError(res, 400, 'invalid_email', 'Въведи валиден имейл адрес.');
    if (await getUserByEmail(email)) {
      return jsonError(res, 409, 'account_exists', 'Вече има профил с този имейл. Използвай „Вход“.');
    }
    let passwordHash;
    try {
      passwordHash = await hashPassword(password);
    } catch (error) {
      return jsonError(res, 400, 'invalid_password', error.message);
    }
    const suffix = createHash('sha256').update(email).digest('hex').slice(0, 12);
    const user = await createPasswordUser({
      id: `email:${suffix}:${randomUUID()}`,
      email,
      name,
      passwordHash,
    });
    const sessionUser = { id: user.id, email: user.email, name: user.name, picture: '' };
    setSessionCookie(res, await createSessionToken(sessionUser));
    return res.status(201).json({ user: sessionUser });
  } catch (error) {
    console.error('registration_failed', error);
    return jsonError(res, 500, 'registration_failed', 'Профилът не можа да бъде създаден.');
  }
}
