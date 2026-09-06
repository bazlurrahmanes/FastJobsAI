import {
  CompanyPlatformControl,
  FeedVersion,
  JobPlatformControl,
  PlatformConfig
} from '../types';
import { initDatabase } from '../db';
import { AdapterService, DynamicCustomAdapter } from './AdapterService';

export class PlatformService {
  private static adaptersInitialized = false;

  public static initDynamicAdapters(): void {
    try {
      const db = initDatabase();
      const rows = db.prepare('SELECT * FROM platform_configurations ORDER BY created_at DESC').all();
      const configs = rows.map(r => this.parseConfigRow(r));
      for (const config of configs) {
        AdapterService.register(new DynamicCustomAdapter(config));
      }
      this.adaptersInitialized = true;
    } catch {
      // Defer until DB initialized
    }
  }

  // --- Platform Level Enable/Disable ---
  public static isPlatformEnabled(platformId: string): boolean {
    this.initDynamicAdapters();
    const db = initDatabase();
    const row = db.prepare('SELECT is_enabled FROM platforms WHERE id = ?').get(platformId) as { is_enabled: number } | undefined;
    return row ? Boolean(row.is_enabled) : true;
  }

  public static setPlatformEnabled(platformId: string, enabled: boolean): void {
    const db = initDatabase();
    const existing = db.prepare('SELECT id FROM platforms WHERE id = ?').get(platformId);
    const now = new Date().toISOString();

    if (existing) {
      db.prepare('UPDATE platforms SET is_enabled = ?, updated_at = ? WHERE id = ?').run(
        enabled ? 1 : 0,
        now,
        platformId
      );
    } else {
      db.prepare(`
        INSERT INTO platforms (id, platform_name, feed_type, is_enabled, default_auth_type, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(platformId, platformId, 'xml', enabled ? 1 : 0, 'none', now, now);
    }
  }

  // --- Company Level Enable/Disable ---
  public static isCompanyEnabledForPlatform(companyId: string, platformId: string): boolean {
    if (!this.isPlatformEnabled(platformId)) return false;
    const db = initDatabase();
    const row = db.prepare('SELECT enabled FROM company_platform_controls WHERE company_id = ? AND platform_id = ?').get(
      companyId,
      platformId
    ) as { enabled: number } | undefined;
    return row ? Boolean(row.enabled) : true; // default enabled if not explicitly disabled
  }

  public static setCompanyPlatformControl(
    companyId: string,
    platformId: string,
    enabled: boolean,
    user = 'admin'
  ): CompanyPlatformControl {
    const db = initDatabase();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO company_platform_controls (company_id, platform_id, enabled, updated_at, updated_by)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(company_id, platform_id) DO UPDATE SET
        enabled = excluded.enabled,
        updated_at = excluded.updated_at,
        updated_by = excluded.updated_by
    `).run(companyId, platformId, enabled ? 1 : 0, now, user);

    return {
      companyId,
      platformId,
      enabled,
      updatedAt: now,
      updatedBy: user
    };
  }

  // --- Job Level Enable/Disable ---
  public static isJobEnabledForPlatform(jobId: string, companyId: string, platformId: string): boolean {
    // Must pass platform level
    if (!this.isPlatformEnabled(platformId)) return false;
    // Must pass company level
    if (!this.isCompanyEnabledForPlatform(companyId, platformId)) return false;

    // Check job-specific override
    const db = initDatabase();
    const row = db.prepare('SELECT enabled FROM job_platform_controls WHERE job_id = ? AND platform_id = ?').get(
      jobId,
      platformId
    ) as { enabled: number } | undefined;
    return row ? Boolean(row.enabled) : true; // default enabled
  }

  public static setJobPlatformControl(
    jobId: string,
    platformId: string,
    enabled: boolean,
    user = 'admin'
  ): JobPlatformControl {
    const db = initDatabase();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO job_platform_controls (job_id, platform_id, enabled, updated_at, updated_by)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(job_id, platform_id) DO UPDATE SET
        enabled = excluded.enabled,
        updated_at = excluded.updated_at,
        updated_by = excluded.updated_by
    `).run(jobId, platformId, enabled ? 1 : 0, now, user);

    return {
      jobId,
      platformId,
      enabled,
      updatedAt: now,
      updatedBy: user
    };
  }

  public static getJobControls(): JobPlatformControl[] {
    const db = initDatabase();
    const rows = db.prepare('SELECT * FROM job_platform_controls ORDER BY updated_at DESC').all() as any[];
    return rows.map(r => ({
      jobId: r.job_id,
      platformId: r.platform_id,
      enabled: Boolean(r.enabled),
      updatedAt: r.updated_at,
      updatedBy: r.updated_by
    }));
  }

  public static getCompanyControls(): CompanyPlatformControl[] {
    const db = initDatabase();
    const rows = db.prepare('SELECT * FROM company_platform_controls ORDER BY updated_at DESC').all() as any[];
    return rows.map(r => ({
      companyId: r.company_id,
      platformId: r.platform_id,
      enabled: Boolean(r.enabled),
      updatedAt: r.updated_at,
      updatedBy: r.updated_by
    }));
  }

  // --- No-Code Configurations ---
  private static parseConfigRow(row: any): PlatformConfig {
    return {
      id: row.id,
      platform_name: row.platform_name,
      feed_type: row.feed_type,
      endpoint: row.endpoint,
      authentication: row.authentication,
      auth_header_name: row.auth_header_name || undefined,
      auth_header_value: row.auth_header_value || undefined,
      required_fields: typeof row.required_fields === 'string' ? JSON.parse(row.required_fields) : (row.required_fields || []),
      optional_fields: typeof row.optional_fields === 'string' ? JSON.parse(row.optional_fields) : (row.optional_fields || []),
      field_mapping: typeof row.field_mapping === 'string' ? JSON.parse(row.field_mapping) : (row.field_mapping || {}),
      update_frequency_minutes: Number(row.update_frequency_minutes) || 60,
      retry_policy: typeof row.retry_policy === 'string' ? JSON.parse(row.retry_policy) : (row.retry_policy || { max_retries: 3, initial_delay_sec: 5, backoff_multiplier: 2 }),
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  public static getAllConfigs(): PlatformConfig[] {
    const db = initDatabase();
    const rows = db.prepare('SELECT * FROM platform_configurations ORDER BY created_at DESC').all();
    return rows.map(this.parseConfigRow);
  }

  public static getConfig(id: string): PlatformConfig | undefined {
    const db = initDatabase();
    const row = db.prepare('SELECT * FROM platform_configurations WHERE id = ?').get(id);
    return row ? this.parseConfigRow(row) : undefined;
  }

  public static saveConfig(
    config: Omit<PlatformConfig, 'id' | 'created_at' | 'updated_at'> & { id?: string },
    user = 'admin',
    changelog = 'Config update'
  ): { config: PlatformConfig; version: FeedVersion } {
    const db = initDatabase();
    const id = config.id || `custom_${Date.now().toString(36)}`;
    const existing = this.getConfig(id);
    const now = new Date().toISOString();

    const fullConfig: PlatformConfig = {
      ...config,
      id,
      created_at: existing ? existing.created_at : now,
      updated_at: now
    };

    db.prepare(`
      INSERT INTO platform_configurations (
        id, platform_name, feed_type, endpoint, authentication, auth_header_name, auth_header_value,
        required_fields, optional_fields, field_mapping, update_frequency_minutes, retry_policy, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        platform_name = excluded.platform_name,
        feed_type = excluded.feed_type,
        endpoint = excluded.endpoint,
        authentication = excluded.authentication,
        auth_header_name = excluded.auth_header_name,
        auth_header_value = excluded.auth_header_value,
        required_fields = excluded.required_fields,
        optional_fields = excluded.optional_fields,
        field_mapping = excluded.field_mapping,
        update_frequency_minutes = excluded.update_frequency_minutes,
        retry_policy = excluded.retry_policy,
        status = excluded.status,
        updated_at = excluded.updated_at
    `).run(
      fullConfig.id,
      fullConfig.platform_name,
      fullConfig.feed_type,
      fullConfig.endpoint,
      fullConfig.authentication,
      fullConfig.auth_header_name || null,
      fullConfig.auth_header_value || null,
      JSON.stringify(fullConfig.required_fields || []),
      JSON.stringify(fullConfig.optional_fields || []),
      JSON.stringify(fullConfig.field_mapping || {}),
      fullConfig.update_frequency_minutes,
      JSON.stringify(fullConfig.retry_policy || {}),
      fullConfig.status,
      fullConfig.created_at,
      fullConfig.updated_at
    );

    // Register with runtime adapter service
    AdapterService.register(new DynamicCustomAdapter(fullConfig));

    // Handle Versioning
    const history = this.getVersions(id);
    const nextVer = history.length > 0 ? Math.max(...history.map(h => h.version)) + 1 : 1;

    // Archive previous active versions
    db.prepare("UPDATE feed_versions SET status = 'ARCHIVED' WHERE platform_id = ? AND status = 'ACTIVE'").run(id);

    const versionId = `ver-${id}-${nextVer}`;
    db.prepare(`
      INSERT INTO feed_versions (id, version, platform_id, configuration, created_by, created_at, status, changelog)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      versionId,
      nextVer,
      id,
      JSON.stringify(fullConfig),
      user,
      now,
      'ACTIVE',
      changelog
    );

    const newVersion: FeedVersion = {
      id: versionId,
      version: nextVer,
      platformId: id,
      configuration: JSON.parse(JSON.stringify(fullConfig)),
      created_by: user,
      created_at: now,
      status: 'ACTIVE',
      changelog
    };

    return { config: fullConfig, version: newVersion };
  }

  public static deleteConfig(id: string): boolean {
    const db = initDatabase();
    const result = db.prepare('DELETE FROM platform_configurations WHERE id = ?').run(id);
    return result.changes > 0;
  }

  // --- Versioning & Rollback ---
  public static getVersions(platformId: string): FeedVersion[] {
    const db = initDatabase();
    const rows = db.prepare('SELECT * FROM feed_versions WHERE platform_id = ? ORDER BY version DESC').all(platformId) as any[];
    return rows.map(r => ({
      id: r.id,
      version: Number(r.version),
      platformId: r.platform_id,
      configuration: typeof r.configuration === 'string' ? JSON.parse(r.configuration) : r.configuration,
      created_by: r.created_by,
      created_at: r.created_at,
      status: r.status,
      changelog: r.changelog
    }));
  }

  public static rollbackVersion(platformId: string, targetVersionNumber: number, user = 'admin'): FeedVersion | undefined {
    const history = this.getVersions(platformId);
    const target = history.find(v => v.version === targetVersionNumber);
    if (!target) return undefined;

    // Apply configuration
    this.saveConfig(
      { ...target.configuration },
      user,
      `Rollback to version ${targetVersionNumber}`
    );

    return target;
  }
}
