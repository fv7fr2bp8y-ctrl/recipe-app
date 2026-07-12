import GoogleAuthButton from './GoogleAuthButton';
import AccountButton from './AccountButton';

export default function Header({
  driveConnected,
  onDriveSignIn,
  onDriveSignOut,
  driveScopes,
  syncing,
  isAdmin,
  googleEnabled,
  accountUser,
  onAccountLogin,
  onAccountLogout,
  accountLoading,
  premium,
  onManageBilling,
}) {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center border border-orange-300 text-xs font-bold tracking-wider text-orange-700" aria-hidden="true">
            TM
          </span>
          <div>
            <h1 className="text-xl font-bold text-gray-800 leading-none tracking-wider">TasteMaster365</h1>
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
          {accountUser && premium && (
            <button
              type="button"
              onClick={onManageBilling}
              className="hidden border border-orange-200 px-3 py-2 text-xs font-semibold text-orange-800 hover:bg-orange-50 md:block"
            >
              Premium
            </button>
          )}
          <AccountButton
            user={accountUser}
            onLogin={onAccountLogin}
            onLogout={onAccountLogout}
            loading={accountLoading}
          />
          {googleEnabled && isAdmin && (
            <GoogleAuthButton
              isConnected={driveConnected}
              onSignIn={onDriveSignIn}
              onSignOut={onDriveSignOut}
              scopes={driveScopes}
            />
          )}
        </div>
      </div>
    </header>
  );
}
