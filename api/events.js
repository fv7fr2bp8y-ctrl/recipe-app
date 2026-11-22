import { getSession } from '../server/session.js';
import { adsConversionEvents, funnelStats, recordFunnelEvent } from '../server/db.js';
import { buildAdsCsv } from '../server/conversions.js';
import { jsonError, methodNotAllowed, readJson } from '../server/http.js';
import { sanitizeAttribution } from '../server/attribution.js';

// ad_landing: the first page view of a new Google Ads click (with its gclid).
const CLIENT_EVENTS = new Set(['premium_view', 'plan_yearly', 'plan_monthly', 'menu_click', 'ad_landing']);
// The Lenten menu landing button says whether the Black Friday offer was on.
const MENU_PLANS = new Set(['trial', 'trial_promo']);

// Google Ads scheduled upload (HTTPS source). Protected by ADS_EXPORT_TOKEN, given
// either as the password of HTTP basic auth or as ?token=. Off until the env var is set.
function exportAuthorized(req) {
  const expected = process.env.ADS_EXPORT_TOKEN;
  if (!expected) return false;
  const header = req.headers.authorization || '';
  if (header.startsWith('Basic ')) {
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
    if (decoded.slice(decoded.indexOf(':') + 1) === expected) return true;
  }
  if (header === `Bearer ${expected}`) return true;
  return req.query?.token === expected;
}

async function exportAdsConversions(req, res) {
  if (!exportAuthorized(req)) {
    const scheme = (req.headers.authorization || '').split(' ')[0] || 'none';
    console.warn('gads_export_unauthorized', scheme, req.headers['user-agent'] || '');
    // Clients such as Google's uploader send the password only after a Basic challenge.
    res.setHeader('WWW-Authenticate', 'Basic realm="TasteMaster export", charset="UTF-8"');
    return jsonError(res, 401, 'unauthorized', 'Export token required.');
  }
  const days = Math.min(Math.max(Number(req.query?.days) || 60, 1), 90);
  const rows = await adsConversionEvents(days);
  const csv = buildAdsCsv(rows, {
    paid: process.env.GADS_PURCHASE_CONVERSION_NAME || 'TasteMaster Purchase',
    trial_started: process.env.GADS_TRIAL_CONVERSION_NAME || '',
  });
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).send(csv);
}

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      const { name, attribution, plan } = await readJson(req).catch(() => ({}));
      if (!CLIENT_EVENTS.has(name)) return jsonError(res, 400, 'unknown_event', 'Unknown event.');
      const user = await getSession(req);
      const clean = sanitizeAttribution(attribution);
      await recordFunnelEvent({
        name,
        plan: name === 'menu_click' && MENU_PLANS.has(plan) ? plan : null,
        userId: user?.id || null,
        attribution: clean,
        // The page an ad click landed on, so the campaign report can group by it.
        ref: name === 'ad_landing' ? clean?.landing || null : null,
      });
      return res.status(204).end();
    }
    if ((req.method === 'GET' || req.method === 'HEAD') && req.query?.export === 'gads') {
      return await exportAdsConversions(req, res);
    }
    if (req.method === 'GET') {
      const user = await getSession(req);
      const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
      if (!user || !adminEmail || user.email?.toLowerCase() !== adminEmail) {
        return jsonError(res, 403, 'forbidden', 'Admin only.');
      }
      const days = Math.min(Math.max(Number(req.query?.days) || 30, 1), 365);
      return res.status(200).json({ days, events: await funnelStats(days) });
    }
    return methodNotAllowed(res, ['GET', 'POST']);
  } catch (error) {
    console.error('events_failed', error);
    return jsonError(res, 500, 'events_failed', 'Event could not be processed.');
  }
}
