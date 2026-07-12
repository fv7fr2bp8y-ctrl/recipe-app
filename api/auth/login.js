import { createSessionToken, setSessionCookie } from '../../server/session.js';
import { getUserByEmail } from '../../server/db.js';
import { verifyPassword } from '../../server/password.js';
import { jsonError, methodNotAllowed, readJson } from '../../server/http.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  try {
    const { email: rawEmail, password } = await readJson(req);
    const email = String(rawEmail || '').trim().toLowerCase();
    const user = await getUserByEmail(email);
    if (!user || !await verifyPassword(password, user.password_hash)) {
      return jsonError(res, 401, 'invalid_credentials', 'Невалиден имейл или парола.');
    }
    const sessionUser = { id: user.id, email: user.email, name: user.name, picture: user.picture || '' };
    setSessionCookie(res, await createSessionToken(sessionUser));
    return res.status(200).json({ user: sessionUser });
  } catch (error) {
    console.error('login_failed', error);
    return jsonError(res, 500, 'login_failed', 'Входът не можа да бъде завършен.');
  }
}
