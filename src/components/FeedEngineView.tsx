import React, { useState, useEffect } from 'react';
import {
  Rss,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Layers,
  Sparkles,
  ExternalLink,
  Copy,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Building2,
  Briefcase,
  Search,
  Plus,
  Play,
  RotateCcw,
  Globe,
  Database,
  BarChart3,
  Store,
  FileCode2,
  FileCheck,
  Link as LinkIcon,
  Eye,
  Check,
  ChevronRight,
  TrendingUp,
  Cpu,
  Hash,
  AlertCircle
} from 'lucide-react';
import { FeedHealthMonitoringView } from './feed-engine/FeedHealthMonitoringView';

type EngineTab = 'master_jobs' | 'feed_inspector' | 'adapters_controls' | 'health_diagnostics' | 'ai_optimizer' | 'marketplace' | 'analytics_audit';

export const FeedEngineView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<EngineTab>('feed_inspector');
  const [loading, setLoading] = useState(false);
  const [masterJobs, setMasterJobs] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [healthRecords, setHealthRecords] = useState<any[]>([]);
  const [platformData, setPlatformData] = useState<{ configs: any[]; toggles: Record<string, boolean> }>({ configs: [], toggles: {} });
  const [analytics, setAnalytics] = useState<any>({ metrics: null, recentEvents: [] });
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [retries, setRetries] = useState<any[]>([]);
  const [marketplaceListings, setMarketplaceListings] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);

  // Feed Inspector State
  const [selectedFeedType, setSelectedFeedType] = useState<'master' | 'company' | 'platform'>('master');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('comp-neuralmatrix');
  const [selectedPlatformId, setSelectedPlatformId] = useState<string>('google_jobs');
  const [feedContent, setFeedContent] = useState<string>('');
  const [feedLoading, setFeedLoading] = useState<boolean>(false);
  const [copiedFeed, setCopiedFeed] = useState<boolean>(false);
  const [feedStats, setFeedStats] = useState<{ jobCount: number; valid: boolean; format: string }>({ jobCount: 0, valid: true, format: 'XML' });

  // AI Optimizer State
  const [selectedJobForAI, setSelectedJobForAI] = useState<string>('job-nm-001');
  const [aiResult, setAiResult] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // New Job Modal State
  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);
  const [newJobForm, setNewJobForm] = useState({
    company_id: 'comp-neuralmatrix',
    title: '',
    description: '',
    location: 'San Francisco, CA',
    country: 'US',
    city: 'San Francisco',
    remote_type: 'remote',
    employment_type: 'FULL_TIME',
    salary_min: 150000,
    salary_max: 220000,
    salary_currency: 'USD',
    skills: 'PyTorch, Python, Distributed Systems',
    category: 'AI & Machine Learning',
    experience_level: 'SENIOR',
    expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
    status: 'ACTIVE',
    apply_url: 'https://neuralmatrix.ai/careers/apply-new',
    source: 'jobxora_direct'
  });
  const [createJobError, setCreateJobError] = useState<string | null>(null);

  // No-Code Platform Builder State
  const [isPlatformBuilderOpen, setIsPlatformBuilderOpen] = useState(false);
  const [platformForm, setPlatformForm] = useState({
    id: '',
    platform_name: '',
    feed_type: 'xml',
    endpoint: 'https://api.aggregator.io/v1/jobs',
    authentication: 'bearer',
    auth_header_name: 'Authorization',
    auth_header_value: 'Bearer test_key_99182',
    required_fields: 'title, description, location, apply_url',
    field_mapping: JSON.stringify({
      job_title: 'title',
      company: 'company_name',
      role_description: 'description',
      target_location: 'location',
      apply_link: 'canonical_apply_url'
    }, null, 2),
    update_frequency_minutes: 60
  });

  // Apply URL Check State
  const [applyCheckJobId, setApplyCheckJobId] = useState<string>('job-nm-001');
  const [applyCheckResult, setApplyCheckResult] = useState<any>(null);
  const [applyChecking, setApplyChecking] = useState<boolean>(false);

  // Duplicate Check Modal State
  const [dupCheckResult, setDupCheckResult] = useState<any>(null);

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [jobsRes, compsRes, healthRes, platRes, anaRes, audRes, retRes, mktRes, subRes] = await Promise.all([
        fetch('/api/feed-engine/jobs').then(r => r.json()),
        fetch('/api/feed-engine/companies').then(r => r.json()),
        fetch('/api/feed-engine/health').then(r => r.json()),
        fetch('/api/feed-engine/platforms').then(r => r.json()),
        fetch('/api/feed-engine/analytics').then(r => r.json()),
        fetch('/api/feed-engine/audit').then(r => r.json()),
        fetch('/api/feed-engine/retries').then(r => r.json()),
        fetch('/api/feed-engine/marketplace/listings').then(r => r.json()),
        fetch('/api/feed-engine/marketplace/subscriptions').then(r => r.json())
      ]);

      setMasterJobs(jobsRes.jobs || []);
      setCompanies(compsRes || []);
      setHealthRecords(healthRes.records || []);
      setPlatformData(platRes || { configs: [], toggles: {} });
      setAnalytics(anaRes || { metrics: null, recentEvents: [] });
      setAuditLogs(audRes || []);
      setRetries(retRes || []);
      setMarketplaceListings(mktRes || []);
      setSubscriptions(subRes || []);
    } catch (err) {
      console.error('Failed to load feed engine data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch active feed content
  const loadFeedContent = async () => {
    setFeedLoading(true);
    try {
      let url = '/feeds/master.xml';
      if (selectedFeedType === 'company') {
        url = `/feeds/company/${selectedCompanyId}.xml`;
      } else if (selectedFeedType === 'platform') {
        url = `/feeds/platform/${selectedPlatformId}.xml?pretty=true`;
      }

      const res = await fetch(url);
      const text = await res.text();
      const jobCount = parseInt(res.headers.get('X-Feed-Job-Count') || '0', 10);
      const isValid = res.headers.get('X-Feed-XML-Valid') !== 'false';

      setFeedContent(text);
      setFeedStats({
        jobCount: jobCount || (text.includes('<job>') ? (text.match(/<job>/g) || []).length : 0),
        valid: isValid && !text.includes('<error>'),
        format: selectedPlatformId === 'google_jobs' ? 'JSON-LD' : 'XML 1.0 (UTF-8)'
      });
    } catch (err: any) {
      setFeedContent(`Error loading feed: ${err.message}`);
    } finally {
      setFeedLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'feed_inspector') {
      loadFeedContent();
    }
  }, [activeTab, selectedFeedType, selectedCompanyId, selectedPlatformId]);

  // Run AI Optimization
  const runAIOptimizer = async (jobId: string, refresh = false) => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/feed-engine/ai/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, forceRefresh: refresh })
      });
      const data = await res.json();
      setAiResult(data);
    } catch (err) {
      console.error('AI optimizer failed', err);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ai_optimizer' && selectedJobForAI && !aiResult) {
      runAIOptimizer(selectedJobForAI);
    }
  }, [activeTab, selectedJobForAI]);

  // Trigger diagnostic sweep
  const triggerDiagnostics = async () => {
    setLoading(true);
    try {
      await fetch('/api/feed-engine/worker/sweep', { method: 'POST' });
      await fetchData();
    } finally {
      setLoading(false);
    }
  };

  // Toggle platform
  const togglePlatform = async (platformId: string, enabled: boolean) => {
    try {
      await fetch('/api/feed-engine/controls/platform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platformId, enabled })
      });
      setPlatformData(prev => ({
        ...prev,
        toggles: { ...prev.toggles, [platformId]: enabled }
      }));
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle company verification
  const setCompanyVerification = async (companyId: string, status: string) => {
    try {
      await fetch(`/api/feed-engine/companies/${companyId}/verification`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Check external apply URL health
  const checkApplyUrl = async (jobId: string) => {
    setApplyChecking(true);
    try {
      const res = await fetch(`/api/feed-engine/apply-health/${jobId}`);
      const data = await res.json();
      setApplyCheckResult(data);
    } catch (err: any) {
      setApplyCheckResult({ error: err.message });
    } finally {
      setApplyChecking(false);
    }
  };

  // Check duplicate
  const testDuplicateCheck = async (job: any) => {
    try {
      const res = await fetch('/api/feed-engine/jobs/check-duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(job)
      });
      const data = await res.json();
      setDupCheckResult(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Create Job
  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateJobError(null);
    try {
      const payload = {
        ...newJobForm,
        skills: newJobForm.skills.split(',').map(s => s.trim()).filter(Boolean),
        salary_min: Number(newJobForm.salary_min),
        salary_max: Number(newJobForm.salary_max)
      };

      const res = await fetch('/api/feed-engine/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        setCreateJobError(data.error || 'Failed to create job');
        return;
      }

      setIsCreateJobOpen(false);
      fetchData();
    } catch (err: any) {
      setCreateJobError(err.message);
    }
  };

  // Save No-Code Platform
  const handleSavePlatform = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let mapping = {};
      try {
        mapping = JSON.parse(platformForm.field_mapping);
      } catch {
        alert('Invalid JSON in field mapping');
        return;
      }

      const payload = {
        config: {
          id: platformForm.id.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
          platform_name: platformForm.platform_name,
          feed_type: platformForm.feed_type,
          endpoint: platformForm.endpoint,
          authentication: platformForm.authentication,
          auth_header_name: platformForm.auth_header_name,
          auth_header_value: platformForm.auth_header_value,
          required_fields: platformForm.required_fields.split(',').map(s => s.trim()).filter(Boolean),
          field_mapping: mapping,
          update_frequency_minutes: Number(platformForm.update_frequency_minutes),
          status: 'active'
        },
        changelog: `Created platform config for ${platformForm.platform_name}`
      };

      await fetch('/api/feed-engine/platforms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      setIsPlatformBuilderOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Copy Feed XML
  const handleCopyFeed = () => {
    navigator.clipboard.writeText(feedContent);
    setCopiedFeed(true);
    setTimeout(() => setCopiedFeed(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 pb-20 selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* Top Architecture Hero & Pipeline Stream */}
      <div className="border-b border-slate-800/80 bg-gradient-to-b from-slate-950 via-[#040816] to-[#030712] pt-8 pb-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
                <Rss className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                Universal Job Feed & Distribution Engine
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                FastJobs Master Feed Distribution
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold border border-emerald-500/30">
                  v2.0 PROD
                </span>
              </h1>
              <p className="text-slate-400 text-sm mt-1 max-w-3xl">
                Single source of truth pipeline distributing normalized master jobs across Google Jobs, LinkedIn, Indeed, Glassdoor, ZipRecruiter, and universal partner networks with SSRF security and zero-duplication guarantees.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={triggerDiagnostics}
                disabled={loading}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
                Run Diagnostic Sweep
              </button>
              <button
                onClick={() => setIsCreateJobOpen(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Master Job
              </button>
            </div>
          </div>

          {/* Core Architecture Pipeline Flow Visualizer */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Deterministic Distribution Architecture</span>
              <span className="text-emerald-400 font-mono text-[10px]">Deterministic Pipeline Active</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center text-center text-xs">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-cyan-500/30 text-cyan-300 font-medium">
                <Database className="w-4 h-4 mx-auto mb-1 text-cyan-400" />
                <div className="font-bold">Master Job Data</div>
                <div className="text-[10px] text-slate-400">Single Source of Truth</div>
              </div>

              <div className="hidden md:flex justify-center text-slate-600">
                <ChevronRight className="w-5 h-5 text-emerald-500/60 animate-pulse" />
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/30 text-emerald-300 font-medium">
                <FileCode2 className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                <div className="font-bold">Master XML Feed</div>
                <div className="text-[10px] text-slate-400">/feeds/master.xml</div>
              </div>

              <div className="hidden md:flex justify-center text-slate-600">
                <ChevronRight className="w-5 h-5 text-emerald-500/60 animate-pulse" />
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-purple-500/30 text-purple-300 font-medium">
                <Globe className="w-4 h-4 mx-auto mb-1 text-purple-400" />
                <div className="font-bold">Platform Adapters</div>
                <div className="text-[10px] text-slate-400">Google • LinkedIn • Indeed • Custom</div>
              </div>
            </div>
          </div>

          {/* Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium">Master Jobs</div>
              <div className="text-xl font-black text-white mt-0.5">{masterJobs.length}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium">Verified Companies</div>
              <div className="text-xl font-black text-emerald-400 mt-0.5">
                {companies.filter(c => c.verification_status === 'VERIFIED').length} / {companies.length}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium">Active Feeds</div>
              <div className="text-xl font-black text-cyan-400 mt-0.5">
                {healthRecords.filter(h => h.status === 'HEALTHY').length}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium">Apply Clicks</div>
              <div className="text-xl font-black text-purple-400 mt-0.5">
                {analytics.metrics?.totalApplyClicks || 0}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium">Avg CTR</div>
              <div className="text-xl font-black text-teal-400 mt-0.5">
                {analytics.metrics?.ctr || 0}%
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium">Retry Queue</div>
              <div className="text-xl font-black text-amber-400 mt-0.5">
                {retries.filter(r => r.status === 'QUEUED' || r.status === 'RETRYING').length}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex border-b border-slate-800 overflow-x-auto gap-1 pb-1">
          {[
            { id: 'feed_inspector', label: 'XML Feed Inspector', icon: FileCode2 },
            { id: 'master_jobs', label: 'Master Job Data', icon: Database },
            { id: 'adapters_controls', label: 'Adapters & Controls', icon: Sliders },
            { id: 'health_diagnostics', label: 'Health & Diagnostics', icon: ShieldCheck },
            { id: 'ai_optimizer', label: 'AI Feed Optimizer', icon: Sparkles },
            { id: 'marketplace', label: 'Feed Marketplace', icon: Store },
            { id: 'analytics_audit', label: 'Attribution & Audit', icon: BarChart3 }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as EngineTab)}
                className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-all border-b-2 ${
                  active
                    ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Panes */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* =========================================================================
            TAB 1: LIVE XML FEED INSPECTOR
        ========================================================================= */}
        {activeTab === 'feed_inspector' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
              
              {/* Controls Bar */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase mr-2">Target Feed:</span>
                  <button
                    onClick={() => setSelectedFeedType('master')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedFeedType === 'master'
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    Master XML Feed (/feeds/master.xml)
                  </button>

                  <button
                    onClick={() => setSelectedFeedType('company')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedFeedType === 'company'
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    Company XML Feed
                  </button>

                  <button
                    onClick={() => setSelectedFeedType('platform')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedFeedType === 'platform'
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    Platform Adapter Feed
                  </button>
                </div>

                {/* Sub-selector */}
                <div className="flex items-center gap-3">
                  {selectedFeedType === 'company' && (
                    <select
                      value={selectedCompanyId}
                      onChange={e => setSelectedCompanyId(e.target.value)}
                      className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                      {companies.map(c => (
                        <option key={c.company_id} value={c.company_id}>
                          {c.name} ({c.verification_status})
                        </option>
                      ))}
                    </select>
                  )}

                  {selectedFeedType === 'platform' && (
                    <select
                      value={selectedPlatformId}
                      onChange={e => setSelectedPlatformId(e.target.value)}
                      className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="google_jobs">Google Jobs (JSON-LD)</option>
                      <option value="linkedin">LinkedIn Jobs XML</option>
                      <option value="indeed">Indeed XML</option>
                      <option value="glassdoor">Glassdoor XML</option>
                      <option value="ziprecruiter">ZipRecruiter XML</option>
                      <option value="partner_network">FastJobs Partner XML</option>
                      {platformData.configs.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.platform_name} (Custom)
                        </option>
                      ))}
                    </select>
                  )}

                  <button
                    onClick={loadFeedContent}
                    disabled={feedLoading}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                    title="Reload Feed"
                  >
                    <RefreshCw className={`w-4 h-4 ${feedLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Feed Meta Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Format:</span>
                    <span className="font-mono font-bold text-cyan-300">{feedStats.format}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Included Jobs:</span>
                    <span className="font-bold text-emerald-400">{feedStats.jobCount} Active</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Validation:</span>
                    {feedStats.valid ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> RFC XML Valid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-400 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5" /> Validation Issue
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyFeed}
                    className="px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center gap-1.5 transition-all"
                  >
                    {copiedFeed ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedFeed ? 'Copied' : 'Copy Feed'}</span>
                  </button>
                  <a
                    href={
                      selectedFeedType === 'master'
                        ? '/feeds/master.xml'
                        : selectedFeedType === 'company'
                        ? `/feeds/company/${selectedCompanyId}.xml`
                        : `/feeds/platform/${selectedPlatformId}.xml`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-medium flex items-center gap-1.5 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Raw URL</span>
                  </a>
                </div>
              </div>

              {/* Code Viewer */}
              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>
                    {selectedFeedType === 'master'
                      ? 'GET /feeds/master.xml'
                      : selectedFeedType === 'company'
                      ? `GET /feeds/company/${selectedCompanyId}.xml`
                      : `GET /feeds/platform/${selectedPlatformId}.xml`}
                  </span>
                  <span>{feedContent.length} bytes</span>
                </div>
                <pre className="p-4 text-xs font-mono text-emerald-300/90 overflow-x-auto max-h-[500px] leading-relaxed whitespace-pre-wrap">
                  {feedLoading ? 'Generating feed pipeline output...' : feedContent}
                </pre>
              </div>

            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: MASTER JOB DATA CRUD & VALIDATION
        ========================================================================= */}
        {activeTab === 'master_jobs' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Master Normalized Job Store</h2>
                  <p className="text-xs text-slate-400">The authoritative, single source of truth for all feed generation</p>
                </div>
                <button
                  onClick={() => setIsCreateJobOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Master Job
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-3">Job Title & ID</th>
                      <th className="p-3">Company</th>
                      <th className="p-3">Compensation</th>
                      <th className="p-3">Location / Type</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Verification</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {masterJobs.map(job => {
                      const comp = companies.find(c => c.company_id === job.company_id);
                      return (
                        <tr key={job.job_id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3">
                            <div className="font-bold text-white text-sm">{job.title}</div>
                            <div className="font-mono text-[10px] text-slate-500">{job.job_id} • {job.category}</div>
                          </td>
                          <td className="p-3">
                            <div className="text-slate-200">{comp?.name || job.company_id}</div>
                            <div className="text-[10px] text-slate-500">{comp?.website || 'Verified ATS'}</div>
                          </td>
                          <td className="p-3 font-mono text-emerald-300">
                            ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()} {job.salary_currency}
                          </td>
                          <td className="p-3">
                            <div>{job.location}</div>
                            <span className="inline-block px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-400 mt-0.5 uppercase">
                              {job.remote_type} • {job.employment_type}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                              job.status === 'PUBLISHED' || job.status === 'ACTIVE'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : job.status === 'PENDING_REVIEW'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              {job.status}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                              comp?.verification_status === 'VERIFIED' ? 'text-emerald-400' : 'text-amber-400'
                            }`}>
                              <ShieldCheck className="w-3.5 h-3.5" />
                              {comp?.verification_status || 'PENDING'}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => testDuplicateCheck(job)}
                                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] font-semibold"
                                title="Check Duplication Signature"
                              >
                                Test Dup
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedJobForAI(job.job_id);
                                  setActiveTab('ai_optimizer');
                                }}
                                className="px-2 py-1 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-[10px] font-semibold border border-purple-500/30"
                              >
                                Optimize
                              </button>
                              <a
                                href={`/apply/${job.job_id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold flex items-center gap-1"
                              >
                                <LinkIcon className="w-3 h-3" />
                                Apply
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Duplicate Check Modal / Result Preview */}
              {dupCheckResult && (
                <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-400 uppercase">Duplicate Engine Diagnostic:</span>
                    <button onClick={() => setDupCheckResult(null)} className="text-slate-400 hover:text-white text-xs">Close</button>
                  </div>
                  <div className="text-xs">
                    {dupCheckResult.isDuplicate ? (
                      <div className="text-rose-400 font-semibold">
                        Duplicate Candidate Found! (Duplicate of: {dupCheckResult.duplicateOfJobId})
                        <ul className="list-disc ml-5 mt-1 text-slate-300 font-normal">
                          {dupCheckResult.matchedCriteria.map((c: string, idx: number) => <li key={idx}>{c}</li>)}
                        </ul>
                      </div>
                    ) : (
                      <div className="text-emerald-400 font-semibold">
                        Unique Master Job (0 duplicates found across {masterJobs.length} records)
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: PLATFORM ADAPTERS & GRANULAR CONTROLS
        ========================================================================= */}
        {activeTab === 'adapters_controls' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Platform Adapters & Granular Distribution</h2>
                  <p className="text-xs text-slate-400">Control platform routing, company overrides, and no-code custom aggregator feeds</p>
                </div>
                <button
                  onClick={() => setIsPlatformBuilderOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Custom Platform (No-Code)
                </button>
              </div>

              {/* Standard Platform Adapters Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { id: 'google_jobs', name: 'Google Jobs', format: 'JSON-LD / Schema.org', desc: 'Direct Search rich snippets with salary highlighting' },
                  { id: 'linkedin', name: 'LinkedIn Jobs', format: 'XML 1.0 Feed', desc: 'Talent gateway XML with partnerJobId mapping' },
                  { id: 'indeed', name: 'Indeed', format: 'Indeed XML Schema', desc: 'Volume syndication with referencenumber tracking' },
                  { id: 'glassdoor', name: 'Glassdoor', format: 'Glassdoor XML', desc: 'Direct employer transparency feed' },
                  { id: 'ziprecruiter', name: 'ZipRecruiter', format: 'ZipRecruiter XML', desc: '1-Click job dispatch channel' },
                  { id: 'partner_network', name: 'FastJobs Partner Hub', format: 'FastJobs XML 2.0', desc: 'Universal syndicate partner network' }
                ].map(plat => {
                  const isEnabled = platformData.toggles[plat.id] ?? true;
                  return (
                    <div key={plat.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{plat.name}</span>
                        <button
                          onClick={() => togglePlatform(plat.id, !isEnabled)}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                            isEnabled
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {isEnabled ? 'ENABLED' : 'PAUSED'}
                        </button>
                      </div>
                      <div className="text-xs text-slate-400">{plat.desc}</div>
                      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-800 text-slate-500 font-mono">
                        <span>{plat.format}</span>
                        <a
                          href={`/feeds/platform/${plat.id}.xml`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-400 hover:underline flex items-center gap-1"
                        >
                          Preview Feed <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* No-Code Configured Platforms */}
              {platformData.configs.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <h3 className="text-sm font-bold text-cyan-300 uppercase tracking-wider">Dynamic No-Code Platforms</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {platformData.configs.map(cfg => (
                      <div key={cfg.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-sm">{cfg.platform_name}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-300 font-mono">
                            {cfg.feed_type.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 font-mono truncate">{cfg.endpoint}</div>
                        <div className="text-[11px] text-slate-500">
                          Field Mappings: {Object.keys(cfg.field_mapping || {}).length} rules defined
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Company Verification Matrix */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <h3 className="text-sm font-bold text-white">Company Distribution Verification Gate</h3>
                <p className="text-xs text-slate-400">
                  Rule Enforcement: Only VERIFIED companies are distributed to external platform feeds.
                </p>
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="p-3">Company</th>
                        <th className="p-3">Verification State</th>
                        <th className="p-3">Job Count</th>
                        <th className="p-3">Feed Access Token</th>
                        <th className="p-3 text-right">Verification Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {companies.map(comp => (
                        <tr key={comp.company_id} className="hover:bg-slate-800/40">
                          <td className="p-3 font-bold text-white">{comp.name}</td>
                          <td className="p-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                              comp.verification_status === 'VERIFIED'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}>
                              {comp.verification_status}
                            </span>
                          </td>
                          <td className="p-3 font-mono">{masterJobs.filter(j => j.company_id === comp.company_id).length}</td>
                          <td className="p-3 font-mono text-[10px] text-slate-400">{comp.feed_token}</td>
                          <td className="p-3 text-right">
                            {comp.verification_status !== 'VERIFIED' ? (
                              <button
                                onClick={() => setCompanyVerification(comp.company_id, 'VERIFIED')}
                                className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold border border-emerald-500/30"
                              >
                                Approve & Verify
                              </button>
                            ) : (
                              <button
                                onClick={() => setCompanyVerification(comp.company_id, 'SUSPENDED')}
                                className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold border border-rose-500/30"
                              >
                                Suspend Feed
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: FEED HEALTH & DIAGNOSTICS (Production Watchdog)
        ========================================================================= */}
        {activeTab === 'health_diagnostics' && (
          <FeedHealthMonitoringView
            healthRecords={healthRecords}
            onRefreshAll={triggerDiagnostics}
            loading={loading}
            masterJobs={masterJobs}
          />
        )}

        {/* =========================================================================
            TAB 5: AI FEED OPTIMIZER & PLATFORM MATCH
        ========================================================================= */}
        {activeTab === 'ai_optimizer' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    AI Feed Optimizer & Platform Match Matrix
                  </h2>
                  <p className="text-xs text-slate-400">
                    Analyze master jobs with Gemini to optimize SEO titles, identify missing skills, and calculate platform suitability scores
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={selectedJobForAI}
                    onChange={e => {
                      setSelectedJobForAI(e.target.value);
                      runAIOptimizer(e.target.value);
                    }}
                    className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200"
                  >
                    {masterJobs.map(j => (
                      <option key={j.job_id} value={j.job_id}>
                        {j.title}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => runAIOptimizer(selectedJobForAI, true)}
                    disabled={aiLoading}
                    className="px-3.5 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
                    Re-Analyze Job
                  </button>
                </div>
              </div>

              {aiLoading ? (
                <div className="p-12 text-center text-slate-400 space-y-3">
                  <Sparkles className="w-8 h-8 text-purple-400 mx-auto animate-spin" />
                  <p className="text-sm font-medium">Running Gemini multi-platform feed optimizer...</p>
                </div>
              ) : aiResult ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left 2 Cols: Content Optimization & Score */}
                  <div className="lg:col-span-2 space-y-4">
                    
                    {/* Score Bar */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-xs text-slate-400">Content Quality & Feed Score</div>
                        <div className="text-2xl font-black text-white mt-0.5">
                          {aiResult.contentQualityScore} / 100
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-2.5 py-1 rounded text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          {aiResult.aiGenerated ? 'Gemini 3.7 Flash Model' : 'Rule Engine Engine'}
                        </span>
                      </div>
                    </div>

                    {/* Suggested Title */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="text-xs font-bold text-slate-400 uppercase">Search-Optimized Job Title:</div>
                      <div className="text-sm font-bold text-cyan-300">{aiResult.suggestedTitle}</div>
                    </div>

                    {/* Missing Skills */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="text-xs font-bold text-slate-400 uppercase">Recommended Complementary Skills:</div>
                      <div className="flex flex-wrap gap-2">
                        {aiResult.missingSkills.map((s: string, idx: number) => (
                          <span key={idx} className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-medium border border-emerald-500/30">
                            + {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Quality Tips */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="text-xs font-bold text-slate-400 uppercase">Aggregator Ranking Tips:</div>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {aiResult.qualityTips.map((tip: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-purple-400 font-bold">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                  </div>

                  {/* Right Col: Platform Match Matrix */}
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                      <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                        Smart Platform Match Matrix
                      </h3>

                      <div className="space-y-3">
                        {Object.entries(aiResult.platformSuitability || {}).map(([platform, data]: [string, any]) => (
                          <div key={platform} className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-white capitalize">{platform.replace('_', ' ')}</span>
                              <span className="font-mono font-bold text-emerald-400">{data.score}% Match</span>
                            </div>
                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${data.score}%` }}></div>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1">
                              {data.reasons?.[0] || 'Optimized for schema ingest'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              ) : null}

            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 6: FEED MARKETPLACE & SUBSCRIPTIONS
        ========================================================================= */}
        {activeTab === 'marketplace' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
              
              <div>
                <h2 className="text-lg font-bold text-white">Feed Distribution Marketplace</h2>
                <p className="text-xs text-slate-400">Discover and subscribe to premium distribution networks and syndication feeds</p>
              </div>

              {/* Listings Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {marketplaceListings.map(item => (
                  <div key={item.id} className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300">
                          {item.category}
                        </span>
                        <span className="font-bold text-white text-sm">
                          {item.monthlyPrice === 0 ? 'FREE' : `$${item.monthlyPrice}/mo`}
                        </span>
                      </div>
                      <h3 className="font-bold text-white text-base">{item.platformName}</h3>
                      <p className="text-xs text-slate-400">{item.description}</p>
                      
                      <div className="space-y-1">
                        {item.features?.map((f: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-300">
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-400">{item.subscriberCount} Active Subscriptions</span>
                      <button
                        onClick={async () => {
                          await fetch('/api/feed-engine/marketplace/subscribe', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ companyId: 'comp-neuralmatrix', listingId: item.id })
                          });
                          fetchData();
                          alert(`Subscribed NeuralMatrix to ${item.platformName}`);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
                      >
                        Subscribe Company
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 7: ATTRIBUTION ANALYTICS & IMMUTABLE AUDIT TRAIL
        ========================================================================= */}
        {activeTab === 'analytics_audit' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
              
              <div>
                <h2 className="text-lg font-bold text-white">Attribution Tracking & Immutable Audit Log</h2>
                <p className="text-xs text-slate-400">Track candidate redirection events and maintain an immutable ledger of all feed mutations</p>
              </div>

              {/* Source Breakdown Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Object.entries(analytics.metrics?.sourceBreakdown || {}).map(([src, stats]: [string, any]) => (
                  <div key={src} className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[11px] font-mono text-slate-400 uppercase">{src}</div>
                    <div className="text-lg font-bold text-white mt-1">{stats.clicks} Clicks</div>
                    <div className="text-xs text-slate-500">{stats.views} Views</div>
                  </div>
                ))}
              </div>

              {/* Immutable Audit Logs Table */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <h3 className="text-sm font-bold text-white">Immutable Security Audit Trail</h3>
                <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-96">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800 sticky top-0">
                      <tr>
                        <th className="p-3">Timestamp</th>
                        <th className="p-3">User / Actor</th>
                        <th className="p-3">Action</th>
                        <th className="p-3">Resource</th>
                        <th className="p-3">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                      {auditLogs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-800/40">
                          <td className="p-3 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                          <td className="p-3 text-cyan-300">{log.user_id}</td>
                          <td className="p-3 font-bold text-emerald-400">{log.action}</td>
                          <td className="p-3 text-slate-300">{log.resource_type}:{log.resource_id}</td>
                          <td className="p-3 text-slate-500 truncate max-w-xs">{JSON.stringify(log.new_value || {})}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* CREATE MASTER JOB MODAL */}
      {isCreateJobOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#040816] border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Create Normalized Master Job</h3>
              <button onClick={() => setIsCreateJobOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {createJobError && (
              <div className="p-3 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs">
                {createJobError}
              </div>
            )}

            <form onSubmit={handleCreateJob} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Company</label>
                  <select
                    value={newJobForm.company_id}
                    onChange={e => setNewJobForm({ ...newJobForm, company_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                  >
                    {companies.map(c => (
                      <option key={c.company_id} value={c.company_id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Category</label>
                  <select
                    value={newJobForm.category}
                    onChange={e => setNewJobForm({ ...newJobForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                  >
                    <option>AI & Machine Learning</option>
                    <option>Engineering</option>
                    <option>DevOps & Cloud</option>
                    <option>Product & Design</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Job Title</label>
                <input
                  type="text"
                  required
                  value={newJobForm.title}
                  onChange={e => setNewJobForm({ ...newJobForm, title: e.target.value })}
                  placeholder="e.g. Senior Autonomous Systems Engineer"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Description</label>
                <textarea
                  required
                  rows={4}
                  value={newJobForm.description}
                  onChange={e => setNewJobForm({ ...newJobForm, description: e.target.value })}
                  placeholder="Comprehensive job description including responsibilities and stack..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Location</label>
                  <input
                    type="text"
                    value={newJobForm.location}
                    onChange={e => setNewJobForm({ ...newJobForm, location: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Remote Type</label>
                  <select
                    value={newJobForm.remote_type}
                    onChange={e => setNewJobForm({ ...newJobForm, remote_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                  >
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="onsite">On-site</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Employment Type</label>
                  <select
                    value={newJobForm.employment_type}
                    onChange={e => setNewJobForm({ ...newJobForm, employment_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="PART_TIME">Part Time</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Min Salary ($)</label>
                  <input
                    type="number"
                    value={newJobForm.salary_min}
                    onChange={e => setNewJobForm({ ...newJobForm, salary_min: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Max Salary ($)</label>
                  <input
                    type="number"
                    value={newJobForm.salary_max}
                    onChange={e => setNewJobForm({ ...newJobForm, salary_max: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Skills (comma separated)</label>
                <input
                  type="text"
                  value={newJobForm.skills}
                  onChange={e => setNewJobForm({ ...newJobForm, skills: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Direct Apply URL (SSRF Safe)</label>
                <input
                  type="url"
                  required
                  value={newJobForm.apply_url}
                  onChange={e => setNewJobForm({ ...newJobForm, apply_url: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateJobOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
                >
                  Publish to Master Feed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NO-CODE PLATFORM BUILDER MODAL */}
      {isPlatformBuilderOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#040816] border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">No-Code Feed Platform Configurator</h3>
              <button onClick={() => setIsPlatformBuilderOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSavePlatform} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Platform Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NordicTech Aggregator"
                    value={platformForm.platform_name}
                    onChange={e => setPlatformForm({ ...platformForm, platform_name: e.target.value, id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Feed Format</label>
                  <select
                    value={platformForm.feed_type}
                    onChange={e => setPlatformForm({ ...platformForm, feed_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                  >
                    <option value="xml">XML 1.0</option>
                    <option value="json">JSON API</option>
                    <option value="jsonld">JSON-LD</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Ingestion Endpoint</label>
                <input
                  type="url"
                  required
                  value={platformForm.endpoint}
                  onChange={e => setPlatformForm({ ...platformForm, endpoint: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Field Mapping Rules (JSON)</label>
                <textarea
                  rows={5}
                  value={platformForm.field_mapping}
                  onChange={e => setPlatformForm({ ...platformForm, field_mapping: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPlatformBuilderOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
                >
                  Deploy Platform Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
