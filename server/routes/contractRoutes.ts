import { Router, Request, Response } from 'express';
import { ContractService, ActorContext } from '../services/ContractService';
import { CONTRACT_TEMPLATES } from '../../src/data/mockContracts';

export const contractRouter = Router();

/**
 * Extract ActorContext from request headers or body with safe defaults
 */
function extractActor(req: Request): ActorContext {
  const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const ipAddress = Array.isArray(rawIp) ? rawIp[0] : String(rawIp).split(',')[0].trim();

  const id = (req.headers['x-user-id'] as string) || req.body?.actorId || (req.query?.actorId as string) || 'user-alex-chen';
  const role = ((req.headers['x-user-role'] as string) || req.body?.actorRole || (req.query?.actorRole as string) || 'job_seeker') as ActorContext['role'];
  const email = (req.headers['x-user-email'] as string) || req.body?.actorEmail || (req.query?.actorEmail as string) || 'alex.chen@fastjobs.io';
  const name = (req.headers['x-user-name'] as string) || req.body?.actorName || (req.query?.actorName as string) || 'Alex Chen';

  return { id, role, email, name, ipAddress };
}

// --------------------------------------------------------------------------
// 1. Get Predefined Contract Templates
// --------------------------------------------------------------------------
contractRouter.get('/api/contracts/templates', (_req: Request, res: Response) => {
  res.json({
    templates: CONTRACT_TEMPLATES
  });
});

// --------------------------------------------------------------------------
// 2. List Contracts (Strict RBAC Filtered)
// --------------------------------------------------------------------------
contractRouter.get('/api/contracts', (req: Request, res: Response) => {
  try {
    const actor = extractActor(req);
    const status = (req.query.status as string) || undefined;
    const contracts = ContractService.listContracts(actor, status);

    res.json({
      contracts,
      total: contracts.length,
      actor: {
        id: actor.id,
        role: actor.role
      }
    });
  } catch (err: any) {
    console.error('[Contracts API] Error listing contracts:', err);
    res.status(500).json({ error: err.message || 'Failed to list contracts' });
  }
});

// --------------------------------------------------------------------------
// 3. Get Single Contract Details
// --------------------------------------------------------------------------
contractRouter.get('/api/contracts/:id', (req: Request, res: Response) => {
  try {
    const actor = extractActor(req);
    const contractId = req.params.id;
    const contract = ContractService.getContract(contractId, actor);

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Optionally log view
    if (req.query.logView === 'true') {
      ContractService.logAction(contractId, 'TERMS_VIEWED', actor, `Viewed by ${actor.name} (${actor.role})`);
    }

    res.json({ contract });
  } catch (err: any) {
    if (err.message?.includes('Forbidden')) {
      return res.status(403).json({ error: err.message, code: 'FORBIDDEN' });
    }
    console.error('[Contracts API] Error fetching contract:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch contract' });
  }
});

// --------------------------------------------------------------------------
// 4. Create Contract (Employer / Admin Only)
// --------------------------------------------------------------------------
contractRouter.post('/api/contracts', (req: Request, res: Response) => {
  try {
    const actor = extractActor(req);
    if (actor.role !== 'employer' && actor.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden: Only verified employers and platform administrators can draft or issue contracts.',
        code: 'EMPLOYER_ROLE_REQUIRED'
      });
    }

    const contractData = req.body;
    const created = ContractService.createContract(contractData, actor);

    res.status(201).json({
      success: true,
      message: 'Contract successfully created',
      contract: created
    });
  } catch (err: any) {
    if (err.message?.includes('Validation Error')) {
      return res.status(400).json({ error: err.message, code: 'VALIDATION_FAILED' });
    }
    if (err.message?.includes('Forbidden')) {
      return res.status(403).json({ error: err.message, code: 'FORBIDDEN' });
    }
    console.error('[Contracts API] Error creating contract:', err);
    res.status(500).json({ error: err.message || 'Failed to create contract' });
  }
});

// --------------------------------------------------------------------------
// 5. Update Contract (Employer Only, Draft or Pending)
// --------------------------------------------------------------------------
contractRouter.put('/api/contracts/:id', (req: Request, res: Response) => {
  try {
    const actor = extractActor(req);
    const contractId = req.params.id;
    const updates = req.body;

    const updated = ContractService.updateContract(contractId, updates, actor);

    res.json({
      success: true,
      message: 'Contract terms successfully updated',
      contract: updated
    });
  } catch (err: any) {
    if (err.message?.includes('Forbidden')) {
      return res.status(403).json({ error: err.message, code: 'FORBIDDEN' });
    }
    if (err.message?.includes('Cannot edit') || err.message?.includes('Validation')) {
      return res.status(400).json({ error: err.message, code: 'INVALID_OPERATION' });
    }
    console.error('[Contracts API] Error updating contract:', err);
    res.status(500).json({ error: err.message || 'Failed to update contract' });
  }
});

// --------------------------------------------------------------------------
// 6. Send Contract to Candidate (Draft -> Pending)
// --------------------------------------------------------------------------
contractRouter.post('/api/contracts/:id/send', (req: Request, res: Response) => {
  try {
    const actor = extractActor(req);
    const contractId = req.params.id;

    const contract = ContractService.sendToCandidate(contractId, actor);

    res.json({
      success: true,
      message: 'Contract successfully dispatched to candidate for signature',
      contract
    });
  } catch (err: any) {
    if (err.message?.includes('Forbidden')) {
      return res.status(403).json({ error: err.message, code: 'FORBIDDEN' });
    }
    res.status(400).json({ error: err.message || 'Failed to send contract' });
  }
});

// --------------------------------------------------------------------------
// 7. Accept & Digitally Sign Contract (Candidate Only, Pending -> Active)
// --------------------------------------------------------------------------
contractRouter.post('/api/contracts/:id/accept', (req: Request, res: Response) => {
  try {
    const actor = extractActor(req);
    const contractId = req.params.id;
    const signatureName = req.body.signatureName || actor.name;

    const contract = ContractService.acceptContract(contractId, signatureName, actor);

    res.json({
      success: true,
      message: 'Contract successfully accepted and executed. Active status granted.',
      contract
    });
  } catch (err: any) {
    if (err.message?.includes('Forbidden')) {
      return res.status(403).json({ error: err.message, code: 'FORBIDDEN' });
    }
    if (err.message?.includes('Validation')) {
      return res.status(400).json({ error: err.message, code: 'SIGNATURE_INVALID' });
    }
    console.error('[Contracts API] Error accepting contract:', err);
    res.status(500).json({ error: err.message || 'Failed to accept contract' });
  }
});

// --------------------------------------------------------------------------
// 8. Cancel Contract (Employer or Candidate with Mandatory Reason)
// --------------------------------------------------------------------------
contractRouter.post('/api/contracts/:id/cancel', (req: Request, res: Response) => {
  try {
    const actor = extractActor(req);
    const contractId = req.params.id;
    const reason = req.body.reason;

    const contract = ContractService.cancelContract(contractId, reason, actor);

    res.json({
      success: true,
      message: 'Contract successfully cancelled',
      contract
    });
  } catch (err: any) {
    if (err.message?.includes('Forbidden')) {
      return res.status(403).json({ error: err.message, code: 'FORBIDDEN' });
    }
    if (err.message?.includes('Validation')) {
      return res.status(400).json({ error: err.message, code: 'CANCELLATION_REASON_REQUIRED' });
    }
    console.error('[Contracts API] Error cancelling contract:', err);
    res.status(500).json({ error: err.message || 'Failed to cancel contract' });
  }
});

// --------------------------------------------------------------------------
// 9. Complete Contract (Employer Only, Active -> Completed)
// --------------------------------------------------------------------------
contractRouter.post('/api/contracts/:id/complete', (req: Request, res: Response) => {
  try {
    const actor = extractActor(req);
    const contractId = req.params.id;

    const contract = ContractService.completeContract(contractId, actor);

    res.json({
      success: true,
      message: 'Contract term successfully marked as completed',
      contract
    });
  } catch (err: any) {
    if (err.message?.includes('Forbidden')) {
      return res.status(403).json({ error: err.message, code: 'FORBIDDEN' });
    }
    res.status(400).json({ error: err.message || 'Failed to complete contract' });
  }
});

// --------------------------------------------------------------------------
// 10. Audit Download or Print Action
// --------------------------------------------------------------------------
contractRouter.post('/api/contracts/:id/audit', (req: Request, res: Response) => {
  try {
    const actor = extractActor(req);
    const contractId = req.params.id;
    const action = req.body.action as 'DOWNLOADED' | 'TERMS_VIEWED';
    const details = req.body.details;

    ContractService.logAction(contractId, action || 'DOWNLOADED', actor, details);

    res.json({ success: true, message: 'Action logged successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to log action' });
  }
});
