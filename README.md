# TasteMaster365 — Recipe Atelier

Лично приложение за управление на рецепти, достъпно на [tastemaster.eu](https://tastemaster.eu).

Изградено с React + Vite, Vercel Functions, Neon Postgres и Stripe. Браузърът вече не чете директно master таблицата: каталогът минава през `/api/recipes`, което връща пълните данни само при проверена Premium сесия.

---

## Функционалности

- 12 пълни безплатни рецепти и заключени previews за останалия каталог
- Търсене по заглавие, съставки, описание, държава и тагове
- Филтриране по каталог, държава, трудност и режими: без глутен, без млечни, без месо, растително, Healthy Gut
- Детайлен изглед на всяка рецепта
- Рецепта на деня с постоянен избор за текущата UTC дата
- Профил с имейл и парола, scrypt password hashing и подписана HttpOnly сесия
- Stripe Checkout абонамент за €1.99 месечно
- Stripe webhook и entitlement, пазен в Postgres
- Stripe Customer Portal за управление и прекратяване на абонамента
- Admin режим — добавяне, редактиране и изтриване на рецепти
- Качване на снимки в Google Drive
- Избор на снимка от фото галерия
- Рецептите се публикуват от Google Sheet master таблицата през server-side API

## Категории

| Категория | Икона |
|-----------|-------|
| Основно ястие | 🍽️ |
| Супа | 🍲 |
| Салата | 🥗 |
| Предястие | 🫙 |
| Закуска | 🥐 |
| Десерт | 🍰 |

---

## Технологии

- [React 19](https://react.dev/)
- [Vite 8](https://vitejs.dev/)
- [Tailwind CSS 3](https://tailwindcss.com/)
- [Google OAuth (@react-oauth/google)](https://github.com/MomenSherif/react-oauth-google) само за администраторския Drive достъп
- [Google Drive API v3](https://developers.google.com/drive/api/v3/about-sdk)
- [Stripe Checkout](https://docs.stripe.com/payments/checkout/build-subscriptions)
- [Neon serverless Postgres](https://neon.tech/docs/serverless/serverless-driver)
- [JOSE](https://github.com/panva/jose) за подписаната сесия
- Vercel

---

## Как работи

### Източник на истината — Google Sheet master таблицата
Vercel функцията `/api/recipes` чете CSV export от `FreeFrom365_All_Apps_Master` / таб `Master_Recipes`. URL адресът на таблицата не се изпраща във frontend bundle-а.

Минималните важни колони са: `global_id`, `canonical_name_bg`, `app_primary`, `meal_type`, `time_min`, `tag`, `description_bg`, `ingredients_bg`, `steps_bg`, `image_url`, `image_drive_id`, `image_status`, `status`, `recipe_quality`, `is_breakfast`, `is_healthy_gut`, `is_gluten_free`, `is_dairy_free`, `is_meat_free`, `is_plant_based`.

Препоръчани нови колони за държави: `country_bg` и по желание `region_bg`. Кодът вече ги поддържа. Докато липсват, сайтът извлича държава от името, таговете и prompt-а.

TasteMaster показва всички `status=ready` + `recipe_quality=curated` рецепти, включително тези без снимка. При липсваща снимка се показва чист placeholder.

Снимките се хостват в Google Drive (папка "Recipe App Photos", публично достъпни) и се реферират в `image` като `https://drive.google.com/thumbnail?id=<FILE_ID>&sz=w800`.

### Достъп

- Без вход: 12 рецепти с пълни съставки и стъпки; останалите са previews без защитените полета.
- С TasteMaster профил, без абонамент: същите 12 рецепти и възможност за Stripe Checkout.
- С активен Stripe абонамент: целият каталог.
- При отмяна или изтекъл абонамент webhook-ът актуализира entitlement-а и каталогът отново се заключва.

Пълният стар `recipes.json` е преместен извън `public/`, за да не заобикаля API проверката.

### Admin (с Google вход)
- Влиза с Google акаунт
- Качва снимки в папка "Recipe App Photos" (стават публично достъпни)
- Може да редактира legacy/локални рецепти в текущата сесия. Master таблицата остава основният източник за публичния каталог.

---

## Локална разработка

```bash
npm install
vercel dev
```

`npm run dev` стартира само Vite и е подходящ за визуална работа; за auth, Stripe и защитения каталог използвай `vercel dev`.

Нужни environment variables (`.env.local`):

```env
VITE_GOOGLE_CLIENT_ID=...
VITE_ADMIN_EMAIL=office@newage-studio.com
APP_URL=https://tastemaster.eu
ADMIN_EMAIL=office@newage-studio.com
DATABASE_URL=postgresql://...
SESSION_SECRET=<случайна стойност с поне 32 байта>
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_1TsOCpDbRc9nb2mVhLaqc9fk
```

### Premium достъп

Premium не се пази в `localStorage`. Паролите се хешират със scrypt и никога не се връщат към браузъра. След вход сървърът издава подписана `HttpOnly`, `Secure`, `SameSite=Lax` сесия. Stripe webhook записва статуса на абонамента в Postgres; `/api/recipes` проверява entitlement-а при всяко зареждане.

#### Stripe Dashboard

1. Product: `TasteMaster365 Premium`.
2. Recurring Price: `€1.99 / month`, Price ID `price_1TsOCpDbRc9nb2mVhLaqc9fk`.
3. Включи Customer Portal с промяна на карта, фактури и отказ в края на периода.
4. Добави webhook endpoint: `https://tastemaster.eu/api/billing/webhook`.
5. Избери събитията:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
6. Копирай signing secret като `STRIPE_WEBHOOK_SECRET` във Vercel. Не поставяй `sk_...` или `whsec_...` във frontend променливи с `VITE_`.

#### Vercel / Neon

1. Създай Neon database от Vercel Marketplace или директно в Neon.
2. Добави `DATABASE_URL` за Production, Preview и Development.
3. Добави останалите server-only стойности от `.env.example`.
4. При първата заявка таблиците `tm_users`, `tm_entitlements` и `tm_stripe_events` се създават автоматично.
5. Google OAuth е нужен само за администраторския Drive импорт. Клиентският вход и Stripe не зависят от него.

---

## Деплой

Деплоят е във Vercel:

1. Build с `vite build`
2. Публикува във Vercel → [tastemaster.eu](https://tastemaster.eu)

```bash
# Ръчен build/deploy (ако е нужен)
npm run build
vercel deploy --prod --yes
```

---

## Структура

```
src/
├── App.jsx                  # Главен компонент, state, логика
├── components/
│   ├── Header.jsx           # Навигация, профил и администраторски инструменти
│   ├── AccountDialog.jsx    # Вход и регистрация с имейл/парола
│   ├── SearchBar.jsx        # Търсене и филтри
│   ├── RecipeCard.jsx       # Карта за рецепта в грида
│   ├── RecipeDetail.jsx     # Модален детайлен изглед
│   ├── RecipeForm.jsx       # Форма за добавяне/редактиране
│   ├── DrivePhotoPicker.jsx # Избор на снимка от галерия
│   └── GoogleAuthButton.jsx # Бутон за Google OAuth
└── hooks/
    ├── useRecipes.js        # защитен fetch от /api/recipes
    ├── useAccount.js        # TasteMaster сесия + Checkout/Portal
    └── useGoogleDrive.js    # OAuth, upload, Drive sync
api/
├── auth/                    # register, login, Google admin session, me, logout
├── billing/                 # checkout, portal, webhook
└── recipes.js               # server-side каталог и paywall
server/                      # DB, Stripe, session и recipe helpers
```
