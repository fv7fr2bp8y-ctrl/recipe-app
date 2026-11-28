const PLAY_MODE_KEY = 'tastemaster-play-app';

export function isPlayLaunch(search) {
  return new URLSearchParams(search).get('platform') === 'play';
}

// The Play app (TWA) opens /?platform=play; its first page also has an android-app:// referrer.
// Remembered for the tab, so later pages of the same visit know it too.
export function detectPlayApp() {
  const playMode = isPlayLaunch(window.location.search)
    || (typeof document !== 'undefined' && document.referrer.startsWith('android-app://'));
  try {
    if (playMode) {
      window.sessionStorage.setItem(PLAY_MODE_KEY, '1');
      return true;
    }
    return window.sessionStorage.getItem(PLAY_MODE_KEY) === '1';
  } catch {
    return playMode;
  }
}

// Google tags (Ads and Analytics) are for the website in a browser only: never inside the
// Play app, as its Data safety form says, nor in an app opened from the home screen.
export function googleTagsAllowed() {
  if (detectPlayApp()) return false;
  try {
    return !window.matchMedia('(display-mode: standalone)').matches;
  } catch {
    return true;
  }
}
