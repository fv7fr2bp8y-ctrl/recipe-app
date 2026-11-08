import test from 'node:test';
import assert from 'node:assert/strict';
import { recipeIdFromSlug, recipePath, slugify } from '../src/seo-url.js';
import { renderRecipePage, renderSitemap } from '../server/seo.js';

test('recipe paths transliterate titles and round-trip the id', () => {
  assert.equal(slugify('Шопска салата'), 'shopska-salata');
  assert.equal(slugify('Crème brûlée à l’orange'), 'creme-brulee-a-l-orange');
  const path = recipePath({ id: 'SEA-C128', title: 'Риба тон на скара' }, 'bg');
  assert.equal(path, '/bg/recipe/sea-c128-riba-ton-na-skara');
  assert.equal(recipeIdFromSlug(path.split('/').pop()), 'SEA-C128');
});

test('locked recipe pages expose only the teaser', () => {
  const locked = {
    id: 'BR-C900',
    title: 'Тест',
    image: 'https://example.com/a.jpg',
    diets: { vegetarian: true },
    teaserIngredients: ['1', '2', '3'],
    ingredientCount: 9,
    stepCount: 6,
    translations: { bg: { title: 'Тест', description: 'Описание', teaserIngredients: ['1', '2', '3'] } },
    locked: true,
  };
  const html = renderRecipePage(locked, [locked], 'bg');
  assert.match(html, /"@type":"Recipe"/);
  assert.doesNotMatch(html, /recipeInstructions|recipeIngredient/);
  assert.match(html, /\?recipe=BR-C900&amp;lang=bg/);
});

test('sitemap and canonical links use the primary domain', () => {
  const recipe = {
    id: 'BR-C901', title: 'Тест', image: 'https://example.com/a.jpg', translations: { bg: { title: 'Тест' } }, locked: true,
  };
  const urls = [...renderSitemap([recipe]).matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.equal(urls.every((url) => url.startsWith('https://tastemaster365.com/')), true);
  assert.match(renderRecipePage(recipe, [recipe], 'bg'), /rel="canonical" href="https:\/\/tastemaster365\.com\//);
});
