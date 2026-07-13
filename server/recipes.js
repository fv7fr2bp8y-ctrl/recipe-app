import { FREE_RECIPE_IDS, MASTER_SHEET_CSV_URL } from './config.js';

const LANGUAGES = ['bg', 'en', 'de', 'es', 'fr', 'ru'];

const APP_LABELS = {
  Breakfast: 'Brunch',
  Brunch: 'Brunch',
  'Healthy Gut': 'Healthy Gut',
};

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') quoted = false;
      else field += char;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') field += char;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((cells) => cells.some((cell) => cell.trim()));
}

const splitList = (value) => String(value || '')
  .split(/\s*(?:;|\n)\s*/)
  .map((item) => item.trim())
  .filter(Boolean);

function splitSteps(value) {
  const normalized = String(value || '').trim();
  if (!normalized) return [];
  const delimited = splitList(normalized);
  if (delimited.length > 1) return delimited;
  return (normalized.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [normalized])
    .map((step) => step.trim())
    .filter(Boolean);
}

const isTrue = (value) => String(value || '').toUpperCase() === 'TRUE';

function hasCompleteTranslation(row, language) {
  if (language === 'bg') {
    return Boolean(
      row.canonical_name_bg?.trim()
      && row.description_bg?.trim()
      && (row.ingredients_qty_bg?.trim() || row.ingredients_bg?.trim())
      && row.steps_bg?.trim(),
    );
  }
  return Boolean(
    row[`name_${language}`]?.trim()
    && row[`description_${language}`]?.trim()
    && (row[`ingredients_qty_${language}`]?.trim() || row[`ingredients_${language}`]?.trim())
    && row[`steps_${language}`]?.trim(),
  );
}

function imageFromRow(row) {
  const match = row.image_url?.match(/\/d\/([^/]+)\//) || row.image_url?.match(/[?&]id=([^&]+)/);
  const fileId = row.image_drive_id || match?.[1];
  return fileId ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200` : row.image_url || null;
}

function mapRow(row) {
  const time = Number(row.time_min) || 30;
  const collection = APP_LABELS[row.app_primary] || row.app_primary || row.meal_type || 'Рецепти';
  const diets = {
    breakfast: isTrue(row.is_breakfast),
    healthyGut: isTrue(row.is_healthy_gut),
    glutenFree: isTrue(row.is_gluten_free),
    dairyFree: isTrue(row.is_dairy_free),
    meatFree: isTrue(row.is_meat_free),
    plantBased: isTrue(row.is_plant_based),
  };
  const translations = Object.fromEntries(LANGUAGES.map((language) => {
    const isBulgarian = language === 'bg';
    const title = isBulgarian ? row.canonical_name_bg : row[`name_${language}`];
    const description = isBulgarian ? row.description_bg : row[`description_${language}`];
    const ingredients = isBulgarian
      ? row.ingredients_qty_bg || row.ingredients_bg
      : row[`ingredients_qty_${language}`] || row[`ingredients_${language}`];
    const steps = isBulgarian ? row.steps_bg : row[`steps_${language}`];
    const tag = isBulgarian ? row.tag : row[`tag_${language}`];
    const country = isBulgarian ? row.country_bg : row[`country_${language}`];
    return [language, {
      title: title || row.canonical_name_bg,
      description: description || row.description_bg || row.tag || '',
      ingredients: splitList(ingredients || row.ingredients_qty_bg || row.ingredients_bg),
      steps: splitSteps(steps || row.steps_bg),
      tag: tag || row.tag || '',
      country: country || row.country_bg || row.country_en || 'Световна кухня',
    }];
  }));
  const availableLanguages = LANGUAGES.filter((language) => hasCompleteTranslation(row, language));
  return {
    id: row.global_id,
    title: row.canonical_name_bg,
    category: collection,
    collection,
    mealType: row.meal_type,
    country: row.country_bg || row.country_en || 'Световна кухня',
    countryKey: row.country_en || row.country_bg || 'World cuisine',
    difficulty: time <= 25 ? 'Лесно' : time <= 45 ? 'Средно' : 'Трудно',
    time,
    servings: Number(row.servings) || 2,
    description: row.description_bg || row.tag || '',
    ingredients: splitList(row.ingredients_qty_bg || row.ingredients_bg),
    steps: splitSteps(row.steps_bg),
    image: imageFromRow(row),
    diets,
    tag: row.tag,
    allergenNotes: row.allergen_notes,
    nutritionNotes: row.nutrition_notes,
    translations,
    availableLanguages,
  };
}

function lockedPreview(recipe) {
  return {
    id: recipe.id,
    title: recipe.title,
    category: recipe.category,
    collection: recipe.collection,
    mealType: recipe.mealType,
    country: recipe.country,
    countryKey: recipe.countryKey,
    difficulty: recipe.difficulty,
    time: recipe.time,
    image: recipe.image,
    diets: recipe.diets,
    tag: recipe.tag,
    translations: Object.fromEntries(Object.entries(recipe.translations).map(([language, translation]) => (
      [language, {
        title: translation.title,
        description: translation.description,
        tag: translation.tag,
        country: translation.country,
      }]
    ))),
    availableLanguages: recipe.availableLanguages,
    locked: true,
  };
}

let cache = { expiresAt: 0, recipes: [] };

export async function loadMasterRecipes() {
  if (cache.expiresAt > Date.now() && cache.recipes.length) return cache.recipes;
  const response = await fetch(MASTER_SHEET_CSV_URL, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Master sheet failed: ${response.status}`);
  const matrix = parseCsv(await response.text());
  const [headers, ...dataRows] = matrix;
  const recipes = dataRows
    .map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index] || ''])))
    .filter((row) => row.global_id && row.canonical_name_bg)
    .filter((row) => row.status === 'ready' && row.recipe_quality === 'curated')
    .map(mapRow);
  cache = { recipes, expiresAt: Date.now() + 5 * 60 * 1000 };
  return recipes;
}

export async function catalogForAccess(hasPremium) {
  const recipes = await loadMasterRecipes();
  if (hasPremium) return recipes.map((recipe) => ({ ...recipe, locked: false }));
  const freeIds = new Set(FREE_RECIPE_IDS);
  const byId = new Map(recipes.map((recipe) => [recipe.id, recipe]));
  const freeRecipes = FREE_RECIPE_IDS
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((recipe) => ({ ...recipe, locked: false }));
  const premiumPreviews = recipes
    .filter((recipe) => !freeIds.has(recipe.id))
    .map(lockedPreview);
  return [...freeRecipes, ...premiumPreviews];
}
