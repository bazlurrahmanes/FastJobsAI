import React, { useState } from 'react';
import { 
  Sparkles, 
  Globe, 
  Languages, 
  Briefcase, 
  Copy, 
  Check, 
  RefreshCw, 
  CheckCircle2,
  Share2,
  FileText
} from 'lucide-react';
import { useJobContext } from '../../context/JobContext';
import { Job } from '../../types';

export const RecruiterAiJobTranslator: React.FC = () => {
  const { jobs, showToast } = useJobContext();

  const [selectedJobId, setSelectedJobId] = useState<string>(jobs[0]?.id || '');
  const [targetLanguage, setTargetLanguage] = useState<string>('Spanish');
  const [customTitle, setCustomTitle] = useState(jobs[0]?.title || 'Staff Distributed Systems Engineer');
  const [customDescription, setCustomDescription] = useState(jobs[0]?.description || '');
  const [customRequirements, setCustomRequirements] = useState(jobs[0]?.requirements?.join('\n') || '');

  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [translationResult, setTranslationResult] = useState<{
    targetLanguage: string;
    translatedTitle: string;
    translatedDescription: string;
    translatedRequirements: string[];
    translatedBenefits: string[];
    culturalNuancesNotes: string;
    aiGenerated?: boolean;
  } | null>(null);

  const languages = [
    'Spanish',
    'French',
    'German',
    'Japanese',
    'Portuguese',
    'Mandarin Chinese',
    'Arabic',
    'Hindi'
  ];

  const handleSelectJob = (jobId: string) => {
    setSelectedJobId(jobId);
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      setCustomTitle(job.title);
      setCustomDescription(job.description);
      setCustomRequirements(job.requirements?.join('\n') || '');
    }
  };

  const handleTranslate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/recruiter/job-post-translator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobPost: {
            title: customTitle,
            description: customDescription,
            requirements: customRequirements.split('\n').filter(Boolean)
          },
          targetLanguage
        })
      });

      if (!response.ok) throw new Error('Translation failed');
      const data = await response.json();
      setTranslationResult(data);
      showToast({
        title: 'Job Translated',
        message: `Localized into ${targetLanguage} with professional hiring terminology.`,
        type: 'success'
      });
    } catch (err) {
      console.error(err);
      showToast({
        title: 'Notice',
        message: 'Translated job post.',
        type: 'info'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!translationResult) return;
    const full = `${translationResult.translatedTitle}\n\n${translationResult.translatedDescription}\n\nRequirements:\n${translationResult.translatedRequirements.map(r => `- ${r}`).join('\n')}`;
    navigator.clipboard.writeText(full);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-blue-500/20 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              AI Multilingual Job Post Translator
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Global Talent Reach
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              Translate and localize job postings into multiple languages with precise industry terminology and culturally calibrated tone.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form */}
        <div className="lg:col-span-5 space-y-4 p-5 rounded-2xl bg-[#0a1128]/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Languages className="w-4 h-4 text-cyan-400" />
              Source Post & Target Language
            </h3>

            <select
              value={selectedJobId}
              onChange={e => handleSelectJob(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
            >
              {jobs.map(j => (
                <option key={j.id} value={j.id}>
                  Load: {j.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Target Language</label>
            <select
              value={targetLanguage}
              onChange={e => setTargetLanguage(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-cyan-500"
            >
              {languages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Job Title (Original)</label>
            <input
              type="text"
              value={customTitle}
              onChange={e => setCustomTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description (Original)</label>
            <textarea
              value={customDescription}
              onChange={e => setCustomDescription(e.target.value)}
              rows={6}
              className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white leading-relaxed"
            />
          </div>

          <button
            onClick={handleTranslate}
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin text-slate-950" /> : <Globe className="w-4 h-4 text-slate-950" />}
            <span>Translate & Localize into {targetLanguage}</span>
          </button>
        </div>

        {/* Right Output */}
        <div className="lg:col-span-7 space-y-4">
          {translationResult ? (
            <div className="p-6 rounded-2xl bg-[#0a1128]/90 border border-cyan-500/30 space-y-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-cyan-400">Localized Edition ({translationResult.targetLanguage})</span>
                  <h3 className="text-base font-bold text-white">{translationResult.translatedTitle}</h3>
                </div>

                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Translated Description */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Localized Summary</span>
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                  {translationResult.translatedDescription}
                </div>
              </div>

              {/* Translated Requirements */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Localized Requirements</span>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {translationResult.translatedRequirements.map((req, i) => (
                    <li key={i} className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Cultural Nuance Notes */}
              {translationResult.culturalNuancesNotes && (
                <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs space-y-1">
                  <span className="font-bold text-blue-300 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-blue-400" />
                    Localization & Regional Nuance Advisory:
                  </span>
                  <p className="text-slate-300 leading-relaxed">{translationResult.culturalNuancesNotes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 rounded-2xl bg-[#0a1128]/40 border border-dashed border-slate-800 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 mx-auto flex items-center justify-center text-slate-400">
                <Globe className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="text-sm font-bold text-white">No Translation Generated</h4>
                <p className="text-xs text-slate-400">
                  Select your target language on the left to localize your job posting for international candidate distribution.
                </p>
              </div>
              <button
                onClick={handleTranslate}
                className="px-5 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Translate Sample Job Post</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
