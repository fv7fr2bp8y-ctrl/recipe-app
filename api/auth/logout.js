import { clearSessionCookie } from '../../server/session.js';
import { methodNotAllowed } from '../../server/http.js';

export default function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  clearSessionCookie(res);
  return res.status(204).end();
}
