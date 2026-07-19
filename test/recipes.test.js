import test from 'node:test';
import assert from 'node:assert/strict';
import { FREE_RECIPE_IDS } from '../server/config.js';

const headers = [
  'global_id', 'canonical_name_bg', 'app_primary', 'meal_type', 'time_min', 'tag',
  'description_bg', 'ingredients_bg', 'steps_bg', 'image_url', 'image_drive_id',
  'image_status', 'status', 'recipe_quality', 'is_breakfast', 'is_healthy_gut',
  'is_gluten_free', 'is_dairy_free', 'is_meat_free', 'is_plant_based',
  'country_en', 'servings', 'ingredients_qty_bg',
  'created_at', 'updated_at',
];

function row(index, id, createdAt = '') {
  return [
    id, `Рецепта ${index}`, 'Brunch', 'закуска', '20', 'тест',
    `Описание ${index}`, 'яйца; сол', 'Смеси. Изпечи.', '', '', 'ready',
    'ready', 'curated', 'TRUE', 'FALSE', 'FALSE', 'FALSE', 'TRUE', 'FALSE',
    'Bulgaria', '2', '2 яйца; 1 щипка сол', createdAt, createdAt,
  ].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',');
}

global.fetch = async () => ({
  ok: true,
  text: async () => [
    headers.join(','),
    row(1, 'LOCKED-FIRST'),
    ...FREE_RECIPE_IDS.map((id, index) => row(index + 2, id)),
    row(14, 'LOCKED-LAST'),
  ].join('\n'),
});

test('free catalog exposes full details for 12 recipes only', async () => {
  const { catalogForAccess } = await import('../server/recipes.js');
  const catalog = await catalogForAccess(false);
  assert.equal(catalog.length, 14);
  assert.equal(catalog.filter((recipe) => !recipe.locked).length, 12);
  assert.deepEqual(catalog[0].ingredients, ['2 яйца', '1 щипка сол']);
  assert.deepEqual(catalog.filter((recipe) => !recipe.locked).map((recipe) => recipe.id), FREE_RECIPE_IDS);
  assert.equal(catalog[12].locked, true);
  assert.equal('ingredients' in catalog[12], false);
  assert.equal('steps' in catalog[12], false);
});

test('premium catalog exposes every recipe', async () => {
  const { catalogForAccess } = await import('../server/recipes.js');
  const catalog = await catalogForAccess(true);
  assert.equal(catalog.length, 14);
  assert.equal(catalog.every((recipe) => recipe.locked === false), true);
  assert.equal(catalog.every((recipe) => recipe.ingredients.length > 0), true);
});

test('catalog ordering keeps newer blocks first and mixes adjacent collections', async () => {
  const { orderRecipesForCatalog } = await import('../server/recipes.js');
  const recipes = Array.from({ length: 52 }, (_, index) => ({
    id: `R-${index}`,
    collection: index % 2 ? 'Vegan' : 'Brunch',
    countryKey: index % 3 ? 'Bulgaria' : 'Italy',
    mealType: index % 2 ? 'dinner' : 'breakfast',
    createdAt: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
    _sourceOrder: index,
  }));
  const ordered = orderRecipesForCatalog(recipes);
  const firstBlockIds = new Set(recipes.slice(4).map((recipe) => recipe.id));
  assert.equal(ordered.slice(0, 48).every((recipe) => firstBlockIds.has(recipe.id)), true);
  assert.equal(ordered.slice(0, 12).every((recipe, index, list) => (
    index === 0 || recipe.collection !== list[index - 1].collection
  )), true);
});
