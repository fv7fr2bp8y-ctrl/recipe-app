// Remembers where a visitor first came from (Google Ads click id, UTM tags) so the
// server can attach it to the account, the funnel events and the Stripe checkout.
// The same key is written by the inline script on the server-rendered SEO pages.
export const ATTRIBUTION_KEY = 'tm_attribution';
const FIELDS = ['gclid', 'gbraid', 'wbraid', 'utm_source', 'utm_medium', 'utm_campaign'];

function readStored() {
  try {
    return JSON.parse(window.localStorage.getItem(ATTRIBUTION_KEY) || 'null');
  } catch {
    return null;
  }
}

export function captureAttribution(search = window.location.search) {
  const params = new URLSearchParams(search);
  const found = {};
  for (const field of FIELDS) {
    const value = params.get(field);
    if (value) found[field] = value.slice(0, 200);
  }
  if (Object.keys(found).length === 0) return readStored();
  const stored = readStored();
  // First touch wins, except that a new paid click (gclid) replaces an older visit,
  // because Google Ads can only credit a conversion to its own click id.
  if (stored && !found.gclid && !found.gbraid && !found.wbraid) return stored;
  const next = { ...found, landing: window.location.pathname.slice(0, 200), at: new Date().toISOString() };
  try {
    window.localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(next));
  } catch {
    // Storage blocked: nothing to remember.
  }
  return next;
}

export function getAttribution() {
  return readStored() || undefined;
}
