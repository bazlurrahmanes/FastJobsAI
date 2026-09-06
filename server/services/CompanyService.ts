import { MasterCompany, CompanyVerificationStatus } from '../types';
import { initDatabase } from '../db';

export class CompanyService {
  private static parseDbRow(row: any): MasterCompany {
    return {
      company_id: row.company_id,
      name: row.name,
      website: row.website,
      logo: row.logo,
      description: row.description,
      verification_status: row.verification_status as CompanyVerificationStatus,
      created_at: row.created_at,
      verified_at: row.verified_at || undefined,
      feed_token: row.feed_token,
      contact_email: row.contact_email
    };
  }

  public static getAll(): MasterCompany[] {
    const db = initDatabase();
    const rows = db.prepare('SELECT * FROM companies ORDER BY name ASC').all();
    return rows.map(this.parseDbRow);
  }

  public static getById(companyId: string): MasterCompany | undefined {
    const db = initDatabase();
    const row = db.prepare('SELECT * FROM companies WHERE company_id = ?').get(companyId);
    return row ? this.parseDbRow(row) : undefined;
  }

  public static create(data: Omit<MasterCompany, 'company_id' | 'created_at' | 'feed_token'>): MasterCompany {
    const db = initDatabase();
    const companyId = `comp-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const feedToken = `feed_token_${companyId}_${Math.random().toString(36).substring(2, 10)}`;
    const now = new Date().toISOString();

    const newCompany: MasterCompany = {
      ...data,
      company_id: companyId,
      created_at: now,
      feed_token: feedToken,
      verification_status: data.verification_status || 'PENDING'
    };

    const stmt = db.prepare(`
      INSERT INTO companies (
        company_id, name, website, logo, description, verification_status,
        created_at, verified_at, feed_token, contact_email
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      newCompany.company_id,
      newCompany.name,
      newCompany.website,
      newCompany.logo,
      newCompany.description,
      newCompany.verification_status,
      newCompany.created_at,
      newCompany.verified_at || null,
      newCompany.feed_token,
      newCompany.contact_email
    );

    // Record verification record
    const verStmt = db.prepare(`
      INSERT INTO company_verifications (
        id, company_id, verification_status, reviewed_by, reviewed_at, notes, documents
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    verStmt.run(
      `verif-${Date.now().toString(36)}`,
      companyId,
      newCompany.verification_status,
      'system',
      now,
      'Initial company registration',
      JSON.stringify([])
    );

    return newCompany;
  }

  public static update(companyId: string, updates: Partial<MasterCompany>): MasterCompany | undefined {
    const existing = this.getById(companyId);
    if (!existing) return undefined;

    const updated: MasterCompany = {
      ...existing,
      ...updates,
      company_id: existing.company_id // immutable
    };

    if (updates.verification_status === 'VERIFIED' && existing.verification_status !== 'VERIFIED') {
      updated.verified_at = new Date().toISOString();
    }

    const db = initDatabase();
    const stmt = db.prepare(`
      UPDATE companies SET
        name = ?,
        website = ?,
        logo = ?,
        description = ?,
        verification_status = ?,
        verified_at = ?,
        contact_email = ?
      WHERE company_id = ?
    `);

    stmt.run(
      updated.name,
      updated.website,
      updated.logo,
      updated.description,
      updated.verification_status,
      updated.verified_at || null,
      updated.contact_email,
      companyId
    );

    if (updates.verification_status && updates.verification_status !== existing.verification_status) {
      const verStmt = db.prepare(`
        INSERT INTO company_verifications (
          id, company_id, verification_status, reviewed_by, reviewed_at, notes, documents
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      verStmt.run(
        `verif-${Date.now().toString(36)}`,
        companyId,
        updated.verification_status,
        'admin',
        new Date().toISOString(),
        `Status transitioned from ${existing.verification_status} to ${updated.verification_status}`,
        JSON.stringify([])
      );
    }

    return updated;
  }

  public static setVerificationStatus(companyId: string, status: CompanyVerificationStatus): MasterCompany | undefined {
    return this.update(companyId, { verification_status: status });
  }

  public static isVerified(companyId: string): boolean {
    const comp = this.getById(companyId);
    return comp ? comp.verification_status === 'VERIFIED' : false;
  }
}
