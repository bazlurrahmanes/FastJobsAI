import { MarketplaceListing, MarketplaceSubscription } from '../types';
import { initDatabase } from '../db';

export class MarketplaceService {
  private static parseListingRow(row: any): MarketplaceListing {
    let features: string[] = [];
    try {
      features = typeof row.features === 'string' ? JSON.parse(row.features) : (row.features || []);
    } catch {
      features = [];
    }

    return {
      id: row.id,
      platformName: row.platform_name,
      category: row.category,
      description: row.description,
      logoUrl: row.logo_url,
      pricingPlan: row.pricing_plan,
      monthlyPrice: Number(row.monthly_price),
      rating: Number(row.rating),
      reviewCount: Number(row.review_count),
      subscriberCount: Number(row.subscriber_count),
      adapterId: row.adapter_id,
      status: row.status,
      features
    };
  }

  private static parseSubRow(row: any): MarketplaceSubscription {
    return {
      id: row.id,
      companyId: row.company_id,
      listingId: row.listing_id,
      status: row.status,
      apiKey: row.api_key,
      rateLimit: Number(row.rate_limit),
      requestsThisMonth: Number(row.requests_this_month),
      startedAt: row.started_at,
      expiresAt: row.expires_at
    };
  }

  public static getListings(): MarketplaceListing[] {
    const db = initDatabase();
    const rows = db.prepare('SELECT * FROM marketplace_listings ORDER BY subscriber_count DESC').all();
    return rows.map(this.parseListingRow);
  }

  public static getListingById(id: string): MarketplaceListing | undefined {
    const db = initDatabase();
    const row = db.prepare('SELECT * FROM marketplace_listings WHERE id = ?').get(id);
    return row ? this.parseListingRow(row) : undefined;
  }

  public static getSubscriptions(companyId?: string): MarketplaceSubscription[] {
    const db = initDatabase();
    if (companyId) {
      const rows = db.prepare('SELECT * FROM subscriptions WHERE company_id = ? ORDER BY started_at DESC').all(companyId);
      return rows.map(this.parseSubRow);
    }
    const rows = db.prepare('SELECT * FROM subscriptions ORDER BY started_at DESC').all();
    return rows.map(this.parseSubRow);
  }

  public static subscribe(
    companyId: string,
    listingId: string
  ): { subscription?: MarketplaceSubscription; error?: string } {
    const db = initDatabase();
    const listing = this.getListingById(listingId);
    if (!listing) return { error: 'Syndicate marketplace listing not found' };

    const existing = db.prepare('SELECT * FROM subscriptions WHERE company_id = ? AND listing_id = ? AND status = ?').get(
      companyId,
      listingId,
      'ACTIVE'
    );
    if (existing) {
      return { error: 'Company already has an active subscription to this feed platform' };
    }

    const subId = `sub-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const apiKey = `pk_live_${companyId.replace(/[^a-z0-9]/gi, '')}_${Math.random().toString(36).substring(2, 12)}`;
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 365 * 86400000).toISOString();

    const stmt = db.prepare(`
      INSERT INTO subscriptions (
        id, company_id, listing_id, status, api_key, rate_limit,
        requests_this_month, started_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      subId,
      companyId,
      listingId,
      'ACTIVE',
      apiKey,
      10000,
      0,
      now,
      expiresAt
    );

    // Increment subscriber_count
    db.prepare('UPDATE marketplace_listings SET subscriber_count = subscriber_count + 1 WHERE id = ?').run(listingId);

    const newSub: MarketplaceSubscription = {
      id: subId,
      companyId,
      listingId,
      status: 'ACTIVE',
      apiKey,
      rateLimit: 10000,
      requestsThisMonth: 0,
      startedAt: now,
      expiresAt
    };

    return { subscription: newSub };
  }

  public static cancelSubscription(subscriptionId: string): boolean {
    const db = initDatabase();
    const result = db.prepare("UPDATE subscriptions SET status = 'CANCELLED' WHERE id = ?").run(subscriptionId);
    return result.changes > 0;
  }
}
