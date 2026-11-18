export const SEO_LANGUAGES = ['bg', 'en', 'de', 'es', 'fr', 'ru'];

const CYRILLIC = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k',
  л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts',
  ч: 'ch', ш: 'sh', щ: 'sht', ъ: 'a', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .replace(/[а-яё]/g, (char) => CYRILLIC[char] ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '');
}

export function recipePath(recipe, language) {
  const slug = slugify(recipe.title);
  return `/${language}/recipe/${recipe.id.toLowerCase()}${slug ? `-${slug}` : ''}`;
}

export function recipeIdFromSlug(slug) {
  return String(slug || '').match(/^([a-z]+-[a-z]?\d+)/i)?.[1]?.toUpperCase() || null;
}

export const hubPath = (language) => `/${language}/recipes`;

// Landing page for the Christmas (Nativity) fast, used by the Google Ads campaign.
export const LENTEN_PATHS = { bg: '/bg/postni-recepti', en: '/en/lenten-recipes' };
export const LENTEN_LANGUAGES = Object.keys(LENTEN_PATHS);

// Paid PDF "Постно меню до Коледа" (Bulgarian only).
export const MENU_PATH = '/bg/postno-menu';
