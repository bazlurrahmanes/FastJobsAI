import React, { useState } from 'react';
import { Contract } from '../../types';
import { ShieldCheck, CheckCircle2, AlertCircle, FileText, Lock, X } from 'lucide-react';

interface ContractSignModalProps {
  contract: Contract;
  onClose: () => void;
  onConfirmSign: (signatureName: string) => Promise<void>;
  currentUserName: string;
}

export const ContractSignModal: React.FC<ContractSignModalProps> = ({
  contract,
  onClose,
  onConfirmSign,
  currentUserName
}) => {
  const [signatureName, setSignatureName] = useState(currentUserName || contract.candidateName || '');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToElectronicConsent, setAgreedToElectronicConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signatureName.trim()) {
      setError('Please type your legal full name to digitally sign.');
      return;
    }
    if (!agreedToTerms || !agreedToElectronicConsent) {
      setError('You must acknowledge and consent to all contractual clauses before executing.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onConfirmSign(signatureName.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to sign contract. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Digital Contract Execution</h2>
              <p className="text-xs text-slate-400">
                Signing {contract.title} ({contract.contractNumber})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Contract Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs text-slate-700">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2 font-semibold">
              <span className="text-slate-500">Employing Company</span>
              <span className="text-slate-900">{contract.companyName}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="text-slate-500">Agreed Position</span>
              <span className="font-semibold text-slate-900">{contract.jobTitle}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="text-slate-500">Compensation</span>
              <span className="font-bold text-indigo-700">
                {contract.compensation.currency} {contract.compensation.rate.toLocaleString()} / {contract.compensation.frequency}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Start Date</span>
              <span className="font-semibold text-slate-900">{contract.startDate}</span>
            </div>
          </div>

          {/* Signature Input Field */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Legal Full Name (Electronic Signature)
            </label>
            <input
              type="text"
              required
              value={signatureName}
              onChange={(e) => setSignatureName(e.target.value)}
              placeholder="e.g. Alex Chen"
              className="w-full px-4 py-3 bg-white border-2 border-slate-200 focus:border-indigo-600 rounded-xl text-slate-900 font-serif italic text-lg shadow-sm focus:outline-none transition-all placeholder:font-sans placeholder:not-italic placeholder:text-sm"
            />
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <Lock className="w-3 h-3 text-indigo-600" />
              By typing your legal name, you adopt it as your valid binding electronic signature under the ESIGN Act and UETA.
            </p>
          </div>

          {/* Legal Acknowledgement Checkboxes */}
          <div className="space-y-3 pt-2">
            <label className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 mt-0.5"
              />
              <span className="text-xs text-slate-700 leading-relaxed">
                I have thoroughly reviewed the terms, scope of work, compensation schedule, confidentiality obligations, and termination clauses specified in contract <span className="font-semibold">{contract.contractNumber}</span>, and agree to be legally bound.
              </span>
            </label>

            <label className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={agreedToElectronicConsent}
                onChange={(e) => setAgreedToElectronicConsent(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 mt-0.5"
              />
              <span className="text-xs text-slate-700 leading-relaxed">
                I consent to conduct this transaction electronically and understand that an immutable cryptographic audit record will be logged with my IP address and timestamp.
              </span>
            </label>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel & Review
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !agreedToTerms || !agreedToElectronicConsent || !signatureName.trim()}
              id="btn-confirm-sign-contract"
              className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl shadow-sm transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <>Processing Signature...</>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Accept & Digitally Sign Contract
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
