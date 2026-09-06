import React, { useState } from 'react';
import { JobProvider, useJobContext } from './context/JobContext';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { AllJobsPage } from './components/AllJobsPage';
import { EmployerDashboard } from './components/EmployerDashboard';
import { PostJobView } from './components/PostJobView';
import { JobSeekerProfileView } from './components/JobSeekerProfileView';
import { JobDetailModal } from './components/JobDetailModal';
import { ApplyJobModal } from './components/ApplyJobModal';
import { AuthModal } from './components/AuthModal';
import { ToastContainer } from './components/Toast';
import { GeminiChatbot } from './components/GeminiChatbot';
import { FeedEngineView } from './components/FeedEngineView';
import { AdminAiDashboard } from './components/admin/AdminAiDashboard';
import { ContractDashboard } from './components/contracts/ContractDashboard';
import { Footer } from './components/Footer';
import { 
  Sparkles, 
  ArrowRight, 
  Briefcase, 
  Building2, 
  DollarSign, 
  MapPin, 
  Flame, 
  Bookmark, 
  CheckCircle2, 
  Check,
  Cpu, 
  Code2, 
  Palette, 
  Database, 
  ShieldCheck, 
  TrendingUp, 
  Users,
  Zap 
} from 'lucide-react';
import { JobCategory, Job } from './types';

const MainContent: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    jobs, 
    setSelectedJob, 
    setApplyModalJob, 
    quickApplyToJob,
    setAuthModalOpen,
    currentUser,
    hasAppliedToJob,
    toggleSaveJob, 
    isJobSaved, 
    toggleCategoryFilter, 
    setSearchKeyword,
    filters 
  } = useJobContext();

  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);

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

  const featuredJobs = jobs.filter(j => j.featured || j.urgent).slice(0, 6);

  const CATEGORY_ITEMS: { name: JobCategory; icon: any; desc: string }[] = [
    { name: 'AI & Machine Learning', icon: Cpu, desc: 'LLM Systems, Prompt Engineering, Vision' },
    { name: 'Engineering', icon: Code2, desc: 'Full Stack, React, Distributed Systems' },
    { name: 'Product & Design', icon: Palette, desc: 'Design Systems, AI Canvas, UX Strategy' },
    { name: 'Data & Analytics', icon: Database, desc: 'MLOps, Data Lakes, Streaming ETL' },
    { name: 'DevOps & Cloud', icon: ShieldCheck, desc: 'Kubernetes, Cloud Security, Infrastructure' },
    { name: 'Marketing & Growth', icon: TrendingUp, desc: 'Product-Led Growth, B2B SaaS Funnels' },
    { name: 'Sales & Success', icon: Users, desc: 'Enterprise AE, Solutions, Customer Success' },
    { name: 'Operations & Finance', icon: DollarSign, desc: 'People Ops, Financial Modeling, Strategy' }
  ];

  return (
    <div className="min-h-screen bg-[#040816] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      <Navbar />

      <main className="flex-1">
        {activeTab === 'home' && (
          <div>
            {/* 680px Tall Hero with Cinematic Video Background & Search */}
            <HeroSection />

            {/* Featured Jobs Spotlight Section */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    Curated Spotlight
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Featured High-Impact Positions
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">
                    Top-tier engineering and AI opportunities with verified market compensation.
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('all_jobs')}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-400/40 text-cyan-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <span>View All {jobs.length} Positions</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Grid of Featured Jobs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {featuredJobs.map(job => {
                  const saved = isJobSaved(job.id);
                  return (
                    <div
                      key={job.id}
                      className="group p-5 rounded-2xl bg-[#0a1128]/70 hover:bg-[#0f172a]/90 border border-slate-800 hover:border-cyan-500/40 backdrop-blur-md transition-all duration-200 flex flex-col justify-between space-y-4 shadow-lg"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={job.companyLogo}
                              alt={job.company}
                              className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-700 bg-slate-900 shrink-0"
                            />
                            <div>
                              <span className="text-xs font-semibold text-slate-400 block">{job.company}</span>
                              <h3 
                                onClick={() => setSelectedJob(job)}
                                className="text-sm sm:text-base font-bold text-white group-hover:text-cyan-300 transition-colors cursor-pointer line-clamp-1"
                              >
                                {job.title}
                              </h3>
                            </div>
                          </div>

                          <button
                            onClick={() => toggleSaveJob(job.id)}
                            className="text-slate-400 hover:text-cyan-400 p-1"
                            title={saved ? 'Remove bookmark' : 'Save job'}
                          >
                            <Bookmark className={`w-4 h-4 ${saved ? 'fill-cyan-400 text-cyan-400' : ''}`} />
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                          <span className="flex items-center gap-1 text-slate-400">
                            <MapPin className="w-3.5 h-3.5" />
                            {job.location}
                          </span>
                          <span>•</span>
                          <span className="text-emerald-400 font-semibold">
                            ${Math.round(job.salaryMin/1000)}k - ${Math.round(job.salaryMax/1000)}k/yr
                          </span>
                        </div>

                        {/* Skills Chips */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {job.skills.slice(0, 3).map(skill => (
                            <span
                              key={skill}
                              className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-900 text-slate-300 border border-slate-800"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Card Action footer */}
                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-cyan-300 font-bold">
                          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{job.matchScore || 95}% AI Fit</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedJob(job)}
                            className="text-xs font-semibold text-slate-400 hover:text-white px-2 py-1 transition-colors cursor-pointer"
                          >
                            Details
                          </button>
                          
                          {hasAppliedToJob(job.id) ? (
                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>Applied</span>
                            </span>
                          ) : (
                            <button
                              id={`featured-quick-apply-${job.id}`}
                              disabled={applyingJobId === job.id}
                              onClick={(e) => handleQuickApply(e, job)}
                              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 disabled:opacity-75 text-slate-950 font-bold text-xs shadow-sm shadow-cyan-500/20 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                              title={currentUser ? `1-Click Quick Apply with ${currentUser.name}'s profile` : 'Sign in to 1-Click Quick Apply'}
                            >
                              {applyingJobId === job.id ? (
                                <>
                                  <div className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                                  <span>Applying...</span>
                                </>
                              ) : (
                                <>
                                  <Zap className="w-3 h-3 fill-slate-950 text-slate-950" />
                                  <span>Quick Apply</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* Browse by Category Grid */}
              <div className="pt-12">
                <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
                  <h3 className="text-2xl font-black text-white">
                    Explore Roles by Domain
                  </h3>
                  <p className="text-sm text-slate-400">
                    Find specialized teams hiring across leading technical disciplines.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {CATEGORY_ITEMS.map((item, idx) => {
                    const Icon = item.icon;
                    const activeCount = jobs.filter(j => j.category === item.name && (j.status === 'active' || !j.status)).length;
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          filters.categories.forEach(c => {
                            if (c !== item.name) toggleCategoryFilter(c);
                          });
                          if (!filters.categories.includes(item.name)) {
                            toggleCategoryFilter(item.name);
                          }
                          setActiveTab('all_jobs');
                        }}
                        className="group p-5 rounded-2xl bg-[#0a1128]/60 hover:bg-[#0f172a]/90 border border-slate-800 hover:border-cyan-500/40 backdrop-blur-md transition-all cursor-pointer flex items-start gap-4"
                      >
                        <div className="w-12 h-12 rounded-xl bg-cyan-950/70 group-hover:bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0 text-cyan-400 transition-colors">
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-bold text-white text-sm group-hover:text-cyan-300 transition-colors truncate">
                              {item.name}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{item.desc}</p>
                          {activeCount > 0 ? (
                            <span className="text-[11px] text-cyan-400 font-semibold mt-2 inline-block">
                              {activeCount} Active {activeCount === 1 ? 'Role' : 'Roles'} →
                            </span>
                          ) : (
                            <span className="text-[11px] text-amber-400/90 font-medium mt-2 inline-block">
                              0 Openings • Set Alert →
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Employer Call-to-Action Banner */}
              <div className="mt-16 p-8 rounded-3xl bg-gradient-to-r from-blue-950/60 via-[#0a1128] to-cyan-950/60 border border-cyan-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center md:text-left">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    For Technology Companies & Founders
                  </span>
                  <h3 className="text-2xl font-black text-white">
                    Looking to Hire World-Class Engineers & AI Researchers?
                  </h3>
                  <p className="text-sm text-slate-300 max-w-xl">
                    Post your opening on FastJobs AI to reach pre-vetted candidates with AI-powered skill compatibility matching.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                  <button
                    onClick={() => setActiveTab('for_employers')}
                    className="px-6 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 hover:text-white font-semibold text-sm"
                  >
                    Employer Hub
                  </button>
                  <button
                    onClick={() => setActiveTab('post_a_job')}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 hover:from-cyan-300 hover:to-blue-400"
                  >
                    Post a Job Opening
                  </button>
                </div>
              </div>

            </section>
          </div>
        )}

        {activeTab === 'all_jobs' && <AllJobsPage />}
        {activeTab === 'feed_engine' && <FeedEngineView />}
        {activeTab === 'for_employers' && <EmployerDashboard />}
        {activeTab === 'post_a_job' && <PostJobView />}
        {activeTab === 'my_profile' && <JobSeekerProfileView />}
        {activeTab === 'applications' && <JobSeekerProfileView />}
        {(activeTab as string) === 'admin_hub' && <AdminAiDashboard />}
        {activeTab === 'contracts' && <ContractDashboard />}
      </main>

      {/* Global Interactive Modals & Toast & Gemini Chatbot */}
      <JobDetailModal />
      <ApplyJobModal />
      <AuthModal />
      <ToastContainer />
      <GeminiChatbot />

      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <JobProvider>
      <MainContent />
    </JobProvider>
  );
}
