import { useState } from 'react';
import { FREE_RECIPE_LIMIT } from '../hooks/useFreemiumAccess';
import { track } from '../track';

const PLANS = {
  monthly: { price: '€4.99', periodKey: 'perMonth' },
  yearly: { price: '€29.99', periodKey: 'perYear', monthlyEquivalent: '€2.50' },
};

const fill = (template, values) => template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');

export default function PremiumGate({
  onClose,
  authenticated,
  onLoginRequest,
  onSubscribe,
  onManageBilling,
  premium,
  consumptionOnly,
  trialEligible,
  recipe,
  loading,
  error,
  messages,
}) {
  const [plan, setPlan] = useState('yearly');
  const selected = PLANS[plan];
  const priceLabel = `${selected.price} ${messages[selected.periodKey]}`;
  const teaser = recipe?.teaserIngredients || [];
  const moreIngredients = Math.max((recipe?.ingredientCount || 0) - teaser.length, 0);

  const choosePlan = (next) => {
    setPlan(next);
    track(next === 'yearly' ? 'plan_yearly' : 'plan_monthly');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-stone-950/55 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="premium-title"
        className="my-auto w-full max-w-md border border-orange-200 bg-[#fffaf2] p-7 shadow-2xl"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-600">
          TasteMaster365 Premium
        </p>
        <h2 id="premium-title" className="mt-3 text-2xl font-semibold text-stone-900">
          {premium ? messages.premiumActive : consumptionOnly ? messages.playAccessTitle : messages.unlockTitle}
        </h2>

        {!premium && !consumptionOnly && teaser.length > 0 && (
          <div className="mt-5 flex gap-4 border border-orange-100 bg-white p-3">
            {recipe.image && (
              <img
                src={recipe.image}
                alt=""
                onError={(event) => { event.currentTarget.hidden = true; }}
                className="h-20 w-20 flex-none object-cover"
              />
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-snug text-stone-900">{recipe.title}</p>
              <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-stone-400">{messages.teaserTitle}</p>
              <ul className="mt-1 space-y-0.5 text-xs text-stone-600">
                {teaser.map((item) => <li key={item}>• {item}</li>)}
              </ul>
              <p className="mt-1.5 text-xs font-medium text-orange-700">
                {fill(messages.teaserMore, { ingredients: moreIngredients, steps: recipe.stepCount || 0 })}
              </p>
            </div>
          </div>
        )}

        <p className="mt-4 text-sm leading-6 text-stone-600">
          {consumptionOnly
            ? messages.playAccessCopy
            : `${FREE_RECIPE_LIMIT} ${messages.recipes}. ${messages.premiumCopy}`}
        </p>

        {!premium && !consumptionOnly && (
          <div className="mt-5 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Premium">
            {Object.entries(PLANS).map(([key, option]) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={plan === key}
                onClick={() => choosePlan(key)}
                className={`relative border p-3 text-left transition-colors ${
                  plan === key ? 'border-orange-500 bg-white ring-1 ring-orange-500' : 'border-stone-200 bg-white/60 hover:border-orange-300'
                }`}
              >
                {key === 'yearly' && (
                  <span className="absolute -top-2.5 right-2 bg-orange-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    {messages.save}
                  </span>
                )}
                <span className="block text-xs text-stone-500">{key === 'yearly' ? messages.planYearly : messages.planMonthly}</span>
                <strong className="mt-1 block text-lg text-stone-900">{option.price}</strong>
                <span className="block text-[11px] text-stone-500">
                  {option.monthlyEquivalent
                    ? fill(messages.yearlyEquivalent, { price: option.monthlyEquivalent })
                    : messages[option.periodKey]}
                </span>
              </button>
            ))}
          </div>
        )}

        {!premium && !consumptionOnly && (
          <p className="mt-3 text-xs leading-5 text-stone-500">
            {trialEligible ? `${fill(messages.trialNote, { price: priceLabel })} ` : ''}
            {messages.cancelAnytime}
          </p>
        )}

        {error ? <p className="mt-4 text-sm text-red-700" role="alert">{error}</p> : null}

        {premium && !consumptionOnly ? (
          <button
            type="button"
            onClick={onManageBilling}
            disabled={loading}
            className="mt-6 w-full bg-stone-900 px-4 py-3 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-60"
          >
            {messages.manage}
          </button>
        ) : !consumptionOnly && authenticated ? (
          <button
            type="button"
            onClick={() => onSubscribe(plan)}
            disabled={loading}
            className="mt-6 w-full bg-orange-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-700 disabled:opacity-60"
          >
            {loading ? messages.wait : trialEligible ? messages.trialCta : messages.unlock}
          </button>
        ) : !authenticated ? (
          <button
            type="button"
            onClick={onLoginRequest}
            disabled={loading}
            className="mt-6 w-full bg-orange-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-700 disabled:opacity-60"
          >
            {consumptionOnly ? messages.login : messages.trialCta}
          </button>
        ) : null}

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
