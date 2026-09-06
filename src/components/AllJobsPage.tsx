import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  Filter, 
  DollarSign, 
  Briefcase, 
  Sparkles, 
  Bookmark, 
  Clock, 
  Building2, 
  SlidersHorizontal, 
  X, 
  Check, 
  ChevronRight, 
  ArrowUpDown, 
  Flame, 
  RotateCcw,
  Zap,
  TrendingUp,
  BadgePercent,
  ShieldCheck,
  Wand2
} from 'lucide-react';
import { useJobContext } from '../context/JobContext';
import { Job, JobCategory, JobType, ExperienceLevel } from '../types';
import { AiScamCheckModal } from './AiScamCheckModal';
import { AiMatchModal } from './AiMatchModal';
import { EmptyCategoryPlaceholder } from './EmptyCategoryPlaceholder';

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

const JOB_TYPES: JobType[] = ['Full-time', 'Contract', 'Part-time', 'Internship'];

const EXPERIENCE_LEVELS: ExperienceLevel[] = [
  'Entry Level',
  'Mid-Level',
  'Senior',
  'Lead',
  'Executive'
];

export interface SalaryBracket {
  id: string;
  label: string;
  min: number;
  max: number;
  badge?: string;
  sublabel: string;
}

const SALARY_BRACKETS: SalaryBracket[] = [
  { id: 'all', label: 'All Salaries', min: 0, max: 500000, sublabel: 'Any range' },
  { id: 'under_100k', label: '< $100k', min: 0, max: 100000, sublabel: 'Entry Level' },
  { id: '100k_150k', label: '$100k – $150k', min: 100000, max: 150000, badge: 'Popular', sublabel: 'Mid-Level' },
  { id: '150k_200k', label: '$150k – $200k', min: 150000, max: 200000, badge: 'Senior', sublabel: 'Senior Tier' },
  { id: '200k_250k', label: '$200k – $250k', min: 200000, max: 250000, badge: 'Staff', sublabel: 'Staff / Lead' },
  { id: '250k_plus', label: '$250k+', min: 250000, max: 500000, badge: 'Exec/AI', sublabel: 'Principal & Exec' },
];

export const AllJobsPage: React.FC = () => {
  const {
    jobs,
    filteredJobs,
    filters,
    setSearchKeyword,
    setSearchLocation,
    toggleCategoryFilter,
    toggleJobTypeFilter,
    toggleExperienceFilter,
    setRemoteOnly,
    setMinSalary,
    setMaxSalary,
    setSalaryRange,
    setSortBy,
    resetFilters,
    setSelectedJob,
    setApplyModalJob,
    quickApplyToJob,
    setAuthModalOpen,
    toggleSaveJob,
    isJobSaved,
    currentUser,
    hasAppliedToJob
  } = useJobContext();

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [showCustomSalarySlider, setShowCustomSalarySlider] = useState(false);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);

  // AI Smart Natural Language Search State
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState('');
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiSearchSummary, setAiSearchSummary] = useState<string | null>(null);

  // On-demand Modals
  const [scamCheckJob, setScamCheckJob] = useState<Job | null>(null);
  const [matchCheckJob, setMatchCheckJob] = useState<Job | null>(null);

  const handleSmartAiSearch = async (queryText?: string) => {
    const queryToUse = queryText || naturalLanguageQuery;
    if (!queryToUse.trim()) return;
    setIsAiSearching(true);
    try {
      const res = await fetch('/api/ai/smart-job-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryToUse,
          currentFilters: filters
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.explanation) {
          setAiSearchSummary(data.explanation);
        }
        if (data.filters) {
          if (data.filters.keyword) setSearchKeyword(data.filters.keyword);
          if (data.filters.location) setSearchLocation(data.filters.location);
          if (typeof data.filters.remoteOnly === 'boolean') setRemoteOnly(data.filters.remoteOnly);
          if (data.filters.minSalary || data.filters.maxSalary) {
            setSalaryRange(data.filters.minSalary || 0, data.filters.maxSalary || 500000);
          }
          if (data.filters.categories && Array.isArray(data.filters.categories)) {
            data.filters.categories.forEach((cat: string) => {
              if (!filters.categories.includes(cat as any)) {
                toggleCategoryFilter(cat as any);
              }
            });
          }
        }
      }
    } catch (e) {
      console.error('Error in smart AI search:', e);
    } finally {
      setIsAiSearching(false);
    }
  };

  const handleQuickApply = async (e: React.MouseEvent, job: Job) => {
    e.stopPropagation();
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }
    setApplyingJobId(job.id);
    try {
      await quickApplyToJob(job.id);
    } finally {
      setApplyingJobId(null);
    }
  };

  // Check if a salary filter is currently active
  const hasSalaryFilter = filters.minSalary > 0 || (filters.maxSalary < 500000 && filters.maxSalary > 0);

  // Check if a specific bracket matches active filters
  const isBracketActive = (bracket: SalaryBracket) => {
    if (bracket.id === 'all') {
      return !hasSalaryFilter;
    }
    return filters.minSalary === bracket.min && filters.maxSalary === bracket.max;
  };

  // Toggle compensation bracket
  const toggleSalaryBracket = (bracket: SalaryBracket) => {
    if (isBracketActive(bracket)) {
      setSalaryRange(0, 500000);
    } else {
      setSalaryRange(bracket.min, bracket.max);
    }
  };

  // Count matching jobs for a bracket given other active filters
  const getBracketJobCount = (bracket: SalaryBracket) => {
    return jobs.filter(job => {
      // Keyword match
      if (filters.keyword.trim()) {
        const q = filters.keyword.toLowerCase().trim();
        const matchTitle = job.title.toLowerCase().includes(q);
        const matchCompany = job.company.toLowerCase().includes(q);
        const matchSkills = job.skills.some(s => s.toLowerCase().includes(q));
        const matchCategory = job.category.toLowerCase().includes(q);
        if (!matchTitle && !matchCompany && !matchSkills && !matchCategory) return false;
      }
      // Location
      if (filters.location.trim()) {
        const loc = filters.location.toLowerCase().trim();
        if (!job.location.toLowerCase().includes(loc) && !(loc === 'remote' && job.isRemote)) return false;
      }
      if (filters.remoteOnly && !job.isRemote) return false;
      if (filters.categories.length > 0 && !filters.categories.includes(job.category)) return false;
      if (filters.jobTypes.length > 0 && !filters.jobTypes.includes(job.jobType)) return false;
      if (filters.experienceLevels.length > 0 && !filters.experienceLevels.includes(job.experienceLevel)) return false;

      // Salary bracket match
      if (bracket.id === 'all') return true;
      if (job.salaryPeriod === 'year') {
        if (bracket.min > 0 && job.salaryMax < bracket.min) return false;
        if (bracket.max < 500000 && job.salaryMin > bracket.max) return false;
      } else if (job.salaryPeriod === 'hour') {
        const annualMin = job.salaryMin * 2080;
        const annualMax = job.salaryMax * 2080;
        if (bracket.min > 0 && annualMax < bracket.min) return false;
        if (bracket.max < 500000 && annualMin > bracket.max) return false;
      }
      return true;
    }).length;
  };

  // Active filter count
  const activeFilterCount = 
    filters.categories.length + 
    filters.jobTypes.length + 
    filters.experienceLevels.length + 
    (filters.remoteOnly ? 1 : 0) + 
    (hasSalaryFilter ? 1 : 0) +
    (filters.keyword ? 1 : 0) +
    (filters.location ? 1 : 0);

  // Helper to format active salary label
  const getActiveSalaryLabel = () => {
    const matched = SALARY_BRACKETS.find(b => b.id !== 'all' && b.min === filters.minSalary && b.max === filters.maxSalary);
    if (matched) return matched.label;
    if (filters.minSalary > 0 && filters.maxSalary < 500000) {
      return `$${Math.round(filters.minSalary / 1000)}k – $${Math.round(filters.maxSalary / 1000)}k/yr`;
    }
    if (filters.minSalary > 0) {
      return `$${Math.round(filters.minSalary / 1000)}k+/yr`;
    }
    if (filters.maxSalary < 500000) {
      return `< $${Math.round(filters.maxSalary / 1000)}k/yr`;
    }
    return 'All Salaries';
  };

  const handleClearCategories = (cat?: JobCategory) => {
    if (cat) {
      toggleCategoryFilter(cat);
    } else {
      [...filters.categories].forEach(c => toggleCategoryFilter(c));
    }
  };

  const handleSelectCategory = (newCat: JobCategory) => {
    [...filters.categories].forEach(c => {
      if (c !== newCat) toggleCategoryFilter(c);
    });
    if (!filters.categories.includes(newCat)) {
      toggleCategoryFilter(newCat);
    }
  };

  const hasOtherFilters = Boolean(
    filters.keyword.trim() || 
    filters.location.trim() || 
    filters.jobTypes.length > 0 || 
    filters.experienceLevels.length > 0 || 
    filters.remoteOnly || 
    filters.minSalary > 0 || 
    filters.maxSalary < 500000
  );

  return (
    <div className="min-h-screen bg-[#040816] text-slate-100 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* Header & Quick Search Bar */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-extrabold text-white tracking-tight">
                Explore Tech & AI Opportunities
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 text-xs font-semibold border border-cyan-500/30">
                {filteredJobs.length} Jobs
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              Browse curated high-impact positions with intelligent AI compatibility ratings and compensation brackets.
            </p>
          </div>

          {/* Sort & Mobile filter trigger */}
          <div className="flex items-center gap-3">
            {/* Mobile Filter Button */}
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-medium text-slate-200 flex items-center gap-2 hover:border-cyan-400 cursor-pointer"
            >
              <Filter className="w-4 h-4 text-cyan-400" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 text-xs font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm">
              <ArrowUpDown className="w-4 h-4 text-slate-400" />
              <label htmlFor="job-sort-select" className="text-xs text-slate-400">Sort by:</label>
              <select
                id="job-sort-select"
                value={filters.sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-slate-200 font-medium outline-none cursor-pointer text-xs sm:text-sm"
              >
                <option value="newest" className="bg-[#0a1128] text-white">Newest First</option>
                <option value="match_score" className="bg-[#0a1128] text-white">Highest AI Match</option>
                <option value="salary_high" className="bg-[#0a1128] text-white">Highest Salary</option>
                <option value="featured" className="bg-[#0a1128] text-white">Featured Roles</option>
              </select>
            </div>
          </div>
        </div>

        {/* AI Smart Natural Language Search Prompt Box */}
        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-cyan-950/70 via-[#0a1128] to-blue-950/70 border border-cyan-500/30 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              AI Feature #8 • Smart Conversational Search
            </span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">Describe what you want in plain English</span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Wand2 className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={naturalLanguageQuery}
                onChange={(e) => setNaturalLanguageQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSmartAiSearch()}
                placeholder="e.g. 'Show remote Senior React/AI roles paying over $170k with flexible hours'..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/90 border border-cyan-500/40 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-hidden focus:border-cyan-300"
              />
            </div>

            <button
              onClick={() => handleSmartAiSearch()}
              disabled={isAiSearching}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 cursor-pointer"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isAiSearching ? 'animate-spin' : ''}`} />
              <span>{isAiSearching ? 'Parsing...' : 'AI Search'}</span>
            </button>
          </div>

          {/* Quick Smart Search Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
            <span className="text-slate-400 text-[10px] uppercase font-bold mr-1">Try:</span>
            {[
              'Remote Senior AI & PyTorch $180k+',
              'Engineering Lead with React & Cloud',
              'Full-time DevOps over $150k',
              'San Francisco Executive Roles'
            ].map((exampleText, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setNaturalLanguageQuery(exampleText);
                  handleSmartAiSearch(exampleText);
                }}
                className="px-2.5 py-0.5 rounded-lg bg-slate-900 hover:bg-cyan-950/80 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 text-[11px] transition-colors cursor-pointer"
              >
                "{exampleText}"
              </button>
            ))}
          </div>

          {aiSearchSummary && (
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyan-300 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span><strong>AI Applied:</strong> {aiSearchSummary}</span>
              </div>
              <button
                onClick={() => setAiSearchSummary(null)}
                className="text-slate-400 hover:text-white text-[10px]"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Live Search & Filter Strip */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 lg:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filters.keyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Filter by title, keywords, skill (e.g. React, PyTorch, Senior)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-slate-100 placeholder-slate-400 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none"
            />
            {filters.keyword && (
              <button
                onClick={() => setSearchKeyword('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="sm:col-span-4 lg:col-span-4 relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filters.location}
              onChange={(e) => setSearchLocation(e.target.value)}
              placeholder="City or Remote..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-slate-100 placeholder-slate-400 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none"
            />
            {filters.location && (
              <button
                onClick={() => setSearchLocation('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="sm:col-span-2 lg:col-span-2 flex items-center">
            <label className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-semibold text-slate-300 cursor-pointer hover:border-cyan-500/50 select-none">
              <input
                type="checkbox"
                checked={filters.remoteOnly}
                onChange={(e) => setRemoteOnly(e.target.checked)}
                className="rounded text-cyan-500 focus:ring-cyan-400 bg-slate-800 border-slate-700"
              />
              <span>Remote Only</span>
            </label>
          </div>
        </div>

        {/* Quick Compensation Brackets Strip */}
        <div className="mt-3.5 p-3 rounded-2xl bg-[#0a1128]/80 border border-cyan-500/20 backdrop-blur-md">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Salary Brackets
              </span>
              <span className="hidden sm:inline text-[11px] text-slate-400">
                • Toggle specific compensation brackets
              </span>
            </div>

            {hasSalaryFilter && (
              <button
                onClick={() => setSalaryRange(0, 500000)}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to All</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {SALARY_BRACKETS.map(bracket => {
              const active = isBracketActive(bracket);
              const count = getBracketJobCount(bracket);

              return (
                <button
                  key={bracket.id}
                  type="button"
                  id={`salary-bracket-quick-${bracket.id}`}
                  onClick={() => toggleSalaryBracket(bracket)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    active
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/25 ring-2 ring-emerald-400 font-bold scale-[1.02]'
                      : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/40'
                  }`}
                  title={`${bracket.label}: ${bracket.sublabel}`}
                >
                  <span>{bracket.label}</span>
                  {bracket.badge && !active && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                      {bracket.badge}
                    </span>
                  )}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    active 
                      ? 'bg-slate-950/30 text-slate-950 font-bold' 
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeFilterCount > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 text-xs">
            <span className="text-slate-400 font-medium">Active filters:</span>
            {filters.keyword && (
              <span className="px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 flex items-center gap-1.5">
                Keyword: {filters.keyword}
                <button onClick={() => setSearchKeyword('')} className="hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
              </span>
            )}
            {filters.location && (
              <span className="px-2.5 py-1 rounded-lg bg-blue-950/80 border border-blue-500/30 text-blue-300 flex items-center gap-1.5">
                Location: {filters.location}
                <button onClick={() => setSearchLocation('')} className="hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
              </span>
            )}
            {filters.categories.map(cat => (
              <span key={cat} className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 flex items-center gap-1.5">
                {cat}
                <button onClick={() => toggleCategoryFilter(cat)} className="hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
              </span>
            ))}
            {filters.jobTypes.map(type => (
              <span key={type} className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 flex items-center gap-1.5">
                {type}
                <button onClick={() => toggleJobTypeFilter(type)} className="hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
              </span>
            ))}
            {filters.experienceLevels.map(lvl => (
              <span key={lvl} className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 flex items-center gap-1.5">
                {lvl}
                <button onClick={() => toggleExperienceFilter(lvl)} className="hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
              </span>
            ))}
            {hasSalaryFilter && (
              <span className="px-2.5 py-1 rounded-lg bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 flex items-center gap-1.5 font-semibold shadow-xs">
                <DollarSign className="w-3 h-3" />
                Salary: {getActiveSalaryLabel()}
                <button onClick={() => setSalaryRange(0, 500000)} className="hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
              </span>
            )}
            <button
              onClick={resetFilters}
              className="text-xs text-rose-400 hover:text-rose-300 underline font-medium ml-2 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset all
            </button>
          </div>
        )}
      </div>

      {/* Main Content Layout: Sidebar Filters + Job List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Desktop Sidebar Filter Panel */}
        <aside className="hidden lg:block lg:col-span-3 space-y-6">
          <div className="p-5 rounded-2xl bg-[#0a1128]/70 border border-cyan-500/15 backdrop-blur-md space-y-6 sticky top-24">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-white text-sm">Filter Jobs</h3>
              </div>
              {activeFilterCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Salary Range & Compensation Brackets Section */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  Salary Range
                </label>
                <span className="text-[11px] font-bold text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/20">
                  {getActiveSalaryLabel()}
                </span>
              </div>

              {/* Compensation Brackets List */}
              <div className="space-y-1.5">
                {SALARY_BRACKETS.map(bracket => {
                  const active = isBracketActive(bracket);
                  const count = getBracketJobCount(bracket);

                  return (
                    <button
                      key={bracket.id}
                      type="button"
                      id={`sidebar-salary-bracket-${bracket.id}`}
                      onClick={() => toggleSalaryBracket(bracket)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        active
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                      }`}
                    >
                      <div className="flex flex-col text-left min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-semibold ${active ? 'text-emerald-300' : 'text-slate-200'}`}>
                            {bracket.label}
                          </span>
                          {bracket.badge && (
                            <span className="px-1 py-0.2 rounded text-[9px] font-extrabold uppercase bg-slate-800 text-emerald-400 border border-emerald-500/30">
                              {bracket.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 truncate">
                          {bracket.sublabel}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          active ? 'bg-emerald-900/80 text-emerald-300 font-bold' : 'bg-slate-800/80 text-slate-400'
                        }`}>
                          {count}
                        </span>
                        {active && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom Range Slider Toggle & Control */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/60">
                <button
                  type="button"
                  onClick={() => setShowCustomSalarySlider(!showCustomSalarySlider)}
                  className="w-full text-[11px] text-slate-400 hover:text-cyan-300 flex items-center justify-between py-1 cursor-pointer transition-colors"
                >
                  <span>Custom Minimum Slider</span>
                  <span className="text-[10px] font-bold text-cyan-400">
                    {showCustomSalarySlider ? 'Hide' : 'Tune'}
                  </span>
                </button>

                {showCustomSalarySlider && (
                  <div className="mt-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 text-[11px]">Min Annual:</span>
                      <span className="font-bold text-emerald-400">
                        {filters.minSalary === 0 ? 'Any' : `$${Math.round(filters.minSalary / 1000)}k+`}
                      </span>
                    </div>
                    <input
                      id="min-salary-slider"
                      type="range"
                      min="0"
                      max="300000"
                      step="10000"
                      value={filters.minSalary}
                      onChange={(e) => setMinSalary(Number(e.target.value))}
                      className="w-full accent-emerald-400 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>$0</span>
                      <span>$150k</span>
                      <span>$300k+</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Category Filter */}
            <div className="border-t border-slate-800/80 pt-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                Job Category
              </label>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {CATEGORIES.map(category => {
                  const checked = filters.categories.includes(category);
                  const activeCount = jobs.filter(j => j.category === category && (j.status === 'active' || !j.status)).length;
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => toggleCategoryFilter(category)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        checked
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                      }`}
                    >
                      <span className="truncate">{category}</span>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          checked
                            ? 'bg-cyan-500/30 text-cyan-200 font-bold'
                            : activeCount > 0
                              ? 'bg-slate-800 text-slate-400'
                              : 'bg-slate-900/60 text-slate-500'
                        }`}>
                          {activeCount}
                        </span>
                        {checked && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Job Type */}
            <div className="border-t border-slate-800/80 pt-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                Employment Type
              </label>
              <div className="space-y-1.5">
                {JOB_TYPES.map(type => {
                  const checked = filters.jobTypes.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleJobTypeFilter(type)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        checked
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                      }`}
                    >
                      <span>{type}</span>
                      {checked && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Experience Level */}
            <div className="border-t border-slate-800/80 pt-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                Experience Level
              </label>
              <div className="space-y-1.5">
                {EXPERIENCE_LEVELS.map(level => {
                  const checked = filters.experienceLevels.includes(level);
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => toggleExperienceFilter(level)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        checked
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                      }`}
                    >
                      <span>{level}</span>
                      {checked && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </aside>

        {/* Main Job Listings Stream */}
        <main className="lg:col-span-9 space-y-4">
          
          {/* Quick Apply Ready Notification Banner for Registered Candidate */}
          {currentUser && currentUser.role === 'job_seeker' && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-blue-950/40 to-indigo-950/60 border border-cyan-500/30 backdrop-blur-md flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-white block truncate">
                    1-Click Quick Apply is Active for <span className="text-cyan-300">{currentUser.name}</span>
                  </span>
                  <span className="text-slate-400 text-[11px] block truncate">
                    Saved Profile & Primary Resume ({currentUser.resumeFileName || 'Alex_Chen_Resume_AI_Engineer_2026.pdf'}) will submit instantly with 1 click.
                  </span>
                </div>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-[10px] font-bold shrink-0">
                Verified Candidate
              </span>
            </div>
          )}

          {filteredJobs.length === 0 ? (
            filters.categories.length > 0 ? (
              <EmptyCategoryPlaceholder
                selectedCategories={filters.categories}
                onClearCategory={handleClearCategories}
                onSelectCategory={handleSelectCategory}
                onResetAllFilters={resetFilters}
                hasOtherFilters={hasOtherFilters}
              />
            ) : (
              /* General Empty State */
              <div className="text-center py-16 px-6 rounded-3xl bg-[#0a1128]/50 border border-slate-800 backdrop-blur-md">
                <div className="w-16 h-16 rounded-2xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-cyan-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  No matching jobs found
                </h3>
                <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
                  We couldn’t find any roles matching your current search parameters or compensation bracket. Try adjusting your salary filter or keywords.
                </p>
                <button
                  onClick={resetFilters}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
                >
                  Reset Search & Salary Filters
                </button>
              </div>
            )
          ) : (
            filteredJobs.map(job => {
              const saved = isJobSaved(job.id);
              const applied = hasAppliedToJob(job.id);

              return (
                <div
                  key={job.id}
                  id={`job-card-${job.id}`}
                  className="group relative p-5 sm:p-6 rounded-2xl bg-[#0a1128]/70 hover:bg-[#0f172a]/90 border border-slate-800/80 hover:border-cyan-500/40 backdrop-blur-md shadow-lg transition-all duration-200"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    
                    {/* Company Logo & Details */}
                    <div className="flex items-start gap-4">
                      <img
                        src={job.companyLogo}
                        alt={job.company}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover ring-1 ring-slate-700/60 shrink-0 bg-slate-900"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            {job.company}
                          </span>

                          {job.featured && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                              <Flame className="w-3 h-3 text-amber-400" />
                              Featured
                            </span>
                          )}

                          {job.isRemote && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              Remote
                            </span>
                          )}

                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {job.postedAt}
                          </span>
                        </div>

                        <h2 
                          onClick={() => setSelectedJob(job)}
                          className="text-lg sm:text-xl font-bold text-white group-hover:text-cyan-300 cursor-pointer transition-colors"
                        >
                          {job.title}
                        </h2>

                        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                            {job.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                            {job.jobType}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                            {job.experienceLevel}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Action & Compensation Highlights */}
                    <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-3 shrink-0">
                      <div className="text-left sm:text-right">
                        <div className="text-base sm:text-lg font-extrabold text-emerald-400 flex items-center sm:justify-end gap-1">
                          <span>${Math.round(job.salaryMin / 1000)}k – ${Math.round(job.salaryMax / 1000)}k</span>
                          <span className="text-xs font-normal text-slate-400">/{job.salaryPeriod === 'hour' ? 'hr' : 'yr'}</span>
                        </div>
                        {job.matchScore && (
                          <div className="mt-0.5 flex items-center sm:justify-end gap-1 text-xs font-semibold text-cyan-400">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{job.matchScore}% AI Match</span>
                          </div>
                        )}
                      </div>

                      {/* Bookmark Icon */}
                      <button
                        onClick={() => toggleSaveJob(job.id)}
                        className={`p-2 rounded-xl border transition-all cursor-pointer ${
                          saved 
                            ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300' 
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                        }`}
                        title={saved ? 'Saved job' : 'Save job'}
                      >
                        <Bookmark className={`w-4 h-4 ${saved ? 'fill-cyan-400' : ''}`} />
                      </button>
                    </div>

                  </div>

                  {/* Skills tags preview */}
                  <div className="mt-4 flex flex-wrap items-center gap-1.5">
                    {job.skills.map(skill => (
                      <span
                        key={skill}
                        onClick={() => setSearchKeyword(skill)}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-900/90 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/30 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* Bottom Strip: Description excerpt & CTA buttons */}
                  <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <p className="text-slate-400 line-clamp-1 max-w-xl">
                      {job.description.replace(/###|\*\*/g, '').slice(0, 140)}...
                    </p>

                    <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setScamCheckJob(job);
                        }}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
                        title="AI Job Scam & Safety Evaluation"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                        <span className="hidden sm:inline text-[11px]">Safety Check</span>
                      </button>

                      <button
                        onClick={() => setSelectedJob(job)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        View Details
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      {applied ? (
                        <span className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 flex items-center gap-1.5 shadow-xs">
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Applied</span>
                        </span>
                      ) : (
                        <button
                          id={`quick-apply-btn-${job.id}`}
                          disabled={applyingJobId === job.id}
                          onClick={(e) => handleQuickApply(e, job)}
                          className="px-4 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 disabled:opacity-75 shadow-md shadow-cyan-500/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                          title={currentUser ? `1-Click Quick Apply with ${currentUser.name}'s profile` : 'Sign in to 1-Click Quick Apply'}
                        >
                          {applyingJobId === job.id ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                              <span>Applying...</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                              <span>Quick Apply</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                  </div>

                </div>
              );
            })
          )}

        </main>

      </div>

      {/* Mobile Filter Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#0a1128] border border-cyan-500/30 p-6 space-y-6 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
                Filter Job Openings
              </h3>
              <button onClick={() => setMobileFilterOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Salary Range & Brackets in Mobile Drawer */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold uppercase text-slate-300 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  Salary Compensation Bracket
                </label>
                <span className="text-[11px] font-bold text-emerald-400">
                  {getActiveSalaryLabel()}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {SALARY_BRACKETS.map(b => {
                  const active = isBracketActive(b);
                  const count = getBracketJobCount(b);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => toggleSalaryBracket(b)}
                      className={`p-2.5 rounded-xl text-xs text-left transition-all cursor-pointer flex flex-col justify-between ${
                        active 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs' 
                          : 'bg-slate-900 text-slate-300 border border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold">{b.label}</span>
                        {active && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                        <span>{b.sublabel}</span>
                        <span className="font-semibold text-slate-300">({count})</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Category</label>
              <div className="grid grid-cols-2 gap-1.5">
                {CATEGORIES.map(c => {
                  const activeCount = jobs.filter(j => j.category === c && (j.status === 'active' || !j.status)).length;
                  const isChecked = filters.categories.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleCategoryFilter(c)}
                      className={`p-2 rounded-lg text-xs text-left cursor-pointer flex items-center justify-between gap-1 transition-all ${
                        isChecked 
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="truncate">{c}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full shrink-0 ${
                        isChecked
                          ? 'bg-cyan-500/30 text-cyan-200 font-bold'
                          : activeCount > 0
                            ? 'bg-slate-800 text-slate-400'
                            : 'bg-slate-950/60 text-slate-600'
                      }`}>
                        {activeCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Employment Type */}
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Job Type</label>
              <div className="grid grid-cols-2 gap-1.5">
                {JOB_TYPES.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleJobTypeFilter(t)}
                    className={`p-2 rounded-lg text-xs text-left cursor-pointer ${
                      filters.jobTypes.includes(t) ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Experience Level */}
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Experience Level</label>
              <div className="grid grid-cols-2 gap-1.5">
                {EXPERIENCE_LEVELS.map(lvl => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => toggleExperienceFilter(lvl)}
                    className={`p-2 rounded-lg text-xs text-left cursor-pointer ${
                      filters.experienceLevels.includes(lvl) ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={resetFilters}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-sm font-semibold cursor-pointer"
              >
                Reset
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-bold cursor-pointer"
              >
                Apply Filters ({filteredJobs.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* On-demand Modals */}
      {scamCheckJob && (
        <AiScamCheckModal
          job={scamCheckJob}
          onClose={() => setScamCheckJob(null)}
        />
      )}

      {matchCheckJob && (
        <AiMatchModal
          job={matchCheckJob}
          onClose={() => setMatchCheckJob(null)}
        />
      )}

    </div>
  );
};

export default AllJobsPage;
