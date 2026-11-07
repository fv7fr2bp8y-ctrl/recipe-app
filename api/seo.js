import {
  SITE, findRecipe, publicCatalog, renderHubPage, renderNotFound, renderRecipePage, renderSitemap,
} from '../server/seo.js';
import { localizeRecipe } from '../src/i18n.js';
import { SEO_LANGUAGES, recipeIdFromSlug, recipePath } from '../src/seo-url.js';
import { methodNotAllowed } from '../server/http.js';

const CACHE = 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400';

export default async function handler(req, res) {
  if (!['GET', 'HEAD'].includes(req.method)) return methodNotAllowed(res, ['GET', 'HEAD']);
  const { page, lang, slug } = req.query || {};
  const language = SEO_LANGUAGES.includes(lang) ? lang : 'en';
  try {
    const recipes = await publicCatalog();
    res.setHeader('Cache-Control', CACHE);

    if (page === 'sitemap') {
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      return res.status(200).send(renderSitemap(recipes));
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    if (page === 'hub') return res.status(200).send(renderHubPage(recipes, language));

    const recipe = findRecipe(recipes, recipeIdFromSlug(slug));
    if (!recipe) return res.status(404).send(renderNotFound(language));
    const canonical = recipePath(localizeRecipe(recipe, language), language);
    if (`/${language}/recipe/${slug}` !== canonical) {
      res.setHeader('Location', `${SITE}${canonical}`);
      return res.status(301).end();
    }
    return res.status(200).send(renderRecipePage(recipe, recipes, language));
  } catch (error) {
    console.error('seo_render_failed', error);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(500).send('Temporarily unavailable');
  }
}
