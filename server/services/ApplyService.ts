import { URL } from 'url';
import { ApplyURLHealthReport } from '../types';
import { initDatabase } from '../db';
import { JobService } from './JobService';

export class ApplyService {
  /**
   * Strictly validate URL to prevent SSRF vulnerabilities
   */
  public static isSafeURL(urlString: string): { safe: boolean; reason?: string } {
    try {
      const parsed = new URL(urlString);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return { safe: false, reason: 'Protocol must be HTTP or HTTPS' };
      }

      const hostname = parsed.hostname.toLowerCase();
      // Block localhost, IPv6 loopback, local broadcast, internal RFC1918 & link-local IP addresses
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '0.0.0.0' ||
        hostname === '::1' ||
        hostname.endsWith('.local') ||
        hostname.endsWith('.internal') ||
        /^10\./.test(hostname) ||
        /^192\.168\./.test(hostname) ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
        /^169\.254\./.test(hostname) // AWS/GCP metadata service
      ) {
        return { safe: false, reason: 'Target host violates SSRF security boundary' };
      }

      return { safe: true };
    } catch {
      return { safe: false, reason: 'Malformed URL format' };
    }
  }

  /**
   * Resolve canonical destination and embed secure tracking parameters
   */
  public static resolveApplyTarget(
    jobId: string,
    querySource?: string
  ): { targetUrl?: string; error?: string; status: number; jobId?: string; companyId?: string; job_id?: string; company_id?: string } {
    const job = JobService.getById(jobId);
    if (!job) {
      return { error: 'Job posting not found', status: 404 };
    }

    if (job.status === 'EXPIRED' || job.status === 'ARCHIVED') {
      return { error: 'This job posting has expired and is no longer accepting applications.', status: 410, jobId: job.job_id, companyId: job.company_id, job_id: job.job_id, company_id: job.company_id };
    }

    const ssrfCheck = this.isSafeURL(job.apply_url);
    if (!ssrfCheck.safe) {
      return { error: `Invalid application destination: ${ssrfCheck.reason}`, status: 400, jobId: job.job_id, companyId: job.company_id, job_id: job.job_id, company_id: job.company_id };
    }

    try {
      const url = new URL(job.apply_url);
      const utmSource = querySource || 'jobxora';
      url.searchParams.set('utm_source', utmSource);
      url.searchParams.set('utm_medium', 'job_feed');
      url.searchParams.set('utm_campaign', 'jobxora_distribution');
      url.searchParams.set('jx_ref', jobId);

      return {
        targetUrl: url.toString(),
        status: 302,
        jobId: job.job_id,
        companyId: job.company_id,
        job_id: job.job_id,
        company_id: job.company_id
      };
    } catch (err: any) {
      return { error: err.message, status: 500, jobId: job.job_id, companyId: job.company_id, job_id: job.job_id, company_id: job.company_id };
    }
  }

  /**
   * Health check external apply destination & persist to apply_urls
   */
  public static async checkApplyUrlHealth(jobId: string): Promise<ApplyURLHealthReport> {
    const job = JobService.getById(jobId);
    const now = new Date().toISOString();

    if (!job) {
      return {
        jobId,
        url: '',
        status: 'ERROR',
        latencyMs: 0,
        lastChecked: now,
        errorMessage: 'Job not found'
      };
    }

    const ssrf = this.isSafeURL(job.apply_url);
    if (!ssrf.safe) {
      const report: ApplyURLHealthReport = {
        jobId,
        url: job.apply_url,
        status: 'BLOCKED_SSRF',
        latencyMs: 0,
        lastChecked: now,
        errorMessage: ssrf.reason
      };
      this.saveHealthReport(report);
      return report;
    }

    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      // Perform lightweight HEAD request
      const res = await fetch(job.apply_url, {
        method: 'HEAD',
        signal: controller.signal,
        headers: { 'User-Agent': 'FastJobs-ApplyHealthBot/2.0' }
      });
      clearTimeout(timeout);

      const latencyMs = Date.now() - start;
      const status = res.ok ? 'OK' : res.status >= 300 && res.status < 400 ? 'REDIRECT' : 'ERROR';

      const report: ApplyURLHealthReport = {
        jobId,
        url: job.apply_url,
        status,
        httpStatus: res.status,
        latencyMs,
        lastChecked: now,
        errorMessage: res.ok ? undefined : `HTTP status ${res.status} ${res.statusText}`
      };

      this.saveHealthReport(report);
      return report;
    } catch (err: any) {
      const report: ApplyURLHealthReport = {
        jobId,
        url: job.apply_url,
        status: 'ERROR',
        latencyMs: Date.now() - start,
        lastChecked: now,
        errorMessage: err.message
      };

      this.saveHealthReport(report);
      return report;
    }
  }

  private static saveHealthReport(report: ApplyURLHealthReport): void {
    try {
      const db = initDatabase();
      db.prepare(`
        INSERT INTO apply_urls (job_id, url, status, http_status, latency_ms, last_checked, error_message)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(job_id) DO UPDATE SET
          url = excluded.url,
          status = excluded.status,
          http_status = excluded.http_status,
          latency_ms = excluded.latency_ms,
          last_checked = excluded.last_checked,
          error_message = excluded.error_message
      `).run(
        report.jobId,
        report.url,
        report.status,
        report.httpStatus || null,
        report.latencyMs,
        report.lastChecked,
        report.errorMessage || null
      );
    } catch {
      // ignore
    }
  }

  public static getCachedHealthReports(): ApplyURLHealthReport[] {
    const db = initDatabase();
    const rows = db.prepare('SELECT * FROM apply_urls ORDER BY last_checked DESC').all() as any[];
    return rows.map(r => ({
      jobId: r.job_id,
      url: r.url,
      status: r.status,
      httpStatus: r.http_status ? Number(r.http_status) : undefined,
      latencyMs: Number(r.latency_ms),
      lastChecked: r.last_checked,
      errorMessage: r.error_message || undefined
    }));
  }
}
