import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Bell, 
  BellRing, 
  Check, 
  ArrowRight, 
  RotateCcw, 
  PlusCircle, 
  X, 
  Cpu, 
  Code2, 
  Palette, 
  Database, 
  ShieldCheck, 
  TrendingUp, 
  Users, 
  DollarSign,
  Building2,
  Inbox,
  FilterX,
  Briefcase
} from 'lucide-react';
import { JobCategory, Job } from '../types';
import { useJobContext } from '../context/JobContext';

export interface EmptyCategoryPlaceholderProps {
  selectedCategories: JobCategory[];
  onClearCategory: (category?: JobCategory) => void;
  onSelectCategory?: (category: JobCategory) => void;
  onResetAllFilters?: () => void;
  hasOtherFilters?: boolean;
}

const CATEGORY_META: Record<JobCategory, { icon: React.ComponentType<{ className?: string }>; color: string; desc: string }> = {
  'AI & Machine Learning': { 
    icon: Cpu, 
    color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30', 
    desc: 'LLMs, Neural Networks, MLOps, Prompt Engineering' 
  },
  'Engineering': { 
    icon: Code2, 
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/30', 
    desc: 'Frontend React, Systems Architecture, Distributed Backend' 
  },
  'Product & Design': { 
    icon: Palette, 
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/30', 
    desc: 'Product Leadership, Design Systems, UX Strategy' 
  },
  'Data & Analytics': { 
    icon: Database, 
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', 
    desc: 'Data Warehousing, Real-Time Streaming, Business Intelligence' 
  },
  'DevOps & Cloud': { 
    icon: ShieldCheck, 
    color: 'text-sky-400 bg-sky-500/10 border-sky-500/30', 
    desc: 'Zero-Trust Infrastructure, Kubernetes, Cloud SRE' 
  },
  'Marketing & Growth': { 
    icon: TrendingUp, 
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', 
    desc: 'Product-Led Growth, Demand Gen, Technical Content' 
  },
  'Sales & Success': { 
    icon: Users, 
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/30', 
    desc: 'Enterprise Account Executives, Solutions Architects, Customer Success' 
  },
  'Operations & Finance': { 
    icon: DollarSign, 
    color: 'text-teal-400 bg-teal-500/10 border-teal-500/30', 
    desc: 'Strategic Finance, People Operations, Legal & Compliance' 
  }
};

export const EmptyCategoryPlaceholder: React.FC<EmptyCategoryPlaceholderProps> = ({
  selectedCategories,
  onClearCategory,
  onSelectCategory,
  onResetAllFilters,
  hasOtherFilters = false
}) => {
  const { jobs, currentUser, showToast, setActiveTab } = useJobContext();

  const [alertEmail, setAlertEmail] = useState(currentUser?.email || '');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  // Sync current user email if available
  useEffect(() => {
    if (currentUser?.email && !alertEmail) {
      setAlertEmail(currentUser.email);
    }
  }, [currentUser, alertEmail]);

  // Check existing alert subscription from localStorage
  useEffect(() => {
    try {
      const savedAlerts = localStorage.getItem('fastjobs_category_alerts');
      if (savedAlerts && selectedCategories.length > 0) {
        const parsed = JSON.parse(savedAlerts) as string[];
        const hasExisting = selectedCategories.some(cat => parsed.includes(cat));
        setIsSubscribed(hasExisting);
      }
    } catch {
      // ignore
    }
  }, [selectedCategories]);

  // Derive categories that actually have active jobs
  const activeCategoriesWithCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    jobs.forEach(j => {
      if (j.status === 'active' || !j.status) {
        counts[j.category] = (counts[j.category] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .filter(([cat, count]) => count > 0 && !selectedCategories.includes(cat as JobCategory))
      .map(([cat, count]) => ({
        category: cat as JobCategory,
        count
      }))
      .sort((a, b) => b.count - a.count);
  }, [jobs, selectedCategories]);

  const handleSubscribeAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertEmail.trim() || !alertEmail.includes('@')) {
      showToast({
        title: 'Valid Email Required',
        message: 'Please enter a valid email address to receive category job alerts.',
        type: 'warning'
      });
      return;
    }

    setSubscribing(true);
    setTimeout(() => {
      try {
        const savedAlerts = localStorage.getItem('fastjobs_category_alerts');
        const list: string[] = savedAlerts ? JSON.parse(savedAlerts) : [];
        selectedCategories.forEach(cat => {
          if (!list.includes(cat)) list.push(cat);
        });
        localStorage.setItem('fastjobs_category_alerts', JSON.stringify(list));
      } catch {
        // ignore
      }

      setIsSubscribed(true);
      setSubscribing(false);
      showToast({
        title: 'Job Alert Activated',
        message: `We'll email ${alertEmail} the moment a new role opens in ${selectedCategories.join(', ')}.`,
        type: 'success'
      });
    }, 450);
  };

  const primaryCategory = selectedCategories[0];
  const primaryMeta = primaryCategory ? CATEGORY_META[primaryCategory] : null;
  const PrimaryIcon = primaryMeta ? primaryMeta.icon : FilterX;

  const categoryNamesDisplay = selectedCategories.length === 1 
    ? selectedCategories[0] 
    : `${selectedCategories.length} Categories`;

  return (
    <div 
      id="empty-category-placeholder"
      className="p-6 sm:p-10 rounded-3xl bg-[#0a1128]/80 border border-slate-800/90 backdrop-blur-xl shadow-2xl relative overflow-hidden transition-all duration-300 space-y-8"
    >
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-cyan-500/5 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute -bottom-10 right-10 w-72 h-40 bg-blue-500/5 blur-3xl pointer-events-none rounded-full" />

      {/* Main Empty State Header */}
      <div className="relative text-center max-w-xl mx-auto space-y-4">
        
        {/* Floating Icon with Active Radar Ring */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-[#0c1633] border border-cyan-500/30 flex items-center justify-center shadow-xl shadow-cyan-950/40 relative">
            <PrimaryIcon className="w-9 h-9 text-cyan-400" />
            <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-500"></span>
            </span>
          </div>
        </div>

        {/* Category Badge Indicator */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700/80 text-[11px] font-semibold text-slate-300">
          <Inbox className="w-3.5 h-3.5 text-slate-400" />
          <span>0 Active Openings Right Now</span>
        </div>

        {/* Heading */}
        <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          No Active Positions in <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-300">{categoryNamesDisplay}</span>
        </h3>

        {/* Selected Category Chips with Quick-Remove */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {selectedCategories.map(cat => {
            const meta = CATEGORY_META[cat];
            const CatIcon = meta?.icon || Briefcase;
            return (
              <span
                key={cat}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-cyan-950/70 text-cyan-200 border border-cyan-500/30 shadow-xs"
              >
                <CatIcon className="w-3.5 h-3.5 text-cyan-400" />
                <span>{cat}</span>
                <button
                  type="button"
                  onClick={() => onClearCategory(cat)}
                  className="hover:text-white text-cyan-400 p-0.5 rounded-md hover:bg-cyan-900/50 cursor-pointer transition-colors ml-0.5"
                  title={`Remove ${cat} filter`}
                  aria-label={`Remove ${cat} filter`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>

        {/* Informative Explanation */}
        <p className="text-slate-400 text-sm leading-relaxed">
          {hasOtherFilters
            ? `No active openings currently match both your selected category and additional filters (compensation, location, or keyword). Try clearing other filters or removing the category restriction.`
            : `Hiring teams and startups have not published active vacancies in this department over the past 30 days, or current cohorts have closed. Check back soon or set an automated notification.`}
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            id="empty-category-clear-btn"
            type="button"
            onClick={() => onClearCategory()}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-md shadow-cyan-500/20 flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Clear Category Filter</span>
          </button>

          {hasOtherFilters && onResetAllFilters && (
            <button
              id="empty-category-reset-all-btn"
              type="button"
              onClick={onResetAllFilters}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 font-semibold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2"
            >
              <span>Reset All Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid of Solutions: Job Alerts & Active Domains */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-800/80">
        
        {/* Solution 1: Automated Category Job Alert */}
        <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold uppercase tracking-wider">
              {isSubscribed ? <BellRing className="w-4 h-4 text-emerald-400" /> : <Bell className="w-4 h-4 text-cyan-400" />}
              <span>Get Instant Alert on New Postings</span>
            </div>
            <h4 className="text-base font-bold text-white">
              Be the first candidate to apply
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              We monitor verified career pages hourly. We’ll notify you directly as soon as an opening in{' '}
              <span className="text-slate-200 font-medium">{categoryNamesDisplay}</span> is indexed.
            </p>
          </div>

          {isSubscribed ? (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 flex items-center gap-2.5 text-xs font-semibold">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Job alert active for {categoryNamesDisplay}. You will be alerted immediately!</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribeAlert} className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  id="empty-category-alert-email"
                  type="email"
                  value={alertEmail}
                  onChange={(e) => setAlertEmail(e.target.value)}
                  placeholder="Enter your email for alerts..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400 transition-all"
                  required
                />
                <button
                  id="empty-category-alert-submit"
                  type="submit"
                  disabled={subscribing}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs transition-all shadow-sm shrink-0 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {subscribing ? (
                    <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                      <span>Set Alert</span>
                    </>
                  )}
                </button>
              </div>
              <span className="text-[10px] text-slate-500 block">
                No spam. Unsubscribe anytime with 1 click.
              </span>
            </form>
          )}
        </div>

        {/* Solution 2: Quick Jump to Active Categories */}
        <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>Active Roles in Adjacent Disciplines</span>
            </div>
            <h4 className="text-base font-bold text-white">
              Browse domains with live openings
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              These engineering and technology categories currently have verified opportunities available today:
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {activeCategoriesWithCounts.slice(0, 5).map(({ category, count }) => {
              const meta = CATEGORY_META[category];
              const Icon = meta?.icon || Briefcase;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => {
                    if (onSelectCategory) {
                      onSelectCategory(category);
                    } else {
                      onClearCategory();
                    }
                  }}
                  className="group/chip inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-xs font-medium text-slate-300 hover:text-cyan-300 transition-all cursor-pointer shadow-xs"
                >
                  <Icon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{category}</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 text-[10px] font-bold border border-cyan-500/20">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Recruiter / Employer Callout Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-cyan-950/30 to-indigo-950/40 border border-cyan-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0 text-cyan-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-white text-sm block">
              Are you hiring in {categoryNamesDisplay}?
            </span>
            <span className="text-slate-400 text-xs block">
              Be the premier company featured when candidates search this category.
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('post_a_job')}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-white border border-cyan-500/40 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 text-cyan-400" />
          <span>Post a {categoryNamesDisplay} Role</span>
          <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
        </button>
      </div>

    </div>
  );
};
