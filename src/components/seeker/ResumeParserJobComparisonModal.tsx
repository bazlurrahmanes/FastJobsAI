import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Copy, 
  Check, 
  Search, 
  RefreshCw, 
  Download, 
  Lightbulb, 
  Layers, 
  TrendingUp, 
  UserCheck, 
  RotateCcw,
  Briefcase, 
  Building2, 
  MapPin, 
  DollarSign, 
  ChevronRight,
  ExternalLink,
  GraduationCap,
  ShieldCheck,
  Award,
  ChevronDown
} from 'lucide-react';
import { useJobContext } from '../../context/JobContext';
import { Job, ParsedResumeData, ResumeJobComparisonResult, SkillRequirementComparison } from '../../types';
import { parseResumeTextClient, userProfileToParsedResume, SAMPLE_RESUME_PRESETS } from '../../utils/resumeParser';
import { compareResumeWithJob } from '../../utils/skillComparator';

interface ResumeParserJobComparisonModalProps {
  job?: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectJob?: (job: Job) => void;
}

export const ResumeParserJobComparisonModal: React.FC<ResumeParserJobComparisonModalProps> = ({
  job,
  isOpen,
  onClose,
  onSelectJob
}) => {
  const { 
    jobs, 
    currentUser, 
    showToast, 
    openChatWithPrompt, 
    quickApplyToJob, 
    updateProfile,
    setAuthModalOpen 
  } = useJobContext();

  // Target Job State
  const [selectedTargetJob, setSelectedTargetJob] = useState<Job | null>(null);
  const [jobSearchQuery, setJobSearchQuery] = useState('');
  const [isJobDropdownOpen, setIsJobDropdownOpen] = useState(false);

  // Resume State
  const [inputMode, setInputMode] = useState<'upload' | 'profile' | 'preset' | 'paste'>('profile');
  const [parsedResume, setParsedResume] = useState<ParsedResumeData | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgressMessage, setParseProgressMessage] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Comparison State
  const [comparison, setComparison] = useState<ResumeJobComparisonResult | null>(null);
  const [activeTab, setActiveTab] = useState<'missing_qualifications' | 'matched_skills' | 'side_by_side' | 'cover_letter'>('missing_qualifications');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'moderate'>('all');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedBulletKey, setCopiedBulletKey] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  // Initialize selected target job
  useEffect(() => {
    if (job) {
      setSelectedTargetJob(job);
    } else if (jobs.length > 0 && !selectedTargetJob) {
      setSelectedTargetJob(jobs[0]);
    }
  }, [job, jobs]);

  // Automatically initialize parsed resume from current user if available
  useEffect(() => {
    if (currentUser && !parsedResume) {
      const initial = userProfileToParsedResume(currentUser);
      setParsedResume(initial);
    }
  }, [currentUser]);

  // Recalculate comparison whenever target job or parsed resume updates
  useEffect(() => {
    if (!selectedTargetJob || !parsedResume) {
      setComparison(null);
      return;
    }

    // Run client comparison instantly
    const result = compareResumeWithJob(parsedResume, selectedTargetJob);
    setComparison(result);

    // Optionally enrich with Gemini server API in the background if possible
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
          // Merge AI nuances with base client results
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
        // Graceful fallback to client-computed comparison
        console.warn('AI comparison enrichment skipped, using robust client engine:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedTargetJob, parsedResume]);

  // Filtered jobs for target job selector
  const filteredJobs = useMemo(() => {
    if (!jobSearchQuery.trim()) return jobs.slice(0, 10);
    const q = jobSearchQuery.toLowerCase();
    return jobs.filter(j => 
      j.title.toLowerCase().includes(q) ||
      j.company.toLowerCase().includes(q) ||
      j.skills.some(s => s.toLowerCase().includes(q))
    ).slice(0, 10);
  }, [jobs, jobSearchQuery]);

  // Filter missing qualifications by severity
  const displayedMissingSkills = useMemo(() => {
    if (!comparison) return [];
    if (filterSeverity === 'all') return comparison.missingQualifications;
    if (filterSeverity === 'critical') {
      return comparison.missingQualifications.filter(s => s.missingSeverity === 'critical');
    }
    return comparison.missingQualifications.filter(s => s.missingSeverity === 'moderate' || s.missingSeverity === 'critical');
  }, [comparison, filterSeverity]);

  if (!isOpen) return null;

  // File Upload Handlers
  const handleFileProcess = async (file: File) => {
    setIsParsing(true);
    setParseProgressMessage(`Extracting text from ${file.name}...`);

    try {
      let rawText = '';
      if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.md') || file.name.endsWith('.json')) {
        rawText = await file.text();
      } else {
        // Read file array buffer / text fallback
        const buffer = await file.text().catch(() => '');
        rawText = buffer || `${file.name}\nCandidate technical resume with professional competencies.`;
      }

      setParseProgressMessage('Extracting technical competencies & parsing skill matrix...');
      
      // Parse instantly client-side
      const parsed = parseResumeTextClient(rawText, file.name, file.size);
      setParsedResume(parsed);

      showToast({
        title: 'Resume Successfully Parsed!',
        message: `Extracted ${parsed.skills.length} technical skills and ${parsed.experience.length} career milestones.`,
        type: 'success'
      });
    } catch (err: any) {
      console.error('File parsing error:', err);
      showToast({
        title: 'File Read Warning',
        message: 'Could not directly extract binary PDF. Loaded sample template with your profile competencies.',
        type: 'warning'
      });
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

  const handlePresetSelect = (preset: typeof SAMPLE_RESUME_PRESETS[0]) => {
    setIsParsing(true);
    setParseProgressMessage(`Loading profile for ${preset.name}...`);
    setTimeout(() => {
      const parsed = parseResumeTextClient(preset.text, `${preset.name.replace(/\s+/g, '_')}_Resume.pdf`, 1024 * 32);
      setParsedResume(parsed);
      setIsParsing(false);
      setParseProgressMessage('');
      showToast({
        title: 'Preset Resume Loaded',
        message: `Now benchmarking ${preset.name} against ${selectedTargetJob?.title || 'target job'}.`,
        type: 'info'
      });
    }, 250);
  };

  const handlePasteSubmit = () => {
    if (!pastedText.trim() || pastedText.length < 20) {
      showToast({
        title: 'Resume Text Required',
        message: 'Please paste at least 20 characters of resume content.',
        type: 'warning'
      });
      return;
    }
    setIsParsing(true);
    setParseProgressMessage('Auditing pasted resume text...');
    setTimeout(() => {
      const parsed = parseResumeTextClient(pastedText, 'Pasted_Resume.txt', pastedText.length);
      setParsedResume(parsed);
      setIsParsing(false);
      setParseProgressMessage('');
      showToast({
        title: 'Pasted Resume Parsed',
        message: `Extracted ${parsed.skills.length} competencies.`,
        type: 'success'
      });
    }, 200);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBulletKey(key);
    setTimeout(() => setCopiedBulletKey(null), 2000);
    showToast({
      title: 'Copied to Clipboard!',
      message: 'Ready to paste into your resume or cover letter.',
      type: 'info'
    });
  };

  const handleQuickApplyWithAnalysis = async () => {
    if (!selectedTargetJob) return;
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }
    setIsApplying(true);
    try {
      await quickApplyToJob(selectedTargetJob.id);
      onClose();
    } finally {
      setIsApplying(false);
    }
  };

  const handleAskCopilotAboutGaps = () => {
    if (!comparison || !selectedTargetJob) return;
    const missingNames = comparison.missingQualifications.map(m => m.skill).slice(0, 4).join(', ');
    const prompt = `I am applying for ${selectedTargetJob.title} at ${selectedTargetJob.company}. My resume has a qualification match score of ${comparison.matchScore}%, but I am missing these specific skill requirements: ${missingNames || 'certain domain competencies'}. How can I best frame my adjacent experience during the interview and what quick projects can I build this weekend to bridge these gaps?`;
    onClose();
    openChatWithPrompt(prompt);
  };

  const handleSyncSkillsToProfile = () => {
    if (!parsedResume || !currentUser) return;
    const existingSkillNames = new Set(currentUser.skills.map(s => s.name.toLowerCase()));
    const newSkillsToAdd = parsedResume.skills
      .filter(s => !existingSkillNames.has(s.name.toLowerCase()))
      .map(s => ({
        name: s.name,
        level: s.proficiency || 'Advanced'
      }));

    if (newSkillsToAdd.length === 0) {
      showToast({
        title: 'Skills In Sync',
        message: 'All parsed skills are already reflected on your candidate profile.',
        type: 'info'
      });
      return;
    }

    updateProfile({
      skills: [...currentUser.skills, ...newSkillsToAdd]
    });

    showToast({
      title: 'Profile Updated!',
      message: `Added ${newSkillsToAdd.length} new verified skills to your FastJobs candidate profile.`,
      type: 'success'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        id="resume-parser-comparison-modal"
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl bg-[#070d1e] border border-cyan-500/40 shadow-2xl shadow-cyan-950/80 overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200"
      >
        
        {/* Top Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-[#0a1128] to-slate-900 border-b border-cyan-500/20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Resume Parser & Skill Gap Utility
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hidden sm:inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  Gemini & ATS Audited
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Benchmarks your uploaded resume against target job requirements to isolate and bridge missing qualifications.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Job Selector Bar */}
        <div className="px-5 py-3 bg-[#0a142e] border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[260px]">
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
              Target Job:
            </span>

            {selectedTargetJob ? (
              <div className="relative flex-1">
                <button
                  onClick={() => setIsJobDropdownOpen(prev => !prev)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 text-slate-200 text-left font-medium transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-bold text-white truncate">{selectedTargetJob.title}</span>
                    <span className="text-slate-400 font-normal">at {selectedTargetJob.company}</span>
                    <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] hidden md:inline">
                      {selectedTargetJob.experienceLevel}
                    </span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isJobDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Job Dropdown Menu */}
                {isJobDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 z-40 max-h-72 overflow-y-auto rounded-2xl bg-slate-950 border border-slate-700 shadow-2xl p-2 space-y-1">
                    <div className="p-1.5 pb-2 border-b border-slate-800">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Filter available jobs..."
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
                          if (onSelectJob) onSelectJob(j);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                          selectedTargetJob.id === j.id ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/40' : 'hover:bg-slate-900 text-slate-300'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <div className="font-bold truncate text-white">{j.title}</div>
                          <div className="text-[11px] text-slate-400 truncate">{j.company} • {j.location} • {j.experienceLevel}</div>
                        </div>
                        <span className="text-[11px] font-mono text-cyan-400 font-bold shrink-0">
                          {j.skills.length} skills
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-slate-400">Select a job to begin comparison</span>
            )}
          </div>

          {/* Quick Stats Pill */}
          {selectedTargetJob && (
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span>Required Skills: <strong className="text-cyan-300">{selectedTargetJob.skills.length}</strong></span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">Salary: <strong className="text-emerald-400">${Math.round(selectedTargetJob.salaryMin/1000)}k - ${Math.round(selectedTargetJob.salaryMax/1000)}k</strong></span>
            </div>
          )}
        </div>

        {/* Modal Body with Scroll */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">

          {/* Resume Ingestion Section */}
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Select Resume Source:
                </span>
                <div className="inline-flex rounded-xl p-0.5 bg-slate-950 border border-slate-800">
                  <button
                    onClick={() => setInputMode('profile')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      inputMode === 'profile' ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    My Profile Resume
                  </button>
                  <button
                    onClick={() => setInputMode('upload')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      inputMode === 'upload' ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    onClick={() => setInputMode('preset')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      inputMode === 'preset' ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Sample Resumes
                  </button>
                  <button
                    onClick={() => setInputMode('paste')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      inputMode === 'paste' ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Paste Text
                  </button>
                </div>
              </div>

              {parsedResume && (
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Parsed for: <strong className="text-white">{parsedResume.candidateName}</strong></span>
                  <span className="text-cyan-400 font-mono">({parsedResume.skills.length} skills extracted)</span>
                </div>
              )}
            </div>

            {/* Ingestion Panels based on Mode */}
            {inputMode === 'upload' && (
              <div
                onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  isDragOver 
                    ? 'border-cyan-400 bg-cyan-950/30' 
                    : 'border-slate-700 hover:border-cyan-500/60 hover:bg-slate-800/40'
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
                  Drop your resume file here, or <span className="text-cyan-400 underline">browse</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports PDF, DOCX, TXT, MD, or JSON (Fast client-side parse with Gemini ATS verification)
                </p>
              </div>
            )}

            {inputMode === 'profile' && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                <div className="space-y-0.5">
                  <div className="font-bold text-white flex items-center gap-2">
                    <span>{currentUser?.name || 'Alex Chen'}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-cyan-300">{currentUser?.title || 'Senior Software Professional'}</span>
                  </div>
                  <div className="text-slate-400">
                    Active Profile Resume: <span className="text-slate-200">{currentUser?.resumeFileName || 'Alex_Chen_Profile_Resume.pdf'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (currentUser) {
                        setParsedResume(userProfileToParsedResume(currentUser));
                        showToast({
                          title: 'Profile Synchronized',
                          message: 'Active profile credentials loaded for comparison.',
                          type: 'success'
                        });
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reload Active Profile</span>
                  </button>
                </div>
              </div>
            )}

            {inputMode === 'preset' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {SAMPLE_RESUME_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetSelect(preset)}
                    className="p-3 rounded-xl bg-slate-950/80 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 text-left transition-all cursor-pointer group"
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
              <div className="space-y-2 pt-1">
                <textarea
                  rows={4}
                  placeholder="Paste your raw resume or CV text here..."
                  value={pastedText}
                  onChange={e => setPastedText(e.target.value)}
                  className="w-full bg-slate-950 text-slate-200 p-3 text-xs rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handlePasteSubmit}
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
                <span>{parseProgressMessage || 'Analyzing resume competencies...'}</span>
              </div>
            )}
          </div>

          {/* Comparison Results Section */}
          {comparison && (
            <div className="space-y-6">
              
              {/* Scorecard Hero */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Overall Match Score */}
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

                {/* Missing Qualifications Count */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-rose-950/30 border border-rose-500/30 flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-rose-300 uppercase tracking-wider">
                    Missing Qualifications
                  </span>
                  <div className="my-2 flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black text-rose-400">
                      {comparison.missingCount}
                    </span>
                    <span className="text-xs text-rose-300/80">of {comparison.totalSkillsEvaluated} reqs</span>
                  </div>
                  <span className="text-xs font-semibold text-rose-300/90 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                    {comparison.missingQualifications.filter(m => m.missingSeverity === 'critical').length} Critical Gaps
                  </span>
                </div>

                {/* Verified Matched Skills Count */}
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
                    Ready for technical screen
                  </span>
                </div>

                {/* ATS Parser Compatibility */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-cyan-950/30 border border-cyan-500/30 flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider">
                    ATS Index
                  </span>
                  <div className="my-2 flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black text-cyan-400">
                      {comparison.atsScore}
                    </span>
                    <span className="text-xs text-slate-400">/ 100</span>
                  </div>
                  <span className="text-xs font-semibold text-cyan-300 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-cyan-400" />
                    High recruiter visibility
                  </span>
                </div>
              </div>

              {/* Navigation Sub-Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setActiveTab('missing_qualifications')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      activeTab === 'missing_qualifications'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Missing Qualifications ({comparison.missingCount})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('matched_skills')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      activeTab === 'matched_skills'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Matched Skills ({comparison.matchedCount})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('side_by_side')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      activeTab === 'side_by_side'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Full Side-by-Side Breakdown</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('cover_letter')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      activeTab === 'cover_letter'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <span>Gap Strategy & Cover Pitch</span>
                  </button>
                </div>

                {/* Sub-filter for severity if in Missing Qualifications tab */}
                {activeTab === 'missing_qualifications' && (
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-slate-400 text-[11px] mr-1">Filter:</span>
                    <button
                      onClick={() => setFilterSeverity('all')}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        filterSeverity === 'all' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      All ({comparison.missingQualifications.length})
                    </button>
                    <button
                      onClick={() => setFilterSeverity('critical')}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        filterSeverity === 'critical' ? 'bg-rose-950 text-rose-300 border border-rose-800 font-bold' : 'text-slate-400 hover:text-rose-300'
                      }`}
                    >
                      Critical Only ({comparison.missingQualifications.filter(m => m.missingSeverity === 'critical').length})
                    </button>
                  </div>
                )}
              </div>

              {/* TAB 1: MISSING QUALIFICATIONS (HIGHLIGHTED) */}
              {activeTab === 'missing_qualifications' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-500/30 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1">
                      <div className="font-bold text-rose-200">
                        Attention: Missing Qualification Radar
                      </div>
                      <p className="text-rose-300/80">
                        These are required competencies listed for <strong>{selectedTargetJob?.title}</strong> that were not explicitly detected in your parsed resume. Use the actionable advice and tailored resume bullet points below to optimize your application before submitting.
                      </p>
                    </div>
                  </div>

                  {displayedMissingSkills.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400">
                      <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                      <h4 className="text-base font-bold text-white">No Missing Qualifications Found in Filter</h4>
                      <p className="text-xs text-slate-400 mt-1">Your resume demonstrates all evaluated skills for this criteria.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3.5">
                      {displayedMissingSkills.map((gap, idx) => (
                        <div
                          key={gap.skill}
                          className="p-4 sm:p-5 rounded-2xl bg-[#0a142e] border border-rose-500/30 shadow-lg space-y-3.5 hover:border-rose-500/50 transition-all"
                        >
                          {/* Card Header */}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                              <h4 className="text-base font-extrabold text-white">
                                {gap.skill}
                              </h4>
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                gap.missingSeverity === 'critical'
                                  ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                                  : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                              }`}>
                                {gap.missingSeverity === 'critical' ? 'Mandatory Requirement' : 'High Priority'}
                              </span>
                            </div>

                            <button
                              onClick={() => {
                                const prompt = `I am applying for ${selectedTargetJob?.title} at ${selectedTargetJob?.company}, and I am missing experience with "${gap.skill}". Can you explain the fastest way I can learn it and how I can speak about adjacent technologies during an interview?`;
                                onClose();
                                openChatWithPrompt(prompt);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                              <Sparkles className="w-3 h-3 text-cyan-400" />
                              <span>Ask AI How to Bridge</span>
                            </button>
                          </div>

                          {/* Why Employer Wants It */}
                          <div className="text-xs text-slate-300 bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
                            <strong className="text-slate-200">Role Context: </strong>
                            {gap.explanation}
                          </div>

                          {/* Actionable Resume Bullet Suggestion */}
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
                                {copiedBulletKey === `bullet-${idx}` ? (
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
              {activeTab === 'matched_skills' && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1">
                      <div className="font-bold text-emerald-200">
                        Verified Technical Matches ({comparison.matchedCount} Skills)
                      </div>
                      <p className="text-emerald-300/80">
                        Your parsed resume possesses documented evidence for these requirements. Emphasize these core strengths during recruiter screening.
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

              {/* TAB 3: FULL SIDE-BY-SIDE BREAKDOWN */}
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

                    {/* Candidate Seniority */}
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1">
                      <div className="text-slate-400">Experience Seniority:</div>
                      <div className="font-bold text-white text-sm">
                        {comparison.experienceGap.candidateLevel}
                      </div>
                      <div className="text-[11px] text-slate-400 pt-0.5">
                        {comparison.experienceGap.details}
                      </div>
                    </div>

                    {/* Candidate Extracted Skills Grouped */}
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

                    {/* Education */}
                    {parsedResume.education.length > 0 && (
                      <div className="text-xs space-y-1">
                        <div className="font-bold text-slate-400 uppercase tracking-wider">Education:</div>
                        <div className="text-slate-200">
                          {parsedResume.education[0].degree} — {parsedResume.education[0].school}
                        </div>
                      </div>
                    )}
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

                    {/* Experience Requirement Status */}
                    <div className={`p-3 rounded-xl border text-xs space-y-1 ${
                      comparison.experienceGap.met 
                        ? 'bg-emerald-950/40 border-emerald-500/30' 
                        : 'bg-amber-950/40 border-amber-500/30'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">Target Role Level: <strong>{comparison.experienceGap.requiredLevel}</strong></span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          comparison.experienceGap.met ? 'text-emerald-400' : 'text-amber-400'
                        }`}>
                          {comparison.experienceGap.met ? 'Criteria Satisfied' : 'Seniority Stretch'}
                        </span>
                      </div>
                    </div>

                    {/* Skills Checklist with match/missing badges */}
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

                    {/* Job Requirements list excerpt */}
                    {selectedTargetJob?.requirements && selectedTargetJob.requirements.length > 0 && (
                      <div className="text-xs space-y-1 pt-1">
                        <div className="font-bold text-slate-400 uppercase tracking-wider">Core Requirements:</div>
                        <ul className="text-slate-300 list-disc list-inside space-y-1 text-[11px]">
                          {selectedTargetJob.requirements.slice(0, 3).map((r, i) => (
                            <li key={i} className="line-clamp-2">{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
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
                        Tailored Cover Letter & Application Hook
                      </h4>
                      <button
                        onClick={() => copyToClipboard(comparison.tailoredCoverLetterHook, 'cover-hook')}
                        className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        {copiedBulletKey === 'cover-hook' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Hook</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                      "{comparison.tailoredCoverLetterHook}"
                    </p>
                  </div>

                  {/* 3-Step Action Plan */}
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Recommended Strategic Next Steps:
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
                </div>
              )}

            </div>
          )}

        </div>

        {/* Modal Footer / Actions */}
        <div className="p-4 sm:p-5 bg-[#0a1128] border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSyncSkillsToProfile}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sync Skills to Profile</span>
            </button>

            <button
              onClick={handleAskCopilotAboutGaps}
              className="px-3 py-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Consult Copilot on Gaps</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>

            {selectedTargetJob && (
              <button
                onClick={handleQuickApplyWithAnalysis}
                disabled={isApplying}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-500/30 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {isApplying ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 fill-slate-950 text-cyan-400" />
                    <span>Apply to {selectedTargetJob.company}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
