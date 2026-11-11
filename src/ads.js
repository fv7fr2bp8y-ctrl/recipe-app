// Google Ads tag (gtag.js) with Consent Mode v2.
// IDs are public (they are visible in the page tag); env vars can override them.
// Until the visitor accepts, Google gets only cookieless pings (consent denied).
const ADS_ID = import.meta.env.VITE_GADS_ID ?? 'AW-18278475994';
const LABELS = {
  trial_started: import.meta.env.VITE_GADS_TRIAL_LABEL ?? 'RVtTCIHNzbYdENrR7YtE',
  checkout_start: import.meta.env.VITE_GADS_CHECKOUT_LABEL ?? 'dbSbCITNzbYdENrR7YtE',
};
export const CONSENT_KEY = 'tm_consent';
const SENT_KEY = 'tm_ads_sent';

let started = false;

function gtag() {
  // gtag.js expects the real `arguments` object in the dataLayer.
  window.dataLayer.push(arguments);
}

export function adsEnabled() {
  return Boolean(ADS_ID);
}

export function readConsent() {
  try {
    const value = window.localStorage.getItem(CONSENT_KEY);
    return value === 'granted' || value === 'denied' ? value : null;
  } catch {
    return null;
  }
}

function consentState(value) {
  return {
    ad_storage: value,
    ad_user_data: value,
    ad_personalization: value,
    analytics_storage: value,
  };
}

export function initAds() {
  if (started || !ADS_ID) return;
  started = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = gtag;
  gtag('consent', 'default', { ...consentState('denied'), wait_for_update: 500 });
  const saved = readConsent();
  if (saved) gtag('consent', 'update', consentState(saved));
  gtag('set', 'url_passthrough', true);
  gtag('js', new Date());
  gtag('config', ADS_ID);
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ADS_ID)}`;
  document.head.appendChild(script);
}

export function setConsent(value) {
  try {
    window.localStorage.setItem(CONSENT_KEY, value);
  } catch {
    // Choice is kept for this page view only.
  }
  if (started) gtag('consent', 'update', consentState(value));
}

function alreadySent(id) {
  try {
    const sent = JSON.parse(window.localStorage.getItem(SENT_KEY) || '[]');
    return sent.includes(id);
  } catch {
    return false;
  }
}

function markSent(id) {
  try {
    const sent = JSON.parse(window.localStorage.getItem(SENT_KEY) || '[]');
    window.localStorage.setItem(SENT_KEY, JSON.stringify([...sent, id].slice(-20)));
  } catch {
    // Google Ads also dedupes by transaction_id.
  }
}

// Sends a Google Ads conversion. Resolves once the hit is out (or after a timeout),
// so it is safe to call right before navigating away to Stripe.
export function trackConversion(name, { transactionId, value, currency = 'EUR' } = {}) {
  const label = LABELS[name];
  if (!started || !label) return Promise.resolve();
  if (transactionId && alreadySent(`${name}:${transactionId}`)) return Promise.resolve();
  if (transactionId) markSent(`${name}:${transactionId}`);
  return new Promise((resolve) => {
    const done = () => resolve();
    window.setTimeout(done, 1200);
    gtag('event', 'conversion', {
      send_to: `${ADS_ID}/${label}`,
      ...(transactionId ? { transaction_id: transactionId } : {}),
      ...(value !== undefined ? { value, currency } : {}),
      event_callback: done,
      transport_type: 'beacon',
    });
  });
}
