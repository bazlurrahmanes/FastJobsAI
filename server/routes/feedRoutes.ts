import { Router, Request, Response } from 'express';
import { AIService } from '../services/AIService';
import { ApplyService } from '../services/ApplyService';
import { AttributionService } from '../services/AttributionService';
import { AuditService } from '../services/AuditService';
import { BackgroundWorker } from '../services/BackgroundWorker';
import { CompanyService } from '../services/CompanyService';
import { DuplicateService } from '../services/DuplicateService';
import { FeedService } from '../services/FeedService';
import { HealthService } from '../services/HealthService';
import { JobService } from '../services/JobService';
import { LifecycleService } from '../services/LifecycleService';
import { MarketplaceService } from '../services/MarketplaceService';
import { PlatformService } from '../services/PlatformService';
import { RetryService } from '../services/RetryService';
import { ValidationService } from '../services/ValidationService';
import { XMLFeedValidator } from '../services/XMLFeedValidator';

const router = Router();

// ============================================================================
// 1. PUBLIC XML FEEDS (Dynamic Generation, Caching & Validation)
// ============================================================================

/**
 * GET /feeds/master.xml
 * Dynamic Universal Master XML Feed
 */
router.get('/feeds/master.xml', (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 0;
    const skipCache = req.query.fresh === 'true';

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const result = FeedService.generateMasterXMLFeed({ baseUrl, page, limit, skipCache });

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('X-Feed-Job-Count', String(result.jobCount));
    res.setHeader('X-Feed-XML-Valid', String(result.xmlValid));
    res.setHeader('X-Feed-Cache', result.fromCache ? 'HIT' : 'MISS');
    return res.status(200).send(result.content);
  } catch (err: any) {
    HealthService.logError('master_xml', err.message);
    return res.status(500).type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><error>${err.message}</error>`);
  }
});

/**
 * GET /feeds/company/:companyId.xml
 * Company-Specific XML Feed
 */
router.get('/feeds/company/:companyId.xml', (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const result = FeedService.generateCompanyXMLFeed(companyId, { baseUrl });

    if (result.error) {
      return res.status(403).type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><error>${result.error}</error>`);
    }

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('X-Feed-Job-Count', String(result.jobCount));
    res.setHeader('X-Feed-Company', result.companyName || companyId);
    return res.status(200).send(result.content);
  } catch (err: any) {
    HealthService.logError(`company_${req.params.companyId}`, err.message);
    return res.status(500).type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><error>${err.message}</error>`);
  }
});

/**
 * GET /feeds/platform/:platformId.xml (or .json)
 * Platform-Specific Transformed Feed
 */
router.get('/feeds/platform/:platformId.:ext?', (req: Request, res: Response) => {
  try {
    const { platformId } = req.params;
    const pretty = req.query.pretty === 'true';
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    const result = FeedService.generatePlatformFeed(platformId, { baseUrl, pretty });

    if (result.error) {
      return res.status(400).send(result.error);
    }

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('X-Feed-Platform', platformId);
    res.setHeader('X-Feed-Job-Count', String(result.jobCount));
    res.setHeader('X-Feed-Rejected-Count', String(result.rejectedCount));
    return res.status(200).send(result.content);
  } catch (err: any) {
    HealthService.logError(`platform_${req.params.platformId}`, err.message);
    return res.status(500).send(`Error generating platform feed: ${err.message}`);
  }
});

// ============================================================================
// 2. CANONICAL APPLY URL REDIRECTION & RESOLUTION
// ============================================================================

/**
 * GET /apply/:jobId
 * Canonical click-tracking and SSRF-safe redirection
 */
router.get('/apply/:jobId', (req: Request, res: Response) => {
  const { jobId } = req.params;
  const src = (req.query.src as string) || 'jobxora';

  const result = ApplyService.resolveApplyTarget(jobId, src);
  if (!result.targetUrl) {
    return res.status(result.status).send(`Apply Link Error: ${result.error}`);
  }

  // Track attribution click
  AttributionService.trackEvent('apply_click', {
    jobId: result.jobId || jobId,
    companyId: result.companyId || '',
    platform: src,
    source: src,
    userAgent: req.get('User-Agent'),
    ipHash: req.ip
  });

  return res.redirect(302, result.targetUrl);
});

/**
 * GET /api/apply/:jobId/resolve
 * API resolver for canonical apply links
 */
router.get('/api/apply/:jobId/resolve', (req: Request, res: Response) => {
  const { jobId } = req.params;
  const src = (req.query.src as string) || 'jobxora';
  const result = ApplyService.resolveApplyTarget(jobId, src);
  return res.status(result.status).json(result);
});

// ============================================================================
// 3. MASTER JOB DATA API (CRUD, Verification, Duplicate Check)
// ============================================================================

/**
 * GET /api/feed-engine/jobs
 */
router.get('/api/feed-engine/jobs', (req: Request, res: Response) => {
  const { company_id, status, remote_type, category, search } = req.query;
  let jobs = JobService.getAll();

  if (company_id) {
    jobs = jobs.filter(j => j.company_id === company_id);
  }
  if (status) {
    jobs = jobs.filter(j => j.status === status);
  }
  if (remote_type) {
    jobs = jobs.filter(j => j.remote_type === remote_type);
  }
  if (category) {
    jobs = jobs.filter(j => j.category === category);
  }
  if (search) {
    const q = String(search).toLowerCase();
    jobs = jobs.filter(j => j.title.toLowerCase().includes(q) || j.description.toLowerCase().includes(q) || j.skills.some(s => s.toLowerCase().includes(q)));
  }

  return res.json({
    total: jobs.length,
    jobs
  });
});

/**
 * GET /api/feed-engine/jobs/:id
 */
router.get('/api/feed-engine/jobs/:id', (req: Request, res: Response) => {
  const job = JobService.getById(req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  return res.json(job);
});

/**
 * POST /api/feed-engine/jobs
 */
router.post('/api/feed-engine/jobs', (req: Request, res: Response) => {
  const result = JobService.create(req.body, { bypassDuplicateCheck: req.body.bypassDuplicateCheck });
  if (result.error) {
    return res.status(400).json({ error: result.error, duplicateOf: result.duplicateOf });
  }

  // Audit log
  AuditService.log({
    user_id: req.body.user_id || 'recruiter_admin',
    action: 'JOB_CREATED',
    resource_type: 'job',
    resource_id: result.job!.job_id,
    old_value: null,
    new_value: result.job,
    request_id: `req_${Date.now()}`,
    ip: req.ip || '127.0.0.1'
  });

  return res.status(201).json(result.job);
});

/**
 * PUT /api/feed-engine/jobs/:id
 */
router.put('/api/feed-engine/jobs/:id', (req: Request, res: Response) => {
  const oldJob = JobService.getById(req.params.id);
  if (!oldJob) {
    return res.status(404).json({ error: 'Job not found' });
  }

  const result = JobService.update(req.params.id, req.body, { bypassDuplicateCheck: req.body.bypassDuplicateCheck });
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  AuditService.log({
    user_id: req.body.user_id || 'recruiter_admin',
    action: 'JOB_UPDATED',
    resource_type: 'job',
    resource_id: req.params.id,
    old_value: oldJob,
    new_value: result.job,
    request_id: `req_${Date.now()}`,
    ip: req.ip || '127.0.0.1'
  });

  return res.json(result.job);
});

/**
 * POST /api/feed-engine/jobs/:id/transition
 */
router.post('/api/feed-engine/jobs/:id/transition', (req: Request, res: Response) => {
  const { status, reason } = req.body;
  const oldJob = JobService.getById(req.params.id);
  if (!oldJob) {
    return res.status(404).json({ error: 'Job not found' });
  }

  const result = LifecycleService.transitionJobState(req.params.id, status, reason);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  AuditService.log({
    user_id: req.body.user_id || 'admin',
    action: `JOB_STATE_TRANSITION_${status}`,
    resource_type: 'job',
    resource_id: req.params.id,
    old_value: { status: oldJob.status },
    new_value: { status, reason },
    request_id: `req_${Date.now()}`,
    ip: req.ip || '127.0.0.1'
  });

  return res.json(result.job);
});

/**
 * POST /api/feed-engine/jobs/check-duplicate
 */
router.post('/api/feed-engine/jobs/check-duplicate', (req: Request, res: Response) => {
  const result = DuplicateService.checkDuplicate(req.body, JobService.getAll());
  return res.json(result);
});

// ============================================================================
// 4. COMPANIES API
// ============================================================================

router.get('/api/feed-engine/companies', (req: Request, res: Response) => {
  return res.json(CompanyService.getAll());
});

router.post('/api/feed-engine/companies', (req: Request, res: Response) => {
  const newComp = CompanyService.create(req.body);
  AuditService.log({
    user_id: req.body.user_id || 'admin',
    action: 'COMPANY_CREATED',
    resource_type: 'company',
    resource_id: newComp.company_id,
    old_value: null,
    new_value: newComp,
    request_id: `req_${Date.now()}`,
    ip: req.ip || '127.0.0.1'
  });
  return res.status(201).json(newComp);
});

router.put('/api/feed-engine/companies/:id/verification', (req: Request, res: Response) => {
  const { status } = req.body;
  const oldComp = CompanyService.getById(req.params.id);
  if (!oldComp) {
    return res.status(404).json({ error: 'Company not found' });
  }

  const updated = CompanyService.setVerificationStatus(req.params.id, status);
  FeedService.invalidateCache();

  AuditService.log({
    user_id: req.body.user_id || 'compliance_officer',
    action: `COMPANY_VERIFICATION_${status}`,
    resource_type: 'company',
    resource_id: req.params.id,
    old_value: { status: oldComp.verification_status },
    new_value: { status },
    request_id: `req_${Date.now()}`,
    ip: req.ip || '127.0.0.1'
  });

  return res.json(updated);
});

// ============================================================================
// 5. PLATFORM CONFIGURATIONS & GRANULAR CONTROLS
// ============================================================================

router.get('/api/feed-engine/platforms', (req: Request, res: Response) => {
  const configs = PlatformService.getAllConfigs();
  const toggles: Record<string, boolean> = {
    google_jobs: PlatformService.isPlatformEnabled('google_jobs'),
    linkedin: PlatformService.isPlatformEnabled('linkedin'),
    indeed: PlatformService.isPlatformEnabled('indeed'),
    glassdoor: PlatformService.isPlatformEnabled('glassdoor'),
    ziprecruiter: PlatformService.isPlatformEnabled('ziprecruiter'),
    partner_network: PlatformService.isPlatformEnabled('partner_network')
  };
  for (const c of configs) {
    toggles[c.id] = PlatformService.isPlatformEnabled(c.id);
  }
  return res.json({ configs, toggles });
});

router.post('/api/feed-engine/platforms', (req: Request, res: Response) => {
  const { config, changelog, user_id } = req.body;
  const result = PlatformService.saveConfig(config, user_id, changelog);

  AuditService.log({
    user_id: user_id || 'platform_admin',
    action: 'PLATFORM_CONFIG_SAVED',
    resource_type: 'platform_config',
    resource_id: result.config.id,
    old_value: null,
    new_value: { config: result.config, version: result.version.version },
    request_id: `req_${Date.now()}`,
    ip: req.ip || '127.0.0.1'
  });

  return res.json(result);
});

router.get('/api/feed-engine/platforms/:id/versions', (req: Request, res: Response) => {
  return res.json(PlatformService.getVersions(req.params.id));
});

router.post('/api/feed-engine/platforms/:id/rollback', (req: Request, res: Response) => {
  const { version, user_id } = req.body;
  const rolledBack = PlatformService.rollbackVersion(req.params.id, version, user_id);
  if (!rolledBack) {
    return res.status(404).json({ error: 'Version not found for rollback' });
  }

  AuditService.log({
    user_id: user_id || 'platform_admin',
    action: 'PLATFORM_CONFIG_ROLLBACK',
    resource_type: 'platform_config',
    resource_id: req.params.id,
    old_value: null,
    new_value: { targetVersion: version },
    request_id: `req_${Date.now()}`,
    ip: req.ip || '127.0.0.1'
  });

  return res.json(rolledBack);
});

router.post('/api/feed-engine/controls/platform', (req: Request, res: Response) => {
  const { platformId, enabled } = req.body;
  PlatformService.setPlatformEnabled(platformId, enabled);
  FeedService.invalidateCache();
  return res.json({ platformId, enabled });
});

router.post('/api/feed-engine/controls/company', (req: Request, res: Response) => {
  const { companyId, platformId, enabled, user_id } = req.body;
  const control = PlatformService.setCompanyPlatformControl(companyId, platformId, enabled, user_id);
  FeedService.invalidateCache();
  return res.json(control);
});

router.post('/api/feed-engine/controls/job', (req: Request, res: Response) => {
  const { jobId, platformId, enabled, user_id } = req.body;
  const control = PlatformService.setJobPlatformControl(jobId, platformId, enabled, user_id);
  FeedService.invalidateCache();
  return res.json(control);
});

router.get('/api/feed-engine/controls', (req: Request, res: Response) => {
  return res.json({
    jobControls: PlatformService.getJobControls(),
    companyControls: PlatformService.getCompanyControls()
  });
});

// ============================================================================
// 6. HEALTH, DIAGNOSTICS & RETRY QUEUE
// ============================================================================

router.get('/api/feed-engine/health', async (req: Request, res: Response) => {
  const isCached = req.query.cached === 'true';
  const records = isCached ? HealthService.getHealthRecords() : await HealthService.runDiagnostics('manual');
  return res.json({
    records,
    worker: BackgroundWorker.getStatus(),
    timestamp: new Date().toISOString()
  });
});

router.get('/api/feed-engine/health/logs', (req: Request, res: Response) => {
  return res.json(HealthService.getErrorLogs());
});

router.get('/api/feed-engine/health/:feedId', (req: Request, res: Response) => {
  const record = HealthService.getHealthRecordById(req.params.feedId);
  if (!record) {
    return res.status(404).json({ error: 'Feed health record not found' });
  }
  return res.json(record);
});

router.post('/api/feed-engine/health/:feedId/check', async (req: Request, res: Response) => {
  try {
    const record = await HealthService.checkSingleFeed(req.params.feedId, 'manual');
    return res.json(record);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Feed diagnostic check failed' });
  }
});

router.get('/api/feed-engine/health/:feedId/runs', (req: Request, res: Response) => {
  const runs = HealthService.getFeedRuns(req.params.feedId, 50);
  return res.json(runs);
});

router.post('/api/feed-engine/health/validate-xml', (req: Request, res: Response) => {
  const { content, feedType, platformId } = req.body;
  if (!content) {
    return res.status(400).json({ error: 'Missing content body parameter' });
  }
  const report = XMLFeedValidator.validateFeed(content, feedType || 'custom', { platformId });
  return res.json(report);
});

router.get('/api/feed-engine/retries', (req: Request, res: Response) => {
  return res.json(RetryService.getAll());
});

router.post('/api/feed-engine/retries/:id/retry', (req: Request, res: Response) => {
  const result = RetryService.processRetry(req.params.id, req.body.simulateSuccess);
  if (!result) {
    return res.status(404).json({ error: 'Retry job not found' });
  }
  return res.json(result);
});

router.post('/api/feed-engine/worker/sweep', async (req: Request, res: Response) => {
  const summary = await BackgroundWorker.runSweep();
  return res.json({ success: true, summary });
});

router.get('/api/feed-engine/apply-health/:jobId', async (req: Request, res: Response) => {
  const report = await ApplyService.checkApplyUrlHealth(req.params.jobId);
  return res.json(report);
});

// ============================================================================
// 7. ATTRIBUTION & ANALYTICS
// ============================================================================

router.get('/api/feed-engine/analytics', (req: Request, res: Response) => {
  const metrics = AttributionService.getMetrics();
  const recentEvents = AttributionService.getEvents(30);
  return res.json({ metrics, recentEvents });
});

router.post('/api/feed-engine/track', (req: Request, res: Response) => {
  const { type, job_id, jobId, company_id, companyId, platform, source, user_id, userId } = req.body;
  const event = AttributionService.trackEvent(type, {
    jobId: jobId || job_id,
    companyId: companyId || company_id,
    platform,
    source,
    userId: userId || user_id,
    userAgent: req.get('User-Agent'),
    ipHash: req.ip
  });
  return res.json(event);
});

// ============================================================================
// 8. AI FEED OPTIMIZER & PLATFORM MATCHING
// ============================================================================

router.post('/api/feed-engine/ai/optimize', async (req: Request, res: Response) => {
  const { jobId, forceRefresh } = req.body;
  const job = JobService.getById(jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  const result = await AIService.optimizeJob(job, forceRefresh);
  return res.json(result);
});

// ============================================================================
// 9. FEED MARKETPLACE & SUBSCRIPTIONS
// ============================================================================

router.get('/api/feed-engine/marketplace/listings', (req: Request, res: Response) => {
  return res.json(MarketplaceService.getListings());
});

router.get('/api/feed-engine/marketplace/subscriptions', (req: Request, res: Response) => {
  const companyId = req.query.company_id as string;
  return res.json(MarketplaceService.getSubscriptions(companyId));
});

router.post('/api/feed-engine/marketplace/subscribe', (req: Request, res: Response) => {
  const { companyId, listingId } = req.body;
  const result = MarketplaceService.subscribe(companyId, listingId);
  if (result.error || !result.subscription) {
    return res.status(400).json({ error: result.error || 'Failed to subscribe' });
  }

  AuditService.log({
    userId: req.body.user_id || 'company_admin',
    action: 'MARKETPLACE_SUBSCRIBE',
    resourceType: 'subscription',
    resourceId: result.subscription.id,
    oldValue: null,
    newValue: result.subscription,
    requestId: `req_${Date.now()}`,
    ip: req.ip || '127.0.0.1'
  });

  return res.status(201).json(result.subscription);
});

router.post('/api/feed-engine/marketplace/subscriptions/:id/cancel', (req: Request, res: Response) => {
  const success = MarketplaceService.cancelSubscription(req.params.id);
  return res.json({ success });
});

// ============================================================================
// 10. AUDIT TRAIL
// ============================================================================

router.get('/api/feed-engine/audit', (req: Request, res: Response) => {
  const { resource_type, resource_id, action, limit } = req.query;
  const logs = AuditService.getLogs({
    resource_type: resource_type as string,
    resource_id: resource_id as string,
    action: action as string,
    limit: limit ? parseInt(limit as string) : 100
  });
  return res.json(logs);
});

export default router;
