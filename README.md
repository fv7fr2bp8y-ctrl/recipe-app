# 🍳 TASTEMASTER — Recipe Atelier

Лично приложение за управление на рецепти, достъпно на [tastemaster.eu](https://tastemaster.eu).

Изградено с React + Vite и Tailwind CSS. Рецептите се съхраняват в Google Drive и се публикуват автоматично при всеки деплой.

---

## Функционалности

- Преглед на рецепти с търсене по заглавие, съставки и описание
- Филтриране по категория и трудност
- Детайлен изглед на всяка рецепта
- Admin режим — добавяне, редактиране и изтриване на рецепти
- Качване на снимки в Google Drive
- Избор на снимка от фото галерия
- Автоматично синхронизиране с Google Drive при вход като admin

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

### Потребители (без вход)
Виждат рецептите от `public/recipes.json` — файл, генериран автоматично при всеки деплой от Google Drive чрез Google Apps Script.

### Admin (с Google вход)
- Влиза с Google акаунт
- Рецептите се зареждат директно от Google Drive
- Промените се записват автоматично в Drive (debounce 1.5s)
- Може да добавя, редактира и изтрива рецепти
- Снимките се качват в папка "Recipe App Photos" в Drive и стават публично достъпни

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

1. Изтегля актуалните рецепти и снимки от Google Drive (Apps Script)
2. Build с `vite build`
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
