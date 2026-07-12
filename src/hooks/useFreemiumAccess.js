import { useCallback, useEffect, useMemo, useState } from 'react';

const VIEWED_KEY = 'tastemaster365-viewed-recipes';
const PREMIUM_KEY = 'tastemaster365-premium';
export const FREE_RECIPE_LIMIT = 12;

const readViewedRecipes = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(VIEWED_KEY) || '[]');
    return Array.isArray(stored) ? stored.map(String) : [];
  } catch {
    return [];
  }
};

export function useFreemiumAccess(isAdmin) {
  const [viewedRecipeIds, setViewedRecipeIds] = useState(readViewedRecipes);
  const [hasPremium, setHasPremium] = useState(
    () => localStorage.getItem(PREMIUM_KEY) === 'true',
  );

  useEffect(() => {
    localStorage.setItem(VIEWED_KEY, JSON.stringify(viewedRecipeIds));
  }, [viewedRecipeIds]);

  const premiumActive = isAdmin || hasPremium;
  const freeViewsUsed = Math.min(viewedRecipeIds.length, FREE_RECIPE_LIMIT);
  const freeViewsRemaining = Math.max(0, FREE_RECIPE_LIMIT - freeViewsUsed);

  const canOpenRecipe = useCallback((recipeId) => {
    if (premiumActive) return true;
    const id = String(recipeId);
    return viewedRecipeIds.includes(id) || viewedRecipeIds.length < FREE_RECIPE_LIMIT;
  }, [premiumActive, viewedRecipeIds]);

  const registerRecipeView = useCallback((recipeId) => {
    const id = String(recipeId);
    if (premiumActive || viewedRecipeIds.includes(id)) return;
    setViewedRecipeIds((current) => (
      current.includes(id) ? current : [...current, id].slice(0, FREE_RECIPE_LIMIT)
    ));
  }, [premiumActive, viewedRecipeIds]);

  const access = useMemo(() => ({
    premiumActive,
    freeViewsUsed,
    freeViewsRemaining,
    limitReached: !premiumActive && freeViewsRemaining === 0,
  }), [premiumActive, freeViewsUsed, freeViewsRemaining]);

  return {
    ...access,
    viewedRecipeIds,
    canOpenRecipe,
    registerRecipeView,
    setHasPremium,
  };
}
