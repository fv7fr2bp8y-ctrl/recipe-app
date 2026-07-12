import { useState } from 'react';

export default function AccountDialog({ onClose, onLogin, onRegister, loading, error, messages }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = (event) => {
    event.preventDefault();
    if (mode === 'register') onRegister({ name, email, password });
    else onLogin({ email, password });
  };

  const switchMode = (next) => {
    setMode(next);
    setPassword('');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-950/55 p-4 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" aria-labelledby="account-title" className="w-full max-w-sm border border-orange-200 bg-[#fffaf2] p-7 shadow-2xl">
        <div className="flex border border-stone-200 bg-white p-1" role="tablist" aria-label="Профил">
          <button type="button" role="tab" aria-selected={mode === 'login'} onClick={() => switchMode('login')} className={`flex-1 px-3 py-2 text-sm font-semibold ${mode === 'login' ? 'bg-stone-900 text-white' : 'text-stone-600'}`}>{messages.login}</button>
          <button type="button" role="tab" aria-selected={mode === 'register'} onClick={() => switchMode('register')} className={`flex-1 px-3 py-2 text-sm font-semibold ${mode === 'register' ? 'bg-stone-900 text-white' : 'text-stone-600'}`}>{messages.newProfile}</button>
        </div>
        <h2 id="account-title" className="mt-6 text-2xl font-semibold text-stone-900">
          {mode === 'login' ? messages.welcome : messages.createProfile}
        </h2>
        <form onSubmit={submit} className="mt-5 space-y-4">
          {mode === 'register' ? (
            <label className="block text-sm text-stone-700">
              {messages.name}
              <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" maxLength={100} className="mt-1 w-full border border-stone-300 bg-white px-3 py-3 outline-none focus:border-orange-500" />
            </label>
          ) : null}
          <label className="block text-sm text-stone-700">
            {messages.email}
            <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className="mt-1 w-full border border-stone-300 bg-white px-3 py-3 outline-none focus:border-orange-500" />
          </label>
          <label className="block text-sm text-stone-700">
            {messages.password}
            <input type="password" required minLength={10} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className="mt-1 w-full border border-stone-300 bg-white px-3 py-3 outline-none focus:border-orange-500" />
            {mode === 'register' ? <span className="mt-1 block text-xs text-stone-500">{messages.minChars}</span> : null}
          </label>
          {error ? <p className="text-sm text-red-700" role="alert">{error}</p> : null}
          <button type="submit" disabled={loading} className="w-full bg-orange-600 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60">
            {loading ? messages.wait : mode === 'login' ? messages.login : messages.create}
          </button>
        </form>
        <p className="mt-4 text-center text-xs leading-5 text-stone-500">{messages.help}: office@newage-studio.com</p>
        <button type="button" onClick={onClose} className="mt-3 w-full px-4 py-2 text-sm text-stone-500 hover:text-stone-800">{messages.back}</button>
      </div>
    </div>
  );
}
