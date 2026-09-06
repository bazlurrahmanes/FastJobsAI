import React, { useState } from 'react';
import { 
  Sparkles, 
  FileText, 
  Copy, 
  Check, 
  Download, 
  Wand2, 
  ArrowRight, 
  Star, 
  CheckCircle2, 
  SlidersHorizontal,
  RefreshCw
} from 'lucide-react';
import { useJobContext } from '../../context/JobContext';

export const SeekerAiResumeBuilder: React.FC = () => {
  const { currentUser, updateProfile } = useJobContext();
  const [targetRole, setTargetRole] = useState(currentUser?.title || 'Senior AI Engineer');
  const [activeSubView, setActiveSubView] = useState<'full_resume' | 'bullet_optimizer'>('full_resume');
  
  // Full Resume Generator state
  const [generatedResume, setGeneratedResume] = useState<string>('');
  const [loadingResume, setLoadingResume] = useState(false);
  const [copiedResume, setCopiedResume] = useState(false);

  // Bullet Point Optimizer state
  const [rawBullet, setRawBullet] = useState('Built backend API endpoints in Node.js and improved speed.');
  const [bulletTargetRole, setBulletTargetRole] = useState(currentUser?.title || 'Senior Software Engineer');
  const [optimizedResult, setOptimizedResult] = useState<any>(null);
  const [loadingBullet, setLoadingBullet] = useState(false);
  const [copiedOptimized, setCopiedOptimized] = useState(false);

  const handleGenerateFullResume = async () => {
    setLoadingResume(true);
    try {
      const res = await fetch('/api/ai/generate-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: currentUser,
          targetRole
        })
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedResume(data.markdownResume || '');
      }
    } catch (e) {
      console.error('Error generating resume:', e);
    } finally {
      setLoadingResume(false);
    }
  };

  const handleOptimizeBullet = async () => {
    if (!rawBullet.trim()) return;
    setLoadingBullet(true);
    try {
      const res = await fetch('/api/ai/optimize-bullets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawBullet,
          targetRole: bulletTargetRole
        })
      });
      if (res.ok) {
        const data = await res.json();
        setOptimizedResult(data);
      }
    } catch (e) {
      console.error('Error optimizing bullet:', e);
    } finally {
      setLoadingBullet(false);
    }
  };

  const copyToClipboard = (text: string, setFn: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setFn(true);
    setTimeout(() => setFn(false), 2000);
  };

  const downloadMarkdown = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-cyan-950/60 via-[#0a1128] to-blue-950/60 border border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold mb-2 border border-cyan-500/30">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            AI Feature #3 • ATS-Optimized Document Engine
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            AI Resume Builder & STAR Optimizer
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Synthesize your profile into structured ATS-compliant Markdown and transform generic work tasks into metric-backed STAR achievements.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 self-start md:self-auto">
          <button
            onClick={() => setActiveSubView('full_resume')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubView === 'full_resume'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Full ATS Resume</span>
          </button>
          <button
            onClick={() => setActiveSubView('bullet_optimizer')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubView === 'bullet_optimizer'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>STAR Bullet Optimizer</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: FULL ATS RESUME GENERATOR */}
      {activeSubView === 'full_resume' && (
        <div className="space-y-6">
          
          {/* Action Bar */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-300">Target Role:</span>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="Target Job Title..."
                className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-400 min-w-[220px]"
              />
            </div>

            <button
              onClick={handleGenerateFullResume}
              disabled={loadingResume}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              <Wand2 className={`w-4 h-4 ${loadingResume ? 'animate-spin' : ''}`} />
              <span>{loadingResume ? 'Synthesizing Resume...' : 'Generate ATS Resume'}</span>
            </button>
          </div>

          {/* Resume Preview / Output */}
          {generatedResume ? (
            <div className="p-6 rounded-3xl bg-[#0a1128]/90 border border-cyan-500/30 space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-200">
                    ATS-Formatted Resume Generated for <span className="text-cyan-300">{targetRole}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(generatedResume, setCopiedResume)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
                  >
                    {copiedResume ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedResume ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={() => downloadMarkdown(generatedResume, `${currentUser?.name?.replace(/\s+/g, '_')}_Resume.md`)}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .md</span>
                  </button>
                </div>
              </div>

              {/* Markdown Display Box */}
              <pre className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed max-h-[600px] overflow-y-auto">
                {generatedResume}
              </pre>
            </div>
          ) : (
            <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 text-slate-400 space-y-3">
              <FileText className="w-10 h-10 mx-auto text-cyan-400 opacity-60" />
              <h4 className="text-base font-bold text-white">No Resume Generated Yet</h4>
              <p className="text-xs max-w-md mx-auto">
                Click "Generate ATS Resume" to synthesize your authenticated work history, education, and skills into a clean, recruiter-ready ATS document.
              </p>
            </div>
          )}

        </div>
      )}

      {/* VIEW 2: STAR BULLET POINT OPTIMIZER */}
      {activeSubView === 'bullet_optimizer' && (
        <div className="space-y-6">
          
          {/* Input Panel */}
          <div className="p-6 rounded-3xl bg-[#0a1128]/90 border border-cyan-500/30 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400" />
              STAR Method Bullet Point Transformer (Situation, Task, Action, Result)
            </h3>
            
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={bulletTargetRole}
                  onChange={(e) => setBulletTargetRole(e.target.value)}
                  placeholder="Target Role (e.g. Senior Backend Engineer)..."
                  className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-400 sm:w-1/3"
                />
              </div>

              <textarea
                value={rawBullet}
                onChange={(e) => setRawBullet(e.target.value)}
                placeholder="Paste any simple resume bullet or responsibility here (e.g., 'Maintained database and fixed bugs in user service')..."
                rows={3}
                className="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-400 resize-none leading-relaxed"
              />

              <div className="flex justify-end">
                <button
                  onClick={handleOptimizeBullet}
                  disabled={loadingBullet || !rawBullet.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20"
                >
                  <Wand2 className={`w-4 h-4 ${loadingBullet ? 'animate-spin' : ''}`} />
                  <span>{loadingBullet ? 'Optimizing with STAR...' : 'Transform into High-Impact STAR Bullet'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Results Comparison */}
          {optimizedResult && (
            <div className="space-y-4">
              
              {/* Before & After */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Before */}
                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Original / Generic Task:
                  </span>
                  <p className="text-xs text-slate-300 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    "{optimizedResult.original}"
                  </p>
                </div>

                {/* Optimized STAR Result */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0a1128] to-cyan-950/40 border border-cyan-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      Optimized STAR Impact Bullet:
                    </span>
                    <button
                      onClick={() => copyToClipboard(optimizedResult.optimized, setCopiedOptimized)}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[11px] font-semibold flex items-center gap-1"
                    >
                      {copiedOptimized ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedOptimized ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-white font-medium p-3 rounded-xl bg-slate-900/90 border border-cyan-500/30 leading-relaxed">
                    "{optimizedResult.optimized}"
                  </p>
                </div>

              </div>

              {/* STAR Framework Breakdown Pills */}
              {optimizedResult.starBreakdown && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
                    <span className="text-cyan-400 font-bold uppercase text-[10px]">Situation:</span>
                    <p className="text-slate-300 text-[11px]">{optimizedResult.starBreakdown.situation}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
                    <span className="text-blue-400 font-bold uppercase text-[10px]">Task:</span>
                    <p className="text-slate-300 text-[11px]">{optimizedResult.starBreakdown.task}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
                    <span className="text-emerald-400 font-bold uppercase text-[10px]">Action:</span>
                    <p className="text-slate-300 text-[11px]">{optimizedResult.starBreakdown.action}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
                    <span className="text-amber-400 font-bold uppercase text-[10px]">Result / Metric:</span>
                    <p className="text-slate-300 text-[11px]">{optimizedResult.starBreakdown.result}</p>
                  </div>
                </div>
              )}

              {/* Alternative Tone Variants */}
              {optimizedResult.alternatives && optimizedResult.alternatives.length > 0 && (
                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-slate-300">
                    Alternative Phrasings:
                  </span>
                  <div className="space-y-2">
                    {optimizedResult.alternatives.map((alt: string, idx: number) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs text-slate-200">
                        <span>"{alt}"</span>
                        <button
                          onClick={() => copyToClipboard(alt, () => {})}
                          className="text-cyan-400 hover:text-cyan-300 text-[11px] font-semibold shrink-0"
                        >
                          Copy
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      )}

    </div>
  );
};
