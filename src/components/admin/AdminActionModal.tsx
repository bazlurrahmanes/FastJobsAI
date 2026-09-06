import React, { useState } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  FileText, 
  Lock, 
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Trash2,
  Flag,
  UserX,
  Building2
} from 'lucide-react';
import { AdminActionProposal } from '../../types';

interface AdminActionModalProps {
  proposal: AdminActionProposal | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (proposal: AdminActionProposal, reason: string) => Promise<void>;
  isExecuting?: boolean;
}

export const AdminActionModal: React.FC<AdminActionModalProps> = ({
  proposal,
  isOpen,
  onClose,
  onConfirm,
  isExecuting = false
}) => {
  const [reason, setReason] = useState('');
  const [hasAcknowledged, setHasAcknowledged] = useState(false);

  if (!isOpen || !proposal) return null;

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'CRITICAL':
        return {
          bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          icon: ShieldAlert,
          label: 'CRITICAL RISK'
        };
      case 'HIGH':
        return {
          bg: 'bg-red-500/20 text-red-300 border-red-500/40',
          icon: AlertTriangle,
          label: 'HIGH RISK'
        };
      case 'MEDIUM':
        return {
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: AlertTriangle,
          label: 'MEDIUM RISK'
        };
      default:
        return {
          bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          icon: ShieldCheck,
          label: 'LOW RISK'
        };
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'DELETE_JOB':
        return Trash2;
      case 'FLAG_JOB':
        return Flag;
      case 'REJECT_COMPANY':
      case 'SUSPEND_ACCOUNT':
        return UserX;
      case 'APPROVE_COMPANY':
        return Building2;
      case 'RETRY_FEED':
        return RotateCcw;
      default:
        return Lock;
    }
  };

  const riskInfo = getRiskBadge(proposal.riskLevel);
  const ActionIcon = getActionIcon(proposal.actionType);

  const handleConfirm = async () => {
    const finalReason = reason.trim() || proposal.explanation;
    await onConfirm(proposal, finalReason);
    setReason('');
    setHasAcknowledged(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-100 animate-scaleUp"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Banner */}
        <div className={`px-6 py-4 border-b border-slate-800 flex items-center justify-between ${
          proposal.riskLevel === 'CRITICAL' || proposal.riskLevel === 'HIGH'
            ? 'bg-rose-950/40'
            : 'bg-slate-850'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-amber-400">
              <ActionIcon className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Admin Action Confirmation
                </h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${riskInfo.bg}`}>
                  {riskInfo.label}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Human-in-the-loop review required before execution
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isExecuting}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Action Spec Card */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Action Type</span>
              <span className="font-mono font-bold text-cyan-300 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
                {proposal.actionType}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Target Entity</span>
              <span className="font-medium text-white truncate max-w-[280px]" title={proposal.targetName}>
                {proposal.targetName}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Target ID</span>
              <span className="font-mono text-slate-400 text-[11px]">
                {proposal.targetId}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-800/80 text-xs">
              <span className="text-slate-400 block mb-1 font-semibold">System Explanation:</span>
              <p className="text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                {proposal.explanation}
              </p>
            </div>
          </div>

          {/* Reason / Justification Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Admin Decision Rationale (Audit Record)</span>
              <span className="text-[11px] text-slate-500">Recorded in immutable audit logs</span>
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={`Reason for approving ${proposal.actionType} (optional, default will use AI explanation)`}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-200 placeholder-slate-500 outline-hidden transition-all resize-none"
            />
          </div>

          {/* Safeguard Acknowledgment Checkbox */}
          <label className="flex items-start gap-2.5 cursor-pointer p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 hover:bg-slate-800/70 transition-colors">
            <input
              type="checkbox"
              checked={hasAcknowledged}
              onChange={(e) => setHasAcknowledged(e.target.checked)}
              className="mt-0.5 rounded border-slate-600 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
            />
            <span className="text-xs text-slate-300 leading-normal">
              I confirm that I have reviewed the target entity and authorize this administrative change. This action is irreversible and will be logged under my Admin ID.
            </span>
          </label>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isExecuting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!hasAcknowledged || isExecuting}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              proposal.riskLevel === 'CRITICAL' || proposal.riskLevel === 'HIGH'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-500/20'
                : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {isExecuting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Executing Action...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Authorize & Execute Action</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
