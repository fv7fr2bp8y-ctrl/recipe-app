import { promoCopy } from '../promo';

// Black Friday strip above the header. App.jsx shows it only while promoActive() is true,
// so it disappears on its own after 30 November.
export default function PromoBar({ language, onTake }) {
  const copy = promoCopy(language);
  return (
    <div className="bg-stone-950 text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 py-2.5 text-center text-sm">
        <p className="leading-snug">{copy.banner}</p>
        <button
          type="button"
          onClick={onTake}
          className="whitespace-nowrap bg-orange-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
        >
          {copy.bannerButton}
        </button>
      </div>
    </div>
  );
}
