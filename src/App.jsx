import { useState, useMemo, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useRecipes } from './hooks/useRecipes';
import { useGoogleDrive } from './hooks/useGoogleDrive';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import RecipeCard from './components/RecipeCard';
import RecipeForm from './components/RecipeForm';
import RecipeDetail from './components/RecipeDetail';
import DailyRecipe from './components/DailyRecipe';
import PremiumGate from './components/PremiumGate';
import AccountDialog from './components/AccountDialog';
import { useFreemiumAccess } from './hooks/useFreemiumAccess';
import { useAccount } from './hooks/useAccount';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || '').toLowerCase();

const DIET_FILTERS = [
  { key: 'glutenFree', label: 'Без глутен' },
  { key: 'dairyFree', label: 'Без млечни' },
  { key: 'meatFree', label: 'Без месо' },
  { key: 'plantBased', label: 'Растително' },
  { key: 'healthyGut', label: 'Healthy Gut' },
];

function RecipeApp() {
  const account = useAccount();
  const refreshAccount = account.refresh;
  const catalogRefreshKey = `${account.user?.id || 'guest'}:${account.premium}`;
  const { recipes, addRecipe, updateRecipe, deleteRecipe, setRecipes, loading, source, error: catalogError } = useRecipes(catalogRefreshKey);
  const { accessToken, userEmail, signIn, signOut, uploadImage, uploading, saveRecipesToDrive, loadRecipesFromDrive, listDrivePhotos, makePhotoPublic, scopes } = useGoogleDrive();
  const accountEmail = account.user?.email?.toLowerCase();
  const isAdmin = Boolean(
    (accountEmail && accountEmail === ADMIN_EMAIL)
    || (userEmail && userEmail.toLowerCase() === ADMIN_EMAIL),
  );
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Всички');
  const [difficulty, setDifficulty] = useState('Всички');
  const [country, setCountry] = useState('Всички');
  const [dietFilters, setDietFilters] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [editRecipe, setEditRecipe] = useState(null);
  const [viewRecipe, setViewRecipe] = useState(null);
  const [showPremium, setShowPremium] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const syncing = false;
  const {
    premiumActive,
    freeViewsRemaining,
    canOpenRecipe,
    registerRecipeView,
  } = useFreemiumAccess(recipes, isAdmin || account.premium);

  // Load from Drive when admin connects
  useEffect(() => {
    if (!accessToken || !isAdmin || loading || source === 'secure-api') return;
    loadRecipesFromDrive()
      .then((driveRecipes) => {
        if (driveRecipes && driveRecipes.length > 0) {
          setRecipes(driveRecipes);
        }
      });
  }, [accessToken, isAdmin, loading, source, loadRecipesFromDrive, setRecipes]);

  // Save to Drive whenever recipes change (admin only, debounced)
  useEffect(() => {
    if (!accessToken || !isAdmin || loading || source === 'secure-api') return;
    const timer = setTimeout(() => saveRecipesToDrive(recipes), 1500);
    return () => clearTimeout(timer);
  }, [recipes, accessToken, isAdmin, loading, source, saveRecipesToDrive]);

  const filtered = useMemo(() => {
    return recipes.filter((r) => {
      const query = search.toLowerCase().trim();
      const ingredients = Array.isArray(r.ingredients) ? r.ingredients : [];
      const searchable = [
        r.title,
        r.description,
        r.country,
        r.tag,
        r.mealType,
        r.collection,
        r.allergenNotes,
        r.nutritionNotes,
        ...ingredients,
      ].filter(Boolean).join(' ').toLowerCase();
      const matchSearch = !query || searchable.includes(query);
      const matchCat = category === 'Всички' || r.collection === category || r.category === category;
      const matchDiff = difficulty === 'Всички' || r.difficulty === difficulty;
      const matchCountry = country === 'Всички' || r.country === country;
      const matchDiet = DIET_FILTERS.every(({ key }) => !dietFilters[key] || r.diets?.[key]);
      return matchSearch && matchCat && matchDiff && matchCountry && matchDiet;
    });
  }, [recipes, search, category, difficulty, country, dietFilters]);

  const categories = useMemo(() => {
    const values = [...new Set(recipes.map((r) => r.collection || r.category).filter(Boolean))];
    return ['Всички', ...values];
  }, [recipes]);

  const countries = useMemo(() => {
    const values = [...new Set(recipes.map((r) => r.country).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, 'bg'));
    return ['Всички', ...values];
  }, [recipes]);

  const toggleDietFilter = (key) => {
    setDietFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('Всички');
    setDifficulty('Всички');
    setCountry('Всички');
    setDietFilters({});
  };

  const difficulties = useMemo(() => {
    const values = [...new Set(recipes.map((r) => r.difficulty).filter(Boolean))];
    return ['Всички', ...values];
  }, [recipes]);

  const dailyRecipe = useMemo(() => {
    const available = recipes.filter((recipe) => recipe.image && (premiumActive || !recipe.locked));
    if (available.length === 0) return recipes[0] || null;
    const now = new Date();
    const dayNumber = Math.floor(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
    ) / 86400000);
    return available[dayNumber % available.length];
  }, [recipes, premiumActive]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') !== 'success') return undefined;
    let attempts = 0;
    const timer = window.setInterval(async () => {
      attempts += 1;
      const status = await refreshAccount();
      if (status?.premium || attempts >= 8) {
        window.clearInterval(timer);
        window.history.replaceState({}, '', window.location.pathname);
      }
    }, 1500);
    return () => window.clearInterval(timer);
  }, [refreshAccount]);

  const openRecipe = (recipe) => {
    if (!canOpenRecipe(recipe.id)) {
      setShowPremium(true);
      return;
    }
    registerRecipeView(recipe.id);
    setViewRecipe(recipe);
  };

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
      <Header
        onAdd={() => { setEditRecipe(null); setShowForm(true); }}
        driveConnected={!!accessToken}
        onDriveSignIn={signIn}
        onDriveSignOut={signOut}
        driveScopes={scopes}
        syncing={syncing}
        isAdmin={isAdmin}
        googleEnabled={!!CLIENT_ID}
        accountUser={account.user}
        onAccountLogin={() => setShowAccount(true)}
        onAccountLogout={account.logout}
        accountLoading={account.loading || account.actionLoading}
        premium={account.premium}
        onManageBilling={account.manageBilling}
      />

      <main className="max-w-6xl mx-auto px-4 py-6">
        {!loading && (
          <DailyRecipe
            recipe={dailyRecipe}
            onOpen={openRecipe}
            locked={Boolean(dailyRecipe?.locked)}
          />
        )}

        {!premiumActive && !loading && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border border-orange-200 bg-white px-4 py-3 text-sm text-stone-600">
            <span>
              {freeViewsRemaining} рецепти са достъпни безплатно. Останалият каталог е Premium.
            </span>
            <button
              type="button"
              onClick={() => setShowPremium(true)}
              className="font-semibold text-orange-700 hover:text-orange-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
            >
              TasteMaster365 Premium
            </button>
          </div>
        )}

        <SearchBar
          search={search} setSearch={setSearch}
          category={category} setCategory={setCategory}
          difficulty={difficulty} setDifficulty={setDifficulty}
          country={country} setCountry={setCountry}
          countries={countries}
          dietFilters={dietFilters}
          dietFilterOptions={DIET_FILTERS}
          onToggleDiet={toggleDietFilter}
          count={filtered.length}
          totalCount={recipes.length}
          categories={categories}
          difficulties={difficulties}
        />

        {catalogError ? (
          <div className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {catalogError}
          </div>
        ) : null}

        <div className="mt-6">
          {syncing || loading ? (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-gray-400 mt-3 text-sm">
                {loading ? 'Зарежда защитения каталог...' : 'Зарежда от Google Drive...'}
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-5xl">🍽️</span>
              <p className="text-gray-400 mt-3">Няма намерени рецепти</p>
              <button
                onClick={clearFilters}
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
                  onClick={() => openRecipe(recipe)}
                  onDelete={handleDelete}
                  canEdit={isAdmin}
                  locked={Boolean(recipe.locked)}
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
          uploadImage={uploadImage}
          uploading={uploading}
          driveConnected={!!accessToken}
          listDrivePhotos={listDrivePhotos}
          makePhotoPublic={makePhotoPublic}
        />
      )}

      {viewRecipe && !showForm && (
        <RecipeDetail
          recipe={viewRecipe}
          onEdit={handleEdit}
          onClose={() => setViewRecipe(null)}
          canEdit={isAdmin}
        />
      )}

      {showPremium && (
        <PremiumGate
          onClose={() => setShowPremium(false)}
          authenticated={Boolean(account.user)}
          onLoginRequest={() => setShowAccount(true)}
          onSubscribe={account.subscribe}
          onManageBilling={account.manageBilling}
          premium={account.premium}
          loading={account.actionLoading}
          error={account.error}
        />
      )}
      {showAccount && (
        <AccountDialog
          onClose={() => setShowAccount(false)}
          onLogin={async (credentials) => {
            if (await account.login(credentials)) setShowAccount(false);
          }}
          onRegister={async (details) => {
            if (await account.register(details)) setShowAccount(false);
          }}
          loading={account.actionLoading}
          error={account.error}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={CLIENT_ID || 'google-client-id-not-configured'}>
      <RecipeApp />
    </GoogleOAuthProvider>
  );
}
