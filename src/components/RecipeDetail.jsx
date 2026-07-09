const DIFFICULTY_COLORS = {
  'Лесно': 'bg-green-100 text-green-700',
  'Средно': 'bg-yellow-100 text-yellow-700',
  'Трудно': 'bg-red-100 text-red-700',
};

export default function RecipeDetail({ recipe, onEdit, onClose, canEdit }) {
  const badges = [
    recipe.isGlutenFree && 'без глутен',
    recipe.isDairyFree && 'без млечни',
    recipe.isMeatFree && 'без месо',
    recipe.isPlantBased && 'растително',
    recipe.isHealthyGut && 'Healthy Gut',
  ].filter(Boolean);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-6">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl mx-4 my-auto">
        {/* Image / Header */}
        <div className="relative">
          {recipe.image ? (
            <img src={recipe.image} alt={recipe.title} className="w-full h-56 object-cover rounded-t-2xl" />
          ) : (
            <div className="h-40 bg-gradient-to-br from-primary-100 to-orange-50 rounded-t-2xl flex items-center justify-center">
              <span className="text-xs uppercase tracking-[0.22em] text-primary-800/60">очаква снимка</span>
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-white/90 hover:bg-white rounded-full w-8 h-8 flex items-center justify-center text-gray-600 shadow"
          >
            ✕
          </button>
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h2 className="text-xl font-bold text-gray-800">{recipe.title}</h2>
            {canEdit && (
              <button
                onClick={onEdit}
                className="text-xs border border-gray-200 text-gray-500 hover:border-primary-400 hover:text-primary-600 px-3 py-1 rounded-lg transition-colors shrink-0"
              >
                ✏️ Редактирай
              </button>
            )}
          </div>

          {recipe.description && (
            <p className="text-sm text-gray-500 mb-4">{recipe.description}</p>
          )}

          {/* Meta */}
          <div className="flex flex-wrap gap-2 mb-5">
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${DIFFICULTY_COLORS[recipe.difficulty] || 'bg-gray-100 text-gray-600'}`}>
              {recipe.difficulty}
            </span>
            <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">⏱ {recipe.time} мин</span>
            <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">👤 {recipe.servings} порции</span>
            <span className="text-xs bg-primary-50 text-primary-700 px-3 py-1 rounded-full">{recipe.category}</span>
            {recipe.country && (
              <span className="text-xs bg-stone-100 text-stone-700 px-3 py-1 rounded-full">{recipe.country}</span>
            )}
            {badges.map((badge) => (
              <span key={badge} className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full">{badge}</span>
            ))}
          </div>

          {/* Ingredients */}
          <section className="mb-5">
            <h3 className="font-semibold text-gray-800 mb-2 text-sm uppercase tracking-wide">Съставки</h3>
            <ul className="space-y-1.5">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0" />
                  {ing}
                </li>
              ))}
            </ul>
          </section>

          {/* Steps */}
          <section>
            <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">Начин на приготвяне</h3>
            <ol className="space-y-3">
              {recipe.steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-primary-500 text-white text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-700 leading-relaxed">{step}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
