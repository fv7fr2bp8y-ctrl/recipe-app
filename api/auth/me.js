import { getSession } from '../../server/session.js';
import { getEntitlement, entitlementIsActive } from '../../server/db.js';
import { jsonError, methodNotAllowed } from '../../server/http.js';
import { stripe, subscriptionHasCard } from '../../server/stripe.js';

// Trials start without a card, so during the trial the page asks Stripe whether a card
// was added since. Only trialing Stripe subscriptions pay for this extra request.
async function trialNeedsCard(entitlement) {
  if (entitlement?.status !== 'trialing') return false;
  if (!entitlement.stripe_subscription_id?.startsWith('sub_')) return false;
  try {
    const subscription = await stripe().subscriptions.retrieve(
      entitlement.stripe_subscription_id,
      { expand: ['customer'] },
    );
    return subscription.status === 'trialing' && !subscriptionHasCard(subscription);
  } catch (error) {
    console.error('trial_card_check_failed', error);
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  try {
    const user = await getSession(req);
    if (!user) return res.status(200).json({ user: null, premium: false });
    const entitlement = await getEntitlement(user.id);
    const premium = entitlementIsActive(entitlement);
    return res.status(200).json({
      user,
      premium,
      subscriptionStatus: entitlement?.status || 'inactive',
      currentPeriodEnd: entitlement?.current_period_end || null,
      cardNeeded: premium ? await trialNeedsCard(entitlement) : false,
    });
  } catch (error) {
    console.error('session_read_failed', error);
    return jsonError(res, 500, 'session_read_failed', 'Could not read the secure session.');
  }
}
