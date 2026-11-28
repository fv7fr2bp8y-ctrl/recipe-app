import test from 'node:test';
import assert from 'node:assert/strict';

function setup({ search = '', referrer = '', standalone = false, stored = null } = {}) {
  const store = new Map(stored ? [['tastemaster-play-app', stored]] : []);
  globalThis.window = {
    location: { search },
    sessionStorage: { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) },
    matchMedia: () => ({ matches: standalone }),
  };
  globalThis.document = { referrer };
}

test('Google tags stay off inside the Play app and on in a browser', async () => {
  const { googleTagsAllowed, detectPlayApp } = await import('../src/platform.js');
  setup();
  assert.equal(googleTagsAllowed(), true);
  setup({ search: '?platform=play' });
  assert.equal(googleTagsAllowed(), false);
  setup({ referrer: 'android-app://eu.tastemaster365.twa/' });
  assert.equal(detectPlayApp(), true);
  setup({ stored: '1' });
  assert.equal(googleTagsAllowed(), false);
  setup({ standalone: true });
  assert.equal(detectPlayApp(), false);
  assert.equal(googleTagsAllowed(), false);
});
