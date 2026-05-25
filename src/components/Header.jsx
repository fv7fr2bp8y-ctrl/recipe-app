import GoogleAuthButton from './GoogleAuthButton';

export default function Header({ onAdd, driveConnected, onDriveSignIn, onDriveSignOut, driveScopes, syncing, isAdmin }) {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🍳</span>
          <div>
            <h1 className="text-xl font-bold text-gray-800 leading-none tracking-wider">TASTEMASTER</h1>
            <p className="text-xs text-gray-500 tracking-wide">Recipe Atelier</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {syncing && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <span className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin inline-block" />
              Sync...
            </span>
          )}
          <GoogleAuthButton
            isConnected={driveConnected}
            onSignIn={onDriveSignIn}
            onSignOut={onDriveSignOut}
            scopes={driveScopes}
          />
          {isAdmin && (
            <button
              onClick={onAdd}
              className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
            >
              <span className="text-lg leading-none">+</span>
              Нова рецепта
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
