import { useGoogleLogin } from '@react-oauth/google';

export default function GoogleAuthButton({ onSignIn, onSignOut, isConnected, scopes }) {
  const login = useGoogleLogin({
    onSuccess: onSignIn,
    scope: scopes,
  });

  if (isConnected) {
    return (
      <button
        onClick={onSignOut}
        className="flex items-center gap-1.5 text-xs border border-green-200 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
        title="Свързан с Google Drive — кликни за изход"
      >
        <span>✓</span>
        Google Drive
      </button>
    );
  }

  return (
    <button
      onClick={() => login()}
      className="flex items-center gap-1.5 text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:border-primary-400 hover:text-primary-600 transition-colors"
      title="Свържи се с Google Drive за съхранение на снимки"
    >
      <img src="https://www.google.com/favicon.ico" alt="" className="w-3 h-3" />
      Свържи Drive
    </button>
  );
}
