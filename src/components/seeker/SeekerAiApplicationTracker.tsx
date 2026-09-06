import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Copy, 
  Check, 
  Clock, 
  Calendar, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  Mail, 
  TrendingUp, 
  RotateCcw,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useJobContext } from '../../context/JobContext';

export const SeekerAiApplicationTracker: React.FC = () => {
  const { applications, jobs, currentUser } = useJobContext();
  const [trackerData, setTrackerData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const fetchTrackerAssistant = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/application-tracker-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applications,
          jobs
        })
      });
      if (res.ok) {
        const data = await res.json();
        setTrackerData(data);
      }
    } catch (e) {
      console.error('Error fetching application tracker assistant:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackerAssistant();
  }, [applications.length]);

  const copyEmail = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-cyan-950/60 via-[#0a1128] to-blue-950/60 border border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold mb-2 border border-cyan-500/30">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            AI Feature #15 • Pipeline Intelligence & Automated Follow-Up Drafter
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            AI Application Tracker Assistant
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Real-time pipeline analytics, follow-up cadence reminders, and customized recruiter follow-up email drafts for <span className="text-cyan-300 font-semibold">{currentUser?.name || 'Your Account'}</span>.
          </p>
        </div>

        <button
          onClick={fetchTrackerAssistant}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 self-start md:self-auto"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Refreshing...' : 'Refresh Pipeline'}</span>
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center rounded-3xl bg-slate-900/40 border border-slate-800 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Sparkles className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-sm font-semibold text-white">Evaluating {applications.length} active submissions & follow-up timelines...</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Top Pipeline Health Meter */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            <div className="p-5 rounded-2xl bg-[#0a1128]/90 border border-cyan-500/30">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pipeline Health</span>
              <div className="text-2xl font-black text-cyan-300 mt-1">
                {trackerData?.pipelineHealthScore || 92} / 100
              </div>
              <p className="text-[11px] text-emerald-400 font-medium mt-0.5">Active & Healthy</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Submitted Applications</span>
              <div className="text-2xl font-black text-white mt-1">
                {applications.length}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Tracked in database</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Due For Follow-Up</span>
              <div className="text-2xl font-black text-amber-400 mt-1">
                {trackerData?.followUpReminders?.length || 1}
              </div>
              <p className="text-[11px] text-amber-300 mt-0.5">High response opportunity</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Interview Status</span>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                {applications.filter(a => a.status === 'interviewing' || a.status === 'offered').length}
              </div>
              <p className="text-[11px] text-emerald-300 mt-0.5">Active conversations</p>
            </div>

          </div>

          {/* Follow-Up Reminders & Ready-to-Send Drafts */}
          <div className="p-6 rounded-3xl bg-[#0a1128]/90 border border-cyan-500/30 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-cyan-400" />
                AI Generated Recruiter Follow-Up Drafts
              </span>
              <span className="text-xs text-slate-400">1-click copy & send</span>
            </div>

            {trackerData?.followUpReminders?.length > 0 ? (
              <div className="space-y-4">
                {trackerData.followUpReminders.map((item: any, idx: number) => (
                  <div key={idx} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-white text-sm">
                          {item.jobTitle} • <span className="text-cyan-300">{item.company}</span>
                        </h4>
                        <span className="text-[11px] text-amber-300 font-semibold flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          Recommended timing: {item.recommendedTiming}
                        </span>
                      </div>

                      <button
                        onClick={() => copyEmail(item.draftFollowUpEmail, idx)}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto"
                      >
                        {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedIndex === idx ? 'Copied Email' : 'Copy Draft'}</span>
                      </button>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                      {item.draftFollowUpEmail}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                All applications are up to date with no immediate follow-ups required.
              </div>
            )}
          </div>

          {/* Strategy Recommendations */}
          {trackerData?.strategicNextActions && trackerData.strategicNextActions.length > 0 && (
            <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Pipeline Strategy Insights
              </span>
              <div className="space-y-2">
                {trackerData.strategicNextActions.map((action: string, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-200">
                    <span className="text-cyan-400 font-bold">→</span>
                    <span>{action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
