import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  TrendingUp, 
  LayoutList, 
  RotateCcw,
  UploadCloud,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useJobContext } from '../../context/JobContext';
import { ResumeParserJobComparisonModal } from './ResumeParserJobComparisonModal';

export const SeekerAiResumeAnalyzer: React.FC = () => {
  const { currentUser } = useJobContext();
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [targetRole, setTargetRole] = useState(currentUser?.title || 'Senior Software Engineer');
  const [resumeName, setResumeName] = useState(currentUser?.resumeFileName || 'Alex_Chen_Resume_AI_Engineer_2026.pdf');
  const [showCompareModal, setShowCompareModal] = useState(false);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/analyze-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: currentUser,
          targetRole
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAnalysis(data);
      }
    } catch (e) {
      console.error('Error analyzing resume:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAnalysis();
  }, []);

  const atsScore = analysis?.atsScore || 87;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950/60 via-[#0a1128] to-cyan-950/60 border border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold mb-2 border border-cyan-500/30">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            AI Feature #2 • ATS Compatibility & CV Audit
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            AI Resume / CV Analyzer
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Audit your resume against modern ATS parsers, recruiter keyword filters, and seniority benchmarks.
          </p>
        </div>

        {/* Target Role & Re-Analyze Action */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <button
            onClick={() => setShowCompareModal(true)}
            className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Missing Skills Audit (vs Job)</span>
          </button>
          <input
            type="text"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="Target role..."
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-400"
          />
          <button
            onClick={runAnalysis}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Auditing...' : 'Re-Analyze'}</span>
          </button>
        </div>
      </div>

      {/* Main Analysis Dashboard */}
      {loading ? (
        <div className="py-16 text-center rounded-3xl bg-slate-900/40 border border-slate-800 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Sparkles className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-sm font-semibold text-white">Auditing resume against ATS parser guidelines...</p>
          <p className="text-xs">Scanning formatting hierarchy, keyword density, and STAR metrics...</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Top Score Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* ATS Score Card */}
            <div className="p-5 rounded-2xl bg-[#0a1128]/90 border border-cyan-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  ATS Match Rating
                </span>
                <div className="text-3xl font-black text-cyan-300 mt-1">
                  {atsScore} / 100
                </div>
                <p className="text-[11px] text-emerald-400 font-semibold mt-1">
                  ✓ Ready for Enterprise Screening
                </p>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-black text-xl">
                {atsScore}%
              </div>
            </div>

            {/* Active Resume */}
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div className="overflow-hidden">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active File</span>
                <div className="text-xs font-bold text-white truncate">{resumeName}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Target: {targetRole}</div>
              </div>
            </div>

            {/* Status overview */}
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Key Findings</span>
                <div className="text-xs font-semibold text-slate-200 mt-1">
                  {analysis?.strengths?.length || 3} Strengths • {analysis?.weaknesses?.length || 2} Gaps
                </div>
                <div className="text-[11px] text-cyan-300 mt-0.5">
                  {analysis?.missingSkills?.length || 3} Recommended keywords
                </div>
              </div>
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
            </div>

          </div>

          {/* Strengths & Weaknesses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Strengths */}
            <div className="p-5 rounded-2xl bg-[#0a1128]/80 border border-emerald-500/20 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Resume Strengths ({analysis?.strengths?.length || 0})
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {analysis?.strengths?.map((item: string, idx: number) => (
                  <li key={idx} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-2">
                    <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="p-5 rounded-2xl bg-[#0a1128]/80 border border-amber-500/20 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Areas to Strengthen ({analysis?.weaknesses?.length || 0})
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {analysis?.weaknesses?.map((item: string, idx: number) => (
                  <li key={idx} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-2">
                    <span className="text-amber-400 font-bold mt-0.5">!</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Missing Skills & Missing Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Missing High-Value Skills */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Missing In-Demand Keywords for {targetRole}
              </h3>
              <div className="flex flex-wrap gap-2 pt-1">
                {analysis?.missingSkills?.map((skill: string, idx: number) => (
                  <span key={idx} className="px-3 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-300 text-xs font-semibold border border-cyan-500/30 flex items-center gap-1.5">
                    <span>+</span> {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Missing Info & Formatting Issues */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
                <LayoutList className="w-4 h-4 text-blue-400" />
                Formatting & Layout Audit
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-300 pl-4 list-disc">
                {analysis?.formattingIssues?.map((item: string, idx: number) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

          </div>

          {/* Prioritized Improvement Recommendations */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0a1128] via-slate-900 to-cyan-950/40 border border-cyan-500/30 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Prioritized Action Items to Reach 95%+ ATS Score
            </h3>
            <div className="space-y-2.5">
              {analysis?.improvementRecommendations?.map((rec: string, idx: number) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-3 text-xs text-slate-200">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{rec}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {showCompareModal && (
        <ResumeParserJobComparisonModal
          isOpen={showCompareModal}
          onClose={() => setShowCompareModal(false)}
        />
      )}

    </div>
  );
};
