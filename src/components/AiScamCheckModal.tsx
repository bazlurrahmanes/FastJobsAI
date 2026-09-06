import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Info, 
  ExternalLink, 
  Sparkles,
  Building2
} from 'lucide-react';
import { Job } from '../types';

interface AiScamCheckModalProps {
  job: Job | null;
  onClose: () => void;
}

export const AiScamCheckModal: React.FC<AiScamCheckModalProps> = ({ job, onClose }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!job) {
      setData(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    fetch('/api/ai/scam-checker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job })
    })
      .then(res => res.json())
      .then(resData => {
        if (isMounted) {
          setData(resData);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Scam check error:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [job]);

  if (!job) return null;

  const isSafe = data?.riskScore < 30;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-[#0a1128] border border-cyan-500/30 shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-[#0a1128] to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
              isSafe ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
            }`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                FastJobs AI Scam & Fraud Checker
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Feature #16
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Automated heuristic safety & fraud signal audit
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Target Job Header */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-white text-sm sm:text-base">{job.title}</h4>
              <p className="text-xs text-cyan-300 font-medium">{job.company} • {job.location}</p>
            </div>

            <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold shrink-0 ${
              isSafe ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
            }`}>
              {loading ? 'Checking...' : data?.riskLevel || 'Verified Safe'}
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Sparkles className="w-8 h-8 text-cyan-400 animate-spin" />
              <p className="text-xs">Analyzing compensation realism, contact legitimacy, and fraud vectors...</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Suspicious Flags (if any) */}
              {data?.suspiciousFlags && data.suspiciousFlags.length > 0 && (
                <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 space-y-2">
                  <span className="text-xs font-bold text-red-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    Cautionary Signals Detected:
                  </span>
                  <ul className="space-y-1 text-xs text-red-200 pl-5 list-disc">
                    {data.suspiciousFlags.map((flag: string, idx: number) => (
                      <li key={idx}>{flag}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Safety Signals Checklist */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                  Verification Criteria Audit
                </h4>
                <div className="space-y-2">
                  {data?.safetySignals?.map((sig: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
                      {sig.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="text-xs font-semibold text-slate-200">{sig.signal}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{sig.details}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Safe Application Best Practices */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-cyan-400" />
                  Candidate Safety Checklist:
                </span>
                <ul className="space-y-1 text-xs text-slate-400 pl-5 list-disc">
                  {data?.verificationChecklist?.map((tip: string, idx: number) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>

              {/* Disclaimer */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-500 leading-relaxed">
                <strong className="text-slate-400">Notice:</strong> {data?.disclaimer || 'FastJobs AI Scam Checker provides an automated heuristic risk assessment and is not a definitive legal determination. Always protect your personal and financial credentials.'}
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
