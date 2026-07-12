import { getSession } from '../../server/session.js';
import { getEntitlement, entitlementIsActive } from '../../server/db.js';
import { jsonError, methodNotAllowed } from '../../server/http.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  try {
    const user = await getSession(req);
    if (!user) return res.status(200).json({ user: null, premium: false });
    const entitlement = await getEntitlement(user.id);
    return res.status(200).json({
      user,
      premium: entitlementIsActive(entitlement),
      subscriptionStatus: entitlement?.status || 'inactive',
      currentPeriodEnd: entitlement?.current_period_end || null,
    });
  } catch (error) {
    console.error('session_read_failed', error);
    return jsonError(res, 500, 'session_read_failed', 'Could not read the secure session.');
  }
}
