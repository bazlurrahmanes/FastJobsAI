import { FeedHealthRecord, FeedRunRecord, FeedStatus, XMLFeedValidationReport } from '../types';
import { initDatabase } from '../db';
import { AdapterService } from './AdapterService';
import { CompanyService } from './CompanyService';
import { FeedService } from './FeedService';
import { JobService } from './JobService';
import { PlatformService } from './PlatformService';
import { RetryService } from './RetryService';
import { XMLFeedValidator } from './XMLFeedValidator';

export class HealthService {
  /**
   * Log an error event to the persistent feed_errors store
   */
  public static logError(feedId: string, error: string, context?: any): void {
    const db = initDatabase();
    const id = `err-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO feed_errors (id, feed_id, timestamp, error, context)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, feedId, now, error, JSON.stringify(context || {}));
  }

  /**
   * Fetch recent error logs
   */
  public static getErrorLogs(limit = 100): Array<{ id: string; feedId: string; timestamp: string; error: string; context?: any }> {
    const db = initDatabase();
    const rows = db.prepare('SELECT * FROM feed_errors ORDER BY timestamp DESC LIMIT ?').all(limit) as any[];
    return rows.map(r => ({
      id: r.id,
      feedId: r.feed_id,
      timestamp: r.timestamp,
      error: r.error,
      context: typeof r.context === 'string' ? JSON.parse(r.context) : r.context
    }));
  }

  /**
   * Calculate human-readable freshness label
   */
  public static calculateFreshness(lastSuccessfulRun: string | null): string {
    if (!lastSuccessfulRun) {
      return 'Never run';
    }
    const diffMs = Date.now() - new Date(lastSuccessfulRun).getTime();
    if (isNaN(diffMs) || diffMs < 0) return 'Just now';
    if (diffMs < 60000) return 'Just now';
    if (diffMs < 15 * 60000) {
      const mins = Math.floor(diffMs / 60000);
      return `${mins}m ago (Fresh)`;
    }
    if (diffMs < 60 * 60000) {
      const mins = Math.floor(diffMs / 60000);
      return `${mins}m ago`;
    }
    if (diffMs < 6 * 3600000) {
      const hours = Math.floor(diffMs / 3600000);
      return `${hours}h ago`;
    }
    const hours = Math.floor(diffMs / 3600000);
    return `Stale (${hours}h ago)`;
  }

  /**
   * Fetch all feed health snapshots from SQLite
   */
  public static getHealthRecords(): FeedHealthRecord[] {
    const db = initDatabase();
    const rows = db.prepare('SELECT * FROM feed_health ORDER BY feed_type ASC, name ASC').all() as any[];

    return rows.map(r => {
      let anomalies: string[] = [];
      try {
        anomalies = typeof r.anomalies === 'string' ? JSON.parse(r.anomalies) : (r.anomalies || []);
      } catch {
        anomalies = [];
      }

      let validationReport: XMLFeedValidationReport | undefined = undefined;
      try {
        validationReport = typeof r.validation_details === 'string' ? JSON.parse(r.validation_details) : r.validation_details;
      } catch {
        validationReport = undefined;
      }

      const lastSuccess = r.last_successful_run || null;
      const feedFreshness = this.calculateFreshness(lastSuccess);

      let xmlValidationStatus: 'VALID' | 'WARNING' | 'INVALID' = 'VALID';
      if (!Boolean(r.xml_valid)) {
        xmlValidationStatus = 'INVALID';
      } else if (validationReport?.warnings && validationReport.warnings.length > 0) {
        xmlValidationStatus = 'WARNING';
      }

      return {
        feedId: r.feed_id,
        name: r.name,
        url: r.url,
        feedType: (r.feed_type as 'master' | 'company' | 'platform') || 'master',
        status: r.status as FeedStatus,
        httpStatus: Number(r.http_status),
        responseTimeMs: Number(r.response_time_ms),
        jobCount: Number(r.total_jobs),
        totalJobs: Number(r.total_jobs),
        validJobs: Number(r.valid_jobs),
        rejectedJobs: Number(r.rejected_jobs),
        xmlValid: Boolean(r.xml_valid),
        xmlValidationStatus,
        lastGenerated: r.last_generated,
        lastSuccessfulRun: lastSuccess,
        lastFailure: r.last_failure || null,
        consecutiveFailures: Number(r.consecutive_failures || 0),
        lastError: r.error_message || null,
        errorMessage: r.error_message || undefined,
        retryStatus: (r.retry_status as any) || 'IDLE',
        feedFreshness,
        anomalies,
        validationReport
      };
    });
  }

  /**
   * Fetch a single feed health record by ID
   */
  public static getHealthRecordById(feedId: string): FeedHealthRecord | undefined {
    const all = this.getHealthRecords();
    return all.find(r => r.feedId === feedId);
  }

  /**
   * Fetch run execution logs for a feed
   */
  public static getFeedRuns(feedId: string, limit = 50): FeedRunRecord[] {
    const db = initDatabase();
    const rows = db.prepare(
      'SELECT * FROM feed_runs WHERE feed_id = ? ORDER BY started_at DESC LIMIT ?'
    ).all(feedId, limit) as any[];

    return rows.map(r => {
      let anomalies: string[] = [];
      try {
        anomalies = typeof r.anomalies === 'string' ? JSON.parse(r.anomalies) : (r.anomalies || []);
      } catch {
        anomalies = [];
      }

      let validationDetails: XMLFeedValidationReport | undefined;
      try {
        validationDetails = typeof r.validation_details === 'string' ? JSON.parse(r.validation_details) : r.validation_details;
      } catch {
        validationDetails = undefined;
      }

      return {
        id: r.id,
        feedId: r.feed_id,
        triggerType: r.trigger_type,
        status: r.status,
        totalItems: Number(r.total_items),
        validItems: Number(r.valid_items),
        rejectedItems: Number(r.rejected_items),
        responseTimeMs: Number(r.response_time_ms),
        startedAt: r.started_at,
        completedAt: r.completed_at,
        errorMessage: r.error_message || undefined,
        anomalies,
        validationDetails
      };
    });
  }

  /**
   * Check a single feed on demand and persist the diagnostic snapshot and execution run log
   */
  public static async checkSingleFeed(
    feedId: string,
    triggerType: 'manual' | 'retry' | 'http_request' | 'cron_worker' = 'manual'
  ): Promise<FeedHealthRecord> {
    const db = initDatabase();
    const existingRow = db.prepare('SELECT * FROM feed_health WHERE feed_id = ?').get(feedId) as any;
    const previousJobCount = existingRow ? Number(existingRow.total_jobs) : undefined;
    let consecutiveFailures = existingRow ? Number(existingRow.consecutive_failures || 0) : 0;
    let lastSuccessfulRun = existingRow ? (existingRow.last_successful_run || null) : null;
    let lastFailure = existingRow ? (existingRow.last_failure || null) : null;

    const startTime = Date.now();
    const startTimeIso = new Date(startTime).toISOString();

    let name = existingRow ? existingRow.name : feedId;
    let url = existingRow ? existingRow.url : '';
    let feedType: 'master' | 'company' | 'platform' = existingRow?.feed_type || 'master';
    let httpStatus = 200;
    let latencyMs = 0;
    let totalJobs = 0;
    let validJobs = 0;
    let rejectedJobs = 0;
    let errorMessage: string | null = null;
    let isDisabled = false;
    let validationReport: XMLFeedValidationReport = {
      xmlValid: true,
      structureValid: true,
      requiredFieldsValid: true,
      urlsValid: true,
      datesValid: true,
      duplicateJobsCount: 0,
      expiredJobsCount: 0,
      missingCompanyOrApplyCount: 0,
      isAbnormalOrEmpty: false,
      errors: [],
      warnings: [],
      anomalies: [],
      totalParsedJobs: 0,
      validJobsCount: 0,
      sampleJobs: []
    };

    try {
      // 1. Master Feed Check
      if (feedId === 'master_xml') {
        feedType = 'master';
        name = 'Master XML Feed (/feeds/master.xml)';
        url = '/feeds/master.xml';

        const feedResult = FeedService.generateMasterXMLFeed({ skipCache: true });
        latencyMs = Date.now() - startTime;
        totalJobs = feedResult.jobCount;
        validJobs = feedResult.jobCount;
        rejectedJobs = 0;

        validationReport = XMLFeedValidator.validateFeed(feedResult.content, 'master', {
          previousJobCount,
          feedUrl: url
        });

        if (!validationReport.xmlValid) {
          errorMessage = validationReport.errors[0] || 'XML structure validation failed';
        }
      }
      // 2. Company Feed Check
      else if (feedId.startsWith('company_')) {
        feedType = 'company';
        const companyId = feedId.replace('company_', '');
        const company = CompanyService.getById(companyId);

        if (!company) {
          httpStatus = 404;
          latencyMs = Date.now() - startTime;
          errorMessage = `Company with ID '${companyId}' not found`;
          name = `Unknown Company Feed (${companyId})`;
          url = `/feeds/company/${companyId}.xml`;
        } else {
          name = `${company.name} Feed`;
          url = `/feeds/company/${company.company_id}.xml`;

          if (company.verification_status !== 'VERIFIED') {
            isDisabled = true;
            httpStatus = 403;
            latencyMs = Date.now() - startTime;
            errorMessage = `Company verification status is ${company.verification_status} (distribution disabled)`;
            totalJobs = JobService.getByCompany(company.company_id).length;
            validJobs = 0;
            rejectedJobs = totalJobs;
          } else {
            const compFeed = FeedService.generateCompanyXMLFeed(company.company_id, { skipCache: true });
            latencyMs = Date.now() - startTime;
            totalJobs = compFeed.jobCount;
            validJobs = compFeed.jobCount;
            rejectedJobs = 0;

            validationReport = XMLFeedValidator.validateFeed(compFeed.content, 'company', {
              previousJobCount,
              isCompanyVerified: true,
              feedUrl: url
            });

            if (compFeed.error) {
              errorMessage = compFeed.error;
              httpStatus = compFeed.error.includes('found') ? 404 : 403;
            } else if (!validationReport.xmlValid) {
              errorMessage = validationReport.errors[0] || 'Company XML validation failed';
            }
          }
        }
      }
      // 3. Platform Feed Check
      else if (feedId.startsWith('platform_')) {
        feedType = 'platform';
        const platformId = feedId.replace('platform_', '');
        const adapter = AdapterService.get(platformId);
        const config = PlatformService.getConfig(platformId);

        name = adapter?.platformName || config?.platform_name || `${platformId} Feed`;
        const ext = adapter?.feedType || config?.feed_type || 'xml';
        url = `/feeds/platform/${platformId}.${ext}`;

        const isGloballyEnabled = PlatformService.isPlatformEnabled(platformId);
        if (!isGloballyEnabled) {
          isDisabled = true;
          httpStatus = 200;
          latencyMs = Date.now() - startTime;
          errorMessage = `Platform '${name}' is paused globally`;
          totalJobs = JobService.getEligibleJobs().length;
          validJobs = 0;
          rejectedJobs = totalJobs;
        } else {
          const platFeed = FeedService.generatePlatformFeed(platformId, { skipCache: true });
          latencyMs = Date.now() - startTime;
          totalJobs = platFeed.jobCount;
          validJobs = platFeed.jobCount;
          rejectedJobs = platFeed.rejectedCount;

          if (platFeed.error) {
            errorMessage = platFeed.error;
            httpStatus = platFeed.error.includes('disabled') ? 403 : 500;
          } else {
            validationReport = XMLFeedValidator.validateFeed(platFeed.content, 'platform', {
              platformId,
              previousJobCount,
              feedUrl: url
            });

            if (!validationReport.xmlValid) {
              errorMessage = validationReport.errors[0] || 'Platform feed validation failed';
            }
          }
        }
      } else {
        // Fallback for custom configured feed
        latencyMs = Date.now() - startTime;
        errorMessage = `Unknown feed identifier '${feedId}'`;
        httpStatus = 404;
      }
    } catch (err: any) {
      httpStatus = 500;
      latencyMs = Date.now() - startTime;
      errorMessage = err.message || 'Fatal diagnostic execution error';
      validationReport.xmlValid = false;
      validationReport.errors.push(errorMessage!);
      validationReport.anomalies.push('ANOMALY_EXECUTION_ERROR');
    }

    const completedTime = Date.now();
    const completedTimeIso = new Date(completedTime).toISOString();

    // Compile anomalies
    const anomalies: string[] = [...validationReport.anomalies];

    // High latency anomaly
    if (latencyMs > 1500 && !isDisabled) {
      anomalies.push('ANOMALY_HIGH_LATENCY');
    }

    // Rate limit anomaly
    if (httpStatus === 429) {
      anomalies.push('ANOMALY_RATE_LIMITED');
    }

    // 4xx/5xx anomaly
    if (httpStatus >= 500) {
      anomalies.push('ANOMALY_SERVER_ERROR');
    }

    // Stale feed anomaly (if not checked successfully in >6 hours)
    if (lastSuccessfulRun) {
      const diffHours = (Date.now() - new Date(lastSuccessfulRun).getTime()) / 3600000;
      if (diffHours > 6 && !isDisabled) {
        anomalies.push('ANOMALY_STALE_FEED');
      }
    }

    // Determine success or failure
    const isSuccess = httpStatus === 200 && validationReport.xmlValid && !errorMessage && !isDisabled;

    if (isSuccess) {
      consecutiveFailures = 0;
      lastSuccessfulRun = completedTimeIso;
    } else if (!isDisabled) {
      consecutiveFailures += 1;
      lastFailure = completedTimeIso;
    }

    if (consecutiveFailures >= 2) {
      anomalies.push('ANOMALY_REPEATED_FAILURES');
    }

    // Retry System Integration: manage queue state
    let retryStatus: 'IDLE' | 'QUEUED' | 'RETRYING' | 'SUCCEEDED' | 'FAILED_MAX_RETRIES' = 'IDLE';
    const activeRetry = RetryService.getActiveRetryForFeed(feedId);

    if (isSuccess) {
      if (activeRetry) {
        RetryService.markSucceededForFeed(feedId);
        retryStatus = 'SUCCEEDED';
      } else {
        retryStatus = 'IDLE';
      }
    } else if (!isDisabled && (httpStatus >= 500 || httpStatus === 429 || !validationReport.xmlValid || latencyMs > 3000)) {
      if (activeRetry) {
        retryStatus = activeRetry.status as any;
      } else {
        // Enqueue retry with exponential backoff
        const newRetry = RetryService.enqueue(name, feedId, errorMessage || 'Diagnostic validation failed', 3);
        retryStatus = newRetry.status;
      }
    } else if (activeRetry) {
      retryStatus = activeRetry.status as any;
    }

    // Final Health Status Decision: HEALTHY / WARNING / DEGRADED / FAILED / DISABLED
    let finalStatus: FeedStatus = 'HEALTHY';
    if (isDisabled) {
      finalStatus = 'DISABLED';
    } else if (httpStatus >= 500 || consecutiveFailures >= 3 || !validationReport.xmlValid) {
      finalStatus = 'FAILED';
    } else if (
      httpStatus === 429 ||
      consecutiveFailures >= 1 ||
      retryStatus === 'RETRYING' ||
      retryStatus === 'QUEUED' ||
      anomalies.includes('ANOMALY_JOB_DROP') ||
      latencyMs > 1500
    ) {
      finalStatus = 'DEGRADED';
    } else if (
      anomalies.includes('ANOMALY_EMPTY_FEED') ||
      anomalies.includes('ANOMALY_EXPIRED_JOBS') ||
      anomalies.includes('ANOMALY_STALE_FEED') ||
      latencyMs > 800 ||
      validationReport.warnings.length > 0 ||
      httpStatus !== 200
    ) {
      finalStatus = 'WARNING';
    } else {
      finalStatus = 'HEALTHY';
    }

    const uniqueAnomalies = Array.from(new Set(anomalies));

    // Persist to feed_health snapshot
    const upsertHealth = db.prepare(`
      INSERT INTO feed_health (
        feed_id, name, url, feed_type, status, http_status, response_time_ms,
        total_jobs, valid_jobs, rejected_jobs, xml_valid, last_generated,
        error_message, last_successful_run, last_failure, consecutive_failures,
        retry_status, anomalies, validation_details
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(feed_id) DO UPDATE SET
        name = excluded.name,
        url = excluded.url,
        feed_type = excluded.feed_type,
        status = excluded.status,
        http_status = excluded.http_status,
        response_time_ms = excluded.response_time_ms,
        total_jobs = excluded.total_jobs,
        valid_jobs = excluded.valid_jobs,
        rejected_jobs = excluded.rejected_jobs,
        xml_valid = excluded.xml_valid,
        last_generated = excluded.last_generated,
        error_message = excluded.error_message,
        last_successful_run = excluded.last_successful_run,
        last_failure = excluded.last_failure,
        consecutive_failures = excluded.consecutive_failures,
        retry_status = excluded.retry_status,
        anomalies = excluded.anomalies,
        validation_details = excluded.validation_details
    `);

    upsertHealth.run(
      feedId,
      name,
      url,
      feedType,
      finalStatus,
      httpStatus,
      latencyMs,
      totalJobs,
      validJobs,
      rejectedJobs,
      validationReport.xmlValid ? 1 : 0,
      completedTimeIso,
      errorMessage,
      lastSuccessfulRun,
      lastFailure,
      consecutiveFailures,
      retryStatus,
      JSON.stringify(uniqueAnomalies),
      JSON.stringify(validationReport)
    );

    // Persist execution log to feed_runs
    const runId = `run-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const insertRun = db.prepare(`
      INSERT INTO feed_runs (
        id, feed_id, trigger_type, status, total_items, valid_items,
        rejected_items, response_time_ms, started_at, completed_at,
        error_message, anomalies, validation_details
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertRun.run(
      runId,
      feedId,
      triggerType,
      finalStatus,
      totalJobs,
      validJobs,
      rejectedJobs,
      latencyMs,
      startTimeIso,
      completedTimeIso,
      errorMessage,
      JSON.stringify(uniqueAnomalies),
      JSON.stringify(validationReport)
    );

    // If failed, record in feed_errors
    if (errorMessage && !isDisabled) {
      this.logError(feedId, errorMessage, {
        status: finalStatus,
        httpStatus,
        anomalies: uniqueAnomalies,
        triggerType
      });
    }

    let xmlValidationStatus: 'VALID' | 'WARNING' | 'INVALID' = 'VALID';
    if (!validationReport.xmlValid) {
      xmlValidationStatus = 'INVALID';
    } else if (validationReport.warnings.length > 0) {
      xmlValidationStatus = 'WARNING';
    }

    return {
      feedId,
      name,
      url,
      feedType,
      status: finalStatus,
      httpStatus,
      responseTimeMs: latencyMs,
      jobCount: totalJobs,
      totalJobs,
      validJobs,
      rejectedJobs,
      xmlValid: validationReport.xmlValid,
      xmlValidationStatus,
      lastGenerated: completedTimeIso,
      lastSuccessfulRun,
      lastFailure,
      consecutiveFailures,
      lastError: errorMessage,
      errorMessage: errorMessage || undefined,
      retryStatus,
      feedFreshness: this.calculateFreshness(lastSuccessfulRun),
      anomalies: uniqueAnomalies,
      validationReport
    };
  }

  /**
   * Run diagnostics across EVERY Master, Company, and Platform XML feed.
   */
  public static async runDiagnostics(
    triggerType: 'cron_worker' | 'manual' = 'manual'
  ): Promise<FeedHealthRecord[]> {
    const results: FeedHealthRecord[] = [];

    // 1. Master XML Feed
    try {
      const masterRecord = await this.checkSingleFeed('master_xml', triggerType);
      results.push(masterRecord);
    } catch (err: any) {
      console.error('[HealthService] Failed to check master_xml:', err);
    }

    // 2. Company XML Feeds (all companies)
    const companies = CompanyService.getAll();
    for (const comp of companies) {
      try {
        const compRecord = await this.checkSingleFeed(`company_${comp.company_id}`, triggerType);
        results.push(compRecord);
      } catch (err: any) {
        console.error(`[HealthService] Failed to check company_${comp.company_id}:`, err);
      }
    }

    // 3. Platform Feeds (Standard adapters & dynamic configs)
    const seenPlatforms = new Set<string>();
    const adapters = AdapterService.getAll();

    for (const adapter of adapters) {
      seenPlatforms.add(adapter.platformId);
      try {
        const platRecord = await this.checkSingleFeed(`platform_${adapter.platformId}`, triggerType);
        results.push(platRecord);
      } catch (err: any) {
        console.error(`[HealthService] Failed to check platform_${adapter.platformId}:`, err);
      }
    }

    // Dynamic platform configurations from database
    const configs = PlatformService.getAllConfigs();
    for (const conf of configs) {
      if (!seenPlatforms.has(conf.id)) {
        seenPlatforms.add(conf.id);
        try {
          const platRecord = await this.checkSingleFeed(`platform_${conf.id}`, triggerType);
          results.push(platRecord);
        } catch (err: any) {
          console.error(`[HealthService] Failed to check custom platform_${conf.id}:`, err);
        }
      }
    }

    return results;
  }
}
