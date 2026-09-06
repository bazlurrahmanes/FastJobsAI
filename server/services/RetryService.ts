import { RetryJob } from '../types';
import { initDatabase } from '../db';

export class RetryService {
  private static parseRow(row: any): RetryJob {
    let history: any[] = [];
    try {
      history = typeof row.history === 'string' ? JSON.parse(row.history) : (row.history || []);
    } catch {
      history = [];
    }

    return {
      id: row.id,
      targetPlatform: row.target_platform,
      jobId: row.job_id || undefined,
      feedId: row.feed_id || undefined,
      attempt: Number(row.attempt),
      maxAttempts: Number(row.max_attempts),
      nextAttemptAt: row.next_attempt_at,
      lastError: row.last_error,
      history,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  public static enqueue(
    targetPlatform: string,
    feedId: string,
    initialError: string,
    maxAttempts = 3,
    jobId?: string
  ): RetryJob {
    const db = initDatabase();
    const id = `retry-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const nextAttemptAt = new Date(Date.now() + 30000).toISOString(); // 30s initial delay

    const history = [
      {
        attempt: 1,
        timestamp: now,
        error: initialError,
        status: 'QUEUED'
      }
    ];

    const stmt = db.prepare(`
      INSERT INTO feed_retry_queue (
        id, target_platform, job_id, feed_id, attempt, max_attempts,
        next_attempt_at, last_error, history, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      targetPlatform,
      jobId || null,
      feedId,
      1,
      maxAttempts,
      nextAttemptAt,
      initialError,
      JSON.stringify(history),
      'QUEUED',
      now,
      now
    );

    return {
      id,
      targetPlatform,
      feedId,
      jobId,
      attempt: 1,
      maxAttempts,
      nextAttemptAt,
      lastError: initialError,
      history,
      status: 'QUEUED',
      createdAt: now,
      updatedAt: now
    };
  }

  public static getAll(): RetryJob[] {
    const db = initDatabase();
    const rows = db.prepare('SELECT * FROM feed_retry_queue ORDER BY created_at DESC').all();
    return rows.map(this.parseRow);
  }

  public static getById(id: string): RetryJob | undefined {
    const db = initDatabase();
    const row = db.prepare('SELECT * FROM feed_retry_queue WHERE id = ?').get(id);
    return row ? this.parseRow(row) : undefined;
  }

  public static getActiveRetryForFeed(feedId: string): RetryJob | undefined {
    const db = initDatabase();
    const row = db.prepare(
      "SELECT * FROM feed_retry_queue WHERE feed_id = ? AND status IN ('QUEUED', 'RETRYING') ORDER BY created_at DESC LIMIT 1"
    ).get(feedId);
    return row ? this.parseRow(row) : undefined;
  }

  public static markSucceededForFeed(feedId: string): void {
    const db = initDatabase();
    const active = this.getActiveRetryForFeed(feedId);
    if (active) {
      const now = new Date().toISOString();
      const history = [...active.history, {
        attempt: active.attempt + 1,
        timestamp: now,
        error: 'Resolved successfully during diagnostic check',
        status: 'SUCCEEDED'
      }];
      db.prepare(`
        UPDATE feed_retry_queue
        SET status = 'SUCCEEDED', last_error = 'Resolved', history = ?, updated_at = ?
        WHERE id = ?
      `).run(JSON.stringify(history), now, active.id);
    }
  }

  /**
   * Execute or simulate a retry attempt with exponential backoff & idempotent persistence
   */
  public static processRetry(id: string, simulateSuccess = false): RetryJob | undefined {
    const job = this.getById(id);
    if (!job) return undefined;

    // Idempotency guard: do not re-process if already in terminal state
    if (job.status === 'SUCCEEDED' || job.status === 'FAILED_MAX_RETRIES') {
      return job;
    }

    const nextAttempt = job.attempt + 1;
    const now = new Date().toISOString();
    let newStatus: RetryJob['status'] = job.status;
    let newLastError = job.lastError;
    let newNextAttemptAt = job.nextAttemptAt;
    const history = [...job.history];

    if (simulateSuccess || Math.random() > 0.4) {
      newStatus = 'SUCCEEDED';
      newLastError = 'None (Delivery Successful)';
      history.push({
        attempt: nextAttempt,
        timestamp: now,
        error: 'None (Delivery Successful)',
        status: 'SUCCEEDED'
      });
    } else {
      if (nextAttempt >= job.maxAttempts) {
        newStatus = 'FAILED_MAX_RETRIES';
        newLastError = `Maximum retry threshold reached (${job.maxAttempts}/${job.maxAttempts} attempts failed)`;
        history.push({
          attempt: nextAttempt,
          timestamp: now,
          error: newLastError,
          status: 'FAILED'
        });
      } else {
        newStatus = 'RETRYING';
        newLastError = 'Transient upstream 503 Service Unavailable';
        const delaySeconds = Math.pow(2, nextAttempt) * 30; // 60s, 120s exponential backoff
        newNextAttemptAt = new Date(Date.now() + delaySeconds * 1000).toISOString();
        history.push({
          attempt: nextAttempt,
          timestamp: now,
          error: newLastError,
          status: 'RETRYING'
        });
      }
    }

    const db = initDatabase();
    db.prepare(`
      UPDATE feed_retry_queue SET
        attempt = ?,
        next_attempt_at = ?,
        last_error = ?,
        history = ?,
        status = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      nextAttempt,
      newNextAttemptAt,
      newLastError,
      JSON.stringify(history),
      newStatus,
      now,
      id
    );

    return {
      ...job,
      attempt: nextAttempt,
      nextAttemptAt: newNextAttemptAt,
      lastError: newLastError,
      history,
      status: newStatus as any,
      updatedAt: now
    };
  }
}
