import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  PauseCircle,
  Activity,
  FileCode2,
  RotateCcw,
  Search,
  Filter,
  Eye,
  Info,
  ChevronDown,
  Sparkles,
  Terminal
} from 'lucide-react';
import { FeedHealthRecord, FeedRunRecord, FeedStatus, XMLFeedValidationReport, FeedErrorLog } from './types';

interface FeedHealthMonitoringViewProps {
  healthRecords: FeedHealthRecord[];
  onRefreshAll: () => Promise<void>;
  loading: boolean;
  masterJobs: any[];
}

export const FeedHealthMonitoringView: React.FC<FeedHealthMonitoringViewProps> = ({
  healthRecords,
  onRefreshAll,
  loading,
  masterJobs
}) => {
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');

  // Single Feed Checking
  const [checkingFeedId, setCheckingFeedId] = useState<string | null>(null);
  const [copyingUrl, setCopyingUrl] = useState<string | null>(null);

  // Detail Modal / Inspection State
  const [inspectingRecord, setInspectingRecord] = useState<FeedHealthRecord | null>(null);
  const [feedRuns, setFeedRuns] = useState<FeedRunRecord[]>([]);
  const [runsLoading, setRunsLoading] = useState(false);

  // SSRF & Apply URL Health Tool
  const [applyCheckJobId, setApplyCheckJobId] = useState<string>(masterJobs[0]?.job_id || '');
  const [applyChecking, setApplyChecking] = useState(false);
  const [applyCheckResult, setApplyCheckResult] = useState<any>(null);

  // Interactive XML Tester Playground
  const [isTesterOpen, setIsTesterOpen] = useState(false);
  const [testerXmlContent, setTesterXmlContent] = useState<string>(`<?xml version="1.0" encoding="UTF-8"?>
<jobs>
  <job>
    <job_id>test-001</job_id>
    <title>Staff Systems Engineer</title>
    <company>FastJobs Partner</company>
    <description>Lead development of low-latency ingestion infrastructure using TypeScript and Node.js.</description>
    <location>San Francisco, CA</location>
    <apply_url>https://jobxora.ai/apply/test-001</apply_url>
    <posted_at>2026-09-01T00:00:00.000Z</posted_at>
  </job>
</jobs>`);
  const [testerFeedType, setTesterFeedType] = useState<'master' | 'company' | 'platform'>('master');
  const [testerReport, setTesterReport] = useState<XMLFeedValidationReport | null>(null);
  const [testerLoading, setTesterLoading] = useState(false);

  // Error logs
  const [errorLogs, setErrorLogs] = useState<FeedErrorLog[]>([]);
  const [showErrorLogs, setShowErrorLogs] = useState(false);

  // Load feed runs when inspecting a record
  useEffect(() => {
    if (inspectingRecord) {
      loadFeedRuns(inspectingRecord.feedId);
    } else {
      setFeedRuns([]);
    }
  }, [inspectingRecord]);

  const loadFeedRuns = async (feedId: string) => {
    setRunsLoading(true);
    try {
      const res = await fetch(`/api/feed-engine/health/${encodeURIComponent(feedId)}/runs`);
      if (res.ok) {
        const data = await res.json();
        setFeedRuns(data);
      }
    } catch (err) {
      console.error('Failed to load feed runs', err);
    } finally {
      setRunsLoading(false);
    }
  };

  const loadErrorLogs = async () => {
    try {
      const res = await fetch('/api/feed-engine/health/logs');
      if (res.ok) {
        const data = await res.json();
        setErrorLogs(data);
      }
    } catch (err) {
      console.error('Failed to load error logs', err);
    }
  };

  // Run isolated diagnostic on a single feed
  const checkSingleFeed = async (feedId: string) => {
    setCheckingFeedId(feedId);
    try {
      const res = await fetch(`/api/feed-engine/health/${encodeURIComponent(feedId)}/check`, {
        method: 'POST'
      });
      if (res.ok) {
        await onRefreshAll();
        if (inspectingRecord && inspectingRecord.feedId === feedId) {
          const updated = await fetch(`/api/feed-engine/health/${encodeURIComponent(feedId)}`).then(r => r.json());
          setInspectingRecord(updated);
          loadFeedRuns(feedId);
        }
      }
    } catch (err) {
      console.error('Failed to check single feed', err);
    } finally {
      setCheckingFeedId(null);
    }
  };

  // Run arbitrary XML snippet validation
  const runTesterValidation = async () => {
    setTesterLoading(true);
    try {
      const res = await fetch('/api/feed-engine/health/validate-xml', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: testerXmlContent,
          feedType: testerFeedType
        })
      });
      const data = await res.json();
      setTesterReport(data);
    } catch (err) {
      console.error('XML validator failed', err);
    } finally {
      setTesterLoading(false);
    }
  };

  // SSRF apply check
  const checkApplyUrl = async (jobId: string) => {
    if (!jobId) return;
    setApplyChecking(true);
    try {
      const res = await fetch(`/api/feed-engine/apply-health/${jobId}`);
      const data = await res.json();
      setApplyCheckResult(data);
    } catch (err: any) {
      setApplyCheckResult({ status: 'ERROR', errorMessage: err.message });
    } finally {
      setApplyChecking(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyingUrl(id);
    setTimeout(() => setCopyingUrl(null), 2000);
  };

  // Status Metrics Calculation
  const totalCount = healthRecords.length;
  const healthyCount = healthRecords.filter(r => r.status === 'HEALTHY').length;
  const warningCount = healthRecords.filter(r => r.status === 'WARNING').length;
  const degradedCount = healthRecords.filter(r => r.status === 'DEGRADED').length;
  const failedCount = healthRecords.filter(r => r.status === 'FAILED').length;
  const disabledCount = healthRecords.filter(r => r.status === 'DISABLED').length;

  const totalAnomalies = healthRecords.reduce((acc, r) => acc + (r.anomalies?.length || 0), 0);
  const activeRetries = healthRecords.filter(r => r.retryStatus === 'QUEUED' || r.retryStatus === 'RETRYING').length;

  // Filtered records
  const filteredRecords = healthRecords.filter(r => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.feedId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      selectedStatusFilter === 'ALL' || r.status === selectedStatusFilter;

    const matchesType =
      selectedTypeFilter === 'ALL' ||
      r.feedType === selectedTypeFilter.toLowerCase() ||
      (selectedTypeFilter === 'MASTER' && r.feedType === 'master') ||
      (selectedTypeFilter === 'COMPANY' && r.feedType === 'company') ||
      (selectedTypeFilter === 'PLATFORM' && r.feedType === 'platform');

    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: FeedStatus) => {
    switch (status) {
      case 'HEALTHY':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            HEALTHY
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            WARNING
          </span>
        );
      case 'DEGRADED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-orange-500/15 text-orange-300 border border-orange-500/30">
            <AlertCircle className="w-3.5 h-3.5 text-orange-400" />
            DEGRADED
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            FAILED
          </span>
        );
      case 'DISABLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
            <PauseCircle className="w-3.5 h-3.5 text-slate-400" />
            DISABLED
          </span>
        );
    }
  };

  const getAnomalyLabel = (code: string) => {
    switch (code) {
      case 'ANOMALY_EMPTY_FEED':
        return 'Empty Feed (0 jobs)';
      case 'ANOMALY_JOB_DROP':
        return 'Job Drop (>50%)';
      case 'ANOMALY_STALE_FEED':
        return 'Stale Feed (>6h)';
      case 'ANOMALY_HIGH_LATENCY':
        return 'High Latency (>1500ms)';
      case 'ANOMALY_REPEATED_FAILURES':
        return 'Repeated Failures';
      case 'ANOMALY_RATE_LIMITED':
        return 'HTTP 429 Rate Limit';
      case 'ANOMALY_SERVER_ERROR':
        return '5xx Server Error';
      case 'ANOMALY_MISSING_REQUIRED_FIELDS':
        return 'Missing Required Fields';
      case 'ANOMALY_EXPIRED_JOBS':
        return 'Expired Jobs Detected';
      case 'ANOMALY_DUPLICATE_JOBS':
        return 'Duplicate Jobs Detected';
      case 'ANOMALY_MALFORMED_URLS':
        return 'Malformed Apply URLs';
      case 'ANOMALY_XML_SYNTAX':
        return 'XML Syntax Malformed';
      case 'ANOMALY_EXECUTION_ERROR':
        return 'Execution Exception';
      default:
        return code.replace('ANOMALY_', '').replace(/_/g, ' ');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar: Summary KPIs & Diagnostics Sweep Trigger */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
              <Activity className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
              Automated Feed Health Watchdog
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              XML Feed Health & Quality Assurance
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Continuous validation for Master, Company, and Platform distribution feeds. Monitoring schema correctness, URL safety, latency, and freshness.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => {
                setShowErrorLogs(!showErrorLogs);
                if (!showErrorLogs) loadErrorLogs();
              }}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Terminal className="w-3.5 h-3.5 text-slate-400" />
              {showErrorLogs ? 'Hide Audit Logs' : 'Audit Logs'}
            </button>

            <button
              onClick={() => setIsTesterOpen(!isTesterOpen)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <FileCode2 className="w-3.5 h-3.5 text-cyan-400" />
              Raw XML Tester
            </button>

            <button
              onClick={onRefreshAll}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Run Health Check (All Feeds)
            </button>
          </div>
        </div>

        {/* Status Breakdown Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="text-[11px] text-slate-400 font-medium">Monitored Feeds</div>
            <div className="text-2xl font-black text-white mt-1">{totalCount}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Master • Company • Platform</div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
            <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
            </div>
            <div className="text-2xl font-black text-emerald-300 mt-1">{healthyCount}</div>
            <div className="text-[10px] text-emerald-500/80 mt-0.5">Fully operational</div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30">
            <div className="text-[11px] text-amber-400 font-medium flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Warning
            </div>
            <div className="text-2xl font-black text-amber-300 mt-1">{warningCount}</div>
            <div className="text-[10px] text-amber-500/80 mt-0.5">Minor issues flagged</div>
          </div>

          <div className="p-3.5 rounded-xl bg-orange-950/20 border border-orange-500/30">
            <div className="text-[11px] text-orange-400 font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> Degraded
            </div>
            <div className="text-2xl font-black text-orange-300 mt-1">{degradedCount}</div>
            <div className="text-[10px] text-orange-500/80 mt-0.5">Retrying or high latency</div>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30">
            <div className="text-[11px] text-rose-400 font-medium flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" /> Failed
            </div>
            <div className="text-2xl font-black text-rose-300 mt-1">{failedCount}</div>
            <div className="text-[10px] text-rose-500/80 mt-0.5">Validation or 5xx error</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <PauseCircle className="w-3.5 h-3.5" /> Disabled
            </div>
            <div className="text-2xl font-black text-slate-300 mt-1">{disabledCount}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Compliance or paused</div>
          </div>
        </div>

        {/* Anomaly / Alert Banner if issues exist */}
        {totalAnomalies > 0 && (
          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <div className="font-bold text-amber-300">
                {totalAnomalies} Feed Anomaly Condition{totalAnomalies > 1 ? 's' : ''} Detected
              </div>
              <p className="text-slate-300 leading-relaxed">
                The automated validation engine flagged abnormal feed conditions (such as missing required fields, high response latency, or upstream errors). Feeds with severe errors have been queued for exponential backoff retries.
              </p>
              {activeRetries > 0 && (
                <div className="text-amber-400 font-mono text-[11px] pt-1">
                  Active retry backoff pipeline: {activeRetries} job{activeRetries > 1 ? 's' : ''} currently queued or retrying.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Logs Drawer */}
        {showErrorLogs && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-4 h-4" />
                Recent Feed Diagnostics Error Logs (feed_errors)
              </h3>
              <button
                onClick={loadErrorLogs}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>

            {errorLogs.length === 0 ? (
              <div className="text-xs text-slate-500 italic py-2">No error records currently logged.</div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2 font-mono text-[11px]">
                {errorLogs.slice(0, 20).map(log => (
                  <div key={log.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 text-slate-300">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                      <span className="text-amber-400 font-bold">{log.feedId}</span>
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="text-rose-300 font-sans">{log.error}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Interactive Raw XML Tester Modal/Panel */}
        {isTesterOpen && (
          <div className="p-5 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                  <FileCode2 className="w-4 h-4" />
                  FastJobs XML Feed Validation Playground
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Paste raw XML to evaluate structure, required fields, date formats, duplicate detection, and SSRF URL safety.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={testerFeedType}
                  onChange={e => setTesterFeedType(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200"
                >
                  <option value="master">Validate as Master XML Feed</option>
                  <option value="company">Validate as Company Feed</option>
                  <option value="platform">Validate as Platform Feed</option>
                </select>
                <button
                  onClick={runTesterValidation}
                  disabled={testerLoading}
                  className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {testerLoading ? 'Validating...' : 'Validate XML'}
                </button>
              </div>
            </div>

            <textarea
              value={testerXmlContent}
              onChange={e => setTesterXmlContent(e.target.value)}
              rows={7}
              className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-200 focus:outline-none focus:border-cyan-400"
              placeholder="Paste XML here..."
            />

            {testerReport && (
              <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-300">Validation Status:</span>
                    {testerReport.xmlValid ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                        XML VALID
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30">
                        XML INVALID
                      </span>
                    )}
                  </div>
                  <div className="text-slate-400">
                    Parsed: <span className="text-white font-bold">{testerReport.totalParsedJobs}</span> jobs • Valid: <span className="text-emerald-400 font-bold">{testerReport.validJobsCount}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className={`p-2 rounded border ${testerReport.structureValid ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/20 border-rose-500/30 text-rose-300'}`}>
                    Structure: {testerReport.structureValid ? 'Valid' : 'Malformed'}
                  </div>
                  <div className={`p-2 rounded border ${testerReport.requiredFieldsValid ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/20 border-rose-500/30 text-rose-300'}`}>
                    Required Fields: {testerReport.requiredFieldsValid ? 'Pass' : 'Missing'}
                  </div>
                  <div className={`p-2 rounded border ${testerReport.urlsValid ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' : 'bg-amber-950/20 border-amber-500/30 text-amber-300'}`}>
                    URLs & SSRF: {testerReport.urlsValid ? 'Safe' : 'Flagged'}
                  </div>
                  <div className={`p-2 rounded border ${testerReport.datesValid ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' : 'bg-amber-950/20 border-amber-500/30 text-amber-300'}`}>
                    Date Formats: {testerReport.datesValid ? 'Valid ISO' : 'Invalid'}
                  </div>
                </div>

                {testerReport.errors.length > 0 && (
                  <div className="p-2.5 rounded bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs space-y-1">
                    <div className="font-bold">Errors:</div>
                    <ul className="list-disc list-inside space-y-0.5">
                      {testerReport.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {testerReport.warnings.length > 0 && (
                  <div className="p-2.5 rounded bg-amber-950/30 border border-amber-500/30 text-amber-300 text-xs space-y-1">
                    <div className="font-bold">Warnings:</div>
                    <ul className="list-disc list-inside space-y-0.5">
                      {testerReport.warnings.map((warn, i) => (
                        <li key={i}>{warn}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search feed name, endpoint, ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-500 px-2 text-[11px] font-semibold">Status:</span>
              {['ALL', 'HEALTHY', 'WARNING', 'DEGRADED', 'FAILED', 'DISABLED'].map(status => (
                <button
                  key={status}
                  onClick={() => setSelectedStatusFilter(status)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                    selectedStatusFilter === status
                      ? 'bg-slate-800 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <select
              value={selectedTypeFilter}
              onChange={e => setSelectedTypeFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Types</option>
              <option value="MASTER">Master Feed</option>
              <option value="COMPANY">Company Feeds</option>
              <option value="PLATFORM">Platform Feeds</option>
            </select>
          </div>
        </div>

        {/* Feeds Monitoring Master Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3.5">Feed Identity & Endpoint</th>
                <th className="p-3.5">Health Status</th>
                <th className="p-3.5">HTTP & Latency</th>
                <th className="p-3.5">Freshness / Success</th>
                <th className="p-3.5">Jobs (Valid / Reject)</th>
                <th className="p-3.5">XML Validation</th>
                <th className="p-3.5">Failures & Retry</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 text-xs">
                    No feed records match the active search and status filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map(rec => {
                  const isChecking = checkingFeedId === rec.feedId;
                  return (
                    <tr key={rec.feedId} className="hover:bg-slate-800/30 transition-colors">
                      {/* Identity & Endpoint */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono uppercase ${
                            rec.feedType === 'master'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : rec.feedType === 'company'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                          }`}>
                            {rec.feedType}
                          </span>
                          <span className="font-bold text-white text-xs">{rec.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <a
                            href={rec.url}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-[10px] text-cyan-400 hover:text-cyan-300 hover:underline truncate max-w-xs flex items-center gap-1"
                          >
                            {rec.url}
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          </a>
                          <button
                            onClick={() => copyToClipboard(rec.url, rec.feedId)}
                            className="text-slate-500 hover:text-slate-300 p-0.5"
                            title="Copy endpoint URL"
                          >
                            {copyingUrl === rec.feedId ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Health Status */}
                      <td className="p-3.5">
                        {getStatusBadge(rec.status)}
                        {rec.anomalies && rec.anomalies.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {rec.anomalies.slice(0, 2).map((a, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              >
                                {getAnomalyLabel(a)}
                              </span>
                            ))}
                            {rec.anomalies.length > 2 && (
                              <span className="text-[9px] text-slate-500">
                                +{rec.anomalies.length - 2} more
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* HTTP & Latency */}
                      <td className="p-3.5 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            rec.httpStatus === 200
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : rec.httpStatus === 429
                              ? 'bg-orange-500/20 text-orange-400'
                              : rec.httpStatus === 403
                              ? 'bg-slate-800 text-slate-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            HTTP {rec.httpStatus}
                          </span>
                          <span className={`text-[11px] font-semibold ${
                            rec.responseTimeMs < 800
                              ? 'text-emerald-400'
                              : rec.responseTimeMs < 1500
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}>
                            {rec.responseTimeMs}ms
                          </span>
                        </div>
                      </td>

                      {/* Freshness & Last Success */}
                      <td className="p-3.5">
                        <div className={`text-xs font-semibold ${
                          rec.feedFreshness.includes('Fresh') || rec.feedFreshness === 'Just now'
                            ? 'text-emerald-400'
                            : rec.feedFreshness.includes('Stale')
                            ? 'text-amber-400'
                            : 'text-slate-400'
                        }`}>
                          {rec.feedFreshness}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {rec.lastSuccessfulRun ? new Date(rec.lastSuccessfulRun).toLocaleTimeString() : 'No success'}
                        </div>
                      </td>

                      {/* Jobs: Valid / Total */}
                      <td className="p-3.5 font-mono">
                        <div className="text-xs">
                          <span className="text-emerald-400 font-bold">{rec.validJobs}</span>
                          <span className="text-slate-500"> / {rec.totalJobs}</span>
                        </div>
                        {rec.rejectedJobs > 0 && (
                          <div className="text-[10px] text-rose-400 mt-0.5">
                            {rec.rejectedJobs} rejected
                          </div>
                        )}
                      </td>

                      {/* XML Validation Status */}
                      <td className="p-3.5">
                        {rec.xmlValidationStatus === 'VALID' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                          </span>
                        ) : rec.xmlValidationStatus === 'WARNING' ? (
                          <span className="inline-flex items-center gap-1 text-amber-400 text-xs font-semibold">
                            <AlertTriangle className="w-3.5 h-3.5" /> Warnings
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-400 text-xs font-semibold">
                            <XCircle className="w-3.5 h-3.5" /> Invalid
                          </span>
                        )}
                      </td>

                      {/* Failures & Retry */}
                      <td className="p-3.5">
                        <div className="text-xs font-mono">
                          {rec.consecutiveFailures > 0 ? (
                            <span className="text-rose-400 font-bold">
                              {rec.consecutiveFailures} failure{rec.consecutiveFailures > 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span className="text-slate-500">0 errors</span>
                          )}
                        </div>
                        {rec.retryStatus !== 'IDLE' && (
                          <span className={`inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                            rec.retryStatus === 'SUCCEEDED'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : rec.retryStatus === 'FAILED_MAX_RETRIES'
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-amber-500/20 text-amber-400 animate-pulse'
                          }`}>
                            {rec.retryStatus}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => checkSingleFeed(rec.feedId)}
                            disabled={isChecking}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="Run instant diagnostic for this feed"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin text-emerald-400' : ''}`} />
                          </button>

                          <button
                            onClick={() => setInspectingRecord(rec)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                          >
                            <Eye className="w-3 h-3" /> Inspect
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* SSRF-Safe Apply URL Verifier Tool */}
        <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              SSRF Guard & Apply URL Health Verification
            </h3>
            <span className="text-[11px] text-slate-500">
              Validates destination domain, DNS resolution, and redirects against SSRF blacklists
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <select
              value={applyCheckJobId}
              onChange={e => setApplyCheckJobId(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 w-full sm:w-80"
            >
              {masterJobs.map(j => (
                <option key={j.job_id} value={j.job_id}>
                  {j.title} ({j.job_id})
                </option>
              ))}
            </select>
            <button
              onClick={() => checkApplyUrl(applyCheckJobId)}
              disabled={applyChecking || !applyCheckJobId}
              className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 w-full sm:w-auto"
            >
              <ShieldCheck className="w-4 h-4" />
              {applyChecking ? 'Verifying Safe URL...' : 'Check Apply URL Health & SSRF'}
            </button>
          </div>

          {applyCheckResult && (
            <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
              <div className="text-slate-300">Target Apply URL: <span className="text-cyan-300">{applyCheckResult.url}</span></div>
              <div className="text-slate-300 mt-1 flex items-center gap-2">
                <span>Status:</span>
                <span className={applyCheckResult.status === 'OK' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {applyCheckResult.status}
                </span>
                {applyCheckResult.httpStatus && <span className="text-slate-400">• HTTP {applyCheckResult.httpStatus}</span>}
                {applyCheckResult.latencyMs !== undefined && <span className="text-slate-400">• {applyCheckResult.latencyMs}ms</span>}
              </div>
              {applyCheckResult.errorMessage && (
                <div className="text-rose-400 mt-1.5 font-sans bg-rose-950/20 p-2 rounded border border-rose-500/20">
                  {applyCheckResult.errorMessage}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Deep Inspection Drawer / Modal */}
      {inspectingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
                    {inspectingRecord.feedType}
                  </span>
                  <h3 className="text-lg font-bold text-white">{inspectingRecord.name}</h3>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-xs text-cyan-400">{inspectingRecord.url}</span>
                  <button
                    onClick={() => copyToClipboard(inspectingRecord.url, 'modal')}
                    className="text-slate-400 hover:text-white"
                  >
                    {copyingUrl === 'modal' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => checkSingleFeed(inspectingRecord.feedId)}
                  disabled={checkingFeedId === inspectingRecord.feedId}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${checkingFeedId === inspectingRecord.feedId ? 'animate-spin' : ''}`} />
                  Re-Check Now
                </button>
                <button
                  onClick={() => setInspectingRecord(null)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Status & Freshness Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[10px] uppercase font-bold">Health Status</div>
                <div className="mt-1">{getStatusBadge(inspectingRecord.status)}</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[10px] uppercase font-bold">Latency / Response</div>
                <div className="text-base font-bold text-white font-mono mt-1">
                  {inspectingRecord.responseTimeMs}ms
                  <span className="text-[10px] text-slate-500 font-sans ml-1">(HTTP {inspectingRecord.httpStatus})</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[10px] uppercase font-bold">Freshness</div>
                <div className="text-sm font-bold text-emerald-400 mt-1">
                  {inspectingRecord.feedFreshness}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[10px] uppercase font-bold">Consecutive Failures</div>
                <div className={`text-base font-bold font-mono mt-1 ${inspectingRecord.consecutiveFailures > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                  {inspectingRecord.consecutiveFailures}
                </div>
              </div>
            </div>

            {/* Deep Validation Report Breakdown */}
            {inspectingRecord.validationReport && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Automated XML Validation Audit Report
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-medium">
                  <div className={`p-2.5 rounded-lg border ${inspectingRecord.validationReport.structureValid ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/20 border-rose-500/30 text-rose-300'}`}>
                    <div className="text-[10px] uppercase font-bold opacity-70">XML Structure</div>
                    <div className="font-bold">{inspectingRecord.validationReport.structureValid ? 'Passed' : 'Malformed'}</div>
                  </div>

                  <div className={`p-2.5 rounded-lg border ${inspectingRecord.validationReport.requiredFieldsValid ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/20 border-rose-500/30 text-rose-300'}`}>
                    <div className="text-[10px] uppercase font-bold opacity-70">Required Fields</div>
                    <div className="font-bold">{inspectingRecord.validationReport.requiredFieldsValid ? 'Passed' : 'Missing Fields'}</div>
                  </div>

                  <div className={`p-2.5 rounded-lg border ${inspectingRecord.validationReport.urlsValid ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' : 'bg-amber-950/20 border-amber-500/30 text-amber-300'}`}>
                    <div className="text-[10px] uppercase font-bold opacity-70">Apply URLs / SSRF</div>
                    <div className="font-bold">{inspectingRecord.validationReport.urlsValid ? 'Passed Safe' : 'Flagged'}</div>
                  </div>

                  <div className={`p-2.5 rounded-lg border ${inspectingRecord.validationReport.duplicateJobsCount === 0 ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/20 border-rose-500/30 text-rose-300'}`}>
                    <div className="text-[10px] uppercase font-bold opacity-70">Duplicate Jobs</div>
                    <div className="font-bold">{inspectingRecord.validationReport.duplicateJobsCount} Detected</div>
                  </div>
                </div>

                {inspectingRecord.validationReport.errors.length > 0 && (
                  <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs space-y-1">
                    <div className="font-bold">Validation Errors:</div>
                    <ul className="list-disc list-inside space-y-0.5">
                      {inspectingRecord.validationReport.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {inspectingRecord.validationReport.warnings.length > 0 && (
                  <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/30 text-amber-300 text-xs space-y-1">
                    <div className="font-bold">Validation Warnings:</div>
                    <ul className="list-disc list-inside space-y-0.5">
                      {inspectingRecord.validationReport.warnings.map((warn, i) => (
                        <li key={i}>{warn}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Run Execution History (feed_runs) */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  Historical Run Execution Timeline (feed_runs)
                </span>
                <span className="text-[11px] text-slate-400 font-normal">
                  {feedRuns.length} recent executions
                </span>
              </h4>

              {runsLoading ? (
                <div className="p-4 text-center text-xs text-slate-500">Loading run history...</div>
              ) : feedRuns.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 italic bg-slate-950 rounded-lg">
                  No historical runs recorded for this feed yet.
                </div>
              ) : (
                <div className="max-h-52 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950">
                  <table className="w-full text-left text-[11px] text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase font-bold sticky top-0">
                      <tr>
                        <th className="p-2.5">Time</th>
                        <th className="p-2.5">Trigger</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5">Items</th>
                        <th className="p-2.5">Latency</th>
                        <th className="p-2.5">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {feedRuns.map(run => (
                        <tr key={run.id} className="hover:bg-slate-800/30">
                          <td className="p-2.5 font-mono text-slate-400">
                            {new Date(run.completedAt).toLocaleTimeString()}
                          </td>
                          <td className="p-2.5 font-mono text-slate-300">
                            {run.triggerType}
                          </td>
                          <td className="p-2.5">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              run.status === 'HEALTHY'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : run.status === 'WARNING'
                                ? 'bg-amber-500/20 text-amber-400'
                                : run.status === 'DISABLED'
                                ? 'bg-slate-800 text-slate-400'
                                : 'bg-rose-500/20 text-rose-400'
                            }`}>
                              {run.status}
                            </span>
                          </td>
                          <td className="p-2.5 font-mono">
                            {run.validItems} / {run.totalItems}
                          </td>
                          <td className="p-2.5 font-mono text-cyan-300">
                            {run.responseTimeMs}ms
                          </td>
                          <td className="p-2.5 text-slate-400 truncate max-w-xs">
                            {run.errorMessage || 'Clean run'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setInspectingRecord(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Close Inspection
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
