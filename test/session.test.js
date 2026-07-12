import test from 'node:test';
import assert from 'node:assert/strict';
import { createSessionToken, getSession, setSessionCookie } from '../server/session.js';

process.env.SESSION_SECRET = 'test-only-secret-with-at-least-32-characters';

test('signed HttpOnly session round-trips without exposing the Google token', async () => {
  const user = { id: 'google-123', email: 'person@example.com', name: 'Test User', picture: '' };
  const token = await createSessionToken(user);
  const session = await getSession({ headers: { cookie: `tm365_session=${encodeURIComponent(token)}` } });
  assert.deepEqual(session, user);

  const headers = {};
  setSessionCookie({ setHeader: (name, value) => { headers[name] = value; } }, token);
  assert.match(headers['Set-Cookie'], /HttpOnly/);
  assert.match(headers['Set-Cookie'], /SameSite=Lax/);
  assert.doesNotMatch(headers['Set-Cookie'], /access_token/);
});

test('tampered session tokens are rejected', async () => {
  const token = await createSessionToken({ id: 'google-123', email: 'person@example.com' });
  const session = await getSession({ headers: { cookie: `tm365_session=${token}x` } });
  assert.equal(session, null);
});
