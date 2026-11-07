export function track(name) {
  fetch('/api/events', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
    keepalive: true,
  }).catch(() => {});
}
