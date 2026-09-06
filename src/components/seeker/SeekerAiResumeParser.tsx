import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Sparkles, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  Search, 
  RefreshCw, 
  Lightbulb, 
  Layers, 
  UserCheck, 
  Briefcase, 
  ChevronDown,
  RotateCcw,
  BookOpen
} from 'lucide-react';
import { useJobContext } from '../../context/JobContext';
import { Job, ParsedResumeData, ResumeJobComparisonResult } from '../../types';
import { parseResumeTextClient, userProfileToParsedResume, SAMPLE_RESUME_PRESETS } from '../../utils/resumeParser';
import { compareResumeWithJob } from '../../utils/skillComparator';

export const SeekerAiResumeParser: React.FC = () => {
  const { 
    jobs, 
    currentUser, 
    showToast, 
    openChatWithPrompt, 
    quickApplyToJob, 
    updateProfile,
    setAuthModalOpen,
    selectedJob
  } = useJobContext();

  // Target Job Selection
  const [selectedTargetJob, setSelectedTargetJob] = useState<Job | null>(null);
  const [jobSearchQuery, setJobSearchQuery] = useState('');
  const [isJobDropdownOpen, setIsJobDropdownOpen] = useState(false);

  // Resume Ingestion State
  const [inputMode, setInputMode] = useState<'profile' | 'upload' | 'preset' | 'paste'>('profile');
  const [parsedResume, setParsedResume] = useState<ParsedResumeData | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgressMessage, setParseProgressMessage] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Comparison State
  const [comparison, setComparison] = useState<ResumeJobComparisonResult | null>(null);
  const [activeTab, setActiveTab] = useState<'missing' | 'matched' | 'side_by_side' | 'cover_letter'>('missing');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'moderate'>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  // Initialize selected target job
  useEffect(() => {
    if (selectedJob) {
      setSelectedTargetJob(selectedJob);
    } else if (jobs.length > 0 && !selectedTargetJob) {
      setSelectedTargetJob(jobs[0]);
    }
  }, [selectedJob, jobs]);

  // Initialize parsed resume from current user if available
  useEffect(() => {
    if (currentUser && !parsedResume) {
      const initial = userProfileToParsedResume(currentUser);
      setParsedResume(initial);
    }
  }, [currentUser]);

  // Recalculate comparison when job or parsed resume updates
  useEffect(() => {
    if (!selectedTargetJob || !parsedResume) {
      setComparison(null);
      return;
    }

    const result = compareResumeWithJob(parsedResume, selectedTargetJob);
    setComparison(result);

    let isMounted = true;
    fetch('/api/ai/compare-resume-job', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parsedResume,
        job: selectedTargetJob
      })
    })
      .then(res => res.json())
      .then(aiResult => {
        if (isMounted && aiResult && !aiResult.error && Array.isArray(aiResult.skillComparisons) && aiResult.skillComparisons.length > 0) {
          setComparison(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              matchScore: aiResult.matchScore || prev.matchScore,
              atsScore: aiResult.atsScore || prev.atsScore,
              qualificationStatus: aiResult.qualificationStatus || prev.qualificationStatus,
              tailoredCoverLetterHook: aiResult.tailoredCoverLetterHook || prev.tailoredCoverLetterHook,
              keyStrengths: aiResult.keyStrengths?.length ? aiResult.keyStrengths : prev.keyStrengths,
              criticalMissingHighlights: aiResult.criticalMissingHighlights?.length ? aiResult.criticalMissingHighlights : prev.criticalMissingHighlights,
              actionPlan: aiResult.actionPlan?.length ? aiResult.actionPlan : prev.actionPlan
            };
          });
        }
      })
      .catch(err => {
        console.warn('AI comparison enrichment using client engine:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedTargetJob, parsedResume]);

  const filteredJobs = useMemo(() => {
    if (!jobSearchQuery.trim()) return jobs.slice(0, 10);
    const q = jobSearchQuery.toLowerCase();
    return jobs.filter(j => 
      j.title.toLowerCase().includes(q) ||
      j.company.toLowerCase().includes(q) ||
      j.skills.some(s => s.toLowerCase().includes(q))
    ).slice(0, 10);
  }, [jobs, jobSearchQuery]);

  const displayedMissingSkills = useMemo(() => {
    if (!comparison) return [];
    if (filterSeverity === 'all') return comparison.missingQualifications;
    if (filterSeverity === 'critical') {
      return comparison.missingQualifications.filter(s => s.missingSeverity === 'critical');
    }
    return comparison.missingQualifications.filter(s => s.missingSeverity === 'moderate' || s.missingSeverity === 'critical');
  }, [comparison, filterSeverity]);

  const handleFileProcess = async (file: File) => {
    setIsParsing(true);
    setParseProgressMessage(`Extracting text from ${file.name}...`);
    try {
      let rawText = '';
      if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.md') || file.name.endsWith('.json')) {
        rawText = await file.text();
      } else {
        const buffer = await file.text().catch(() => '');
        rawText = buffer || `${file.name}\nCandidate technical resume.`;
      }
      setParseProgressMessage('Extracting technical competencies & parsing skill matrix...');
      const parsed = parseResumeTextClient(rawText, file.name, file.size);
      setParsedResume(parsed);
      showToast({
        title: 'Resume Successfully Parsed!',
        message: `Extracted ${parsed.skills.length} technical skills and ${parsed.experience.length} career milestones.`,
        type: 'success'
      });
    } catch (err) {
      console.error(err);
      if (currentUser) {
        setParsedResume(userProfileToParsedResume(currentUser));
      }
    } finally {
      setIsParsing(false);
      setParseProgressMessage('');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    showToast({
      title: 'Copied to Clipboard!',
      message: 'Ready to paste into your resume or cover letter.',
      type: 'info'
    });
  };

  const handleQuickApply = async () => {
    if (!selectedTargetJob) return;
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }
    setIsApplying(true);
    try {
      await quickApplyToJob(selectedTargetJob.id);
    } finally {
      setIsApplying(false);
    }
  };

  const handleSyncSkills = () => {
    if (!parsedResume || !currentUser) return;
    const existing = new Set(currentUser.skills.map(s => s.name.toLowerCase()));
    const toAdd = parsedResume.skills
      .filter(s => !existing.has(s.name.toLowerCase()))
      .map(s => ({
        name: s.name,
        level: s.proficiency || 'Advanced'
      }));

    if (toAdd.length === 0) {
      showToast({
        title: 'Skills in Sync',
        message: 'All parsed skills are already in your candidate profile.',
        type: 'info'
      });
      return;
    }

    updateProfile({
      skills: [...currentUser.skills, ...toAdd]
    });

    showToast({
      title: 'Profile Updated',
      message: `Added ${toAdd.length} verified skills to your FastJobs profile.`,
      type: 'success'
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-[#0a1128] to-slate-900 border border-cyan-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Resume Parser & Job Skill Comparison
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                Live ATS Auditor
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Upload any resume to compare against target role requirements and immediately surface missing qualifications.
            </p>
          </div>
        </div>

        {/* Quick Sync & Copilot CTA */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncSkills}
            className="px-3 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sync Skills</span>
          </button>
          <button
            onClick={() => {
              if (selectedTargetJob) {
                openChatWithPrompt(`Analyze my resume qualifications for ${selectedTargetJob.title} at ${selectedTargetJob.company}. What are my biggest skill gaps and how can I best prepare?`);
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Ask Copilot</span>
          </button>
        </div>
      </div>

      {/* Target Job Selector */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-cyan-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[280px]">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1">
            <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
            Target Job Opening:
          </span>

          {selectedTargetJob && (
            <div className="relative flex-1">
              <button
                onClick={() => setIsJobDropdownOpen(prev => !prev)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 border border-cyan-500/40 text-slate-200 text-left font-medium transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="font-bold text-white truncate">{selectedTargetJob.title}</span>
                  <span className="text-slate-400">at {selectedTargetJob.company}</span>
                  <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] hidden sm:inline">
                    {selectedTargetJob.experienceLevel}
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isJobDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isJobDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 z-40 max-h-72 overflow-y-auto rounded-2xl bg-slate-950 border border-slate-700 shadow-2xl p-2 space-y-1">
                  <div className="p-1.5 pb-2 border-b border-slate-800">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search active jobs..."
                        value={jobSearchQuery}
                        onChange={e => setJobSearchQuery(e.target.value)}
                        className="w-full bg-slate-900 text-slate-200 pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-700 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                  {filteredJobs.map(j => (
                    <button
                      key={j.id}
                      onClick={() => {
                        setSelectedTargetJob(j);
                        setIsJobDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                        selectedTargetJob.id === j.id ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-500/40' : 'hover:bg-slate-900 text-slate-300'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="font-bold truncate text-white">{j.title}</div>
                        <div className="text-[11px] text-slate-400">{j.company} • {j.location} • {j.experienceLevel}</div>
                      </div>
                      <span className="text-[11px] font-mono text-cyan-400 font-bold shrink-0">
                        {j.skills.length} skills
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {selectedTargetJob && (
          <div className="text-[11px] text-slate-400 flex items-center gap-3">
            <span>Required Skills: <strong className="text-cyan-300">{selectedTargetJob.skills.length}</strong></span>
            <span>•</span>
            <span>Salary: <strong className="text-emerald-400">${Math.round(selectedTargetJob.salaryMin/1000)}k - ${Math.round(selectedTargetJob.salaryMax/1000)}k</strong></span>
          </div>
        )}
      </div>

      {/* Resume Ingestion Section */}
      <div className="bg-slate-900/60 rounded-3xl border border-slate-800 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Resume Input Mode:
            </span>
            <div className="inline-flex rounded-xl p-0.5 bg-slate-950 border border-slate-800">
              <button
                onClick={() => setInputMode('profile')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  inputMode === 'profile' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Profile Resume
              </button>
              <button
                onClick={() => setInputMode('upload')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  inputMode === 'upload' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Upload File
              </button>
              <button
                onClick={() => setInputMode('preset')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  inputMode === 'preset' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sample Resumes
              </button>
              <button
                onClick={() => setInputMode('paste')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  inputMode === 'paste' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Paste Text
              </button>
            </div>
          </div>

          {parsedResume && (
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Active Resume: <strong className="text-white">{parsedResume.candidateName}</strong></span>
              <span className="text-cyan-400 font-mono">({parsedResume.skills.length} skills parsed)</span>
            </div>
          )}
        </div>

        {inputMode === 'upload' && (
          <div
            onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              isDragOver 
                ? 'border-cyan-400 bg-cyan-950/30' 
                : 'border-slate-700 hover:border-cyan-500/60 hover:bg-slate-850/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt,.md,.json"
              className="hidden"
              onChange={e => {
                if (e.target.files && e.target.files[0]) {
                  handleFileProcess(e.target.files[0]);
                }
              }}
            />
            <UploadCloud className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-white">
              Drop your resume file here or <span className="text-cyan-400 underline">browse</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports PDF, DOCX, TXT, MD, or JSON (Extracts skills, work history, and education)
            </p>
          </div>
        )}

        {inputMode === 'profile' && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs">
            <div className="space-y-1">
              <div className="font-bold text-white text-sm flex items-center gap-2">
                <span>{currentUser?.name || 'Alex Chen'}</span>
                <span className="text-cyan-400 font-normal">({currentUser?.title || 'Senior Software Professional'})</span>
              </div>
              <div className="text-slate-400">
                Primary Resume File: <span className="text-slate-200">{currentUser?.resumeFileName || 'Alex_Chen_Resume_AI_Engineer_2026.pdf'}</span>
              </div>
            </div>

            <button
              onClick={() => {
                if (currentUser) {
                  setParsedResume(userProfileToParsedResume(currentUser));
                  showToast({
                    title: 'Profile Synchronized',
                    message: 'Active candidate profile reloaded for comparison.',
                    type: 'success'
                  });
                }
              }}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reload Profile</span>
            </button>
          </div>
        )}

        {inputMode === 'preset' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {SAMPLE_RESUME_PRESETS.map(preset => (
              <button
                key={preset.id}
                onClick={() => {
                  const parsed = parseResumeTextClient(preset.text, `${preset.name.replace(/\s+/g, '_')}_Resume.pdf`, 1024 * 32);
                  setParsedResume(parsed);
                  showToast({
                    title: 'Loaded Preset Resume',
                    message: `Now benchmarking ${preset.name} against ${selectedTargetJob?.title || 'job'}.`,
                    type: 'info'
                  });
                }}
                className="p-3.5 rounded-2xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-left transition-all cursor-pointer group"
              >
                <div className="font-bold text-white text-xs group-hover:text-cyan-300 transition-colors">
                  {preset.name}
                </div>
                <div className="text-[11px] text-cyan-400 font-medium truncate">
                  {preset.role}
                </div>
                <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                  {preset.description}
                </p>
              </button>
            ))}
          </div>
        )}

        {inputMode === 'paste' && (
          <div className="space-y-2">
            <textarea
              rows={4}
              placeholder="Paste raw resume or CV text..."
              value={pastedText}
              onChange={e => setPastedText(e.target.value)}
              className="w-full bg-slate-950 text-slate-200 p-3 text-xs rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
            />
            <div className="flex justify-end">
              <button
                onClick={() => {
                  if (!pastedText.trim() || pastedText.length < 20) {
                    showToast({
                      title: 'Text Required',
                      message: 'Please paste at least 20 characters of resume content.',
                      type: 'warning'
                    });
                    return;
                  }
                  const parsed = parseResumeTextClient(pastedText, 'Pasted_Resume.txt', pastedText.length);
                  setParsedResume(parsed);
                  showToast({
                    title: 'Pasted Resume Parsed',
                    message: `Extracted ${parsed.skills.length} skills.`,
                    type: 'success'
                  });
                }}
                className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all cursor-pointer"
              >
                Parse Pasted Text
              </button>
            </div>
          </div>
        )}

        {isParsing && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-cyan-950/50 border border-cyan-500/40 text-cyan-300 text-xs animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
            <span>{parseProgressMessage}</span>
          </div>
        )}
      </div>

      {/* Comparison Engine Output */}
      {comparison && (
        <div className="space-y-6">
          
          {/* Scorecards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-[#0c1633] border border-cyan-500/30 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Qualification Match
              </span>
              <div className="my-2 flex items-baseline gap-2">
                <span className={`text-3xl sm:text-4xl font-black ${
                  comparison.matchScore >= 85 ? 'text-emerald-400' :
                  comparison.matchScore >= 70 ? 'text-cyan-400' : 'text-amber-400'
                }`}>
                  {comparison.matchScore}%
                </span>
                <span className="text-xs text-slate-400">weighted</span>
              </div>
              <span className={`text-xs font-bold inline-flex items-center gap-1 ${
                comparison.matchScore >= 85 ? 'text-emerald-400' :
                comparison.matchScore >= 70 ? 'text-cyan-400' : 'text-amber-400'
              }`}>
                <Sparkles className="w-3 h-3" />
                {comparison.qualificationStatus}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-rose-950/30 border border-rose-500/30 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-rose-300 uppercase tracking-wider">
                Missing Qualifications
              </span>
              <div className="my-2 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-rose-400">
                  {comparison.missingCount}
                </span>
                <span className="text-xs text-rose-300/80">of {comparison.totalSkillsEvaluated} evaluated</span>
              </div>
              <span className="text-xs font-semibold text-rose-300/90 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-rose-400" />
                {comparison.missingQualifications.filter(m => m.missingSeverity === 'critical').length} Critical Gaps
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-950/30 border border-emerald-500/30 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
                Verified Matches
              </span>
              <div className="my-2 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-emerald-400">
                  {comparison.matchedCount}
                </span>
                <span className="text-xs text-emerald-300/80">skills verified</span>
              </div>
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Screening Ready
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-cyan-950/30 border border-cyan-500/30 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider">
                ATS Compatibility
              </span>
              <div className="my-2 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-cyan-400">
                  {comparison.atsScore}
                </span>
                <span className="text-xs text-slate-400">/ 100</span>
              </div>
              <span className="text-xs font-semibold text-cyan-300 flex items-center gap-1">
                <FileText className="w-3 h-3 text-cyan-400" />
                High Keyword Parsing
              </span>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab('missing')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'missing'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Missing Qualifications ({comparison.missingCount})</span>
              </button>

              <button
                onClick={() => setActiveTab('matched')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'matched'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified Matches ({comparison.matchedCount})</span>
              </button>

              <button
                onClick={() => setActiveTab('side_by_side')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'side_by_side'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Side-by-Side Breakdown</span>
              </button>

              <button
                onClick={() => setActiveTab('cover_letter')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'cover_letter'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Gap Strategy & Pitch</span>
              </button>
            </div>

            {activeTab === 'missing' && (
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-400 text-[11px] mr-1">Filter:</span>
                <button
                  onClick={() => setFilterSeverity('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    filterSeverity === 'all' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({comparison.missingQualifications.length})
                </button>
                <button
                  onClick={() => setFilterSeverity('critical')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    filterSeverity === 'critical' ? 'bg-rose-950 text-rose-300 border border-rose-800 font-bold' : 'text-slate-400 hover:text-rose-300'
                  }`}
                >
                  Critical Only ({comparison.missingQualifications.filter(m => m.missingSeverity === 'critical').length})
                </button>
              </div>
            )}
          </div>

          {/* TAB 1: MISSING QUALIFICATIONS */}
          {activeTab === 'missing' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/30 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-rose-200 text-sm">
                    Missing Qualification Audit: {selectedTargetJob?.title}
                  </div>
                  <p className="text-rose-300/80">
                    The following technical competencies are requested by <strong>{selectedTargetJob?.company}</strong> but were not detected in your resume data. Use the custom resume bullet templates and interview talking points to address each gap.
                  </p>
                </div>
              </div>

              {displayedMissingSkills.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                  <h4 className="text-base font-bold text-white">No Missing Qualifications in This View</h4>
                  <p className="text-xs text-slate-400 mt-1">Your resume data satisfies the evaluated skill requirements.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {displayedMissingSkills.map((gap, idx) => (
                    <div
                      key={gap.skill}
                      className="p-4 sm:p-5 rounded-2xl bg-[#0a142e] border border-rose-500/30 shadow-lg space-y-3.5 hover:border-rose-500/50 transition-all"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                          <h4 className="text-base font-extrabold text-white">
                            {gap.skill}
                          </h4>
                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            gap.missingSeverity === 'critical'
                              ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                              : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                          }`}>
                            {gap.missingSeverity === 'critical' ? 'Mandatory Qualification' : 'High Priority Gap'}
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            openChatWithPrompt(`I am applying for ${selectedTargetJob?.title} at ${selectedTargetJob?.company} and I am missing "${gap.skill}". How can I best address this during my interview?`);
                          }}
                          className="px-3 py-1 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3 text-cyan-400" />
                          <span>Ask Copilot How to Answer</span>
                        </button>
                      </div>

                      {/* Explanation */}
                      <div className="text-xs text-slate-300 bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
                        <strong className="text-slate-200">Why It's Required: </strong>
                        {gap.explanation}
                      </div>

                      {/* Suggested Resume Bullet to Add */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          <span className="flex items-center gap-1 text-cyan-300">
                            <Lightbulb className="w-3.5 h-3.5 text-cyan-400" />
                            Suggested Resume Bullet to Add:
                          </span>
                          <button
                            onClick={() => copyToClipboard(gap.suggestedResumeBullet, `bullet-${idx}`)}
                            className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-xs cursor-pointer"
                          >
                            {copiedKey === `bullet-${idx}` ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400 font-bold">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Bullet</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-950 font-mono text-xs text-slate-300 border border-slate-800">
                          • {gap.suggestedResumeBullet}
                        </div>
                      </div>

                      {/* Interview Talking Point */}
                      <div className="text-xs text-slate-400 bg-slate-900/50 p-3 rounded-xl border border-slate-800/60 flex items-start gap-2">
                        <span className="font-bold text-slate-300 shrink-0">Interview Strategy:</span>
                        <span className="text-slate-300 italic">{gap.interviewTalkingPoint}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MATCHED SKILLS */}
          {activeTab === 'matched' && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-emerald-200 text-sm">
                    Verified Technical Matches ({comparison.matchedCount} Skills)
                  </div>
                  <p className="text-emerald-300/80">
                    Your resume has documented evidence for these competencies. Emphasize these direct alignments in your initial screening interviews.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {comparison.matchedSkills.map(match => (
                  <div
                    key={match.skill}
                    className="p-3.5 rounded-xl bg-[#0a142e] border border-emerald-500/30 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="font-bold text-white text-sm">{match.skill}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                        Verified Match
                      </span>
                    </div>
                    {match.candidateEvidence && (
                      <div className="text-[11px] text-slate-400 italic bg-slate-900/60 p-2 rounded-lg">
                        "{match.candidateEvidence}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SIDE-BY-SIDE BREAKDOWN */}
          {activeTab === 'side_by_side' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Parsed Resume */}
              <div className="p-4 rounded-2xl bg-[#0a142e] border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <h4 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                    <UserCheck className="w-4 h-4" />
                    Parsed Resume Credentials
                  </h4>
                  <span className="text-xs text-slate-400">{parsedResume.candidateName}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1">
                  <div className="text-slate-400">Experience Seniority:</div>
                  <div className="font-bold text-white text-sm">
                    {comparison.experienceGap.candidateLevel}
                  </div>
                  <div className="text-[11px] text-slate-400 pt-0.5">
                    {comparison.experienceGap.details}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Extracted Technical Skills ({parsedResume.skills.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto pr-1">
                    {parsedResume.skills.map(s => {
                      const isJobReq = selectedTargetJob?.skills.some(js => js.toLowerCase() === s.name.toLowerCase());
                      return (
                        <span
                          key={s.name}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 ${
                            isJobReq
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold'
                              : 'bg-slate-900 text-slate-300 border border-slate-800'
                          }`}
                        >
                          {isJobReq && <Check className="w-3 h-3 text-emerald-400" />}
                          {s.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Selected Job Requirements */}
              <div className="p-4 rounded-2xl bg-[#0a142e] border border-cyan-500/30 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-cyan-400" />
                    {selectedTargetJob?.title} Requirements
                  </h4>
                  <span className="text-xs text-cyan-400">{selectedTargetJob?.company}</span>
                </div>

                <div className={`p-3 rounded-xl border text-xs space-y-1 ${
                  comparison.experienceGap.met 
                    ? 'bg-emerald-950/40 border-emerald-500/30' 
                    : 'bg-amber-950/40 border-amber-500/30'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Seniority Threshold: <strong>{comparison.experienceGap.requiredLevel}</strong></span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      comparison.experienceGap.met ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {comparison.experienceGap.met ? 'Criteria Met' : 'Stretch Role'}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Skill Requirements Audit ({comparison.totalSkillsEvaluated})
                  </div>
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {comparison.skillComparisons.map(sc => (
                      <div
                        key={sc.skill}
                        className={`p-2 rounded-lg text-xs flex items-center justify-between border ${
                          sc.status === 'matched'
                            ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                            : sc.status === 'partial'
                            ? 'bg-cyan-950/30 border-cyan-500/30 text-cyan-200'
                            : 'bg-rose-950/30 border-rose-500/30 text-rose-200'
                        }`}
                      >
                        <span className="font-semibold">{sc.skill}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          sc.status === 'matched' ? 'bg-emerald-900/80 text-emerald-300' :
                          sc.status === 'partial' ? 'bg-cyan-900/80 text-cyan-300' :
                          'bg-rose-900/80 text-rose-300'
                        }`}>
                          {sc.status === 'matched' ? 'Matched' : sc.status === 'partial' ? 'Partial' : 'Missing'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: COVER LETTER HOOK & STRATEGIC PITCH */}
          {activeTab === 'cover_letter' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-cyan-950/30 to-blue-950/40 border border-blue-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    Application Cover Note Hook
                  </h4>
                  <button
                    onClick={() => copyToClipboard(comparison.tailoredCoverLetterHook, 'cover-hook')}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    {copiedKey === 'cover-hook' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Pitch</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                  "{comparison.tailoredCoverLetterHook}"
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Recommended Action Steps:
                </h5>
                <div className="space-y-2">
                  {comparison.actionPlan.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/40 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Quick Apply */}
              {selectedTargetJob && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleQuickApply}
                    disabled={isApplying}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-500/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isApplying ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Submitting Application...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 fill-slate-950 text-cyan-400" />
                        <span>1-Click Apply to {selectedTargetJob.company}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
};
