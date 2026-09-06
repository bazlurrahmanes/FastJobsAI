import { initDatabase } from '../db';
import { Contract, ContractAuditEntry, ContractCompensation, ContractStatus } from '../../src/types';
import { INITIAL_CONTRACTS } from '../../src/data/mockContracts';

export interface ActorContext {
  id: string;
  name: string;
  email: string;
  role: 'employer' | 'job_seeker' | 'admin' | 'system';
  ipAddress?: string;
}

export class ContractService {
  /**
   * Ensure initial seed contracts exist in SQLite
   */
  public static ensureSeedData(): void {
    const db = initDatabase();
    const count = (db.prepare('SELECT COUNT(*) as count FROM contracts').get() as { count: number }).count;
    if (count === 0) {
      console.log('[ContractService] Seeding initial contracts into SQLite...');
      for (const ctr of INITIAL_CONTRACTS) {
        try {
          db.prepare(`
            INSERT INTO contracts (
              id, contract_number, title, status, contract_type,
              employer_id, company_name, employer_contact_name, employer_email, employer_address, signatory_title,
              candidate_id, candidate_name, candidate_email, candidate_phone, candidate_address,
              job_id, job_title, department, work_location, expected_hours_per_week,
              start_date, end_date, is_ongoing, notice_period_days, probation_period_months,
              rate, currency, payment_frequency, payment_schedule, overtime_rate, bonus_terms, equity_terms, benefits_summary,
              scope_of_work, confidentiality_clause, ip_assignment_clause, termination_clause, non_solicitation_clause,
              governing_jurisdiction, special_conditions, employer_signed_at, employer_signed_by,
              candidate_signed_at, candidate_signed_by, cancellation_reason, cancelled_by, cancelled_at,
              template_id, compensation_json, history_json, created_at, updated_at
            ) VALUES (
              @id, @contract_number, @title, @status, @contract_type,
              @employer_id, @company_name, @employer_contact_name, @employer_email, @employer_address, @signatory_title,
              @candidate_id, @candidate_name, @candidate_email, @candidate_phone, @candidate_address,
              @job_id, @job_title, @department, @work_location, @expected_hours_per_week,
              @start_date, @end_date, @is_ongoing, @notice_period_days, @probation_period_months,
              @rate, @currency, @payment_frequency, @payment_schedule, @overtime_rate, @bonus_terms, @equity_terms, @benefits_summary,
              @scope_of_work, @confidentiality_clause, @ip_assignment_clause, @termination_clause, @non_solicitation_clause,
              @governing_jurisdiction, @special_conditions, @employer_signed_at, @employer_signed_by,
              @candidate_signed_at, @candidate_signed_by, @cancellation_reason, @cancelled_by, @cancelled_at,
              @template_id, @compensation_json, @history_json, @created_at, @updated_at
            )
          `).run({
            id: ctr.id,
            contract_number: ctr.contractNumber,
            title: ctr.title,
            status: ctr.status,
            contract_type: ctr.contractType,
            employer_id: ctr.employerId,
            company_name: ctr.companyName,
            employer_contact_name: ctr.employerContactName,
            employer_email: ctr.employerEmail,
            employer_address: ctr.employerAddress || null,
            signatory_title: ctr.signatoryTitle || null,
            candidate_id: ctr.candidateId,
            candidate_name: ctr.candidateName,
            candidate_email: ctr.candidateEmail,
            candidate_phone: ctr.candidatePhone || null,
            candidate_address: ctr.candidateAddress || null,
            job_id: ctr.jobId || null,
            job_title: ctr.jobTitle,
            department: ctr.department || null,
            work_location: ctr.workLocation,
            expected_hours_per_week: ctr.expectedHoursPerWeek || 40,
            start_date: ctr.startDate,
            end_date: ctr.endDate || null,
            is_ongoing: ctr.isOngoing ? 1 : 0,
            notice_period_days: ctr.noticePeriodDays,
            probation_period_months: ctr.probationPeriodMonths || 0,
            rate: ctr.compensation.rate,
            currency: ctr.compensation.currency,
            payment_frequency: ctr.compensation.frequency,
            payment_schedule: ctr.compensation.paymentSchedule,
            overtime_rate: ctr.compensation.overtimeRate || null,
            bonus_terms: ctr.compensation.bonusTerms || null,
            equity_terms: ctr.compensation.equityTerms || null,
            benefits_summary: ctr.compensation.benefitsSummary || null,
            scope_of_work: ctr.scopeOfWork,
            confidentiality_clause: ctr.confidentialityClause,
            ip_assignment_clause: ctr.ipAssignmentClause,
            termination_clause: ctr.terminationClause,
            non_solicitation_clause: ctr.nonSolicitationClause || null,
            governing_jurisdiction: ctr.governingJurisdiction,
            special_conditions: ctr.specialConditions || null,
            employer_signed_at: ctr.employerSignedAt || null,
            employer_signed_by: ctr.employerSignedBy || null,
            candidate_signed_at: ctr.candidateSignedAt || null,
            candidate_signed_by: ctr.candidateSignedBy || null,
            cancellation_reason: ctr.cancellationReason || null,
            cancelled_by: ctr.cancelledBy || null,
            cancelled_at: ctr.cancelledAt || null,
            template_id: ctr.templateId || null,
            compensation_json: JSON.stringify(ctr.compensation),
            history_json: JSON.stringify(ctr.history || []),
            created_at: ctr.createdAt,
            updated_at: ctr.updatedAt
          });

          // Seed audits
          if (ctr.history && ctr.history.length > 0) {
            for (const h of ctr.history) {
              db.prepare(`
                INSERT INTO contract_audits (
                  id, contract_id, timestamp, action, actor_id, actor_name, actor_role, actor_email, summary, details, previous_status, new_status, ip_address
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `).run(
                h.id, ctr.id, h.timestamp, h.action, h.actorId, h.actorName, h.actorRole, h.actorEmail || null, h.summary, h.details || null, h.previousStatus || null, h.newStatus || null, h.ipAddress || '127.0.0.1'
              );
            }
          }
        } catch (err) {
          console.error('[ContractService] Error seeding contract:', ctr.id, err);
        }
      }
    }
  }

  /**
   * Helper: Map SQLite row to Contract model
   */
  private static mapRowToContract(row: any): Contract {
    let compensation: ContractCompensation;
    try {
      compensation = row.compensation_json ? JSON.parse(row.compensation_json) : {
        rate: row.rate,
        currency: row.currency || 'USD',
        frequency: row.payment_frequency || 'annually',
        paymentSchedule: row.payment_schedule || 'Bi-weekly',
        overtimeRate: row.overtime_rate,
        bonusTerms: row.bonus_terms,
        equityTerms: row.equity_terms,
        benefitsSummary: row.benefits_summary
      };
    } catch {
      compensation = {
        rate: row.rate,
        currency: row.currency || 'USD',
        frequency: row.payment_frequency || 'annually',
        paymentSchedule: row.payment_schedule || 'Bi-weekly'
      };
    }

    let history: ContractAuditEntry[] = [];
    try {
      history = row.history_json ? JSON.parse(row.history_json) : [];
    } catch {
      history = [];
    }

    return {
      id: row.id,
      contractNumber: row.contract_number,
      title: row.title,
      status: row.status as ContractStatus,
      contractType: row.contract_type,

      employerId: row.employer_id,
      companyName: row.company_name,
      employerContactName: row.employer_contact_name,
      employerEmail: row.employer_email,
      employerAddress: row.employer_address || undefined,
      signatoryTitle: row.signatory_title || undefined,
      employerSignedAt: row.employer_signed_at || undefined,
      employerSignedBy: row.employer_signed_by || undefined,

      candidateId: row.candidate_id,
      candidateName: row.candidate_name,
      candidateEmail: row.candidate_email,
      candidatePhone: row.candidate_phone || undefined,
      candidateAddress: row.candidate_address || undefined,
      candidateSignedAt: row.candidate_signed_at || undefined,
      candidateSignedBy: row.candidate_signed_by || undefined,

      jobId: row.job_id || undefined,
      jobTitle: row.job_title,
      department: row.department || undefined,
      workLocation: row.work_location,
      expectedHoursPerWeek: row.expected_hours_per_week || undefined,

      startDate: row.start_date,
      endDate: row.end_date || undefined,
      isOngoing: Boolean(row.is_ongoing),
      noticePeriodDays: row.notice_period_days,
      probationPeriodMonths: row.probation_period_months || undefined,

      compensation,

      scopeOfWork: row.scope_of_work,
      confidentialityClause: row.confidentiality_clause,
      ipAssignmentClause: row.ip_assignment_clause,
      terminationClause: row.termination_clause,
      nonSolicitationClause: row.non_solicitation_clause || undefined,
      governingJurisdiction: row.governing_jurisdiction,
      specialConditions: row.special_conditions || undefined,

      cancellationReason: row.cancellation_reason || undefined,
      cancelledBy: row.cancelled_by || undefined,
      cancelledAt: row.cancelled_at || undefined,
      completedAt: row.completed_at || undefined,

      createdAt: row.created_at,
      updatedAt: row.updated_at,
      templateId: row.template_id || undefined,
      history
    };
  }

  /**
   * List contracts based on actor RBAC permissions
   */
  public static listContracts(actor: ActorContext, statusFilter?: string): Contract[] {
    this.ensureSeedData();
    const db = initDatabase();

    let query = 'SELECT * FROM contracts WHERE 1=1';
    const params: any[] = [];

    // Strict RBAC Filtering
    if (actor.role === 'admin') {
      // Admin can see all
    } else if (actor.role === 'employer') {
      // Employer can see contracts they created
      query += ' AND employer_id = ?';
      params.push(actor.id);
    } else {
      // Candidate can only see contracts assigned to them, AND drafts are strictly hidden
      query += ' AND (candidate_id = ? OR LOWER(candidate_email) = LOWER(?)) AND status != ?';
      params.push(actor.id, actor.email, 'draft');
    }

    if (statusFilter && statusFilter !== 'all') {
      query += ' AND status = ?';
      params.push(statusFilter);
    }

    query += ' ORDER BY created_at DESC';

    const rows = db.prepare(query).all(...params);
    return rows.map(r => this.mapRowToContract(r));
  }

  /**
   * Get single contract with RBAC check
   */
  public static getContract(contractId: string, actor: ActorContext): Contract | null {
    this.ensureSeedData();
    const db = initDatabase();
    const row = db.prepare('SELECT * FROM contracts WHERE id = ?').get(contractId);

    if (!row) {
      return null;
    }

    const contract = this.mapRowToContract(row);

    // RBAC Check
    if (actor.role === 'admin') {
      return contract;
    }

    if (actor.role === 'employer') {
      if (contract.employerId !== actor.id) {
        throw new Error('Forbidden: You do not have permission to access this contract');
      }
      return contract;
    }

    // Candidate
    const isMatchingCandidate = contract.candidateId === actor.id || 
      contract.candidateEmail.toLowerCase() === actor.email.toLowerCase();
    
    if (!isMatchingCandidate) {
      throw new Error('Forbidden: You do not have permission to access this contract');
    }

    // Candidate cannot view draft contracts
    if (contract.status === 'draft') {
      throw new Error('Forbidden: Contract is currently in draft status and not yet released by the employer');
    }

    return contract;
  }

  /**
   * Create new contract with validation & audit trail
   */
  public static createContract(data: Partial<Contract>, actor: ActorContext): Contract {
    if (actor.role !== 'employer' && actor.role !== 'admin') {
      throw new Error('Forbidden: Only authorized employers or administrators can create contracts');
    }

    // Server-side validation
    if (!data.title?.trim()) throw new Error('Validation Error: Contract title is required');
    if (!data.candidateName?.trim()) throw new Error('Validation Error: Candidate name is required');
    if (!data.candidateEmail?.trim() || !data.candidateEmail.includes('@')) {
      throw new Error('Validation Error: A valid candidate email address is required');
    }
    if (!data.jobTitle?.trim()) throw new Error('Validation Error: Job position title is required');
    if (!data.startDate?.trim()) throw new Error('Validation Error: Contract start date is required');
    if (!data.scopeOfWork?.trim()) throw new Error('Validation Error: Scope of work is required');
    if (!data.confidentialityClause?.trim()) throw new Error('Validation Error: Confidentiality clause is required');
    if (!data.ipAssignmentClause?.trim()) throw new Error('Validation Error: Intellectual property clause is required');
    if (!data.governingJurisdiction?.trim()) throw new Error('Validation Error: Governing jurisdiction is required');

    const rate = Number(data.compensation?.rate);
    if (isNaN(rate) || rate <= 0) {
      throw new Error('Validation Error: Compensation rate must be a positive number');
    }

    const db = initDatabase();
    const now = new Date().toISOString();
    const contractId = `ctr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const contractNumber = `FJ-CTR-2026-${randomSuffix}`;

    const initialAudit: ContractAuditEntry = {
      id: `aud-${Date.now()}-1`,
      timestamp: now,
      action: 'CREATED',
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      actorEmail: actor.email,
      summary: 'Contract created by employer',
      details: `Initial contract terms prepared for candidate ${data.candidateName} (${data.candidateEmail}).`,
      newStatus: data.status || 'draft',
      ipAddress: actor.ipAddress || '127.0.0.1'
    };

    const compensation: ContractCompensation = {
      rate,
      currency: data.compensation?.currency || 'USD',
      frequency: data.compensation?.frequency || 'annually',
      paymentSchedule: data.compensation?.paymentSchedule || 'Bi-weekly',
      overtimeRate: data.compensation?.overtimeRate,
      bonusTerms: data.compensation?.bonusTerms,
      equityTerms: data.compensation?.equityTerms,
      benefitsSummary: data.compensation?.benefitsSummary,
      milestones: data.compensation?.milestones || []
    };

    const status: ContractStatus = data.status || 'draft';
    const history: ContractAuditEntry[] = [initialAudit];

    let employerSignedAt: string | null = null;
    let employerSignedBy: string | null = null;

    if (status === 'pending') {
      employerSignedAt = now;
      employerSignedBy = `${actor.name} (Authorized Signatory)`;
      history.push({
        id: `aud-${Date.now()}-2`,
        timestamp: now,
        action: 'SENT_TO_CANDIDATE',
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        actorEmail: actor.email,
        summary: 'Contract immediately issued to candidate',
        details: `Contract dispatched to candidate ${data.candidateEmail} for electronic execution.`,
        previousStatus: 'draft',
        newStatus: 'pending',
        ipAddress: actor.ipAddress || '127.0.0.1'
      });
    }

    db.prepare(`
      INSERT INTO contracts (
        id, contract_number, title, status, contract_type,
        employer_id, company_name, employer_contact_name, employer_email, employer_address, signatory_title,
        candidate_id, candidate_name, candidate_email, candidate_phone, candidate_address,
        job_id, job_title, department, work_location, expected_hours_per_week,
        start_date, end_date, is_ongoing, notice_period_days, probation_period_months,
        rate, currency, payment_frequency, payment_schedule, overtime_rate, bonus_terms, equity_terms, benefits_summary,
        scope_of_work, confidentiality_clause, ip_assignment_clause, termination_clause, non_solicitation_clause,
        governing_jurisdiction, special_conditions, employer_signed_at, employer_signed_by,
        candidate_signed_at, candidate_signed_by, cancellation_reason, cancelled_by, cancelled_at,
        template_id, compensation_json, history_json, created_at, updated_at
      ) VALUES (
        @id, @contract_number, @title, @status, @contract_type,
        @employer_id, @company_name, @employer_contact_name, @employer_email, @employer_address, @signatory_title,
        @candidate_id, @candidate_name, @candidate_email, @candidate_phone, @candidate_address,
        @job_id, @job_title, @department, @work_location, @expected_hours_per_week,
        @start_date, @end_date, @is_ongoing, @notice_period_days, @probation_period_months,
        @rate, @currency, @payment_frequency, @payment_schedule, @overtime_rate, @bonus_terms, @equity_terms, @benefits_summary,
        @scope_of_work, @confidentiality_clause, @ip_assignment_clause, @termination_clause, @non_solicitation_clause,
        @governing_jurisdiction, @special_conditions, @employer_signed_at, @employer_signed_by,
        @candidate_signed_at, @candidate_signed_by, @cancellation_reason, @cancelled_by, @cancelled_at,
        @template_id, @compensation_json, @history_json, @created_at, @updated_at
      )
    `).run({
      id: contractId,
      contract_number: contractNumber,
      title: data.title.trim(),
      status,
      contract_type: data.contractType || 'full_time',
      employer_id: actor.id,
      company_name: data.companyName || actor.name,
      employer_contact_name: data.employerContactName || actor.name,
      employer_email: data.employerEmail || actor.email,
      employer_address: data.employerAddress || null,
      signatory_title: data.signatoryTitle || 'Authorized Hiring Manager',
      candidate_id: data.candidateId || `usr_${Date.now()}`,
      candidate_name: data.candidateName.trim(),
      candidate_email: data.candidateEmail.trim().toLowerCase(),
      candidate_phone: data.candidatePhone || null,
      candidate_address: data.candidateAddress || null,
      job_id: data.jobId || null,
      job_title: data.jobTitle.trim(),
      department: data.department || null,
      work_location: data.workLocation || 'Remote',
      expected_hours_per_week: data.expectedHoursPerWeek || 40,
      start_date: data.startDate,
      end_date: data.endDate || null,
      is_ongoing: data.isOngoing ? 1 : 0,
      notice_period_days: data.noticePeriodDays || 14,
      probation_period_months: data.probationPeriodMonths || 0,
      rate: compensation.rate,
      currency: compensation.currency,
      payment_frequency: compensation.frequency,
      payment_schedule: compensation.paymentSchedule,
      overtime_rate: compensation.overtimeRate || null,
      bonus_terms: compensation.bonusTerms || null,
      equity_terms: compensation.equityTerms || null,
      benefits_summary: compensation.benefitsSummary || null,
      scope_of_work: data.scopeOfWork,
      confidentiality_clause: data.confidentialityClause,
      ip_assignment_clause: data.ipAssignmentClause,
      termination_clause: data.terminationClause || 'Either party may terminate upon agreed notice period.',
      non_solicitation_clause: data.nonSolicitationClause || null,
      governing_jurisdiction: data.governingJurisdiction,
      special_conditions: data.specialConditions || null,
      employer_signed_at: employerSignedAt,
      employer_signed_by: employerSignedBy,
      candidate_signed_at: null,
      candidate_signed_by: null,
      cancellation_reason: null,
      cancelled_by: null,
      cancelled_at: null,
      template_id: data.templateId || null,
      compensation_json: JSON.stringify(compensation),
      history_json: JSON.stringify(history),
      created_at: now,
      updated_at: now
    });

    // Record audit table row
    for (const audit of history) {
      db.prepare(`
        INSERT INTO contract_audits (
          id, contract_id, timestamp, action, actor_id, actor_name, actor_role, actor_email, summary, details, previous_status, new_status, ip_address
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        audit.id, contractId, audit.timestamp, audit.action, audit.actorId, audit.actorName, audit.actorRole, audit.actorEmail || null, audit.summary, audit.details || null, audit.previousStatus || null, audit.newStatus || null, audit.ipAddress || '127.0.0.1'
      );
    }

    return this.getContract(contractId, actor)!;
  }

  /**
   * Edit existing contract
   */
  public static updateContract(contractId: string, updates: Partial<Contract>, actor: ActorContext): Contract {
    const existing = this.getContract(contractId, actor);
    if (!existing) {
      throw new Error('Contract not found');
    }

    if (actor.role !== 'admin' && existing.employerId !== actor.id) {
      throw new Error('Forbidden: Only the issuing employer can edit this contract');
    }

    if (existing.status === 'completed' || existing.status === 'cancelled') {
      throw new Error(`Cannot edit contract in ${existing.status} status`);
    }

    if (existing.status === 'active' && updates.scopeOfWork && updates.scopeOfWork !== existing.scopeOfWork) {
      throw new Error('Cannot materially alter scope of an active, legally executed contract without a formal amendment');
    }

    const now = new Date().toISOString();
    const db = initDatabase();

    const auditEntry: ContractAuditEntry = {
      id: `aud-${Date.now()}`,
      timestamp: now,
      action: 'UPDATED',
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      actorEmail: actor.email,
      summary: 'Contract clauses or compensation modified',
      details: 'Employer modified contract parameters prior to completion.',
      previousStatus: existing.status,
      newStatus: existing.status,
      ipAddress: actor.ipAddress || '127.0.0.1'
    };

    const newHistory = [...existing.history, auditEntry];
    const newCompensation = {
      ...existing.compensation,
      ...(updates.compensation || {})
    };

    db.prepare(`
      UPDATE contracts SET
        title = COALESCE(?, title),
        contract_type = COALESCE(?, contract_type),
        job_title = COALESCE(?, job_title),
        department = COALESCE(?, department),
        work_location = COALESCE(?, work_location),
        start_date = COALESCE(?, start_date),
        end_date = COALESCE(?, end_date),
        is_ongoing = COALESCE(?, is_ongoing),
        notice_period_days = COALESCE(?, notice_period_days),
        probation_period_months = COALESCE(?, probation_period_months),
        rate = COALESCE(?, rate),
        currency = COALESCE(?, currency),
        payment_frequency = COALESCE(?, payment_frequency),
        payment_schedule = COALESCE(?, payment_schedule),
        bonus_terms = COALESCE(?, bonus_terms),
        equity_terms = COALESCE(?, equity_terms),
        benefits_summary = COALESCE(?, benefits_summary),
        scope_of_work = COALESCE(?, scope_of_work),
        confidentiality_clause = COALESCE(?, confidentiality_clause),
        ip_assignment_clause = COALESCE(?, ip_assignment_clause),
        termination_clause = COALESCE(?, termination_clause),
        non_solicitation_clause = COALESCE(?, non_solicitation_clause),
        governing_jurisdiction = COALESCE(?, governing_jurisdiction),
        special_conditions = COALESCE(?, special_conditions),
        compensation_json = ?,
        history_json = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      updates.title || null,
      updates.contractType || null,
      updates.jobTitle || null,
      updates.department || null,
      updates.workLocation || null,
      updates.startDate || null,
      updates.endDate || null,
      updates.isOngoing !== undefined ? (updates.isOngoing ? 1 : 0) : null,
      updates.noticePeriodDays || null,
      updates.probationPeriodMonths || null,
      newCompensation.rate || null,
      newCompensation.currency || null,
      newCompensation.frequency || null,
      newCompensation.paymentSchedule || null,
      newCompensation.bonusTerms || null,
      newCompensation.equityTerms || null,
      newCompensation.benefitsSummary || null,
      updates.scopeOfWork || null,
      updates.confidentialityClause || null,
      updates.ipAssignmentClause || null,
      updates.terminationClause || null,
      updates.nonSolicitationClause || null,
      updates.governingJurisdiction || null,
      updates.specialConditions || null,
      JSON.stringify(newCompensation),
      JSON.stringify(newHistory),
      now,
      contractId
    );

    // Write audit row
    db.prepare(`
      INSERT INTO contract_audits (
        id, contract_id, timestamp, action, actor_id, actor_name, actor_role, actor_email, summary, details, previous_status, new_status, ip_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      auditEntry.id, contractId, auditEntry.timestamp, auditEntry.action, auditEntry.actorId, auditEntry.actorName, auditEntry.actorRole, auditEntry.actorEmail || null, auditEntry.summary, auditEntry.details || null, auditEntry.previousStatus || null, auditEntry.newStatus || null, auditEntry.ipAddress || '127.0.0.1'
    );

    return this.getContract(contractId, actor)!;
  }

  /**
   * Employer sends contract to candidate for signature
   */
  public static sendToCandidate(contractId: string, actor: ActorContext): Contract {
    const existing = this.getContract(contractId, actor);
    if (!existing) throw new Error('Contract not found');

    if (actor.role !== 'admin' && existing.employerId !== actor.id) {
      throw new Error('Forbidden: Only the issuing employer can dispatch this contract');
    }

    if (existing.status !== 'draft') {
      throw new Error(`Cannot send contract that is already in '${existing.status}' status`);
    }

    const now = new Date().toISOString();
    const db = initDatabase();

    const auditEntry: ContractAuditEntry = {
      id: `aud-${Date.now()}`,
      timestamp: now,
      action: 'SENT_TO_CANDIDATE',
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      actorEmail: actor.email,
      summary: 'Contract sent to candidate for signature',
      details: `Employer executed and issued contract to ${existing.candidateEmail}.`,
      previousStatus: 'draft',
      newStatus: 'pending',
      ipAddress: actor.ipAddress || '127.0.0.1'
    };

    const newHistory = [...existing.history, auditEntry];
    const signature = `${actor.name} (Authorized Signatory)`;

    db.prepare(`
      UPDATE contracts SET
        status = 'pending',
        employer_signed_at = ?,
        employer_signed_by = ?,
        history_json = ?,
        updated_at = ?
      WHERE id = ?
    `).run(now, signature, JSON.stringify(newHistory), now, contractId);

    db.prepare(`
      INSERT INTO contract_audits (
        id, contract_id, timestamp, action, actor_id, actor_name, actor_role, actor_email, summary, details, previous_status, new_status, ip_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      auditEntry.id, contractId, auditEntry.timestamp, auditEntry.action, auditEntry.actorId, auditEntry.actorName, auditEntry.actorRole, auditEntry.actorEmail || null, auditEntry.summary, auditEntry.details || null, auditEntry.previousStatus, auditEntry.newStatus, auditEntry.ipAddress || '127.0.0.1'
    );

    return this.getContract(contractId, actor)!;
  }

  /**
   * Candidate digitally signs and accepts contract
   */
  public static acceptContract(contractId: string, signatureName: string, actor: ActorContext): Contract {
    const existing = this.getContract(contractId, actor);
    if (!existing) throw new Error('Contract not found');

    const isAuthorizedCandidate = 
      existing.candidateId === actor.id || 
      existing.candidateEmail.toLowerCase() === actor.email.toLowerCase() ||
      actor.role === 'admin';

    if (!isAuthorizedCandidate) {
      throw new Error('Forbidden: Only the assigned candidate can accept and sign this contract');
    }

    if (existing.status !== 'pending') {
      throw new Error(`Contract cannot be signed in its current status: ${existing.status}`);
    }

    if (!signatureName?.trim() || signatureName.trim().length < 2) {
      throw new Error('Validation Error: A legally binding typed signature name is required');
    }

    const now = new Date().toISOString();
    const db = initDatabase();

    const auditEntry: ContractAuditEntry = {
      id: `aud-${Date.now()}`,
      timestamp: now,
      action: 'ACCEPTED_BY_CANDIDATE',
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      actorEmail: actor.email,
      summary: 'Contract accepted and digitally signed by candidate',
      details: `Candidate signed as "${signatureName.trim()}". Legally binding active contract executed.`,
      previousStatus: 'pending',
      newStatus: 'active',
      ipAddress: actor.ipAddress || '127.0.0.1'
    };

    const newHistory = [...existing.history, auditEntry];
    const signatureRecord = `${signatureName.trim()} (Digital Signature Verified)`;

    db.prepare(`
      UPDATE contracts SET
        status = 'active',
        candidate_signed_at = ?,
        candidate_signed_by = ?,
        history_json = ?,
        updated_at = ?
      WHERE id = ?
    `).run(now, signatureRecord, JSON.stringify(newHistory), now, contractId);

    db.prepare(`
      INSERT INTO contract_audits (
        id, contract_id, timestamp, action, actor_id, actor_name, actor_role, actor_email, summary, details, previous_status, new_status, ip_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      auditEntry.id, contractId, auditEntry.timestamp, auditEntry.action, auditEntry.actorId, auditEntry.actorName, auditEntry.actorRole, auditEntry.actorEmail || null, auditEntry.summary, auditEntry.details || null, auditEntry.previousStatus, auditEntry.newStatus, auditEntry.ipAddress || '127.0.0.1'
    );

    return this.getContract(contractId, actor)!;
  }

  /**
   * Cancel contract (Employer, Candidate, or Admin with reason)
   */
  public static cancelContract(contractId: string, reason: string, actor: ActorContext): Contract {
    const existing = this.getContract(contractId, actor);
    if (!existing) throw new Error('Contract not found');

    const isAuthorized = 
      actor.role === 'admin' ||
      existing.employerId === actor.id ||
      existing.candidateId === actor.id ||
      existing.candidateEmail.toLowerCase() === actor.email.toLowerCase();

    if (!isAuthorized) {
      throw new Error('Forbidden: You do not have permission to cancel this contract');
    }

    if (existing.status === 'completed') {
      throw new Error('Cannot cancel a completed contract');
    }

    if (existing.status === 'cancelled') {
      throw new Error('Contract is already cancelled');
    }

    if (!reason?.trim() || reason.trim().length < 5) {
      throw new Error('Validation Error: A descriptive cancellation reason (minimum 5 characters) is required');
    }

    const now = new Date().toISOString();
    const db = initDatabase();

    const auditEntry: ContractAuditEntry = {
      id: `aud-${Date.now()}`,
      timestamp: now,
      action: 'CANCELLED',
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      actorEmail: actor.email,
      summary: `Contract cancelled by ${actor.role}`,
      details: `Cancellation reason: ${reason.trim()}`,
      previousStatus: existing.status,
      newStatus: 'cancelled',
      ipAddress: actor.ipAddress || '127.0.0.1'
    };

    const newHistory = [...existing.history, auditEntry];

    db.prepare(`
      UPDATE contracts SET
        status = 'cancelled',
        cancellation_reason = ?,
        cancelled_by = ?,
        cancelled_at = ?,
        history_json = ?,
        updated_at = ?
      WHERE id = ?
    `).run(reason.trim(), `${actor.name} (${actor.role})`, now, JSON.stringify(newHistory), now, contractId);

    db.prepare(`
      INSERT INTO contract_audits (
        id, contract_id, timestamp, action, actor_id, actor_name, actor_role, actor_email, summary, details, previous_status, new_status, ip_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      auditEntry.id, contractId, auditEntry.timestamp, auditEntry.action, auditEntry.actorId, auditEntry.actorName, auditEntry.actorRole, auditEntry.actorEmail || null, auditEntry.summary, auditEntry.details || null, auditEntry.previousStatus, auditEntry.newStatus, auditEntry.ipAddress || '127.0.0.1'
    );

    return this.getContract(contractId, actor)!;
  }

  /**
   * Mark active contract completed
   */
  public static completeContract(contractId: string, actor: ActorContext): Contract {
    const existing = this.getContract(contractId, actor);
    if (!existing) throw new Error('Contract not found');

    if (actor.role !== 'admin' && existing.employerId !== actor.id) {
      throw new Error('Forbidden: Only the issuing employer can mark this contract completed');
    }

    if (existing.status !== 'active') {
      throw new Error(`Cannot complete contract in '${existing.status}' status (must be active)`);
    }

    const now = new Date().toISOString();
    const db = initDatabase();

    const auditEntry: ContractAuditEntry = {
      id: `aud-${Date.now()}`,
      timestamp: now,
      action: 'COMPLETED',
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      actorEmail: actor.email,
      summary: 'Contract term successfully completed',
      details: 'All scope milestones and deliverables concluded satisfactorily.',
      previousStatus: 'active',
      newStatus: 'completed',
      ipAddress: actor.ipAddress || '127.0.0.1'
    };

    const newHistory = [...existing.history, auditEntry];

    db.prepare(`
      UPDATE contracts SET
        status = 'completed',
        completed_at = ?,
        history_json = ?,
        updated_at = ?
      WHERE id = ?
    `).run(now, JSON.stringify(newHistory), now, contractId);

    db.prepare(`
      INSERT INTO contract_audits (
        id, contract_id, timestamp, action, actor_id, actor_name, actor_role, actor_email, summary, details, previous_status, new_status, ip_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      auditEntry.id, contractId, auditEntry.timestamp, auditEntry.action, auditEntry.actorId, auditEntry.actorName, auditEntry.actorRole, auditEntry.actorEmail || null, auditEntry.summary, auditEntry.details || null, auditEntry.previousStatus, auditEntry.newStatus, auditEntry.ipAddress || '127.0.0.1'
    );

    return this.getContract(contractId, actor)!;
  }

  /**
   * Log action such as download or terms viewed
   */
  public static logAction(contractId: string, action: 'DOWNLOADED' | 'TERMS_VIEWED', actor: ActorContext, details?: string): void {
    const existing = this.getContract(contractId, actor);
    if (!existing) return;

    const now = new Date().toISOString();
    const db = initDatabase();

    const auditEntry: ContractAuditEntry = {
      id: `aud-${Date.now()}`,
      timestamp: now,
      action,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      actorEmail: actor.email,
      summary: action === 'DOWNLOADED' ? 'Contract document downloaded or printed' : 'Contract terms reviewed',
      details,
      previousStatus: existing.status,
      newStatus: existing.status,
      ipAddress: actor.ipAddress || '127.0.0.1'
    };

    const newHistory = [...existing.history, auditEntry];

    db.prepare(`
      UPDATE contracts SET
        history_json = ?,
        updated_at = ?
      WHERE id = ?
    `).run(JSON.stringify(newHistory), now, contractId);

    db.prepare(`
      INSERT INTO contract_audits (
        id, contract_id, timestamp, action, actor_id, actor_name, actor_role, actor_email, summary, details, previous_status, new_status, ip_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      auditEntry.id, contractId, auditEntry.timestamp, auditEntry.action, auditEntry.actorId, auditEntry.actorName, auditEntry.actorRole, auditEntry.actorEmail || null, auditEntry.summary, auditEntry.details || null, auditEntry.previousStatus, auditEntry.newStatus, auditEntry.ipAddress || '127.0.0.1'
    );
  }
}
