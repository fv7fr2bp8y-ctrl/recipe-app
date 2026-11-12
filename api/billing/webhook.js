import {
  claimStripeEvent, getUserByStripeCustomer, recordFunnelEvent, releaseStripeEvent, saveEntitlement,
} from '../../server/db.js';
import { jsonError, methodNotAllowed, readRawBody } from '../../server/http.js';
import { stripe, subscriptionPeriodEnd } from '../../server/stripe.js';
import { requireEnv } from '../../server/config.js';
import { attributionFromMetadata } from '../../server/attribution.js';

export const config = { api: { bodyParser: false } };

async function saveSubscription(subscription) {
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer?.id;
  const userId = subscription.metadata?.tm_user_id
    || (customerId ? (await getUserByStripeCustomer(customerId))?.id : null);
  // The Stripe account is shared with other apps (ASTRA365, Onira...), so this endpoint
  // also receives their subscriptions. Skip them instead of failing the delivery.
  if (!userId) {
    console.warn('webhook_skip_foreign_subscription', subscription.id);
    return false;
  }
  await saveEntitlement({
    userId,
    subscriptionId: subscription.id,
    status: subscription.status,
    currentPeriodEnd: subscriptionPeriodEnd(subscription),
  });
  return true;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  const signature = req.headers['stripe-signature'];
  if (!signature) return jsonError(res, 400, 'missing_signature', 'Stripe signature is required.');

  let event;
  try {
    const rawBody = await readRawBody(req);
    event = stripe().webhooks.constructEvent(rawBody, signature, requireEnv('STRIPE_WEBHOOK_SECRET'));
  } catch (error) {
    console.error('webhook_signature_failed', error);
    return jsonError(res, 400, 'invalid_signature', 'Invalid Stripe webhook signature.');
  }

  let claimed = false;
  try {
    claimed = await claimStripeEvent(event.id);
    if (!claimed) return res.status(200).json({ received: true, duplicate: true });

    if (event.type === 'checkout.session.completed') {
      const checkout = event.data.object;
      if (checkout.subscription) {
        const subscription = await stripe().subscriptions.retrieve(checkout.subscription);
        const ours = await saveSubscription(subscription);
        if (ours) await recordFunnelEvent({
          name: subscription.status === 'trialing' ? 'trial_started' : 'paid',
          plan: checkout.metadata?.tm_plan || null,
          userId: checkout.metadata?.tm_user_id || null,
          attribution: attributionFromMetadata(checkout.metadata),
        }).catch(() => {});
      }
    } else if ([
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
    ].includes(event.type)) {
      await saveSubscription(event.data.object);
    }
    return res.status(200).json({ received: true });
  } catch (error) {
    if (claimed) await releaseStripeEvent(event.id).catch(() => {});
    console.error('webhook_processing_failed', error);
    return jsonError(res, 500, 'webhook_processing_failed', 'Stripe event could not be processed.');
  }
}
