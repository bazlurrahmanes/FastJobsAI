import React, { useState } from 'react';
import { Contract, UserProfile } from '../../types';
import { 
  FileText, 
  Printer, 
  Send, 
  Edit3, 
  Ban, 
  CheckCircle, 
  Clock, 
  Calendar, 
  Building, 
  User, 
  DollarSign, 
  ShieldCheck, 
  History, 
  X, 
  AlertCircle,
  FileCheck
} from 'lucide-react';

interface ContractDetailsModalProps {
  contract: Contract;
  onClose: () => void;
  currentUser: UserProfile | null;
  onSendContract?: (contractId: string) => Promise<void>;
  onEditContract?: (contract: Contract) => void;
  onOpenSignModal?: (contract: Contract) => void;
  onCancelContract?: (contractId: string, reason: string) => Promise<void>;
  onCompleteContract?: (contractId: string) => Promise<void>;
  onPrintContract?: (contract: Contract) => void;
}

export const ContractDetailsModal: React.FC<ContractDetailsModalProps> = ({
  contract,
  onClose,
  currentUser,
  onSendContract,
  onEditContract,
  onOpenSignModal,
  onCancelContract,
  onCompleteContract,
  onPrintContract
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'terms' | 'history'>('overview');
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const isEmployer = currentUser?.role === 'employer' || currentUser?.role === 'admin' || contract.employerId === currentUser?.id;
  const isCandidate = currentUser?.role === 'job_seeker' || contract.candidateId === currentUser?.id || contract.candidateEmail === currentUser?.email;

  const handleSend = async () => {
    if (!onSendContract) return;
    try {
      setIsProcessing(true);
      setActionError(null);
      await onSendContract(contract.id);
    } catch (err: any) {
      setActionError(err.message || 'Failed to dispatch contract.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!onCancelContract) return;
    if (!cancellationReason.trim()) {
      setActionError('A valid cancellation reason is required for compliance and audit records.');
      return;
    }
    try {
      setIsProcessing(true);
      setActionError(null);
      await onCancelContract(contract.id, cancellationReason.trim());
      setShowCancelPrompt(false);
    } catch (err: any) {
      setActionError(err.message || 'Failed to cancel contract.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleComplete = async () => {
    if (!onCompleteContract) return;
    try {
      setIsProcessing(true);
      setActionError(null);
      await onCompleteContract(contract.id);
    } catch (err: any) {
      setActionError(err.message || 'Failed to complete contract.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">{contract.title}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold uppercase tracking-wider ${
                  contract.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  contract.status === 'completed' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                  contract.status === 'pending' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  contract.status === 'cancelled' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                  'bg-slate-700 text-slate-300 border border-slate-600'
                }`}>
                  ● {contract.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Ref: {contract.contractNumber} • Effective {contract.startDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onPrintContract && (
              <button
                onClick={() => onPrintContract(contract)}
                id="btn-print-contract-header"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                title="Print or export as PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / PDF</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="bg-slate-100 px-6 border-b border-slate-200 flex items-center gap-6 shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Agreement Overview
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`py-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'terms'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Terms & Conditions
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit History ({contract.history?.length || 0})</span>
          </button>
        </div>

        {/* Error notification if any */}
        {actionError && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 text-xs">
              {/* Parties Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Employer Card */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <Building className="w-3.5 h-3.5 text-indigo-600" />
                    Employing Organization
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{contract.companyName}</h4>
                  <div className="space-y-1 text-slate-600">
                    <p>Signatory: <span className="font-medium text-slate-900">{contract.employerContactName}</span></p>
                    <p>Email: <span className="font-medium text-slate-900">{contract.employerEmail}</span></p>
                    {contract.employerAddress && <p>Location: {contract.employerAddress}</p>}
                  </div>
                  {contract.employerSignedAt && (
                    <div className="mt-3 pt-2 border-t border-slate-200 text-emerald-700 font-medium flex items-center gap-1 text-[11px]">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      Employer Signed on {new Date(contract.employerSignedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Candidate Card */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <User className="w-3.5 h-3.5 text-emerald-600" />
                    Appointed Candidate / Contractor
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{contract.candidateName}</h4>
                  <div className="space-y-1 text-slate-600">
                    <p>Email: <span className="font-medium text-slate-900">{contract.candidateEmail}</span></p>
                    {contract.candidatePhone && <p>Phone: {contract.candidatePhone}</p>}
                    {contract.candidateAddress && <p>Address: {contract.candidateAddress}</p>}
                  </div>
                  {contract.candidateSignedAt ? (
                    <div className="mt-3 pt-2 border-t border-slate-200 text-emerald-700 font-medium flex items-center gap-1 text-[11px]">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      Candidate Accepted & Signed on {new Date(contract.candidateSignedAt).toLocaleDateString()}
                    </div>
                  ) : (
                    <div className="mt-3 pt-2 border-t border-slate-200 text-amber-600 font-medium flex items-center gap-1 text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      Awaiting Candidate Signature
                    </div>
                  )}
                </div>
              </div>

              {/* Engagement Parameters */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-200 pb-2">
                  Engagement & Terms Summary
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Job Role</span>
                    <span className="font-semibold text-slate-900 mt-0.5 block">{contract.jobTitle}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Contract Type</span>
                    <span className="font-semibold text-slate-900 mt-0.5 block capitalize">
                      {contract.contractType.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Work Location</span>
                    <span className="font-semibold text-slate-900 mt-0.5 block">{contract.workLocation}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Weekly Commitment</span>
                    <span className="font-semibold text-slate-900 mt-0.5 block">{contract.expectedHoursPerWeek} hrs/week</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Effective Start Date</span>
                    <span className="font-semibold text-slate-900 mt-0.5 block">{contract.startDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Duration / End Date</span>
                    <span className="font-semibold text-slate-900 mt-0.5 block">
                      {contract.isOngoing ? 'Indefinite / Ongoing' : (contract.endDate || 'Fixed Term')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Notice Period</span>
                    <span className="font-semibold text-slate-900 mt-0.5 block">{contract.noticePeriodDays} days</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Jurisdiction</span>
                    <span className="font-semibold text-slate-900 mt-0.5 block">{contract.governingJurisdiction}</span>
                  </div>
                </div>
              </div>

              {/* Compensation Box */}
              <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-indigo-600" />
                    Compensation & Benefits
                  </span>
                  <span className="text-lg font-bold text-indigo-950 font-mono">
                    {contract.compensation.currency} {contract.compensation.rate.toLocaleString()} / {contract.compensation.frequency}
                  </span>
                </div>
                <p className="text-xs text-indigo-900/80">
                  Payment Schedule: <span className="font-semibold text-slate-900">{contract.compensation.paymentSchedule}</span>
                </p>
                {contract.compensation.bonusOrIncentives && (
                  <p className="text-xs text-indigo-900/80">
                    Incentives: <span className="font-medium text-slate-900">{contract.compensation.bonusOrIncentives}</span>
                  </p>
                )}
                {contract.compensation.benefits && contract.compensation.benefits.length > 0 && (
                  <div className="pt-2 border-t border-indigo-100/80">
                    <span className="text-indigo-900/70 block text-[11px] mb-1">Included Employee Benefits:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {contract.compensation.benefits.map((b, i) => (
                        <span key={i} className="px-2 py-0.5 bg-white border border-indigo-200 rounded text-slate-700 text-[11px]">
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Cancellation Reason if Cancelled */}
              {contract.status === 'cancelled' && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                  <span className="text-rose-900 font-bold text-xs uppercase tracking-wider">
                    Contract Cancellation Record
                  </span>
                  <p className="text-xs text-rose-800">
                    Cancelled by: <span className="font-medium">{contract.cancelledBy || 'Authorized Party'}</span> on {contract.cancelledAt ? new Date(contract.cancelledAt).toLocaleString() : 'N/A'}
                  </p>
                  <p className="text-xs text-rose-700 bg-white p-2.5 rounded border border-rose-200 mt-1">
                    "{contract.cancellationReason || 'No specific reason provided'}"
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TERMS & CONDITIONS */}
          {activeTab === 'terms' && (
            <div className="space-y-6 text-xs text-slate-700">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <h4 className="font-bold text-slate-900 text-sm">Scope of Work & Responsibilities</h4>
                <p className="whitespace-pre-line leading-relaxed">{contract.scopeOfWork}</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <h4 className="font-bold text-slate-900 text-sm">Confidentiality & Non-Disclosure</h4>
                <p className="whitespace-pre-line leading-relaxed">{contract.confidentialityClause}</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <h4 className="font-bold text-slate-900 text-sm">Intellectual Property Assignment</h4>
                <p className="whitespace-pre-line leading-relaxed">{contract.ipAssignmentClause}</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <h4 className="font-bold text-slate-900 text-sm">Termination Notice & Severance</h4>
                <p className="whitespace-pre-line leading-relaxed">{contract.terminationClause}</p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600">
                <span className="font-bold text-slate-800">Governing Law: </span>
                This agreement shall be governed and interpreted under the laws of {contract.governingJurisdiction}.
              </div>
            </div>
          )}

          {/* TAB 3: AUDIT HISTORY TIMELINE */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Immutable Compliance Audit Trail
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Non-repudiation log recording all contract state alterations, signatures, and downloads.
                  </p>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                  {contract.history?.length || 0} Events
                </span>
              </div>

              <div className="relative border-l-2 border-indigo-200 ml-4 space-y-6 py-2">
                {(contract.history || []).map((entry, idx) => (
                  <div key={entry.id || idx} className="relative pl-6">
                    {/* Circle Node */}
                    <div className="absolute -left-[9px] top-0.5 w-4 h-4 rounded-full bg-white border-2 border-indigo-600 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-slate-900 uppercase font-mono tracking-wider">
                          {entry.action.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-700">{entry.summary}</p>
                      {entry.details && (
                        <p className="text-slate-600 bg-white p-2 rounded border border-slate-200 text-[11px]">
                          {entry.details}
                        </p>
                      )}
                      <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500">
                        <span>Actor: <strong className="text-slate-700">{entry.actorName}</strong> ({entry.actorRole})</span>
                        {entry.newStatus && (
                          <span className="font-mono text-indigo-600">
                            Status: {entry.previousStatus ? `${entry.previousStatus} → ` : ''}{entry.newStatus}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cancel Reason Prompt Input (if toggled) */}
          {showCancelPrompt && (
            <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-xl space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-rose-900 font-bold text-xs uppercase tracking-wider">
                <Ban className="w-4 h-4 text-rose-600" />
                Confirm Contract Cancellation
              </div>
              <p className="text-xs text-rose-700">
                Cancelling this contract immediately revokes all terms and notifies both parties. A specific cancellation reason is required for compliance logging.
              </p>
              <textarea
                required
                rows={2}
                value={cancellationReason}
                onChange={e => setCancellationReason(e.target.value)}
                placeholder="Reason for cancellation (e.g. Terms renegotiated, Candidate declined position, Mutual cancellation)..."
                className="w-full p-2.5 bg-white border border-rose-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCancelPrompt(false)}
                  className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs rounded-lg hover:bg-slate-50"
                >
                  Never Mind
                </button>
                <button
                  type="button"
                  disabled={isProcessing || !cancellationReason.trim()}
                  onClick={handleCancel}
                  id="btn-submit-cancellation"
                  className="px-4 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-500 disabled:opacity-50"
                >
                  Confirm Cancellation
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div>
            {contract.status !== 'cancelled' && contract.status !== 'completed' && (
              <button
                type="button"
                onClick={() => setShowCancelPrompt(true)}
                id="btn-initiate-cancel-contract"
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-rose-50 transition-colors"
              >
                <Ban className="w-3.5 h-3.5" />
                Cancel Contract
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Candidate Sign Button */}
            {isCandidate && contract.status === 'pending' && onOpenSignModal && (
              <button
                type="button"
                onClick={() => onOpenSignModal(contract)}
                id="btn-open-sign-modal"
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
              >
                <FileCheck className="w-4 h-4" />
                Review & Electronically Sign
              </button>
            )}

            {/* Employer Edit Button */}
            {isEmployer && (contract.status === 'draft' || contract.status === 'pending') && onEditContract && (
              <button
                type="button"
                onClick={() => onEditContract(contract)}
                id="btn-edit-contract-terms"
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-all flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Terms
              </button>
            )}

            {/* Employer Send Button */}
            {isEmployer && contract.status === 'draft' && onSendContract && (
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleSend}
                id="btn-dispatch-contract-candidate"
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                {isProcessing ? 'Sending...' : 'Send to Candidate for Signature'}
              </button>
            )}

            {/* Employer Complete Button */}
            {isEmployer && contract.status === 'active' && onCompleteContract && (
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleComplete}
                id="btn-mark-contract-complete"
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Mark as Completed
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
