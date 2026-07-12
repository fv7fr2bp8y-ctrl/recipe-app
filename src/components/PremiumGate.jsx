import { FREE_RECIPE_LIMIT } from '../hooks/useFreemiumAccess';

export default function PremiumGate({ onClose }) {
  const paymentLink = import.meta.env.VITE_STRIPE_PAYMENT_LINK;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/55 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="premium-title"
        className="w-full max-w-md border border-orange-200 bg-[#fffaf2] p-7 shadow-2xl"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-600">
          TasteMaster365 Premium
        </p>
        <h2 id="premium-title" className="mt-3 text-2xl font-semibold text-stone-900">
          Продължи с целия каталог
        </h2>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          Разгледа своите {FREE_RECIPE_LIMIT} безплатни рецепти. Premium отключва всички рецепти,
          хранителни режими, държави и новата рецепта на деня.
        </p>
        <div className="mt-6 border-y border-orange-200 py-4 text-sm text-stone-700">
          Плащането ще бъде активирано чрез защитена Stripe страница.
        </div>
        {paymentLink ? (
          <a
            href={paymentLink}
            className="mt-6 block w-full bg-orange-600 px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
          >
            Отключи TasteMaster365
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="mt-6 w-full cursor-not-allowed bg-stone-300 px-4 py-3 text-sm font-semibold text-stone-600"
          >
            Плащането се подготвя
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full px-4 py-2 text-sm text-stone-500 hover:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
        >
          Назад към каталога
        </button>
      </div>
    </div>
  );
}
