import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  Clock, 
  ArrowRight, 
  Award, 
  Flame, 
  Zap,
  RotateCcw
} from 'lucide-react';
import { useJobContext } from '../../context/JobContext';

export const SeekerAiSkillGap: React.FC = () => {
  const { currentUser } = useJobContext();
  const [targetRole, setTargetRole] = useState('Staff Machine Learning Engineer');
  const [gapData, setGapData] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchSkillInsights = async () => {
    setLoading(true);
    try {
      // 1. Skill Gap
      const gapRes = await fetch('/api/ai/skill-gap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentSkills: currentUser?.skills || [],
          targetRole
        })
      });
      if (gapRes.ok) {
        const gd = await gapRes.json();
        setGapData(gd);
      }

      // 2. Skill Recommendations
      const recRes = await fetch('/api/ai/skill-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentSkills: currentUser?.skills || [],
          careerGoal: targetRole
        })
      });
      if (recRes.ok) {
        const rd = await recRes.json();
        setRecommendations(rd);
      }
    } catch (e) {
      console.error('Error fetching skill gap data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkillInsights();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950/60 via-[#0a1128] to-cyan-950/60 border border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold mb-2 border border-cyan-500/30">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            AI Features #7 & #13 • Skill Gap Analysis & High-ROI Skill Recommendations
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            AI Skill Gap & Priority Learning Paths
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Compare your existing competencies against industry demand for your target role and unlock structured learning roadmaps.
          </p>
        </div>

        {/* Target Role & Refresh */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="Target Career Role..."
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-cyan-400"
          />
          <button
            onClick={fetchSkillInsights}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Evaluating...' : 'Analyze Gaps'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center rounded-3xl bg-slate-900/40 border border-slate-800 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Sparkles className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-sm font-semibold text-white">Auditing current skill matrix against active enterprise job postings...</p>
          <p className="text-xs">Computing priority ROI learning curves and trending tech stacks...</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Skill Matrix Comparison (Existing vs Missing) */}
          {gapData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Existing Skills */}
              <div className="p-5 rounded-3xl bg-[#0a1128]/90 border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Verified Strengths ({gapData.existingSkillsMatch?.length || 0})
                  </span>
                  <span className="text-xs text-emerald-400 font-semibold">Ready</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {gapData.existingSkillsMatch?.map((sk: string, idx: number) => (
                    <span key={idx} className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                      ✓ {sk}
                    </span>
                  ))}
                </div>
              </div>

              {/* Missing Skills by Priority */}
              <div className="p-5 rounded-3xl bg-[#0a1128]/90 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    High-Priority Skill Gaps for {targetRole}
                  </span>
                  <span className="text-xs text-amber-400 font-semibold">Priority</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {gapData.missingSkills?.map((sk: any, idx: number) => (
                    <span key={idx} className="px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-300 text-xs font-semibold border border-amber-500/30 flex items-center gap-1.5">
                      <span>+ {sk.skill || sk}</span>
                      {sk.importance && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-200">
                          {sk.importance}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* Structured Learning Paths */}
          {gapData?.learningPaths && gapData.learningPaths.length > 0 && (
            <div className="p-6 rounded-3xl bg-[#0a1128]/90 border border-cyan-500/30 space-y-4">
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                Structured Learning Curriculum & Project Milestones
              </span>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {gapData.learningPaths.map((lp: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-white text-xs">{lp.skill}</span>
                      <span className="text-[10px] font-bold text-cyan-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {lp.estimatedTime}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">Recommended Actions:</span>
                      <ul className="space-y-1 pl-4 list-disc text-slate-300 text-[11px]">
                        {lp.recommendedActions?.map((act: string, aIdx: number) => (
                          <li key={aIdx}>{act}</li>
                        ))}
                      </ul>
                    </div>

                    {lp.capstoneProject && (
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-cyan-500/20 text-[11px] text-cyan-300">
                        <strong>Project:</strong> {lp.capstoneProject}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations: Immediate Impact vs Trending Future Skills */}
          {recommendations && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Immediate Impact */}
              <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  Immediate High-Impact Skills (Fastest Hiring ROI)
                </span>
                <div className="space-y-2">
                  {recommendations.immediateImpactSkills?.map((sk: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start justify-between gap-3 text-xs">
                      <div>
                        <div className="font-bold text-white">{sk.skill}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{sk.reason}</div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400 shrink-0 px-2 py-0.5 rounded bg-emerald-950">
                        {sk.timeToLearn}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trending Skills */}
              <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400" />
                  Trending High-Growth Market Skills (2026+)
                </span>
                <div className="space-y-2">
                  {recommendations.trendingSkills?.map((sk: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start justify-between gap-3 text-xs">
                      <div>
                        <div className="font-bold text-white">{sk.skill}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{sk.trendReason}</div>
                      </div>
                      <span className="text-[10px] font-bold text-amber-400 shrink-0 px-2 py-0.5 rounded bg-amber-950">
                        {sk.relevance}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
};
