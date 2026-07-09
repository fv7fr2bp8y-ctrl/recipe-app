const CATEGORIES = ['Всички', 'Основно ястие', 'Салата', 'Супа', 'Десерт', 'Закуска', 'Предястие'];
const DIFFICULTIES = ['Всички', 'Лесно', 'Средно', 'Трудно'];

export default function SearchBar({
  search,
  setSearch,
  category,
  setCategory,
  difficulty,
  setDifficulty,
  count,
  categories = CATEGORIES,
  difficulties = DIFFICULTIES,
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input
          type="text"
          placeholder="Търси рецепта..."
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

      <div className="flex flex-wrap gap-2">
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
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

      <div className="flex items-center justify-between">
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
        <span className="text-xs text-gray-400">{count} рецепти</span>
      </div>
    </div>
  );
}
