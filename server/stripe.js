import Stripe from 'stripe';
import { requireEnv } from './config.js';

let stripeClient;

export function stripe() {
  if (!stripeClient) stripeClient = new Stripe(requireEnv('STRIPE_SECRET_KEY'));
  return stripeClient;
}

export function subscriptionPeriodEnd(subscription) {
  const direct = subscription.current_period_end;
  const itemEnds = subscription.items?.data
    ?.map((item) => item.current_period_end)
    .filter(Boolean) || [];
  const seconds = direct || Math.max(0, ...itemEnds);
  return seconds ? new Date(seconds * 1000) : null;
}
