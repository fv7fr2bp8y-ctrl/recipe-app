import { claimStripeEvent, getUserByStripeCustomer, releaseStripeEvent, saveEntitlement } from '../../server/db.js';
import { jsonError, methodNotAllowed, readRawBody } from '../../server/http.js';
import { stripe, subscriptionPeriodEnd } from '../../server/stripe.js';
import { requireEnv } from '../../server/config.js';

export const config = { api: { bodyParser: false } };

async function saveSubscription(subscription) {
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer?.id;
  const userId = subscription.metadata?.tm_user_id
    || (customerId ? (await getUserByStripeCustomer(customerId))?.id : null);
  if (!userId) throw new Error(`No TasteMaster user for Stripe subscription ${subscription.id}`);
  await saveEntitlement({
    userId,
    subscriptionId: subscription.id,
    status: subscription.status,
    currentPeriodEnd: subscriptionPeriodEnd(subscription),
  });
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
        await saveSubscription(subscription);
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
