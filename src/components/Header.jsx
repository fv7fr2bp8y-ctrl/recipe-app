import GoogleAuthButton from './GoogleAuthButton';

export default function Header({ onAdd, driveConnected, onDriveSignIn, onDriveSignOut, driveScopes }) {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🍳</span>
          <div>
            <h1 className="text-xl font-bold text-gray-800 leading-none">Моите Рецепти</h1>
            <p className="text-xs text-gray-500">Кулинарна колекция</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <GoogleAuthButton
            isConnected={driveConnected}
            onSignIn={onDriveSignIn}
            onSignOut={onDriveSignOut}
            scopes={driveScopes}
          />
          <button
            onClick={onAdd}
            className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
          >
            <span className="text-lg leading-none">+</span>
            Нова рецепта
          </button>
        </div>
      </div>
    </header>
  );
}
