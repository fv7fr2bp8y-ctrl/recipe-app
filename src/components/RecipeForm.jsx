import { useState, useRef } from 'react';
import DrivePhotoPicker from './DrivePhotoPicker';

const CATEGORIES = ['Основно ястие', 'Салата', 'Супа', 'Десерт', 'Закуска', 'Предястие'];
const DIFFICULTIES = ['Лесно', 'Средно', 'Трудно'];

const empty = {
  title: '', category: 'Основно ястие', difficulty: 'Средно',
  time: '', servings: '', description: '', ingredients: [''], steps: [''], image: null,
};

export default function RecipeForm({ recipe, onSave, onClose, uploadImage, uploading, driveConnected, listDrivePhotos }) {
  const [form, setForm] = useState(recipe ? { ...recipe, ingredients: [...recipe.ingredients], steps: [...recipe.steps] } : empty);
  const [errors, setErrors] = useState({});
  const [showDrivePicker, setShowDrivePicker] = useState(false);
  const fileRef = useRef();

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const setListItem = (field, idx, value) => {
    setForm((f) => {
      const arr = [...f[field]];
      arr[idx] = value;
      return { ...f, [field]: arr };
    });
  };

  const addListItem = (field) => setForm((f) => ({ ...f, [field]: [...f[field], ''] }));

  const removeListItem = (field, idx) => {
    setForm((f) => {
      const arr = f[field].filter((_, i) => i !== idx);
      return { ...f, [field]: arr.length ? arr : [''] };
    });
  };

  const handleImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (driveConnected && uploadImage) {
      const url = await uploadImage(file);
      if (url) set('image', url);
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => set('image', ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Задължително поле';
    if (!form.time || isNaN(form.time) || form.time <= 0) errs.time = 'Въведете валидно време';
    if (!form.servings || isNaN(form.servings) || form.servings <= 0) errs.servings = 'Въведете брой порции';
    if (!form.ingredients.some((i) => i.trim())) errs.ingredients = 'Добавете поне 1 съставка';
    if (!form.steps.some((s) => s.trim())) errs.steps = 'Добавете поне 1 стъпка';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      ...form,
      time: Number(form.time),
      servings: Number(form.servings),
      ingredients: form.ingredients.filter((i) => i.trim()),
      steps: form.steps.filter((s) => s.trim()),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-6">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl mx-4 my-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-gray-800">{recipe ? 'Редактиране на рецепта' : 'Нова рецепта'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Image */}
          <div>
            <div
              className="relative h-36 bg-orange-50 rounded-xl border-2 border-dashed border-primary-200 flex items-center justify-center cursor-pointer hover:bg-orange-100 transition-colors overflow-hidden"
              onClick={() => !uploading && fileRef.current.click()}
            >
              {uploading ? (
                <div className="text-center">
                  <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-gray-400 mt-2">Качва се в Drive...</p>
                </div>
              ) : form.image ? (
                <>
                  <img src={form.image} alt="" className="w-full h-full object-cover rounded-xl" />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); set('image', null); }}
                    className="absolute top-2 right-2 bg-white/80 rounded-full w-6 h-6 flex items-center justify-center text-xs text-gray-600 hover:bg-red-500 hover:text-white"
                  >
                    ✕
                  </button>
                </>
              ) : (
                <div className="text-center">
                  <span className="text-2xl">{driveConnected ? '☁️' : '📷'}</span>
                  <p className="text-xs text-gray-400 mt-1">
                    {driveConnected ? 'Качи в Google Drive' : 'Добавете снимка'}
                  </p>
                </div>
              )}
            </div>
            {driveConnected && (
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-xs text-green-600">✓ Снимката ще се запази в Google Drive</p>
                <button
                  type="button"
                  onClick={() => setShowDrivePicker(true)}
                  className="text-xs text-primary-600 hover:underline flex items-center gap-1"
                >
                  ☁️ Избери от Drive
                </button>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} />

          {showDrivePicker && (
            <DrivePhotoPicker
              listDrivePhotos={listDrivePhotos}
              onSelect={(url) => set('image', url)}
              onClose={() => setShowDrivePicker(false)}
            />
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Заглавие *</label>
            <input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Напр. Мусака"
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 ${errors.title ? 'border-red-400' : 'border-gray-200'}`}
            />
            {errors.title && <p className="text-red-500 text-xs mt-0.5">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={2}
              placeholder="Кратко описание..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
            />
          </div>

          {/* Category + Difficulty */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
              <select
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white"
              >
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Трудност</label>
              <select
                value={form.difficulty}
                onChange={(e) => set('difficulty', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white"
              >
                {DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {/* Time + Servings */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Време (минути) *</label>
              <input
                type="number" min="1"
                value={form.time}
                onChange={(e) => set('time', e.target.value)}
                placeholder="30"
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 ${errors.time ? 'border-red-400' : 'border-gray-200'}`}
              />
              {errors.time && <p className="text-red-500 text-xs mt-0.5">{errors.time}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Порции *</label>
              <input
                type="number" min="1"
                value={form.servings}
                onChange={(e) => set('servings', e.target.value)}
                placeholder="4"
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 ${errors.servings ? 'border-red-400' : 'border-gray-200'}`}
              />
              {errors.servings && <p className="text-red-500 text-xs mt-0.5">{errors.servings}</p>}
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Съставки *</label>
            {form.ingredients.map((ing, idx) => (
              <div key={idx} className="flex gap-2 mb-1.5">
                <input
                  value={ing}
                  onChange={(e) => setListItem('ingredients', idx, e.target.value)}
                  placeholder={`Съставка ${idx + 1}`}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
                <button type="button" onClick={() => removeListItem('ingredients', idx)} className="text-gray-300 hover:text-red-400 transition-colors px-1">✕</button>
              </div>
            ))}
            {errors.ingredients && <p className="text-red-500 text-xs mb-1">{errors.ingredients}</p>}
            <button type="button" onClick={() => addListItem('ingredients')} className="text-primary-600 text-xs hover:underline">+ Добави съставка</button>
          </div>

          {/* Steps */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Стъпки на приготвяне *</label>
            {form.steps.map((step, idx) => (
              <div key={idx} className="flex gap-2 mb-1.5">
                <span className="text-xs text-gray-400 mt-2 min-w-[18px]">{idx + 1}.</span>
                <textarea
                  value={step}
                  onChange={(e) => setListItem('steps', idx, e.target.value)}
                  placeholder={`Стъпка ${idx + 1}`}
                  rows={2}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
                />
                <button type="button" onClick={() => removeListItem('steps', idx)} className="text-gray-300 hover:text-red-400 transition-colors px-1 mt-1">✕</button>
              </div>
            ))}
            {errors.steps && <p className="text-red-500 text-xs mb-1">{errors.steps}</p>}
            <button type="button" onClick={() => addListItem('steps')} className="text-primary-600 text-xs hover:underline">+ Добави стъпка</button>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              Отказ
            </button>
            <button type="submit" className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
              {recipe ? 'Запази промените' : 'Създай рецепта'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
