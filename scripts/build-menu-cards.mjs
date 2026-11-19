// Builds src/data/postno-menu-cards.json: title, time and a small photo for every dish in
// the Lenten menu, so the menu shows at once instead of waiting for the whole catalog.
// Run again if a menu recipe gets a new title or photo:
//   node scripts/build-menu-cards.mjs [https://tastemaster365.com]
import { readFile, writeFile } from 'node:fs/promises';

const base = process.argv[2] || 'https://tastemaster365.com';
const menu = JSON.parse(await readFile(new URL('../src/data/postno-menu.json', import.meta.url), 'utf8'));
const ids = [
  ...menu.weeks.flatMap((week) => [...week.days, week.dessert]),
  ...menu.badni.dishes,
];

const response = await fetch(`${base}/api/recipes?lang=bg`);
if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`);
const { recipes } = await response.json();
const byId = new Map(recipes.map((recipe) => [recipe.id, recipe]));

const cards = {};
for (const id of ids) {
  const recipe = byId.get(id);
  if (!recipe) throw new Error(`Menu recipe ${id} is missing from the catalog`);
  cards[id] = {
    title: recipe.translations?.bg?.title || recipe.title,
    time: recipe.time || null,
    // The cards are 96 px wide; the catalog photo is 1200 px (about 1.6 MB).
    image: recipe.image ? recipe.image.replace(/sz=w\d+/, 'sz=w300') : '',
  };
}

await writeFile(
  new URL('../src/data/postno-menu-cards.json', import.meta.url),
  `${JSON.stringify(cards, null, 2)}\n`,
);
console.log(`Wrote ${Object.keys(cards).length} menu cards`);
