import { getSession } from '../../server/session.js';
import { getUser } from '../../server/db.js';
import { getOrigin, jsonError, methodNotAllowed } from '../../server/http.js';
import { stripe } from '../../server/stripe.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  try {
    const sessionUser = await getSession(req);
    if (!sessionUser) return jsonError(res, 401, 'authentication_required', 'Sign in to manage billing.');
    const user = await getUser(sessionUser.id);
    if (!user?.stripe_customer_id) return jsonError(res, 404, 'billing_profile_missing', 'No billing profile exists for this account.');
    const portal = await stripe().billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: getOrigin(req),
    });
    return res.status(200).json({ url: portal.url });
  } catch (error) {
    console.error('portal_create_failed', error);
    return jsonError(res, 500, 'portal_create_failed', 'Could not open the billing portal.');
  }
}
