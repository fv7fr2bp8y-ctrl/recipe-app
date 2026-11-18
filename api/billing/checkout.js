import { getSession } from '../../server/session.js';
import {
  getEntitlement, entitlementIsActive, getUser, recordFunnelEvent, saveEntitlement, setStripeCustomer,
} from '../../server/db.js';
import { getOrigin, jsonError, methodNotAllowed, readJson } from '../../server/http.js';
import { stripe, subscriptionPeriodEnd } from '../../server/stripe.js';
import { STRIPE_PRICES, TRIAL_DAYS } from '../../server/config.js';
import { playSubscriptionId, verifyPlayPurchase } from '../../server/play.js';
import { attributionMetadata, sanitizeAttribution } from '../../server/attribution.js';
import { PROMO, promoActive } from '../../src/promo.js';

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

// After the return from Stripe the page asks what was actually paid, so the Google Ads
// purchase conversion carries the real amount (promotion codes included).
async function checkoutSummary(req, res, userId) {
  const sessionId = req.query?.session_id;
  if (typeof sessionId !== 'string' || !/^cs_[A-Za-z0-9_]{10,200}$/.test(sessionId)) {
    return jsonError(res, 400, 'invalid_session', 'Invalid checkout session.');
  }
  const checkout = await stripe().checkout.sessions.retrieve(sessionId);
  if (checkout.client_reference_id !== userId) {
    return jsonError(res, 404, 'session_not_found', 'Checkout session not found.');
  }
  return res.status(200).json({
    plan: checkout.metadata?.tm_plan || null,
    value: (checkout.amount_total || 0) / 100,
    currency: (checkout.currency || 'eur').toUpperCase(),
    paid: checkout.payment_status === 'paid' && (checkout.amount_total || 0) > 0,
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') return methodNotAllowed(res, ['GET', 'POST']);
  try {
    const sessionUser = await getSession(req);
    if (!sessionUser) return jsonError(res, 401, 'authentication_required', 'Sign in before subscribing.');
    if (req.method === 'GET') return await checkoutSummary(req, res, sessionUser.id);
    const {
      plan: requestedPlan, provider, purchaseToken, attribution: rawAttribution, consent,
    } = await readJson(req).catch(() => ({}));
    const entitlement = await getEntitlement(sessionUser.id);
    if (provider === 'play') return await linkPlayPurchase(res, sessionUser.id, entitlement, purchaseToken);
    const plan = requestedPlan === 'yearly' ? 'yearly' : 'monthly';
    if (entitlementIsActive(entitlement)) {
      return jsonError(res, 409, 'already_subscribed', 'This account already has Premium access.');
    }
    const user = await getUser(sessionUser.id);
    if (!user) return jsonError(res, 401, 'unknown_user', 'The signed-in account was not found.');

    // The account keeps its first source; the browser's copy covers accounts made before tracking.
    const attribution = sanitizeAttribution(user.attribution) || sanitizeAttribution(rawAttribution);
    const sourceMetadata = {
      ...attributionMetadata(attribution),
      ...(consent === 'granted' || consent === 'denied' ? { tm_consent: consent } : {}),
    };

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
    // Black Friday: monthly plans started 27 to 30 November pay 1,99 € for the first month.
    const promo = plan === PROMO.plan && promoActive();
    const discounts = promo ? [{ coupon: PROMO.coupon }] : undefined;
    const metadata = {
      tm_user_id: user.id, tm_plan: plan, ...(promo ? { tm_promo: PROMO.coupon } : {}), ...sourceMetadata,
    };

    // New accounts start the trial right here, without a card and without a Stripe page.
    // A card is added later from the billing portal; without one Stripe cancels the
    // subscription when the trial ends, so nobody is ever charged by surprise.
    if (!entitlement) {
      const subscription = await client.subscriptions.create({
        customer: customerId,
        items: [{ price: STRIPE_PRICES[plan] }],
        trial_period_days: TRIAL_DAYS,
        trial_settings: { end_behavior: { missing_payment_method: 'cancel' } },
        payment_settings: { save_default_payment_method: 'on_subscription' },
        ...(discounts ? { discounts } : {}),
        metadata,
      }, { idempotencyKey: `tm-trial-${user.id}-${plan}${promo ? '-promo' : ''}` });
      if (promo && !subscription.discounts?.length) {
        // The coupon should wait for the first paid invoice; if the €0 trial invoice used it, say so.
        console.warn('promo_discount_missing_after_trial_start', subscription.id);
      }
      await saveEntitlement({
        userId: user.id,
        subscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodEnd: subscriptionPeriodEnd(subscription),
      });
      await recordFunnelEvent({ name: 'checkout_start', plan, userId: user.id, attribution }).catch(() => {});
      await recordFunnelEvent({
        name: 'trial_started',
        plan,
        userId: user.id,
        attribution,
        valueCents: 0,
        currency: 'EUR',
        ref: subscription.id,
        consent: sourceMetadata.tm_consent || null,
      }).catch(() => {});
      return res.status(200).json({
        trial: true,
        url: `${origin}/?checkout=success&session_id=${encodeURIComponent(subscription.id)}`,
      });
    }

    const checkout = await client.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: STRIPE_PRICES[plan], quantity: 1 }],
      // Stripe takes either a fixed discount or the promotion code field, not both.
      ...(discounts ? { discounts } : { allow_promotion_codes: true }),
      success_url: `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?checkout=cancelled`,
      // Returning accounts (trial already used) pay right away.
      subscription_data: { metadata },
      metadata,
    });
    await recordFunnelEvent({
      name: 'checkout_start', plan, userId: user.id, attribution,
    }).catch(() => {});
    return res.status(200).json({ url: checkout.url });
  } catch (error) {
    console.error('checkout_create_failed', error);
    return jsonError(res, 500, 'checkout_create_failed', 'Could not open secure checkout.');
  }
}
