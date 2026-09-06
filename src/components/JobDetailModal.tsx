import React, { useState, useEffect } from 'react';
import { 
  X, 
  Building2, 
  MapPin, 
  DollarSign, 
  Briefcase, 
  Clock, 
  Bookmark, 
  CheckCircle2, 
  Sparkles, 
  Send, 
  Globe, 
  Users, 
  Flame, 
  Share2, 
  Check, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Lightbulb,
  BookOpen,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { useJobContext } from '../context/JobContext';
import { Job } from '../types';
import { AiMatchModal } from './AiMatchModal';
import { AiScamCheckModal } from './AiScamCheckModal';
import { AiJobExplainerModal } from './AiJobExplainerModal';
import { ResumeParserJobComparisonModal } from './seeker/ResumeParserJobComparisonModal';

export const JobDetailModal: React.FC = () => {
  const { 
    selectedJob, 
    setSelectedJob, 
    setApplyModalJob, 
    quickApplyToJob,
    setAuthModalOpen,
    toggleSaveJob, 
    isJobSaved,
    hasAppliedToJob,
    currentUser,
    calculateMatchScore,
    openChatWithPrompt
  } = useJobContext();

  const [aiMatchData, setAiMatchData] = useState<{
    score: number;
    matchedSkills: string[];
    growthAreas: string[];
    insights: string[];
    interviewTip: string;
  } | null>(null);

  const [loadingAi, setLoadingAi] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // Submodal toggles
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showResumeCompareModal, setShowResumeCompareModal] = useState(false);
  const [showScamModal, setShowScamModal] = useState(false);
  const [showExplainerModal, setShowExplainerModal] = useState(false);
  const [explainerDefaultTab, setExplainerDefaultTab] = useState<'explainer' | 'salary'>('explainer');

  const handleQuickApply = async () => {
    if (!selectedJob) return;
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }
    setIsApplying(true);
    try {
      await quickApplyToJob(selectedJob.id);
    } finally {
      setIsApplying(false);
    }
  };

  useEffect(() => {
    if (!selectedJob) {
      setAiMatchData(null);
      return;
    }

    let isMounted = true;
    setLoadingAi(true);

    calculateMatchScore(selectedJob).then((res) => {
      if (isMounted) {
        setAiMatchData(res);
        setLoadingAi(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedJob]);

  if (!selectedJob) return null;

  const saved = isJobSaved(selectedJob.id);
  const applied = hasAppliedToJob(selectedJob.id);

  const formatSalary = (job: Job) => {
    if (job.salaryPeriod === 'hour') {
      return `$${job.salaryMin} - $${job.salaryMax}/hr`;
    }
    const minK = Math.round(job.salaryMin / 1000);
    const maxK = Math.round(job.salaryMax / 1000);
    return `$${minK}k - $${maxK}k / year`;
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-[#0a1128] border border-cyan-500/30 shadow-2xl shadow-cyan-950/80 overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Top Header Bar */}
        <div className="relative p-6 sm:p-8 bg-gradient-to-r from-slate-900/90 via-[#0a1128] to-slate-900/90 border-b border-slate-800 flex items-start justify-between gap-4">
          
          <div className="flex items-start gap-4">
            <img
              src={selectedJob.companyLogo}
              alt={selectedJob.company}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-cyan-500/30 bg-slate-900 shrink-0"
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-cyan-400 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" />
                  {selectedJob.company}
                </span>

                {selectedJob.featured && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-400" />
                    Featured
                  </span>
                )}

                {selectedJob.isRemote && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    Remote
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
                {selectedJob.title}
              </h2>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 pt-1">
                <span className="flex items-center gap-1 text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {selectedJob.location}
                </span>
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <DollarSign className="w-3.5 h-3.5" />
                  {formatSalary(selectedJob)}
                </span>
                <span className="flex items-center gap-1 text-slate-400">
                  <Briefcase className="w-3.5 h-3.5" />
                  {selectedJob.jobType}
                </span>
                <span className="text-slate-400">
                  • {selectedJob.experienceLevel}
                </span>
              </div>
            </div>
          </div>

          {/* Close & Share Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title="Share job link"
            >
              {copiedLink ? <Check className="w-5 h-5 text-emerald-400" /> : <Share2 className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setSelectedJob(null)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8">
          
          {/* AI Compatibility Analysis Widget */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-slate-900/60 to-blue-950/40 border border-cyan-500/30 shadow-lg relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cyan-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/30">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                    FastJobs AI Match Intelligence
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-400/20 text-cyan-300 border border-cyan-400/40">
                      Live
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    Calculated for <span className="font-semibold text-white">{currentUser?.name || 'Your Profile'}</span>
                  </p>
                </div>
              </div>

              {/* Match Score Meter */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-2xl font-black text-cyan-300">
                    {loadingAi ? '...' : `${aiMatchData?.score || selectedJob.matchScore || 94}%`}
                  </div>
                  <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                    Profile Compatibility
                  </div>
                </div>
              </div>
            </div>

            {/* AI Insights & Strengths */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  Key Matching Strengths:
                </span>
                <ul className="space-y-1 text-slate-300 pl-5 list-disc">
                  {aiMatchData?.insights?.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  )) || (
                    <>
                      <li>Strong technical alignment with modern React & TypeScript ecosystem.</li>
                      <li>Proven background in distributed systems and latency optimizations.</li>
                    </>
                  )}
                </ul>
              </div>

              <div className="space-y-2">
                <span className="font-semibold text-blue-300 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-blue-400" />
                  Interview Strategy Tip:
                </span>
                <p className="text-slate-300 leading-relaxed bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  {aiMatchData?.interviewTip || 'Emphasize your direct architectural achievements and quantitative business impact.'}
                </p>
              </div>
            </div>

            {/* FastJobs AI Feature Tools Bar */}
            <div className="mt-4 pt-3 border-t border-cyan-500/20 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              <button
                onClick={() => setShowResumeCompareModal(true)}
                className="p-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Missing Skills Audit</span>
              </button>

              <button
                onClick={() => setShowMatchModal(true)}
                className="p-2 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Match Breakdown</span>
              </button>

              <button
                onClick={() => {
                  setExplainerDefaultTab('explainer');
                  setShowExplainerModal(true);
                }}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                <span>Job Explainer</span>
              </button>

              <button
                onClick={() => {
                  setExplainerDefaultTab('salary');
                  setShowExplainerModal(true);
                }}
                className="p-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>Salary Insights</span>
              </button>

              <button
                onClick={() => setShowScamModal(true)}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer col-span-2 sm:col-span-1"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Scam & Safety</span>
              </button>
            </div>

            {/* Quick Gemini AI Copilot Trigger */}
            <div className="mt-3 pt-2.5 border-t border-cyan-500/10 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-cyan-300/80 flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Ask questions or strategize application:
              </span>
              <button
                onClick={() => openChatWithPrompt(`I am considering applying for ${selectedJob.title} at ${selectedJob.company}. Can you evaluate how to position my background, prepare for potential interview questions, and tailor my application?`)}
                className="px-3 py-1 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>Ask Gemini Copilot</span>
              </button>
            </div>

          </div>

          {/* Required Skills Chips */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Required Technical Stack & Competencies
            </h4>
            <div className="flex flex-wrap gap-2">
              {selectedJob.skills.map(skill => (
                <span
                  key={skill}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-800 text-cyan-300 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Job Overview / Description */}
          <div className="space-y-4 text-slate-200 leading-relaxed text-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Role Overview & Mission
            </h4>
            <div className="prose prose-invert max-w-none text-slate-300 whitespace-pre-line text-sm leading-relaxed">
              {selectedJob.description}
            </div>
          </div>

          {/* Key Requirements */}
          {selectedJob.requirements && selectedJob.requirements.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Core Qualifications & Requirements
              </h4>
              <ul className="space-y-2 text-sm text-slate-300">
                {selectedJob.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Benefits & Perks */}
          {selectedJob.benefits && selectedJob.benefits.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Compensation, Benefits & Culture
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {selectedJob.benefits.map((benefit, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-2.5 text-xs text-slate-200">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Action Bar */}
        <div className="p-4 sm:p-6 bg-slate-900/95 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => toggleSaveJob(selectedJob.id)}
              className={`px-4 py-3 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                saved
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${saved ? 'fill-cyan-400 text-cyan-400' : ''}`} />
              <span>{saved ? 'Saved' : 'Save Job'}</span>
            </button>

            {currentUser && currentUser.role === 'job_seeker' && (
              <div className="hidden md:flex flex-col text-[11px] text-slate-400 leading-tight">
                <span className="font-semibold text-slate-200 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-cyan-400 fill-cyan-400" />
                  Quick Apply Profile: {currentUser.name}
                </span>
                <span className="text-slate-400 truncate max-w-[220px]">
                  {currentUser.resumeFileName || 'Primary Resume (PDF)'}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5 justify-end">
            {applied ? (
              <div className="px-6 py-3 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 font-bold text-sm flex items-center gap-2">
                <Check className="w-4 h-4" />
                Application Submitted
              </div>
            ) : (
              <>
                <button
                  onClick={() => {
                    setApplyModalJob(selectedJob);
                  }}
                  className="px-4 sm:px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer"
                  title="Customize cover letter or upload bespoke resume"
                >
                  <span>Customize Letter</span>
                </button>

                <button
                  id="modal-quick-apply-btn"
                  disabled={isApplying}
                  onClick={handleQuickApply}
                  className="px-6 sm:px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 disabled:opacity-75 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-cyan-500/30 transition-all flex items-center gap-2 cursor-pointer active:scale-98"
                  title={currentUser ? `1-Click Quick Apply with ${currentUser.name}'s profile` : 'Sign in to 1-Click Quick Apply'}
                >
                  {isApplying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-slate-950 fill-slate-950" />
                      <span>1-Click Quick Apply</span>
                      <ArrowRight className="w-4 h-4 text-slate-950" />
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

      </div>

      {/* Submodal Renders */}
      {showResumeCompareModal && (
        <ResumeParserJobComparisonModal
          job={selectedJob}
          isOpen={showResumeCompareModal}
          onClose={() => setShowResumeCompareModal(false)}
        />
      )}

      {showMatchModal && (
        <AiMatchModal
          job={selectedJob}
          onClose={() => setShowMatchModal(false)}
        />
      )}

      {showScamModal && (
        <AiScamCheckModal
          job={selectedJob}
          onClose={() => setShowScamModal(false)}
        />
      )}

      {showExplainerModal && (
        <AiJobExplainerModal
          job={selectedJob}
          defaultTab={explainerDefaultTab}
          onClose={() => setShowExplainerModal(false)}
        />
      )}

    </div>
  );
};
