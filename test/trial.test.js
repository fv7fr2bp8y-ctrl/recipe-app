// Trial without a card: the checkout endpoint creates the Stripe subscription directly,
// grants Premium at once and records the funnel events the Google Ads export reads.
// Stripe, the database and the session are mocked, so no real request is made.
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';

const calls = { subscriptions: [], checkouts: [], entitlements: [], events: [] };
let entitlement = null;
let retrievedSubscription = null;

const fakeStripe = {
  customers: { create: async () => ({ id: 'cus_test' }) },
  subscriptions: {
    create: async (params, options) => {
      calls.subscriptions.push({ params, options });
      return {
        id: 'sub_test123', status: 'trialing', customer: 'cus_test',
        items: { data: [{ current_period_end: 1_900_000_000 }] },
      };
    },
    retrieve: async () => retrievedSubscription,
  },
  checkout: {
    sessions: {
      create: async (params) => {
        calls.checkouts.push(params);
        return { url: 'https://checkout.stripe.com/c/pay/cs_test' };
      },
    },
  },
};

const stripeModule = await import('../server/stripe.js');
mock.module('../server/stripe.js', {
  exports: {
    stripe: () => fakeStripe,
    subscriptionPeriodEnd: stripeModule.subscriptionPeriodEnd,
    subscriptionHasCard: stripeModule.subscriptionHasCard,
  },
});
mock.module('../server/session.js', {
  exports: { getSession: async () => ({ id: 'u1', email: 'cook@example.com' }) },
});
const dbModule = await import('../server/db.js');
mock.module('../server/db.js', {
  exports: {
    entitlementIsActive: dbModule.entitlementIsActive,
    getEntitlement: async () => entitlement,
    getUser: async () => ({
      id: 'u1', email: 'cook@example.com', name: '', stripe_customer_id: 'cus_test',
      attribution: { gclid: 'Cj0Test', utm_source: 'google' },
    }),
    recordFunnelEvent: async (event) => { calls.events.push(event); },
    saveEntitlement: async (row) => { calls.entitlements.push(row); },
    setStripeCustomer: async () => {},
  },
});

const { default: checkout } = await import('../api/billing/checkout.js');
const { default: me } = await import('../api/auth/me.js');

function request(body) {
  return {
    method: 'POST',
    headers: { host: 'localhost:3000', 'x-forwarded-proto': 'http' },
    query: {},
    body,
    [Symbol.asyncIterator]: async function* iterate() { yield Buffer.from(JSON.stringify(body)); },
  };
}

function response() {
  return {
    statusCode: 200,
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; },
  };
}

test('a new account starts the trial without a card or a Stripe page', async () => {
  entitlement = null;
  const res = response();
  await checkout(request({ plan: 'yearly', consent: 'granted' }), res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.trial, true);
  assert.match(res.body.url, /\/\?checkout=success&session_id=sub_test123$/);
  assert.equal(calls.checkouts.length, 0);

  const { params, options } = calls.subscriptions.at(-1);
  assert.equal(params.trial_period_days, 7);
  assert.deepEqual(params.trial_settings, { end_behavior: { missing_payment_method: 'cancel' } });
  assert.equal(params.metadata.tm_plan, 'yearly');
  assert.equal(options.idempotencyKey, 'tm-trial-u1-yearly');

  assert.deepEqual(calls.entitlements.at(-1), {
    userId: 'u1', subscriptionId: 'sub_test123', status: 'trialing',
    currentPeriodEnd: new Date(1_900_000_000 * 1000),
  });
  const trial = calls.events.find((event) => event.name === 'trial_started');
  assert.equal(trial.ref, 'sub_test123');
  assert.equal(trial.consent, 'granted');
  assert.equal(trial.attribution.gclid, 'Cj0Test');
});

test('an account that already had a subscription pays through Stripe Checkout', async () => {
  entitlement = { status: 'canceled', stripe_subscription_id: 'sub_old', current_period_end: null };
  const before = calls.subscriptions.length;
  const res = response();
  await checkout(request({ plan: 'monthly' }), res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.url, 'https://checkout.stripe.com/c/pay/cs_test');
  assert.equal(calls.subscriptions.length, before);
  assert.equal(calls.checkouts.at(-1).subscription_data.trial_period_days, undefined);
});

test('an active trial cannot start a second one', async () => {
  entitlement = { status: 'trialing', stripe_subscription_id: 'sub_test123', current_period_end: new Date(Date.now() + 86400000) };
  const res = response();
  await checkout(request({ plan: 'monthly' }), res);
  assert.equal(res.statusCode, 409);
});

test('the session says when a trial still needs a card', async () => {
  entitlement = { status: 'trialing', stripe_subscription_id: 'sub_test123', current_period_end: new Date(Date.now() + 86400000) };
  retrievedSubscription = { status: 'trialing', customer: { invoice_settings: {} } };
  let res = response();
  await me({ method: 'GET', headers: {} }, res);
  assert.equal(res.body.premium, true);
  assert.equal(res.body.cardNeeded, true);

  retrievedSubscription = { status: 'trialing', customer: { invoice_settings: { default_payment_method: 'pm_1' } } };
  res = response();
  await me({ method: 'GET', headers: {} }, res);
  assert.equal(res.body.cardNeeded, false);
});

test('Black Friday gives only the yearly plan the first-year coupon, 27 to 30 November', async () => {
  const blackFriday = Date.UTC(2026, 10, 28, 12, 0);
  mock.timers.enable({ apis: ['Date'], now: blackFriday });
  try {
    entitlement = null;
    await checkout(request({ plan: 'yearly' }), response());
    let { params, options } = calls.subscriptions.at(-1);
    assert.deepEqual(params.discounts, [{ coupon: 'TM_BF2026_YEAR' }]);
    assert.equal(params.metadata.tm_promo, 'TM_BF2026_YEAR');
    assert.equal(options.idempotencyKey, 'tm-trial-u1-yearly-promo');

    // The monthly plan must never get the 10 € coupon (it would make 4,99 € free).
    await checkout(request({ plan: 'monthly' }), response());
    ({ params } = calls.subscriptions.at(-1));
    assert.equal(params.discounts, undefined);

    entitlement = { status: 'canceled', stripe_subscription_id: 'sub_old', current_period_end: null };
    await checkout(request({ plan: 'yearly' }), response());
    assert.deepEqual(calls.checkouts.at(-1).discounts, [{ coupon: 'TM_BF2026_YEAR' }]);
    assert.equal(calls.checkouts.at(-1).allow_promotion_codes, undefined);
    await checkout(request({ plan: 'monthly' }), response());
    assert.equal(calls.checkouts.at(-1).discounts, undefined);

    mock.timers.setTime(Date.UTC(2026, 10, 30, 21, 59, 59)); // 30.11 23:59:59 Sofia: still on
    entitlement = null;
    await checkout(request({ plan: 'yearly' }), response());
    assert.deepEqual(calls.subscriptions.at(-1).params.discounts, [{ coupon: 'TM_BF2026_YEAR' }]);

    mock.timers.setTime(Date.UTC(2026, 10, 30, 22, 0)); // 1.12 00:00 Sofia: over
    await checkout(request({ plan: 'yearly' }), response());
    assert.equal(calls.subscriptions.at(-1).params.discounts, undefined);
  } finally {
    mock.timers.reset();
  }
});
