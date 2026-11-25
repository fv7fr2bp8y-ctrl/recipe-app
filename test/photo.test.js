import test from 'node:test';
import assert from 'node:assert/strict';
import { photo } from '../src/photo.js';

test('a Drive thumbnail becomes a JPEG of the asked width', () => {
  assert.equal(
    photo('https://drive.google.com/thumbnail?id=1Ak-oRjWe49Bio7Rd9ixhZcUl7RW8L827&sz=w1200', 600),
    'https://lh3.googleusercontent.com/d/1Ak-oRjWe49Bio7Rd9ixhZcUl7RW8L827=w600-rj',
  );
});

test('other addresses and empty values stay as they are', () => {
  assert.equal(photo('/uploads/a.jpg', 600), '/uploads/a.jpg');
  assert.equal(photo('', 600), '');
  assert.equal(photo(undefined, 600), undefined);
});

test('photos stored in the site get their small copies', () => {
  assert.equal(photo('/praznichno-menu/sarmi.jpg', 300), '/praznichno-menu/w300/sarmi.jpg');
  assert.equal(photo('/praznichno-menu/sarmi.jpg', 600), '/praznichno-menu/w600/sarmi.jpg');
  assert.equal(photo('/praznichno-menu/sarmi.jpg', 1200), '/praznichno-menu/sarmi.jpg');
});
