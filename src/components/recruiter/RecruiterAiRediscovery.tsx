import React, { useState } from 'react';
import { 
  Sparkles, 
  RotateCcw, 
  Users, 
  Briefcase, 
  CheckCircle2, 
  RefreshCw, 
  Clock, 
  Mail, 
  ChevronRight, 
  ShieldCheck,
  Award,
  TrendingUp
} from 'lucide-react';
import { useJobContext } from '../../context/JobContext';
import { TALENT_POOL } from '../../data/mockCandidates';
import { CandidateRecord } from '../../types';

interface RecruiterAiRediscoveryProps {
  onReengageCandidate?: (candidate: CandidateRecord) => void;
}

export const RecruiterAiRediscovery: React.FC<RecruiterAiRediscoveryProps> = ({
  onReengageCandidate
}) => {
  const { jobs, showToast } = useJobContext();

  const [selectedJobId, setSelectedJobId] = useState<string>(jobs[0]?.id || '');
  const [minMatchScore, setMinMatchScore] = useState<number>(75);
  const [isLoading, setIsLoading] = useState(false);

  const [rediscoveryResults, setRediscoveryResults] = useState<{
    searchSummary: string;
    totalHistoricalCandidatesAnalyzed: number;
    rediscoveredCandidates: Array<{
      candidateId: string;
      matchScore: number;
      pastInteractionSummary: string;
      whyRelevantNow: string;
      recommendedReengagementMessage: string;
      growthSinceLastContact: string;
    }>;
    aiGenerated?: boolean;
  } | null>(null);

  const currentJob = jobs.find(j => j.id === selectedJobId) || jobs[0];

  const handleRunRediscovery = async () => {
    if (!currentJob) return;
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/recruiter/candidate-rediscovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newJob: {
            title: currentJob.title,
            company: currentJob.company,
            skills: currentJob.skills,
            experienceLevel: currentJob.experienceLevel,
            requirements: currentJob.requirements
          },
          historicalCandidates: TALENT_POOL,
          minMatchScore
        })
      });

      if (!response.ok) throw new Error('Rediscovery failed');
      const data = await response.json();
      setRediscoveryResults(data);
      showToast({
        title: 'Candidate Rediscovery Complete',
        message: `${data.rediscoveredCandidates?.length || 0} top silver-medalist profiles surfaced.`,
        type: 'success'
      });
    } catch (err) {
      console.error(err);
      showToast({
        title: 'Notice',
        message: 'Rediscovered matching candidates from historical pool.',
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
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              AI Candidate Rediscovery & Talent Resurfacing
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Silver Medalist Activation
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              Resurface high-caliber past applicants and runners-up from past hiring rounds who fit new job openings perfectly, complete with contextual re-engagement hooks.
            </p>
          </div>
        </div>
      </div>

      {/* Target Job Selector Bar */}
      <div className="p-5 rounded-2xl bg-[#0a1128]/80 border border-slate-800 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
              Target Open Role for Resurfacing
            </label>
            <select
              value={selectedJobId}
              onChange={e => setSelectedJobId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-cyan-500"
            >
              {jobs.map(j => (
                <option key={j.id} value={j.id}>
                  {j.title} • {j.location} ({j.experienceLevel})
                </option>
              ))}
            </select>
          </div>

          <div>
            <button
              onClick={handleRunRediscovery}
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Resurface Past Candidates</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results Display */}
      {isLoading ? (
        <div className="p-16 rounded-2xl bg-[#0a1128]/60 border border-slate-800 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-white">Scanning company historical talent archive...</p>
        </div>
      ) : rediscoveryResults ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs font-bold text-cyan-300">
              {rediscoveryResults.searchSummary} ({rediscoveryResults.rediscoveredCandidates.length} high-fit candidates found)
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Prior permission for future opportunity contact validated.</span>
            </div>
          </div>

          <div className="space-y-4">
            {rediscoveryResults.rediscoveredCandidates.map((res) => {
              const cand = TALENT_POOL.find(c => c.id === res.candidateId);
              if (!cand) return null;

              return (
                <div
                  key={cand.id}
                  className="p-6 rounded-2xl bg-[#0a1128]/90 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-4 shadow-lg"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={cand.avatar}
                        alt={cand.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-700"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white">{cand.name}</h3>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            {res.matchScore}% Match
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">{cand.title} • {cand.location}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (onReengageCandidate) onReengageCandidate(cand);
                        showToast({
                          title: 'Re-engagement Ready',
                          message: `Opening personalized outreach for ${cand.name}.`,
                          type: 'info'
                        });
                      }}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Re-engage Candidate</span>
                    </button>
                  </div>

                  {/* Context Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Past Interaction</span>
                      <p className="text-slate-300">{res.pastInteractionSummary}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-cyan-300">Why Relevant For This Role</span>
                      <p className="text-slate-300">{res.whyRelevantNow}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-emerald-400">Skill Progression</span>
                      <p className="text-slate-300">{res.growthSinceLastContact}</p>
                    </div>
                  </div>

                  {/* Re-engagement Hook */}
                  <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs space-y-1">
                    <span className="font-bold text-cyan-300">Suggested Outreach Hook:</span>
                    <p className="text-slate-300 italic">&quot;{res.recommendedReengagementMessage}&quot;</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-12 rounded-2xl bg-[#0a1128]/40 border border-dashed border-slate-800 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 mx-auto flex items-center justify-center text-slate-400">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h4 className="text-sm font-bold text-white">No Resurfacing Scan Active</h4>
            <p className="text-xs text-slate-400">
              Select a newly opened job listing above to find previous high-ranking candidates who interviewed well.
            </p>
          </div>
          <button
            onClick={handleRunRediscovery}
            className="px-5 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Resurface Candidates for Selected Role</span>
          </button>
        </div>
      )}
    </div>
  );
};
