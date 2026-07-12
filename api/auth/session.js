import { createSessionToken, setSessionCookie } from '../../server/session.js';
import { jsonError, methodNotAllowed, readJson } from '../../server/http.js';
import { upsertUser } from '../../server/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  try {
    const { accessToken } = await readJson(req);
    if (!accessToken) return jsonError(res, 400, 'missing_access_token', 'Google access token is required.');
    const googleResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!googleResponse.ok) return jsonError(res, 401, 'invalid_google_token', 'Google sign-in could not be verified.');
    const profile = await googleResponse.json();
    if (!profile.sub || !profile.email || profile.email_verified === false) {
      return jsonError(res, 401, 'unverified_google_account', 'A verified Google account is required.');
    }
    const user = await upsertUser({
      id: profile.sub,
      email: profile.email.toLowerCase(),
      name: profile.name || '',
      picture: profile.picture || '',
    });
    setSessionCookie(res, await createSessionToken(user));
    return res.status(200).json({ user: { id: user.id, email: user.email, name: user.name, picture: user.picture } });
  } catch (error) {
    console.error('session_create_failed', error);
    return jsonError(res, 500, 'session_create_failed', 'Could not create a secure session.');
  }
}
