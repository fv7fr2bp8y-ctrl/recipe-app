import { createHash } from 'node:crypto';
import { SignJWT, importPKCS8 } from 'jose';
import { PLAY_PACKAGE, PLAY_PRODUCTS, requireEnv } from './config.js';

const API = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PLAY_PACKAGE}`;
const SCOPE = 'https://www.googleapis.com/auth/androidpublisher';
const ACTIVE_STATES = new Set(['SUBSCRIPTION_STATE_ACTIVE', 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD']);

let cachedToken = { value: '', expiresAt: 0 };

async function accessToken() {
  if (cachedToken.expiresAt > Date.now()) return cachedToken.value;
  const email = requireEnv('GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL');
  const key = await importPKCS8(requireEnv('GOOGLE_PLAY_SERVICE_ACCOUNT_PRIVATE_KEY').replaceAll('\\n', '\n'), 'RS256');
  const assertion = await new SignJWT({ scope: SCOPE })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuer(email)
    .setAudience('https://oauth2.googleapis.com/token')
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(key);
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
  });
  if (!response.ok) throw new Error(`Google token request failed: ${response.status}`);
  const data = await response.json();
  cachedToken = { value: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
  return cachedToken.value;
}

export function playStatus(purchase) {
  const expiry = purchase.lineItems?.[0]?.expiryTime || null;
  const notExpired = Boolean(expiry) && new Date(expiry).getTime() > Date.now();
  const stillPaid = purchase.subscriptionState === 'SUBSCRIPTION_STATE_CANCELED' && notExpired;
  return {
    status: ACTIVE_STATES.has(purchase.subscriptionState) || stillPaid ? 'active' : 'inactive',
    currentPeriodEnd: expiry,
  };
}

export const playSubscriptionId = (purchaseToken) => (
  `play:${createHash('sha256').update(purchaseToken).digest('hex')}`
);

export async function verifyPlayPurchase(purchaseToken) {
  const token = await accessToken();
  const headers = { Authorization: `Bearer ${token}` };
  const response = await fetch(`${API}/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`, { headers });
  if (response.status === 400 || response.status === 404) return null;
  if (!response.ok) throw new Error(`Play purchase lookup failed: ${response.status}`);
  const purchase = await response.json();
  const productId = purchase.lineItems?.[0]?.productId;
  if (!Object.values(PLAY_PRODUCTS).includes(productId)) return null;

  const result = playStatus(purchase);
  if (result.status === 'active' && purchase.acknowledgementState !== 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED') {
    const ack = await fetch(
      `${API}/purchases/subscriptions/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}:acknowledge`,
      { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: '{}' },
    );
    if (!ack.ok) throw new Error(`Play acknowledge failed: ${ack.status}`);
  }
  return {
    ...result,
    productId,
    trial: purchase.lineItems?.[0]?.offerDetails?.offerId === 'free-trial',
  };
}
