import test from 'node:test';
import assert from 'node:assert/strict';

const headers = [
  'global_id', 'canonical_name_bg', 'app_primary', 'meal_type', 'time_min', 'tag',
  'description_bg', 'ingredients_bg', 'steps_bg', 'image_url', 'image_drive_id',
  'image_status', 'status', 'recipe_quality', 'is_breakfast', 'is_healthy_gut',
  'is_gluten_free', 'is_dairy_free', 'is_meat_free', 'is_plant_based',
  'country_en', 'servings', 'ingredients_qty_bg',
];

function row(index) {
  return [
    `T-${index}`, `Рецепта ${index}`, 'Brunch', 'закуска', '20', 'тест',
    `Описание ${index}`, 'яйца; сол', 'Смеси. Изпечи.', '', '', 'ready',
    'ready', 'curated', 'TRUE', 'FALSE', 'FALSE', 'FALSE', 'TRUE', 'FALSE',
    'Bulgaria', '2', '2 яйца; 1 щипка сол',
  ].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',');
}

global.fetch = async () => ({
  ok: true,
  text: async () => [headers.join(','), ...Array.from({ length: 14 }, (_, index) => row(index + 1))].join('\n'),
});

test('free catalog exposes full details for 12 recipes only', async () => {
  const { catalogForAccess } = await import('../server/recipes.js');
  const catalog = await catalogForAccess(false);
  assert.equal(catalog.length, 14);
  assert.equal(catalog.filter((recipe) => !recipe.locked).length, 12);
  assert.deepEqual(catalog[0].ingredients, ['2 яйца', '1 щипка сол']);
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
