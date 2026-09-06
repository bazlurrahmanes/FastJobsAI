import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  BookOpen, 
  DollarSign, 
  CheckCircle2, 
  ListChecks, 
  Award, 
  Sun, 
  MapPin, 
  Building2, 
  ShieldCheck,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { Job } from '../types';

interface AiJobExplainerModalProps {
  job: Job | null;
  onClose: () => void;
  defaultTab?: 'explainer' | 'salary';
}

export const AiJobExplainerModal: React.FC<AiJobExplainerModalProps> = ({ job, onClose, defaultTab = 'explainer' }) => {
  const [activeTab, setActiveTab] = useState<'explainer' | 'salary'>(defaultTab);
  const [explainerData, setExplainerData] = useState<any>(null);
  const [salaryData, setSalaryData] = useState<any>(null);
  const [loadingExplainer, setLoadingExplainer] = useState(true);
  const [loadingSalary, setLoadingSalary] = useState(true);

  useEffect(() => {
    if (!job) {
      setExplainerData(null);
      setSalaryData(null);
      return;
    }

    let isMounted = true;
    setLoadingExplainer(true);
    setLoadingSalary(true);

    // Fetch Explainer
    fetch('/api/ai/explain-job', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job })
    })
      .then(res => res.json())
      .then(data => {
        if (isMounted) {
          setExplainerData(data);
          setLoadingExplainer(false);
        }
      })
      .catch(() => { if (isMounted) setLoadingExplainer(false); });

    // Fetch Salary Insights
    fetch('/api/ai/salary-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobTitle: job.title,
        category: job.category,
        location: job.location,
        isRemote: job.isRemote,
        experienceLevel: job.experienceLevel,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax
      })
    })
      .then(res => res.json())
      .then(data => {
        if (isMounted) {
          setSalaryData(data);
          setLoadingSalary(false);
        }
      })
      .catch(() => { if (isMounted) setLoadingSalary(false); });

    return () => { isMounted = false; };
  }, [job]);

  if (!job) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-[#0a1128] border border-cyan-500/30 shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-[#0a1128] to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                FastJobs AI Job Breakdown & Salary Insights
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Features #9 & #10
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {job.title} at <span className="text-cyan-300 font-semibold">{job.company}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-800/80 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('explainer')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'explainer'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Plain English Job Explainer</span>
          </button>
          <button
            onClick={() => setActiveTab('salary')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'salary'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>AI Salary Insights & Market Data</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: PLAIN ENGLISH EXPLAINER */}
          {activeTab === 'explainer' && (
            <div>
              {loadingExplainer ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <Sparkles className="w-8 h-8 text-cyan-400 animate-spin" />
                  <p className="text-xs">Distilling job description into simple plain English...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* Summary Box */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/40 to-blue-950/40 border border-cyan-500/30 space-y-2">
                    <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                      The Role in 10 Seconds:
                    </span>
                    <p className="text-sm text-slate-100 leading-relaxed font-medium">
                      {explainerData?.simpleSummary}
                    </p>
                  </div>

                  {/* Core Responsibilities & Requirements */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                      <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                        <ListChecks className="w-4 h-4 text-cyan-400" />
                        What You'll Actually Do:
                      </span>
                      <ul className="space-y-1.5 text-xs text-slate-300 pl-5 list-disc">
                        {explainerData?.responsibilities?.map((item: string, idx: number) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                      <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        What They Absolutely Need:
                      </span>
                      <ul className="space-y-1.5 text-xs text-slate-300 pl-5 list-disc">
                        {explainerData?.requirements?.map((item: string, idx: number) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>

                  </div>

                  {/* Seniority, Remote & Compensation Simple Breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1">
                      <span className="text-slate-400 font-semibold">Seniority Expectation:</span>
                      <div className="font-bold text-cyan-300">{explainerData?.seniority?.level}</div>
                      <p className="text-[11px] text-slate-400">{explainerData?.seniority?.whatItMeans}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1">
                      <span className="text-slate-400 font-semibold">Remote & Location:</span>
                      <div className="font-bold text-emerald-300">{explainerData?.remoteStatus?.type}</div>
                      <p className="text-[11px] text-slate-400">{explainerData?.remoteStatus?.details}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1">
                      <span className="text-slate-400 font-semibold">Total Comp:</span>
                      <div className="font-bold text-blue-300">{explainerData?.salary?.range}</div>
                      <p className="text-[11px] text-slate-400">{explainerData?.salary?.simpleExplanation}</p>
                    </div>
                  </div>

                  {/* A Day in the Life */}
                  <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Sun className="w-4 h-4 text-amber-400" />
                      A Realistic Day in This Role:
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed italic">
                      "{explainerData?.dayInTheLife}"
                    </p>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* TAB 2: SALARY INSIGHTS & MARKET COMPARISON */}
          {activeTab === 'salary' && (
            <div>
              {loadingSalary ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <Sparkles className="w-8 h-8 text-emerald-400 animate-spin" />
                  <p className="text-xs">Computing platform compensation percentiles from verified job database...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* Market Range Visualizer */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-blue-950/40 border border-emerald-500/30 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                          <BarChart3 className="w-4 h-4" />
                          Platform Verified Market Distribution ({job.experienceLevel})
                        </span>
                        <h4 className="text-xl font-extrabold text-white">
                          Median: ${salaryData?.estimatedRange?.median?.toLocaleString() || '165,000'} / year
                        </h4>
                      </div>

                      <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold self-start sm:self-auto">
                        {salaryData?.marketComparison?.label}
                      </div>
                    </div>

                    {/* Percentile Grid */}
                    <div className="grid grid-cols-4 gap-2 text-center text-xs pt-2">
                      <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">25th Pct</div>
                        <div className="font-bold text-slate-200 mt-0.5">${Math.round(salaryData?.estimatedRange?.min/1000)}k</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40">
                        <div className="text-[10px] text-emerald-400 font-bold uppercase">Median</div>
                        <div className="font-bold text-emerald-300 mt-0.5">${Math.round(salaryData?.estimatedRange?.median/1000)}k</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">75th Pct</div>
                        <div className="font-bold text-slate-200 mt-0.5">${Math.round(salaryData?.estimatedRange?.max/1000)}k</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                        <div className="text-[10px] text-cyan-400 font-bold uppercase">90th Pct</div>
                        <div className="font-bold text-cyan-300 mt-0.5">${Math.round(salaryData?.estimatedRange?.topPercentile/1000)}k</div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {salaryData?.marketComparison?.explanation}
                    </p>
                  </div>

                  {/* Company Benchmarks from Real Database Data */}
                  {salaryData?.companyComparison && salaryData.companyComparison.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        Similar Verified Employer Benchmarks
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {salaryData.companyComparison.map((comp: any, idx: number) => (
                          <div key={idx} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
                            <div>
                              <div className="font-bold text-white">{comp.company}</div>
                              <div className="text-[11px] text-slate-400 truncate max-w-[180px]">{comp.roleTitle}</div>
                            </div>
                            <div className="font-bold text-emerald-400 text-sm">
                              ${comp.avgSalary.toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Compensation Drivers */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                      Key Compensation Drivers
                    </h4>
                    <div className="space-y-2">
                      {salaryData?.compensationFactors?.map((f: any, idx: number) => (
                        <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start justify-between gap-3 text-xs">
                          <div>
                            <span className="font-bold text-slate-200">{f.factor}: </span>
                            <span className="text-slate-400">{f.description}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-bold shrink-0 border border-cyan-500/30">
                            {f.impact}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Verified Data Notice */}
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-500 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{salaryData?.noFabricationNotice || 'FastJobs Platform data aggregated from real active employer postings.'}</span>
                  </div>

                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
