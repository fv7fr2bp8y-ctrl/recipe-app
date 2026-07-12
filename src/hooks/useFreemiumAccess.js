import { useCallback, useMemo } from 'react';

export const FREE_RECIPE_LIMIT = 12;

export function useFreemiumAccess(recipes, premiumActive) {
  const freeRecipeIds = useMemo(() => recipes
    .filter((recipe) => !recipe.locked)
    .map((recipe) => String(recipe.id)), [recipes]);

  const canOpenRecipe = useCallback((recipeId) => (
    premiumActive || freeRecipeIds.includes(String(recipeId))
  ), [premiumActive, freeRecipeIds]);

  return {
    premiumActive,
    freeViewsUsed: freeRecipeIds.length,
    freeViewsRemaining: freeRecipeIds.length,
    limitReached: !premiumActive,
    viewedRecipeIds: freeRecipeIds,
    canOpenRecipe,
    registerRecipeView: () => {},
  };
}
