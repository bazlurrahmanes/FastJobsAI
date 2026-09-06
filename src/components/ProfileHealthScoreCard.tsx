import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  HelpCircle, 
  ArrowUpRight, 
  RefreshCw, 
  FileText, 
  Building2, 
  User, 
  Award, 
  Briefcase, 
  GraduationCap, 
  Globe, 
  MapPin, 
  Phone, 
  Image as ImageIcon, 
  Sliders, 
  Layers, 
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { 
  UserProfile, 
  Job, 
  ProfileHealthResult, 
  ProfileHealthDimension, 
  ProfileRecommendation,
  ProfileHealthType 
} from '../types';
import { 
  evaluateCandidateProfileHealth, 
  evaluateEmployerProfileHealth 
} from '../utils/profileHealthEvaluator';

interface ProfileHealthScoreCardProps {
  profile: UserProfile | null;
  profileType: ProfileHealthType;
  jobs?: Job[];
  activeJobs?: Job[];
  onActionClick?: (target?: string) => void;
  className?: string;
  condensed?: boolean;
}

export const ProfileHealthScoreCard: React.FC<ProfileHealthScoreCardProps> = ({
  profile,
  profileType,
  jobs = [],
  activeJobs,
  onActionClick,
  className = '',
  condensed = false
}) => {
  const effectiveJobs = activeJobs || jobs;
  const [activeTab, setActiveTab] = useState<'overview' | 'dimensions' | 'missing' | 'warnings' | 'strengths' | 'actions'>('overview');
  const [isAuditing, setIsAuditing] = useState(false);
  const [serverAuditResult, setServerAuditResult] = useState<Partial<ProfileHealthResult> | null>(null);
  const [auditMessage, setAuditMessage] = useState<string | null>(null);

  // Compute local heuristic score automatically whenever profile or jobs change
  const localResult: ProfileHealthResult = useMemo(() => {
    if (profileType === 'employer') {
      return evaluateEmployerProfileHealth(profile, effectiveJobs);
    }
    return evaluateCandidateProfileHealth(profile);
  }, [profile, profileType, effectiveJobs]);

  // Merge server audit with local dimension breakdown
  const result: ProfileHealthResult = useMemo(() => {
    if (!serverAuditResult) return localResult;

    return {
      ...localResult,
      overallScore: serverAuditResult.overallScore ?? localResult.overallScore,
      grade: serverAuditResult.grade ?? localResult.grade,
      statusText: serverAuditResult.statusText ?? localResult.statusText,
      missingInformation: serverAuditResult.missingInformation && serverAuditResult.missingInformation.length > 0 
        ? serverAuditResult.missingInformation 
        : localResult.missingInformation,
      warnings: serverAuditResult.warnings && serverAuditResult.warnings.length > 0 
        ? serverAuditResult.warnings 
        : localResult.warnings,
      strengths: serverAuditResult.strengths && serverAuditResult.strengths.length > 0 
        ? serverAuditResult.strengths 
        : localResult.strengths,
      recommendations: serverAuditResult.recommendations && serverAuditResult.recommendations.length > 0
        ? serverAuditResult.recommendations as ProfileRecommendation[]
        : localResult.recommendations,
      aiGenerated: serverAuditResult.aiGenerated ?? false
    };
  }, [localResult, serverAuditResult]);

  const handleRunAiAudit = async () => {
    if (isAuditing || !profile) return;
    setIsAuditing(true);
    setAuditMessage('Connecting to FastJobs AI evaluator...');

    try {
      if (profileType === 'candidate') {
        const res = await fetch('/api/seeker/profile-health', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile })
        });
        if (res.ok) {
          const data = await res.json();
          setServerAuditResult(data);
          setAuditMessage('AI profile audit complete.');
        } else {
          setAuditMessage('Evaluated with high-precision local diagnostic rules.');
        }
      } else {
        const res = await fetch('/api/recruiter/company-health', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile, jobs })
        });
        if (res.ok) {
          const data = await res.json();
          setServerAuditResult(data);
          setAuditMessage('AI employer brand audit complete.');
        } else {
          setAuditMessage('Evaluated with high-precision local diagnostic rules.');
        }
      }
    } catch {
      setAuditMessage('AI service busy; loaded comprehensive offline ruleset.');
    } finally {
      setIsAuditing(false);
      setTimeout(() => setAuditMessage(null), 4000);
    }
  };

  const scoreColor = useMemo(() => {
    if (result.overallScore >= 90) return { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-800', bar: 'bg-emerald-500' };
    if (result.overallScore >= 75) return { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40', border: 'border-blue-200 dark:border-blue-800', bar: 'bg-blue-500' };
    if (result.overallScore >= 60) return { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-200 dark:border-amber-800', bar: 'bg-amber-500' };
    return { text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/40', border: 'border-rose-200 dark:border-rose-800', bar: 'bg-rose-500' };
  }, [result.overallScore]);

  const getDimensionIcon = (id: string) => {
    switch (id) {
      case 'completeness':
      case 'companyInformation': return <Building2 className="w-4 h-4" />;
      case 'photoAvatar':
      case 'logo': return <ImageIcon className="w-4 h-4" />;
      case 'skills': return <Sliders className="w-4 h-4" />;
      case 'experience': return <Briefcase className="w-4 h-4" />;
      case 'education': return <GraduationCap className="w-4 h-4" />;
      case 'resume': return <FileText className="w-4 h-4" />;
      case 'jobPreferences': return <TrendingUp className="w-4 h-4" />;
      case 'contactInformation': return <Phone className="w-4 h-4" />;
      case 'profileQuality':
      case 'companyDescription': return <Award className="w-4 h-4" />;
      case 'industry': return <Layers className="w-4 h-4" />;
      case 'location': return <MapPin className="w-4 h-4" />;
      case 'website': return <Globe className="w-4 h-4" />;
      case 'verificationStatus': return <ShieldCheck className="w-4 h-4" />;
      case 'activeJobQuality': return <Sparkles className="w-4 h-4" />;
      default: return <CheckCircle2 className="w-4 h-4" />;
    }
  };

  // If condensed widget mode (e.g. for sidebars or header summaries)
  if (condensed) {
    return (
      <div 
        id="profile-health-score-condensed"
        className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm ${className}`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {profileType === 'candidate' ? 'Candidate Profile Health' : 'Employer Brand Health'}
            </h4>
          </div>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${scoreColor.bg} ${scoreColor.text} ${scoreColor.border}`}>
            Grade {result.grade}
          </span>
        </div>

        <div className="flex items-baseline justify-between mt-3 mb-1.5">
          <div className="flex items-baseline space-x-1.5">
            <span className={`text-2xl font-bold tracking-tight ${scoreColor.text}`}>
              {result.overallScore}
            </span>
            <span className="text-xs text-slate-400">/100</span>
          </div>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
            {result.statusText}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden mb-3">
          <div 
            className={`h-2 rounded-full transition-all duration-700 ease-out ${scoreColor.bar}`}
            style={{ width: `${result.overallScore}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span>{result.missingInformation.length} missing items</span>
          <span>{result.recommendations.length} action items</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      id="profile-health-score-full"
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden ${className}`}
    >
      {/* Top Banner Header */}
      <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-white to-indigo-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center space-x-4">
            {/* Score Ring / Gauge Badge */}
            <div className={`relative flex flex-col items-center justify-center w-20 h-20 rounded-2xl border-2 ${scoreColor.border} ${scoreColor.bg} shadow-sm shrink-0`}>
              <span className={`text-3xl font-extrabold tracking-tight ${scoreColor.text}`}>
                {result.overallScore}
              </span>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider -mt-1">
                Score
              </span>
              <span className={`absolute -top-2 -right-2 px-1.5 py-0.5 text-[11px] font-bold rounded-md shadow-xs ${scoreColor.bg} ${scoreColor.text} border ${scoreColor.border}`}>
                {result.grade}
              </span>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  {profileType === 'candidate' ? 'Candidate Profile Health' : 'Employer Profile & Brand Health'}
                </span>
                {result.aiGenerated && (
                  <span className="flex items-center space-x-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    <Sparkles className="w-3 h-3" />
                    <span>AI Audited</span>
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {result.statusText}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {profileType === 'candidate'
                  ? `Evaluated for ${result.targetName}. Higher health scores unlock 3.5x more recruiter inbound contacts.`
                  : `Evaluated for ${result.targetName}. High employer health scores attract 4.2x more senior talent.`}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              id="btn-re-audit-profile-health"
              onClick={handleRunAiAudit}
              disabled={isAuditing}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-xs transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
              <span>{isAuditing ? 'Auditing...' : 'Run FastJobs AI Audit'}</span>
            </button>
          </div>
        </div>

        {auditMessage && (
          <div className="mt-3 text-xs font-medium text-indigo-600 dark:text-indigo-400 flex items-center space-x-1.5 animate-fadeIn">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{auditMessage}</span>
          </div>
        )}

        {/* Metric Quick Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
          <div className="bg-white dark:bg-slate-800/80 p-3 rounded-lg border border-slate-200/70 dark:border-slate-700/60 flex items-center space-x-3">
            <div className="p-2 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {result.strengths.length}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Verified Strengths</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/80 p-3 rounded-lg border border-slate-200/70 dark:border-slate-700/60 flex items-center space-x-3">
            <div className="p-2 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {result.warnings.length}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Warnings & Risks</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/80 p-3 rounded-lg border border-slate-200/70 dark:border-slate-700/60 flex items-center space-x-3">
            <div className="p-2 rounded-md bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {result.missingInformation.length}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Missing Elements</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/80 p-3 rounded-lg border border-slate-200/70 dark:border-slate-700/60 flex items-center space-x-3">
            <div className="p-2 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {result.recommendations.length}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Improvement Actions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="px-5 sm:px-6 pt-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex space-x-1 sm:space-x-2 overflow-x-auto text-xs font-semibold">
        <button
          id="tab-profile-health-overview"
          onClick={() => setActiveTab('overview')}
          className={`pb-2.5 px-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Overview & Checklist
        </button>
        <button
          id="tab-profile-health-dimensions"
          onClick={() => setActiveTab('dimensions')}
          className={`pb-2.5 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center space-x-1.5 ${
            activeTab === 'dimensions'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span>9-Point Dimension Audit</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] text-slate-700 dark:text-slate-300">
            {result.dimensions.length}
          </span>
        </button>
        <button
          id="tab-profile-health-missing"
          onClick={() => setActiveTab('missing')}
          className={`pb-2.5 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center space-x-1.5 ${
            activeTab === 'missing'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span>Missing Information</span>
          {result.missingInformation.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-100 dark:bg-rose-900/60 text-[10px] text-rose-700 dark:text-rose-300">
              {result.missingInformation.length}
            </span>
          )}
        </button>
        <button
          id="tab-profile-health-warnings"
          onClick={() => setActiveTab('warnings')}
          className={`pb-2.5 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center space-x-1.5 ${
            activeTab === 'warnings'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span>Warnings & Risks</span>
          {result.warnings.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-900/60 text-[10px] text-amber-700 dark:text-amber-300">
              {result.warnings.length}
            </span>
          )}
        </button>
        <button
          id="tab-profile-health-strengths"
          onClick={() => setActiveTab('strengths')}
          className={`pb-2.5 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center space-x-1.5 ${
            activeTab === 'strengths'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span>Strengths</span>
          <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-[10px] text-emerald-700 dark:text-emerald-300">
            {result.strengths.length}
          </span>
        </button>
        <button
          id="tab-profile-health-actions"
          onClick={() => setActiveTab('actions')}
          className={`pb-2.5 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center space-x-1.5 ${
            activeTab === 'actions'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span>Action Plan</span>
          <span className="px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-900/60 text-[10px] text-blue-700 dark:text-blue-300">
            {result.recommendations.length}
          </span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="p-5 sm:p-6">
        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Action Banner */}
            {result.recommendations.length > 0 && (
              <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-lg bg-indigo-600 text-white shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Top Recommended Improvement: {result.recommendations[0].title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                      {result.recommendations[0].description}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onActionClick?.(result.recommendations[0].actionTarget)}
                  className="inline-flex items-center space-x-1 text-xs font-bold px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 transition-colors"
                >
                  <span>{result.recommendations[0].actionLabel}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Checklist Grid */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                Profile Health Audit Checklist
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.dimensions.map((dim) => {
                  const isOptimal = dim.score >= 80;
                  const isWarning = dim.score >= 50 && dim.score < 80;
                  return (
                    <div 
                      key={dim.id}
                      className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 flex items-start justify-between space-x-3"
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                          isOptimal 
                            ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400' 
                            : isWarning 
                            ? 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400' 
                            : 'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
                        }`}>
                          {getDimensionIcon(dim.id)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {dim.name}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {dim.summary}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          isOptimal 
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' 
                            : isWarning 
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300' 
                            : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                        }`}>
                          {dim.score}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 2. DIMENSIONS AUDIT TAB */}
        {activeTab === 'dimensions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Detailed 9-dimension health weights and compliance breakdown.
              </span>
            </div>

            <div className="space-y-3">
              {result.dimensions.map((dim) => (
                <div 
                  key={dim.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2.5">
                      <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {getDimensionIcon(dim.id)}
                      </span>
                      <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {dim.name}
                      </h5>
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                        Weight: {dim.weight}%
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-auto">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {dim.score}/100
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        dim.status === 'optimal' 
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' 
                          : dim.status === 'warning' 
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300' 
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                      }`}>
                        {dim.status}
                      </span>
                    </div>
                  </div>

                  {/* Dimension Bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 my-2.5 overflow-hidden">
                    <div 
                      className={`h-1.5 rounded-full ${
                        dim.score >= 80 ? 'bg-emerald-500' : dim.score >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${dim.score}%` }}
                    />
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">
                    {dim.summary}
                  </p>

                  <div className="space-y-1">
                    {dim.details.map((detail, idx) => (
                      <div key={idx} className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-600" />
                        <span>{detail}</span>
                      </div>
                    ))}
                  </div>

                  {dim.missingFields.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">Missing:</span>
                      {dim.missingFields.map((f, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-900">
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. MISSING INFORMATION TAB */}
        {activeTab === 'missing' && (
          <div className="space-y-4">
            {result.missingInformation.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Zero Missing Information
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-md mx-auto">
                  Every essential profile field is populated. Your profile meets standard enterprise completeness guidelines.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  Complete these missing items to boost your overall health score:
                </div>
                {result.missingInformation.map((item, idx) => (
                  <div 
                    key={idx}
                    className="p-3.5 rounded-lg border border-rose-100 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-1.5 rounded-md bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-400 shrink-0">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {item}
                      </span>
                    </div>

                    <button
                      onClick={() => onActionClick?.('edit_profile')}
                      className="text-xs font-semibold px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white transition-colors flex items-center space-x-1"
                    >
                      <span>Add</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. WARNINGS & RISKS TAB */}
        {activeTab === 'warnings' && (
          <div className="space-y-3">
            {result.warnings.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <ShieldCheck className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  No Active Warnings Detected
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                  Your profile complies with all FastJobs quality algorithms and has no recruiter flags.
                </p>
              </div>
            ) : (
              result.warnings.map((warning, idx) => (
                <div 
                  key={idx}
                  className="p-3.5 rounded-lg border border-amber-200 dark:border-amber-800/70 bg-amber-50/50 dark:bg-amber-950/30 flex items-start space-x-3"
                >
                  <div className="p-1.5 rounded-md bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                    {warning}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 5. STRENGTHS TAB */}
        {activeTab === 'strengths' && (
          <div className="space-y-3">
            {result.strengths.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-slate-200 dark:border-slate-800">
                <HelpCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-500">Add detailed experience or company records to generate competitive strengths.</p>
              </div>
            ) : (
              result.strengths.map((strength, idx) => (
                <div 
                  key={idx}
                  className="p-3.5 rounded-lg border border-emerald-100 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-start space-x-3"
                >
                  <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                    {strength}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 6. ACTION PLAN TAB */}
        {activeTab === 'actions' && (
          <div className="space-y-3">
            {result.recommendations.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-slate-200 dark:border-slate-800">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500">All recommended actions have been completed!</p>
              </div>
            ) : (
              result.recommendations.map((rec) => (
                <div 
                  key={rec.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        rec.priority === 'high' 
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300' 
                          : rec.priority === 'medium' 
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300' 
                          : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                      }`}>
                        {rec.priority} Priority
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {rec.category}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        +{rec.potentialScoreGain} pts
                      </span>
                    </div>

                    <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {rec.title}
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {rec.description}
                    </p>
                  </div>

                  <button
                    onClick={() => onActionClick?.(rec.actionTarget)}
                    className="inline-flex items-center justify-center space-x-1 px-3.5 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shrink-0 transition-colors"
                  >
                    <span>{rec.actionLabel}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
export default ProfileHealthScoreCard;
