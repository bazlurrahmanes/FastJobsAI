import React from 'react';
import { Contract, UserRole } from '../../types';
import { 
  FileText, 
  Building, 
  User, 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface ContractCardProps {
  contract: Contract;
  userRole?: UserRole;
  currentUserId?: string;
  currentUserEmail?: string;
  onView: (contract: Contract) => void;
  onSign?: (contract: Contract) => void;
  onEdit?: (contract: Contract) => void;
  onPrint?: (contract: Contract) => void;
}

export const ContractCard: React.FC<ContractCardProps> = ({
  contract,
  userRole,
  currentUserId,
  currentUserEmail,
  onView,
  onSign,
  onEdit,
  onPrint
}) => {
  const isEmployer = userRole === 'employer' || userRole === 'admin' || contract.employerId === currentUserId;
  const isCandidate = userRole === 'job_seeker' || contract.candidateId === currentUserId || contract.candidateEmail === currentUserEmail;

  // Status Styling
  const getStatusBadge = () => {
    switch (contract.status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-500" />
            Pending Signature
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-3 h-3 text-blue-500" />
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-500" />
            Cancelled
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Draft
          </span>
        );
    }
  };

  return (
    <div 
      id={`contract-card-${contract.id}`}
      className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
    >
      <div>
        {/* Top bar: Number & Status */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {contract.contractNumber}
            </span>
            <span className="text-[11px] text-slate-400 capitalize">
              {contract.contractType.replace('_', ' ')}
            </span>
          </div>
          {getStatusBadge()}
        </div>

        {/* Title & Job Role */}
        <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors line-clamp-1">
          {contract.title}
        </h3>
        <p className="text-xs font-medium text-indigo-700 mt-0.5">
          {contract.jobTitle} • {contract.workLocation}
        </p>

        {/* Parties metadata */}
        <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
              <Building className="w-3 h-3 text-slate-400" />
              Employer
            </span>
            <p className="font-semibold text-slate-800 line-clamp-1">{contract.companyName}</p>
            <p className="text-[11px] text-slate-500 line-clamp-1">{contract.employerContactName}</p>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
              <User className="w-3 h-3 text-slate-400" />
              Candidate
            </span>
            <p className="font-semibold text-slate-800 line-clamp-1">{contract.candidateName}</p>
            <p className="text-[11px] text-slate-500 line-clamp-1">{contract.candidateEmail}</p>
          </div>
        </div>

        {/* Financial & Schedule Highlights */}
        <div className="mt-4 bg-slate-50 rounded-lg p-3 grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-slate-500 text-[11px] flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-indigo-600" />
              Compensation
            </span>
            <p className="font-bold text-slate-900 mt-0.5 font-mono">
              {contract.compensation.currency} {contract.compensation.rate.toLocaleString()} / {contract.compensation.frequency}
            </p>
          </div>
          <div>
            <span className="text-slate-500 text-[11px] flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-500" />
              Start Date
            </span>
            <p className="font-medium text-slate-900 mt-0.5">
              {contract.startDate}
            </p>
          </div>
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
          <span>RBAC Protected</span>
        </div>

        <div className="flex items-center gap-2">
          {onPrint && (
            <button
              onClick={() => onPrint(contract)}
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title="Print / Save PDF"
            >
              <Printer className="w-4 h-4" />
            </button>
          )}

          {/* Candidate Action: Sign */}
          {isCandidate && contract.status === 'pending' && onSign && (
            <button
              onClick={() => onSign(contract)}
              id={`btn-sign-card-${contract.id}`}
              className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-xs transition-all flex items-center gap-1"
            >
              Sign Contract
            </button>
          )}

          {/* Employer Action: Edit */}
          {isEmployer && (contract.status === 'draft' || contract.status === 'pending') && onEdit && (
            <button
              onClick={() => onEdit(contract)}
              id={`btn-edit-card-${contract.id}`}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Edit
            </button>
          )}

          <button
            onClick={() => onView(contract)}
            id={`btn-view-card-${contract.id}`}
            className="px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1"
          >
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
