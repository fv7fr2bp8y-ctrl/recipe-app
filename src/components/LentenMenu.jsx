import { useMemo, useState } from 'react';
import MENU from '../data/postno-menu.json';
// Title, time and a small photo per dish (scripts/build-menu-cards.mjs), so the menu shows
// before the catalog has loaded. The catalog is needed only to open a recipe.
import CARDS from '../data/postno-menu-cards.json';
import { promoActive, promoCopy } from '../promo';

// "Постно меню до Коледа": 4 weeks of Lenten dinners plus Christmas Eve, built from catalog
// recipes. Premium and trial accounts open everything; guests see the plan and every
// recipe leads to the free trial. The menu and shopping lists exist in Bulgarian only.
export const MENU_PARAM = 'postno';
export const MENU_PDF_URL = 'https://drive.google.com/file/d/1Kz2M7-qMpLlIpBf0_bvSvjugX7JEctTw/view';

const DAYS = ['Понеделник', 'Вторник', 'Сряда', 'Четвъртък', 'Петък', 'Събота', 'Неделя'];
const TABS = [...MENU.weeks.map((_, index) => `Седмица ${index + 1}`), 'Бъдни вечер'];
const CHECKS_KEY = 'tm-postno-menu-checks';

function readChecks(storageKey) {
  try { return JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch { return {}; }
}

// The cards keep 300 px thumbnails (so the menu shows before the catalog loads); the big
// card asks for the 600 px copy of the same photo.
export const largePhoto = (url, width = 600) => (url || '')
  .replace(/\/w300\//, `/w${width}/`)
  .replace(/=w300-rj$/, `=w${width}-rj`);

export function DishCard({ label, recipe, locked, onOpen }) {
  if (!recipe) return null;
  return (
    <button
      type="button"
      onClick={() => onOpen(recipe.id)}
      className="group flex w-full flex-col overflow-hidden border border-stone-200 bg-white text-left transition-colors hover:border-primary-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
    >
      <span className="relative block aspect-[3/2] w-full overflow-hidden bg-primary-50">
        {recipe.image && (
          <img
            src={largePhoto(recipe.image)}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        {locked && (
          <span className="absolute right-2 top-2 bg-stone-950/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
            Premium
          </span>
        )}
      </span>
      <span className="block px-3 pb-3 pt-2.5">
        <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-600">{label}</span>
        <span className="mt-1 block font-serif text-base font-semibold leading-snug text-[#144547]">{recipe.title}</span>
        {recipe.time ? <span className="mt-1 block text-xs text-stone-500">{recipe.time} мин.</span> : null}
      </span>
    </button>
  );
}

// Also used by the festive menu, which keeps its ticks under its own storageKey.
export function ShoppingList({
  tabIndex, list, unlocked, onTrial, storageKey = CHECKS_KEY,
}) {
  const [checks, setChecks] = useState(() => readChecks(storageKey));
  const toggle = (key) => {
    setChecks((previous) => {
      const next = { ...previous, [key]: !previous[key] };
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* private mode */ }
      return next;
    });
  };

  if (!unlocked) {
    return (
      <div className="relative mt-3 overflow-hidden border border-stone-200 bg-white p-4">
        <ul className="select-none space-y-1.5 text-sm text-stone-700 blur-[3px]" aria-hidden="true">
          {list.groups[0].items.slice(0, 6).map(([name, amount]) => <li key={name}>☐ {name} · {amount}</li>)}
        </ul>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/60 px-4 text-center">
          <p className="text-sm font-semibold text-[#144547]">Списъкът с количества е в Premium</p>
          <button type="button" onClick={onTrial} className="bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700">
            Започни 7 дни безплатно, без карта
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 grid gap-4 border border-stone-200 bg-white p-4 sm:grid-cols-2">
      {list.groups.map((group) => (
        <div key={group.name}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-700">{group.name}</p>
          <ul className="mt-2 space-y-1">
            {group.items.map(([name, amount]) => {
              // The festive lists repeat a product in several groups, so their ticks include the group.
              const key = storageKey === CHECKS_KEY ? `${tabIndex}:${name}` : `${tabIndex}:${group.name}:${name}`;
              return (
                <li key={name}>
                  <label className="flex cursor-pointer items-baseline gap-2 text-sm text-stone-700">
                    <input type="checkbox" checked={Boolean(checks[key])} onChange={() => toggle(key)} className="accent-primary-600" />
                    <span className={checks[key] ? 'text-stone-400 line-through' : ''}>{name}</span>
                    <span className="ml-auto whitespace-nowrap text-xs text-stone-500">{amount}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      {list.pantry.length > 0 && (
        <div className="sm:col-span-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-700">Провери дали ги имаш вкъщи</p>
          <p className="mt-2 text-sm leading-6 text-stone-600">{list.pantry.join(', ')}</p>
        </div>
      )}
    </div>
  );
}

export default function LentenMenu({
  recipes, unlocked, onOpenRecipe, onTrial, onBack, language,
}) {
  const [tab, setTab] = useState(0);
  const byId = useMemo(() => new Map(recipes.map((recipe) => [recipe.id, recipe])), [recipes]);
  const promo = promoActive();
  const badni = tab === MENU.weeks.length;
  const week = MENU.weeks[tab];
  const dishes = badni
    ? MENU.badni.dishes.map((id, index) => ({ label: `Ястие ${index + 1}`, id }))
    : [...week.days.map((id, index) => ({ label: DAYS[index], id })), { label: 'Десерт на седмицата', id: week.dessert }];
  const list = badni ? MENU.badni.shopping : week.shopping;
  const open = (id) => {
    const recipe = byId.get(id) || { id, ...CARDS[id] };
    return unlocked ? onOpenRecipe(recipe) : onTrial(recipe);
  };

  return (
    <section aria-labelledby="postno-menu-title">
      <button type="button" onClick={onBack} className="text-sm text-primary-700 hover:underline">← Всички рецепти</button>

      <div className="mt-3 bg-[#144547] px-5 py-6 text-[#fffaf2] sm:px-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#fdba74]">Коледни пости · до 24 декември</p>
        <h1 id="postno-menu-title" className="mt-2 font-serif text-3xl font-bold leading-tight">
          Постно меню <i className="text-[#fdba74]">до Коледа</i>
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#cfe5e3]">
          4 седмици по 7 постни вечери и десерт, списъци за пазаруване с количества и 9 ястия за Бъдни вечер.
          Без месо, мляко, яйца и риба.
        </p>
        {unlocked ? (
          <a
            href={MENU_PDF_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block border border-[#fdba74] px-4 py-2 text-sm font-semibold text-[#fdba74] hover:bg-[#fdba74] hover:text-[#144547]"
          >
            Свали за печат (PDF)
          </a>
        ) : (
          <div className="mt-4">
            {promo && <p className="mb-2 text-sm font-semibold text-[#fdba74]">{promoCopy(language).badge}: {promoCopy(language).headline}</p>}
            <button type="button" onClick={() => onTrial(null)} className="bg-orange-600 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-700">
              Започни 7 дни безплатно, без карта
            </button>
          </div>
        )}
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Седмици">
        {TABS.map((label, index) => (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={tab === index}
            onClick={() => setTab(index)}
            className={`whitespace-nowrap border px-3 py-1.5 text-sm ${tab === index ? 'border-[#144547] bg-[#144547] text-white' : 'border-stone-300 bg-white text-stone-700 hover:border-primary-400'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {dishes.map(({ label, id }) => {
          const card = CARDS[id];
          const recipe = card ? { id, ...card } : null;
          return <DishCard key={id} label={label} recipe={recipe} locked={!unlocked} onOpen={open} />;
        })}
      </div>

      <h2 className="mt-8 font-serif text-xl font-bold text-[#144547]">
        Списък за пазаруване · {TABS[tab]}
      </h2>
      <ShoppingList tabIndex={tab} list={list} unlocked={unlocked} onTrial={() => onTrial(null)} />
    </section>
  );
}
