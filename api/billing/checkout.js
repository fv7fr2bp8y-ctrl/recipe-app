import { getSession } from '../../server/session.js';
import { getEntitlement, entitlementIsActive, getUser, setStripeCustomer } from '../../server/db.js';
import { getOrigin, jsonError, methodNotAllowed } from '../../server/http.js';
import { stripe } from '../../server/stripe.js';
import { STRIPE_PRICE_ID } from '../../server/config.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  try {
    const sessionUser = await getSession(req);
    if (!sessionUser) return jsonError(res, 401, 'authentication_required', 'Sign in before subscribing.');
    if (entitlementIsActive(await getEntitlement(sessionUser.id))) {
      return jsonError(res, 409, 'already_subscribed', 'This account already has Premium access.');
    }
    const user = await getUser(sessionUser.id);
    if (!user) return jsonError(res, 401, 'unknown_user', 'The signed-in account was not found.');

    const client = stripe();
    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await client.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: { tm_user_id: user.id },
      });
      customerId = customer.id;
      await setStripeCustomer(user.id, customerId);
    }

    const origin = getOrigin(req);
    const checkout = await client.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?checkout=cancelled`,
      subscription_data: { metadata: { tm_user_id: user.id } },
      metadata: { tm_user_id: user.id },
    });
    return res.status(200).json({ url: checkout.url });
  } catch (error) {
    console.error('checkout_create_failed', error);
    return jsonError(res, 500, 'checkout_create_failed', 'Could not open secure checkout.');
  }
}
