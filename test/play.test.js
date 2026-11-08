import test from 'node:test';
import assert from 'node:assert/strict';
import { playStatus, playSubscriptionId } from '../server/play.js';

const future = new Date(Date.now() + 86400000).toISOString();
const past = new Date(Date.now() - 86400000).toISOString();
const state = (subscriptionState, expiryTime) => playStatus({ subscriptionState, lineItems: [{ expiryTime }] }).status;

test('play subscription states map to access', () => {
  assert.equal(state('SUBSCRIPTION_STATE_ACTIVE', future), 'active');
  assert.equal(state('SUBSCRIPTION_STATE_IN_GRACE_PERIOD', future), 'active');
  assert.equal(state('SUBSCRIPTION_STATE_CANCELED', future), 'active');
  assert.equal(state('SUBSCRIPTION_STATE_CANCELED', past), 'inactive');
  assert.equal(state('SUBSCRIPTION_STATE_ON_HOLD', future), 'inactive');
  assert.equal(state('SUBSCRIPTION_STATE_EXPIRED', past), 'inactive');
});

test('purchase tokens are stored hashed', () => {
  const id = playSubscriptionId('secret-token');
  assert.match(id, /^play:[0-9a-f]{64}$/);
  assert.equal(id.includes('secret-token'), false);
});
