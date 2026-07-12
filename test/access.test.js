import test from 'node:test';
import assert from 'node:assert/strict';
import { entitlementIsActive } from '../server/db.js';

test('only active or trialing unexpired entitlements unlock Premium', () => {
  const future = new Date(Date.now() + 60_000).toISOString();
  const past = new Date(Date.now() - 60_000).toISOString();
  assert.equal(entitlementIsActive({ status: 'active', current_period_end: future }), true);
  assert.equal(entitlementIsActive({ status: 'trialing', current_period_end: future }), true);
  assert.equal(entitlementIsActive({ status: 'active', current_period_end: past }), false);
  assert.equal(entitlementIsActive({ status: 'canceled', current_period_end: future }), false);
  assert.equal(entitlementIsActive(null), false);
});
