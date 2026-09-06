import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  Briefcase, 
  Check, 
  Zap, 
  Building2, 
  ChevronRight,
  FileText,
  DollarSign,
  Scale,
  Award,
  Search,
  CheckCircle2,
  TrendingUp,
  Compass,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Lock,
  Activity,
  FileCheck2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useJobContext } from '../context/JobContext';
import { ChatMessage, AdminActionProposal } from '../types';
import { AdminActionModal } from './admin/AdminActionModal';

interface QuickActionItem {
  id: string;
  label: string;
  description: string;
  prompt: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  borderColor: string;
  bgColor: string;
}

const BRAND_QUICK_ACTIONS: QuickActionItem[] = [
  {
    id: 'find-jobs',
    label: 'Find Jobs',
    description: 'Discover curated roles tailored to your skills',
    prompt: 'Find and explore the best job opportunities matching my skills and experience.',
    icon: Search,
    color: 'text-cyan-300',
    borderColor: 'border-cyan-500/30 hover:border-cyan-400',
    bgColor: 'bg-cyan-950/40 hover:bg-cyan-900/50'
  },
  {
    id: 'compare-jobs',
    label: 'Compare Jobs',
    description: 'Evaluate compensation, tech stack & growth',
    prompt: 'Can you help me compare current job opportunities and compensation packages side-by-side?',
    icon: Scale,
    color: 'text-blue-300',
    borderColor: 'border-blue-500/30 hover:border-blue-400',
    bgColor: 'bg-blue-950/40 hover:bg-blue-900/50'
  },
  {
    id: 'research-company',
    label: 'Research a Company',
    description: 'Explore culture, tech stack & employee feedback',
    prompt: 'Help me research top companies, work culture, engineering values, and employee reviews for active job listings.',
    icon: Building2,
    color: 'text-indigo-300',
    borderColor: 'border-indigo-500/30 hover:border-indigo-400',
    bgColor: 'bg-indigo-950/40 hover:bg-indigo-900/50'
  },
  {
    id: 'analyze-salary',
    label: 'Analyze Salary',
    description: 'Benchmark compensation ranges & equity',
    prompt: 'Analyze market salaries and compensation benchmarks for my role, seniority, and location.',
    icon: DollarSign,
    color: 'text-emerald-300',
    borderColor: 'border-emerald-500/30 hover:border-emerald-400',
    bgColor: 'bg-emerald-950/40 hover:bg-emerald-900/50'
  },
  {
    id: 'improve-resume',
    label: 'Improve My Resume',
    description: 'ATS optimization & metric-driven bullet points',
    prompt: 'Review my resume and provide specific suggestions to improve impact, metrics, and recruiter response rate.',
    icon: FileText,
    color: 'text-amber-300',
    borderColor: 'border-amber-500/30 hover:border-amber-400',
    bgColor: 'bg-amber-950/40 hover:bg-amber-900/50'
  },
  {
    id: 'prepare-interview',
    label: 'Prepare for Interview',
    description: 'Practice role-specific questions & strategies',
    prompt: 'Help me prepare for technical, system design, and behavioral interviews with common questions and high-impact answer structures.',
    icon: Award,
    color: 'text-purple-300',
    borderColor: 'border-purple-500/30 hover:border-purple-400',
    bgColor: 'bg-purple-950/40 hover:bg-purple-900/50'
  }
];

const ADMIN_QUICK_ACTIONS: QuickActionItem[] = [
  {
    id: 'admin-health',
    label: 'Platform Health',
    description: 'Analyze latency, feeds & HTTP failures',
    prompt: 'Analyze current platform health, feed uptime, and system latency.',
    icon: Activity,
    color: 'text-emerald-300',
    borderColor: 'border-emerald-500/30 hover:border-emerald-400',
    bgColor: 'bg-emerald-950/40 hover:bg-emerald-900/50'
  },
  {
    id: 'admin-feed-errors',
    label: 'Feed Error Analyzer',
    description: 'Review failed platform feeds and retry',
    prompt: 'Which platform feeds failed today and what are the root causes?',
    icon: AlertTriangle,
    color: 'text-amber-300',
    borderColor: 'border-amber-500/30 hover:border-amber-400',
    bgColor: 'bg-amber-950/40 hover:bg-amber-900/50'
  },
  {
    id: 'admin-moderation',
    label: 'Job Moderation',
    description: 'Scan spam, duplicates & policy violations',
    prompt: 'Show high risk jobs currently pending moderation in the queue.',
    icon: ShieldAlert,
    color: 'text-rose-300',
    borderColor: 'border-rose-500/30 hover:border-rose-400',
    bgColor: 'bg-rose-950/40 hover:bg-rose-900/50'
  },
  {
    id: 'admin-verification',
    label: 'Verify Companies',
    description: 'Check business legitimacy & trust score',
    prompt: 'Which employer accounts are currently waiting for company verification?',
    icon: Building2,
    color: 'text-blue-300',
    borderColor: 'border-blue-500/30 hover:border-blue-400',
    bgColor: 'bg-blue-950/40 hover:bg-blue-900/50'
  },
  {
    id: 'admin-scam',
    label: 'Scam Detection',
    description: 'Audit upfront fees & phishing threats',
    prompt: 'Run the AI scam detector across newly submitted job listings.',
    icon: Lock,
    color: 'text-cyan-300',
    borderColor: 'border-cyan-500/30 hover:border-cyan-400',
    bgColor: 'bg-cyan-950/40 hover:bg-cyan-900/50'
  },
  {
    id: 'admin-audit',
    label: 'Audit & Security',
    description: 'Cryptographic validation of admin events',
    prompt: 'Analyze administrative audit logs for unauthorized or high-risk events.',
    icon: FileCheck2,
    color: 'text-indigo-300',
    borderColor: 'border-indigo-500/30 hover:border-indigo-400',
    bgColor: 'bg-indigo-950/40 hover:bg-indigo-900/50'
  }
];

function safeMarkdownUrl(rawUrl?: string): string {
  if (!rawUrl) return '#';
  const trimmed = rawUrl.trim();
  // Strictly prevent javascript:, data:, vbscript: URIs from executing
  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return '#';
  }
  return trimmed;
}

export const GeminiChatbot: React.FC = () => {
  const {
    chatbotOpen,
    setChatbotOpen,
    chatMessages,
    isChatLoading,
    sendChatMessage,
    clearChatMessages,
    executeChatAction,
    currentUser,
    activeTab,
    selectedJob,
    jobs,
    setSelectedJob,
    quickApplyToJob,
    hasAppliedToJob
  } = useJobContext();

  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showQuickActionDrawer, setShowQuickActionDrawer] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<AdminActionProposal | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState<boolean>(false);
  const [isExecutingAdminAction, setIsExecutingAdminAction] = useState<boolean>(false);
  const { executeAdminAction } = useJobContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleConfirmAdminAction = async (proposal: AdminActionProposal, reason: string) => {
    setIsExecutingAdminAction(true);
    try {
      const res = await executeAdminAction(proposal, reason);
      if (res.success) {
        setIsActionModalOpen(false);
        setSelectedProposal(null);
      }
    } finally {
      setIsExecutingAdminAction(false);
    }
  };

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatbotOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatLoading, chatbotOpen]);

  // Focus input when opened
  useEffect(() => {
    if (chatbotOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [chatbotOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isChatLoading) return;
    const text = input;
    setInput('');
    sendChatMessage(text);
  };

  const handlePromptClick = (prompt: string) => {
    sendChatMessage(prompt);
  };

  // Context pill details
  const getContextLabel = () => {
    if (currentUser?.role === 'admin' || activeTab === 'admin_hub') {
      return 'Admin Copilot • FastJobs Operations & 12 AI Tools';
    }
    if (selectedJob) {
      return `Job: ${selectedJob.title} (${selectedJob.company})`;
    }
    if (activeTab === 'my_profile') {
      return `Profile: ${currentUser?.name || 'Alex Chen'} (${currentUser?.title || 'Engineer'})`;
    }
    if (activeTab === 'post_a_job') {
      return 'Creating New Job Listing';
    }
    if (activeTab === 'for_employers') {
      return 'Recruiter & Employer Dashboard';
    }
    if (activeTab === 'all_jobs') {
      return `Marketplace (${jobs.length} Active Openings)`;
    }
    return `Candidate Mode • ${currentUser?.title || 'Alex Chen'}`;
  };

  // Quick contextual prompt suggestions
  const getContextualStarters = () => {
    if (currentUser?.role === 'admin' || activeTab === 'admin_hub') {
      return [
        'Give me a platform health summary',
        'Which platform feeds are failing?',
        'Show high-risk jobs pending moderation',
        'Which companies are waiting for verification?',
        'Check for duplicate job listings',
        'Summarize recent security & audit logs'
      ];
    }
    if (selectedJob) {
      return [
        `How well does my profile match with ${selectedJob.company}?`,
        `Draft a tailored cover letter for ${selectedJob.title}`,
        `What interview questions might ${selectedJob.company} ask?`,
        `What is the market salary benchmark for this role?`
      ];
    }
    if (activeTab === 'post_a_job') {
      return [
        'Help write compelling responsibilities for this job',
        'Suggest the top in-demand skills to require',
        'What is a competitive salary range for this role?'
      ];
    }
    if (activeTab === 'my_profile') {
      return [
        'Review my primary resume bullet points',
        'Which skills should I add to get more interviews?',
        'Recommend the highest matching jobs for me'
      ];
    }
    if (activeTab === 'for_employers') {
      return [
        'How to optimize candidate evaluation criteria?',
        'Tips for hiring senior engineering talent in 2026',
        'Review job posting performance'
      ];
    }
    return [
      'Find Jobs',
      'Compare Jobs',
      'Research a Company',
      'Analyze Salary',
      'Improve My Resume',
      'Prepare for Interview'
    ];
  };

  const isWelcomeState = chatMessages.length <= 1;
  const activeQuickActions = currentUser?.role === 'admin' ? ADMIN_QUICK_ACTIONS : BRAND_QUICK_ACTIONS;

  return (
    <>
      {/* Floating Launcher Button (visible when closed) */}
      {!chatbotOpen && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/30 shadow-lg text-xs font-medium text-slate-200 backdrop-blur-md animate-bounce">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Ask FastJobs AI</span>
          </div>

          <button
            id="gemini-chatbot-launcher"
            onClick={() => setChatbotOpen(true)}
            className="group relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 shadow-xl shadow-cyan-500/25 hover:shadow-cyan-400/40 transition-all duration-300 transform hover:-translate-y-1 active:scale-95 cursor-pointer"
            title="Open FastJobs AI - Find Jobs Faster with AI"
            aria-label="Open FastJobs AI - Find Jobs Faster with AI"
          >
            {/* Glowing ring animation */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-400 to-indigo-500 opacity-40 group-hover:opacity-75 blur-xs transition duration-300"></div>

            <div className="relative flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-slate-950" />
              <Sparkles className="w-3.5 h-3.5 text-white absolute -top-1 -right-1 fill-white group-hover:scale-125 transition-transform duration-200" />
            </div>

            {/* Context Awareness Pill indicator */}
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-950"></span>
            </span>
          </button>
        </div>
      )}

      {/* Main Chatbot Floating Window */}
      {chatbotOpen && (
        <div
          id="gemini-chatbot-window"
          className={`fixed z-50 transition-all duration-300 ease-out flex flex-col bg-[#070d22] border border-cyan-500/30 shadow-2xl shadow-cyan-950/80 rounded-2xl overflow-hidden backdrop-blur-2xl ${
            isExpanded
              ? 'inset-3 sm:inset-6 md:inset-10'
              : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-[480px] h-[660px] max-h-[92vh]'
          }`}
        >
            {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-[#0d1738] via-[#09112a] to-[#0d1738] border-b border-cyan-500/20 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className={`relative flex items-center justify-center w-9 h-9 rounded-xl shadow-md ${
                currentUser?.role === 'admin'
                  ? 'bg-gradient-to-tr from-amber-400 via-orange-400 to-amber-600 text-slate-950 shadow-amber-500/20'
                  : 'bg-gradient-to-tr from-cyan-400 via-sky-400 to-indigo-500 text-slate-950 shadow-cyan-500/20'
              }`}>
                {currentUser?.role === 'admin' ? (
                  <ShieldCheck className="w-5 h-5 text-slate-950" />
                ) : (
                  <Briefcase className="w-5 h-5 text-slate-950" />
                )}
                <Sparkles className="w-2.5 h-2.5 text-white absolute -top-0.5 -right-0.5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-white tracking-wide">
                    FastJobs AI
                  </span>
                  <span className={`px-1.5 py-0.5 text-[10px] font-extrabold rounded border ${
                    currentUser?.role === 'admin'
                      ? 'bg-amber-950/80 border-amber-500/40 text-amber-300'
                      : 'bg-cyan-950 border-cyan-500/30 text-cyan-300'
                  }`}>
                    {currentUser?.role === 'admin' ? 'Admin Copilot' : 'Assistant'}
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                  <span className="truncate">
                    {currentUser?.role === 'admin' ? '12 AI Tools • Human-in-the-Loop Active' : 'Find Jobs Faster with AI'}
                  </span>
                </span>
              </div>
            </div>

            {/* Window Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={clearChatMessages}
                title="Restart / Clear Conversation"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Collapse' : 'Expand'}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors hidden sm:block"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                id="gemini-chatbot-close-btn"
                onClick={() => setChatbotOpen(false)}
                title="Close Chat"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Live Context Banner */}
          <div className="px-4 py-2 bg-cyan-950/40 border-b border-cyan-500/15 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 truncate text-slate-300">
              <div className="w-2 h-2 rounded-full bg-cyan-400 shrink-0"></div>
              <span className="text-slate-400 shrink-0 font-medium">Context:</span>
              <span className="font-semibold text-cyan-200 truncate">{getContextLabel()}</span>
            </div>
            {currentUser && (
              <span className={`px-2 py-0.5 rounded text-[10px] border shrink-0 capitalize font-medium ${
                currentUser.role === 'admin'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700/60'
              }`}>
                {currentUser.role === 'admin' ? 'Administrator' : currentUser.role === 'employer' ? 'Employer' : 'Candidate'}
              </span>
            )}
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm scroll-smooth">
            {chatMessages.map((msg: ChatMessage) => {
              const isUser = msg.role === 'user';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`flex gap-3 max-w-[92%] sm:max-w-[88%] ${
                      isUser ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    {!isUser && (
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                        <Sparkles className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
                      </div>
                    )}

                    <div
                      className={`rounded-2xl px-4 py-3 shadow-md ${
                        isUser
                          ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-xs font-medium'
                          : 'bg-slate-900/90 border border-cyan-500/20 text-slate-200 rounded-tl-xs'
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      ) : (
                        <div className="prose prose-invert prose-sm max-w-none text-slate-200 space-y-2 leading-relaxed [&>h3]:text-cyan-300 [&>h3]:font-bold [&>h3]:text-sm [&>h3]:mt-2 [&>h3]:mb-1 [&>ul]:list-disc [&>ul]:pl-4 [&>ul]:space-y-1 [&>ol]:list-decimal [&>ol]:pl-4 [&>ol]:space-y-1 [&>p]:leading-relaxed [&>code]:bg-slate-800 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-cyan-200 [&>code]:text-xs">
                          <ReactMarkdown
                            components={{
                              a: ({ href, children, ...props }) => {
                                const safeHref = safeMarkdownUrl(href);
                                return (
                                  <a
                                    href={safeHref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-cyan-400 underline hover:text-cyan-300 transition-colors"
                                    {...props}
                                  >
                                    {children}
                                  </a>
                                );
                              }
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      )}

                      {/* Recommended Jobs Cards directly inside message */}
                      {msg.recommendedJobIds && msg.recommendedJobIds.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2">
                          <p className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Briefcase className="w-3 h-3" />
                            Recommended Opportunities
                          </p>
                          <div className="space-y-2">
                            {msg.recommendedJobIds.map(jobId => {
                              const job = jobs.find(j => j.id === jobId);
                              if (!job) return null;
                              const applied = hasAppliedToJob(job.id);

                              return (
                                <div
                                  key={job.id}
                                  className="p-2.5 rounded-xl bg-slate-950/70 border border-cyan-500/20 hover:border-cyan-400/40 transition-all flex items-center justify-between gap-2"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <img
                                      src={job.companyLogo}
                                      alt={job.company}
                                      className="w-8 h-8 rounded-lg object-cover shrink-0 border border-slate-800"
                                    />
                                    <div className="min-w-0">
                                      <h4 className="text-xs font-bold text-white truncate hover:text-cyan-300 transition-colors">
                                        {job.title}
                                      </h4>
                                      <p className="text-[11px] text-slate-400 truncate">
                                        {job.company} • <span className="text-emerald-400 font-semibold">${Math.round(job.salaryMin/1000)}k-${Math.round(job.salaryMax/1000)}k</span>
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      onClick={() => setSelectedJob(job)}
                                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium transition-colors"
                                      title="View Details"
                                    >
                                      View
                                    </button>

                                    {applied ? (
                                      <span className="px-2 py-1 rounded-lg bg-emerald-950 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                                        <Check className="w-3 h-3" />
                                        Applied
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() => quickApplyToJob(job.id)}
                                        className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                                        title="Quick Apply"
                                      >
                                        <Zap className="w-3 h-3 fill-slate-950" />
                                        Apply
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Admin Copilot Facts */}
                      {Array.isArray(msg.facts) && msg.facts.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1 text-xs">
                          <span className="text-slate-400 font-semibold block text-[10px] uppercase tracking-wider">Verified Facts:</span>
                          {msg.facts.map((fact, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-slate-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span className="text-[11px]">{fact}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Admin Copilot Recommendations */}
                      {Array.isArray(msg.recommendations) && msg.recommendations.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-800/80 space-y-1 text-xs">
                          <span className="text-cyan-300 font-semibold block text-[10px] uppercase tracking-wider">Recommended Next Steps:</span>
                          {msg.recommendations.map((rec, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-slate-300">
                              <ChevronRight className="w-3 h-3 text-cyan-400 shrink-0" />
                              <span className="text-[11px]">{rec}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Proposed Admin Action Card with Human Confirmation trigger */}
                      {msg.proposedAction && (
                        <div className="mt-3 p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <ShieldAlert className="w-4 h-4 text-amber-400" />
                              <span className="font-bold text-amber-300">Proposed Action</span>
                            </div>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              {msg.proposedAction.riskLevel} RISK
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-200">
                            <strong>{msg.proposedAction.actionType}:</strong> {msg.proposedAction.targetName}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {msg.proposedAction.explanation}
                          </p>
                          <button
                            onClick={() => {
                              setSelectedProposal(msg.proposedAction!);
                              setIsActionModalOpen(true);
                            }}
                            className="w-full py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-98"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Review & Authorize Action</span>
                          </button>
                        </div>
                      )}

                      {/* Suggested Action Button */}
                      {msg.suggestedAction && (
                        <div className="mt-3 pt-2.5 border-t border-slate-800/80">
                          <button
                            onClick={() => executeChatAction(msg.suggestedAction)}
                            className="w-full py-2 px-3.5 rounded-xl bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-indigo-500/20 hover:from-cyan-500/30 hover:to-indigo-500/30 border border-cyan-500/40 text-cyan-200 hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm group"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-12 transition-transform" />
                            <span>{msg.suggestedAction.label}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Follow-up suggestion pills */}
                  {!isUser && msg.suggestedFollowups && msg.suggestedFollowups.length > 0 && (
                    <div className="mt-2 ml-10 flex flex-wrap gap-1.5 max-w-[85%]">
                      {msg.suggestedFollowups.map((followup, idx) => (
                        <button
                          key={idx}
                          onClick={() => handlePromptClick(followup)}
                          disabled={isChatLoading}
                          className="px-2.5 py-1 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-cyan-500/20 hover:border-cyan-400/40 text-[11px] text-slate-300 hover:text-cyan-200 transition-all text-left flex items-center gap-1 cursor-pointer"
                        >
                          <span className="text-cyan-400">↳</span>
                          <span>{followup}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Quick Actions Spotlight Grid (Shown on welcome screen) */}
            {isWelcomeState && (
              <div className="pt-2 pb-1 space-y-2.5 animate-in fade-in duration-300">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    Suggested Quick Actions
                  </span>
                  <span className="text-[10px] text-slate-400">1-Click Starters</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeQuickActions.map(action => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.id}
                        type="button"
                        onClick={() => handlePromptClick(action.prompt)}
                        disabled={isChatLoading}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 group cursor-pointer ${action.bgColor} ${action.borderColor}`}
                      >
                        <div className={`p-1.5 rounded-lg bg-slate-900/90 shrink-0 border border-slate-800 ${action.color} group-hover:scale-110 transition-transform`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white group-hover:text-cyan-200 transition-colors">
                              {action.label}
                            </span>
                            <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-all opacity-0 group-hover:opacity-100" />
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                            {action.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Thinking / Loading indicator */}
            {isChatLoading && (
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm mt-0.5 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
                </div>
                <div className="rounded-2xl rounded-tl-xs px-4 py-3 bg-slate-900/90 border border-cyan-500/20 text-slate-300 flex items-center gap-2.5 text-xs shadow-md">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-slate-400 font-medium">
                    {currentUser?.role === 'admin' ? 'FastJobs AI Admin Copilot is analyzing telemetry...' : 'FastJobs AI is analyzing career data...'}
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Pills Carousel Bar */}
          <div className="px-3 py-2 bg-slate-950/90 border-t border-slate-800/80 overflow-x-auto no-scrollbar shrink-0">
            <div className="flex items-center gap-1.5 w-max">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1 mr-1">
                <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                Quick Actions:
              </span>
              {activeQuickActions.map(action => (
                <button
                  key={action.id}
                  onClick={() => handlePromptClick(action.prompt)}
                  disabled={isChatLoading}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/70 hover:border-cyan-500/40 text-[11px] font-semibold text-slate-300 hover:text-white transition-all whitespace-nowrap cursor-pointer flex items-center gap-1"
                >
                  <action.icon className="w-3 h-3 text-cyan-400" />
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Input Bar */}
          <form
            onSubmit={handleSubmit}
            className="p-3 bg-[#060b1d] border-t border-cyan-500/20 shrink-0"
          >
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    currentUser?.role === 'admin'
                      ? "Ask Admin Copilot (e.g. 'Are any platform feeds failing?' or 'Show high risk jobs')..."
                      : "Ask FastJobs AI about jobs, companies, salaries, resume tips..."
                  }
                  disabled={isChatLoading}
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={!input.trim() || isChatLoading}
                className={`p-2.5 rounded-xl font-bold flex items-center justify-center transition-all ${
                  input.trim() && !isChatLoading
                    ? currentUser?.role === 'admin'
                      ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20 hover:from-amber-300 hover:to-orange-400 cursor-pointer active:scale-95'
                      : 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-md shadow-cyan-500/20 hover:from-cyan-300 hover:to-blue-400 cursor-pointer active:scale-95'
                    : 'bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
                title="Send Message to FastJobs AI"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 px-1">
              <span>FastJobs AI • {currentUser?.role === 'admin' ? 'Admin Copilot & 12 AI Tools' : 'Find Jobs Faster with AI'}</span>
              <span>{currentUser?.role === 'admin' ? 'RBAC Master Admin • Audit Logged' : 'Live context & profile awareness'}</span>
            </div>
          </form>
        </div>
      )}

      {/* Confirmation Modal for Admin Actions proposed in Chatbot */}
      <AdminActionModal
        proposal={selectedProposal}
        isOpen={isActionModalOpen}
        onClose={() => {
          setIsActionModalOpen(false);
          setSelectedProposal(null);
        }}
        onConfirm={handleConfirmAdminAction}
        isExecuting={isExecutingAdminAction}
      />
    </>
  );
};
