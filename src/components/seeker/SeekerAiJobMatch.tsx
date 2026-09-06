import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  Award, 
  TrendingUp, 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Zap, 
  ArrowRight,
  Info,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { useJobContext } from '../../context/JobContext';
import { Job } from '../../types';
import { AiMatchModal } from '../AiMatchModal';

export const SeekerAiJobMatch: React.FC = () => {
  const { jobs, currentUser, setApplyModalJob, quickApplyToJob, setAuthModalOpen } = useJobContext();
  const [selectedMatchJob, setSelectedMatchJob] = useState<Job | null>(null);
  const [minScoreFilter, setMinScoreFilter] = useState<number>(75);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);

  // Derive candidate skills
  const candidateSkills = (currentUser?.skills || []).map(s => typeof s === 'string' ? s : s.name).map(s => s.toLowerCase());

  // Rank jobs based on candidate skill overlap & heuristic match score
  const rankedJobs = jobs.map(job => {
    const jobSkills = job.skills.map(s => s.toLowerCase());
    const matchedCount = jobSkills.filter(js => candidateSkills.some(cs => cs.includes(js) || js.includes(cs))).length;
    const ratio = jobSkills.length > 0 ? (matchedCount / jobSkills.length) : 0.75;
    const baseScore = Math.min(98, Math.max(65, Math.round(ratio * 35 + 63)));
    return {
      ...job,
      calculatedMatchScore: job.matchScore || baseScore,
      matchedCount
    };
  })
  .filter(j => j.calculatedMatchScore >= minScoreFilter)
  .sort((a, b) => b.calculatedMatchScore - a.calculatedMatchScore);

  const handleQuickApply = async (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }
    setApplyingJobId(jobId);
    try {
      await quickApplyToJob(jobId);
    } finally {
      setApplyingJobId(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-cyan-950/60 via-[#0a1128] to-blue-950/60 border border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold mb-2 border border-cyan-500/30">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            AI Feature #1 • Real-Time Compatibility Engine
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            AI Job Match Intelligence
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Matching <span className="text-cyan-300 font-semibold">{currentUser?.name || 'Your Profile'}</span> against {jobs.length} active positions using your skills, seniority level, education, and compensation preferences.
          </p>
        </div>

        {/* Score Filter */}
        <div className="flex items-center gap-3 bg-slate-900/80 p-2.5 rounded-2xl border border-slate-800 self-start md:self-auto">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            Min Match:
          </span>
          <div className="flex gap-1">
            {[70, 80, 90].map(sc => (
              <button
                key={sc}
                onClick={() => setMinScoreFilter(sc)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  minScoreFilter === sc
                    ? 'bg-cyan-500 text-slate-950'
                    : 'text-slate-400 hover:text-white bg-slate-800'
                }`}
              >
                {sc}%+
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Ranked Job Matches List */}
      <div className="space-y-4">
        {rankedJobs.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 text-slate-400 space-y-3">
            <Info className="w-8 h-8 mx-auto text-cyan-400" />
            <h4 className="text-base font-bold text-white">No jobs matched above {minScoreFilter}%</h4>
            <p className="text-xs">Try lowering the minimum match filter or adding more skills to your profile.</p>
            <button
              onClick={() => setMinScoreFilter(70)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-cyan-300 text-xs font-semibold"
            >
              Show All Matches (70%+)
            </button>
          </div>
        ) : (
          rankedJobs.map(job => {
            const score = job.calculatedMatchScore;
            return (
              <div
                key={job.id}
                onClick={() => setSelectedMatchJob(job)}
                className="group p-5 rounded-2xl bg-[#0a1128]/80 hover:bg-[#0f172a] border border-cyan-500/20 hover:border-cyan-400/50 shadow-lg transition-all cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-5"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={job.companyLogo}
                    alt={job.company}
                    className="w-14 h-14 rounded-2xl object-cover ring-1 ring-cyan-500/30 bg-slate-950 shrink-0"
                  />
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-extrabold text-white text-base group-hover:text-cyan-300 transition-colors">
                        {job.title}
                      </h3>
                      {job.isRemote && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          Remote
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                      <span className="text-cyan-300 font-semibold">{job.company}</span>
                      <span>• {job.location}</span>
                      <span className="text-emerald-400 font-semibold">
                        • ${Math.round(job.salaryMin / 1000)}k - ${Math.round(job.salaryMax / 1000)}k
                      </span>
                      <span>• {job.experienceLevel}</span>
                    </div>

                    {/* Skill Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {job.skills.slice(0, 5).map((sk, idx) => {
                        const isMatch = candidateSkills.some(cs => cs.includes(sk.toLowerCase()) || sk.toLowerCase().includes(cs));
                        return (
                          <span
                            key={idx}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              isMatch
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {isMatch ? '✓ ' : ''}{sk}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Score & Quick Actions */}
                <div className="flex items-center gap-4 shrink-0 justify-between lg:justify-end border-t lg:border-t-0 border-slate-800 pt-3 lg:pt-0">
                  
                  {/* Score Pill */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-2xl font-black text-cyan-300">{score}%</div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">AI Match</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleQuickApply(e, job.id)}
                      disabled={applyingJobId === job.id}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
                    >
                      <Zap className="w-3.5 h-3.5 fill-slate-950" />
                      <span>{applyingJobId === job.id ? 'Applying...' : 'Quick Apply'}</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMatchJob(job);
                      }}
                      className="p-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-white transition-colors"
                      title="View AI Match Reasons"
                    >
                      <ChevronRight className="w-4 h-4 text-cyan-400" />
                    </button>
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* AI Match Deep Dive Modal */}
      {selectedMatchJob && (
        <AiMatchModal
          job={selectedMatchJob}
          onClose={() => setSelectedMatchJob(null)}
        />
      )}

    </div>
  );
};
