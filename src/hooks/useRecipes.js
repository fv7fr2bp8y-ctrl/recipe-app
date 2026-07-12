import { useCallback, useEffect, useState } from 'react';

export function useRecipes(refreshKey = 0) {
  const [recipes, setRecipes] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoaded(false);
    setError('');
    try {
      const response = await fetch('/api/recipes', { credentials: 'include', cache: 'no-store' });
      if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`);
      const data = await response.json();
      setRecipes(Array.isArray(data.recipes) ? data.recipes : []);
    } catch (loadError) {
      console.error(loadError);
      setRecipes([]);
      setError('Каталогът не можа да се зареди. Опитай отново след малко.');
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load, refreshKey]);

  return {
    recipes,
    loading: !loaded,
    error,
    reload: load,
  };
}
