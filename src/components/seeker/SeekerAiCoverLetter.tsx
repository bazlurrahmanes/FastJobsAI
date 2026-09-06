import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  Copy, 
  Check, 
  Building2, 
  Briefcase, 
  ArrowRight, 
  Wand2, 
  SlidersHorizontal,
  FileCheck
} from 'lucide-react';
import { useJobContext } from '../../context/JobContext';
import { Job } from '../../types';

export const SeekerAiCoverLetter: React.FC = () => {
  const { jobs, currentUser, setApplyModalJob } = useJobContext();
  const [selectedJobId, setSelectedJobId] = useState<string>(jobs[0]?.id || '');
  const [tone, setTone] = useState<'professional' | 'enthusiastic' | 'concise' | 'technical'>('professional');
  const [customHighlight, setCustomHighlight] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const selectedJob = jobs.find(j => j.id === selectedJobId) || jobs[0];

  const handleGenerate = async () => {
    if (!selectedJob) return;
    setLoading(true);
    try {
      const res = await fetch('/api/ai/generate-cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateProfile: currentUser,
          job: selectedJob,
          tone,
          customNotes: customHighlight
        })
      });
      if (res.ok) {
        const data = await res.json();
        setCoverLetter(data.coverLetter || '');
      }
    } catch (e) {
      console.error('Cover letter generator error:', e);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-cyan-950/60 via-[#0a1128] to-blue-950/60 border border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold mb-2 border border-cyan-500/30">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            AI Feature #4 • Tailored Outreach Engine
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            AI Cover Letter Generator
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Synthesizes your unique work history with the specific role requirements and company values into a compelling, tailored outreach letter.
          </p>
        </div>
      </div>

      {/* Control Configuration Box */}
      <div className="p-6 rounded-3xl bg-[#0a1128]/90 border border-cyan-500/30 space-y-5">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Target Job Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
              Target Position:
            </label>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-cyan-400"
            >
              {jobs.map(j => (
                <option key={j.id} value={j.id}>
                  {j.title} • {j.company} ({j.location})
                </option>
              ))}
            </select>
          </div>

          {/* Tone Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
              Communication Tone:
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['professional', 'enthusiastic', 'concise', 'technical'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold capitalize transition-all ${
                    tone === t
                      ? 'bg-cyan-500 text-slate-950 shadow-md'
                      : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Custom Highlights */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300">
            Special Angle or Highlight (Optional):
          </label>
          <input
            type="text"
            value={customHighlight}
            onChange={(e) => setCustomHighlight(e.target.value)}
            placeholder="e.g. Led migration to Kubernetes, cut AWS costs by 35%, passionate about their AI developer tooling..."
            className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-400"
          />
        </div>

        {/* Generate Button */}
        <div className="flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20"
          >
            <Wand2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Drafting Tailored Letter...' : 'Draft Tailored Cover Letter'}</span>
          </button>
        </div>

      </div>

      {/* Output Letter Preview */}
      {coverLetter ? (
        <div className="p-6 rounded-3xl bg-[#0a1128]/90 border border-cyan-500/30 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs font-bold text-cyan-300">
                Tailored Cover Letter for {selectedJob?.title} at {selectedJob?.company}
              </span>
              <span className="text-[11px] text-slate-400 ml-2">({tone} tone)</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copyToClipboard}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard' : 'Copy'}</span>
              </button>

              <button
                onClick={() => {
                  if (selectedJob) setApplyModalJob(selectedJob);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5"
              >
                <span>Apply to Role</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <textarea
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            rows={12}
            className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed focus:outline-hidden focus:border-cyan-400 resize-y font-sans"
          />
        </div>
      ) : (
        <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 text-slate-400 space-y-3">
          <FileCheck className="w-10 h-10 mx-auto text-cyan-400 opacity-60" />
          <h4 className="text-base font-bold text-white">Ready to Generate Cover Letter</h4>
          <p className="text-xs max-w-md mx-auto">
            Choose a target position and communication tone above to draft a high-conversion letter grounded in your real achievements.
          </p>
        </div>
      )}

    </div>
  );
};
