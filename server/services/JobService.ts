import { MasterJob, MasterJobStatus, RemoteType, EmploymentType, ExperienceLevel, VerificationStatus } from '../types';
import { initDatabase } from '../db';
import { CompanyService } from './CompanyService';
import { DuplicateService } from './DuplicateService';
import { ValidationService } from './ValidationService';

export class JobService {
  private static parseDbRow(row: any): MasterJob {
    let skills: string[] = [];
    try {
      skills = typeof row.skills === 'string' ? JSON.parse(row.skills) : (row.skills || []);
    } catch {
      skills = [];
    }

    return {
      job_id: row.job_id,
      company_id: row.company_id,
      title: row.title,
      description: row.description,
      location: row.location,
      country: row.country,
      city: row.city,
      remote_type: row.remote_type as RemoteType,
      employment_type: row.employment_type as EmploymentType,
      salary_min: Number(row.salary_min),
      salary_max: Number(row.salary_max),
      salary_currency: row.salary_currency,
      skills,
      category: row.category,
      experience_level: row.experience_level as ExperienceLevel,
      published_at: row.published_at,
      expires_at: row.expires_at,
      updated_at: row.updated_at,
      status: row.status as MasterJobStatus,
      apply_url: row.apply_url,
      source: row.source,
      source_id: row.source_id,
      verification_status: row.verification_status as VerificationStatus
    };
  }

  public static getAll(): MasterJob[] {
    const db = initDatabase();
    const rows = db.prepare('SELECT * FROM jobs ORDER BY published_at DESC').all();
    return rows.map(this.parseDbRow);
  }

  public static getById(jobId: string): MasterJob | undefined {
    const db = initDatabase();
    const row = db.prepare('SELECT * FROM jobs WHERE job_id = ?').get(jobId);
    return row ? this.parseDbRow(row) : undefined;
  }

  public static getByCompany(companyId: string): MasterJob[] {
    const db = initDatabase();
    const rows = db.prepare('SELECT * FROM jobs WHERE company_id = ? ORDER BY published_at DESC').all(companyId);
    return rows.map(this.parseDbRow);
  }

  /**
   * Get all eligible jobs for feed distribution:
   * 1. Status is ACTIVE / DISTRIBUTING / PUBLISHED
   * 2. Not expired
   * 3. Company is VERIFIED
   * 4. Job is not FLAGGED
   * 5. Passes rule validation
   */
  public static getEligibleJobs(companyId?: string): MasterJob[] {
    const allJobs = companyId ? this.getByCompany(companyId) : this.getAll();
    return allJobs.filter(job => {
      const isCompanyVerified = CompanyService.isVerified(job.company_id);
      const eligibility = ValidationService.isEligibleForDistribution(job, isCompanyVerified);
      return eligibility.eligible;
    });
  }

  public static create(
    data: Omit<MasterJob, 'job_id' | 'published_at' | 'updated_at'>,
    options?: { bypassDuplicateCheck?: boolean }
  ): { job?: MasterJob; error?: string; duplicateOf?: string } {
    const db = initDatabase();
    const jobId = `job-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const candidate: MasterJob = {
      ...data,
      job_id: jobId,
      published_at: now,
      updated_at: now,
      status: data.status || 'ACTIVE',
      verification_status: data.verification_status || 'VERIFIED'
    };

    // Rule validation
    const validation = ValidationService.validateMasterJob(candidate);
    if (!validation.valid) {
      return { error: `Job validation failed: ${validation.errors.join(', ')}` };
    }

    // Duplicate check
    if (!options?.bypassDuplicateCheck) {
      const dupCheck = DuplicateService.checkDuplicate(candidate, this.getAll());
      if (dupCheck.isDuplicate) {
        return {
          error: `Duplicate job detected: ${dupCheck.matchedCriteria.join('; ')}`,
          duplicateOf: dupCheck.duplicateOfJobId
        };
      }
    }

    const contentHash = DuplicateService.computeJobHash(candidate);

    try {
      const stmt = db.prepare(`
        INSERT INTO jobs (
          job_id, company_id, title, description, location, country, city, remote_type,
          employment_type, salary_min, salary_max, salary_currency, skills, category,
          experience_level, published_at, expires_at, updated_at, status, apply_url,
          source, source_id, verification_status, content_hash
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?
        )
      `);

      stmt.run(
        candidate.job_id,
        candidate.company_id,
        candidate.title,
        candidate.description,
        candidate.location,
        candidate.country,
        candidate.city,
        candidate.remote_type,
        candidate.employment_type,
        candidate.salary_min,
        candidate.salary_max,
        candidate.salary_currency,
        JSON.stringify(candidate.skills),
        candidate.category,
        candidate.experience_level,
        candidate.published_at,
        candidate.expires_at,
        candidate.updated_at,
        candidate.status,
        candidate.apply_url,
        candidate.source,
        candidate.source_id,
        candidate.verification_status,
        contentHash
      );

      return { job: candidate };
    } catch (err: any) {
      return { error: `Failed to insert job: ${err.message}` };
    }
  }

  public static update(
    jobId: string,
    updates: Partial<MasterJob>,
    options?: { bypassDuplicateCheck?: boolean }
  ): { job?: MasterJob; error?: string } {
    const existing = this.getById(jobId);
    if (!existing) {
      return { error: 'Job not found' };
    }

    const updated: MasterJob = {
      ...existing,
      ...updates,
      job_id: existing.job_id, // immutable
      updated_at: new Date().toISOString()
    };

    const validation = ValidationService.validateMasterJob(updated);
    if (!validation.valid) {
      return { error: `Job validation failed: ${validation.errors.join(', ')}` };
    }

    if (!options?.bypassDuplicateCheck && (updates.title || updates.location || updates.description)) {
      const dupCheck = DuplicateService.checkDuplicate(updated, this.getAll());
      if (dupCheck.isDuplicate && dupCheck.duplicateOfJobId !== jobId) {
        return { error: `Update causes duplicate with job ${dupCheck.duplicateOfJobId}` };
      }
    }

    const db = initDatabase();
    const contentHash = DuplicateService.computeJobHash(updated);

    try {
      const stmt = db.prepare(`
        UPDATE jobs SET
          company_id = ?,
          title = ?,
          description = ?,
          location = ?,
          country = ?,
          city = ?,
          remote_type = ?,
          employment_type = ?,
          salary_min = ?,
          salary_max = ?,
          salary_currency = ?,
          skills = ?,
          category = ?,
          experience_level = ?,
          expires_at = ?,
          updated_at = ?,
          status = ?,
          apply_url = ?,
          source = ?,
          source_id = ?,
          verification_status = ?,
          content_hash = ?
        WHERE job_id = ?
      `);

      stmt.run(
        updated.company_id,
        updated.title,
        updated.description,
        updated.location,
        updated.country,
        updated.city,
        updated.remote_type,
        updated.employment_type,
        updated.salary_min,
        updated.salary_max,
        updated.salary_currency,
        JSON.stringify(updated.skills),
        updated.category,
        updated.experience_level,
        updated.expires_at,
        updated.updated_at,
        updated.status,
        updated.apply_url,
        updated.source,
        updated.source_id,
        updated.verification_status,
        contentHash,
        jobId
      );

      return { job: updated };
    } catch (err: any) {
      return { error: `Failed to update job: ${err.message}` };
    }
  }

  public static setStatus(jobId: string, status: MasterJobStatus): MasterJob | undefined {
    const res = this.update(jobId, { status }, { bypassDuplicateCheck: true });
    return res.job;
  }

  public static delete(jobId: string): boolean {
    const db = initDatabase();
    const result = db.prepare('DELETE FROM jobs WHERE job_id = ?').run(jobId);
    return result.changes > 0;
  }
}
