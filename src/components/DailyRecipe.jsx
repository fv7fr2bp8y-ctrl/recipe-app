export default function DailyRecipe({ recipe, onOpen, locked }) {
  if (!recipe) return null;

  return (
    <section className="mb-6 overflow-hidden rounded-lg border border-orange-200 bg-white shadow-sm">
      <div className="grid min-h-64 md:grid-cols-[1.15fr_0.85fr]">
        <div className="relative min-h-56 bg-stone-100">
          {recipe.image ? (
            <img
              src={recipe.image}
              alt={recipe.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-stone-400">
              Снимката се подготвя
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center p-6 md:p-8">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-600">
            Рецепта на деня
          </p>
          <h2 className="text-2xl font-semibold leading-tight text-stone-900 md:text-3xl">
            {recipe.title}
          </h2>
          {recipe.description && (
            <p className="mt-3 text-sm leading-6 text-stone-600">{recipe.description}</p>
          )}
          <button
            type="button"
            onClick={() => onOpen(recipe)}
            className="mt-6 w-fit border border-orange-500 px-5 py-2.5 text-sm font-semibold text-orange-700 transition-colors hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
          >
            {locked ? 'Виж Premium' : 'Отвори рецептата'}
          </button>
        </div>
      </div>
    </section>
  );
}
