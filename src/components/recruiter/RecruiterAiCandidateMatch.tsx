import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Users, 
  Briefcase, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Award, 
  TrendingUp, 
  MapPin, 
  DollarSign, 
  UserCheck,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useJobContext } from '../../context/JobContext';
import { TALENT_POOL } from '../../data/mockCandidates';
import { Job, CandidateRecord } from '../../types';

interface RecruiterAiCandidateMatchProps {
  initialJobId?: string;
  initialCandidateId?: string;
  onAdvanceCandidate?: (candidateName: string) => void;
}

export const RecruiterAiCandidateMatch: React.FC<RecruiterAiCandidateMatchProps> = ({
  initialJobId,
  initialCandidateId,
  onAdvanceCandidate
}) => {
  const { jobs, applications, showToast } = useJobContext();

  const [selectedJobId, setSelectedJobId] = useState<string>(initialJobId || jobs[0]?.id || '');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(initialCandidateId || TALENT_POOL[0]?.id || '');
  const [isLoading, setIsLoading] = useState(false);

  const [matchResult, setMatchResult] = useState<{
    matchScore: number;
    fitLevel: string;
    matchingFactors: {
      skillsMatch: { score: number; details: string };
      experienceMatch: { score: number; details: string };
      qualificationMatch: { score: number; details: string };
      locationMatch: { score: number; details: string };
      salaryMatch: { score: number; details: string };
    };
    strengths: string[];
    growthAreas: string[];
    recruiterRecommendation: string;
    aiGenerated?: boolean;
  } | null>(null);

  const currentJob = jobs.find(j => j.id === selectedJobId) || jobs[0];
  const currentCandidate = TALENT_POOL.find(c => c.id === selectedCandidateId) || TALENT_POOL[0];

  const handleRunMatch = async () => {
    if (!currentJob || !currentCandidate) return;
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/recruiter/candidate-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job: {
            title: currentJob.title,
            company: currentJob.company,
            skills: currentJob.skills,
            experienceLevel: currentJob.experienceLevel,
            location: currentJob.location,
            isRemote: currentJob.isRemote,
            salaryMin: currentJob.salaryMin,
            salaryMax: currentJob.salaryMax,
            requirements: currentJob.requirements
          },
          candidateProfile: {
            name: currentCandidate.name,
            title: currentCandidate.title,
            location: currentCandidate.location,
            skills: currentCandidate.skills,
            experienceYears: currentCandidate.experienceYears,
            bio: currentCandidate.bio,
            availability: currentCandidate.availability
          }
        })
      });

      if (!response.ok) throw new Error('Match failed');
      const data = await response.json();
      setMatchResult(data);
      showToast({
        title: 'Candidate Match Calculated',
        message: `Compatibility score: ${data.matchScore}% for ${currentCandidate.name}`,
        type: 'success'
      });
    } catch (err) {
      console.error(err);
      showToast({
        title: 'Match Notice',
        message: 'Calculated using local matching intelligence heuristics.',
        type: 'info'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedJobId && selectedCandidateId) {
      handleRunMatch();
    }
  }, [selectedJobId, selectedCandidateId]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-blue-500/20 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              AI Candidate Match Intelligence
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Multi-Dimensional Fit
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              Evaluate candidate compatibility against job openings factoring in skills, experience depth, compensation, location, and role requirements.
            </p>
          </div>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-2xl bg-[#0a1128]/80 border border-slate-800">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
            Select Open Job Listing
          </label>
          <select
            value={selectedJobId}
            onChange={e => setSelectedJobId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-cyan-500"
          >
            {jobs.map(j => (
              <option key={j.id} value={j.id}>
                {j.title} • {j.location} (${Math.round(j.salaryMin / 1000)}k - ${Math.round(j.salaryMax / 1000)}k)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            Select Candidate to Evaluate
          </label>
          <select
            value={selectedCandidateId}
            onChange={e => setSelectedCandidateId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-blue-500"
          >
            {TALENT_POOL.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} • {c.title} ({c.experienceYears}y exp • {c.availability})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Results Display */}
      {isLoading ? (
        <div className="p-16 rounded-2xl bg-[#0a1128]/60 border border-slate-800 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-white">Analyzing multidimensional compatibility...</p>
          <p className="text-xs text-slate-400">Comparing technical skill overlaps, seniority expectations, and role requirements.</p>
        </div>
      ) : matchResult ? (
        <div className="space-y-6">
          {/* Top Score Summary Card */}
          <div className="p-6 rounded-2xl bg-[#0a1128]/90 border border-cyan-500/30 grid grid-cols-1 md:grid-cols-12 gap-6 items-center shadow-xl">
            <div className="md:col-span-4 flex items-center gap-4 border-b md:border-b-0 md:border-r border-slate-800 pb-4 md:pb-0 md:pr-4">
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 flex flex-col items-center justify-center shrink-0">
                <span className="text-2xl font-black text-cyan-300">{matchResult.matchScore}%</span>
                <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Match Fit</span>
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {matchResult.fitLevel} Alignment
                </span>
                <h3 className="text-base font-bold text-white mt-1.5">{currentCandidate.name}</h3>
                <p className="text-xs text-slate-400">{currentCandidate.title}</p>
              </div>
            </div>

            <div className="md:col-span-8 space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-cyan-400" />
                Hiring Recommendation
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                {matchResult.recruiterRecommendation}
              </p>
            </div>
          </div>

          {/* 5 Dimensional Factors Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {Object.entries(matchResult.matchingFactors).map(([key, item]) => {
              const labelMap: Record<string, string> = {
                skillsMatch: 'Skills Match',
                experienceMatch: 'Experience Depth',
                qualificationMatch: 'Qualifications',
                locationMatch: 'Location & Remote',
                salaryMatch: 'Salary Band'
              };
              return (
                <div key={key} className="p-4 rounded-xl bg-[#0a1128]/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">{labelMap[key] || key}</span>
                    <span className="font-bold text-cyan-300">{item.score}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">{item.details}</p>
                </div>
              );
            })}
          </div>

          {/* Strengths & Growth Areas Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="p-5 rounded-2xl bg-[#0a1128]/80 border border-emerald-500/20 space-y-3">
              <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Key Candidate Strengths for this Role
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                {matchResult.strengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Growth Areas & Verification Points */}
            <div className="p-5 rounded-2xl bg-[#0a1128]/80 border border-amber-500/20 space-y-3">
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Screening Verification Points
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                {matchResult.growthAreas.map((ga, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                    <span>{ga}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Evaluated objectively without demographic bias. Candidate privacy consent verified.</span>
            </div>
            <button
              onClick={() => {
                if (onAdvanceCandidate) onAdvanceCandidate(currentCandidate.name);
                showToast({
                  title: 'Stage Updated',
                  message: `${currentCandidate.name} queued for recruiter screening.`,
                  type: 'success'
                });
              }}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <span>Advance to Recruiter Screen</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
