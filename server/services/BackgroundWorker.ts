import { HealthService } from './HealthService';
import { LifecycleService } from './LifecycleService';
import { RetryService } from './RetryService';

export class BackgroundWorker {
  private static intervalId: NodeJS.Timeout | null = null;
  private static isRunning = false;
  private static isSweeping = false;
  private static lastRun = {
    expiration: '',
    diagnostics: '',
    retries: ''
  };

  public static start(intervalMs = 60000): void {
    if (this.intervalId) return;

    this.isRunning = true;
    console.log('[BackgroundWorker] Persistent Feed & Lifecycle background queues initialized.');

    // Run initial sweep safely on startup
    setTimeout(() => {
      this.runSweep();
    }, 1000);

    this.intervalId = setInterval(() => {
      this.runSweep();
    }, intervalMs);
  }

  public static stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
    }
  }

  public static async runSweep(): Promise<{
    expiredJobsCount: number;
    healthRecordsCount: number;
    retriesProcessed: number;
  }> {
    if (this.isSweeping) {
      console.log('[BackgroundWorker] Sweep already in progress, skipping overlapping run.');
      return { expiredJobsCount: 0, healthRecordsCount: 0, retriesProcessed: 0 };
    }

    this.isSweeping = true;
    const now = new Date().toISOString();

    try {
      // 1. Expiration check from persistent SQLite database
      const expRes = LifecycleService.processExpirations();
      this.lastRun.expiration = now;

      // 2. Diagnostics & health snapshot persistence
      const healthRecords = await HealthService.runDiagnostics('cron_worker');
      this.lastRun.diagnostics = now;

      // 3. Process ready retries from persistent SQLite queue
      const queue = RetryService.getAll().filter(r => r.status === 'QUEUED' || r.status === 'RETRYING');
      let retriesCount = 0;
      for (const item of queue) {
        if (new Date(item.nextAttemptAt).getTime() <= Date.now()) {
          RetryService.processRetry(item.id);
          retriesCount++;
        }
      }
      this.lastRun.retries = now;

      return {
        expiredJobsCount: expRes.expiredCount,
        healthRecordsCount: healthRecords.length,
        retriesProcessed: retriesCount
      };
    } finally {
      this.isSweeping = false;
    }
  }

  public static getStatus() {
    return {
      active: this.isRunning,
      isSweeping: this.isSweeping,
      lastRun: this.lastRun
    };
  }
}
