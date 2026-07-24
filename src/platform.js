const PLAY_MODE_KEY = 'tastemaster-play-app';

export function isPlayLaunch(search) {
  return new URLSearchParams(search).get('platform') === 'play';
}

export function detectPlayApp() {
  const playMode = isPlayLaunch(window.location.search);

  if (playMode) {
    window.sessionStorage.setItem(PLAY_MODE_KEY, '1');
    return true;
  }

  return window.sessionStorage.getItem(PLAY_MODE_KEY) === '1';
}
