import test from 'node:test';
import assert from 'node:assert/strict';
import { adsTime, buildAdsCsv, eventValue } from '../server/conversions.js';

const NAMES = { paid: 'TasteMaster Purchase', trial_started: '' };

test('adsTime uses an explicit UTC offset', () => {
  assert.equal(adsTime('2026-11-12T14:03:09.123Z'), '2026-11-12 14:03:09+0000');
});

test('eventValue prefers the amount Stripe charged, then the plan price', () => {
  assert.equal(eventValue({ value_cents: 250, plan: 'monthly' }), 2.5);
  assert.equal(eventValue({ value_cents: null, plan: 'yearly' }), 29.99);
  assert.equal(eventValue({ plan: 'unknown' }), 0);
});

test('buildAdsCsv exports consented paid clicks only', () => {
  const at = '2026-11-12T10:00:00Z';
  const csv = buildAdsCsv([
    { name: 'paid', plan: 'monthly', gclid: 'Cj0-ok', value_cents: 499, currency: 'EUR', consent: 'granted', created_at: at },
    { name: 'paid', plan: 'monthly', gclid: 'Cj0-denied', value_cents: 499, consent: 'denied', created_at: at },
    { name: 'paid', plan: 'monthly', gclid: 'Cj0-unknown', value_cents: 499, consent: null, created_at: at },
    { name: 'paid', plan: 'yearly', gclid: null, value_cents: 2999, consent: 'granted', created_at: at },
    { name: 'trial_started', plan: 'monthly', gclid: 'Cj0-trial', value_cents: 0, consent: 'granted', created_at: at },
  ], NAMES);
  assert.equal(csv, [
    'Google Click ID,Conversion Name,Conversion Time,Conversion Value,Conversion Currency',
    'Cj0-ok,TasteMaster Purchase,2026-11-12 10:00:00+0000,4.99,EUR',
    '',
  ].join('\n'));
});

test('buildAdsCsv quotes cells with commas', () => {
  const csv = buildAdsCsv([
    { name: 'paid', plan: 'monthly', gclid: 'a,b', value_cents: 499, consent: 'granted', created_at: '2026-11-12T10:00:00Z' },
  ], { paid: 'Buy "now"' });
  assert.match(csv, /"a,b","Buy ""now""",/);
});
