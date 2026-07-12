const DIFFICULTY_COLORS = {
  'Лесно': 'bg-green-100 text-green-700',
  'Средно': 'bg-yellow-100 text-yellow-700',
  'Трудно': 'bg-red-100 text-red-700',
};

const CATEGORY_ICONS = {
  'Основно ястие': '🍽️',
  'Салата': '🥗',
  'Супа': '🍲',
  'Десерт': '🍰',
  'Закуска': '🥐',
  'Предястие': '🫙',
};

export default function RecipeCard({ recipe, onClick, onDelete, canEdit, locked = false }) {
  const icon = CATEGORY_ICONS[recipe.category] || '🍴';
  const badges = [
    recipe.isGlutenFree && 'без глутен',
    recipe.isDairyFree && 'без млечни',
    recipe.isMeatFree && 'без месо',
    recipe.isPlantBased && 'растително',
  ].filter(Boolean).slice(0, 3);

  return (
    <div
      className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
      onClick={onClick}
    >
      <div className="relative h-44 bg-gradient-to-br from-primary-100 to-orange-50 flex items-center justify-center overflow-hidden">
        {recipe.image ? (
          <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
        ) : (
          <div className="text-center px-4">
            <span className="block text-xs uppercase tracking-[0.22em] text-primary-700/70 mb-2">очаква снимка</span>
            <span className="block text-5xl opacity-50">{icon}</span>
          </div>
        )}
        {locked && (
          <div className="absolute inset-0 flex items-center justify-center bg-stone-950/45 backdrop-blur-[1px]">
            <span className="border border-white/70 bg-stone-950/60 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
              Premium
            </span>
          </div>
        )}
        {canEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(recipe.id); }}
            className="absolute top-2 right-2 bg-white/80 hover:bg-red-500 hover:text-white text-gray-500 rounded-full w-7 h-7 flex items-center justify-center text-xs transition-colors opacity-0 group-hover:opacity-100"
            title="Изтрий"
          >
            🗑
          </button>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-gray-800 text-base leading-snug">{recipe.title}</h3>
        </div>

        {recipe.description && (
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">{recipe.description}</p>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIFFICULTY_COLORS[recipe.difficulty] || 'bg-gray-100 text-gray-600'}`}>
            {recipe.difficulty}
          </span>
          <span className="text-xs text-gray-400">⏱ {recipe.time} мин</span>
          <span className="text-xs text-gray-400">👤 {recipe.servings} порции</span>
          {recipe.country && (
            <span className="text-xs text-gray-400">{recipe.country}</span>
          )}
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">
            {icon} {recipe.category}
          </span>
          {badges.map((badge) => (
            <span key={badge} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
              {badge}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
