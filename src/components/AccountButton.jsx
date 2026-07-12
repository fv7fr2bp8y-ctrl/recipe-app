import { LogIn, LogOut } from 'lucide-react';

export default function AccountButton({ user, onLogin, onLogout, loading, labels = { login: 'Вход', logout: 'Изход' } }) {
  if (user) {
    return (
      <button
        type="button"
        onClick={onLogout}
        disabled={loading}
        className="flex h-10 items-center gap-2 border border-stone-200 bg-white px-2.5 text-xs text-stone-700 transition-colors hover:border-orange-300 hover:text-orange-800 disabled:opacity-60"
        title="Изход от TasteMaster365"
      >
        {user.picture ? <img src={user.picture} alt="" className="h-5 w-5 rounded-full" referrerPolicy="no-referrer" /> : null}
        <span className="hidden max-w-36 truncate sm:inline">{user.name || user.email}</span>
        <LogOut size={17} strokeWidth={1.5} />
        <span className="hidden sm:inline">{labels.logout}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onLogin}
      disabled={loading}
      className="flex h-10 items-center gap-2 border border-orange-300 bg-white px-2.5 text-xs font-semibold text-orange-800 transition-colors hover:bg-orange-50 disabled:opacity-60"
      title={labels.login}
    >
      <LogIn size={17} strokeWidth={1.5} />
      <span className="hidden sm:inline">{labels.login}</span>
    </button>
  );
}
