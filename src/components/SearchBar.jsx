import { useState } from 'react';
import { ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react';

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
  section,
  setSection,
  sectionOptions = [],
  count,
  totalCount,
  categories = CATEGORIES,
  difficulties = DIFFICULTIES,
  messages,
  allValue = '__all__',
  onClearFilters,
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const optionLabel = (value) => value === allValue ? messages.all : value;
  const activeFilterCount = [
    category !== allValue,
    difficulty !== allValue,
    country !== allValue,
    section !== allValue,
    ...Object.values(dietFilters),
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="relative">
        <Search size={18} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
        <input
          type="text"
          placeholder={messages.search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
        <button
          type="button"
          onClick={() => setFiltersOpen((open) => !open)}
          aria-expanded={filtersOpen}
          aria-controls="catalog-filters"
          className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-400"
        >
          <SlidersHorizontal size={17} strokeWidth={1.7} aria-hidden="true" />
          <span>{messages.filters}</span>
          {activeFilterCount > 0 && (
            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary-500 px-1.5 py-0.5 text-[11px] font-semibold text-white">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown
            size={17}
            strokeWidth={1.7}
            className={`transition-transform ${filtersOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>

        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={onClearFilters}
            className="min-h-10 px-2 text-xs font-medium text-primary-700 hover:text-primary-900 hover:underline"
          >
            {messages.clear}
          </button>
        )}
      </div>

      <div
        id="catalog-filters"
        hidden={!filtersOpen}
        className="space-y-4 border-t border-gray-100 pt-4"
      >
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400 mb-2">{messages.catalog}</p>
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
                {optionLabel(cat)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400 mb-2">{messages.diets}</p>
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

        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400 mb-2">{messages.dishes}</p>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSection(allValue)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                section === allValue
                  ? 'bg-orange-500 text-white'
                  : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
              }`}
            >
              {messages.all}
            </button>
            {sectionOptions.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSection(key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  section === key
                    ? 'bg-orange-500 text-white'
                    : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400 mb-2">{messages.countries}</p>
            <div className="flex max-w-full gap-1.5 overflow-x-auto pb-1">
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
                  {optionLabel(item)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400 mb-2">{messages.difficulty}</p>
          <div className="flex flex-wrap gap-1.5">
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
                {optionLabel(d)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
        <span className="text-xs text-gray-400">{count} / {totalCount || count} {messages.recipes}</span>
        <span className="text-xs text-gray-400">TasteMaster365</span>
      </div>
    </div>
  );
}
