import { useEffect, useRef, useState } from 'react';
import { Globe2, Share2 } from 'lucide-react';
import GoogleAuthButton from './GoogleAuthButton';
import AccountButton from './AccountButton';
import { LANGUAGES } from '../i18n';

export default function Header({
  driveConnected,
  onDriveSignIn,
  onDriveSignOut,
  driveScopes,
  isAdmin,
  googleEnabled,
  accountUser,
  onAccountLogin,
  onAccountLogout,
  accountLoading,
  premium,
  onManageBilling,
  billingEnabled,
  language,
  onLanguageChange,
  onShare,
  messages,
}) {
  const [languageOpen, setLanguageOpen] = useState(false);
  const languageMenu = useRef(null);

  useEffect(() => {
    const close = (event) => {
      if (!languageMenu.current?.contains(event.target)) setLanguageOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-primary-100 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <img src="/tastemaster-logo.png" alt="" className="h-11 w-11 shrink-0 object-contain sm:h-14 sm:w-14" />
          <div className="min-w-0">
            <h1 className="font-serif text-base font-semibold leading-none text-stone-900 sm:text-2xl sm:tracking-[0.04em]">TasteMaster365</h1>
            <p className="mt-1 hidden text-[10px] uppercase tracking-[0.24em] text-primary-700 sm:block">{messages.tagline}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative" ref={languageMenu}>
            <button
              type="button"
              onClick={() => setLanguageOpen((open) => !open)}
              className="flex h-10 items-center gap-1 border border-primary-200 bg-white px-2 text-xs font-semibold text-stone-700 hover:border-primary-500 sm:gap-1.5 sm:px-2.5"
              aria-label={messages.language}
              aria-expanded={languageOpen}
            >
              <Globe2 size={17} strokeWidth={1.6} />
              <span>{language.toUpperCase()}</span>
            </button>
            {languageOpen && (
              <div className="absolute right-0 top-12 z-50 min-w-44 border border-orange-200 bg-white p-1.5 shadow-xl">
                {LANGUAGES.map((item) => (
                  <button
                    type="button"
                    key={item.code}
                    onClick={() => { onLanguageChange(item.code); setLanguageOpen(false); }}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${language === item.code ? 'bg-primary-50 text-primary-800' : 'text-stone-700 hover:bg-stone-50'}`}
                  >
                    <span>{item.label}</span><span className="text-[10px] text-stone-400">{item.short}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onShare}
            className="flex h-10 w-10 items-center justify-center border border-orange-300 bg-white text-orange-700 hover:border-orange-500"
            aria-label={messages.share}
            title={messages.share}
          >
            <Share2 size={18} strokeWidth={1.5} />
          </button>
          {billingEnabled && accountUser && premium && (
            <button type="button" onClick={onManageBilling} className="hidden border border-orange-200 px-3 py-2 text-xs font-semibold text-orange-800 hover:bg-orange-50 md:block">Premium</button>
          )}
          <AccountButton user={accountUser} onLogin={onAccountLogin} onLogout={onAccountLogout} loading={accountLoading} labels={{ login: messages.login, logout: messages.logout }} />
          {googleEnabled && isAdmin && (
            <GoogleAuthButton isConnected={driveConnected} onSignIn={onDriveSignIn} onSignOut={onDriveSignOut} scopes={driveScopes} />
          )}
        </div>
      </div>
    </header>
  );
}
