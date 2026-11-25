import {
  SITE, findRecipe, inLanguage, publicCatalog, renderFestivePage, renderHubPage, renderLentenPage, renderMenuPage, renderTopicPage, renderNotFound, renderRecipePage, renderSitemap,
} from '../server/seo.js';
import { localizeRecipe } from '../src/i18n.js';
import {
  LENTEN_LANGUAGES, SEO_LANGUAGES, recipeIdFromSlug, recipePath,
} from '../src/seo-url.js';
import { methodNotAllowed } from '../server/http.js';

const CACHE = 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400';

export default async function handler(req, res) {
  if (!['GET', 'HEAD'].includes(req.method)) return methodNotAllowed(res, ['GET', 'HEAD']);
  const { page, lang, slug } = req.query || {};
  const language = SEO_LANGUAGES.includes(lang) ? lang : 'en';
  try {
    if (page === 'menu') {
      // Short cache: the price switches by date (the page script also switches it on its own).
      res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(renderMenuPage());
    }
    const recipes = await publicCatalog();
    res.setHeader('Cache-Control', CACHE);

    if (page === 'sitemap') {
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      return res.status(200).send(renderSitemap(recipes));
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    if (page === 'hub') return res.status(200).send(renderHubPage(recipes.filter(inLanguage(language)), language));
    if (page === 'festive') return res.status(200).send(renderFestivePage(recipes));
    if (page === 'topic') {
      const html = renderTopicPage(recipes, slug);
      return html ? res.status(200).send(html) : res.status(404).send(renderNotFound('bg'));
    }
    if (page === 'lenten') {
      if (!LENTEN_LANGUAGES.includes(language)) return res.status(404).send(renderNotFound(language));
      return res.status(200).send(renderLentenPage(recipes, language));
    }

    const recipe = findRecipe(recipes, recipeIdFromSlug(slug));
    if (!recipe) return res.status(404).send(renderNotFound(language));
    const pageLanguage = inLanguage(language)(recipe) ? language : 'bg';
    const canonical = recipePath(localizeRecipe(recipe, pageLanguage), pageLanguage);
    if (`/${language}/recipe/${slug}` !== canonical) {
      res.setHeader('Location', `${SITE}${canonical}`);
      return res.status(301).end();
    }
    return res.status(200).send(renderRecipePage(recipe, recipes.filter(inLanguage(language)), language));
  } catch (error) {
    console.error('seo_render_failed', error);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(500).send('Temporarily unavailable');
  }
}
