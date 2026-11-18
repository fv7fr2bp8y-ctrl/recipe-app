import test from 'node:test';
import assert from 'node:assert/strict';
import { recipeIdFromSlug, recipePath, slugify } from '../src/seo-url.js';
import {
  renderLentenPage, renderMenuPage, renderRecipePage, renderSitemap,
} from '../server/seo.js';

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

test('recipe pages declare a localized category', () => {
  const recipe = {
    id: 'BR-C902', title: 'Тест', image: 'https://example.com/a.jpg', mealType: 'вечеря', translations: { en: { title: 'Test' } }, locked: true,
  };
  assert.match(renderRecipePage(recipe, [recipe], 'en'), /"recipeCategory":"Dinner"/);
});

test('lenten page puts the picks first, lists only plant-based recipes and marks the trial', () => {
  const make = (id, plantBased, locked, mealType = 'обяд') => ({
    id, title: id, image: 'https://example.com/a.jpg', mealType, diets: { plantBased }, availableLanguages: ['bg', 'en'],
    translations: { bg: { title: `Рецепта ${id}` } }, locked,
  });
  const recipes = [make('PB-C900', true, false), make('BR-C001', false, false), make('PB-C128', true, true, 'вечеря')];
  const html = renderLentenPage(recipes, 'bg');
  assert.match(html, /<h1>Постни рецепти за Коледните пости<\/h1>/);
  assert.match(html, /rel="canonical" href="https:\/\/tastemaster365\.com\/bg\/postni-recepti"/);
  assert.match(html, /hreflang="en" href="https:\/\/tastemaster365\.com\/en\/lenten-recipes"/);
  assert.doesNotMatch(html, /hreflang="de"/);
  assert.doesNotMatch(html, /BR-C001/i);
  assert.match(html, /Всички постни рецепти \(2\)/);
  assert.match(html, /Premium · 7 дни безплатно/);
  assert.match(html, /\?premium=1&amp;lang=bg/);
  const allGrid = html.split('id="all"')[1];
  assert.ok(allGrid.indexOf('pb-c128') < allGrid.indexOf('pb-c900'));
  const urls = [...renderSitemap(recipes).matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.ok(urls.includes('https://tastemaster365.com/bg/postni-recepti'));
  assert.ok(urls.includes('https://tastemaster365.com/en/lenten-recipes'));
});

test('the PDF menu page switches to the Black Friday price by Sofia date', () => {
  const regular = renderMenuPage(Date.UTC(2026, 10, 26, 21, 59)); // 26.11 23:59 Sofia
  const sale = renderMenuPage(Date.UTC(2026, 10, 27, 10, 0));
  const after = renderMenuPage(Date.UTC(2026, 10, 30, 22, 0)); // 1.12 00:00 Sofia
  assert.match(regular, /<div id="menu">/);
  assert.match(sale, /<div id="menu" class="sale">/);
  assert.match(after, /<div id="menu">/);
  assert.match(regular, /href="https:\/\/buy\.stripe\.com\/3cI8wP6p41ai2yn67M0RG01">Купи за 4,99 €/);
  assert.match(regular, /href="https:\/\/buy\.stripe\.com\/9B68wP9Bg06e1uj1Rw0RG02">Купи за 1,99 € вместо 4,99 €/);
  assert.match(sale, /"price":"1.99"/);
  assert.match(regular, /rel="canonical" href="https:\/\/tastemaster365\.com\/bg\/postno-menu"/);
  assert.match(renderSitemap([]), /<loc>https:\/\/tastemaster365\.com\/bg\/postno-menu<\/loc>/);
});
