import { useState, useMemo } from 'react';
import { useRecipes } from './hooks/useRecipes';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import RecipeCard from './components/RecipeCard';
import RecipeForm from './components/RecipeForm';
import RecipeDetail from './components/RecipeDetail';

export default function App() {
  const { recipes, addRecipe, updateRecipe, deleteRecipe } = useRecipes();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Всички');
  const [difficulty, setDifficulty] = useState('Всички');
  const [showForm, setShowForm] = useState(false);
  const [editRecipe, setEditRecipe] = useState(null);
  const [viewRecipe, setViewRecipe] = useState(null);

  const filtered = useMemo(() => {
    return recipes.filter((r) => {
      const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.description?.toLowerCase().includes(search.toLowerCase()) ||
        r.ingredients.some((i) => i.toLowerCase().includes(search.toLowerCase()));
      const matchCat = category === 'Всички' || r.category === category;
      const matchDiff = difficulty === 'Всички' || r.difficulty === difficulty;
      return matchSearch && matchCat && matchDiff;
    });
  }, [recipes, search, category, difficulty]);

  const handleSave = (data) => {
    if (editRecipe) {
      updateRecipe(editRecipe.id, data);
      if (viewRecipe?.id === editRecipe.id) setViewRecipe({ ...viewRecipe, ...data });
    } else {
      addRecipe(data);
    }
    setShowForm(false);
    setEditRecipe(null);
  };

  const handleEdit = () => {
    setEditRecipe(viewRecipe);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Сигурни ли сте, че искате да изтриете тази рецепта?')) {
      deleteRecipe(id);
      if (viewRecipe?.id === id) setViewRecipe(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#fef9f0]">
      <Header onAdd={() => { setEditRecipe(null); setShowForm(true); }} />

      <main className="max-w-6xl mx-auto px-4 py-6">
        <SearchBar
          search={search} setSearch={setSearch}
          category={category} setCategory={setCategory}
          difficulty={difficulty} setDifficulty={setDifficulty}
          count={filtered.length}
        />

        <div className="mt-6">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-5xl">🍽️</span>
              <p className="text-gray-400 mt-3">Няма намерени рецепти</p>
              <button
                onClick={() => { setSearch(''); setCategory('Всички'); setDifficulty('Всички'); }}
                className="mt-3 text-primary-600 text-sm hover:underline"
              >
                Изчисти филтрите
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onClick={() => setViewRecipe(recipe)}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {showForm && (
        <RecipeForm
          recipe={editRecipe}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditRecipe(null); }}
        />
      )}

      {viewRecipe && !showForm && (
        <RecipeDetail
          recipe={viewRecipe}
          onEdit={handleEdit}
          onClose={() => setViewRecipe(null)}
        />
      )}
    </div>
  );
}
