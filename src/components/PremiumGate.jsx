import { FREE_RECIPE_LIMIT } from '../hooks/useFreemiumAccess';

export default function PremiumGate({
  onClose,
  authenticated,
  onLoginRequest,
  onSubscribe,
  onManageBilling,
  premium,
  loading,
  error,
  messages,
}) {
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
          {premium ? messages.premiumActive : messages.unlockTitle}
        </h2>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          {FREE_RECIPE_LIMIT} {messages.recipes}. {messages.premiumCopy}
        </p>
        <div className="mt-6 border-y border-orange-200 py-4">
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-sm text-stone-600">{messages.monthly}</span>
            <strong className="text-xl text-stone-900">€1.99</strong>
          </div>
          <p className="mt-2 text-xs leading-5 text-stone-500">
            {messages.cancelAnytime}
          </p>
        </div>

        {error ? <p className="mt-4 text-sm text-red-700" role="alert">{error}</p> : null}

        {premium ? (
          <button
            type="button"
            onClick={onManageBilling}
            disabled={loading}
            className="mt-6 w-full bg-stone-900 px-4 py-3 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-60"
          >
            {messages.manage}
          </button>
        ) : authenticated ? (
          <button
            type="button"
            onClick={onSubscribe}
            disabled={loading}
            className="mt-6 w-full bg-orange-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-700 disabled:opacity-60"
          >
            {loading ? messages.wait : messages.unlock}
          </button>
        ) : (
          <button
            type="button"
            onClick={onLoginRequest}
            disabled={loading}
            className="mt-6 w-full bg-orange-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-700 disabled:opacity-60"
          >
            {messages.loginOrRegister}
          </button>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full px-4 py-2 text-sm text-stone-500 hover:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
        >
          {messages.backCatalog}
        </button>
      </div>
    </div>
  );
}
