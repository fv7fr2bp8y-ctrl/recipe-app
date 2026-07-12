import { catalogForAccess } from '../server/recipes.js';
import { getSession } from '../server/session.js';
import { getEntitlement, entitlementIsActive } from '../server/db.js';
import { FREE_RECIPE_LIMIT } from '../server/config.js';
import { jsonError, methodNotAllowed } from '../server/http.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  try {
    const user = await getSession(req);
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
    const isAdmin = Boolean(user && adminEmail && user.email?.toLowerCase() === adminEmail);
    const entitlement = user ? await getEntitlement(user.id) : null;
    const premium = isAdmin || entitlementIsActive(entitlement);
    const recipes = await catalogForAccess(premium);
    res.setHeader('Cache-Control', 'private, no-store');
    return res.status(200).json({ recipes, premium, freeLimit: FREE_RECIPE_LIMIT });
  } catch (error) {
    console.error('recipes_load_failed', error);
    return jsonError(res, 500, 'recipes_load_failed', 'Could not load the recipe catalog.');
  }
}
