// Offline conversion export for Google Ads (Uploads > scheduled upload from HTTPS).
// One row per paid or trial subscription that came from a Google Ads click (gclid)
// and whose visitor accepted ad cookies. Google ignores rows it has already imported,
// so the same rows can be served again on every scheduled run.

export const PLAN_VALUES = { monthly: 4.99, yearly: 29.99 };

function csvCell(value) {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

// "2026-11-12 14:03:00+0000": Google Ads accepts an explicit UTC offset per row.
export function adsTime(date) {
  const iso = new Date(date).toISOString();
  return `${iso.slice(0, 10)} ${iso.slice(11, 19)}+0000`;
}

export function eventValue(row) {
  if (row.value_cents !== null && row.value_cents !== undefined) return Number(row.value_cents) / 100;
  return PLAN_VALUES[row.plan] ?? 0;
}

export function buildAdsCsv(rows, conversionNames) {
  const lines = ['Google Click ID,Conversion Name,Conversion Time,Conversion Value,Conversion Currency'];
  for (const row of rows) {
    const conversionName = conversionNames[row.name];
    if (!conversionName || !row.gclid || row.consent !== 'granted') continue;
    const value = row.name === 'paid' ? eventValue(row) : 0;
    lines.push([
      row.gclid,
      conversionName,
      adsTime(row.created_at),
      value.toFixed(2),
      (row.currency || 'EUR').toUpperCase(),
    ].map(csvCell).join(','));
  }
  return `${lines.join('\n')}\n`;
}
