const CATEGORIES = ['Всички', 'Основно ястие', 'Салата', 'Супа', 'Десерт', 'Закуска', 'Предястие'];
const DIFFICULTIES = ['Всички', 'Лесно', 'Средно', 'Трудно'];

export default function SearchBar({
  search,
  setSearch,
  category,
  setCategory,
  difficulty,
  setDifficulty,
  country,
  setCountry,
  countries = ['Всички'],
  dietFilters = {},
  dietFilterOptions = [],
  onToggleDiet,
  count,
  totalCount,
  categories = CATEGORIES,
  difficulties = DIFFICULTIES,
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input
          type="text"
          placeholder="Търси рецепта, съставка, държава..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400 mb-2">Каталог</p>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              category === cat
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400 mb-2">Режими</p>
        <div className="flex flex-wrap gap-1.5">
          {dietFilterOptions.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => onToggleDiet(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                dietFilters[key]
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400 mb-2">Държави</p>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {countries.map((item) => (
              <button
                key={item}
                onClick={() => setCountry(item)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                  country === item
                    ? 'bg-stone-800 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400 mb-2">Трудност</p>
          <div className="flex gap-1.5">
            {difficulties.map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                difficulty === d
                  ? 'bg-orange-100 text-orange-700 border border-orange-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {d}
            </button>
          ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
        <span className="text-xs text-gray-400">{count} от {totalCount || count} рецепти</span>
        <span className="text-xs text-gray-400">TasteMaster</span>
      </div>
    </div>
  );
}
