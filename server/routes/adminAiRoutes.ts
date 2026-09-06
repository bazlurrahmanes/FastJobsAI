import { Router, Request, Response, NextFunction } from 'express';
import { AdminAIService } from '../services/AdminAIService';
import { SystemHealthService } from '../services/SystemHealthService';
import { HealthService } from '../services/HealthService';

export const adminAiRouter = Router();

// Strict RBAC Middleware for FastJobs AI Admin Copilot & Tools
export function requireAdminRole(req: Request, res: Response, next: NextFunction) {
  const adminRoleHeader = req.headers['x-admin-role'];
  const authHeader = req.headers['authorization'];
  const userRole = req.body?.userRole || req.query?.userRole;

  // Verify Admin authorization
  const isAdmin = adminRoleHeader === 'admin' || 
                  userRole === 'admin' || 
                  (authHeader && authHeader.includes('admin'));

  if (!isAdmin) {
    return res.status(403).json({
      error: 'Forbidden: Only authorized FastJobs AI Admin users may access Admin AI tools.',
      code: 'ADMIN_RBAC_FORBIDDEN'
    });
  }

  next();
}

// Apply RBAC to all Admin AI routes
adminAiRouter.use(requireAdminRole);

// ============================================================================
// Centralized Admin Health Dashboard API (12 Subsystem Monitors)
// ============================================================================
adminAiRouter.get('/system-health', async (req: Request, res: Response) => {
  try {
    const data = await SystemHealthService.getCentralizedSystemHealth();
    res.json(data);
  } catch (err: any) {
    console.error('Error in system-health:', err);
    res.status(500).json({ error: err.message });
  }
});

adminAiRouter.get('/health-dashboard', async (req: Request, res: Response) => {
  try {
    const data = await SystemHealthService.getCentralizedSystemHealth();
    res.json(data);
  } catch (err: any) {
    console.error('Error in health-dashboard:', err);
    res.status(500).json({ error: err.message });
  }
});

// AI Root Cause Analysis (Safe Advisory Mode: AI analyzes & explains, does NOT make destructive changes)
adminAiRouter.post('/health-root-cause', async (req: Request, res: Response) => {
  try {
    const result = await SystemHealthService.runAiRootCauseAnalysis(req.body?.report);
    res.json(result);
  } catch (err: any) {
    console.error('Error in health-root-cause:', err);
    res.status(500).json({ error: err.message });
  }
});

// Trigger on-demand feed diagnostic for verification
adminAiRouter.post('/trigger-health-diagnostic', async (req: Request, res: Response) => {
  try {
    const { feedId } = req.body;
    if (feedId) {
      await HealthService.checkSingleFeed(feedId, 'manual');
    } else {
      await HealthService.runDiagnostics('manual');
    }
    const updated = await SystemHealthService.getCentralizedSystemHealth();
    res.json({ success: true, updatedHealth: updated });
  } catch (err: any) {
    console.error('Error in trigger-health-diagnostic:', err);
    res.status(500).json({ error: err.message });
  }
});

// 1. AI Platform Health Monitor
adminAiRouter.get('/health-monitor', async (req: Request, res: Response) => {
  try {
    const data = await AdminAIService.getPlatformHealthOverview();
    res.json(data);
  } catch (err: any) {
    console.error('Error in health-monitor:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. AI Feed Error Analyzer
adminAiRouter.get('/feed-error-analyzer', async (req: Request, res: Response) => {
  try {
    const data = await AdminAIService.getFeedErrorAnalysis();
    res.json(data);
  } catch (err: any) {
    console.error('Error in feed-error-analyzer:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. AI Job Moderation
adminAiRouter.get('/job-moderation', async (req: Request, res: Response) => {
  try {
    const data = await AdminAIService.getJobModerationQueue();
    res.json(data);
  } catch (err: any) {
    console.error('Error in job-moderation:', err);
    res.status(500).json({ error: err.message });
  }
});

// 4. AI Job Scam Detector
adminAiRouter.get('/scam-detector', async (req: Request, res: Response) => {
  try {
    const targetJobId = typeof req.query.jobId === 'string' ? req.query.jobId : undefined;
    const data = await AdminAIService.getJobScamAnalysis(targetJobId);
    res.json(data);
  } catch (err: any) {
    console.error('Error in scam-detector:', err);
    res.status(500).json({ error: err.message });
  }
});

// 5. AI Duplicate Job Detector
adminAiRouter.get('/duplicate-detector', async (req: Request, res: Response) => {
  try {
    const data = await AdminAIService.getDuplicateJobDetections();
    res.json(data);
  } catch (err: any) {
    console.error('Error in duplicate-detector:', err);
    res.status(500).json({ error: err.message });
  }
});

// 6. AI Company Verification Assistant
adminAiRouter.get('/company-verification', async (req: Request, res: Response) => {
  try {
    const data = await AdminAIService.getCompanyVerificationReviews();
    res.json(data);
  } catch (err: any) {
    console.error('Error in company-verification:', err);
    res.status(500).json({ error: err.message });
  }
});

// 7. AI Fraud & Suspicious Activity Detection
adminAiRouter.get('/fraud-activity', async (req: Request, res: Response) => {
  try {
    const data = await AdminAIService.getFraudAndSuspiciousActivity();
    res.json(data);
  } catch (err: any) {
    console.error('Error in fraud-activity:', err);
    res.status(500).json({ error: err.message });
  }
});

// 8. AI Feed Optimization Assistant
adminAiRouter.get('/feed-optimization', async (req: Request, res: Response) => {
  try {
    const data = await AdminAIService.getFeedOptimizationInsights();
    res.json(data);
  } catch (err: any) {
    console.error('Error in feed-optimization:', err);
    res.status(500).json({ error: err.message });
  }
});

// 9. AI Platform & Recruitment Analytics
adminAiRouter.get('/analytics-summary', async (req: Request, res: Response) => {
  try {
    const data = await AdminAIService.getRecruitmentAnalyticsSummary();
    res.json(data);
  } catch (err: any) {
    console.error('Error in analytics-summary:', err);
    res.status(500).json({ error: err.message });
  }
});

// 10. AI Incident Summary
adminAiRouter.get('/incident-summary', async (req: Request, res: Response) => {
  try {
    const data = await AdminAIService.getIncidentSummary();
    res.json(data);
  } catch (err: any) {
    console.error('Error in incident-summary:', err);
    res.status(500).json({ error: err.message });
  }
});

// 11. AI Audit Log Analyzer
adminAiRouter.get('/audit-analyzer', async (req: Request, res: Response) => {
  try {
    const data = await AdminAIService.getAuditLogAnalysis();
    res.json(data);
  } catch (err: any) {
    console.error('Error in audit-analyzer:', err);
    res.status(500).json({ error: err.message });
  }
});

// 12. AI Admin Copilot Chat
adminAiRouter.post('/copilot/chat', async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Missing required field: message' });
    }

    const cleanMessage = message.trim().slice(0, 1000);
    const result = await AdminAIService.queryAdminCopilot(cleanMessage, Array.isArray(history) ? history : []);
    res.json(result);
  } catch (err: any) {
    console.error('Error in copilot/chat:', err);
    res.status(500).json({ error: err.message });
  }
});

// CRITICAL ACTION EXECUTION (Human-in-the-loop: AI detects -> AI explains -> Admin reviews -> Admin approves -> System executes)
adminAiRouter.post('/execute-action', async (req: Request, res: Response) => {
  try {
    const { actionType, targetId, reason, adminUserId, confirmed, parameters } = req.body;

    if (!confirmed) {
      return res.status(400).json({
        error: 'Critical administrative action requires explicit admin confirmation (confirmed: true).',
        code: 'ACTION_CONFIRMATION_REQUIRED'
      });
    }

    if (!actionType || !targetId) {
      return res.status(400).json({ error: 'Missing actionType or targetId' });
    }

    const result = await AdminAIService.executeApprovedAdminAction({
      actionType,
      targetId,
      adminUserId: adminUserId || 'admin_authorized',
      reason: reason || 'Approved via FastJobs AI Admin Console',
      parameters
    });

    res.json(result);
  } catch (err: any) {
    console.error('Error executing admin action:', err);
    res.status(500).json({ error: err.message });
  }
});
