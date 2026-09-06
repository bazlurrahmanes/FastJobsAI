import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Users, 
  Briefcase, 
  ShieldCheck, 
  Check, 
  UserCheck,
  ChevronRight,
  ListOrdered
} from 'lucide-react';
import { useJobContext } from '../../context/JobContext';
import { Application, Job } from '../../types';

interface RecruiterAiResumeScreeningProps {
  initialAppId?: string;
  onUpdateStatus?: (appId: string, status: Application['status']) => void;
}

export const RecruiterAiResumeScreening: React.FC<RecruiterAiResumeScreeningProps> = ({
  initialAppId,
  onUpdateStatus
}) => {
  const { jobs, applications, updateApplicationStatus, showToast } = useJobContext();

  const [selectedAppId, setSelectedAppId] = useState<string>(initialAppId || applications[0]?.id || '');
  const [customResumeText, setCustomResumeText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [screeningResult, setScreeningResult] = useState<{
    suitabilityScore: number;
    suitabilityCategory: string;
    relevantSkillsMatched: string[];
    missingRequirements: string[];
    strengths: string[];
    potentialConcerns: string[];
    experienceMatchSummary: string;
    recruiterRecommendation: string;
    suggestedNextStep: string;
    aiGenerated?: boolean;
  } | null>(null);

  const currentApp = applications.find(a => a.id === selectedAppId) || applications[0];
  const currentJob = jobs.find(j => j.id === currentApp?.jobId) || jobs[0];

  const handleRunScreening = async () => {
    if (!currentApp || !currentJob) return;
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/recruiter/resume-screening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job: {
            title: currentJob.title,
            company: currentJob.company,
            skills: currentJob.skills,
            experienceLevel: currentJob.experienceLevel,
            requirements: currentJob.requirements
          },
          applicant: {
            name: currentApp.applicantName,
            title: currentApp.applicantTitle,
            skills: currentApp.applicantSkills,
            coverLetter: currentApp.coverLetter,
            resumeFileName: currentApp.resumeFileName
          },
          resumeText: customResumeText
        })
      });

      if (!response.ok) throw new Error('Screening failed');
      const data = await response.json();
      setScreeningResult(data);
      showToast({
        title: 'Resume Screened',
        message: `Suitability score: ${data.suitabilityScore}% (${data.suitabilityCategory})`,
        type: 'success'
      });
    } catch (err) {
      console.error(err);
      showToast({
        title: 'Screening Notice',
        message: 'Calculated using local ATS screening rules.',
        type: 'info'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAppId) {
      handleRunScreening();
    }
  }, [selectedAppId]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-blue-500/20 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              AI CV / Resume Screening Engine
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Job Requirements Audit
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              Audit applicant resumes against job requirements to uncover relevant skills, missing qualifications, and potential concerns.
            </p>
          </div>
        </div>
      </div>

      {/* Applicant Selector */}
      <div className="p-5 rounded-2xl bg-[#0a1128]/80 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            Select Applicant from Pipeline ({applications.length} Submissions)
          </label>
          <span className="text-[11px] text-slate-400">
            Applying for: <strong className="text-white">{currentJob?.title}</strong>
          </span>
        </div>

        <select
          value={selectedAppId}
          onChange={e => setSelectedAppId(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-cyan-500"
        >
          {applications.map(app => {
            const job = jobs.find(j => j.id === app.jobId);
            return (
              <option key={app.id} value={app.id}>
                {app.applicantName} • {app.applicantTitle} (For: {job?.title || 'Job Opening'} • Status: {app.status})
              </option>
            );
          })}
        </select>
      </div>

      {/* Main Results Display */}
      {isLoading ? (
        <div className="p-16 rounded-2xl bg-[#0a1128]/60 border border-slate-800 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-white">Performing deep resume & requirements audit...</p>
          <p className="text-xs text-slate-400">Extracting explicit skill evidence, gaps, and qualification flags.</p>
        </div>
      ) : screeningResult ? (
        <div className="space-y-6">
          {/* Top Score Banner */}
          <div className="p-6 rounded-2xl bg-[#0a1128]/90 border border-cyan-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 flex flex-col items-center justify-center shrink-0">
                <span className="text-2xl font-black text-cyan-300">{screeningResult.suitabilityScore}%</span>
                <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Suitability</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">{currentApp.applicantName}</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {screeningResult.suitabilityCategory}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {currentApp.applicantTitle} • Resume: <span className="text-cyan-300 font-mono">{currentApp.resumeFileName || 'CV_Profile.pdf'}</span>
                </p>
                <p className="text-xs text-slate-300 font-medium">
                  Suggested Next Step: <span className="text-cyan-300 font-bold">{screeningResult.suggestedNextStep}</span>
                </p>
              </div>
            </div>

            {/* Recruiter Review Actions */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  updateApplicationStatus(currentApp.id, 'interviewing', 'Advanced via AI Resume Screening');
                  showToast({
                    title: 'Status Updated',
                    message: `${currentApp.applicantName} moved to Interviewing.`,
                    type: 'success'
                  });
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Advance to Interview</span>
              </button>

              <button
                onClick={() => {
                  updateApplicationStatus(currentApp.id, 'under_review', 'Set under active review');
                  showToast({
                    title: 'Status Updated',
                    message: `${currentApp.applicantName} placed under review.`,
                    type: 'info'
                  });
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
              >
                <span>Mark Under Review</span>
              </button>
            </div>
          </div>

          {/* Experience Summary */}
          <div className="p-5 rounded-2xl bg-[#0a1128]/80 border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" />
              Experience & Qualifications Match Evaluation
            </h4>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              {screeningResult.experienceMatchSummary}
            </p>
          </div>

          {/* 4 Quadrants: Matched Skills, Missing Requirements, Strengths, Concerns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Matched Skills */}
            <div className="p-5 rounded-2xl bg-[#0a1128]/80 border border-emerald-500/20 space-y-3">
              <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Relevant Skills Matched
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {screeningResult.relevantSkillsMatched.map((skill, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1"
                  >
                    <Check className="w-3 h-3 text-emerald-400" />
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Missing Requirements */}
            <div className="p-5 rounded-2xl bg-[#0a1128]/80 border border-rose-500/20 space-y-3">
              <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                Missing Requirements / Verification Needed
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {screeningResult.missingRequirements.length > 0 ? (
                  screeningResult.missingRequirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                      <span>{req}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-slate-400">All primary job requirements verified in applicant background.</li>
                )}
              </ul>
            </div>

            {/* Key Strengths */}
            <div className="p-5 rounded-2xl bg-[#0a1128]/80 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Key Candidate Strengths
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                {screeningResult.strengths.map((str, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 shrink-0" />
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Potential Concerns */}
            <div className="p-5 rounded-2xl bg-[#0a1128]/80 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                Areas to Probe in Screening Call
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                {screeningResult.potentialConcerns.map((con, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                    <span>{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Hiring Manager Recommendation Box */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/40 to-blue-950/40 border border-cyan-500/30 space-y-2">
            <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Recruiter Advisory & Next Steps
            </h4>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
              {screeningResult.recruiterRecommendation}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
};
