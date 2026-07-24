import test from 'node:test';
import assert from 'node:assert/strict';
import { isPlayLaunch } from '../src/platform.js';

test('detects the Google Play launch parameter', () => {
  assert.equal(isPlayLaunch('?platform=play'), true);
  assert.equal(isPlayLaunch('?recipe=42&platform=play'), true);
});

test('keeps the normal website in web billing mode', () => {
  assert.equal(isPlayLaunch(''), false);
  assert.equal(isPlayLaunch('?platform=web'), false);
  assert.equal(isPlayLaunch('?recipe=42'), false);
});
