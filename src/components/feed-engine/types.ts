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
  sampleJobs: Array<{
    id: string;
    title: string;
    company: string;
    location: string;
    applyUrl: string;
    postedAt?: string;
    expiresAt?: string;
    issues: string[];
  }>;
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
  triggerType: 'cron_worker' | 'manual' | 'retry' | 'http_request';
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

export interface FeedErrorLog {
  id: string;
  feedId: string;
  timestamp: string;
  error: string;
  context?: any;
}
