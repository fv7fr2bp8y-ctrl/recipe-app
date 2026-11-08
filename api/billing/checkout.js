import { getSession } from '../../server/session.js';
import {
  getEntitlement, entitlementIsActive, getUser, recordFunnelEvent, saveEntitlement, setStripeCustomer,
} from '../../server/db.js';
import { getOrigin, jsonError, methodNotAllowed, readJson } from '../../server/http.js';
import { stripe } from '../../server/stripe.js';
import { STRIPE_PRICES, TRIAL_DAYS } from '../../server/config.js';
import { playSubscriptionId, verifyPlayPurchase } from '../../server/play.js';

async function linkPlayPurchase(res, userId, entitlement, purchaseToken) {
  if (typeof purchaseToken !== 'string' || !purchaseToken || purchaseToken.length > 4096) {
    return jsonError(res, 400, 'invalid_purchase', 'Invalid Google Play purchase.');
  }
  const subscriptionId = playSubscriptionId(purchaseToken);
  const hasOtherActivePlan = entitlementIsActive(entitlement) && !entitlement.stripe_subscription_id?.startsWith('play:');
  if (hasOtherActivePlan) return res.status(200).json({ premium: true });
  const purchase = await verifyPlayPurchase(purchaseToken);
  if (!purchase) return jsonError(res, 402, 'purchase_not_found', 'Google Play did not confirm this purchase.');
  try {
    await saveEntitlement({ userId, subscriptionId, status: purchase.status, currentPeriodEnd: purchase.currentPeriodEnd });
  } catch (error) {
    if (error?.code === '23505') return jsonError(res, 409, 'purchase_in_use', 'This purchase belongs to another account.');
    throw error;
  }
  if (entitlement?.stripe_subscription_id !== subscriptionId) {
    await recordFunnelEvent({
      name: purchase.trial ? 'trial_started' : 'paid',
      plan: `play_${purchase.productId}`,
      userId,
    }).catch(() => {});
  }
  return res.status(200).json({ premium: purchase.status === 'active' });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  try {
    const sessionUser = await getSession(req);
    if (!sessionUser) return jsonError(res, 401, 'authentication_required', 'Sign in before subscribing.');
    const { plan: requestedPlan, provider, purchaseToken } = await readJson(req).catch(() => ({}));
    const entitlement = await getEntitlement(sessionUser.id);
    if (provider === 'play') return await linkPlayPurchase(res, sessionUser.id, entitlement, purchaseToken);
    const plan = requestedPlan === 'yearly' ? 'yearly' : 'monthly';
    if (entitlementIsActive(entitlement)) {
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
      line_items: [{ price: STRIPE_PRICES[plan], quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?checkout=cancelled`,
      subscription_data: {
        metadata: { tm_user_id: user.id, tm_plan: plan },
        ...(entitlement ? {} : { trial_period_days: TRIAL_DAYS }),
      },
      metadata: { tm_user_id: user.id, tm_plan: plan },
    });
    await recordFunnelEvent({ name: 'checkout_start', plan, userId: user.id }).catch(() => {});
    return res.status(200).json({ url: checkout.url });
  } catch (error) {
    console.error('checkout_create_failed', error);
    return jsonError(res, 500, 'checkout_create_failed', 'Could not open secure checkout.');
  }
}
