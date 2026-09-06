import { getDatabase, IDatabase } from './database';

export const SCHEMA_SQL = `
-- 1. Companies Table
CREATE TABLE IF NOT EXISTS companies (
  company_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  website TEXT NOT NULL,
  logo TEXT NOT NULL,
  description TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TEXT NOT NULL,
  verified_at TEXT,
  feed_token TEXT NOT NULL UNIQUE,
  contact_email TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_companies_verification ON companies(verification_status);

-- 2. Master Jobs Table
CREATE TABLE IF NOT EXISTS jobs (
  job_id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  remote_type TEXT NOT NULL,
  employment_type TEXT NOT NULL,
  salary_min REAL NOT NULL,
  salary_max REAL NOT NULL,
  salary_currency TEXT NOT NULL DEFAULT 'USD',
  skills TEXT NOT NULL DEFAULT '[]',
  category TEXT NOT NULL,
  experience_level TEXT NOT NULL,
  published_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  apply_url TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'jobxora_direct',
  source_id TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'VERIFIED',
  content_hash TEXT,
  FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_expires ON jobs(expires_at);
CREATE INDEX IF NOT EXISTS idx_jobs_verification ON jobs(verification_status);
CREATE INDEX IF NOT EXISTS idx_jobs_content_hash ON jobs(content_hash);

-- 3. Job Sources Table
CREATE TABLE IF NOT EXISTS job_sources (
  id TEXT PRIMARY KEY,
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL, -- direct, ats_greenhouse, ats_lever, api_ingest, scrape
  base_url TEXT,
  sync_frequency_min INTEGER NOT NULL DEFAULT 60,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 4. Platforms Table
CREATE TABLE IF NOT EXISTS platforms (
  id TEXT PRIMARY KEY,
  platform_name TEXT NOT NULL,
  feed_type TEXT NOT NULL, -- xml, json, jsonld
  is_enabled INTEGER NOT NULL DEFAULT 1,
  default_auth_type TEXT NOT NULL DEFAULT 'none',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 5. Platform Configurations (No-Code Dynamic Feeds)
CREATE TABLE IF NOT EXISTS platform_configurations (
  id TEXT PRIMARY KEY,
  platform_name TEXT NOT NULL,
  feed_type TEXT NOT NULL, -- xml, json, jsonld
  endpoint TEXT NOT NULL,
  authentication TEXT NOT NULL DEFAULT 'none',
  auth_header_name TEXT,
  auth_header_value TEXT,
  required_fields TEXT NOT NULL DEFAULT '[]',
  optional_fields TEXT NOT NULL DEFAULT '[]',
  field_mapping TEXT NOT NULL DEFAULT '{}',
  update_frequency_minutes INTEGER NOT NULL DEFAULT 60,
  retry_policy TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 6. Job Platform Controls (Job-Level Distribution Toggles)
CREATE TABLE IF NOT EXISTS job_platform_controls (
  job_id TEXT NOT NULL,
  platform_id TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  PRIMARY KEY (job_id, platform_id)
);
CREATE INDEX IF NOT EXISTS idx_job_platform_controls_job ON job_platform_controls(job_id);

-- 7. Company Platform Controls (Company-Level Distribution Toggles)
CREATE TABLE IF NOT EXISTS company_platform_controls (
  company_id TEXT NOT NULL,
  platform_id TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  PRIMARY KEY (company_id, platform_id)
);
CREATE INDEX IF NOT EXISTS idx_company_platform_controls_comp ON company_platform_controls(company_id);

-- 8. Feed Configurations
CREATE TABLE IF NOT EXISTS feed_configs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  feed_type TEXT NOT NULL,
  target_entity TEXT NOT NULL, -- master, company, custom_platform
  is_active INTEGER NOT NULL DEFAULT 1,
  filter_rules TEXT NOT NULL DEFAULT '{}',
  rate_limit_per_min INTEGER NOT NULL DEFAULT 120,
  cache_ttl_sec INTEGER NOT NULL DEFAULT 60,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 9. Feed Versions (Snapshots & Rollbacks)
CREATE TABLE IF NOT EXISTS feed_versions (
  id TEXT PRIMARY KEY,
  version INTEGER NOT NULL,
  platform_id TEXT NOT NULL,
  configuration TEXT NOT NULL, -- JSON snapshot
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  changelog TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_feed_versions_platform ON feed_versions(platform_id, version);

-- 10. Feed Runs (Execution Logs)
CREATE TABLE IF NOT EXISTS feed_runs (
  id TEXT PRIMARY KEY,
  feed_id TEXT NOT NULL,
  trigger_type TEXT NOT NULL DEFAULT 'http_request', -- http_request, cron_worker, manual, retry
  status TEXT NOT NULL, -- HEALTHY, WARNING, DEGRADED, FAILED, DISABLED
  total_items INTEGER NOT NULL DEFAULT 0,
  valid_items INTEGER NOT NULL DEFAULT 0,
  rejected_items INTEGER NOT NULL DEFAULT 0,
  response_time_ms INTEGER NOT NULL DEFAULT 0,
  started_at TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  error_message TEXT,
  anomalies TEXT DEFAULT '[]',
  validation_details TEXT DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_feed_runs_feed ON feed_runs(feed_id, started_at);

-- 11. Feed Errors (Error Log Store)
CREATE TABLE IF NOT EXISTS feed_errors (
  id TEXT PRIMARY KEY,
  feed_id TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  error TEXT NOT NULL,
  context TEXT DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_feed_errors_feed ON feed_errors(feed_id, timestamp);

-- 12. Feed Retry Queue
CREATE TABLE IF NOT EXISTS feed_retry_queue (
  id TEXT PRIMARY KEY,
  target_platform TEXT NOT NULL,
  job_id TEXT,
  feed_id TEXT,
  attempt INTEGER NOT NULL DEFAULT 1,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  next_attempt_at TEXT NOT NULL,
  last_error TEXT NOT NULL,
  history TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'QUEUED', -- QUEUED, RETRYING, SUCCEEDED, FAILED_MAX_RETRIES
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_feed_retry_status ON feed_retry_queue(status, next_attempt_at);

-- 13. Feed Health (Real-Time Diagnostic Snapshot)
CREATE TABLE IF NOT EXISTS feed_health (
  feed_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  feed_type TEXT NOT NULL DEFAULT 'master', -- master, company, platform
  status TEXT NOT NULL DEFAULT 'HEALTHY', -- HEALTHY, WARNING, DEGRADED, FAILED, DISABLED
  http_status INTEGER NOT NULL DEFAULT 200,
  response_time_ms INTEGER NOT NULL DEFAULT 0,
  total_jobs INTEGER NOT NULL DEFAULT 0,
  valid_jobs INTEGER NOT NULL DEFAULT 0,
  rejected_jobs INTEGER NOT NULL DEFAULT 0,
  xml_valid INTEGER NOT NULL DEFAULT 1,
  last_generated TEXT NOT NULL,
  error_message TEXT,
  last_successful_run TEXT,
  last_failure TEXT,
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  retry_status TEXT NOT NULL DEFAULT 'IDLE',
  anomalies TEXT NOT NULL DEFAULT '[]',
  validation_details TEXT NOT NULL DEFAULT '{}'
);

-- 14. Apply URLs (Destination Health & Validation Cache)
CREATE TABLE IF NOT EXISTS apply_urls (
  job_id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OK', -- OK, REDIRECT, ERROR, BLOCKED_SSRF
  http_status INTEGER,
  latency_ms INTEGER NOT NULL DEFAULT 0,
  last_checked TEXT NOT NULL,
  error_message TEXT,
  FOREIGN KEY (job_id) REFERENCES jobs(job_id) ON DELETE CASCADE
);

-- 15. Apply Events (Attribution & Click Stream)
CREATE TABLE IF NOT EXISTS apply_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- job_view, apply_click, redirect
  job_id TEXT NOT NULL,
  company_id TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'direct',
  source TEXT NOT NULL DEFAULT 'jobxora',
  user_id TEXT,
  user_agent TEXT,
  ip_hash TEXT,
  timestamp TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_apply_events_job ON apply_events(job_id);
CREATE INDEX IF NOT EXISTS idx_apply_events_platform ON apply_events(platform);
CREATE INDEX IF NOT EXISTS idx_apply_events_time ON apply_events(timestamp);

-- 16. Source Attributions (Aggregated Funnel Metrics)
CREATE TABLE IF NOT EXISTS source_attributions (
  id TEXT PRIMARY KEY,
  source_name TEXT NOT NULL UNIQUE,
  channel_type TEXT NOT NULL DEFAULT 'organic',
  total_impressions INTEGER NOT NULL DEFAULT 0,
  total_clicks INTEGER NOT NULL DEFAULT 0,
  conversion_rate REAL NOT NULL DEFAULT 0.0,
  last_event_at TEXT NOT NULL
);

-- 17. Company Verifications (Compliance & Trust Audit)
CREATE TABLE IF NOT EXISTS company_verifications (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  verification_status TEXT NOT NULL,
  reviewed_by TEXT NOT NULL,
  reviewed_at TEXT NOT NULL,
  notes TEXT,
  documents TEXT DEFAULT '[]',
  FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_comp_verifications_comp ON company_verifications(company_id);

-- 18. AI Optimizations (Gemini Analysis & SEO Persistence)
CREATE TABLE IF NOT EXISTS ai_optimizations (
  job_id TEXT PRIMARY KEY,
  suggested_title TEXT NOT NULL,
  missing_skills TEXT NOT NULL DEFAULT '[]',
  recommended_category TEXT NOT NULL,
  content_quality_score REAL NOT NULL DEFAULT 85,
  quality_tips TEXT NOT NULL DEFAULT '[]',
  platform_suitability TEXT NOT NULL DEFAULT '{}',
  generated_at TEXT NOT NULL,
  model_version TEXT NOT NULL DEFAULT 'gemini-3.7-flash',
  ai_generated INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (job_id) REFERENCES jobs(job_id) ON DELETE CASCADE
);

-- 19. Platform Match Scores (Per-Platform Computed Match)
CREATE TABLE IF NOT EXISTS platform_match_scores (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  platform_id TEXT NOT NULL,
  score REAL NOT NULL,
  reasons TEXT NOT NULL DEFAULT '[]',
  calculated_at TEXT NOT NULL,
  UNIQUE(job_id, platform_id),
  FOREIGN KEY (job_id) REFERENCES jobs(job_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_plat_match_job ON platform_match_scores(job_id);

-- 20. Audit Logs (Immutable Security Audit Trail)
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  timestamp TEXT NOT NULL,
  request_id TEXT NOT NULL,
  ip TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_res ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_time ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- 21. Subscriptions (Marketplace Distribution Tier Subscriptions)
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  listing_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  api_key TEXT NOT NULL UNIQUE,
  rate_limit INTEGER NOT NULL DEFAULT 10000,
  requests_this_month INTEGER NOT NULL DEFAULT 0,
  started_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_subs_comp ON subscriptions(company_id);

-- 22. Marketplace Listings (Platform Catalog & Syndicate Partners)
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id TEXT PRIMARY KEY,
  platform_name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  pricing_plan TEXT NOT NULL DEFAULT 'FREE',
  monthly_price REAL NOT NULL DEFAULT 0.0,
  rating REAL NOT NULL DEFAULT 5.0,
  review_count INTEGER NOT NULL DEFAULT 0,
  subscriber_count INTEGER NOT NULL DEFAULT 0,
  adapter_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PUBLISHED',
  features TEXT NOT NULL DEFAULT '[]'
);

-- 23. Contracts Table (FastJobs Standalone Contract Management)
CREATE TABLE IF NOT EXISTS contracts (
  id TEXT PRIMARY KEY,
  contract_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, pending, active, completed, cancelled
  contract_type TEXT NOT NULL DEFAULT 'full_time', -- full_time, part_time, contractor, freelance, c2c, internship
  employer_id TEXT NOT NULL,
  company_name TEXT NOT NULL,
  employer_contact_name TEXT NOT NULL,
  employer_email TEXT NOT NULL,
  employer_address TEXT,
  signatory_title TEXT,
  candidate_id TEXT NOT NULL,
  candidate_name TEXT NOT NULL,
  candidate_email TEXT NOT NULL,
  candidate_phone TEXT,
  candidate_address TEXT,
  job_id TEXT,
  job_title TEXT NOT NULL,
  department TEXT,
  work_location TEXT NOT NULL,
  expected_hours_per_week REAL,
  start_date TEXT NOT NULL,
  end_date TEXT,
  is_ongoing INTEGER NOT NULL DEFAULT 1,
  notice_period_days INTEGER NOT NULL DEFAULT 14,
  probation_period_months INTEGER DEFAULT 0,
  rate REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_frequency TEXT NOT NULL DEFAULT 'annually',
  payment_schedule TEXT NOT NULL DEFAULT 'Bi-weekly',
  overtime_rate REAL,
  bonus_terms TEXT,
  equity_terms TEXT,
  benefits_summary TEXT,
  scope_of_work TEXT NOT NULL,
  confidentiality_clause TEXT NOT NULL,
  ip_assignment_clause TEXT NOT NULL,
  termination_clause TEXT NOT NULL,
  non_solicitation_clause TEXT,
  governing_jurisdiction TEXT NOT NULL,
  special_conditions TEXT,
  employer_signed_at TEXT,
  employer_signed_by TEXT,
  candidate_signed_at TEXT,
  candidate_signed_by TEXT,
  cancellation_reason TEXT,
  cancelled_by TEXT,
  cancelled_at TEXT,
  completed_at TEXT,
  template_id TEXT,
  compensation_json TEXT,
  history_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_contracts_employer ON contracts(employer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_candidate ON contracts(candidate_id);
CREATE INDEX IF NOT EXISTS idx_contracts_candidate_email ON contracts(candidate_email);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);

-- 24. Contract Audits Table (High Integrity Non-Repudiation Audit Trail)
CREATE TABLE IF NOT EXISTS contract_audits (
  id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  action TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  actor_email TEXT,
  summary TEXT NOT NULL,
  details TEXT,
  previous_status TEXT,
  new_status TEXT,
  ip_address TEXT,
  FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_contract_audits_contract ON contract_audits(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_audits_time ON contract_audits(timestamp);
`;

export function initSchema(db: IDatabase): void {
  db.exec(SCHEMA_SQL);

  // Dynamic schema column migration for existing databases
  try {
    const healthCols = (db.prepare('PRAGMA table_info(feed_health)').all() as Array<{ name: string }>).map(c => c.name);
    if (!healthCols.includes('feed_type')) {
      db.exec("ALTER TABLE feed_health ADD COLUMN feed_type TEXT NOT NULL DEFAULT 'master'");
    }
    if (!healthCols.includes('last_successful_run')) {
      db.exec("ALTER TABLE feed_health ADD COLUMN last_successful_run TEXT");
    }
    if (!healthCols.includes('last_failure')) {
      db.exec("ALTER TABLE feed_health ADD COLUMN last_failure TEXT");
    }
    if (!healthCols.includes('consecutive_failures')) {
      db.exec("ALTER TABLE feed_health ADD COLUMN consecutive_failures INTEGER NOT NULL DEFAULT 0");
    }
    if (!healthCols.includes('retry_status')) {
      db.exec("ALTER TABLE feed_health ADD COLUMN retry_status TEXT NOT NULL DEFAULT 'IDLE'");
    }
    if (!healthCols.includes('anomalies')) {
      db.exec("ALTER TABLE feed_health ADD COLUMN anomalies TEXT NOT NULL DEFAULT '[]'");
    }
    if (!healthCols.includes('validation_details')) {
      db.exec("ALTER TABLE feed_health ADD COLUMN validation_details TEXT NOT NULL DEFAULT '{}'");
    }

    const runCols = (db.prepare('PRAGMA table_info(feed_runs)').all() as Array<{ name: string }>).map(c => c.name);
    if (!runCols.includes('anomalies')) {
      db.exec("ALTER TABLE feed_runs ADD COLUMN anomalies TEXT DEFAULT '[]'");
    }
    if (!runCols.includes('validation_details')) {
      db.exec("ALTER TABLE feed_runs ADD COLUMN validation_details TEXT DEFAULT '{}'");
    }
  } catch (err) {
    console.error('[Database] Warning migrating feed health schema columns:', err);
  }
}
