import React, { useState } from 'react';
import { 
  Sparkles, 
  HelpCircle, 
  Briefcase, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Copy, 
  Check, 
  ChevronRight,
  FileQuestion,
  Layers,
  Award
} from 'lucide-react';
import { useJobContext } from '../../context/JobContext';
import { TALENT_POOL } from '../../data/mockCandidates';

export const RecruiterAiInterviewQuestions: React.FC = () => {
  const { jobs, showToast } = useJobContext();

  const [selectedJobId, setSelectedJobId] = useState<string>(jobs[0]?.id || '');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('none');
  const [focusAreas, setFocusAreas] = useState('High-throughput systems architecture, debugging under scale, cross-functional engineering alignment');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const [interviewKit, setInterviewKit] = useState<{
    roleTitle: string;
    experienceLevel: string;
    interviewSections: Array<{
      category: string;
      questions: Array<{
        question: string;
        targetCompetency: string;
        whatToLookFor: string;
        greenFlags: string[];
        redFlags: string[];
        sampleFollowUp: string;
      }>;
    }>;
    aiGenerated?: boolean;
  } | null>(null);

  const currentJob = jobs.find(j => j.id === selectedJobId) || jobs[0];
  const currentCandidate = TALENT_POOL.find(c => c.id === selectedCandidateId);

  const handleGenerate = async () => {
    if (!currentJob) return;
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/recruiter/interview-questions', {
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
          candidateProfile: currentCandidate ? {
            name: currentCandidate.name,
            title: currentCandidate.title,
            skills: currentCandidate.skills
          } : null,
          focusAreas
        })
      });

      if (!response.ok) throw new Error('Interview generation failed');
      const data = await response.json();
      setInterviewKit(data);
      showToast({
        title: 'Interview Kit Generated',
        message: `Structured rubrics & questions created for ${currentJob.title}.`,
        type: 'success'
      });
    } catch (err) {
      console.error(err);
      showToast({
        title: 'Notice',
        message: 'Loaded standard role interview rubrics.',
        type: 'info'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyQuestion = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-blue-500/20 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              AI Interview Question & Rubric Generator
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Evaluation Rubrics
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              Generate role-specific, seniority-calibrated interview questions with &quot;What to look for&quot; rubrics, green flags, red flags, and probing follow-ups.
            </p>
          </div>
        </div>
      </div>

      {/* Inputs Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 rounded-2xl bg-[#0a1128]/80 border border-slate-800">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
            Target Role & Requirements
          </label>
          <select
            value={selectedJobId}
            onChange={e => setSelectedJobId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-cyan-500"
          >
            {jobs.map(j => (
              <option key={j.id} value={j.id}>
                {j.title} ({j.experienceLevel})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            Specific Candidate (Optional)
          </label>
          <select
            value={selectedCandidateId}
            onChange={e => setSelectedCandidateId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-blue-500"
          >
            <option value="none">General Role Interview Kit</option>
            {TALENT_POOL.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} • {c.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>Generate Interview Kit</span>
          </button>
        </div>
      </div>

      {/* Interview Kit Display */}
      {isLoading ? (
        <div className="p-16 rounded-2xl bg-[#0a1128]/60 border border-slate-800 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-white">Generating structured interview kit & rubrics...</p>
        </div>
      ) : interviewKit ? (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-white">
              Interview Kit for <strong className="text-cyan-300">{interviewKit.roleTitle}</strong> ({interviewKit.experienceLevel})
            </span>
            <span className="text-xs text-slate-400">
              {interviewKit.interviewSections?.length || 0} Specialized Interview Rounds
            </span>
          </div>

          <div className="space-y-6">
            {interviewKit.interviewSections?.map((section, sIdx) => (
              <div
                key={sIdx}
                className="p-6 rounded-2xl bg-[#0a1128]/90 border border-slate-800 space-y-5 shadow-lg"
              >
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <FileQuestion className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-base font-bold text-white">{section.category}</h3>
                </div>

                <div className="space-y-4">
                  {section.questions?.map((q, qIdx) => {
                    const globalIdx = sIdx * 10 + qIdx;
                    return (
                      <div
                        key={qIdx}
                        className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/90 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                              Target Competency: {q.targetCompetency}
                            </span>
                            <h4 className="text-sm font-bold text-white leading-snug">
                              &quot;{q.question}&quot;
                            </h4>
                          </div>

                          <button
                            onClick={() => handleCopyQuestion(q.question, globalIdx)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs shrink-0"
                            title="Copy Question"
                          >
                            {copiedIndex === globalIdx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        {/* What to look for */}
                        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                          <span className="font-bold text-slate-300">Interviewer Rubric & Assessment Criteria:</span>
                          <p className="text-slate-300 leading-relaxed">{q.whatToLookFor}</p>
                        </div>

                        {/* Green Flags vs Red Flags */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                            <span className="font-bold text-emerald-300 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              Positive Signals (Green Flags):
                            </span>
                            <ul className="space-y-1 text-slate-300 pl-4 list-disc text-[11px]">
                              {q.greenFlags?.map((gf, i) => (
                                <li key={i}>{gf}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 space-y-1">
                            <span className="font-bold text-rose-300 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                              Warning Signs (Red Flags):
                            </span>
                            <ul className="space-y-1 text-slate-300 pl-4 list-disc text-[11px]">
                              {q.redFlags?.map((rf, i) => (
                                <li key={i}>{rf}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Follow up */}
                        {q.sampleFollowUp && (
                          <div className="text-xs text-slate-300 bg-blue-500/10 p-2.5 rounded-lg border border-blue-500/20 flex items-center gap-2">
                            <span className="font-bold text-blue-300 shrink-0">Probing Follow-Up:</span>
                            <span className="italic">&quot;{q.sampleFollowUp}&quot;</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-12 rounded-2xl bg-[#0a1128]/40 border border-dashed border-slate-800 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 mx-auto flex items-center justify-center text-slate-400">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h4 className="text-sm font-bold text-white">No Interview Kit Active</h4>
            <p className="text-xs text-slate-400">
              Select a job opening above and click &quot;Generate Interview Kit&quot; to produce comprehensive interviewer rubrics.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            className="px-5 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Role Questions</span>
          </button>
        </div>
      )}
    </div>
  );
};
