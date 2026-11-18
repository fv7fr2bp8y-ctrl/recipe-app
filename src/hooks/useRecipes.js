import { useCallback, useEffect, useRef, useState } from 'react';

// Loads the catalog for one language and one access level (refreshKey).
// - Nothing is requested until `enabled` (the account check) is true, so a subscriber
//   does not download the guest catalog first and then the full one.
// - A newer request cancels the older one, so a slow guest answer never replaces
//   the subscriber's catalog.
// - While a new copy loads, the previous list stays on screen; `loading` is true only
//   when there is nothing to show yet.
export function useRecipes(refreshKey = 0, language = 'bg', enabled = true) {
  const [recipes, setRecipes] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const controllerRef = useRef(null);

  const load = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setError('');
    try {
      const response = await fetch(`/api/recipes?lang=${encodeURIComponent(language)}`, {
        credentials: 'include', cache: 'no-store', signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`);
      const data = await response.json();
      if (controller.signal.aborted) return;
      setRecipes(Array.isArray(data.recipes) ? data.recipes : []);
      setLoaded(true);
    } catch (loadError) {
      if (controller.signal.aborted) return;
      console.error(loadError);
      setRecipes([]);
      setError('Каталогът не можа да се зареди. Опитай отново след малко.');
      setLoaded(true);
    }
  }, [language]);

  useEffect(() => {
    if (!enabled) return undefined;
    const timer = window.setTimeout(() => { load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load, refreshKey, enabled]);

  useEffect(() => () => controllerRef.current?.abort(), []);

  return {
    recipes,
    loading: !loaded,
    error,
    reload: load,
  };
}
