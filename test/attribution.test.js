import test from 'node:test';
import assert from 'node:assert/strict';
import { attributionFromMetadata, attributionMetadata, sanitizeAttribution } from '../server/attribution.js';

test('sanitizeAttribution keeps only known short string fields', () => {
  assert.equal(sanitizeAttribution(null), null);
  assert.equal(sanitizeAttribution(['x']), null);
  assert.equal(sanitizeAttribution({ evil: 'x', gclid: 42 }), null);
  const clean = sanitizeAttribution({ gclid: ` ${'a'.repeat(300)} `, utm_source: 'google', extra: 'no' });
  assert.equal(clean.gclid.length, 200);
  assert.equal(clean.utm_source, 'google');
  assert.equal(clean.extra, undefined);
});

test('attributionMetadata builds Stripe metadata and round-trips', () => {
  const attribution = {
    gclid: 'Cj0KCQ-test',
    utm_source: 'google',
    utm_medium: 'cpc',
    utm_campaign: 'TasteMaster BG Postni test 10 EUR',
    landing: '/',
  };
  const metadata = attributionMetadata(attribution);
  assert.deepEqual(metadata, {
    tm_gclid: 'Cj0KCQ-test',
    tm_utm_source: 'google',
    tm_utm_medium: 'cpc',
    tm_utm_campaign: 'TasteMaster BG Postni test 10 EUR',
    tm_landing: '/',
  });
  for (const value of Object.values(metadata)) assert.ok(value.length <= 500);
  assert.deepEqual(attributionFromMetadata({ tm_user_id: 'u', ...metadata }), attribution);
  assert.deepEqual(attributionMetadata(null), {});
});
