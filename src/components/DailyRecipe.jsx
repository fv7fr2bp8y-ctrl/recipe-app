import { Share2 } from 'lucide-react';

export default function DailyRecipe({ recipe, onOpen, onShare, locked, language, messages }) {
  if (!recipe) return null;
  const now = new Date();
  const day = new Intl.DateTimeFormat(language, { day: 'numeric' }).format(now);
  const month = new Intl.DateTimeFormat(language, { month: 'short' }).format(now).replace('.', '');

  return (
    <section className="mb-6 overflow-hidden border border-orange-200 bg-white shadow-sm">
      <div className="grid md:grid-cols-[1.2fr_0.8fr]">
        <div className="relative aspect-[4/3] bg-stone-100 md:aspect-auto md:min-h-[390px]">
          {recipe.image ? (
            <img src={recipe.image} alt={recipe.title} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-stone-400">{messages.imagePending}</div>
          )}
          <div className="absolute left-4 top-4 min-w-16 border border-orange-300 bg-[#fffaf2]/95 px-3 py-2 text-center shadow-sm backdrop-blur-sm">
            <span className="block font-serif text-2xl leading-none text-stone-900">{day}</span>
            <span className="mt-1 block text-[10px] uppercase tracking-[0.2em] text-orange-700">{month}</span>
          </div>
          <button
            type="button"
            onClick={(event) => { event.stopPropagation(); onShare(recipe); }}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center border border-orange-300 bg-[#fffaf2]/95 text-orange-800 shadow-sm backdrop-blur-sm hover:bg-white"
            aria-label={messages.share}
          >
            <Share2 size={18} strokeWidth={1.5} />
          </button>
        </div>
        <div className="flex flex-col justify-center p-6 md:p-9">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-600">{messages.daily}</p>
          <h2 className="font-serif text-3xl font-semibold leading-tight text-stone-900 md:text-4xl">{recipe.title}</h2>
          {recipe.description && <p className="mt-4 text-sm leading-6 text-stone-600">{recipe.description}</p>}
          <button type="button" onClick={() => onOpen(recipe)} className="mt-7 w-fit border border-orange-500 px-5 py-2.5 text-sm font-semibold text-orange-700 hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400">
            {locked ? messages.premium : messages.open}
          </button>
        </div>
      </div>
    </section>
  );
}
