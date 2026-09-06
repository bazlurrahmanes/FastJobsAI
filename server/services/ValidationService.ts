import { MasterJob, ValidationResult } from '../types';

export class ValidationService {
  /**
   * SSRF Protection: verify an external URL is safe to fetch or redirect to
   */
  public static isSafeExternalUrl(urlStr: string): { safe: boolean; reason?: string } {
    if (!urlStr || typeof urlStr !== 'string') {
      return { safe: false, reason: 'Missing or invalid URL format' };
    }

    const trimmed = urlStr.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return { safe: false, reason: 'URL must use http or https protocol' };
    }

    try {
      const parsed = new URL(trimmed);
      const hostname = parsed.hostname.toLowerCase();

      // Disallowed hosts / private ranges
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '0.0.0.0' ||
        hostname === '::1' ||
        hostname.endsWith('.internal') ||
        hostname.endsWith('.local') ||
        hostname.includes('metadata.google.internal') ||
        hostname.includes('169.254.169.254')
      ) {
        return { safe: false, reason: 'Disallowed loopback or internal metadata IP' };
      }

      // Check standard private IPv4 ranges (10.x, 172.16-31.x, 192.168.x)
      const ipParts = hostname.split('.').map(p => Number(p));
      if (ipParts.length === 4 && ipParts.every(p => !isNaN(p) && p >= 0 && p <= 255)) {
        if (ipParts[0] === 10) return { safe: false, reason: 'Private IP 10.0.0.0/8 disallowed' };
        if (ipParts[0] === 172 && ipParts[1] >= 16 && ipParts[1] <= 31) return { safe: false, reason: 'Private IP 172.16.0.0/12 disallowed' };
        if (ipParts[0] === 192 && ipParts[1] === 168) return { safe: false, reason: 'Private IP 192.168.0.0/16 disallowed' };
        if (ipParts[0] === 169 && ipParts[1] === 254) return { safe: false, reason: 'Link-local IP 169.254.0.0/16 disallowed' };
        if (ipParts[0] === 127) return { safe: false, reason: 'Loopback IP disallowed' };
      }

      return { safe: true };
    } catch {
      return { safe: false, reason: 'Malformed URL syntax' };
    }
  }

  /**
   * Master Job Data rule validation
   */
  public static validateMasterJob(job: MasterJob): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!job.job_id || job.job_id.trim().length === 0) {
      errors.push('Missing job_id');
    }
    if (!job.company_id || job.company_id.trim().length === 0) {
      errors.push('Missing company_id');
    }
    if (!job.title || job.title.trim().length < 3) {
      errors.push('Job title must be at least 3 characters');
    }
    if (!job.description || job.description.trim().length < 20) {
      errors.push('Job description must be at least 20 characters');
    }
    if (!job.location) {
      errors.push('Missing location');
    }
    if (!job.country) {
      warnings.push('Missing country code (recommended: US, CA, UK, etc.)');
    }
    if (!job.apply_url) {
      errors.push('Missing apply_url');
    } else {
      const urlCheck = this.isSafeExternalUrl(job.apply_url);
      if (!urlCheck.safe) {
        errors.push(`Invalid apply_url: ${urlCheck.reason}`);
      }
    }

    if (job.salary_min < 0 || job.salary_max < 0) {
      errors.push('Salary values cannot be negative');
    }
    if (job.salary_min > job.salary_max && job.salary_max > 0) {
      errors.push('salary_min cannot exceed salary_max');
    }

    if (!job.skills || job.skills.length === 0) {
      warnings.push('No skills specified; adding skills boosts platform discovery');
    }

    // Expiration check
    if (job.expires_at) {
      const expDate = new Date(job.expires_at);
      if (isNaN(expDate.getTime())) {
        errors.push('Invalid expires_at date format');
      } else if (expDate.getTime() <= Date.now() && job.status !== 'EXPIRED' && job.status !== 'ARCHIVED') {
        warnings.push(`Job expiration timestamp (${job.expires_at}) is in the past`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Feed Distribution Eligibility Check:
   * Company must be verified (unless overridden), job must be active, not expired, and rule-valid.
   */
  public static isEligibleForDistribution(
    job: MasterJob,
    isCompanyVerified: boolean
  ): { eligible: boolean; reason?: string } {
    if (!isCompanyVerified) {
      return { eligible: false, reason: 'Company verification status is not VERIFIED' };
    }

    const eligibleStatuses = ['ACTIVE', 'DISTRIBUTING', 'PUBLISHED'];
    if (!eligibleStatuses.includes(job.status)) {
      return { eligible: false, reason: `Job status (${job.status}) is not eligible for distribution` };
    }

    if (job.verification_status === 'FLAGGED') {
      return { eligible: false, reason: 'Job is flagged by trust & safety' };
    }

    if (job.expires_at && new Date(job.expires_at).getTime() <= Date.now()) {
      return { eligible: false, reason: 'Job has expired' };
    }

    const validation = this.validateMasterJob(job);
    if (!validation.valid) {
      return { eligible: false, reason: `Validation failed: ${validation.errors.join('; ')}` };
    }

    return { eligible: true };
  }
}
