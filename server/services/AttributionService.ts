import { ApplyEvent, AttributionMetrics } from '../types';
import { initDatabase } from '../db';

export class AttributionService {
  public static trackEvent(
    type: 'job_view' | 'apply_click' | 'redirect',
    data: {
      jobId?: string;
      companyId?: string;
      job_id?: string;
      company_id?: string;
      platform?: string;
      source?: string;
      userId?: string;
      user_id?: string;
      userAgent?: string;
      user_agent?: string;
      ipHash?: string;
      ip_hash?: string;
      ip?: string;
    }
  ): ApplyEvent {
    const db = initDatabase();
    const id = `ev-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const platform = data.platform || 'direct';
    const source = data.source || 'jobxora';
    const jobId = data.jobId || data.job_id || '';
    const companyId = data.companyId || data.company_id || '';
    const userId = data.userId || data.user_id;
    const userAgent = data.userAgent || data.user_agent;
    const ipHash = data.ipHash || data.ip_hash || data.ip;

    const event: ApplyEvent = {
      id,
      type,
      job_id: jobId,
      company_id: companyId,
      platform,
      source,
      user_id: userId,
      user_agent: userAgent,
      ip_hash: ipHash,
      timestamp: now
    };

    // Insert into apply_events
    db.prepare(`
      INSERT INTO apply_events (id, type, job_id, company_id, platform, source, user_id, user_agent, ip_hash, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      event.id,
      event.type,
      event.job_id,
      event.company_id,
      event.platform,
      event.source,
      event.user_id || null,
      event.user_agent || null,
      event.ip_hash || null,
      event.timestamp
    );

    // Update source_attributions
    const isClick = type === 'apply_click' || type === 'redirect';
    db.prepare(`
      INSERT INTO source_attributions (id, source_name, channel_type, total_impressions, total_clicks, conversion_rate, last_event_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(source_name) DO UPDATE SET
        total_impressions = total_impressions + ?,
        total_clicks = total_clicks + ?,
        conversion_rate = CASE
          WHEN (total_impressions + ?) > 0 THEN CAST((total_clicks + ?) AS REAL) / (total_impressions + ?)
          ELSE 0.0
        END,
        last_event_at = excluded.last_event_at
    `).run(
      `src-${source}`,
      source,
      'channel',
      isClick ? 0 : 1,
      isClick ? 1 : 0,
      isClick ? 1.0 : 0.0,
      now,
      isClick ? 0 : 1,
      isClick ? 1 : 0,
      isClick ? 0 : 1,
      isClick ? 1 : 0,
      isClick ? 0 : 1
    );

    return event;
  }

  public static getEvents(limit = 100): ApplyEvent[] {
    const db = initDatabase();
    const rows = db.prepare('SELECT * FROM apply_events ORDER BY timestamp DESC LIMIT ?').all(limit) as any[];
    return rows.map(r => ({
      id: r.id,
      type: r.type,
      job_id: r.job_id,
      company_id: r.company_id,
      platform: r.platform,
      source: r.source,
      user_id: r.user_id || undefined,
      user_agent: r.user_agent || undefined,
      ip_hash: r.ip_hash || undefined,
      timestamp: r.timestamp
    }));
  }

  public static getMetrics(): AttributionMetrics {
    const db = initDatabase();
    const rows = db.prepare('SELECT type, source, platform FROM apply_events').all() as any[];

    let totalViews = 0;
    let totalClicks = 0;
    const bySource: Record<string, { views: number; clicks: number; ctr: number }> = {};
    const byPlatform: Record<string, { views: number; clicks: number; ctr: number }> = {};

    for (const ev of rows) {
      const src = ev.source || 'direct';
      const plat = ev.platform || 'direct';

      if (!bySource[src]) bySource[src] = { views: 0, clicks: 0, ctr: 0 };
      if (!byPlatform[plat]) byPlatform[plat] = { views: 0, clicks: 0, ctr: 0 };

      if (ev.type === 'job_view') {
        totalViews++;
        bySource[src].views++;
        byPlatform[plat].views++;
      } else if (ev.type === 'apply_click' || ev.type === 'redirect') {
        totalClicks++;
        bySource[src].clicks++;
        byPlatform[plat].clicks++;
      }
    }

    Object.keys(bySource).forEach(k => {
      const v = bySource[k].views;
      const c = bySource[k].clicks;
      bySource[k].ctr = v > 0 ? Number(((c / v) * 100).toFixed(2)) : 0;
    });

    Object.keys(byPlatform).forEach(k => {
      const v = byPlatform[k].views;
      const c = byPlatform[k].clicks;
      byPlatform[k].ctr = v > 0 ? Number(((c / v) * 100).toFixed(2)) : 0;
    });

    return {
      totalViews,
      totalClicks,
      overallConversionRate: totalViews > 0 ? Number(((totalClicks / totalViews) * 100).toFixed(2)) : 0,
      bySource,
      byPlatform
    };
  }
}
