# TasteMaster365 — Recipe Atelier

Лично приложение за управление на рецепти, достъпно на [tastemaster.eu](https://tastemaster.eu).

Изградено с React + Vite и Tailwind CSS. Публичният каталог чете основно от Google Sheet master таблицата `FreeFrom365_All_Apps_Master`, а `public/recipes.json` остава legacy fallback.

---

## Функционалности

- Преглед на всички curated рецепти от master таблицата
- Търсене по заглавие, съставки, описание, държава и тагове
- Филтриране по каталог, държава, трудност и режими: без глутен, без млечни, без месо, растително, Healthy Gut
- Детайлен изглед на всяка рецепта
- Рецепта на деня с постоянен избор за текущата UTC дата
- Freemium достъп до 12 различни рецепти на браузър и Premium paywall след лимита
- Admin режим — добавяне, редактиране и изтриване на рецепти
- Качване на снимки в Google Drive
- Избор на снимка от фото галерия
- Рецептите се публикуват от Google Sheet master таблицата; `public/recipes.json` се ползва само като fallback

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
- [Google OAuth (@react-oauth/google)](https://github.com/MomenSherif/react-oauth-google)
- [Google Drive API v3](https://developers.google.com/drive/api/v3/about-sdk)
- Vercel

---

## Как работи

### Източник на истината — Google Sheet master таблицата
Основният публичен каталог чете CSV export от `FreeFrom365_All_Apps_Master` / таб `Master_Recipes`.

Минималните важни колони са: `global_id`, `canonical_name_bg`, `app_primary`, `meal_type`, `time_min`, `tag`, `description_bg`, `ingredients_bg`, `steps_bg`, `image_url`, `image_drive_id`, `image_status`, `status`, `recipe_quality`, `is_breakfast`, `is_healthy_gut`, `is_gluten_free`, `is_dairy_free`, `is_meat_free`, `is_plant_based`.

Препоръчани нови колони за държави: `country_bg` и по желание `region_bg`. Кодът вече ги поддържа. Докато липсват, сайтът извлича държава от името, таговете и prompt-а.

TasteMaster показва всички `status=ready` + `recipe_quality=curated` рецепти, включително тези без снимка. При липсваща снимка се показва чист placeholder.

Снимките се хостват в Google Drive (папка "Recipe App Photos", публично достъпни) и се реферират в `image` като `https://drive.google.com/thumbnail?id=<FILE_ID>&sz=w800`.

### Потребители (без вход)
Виждат curated рецептите от master таблицата. Ако таблицата не се зареди, сайтът пада към legacy fallback.

### Admin (с Google вход)
- Влиза с Google акаунт
- Качва снимки в папка "Recipe App Photos" (стават публично достъпни)
- Може да редактира legacy/локални рецепти в текущата сесия. Master таблицата остава основният източник за публичния каталог.

---

## Локална разработка

```bash
npm install
npm run dev
```

Нужни environment variables (`.env.local`):

```env
VITE_GOOGLE_CLIENT_ID=...
VITE_GOOGLE_API_KEY=...
VITE_PHOTOS_SCRIPT_URL=...
VITE_ADMIN_EMAIL=...
VITE_STRIPE_PAYMENT_LINK=https://buy.stripe.com/...
```

### Premium достъп

Текущият интерфейс пази 12-те разгледани рецепти в `localStorage`, не заключва администратора и отваря Stripe Payment Link, когато `VITE_STRIPE_PAYMENT_LINK` е зададен. Това е завършен UX слой, но не е достатъчен като самостоятелна защита на платено съдържание.

Преди платеното пускане рецептите трябва да се сервират през защитен API след проверена потребителска сесия и активна Stripe покупка/абонамент. Stripe webhook трябва да записва entitlement на сървъра; клиентът не трябва сам да активира Premium.

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
│   ├── Header.jsx           # Навигация, Google Auth, бутон за нова рецепта
│   ├── SearchBar.jsx        # Търсене и филтри
│   ├── RecipeCard.jsx       # Карта за рецепта в грида
│   ├── RecipeDetail.jsx     # Модален детайлен изглед
│   ├── RecipeForm.jsx       # Форма за добавяне/редактиране
│   ├── DrivePhotoPicker.jsx # Избор на снимка от галерия
│   └── GoogleAuthButton.jsx # Бутон за Google OAuth
└── hooks/
    ├── useRecipes.js        # CRUD + localStorage + fetch от recipes.json
    └── useGoogleDrive.js    # OAuth, upload, Drive sync
```
