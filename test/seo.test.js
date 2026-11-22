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

test('the Lenten menu page sends visitors to the trial and shows the Black Friday offer by Sofia date', () => {
  const regular = renderMenuPage(Date.UTC(2026, 10, 26, 21, 59)); // 26.11 23:59 Sofia
  const sale = renderMenuPage(Date.UTC(2026, 10, 27, 10, 0));
  const after = renderMenuPage(Date.UTC(2026, 10, 30, 22, 0)); // 1.12 00:00 Sofia
  assert.match(regular, /<div id="menu">/);
  assert.match(sale, /<div id="menu" class="sale">/);
  assert.match(after, /<div id="menu">/);
  assert.doesNotMatch(regular, /buy\.stripe\.com/);
  assert.match(regular, /href="\/\?menu=postno&premium=1&lang=bg">Започни 7 дни безплатно, без карта/);
  assert.match(regular, /<b>19,99 €<\/b><s>29,99 €<\/s>/);
  assert.match(regular, /id="bf" hidden/);
  assert.match(regular, /rel="canonical" href="https:\/\/tastemaster365\.com\/bg\/postno-menu"/);
  assert.match(renderSitemap([]), /<loc>https:\/\/tastemaster365\.com\/bg\/postno-menu<\/loc>/);
});

test('the Bulgarian topic pages are complete, linked and in the sitemap', async () => {
  const { TOPICS } = await import('../server/topics.js');
  const { renderTopicPage } = await import('../server/seo.js');
  const { readFileSync } = await import('node:fs');
  const vercel = readFileSync(new URL('../vercel.json', import.meta.url), 'utf8');
  const sitemap = renderSitemap([]);
  assert.equal(TOPICS.length, 10);
  for (const topic of TOPICS) {
    assert.ok(topic.title.length <= 60, topic.slug);
    assert.ok(topic.description.length <= 155, topic.slug);
    const words = topic.intro.join(' ').split(/\s+/).length;
    assert.ok(words >= 150 && words <= 250, `${topic.slug}: ${words} words`);
    assert.ok(topic.ids.length >= 12 && topic.ids.length <= 24, topic.slug);
    assert.ok(!/—/.test(JSON.stringify(topic)), topic.slug);
    assert.match(vercel, new RegExp(`[(|]${topic.slug}[|)]`));
    assert.match(sitemap, new RegExp(`<loc>https://tastemaster365\\.com/bg/${topic.slug}</loc>`));
  }
  const recipes = TOPICS[1].ids.map((id) => ({
    id, title: `Супа ${id}`, image: 'https://example.com/a.jpg', time: '30', translations: { bg: { title: `Супа ${id}` } },
  }));
  const html = renderTopicPage(recipes, 'postni-supi');
  assert.match(html, /<h1>Постни супи<\/h1>/);
  assert.match(html, /"@type":"BreadcrumbList"/);
  assert.match(html, /"@type":"ItemList","numberOfItems":19/);
  assert.match(html, /rel="canonical" href="https:\/\/tastemaster365\.com\/bg\/postni-supi"/);
  assert.match(html, /href="\/bg\/postno-menu"/);
  assert.match(html, /href="\/bg\/badni-vecher"/);
  assert.doesNotMatch(html, /<li><a href="\/bg\/postni-supi">/);
  assert.equal(renderTopicPage(recipes, 'nyama-takava'), null);
  assert.match(renderMenuPage(), /href="\/bg\/postni-supi"/);
  assert.match(renderLentenPage([], 'bg'), /href="\/bg\/postni-salati"/);
});
