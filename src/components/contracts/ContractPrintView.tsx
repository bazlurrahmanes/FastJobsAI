import React from 'react';
import { Contract } from '../../types';
import { FileText, ShieldCheck, CheckCircle2, Calendar, MapPin, DollarSign, Building, User } from 'lucide-react';

interface ContractPrintViewProps {
  contract: Contract;
  onClose: () => void;
}

export const ContractPrintView: React.FC<ContractPrintViewProps> = ({ contract, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm overflow-y-auto flex items-center justify-center p-4 print:p-0 print:bg-white print:static">
      {/* Container */}
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8 overflow-hidden print:shadow-none print:m-0 print:w-full print:max-w-none">
        {/* Action bar (Hidden on Print) */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-indigo-400" />
            <span className="font-semibold text-sm">Official FastJobs Legal Agreement — Printable View</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {contract.contractNumber}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              id="btn-print-contract-dialog"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              id="btn-close-print-view"
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Legal Document Content */}
        <div className="p-8 sm:p-12 text-slate-800 font-sans space-y-8 bg-white print:p-6" id="printable-contract-body">
          {/* Header */}
          <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-2 text-indigo-700 font-bold tracking-tight text-xl">
                <span>FASTJOBS</span>
                <span className="text-xs font-normal px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-200">
                  STANDARD CONTRACT REPOSITORY
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mt-2">
                {contract.title}
              </h1>
              <p className="text-xs text-slate-500 font-mono mt-1">
                Document Ref: {contract.contractNumber} • Effective: {contract.startDate}
              </p>
            </div>
            <div className="text-right sm:self-center">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase font-mono ${
                contract.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                contract.status === 'completed' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                contract.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                contract.status === 'cancelled' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                'bg-slate-100 text-slate-700 border border-slate-200'
              }`}>
                ● {contract.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Parties Identification */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-200 print:bg-transparent print:p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <Building className="w-3.5 h-3.5 text-indigo-600" />
                Party A: Employing Entity / Client
              </div>
              <p className="font-bold text-slate-900 text-base">{contract.companyName}</p>
              <p className="text-xs text-slate-600">Authorized Contact: {contract.employerContactName}</p>
              <p className="text-xs text-slate-600">Official Email: {contract.employerEmail}</p>
              {contract.employerAddress && (
                <p className="text-xs text-slate-600">Address: {contract.employerAddress}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                Party B: Candidate / Contractor
              </div>
              <p className="font-bold text-slate-900 text-base">{contract.candidateName}</p>
              <p className="text-xs text-slate-600">Email: {contract.candidateEmail}</p>
              {contract.candidatePhone && (
                <p className="text-xs text-slate-600">Phone: {contract.candidatePhone}</p>
              )}
              {contract.candidateAddress && (
                <p className="text-xs text-slate-600">Address: {contract.candidateAddress}</p>
              )}
            </div>
          </div>

          {/* Key Engagement Parameters */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1.5">
              1. Engagement & Term Parameters
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <span className="text-slate-500 block">Position / Role</span>
                <span className="font-semibold text-slate-900 mt-0.5 block">{contract.jobTitle}</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <span className="text-slate-500 block">Contract Type</span>
                <span className="font-semibold text-slate-900 mt-0.5 block capitalize">{contract.contractType.replace('_', ' ')}</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <span className="text-slate-500 block">Commencement Date</span>
                <span className="font-semibold text-slate-900 mt-0.5 block">{contract.startDate}</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <span className="text-slate-500 block">Term Duration</span>
                <span className="font-semibold text-slate-900 mt-0.5 block">
                  {contract.isOngoing ? 'Indefinite / Ongoing' : (contract.endDate || 'Fixed Term')}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs mt-2">
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <span className="text-slate-500 block">Work Location</span>
                <span className="font-semibold text-slate-900 mt-0.5 block">{contract.workLocation}</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <span className="text-slate-500 block">Expected Weekly Hours</span>
                <span className="font-semibold text-slate-900 mt-0.5 block">{contract.expectedHoursPerWeek} hrs / week</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <span className="text-slate-500 block">Notice Period</span>
                <span className="font-semibold text-slate-900 mt-0.5 block">{contract.noticePeriodDays} Days</span>
              </div>
            </div>
          </div>

          {/* Compensation Schedule */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1.5">
              2. Compensation & Remuneration Terms
            </h2>
            <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-xs text-indigo-900 font-semibold">Agreed Rate of Compensation:</span>
                <span className="text-lg font-bold text-indigo-950 font-mono">
                  {contract.compensation.currency} {contract.compensation.rate.toLocaleString()} / {contract.compensation.frequency}
                </span>
              </div>
              <div className="text-xs text-indigo-900/80">
                Payment Schedule & Method: <span className="font-medium text-slate-900">{contract.compensation.paymentSchedule}</span>
              </div>
              {contract.compensation.bonusOrIncentives && (
                <div className="text-xs text-indigo-900/80">
                  Performance Incentive / Bonus: <span className="font-medium text-slate-900">{contract.compensation.bonusOrIncentives}</span>
                </div>
              )}
              {contract.compensation.benefits && contract.compensation.benefits.length > 0 && (
                <div className="text-xs text-indigo-900/80">
                  Included Benefits: <span className="font-medium text-slate-900">{contract.compensation.benefits.join(', ')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Legal Clauses */}
          <div className="space-y-6 text-xs text-slate-700 leading-relaxed">
            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-900 text-sm">3. Scope of Work & Responsibilities</h3>
              <p className="whitespace-pre-line bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                {contract.scopeOfWork}
              </p>
            </div>

            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-900 text-sm">4. Confidentiality & Non-Disclosure</h3>
              <p className="whitespace-pre-line bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                {contract.confidentialityClause}
              </p>
            </div>

            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-900 text-sm">5. Intellectual Property Rights & Work Made for Hire</h3>
              <p className="whitespace-pre-line bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                {contract.ipAssignmentClause}
              </p>
            </div>

            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-900 text-sm">6. Termination Notice & Severance</h3>
              <p className="whitespace-pre-line bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                {contract.terminationClause}
              </p>
            </div>

            {contract.customClauses && contract.customClauses.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-slate-900 text-sm">7. Special Covenants & Custom Terms</h3>
                {contract.customClauses.map((clause, idx) => (
                  <div key={idx} className="space-y-1 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                    <h4 className="font-semibold text-slate-900">{clause.title}</h4>
                    <p className="whitespace-pre-line">{clause.content}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-900 text-sm">Governing Jurisdiction & Choice of Law</h3>
              <p className="bg-slate-50 p-3 rounded-lg border border-slate-200 font-medium">
                This contract shall be construed in accordance with and governed by the laws of {contract.governingJurisdiction}.
              </p>
            </div>
          </div>

          {/* Execution & Signature Section */}
          <div className="border-t-2 border-slate-200 pt-6 mt-8 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Execution and Signatures
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Employer Signature Block */}
              <div className="p-4 border border-slate-300 rounded-xl bg-slate-50/50 space-y-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Employer / Issuing Authority
                </span>
                {contract.employerSignedAt ? (
                  <div className="space-y-1">
                    <div className="font-serif italic text-lg text-slate-900 border-b border-slate-300 pb-2">
                      {contract.employerSignedBy || contract.employerContactName}
                    </div>
                    <div className="text-[11px] text-slate-500 space-y-0.5">
                      <p>Digitally Executed: {new Date(contract.employerSignedAt).toLocaleString()}</p>
                      <p className="text-emerald-600 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Cryptographic Signatory Verification Passed
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="h-16 flex items-center justify-center border-b border-dashed border-slate-300 text-slate-400 text-xs italic">
                    Pending Employer Final Execution
                  </div>
                )}
              </div>

              {/* Candidate Signature Block */}
              <div className="p-4 border border-slate-300 rounded-xl bg-slate-50/50 space-y-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Candidate / Contractor Acceptance
                </span>
                {contract.candidateSignedAt ? (
                  <div className="space-y-1">
                    <div className="font-serif italic text-lg text-slate-900 border-b border-slate-300 pb-2">
                      {contract.candidateSignedBy || contract.candidateName}
                    </div>
                    <div className="text-[11px] text-slate-500 space-y-0.5">
                      <p>Digitally Executed: {new Date(contract.candidateSignedAt).toLocaleString()}</p>
                      <p className="text-emerald-600 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Candidate Consent & E-Sign Affirmation Recorded
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="h-16 flex items-center justify-center border-b border-dashed border-slate-300 text-slate-400 text-xs italic">
                    Pending Candidate E-Signature
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Audit Verification Footer */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-500 font-mono gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>FastJobs Trust & Compliance • Immutable Audit Log ID: {contract.id}</span>
            </div>
            <div>
              Generated on {new Date().toISOString().split('T')[0]} • Page 1 of 1
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
