import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Send, 
  FileText, 
  CheckCircle2, 
  Building2, 
  MapPin, 
  DollarSign, 
  Zap,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Clock,
  Sparkle,
  LogIn,
  Check
} from 'lucide-react';
import { useJobContext } from '../context/JobContext';

export const ApplyJobModal: React.FC = () => {
  const { 
    applyModalJob, 
    setApplyModalJob, 
    currentUser, 
    applyToJob, 
    quickApplyToJob,
    setAuthModalOpen,
    switchDemoUser
  } = useJobContext();

  const [applicantName, setApplicantName] = useState(currentUser?.name || '');
  const [applicantEmail, setApplicantEmail] = useState(currentUser?.email || '');
  const [applicantTitle, setApplicantTitle] = useState(currentUser?.title || '');
  const [selectedResume, setSelectedResume] = useState(currentUser?.resumeFileName || 'Alex_Chen_Resume_AI_Engineer_2026.pdf');
  const [coverLetter, setCoverLetter] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [isAiDrafting, setIsAiDrafting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // AI Application Assistant State
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [aiAssistantData, setAiAssistantData] = useState<any>(null);
  const [loadingAssistant, setLoadingAssistant] = useState(false);

  const fetchAiAssistant = async () => {
    setShowAiAssistant(true);
    if (aiAssistantData) return;
    setLoadingAssistant(true);
    try {
      const res = await fetch('/api/ai/application-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job: applyModalJob,
          candidateProfile: currentUser
        })
      });
      if (res.ok) {
        const d = await res.json();
        setAiAssistantData(d);
        if (d.elevatorPitch && !coverLetter) {
          setCoverLetter(d.elevatorPitch);
        }
      }
    } catch (e) {
      console.error('Error in application assistant:', e);
    } finally {
      setLoadingAssistant(false);
    }
  };

  // Auto-fill from primary resume profile when currentUser or modal changes
  useEffect(() => {
    if (currentUser) {
      setApplicantName(currentUser.name);
      setApplicantEmail(currentUser.email);
      setApplicantTitle(currentUser.title || 'Software Professional');
      setSelectedResume(currentUser.resumeFileName || 'Alex_Chen_Resume_AI_Engineer_2026.pdf');
    }
  }, [currentUser, applyModalJob]);

  if (!applyModalJob) return null;

  const handleGenerateCoverLetter = async () => {
    setIsAiDrafting(true);
    try {
      const res = await fetch('/api/ai/generate-cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job: applyModalJob,
          candidateProfile: currentUser,
          customNotes
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.coverLetter) {
          setCoverLetter(data.coverLetter);
        }
      }
    } catch (e) {
      console.error('Error drafting cover letter:', e);
    } finally {
      setIsAiDrafting(false);
    }
  };

  const handleQuickApplyNow = async () => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }
    setIsSubmitting(true);
    await quickApplyToJob(applyModalJob.id);
    setIsSubmitting(false);
    setSubmittedSuccess(true);
    setTimeout(() => {
      setSubmittedSuccess(false);
      setApplyModalJob(null);
    }, 1800);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    await applyToJob(applyModalJob.id, coverLetter, selectedResume);
    setIsSubmitting(false);
    setSubmittedSuccess(true);
    setTimeout(() => {
      setSubmittedSuccess(false);
      setApplyModalJob(null);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-xl rounded-3xl bg-[#0a1128] border border-cyan-500/30 p-6 sm:p-8 shadow-2xl shadow-cyan-950/80 text-slate-100 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        
        {/* Close button */}
        <button
          onClick={() => setApplyModalJob(null)}
          className="absolute top-5 right-5 p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {submittedSuccess ? (
          <div className="text-center py-10 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-white">Application Submitted!</h3>
            <p className="text-sm text-slate-300 max-w-md mx-auto">
              Your primary resume <strong className="text-cyan-300">({selectedResume})</strong> and verified candidate profile have been sent directly to the hiring managers at <strong className="text-cyan-300">{applyModalJob.company}</strong>.
            </p>
            <span className="text-xs text-slate-500 block">Check notification toast or your Profile dashboard for updates.</span>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Target Job Summary */}
            <div className="flex items-start gap-4 pb-4 border-b border-slate-800">
              <img
                src={applyModalJob.companyLogo}
                alt={applyModalJob.company}
                className="w-14 h-14 rounded-2xl object-cover ring-1 ring-cyan-500/30 bg-slate-900 shrink-0 shadow-md"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">{applyModalJob.company}</span>
                <h3 className="text-lg sm:text-xl font-extrabold text-white leading-tight">{applyModalJob.title}</h3>
                <div className="flex items-center gap-3 text-xs text-slate-400 pt-1">
                  <span>{applyModalJob.location}</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-semibold">
                    ${Math.round(applyModalJob.salaryMin/1000)}k - ${Math.round(applyModalJob.salaryMax/1000)}k/yr
                  </span>
                  <span>•</span>
                  <span className="text-cyan-300 font-medium">{applyModalJob.jobType}</span>
                </div>
              </div>
            </div>

            {/* If Not Logged In, Prompt Quick Login */}
            {!currentUser ? (
              <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-cyan-950/60 border border-cyan-500/30 space-y-3 text-center">
                <Zap className="w-8 h-8 text-cyan-400 mx-auto" />
                <h4 className="font-bold text-white text-base">Sign In to Enable 1-Click Quick Apply</h4>
                <p className="text-xs text-slate-300 max-w-sm mx-auto">
                  Log in to automatically fill this application with your primary verified resume profile.
                </p>
                <div className="flex justify-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => switchDemoUser('job_seeker')}
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    ⚡ Quick Demo Login (Alex Chen)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 hover:text-white font-semibold text-xs border border-slate-700"
                  >
                    Custom Sign In
                  </button>
                </div>
              </div>
            ) : (
              /* Quick Apply Primary Resume Banner */
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-cyan-950/50 via-slate-900/90 to-blue-950/40 border border-cyan-500/40 space-y-3.5 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400" />
                    </span>
                    <div>
                      <h4 className="text-sm font-extrabold text-white">Quick Apply Enabled</h4>
                      <p className="text-[11px] text-slate-400">Auto-filled with your primary resume profile</p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Primary Profile
                  </span>
                </div>

                {/* Candidate snapshot details */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-10 h-10 rounded-xl object-cover ring-1 ring-cyan-400 shadow-sm shrink-0"
                    />
                    <div>
                      <p className="text-xs font-bold text-white">{currentUser.name}</p>
                      <p className="text-[11px] text-cyan-300">{currentUser.title || 'Applicant'}</p>
                      <p className="text-[10px] text-slate-400">{currentUser.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-xs text-cyan-300">
                    <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div className="overflow-hidden">
                      <span className="font-semibold block truncate max-w-[140px]">{selectedResume}</span>
                      <span className="text-[10px] text-slate-400 block">Primary Resume</span>
                    </div>
                  </div>
                </div>

                {/* 1-Click Quick Submit Button */}
                <button
                  type="button"
                  onClick={handleQuickApplyNow}
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-sm shadow-xl shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Zap className="w-4 h-4 text-slate-950 fill-slate-950" />
                  <span>{isSubmitting ? 'Submitting Quick Application...' : '⚡ Quick Apply Now (1-Click Instant)'}</span>
                </button>
              </div>
            )}

            {/* Optional Customization Form */}
            <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Or Customize Application Details
                </span>
                <span className="text-[11px] text-slate-500">Auto-filled</span>
              </div>

              {/* Form Input fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:border-cyan-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={applicantEmail}
                    onChange={(e) => setApplicantEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:border-cyan-400 outline-none"
                  />
                </div>
              </div>

              {/* Cover Letter Section with AI */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Cover Letter / Notes (Optional)
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={fetchAiAssistant}
                      className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>{showAiAssistant ? 'Hide AI Assistant' : '✨ AI Application Assistant'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerateCoverLetter}
                      disabled={isAiDrafting}
                      className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${isAiDrafting ? 'animate-spin' : ''}`} />
                      <span>{isAiDrafting ? 'Drafting...' : '✨ Full Cover Letter'}</span>
                    </button>
                  </div>
                </div>

                {/* AI Assistant Drawer */}
                {showAiAssistant && (
                  <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-cyan-400" />
                        AI Application Intelligence
                      </span>
                      {loadingAssistant && <span className="text-[11px] text-cyan-400 animate-pulse">Analyzing...</span>}
                    </div>

                    {aiAssistantData ? (
                      <div className="space-y-3 text-xs">
                        {aiAssistantData.elevatorPitch && (
                          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">30-Second Elevator Pitch</span>
                            <p className="text-slate-200 mt-1 text-[11px] leading-relaxed">{aiAssistantData.elevatorPitch}</p>
                            <button
                              type="button"
                              onClick={() => setCoverLetter(aiAssistantData.elevatorPitch)}
                              className="mt-2 text-[10px] font-bold text-cyan-400 hover:underline flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" /> Use this as my letter
                            </button>
                          </div>
                        )}

                        {aiAssistantData.screeningQuestions && (
                          <div className="space-y-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Common Screening Questions & Tailored Answers</span>
                            {aiAssistantData.screeningQuestions.slice(0, 2).map((q: any, i: number) => (
                              <div key={i} className="p-2 rounded-xl bg-slate-900/70 border border-slate-800 text-[11px]">
                                <strong className="text-white block">Q: {q.question}</strong>
                                <span className="text-slate-300 mt-1 block">A: {q.suggestedAnswer}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">Loading custom applicant pitch and answers...</p>
                    )}
                  </div>
                )}

                <textarea
                  rows={4}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Share a brief introduction or let AI draft a personalized pitch based on your primary profile..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-400 outline-none leading-relaxed"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setApplyModalJob(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold hover:text-white transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-cyan-500/30 text-cyan-300 hover:text-white font-bold text-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Customized Application</span>
                </button>
              </div>

            </form>

          </div>
        )}

      </div>
    </div>
  );
};

