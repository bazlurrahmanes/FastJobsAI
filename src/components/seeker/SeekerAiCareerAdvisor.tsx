import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Compass, 
  Map, 
  TrendingUp, 
  Award, 
  ArrowRight, 
  CheckCircle2, 
  Briefcase, 
  Layers, 
  Milestone,
  RotateCcw,
  Target
} from 'lucide-react';
import { useJobContext } from '../../context/JobContext';

export const SeekerAiCareerAdvisor: React.FC = () => {
  const { currentUser } = useJobContext();
  const [advisorData, setAdvisorData] = useState<any>(null);
  const [roadmapData, setRoadmapData] = useState<any>(null);
  const [targetRole, setTargetRole] = useState('Staff AI Systems Architect');
  const [loading, setLoading] = useState(false);

  const fetchAdviceAndRoadmap = async () => {
    setLoading(true);
    try {
      // 1. Fetch Advisor
      const advRes = await fetch('/api/ai/career-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateProfile: currentUser,
          targetRole
        })
      });
      if (advRes.ok) {
        const d = await advRes.json();
        setAdvisorData(d);
      }

      // 2. Fetch Roadmap
      const roadRes = await fetch('/api/ai/career-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentRole: currentUser?.title || 'Senior Software Engineer',
          targetRole,
          skills: currentUser?.skills || []
        })
      });
      if (roadRes.ok) {
        const rd = await roadRes.json();
        setRoadmapData(rd);
      }
    } catch (e) {
      console.error('Error fetching career roadmap:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdviceAndRoadmap();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-cyan-950/60 via-[#0a1128] to-blue-950/60 border border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold mb-2 border border-cyan-500/30">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            AI Features #6 & #12 • Strategic Career Advisory & 3-Phase Milestone Roadmap
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            AI Career Advisor & Progression Roadmap
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Analyze your market positioning, explore high-growth adjacent roles, and execute a step-by-step milestone trajectory.
          </p>
        </div>

        {/* Goal Input & Refresh */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="Target Career Goal..."
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-cyan-400"
          />
          <button
            onClick={fetchAdviceAndRoadmap}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Analyzing...' : 'Recalibrate'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center rounded-3xl bg-slate-900/40 border border-slate-800 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Sparkles className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-sm font-semibold text-white">Mapping talent market positioning and multi-phase roadmap...</p>
          <p className="text-xs">Computing compensation ceilings and portfolio milestones...</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Market Positioning Overview */}
          {advisorData && (
            <div className="p-6 rounded-3xl bg-[#0a1128]/90 border border-cyan-500/30 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-cyan-400" />
                  Current Market Standing & Readiness
                </span>
                <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30">
                  {advisorData.readinessScore || 85}% Career Goal Readiness
                </span>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                {advisorData.marketPositioning}
              </p>

              {/* High-Growth Transition Trajectories */}
              {advisorData.suggestedPaths && advisorData.suggestedPaths.length > 0 && (
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-bold text-slate-300">
                    High-Potential Progression Paths:
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {advisorData.suggestedPaths.map((p: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs">{p.roleTitle}</span>
                          <span className="text-[10px] font-bold text-emerald-400">{p.estimatedTimeframe}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{p.whyGoodFit}</p>
                        <div className="text-[10px] text-cyan-300 font-semibold pt-1">
                          Bridge skill: {p.requiredBridgeSkills?.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3-Phase Step-by-Step Roadmap */}
          {roadmapData && (
            <div className="p-6 rounded-3xl bg-[#0a1128]/90 border border-cyan-500/30 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
                <div>
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Map className="w-4 h-4" />
                    Actionable 3-Phase Career Trajectory
                  </span>
                  <h3 className="text-lg font-black text-white mt-1">
                    Path to: <span className="text-cyan-300">{targetRole}</span>
                  </h3>
                </div>
                <div className="text-xs text-slate-400">
                  Estimated Timeline: <strong className="text-white">{roadmapData.estimatedTotalTimeline || '6-12 Months'}</strong>
                </div>
              </div>

              {/* Milestones */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {roadmapData.phases?.map((phase: any, idx: number) => (
                  <div key={idx} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 relative overflow-hidden">
                    
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-[10px] border border-cyan-500/30">
                        Phase {idx + 1}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400">{phase.timeframe}</span>
                    </div>

                    <h4 className="font-extrabold text-white text-sm">
                      {phase.title}
                    </h4>

                    {/* Milestone items */}
                    <div className="space-y-1.5 text-xs text-slate-300">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Key Milestones:</span>
                      <ul className="space-y-1 pl-4 list-disc text-slate-300">
                        {phase.milestones?.map((m: string, mIdx: number) => (
                          <li key={mIdx}>{m}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Recommended Project */}
                    {phase.portfolioProject && (
                      <div className="p-3 rounded-xl bg-slate-950 border border-cyan-500/20 space-y-1 text-xs">
                        <span className="text-[10px] font-bold text-cyan-400 uppercase">Portfolio Project:</span>
                        <p className="text-slate-300 text-[11px] leading-relaxed">{phase.portfolioProject}</p>
                      </div>
                    )}

                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
