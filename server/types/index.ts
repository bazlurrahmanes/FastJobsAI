export type RemoteType = 'remote' | 'hybrid' | 'onsite';
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'TEMPORARY';
export type ExperienceLevel = 'ENTRY' | 'MID' | 'SENIOR' | 'LEAD' | 'EXECUTIVE';
export type MasterJobStatus = 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'DISTRIBUTING' | 'PUBLISHED' | 'EXPIRED' | 'ARCHIVED';
export type VerificationStatus = 'VERIFIED' | 'UNVERIFIED' | 'FLAGGED';
export type CompanyVerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'SUSPENDED' | 'REJECTED';
export type FeedStatus = 'HEALTHY' | 'WARNING' | 'DEGRADED' | 'FAILED' | 'DISABLED';

export interface XMLFeedValidationReport {
  xmlValid: boolean;
  structureValid: boolean;
  requiredFieldsValid: boolean;
  urlsValid: boolean;
  datesValid: boolean;
  duplicateJobsCount: number;
  expiredJobsCount: number;
  missingCompanyOrApplyCount: number;
  isAbnormalOrEmpty: boolean;
  errors: string[];
  warnings: string[];
  anomalies: string[];
  totalParsedJobs: number;
  validJobsCount: number;
  sampleJobs?: Array<{ id: string; title: string; company?: string; valid: boolean; issues: string[] }>;
}

export interface MasterJob {
  job_id: string;
  company_id: string;
  title: string;
  description: string;
  location: string;
  country: string;
  city: string;
  remote_type: RemoteType;
  employment_type: EmploymentType;
  salary_min: number;
  salary_max: number;
  salary_currency: string;
  skills: string[];
  category: string;
  experience_level: ExperienceLevel;
  published_at: string;
  expires_at: string;
  updated_at: string;
  status: MasterJobStatus;
  apply_url: string;
  source: string;
  source_id: string;
  verification_status: VerificationStatus;
}

export interface MasterCompany {
  company_id: string;
  name: string;
  website: string;
  logo: string;
  description: string;
  verification_status: CompanyVerificationStatus;
  created_at: string;
  verified_at?: string;
  feed_token: string;
  contact_email: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface PlatformJob {
  platform: string;
  external_id: string;
  payload: Record<string, any>;
}

export interface HealthCheckResult {
  status: FeedStatus;
  latencyMs: number;
  message: string;
  lastChecked: string;
}

export interface PlatformAdapter {
  platformId: string;
  platformName: string;
  feedType: 'xml' | 'json' | 'jsonld';
  validate(job: MasterJob): ValidationResult;
  transform(job: MasterJob): PlatformJob;
  generateFeed(jobs: MasterJob[], options?: { baseUrl?: string; pretty?: boolean }): string;
  healthCheck(): Promise<HealthCheckResult>;
}

export interface JobPlatformControl {
  jobId: string;
  platformId: string;
  enabled: boolean;
  updatedAt: string;
  updatedBy: string;
}

export interface CompanyPlatformControl {
  companyId: string;
  platformId: string;
  enabled: boolean;
  updatedAt: string;
  updatedBy: string;
}

export interface PlatformConfig {
  id: string;
  platform_name: string;
  feed_type: 'xml' | 'json' | 'jsonld';
  endpoint: string;
  authentication: 'none' | 'bearer' | 'basic' | 'custom_header';
  auth_header_name?: string;
  auth_header_value?: string;
  required_fields: string[];
  optional_fields: string[];
  field_mapping: Record<string, string>;
  update_frequency_minutes: number;
  retry_policy: {
    max_retries: number;
    initial_delay_sec: number;
    backoff_multiplier: number;
  };
  status: 'active' | 'paused' | 'draft';
  created_at: string;
  updated_at: string;
}

export interface FeedVersion {
  id: string;
  version: number;
  platformId: string;
  configuration: PlatformConfig;
  created_by: string;
  created_at: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'ROLLBACK_AVAILABLE';
  changelog: string;
}

export interface FeedHealthRecord {
  feedId: string;
  name: string;
  url: string;
  feedType: 'master' | 'company' | 'platform';
  status: FeedStatus;
  httpStatus: number;
  responseTimeMs: number;
  jobCount: number;
  totalJobs: number;
  validJobs: number;
  rejectedJobs: number;
  xmlValid: boolean;
  xmlValidationStatus: 'VALID' | 'WARNING' | 'INVALID';
  lastGenerated: string;
  lastSuccessfulRun: string | null;
  lastFailure: string | null;
  consecutiveFailures: number;
  lastError: string | null;
  errorMessage?: string;
  retryStatus: 'IDLE' | 'QUEUED' | 'RETRYING' | 'SUCCEEDED' | 'FAILED_MAX_RETRIES';
  feedFreshness: string;
  anomalies: string[];
  validationReport?: XMLFeedValidationReport;
}

export interface FeedRunRecord {
  id: string;
  feedId: string;
  triggerType: 'http_request' | 'cron_worker' | 'manual' | 'retry';
  status: FeedStatus;
  totalItems: number;
  validItems: number;
  rejectedItems: number;
  responseTimeMs: number;
  startedAt: string;
  completedAt: string;
  errorMessage?: string;
  anomalies?: string[];
  validationDetails?: XMLFeedValidationReport;
}

export interface RetryJob {
  id: string;
  targetPlatform: string;
  jobId?: string;
  feedId?: string;
  attempt: number;
  maxAttempts: number;
  nextAttemptAt: string;
  lastError: string;
  history: Array<{
    attempt: number;
    timestamp: string;
    error: string;
    status: string;
  }>;
  status: 'QUEUED' | 'RETRYING' | 'SUCCEEDED' | 'FAILED_MAX_RETRIES';
  createdAt: string;
  updatedAt: string;
}

export interface ApplyEvent {
  id: string;
  type: 'job_view' | 'apply_click' | 'redirect';
  job_id: string;
  company_id: string;
  platform: string;
  source: string;
  user_id?: string;
  user_agent?: string;
  ip_hash?: string;
  timestamp: string;
}

export interface ApplyURLHealthReport {
  jobId: string;
  url: string;
  status: 'OK' | 'REDIRECT' | 'ERROR' | 'BLOCKED_SSRF';
  httpStatus?: number;
  latencyMs: number;
  lastChecked: string;
  errorMessage?: string;
}

export interface AttributionMetrics {
  totalViews: number;
  totalClicks: number;
  overallConversionRate: number;
  bySource: Record<string, { views: number; clicks: number; ctr: number }>;
  byPlatform: Record<string, { views: number; clicks: number; ctr: number }>;
}

export interface AIOptimizationResult {
  jobId: string;
  suggestedTitle: string;
  missingSkills: string[];
  recommendedCategory: string;
  contentQualityScore: number;
  qualityTips: string[];
  platformSuitability: Record<string, { score: number; reasons: string[] }>;
  generated_at: string;
  model_version: string;
  aiGenerated: boolean;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  duplicateOfJobId?: string;
  similarityScore: number;
  matchedCriteria: string[];
}

export interface MarketplaceListing {
  id: string;
  platformName: string;
  category: string;
  description: string;
  logoUrl: string;
  pricingPlan: 'FREE' | 'PRO' | 'ENTERPRISE';
  monthlyPrice: number;
  rating: number;
  reviewCount: number;
  subscriberCount: number;
  adapterId: string;
  status: 'PUBLISHED' | 'FEATURED' | 'BETA';
  features: string[];
}

export interface MarketplaceSubscription {
  id: string;
  companyId: string;
  listingId: string;
  status: 'ACTIVE' | 'TRIAL' | 'CANCELLED';
  apiKey: string;
  rateLimit: number;
  requestsThisMonth: number;
  startedAt: string;
  expiresAt: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  oldValue?: any;
  newValue?: any;
  timestamp: string;
  requestId?: string;
  ip?: string;
}

export type AuditLog = AuditLogEntry;
