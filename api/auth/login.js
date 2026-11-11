import { createSessionToken, setSessionCookie } from '../../server/session.js';
import { getUserByEmail, setUserAttributionIfEmpty } from '../../server/db.js';
import { verifyPassword } from '../../server/password.js';
import { jsonError, methodNotAllowed, readJson } from '../../server/http.js';
import { sanitizeAttribution } from '../../server/attribution.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  try {
    const { email: rawEmail, password, attribution } = await readJson(req);
    const email = String(rawEmail || '').trim().toLowerCase();
    const user = await getUserByEmail(email);
    if (!user || !await verifyPassword(password, user.password_hash)) {
      return jsonError(res, 401, 'invalid_credentials', 'Невалиден имейл или парола.');
    }
    const sessionUser = { id: user.id, email: user.email, name: user.name, picture: user.picture || '' };
    setSessionCookie(res, await createSessionToken(sessionUser));
    if (!user.attribution) {
      await setUserAttributionIfEmpty(user.id, sanitizeAttribution(attribution)).catch(() => {});
    }
    return res.status(200).json({ user: sessionUser });
  } catch (error) {
    console.error('login_failed', error);
    return jsonError(res, 500, 'login_failed', 'Входът не можа да бъде завършен.');
  }
}
