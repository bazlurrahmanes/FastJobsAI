import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  HeartPulse, 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  TrendingUp, 
  Copy, 
  Check, 
  RotateCcw, 
  UploadCloud, 
  Download, 
  ShieldCheck, 
  Layers, 
  Zap, 
  ChevronRight, 
  Info, 
  Sliders, 
  Save, 
  ArrowRight,
  UserCheck,
  Award,
  Briefcase,
  GraduationCap,
  Target,
  Search,
  FileCheck2,
  HelpCircle,
  CheckSquare,
  Compass
} from 'lucide-react';
import { useJobContext } from '../../context/JobContext';
import { ResumeHealthScoreResult, ResumeImprovementSuggestion } from '../../types';
import { 
  INDUSTRY_STANDARDS, 
  IndustryStandardDefinition, 
  evaluateResumeHealth, 
  generateOptimizedResumeText 
} from '../../utils/resumeHealthEvaluator';
import { SAMPLE_RESUME_PRESETS } from '../../utils/resumeParser';

export const SeekerResumeHealthScore: React.FC = () => {
  const { currentUser, showToast, openChatWithPrompt, updateProfile } = useJobContext();

  // Selected Industry Standard Benchmark
  const [selectedStandardId, setSelectedStandardId] = useState<string>('tech_faang');
  const [targetRole, setTargetRole] = useState<string>(currentUser?.title || 'Senior Software Engineer');

  // Resume Input Mode: profile | upload | preset | paste
  const [inputMode, setInputMode] = useState<'profile' | 'upload' | 'preset' | 'paste'>('profile');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('alex-chen-ai-engineer');
  const [uploadedFileName, setUploadedFileName] = useState<string>(currentUser?.resumeFileName || 'Alex_Chen_Resume_AI_Engineer_2026.pdf');
  const [activeResumeText, setActiveResumeText] = useState<string>('');
  const [pastedText, setPastedText] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Health Score & Analysis State
  const [healthResult, setHealthResult] = useState<ResumeHealthScoreResult | null>(null);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [appliedSuggestionIds, setAppliedSuggestionIds] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeFilterCategory, setActiveFilterCategory] = useState<'all' | 'critical' | 'impact' | 'verbs' | 'ats' | 'keywords' | 'brevity' | 'completeness'>('all');
  const [showOptimizedPreview, setShowOptimizedPreview] = useState<boolean>(false);

  // Current Standard definition
  const currentStandard: IndustryStandardDefinition = useMemo(() => {
    return INDUSTRY_STANDARDS.find(s => s.id === selectedStandardId) || INDUSTRY_STANDARDS[0];
  }, [selectedStandardId]);

  // Construct default profile resume text
  const profileResumeText = useMemo(() => {
    const p = currentUser;
    if (!p) {
      return SAMPLE_RESUME_PRESETS[0].text;
    }

    const expLines = (p.experience || []).map(e => 
      `${e.role} — ${e.company}\n${e.startDate} – ${e.current ? 'Present' : e.endDate} | ${e.location || 'Remote'}\n- ${e.description}`
    ).join('\n\n');

    const eduLines = (p.education || []).map(ed => 
      `${ed.school}\n${ed.degree} in ${ed.field} | Graduated ${ed.graduationYear}`
    ).join('\n\n');

    const skillsList = (p.skills || []).map(s => s.name).join(', ');

    return `${p.name}
${p.location || 'San Francisco, CA'} • ${p.email} • ${p.phone || '+1 (555) 019-2834'}

PROFESSIONAL SUMMARY
${p.bio || 'Experienced engineering leader building high-performance scalable systems and modern applications.'}

CORE COMPETENCIES
${skillsList || 'TypeScript, React, Node.js, Python, Cloud Systems, Distributed Architecture'}

PROFESSIONAL EXPERIENCE
${expLines || '- Engineered scalable cloud architectures and optimized database queries.'}

EDUCATION
${eduLines || 'B.S. in Computer Science'}`;
  }, [currentUser]);

  // Sync initial resume text
  useEffect(() => {
    if (inputMode === 'profile') {
      setActiveResumeText(profileResumeText);
      setUploadedFileName(currentUser?.resumeFileName || 'Alex_Chen_Resume_AI_Engineer_2026.pdf');
    } else if (inputMode === 'preset') {
      const preset = SAMPLE_RESUME_PRESETS.find(p => p.id === selectedPresetId) || SAMPLE_RESUME_PRESETS[0];
      setActiveResumeText(preset.text);
      setUploadedFileName(`${preset.name.replace(/\s+/g, '_')}_Resume.txt`);
    } else if (inputMode === 'paste') {
      setActiveResumeText(pastedText || profileResumeText);
      setUploadedFileName('Pasted_Resume_Draft.txt');
    }
  }, [inputMode, selectedPresetId, profileResumeText, currentUser]);

  // Trigger Resume Health Audit (Client-side instant + optional AI call)
  const runHealthAudit = async (textToAudit?: string, useDeepAi = false) => {
    const text = textToAudit || activeResumeText || profileResumeText;
    if (!text.trim()) return;

    setIsAuditing(true);

    try {
      // 1. Perform instant comprehensive client evaluation
      const localResult = evaluateResumeHealth(
        text,
        selectedStandardId,
        uploadedFileName,
        targetRole
      );

      if (useDeepAi) {
        // Call Gemini server endpoint for deeper analysis
        const res = await fetch('/api/ai/resume-health-score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resumeText: text,
            standardId: selectedStandardId,
            standardName: currentStandard.name,
            targetRole,
            profile: currentUser
          })
        });

        if (res.ok) {
          const aiData = await res.json();
          // Merge AI suggestions and adjustments while retaining robust local metrics
          setHealthResult({
            ...localResult,
            overallScore: aiData.overallScore ?? localResult.overallScore,
            healthGrade: aiData.healthGrade || localResult.healthGrade,
            healthStatusText: aiData.healthStatusText || localResult.healthStatusText,
            quantifiedPercentage: aiData.quantifiedPercentage ?? localResult.quantifiedPercentage,
            sectionScores: aiData.sectionScores || localResult.sectionScores,
            categoryScores: aiData.categoryScores || localResult.categoryScores,
            strengths: (aiData.strengths && aiData.strengths.length > 0) ? aiData.strengths : localResult.strengths,
            problems: (aiData.problems && aiData.problems.length > 0) ? aiData.problems : localResult.problems,
            suggestions: (aiData.suggestions && aiData.suggestions.length > 0) 
              ? aiData.suggestions 
              : localResult.suggestions,
            jobMatchReadiness: aiData.jobMatchReadiness || localResult.jobMatchReadiness,
            quickWins: aiData.quickWins || localResult.quickWins,
            atsReadabilityFeedback: aiData.atsReadabilityFeedback || localResult.atsReadabilityFeedback,
            recruiterAudit: aiData.recruiterAudit || localResult.recruiterAudit,
            aiGenerated: true
          });
          showToast?.({ title: 'AI Deep Audit Complete', message: 'Gemini AI Deep Health Audit completed against ' + currentStandard.shortName, type: 'success' });
        } else {
          setHealthResult(localResult);
        }
      } else {
        setHealthResult(localResult);
      }
    } catch (err) {
      console.error('Error running resume health audit:', err);
      // Ensure fallback
      const fallback = evaluateResumeHealth(text, selectedStandardId, uploadedFileName, targetRole);
      setHealthResult(fallback);
    } finally {
      setIsAuditing(false);
    }
  };

  // Re-run evaluation whenever text or standard changes
  useEffect(() => {
    if (activeResumeText) {
      runHealthAudit(activeResumeText, false);
    }
  }, [activeResumeText, selectedStandardId]);

  // File Upload Handlers
  const handleFileUpload = (file: File) => {
    setUploadedFileName(file.name);
    setInputMode('upload');

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = (e.target?.result as string) || '';
      setActiveResumeText(content);
      showToast?.({ title: 'File Uploaded', message: `Loaded resume: ${file.name}`, type: 'info' });
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast?.({ title: 'Copied', message: 'Copied to clipboard', type: 'success' });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Apply single suggestion
  const handleApplySuggestion = (sug: ResumeImprovementSuggestion) => {
    if (!activeResumeText) return;

    let updated = activeResumeText;
    if (sug.originalSnippet && updated.includes(sug.originalSnippet)) {
      updated = updated.replace(sug.originalSnippet, sug.suggestedRevision);
    } else {
      // Append or replace nearest line
      updated = `${updated}\n\n- ${sug.suggestedRevision}`;
    }

    setActiveResumeText(updated);
    setAppliedSuggestionIds(prev => new Set(prev).add(sug.id));
    showToast?.({ title: 'Improvement Applied', message: `Applied: ${sug.title}`, type: 'success' });
  };

  // Auto-apply all suggestions
  const handleApplyAllSuggestions = () => {
    if (!healthResult || !activeResumeText) return;
    const optimized = generateOptimizedResumeText(activeResumeText, healthResult.suggestions);
    setActiveResumeText(optimized);
    setAppliedSuggestionIds(new Set(healthResult.suggestions.map(s => s.id)));
    showToast?.({ title: 'Auto-Optimized', message: 'All improvements incorporated into your active resume draft!', type: 'success' });
  };

  // Save improved bullets and verified health score back to profile
  const handleSyncToProfile = () => {
    if (!currentUser) return;
    updateProfile?.({
      ...currentUser,
      resumeFileName: uploadedFileName,
      resumeSummary: healthResult?.healthStatusText || currentUser.resumeSummary,
      resumeHealthScore: healthResult?.overallScore,
      resumeHealthGrade: healthResult?.healthGrade,
      resumeHealthAuditDate: new Date().toISOString()
    });
    showToast?.({ title: 'Profile Synchronized', message: 'Saved Resume Health Score (' + (healthResult?.overallScore || 0) + '/100) to your candidate profile!', type: 'success' });
  };

  // Filtered Suggestions
  const filteredSuggestions = useMemo(() => {
    if (!healthResult) return [];
    if (activeFilterCategory === 'all') return healthResult.suggestions;
    if (activeFilterCategory === 'critical') return healthResult.suggestions.filter(s => s.severity === 'critical');
    return healthResult.suggestions.filter(s => s.category === activeFilterCategory);
  }, [healthResult, activeFilterCategory]);

  const overall = healthResult?.overallScore || 85;

  // Grade color helper
  const getGradeBadge = (score: number) => {
    if (score >= 90) return { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/40', label: 'A+ • Exceptional' };
    if (score >= 80) return { bg: 'bg-cyan-500/20', text: 'text-cyan-300', border: 'border-cyan-500/40', label: 'A • Very Strong' };
    if (score >= 70) return { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/40', label: 'B • Good' };
    if (score >= 60) return { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/40', label: 'C • Needs Work' };
    return { bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/40', label: 'D • At Risk' };
  };

  const gradeInfo = getGradeBadge(overall);

  return (
    <div className="space-y-8" id="resume-health-score-utility">
      
      {/* Top Hero Banner */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900/90 via-[#0b1329] to-slate-900/90 border border-cyan-500/30 shadow-2xl shadow-cyan-950/50 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold">
              <HeartPulse className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>Resume Health Score™ Engine</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span className="text-[11px] text-slate-300">Industry Standards Audit</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Resume Health Score & Improvement Suggestions
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Audits uploaded candidate resumes against Google X-Y-Z metric formulas, Workday/Taleo ATS parsability, active voice ownership, and modern tech stack benchmarks.
            </p>
          </div>

          {/* Quick Actions & AI Deep Audit */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => runHealthAudit(activeResumeText, false)}
              disabled={isAuditing}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw className={`w-3.5 h-3.5 text-cyan-400 ${isAuditing ? 'animate-spin' : ''}`} />
              <span>Re-Evaluate</span>
            </button>

            <button
              onClick={() => runHealthAudit(activeResumeText, true)}
              disabled={isAuditing}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-slate-950 fill-slate-950" />
              <span>{isAuditing ? 'Auditing with Gemini...' : 'Gemini AI Deep Audit'}</span>
            </button>
          </div>
        </div>

        {/* Target Standard & Role Benchmarking Selector Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Select Industry Benchmark Standard</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {INDUSTRY_STANDARDS.map(std => {
                const isSelected = selectedStandardId === std.id;
                return (
                  <button
                    key={std.id}
                    onClick={() => setSelectedStandardId(std.id)}
                    className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-400/80 text-white shadow-md shadow-cyan-950/50'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-bold line-clamp-1">{std.shortName}</span>
                    <span className="text-[10px] text-cyan-400 mt-1 font-mono font-semibold">
                      Target: {std.metricDensityTarget}% Quantified
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-[11px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Target Role & Seniority Calibrator</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Senior Software Engineer / Staff AI Architect"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-400"
              />
              <button
                onClick={() => runHealthAudit(activeResumeText, false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold shrink-0 border border-slate-700 cursor-pointer"
              >
                Apply Role
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-1">
              {currentStandard.description}
            </p>
          </div>
        </div>

      </div>

      {/* Resume Source Selector & Ingestion Controls */}
      <div className="p-5 rounded-2xl bg-[#080e22] border border-slate-800/90 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Resume Input Source
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
              {uploadedFileName}
            </span>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
            <button
              onClick={() => setInputMode('profile')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                inputMode === 'profile'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              My Profile Resume
            </button>
            <button
              onClick={() => {
                setInputMode('upload');
                fileInputRef.current?.click();
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                inputMode === 'upload'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Upload New File
            </button>
            <button
              onClick={() => setInputMode('preset')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                inputMode === 'preset'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sample Presets
            </button>
            <button
              onClick={() => setInputMode('paste')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                inputMode === 'paste'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Raw Text Editor
            </button>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,.md,.json"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileUpload(e.target.files[0]);
            }
          }}
          className="hidden"
        />

        {/* Preset Selector Dropdown / Pills if in Preset Mode */}
        {inputMode === 'preset' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-slate-800/60">
            {SAMPLE_RESUME_PRESETS.map(preset => {
              const isSelected = selectedPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => setSelectedPresetId(preset.id)}
                  className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950/60 border-cyan-400/80 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-bold text-white flex items-center justify-between">
                    <span>{preset.name}</span>
                    {preset.id.includes('unoptimized') && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        Test Anti-Patterns
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-cyan-400 font-medium truncate mt-0.5">{preset.role}</div>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{preset.description}</p>
                </button>
              );
            })}
          </div>
        )}

        {/* Upload Drop Zone if in Upload Mode */}
        {inputMode === 'upload' && (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`p-6 rounded-2xl border-2 border-dashed transition-all text-center cursor-pointer ${
              isDragOver 
                ? 'border-cyan-400 bg-cyan-950/30' 
                : 'border-slate-700 bg-slate-900/40 hover:border-cyan-500/50 hover:bg-slate-900/60'
            }`}
          >
            <UploadCloud className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
            <div className="text-xs font-bold text-white">
              Drag and drop your resume file here, or click to browse
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Supports .pdf, .docx, .txt, .md • Instant OCR & formatting audit
            </div>
          </div>
        )}

        {/* Raw Text Editor if in Paste Mode */}
        {inputMode === 'paste' && (
          <div className="space-y-2 pt-2 border-t border-slate-800/60">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Paste raw resume or paste bullet points to test live score:</span>
              <button
                onClick={() => {
                  runHealthAudit(pastedText, false);
                  showToast?.({ title: 'Re-Scored', message: 'Re-scored pasted text', type: 'info' });
                }}
                className="text-cyan-400 hover:text-cyan-300 font-bold"
              >
                Re-Score Pasted Text →
              </button>
            </div>
            <textarea
              rows={6}
              value={pastedText || activeResumeText}
              onChange={(e) => {
                setPastedText(e.target.value);
                setActiveResumeText(e.target.value);
              }}
              placeholder="Paste plain resume text here..."
              className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-hidden focus:border-cyan-400"
            />
          </div>
        )}
      </div>

      {/* Primary Health Score Hero Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 4 Cols: Health Score Radial Gauge & Quick Vitals */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-[#091024] border border-cyan-500/30 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-rose-400" />
                Overall Health Index
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${gradeInfo.bg} ${gradeInfo.text} ${gradeInfo.border}`}>
                Grade {gradeInfo.label}
              </span>
            </div>

            {/* Circular Gauge Representation */}
            <div className="relative flex flex-col items-center justify-center py-4">
              <div className="w-40 h-40 rounded-full border-8 border-slate-800 relative flex items-center justify-center shadow-inner">
                {/* Score Ring Glow */}
                <div 
                  className={`absolute inset-0 rounded-full border-8 transition-all duration-700 ${
                    overall >= 85 ? 'border-cyan-400' : overall >= 70 ? 'border-blue-500' : 'border-amber-500'
                  }`}
                  style={{
                    clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%)`,
                    opacity: 0.85
                  }}
                />
                
                <div className="text-center space-y-0.5 relative z-10">
                  <div className="text-4xl sm:text-5xl font-black text-white tracking-tighter">
                    {overall}
                  </div>
                  <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                    out of 100
                  </div>
                </div>
              </div>

              <div className="text-center mt-3 space-y-1">
                <h4 className="text-sm font-extrabold text-white">
                  {healthResult?.healthStatusText || 'Strong Profile • Ready for Applications'}
                </h4>
                <p className="text-[11px] text-cyan-400 font-medium">
                  {healthResult?.recruiterAudit.estimatedInterviewOdds || 'Top 15% Candidate Range'}
                </p>
              </div>
            </div>

            {/* Vital Signs Grid */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">Metric Density</div>
                <div className="text-sm font-extrabold text-cyan-300 mt-0.5">
                  {healthResult?.quantifiedPercentage || 65}%
                </div>
                <div className="text-[9px] text-slate-500 font-medium">
                  Target: {currentStandard.metricDensityTarget}%
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">Active Power Verbs</div>
                <div className="text-sm font-extrabold text-emerald-400 mt-0.5">
                  {healthResult?.categoryScores.actionVerbsAndTone.score || 85}%
                </div>
                <div className="text-[9px] text-slate-500 font-medium">
                  Target: {currentStandard.actionVerbTarget}%
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">ATS Parsability</div>
                <div className="text-sm font-extrabold text-blue-400 mt-0.5">
                  {healthResult?.categoryScores.atsAndFormatting.score || 92}%
                </div>
                <div className="text-[9px] text-slate-500 font-medium">
                  Workday/Lever Spec
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">Word Economy</div>
                <div className="text-sm font-extrabold text-purple-300 mt-0.5">
                  {healthResult?.categoryScores.brevityAndReadability.score || 86}%
                </div>
                <div className="text-[9px] text-slate-500 font-medium">
                  Zero Clichés
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Triggers */}
          <div className="pt-4 border-t border-slate-800/80 space-y-2">
            <button
              onClick={handleApplyAllSuggestions}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950" />
              <span>Auto-Apply All Suggestions (+{Math.min(22, 100 - overall)} pts)</span>
            </button>

            <button
              onClick={handleSyncToProfile}
              className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-cyan-400" />
              <span>Save Optimized Status to Profile</span>
            </button>
          </div>
        </div>

        {/* Right 8 Cols: 8 Section-by-Section Scores Breakdown Cards */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                Section-by-Section Health Scores (8 Dimensions)
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Targeting <span className="text-cyan-300 font-semibold">{targetRole}</span> • Benchmark: <span className="text-slate-300 font-semibold">{currentStandard.shortName}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                Job-Match: {healthResult?.jobMatchReadiness?.level || 'Interview Ready'}
              </span>
            </div>
          </div>

          {healthResult && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                {
                  key: 'completeness',
                  name: 'Resume Completeness',
                  data: healthResult.sectionScores?.completeness,
                  icon: FileCheck2,
                  color: 'cyan'
                },
                {
                  key: 'professionalSummary',
                  name: 'Professional Summary',
                  data: healthResult.sectionScores?.professionalSummary,
                  icon: Sparkles,
                  color: 'emerald'
                },
                {
                  key: 'skills',
                  name: 'Skills Stack & Depth',
                  data: healthResult.sectionScores?.skills,
                  icon: Award,
                  color: 'purple'
                },
                {
                  key: 'workExperience',
                  name: 'Work Experience (X-Y-Z Impact)',
                  data: healthResult.sectionScores?.workExperience,
                  icon: Briefcase,
                  color: 'emerald'
                },
                {
                  key: 'education',
                  name: 'Education & Credentials',
                  data: healthResult.sectionScores?.education,
                  icon: GraduationCap,
                  color: 'blue'
                },
                {
                  key: 'jobTargetRelevance',
                  name: 'Job-Target Relevance',
                  data: healthResult.sectionScores?.jobTargetRelevance,
                  icon: Target,
                  color: 'amber'
                },
                {
                  key: 'keywordsAtsCompatibility',
                  name: 'Keywords & ATS Compatibility',
                  data: healthResult.sectionScores?.keywordsAtsCompatibility,
                  icon: ShieldCheck,
                  color: 'indigo'
                },
                {
                  key: 'formattingReadability',
                  name: 'Formatting & Readability',
                  data: healthResult.sectionScores?.formattingReadability,
                  icon: FileText,
                  color: 'teal'
                },
                {
                  key: 'missingImportantInfo',
                  name: 'Missing Important Info',
                  data: healthResult.sectionScores?.missingImportantInfo,
                  icon: HelpCircle,
                  color: 'rose'
                }
              ].map(sec => {
                const s = sec.data || {
                  name: sec.name,
                  score: 85,
                  benchmark: 80,
                  status: 'pass' as const,
                  summary: 'Well structured and aligned with expectations.',
                  details: []
                };
                const IconComponent = sec.icon;
                const isPass = s.score >= s.benchmark;

                return (
                  <div key={sec.key} className="p-3.5 rounded-2xl bg-[#091024] border border-cyan-500/20 space-y-2 hover:border-cyan-500/40 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <IconComponent className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span className="text-xs font-bold text-white truncate">{s.name || sec.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-xs font-extrabold ${isPass ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {s.score}
                        </span>
                        <span className="text-[10px] text-slate-400">/ 100</span>
                      </div>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden relative">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          s.score >= 85 
                            ? 'bg-gradient-to-r from-emerald-400 to-teal-500' 
                            : s.score >= 75 
                            ? 'bg-gradient-to-r from-cyan-400 to-blue-500' 
                            : 'bg-gradient-to-r from-amber-400 to-rose-500'
                        }`}
                        style={{ width: `${s.score}%` }}
                      />
                      <div 
                        className="absolute top-0 bottom-0 w-0.5 bg-amber-400 opacity-80"
                        style={{ left: `${s.benchmark}%` }}
                        title={`Standard Benchmark: ${s.benchmark}%`}
                      />
                    </div>

                    <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
                      {s.summary}
                    </p>

                    {s.details && s.details.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {s.details.map((d, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md text-[9px] font-semibold bg-slate-900 border border-slate-800 text-slate-300">
                            {d.label}: <strong className="text-cyan-300">{d.value}</strong>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Job-Match Readiness Showcase */}
          {healthResult?.jobMatchReadiness && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#0c1836] via-[#091024] to-[#0d1e3d] border border-cyan-500/40 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white flex items-center gap-2">
                      <span>Job-Match Readiness</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {healthResult.jobMatchReadiness.level}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Calculated for role: <strong className="text-cyan-300">{healthResult.jobMatchReadiness.targetRole}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Callback Multiplier</div>
                    <div className="text-base font-black text-emerald-400">
                      {healthResult.jobMatchReadiness.estimatedCallbackMultiplier}
                    </div>
                  </div>
                  <div className="h-8 w-px bg-slate-800" />
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Readiness Score</div>
                    <div className="text-base font-black text-cyan-300">
                      {healthResult.jobMatchReadiness.score} / 100
                    </div>
                  </div>
                </div>
              </div>

              {/* Matched roles and Readiness factors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80 text-xs">
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Readiness Strengths
                  </span>
                  <ul className="space-y-1 text-slate-300 text-[11px]">
                    {healthResult.jobMatchReadiness.readinessFactors.map((rf, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{rf}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Missing For Next Tier
                  </span>
                  <ul className="space-y-1 text-slate-300 text-[11px]">
                    {healthResult.jobMatchReadiness.missingForNextTier.map((mf, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{mf}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Dedicated ATS & Readability Diagnostic Feedback */}
          {healthResult?.atsReadabilityFeedback && (
            <div className="p-4 sm:p-5 rounded-2xl bg-[#081226]/90 border border-indigo-500/40 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white flex items-center gap-2">
                      <span>ATS & Readability Compliance</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {healthResult.atsReadabilityFeedback.formatCompliance}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Reading Ease: <strong className="text-indigo-300">{healthResult.atsReadabilityFeedback.readingEase}</strong>
                    </p>
                  </div>
                </div>

                <div className="text-xs text-slate-300 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-indigo-400 block">6-Second Scan Gaze</span>
                  <span className="text-[11px] text-slate-300">{healthResult.atsReadabilityFeedback.scanVerdict}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[10px] uppercase font-bold text-indigo-300 block mb-1.5">
                  Automated ATS Parser Checklist
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                  {healthResult.atsReadabilityFeedback.criticalAtsRules.map((rule, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{rule}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Dedicated Strengths & Problems Side-by-Side Panels */}
          {healthResult && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              
              {/* Strengths Card */}
              <div className="p-4 rounded-2xl bg-[#09152b]/90 border border-emerald-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                      Validated Strengths
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {(healthResult.strengths || []).length} Detected
                  </span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  {(healthResult.strengths || [
                    'Quantified impact in professional experience bullets',
                    'Single-column layout ensures clean ATS parsability',
                    'Clear technical competency stack matches role targets'
                  ]).map((str, i) => (
                    <li key={i} className="flex items-start gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-[11px] text-slate-200 leading-snug">{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Problems Card */}
              <div className="p-4 rounded-2xl bg-[#180e1b]/90 border border-rose-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-rose-300">
                      Identified Problems
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {(healthResult.problems || []).length} to Fix
                  </span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  {(healthResult.problems || [
                    'Unquantified responsibility statements without metrics',
                    'Passive voice phrasing weakens executive ownership',
                    'Missing direct links to verified repositories or live demos'
                  ]).map((prob, i) => (
                    <li key={i} className="flex items-start gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                      <span className="text-[11px] text-slate-200 leading-snug">{prob}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          )}

          {/* Quick Wins Callout Row */}
          {healthResult?.quickWins && healthResult.quickWins.length > 0 && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-blue-950/40 border border-cyan-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                  Immediate 10+ Point Quick Wins
                </span>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                {healthResult.quickWins.map((win, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{win}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>

      </div>

      {/* Specific Suggestions for Improvement Section */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0a1128]/95 border border-cyan-500/30 space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <h3 className="text-xl font-extrabold text-white">
                Specific Suggestions for Improvement
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {filteredSuggestions.length} Available
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Actionable before-and-after bullet rewrites addressing exact industry standard violations.
            </p>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: 'all', label: 'All Fixes' },
              { id: 'critical', label: '🚨 Critical' },
              { id: 'impact', label: 'Impact & Metrics' },
              { id: 'verbs', label: 'Action Verbs' },
              { id: 'ats', label: 'ATS & Layout' },
              { id: 'keywords', label: 'Keywords' },
              { id: 'summary', label: 'Summary' },
              { id: 'brevity', label: 'Brevity' },
              { id: 'completeness', label: 'Completeness' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveFilterCategory(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  activeFilterCategory === tab.id
                    ? 'bg-cyan-500 text-slate-950 font-extrabold'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Suggestions List */}
        {filteredSuggestions.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <div className="text-sm font-bold text-white">No Issues in This Category</div>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Your resume bullets strictly satisfy the {currentStandard.shortName} requirements for this category!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSuggestions.map((sug) => {
              const isApplied = appliedSuggestionIds.has(sug.id);

              return (
                <div
                  key={sug.id}
                  className={`p-5 rounded-2xl border transition-all space-y-4 ${
                    isApplied
                      ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm'
                      : 'bg-slate-900/80 border-slate-800 hover:border-cyan-500/40'
                  }`}
                >
                  {/* Top Bar: Standard Name & Severity */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        sug.severity === 'critical'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : sug.severity === 'recommended'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      }`}>
                        {sug.severity === 'critical' ? 'Critical Fix' : sug.severity === 'recommended' ? 'Recommended' : 'Polish'}
                      </span>

                      <span className="text-xs text-cyan-300 font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                        Standard: {sug.standardName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-emerald-400">
                        {sug.metricImprovement}
                      </span>
                      {isApplied && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Applied
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Recruiter Reasoning */}
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">{sug.title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {sug.reasoning}
                    </p>
                  </div>

                  {/* Interactive Before & After Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    
                    {/* Before (Weak Bullet) */}
                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-rose-500/20 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-rose-400">
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Current Resume / Weak Bullet
                        </span>
                        <span className="text-[10px] text-slate-500">Unquantified / Passive</span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono leading-relaxed bg-slate-900/50 p-2 rounded-lg">
                        "{sug.originalSnippet}"
                      </p>
                    </div>

                    {/* After (Optimized Revision) */}
                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          Industry Standard AI Revision
                        </span>
                        <span className="text-[10px] text-emerald-400/80 font-bold">Google X-Y-Z Ready</span>
                      </div>
                      <p className="text-xs text-emerald-200 font-mono leading-relaxed bg-emerald-950/30 p-2 rounded-lg border border-emerald-500/20">
                        "{sug.suggestedRevision}"
                      </p>
                    </div>

                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => openChatWithPrompt?.(`I want to refine this resume bullet for a ${targetRole} role: "${sug.suggestedRevision}". Can you help me adapt it for specific company interviews?`)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Consult Copilot</span>
                    </button>

                    <button
                      onClick={() => handleCopy(sug.suggestedRevision, sug.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      {copiedKey === sug.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Copy Revised Bullet</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleApplySuggestion(sug)}
                      disabled={isApplied}
                      className={`px-4 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isApplied
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                          : 'bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 shadow-md shadow-cyan-500/20'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isApplied ? 'Applied to Draft' : 'Apply Fix to Resume'}</span>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Diagnostics Checklist & Recruiter 6-Second Audit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Diagnostics Checklist */}
        <div className="p-6 rounded-3xl bg-[#091024] border border-cyan-500/20 space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-extrabold text-white">
              Industry Standard Verification Checklist
            </h3>
          </div>

          <div className="space-y-2.5">
            {healthResult?.diagnosticsChecklist.map((item, idx) => (
              <div 
                key={idx}
                className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3"
              >
                {item.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{item.item}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({item.standard})</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    {item.note}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recruiter 6-Second Scan Audit */}
        <div className="p-6 rounded-3xl bg-[#091024] border border-cyan-500/20 space-y-4 flex flex-col justify-between">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-extrabold text-white">
                  Recruiter 6-Second Scan Audit
                </h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                Eye-Tracking Emulation
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 space-y-1">
              <span className="text-[10px] uppercase font-bold text-cyan-300">
                First Impression Verdict
              </span>
              <p className="text-xs text-slate-200 leading-relaxed">
                "{healthResult?.recruiterAudit.sixSecondScanVerdict}"
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] uppercase font-bold text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Identified Strengths
              </span>
              <ul className="space-y-1 text-xs text-slate-300 pl-4 list-disc">
                {healthResult?.recruiterAudit.topStrengths.map((str, i) => (
                  <li key={i}>{str}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] uppercase font-bold text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> High-Priority Attention Areas
              </span>
              <ul className="space-y-1 text-xs text-slate-300 pl-4 list-disc">
                {healthResult?.recruiterAudit.criticalRisks.map((risk, i) => (
                  <li key={i}>{risk}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Toggle Live Optimized Draft Preview */}
          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={() => setShowOptimizedPreview(!showOptimizedPreview)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-700"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{showOptimizedPreview ? 'Hide Optimized Resume Text' : 'View Full Optimized Resume Text'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* Full Optimized Resume Text Modal / Accordion */}
      {showOptimizedPreview && (
        <div className="p-6 rounded-3xl bg-[#091024] border border-cyan-500/40 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              <h4 className="text-base font-extrabold text-white">
                Active Resume Draft with Applied Optimizations
              </h4>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(activeResumeText, 'optimized-full-text')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer"
              >
                {copiedKey === 'optimized-full-text' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Copy Full Draft</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  const blob = new Blob([activeResumeText], { type: 'text/plain;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `${uploadedFileName.replace(/\.[^/.]+$/, '')}_Optimized.txt`;
                  link.click();
                  URL.revokeObjectURL(url);
                  showToast?.({ title: 'Export Complete', message: 'Downloaded optimized resume file', type: 'success' });
                }}
                className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export (.txt)</span>
              </button>
            </div>
          </div>

          <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 max-h-96 overflow-y-auto whitespace-pre-wrap leading-relaxed">
            {activeResumeText}
          </pre>
        </div>
      )}

    </div>
  );
};
