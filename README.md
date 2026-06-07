# 🍳 TASTEMASTER — Recipe Atelier

Лично приложение за управление на рецепти, достъпно на [tastemaster.eu](https://tastemaster.eu).

Изградено с React + Vite и Tailwind CSS. Рецептите се съхраняват във файла `public/recipes.json` в това repo и се публикуват при всеки деплой.

---

## Функционалности

- Преглед на рецепти с търсене по заглавие, съставки и описание
- Филтриране по категория и трудност
- Детайлен изглед на всяка рецепта
- Admin режим — добавяне, редактиране и изтриване на рецепти
- Качване на снимки в Google Drive
- Избор на снимка от фото галерия
- Рецептите се публикуват от `public/recipes.json` (виж "Как работи")

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
- GitHub Pages

---

## Как работи

### Източник на истината — `public/recipes.json`
Рецептите живеят във файла `public/recipes.json`, който е комитнат в repo-то. Това е единственият източник за публичния сайт. За да добавиш, промениш или премахнеш рецепта (или да оправиш снимка), редактирай този файл и push-ни в `main` — деплоят се случва автоматично.

Всяка рецепта има полета: `id`, `title`, `category`, `difficulty`, `time`, `servings`, `description`, `ingredients` (масив), `steps` (масив), `image` (URL или `null`), `createdAt`.

> Рецепти без снимка (`image: null`) не се показват в списъка на сайта.

Снимките се хостват в Google Drive (папка "Recipe App Photos", публично достъпни) и се реферират в `image` като `https://drive.google.com/thumbnail?id=<FILE_ID>&sz=w800`.

### Потребители (без вход)
Виждат рецептите от `public/recipes.json`.

### Admin (с Google вход)
- Влиза с Google акаунт
- Качва снимки в папка "Recipe App Photos" (стават публично достъпни)
- Може да редактира рецепти в текущата сесия (preview); за публикуване промяната трябва да влезе в `public/recipes.json` и да се push-не в `main`.

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
```

---

## Деплой

Деплоят се случва автоматично при push в `main` чрез GitHub Actions:

1. Изтегля актуалните снимки от Google Drive (Apps Script) → `public/photos.json` (за галерията при admin)
2. Build с `vite build` (използва комитнатия `public/recipes.json`)
3. Публикува в `gh-pages` клон → [tastemaster.eu](https://tastemaster.eu)

```bash
# Ръчен деплой (ако е нужен)
npm run build
npm run deploy
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
