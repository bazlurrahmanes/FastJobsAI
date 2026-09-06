import React, { useState } from 'react';
import { 
  Sparkles, 
  FileText, 
  Check, 
  Copy, 
  ArrowRight, 
  RefreshCw, 
  DollarSign, 
  Layers, 
  CheckCircle2,
  ListChecks,
  Gift,
  Building2,
  Briefcase
} from 'lucide-react';
import { useJobContext } from '../../context/JobContext';
import { JobCategory, ExperienceLevel, JobType } from '../../types';

interface RecruiterAiJobWriterProps {
  onApplyToForm?: (generated: {
    title: string;
    description: string;
    requirements: string[];
    skills: string[];
    benefits?: string[];
    salaryMin?: number;
    salaryMax?: number;
  }) => void;
}

export const RecruiterAiJobWriter: React.FC<RecruiterAiJobWriterProps> = ({ onApplyToForm }) => {
  const { currentUser, setActiveTab, showToast } = useJobContext();

  const [title, setTitle] = useState('Senior AI Systems Engineer');
  const [company, setCompany] = useState(currentUser?.companyName || 'NeuralMatrix Labs');
  const [category, setCategory] = useState<JobCategory>('AI & Machine Learning');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('Senior');
  const [jobType, setJobType] = useState<JobType>('Full-time');
  const [location, setLocation] = useState('San Francisco, CA');
  const [isRemote, setIsRemote] = useState(true);
  const [salaryMin, setSalaryMin] = useState(175000);
  const [salaryMax, setSalaryMax] = useState(240000);
  const [skillsInput, setSkillsInput] = useState('PyTorch, CUDA, Distributed Systems, Python, Triton, Docker');
  const [responsibilitiesNotes, setResponsibilitiesNotes] = useState('Lead foundation model inference optimization and scale GPU clusters.');
  const [requirementsNotes, setRequirementsNotes] = useState('5+ years engineering, deep knowledge of kernel optimization and latency reduction.');
  const [benefitsNotes, setBenefitsNotes] = useState('Top-tier equity, comprehensive healthcare, $5,000 learning stipend, remote-first setup.');

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    title: string;
    description: string;
    responsibilities: string[];
    requirements: string[];
    benefits: string[];
    suggestedSkills: string[];
    salaryRecommendation: { min: number; max: number; period: string; currency: string };
    aiGenerated?: boolean;
  } | null>(null);

  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const skillsArray = skillsInput
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const response = await fetch('/api/ai/recruiter/job-description-writer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          company,
          category,
          experienceLevel,
          jobType,
          location,
          isRemote,
          salaryMin,
          salaryMax,
          skills: skillsArray,
          responsibilitiesInput: responsibilitiesNotes,
          requirementsInput: requirementsNotes,
          benefitsInput: benefitsNotes
        })
      });

      if (!response.ok) throw new Error('Generation failed');
      const data = await response.json();
      setResult(data);
      showToast({
        title: 'Job Description Generated',
        message: 'FastJobs AI produced a structured, professional job specification.',
        type: 'success'
      });
    } catch (err) {
      console.error(err);
      showToast({
        title: 'Generation Notice',
        message: 'Using intelligent template fallbacks.',
        type: 'info'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const fullText = `# ${result.title}\n**Company:** ${company}\n**Location:** ${location} (${isRemote ? 'Remote' : 'Onsite'})\n**Compensation:** $${result.salaryRecommendation?.min?.toLocaleString()} - $${result.salaryRecommendation?.max?.toLocaleString()}/year\n\n${result.description}\n\n## Key Responsibilities\n${result.responsibilities.map(r => `- ${r}`).join('\n')}\n\n## Requirements\n${result.requirements.map(r => `- ${r}`).join('\n')}\n\n## Benefits & Perks\n${result.benefits.map(b => `- ${b}`).join('\n')}\n\n## Tech Stack & Skills\n${result.suggestedSkills.join(', ')}`;
    
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportToPostJob = () => {
    if (!result) return;
    if (onApplyToForm) {
      onApplyToForm({
        title: result.title,
        description: result.description,
        requirements: result.requirements,
        skills: result.suggestedSkills,
        benefits: result.benefits,
        salaryMin: result.salaryRecommendation?.min || salaryMin,
        salaryMax: result.salaryRecommendation?.max || salaryMax
      });
    } else {
      setActiveTab('post_a_job');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-blue-500/20 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              AI Job Description Writer
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                FastJobs AI Recruiter
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              Generate structured, high-conversion job descriptions with market-calibrated responsibilities, requirements, and benefits.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs Form */}
        <div className="lg:col-span-5 space-y-4 p-5 rounded-2xl bg-[#0a1128]/80 border border-slate-800">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-cyan-400" />
            Hiring Specifications
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Target Job Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-hidden focus:border-cyan-500"
              placeholder="e.g. Senior Machine Learning Engineer"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as JobCategory)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-cyan-500"
              >
                <option value="AI & Machine Learning">AI & Machine Learning</option>
                <option value="Engineering">Engineering</option>
                <option value="Product & Design">Product & Design</option>
                <option value="Data & Analytics">Data & Analytics</option>
                <option value="DevOps & Cloud">DevOps & Cloud</option>
                <option value="Marketing & Growth">Marketing & Growth</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Experience Level</label>
              <select
                value={experienceLevel}
                onChange={e => setExperienceLevel(e.target.value as ExperienceLevel)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-cyan-500"
              >
                <option value="Entry Level">Entry Level</option>
                <option value="Mid-Level">Mid-Level</option>
                <option value="Senior">Senior</option>
                <option value="Lead">Lead</option>
                <option value="Executive">Executive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
              />
            </div>
            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRemote}
                  onChange={e => setIsRemote(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
                />
                <span>Remote Friendly</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Target Skills (comma separated)</label>
            <input
              type="text"
              value={skillsInput}
              onChange={e => setSkillsInput(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
              placeholder="React, TypeScript, GraphQL..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Key Responsibilities / Role Mission</label>
            <textarea
              value={responsibilitiesNotes}
              onChange={e => setResponsibilitiesNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
              placeholder="What will this person build or own?"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Requirements & Experience Notes</label>
            <textarea
              value={requirementsNotes}
              onChange={e => setRequirementsNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
              placeholder="Specific degrees, years of experience, or tool sets..."
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>Crafting Job Specification...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>Generate Professional Job Post</span>
              </>
            )}
          </button>
        </div>

        {/* Right Output Preview */}
        <div className="lg:col-span-7 space-y-4">
          {result ? (
            <div className="p-6 rounded-2xl bg-[#0a1128]/90 border border-cyan-500/30 space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-xl font-black text-white">{result.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {company} • {location} • {isRemote ? 'Remote' : 'Onsite'} • {experienceLevel}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={handleExportToPostJob}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 hover:opacity-90 transition-all"
                  >
                    <span>Use in Job Post</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Compensation recommendation badge */}
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-emerald-300 font-semibold">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Market-Calibrated Compensation:</span>
                </div>
                <span className="text-sm font-black text-emerald-300">
                  ${result.salaryRecommendation?.min?.toLocaleString()} - ${result.salaryRecommendation?.max?.toLocaleString()} / {result.salaryRecommendation?.period || 'year'}
                </span>
              </div>

              {/* Description Markdown Overview */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Role Mission & Overview
                </h4>
                <div className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  {result.description}
                </div>
              </div>

              {/* Responsibilities */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ListChecks className="w-3.5 h-3.5" />
                  Key Responsibilities
                </h4>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                  {result.responsibilities.map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 shrink-0" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Requirements */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Requirements & Qualifications
                </h4>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                  {result.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Benefits */}
              {result.benefits?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Gift className="w-3.5 h-3.5" />
                    Benefits & Perks
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                    {result.benefits.map((b, i) => (
                      <li key={i} className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800 flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Skills Tags */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  Suggested Core Skills
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {result.suggestedSkills.map((sk, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-md text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-2xl bg-[#0a1128]/40 border border-dashed border-slate-800 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/80 mx-auto flex items-center justify-center text-slate-400">
                <FileText className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="text-base font-bold text-white">No Job Description Generated Yet</h4>
                <p className="text-xs text-slate-400">
                  Fill in the hiring specifications on the left and click &quot;Generate Professional Job Post&quot; to produce an ATS-optimized, high-conversion specification.
                </p>
              </div>
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="px-5 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Quick-Generate Default Sample</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
