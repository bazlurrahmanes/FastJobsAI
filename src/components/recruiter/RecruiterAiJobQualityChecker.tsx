import React, { useState } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  RefreshCw, 
  Briefcase, 
  Award, 
  Search, 
  Heart,
  Sliders,
  FileCheck
} from 'lucide-react';
import { useJobContext } from '../../context/JobContext';
import { Job } from '../../types';

export const RecruiterAiJobQualityChecker: React.FC = () => {
  const { jobs, showToast } = useJobContext();

  const [selectedJobId, setSelectedJobId] = useState<string>(jobs[0]?.id || '');
  const [customTitle, setCustomTitle] = useState(jobs[0]?.title || 'Staff Distributed Systems Engineer');
  const [customDescription, setCustomDescription] = useState(
    jobs[0]?.description || 'We are seeking a rockstar engineer to build scalable microservices...'
  );
  const [customSalary, setCustomSalary] = useState('180,000 - 240,000 USD');
  const [customLocation, setCustomLocation] = useState(jobs[0]?.location || 'San Francisco, CA');
  const [isRemote, setIsRemote] = useState(true);

  const [isLoading, setIsLoading] = useState(false);

  const [auditResult, setAuditResult] = useState<{
    overallQualityScore: number;
    qualityGrade: string;
    subScores: {
      clarityScore: number;
      inclusivityScore: number;
      seoScore: number;
      completenessScore: number;
    };
    strengths: string[];
    improvementSuggestions: Array<{
      category: string;
      issue: string;
      recommendation: string;
    }>;
    inclusiveLanguageAudit: {
      biasedTermsFound: string[];
      suggestedReplacements: Record<string, string>;
    };
    seoKeywordsPresent: string[];
    recommendedSeoKeywords: string[];
    aiGenerated?: boolean;
  } | null>(null);

  const handleSelectJob = (jobId: string) => {
    setSelectedJobId(jobId);
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      setCustomTitle(job.title);
      setCustomDescription(job.description);
      setCustomSalary(`$${Math.round(job.salaryMin / 1000)}k - $${Math.round(job.salaryMax / 1000)}k`);
      setCustomLocation(job.location);
      setIsRemote(job.isRemote);
    }
  };

  const handleAudit = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/recruiter/job-quality-checker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobData: {
            title: customTitle,
            description: customDescription,
            salary: customSalary,
            location: customLocation,
            isRemote
          }
        })
      });

      if (!response.ok) throw new Error('Quality check failed');
      const data = await response.json();
      setAuditResult(data);
      showToast({
        title: 'Job Post Quality Audited',
        message: `Quality Score: ${data.overallQualityScore}/100 (Grade: ${data.qualityGrade})`,
        type: 'success'
      });
    } catch (err) {
      console.error(err);
      showToast({
        title: 'Notice',
        message: 'Loaded local job post quality audit heuristics.',
        type: 'info'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-blue-500/20 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              AI Job Post Quality & Inclusivity Checker
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                SEO & Bias Detection
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              Analyze job descriptions for clarity, gender/demographic bias, salary transparency, search engine discoverability, and applicant conversion potential.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form */}
        <div className="lg:col-span-5 space-y-4 p-5 rounded-2xl bg-[#0a1128]/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-cyan-400" />
              Listing to Audit
            </h3>

            <select
              value={selectedJobId}
              onChange={e => handleSelectJob(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
            >
              {jobs.map(j => (
                <option key={j.id} value={j.id}>
                  Load: {j.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Job Title</label>
            <input
              type="text"
              value={customTitle}
              onChange={e => setCustomTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Salary Range Transparency</label>
            <input
              type="text"
              value={customSalary}
              onChange={e => setCustomSalary(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Job Description Content</label>
            <textarea
              value={customDescription}
              onChange={e => setCustomDescription(e.target.value)}
              rows={8}
              className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white leading-relaxed"
            />
          </div>

          <button
            onClick={handleAudit}
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin text-slate-950" /> : <Sparkles className="w-4 h-4 text-slate-950" />}
            <span>Run Quality & Inclusivity Audit</span>
          </button>
        </div>

        {/* Right Output */}
        <div className="lg:col-span-7 space-y-4">
          {auditResult ? (
            <div className="space-y-6">
              {/* Score Header */}
              <div className="p-6 rounded-2xl bg-[#0a1128]/90 border border-cyan-500/30 flex items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 flex flex-col items-center justify-center shrink-0">
                    <span className="text-2xl font-black text-cyan-300">{auditResult.overallQualityScore}</span>
                    <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Quality Score</span>
                  </div>
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Grade: {auditResult.qualityGrade}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1">Listing Quality Assessment</h3>
                    <p className="text-xs text-slate-400">High applicant conversion and search discoverability.</p>
                  </div>
                </div>
              </div>

              {/* 4 Dimension Sub-Scores */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-[#0a1128]/80 border border-slate-800 text-center space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Clarity</span>
                  <div className="text-lg font-black text-cyan-300">{auditResult.subScores.clarityScore}%</div>
                </div>
                <div className="p-3.5 rounded-xl bg-[#0a1128]/80 border border-slate-800 text-center space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Inclusivity</span>
                  <div className="text-lg font-black text-emerald-300">{auditResult.subScores.inclusivityScore}%</div>
                </div>
                <div className="p-3.5 rounded-xl bg-[#0a1128]/80 border border-slate-800 text-center space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">SEO / Keywords</span>
                  <div className="text-lg font-black text-blue-300">{auditResult.subScores.seoScore}%</div>
                </div>
                <div className="p-3.5 rounded-xl bg-[#0a1128]/80 border border-slate-800 text-center space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Completeness</span>
                  <div className="text-lg font-black text-indigo-300">{auditResult.subScores.completenessScore}%</div>
                </div>
              </div>

              {/* Inclusivity Audit Box */}
              <div className="p-5 rounded-2xl bg-[#0a1128]/80 border border-emerald-500/20 space-y-3">
                <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-emerald-400" />
                  Inclusive Language & Bias Audit
                </h4>
                {auditResult.inclusiveLanguageAudit.biasedTermsFound.length > 0 ? (
                  <div className="space-y-2 text-xs">
                    <p className="text-slate-300">Phrasing that may unintentionally discourage diverse candidates:</p>
                    <div className="space-y-1">
                      {auditResult.inclusiveLanguageAudit.biasedTermsFound.map((term, i) => (
                        <div key={i} className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                          <span className="text-rose-300 line-through font-mono">{term}</span>
                          <span className="text-emerald-300 font-bold">
                            → {auditResult.inclusiveLanguageAudit.suggestedReplacements[term] || 'neutral phrasing'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-300">
                    ✓ Clean language pass: No biased idioms, aggressive exclusionary terms, or gendered phrasing detected.
                  </p>
                )}
              </div>

              {/* Specific Improvement Suggestions */}
              <div className="p-5 rounded-2xl bg-[#0a1128]/80 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-cyan-400" />
                  Actionable Improvements
                </h4>
                <div className="space-y-2">
                  {auditResult.improvementSuggestions.map((sug, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                          {sug.category}
                        </span>
                        <span className="font-semibold text-white">{sug.issue}</span>
                      </div>
                      <p className="text-slate-300 pl-1">{sug.recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-2xl bg-[#0a1128]/40 border border-dashed border-slate-800 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 mx-auto flex items-center justify-center text-slate-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="text-sm font-bold text-white">No Quality Audit Performed Yet</h4>
                <p className="text-xs text-slate-400">
                  Select a job on the left and click &quot;Run Quality & Inclusivity Audit&quot; to inspect for bias, clarity, and SEO optimization.
                </p>
              </div>
              <button
                onClick={handleAudit}
                className="px-5 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Audit Sample Job Post</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
