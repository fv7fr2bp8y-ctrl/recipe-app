import { catalogForAccess } from './recipes.js';
import { getMessages, localizeRecipe } from '../src/i18n.js';
import {
  LENTEN_LANGUAGES, LENTEN_PATHS, SEO_LANGUAGES, hubPath, recipePath,
} from '../src/seo-url.js';

export const SITE = 'https://tastemaster365.com';

const LOCALES = { bg: 'bg_BG', en: 'en_GB', de: 'de_DE', es: 'es_ES', fr: 'fr_FR', ru: 'ru_RU' };
const MEAL_TYPES = {
  закуска: { bg: 'Закуска', en: 'Breakfast', de: 'Frühstück', es: 'Desayuno', fr: 'Petit-déjeuner', ru: 'Завтрак' },
  вечеря: { bg: 'Вечеря', en: 'Dinner', de: 'Abendessen', es: 'Cena', fr: 'Dîner', ru: 'Ужин' },
  обяд: { bg: 'Обяд', en: 'Lunch', de: 'Mittagessen', es: 'Almuerzo', fr: 'Déjeuner', ru: 'Обед' },
  предястие: { bg: 'Предястие', en: 'Appetizer', de: 'Vorspeise', es: 'Entrante', fr: 'Entrée', ru: 'Закуска' },
  салата: { bg: 'Салата', en: 'Salad', de: 'Salat', es: 'Ensalada', fr: 'Salade', ru: 'Салат' },
  десерт: { bg: 'Десерт', en: 'Dessert', de: 'Dessert', es: 'Postre', fr: 'Dessert', ru: 'Десерт' },
  основно: { bg: 'Основно ястие', en: 'Main course', de: 'Hauptgericht', es: 'Plato principal', fr: 'Plat principal', ru: 'Основное блюдо' },
  брънч: { bg: 'Брънч', en: 'Brunch', de: 'Brunch', es: 'Brunch', fr: 'Brunch', ru: 'Бранч' },
  супа: { bg: 'Супа', en: 'Soup', de: 'Suppe', es: 'Sopa', fr: 'Soupe', ru: 'Суп' },
  снак: { bg: 'Снак', en: 'Snack', de: 'Snack', es: 'Aperitivo', fr: 'En-cas', ru: 'Перекус' },
};

const SCHEMA_DIETS = {
  glutenFree: 'https://schema.org/GlutenFreeDiet',
  vegetarian: 'https://schema.org/VegetarianDiet',
  plantBased: 'https://schema.org/VeganDiet',
  dairyFree: 'https://schema.org/LowLactoseDiet',
};
const DIET_LABEL_KEYS = { glutenFree: 'glutenFree', dairyFree: 'dairyFree', vegetarian: 'vegetarian', plantBased: 'vegan', healthyGut: 'healthyGut' };

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]
));
const fill = (template, values) => template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');
const jsonLd = (data) => JSON.stringify(data).replace(/</g, '\\u003c');
const trimText = (text, max) => {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1).replace(/\s+\S*$/, '')}…` : clean;
};

export async function publicCatalog() {
  const recipes = await catalogForAccess(false);
  return recipes.filter((recipe) => recipe.image);
}

export function findRecipe(recipes, id) {
  return recipes.find((recipe) => recipe.id.toUpperCase() === id) || null;
}

function alternates(pathFor, languages = SEO_LANGUAGES) {
  return [
    ...languages.map((language) => `<link rel="alternate" hreflang="${language}" href="${SITE}${esc(pathFor(language))}" />`),
    `<link rel="alternate" hreflang="x-default" href="${SITE}${esc(pathFor('en'))}" />`,
  ].join('\n    ');
}

// Same rules as src/attribution.js: remember the ad click / UTM tags of the first visit
// so they survive the jump from a recipe page into the app.
// The app's Google tag only sees a click id that is in its own URL, so links from these
// pages into the app carry the stored gclid/gbraid/wbraid along.
const APP_LINK_SCRIPT = "document.addEventListener('DOMContentLoaded',function(){try{var a=JSON.parse(localStorage.getItem('tm_attribution')||'null');if(!a)return;var q=['gclid','gbraid','wbraid'].filter(function(k){return a[k];}).map(function(k){return k+'='+encodeURIComponent(a[k]);}).join('&');if(!q)return;document.querySelectorAll('a[href^=\"/?\"]').forEach(function(l){l.setAttribute('href',l.getAttribute('href')+'&'+q);});}catch(e){}});";
const ATTRIBUTION_SCRIPT = "(function(){try{var p=new URLSearchParams(location.search),k='tm_attribution',f=['gclid','gbraid','wbraid','utm_source','utm_medium','utm_campaign'],o={},n=0;f.forEach(function(x){var v=p.get(x);if(v){o[x]=v.slice(0,200);n++;}});if(!n)return;var s=localStorage.getItem(k);if(s&&!o.gclid&&!o.gbraid&&!o.wbraid)return;o.landing=location.pathname.slice(0,200);o.at=new Date().toISOString();localStorage.setItem(k,JSON.stringify(o));}catch(e){}})();";

function layout({
  language, title, description, canonical, image, ogType = 'website', pathFor, languages = SEO_LANGUAGES, structuredData, body, extraStyle = '',
}) {
  const messages = getMessages(language);
  return `<!doctype html>
<html lang="${language}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <link rel="canonical" href="${SITE}${esc(canonical)}" />
    ${alternates(pathFor, languages)}
    <meta property="og:type" content="${ogType}" />
    <meta property="og:site_name" content="TasteMaster365" />
    <meta property="og:locale" content="${LOCALES[language]}" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:url" content="${SITE}${esc(canonical)}" />
    <meta property="og:image" content="${esc(image || `${SITE}/tastemaster-logo.png`)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-tastemaster-32.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon-tastemaster.png" />
    <script>${ATTRIBUTION_SCRIPT}${APP_LINK_SCRIPT}</script>
    <meta name="theme-color" content="#169f9e" />
    ${structuredData ? `<script type="application/ld+json">${jsonLd(structuredData)}</script>` : ''}
    <style>
      :root { --bg: #fbf7f0; --card: #fffdf9; --ink: #1c1917; --muted: #78716c; --line: #eadfce; --accent: #ea580c; --accent-dark: #c2410c; --green: #047857; }
      * { box-sizing: border-box; }
      body { margin: 0; background: var(--bg); color: var(--ink); font: 16px/1.6 system-ui, -apple-system, "Segoe UI", sans-serif; }
      a { color: inherit; }
      .wrap { max-width: 860px; margin: 0 auto; padding: 0 16px; }
      header { border-bottom: 1px solid var(--line); background: var(--card); }
      header .wrap { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 64px; }
      .brand { display: flex; align-items: center; gap: 10px; text-decoration: none; font: 700 20px Georgia, serif; }
      .brand img { width: 36px; height: 36px; }
      .nav { font-size: 14px; color: var(--muted); }
      h1 { font: 700 clamp(28px, 5vw, 40px)/1.15 Georgia, serif; margin: 28px 0 12px; }
      h2 { font: 700 22px Georgia, serif; margin: 32px 0 12px; }
      .hero { width: 100%; aspect-ratio: 16 / 9; max-height: 460px; object-fit: cover; display: block; margin-top: 8px; background: var(--line); }
      .lead { font-size: 18px; color: #44403c; margin: 0; }
      .meta { display: flex; flex-wrap: wrap; gap: 8px 18px; margin: 16px 0; color: var(--muted); font-size: 14px; }
      .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
      .chip { background: #ecfdf5; color: var(--green); border-radius: 999px; padding: 2px 10px; font-size: 13px; }
      ul.ing { padding-left: 20px; } ul.ing li { margin: 4px 0; }
      ol.steps { padding-left: 22px; } ol.steps li { margin: 10px 0; }
      .box { border: 1px solid #fed7aa; background: var(--card); padding: 18px 20px; margin: 24px 0; }
      .label { font-size: 12px; letter-spacing: .16em; text-transform: uppercase; color: var(--accent); font-weight: 600; }
      .more { color: var(--accent-dark); font-weight: 600; font-size: 14px; }
      .cta { display: inline-block; margin-top: 12px; background: var(--accent); color: #fff; text-decoration: none; padding: 12px 22px; font-weight: 600; }
      .cta:hover { background: var(--accent-dark); }
      .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 14px; }
      .card { background: var(--card); text-decoration: none; border: 1px solid var(--line); }
      .card img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; display: block; background: var(--line); }
      .card span { display: block; padding: 8px 10px 12px; font-size: 14px; line-height: 1.35; }
      .country { margin: 24px 0 6px; font: 700 18px Georgia, serif; }
      .list { columns: 2 260px; margin: 0; padding-left: 18px; } .list li { margin: 3px 0; break-inside: avoid; }
      .badge { font-size: 11px; color: var(--accent); margin-left: 4px; }
      footer { margin-top: 48px; border-top: 1px solid var(--line); padding: 24px 0 40px; color: var(--muted); font-size: 13px; }
      footer .langs { display: flex; flex-wrap: wrap; gap: 6px 14px; margin-bottom: 10px; }${extraStyle}
    </style>
  </head>
  <body>
    <header><div class="wrap">
      <a class="brand" href="/?lang=${language}"><img src="/tastemaster-mark.svg" alt="" width="36" height="36" />TasteMaster365</a>
      <a class="nav" href="${hubPath(language)}">${esc(messages.allRecipes)}</a>
    </div></header>
    <main class="wrap">
${body}
    </main>
    <footer><div class="wrap">
      <nav class="langs" aria-label="${esc(messages.language)}">${languages.map((code) => `<a href="${esc(pathFor(code))}" hreflang="${code}" lang="${code}">${code.toUpperCase()}</a>`).join('')}</nav>
      ${esc(messages.rights)}
    </div></footer>
  </body>
</html>`;
}

function relatedRecipes(recipe, recipes) {
  const others = recipes.filter((item) => item.id !== recipe.id);
  const sameCountry = others.filter((item) => item.countryKey === recipe.countryKey);
  const sameCollection = others.filter((item) => item.collection === recipe.collection && item.countryKey !== recipe.countryKey);
  const start = Math.abs([...recipe.id].reduce((sum, char) => sum + char.charCodeAt(0), 0)) % Math.max(sameCollection.length, 1);
  return [...sameCountry.slice(0, 3), ...sameCollection.slice(start), ...sameCollection.slice(0, start)].slice(0, 6);
}

export function renderRecipePage(source, recipes, language) {
  const messages = getMessages(language);
  const recipe = localizeRecipe(source, language);
  const canonical = recipePath(recipe, language);
  const description = trimText(recipe.description || recipe.title, 160);
  const diets = Object.entries(source.diets || {}).filter(([, on]) => on).map(([key]) => key);
  const dietChips = diets.filter((key) => DIET_LABEL_KEYS[key]).map((key) => `<span class="chip">${esc(messages[DIET_LABEL_KEYS[key]])}</span>`).join('');
  const minutes = Number(recipe.time) || null;
  const appLink = `/?recipe=${encodeURIComponent(recipe.id)}&lang=${language}`;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.title,
    description,
    image: [recipe.image],
    inLanguage: language,
    author: { '@type': 'Organization', name: 'TasteMaster365', url: SITE },
    publisher: { '@type': 'Organization', name: 'TasteMaster365', logo: { '@type': 'ImageObject', url: `${SITE}/tastemaster-logo.png` } },
    recipeCategory: MEAL_TYPES[String(source.mealType || '').toLowerCase()]?.[language],
    recipeCuisine: recipe.country || undefined,
    keywords: recipe.tag || undefined,
    totalTime: minutes ? `PT${minutes}M` : undefined,
    recipeYield: recipe.servings ? String(recipe.servings) : undefined,
    url: `${SITE}${canonical}`,
  };
  const schemaDiets = diets.map((key) => SCHEMA_DIETS[key]).filter(Boolean);
  if (schemaDiets.length) structuredData.suitableForDiet = schemaDiets;
  if (!recipe.locked) {
    structuredData.recipeIngredient = recipe.ingredients;
    structuredData.recipeInstructions = (recipe.steps || []).map((text) => ({ '@type': 'HowToStep', text }));
  }

  const content = recipe.locked
    ? `      <section class="box">
        <div class="label">Premium</div>
        <h2 style="margin-top:8px">${esc(messages.ingredients)}</h2>
        <ul class="ing">${(recipe.teaserIngredients || []).map((item) => `<li>${esc(item)}</li>`).join('')}</ul>
        <p class="more">${esc(fill(messages.teaserMore, {
    ingredients: Math.max((recipe.ingredientCount || 0) - (recipe.teaserIngredients || []).length, 0),
    steps: recipe.stepCount || 0,
  }))}</p>
        <a class="cta" href="${esc(appLink)}">${esc(messages.unlockFull)}</a>
      </section>`
    : `      <h2>${esc(messages.ingredients)}</h2>
      <ul class="ing">${(recipe.ingredients || []).map((item) => `<li>${esc(item)}</li>`).join('')}</ul>
      <h2>${esc(messages.steps)}</h2>
      <ol class="steps">${(recipe.steps || []).map((step) => `<li>${esc(step)}</li>`).join('')}</ol>
      <a class="cta" href="${esc(appLink)}">${esc(messages.openInApp)}</a>`;

  const related = relatedRecipes(source, recipes).map((item) => localizeRecipe(item, language));
  const body = `      <article>
      <h1>${esc(recipe.title)}</h1>
      <p class="lead">${esc(recipe.description)}</p>
      <div class="meta">
        ${minutes ? `<span>${minutes} ${esc(messages.minutes)}</span>` : ''}
        ${recipe.servings ? `<span>${esc(recipe.servings)} ${esc(messages.servings)}</span>` : ''}
        ${recipe.difficulty ? `<span>${esc(recipe.difficulty)}</span>` : ''}
        ${recipe.country ? `<span>${esc(recipe.country)}</span>` : ''}
      </div>
      ${dietChips ? `<div class="chips">${dietChips}</div>` : ''}
      <img class="hero" src="${esc(recipe.image)}" alt="${esc(recipe.title)}" width="1200" height="675" />
${content}
      </article>
      ${related.length ? `<h2>${esc(messages.relatedRecipes)}</h2>
      <div class="grid">${related.map((item) => `<a class="card" href="${esc(recipePath(item, language))}"><img src="${esc(item.image)}" alt="" loading="lazy" width="400" height="300" /><span>${esc(item.title)}</span></a>`).join('')}</div>` : ''}`;

  return layout({
    language,
    title: `${recipe.title} · TasteMaster365`,
    description,
    canonical,
    image: recipe.image,
    ogType: 'article',
    pathFor: (code) => recipePath(localizeRecipe(source, code), code),
    structuredData,
    body,
  });
}

export function renderHubPage(recipes, language) {
  const messages = getMessages(language);
  const localized = recipes.map((recipe) => localizeRecipe(recipe, language));
  const byCountry = new Map();
  for (const recipe of localized) {
    const key = recipe.country || '·';
    if (!byCountry.has(key)) byCountry.set(key, []);
    byCountry.get(key).push(recipe);
  }
  const countries = [...byCountry.keys()].sort((a, b) => a.localeCompare(b, language));
  const intro = fill(messages.hubCopy, { count: localized.length, countries: countries.length });
  const body = `      <h1>${esc(messages.allRecipes)}</h1>
      <p class="lead">${esc(intro)}</p>
      <a class="cta" href="/?lang=${language}">${esc(messages.openInApp)}</a>
${countries.map((country) => `      <h2 class="country">${esc(country)}</h2>
      <ul class="list">${byCountry.get(country)
    .sort((a, b) => a.title.localeCompare(b.title, language))
    .map((recipe) => `<li><a href="${esc(recipePath(recipe, language))}">${esc(recipe.title)}</a>${recipe.locked ? '' : '<span class="badge">●</span>'}</li>`)
    .join('')}</ul>`).join('\n')}`;

  return layout({
    language,
    title: `${messages.allRecipes} · TasteMaster365`,
    description: trimText(intro, 160),
    canonical: hubPath(language),
    pathFor: hubPath,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: messages.allRecipes,
      inLanguage: language,
      url: `${SITE}${hubPath(language)}`,
    },
    body,
  });
}

// Picked for the Christmas fast, best photos first; the rest of the plant-based
// catalogue follows them.
export const LENTEN_PICKS = [
  'PB-C140', 'PB-C128', 'PB-C088', 'PB-C003', 'PB-C045', 'PB-C096',
  'PB-C115', 'FF-C012', 'PB-C122', 'PB-C104', 'PB-C041', 'FF-C066',
];
// The most attractive photos lead the full list (picked by eye, 15.11.2026).
const LENTEN_PHOTO_FIRST = [
  'PB-C106', 'PB-C132', 'PB-C116', 'PB-C138', 'PB-C111', 'PB-C126', 'PB-C143', 'PB-C133',
  'PB-C130', 'PB-C121', 'PB-C095', 'PB-C090', 'PB-C084', 'PB-C086', 'PB-C060', 'PB-C093',
  'PB-C102', 'PB-C047', 'PB-C141', 'PB-C136', 'PB-C147', 'PB-C127', 'PB-C113', 'PB-C145',
  'FF-C004', 'BR-C002', 'FF-C003', 'PB-C125', 'PB-C110', 'PB-C103', 'PB-C071', 'PB-C073',
  'FF-C068', 'FF-C035', 'BR-C047', 'BR-C020', 'BR-C022', 'FF-C010', 'FF-C040', 'FF-C054',
  'PB-C085', 'PB-C038', 'PB-C065', 'PB-C058', 'PB-C119', 'PB-C112',
];

const LENTEN_COPY = {
  bg: {
    title: 'Постни рецепти за Коледните пости',
    description: '{count} постни рецепти без месо, мляко и яйца: сарми, пълнени чушки, боб, леща и десерти. За Коледните пости от 15 ноември до 24 декември.',
    lead: 'Коледните пости са от 15 ноември до 24 декември. Тук са всички наши {count} постни рецепти без месо, мляко и яйца, от българската и световната кухня. Започни с подбраните за сезона.',
    picks: 'Подбрани за поста',
    all: 'Всички постни рецепти',
    filterAll: 'Всички',
    filterLabel: 'Вид ястие',
    free: 'Безплатна',
    locked: 'Premium · 7 дни безплатно',
    boxTitle: '7 дни безплатно за всички рецепти',
    boxCopy: '{free} от рецептите тук са безплатни. Останалите са в Premium. С нов профил пробваш 7 дни безплатно и ако прекратиш преди края, не плащаш нищо.',
  },
  en: {
    title: 'Lenten recipes for the Nativity Fast',
    description: '{count} plant-based Lenten recipes with no meat, dairy or eggs: stuffed vegetables, beans, lentils and desserts for the Nativity Fast.',
    lead: 'The Nativity Fast runs from 15 November to 24 December. Here are all {count} of our Lenten recipes with no meat, dairy or eggs, from cuisines around the world. Start with our picks for the season.',
    picks: 'Our picks for the fast',
    all: 'All Lenten recipes',
    filterAll: 'All',
    filterLabel: 'Dish type',
    free: 'Free',
    locked: 'Premium · 7 days free',
    boxTitle: '7 days free for every recipe',
    boxCopy: '{free} of the recipes here are free. The rest are in Premium. New accounts get 7 days free, and if you cancel before it ends you pay nothing.',
  },
};

const LENTEN_STYLE = `
      .filters { display: flex; flex-wrap: wrap; gap: 8px; margin: 4px 0 16px; }
      .filters button { font: inherit; font-size: 14px; border: 1px solid var(--line); background: var(--card); color: var(--ink); border-radius: 999px; padding: 4px 12px; cursor: pointer; }
      .filters button[aria-pressed="true"] { background: var(--accent); border-color: var(--accent); color: #fff; }
      .card { position: relative; }
      .card .tag { position: absolute; top: 8px; left: 8px; padding: 2px 8px; font-size: 12px; font-style: normal; font-weight: 600; background: var(--accent); color: #fff; }
      .card .tag.free { background: var(--green); }
      .card[hidden] { display: none; }`;

const LENTEN_FILTER_SCRIPT = `<script>
document.querySelectorAll('.filters button').forEach(function (button) {
  button.addEventListener('click', function () {
    var meal = button.getAttribute('data-meal');
    document.querySelectorAll('.filters button').forEach(function (b) { b.setAttribute('aria-pressed', String(b === button)); });
    document.querySelectorAll('#all .card').forEach(function (card) { card.hidden = Boolean(meal) && card.getAttribute('data-meal') !== meal; });
  });
});
</script>`;

export function renderLentenPage(recipes, language) {
  const messages = getMessages(language);
  const copy = LENTEN_COPY[language];
  const lenten = recipes.filter((recipe) => recipe.diets?.plantBased && recipe.availableLanguages?.includes(language));
  const byIds = (ids) => ids.map((id) => lenten.find((recipe) => recipe.id.toUpperCase() === id)).filter(Boolean);
  const picks = byIds(LENTEN_PICKS);
  const lead = [...picks, ...byIds(LENTEN_PHOTO_FIRST)];
  const leadIds = new Set(lead.map((recipe) => recipe.id));
  const ordered = [...lead, ...lenten.filter((recipe) => !leadIds.has(recipe.id))];
  const count = lenten.length;
  const free = lenten.filter((recipe) => !recipe.locked).length;
  const mealKey = (recipe) => String(recipe.mealType || '').toLowerCase();
  const mealCounts = new Map();
  for (const recipe of lenten) {
    const key = mealKey(recipe);
    if (MEAL_TYPES[key]) mealCounts.set(key, (mealCounts.get(key) || 0) + 1);
  }
  const meals = [...mealCounts.entries()].sort((a, b) => b[1] - a[1]);

  const card = (source) => {
    const recipe = localizeRecipe(source, language);
    const tag = recipe.locked
      ? `<em class="tag">${esc(copy.locked)}</em>`
      : `<em class="tag free">${esc(copy.free)}</em>`;
    return `<a class="card" data-meal="${esc(mealKey(source))}" href="${esc(recipePath(recipe, language))}">${tag}<img src="${esc(recipe.image)}" alt="" loading="lazy" width="400" height="300" /><span>${esc(recipe.title)}</span></a>`;
  };
  const premiumLink = `/?premium=1&lang=${language}`;
  const body = `      <h1>${esc(copy.title)}</h1>
      <p class="lead">${esc(fill(copy.lead, { count }))}</p>
      <section class="box">
        <div class="label">Premium</div>
        <h2 style="margin-top:8px">${esc(copy.boxTitle)}</h2>
        <p style="margin:0">${esc(fill(copy.boxCopy, { free }))}</p>
        <a class="cta" href="${esc(premiumLink)}">${esc(messages.trialCta)}</a>
      </section>
      <h2>${esc(copy.picks)}</h2>
      <div class="grid">${picks.map(card).join('')}</div>
      <h2>${esc(copy.all)} (${count})</h2>
      <div class="filters" role="group" aria-label="${esc(copy.filterLabel)}"><button type="button" data-meal="" aria-pressed="true">${esc(copy.filterAll)} · ${count}</button>${meals.map(([key, total]) => `<button type="button" data-meal="${esc(key)}" aria-pressed="false">${esc(MEAL_TYPES[key][language])} · ${total}</button>`).join('')}</div>
      <div class="grid" id="all">${ordered.map(card).join('')}</div>
      <a class="cta" href="${esc(premiumLink)}">${esc(messages.trialCta)}</a>
${LENTEN_FILTER_SCRIPT}`;

  return layout({
    language,
    title: `${copy.title} · TasteMaster365`,
    description: trimText(fill(copy.description, { count }), 160),
    canonical: LENTEN_PATHS[language],
    pathFor: (code) => LENTEN_PATHS[code],
    languages: LENTEN_LANGUAGES,
    extraStyle: LENTEN_STYLE,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: copy.title,
      inLanguage: language,
      url: `${SITE}${LENTEN_PATHS[language]}`,
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: picks.length,
        itemListElement: picks.map((recipe, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: `${SITE}${recipePath(localizeRecipe(recipe, language), language)}`,
        })),
      },
    },
    body,
  });
}

export function renderSitemap(recipes) {
  const urls = [`${SITE}/`, ...LENTEN_LANGUAGES.map((language) => `${SITE}${LENTEN_PATHS[language]}`)];
  for (const language of SEO_LANGUAGES) {
    urls.push(`${SITE}${hubPath(language)}`);
    for (const recipe of recipes) urls.push(`${SITE}${recipePath(localizeRecipe(recipe, language), language)}`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${esc(url)}</loc></url>`).join('\n')}
</urlset>
`;
}

export function renderNotFound(language) {
  const messages = getMessages(language);
  return layout({
    language,
    title: `${messages.noResults} · TasteMaster365`,
    description: messages.noResults,
    canonical: hubPath(language),
    pathFor: hubPath,
    body: `      <h1>${esc(messages.noResults)}</h1>
      <a class="cta" href="${hubPath(language)}">${esc(messages.allRecipes)}</a>`,
  });
}
