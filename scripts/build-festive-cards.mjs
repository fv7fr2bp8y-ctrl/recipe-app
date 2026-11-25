// Builds src/data/praznichno-menu-cards.json: title, time and a small photo for every dish of
// the Christmas and New Year menu (the Christmas Eve cards come from postno-menu-cards.json).
// Reads the catalog the way the server does (master sheet + server/data/praznichni-recepti.json):
//   node scripts/build-festive-cards.mjs
import { readFile, writeFile } from 'node:fs/promises';
import { loadMasterRecipes } from '../server/recipes.js';
import { photo, PHOTO } from '../src/photo.js';

const menu = JSON.parse(await readFile(new URL('../src/data/praznichno-menu.json', import.meta.url), 'utf8'));
const ids = menu.tabs.flatMap((tab) => (tab.dishes || []).map((dish) => dish.id));
const byId = new Map((await loadMasterRecipes()).map((recipe) => [recipe.id, recipe]));

const cards = {};
for (const id of ids) {
  const recipe = byId.get(id);
  if (!recipe) throw new Error(`Menu recipe ${id} is missing from the catalog`);
  cards[id] = {
    title: recipe.translations?.bg?.title || recipe.title,
    time: recipe.time || null,
    image: photo(recipe.image, PHOTO.thumb) || '',
  };
}

await writeFile(new URL('../src/data/praznichno-menu-cards.json', import.meta.url), `${JSON.stringify(cards, null, 2)}\n`);
console.log(`Wrote ${Object.keys(cards).length} menu cards`);
