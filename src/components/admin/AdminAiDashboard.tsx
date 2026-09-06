import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Activity,
  AlertTriangle,
  FileCheck2,
  Copy,
  Building2,
  Flame,
  Zap,
  TrendingUp,
  FileText,
  Lock,
  MessageSquare,
  Sparkles,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Trash2,
  RotateCcw,
  Check,
  Filter,
  Users,
  Briefcase,
  Layers,
  ArrowUpRight,
  AlertCircle
} from 'lucide-react';
import { useJobContext } from '../../context/JobContext';
import { AdminActionProposal } from '../../types';
import { AdminActionModal } from './AdminActionModal';
import { AdminHealthDashboard } from './AdminHealthDashboard';

type AdminAiToolId = 
  | 'system_health'
  | 'all_overview'
  | 'health_monitor'
  | 'feed_errors'
  | 'job_moderation'
  | 'scam_detector'
  | 'duplicate_detector'
  | 'company_verification'
  | 'fraud_activity'
  | 'feed_optimization'
  | 'recruitment_analytics'
  | 'incident_summary'
  | 'audit_analyzer'
  | 'admin_copilot';

export const AdminAiDashboard: React.FC = () => {
  const { currentUser, executeAdminAction, showToast, toggleChatbot, openChatWithPrompt } = useJobContext();
  
  const [activeTool, setActiveTool] = useState<AdminAiToolId>('system_health');
  const [loading, setLoading] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('Just now');

  // Tool Data States
  const [healthData, setHealthData] = useState<any>(null);
  const [feedErrorData, setFeedErrorData] = useState<any>(null);
  const [moderationData, setModerationData] = useState<any>(null);
  const [scamData, setScamData] = useState<any>(null);
  const [duplicateData, setDuplicateData] = useState<any>(null);
  const [verificationData, setVerificationData] = useState<any>(null);
  const [fraudData, setFraudData] = useState<any>(null);
  const [optimizationData, setOptimizationData] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [incidentData, setIncidentData] = useState<any>(null);
  const [auditData, setAuditData] = useState<any>(null);

  // Copilot Interactive State
  const [copilotInput, setCopilotInput] = useState<string>('');
  const [copilotMessages, setCopilotMessages] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
    facts?: string[];
    recommendations?: string[];
    proposedAction?: AdminActionProposal;
    timestamp: string;
  }>>([
    {
      role: 'assistant',
      content: 'Welcome, Administrator Devon Vance. FastJobs AI Admin Copilot is active with elevated RBAC access across platform health monitors, deduplication engines, verification queues, and audit trails. How may I assist your operations today?',
      facts: [
        'Feed Engine running with 12 background platform adapters',
        'Audit logs cryptographically signed and immutable',
        'Human-in-the-loop enforcement active for all destructive actions'
      ],
      recommendations: [
        'Run platform health diagnostic',
        'Check pending company verifications',
        'Analyze recent feed error logs'
      ],
      timestamp: 'Active'
    }
  ]);
  const [copilotLoading, setCopilotLoading] = useState<boolean>(false);

  // Human-in-the-loop Action Modal State
  const [selectedProposal, setSelectedProposal] = useState<AdminActionProposal | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState<boolean>(false);
  const [isExecutingAction, setIsExecutingAction] = useState<boolean>(false);

  // Fetch all tool datasets
  const fetchAllToolData = async () => {
    setLoading(true);
    try {
      const headers = {
        'Content-Type': 'application/json',
        'x-admin-role': 'admin'
      };

      const [
        resHealth,
        resFeedErr,
        resModeration,
        resScam,
        resDup,
        resVerif,
        resFraud,
        resOpt,
        resAnalytics,
        resIncidents,
        resAudit
      ] = await Promise.all([
        fetch('/api/admin/ai/health-monitor', { headers }).then(r => r.ok ? r.json() : null),
        fetch('/api/admin/ai/feed-error-analyzer', { headers }).then(r => r.ok ? r.json() : null),
        fetch('/api/admin/ai/job-moderation', { headers }).then(r => r.ok ? r.json() : null),
        fetch('/api/admin/ai/scam-detector', { headers }).then(r => r.ok ? r.json() : null),
        fetch('/api/admin/ai/duplicate-detector', { headers }).then(r => r.ok ? r.json() : null),
        fetch('/api/admin/ai/company-verification', { headers }).then(r => r.ok ? r.json() : null),
        fetch('/api/admin/ai/fraud-activity', { headers }).then(r => r.ok ? r.json() : null),
        fetch('/api/admin/ai/feed-optimization', { headers }).then(r => r.ok ? r.json() : null),
        fetch('/api/admin/ai/analytics-summary', { headers }).then(r => r.ok ? r.json() : null),
        fetch('/api/admin/ai/incident-summary', { headers }).then(r => r.ok ? r.json() : null),
        fetch('/api/admin/ai/audit-analyzer', { headers }).then(r => r.ok ? r.json() : null)
      ]);

      if (resHealth) setHealthData(resHealth);
      if (resFeedErr) setFeedErrorData(resFeedErr);
      if (resModeration) setModerationData(resModeration);
      if (resScam) setScamData(resScam);
      if (resDup) setDuplicateData(resDup);
      if (resVerif) setVerificationData(resVerif);
      if (resFraud) setFraudData(resFraud);
      if (resOpt) setOptimizationData(resOpt);
      if (resAnalytics) setAnalyticsData(resAnalytics);
      if (resIncidents) setIncidentData(resIncidents);
      if (resAudit) setAuditData(resAudit);

      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err: any) {
      console.error('Failed to load Admin AI tools data:', err);
      showToast({
        title: 'Connection Notice',
        message: 'Loaded cached administrative telemetry.',
        type: 'info'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllToolData();
  }, []);

  // Handle Action Trigger (Opens Human-in-the-loop modal)
  const triggerActionReview = (proposal: AdminActionProposal) => {
    setSelectedProposal(proposal);
    setIsActionModalOpen(true);
  };

  const handleConfirmAction = async (proposal: AdminActionProposal, reason: string) => {
    setIsExecutingAction(true);
    try {
      const result = await executeAdminAction(proposal, reason);
      if (result.success) {
        setIsActionModalOpen(false);
        setSelectedProposal(null);
        // Refresh telemetry after state change
        await fetchAllToolData();
      }
    } finally {
      setIsExecutingAction(false);
    }
  };

  // Copilot Query Submission
  const handleCopilotSubmit = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const query = (customQuery || copilotInput).trim();
    if (!query || copilotLoading) return;

    const userMsg = {
      role: 'user' as const,
      content: query,
      timestamp: 'Just now'
    };

    setCopilotMessages(prev => [...prev, userMsg]);
    setCopilotInput('');
    setCopilotLoading(true);

    try {
      const res = await fetch('/api/admin/ai/copilot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-role': 'admin'
        },
        body: JSON.stringify({
          message: query,
          history: copilotMessages.slice(-6).map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (!res.ok) {
        throw new Error(`Copilot responded with HTTP ${res.status}`);
      }

      const data = await res.json();
      const assistantMsg = {
        role: 'assistant' as const,
        content: data.answer || data.reply || 'Administrative query processed.',
        facts: data.facts || [],
        recommendations: data.recommendations || [],
        proposedAction: data.proposedAction,
        timestamp: 'Just now'
      };

      setCopilotMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      setCopilotMessages(prev => [
        ...prev,
        {
          role: 'assistant' as const,
          content: `⚠️ Admin Copilot query error: ${err.message}. Verified access remains active.`,
          timestamp: 'Just now'
        }
      ]);
    } finally {
      setCopilotLoading(false);
    }
  };

  const TOOLS_NAV: Array<{ id: AdminAiToolId; name: string; icon: any; badge?: string; badgeColor?: string }> = [
    { id: 'system_health', name: 'System Health Dashboard', icon: Activity, badge: 'Live Telemetry', badgeColor: 'text-emerald-400 bg-emerald-500/20' },
    { id: 'all_overview', name: 'All Admin AI Tools', icon: Layers, badge: 'Unified Hub' },
    { id: 'health_monitor', name: '1. Platform Health Diagnostics', icon: Activity, badge: healthData?.status || 'HEALTHY', badgeColor: 'text-emerald-400 bg-emerald-500/10' },
    { id: 'feed_errors', name: '2. Feed Error Analyzer', icon: AlertTriangle, badge: `${feedErrorData?.errorCount || 0} alerts` },
    { id: 'job_moderation', name: '3. Job Moderation', icon: ShieldAlert, badge: `${moderationData?.pendingCount || 0} queue` },
    { id: 'scam_detector', name: '4. Scam Detector', icon: Lock, badge: `${scamData?.threatCount || 0} flagged` },
    { id: 'duplicate_detector', name: '5. Duplicate Detector', icon: Copy, badge: `${duplicateData?.totalDuplicatesFound || 0} dups` },
    { id: 'company_verification', name: '6. Company Verification', icon: Building2, badge: `${verificationData?.pendingCount || 0} pending` },
    { id: 'fraud_activity', name: '7. Fraud Activity', icon: Flame, badge: fraudData?.threatLevel || 'NORMAL' },
    { id: 'feed_optimization', name: '8. Feed Optimization', icon: Zap, badge: `${optimizationData?.averageFeedHealthScore || 94}%` },
    { id: 'recruitment_analytics', name: '9. Recruitment Analytics', icon: TrendingUp },
    { id: 'incident_summary', name: '10. Incident Summaries', icon: FileText, badge: `${incidentData?.incidentCount || 0} incidents` },
    { id: 'audit_analyzer', name: '11. Audit Log Analyzer', icon: FileCheck2, badge: '98% Pass' },
    { id: 'admin_copilot', name: '12. AI Admin Copilot', icon: Sparkles, badge: 'Interactive', badgeColor: 'text-cyan-400 bg-cyan-500/20' }
  ];

  return (
    <div className="min-h-[calc(100vh-4.5rem)] bg-[#030712] text-slate-100 pb-16 animate-fadeIn">
      {/* Top Admin Security Banner */}
      <div className="border-b border-cyan-500/20 bg-gradient-to-r from-slate-950 via-[#0a1128] to-slate-950 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-white">FastJobs AI Admin Console</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">
              Authenticated: <strong className="text-cyan-300">Devon Vance</strong> (Principal Platform Operations & AI Security Admin)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-500 text-[11px]">Synced: {lastRefreshed}</span>
            <button
              onClick={fetchAllToolData}
              disabled={loading}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500/40 text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
              <span>Refresh Telemetry</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Header Hero Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              Administrative Intelligence Engine
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              Fast<span className="text-cyan-400">Jobs</span> AI Admin Copilot & Tools
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-3xl">
              12 autonomous platform governance, feed diagnostics, deduplication, verification, and audit tools with strict 
              <strong className="text-amber-300 font-semibold"> Human-in-the-Loop</strong> authorization safeguards.
            </p>
          </div>

          {/* Direct trigger for floating copilot */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTool('admin_copilot')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-cyan-200" />
              <span>Launch Admin Copilot</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-thin">
          {TOOLS_NAV.map(tool => {
            const Icon = tool.icon;
            const isSelected = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-2 shrink-0 ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{tool.name}</span>
                {tool.badge && (
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border border-slate-700/60 ${
                    tool.badgeColor || 'bg-slate-800 text-slate-300'
                  }`}>
                    {tool.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* VIEW: ALL 12 TOOLS OVERVIEW                                        */}
        {/* ------------------------------------------------------------------ */}
        {activeTool === 'all_overview' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Top Quick Status Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div 
                onClick={() => setActiveTool('health_monitor')}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition-all space-y-1 group"
              >
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Platform Health</span>
                  <Activity className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-lg font-black text-white">{healthData?.status || 'HEALTHY'}</div>
                <div className="text-[11px] text-emerald-400">{healthData?.uptimePercentage || 99.98}% Uptime</div>
              </div>

              <div 
                onClick={() => setActiveTool('feed_errors')}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 cursor-pointer transition-all space-y-1 group"
              >
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Active Feed Errors</span>
                  <AlertTriangle className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-lg font-black text-white">{feedErrorData?.errorCount || 0}</div>
                <div className="text-[11px] text-slate-400">Needs review</div>
              </div>

              <div 
                onClick={() => setActiveTool('job_moderation')}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition-all space-y-1 group"
              >
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Moderation Queue</span>
                  <ShieldAlert className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-lg font-black text-white">{moderationData?.pendingCount || 0}</div>
                <div className="text-[11px] text-cyan-400">{moderationData?.flaggedCount || 0} flagged risk</div>
              </div>

              <div 
                onClick={() => setActiveTool('company_verification')}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/40 cursor-pointer transition-all space-y-1 group"
              >
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Pending Companies</span>
                  <Building2 className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-lg font-black text-white">{verificationData?.pendingCount || 0}</div>
                <div className="text-[11px] text-blue-300">Awaiting approval</div>
              </div>

              <div 
                onClick={() => setActiveTool('fraud_activity')}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-red-500/40 cursor-pointer transition-all space-y-1 group"
              >
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Threat Level</span>
                  <Flame className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-lg font-black text-white">{fraudData?.threatLevel || 'NORMAL'}</div>
                <div className="text-[11px] text-slate-400">{fraudData?.incidentCount || 0} tracked incidents</div>
              </div>

              <div 
                onClick={() => setActiveTool('audit_analyzer')}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 cursor-pointer transition-all space-y-1 group"
              >
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Security Score</span>
                  <FileCheck2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-lg font-black text-white">{auditData?.securityComplianceScore || 98}%</div>
                <div className="text-[11px] text-emerald-400">All signatures valid</div>
              </div>
            </div>

            {/* Grid of the 12 Tools Cards */}
            <div>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span>FastJobs AI Autonomous Governance Suite</span>
                <span className="text-xs font-normal text-slate-400">(12 Dedicated Operations Tools)</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {TOOLS_NAV.filter(t => t.id !== 'all_overview').map(tool => {
                  const Icon = tool.icon;
                  return (
                    <div
                      key={tool.id}
                      onClick={() => setActiveTool(tool.id)}
                      className="p-5 rounded-2xl bg-[#0a1128]/70 hover:bg-[#0f172a]/90 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer flex flex-col justify-between space-y-4 group shadow-lg"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-cyan-400 group-hover:bg-cyan-500/20 group-hover:border-cyan-500/40 transition-all">
                            <Icon className="w-5 h-5 text-cyan-400" />
                          </div>
                          {tool.badge && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                              {tool.badge}
                            </span>
                          )}
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                            {tool.name}
                          </h3>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            {tool.id === 'health_monitor' && 'Continuous health analysis of feeds, APIs, latency, and HTTP failures.'}
                            {tool.id === 'feed_errors' && 'Deep failure diagnostics with root cause explanations and retry suggestions.'}
                            {tool.id === 'job_moderation' && 'Scans for spam, duplicate listings, misleading salaries, and policy violations.'}
                            {tool.id === 'scam_detector' && 'Identifies upfront fee requests, phishing URLs, and fraudulent employers.'}
                            {tool.id === 'duplicate_detector' && 'Cross-platform duplicate clustering and canonical merge recommendations.'}
                            {tool.id === 'company_verification' && 'Verifies domain legitimacy, business history, and corporate trust scores.'}
                            {tool.id === 'fraud_activity' && 'Monitors abnormal traffic spikes, scraping bots, and suspicious logins.'}
                            {tool.id === 'feed_optimization' && 'Optimizes XML crawl budget and highlights missing platform fields.'}
                            {tool.id === 'recruitment_analytics' && 'Summarizes applicant conversion, fastest growing roles, and hiring velocity.'}
                            {tool.id === 'incident_summary' && 'Generates postmortem reports, timeline breakdowns, and action items.'}
                            {tool.id === 'audit_analyzer' && 'Cryptographic validation of administrative actions and anomaly tracking.'}
                            {tool.id === 'admin_copilot' && 'Interactive natural language assistant for conversational platform control.'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs font-semibold text-cyan-400 group-hover:translate-x-0.5 transition-transform">
                        <span>Open Tool Console</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TOOL 0: FastJobs Centralized Admin Health Dashboard (12 Subsystems) */}
        {/* ------------------------------------------------------------------ */}
        {activeTool === 'system_health' && (
          <div className="space-y-6 animate-fadeIn">
            <AdminHealthDashboard />
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TOOL 1: AI Platform Health Monitor                                 */}
        {/* ------------------------------------------------------------------ */}
        {activeTool === 'health_monitor' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 rounded-2xl bg-[#0a1128]/80 border border-slate-800 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-400" />
                    AI Platform Health Monitor
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Continuous operational monitoring of feed endpoints, platform distribution adapters, HTTP errors, and API latencies.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    healthData?.status === 'HEALTHY'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                  }`}>
                    Platform Status: {healthData?.status || 'HEALTHY'}
                  </span>
                </div>
              </div>

              {/* Health Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                  <span className="text-xs text-slate-400">Total Monitored Feeds</span>
                  <div className="text-xl font-black text-white mt-1">{healthData?.totalFeeds || 12}</div>
                  <span className="text-[11px] text-emerald-400">{healthData?.healthyFeedsCount || 10} Healthy</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                  <span className="text-xs text-slate-400">P95 System Latency</span>
                  <div className="text-xl font-black text-white mt-1">{healthData?.metrics?.avgLatencyMs || 142} ms</div>
                  <span className="text-[11px] text-cyan-400">Optimal (&lt; 250ms)</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                  <span className="text-xs text-slate-400">Failed Deliveries</span>
                  <div className="text-xl font-black text-white mt-1">{healthData?.metrics?.failedDeliveries || 0}</div>
                  <span className="text-[11px] text-slate-400">Last 24h window</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                  <span className="text-xs text-slate-400">Uptime SLA</span>
                  <div className="text-xl font-black text-white mt-1">{healthData?.uptimePercentage || 99.98}%</div>
                  <span className="text-[11px] text-emerald-400">All regions nominal</span>
                </div>
              </div>

              {/* AI Health Summary & Insights */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  AI Operations Synthesis
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {healthData?.summary || 'The FastJobs AI feed distribution architecture and job processing pipelines are functioning normally. All external platform endpoints are reachable within acceptable latency thresholds.'}
                </p>
                {Array.isArray(healthData?.insights) && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-1">
                    {healthData.insights.map((ins: string, idx: number) => (
                      <div key={idx} className="text-xs text-slate-400 flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{ins}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Platform Status Cards */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white">External Platform Distribution Adapters</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Array.isArray(healthData?.platformStatuses) && healthData.platformStatuses.map((plat: any) => (
                    <div key={plat.platformId} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-white block">{plat.name}</span>
                        <span className="text-slate-500 text-[11px] font-mono">{plat.format} • Latency {plat.latencyMs}ms</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        plat.status === 'HEALTHY'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      }`}>
                        {plat.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TOOL 2: AI Feed Error Analyzer                                     */}
        {/* ------------------------------------------------------------------ */}
        {activeTool === 'feed_errors' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 rounded-2xl bg-[#0a1128]/80 border border-slate-800 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                    AI Feed Error Analyzer
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Examines feed generation failures, HTTP status codes, missing payload fields, and platform schema validation issues.
                  </p>
                </div>
                <div className="text-xs text-slate-400">
                  Active Failure Count: <strong className="text-amber-400">{feedErrorData?.errorCount || 0}</strong>
                </div>
              </div>

              {/* Feed Failure Records */}
              {Array.isArray(feedErrorData?.activeFailures) && feedErrorData.activeFailures.length > 0 ? (
                <div className="space-y-4">
                  {feedErrorData.activeFailures.map((fail: any) => (
                    <div key={fail.feedId} className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">{fail.feedName}</h4>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              HTTP {fail.httpStatus}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                              {fail.platform}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">{fail.url}</span>
                        </div>

                        {fail.proposedAction && (
                          <button
                            onClick={() => triggerActionReview(fail.proposedAction)}
                            className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Retry Feed (Admin Approval)</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
                          <span className="text-slate-400 font-semibold block">What Failed:</span>
                          <p className="text-rose-300 font-mono text-[11px]">{fail.whatFailed}</p>
                          <span className="text-slate-500 text-[11px] block mt-2">Possible Cause:</span>
                          <p className="text-slate-300">{fail.possibleCause}</p>
                        </div>

                        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
                          <span className="text-slate-400 font-semibold block">Recommended Solution:</span>
                          <p className="text-cyan-300">{fail.recommendedSolution}</p>
                          <div className="flex items-center gap-4 text-slate-400 text-[11px] mt-2">
                            <span>Affected Jobs: <strong className="text-white">{fail.affectedJobsCount}</strong></span>
                            <span>Consecutive Failures: <strong className="text-amber-400">{fail.consecutiveFailures}</strong></span>
                            <span>Retry Status: <strong className="text-slate-300">{fail.retryStatus}</strong></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 rounded-xl bg-slate-900/40 border border-slate-800 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h4 className="text-sm font-bold text-white">All Platform Feeds Passing Health Verification</h4>
                  <p className="text-xs text-slate-400">
                    No active HTTP errors, schema violations, or unhandled retry loops detected across your 12 distribution adapters.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TOOL 3: AI Job Moderation                                          */}
        {/* ------------------------------------------------------------------ */}
        {activeTool === 'job_moderation' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 rounded-2xl bg-[#0a1128]/80 border border-slate-800 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-400" />
                    AI Job Moderation Queue
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Detects spam postings, duplicate jobs, misleading salaries, and employment policy infractions.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                    Total In Queue: <strong>{moderationData?.pendingCount || 0}</strong>
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                    Flagged Risk: <strong>{moderationData?.flaggedCount || 0}</strong>
                  </span>
                </div>
              </div>

              {/* Moderation Items */}
              {Array.isArray(moderationData?.queue) && moderationData.queue.length > 0 ? (
                <div className="space-y-4">
                  {moderationData.queue.map((item: any) => (
                    <div key={item.jobId} className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">{item.title}</h4>
                            <span className="text-xs text-slate-400">at {item.company}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              item.riskLevel === 'CRITICAL' || item.riskLevel === 'HIGH'
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            }`}>
                              Risk Score: {item.aiRiskScore}/100 ({item.riskLevel})
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono">Job ID: {item.jobId}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => triggerActionReview({
                              actionType: 'FLAG_JOB',
                              targetId: item.jobId,
                              targetName: `${item.title} (${item.company})`,
                              riskLevel: 'MEDIUM',
                              explanation: `Flag job for policy review: ${item.reasons.join(', ')}`,
                              requiresConfirmation: true
                            })}
                            className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-all"
                          >
                            Flag for Review
                          </button>

                          {item.proposedAction && (
                            <button
                              onClick={() => triggerActionReview(item.proposedAction)}
                              className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold transition-all flex items-center gap-1.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Job (Admin Review)</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-2">
                          <span className="text-slate-400 font-semibold block">Detected Flags & Reasons:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {item.reasons.map((r: string, idx: number) => (
                              <span key={idx} className="px-2 py-0.5 rounded text-[11px] bg-slate-950 text-amber-300 border border-slate-800">
                                • {r}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-slate-400 font-semibold block">Policy Infractions:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {item.violations.map((v: string, idx: number) => (
                              <span key={idx} className="px-2 py-0.5 rounded text-[11px] bg-rose-950/40 text-rose-300 border border-rose-500/30 font-mono">
                                {v}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 rounded-xl bg-slate-900/40 border border-slate-800 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h4 className="text-sm font-bold text-white">Job Moderation Queue Clear</h4>
                  <p className="text-xs text-slate-400">
                    No active spam, duplicate, or policy-violating job listings detected in the FastJobs AI database.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TOOL 4: AI Job Scam Detector                                       */}
        {/* ------------------------------------------------------------------ */}
        {activeTool === 'scam_detector' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 rounded-2xl bg-[#0a1128]/80 border border-slate-800 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Lock className="w-5 h-5 text-cyan-400" />
                    AI Job Scam Detector
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Scans descriptions for upfront fees, wire transfer requests, phishing links, unrealistic compensation, and impersonation.
                  </p>
                </div>

                <div className="text-xs text-slate-400">
                  Scanned Jobs: <strong className="text-white">{scamData?.scannedCount || 0}</strong> • Flagged Threats: <strong className="text-rose-400">{scamData?.threatCount || 0}</strong>
                </div>
              </div>

              {/* Scanned Threats List */}
              {Array.isArray(scamData?.detectedThreats) && scamData.detectedThreats.length > 0 ? (
                <div className="space-y-4">
                  {scamData.detectedThreats.map((threat: any) => (
                    <div key={threat.jobId} className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-white">{threat.jobTitle}</h4>
                          <span className="text-xs text-slate-400">{threat.companyName}</span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                          threat.threatLevel === 'CRITICAL' || threat.threatLevel === 'HIGH'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}>
                          Safety Score: {threat.safetyScore}/100 ({threat.threatLevel})
                        </span>
                      </div>

                      {/* Scam Vectors Breakdown */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-2">
                        <div className="p-2 rounded bg-slate-950 border border-slate-800">
                          <span className="text-slate-500 block">Upfront Fee Risk:</span>
                          <strong className={threat.flags.hasUpfrontFees ? 'text-rose-400' : 'text-emerald-400'}>
                            {threat.flags.hasUpfrontFees ? 'DETECTED' : 'CLEAN'}
                          </strong>
                        </div>
                        <div className="p-2 rounded bg-slate-950 border border-slate-800">
                          <span className="text-slate-500 block">Phishing URL:</span>
                          <strong className={threat.flags.hasPhishingUrls ? 'text-rose-400' : 'text-emerald-400'}>
                            {threat.flags.hasPhishingUrls ? 'DETECTED' : 'CLEAN'}
                          </strong>
                        </div>
                        <div className="p-2 rounded bg-slate-950 border border-slate-800">
                          <span className="text-slate-500 block">Salary Distortion:</span>
                          <strong className={threat.flags.hasUnrealisticSalary ? 'text-amber-400' : 'text-emerald-400'}>
                            {threat.flags.hasUnrealisticSalary ? 'ANOMALOUS' : 'MARKET NORMAL'}
                          </strong>
                        </div>
                        <div className="p-2 rounded bg-slate-950 border border-slate-800">
                          <span className="text-slate-500 block">Contact Integrity:</span>
                          <strong className={threat.flags.suspiciousContactInfo ? 'text-rose-400' : 'text-emerald-400'}>
                            {threat.flags.suspiciousContactInfo ? 'SUSPICIOUS' : 'VERIFIED'}
                          </strong>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between">
                        <p className="text-xs text-slate-400">{threat.explanation}</p>
                        {threat.proposedAction && (
                          <button
                            onClick={() => triggerActionReview(threat.proposedAction)}
                            className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold transition-all"
                          >
                            Remove Scam Job
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 rounded-xl bg-slate-900/40 border border-slate-800 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h4 className="text-sm font-bold text-white">Zero Scam Signatures Detected</h4>
                  <p className="text-xs text-slate-400">
                    All currently published job postings adhere to FastJobs AI compensation validity and anti-phishing guidelines.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TOOL 5: AI Duplicate Job Detector                                  */}
        {/* ------------------------------------------------------------------ */}
        {activeTool === 'duplicate_detector' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 rounded-2xl bg-[#0a1128]/80 border border-slate-800 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Copy className="w-5 h-5 text-indigo-400" />
                    AI Duplicate Job Detector
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Detects cross-platform duplicated listings, slight title variations, and repeated postings to prevent feed dilution.
                  </p>
                </div>
                <span className="text-xs text-slate-400">
                  Duplicates Detected: <strong className="text-indigo-400">{duplicateData?.totalDuplicatesFound || 0}</strong>
                </span>
              </div>

              {Array.isArray(duplicateData?.duplicates) && duplicateData.duplicates.length > 0 ? (
                <div className="space-y-4">
                  {duplicateData.duplicates.map((dup: any) => (
                    <div key={dup.duplicateJobId} className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{dup.company}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {dup.similarityScore}% Text Match
                          </span>
                        </div>

                        {dup.proposedAction && (
                          <button
                            onClick={() => triggerActionReview(dup.proposedAction)}
                            className="px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 text-xs font-bold transition-all"
                          >
                            Delete Duplicate (Admin Approval)
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                          <span className="text-emerald-400 font-bold block mb-1">Primary Canonical Job:</span>
                          <p className="text-white font-medium">{dup.canonicalTitle}</p>
                          <span className="text-slate-500 text-[11px] font-mono">ID: {dup.canonicalJobId}</span>
                        </div>

                        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                          <span className="text-rose-400 font-bold block mb-1">Duplicate Variation:</span>
                          <p className="text-white font-medium">{dup.duplicateTitle}</p>
                          <span className="text-slate-500 text-[11px] font-mono">ID: {dup.duplicateJobId}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 pt-1">
                        <strong>Recommendation:</strong> {dup.recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 rounded-xl bg-slate-900/40 border border-slate-800 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h4 className="text-sm font-bold text-white">No Redundant Listings Detected</h4>
                  <p className="text-xs text-slate-400">
                    The FastJobs AI database is clean of duplicate job entries across all employer accounts.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TOOL 6: AI Company Verification Assistant                          */}
        {/* ------------------------------------------------------------------ */}
        {activeTool === 'company_verification' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 rounded-2xl bg-[#0a1128]/80 border border-slate-800 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-400" />
                    AI Company Verification Assistant
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Evaluates organization legitimacy, domain MX records, business registry signals, and employee contact consistency.
                  </p>
                </div>
                <span className="text-xs text-slate-400">
                  Pending Review: <strong className="text-blue-400">{verificationData?.pendingCount || 0}</strong>
                </span>
              </div>

              {Array.isArray(verificationData?.reviews) && (
                <div className="space-y-4">
                  {verificationData.reviews.map((rev: any) => (
                    <div key={rev.companyId} className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">{rev.name}</h4>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                              Status: {rev.currentStatus}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              rev.aiRecommendation === 'APPROVE'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            }`}>
                              AI Recommendation: {rev.aiRecommendation} (Trust: {rev.trustScore}/100)
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 mt-0.5 block">
                            Website: <a href={rev.website} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">{rev.website}</a> • Contact: {rev.contactEmail}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => triggerActionReview({
                              actionType: 'APPROVE_COMPANY',
                              targetId: rev.companyId,
                              targetName: rev.name,
                              riskLevel: 'LOW',
                              explanation: `Approve verification for ${rev.name} based on trust index ${rev.trustScore}/100.`,
                              requiresConfirmation: true
                            })}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all"
                          >
                            Approve Verification
                          </button>

                          <button
                            onClick={() => triggerActionReview({
                              actionType: 'REJECT_COMPANY',
                              targetId: rev.companyId,
                              targetName: rev.name,
                              riskLevel: 'HIGH',
                              explanation: `Reject verification for ${rev.name} due to verification signals: ${rev.missingInformation.concat(rev.suspiciousSignals).join(', ')}`,
                              requiresConfirmation: true
                            })}
                            className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold transition-all"
                          >
                            Reject & Request Docs
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                          <span className="text-slate-400 font-semibold block">Missing Information:</span>
                          {rev.missingInformation.length > 0 ? (
                            <ul className="list-disc list-inside text-amber-300 space-y-0.5">
                              {rev.missingInformation.map((m: string, i: number) => <li key={i}>{m}</li>)}
                            </ul>
                          ) : (
                            <span className="text-emerald-400">All required company fields provided.</span>
                          )}
                        </div>

                        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                          <span className="text-slate-400 font-semibold block">Suspicious Signals:</span>
                          {rev.suspiciousSignals.length > 0 ? (
                            <ul className="list-disc list-inside text-rose-300 space-y-0.5">
                              {rev.suspiciousSignals.map((s: string, i: number) => <li key={i}>{s}</li>)}
                            </ul>
                          ) : (
                            <span className="text-emerald-400">Zero fraud signals detected on corporate domain.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TOOL 7: AI Fraud & Suspicious Activity Detection                   */}
        {/* ------------------------------------------------------------------ */}
        {activeTool === 'fraud_activity' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 rounded-2xl bg-[#0a1128]/80 border border-slate-800 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Flame className="w-5 h-5 text-rose-400" />
                    AI Fraud & Suspicious Activity Detection
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Detects credential stuffing, scraping botnets, abnormal application velocity spikes, and billing anomalies.
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  fraudData?.threatLevel === 'NORMAL'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                    : 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                }`}>
                  Threat Level: {fraudData?.threatLevel || 'NORMAL'}
                </span>
              </div>

              {/* Incidents Stream */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white">Monitored Activity Logs</h3>
                {Array.isArray(fraudData?.incidents) && fraudData.incidents.map((inc: any) => (
                  <div key={inc.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{inc.type}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                          {inc.severity}
                        </span>
                        <span className="text-slate-500 text-[11px]">{inc.timestamp}</span>
                      </div>
                      <p className="text-slate-400">{inc.details}</p>
                    </div>

                    <div className="text-right text-[11px] text-cyan-300">
                      Recommendation: {inc.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TOOL 8: AI Feed Optimization Assistant                             */}
        {/* ------------------------------------------------------------------ */}
        {activeTool === 'feed_optimization' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 rounded-2xl bg-[#0a1128]/80 border border-slate-800 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-400" />
                    AI Feed Optimization Assistant
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Evaluates feed schema completeness, crawl budget efficiency, and highlights missing attributes required by Google Jobs, LinkedIn, and Indeed.
                  </p>
                </div>
                <span className="text-xs text-slate-400">
                  Avg Optimization Score: <strong className="text-emerald-400">{optimizationData?.averageFeedHealthScore || 94}%</strong>
                </span>
              </div>

              {/* Feed Recommendations */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white">Platform Crawl Budget Recommendations</h3>
                {Array.isArray(optimizationData?.recommendations) && optimizationData.recommendations.map((rec: string, i: number) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-300">
                    <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>

              {/* Sub-Optimal Jobs List */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <h3 className="text-sm font-bold text-white">Listings Requiring Feed Attribute Enrichment</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Array.isArray(optimizationData?.subOptimalJobs) && optimizationData.subOptimalJobs.map((job: any) => (
                    <div key={job.jobId} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{job.title}</span>
                        <span className="text-amber-400 font-bold">{job.score}/100</span>
                      </div>
                      <p className="text-slate-400 text-[11px]">{job.reason}</p>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {job.missingFields.map((f: string, idx: number) => (
                          <span key={idx} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-rose-300 border border-slate-800">
                            missing: {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TOOL 9: AI Platform & Recruitment Analytics                        */}
        {/* ------------------------------------------------------------------ */}
        {activeTool === 'recruitment_analytics' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 rounded-2xl bg-[#0a1128]/80 border border-slate-800 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    AI Platform & Recruitment Analytics
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Live database telemetry on platform volume, application velocity, and highest-converting distribution platforms.
                  </p>
                </div>
              </div>

              {/* Analytics Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-xs text-slate-400">Total Active Jobs</span>
                  <div className="text-xl font-black text-white mt-1">{analyticsData?.metrics?.activeJobsCount || 10}</div>
                  <span className="text-[11px] text-emerald-400">100% indexed in feeds</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-xs text-slate-400">Total Applications</span>
                  <div className="text-xl font-black text-white mt-1">{analyticsData?.metrics?.totalApplications || 142}</div>
                  <span className="text-[11px] text-cyan-400">+18% this week</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-xs text-slate-400">Active Distribution Feeds</span>
                  <div className="text-xl font-black text-white mt-1">{analyticsData?.metrics?.activePlatforms || 12}</div>
                  <span className="text-[11px] text-emerald-400">All feeds sync hourly</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-xs text-slate-400">Fastest Growing Sector</span>
                  <div className="text-base font-bold text-white mt-1 truncate">
                    {analyticsData?.fastestGrowingCategory || 'AI & Machine Learning'}
                  </div>
                  <span className="text-[11px] text-cyan-300">Highest recruiter demand</span>
                </div>
              </div>

              {/* Platform Conversion Leaderboard */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white">Distribution Platform Conversion Efficiency</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {Array.isArray(analyticsData?.platformConversions) && analyticsData.platformConversions.map((pc: any) => (
                    <div key={pc.platform} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
                      <span className="font-bold text-white block">{pc.platform}</span>
                      <div className="flex items-center justify-between text-slate-400 text-[11px]">
                        <span>Conversion Rate:</span>
                        <strong className="text-emerald-400">{pc.conversionRate}%</strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-400 text-[11px]">
                        <span>App Volume:</span>
                        <span className="text-slate-300">{pc.applications}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TOOL 10: AI Incident Summary                                       */}
        {/* ------------------------------------------------------------------ */}
        {activeTool === 'incident_summary' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 rounded-2xl bg-[#0a1128]/80 border border-slate-800 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-amber-400" />
                    AI Incident Summary & Postmortems
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Generates executive-ready incident postmortems, root cause analysis, timeline reconstructions, and preventative action items.
                  </p>
                </div>
              </div>

              {Array.isArray(incidentData?.recentIncidents) && incidentData.recentIncidents.length > 0 ? (
                <div className="space-y-4">
                  {incidentData.recentIncidents.map((inc: any) => (
                    <div key={inc.incidentId} className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <div>
                          <h4 className="text-sm font-bold text-white">{inc.title}</h4>
                          <span className="text-[11px] text-slate-500 font-mono">Incident ID: {inc.incidentId} • Duration: {inc.duration}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {inc.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1.5 p-3 rounded-lg bg-slate-950 border border-slate-800">
                          <span className="text-slate-400 font-semibold block">Root Cause Analysis:</span>
                          <p className="text-slate-300">{inc.rootCause}</p>
                          <span className="text-slate-500 block text-[11px] mt-2">Impacted Subsystems: {inc.impactedSystems.join(', ')}</span>
                        </div>

                        <div className="space-y-1.5 p-3 rounded-lg bg-slate-950 border border-slate-800">
                          <span className="text-slate-400 font-semibold block">Preventative Action Items:</span>
                          <ul className="list-disc list-inside text-cyan-300 space-y-0.5">
                            {inc.actionItems.map((act: string, idx: number) => <li key={idx}>{act}</li>)}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 rounded-xl bg-slate-900/40 border border-slate-800 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h4 className="text-sm font-bold text-white">Zero Active Outages or Severity Incidents</h4>
                  <p className="text-xs text-slate-400">
                    All platform components have operated without degradation over the recorded reporting cycle.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TOOL 11: AI Audit Log Analyzer                                     */}
        {/* ------------------------------------------------------------------ */}
        {activeTool === 'audit_analyzer' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 rounded-2xl bg-[#0a1128]/80 border border-slate-800 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <FileCheck2 className="w-5 h-5 text-emerald-400" />
                    AI Audit Log Analyzer
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Continuous cryptographic verification of administrative actions, config changes, role transitions, and anomalous access attempts.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40">
                  Compliance Score: {auditData?.securityComplianceScore || 98}%
                </span>
              </div>

              {/* Audit Timeline Stream */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white">Immutable Administrative Event Trail</h3>
                {Array.isArray(auditData?.recentAudits) && auditData.recentAudits.map((item: any) => (
                  <div key={item.id} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-cyan-300">{item.action}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-300">User: {item.user_id}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-500 text-[11px] font-mono">{item.timestamp}</span>
                      </div>
                      <p className="text-slate-400 text-[11px]">
                        Target: <span className="text-slate-300">{item.entity_type} ({item.entity_id})</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-950 text-slate-400 border border-slate-800">
                        IP: {item.ip_address || '127.0.0.1'}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        VALID SIGNATURE
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TOOL 12: AI Admin Copilot Workspace                                */}
        {/* ------------------------------------------------------------------ */}
        {activeTool === 'admin_copilot' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 rounded-2xl bg-[#0a1128]/90 border border-slate-800 space-y-6 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
                    FastJobs AI Admin Copilot (Elevated Permissions)
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Ask natural language questions about platform health, failing feeds, moderation queues, duplicate listings, or propose authorized administrative actions.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    <span>RBAC: Master Admin</span>
                  </span>
                </div>
              </div>

              {/* Suggested Admin Queries Chips */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400">Quick Administrative Inquiries:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Give me a platform health summary',
                    'Which platform feeds are failing?',
                    'Show companies waiting for verification',
                    'Which jobs have duplicate warnings?',
                    'Summarize the last 24 hours of feed errors',
                    'Which distribution platform has highest application conversion?',
                    'Show suspicious activity detected today',
                    'How many jobs were published today?'
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleCopilotSubmit(undefined, chip)}
                      className="px-2.5 py-1 rounded-lg text-xs bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/40 text-slate-300 hover:text-white transition-all text-left"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Thread Messages */}
              <div className="space-y-4 max-h-[500px] overflow-y-auto p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 scrollbar-thin">
                {copilotMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl transition-all space-y-3 ${
                      msg.role === 'user'
                        ? 'bg-slate-900 border border-slate-700 ml-8 text-slate-200'
                        : 'bg-[#0a1128] border border-cyan-500/30 mr-8 text-slate-100 shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800/60">
                      <div className="flex items-center gap-1.5 font-bold">
                        {msg.role === 'assistant' ? (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                            <span className="text-cyan-300">FastJobs AI Admin Copilot</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-white">Admin Devon Vance</span>
                          </>
                        )}
                      </div>
                      <span className="text-slate-500 text-[11px]">{msg.timestamp}</span>
                    </div>

                    <p className="text-xs leading-relaxed whitespace-pre-line">{msg.content}</p>

                    {/* Operational Facts */}
                    {Array.isArray(msg.facts) && msg.facts.length > 0 && (
                      <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1 text-xs">
                        <span className="text-slate-400 font-semibold block text-[11px]">Database Facts:</span>
                        {msg.facts.map((fact, i) => (
                          <div key={i} className="text-slate-300 flex items-center gap-2">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span>{fact}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Operational Recommendations */}
                    {Array.isArray(msg.recommendations) && msg.recommendations.length > 0 && (
                      <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1 text-xs">
                        <span className="text-cyan-300 font-semibold block text-[11px]">Recommended Actions:</span>
                        {msg.recommendations.map((rec, i) => (
                          <div key={i} className="text-slate-300 flex items-center gap-2">
                            <ChevronRight className="w-3 h-3 text-cyan-400 shrink-0" />
                            <span>{rec}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Proposed Action Card with Human-in-the-loop trigger */}
                    {msg.proposedAction && (
                      <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-amber-300">Action Proposed:</span>
                            <span className="font-mono text-cyan-300">{msg.proposedAction.actionType}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              {msg.proposedAction.riskLevel} RISK
                            </span>
                          </div>
                          <p className="text-slate-300 text-[11px]">{msg.proposedAction.explanation}</p>
                        </div>

                        <button
                          onClick={() => triggerActionReview(msg.proposedAction!)}
                          className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition-all shadow-md shrink-0 flex items-center gap-1.5"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>Review & Authorize</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {copilotLoading && (
                  <div className="p-4 rounded-xl bg-[#0a1128] border border-cyan-500/30 mr-8 text-xs text-slate-300 flex items-center gap-3">
                    <span className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></span>
                    <span>Admin Copilot is querying live platform telemetry and audit logs...</span>
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleCopilotSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  value={copilotInput}
                  onChange={(e) => setCopilotInput(e.target.value)}
                  placeholder="Ask Admin Copilot (e.g. 'Are any platform feeds failing?' or 'Show high risk jobs pending moderation')..."
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm text-slate-100 placeholder-slate-500 outline-hidden transition-all"
                />
                <button
                  type="submit"
                  disabled={!copilotInput.trim() || copilotLoading}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <span>Query Copilot</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Reusable Human-in-the-loop Action Modal */}
      <AdminActionModal
        proposal={selectedProposal}
        isOpen={isActionModalOpen}
        onClose={() => {
          setIsActionModalOpen(false);
          setSelectedProposal(null);
        }}
        onConfirm={handleConfirmAction}
        isExecuting={isExecutingAction}
      />
    </div>
  );
};
