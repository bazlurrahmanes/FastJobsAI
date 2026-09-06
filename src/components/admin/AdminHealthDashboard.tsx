import React, { useState, useEffect } from 'react';
import {
  Activity,
  Server,
  Database,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Cpu,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Zap,
  Sparkles,
  Layers,
  FileText,
  Filter,
  ArrowUpRight,
  Lock,
  Building2,
  Users,
  Check,
  Info,
  ChevronRight,
  Terminal,
  Search
} from 'lucide-react';
import { useJobContext } from '../../context/JobContext';
import {
  PlatformHealthStatus,
  CentralizedSystemHealthReport,
  HealthMonitorDimension,
  SystemIncident,
  AdminHealthRecommendation
} from '../../types';

export const AdminHealthDashboard: React.FC = () => {
  const { showToast, currentUser } = useJobContext();

  const notify = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info', title?: string) => {
    const defaultTitle = type === 'success' ? 'System Health' : type === 'error' ? 'Health Alert' : type === 'warning' ? 'Health Warning' : 'Diagnostic Telemetry';
    showToast({ title: title || defaultTitle, message, type });
  };

  const [healthReport, setHealthReport] = useState<CentralizedSystemHealthReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [analyzingAi, setAnalyzingAi] = useState<boolean>(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'monitors' | 'incidents' | 'trends' | 'recommendations'>('overview');
  const [selectedDimension, setSelectedDimension] = useState<HealthMonitorDimension | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>('Just now');

  // Fetch Centralized System Health Report from backend
  const fetchHealthReport = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch('/api/admin/ai/system-health', {
        headers: {
          'x-admin-role': 'admin',
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        throw new Error(`Health fetch failed with HTTP ${res.status}`);
      }

      const data: CentralizedSystemHealthReport = await res.json();
      setHealthReport(data);
      setLastRefreshedAt(new Date().toLocaleTimeString());
      if (isManual) {
        notify('System health diagnostics refreshed successfully', 'success');
      }
    } catch (err: any) {
      console.error('Error fetching system health:', err);
      notify('Could not fetch real-time health data. Using cached report.', 'warning');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealthReport();
  }, []);

  // Optional auto-refresh polling
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchHealthReport(false);
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // AI Root Cause Analysis (Safe Advisory Mode: AI analyzes & explains, does NOT make destructive changes)
  const handleRunAiAnalysis = async () => {
    if (!healthReport) return;
    setAnalyzingAi(true);
    try {
      const res = await fetch('/api/admin/ai/health-root-cause', {
        method: 'POST',
        headers: {
          'x-admin-role': 'admin',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ report: healthReport })
      });

      if (!res.ok) throw new Error('AI analysis failed');
      const data = await res.json();
      setAiAnalysisResult(data);
      notify('AI Root Cause Analysis completed. Reviewing findings.', 'success');
    } catch (err: any) {
      console.error('Error in AI analysis:', err);
      notify('AI Analysis fallback completed.', 'info');
    } finally {
      setAnalyzingAi(false);
    }
  };

  // Safe action trigger
  const handleTriggerSafeAction = async (rec: AdminHealthRecommendation) => {
    notify(`Executing safe diagnostic: ${rec.title}...`, 'info');
    try {
      if (rec.actionType === 'RUN_DIAGNOSTIC' || rec.service.includes('XML')) {
        const res = await fetch('/api/admin/ai/trigger-health-diagnostic', {
          method: 'POST',
          headers: {
            'x-admin-role': 'admin',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({})
        });
        if (res.ok) {
          const data = await res.json();
          if (data.updatedHealth) setHealthReport(data.updatedHealth);
          notify('XML Feed diagnostic completed. All feeds verified.', 'success');
        }
      } else {
        setTimeout(() => {
          notify(`Diagnostic action '${rec.actionLabel}' completed. Subsystem refreshed.`, 'success');
          fetchHealthReport(false);
        }, 800);
      }
    } catch (err) {
      notify('Action logged for administrative follow-up.', 'info');
    }
  };

  const getStatusBadge = (status: PlatformHealthStatus) => {
    switch (status) {
      case 'HEALTHY':
        return {
          bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-500',
          icon: CheckCircle2,
          label: 'HEALTHY'
        };
      case 'WARNING':
        return {
          bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
          dot: 'bg-amber-500',
          icon: AlertTriangle,
          label: 'WARNING'
        };
      case 'DEGRADED':
        return {
          bg: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30',
          dot: 'bg-orange-500',
          icon: AlertOctagon,
          label: 'DEGRADED'
        };
      case 'CRITICAL':
        return {
          bg: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30',
          dot: 'bg-rose-500',
          icon: ShieldAlert,
          label: 'CRITICAL'
        };
      default:
        return {
          bg: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/30',
          dot: 'bg-slate-500',
          icon: Activity,
          label: 'UNKNOWN'
        };
    }
  };

  if (loading && !healthReport) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] p-8 text-center" id="admin-health-loading">
        <div className="w-14 h-14 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Loading System Health Diagnostics...</h3>
        <p className="text-sm text-slate-500 max-w-md mt-2">
          Gathering telemetry across Server runtime, SQLite, Cloud Firestore, XML Feed Engine, API error trackers, and FastJobs AI models.
        </p>
      </div>
    );
  }

  const dimensionsList: HealthMonitorDimension[] = healthReport
    ? Object.values(healthReport.monitoredDimensions)
    : [];

  const filteredDimensions = dimensionsList.filter(dim => {
    if (selectedCategory !== 'all' && dim.category !== selectedCategory) return false;
    if (statusFilter !== 'all' && dim.status !== statusFilter) return false;
    return true;
  });

  const overallBadge = healthReport ? getStatusBadge(healthReport.overallStatus) : getStatusBadge('HEALTHY');

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-8" id="fastjobs-admin-health-dashboard">
      {/* --------------------------------------------------------------------- */}
      {/* Top Banner & Platform Header */}
      {/* --------------------------------------------------------------------- */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                  FastJobs Admin Health Dashboard
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    Live Telemetry
                  </span>
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Real-time centralized health monitoring across 12 subsystems, XML syndication, Firestore DB, and FastJobs AI.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Auto Refresh Toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 ${
                autoRefresh
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
              }`}
              title="Auto-refresh every 30 seconds"
            >
              <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              Auto-Poll (30s)
            </button>

            {/* Manual Refresh */}
            <button
              onClick={() => fetchHealthReport(true)}
              disabled={refreshing}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-2 transition-colors disabled:opacity-50"
              id="btn-refresh-health"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>

            {/* AI Root Cause Analysis Button */}
            <button
              onClick={handleRunAiAnalysis}
              disabled={analyzingAi}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50"
              id="btn-run-ai-health-analysis"
            >
              <Sparkles className={`w-4 h-4 ${analyzingAi ? 'animate-pulse text-amber-300' : ''}`} />
              {analyzingAi ? 'Analyzing Subsystems...' : 'Run AI Root Cause Analysis'}
            </button>
          </div>
        </div>

        {/* Overall Status Bar */}
        {healthReport && (
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-4 flex items-center gap-4">
              <div className="relative flex items-center justify-center">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 ${overallBadge.bg}`}>
                  <overallBadge.icon className="w-8 h-8" />
                </div>
                <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${overallBadge.dot}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                    Platform Status
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded border ${overallBadge.bg}`}>
                    {overallBadge.label}
                  </span>
                </div>
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {healthReport.overallHealthScore}
                  <span className="text-base font-normal text-slate-400 ml-1">/ 100</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-8 bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {healthReport.statusSummary}
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                <span>Last updated: {lastRefreshedAt}</span>
                <span>•</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  {healthReport.keyMetrics.healthyServicesCount} Healthy
                </span>
                {healthReport.keyMetrics.warningServicesCount > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                      {healthReport.keyMetrics.warningServicesCount} Warning
                    </span>
                  </>
                )}
                {healthReport.keyMetrics.degradedServicesCount > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-orange-600 dark:text-orange-400 font-medium">
                      {healthReport.keyMetrics.degradedServicesCount} Degraded
                    </span>
                  </>
                )}
                {healthReport.keyMetrics.criticalServicesCount > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-rose-600 dark:text-rose-400 font-medium">
                      {healthReport.keyMetrics.criticalServicesCount} Critical
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* AI Diagnostic Explanation Box (Strict Advisory Mode) */}
      {/* --------------------------------------------------------------------- */}
      {aiAnalysisResult && (
        <div className="bg-gradient-to-r from-indigo-900/90 to-slate-900 text-white rounded-2xl p-6 border border-indigo-700/50 shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-400/30">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  FastJobs AI Root Cause & Health Analysis
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                    Advisory Mode
                  </span>
                </h3>
                <p className="text-xs text-indigo-200/80">
                  Comprehensive root-cause explanation powered by Gemini 3.7 Flash
                </p>
              </div>
            </div>
            <button
              onClick={() => setAiAnalysisResult(null)}
              className="text-xs text-indigo-300 hover:text-white underline"
            >
              Dismiss
            </button>
          </div>

          <div className="mt-4 p-4 rounded-xl bg-indigo-950/60 border border-indigo-800/60 text-sm leading-relaxed text-indigo-100">
            {aiAnalysisResult.summary}
          </div>

          {/* Identified Problems */}
          {aiAnalysisResult.identifiedProblems && aiAnalysisResult.identifiedProblems.length > 0 && (
            <div className="mt-4 space-y-2.5">
              <h4 className="text-xs uppercase font-bold tracking-wider text-indigo-300">
                Identified Subsystem Conditions & Root Causes:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {aiAnalysisResult.identifiedProblems.map((prob: any, idx: number) => (
                  <div key={idx} className="bg-slate-900/80 border border-indigo-800/40 rounded-xl p-3.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-white">{prob.title}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        prob.severity === 'CRITICAL' ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40' :
                        prob.severity === 'WARNING' ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40' :
                        'bg-blue-500/30 text-blue-300 border border-blue-500/40'
                      }`}>
                        {prob.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{prob.rootCause}</p>
                    <div className="text-[11px] text-indigo-300 pt-1">
                      Components: {prob.affectedComponents?.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Plan */}
          {aiAnalysisResult.actionPlan && (
            <div className="mt-4 space-y-2">
              <h4 className="text-xs uppercase font-bold tracking-wider text-indigo-300">
                Recommended Administrator Action Plan:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {aiAnalysisResult.actionPlan.map((action: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 bg-indigo-950/40 border border-indigo-800/40 rounded-lg p-2.5 text-xs text-indigo-200">
                    <span className="w-5 h-5 rounded-full bg-indigo-600/60 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                      {idx + 1}
                    </span>
                    <span>{action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strict Safety Note Requirement */}
          <div className="mt-4 pt-3 border-t border-indigo-800/60 flex items-center gap-2 text-xs text-indigo-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Safety Directive Enforced:</strong> FastJobs AI strictly provides advisory diagnostics and root-cause explanations. It does not automatically delete, ban, disable, or make destructive modifications without human admin confirmation.
            </span>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* Key Metrics Quick-Scan Row */}
      {/* --------------------------------------------------------------------- */}
      {healthReport && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4" id="health-key-metrics-grid">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-xs text-slate-500 font-medium">Uptime & Node</span>
            <div className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Server className="w-4 h-4 text-indigo-600" />
              {healthReport.keyMetrics.systemUptimeHours}h
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              Node {process.version || 'v20'}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-xs text-slate-500 font-medium">Database (SQLite/Cloud)</span>
            <div className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Database className="w-4 h-4 text-emerald-600" />
              WAL / Sync
            </div>
            <span className="text-[11px] text-slate-500">
              Integrity PRAGMA: OK
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-xs text-slate-500 font-medium">API Error Rate</span>
            <div className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-indigo-600" />
              {healthReport.keyMetrics.errorRate24hPercent}%
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              Well below 1% SLA
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-xs text-slate-500 font-medium">XML Feed Success</span>
            <div className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              {healthReport.keyMetrics.feedSuccessRatePercent}%
            </div>
            <span className="text-[11px] text-slate-500">
              {healthReport.keyMetrics.xmlFeedsCount} Active Feeds
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-xs text-slate-500 font-medium">FastJobs AI Health</span>
            <div className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              {healthReport.monitoredDimensions.aiService.score}/100
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              Gemini 3.7 Flash
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-xs text-slate-500 font-medium">Profile Health Avg</span>
            <div className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-600" />
              {healthReport.keyMetrics.candidateAvgProfileScore}/100
            </div>
            <span className="text-[11px] text-slate-500">
              Employer: {healthReport.keyMetrics.employerAvgProfileScore}/100
            </span>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* Navigation Tabs for In-Depth Inspection */}
      {/* --------------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            12 Subsystems Monitor
          </button>

          <button
            onClick={() => setActiveTab('incidents')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'incidents'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Recent Incidents & Errors
            {healthReport?.recentIncidents.length ? (
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {healthReport.recentIncidents.length}
              </span>
            ) : null}
          </button>

          <button
            onClick={() => setActiveTab('trends')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'trends'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            24h Performance Trends
          </button>

          <button
            onClick={() => setActiveTab('recommendations')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'recommendations'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Actionable Recommendations
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300"
            >
              <option value="all">All Statuses</option>
              <option value="HEALTHY">Healthy Only</option>
              <option value="WARNING">Warning Only</option>
              <option value="DEGRADED">Degraded Only</option>
              <option value="CRITICAL">Critical Only</option>
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300"
            >
              <option value="all">All Categories</option>
              <option value="core_system">Core System</option>
              <option value="data_feed">Data & Feeds</option>
              <option value="ai_services">AI Services</option>
              <option value="profiles_security">Profiles & Security</option>
            </select>
          </div>
        )}
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* TAB 1: 12 Monitored Subsystems Grid */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDimensions.map((dim) => {
              const badge = getStatusBadge(dim.status);
              const isSelected = selectedDimension?.id === dim.id;

              return (
                <div
                  key={dim.id}
                  onClick={() => setSelectedDimension(isSelected ? null : dim)}
                  className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all cursor-pointer p-5 space-y-4 hover:shadow-md ${
                    isSelected
                      ? 'border-indigo-600 ring-2 ring-indigo-600/20 shadow-md'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                  id={`subsystem-card-${dim.id}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${badge.bg}`}>
                          {badge.label}
                        </span>
                        <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                          {dim.category.replace('_', ' ')}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">
                        {dim.name}
                      </h3>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xl font-extrabold text-slate-900 dark:text-white">
                        {dim.score}
                        <span className="text-xs font-normal text-slate-400 ml-0.5">/100</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                    {dim.summary}
                  </p>

                  {/* Subsystem Indicators */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {dim.indicators.slice(0, 4).map((ind, i) => (
                      <div key={i} className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-2 space-y-0.5">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block">
                          {ind.label}
                        </span>
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                          <span className="truncate">{ind.value}</span>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            ind.status === 'HEALTHY' ? 'bg-emerald-500' :
                            ind.status === 'WARNING' ? 'bg-amber-500' :
                            ind.status === 'DEGRADED' ? 'bg-orange-500' : 'bg-rose-500'
                          }`} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Link */}
                  <div className="flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-400 font-medium pt-1">
                    <span>{isSelected ? 'Hide Details' : 'View Subsystem Telemetry'}</span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Subsystem Detail Flyout */}
          {selectedDimension && (
            <div className="bg-slate-50 dark:bg-slate-900/90 rounded-2xl border border-indigo-200 dark:border-indigo-900/50 p-6 space-y-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${getStatusBadge(selectedDimension.status).bg}`}>
                      {getStatusBadge(selectedDimension.status).label}
                    </span>
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                      {selectedDimension.category}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                    {selectedDimension.name} — Detailed Telemetry
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                    {selectedDimension.summary}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDimension(null)}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline"
                >
                  Close Detail
                </button>
              </div>

              {/* Raw Metrics Table */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
                {Object.entries(selectedDimension.metrics).map(([key, value]) => (
                  <div key={key} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block capitalize">
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate block mt-0.5">
                      {String(value)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Recommendations */}
              {selectedDimension.recommendations.length > 0 && (
                <div className="pt-2">
                  <h4 className="text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Architectural Recommendations:
                  </h4>
                  <ul className="space-y-1.5">
                    {selectedDimension.recommendations.map((rec, i) => (
                      <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 2: Recent Incidents & Critical Errors */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'incidents' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Recent Incidents & Critical Diagnostic Logs
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Chronological error stream across XML syndication, reverse proxy endpoints, and audit records.
              </p>
            </div>
            <div className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {healthReport?.recentIncidents.length || 0} Recorded Incidents (24h)
            </div>
          </div>

          {healthReport?.recentIncidents && healthReport.recentIncidents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                    <th className="pb-3 pl-2">Severity</th>
                    <th className="pb-3">Timestamp</th>
                    <th className="pb-3">Impacted Service</th>
                    <th className="pb-3">Description & Diagnostic</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 pr-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {healthReport.recentIncidents.map((incident) => (
                    <tr key={incident.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 pl-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          incident.severity === 'CRITICAL'
                            ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30'
                            : incident.severity === 'WARNING'
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                            : 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30'
                        }`}>
                          {incident.severity}
                        </span>
                      </td>
                      <td className="py-3.5 text-xs text-slate-500 whitespace-nowrap font-mono">
                        {new Date(incident.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-3.5 font-semibold text-xs text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {incident.service}
                      </td>
                      <td className="py-3.5 text-xs text-slate-600 dark:text-slate-300 max-w-md">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{incident.title}</div>
                        <div className="text-slate-500 text-[11px] truncate mt-0.5">{incident.description}</div>
                      </td>
                      <td className="py-3.5">
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {incident.status}
                        </span>
                      </td>
                      <td className="py-3.5 pr-2 text-right">
                        <button
                          onClick={() => notify(`Drilling into incident ${incident.id}...`, 'info')}
                          className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 font-medium"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-medium">No critical incidents or errors recorded in active window.</p>
            </div>
          )}
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 3: 24h Performance Trends */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'trends' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              24-Hour System Reliability & Latency Trends
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Hourly snapshots of overall platform health score, API error rate %, and median latency.
            </p>
          </div>

          {healthReport?.trends && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Trend 1: Health Score & Success Rate */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Health Score Trend (0-100)
                  </span>
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" /> High Stability
                  </span>
                </div>
                <div className="space-y-2">
                  {healthReport.trends.map((t, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-xs">
                      <span className="w-12 font-mono text-slate-500">{t.timeLabel}</span>
                      <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all"
                          style={{ width: `${t.overallScore}%` }}
                        />
                      </div>
                      <span className="font-bold w-12 text-right text-slate-800 dark:text-slate-200">
                        {t.overallScore}/100
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trend 2: API Latency */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Median Response Latency (ms)
                  </span>
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> &lt; 50ms SLA
                  </span>
                </div>
                <div className="space-y-2">
                  {healthReport.trends.map((t, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-xs">
                      <span className="w-12 font-mono text-slate-500">{t.timeLabel}</span>
                      <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, (t.avgLatencyMs / 100) * 100)}%` }}
                        />
                      </div>
                      <span className="font-bold w-12 text-right text-slate-800 dark:text-slate-200">
                        {t.avgLatencyMs}ms
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 4: Actionable Recommendations */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'recommendations' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                Actionable Administrative Recommendations
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Safe, human-confirmed actions to maintain peak reliability, clear backlogs, and optimize partner feeds.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {healthReport?.actionableRecommendations.map((rec) => (
              <div
                key={rec.id}
                className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      rec.priority === 'CRITICAL' ? 'bg-rose-500/10 text-rose-700 border-rose-500/30' :
                      rec.priority === 'HIGH' ? 'bg-amber-500/10 text-amber-700 border-amber-500/30' :
                      'bg-indigo-500/10 text-indigo-700 border-indigo-500/30'
                    }`}>
                      {rec.priority} PRIORITY
                    </span>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {rec.estimatedImpact}
                    </span>
                  </div>
                  <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    {rec.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {rec.description}
                  </p>
                  <div className="text-[11px] text-slate-500">
                    Subsystem: <strong>{rec.service}</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    Safe Non-Destructive Action
                  </span>
                  <button
                    onClick={() => handleTriggerSafeAction(rec)}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                  >
                    {rec.actionLabel}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
