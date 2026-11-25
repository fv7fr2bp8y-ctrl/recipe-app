import { catalogForAccess } from './recipes.js';
import { getMessages, localizeRecipe } from '../src/i18n.js';
import { PROMO, promoActive, promoCopy } from '../src/promo.js';
import { TOPICS, findTopic, topicPath } from './topics.js';
import { photo, PHOTO } from '../src/photo.js';
import { readFileSync } from 'node:fs';
import {
  FESTIVE_PATH, LENTEN_LANGUAGES, LENTEN_PATHS, MENU_PATH, SEO_LANGUAGES, hubPath, recipePath,
} from '../src/seo-url.js';

export const SITE = 'https://tastemaster365.com';

// Photos kept in the site (public/praznichno-menu) have a relative address.
const absolute = (url) => (url && url.startsWith('/') ? `${SITE}${url}` : url);

// A recipe page exists only in the languages the recipe is written in.
export const inLanguage = (language) => (recipe) => !recipe.availableLanguages || recipe.availableLanguages.includes(language);

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
// Remembers the ad click; a new click (not a reload of the same one) is logged as ad_landing,
// so the funnel shows how many Google Ads clicks reached the site with a click id.
const ATTRIBUTION_SCRIPT = "(function(){try{var p=new URLSearchParams(location.search),k='tm_attribution',f=['gclid','gbraid','wbraid','utm_source','utm_medium','utm_campaign'],o={},n=0;f.forEach(function(x){var v=p.get(x);if(v){o[x]=v.slice(0,200);n++;}});if(!n)return;var s=localStorage.getItem(k),c=o.gclid||o.gbraid||o.wbraid;if(s&&!c)return;if(s&&c){var t=JSON.parse(s);if((t.gclid||t.gbraid||t.wbraid)===c)return;}o.landing=location.pathname.slice(0,200);o.at=new Date().toISOString();localStorage.setItem(k,JSON.stringify(o));if(c)fetch('/api/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'ad_landing',attribution:o}),keepalive:true}).catch(function(){});}catch(e){}})();";

// The Black Friday strip: rendered hidden and shown by the visitor's clock, because the
// CDN may keep a copy made before or after the offer. promoActive(0) is true only on a
// preview deployment with PROMO_PREVIEW=1.
const PROMO_CHECK = promoActive(0) ? 'true' : `now >= ${PROMO.start} && now < ${PROMO.end}`;
const PROMO_BAR_STYLE = `
      .bf { background: #0c0a09; color: #fff; }
      .bf .wrap { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 8px 16px; padding-top: 10px; padding-bottom: 10px; text-align: center; font-size: 14px; line-height: 1.4; }
      .bf p { margin: 0; }
      .bf a { background: #ea580c; color: #fff; text-decoration: none; font-weight: 600; padding: 6px 12px; white-space: nowrap; }
      .bf a:hover { background: #c2410c; }`;

function promoBar(language) {
  const copy = promoCopy(language);
  return `    <div class="bf" id="bf" hidden><div class="wrap"><p>${esc(copy.banner)}</p><a href="/?premium=1&amp;lang=${language}">${esc(copy.bannerButton)}</a></div></div>
    <script>(function(){var now=Date.now();if(${PROMO_CHECK})document.getElementById('bf').hidden=false;})();</script>
`;
}

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
    <meta property="og:image" content="${esc(absolute(image) || `${SITE}/tastemaster-logo.png`)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-tastemaster-32.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon-tastemaster.png" />
    <script>${ATTRIBUTION_SCRIPT}${APP_LINK_SCRIPT}</script>
    <script>window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments)};</script>
    <script defer src="/_vercel/insights/script.js"></script>
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
      footer .langs { display: flex; flex-wrap: wrap; gap: 6px 14px; margin-bottom: 10px; }${PROMO_BAR_STYLE}${extraStyle}
    </style>
  </head>
  <body>
${promoBar(language)}    <header><div class="wrap">
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
    image: [absolute(recipe.image)],
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
      <img class="hero" src="${esc(photo(recipe.image, PHOTO.hero))}" alt="${esc(recipe.title)}" width="1200" height="675" />
${content}
      </article>
      ${related.length ? `<h2>${esc(messages.relatedRecipes)}</h2>
      <div class="grid">${related.map((item) => `<a class="card" href="${esc(recipePath(item, language))}"><img src="${esc(photo(item.image, PHOTO.card))}" alt="" loading="lazy" width="400" height="300" /><span>${esc(item.title)}</span></a>`).join('')}</div>` : ''}`;

  return layout({
    language,
    title: `${recipe.title} · TasteMaster365`,
    description,
    canonical,
    image: recipe.image,
    ogType: 'article',
    pathFor: (code) => recipePath(localizeRecipe(source, code), code),
    // The festive recipes exist only in Bulgarian: no alternates for languages they lack.
    languages: SEO_LANGUAGES.filter((code) => !source.availableLanguages || source.availableLanguages.includes(code)),
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
    boxTitle: '7 дни безплатно, без карта',
    boxCopy: '{free} от рецептите тук са безплатни. Останалите са в Premium. С нов профил ги отключваш за 7 дни безплатно, без карта. Ако ти харесат, добавяш карта и продължаваш.',
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
    boxTitle: '7 days free, no card',
    boxCopy: '{free} of the recipes here are free. The rest are in Premium. New accounts unlock them for 7 days free, no card needed. If you like them, add a card and keep going.',
  },
};

const LENTEN_STYLE = `
      .menu-teaser { display: flex; gap: 16px; align-items: center; text-decoration: none; background: #144547; color: #fffaf2; padding: 14px 16px; margin: 24px 0; }
      .menu-teaser img { width: 76px; height: auto; flex: none; box-shadow: 0 4px 12px rgba(0,0,0,.3); }
      .menu-teaser b { display: block; font: 700 19px Georgia, serif; }
      .menu-teaser span { font-size: 14px; color: #cfe5e3; }
      .menu-teaser em { font-style: normal; color: #fdba74; font-weight: 600; }
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
    return `<a class="card" data-meal="${esc(mealKey(source))}" href="${esc(recipePath(recipe, language))}">${tag}<img src="${esc(photo(recipe.image, PHOTO.card))}" alt="" loading="lazy" width="400" height="300" /><span>${esc(recipe.title)}</span></a>`;
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
${language === 'bg' ? FESTIVE_TEASER + MENU_TEASER : ''}${language === 'bg' ? topicLinks() : ''}      <h2>${esc(copy.picks)}</h2>
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
    extraStyle: language === 'bg' ? `${LENTEN_STYLE}${TOPIC_LINKS_STYLE}` : LENTEN_STYLE,
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
  const urls = [`${SITE}/`, `${SITE}${FESTIVE_PATH}`, `${SITE}${MENU_PATH}`, ...TOPICS.map((topic) => `${SITE}${topicPath(topic)}`), ...LENTEN_LANGUAGES.map((language) => `${SITE}${LENTEN_PATHS[language]}`)];
  for (const language of SEO_LANGUAGES) {
    urls.push(`${SITE}${hubPath(language)}`);
    for (const recipe of recipes.filter(inLanguage(language))) urls.push(`${SITE}${recipePath(localizeRecipe(recipe, language), language)}`);
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

// ---- "Постно меню до Коледа" (/bg/postno-menu): landing page for the menu inside the app ----

// The menu lives in the app (?menu=postno); the landing page sends visitors to the free trial.
const MENU_APP_LINK = '/?menu=postno&premium=1&lang=bg';
export const menuSaleOn = (now = Date.now()) => promoActive(now);

const MENU_TEASER = `      <a class="menu-teaser" href="${MENU_PATH}"><img src="/postno-menu/p-01.jpg" alt="" width="76" height="108" loading="lazy" /><div><b>Постно меню до Коледа</b><span>4 седмици вечери, списъци за пазаруване и 9 ястия за Бъдни вечер. <em>В приложението, 7 дни безплатно</em></span></div></a>
`;

const MENU_PAGES = [
  { src: '/postno-menu/p-03.jpg', alt: 'Седмица 1: седем постни вечери и десерт' },
  { src: '/postno-menu/p-04.jpg', alt: 'Списък за пазаруване за седмица 1 с количества' },
  { src: '/postno-menu/p-05.jpg', alt: 'Рецепта: кокосов дал от червена леща със спанак' },
  { src: '/postno-menu/p-43.jpg', alt: 'Бъдни вечер: девет постни ястия' },
];

const MENU_STYLE = `
      :root { --bg: #fffaf2; --card: #ffffff; --ink: #144547; --muted: #5b7476; --line: #e6dccb; --teal: #0e8182; --deep: #144547; }
      main.wrap { max-width: 980px; }
      .m-hero { display: grid; gap: 18px; align-items: center; grid-template-columns: 1fr; margin: 24px 0 8px; }
      .m-cover { width: 100%; max-width: 230px; height: auto; display: block; margin: 0 auto; box-shadow: 0 18px 40px rgba(20,69,71,.28); }
      @media (min-width: 760px) { .m-hero { grid-template-columns: 5fr 6fr; gap: 40px; } .m-cover { max-width: 380px; } }
      .m-kicker { color: var(--teal); font-size: 13px; letter-spacing: .14em; text-transform: uppercase; font-weight: 700; }
      .m-hero h1 { margin: 6px 0 10px; color: var(--deep); }
      .m-hero h1 i { color: var(--accent); }
      .m-lead { font-size: 18px; color: #2f5557; margin: 0 0 18px; }
      .m-price { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; margin: 0 0 12px; }
      .m-price b { font: 700 40px/1 Georgia, serif; color: var(--deep); }
      .m-price s { font-size: 20px; color: var(--muted); }
      .m-price small { display: block; width: 100%; font-size: 14px; color: var(--muted); }
      .m-price span { background: var(--accent); color: #fff; font-size: 13px; font-weight: 700; padding: 3px 10px; letter-spacing: .04em; }
      .m-buy { display: block; text-align: center; background: var(--accent); color: #fff; text-decoration: none; font: 700 21px/1.2 system-ui, -apple-system, "Segoe UI", sans-serif; padding: 18px 20px; border-radius: 12px; box-shadow: 0 8px 20px rgba(234,88,12,.35); }
      .m-buy:hover { background: var(--accent-dark); }
      .m-note { font-size: 14px; color: var(--muted); margin: 10px 0 0; text-align: center; }
      .m-facts { list-style: none; padding: 0; margin: 28px 0; display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
      .m-facts li { background: var(--card); border: 1px solid var(--line); border-left: 4px solid var(--teal); padding: 12px 14px; }
      .m-facts b { display: block; font: 700 20px Georgia, serif; color: var(--deep); }
      .m-pages { display: grid; gap: 14px; grid-template-columns: repeat(2, 1fr); }
      @media (min-width: 760px) { .m-pages { grid-template-columns: repeat(4, 1fr); } }
      .m-pages figure { margin: 0; }
      .m-pages img { width: 100%; height: auto; display: block; border: 1px solid var(--line); box-shadow: 0 6px 16px rgba(20,69,71,.15); background: #fff; }
      .m-pages figcaption { font-size: 13px; color: var(--muted); margin-top: 6px; line-height: 1.35; }
      .m-final { background: var(--deep); color: #fffaf2; padding: 24px 20px; margin: 36px 0 0; text-align: center; }
      .m-final h2 { color: #fffaf2; margin: 0 0 6px; }
      .m-final p { margin: 0 0 16px; color: #cfe5e3; }
      .m-final .m-buy { max-width: 420px; margin: 0 auto; }
      .m-final .m-note { color: #cfe5e3; }
      #menu.sale .only-regular, #menu:not(.sale) .only-sale { display: none; }`;

// The offer switches by date on its own: the server renders today's state and the
// page script re-checks with the visitor's clock (the CDN may hold an older copy).
const MENU_SCRIPT = `<script>
(function () {
  var m = document.getElementById('menu'), now = Date.now();
  m.classList.toggle('sale', ${PROMO_CHECK});
  m.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a.m-buy');
    if (!a) return;
    var attribution = null;
    try { attribution = JSON.parse(localStorage.getItem('tm_attribution') || 'null'); } catch (err) {}
    try {
      fetch('/api/events', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'menu_click', plan: m.classList.contains('sale') ? 'trial_promo' : 'trial', attribution: attribution }) });
    } catch (err) {}
  });
})();
</script>`;

const MENU_BUY = `<a class="m-buy" href="${MENU_APP_LINK}">Започни 7 дни безплатно, без карта</a>`;
const MENU_NOTE = '<p class="m-note">Без карта. Ако не добавиш карта, пробата просто спира.</p>';

export function renderMenuPage(now = Date.now()) {
  const sale = menuSaleOn(now);
  const body = `      <div id="menu"${sale ? ' class="sale"' : ''}>
${MENU_SCRIPT}
      <section class="m-hero">
        <img class="m-cover" src="/postno-menu/p-01.jpg" alt="Корица: Постно меню до Коледа" width="1000" height="1415" />
        <div>
          <div class="m-kicker">В приложението TasteMaster365</div>
          <h1>Постно меню <i>до Коледа</i></h1>
          <p class="m-lead">Какво да сготвиш тази вечер, решено за целия пост. Четири седмици постни вечери, готови списъци за пазаруване и трапеза за Бъдни вечер.</p>
          <div class="m-price only-regular"><b>4,99 €</b><small>на месец след 7-те безплатни дни. Или 29,99 € на година.</small></div>
          <div class="m-price only-sale"><b>19,99 €</b><s>29,99 €</s><span>ЧЕРЕН ПЕТЪК 27–30.11</span><small>за цяла година след 7-те безплатни дни, по-малко от 1,70 € на месец. После 29,99 € на година.</small></div>
          ${MENU_BUY}
          ${MENU_NOTE}
        </div>
      </section>
      <h2>Какво има вътре</h2>
      <ul class="m-facts">
        <li><b>4 седмици</b>по 7 постни вечери и един десерт всяка седмица</li>
        <li><b>Списъци за пазаруване</b>за всяка седмица, с точни количества и отметки</li>
        <li><b>9 ястия за Бъдни вечер</b>и списък за трапезата на 24 декември</li>
        <li><b>Снимка, продукти и стъпки</b>за всяка рецепта, направо в телефона</li>
        <li><b>Изцяло постно</b>без месо, мляко, яйца и риба</li>
        <li><b>PDF за печат</b>с всички рецепти, за абонатите</li>
      </ul>
      <h2>Разгледай страниците</h2>
      <div class="m-pages">${MENU_PAGES.map((page) => `<figure><img src="${page.src}" alt="${esc(page.alt)}" width="1000" height="1415" loading="lazy" /><figcaption>${esc(page.alt)}</figcaption></figure>`).join('')}</div>
${topicLinks('Още постни теми')}${FESTIVE_TEASER}      <section class="m-final">
        <h2>Постът е до 24 декември</h2>
        <p>Отвори менюто днес и пазарувай веднъж седмично. Освен него получаваш и всички рецепти в приложението.</p>
        ${MENU_BUY}
        ${MENU_NOTE}
      </section>
      </div>`;

  return layout({
    language: 'bg',
    title: 'Постно меню до Коледа · TasteMaster365',
    description: '4 седмици постни вечери и десерти, списъци за пазаруване с количества и 9 ястия за Бъдни вечер. В приложението TasteMaster365, 7 дни безплатно, без карта.',
    canonical: MENU_PATH,
    image: `${SITE}/postno-menu/og.jpg`,
    pathFor: () => MENU_PATH,
    languages: ['bg'],
    extraStyle: `${MENU_STYLE}${TOPIC_LINKS_STYLE}`,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Постно меню до Коледа',
      description: '4 седмици постни вечери и десерти, списъци за пазаруване и 9 ястия за Бъдни вечер в приложението TasteMaster365.',
      inLanguage: 'bg',
      image: `${SITE}/postno-menu/p-01.jpg`,
      url: `${SITE}${MENU_PATH}`,
    },
    body,
  });
}

// ---- "Празнично меню" (/bg/praznichno-menu): Christmas Eve, Christmas and New Year ----

const readJson = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const FESTIVE_MENU = readJson('../src/data/praznichno-menu.json');
const LENTEN_MENU = readJson('../src/data/postno-menu.json');
const FESTIVE_APP_LINK = '/?menu=praznichno&premium=1&lang=bg';
const FESTIVE_BUY = `<a class="m-buy" href="${FESTIVE_APP_LINK}">Започни 7 дни безплатно, без карта</a>`;

// Inline styles, so the same block works on the Lenten, menu and topic pages.
export const FESTIVE_TEASER = `      <a href="${FESTIVE_PATH}" style="display:flex;gap:16px;align-items:center;text-decoration:none;background:#7f1d1d;color:#fffaf2;padding:14px 16px;margin:24px 0"><img src="/praznichno-menu/w300/banica.jpg" alt="" width="76" height="76" loading="lazy" style="width:76px;height:76px;object-fit:cover;flex:none" /><span><b style="display:block;font:700 19px Georgia,serif">Празнично меню за Коледа и Нова година</b><span style="font-size:14px;color:#fde2e2">Бъдни вечер, коледна трапеза и новогодишна вечеря с план по дни и списъци за пазаруване. <em style="font-style:normal;color:#fcd34d;font-weight:600">В приложението, 7 дни безплатно</em></span></span></a>
`;

const FESTIVE_STYLE = `
      .f-cover { width: 100%; height: auto; display: block; aspect-ratio: 3 / 2; object-fit: cover; box-shadow: 0 18px 40px rgba(127,29,29,.25); }
      .f-tab { margin: 36px 0 0; }
      .f-tab h2 { margin-bottom: 4px; }
      .f-date { color: #7f1d1d; font-size: 13px; letter-spacing: .14em; text-transform: uppercase; font-weight: 700; }
      .f-plan { list-style: none; padding: 0; margin: 16px 0 0; display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
      .f-plan li { background: var(--card); border: 1px solid var(--line); border-left: 4px solid #7f1d1d; padding: 10px 14px; font-size: 14px; }
      .f-plan b { display: block; color: #7f1d1d; font-size: 12px; letter-spacing: .12em; text-transform: uppercase; }
      .grid .card small { display: block; padding: 0 10px 10px; color: var(--muted); font-size: 12px; }`;

function festiveTabs() {
  return FESTIVE_MENU.tabs.map((tab) => (tab.fromLenten
    ? { ...tab, dishes: LENTEN_MENU.badni.dishes.map((id, index) => ({ label: `Ястие ${index + 1}`, id })) }
    : tab));
}

export function renderFestivePage(recipes) {
  const byId = new Map(recipes.map((recipe) => [recipe.id.toUpperCase(), recipe]));
  const card = ({ label, id }) => {
    const source = byId.get(id.toUpperCase());
    if (!source) return '';
    const recipe = localizeRecipe(source, 'bg');
    return `<a class="card" href="${esc(recipePath(recipe, 'bg'))}"><img src="${esc(photo(recipe.image, PHOTO.card))}" alt="" loading="lazy" width="400" height="300" /><span>${esc(recipe.title)}</span><small>${esc(label)}</small></a>`;
  };
  const sections = festiveTabs().map((tab) => `      <section class="f-tab">
        <div class="f-date">${esc(tab.date)}</div>
        <h2>${esc(tab.label)}</h2>
        <p>${esc(tab.intro)}</p>
        <div class="grid">${tab.dishes.map(card).join('')}</div>
${tab.plan ? `        <ol class="f-plan">${tab.plan.map((step) => `<li><b>${esc(step.when)}</b>${step.items.map(esc).join(' ')}</li>`).join('')}</ol>
` : ''}      </section>`).join('\n');

  const body = `      <div id="menu">
${MENU_SCRIPT}
      <section class="m-hero">
        <img class="f-cover" src="/praznichno-menu/banica.jpg" alt="Баница с късмети за Нова година" width="1200" height="800" />
        <div>
          <div class="m-kicker">В приложението TasteMaster365</div>
          <h1>Празнично меню <i>за Коледа и Нова година</i></h1>
          <p class="m-lead">Бъдни вечер, коледна трапеза и новогодишна вечеря за 6 до 8 души. Какво да сготвиш, кога да го приготвиш и какво да купиш, събрано на едно място.</p>
          <div class="m-price only-regular"><b>4,99 €</b><small>на месец след 7-те безплатни дни. Или 29,99 € на година.</small></div>
          <div class="m-price only-sale"><b>19,99 €</b><s>29,99 €</s><span>ЧЕРЕН ПЕТЪК 27–30.11</span><small>за цяла година след 7-те безплатни дни, по-малко от 1,70 € на месец. После 29,99 € на година.</small></div>
          ${FESTIVE_BUY}
          ${MENU_NOTE}
        </div>
      </section>
      <ul class="m-facts">
        <li><b>3 празнични трапези</b>Бъдни вечер, Коледа и Нова година</li>
        <li><b>План по дни</b>какво се прави предния ден и какво в деня на празника</li>
        <li><b>Списъци за пазаруване</b>с количества за 8 души и отметки в телефона</li>
        <li><b>Баница с късмети</b>сарми, пуйка с кисело зеле, руска салата и „Снежанка“</li>
      </ul>
${sections}
      <section class="m-final">
        <h2>Празниците идват бързо</h2>
        <p>Отвори менюто днес и пазарувай спокойно. Освен него получаваш и всички рецепти в приложението.</p>
        ${FESTIVE_BUY}
        ${MENU_NOTE}
      </section>
      </div>`;

  return layout({
    language: 'bg',
    title: 'Празнично меню за Коледа и Нова година · TasteMaster365',
    description: 'Меню за Бъдни вечер, Коледа и Нова година: баница с късмети, сарми, пуйка с кисело зеле, руска салата. План по дни и списъци за пазаруване за 8 души.',
    canonical: FESTIVE_PATH,
    image: `${SITE}/praznichno-menu/banica.jpg`,
    pathFor: () => FESTIVE_PATH,
    languages: ['bg'],
    extraStyle: `${MENU_STYLE}${FESTIVE_STYLE}`,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Празнично меню за Коледа и Нова година',
      description: 'Меню за Бъдни вечер, Коледа и Нова година с план по дни и списъци за пазаруване в приложението TasteMaster365.',
      inLanguage: 'bg',
      image: `${SITE}/praznichno-menu/banica.jpg`,
      url: `${SITE}${FESTIVE_PATH}`,
    },
    body,
  });
}

// ---- Bulgarian topic pages (/bg/postni-supi and the rest, see server/topics.js) ----

const TOPIC_LINKS_STYLE = `
      .topics { margin: 24px 0; }
      .topics h2 { margin: 0 0 10px; }
      .topics ul { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 8px; }
      .topics a { display: inline-block; border: 1px solid var(--line); background: var(--card); padding: 6px 12px; font-size: 14px; text-decoration: none; border-radius: 999px; }
      .topics a:hover { border-color: var(--accent); color: var(--accent-dark); }`;

function topicLinks(heading = 'Постни рецепти по теми', current = null) {
  const items = TOPICS.filter((topic) => topic.slug !== current)
    .map((topic) => `<li><a href="${topicPath(topic)}">${esc(topic.nav)}</a></li>`).join('');
  return `      <nav class="topics" aria-label="${esc(heading)}"><h2>${esc(heading)}</h2><ul>${items}</ul></nav>
`;
}

const TOPIC_STYLE = `${TOPIC_LINKS_STYLE}
      .crumbs { font-size: 13px; color: var(--muted); margin-top: 18px; }
      .crumbs a { color: var(--muted); }
      .intro p { margin: 0 0 12px; color: #44403c; }
      .card .time { display: block; padding: 0 10px 10px; margin-top: -6px; font-size: 12px; color: var(--muted); }
      .menu-box { display: flex; gap: 16px; align-items: center; text-decoration: none; background: #144547; color: #fffaf2; padding: 14px 16px; margin: 28px 0; }
      .menu-box img { width: 70px; height: auto; flex: none; box-shadow: 0 4px 12px rgba(0,0,0,.3); }
      .menu-box b { display: block; font: 700 19px Georgia, serif; }
      .menu-box span { font-size: 14px; color: #cfe5e3; }
      .menu-box em { font-style: normal; color: #fdba74; font-weight: 600; }`;

const MENU_BOX = `      <a class="menu-box" href="${MENU_PATH}"><img src="/postno-menu/p-01.jpg" alt="" width="70" height="99" loading="lazy" /><div><b>Постно меню до Коледа</b><span>4 седмици вечери, списъци за пазаруване и 9 ястия за Бъдни вечер. <em>7 дни безплатно, без карта</em></span></div></a>
`;

export function renderTopicPage(recipes, slug) {
  const topic = findTopic(slug);
  if (!topic) return null;
  const byId = new Map(recipes.map((recipe) => [recipe.id.toUpperCase(), recipe]));
  const picked = topic.ids.map((id) => byId.get(id)).filter(Boolean).map((recipe) => localizeRecipe(recipe, 'bg'));
  const path = topicPath(topic);
  const card = (recipe) => {
    const minutes = Number(recipe.time) || null;
    return `<a class="card" href="${esc(recipePath(recipe, 'bg'))}"><img src="${esc(photo(recipe.image, PHOTO.card))}" alt="" loading="lazy" width="400" height="300" /><span>${esc(recipe.title)}</span>${minutes ? `<small class="time">${minutes} мин.</small>` : ''}</a>`;
  };
  const body = `      <nav class="crumbs" aria-label="Навигация"><a href="/?lang=bg">Начало</a> › <a href="${LENTEN_PATHS.bg}">Постни рецепти</a> › ${esc(topic.h1)}</nav>
      <h1>${esc(topic.h1)}</h1>
      <div class="intro">${topic.intro.map((paragraph) => `<p>${esc(paragraph)}</p>`).join('')}</div>
${topic.slug === 'badni-vecher' ? FESTIVE_TEASER : ''}${MENU_BOX}      <h2>Рецепти (${picked.length})</h2>
      <div class="grid">${picked.map(card).join('')}</div>
${topicLinks('Още теми', topic.slug)}      <p><a class="cta" href="${LENTEN_PATHS.bg}">Всички постни рецепти</a></p>`;

  return layout({
    language: 'bg',
    title: topic.title,
    description: topic.description,
    canonical: path,
    image: picked[0]?.image,
    pathFor: () => path,
    languages: ['bg'],
    extraStyle: TOPIC_STYLE,
    structuredData: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: topic.h1,
        description: topic.description,
        inLanguage: 'bg',
        url: `${SITE}${path}`,
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: picked.length,
          itemListElement: picked.map((recipe, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: `${SITE}${recipePath(recipe, 'bg')}`,
            name: recipe.title,
          })),
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Начало', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Постни рецепти', item: `${SITE}${LENTEN_PATHS.bg}` },
          { '@type': 'ListItem', position: 3, name: topic.h1, item: `${SITE}${path}` },
        ],
      },
    ],
    body,
  });
}
