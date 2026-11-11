const FIELDS = ['gclid', 'gbraid', 'wbraid', 'utm_source', 'utm_medium', 'utm_campaign', 'landing', 'at'];

// Accepts whatever the browser sent and keeps only short known string fields.
export function sanitizeAttribution(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const clean = {};
  for (const field of FIELDS) {
    const value = raw[field];
    if (typeof value === 'string' && value.trim()) clean[field] = value.trim().slice(0, 200);
  }
  return Object.keys(clean).length ? clean : null;
}

// Stripe metadata: string values, max 500 chars each. Empty fields are left out.
export function attributionMetadata(attribution) {
  const clean = sanitizeAttribution(attribution);
  if (!clean) return {};
  const metadata = {};
  if (clean.gclid) metadata.tm_gclid = clean.gclid;
  if (clean.gbraid) metadata.tm_gbraid = clean.gbraid;
  if (clean.wbraid) metadata.tm_wbraid = clean.wbraid;
  if (clean.utm_source) metadata.tm_utm_source = clean.utm_source;
  if (clean.utm_medium) metadata.tm_utm_medium = clean.utm_medium;
  if (clean.utm_campaign) metadata.tm_utm_campaign = clean.utm_campaign;
  if (clean.landing) metadata.tm_landing = clean.landing;
  return metadata;
}

export function attributionFromMetadata(metadata) {
  if (!metadata) return null;
  return sanitizeAttribution({
    gclid: metadata.tm_gclid,
    gbraid: metadata.tm_gbraid,
    wbraid: metadata.tm_wbraid,
    utm_source: metadata.tm_utm_source,
    utm_medium: metadata.tm_utm_medium,
    utm_campaign: metadata.tm_utm_campaign,
    landing: metadata.tm_landing,
  });
}
