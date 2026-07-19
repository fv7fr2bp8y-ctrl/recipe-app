import { useState, useMemo, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useRecipes } from './hooks/useRecipes';
import { useGoogleDrive } from './hooks/useGoogleDrive';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import RecipeCard from './components/RecipeCard';
import RecipeDetail from './components/RecipeDetail';
import DailyRecipe from './components/DailyRecipe';
import PremiumGate from './components/PremiumGate';
import AccountDialog from './components/AccountDialog';
import Footer from './components/Footer';
import { useFreemiumAccess } from './hooks/useFreemiumAccess';
import { useAccount } from './hooks/useAccount';
import { getMessages, localizeRecipe } from './i18n';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || '').toLowerCase();
const ALL_FILTER = '__all__';
const PAGE_SIZE = 48;

function RecipeApp() {
  const account = useAccount();
  const refreshAccount = account.refresh;
  const catalogRefreshKey = `${account.user?.id || 'guest'}:${account.premium}`;
  const { recipes: sourceRecipes, loading, error: catalogError } = useRecipes(catalogRefreshKey);
  const { accessToken, userEmail, signIn, signOut, scopes } = useGoogleDrive();
  const accountEmail = account.user?.email?.toLowerCase();
  const isAdmin = Boolean(
    (accountEmail && accountEmail === ADMIN_EMAIL)
    || (userEmail && userEmail.toLowerCase() === ADMIN_EMAIL),
  );
  const [language, setLanguage] = useState(() => localStorage.getItem('tastemaster-language') || 'bg');
  const messages = getMessages(language);
  const recipes = useMemo(() => sourceRecipes
    .filter((recipe) => recipe.image && recipe.availableLanguages?.includes(language))
    .map((recipe) => localizeRecipe(recipe, language)), [sourceRecipes, language]);
  const dietFilterOptions = useMemo(() => [
    { key: 'glutenFree', label: messages.glutenFree },
    { key: 'dairyFree', label: messages.dairyFree },
    { key: 'vegetarian', label: messages.vegetarian },
    { key: 'plantBased', label: messages.vegan },
    { key: 'healthyGut', label: messages.healthyGut },
  ], [messages]);
  const sectionOptions = useMemo(() => [
    { key: 'meat', label: messages.meatDishes },
    { key: 'seafood', label: messages.seafood },
    { key: 'mediterranean', label: messages.mediterranean },
  ], [messages]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(ALL_FILTER);
  const [difficulty, setDifficulty] = useState(ALL_FILTER);
  const [country, setCountry] = useState(ALL_FILTER);
  const [dietFilters, setDietFilters] = useState({});
  const [section, setSection] = useState(ALL_FILTER);
  const [viewRecipeId, setViewRecipeId] = useState(() => new URLSearchParams(window.location.search).get('recipe'));
  const [showPremium, setShowPremium] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [toast, setToast] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const syncing = false;
  const {
    premiumActive,
    canOpenRecipe,
    registerRecipeView,
  } = useFreemiumAccess(recipes, isAdmin || account.premium);
  const linkedRecipe = recipes.find((recipe) => recipe.id === viewRecipeId) || null;
  const viewRecipe = linkedRecipe && canOpenRecipe(linkedRecipe.id) ? linkedRecipe : null;

  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem('tastemaster-language', language);
  }, [language]);

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
      const matchCat = category === ALL_FILTER || r.collection === category || r.category === category;
      const matchDiff = difficulty === ALL_FILTER || r.difficulty === difficulty;
      const matchCountry = country === ALL_FILTER || r.country === country;
      const matchDiet = dietFilterOptions.every(({ key }) => !dietFilters[key] || r.diets?.[key]);
      const matchSection = section === ALL_FILTER || r.sections?.[section];
      return matchSearch && matchCat && matchDiff && matchCountry && matchDiet && matchSection;
    });
  }, [recipes, search, category, difficulty, country, dietFilters, dietFilterOptions, section]);

  const categories = useMemo(() => {
    const values = [...new Set(recipes.map((r) => r.collection || r.category).filter(Boolean))];
    return [ALL_FILTER, ...values];
  }, [recipes]);

  const countries = useMemo(() => {
    const values = [...new Set(recipes.map((r) => r.country).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, language));
    return [ALL_FILTER, ...values];
  }, [recipes, language]);

  const toggleDietFilter = (key) => {
    setDietFilters((prev) => ({ ...prev, [key]: !prev[key] }));
    setVisibleCount(PAGE_SIZE);
  };

  const clearFilters = () => {
    setSearch('');
    setCategory(ALL_FILTER);
    setDifficulty(ALL_FILTER);
    setCountry(ALL_FILTER);
    setDietFilters({});
    setSection(ALL_FILTER);
    setVisibleCount(PAGE_SIZE);
  };

  const difficulties = useMemo(() => {
    const values = [...new Set(recipes.map((r) => r.difficulty).filter(Boolean))];
    return [ALL_FILTER, ...values];
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
    setViewRecipeId(recipe.id);
    window.history.replaceState({}, '', `?recipe=${encodeURIComponent(recipe.id)}`);
  };

  const share = async (recipe = null) => {
    const url = new URL(window.location.origin);
    if (recipe) url.searchParams.set('recipe', recipe.id);
    const data = {
      title: recipe ? `${recipe.title} · TasteMaster365` : 'TasteMaster365',
      text: recipe?.description || messages.tagline,
      url: url.toString(),
    };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(data.url);
        setToast(messages.copied);
        window.setTimeout(() => setToast(''), 2200);
      }
    } catch (error) {
      if (error?.name !== 'AbortError') {
        await navigator.clipboard.writeText(data.url);
        setToast(messages.copied);
        window.setTimeout(() => setToast(''), 2200);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f6fbfa]">
      <Header
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
        language={language}
        onLanguageChange={(nextLanguage) => {
          setLanguage(nextLanguage);
          setCountry(ALL_FILTER);
          setVisibleCount(PAGE_SIZE);
        }}
        onShare={() => share()}
        messages={messages}
      />

      <main className="max-w-6xl mx-auto px-4 py-6">
        {!loading && (
          <DailyRecipe
            recipe={dailyRecipe}
            onOpen={openRecipe}
            onShare={share}
            locked={Boolean(dailyRecipe?.locked)}
            language={language}
            messages={messages}
          />
        )}

        <SearchBar
          search={search} setSearch={(value) => { setSearch(value); setVisibleCount(PAGE_SIZE); }}
          category={category} setCategory={(value) => { setCategory(value); setVisibleCount(PAGE_SIZE); }}
          difficulty={difficulty} setDifficulty={(value) => { setDifficulty(value); setVisibleCount(PAGE_SIZE); }}
          country={country} setCountry={(value) => { setCountry(value); setVisibleCount(PAGE_SIZE); }}
          countries={countries}
          dietFilters={dietFilters}
          dietFilterOptions={dietFilterOptions}
          onToggleDiet={toggleDietFilter}
          section={section}
          setSection={(value) => { setSection(value); setVisibleCount(PAGE_SIZE); }}
          sectionOptions={sectionOptions}
          count={filtered.length}
          totalCount={recipes.length}
          categories={categories}
          difficulties={difficulties}
          messages={messages}
          allValue={ALL_FILTER}
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
                {messages.loading}
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-2xl text-orange-400" aria-hidden="true">◆</span>
              <p className="text-gray-400 mt-3">{messages.noResults}</p>
              <button
                onClick={clearFilters}
                className="mt-3 text-primary-600 text-sm hover:underline"
              >
                {messages.clear}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.slice(0, visibleCount).map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onClick={() => openRecipe(recipe)}
                  locked={Boolean(recipe.locked)}
                  messages={messages}
                />
              ))}
            </div>
          )}
          {!loading && filtered.length > visibleCount && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                className="border border-primary-500 bg-white px-7 py-3 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
              >
                {messages.loadMore} · {Math.min(PAGE_SIZE, filtered.length - visibleCount)}
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer messages={messages} />

      {viewRecipe && (
        <RecipeDetail
          recipe={viewRecipe}
          onClose={() => { setViewRecipeId(null); window.history.replaceState({}, '', window.location.pathname); }}
          onShare={share}
          messages={messages}
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
          messages={messages}
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
          messages={messages}
        />
      )}
      {toast && <div className="fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 bg-stone-900 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white shadow-xl">{toast}</div>}
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
