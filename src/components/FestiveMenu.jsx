import { useMemo, useState } from 'react';
import MENU from '../data/praznichno-menu.json';
import LENTEN from '../data/postno-menu.json';
// Title, time and a small photo per dish (scripts/build-festive-cards.mjs and
// scripts/build-menu-cards.mjs), so the menu shows before the catalog has loaded.
import CARDS from '../data/praznichno-menu-cards.json';
import LENTEN_CARDS from '../data/postno-menu-cards.json';
import { DishCard, ShoppingList } from './LentenMenu';

// "Празнично меню": Christmas Eve (the nine Lenten dishes), Christmas and New Year, with a
// day-by-day plan and shopping lists. Same access rules as the Lenten menu: everyone sees
// the plan, recipes open for Premium and trial accounts. Bulgarian only.
export const FESTIVE_PARAM = 'praznichno';
const CHECKS_KEY = 'tm-praznichno-menu-checks';
const ALL_CARDS = { ...LENTEN_CARDS, ...CARDS };

function tabContent(tab) {
  if (!tab.fromLenten) return tab;
  return {
    ...tab,
    dishes: LENTEN.badni.dishes.map((id, index) => ({ label: `Ястие ${index + 1}`, id })),
    shopping: LENTEN.badni.shopping,
  };
}

export default function FestiveMenu({
  recipes, unlocked, onOpenRecipe, onTrial, onBack, initialTab = 0,
}) {
  const [tabIndex, setTabIndex] = useState(initialTab);
  const byId = useMemo(() => new Map(recipes.map((recipe) => [recipe.id, recipe])), [recipes]);
  const tab = tabContent(MENU.tabs[tabIndex]);
  const open = (id) => {
    const recipe = byId.get(id) || { id, ...ALL_CARDS[id] };
    return unlocked ? onOpenRecipe(recipe) : onTrial(recipe);
  };

  return (
    <section aria-labelledby="praznichno-menu-title">
      <button type="button" onClick={onBack} className="text-sm text-primary-700 hover:underline">← Всички рецепти</button>

      <div className="mt-3 bg-[#7f1d1d] px-5 py-6 text-[#fffaf2] sm:px-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#fcd34d]">24 декември · 25 декември · 31 декември</p>
        <h1 id="praznichno-menu-title" className="mt-2 font-serif text-3xl font-bold leading-tight">
          Празнично меню <i className="text-[#fcd34d]">за Коледа и Нова година</i>
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#fde2e2]">
          Бъдни вечер, коледна трапеза и новогодишна вечеря за 6 до 8 души. План какво да сготвиш по дни
          и списъци за пазаруване с количества.
        </p>
        {!unlocked && (
          <button type="button" onClick={() => onTrial(null)} className="mt-4 bg-orange-600 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-700">
            Започни 7 дни безплатно, без карта
          </button>
        )}
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Празници">
        {MENU.tabs.map((item, index) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={tabIndex === index}
            onClick={() => setTabIndex(index)}
            className={`whitespace-nowrap border px-3 py-1.5 text-sm ${tabIndex === index ? 'border-[#7f1d1d] bg-[#7f1d1d] text-white' : 'border-stone-300 bg-white text-stone-700 hover:border-primary-400'}`}
          >
            {item.label} <span className="opacity-70">· {item.date}</span>
          </button>
        ))}
      </div>

      <p className="mt-4 max-w-3xl text-sm leading-6 text-stone-700">{tab.intro}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tab.dishes.map(({ label, id }) => {
          const card = ALL_CARDS[id];
          const recipe = card ? { id, ...card } : null;
          return <DishCard key={id} label={label} recipe={recipe} locked={!unlocked} onOpen={open} />;
        })}
      </div>

      {tab.plan && (
        <>
          <h2 className="mt-8 font-serif text-xl font-bold text-[#144547]">Какво кога да приготвиш</h2>
          <ol className="mt-3 grid gap-3 sm:grid-cols-2">
            {tab.plan.map((step) => (
              <li key={step.when} className="border border-stone-200 border-l-4 border-l-[#7f1d1d] bg-white p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7f1d1d]">{step.when}</p>
                <ul className="mt-2 space-y-1 text-sm leading-6 text-stone-700">
                  {step.items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </li>
            ))}
          </ol>
        </>
      )}

      <h2 className="mt-8 font-serif text-xl font-bold text-[#144547]">
        Списък за пазаруване · {tab.label}
      </h2>
      <ShoppingList
        key={tab.key}
        tabIndex={tab.key}
        list={tab.shopping}
        unlocked={unlocked}
        onTrial={() => onTrial(null)}
        storageKey={CHECKS_KEY}
      />
    </section>
  );
}
