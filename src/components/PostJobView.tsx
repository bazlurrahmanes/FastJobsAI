import React, { useState } from 'react';
import { 
  Briefcase, 
  Building2, 
  MapPin, 
  DollarSign, 
  Sparkles, 
  Plus, 
  X, 
  CheckCircle2, 
  Send, 
  Layers, 
  FileText, 
  Lightbulb, 
  Info,
  ArrowLeft,
  Wand2
} from 'lucide-react';
import { useJobContext } from '../context/JobContext';
import { JobCategory, JobType, ExperienceLevel, Job } from '../types';
import { RecruiterAiJobWriter } from './recruiter/RecruiterAiJobWriter';

const CATEGORIES: JobCategory[] = [
  'AI & Machine Learning',
  'Engineering',
  'Product & Design',
  'Data & Analytics',
  'DevOps & Cloud',
  'Marketing & Growth',
  'Sales & Success',
  'Operations & Finance'
];

const JOB_TYPES: JobType[] = ['Full-time', 'Contract', 'Part-time', 'Internship', 'Freelance'];

const EXPERIENCE_LEVELS: ExperienceLevel[] = [
  'Entry Level',
  'Mid-Level',
  'Senior',
  'Lead',
  'Executive'
];

export const PostJobView: React.FC = () => {
  const { addJob, currentUser, setActiveTab, setSelectedJob } = useJobContext();

  const [title, setTitle] = useState('');
  const [company, setCompany] = useState(currentUser?.companyName || 'Cognitive Systems AI');
  const [companyLogo, setCompanyLogo] = useState(currentUser?.companyLogo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80');
  const [companyWebsite, setCompanyWebsite] = useState(currentUser?.companyWebsite || 'https://company.ai');
  const [location, setLocation] = useState('San Francisco, CA');
  const [isRemote, setIsRemote] = useState(true);
  const [jobType, setJobType] = useState<JobType>('Full-time');
  const [category, setCategory] = useState<JobCategory>('AI & Machine Learning');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('Senior');
  const [salaryMin, setSalaryMin] = useState(160000);
  const [salaryMax, setSalaryMax] = useState(230000);
  const [salaryPeriod, setSalaryPeriod] = useState<'year' | 'month' | 'hour'>('year');
  
  // Skills tags
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>(['PyTorch', 'Python', 'TypeScript', 'Distributed Systems']);
  
  // Rich description & requirements
  const [description, setDescription] = useState('');
  const [requirementInput, setRequirementInput] = useState('');
  const [requirements, setRequirements] = useState<string[]>([
    '4+ years of professional engineering experience in production distributed environments.',
    'Strong track record designing resilient microservices and low-latency APIs.',
    'Proven ability to collaborate across product, research, and infrastructure teams.'
  ]);

  const [applicationMethod, setApplicationMethod] = useState<'direct' | 'external' | 'email'>('direct');
  const [applicationUrl, setApplicationUrl] = useState('');

  // AI Generation state
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState('');
  const [useAiWriterMode, setUseAiWriterMode] = useState(false);

  const handleApplyAiGenerated = (generated: any) => {
    if (generated.title) setTitle(generated.title);
    if (generated.description) setDescription(generated.description);
    if (generated.requirements && Array.isArray(generated.requirements)) setRequirements(generated.requirements);
    if (generated.skills && Array.isArray(generated.skills)) setSkills(generated.skills);
    if (generated.location) setLocation(generated.location);
    if (generated.isRemote !== undefined) setIsRemote(generated.isRemote);
    if (generated.salaryMin) setSalaryMin(generated.salaryMin);
    if (generated.salaryMax) setSalaryMax(generated.salaryMax);
    if (generated.experienceLevel) setExperienceLevel(generated.experienceLevel as ExperienceLevel);
    setUseAiWriterMode(false);
    setAiSuccessMessage('AI Job Description generated and applied to form fields!');
    setTimeout(() => setAiSuccessMessage(''), 5000);
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const handleAddRequirement = () => {
    if (requirementInput.trim()) {
      setRequirements([...requirements, requirementInput.trim()]);
      setRequirementInput('');
    }
  };

  const handleRemoveRequirement = (idx: number) => {
    setRequirements(requirements.filter((_, i) => i !== idx));
  };

  // AI Auto-Generate or Enhance Job Description
  const handleAiEnhance = async () => {
    if (!title.trim()) {
      alert('Please enter a Job Title first so the AI knows what role to craft!');
      return;
    }

    setIsAiGenerating(true);
    setAiSuccessMessage('');

    try {
      const res = await fetch('/api/ai/enhance-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          company,
          category,
          experienceLevel,
          rawDescription: description,
          skills
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.description) setDescription(data.description);
        if (data.requirements && data.requirements.length > 0) setRequirements(data.requirements);
        if (data.suggestedSkills && data.suggestedSkills.length > 0) {
          // Merge unique skills
          const combined = Array.from(new Set([...skills, ...data.suggestedSkills]));
          setSkills(combined);
        }
        setAiSuccessMessage(data.aiGenerated ? 'AI enhanced the job description and requirements!' : 'Smart template populated.');
        setTimeout(() => setAiSuccessMessage(''), 4000);
      }
    } catch (e) {
      console.error('AI enhance error:', e);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !company.trim()) {
      alert('Please enter a Job Title and Company Name.');
      return;
    }

    const defaultDesc = description.trim() || `### About ${company}\nWe are building groundbreaking solutions in ${category}. Join our world-class engineering and product organization.\n\n### The Role\nAs a ${title}, you will design, build, and deploy high-performance applications that serve global customers.`;

    const newJob = addJob({
      title: title.trim(),
      company: company.trim(),
      companyLogo: companyLogo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80',
      companyWebsite: companyWebsite.trim(),
      location: location.trim() || 'Remote',
      isRemote,
      jobType,
      category,
      experienceLevel,
      salaryMin: Number(salaryMin) || 120000,
      salaryMax: Number(salaryMax) || 180000,
      salaryPeriod,
      currency: '$',
      skills: skills.length > 0 ? skills : ['Engineering', 'System Architecture'],
      description: defaultDesc,
      requirements: requirements.length > 0 ? requirements : ['3+ years relevant experience.'],
      benefits: [
        'Top-tier competitive compensation and equity',
        'Comprehensive healthcare, dental & vision',
        'Flexible remote workspace setup stipend'
      ],
      applicationMethod,
      applicationUrl: applicationMethod !== 'direct' ? applicationUrl : undefined,
      employerId: currentUser?.id || 'emp-techsphere',
      featured: true
    });

    // Open published job modal or navigate to All Jobs
    setSelectedJob(newJob);
    setActiveTab('all_jobs');
  };

  return (
    <div className="min-h-screen bg-[#040816] text-slate-100 py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      
      {/* Header Bar */}
      <div className="mb-8 flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <button
            onClick={() => setActiveTab('all_jobs')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Marketplace
          </button>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Plus className="w-7 h-7 text-cyan-400" />
            Post a New Job Opening
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Publish your opening to top engineering, AI, and design talent worldwide.
          </p>
        </div>

        {/* AI Helper Quick Trigger */}
        <button
          type="button"
          onClick={handleAiEnhance}
          disabled={isAiGenerating}
          className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-600/20 hover:from-cyan-500/30 hover:to-blue-600/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition-all shadow-sm"
        >
          <Sparkles className={`w-4 h-4 ${isAiGenerating ? 'animate-spin' : ''}`} />
          <span>{isAiGenerating ? 'Generating with AI...' : 'AI Auto-Craft'}</span>
        </button>
      </div>

      {aiSuccessMessage && (
        <div className="mb-6 p-3 rounded-xl bg-cyan-950/80 border border-cyan-400/50 text-cyan-200 text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{aiSuccessMessage}</span>
        </div>
      )}

      {/* Mode Switcher */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 mb-6">
        <button
          type="button"
          onClick={() => setUseAiWriterMode(false)}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            !useAiWriterMode
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Standard Job Form</span>
        </button>

        <button
          type="button"
          onClick={() => setUseAiWriterMode(true)}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            useAiWriterMode
              ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-md shadow-cyan-500/20 font-black'
              : 'text-cyan-300 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Job Description Writer (Full Spec)</span>
        </button>
      </div>

      {useAiWriterMode ? (
        <div className="space-y-6">
          <RecruiterAiJobWriter onApplyToForm={handleApplyAiGenerated} />
        </div>
      ) : (
        /* Main Form */
        <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Section 1: Basic Job Info */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#0a1128]/80 border border-cyan-500/20 backdrop-blur-md space-y-6">
          <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2 text-cyan-400">
            <Briefcase className="w-4 h-4" />
            1. Role Basics & Identity
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Job Title */}
            <div>
              <label htmlFor="post-job-title" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Job Title <span className="text-rose-400">*</span>
              </label>
              <input
                id="post-job-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Machine Learning Engineer"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none"
              />
            </div>

            {/* Company Name */}
            <div>
              <label htmlFor="post-company-name" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Company Name <span className="text-rose-400">*</span>
              </label>
              <input
                id="post-company-name"
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Acme AI Technologies"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none"
              />
            </div>

            {/* Job Category */}
            <div>
              <label htmlFor="post-job-category" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Job Category <span className="text-rose-400">*</span>
              </label>
              <select
                id="post-job-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as JobCategory)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:border-cyan-400 outline-none cursor-pointer"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat} className="bg-[#0a1128] text-white">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Experience Level */}
            <div>
              <label htmlFor="post-experience-level" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Experience Level <span className="text-rose-400">*</span>
              </label>
              <select
                id="post-experience-level"
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:border-cyan-400 outline-none cursor-pointer"
              >
                {EXPERIENCE_LEVELS.map(lvl => (
                  <option key={lvl} value={lvl} className="bg-[#0a1128] text-white">
                    {lvl}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Location, Type & Compensation */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#0a1128]/80 border border-cyan-500/20 backdrop-blur-md space-y-6">
          <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2 text-cyan-400">
            <DollarSign className="w-4 h-4" />
            2. Location, Type & Compensation
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Location & Remote toggle */}
            <div>
              <label htmlFor="post-location" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Location <span className="text-rose-400">*</span>
              </label>
              <input
                id="post-location"
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. San Francisco, CA or Remote"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-cyan-400 outline-none"
              />
              <label className="mt-2.5 flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRemote}
                  onChange={(e) => setIsRemote(e.target.checked)}
                  className="rounded text-cyan-500 bg-slate-800 border-slate-700 focus:ring-cyan-400"
                />
                <span>This is a 100% Remote / Hybrid eligible position</span>
              </label>
            </div>

            {/* Employment Type */}
            <div>
              <label htmlFor="post-job-type" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Job Type <span className="text-rose-400">*</span>
              </label>
              <select
                id="post-job-type"
                value={jobType}
                onChange={(e) => setJobType(e.target.value as JobType)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:border-cyan-400 outline-none cursor-pointer"
              >
                {JOB_TYPES.map(t => (
                  <option key={t} value={t} className="bg-[#0a1128] text-white">
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Salary Min & Max */}
            <div>
              <label htmlFor="post-salary-min" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Minimum Annual Salary ($ USD)
              </label>
              <input
                id="post-salary-min"
                type="number"
                value={salaryMin}
                onChange={(e) => setSalaryMin(Number(e.target.value))}
                placeholder="140000"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:border-cyan-400 outline-none"
              />
            </div>

            <div>
              <label htmlFor="post-salary-max" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Maximum Annual Salary ($ USD)
              </label>
              <input
                id="post-salary-max"
                type="number"
                value={salaryMax}
                onChange={(e) => setSalaryMax(Number(e.target.value))}
                placeholder="210000"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:border-cyan-400 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Skills & Competencies */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#0a1128]/80 border border-cyan-500/20 backdrop-blur-md space-y-4">
          <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2 text-cyan-400">
            <Sparkles className="w-4 h-4" />
            3. Skills & Technology Tags
          </h2>

          <div className="flex gap-2">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
              placeholder="Add required skill (e.g. PyTorch, React, Kubernetes)..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-cyan-400 outline-none"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-sm border border-slate-700 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add Skill
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {skills.map(skill => (
              <span
                key={skill}
                className="px-3 py-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center gap-2"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Section 4: Description & Requirements */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#0a1128]/80 border border-cyan-500/20 backdrop-blur-md space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2 text-cyan-400">
              <FileText className="w-4 h-4" />
              4. Job Description & Requirements
            </h2>
            <button
              type="button"
              onClick={handleAiEnhance}
              disabled={isAiGenerating}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isAiGenerating ? 'animate-spin' : ''}`} />
              Auto-Generate with AI
            </button>
          </div>

          {/* Description Textarea */}
          <div>
            <label htmlFor="post-job-description" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Job Description (Markdown supported)
            </label>
            <textarea
              id="post-job-description"
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the company mission, what the role entails, and day-to-day impact..."
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-200 placeholder-slate-500 focus:border-cyan-400 outline-none leading-relaxed"
            />
          </div>

          {/* Requirements Bullet List */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-300">
              Role Requirements (Add bullet points)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={requirementInput}
                onChange={(e) => setRequirementInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddRequirement();
                  }
                }}
                placeholder="e.g. 5+ years building distributed ML systems..."
                className="flex-1 px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:border-cyan-400 outline-none"
              />
              <button
                type="button"
                onClick={handleAddRequirement}
                className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700"
              >
                Add
              </button>
            </div>

            <ul className="space-y-2 pt-1">
              {requirements.map((req, idx) => (
                <li key={idx} className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>{req}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveRequirement(idx)}
                    className="text-slate-500 hover:text-rose-400"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Section 5: Application Method */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#0a1128]/80 border border-cyan-500/20 backdrop-blur-md space-y-4">
          <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2 text-cyan-400">
            <Send className="w-4 h-4" />
            5. Application Method
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'direct', label: '1-Click FastJobs Application', desc: 'Candidates apply directly through FastJobs' },
              { id: 'external', label: 'External Website URL', desc: 'Redirect candidates to your career portal' },
              { id: 'email', label: 'Direct Recruiter Email', desc: 'Receive resumes straight to your inbox' }
            ].map(method => (
              <button
                key={method.id}
                type="button"
                onClick={() => setApplicationMethod(method.id as any)}
                className={`p-3.5 rounded-xl text-left border transition-all ${
                  applicationMethod === method.id
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-bold text-xs">{method.label}</div>
                <div className="text-[11px] text-slate-400 mt-1">{method.desc}</div>
              </button>
            ))}
          </div>

          {applicationMethod !== 'direct' && (
            <div className="pt-2">
              <label htmlFor="post-application-link" className="block text-xs font-semibold text-slate-300 mb-1.5">
                {applicationMethod === 'external' ? 'External Application URL' : 'Recruiting Email Address'}
              </label>
              <input
                id="post-application-link"
                type="text"
                value={applicationUrl}
                onChange={(e) => setApplicationUrl(e.target.value)}
                placeholder={applicationMethod === 'external' ? 'https://jobs.lever.co/company/role' : 'careers@company.ai'}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-cyan-400 outline-none"
              />
            </div>
          )}
        </div>

        {/* Publish Button Bar */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={() => setActiveTab('all_jobs')}
            className="px-6 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-sm font-semibold hover:text-white"
          >
            Cancel
          </button>

          <button
            id="publish-job-submit-btn"
            type="submit"
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:from-cyan-300 hover:via-blue-400 hover:to-indigo-500 text-slate-950 font-extrabold text-base shadow-xl shadow-cyan-500/30 transition-all flex items-center gap-2 cursor-pointer active:scale-98"
          >
            <Send className="w-5 h-5 text-slate-950" />
            <span>Publish Job Opening</span>
          </button>
        </div>

      </form>
      )}

    </div>
  );
};
