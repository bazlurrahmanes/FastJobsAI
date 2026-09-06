import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Lightbulb, 
  GraduationCap, 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Building2, 
  Zap, 
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Award
} from 'lucide-react';
import { useJobContext } from '../context/JobContext';
import { Job } from '../types';

interface AiMatchModalProps {
  job: Job | null;
  onClose: () => void;
  onApply?: () => void;
}

export const AiMatchModal: React.FC<AiMatchModalProps> = ({ job, onClose, onApply }) => {
  const { currentUser, setApplyModalJob, quickApplyToJob, setAuthModalOpen } = useJobContext();
  const [matchData, setMatchData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    if (!job) {
      setMatchData(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    fetch('/api/ai/job-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidateProfile: currentUser,
        job
      })
    })
      .then(res => res.json())
      .then(data => {
        if (isMounted) {
          setMatchData(data);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Match error:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [job, currentUser]);

  if (!job) return null;

  const score = matchData?.matchScore || job.matchScore || 92;

  const getScoreColor = (sc: number) => {
    if (sc >= 85) return 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40';
    if (sc >= 70) return 'text-cyan-400 border-cyan-500/40 bg-cyan-950/40';
    return 'text-amber-400 border-amber-500/40 bg-amber-950/40';
  };

  const handleQuickApply = async () => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }
    setIsApplying(true);
    try {
      await quickApplyToJob(job.id);
      onClose();
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-[#0a1128] border border-cyan-500/30 shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-[#0a1128] to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                FastJobs AI Job Match Analysis
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Feature #1
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Deep compatibility breakdown for <span className="text-cyan-300 font-semibold">{currentUser?.name || 'Your Profile'}</span>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Target Job Mini Banner */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src={job.companyLogo}
                alt={job.company}
                className="w-12 h-12 rounded-xl object-cover ring-1 ring-cyan-500/30 bg-slate-950"
              />
              <div>
                <h4 className="font-bold text-white text-base">{job.title}</h4>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 pt-0.5">
                  <span className="text-cyan-300 font-semibold">{job.company}</span>
                  <span>• {job.location}</span>
                  <span className="text-emerald-400 font-semibold">• ${job.salaryMin ? `${Math.round(job.salaryMin/1000)}k - ${Math.round(job.salaryMax/1000)}k` : 'Competitive'}</span>
                </div>
              </div>
            </div>

            {/* Score Ring */}
            <div className={`px-4 py-2 rounded-2xl border flex items-center gap-3 self-start sm:self-center ${getScoreColor(score)}`}>
              <div className="text-center">
                <div className="text-2xl font-black">{loading ? '...' : `${score}%`}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider">Match Score</div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Sparkles className="w-8 h-8 text-cyan-400 animate-spin" />
              <p className="text-xs">Evaluating candidate skills, experience, and job requirements...</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Main Reasons for the Match */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  Key Match Reasons
                </h4>
                <div className="grid grid-cols-1 gap-2.5">
                  {matchData?.matchReasons?.map((reason: string, idx: number) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-200 flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{reason}</span>
                    </div>
                  )) || (
                    <p className="text-xs text-slate-400">Strong overall alignment with job requirements.</p>
                  )}
                </div>
              </div>

              {/* Skills Overlap & Missing Skills */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Matched Skills */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-emerald-400" />
                      Matched Skills ({matchData?.matchedSkills?.length || 0})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {matchData?.matchedSkills?.map((skill: string, idx: number) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        ✓ {skill}
                      </span>
                    )) || <span className="text-xs text-slate-500">None specified</span>}
                  </div>
                </div>

                {/* Missing / Growth Skills */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                      Skills to Highlight / Learn ({matchData?.missingSkills?.length || 0})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {matchData?.missingSkills?.map((skill: string, idx: number) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        + {skill}
                      </span>
                    )) || <span className="text-xs text-emerald-400">100% skill coverage!</span>}
                  </div>
                </div>

              </div>

              {/* Seniority & Education Alignment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-1.5">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
                    Experience & Seniority Fit
                  </span>
                  <p className="text-slate-400 leading-relaxed">
                    {matchData?.experienceAlignment || 'Seniority level meets core expectations.'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-1.5">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                    Education & Credentials Fit
                  </span>
                  <p className="text-slate-400 leading-relaxed">
                    {matchData?.educationAlignment || 'Academic background and practical experience satisfy prerequisites.'}
                  </p>
                </div>
              </div>

              {/* Interview Strategy Tip */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-cyan-950/60 border border-cyan-500/30 space-y-2">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-cyan-400" />
                  Tactical Interview Recommendation for This Role:
                </span>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {matchData?.interviewTip || 'Emphasize your hands-on achievements in modern distributed architecture and quantifiable latency reductions.'}
                </p>
              </div>

            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Close Breakdown
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleQuickApply}
              disabled={isApplying}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950" />
              <span>{isApplying ? 'Submitting...' : '1-Click Quick Apply'}</span>
            </button>

            <button
              onClick={() => {
                onClose();
                setApplyModalJob(job);
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1"
            >
              <span>Full Application</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
