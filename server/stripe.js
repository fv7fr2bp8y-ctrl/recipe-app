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

// True when Stripe has a way to charge this subscription after the trial: a payment
// method on the subscription itself or a default one on the customer.
// Expects the subscription with `customer` expanded.
export function subscriptionHasCard(subscription) {
  const customer = typeof subscription.customer === 'object' ? subscription.customer : null;
  return Boolean(
    subscription.default_payment_method
    || subscription.default_source
    || customer?.invoice_settings?.default_payment_method
    || customer?.default_source,
  );
}
