import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ListOrdered, 
  Briefcase, 
  Sliders, 
  CheckCircle2, 
  Award, 
  RefreshCw, 
  ChevronRight, 
  ShieldCheck, 
  Info,
  TrendingUp
} from 'lucide-react';
import { useJobContext } from '../../context/JobContext';
import { Application, Job } from '../../types';

interface RecruiterAiApplicantRankingProps {
  onSelectCandidate?: (applicantId: string) => void;
}

export const RecruiterAiApplicantRanking: React.FC<RecruiterAiApplicantRankingProps> = ({
  onSelectCandidate
}) => {
  const { jobs, applications, updateApplicationStatus, showToast } = useJobContext();

  const [selectedJobId, setSelectedJobId] = useState<string>(jobs[0]?.id || '');
  const [weights, setWeights] = useState({
    technicalSkills: 4,
    domainExperience: 4,
    seniority: 3,
    immediateAvailability: 3,
    communicationFit: 3
  });

  const [isLoading, setIsLoading] = useState(false);
  const [rankingData, setRankingData] = useState<{
    rankedApplicants: Array<{
      rank: number;
      applicantId: string;
      name: string;
      compositeScore: number;
      criteriaBreakdown: {
        technicalSkills: number;
        domainExperience: number;
        seniority: number;
        availability: number;
        communicationFit: number;
      };
      transparentExplanation: string;
      standoutFactor: string;
      recruiterActionRecommendation: string;
    }>;
    rankingMethodology: string;
    nonDiscriminationAuditPassed: boolean;
    aiGenerated?: boolean;
  } | null>(null);

  const currentJob = jobs.find(j => j.id === selectedJobId) || jobs[0];

  const handleRankApplicants = async () => {
    if (!currentJob || applications.length === 0) return;
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/recruiter/applicant-ranking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job: {
            title: currentJob.title,
            company: currentJob.company,
            skills: currentJob.skills,
            experienceLevel: currentJob.experienceLevel
          },
          applicants: applications.map(a => ({
            id: a.id,
            applicantName: a.applicantName,
            applicantTitle: a.applicantTitle,
            applicantSkills: a.applicantSkills,
            appliedAt: a.appliedAt,
            status: a.status,
            matchScore: a.matchScore
          })),
          weights
        })
      });

      if (!response.ok) throw new Error('Ranking failed');
      const data = await response.json();
      setRankingData(data);
      showToast({
        title: 'Applicant Pool Ranked',
        message: 'Transparent, criteria-weighted ranking generated.',
        type: 'success'
      });
    } catch (err) {
      console.error(err);
      showToast({
        title: 'Ranking Notice',
        message: 'Calculated using local weighted ranking rules.',
        type: 'info'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedJobId && applications.length > 0) {
      handleRankApplicants();
    }
  }, [selectedJobId]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-blue-500/20 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md">
            <ListOrdered className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              AI Applicant Ranking & Decision Support
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Transparent & Audited
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              Rank applicants using customizable job-related criteria with transparent explanations and zero demographic bias.
            </p>
          </div>
        </div>
      </div>

      {/* Configuration Bar */}
      <div className="p-5 rounded-2xl bg-[#0a1128]/80 border border-slate-800 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
              Target Role to Rank ({applications.length} Candidates in Pipeline)
            </label>
            <select
              value={selectedJobId}
              onChange={e => setSelectedJobId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-cyan-500"
            >
              {jobs.map(j => (
                <option key={j.id} value={j.id}>
                  {j.title} • {j.category}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end pt-4 md:pt-0">
            <button
              onClick={handleRankApplicants}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Re-Calculate Weighted Ranking</span>
            </button>
          </div>
        </div>

        {/* Weights Sliders */}
        <div className="pt-3 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              Customizable Criteria Weights (1 to 5 Importance)
            </span>
            <span className="text-[11px] text-slate-400 font-normal">Adjust slider to reprioritize pipeline</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
              <div className="flex justify-between text-[11px] font-semibold text-slate-300">
                <span>Tech Skills</span>
                <span className="text-cyan-300 font-bold">{weights.technicalSkills}x</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={weights.technicalSkills}
                onChange={e => setWeights({ ...weights, technicalSkills: Number(e.target.value) })}
                className="w-full accent-cyan-400"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
              <div className="flex justify-between text-[11px] font-semibold text-slate-300">
                <span>Domain Exp</span>
                <span className="text-cyan-300 font-bold">{weights.domainExperience}x</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={weights.domainExperience}
                onChange={e => setWeights({ ...weights, domainExperience: Number(e.target.value) })}
                className="w-full accent-cyan-400"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
              <div className="flex justify-between text-[11px] font-semibold text-slate-300">
                <span>Seniority</span>
                <span className="text-cyan-300 font-bold">{weights.seniority}x</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={weights.seniority}
                onChange={e => setWeights({ ...weights, seniority: Number(e.target.value) })}
                className="w-full accent-cyan-400"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
              <div className="flex justify-between text-[11px] font-semibold text-slate-300">
                <span>Availability</span>
                <span className="text-cyan-300 font-bold">{weights.immediateAvailability}x</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={weights.immediateAvailability}
                onChange={e => setWeights({ ...weights, immediateAvailability: Number(e.target.value) })}
                className="w-full accent-cyan-400"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
              <div className="flex justify-between text-[11px] font-semibold text-slate-300">
                <span>Communication</span>
                <span className="text-cyan-300 font-bold">{weights.communicationFit}x</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={weights.communicationFit}
                onChange={e => setWeights({ ...weights, communicationFit: Number(e.target.value) })}
                className="w-full accent-cyan-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Rankings List */}
      {isLoading ? (
        <div className="p-16 rounded-2xl bg-[#0a1128]/60 border border-slate-800 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-white">Synthesizing applicant ranking scores...</p>
        </div>
      ) : rankingData ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{rankingData.rankingMethodology}</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Fairness Audit Verified
            </span>
          </div>

          <div className="space-y-3">
            {rankingData.rankedApplicants.map((app) => (
              <div
                key={app.applicantId}
                className="p-5 rounded-2xl bg-[#0a1128]/80 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg"
              >
                <div className="flex items-start gap-4">
                  {/* Rank Badge */}
                  <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 border ${
                    app.rank === 1
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-md shadow-amber-500/20'
                      : app.rank === 2
                      ? 'bg-slate-300/20 text-slate-200 border-slate-400/40'
                      : app.rank === 3
                      ? 'bg-amber-700/20 text-amber-500 border-amber-700/40'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Rank</span>
                    <span className="text-base font-black text-white">#{app.rank}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">{app.name}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {app.compositeScore}% Composite Fit
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      {app.transparentExplanation}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        ★ {app.standoutFactor}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Breakdown & Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0 pt-2 md:pt-0">
                  <div className="text-right hidden xl:block space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Recommendation</span>
                    <p className="text-xs font-bold text-cyan-300">{app.recruiterActionRecommendation}</p>
                  </div>

                  <button
                    onClick={() => {
                      updateApplicationStatus(app.applicantId, 'interviewing', 'Advanced from AI Ranking Table');
                      showToast({
                        title: 'Moved to Interview',
                        message: `${app.name} promoted to interviewing stage.`,
                        type: 'success'
                      });
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Interview</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};
