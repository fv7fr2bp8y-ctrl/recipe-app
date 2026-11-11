import { getSession } from '../server/session.js';
import { funnelStats, recordFunnelEvent } from '../server/db.js';
import { jsonError, methodNotAllowed, readJson } from '../server/http.js';
import { sanitizeAttribution } from '../server/attribution.js';

const CLIENT_EVENTS = new Set(['premium_view', 'plan_yearly', 'plan_monthly']);

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      const { name, attribution } = await readJson(req).catch(() => ({}));
      if (!CLIENT_EVENTS.has(name)) return jsonError(res, 400, 'unknown_event', 'Unknown event.');
      const user = await getSession(req);
      await recordFunnelEvent({ name, userId: user?.id || null, attribution: sanitizeAttribution(attribution) });
      return res.status(204).end();
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
