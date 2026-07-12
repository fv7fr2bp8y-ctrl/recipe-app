import { Share2, X } from 'lucide-react';

const DIFFICULTY_COLORS = {
  'Лесно': 'bg-green-100 text-green-700',
  'Средно': 'bg-yellow-100 text-yellow-700',
  'Трудно': 'bg-red-100 text-red-700',
};

export default function RecipeDetail({ recipe, onClose, onShare, messages }) {
  const badges = [
    recipe.diets?.glutenFree && messages.glutenFree,
    recipe.diets?.dairyFree && messages.dairyFree,
    recipe.diets?.meatFree && messages.meatFree,
    recipe.diets?.plantBased && messages.plantBased,
    recipe.diets?.healthyGut && messages.healthyGut,
  ].filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 py-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="my-auto mx-4 w-full max-w-xl overflow-hidden bg-white shadow-xl">
        <div className="relative aspect-[4/3] bg-stone-100">
          {recipe.image ? <img src={recipe.image} alt={recipe.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.2em] text-stone-400">{messages.imagePending}</div>}
          <div className="absolute right-3 top-3 flex gap-2">
            <button type="button" onClick={() => onShare(recipe)} className="flex h-10 w-10 items-center justify-center bg-white/95 text-stone-700 shadow" aria-label={messages.share}><Share2 size={18} strokeWidth={1.5} /></button>
            <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center bg-white/95 text-stone-700 shadow" aria-label="Close"><X size={20} strokeWidth={1.5} /></button>
          </div>
        </div>

        <div className="p-6">
          <h2 className="font-serif text-3xl font-semibold leading-tight text-stone-900">{recipe.title}</h2>
          {recipe.description && <p className="mt-3 text-sm leading-6 text-stone-600">{recipe.description}</p>}
          <div className="my-5 flex flex-wrap gap-2">
            <span className={`px-3 py-1 text-xs font-medium ${DIFFICULTY_COLORS[recipe.difficultyKey] || 'bg-gray-100 text-gray-600'}`}>{recipe.difficulty}</span>
            <span className="bg-gray-100 px-3 py-1 text-xs text-gray-600">{recipe.time} {messages.minutes}</span>
            <span className="bg-gray-100 px-3 py-1 text-xs text-gray-600">{recipe.servings} {messages.servings}</span>
            {recipe.country && <span className="bg-stone-100 px-3 py-1 text-xs text-stone-700">{recipe.country}</span>}
            {badges.map((badge) => <span key={badge} className="bg-emerald-50 px-3 py-1 text-xs text-emerald-700">{badge}</span>)}
          </div>

          <section className="mb-6 border-t border-orange-100 pt-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">{messages.ingredients}</h3>
            <ul className="space-y-2">
              {(recipe.ingredients || []).map((ingredient, index) => <li key={`${ingredient}-${index}`} className="flex gap-3 text-sm leading-6 text-stone-700"><span className="mt-2.5 h-1.5 w-1.5 shrink-0 rotate-45 bg-orange-400" />{ingredient}</li>)}
            </ul>
          </section>
          <section className="border-t border-orange-100 pt-5">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">{messages.steps}</h3>
            <ol className="space-y-4">
              {(recipe.steps || []).map((step, index) => <li key={`${step}-${index}`} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center bg-orange-600 text-xs font-bold text-white">{index + 1}</span><p className="text-sm leading-6 text-stone-700">{step}</p></li>)}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
