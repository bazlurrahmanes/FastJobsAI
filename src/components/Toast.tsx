import React from 'react';
import { CheckCircle2, X, FileText, ArrowRight, Zap, Info, AlertTriangle } from 'lucide-react';
import { useJobContext } from '../context/JobContext';

export const ToastContainer: React.FC = () => {
  const { toasts, hideToast, setActiveTab } = useJobContext();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto p-4 rounded-2xl bg-[#0a1128]/95 border border-cyan-500/40 shadow-2xl shadow-cyan-950/90 backdrop-blur-xl text-slate-100 flex items-start gap-3.5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
          role="alert"
        >
          {/* Status Icon or Company Logo */}
          <div className="shrink-0 pt-0.5">
            {toast.companyLogo ? (
              <div className="relative">
                <img
                  src={toast.companyLogo}
                  alt={toast.companyName || 'Company'}
                  className="w-10 h-10 rounded-xl object-cover ring-1 ring-cyan-500/40 bg-slate-900"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px] font-bold ring-2 ring-[#0a1128]">
                  ✓
                </span>
              </div>
            ) : toast.type === 'info' ? (
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/40 text-blue-300 flex items-center justify-center">
                <Info className="w-5 h-5" />
              </div>
            ) : toast.type === 'warning' ? (
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            )}
          </div>

          {/* Body Content */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wide text-white uppercase flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
                {toast.title}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {toast.message}
            </p>

            {/* Primary Resume Attachment Chip */}
            {toast.resumeFileName && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-[11px] text-cyan-300 font-medium mt-1">
                <FileText className="w-3 h-3 text-cyan-400" />
                <span className="truncate max-w-[200px]">{toast.resumeFileName}</span>
              </div>
            )}

            {/* Action button */}
            {toast.actionLabel && (
              <div className="pt-1.5">
                <button
                  onClick={() => {
                    if (toast.onAction) {
                      toast.onAction();
                    } else {
                      setActiveTab('my_profile');
                    }
                    hideToast(toast.id);
                  }}
                  className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>{toast.actionLabel}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Dismiss Button */}
          <button
            onClick={() => hideToast(toast.id)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition-colors"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
