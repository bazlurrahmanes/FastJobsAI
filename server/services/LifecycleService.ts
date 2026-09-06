import { MasterJob, MasterJobStatus } from '../types';
import { AuditService } from './AuditService';
import { FeedService } from './FeedService';
import { JobService } from './JobService';

export class LifecycleService {
  /**
   * Transition a job through the lifecycle state machine
   */
  public static transitionJobState(
    jobId: string,
    newStatus: MasterJobStatus,
    reason?: string
  ): { success: boolean; job?: MasterJob; error?: string } {
    const job = JobService.getById(jobId);
    if (!job) {
      return { success: false, error: 'Job not found' };
    }

    const current = job.status;

    // Validate state transitions
    const validTransitions: Record<MasterJobStatus, MasterJobStatus[]> = {
      DRAFT: ['PENDING_REVIEW', 'ARCHIVED'],
      PENDING_REVIEW: ['ACTIVE', 'DRAFT', 'ARCHIVED'],
      ACTIVE: ['DISTRIBUTING', 'PUBLISHED', 'EXPIRED', 'ARCHIVED'],
      DISTRIBUTING: ['PUBLISHED', 'EXPIRED', 'ARCHIVED', 'ACTIVE'],
      PUBLISHED: ['DISTRIBUTING', 'EXPIRED', 'ARCHIVED'],
      EXPIRED: ['ACTIVE', 'ARCHIVED', 'DRAFT'],
      ARCHIVED: ['DRAFT']
    };

    if (!validTransitions[current]?.includes(newStatus)) {
      return {
        success: false,
        error: `Illegal state transition from ${current} to ${newStatus}`
      };
    }

    const updated = JobService.setStatus(jobId, newStatus);
    FeedService.invalidateCache();

    // Persist audit record
    AuditService.log({
      userId: 'system_lifecycle',
      action: 'JOB_STATUS_TRANSITION',
      resourceType: 'job',
      resourceId: jobId,
      oldValue: { status: current },
      newValue: { status: newStatus, reason: reason || 'Manual or scheduled state transition' }
    });

    return {
      success: true,
      job: updated
    };
  }

  /**
   * Automated Cron/Worker sweep for expired jobs
   */
  public static processExpirations(): { expiredCount: number; processedJobIds: string[] } {
    const now = Date.now();
    const allJobs = JobService.getAll();
    const processed: string[] = [];

    for (const job of allJobs) {
      if (['ACTIVE', 'DISTRIBUTING', 'PUBLISHED'].includes(job.status)) {
        if (job.expires_at && new Date(job.expires_at).getTime() <= now) {
          JobService.setStatus(job.job_id, 'EXPIRED');
          processed.push(job.job_id);

          AuditService.log({
            userId: 'cron_worker',
            action: 'JOB_EXPIRED',
            resourceType: 'job',
            resourceId: job.job_id,
            oldValue: { status: job.status, expires_at: job.expires_at },
            newValue: { status: 'EXPIRED' }
          });
        }
      }
    }

    if (processed.length > 0) {
      FeedService.invalidateCache();
    }

    return {
      expiredCount: processed.length,
      processedJobIds: processed
    };
  }
}
