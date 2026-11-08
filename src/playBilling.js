const SERVICE = 'https://play.google.com/billing';
export const PLAY_SKUS = { monthly: 'tastemaster_monthly', yearly: 'tastemaster_yearly' };

const formatPrice = ({ currency, value }) => new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Number(value));

async function service() {
  if (!('getDigitalGoodsService' in window)) return null;
  return window.getDigitalGoodsService(SERVICE).catch(() => null);
}

export async function loadPlayPlans() {
  const billing = await service();
  if (!billing) return null;
  const details = await billing.getDetails(Object.values(PLAY_SKUS)).catch(() => []);
  const find = (sku) => details.find((item) => item.itemId === sku);
  if (!find(PLAY_SKUS.monthly) || !find(PLAY_SKUS.yearly)) return null;
  return Object.fromEntries(Object.entries(PLAY_SKUS).map(([plan, sku]) => {
    const item = find(sku);
    return [plan, { sku, price: formatPrice(item.price), trial: Boolean(item.freeTrialPeriod) }];
  }));
}

async function linkPurchase(purchaseToken) {
  const response = await fetch('/api/billing/checkout', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: 'play', purchaseToken }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Google Play purchase could not be confirmed.');
}

export async function buyPlayPlan(sku) {
  const request = new PaymentRequest(
    [{ supportedMethods: SERVICE, data: { sku } }],
    { total: { label: 'TasteMaster365 Premium', amount: { currency: 'EUR', value: '0' } } },
  );
  const response = await request.show();
  try {
    await linkPurchase(response.details.purchaseToken || response.details.token);
    await response.complete('success');
  } catch (error) {
    await response.complete('fail');
    throw error;
  }
}

export async function restorePlayPurchases() {
  const billing = await service();
  if (!billing) return false;
  const purchases = await billing.listPurchases().catch(() => []);
  const owned = purchases.filter((item) => Object.values(PLAY_SKUS).includes(item.itemId));
  const results = await Promise.allSettled(owned.map((item) => linkPurchase(item.purchaseToken)));
  return results.some((result) => result.status === 'fulfilled');
}
