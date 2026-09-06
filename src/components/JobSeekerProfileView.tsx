import React, { useState, useMemo, useRef } from 'react';
import { 
  User, 
  MapPin, 
  Mail, 
  Phone, 
  Briefcase, 
  GraduationCap, 
  Sparkles, 
  FileText, 
  Plus, 
  X, 
  CheckCircle2, 
  Bookmark, 
  Clock, 
  DollarSign, 
  Building2, 
  ArrowRight, 
  UploadCloud, 
  Zap, 
  ShieldCheck, 
  Edit2,
  Save,
  Check,
  Award,
  Compass,
  Star,
  Mic,
  Send,
  SlidersHorizontal,
  LayoutDashboard,
  FileCheck,
  HeartPulse,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { useJobContext } from '../context/JobContext';
import { SkillItem, ExperienceItem, EducationItem } from '../types';

import { SeekerAiJobMatch } from './seeker/SeekerAiJobMatch';
import { SeekerResumeHealthScore } from './seeker/SeekerResumeHealthScore';
import { SeekerAiResumeAnalyzer } from './seeker/SeekerAiResumeAnalyzer';
import { SeekerAiResumeBuilder } from './seeker/SeekerAiResumeBuilder';
import { SeekerAiCoverLetter } from './seeker/SeekerAiCoverLetter';
import { SeekerAiInterviewCoach } from './seeker/SeekerAiInterviewCoach';
import { SeekerAiCareerAdvisor } from './seeker/SeekerAiCareerAdvisor';
import { SeekerAiSkillGap } from './seeker/SeekerAiSkillGap';
import { SeekerAiProfileWriter } from './seeker/SeekerAiProfileWriter';
import { SeekerAiApplicationTracker } from './seeker/SeekerAiApplicationTracker';
import { SeekerAiResumeParser } from './seeker/SeekerAiResumeParser';
import { evaluateResumeHealth } from '../utils/resumeHealthEvaluator';
import { ProfileHealthScoreCard } from './ProfileHealthScoreCard';
import { evaluateCandidateProfileHealth } from '../utils/profileHealthEvaluator';

export const JobSeekerProfileView: React.FC = () => {
  const { 
    currentUser, 
    updateProfile, 
    applications, 
    jobs, 
    savedJobIds, 
    toggleSaveJob, 
    setSelectedJob, 
    setApplyModalJob, 
    quickApplyToJob, 
    hasAppliedToJob,
    setAuthModalOpen,
    setActiveTab,
    openChatWithPrompt,
    showToast
  } = useJobContext();

  const [activeSubTab, setActiveSubTab] = useState<
    | 'profile'
    | 'profile_health'
    | 'resume_health'
    | 'ai_job_match'
    | 'ai_resume_parser'
    | 'ai_resume_analyzer'
    | 'ai_resume_builder'
    | 'ai_cover_letter'
    | 'ai_interview_coach'
    | 'ai_career_advisor'
    | 'ai_skill_gap'
    | 'ai_profile_writer'
    | 'applications'
    | 'saved_jobs'
  >('profile');

  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);

  const handleQuickApply = async (e: React.MouseEvent, job: any) => {
    e.stopPropagation();
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }
    setApplyingJobId(job.id);
    try {
      await quickApplyToJob(job.id);
    } finally {
      setApplyingJobId(null);
    }
  };

  // Profile editable state
  const [name, setName] = useState(currentUser?.name || 'Alex Chen');
  const [title, setTitle] = useState(currentUser?.title || 'Senior AI & Full-Stack Systems Engineer');
  const [bio, setBio] = useState(currentUser?.bio || 'Passionate software engineer with 6+ years building distributed AI platforms.');
  const [location, setLocation] = useState(currentUser?.location || 'San Francisco, CA');
  const [phone, setPhone] = useState(currentUser?.phone || '+1 (415) 890-2341');
  const [avatar, setAvatar] = useState(currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');

  // Skills
  const [skills, setSkills] = useState<SkillItem[]>(currentUser?.skills || [
    { name: 'TypeScript', level: 'Expert' },
    { name: 'React 19', level: 'Expert' },
    { name: 'PyTorch', level: 'Advanced' },
    { name: 'Node.js', level: 'Expert' },
    { name: 'Distributed Systems', level: 'Advanced' }
  ]);
  const [newSkillName, setNewSkillName] = useState('');

  // Experiences
  const [experience, setExperience] = useState<ExperienceItem[]>(currentUser?.experience || [
    {
      id: 'exp-1',
      role: 'Senior Software Engineer (AI Systems)',
      company: 'Veloce AI',
      location: 'San Francisco, CA',
      startDate: '2022-03',
      current: true,
      description: 'Architected high-throughput inference proxy reducing p99 latency by 42%. Built modern web portals in React/TypeScript utilized by 150k active developers.'
    }
  ]);

  // Education
  const [education, setEducation] = useState<EducationItem[]>(currentUser?.education || [
    {
      id: 'edu-1',
      school: 'University of California, Berkeley',
      degree: 'B.S. in Computer Science',
      field: 'Machine Learning & Systems',
      graduationYear: '2019'
    }
  ]);

  // Resume
  const [resumeFileName, setResumeFileName] = useState(currentUser?.resumeFileName || 'Alex_Chen_Resume_AI_Engineer_2026.pdf');

  // Job Preferences state
  const [desiredRole, setDesiredRole] = useState(currentUser?.jobPreferences?.desiredRole || 'Staff AI Systems & LLM Platform Engineer');
  const [remotePreference, setRemotePreference] = useState<'Remote' | 'Hybrid' | 'On-site' | 'Any'>(currentUser?.jobPreferences?.remotePreference || 'Remote');
  const [minExpectedSalary, setMinExpectedSalary] = useState<number>(currentUser?.jobPreferences?.minExpectedSalary || 185000);
  const [availability, setAvailability] = useState(currentUser?.jobPreferences?.availability || '2 weeks');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name,
      title,
      bio,
      location,
      phone,
      avatar,
      skills,
      experience,
      education,
      resumeFileName,
      jobPreferences: {
        desiredRole,
        remotePreference,
        minExpectedSalary: Number(minExpectedSalary) || 0,
        availability: availability as any
      },
      profileHealthScore: candidateHealthResult.overallScore,
      profileHealthGrade: candidateHealthResult.grade,
      profileHealthAuditDate: new Date().toISOString()
    });
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const addSkill = () => {
    if (!newSkillName.trim()) return;
    if (skills.some(s => s.name.toLowerCase() === newSkillName.trim().toLowerCase())) return;
    const updated = [...skills, { name: newSkillName.trim(), level: 'Advanced' as const }];
    setSkills(updated);
    setNewSkillName('');
    if (!isEditing) {
      updateProfile({ skills: updated });
    }
  };

  const removeSkill = (skillName: string) => {
    const updated = skills.filter(s => s.name !== skillName);
    setSkills(updated);
    if (!isEditing) {
      updateProfile({ skills: updated });
    }
  };

  const savedJobs = jobs.filter(j => savedJobIds.includes(j.id));

  // Memoized live resume health score for profile
  const profileHealthResult = useMemo(() => {
    if (!currentUser) return null;
    const skillsStr = (currentUser.skills || []).map(s => s.name).join(', ');
    const expStr = (currentUser.experience || []).map(e => `${e.role} at ${e.company}\n- ${e.description}`).join('\n\n');
    const eduStr = (currentUser.education || []).map(ed => `${ed.degree} in ${ed.field}, ${ed.school}`).join('\n');
    const fullText = `${currentUser.name}\n${currentUser.title || ''}\n${currentUser.location || ''}\n\nSUMMARY\n${currentUser.bio || ''}\n\nCORE COMPETENCIES\n${skillsStr}\n\nEXPERIENCE\n${expStr}\n\nEDUCATION\n${eduStr}`;
    return evaluateResumeHealth(fullText, 'tech_faang', currentUser.resumeFileName || 'Default_Resume.pdf');
  }, [currentUser]);

  // Memoized live candidate profile health score
  const candidateHealthResult = useMemo(() => {
    return evaluateCandidateProfileHealth(currentUser);
  }, [currentUser]);

  // Navigation tab definitions
  interface SubTabItem {
    id: typeof activeSubTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }

  const SUBTABS: SubTabItem[] = [
    { id: 'profile', label: 'Candidate Profile', icon: User },
    { id: 'profile_health', label: 'Profile Health Score', icon: ShieldCheck, badge: `${candidateHealthResult?.overallScore || 90} • ${candidateHealthResult?.grade || 'A'}` },
    { id: 'resume_health', label: 'Resume Health Score', icon: HeartPulse, badge: `${currentUser?.resumeHealthScore || profileHealthResult?.overallScore || 92} • ${currentUser?.resumeHealthGrade || 'Audit'}` },
    { id: 'ai_job_match', label: 'AI Job Match', icon: Sparkles, badge: 'Live' },
    { id: 'ai_resume_parser', label: 'Resume vs Job Skills', icon: FileCheck, badge: 'New' },
    { id: 'ai_resume_analyzer', label: 'AI Resume Analyzer', icon: FileText },
    { id: 'ai_resume_builder', label: 'AI Resume & STAR', icon: Star },
    { id: 'ai_cover_letter', label: 'AI Cover Letter', icon: Send },
    { id: 'ai_interview_coach', label: 'AI Interview Coach', icon: Mic },
    { id: 'ai_career_advisor', label: 'AI Career Advisor', icon: Compass },
    { id: 'ai_skill_gap', label: 'AI Skill Gap & Paths', icon: Award },
    { id: 'ai_profile_writer', label: 'AI Profile Writer', icon: Edit2 },
    { id: 'applications', label: `My Applications (${applications.length})`, icon: Briefcase },
    { id: 'saved_jobs', label: `Saved Jobs (${savedJobs.length})`, icon: Bookmark },
  ];

  return (
    <div className="min-h-screen bg-[#040816] text-slate-100 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      
      {/* Top Banner / User Welcome */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900/90 via-[#0a1128] to-slate-900/90 border border-cyan-500/30 shadow-2xl shadow-cyan-950/60 overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <img
              src={currentUser?.avatar || avatar}
              alt={currentUser?.name || name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover ring-2 ring-cyan-500/50 shadow-xl bg-slate-900"
            />
            <div className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-cyan-500 text-slate-950 shadow-md">
              <Sparkles className="w-4 h-4 fill-slate-950" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {currentUser?.name || name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                AI Match Ready
              </span>
            </div>

            <p className="text-xs sm:text-sm text-cyan-400 font-medium">
              {currentUser?.title || title}
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                {currentUser?.location || location}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                {currentUser?.email || 'alex.chen@example.com'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats Pill Grid */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 bg-slate-950/80 p-3 sm:p-4 rounded-2xl border border-slate-800 self-start md:self-auto">
          <div className="text-center px-2">
            <div className="text-lg sm:text-2xl font-black text-cyan-300">
              {applications.length}
            </div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Applied
            </div>
          </div>

          <div className="text-center px-2 border-x border-slate-800">
            <div className="text-lg sm:text-2xl font-black text-emerald-400">
              {savedJobs.length}
            </div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Saved
            </div>
          </div>

          <div className="text-center px-2">
            <div className="text-lg sm:text-2xl font-black text-blue-400">
              96%
            </div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              ATS Fit
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Sub-Navigation Tab Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800">
        {SUBTABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 border ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-cyan-400'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-black ${
                  isActive ? 'bg-slate-950 text-cyan-300' : 'bg-cyan-500/20 text-cyan-300'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT AREA */}
      <div>
        
        {/* SUBTAB: CANDIDATE PROFILE */}
        {activeSubTab === 'profile' && (
          <div className="space-y-6">
            
            {/* Health Score Diagnostic Banner inside Candidate Profile */}
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#0a1128] via-slate-900 to-[#0a1128] border border-cyan-500/30 shadow-xl shadow-cyan-950/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0 shadow-inner">
                  <ShieldCheck className="w-7 h-7 text-cyan-400" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-extrabold text-white tracking-tight">Candidate Profile Health</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${
                      candidateHealthResult.overallScore >= 85
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : candidateHealthResult.overallScore >= 70
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    }`}>
                      {candidateHealthResult.overallScore}/100 • Grade {candidateHealthResult.grade}
                    </span>
                    <span className="text-[11px] font-semibold text-cyan-400">
                      {candidateHealthResult.statusText}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {candidateHealthResult.missingInformation.length === 0
                      ? 'All 9 core dimensions (Completeness, Photo, Skills, Experience, Education, Resume, Preferences, Contact, Quality) are verified!'
                      : `${candidateHealthResult.missingInformation.length} profile item${candidateHealthResult.missingInformation.length > 1 ? 's' : ''} to improve: ${candidateHealthResult.missingInformation.slice(0, 2).join(', ')}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('profile_health')}
                  className="flex-1 md:flex-initial px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>Full Health Audit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex-1 md:flex-initial px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 text-xs font-bold text-slate-200 transition-all cursor-pointer"
                >
                  Edit Profile
                </button>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-cyan-400" />
                Profile Information & Verified Credentials
              </h2>

              <div className="flex items-center gap-2">
                {saveSuccess && (
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 animate-in fade-in">
                    <Check className="w-4 h-4" /> Profile Updated!
                  </span>
                )}
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 text-xs font-bold text-slate-200 flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
                </button>
              </div>
            </div>

            {/* Profile View / Form */}
            {isEditing ? (
              <form onSubmit={handleSaveProfile} className="p-6 rounded-3xl bg-[#0a1128]/90 border border-cyan-500/30 space-y-6">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full mt-1.5 p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300">Professional Headline</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full mt-1.5 p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300">Location</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full mt-1.5 p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300">Phone</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full mt-1.5 p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300">Profile Photo / Avatar URL</label>
                    <input
                      type="text"
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                      placeholder="https://..."
                      className="w-full mt-1.5 p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300">Target Role Title</label>
                    <input
                      type="text"
                      value={desiredRole}
                      onChange={(e) => setDesiredRole(e.target.value)}
                      placeholder="e.g. Senior Machine Learning Engineer"
                      className="w-full mt-1.5 p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300">Workplace Preference</label>
                    <select
                      value={remotePreference}
                      onChange={(e) => setRemotePreference(e.target.value as any)}
                      className="w-full mt-1.5 p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-cyan-400"
                    >
                      <option value="Remote">Remote Only</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="On-site">On-site</option>
                      <option value="Any">Flexible / Any</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300">Min Expected Annual Salary ($)</label>
                    <input
                      type="number"
                      value={minExpectedSalary}
                      onChange={(e) => setMinExpectedSalary(Number(e.target.value))}
                      className="w-full mt-1.5 p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-cyan-400"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-300">Job Availability</label>
                    <select
                      value={availability}
                      onChange={(e) => setAvailability(e.target.value as 'Immediate' | '2 weeks' | '1 month' | 'Open to offers')}
                      className="w-full mt-1.5 p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-cyan-400"
                    >
                      <option value="Immediate">Immediate Start</option>
                      <option value="2 weeks">2 Weeks Notice</option>
                      <option value="1 month">1 Month Notice</option>
                      <option value="Open to offers">Open to Exceptional Offers</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300">About / Professional Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className="w-full mt-1.5 p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-cyan-400"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                </div>

              </form>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left 2 Cols: Experience & Bio */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Bio Card */}
                  <div className="p-6 rounded-3xl bg-[#0a1128]/90 border border-cyan-500/20 space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                      About Me
                    </span>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                      {currentUser?.bio || bio}
                    </p>
                  </div>

                  {/* Work Experience */}
                  <div className="p-6 rounded-3xl bg-[#0a1128]/90 border border-cyan-500/20 space-y-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-cyan-400" />
                      Work Experience ({experience.length})
                    </span>

                    <div className="space-y-4">
                      {experience.map(exp => (
                        <div key={exp.id} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-white text-sm">{exp.role}</h3>
                            <span className="text-[11px] font-semibold text-cyan-400">{exp.startDate} - {exp.current ? 'Present' : exp.endDate}</span>
                          </div>
                          <div className="text-xs text-slate-400 font-medium">
                            {exp.company} • {exp.location}
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed pt-1">
                            {exp.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Education */}
                  <div className="p-6 rounded-3xl bg-[#0a1128]/90 border border-cyan-500/20 space-y-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-cyan-400" />
                      Education
                    </span>

                    <div className="space-y-3">
                      {education.map(edu => (
                        <div key={edu.id} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-white text-sm">{edu.school}</h3>
                            <p className="text-xs text-slate-300">{edu.degree} in {edu.field}</p>
                          </div>
                          <span className="text-xs font-semibold text-slate-400">{edu.graduationYear}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Job Preferences Card */}
                  <div className="p-6 rounded-3xl bg-[#0a1128]/90 border border-cyan-500/20 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                        <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
                        Target Job Preferences
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        Profile Health Input
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Target Role</div>
                        <div className="text-xs font-bold text-white mt-1">
                          {currentUser?.jobPreferences?.desiredRole || desiredRole || 'Not specified'}
                        </div>
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                        <div className="text-[10px] uppercase font-bold text-cyan-300">Workplace Mode</div>
                        <div className="text-xs font-bold text-cyan-300 mt-1">
                          {currentUser?.jobPreferences?.remotePreference || remotePreference || 'Remote'}
                        </div>
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Target Min Salary</div>
                        <div className="text-xs font-bold text-emerald-400 mt-1">
                          ${(currentUser?.jobPreferences?.minExpectedSalary || minExpectedSalary || 0).toLocaleString()}/year
                        </div>
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Availability</div>
                        <div className="text-xs font-bold text-blue-300 mt-1">
                          {currentUser?.jobPreferences?.availability || availability || '2 weeks'}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Right Col: Skills & Resume File */}
                <div className="space-y-6">
                  
                  {/* Skills Card */}
                  <div className="p-6 rounded-3xl bg-[#0a1128]/90 border border-cyan-500/20 space-y-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      Core Competencies ({skills.length})
                    </span>

                    <div className="flex flex-wrap gap-2">
                      {skills.map((sk, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5"
                        >
                          <span>{sk.name}</span>
                          <button
                            onClick={() => removeSkill(sk.name)}
                            className="hover:text-red-400 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <input
                        type="text"
                        value={newSkillName}
                        onChange={(e) => setNewSkillName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                        placeholder="Add skill..."
                        className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-400"
                      />
                      <button
                        onClick={addSkill}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Candidate Profile Health Score Diagnostic Card */}
                  <div className="p-6 rounded-3xl bg-[#0a1128]/95 border border-cyan-500/30 space-y-4 shadow-xl shadow-cyan-950/40">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-cyan-400" />
                        Profile Health Score™
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        (candidateHealthResult?.overallScore || 0) >= 85
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : (candidateHealthResult?.overallScore || 0) >= 70
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {candidateHealthResult?.grade || 'A'} • {candidateHealthResult?.overallScore || 90}/100
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white">
                          {candidateHealthResult?.statusText || 'Profile Ready'}
                        </span>
                        <span className="text-[11px] font-semibold text-cyan-400">
                          {candidateHealthResult?.overallScore || 90}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-500"
                          style={{ width: `${candidateHealthResult?.overallScore || 90}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Evaluates 7 core areas: completeness, skills, experience, education, resume, preferences, and professional profile quality.
                      </p>
                    </div>

                    {/* Quick Metric Counts */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                        <div className="font-bold text-emerald-400">{candidateHealthResult?.strengths.length || 0}</div>
                        <div className="text-[10px] text-slate-400">Strengths</div>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                        <div className="font-bold text-amber-400">{candidateHealthResult?.warnings.length || 0}</div>
                        <div className="text-[10px] text-slate-400">Warnings</div>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                        <div className="font-bold text-rose-400">{candidateHealthResult?.missingInformation.length || 0}</div>
                        <div className="text-[10px] text-slate-400">Missing</div>
                      </div>
                    </div>

                    {/* Actionable Recommendations Preview */}
                    {candidateHealthResult && candidateHealthResult.recommendations.length > 0 && (
                      <div className="pt-2 border-t border-slate-800/80">
                        <span className="text-[10px] uppercase font-bold text-cyan-300 flex items-center gap-1 mb-1.5">
                          <Sparkles className="w-3 h-3 text-cyan-400" />
                          Top Improvement ({candidateHealthResult.recommendations.length} action items)
                        </span>
                        <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                          <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                            <span className="truncate">{candidateHealthResult.recommendations[0].title}</span>
                            <span className="text-[10px] font-bold text-emerald-400 shrink-0 ml-2">
                              +{candidateHealthResult.recommendations[0].potentialScoreGain} pts
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-snug">
                            {candidateHealthResult.recommendations[0].description}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 pt-1">
                      <button
                        onClick={() => setActiveSubTab('profile_health')}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/20 cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-slate-950" />
                        <span>View Full 9-Point Audit & Checklist</span>
                      </button>

                      <button
                        onClick={() => setIsEditing(true)}
                        className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Edit Profile to Fix Items</span>
                      </button>
                    </div>
                  </div>

                  {/* Primary Resume & Health Score Diagnostic Card */}
                  <div className="p-6 rounded-3xl bg-[#0a1128]/95 border border-cyan-500/30 space-y-4 shadow-xl shadow-cyan-950/40">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                        <HeartPulse className="w-4 h-4 text-rose-400 animate-pulse" />
                        Resume Health Score™
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {currentUser?.resumeHealthGrade || profileHealthResult?.healthGrade || 'A+'} • {currentUser?.resumeHealthScore || profileHealthResult?.overallScore || 92}/100
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
                      <FileText className="w-8 h-8 text-cyan-400 shrink-0" />
                      <div className="overflow-hidden flex-1">
                        <div className="text-xs font-bold text-white truncate">{resumeFileName}</div>
                        <div className="text-[10px] text-cyan-400 font-medium mt-0.5">
                          {profileHealthResult?.healthStatusText || 'Strong • Recruiter Ready'}
                        </div>
                      </div>
                    </div>

                    {/* Mini Vital Metric Progress Bars */}
                    {profileHealthResult && (
                      <div className="space-y-2 pt-1 border-t border-slate-800/80">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400">Impact Metrics (X-Y-Z):</span>
                          <span className="font-bold text-cyan-300">{profileHealthResult.categoryScores?.impactAndMetrics?.score || profileHealthResult.sectionScores?.workExperience?.score || 85}%</span>
                        </div>
                        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${profileHealthResult.categoryScores?.impactAndMetrics?.score || profileHealthResult.sectionScores?.workExperience?.score || 85}%` }} />
                        </div>

                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400">Action Ownership Verbs:</span>
                          <span className="font-bold text-emerald-300">{profileHealthResult.categoryScores?.actionVerbsAndTone?.score || profileHealthResult.sectionScores?.workExperience?.score || 85}%</span>
                        </div>
                        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${profileHealthResult.categoryScores?.actionVerbsAndTone?.score || profileHealthResult.sectionScores?.workExperience?.score || 85}%` }} />
                        </div>

                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400">ATS Parsability:</span>
                          <span className="font-bold text-blue-300">{profileHealthResult.categoryScores?.atsAndFormatting?.score || profileHealthResult.sectionScores?.keywordsAtsCompatibility?.score || 90}%</span>
                        </div>
                        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-400 rounded-full" style={{ width: `${profileHealthResult.categoryScores?.atsAndFormatting?.score || profileHealthResult.sectionScores?.keywordsAtsCompatibility?.score || 90}%` }} />
                        </div>

                        {/* Quick Improvement Checklist Preview */}
                        {profileHealthResult.suggestions && profileHealthResult.suggestions.length > 0 && (
                          <div className="pt-2 border-t border-slate-800/80">
                            <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1 mb-1">
                              <Sparkles className="w-3 h-3" /> Priority Improvements ({profileHealthResult.suggestions.length})
                            </span>
                            <div className="space-y-1">
                              {profileHealthResult.suggestions.slice(0, 2).map((sug, i) => (
                                <div key={i} className="text-[11px] text-slate-300 flex items-start gap-1.5 p-1.5 rounded-lg bg-slate-950/60 border border-slate-800">
                                  <span className="text-amber-400 text-xs leading-none mt-0.5">•</span>
                                  <span className="truncate">{sug.title}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-2 pt-2">
                      <button
                        onClick={() => setActiveSubTab('resume_health')}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/20 cursor-pointer"
                      >
                        <HeartPulse className="w-3.5 h-3.5 text-slate-950" />
                        <span>Audit Health & View Specific Suggestions</span>
                      </button>

                      <button
                        onClick={() => setActiveSubTab('ai_resume_analyzer')}
                        className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Run Keyword ATS Audit</span>
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            )}

          </div>
        )}

        {/* SUBTAB: CANDIDATE PROFILE HEALTH SCORE */}
        {activeSubTab === 'profile_health' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#0a1128]/90 border border-cyan-500/30 shadow-xl shadow-cyan-950/40">
              <div>
                <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-cyan-400" />
                  Candidate Profile Health & Verification Diagnostic
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Full 9-dimension health audit: Completeness, Photo, Skills, Experience, Education, Resume, Job Preferences, Contact Info & Quality.
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveSubTab('profile');
                  setIsEditing(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer shrink-0"
              >
                <Edit2 className="w-4 h-4 text-slate-950" />
                <span>Edit Profile to Fix Items</span>
              </button>
            </div>

            <ProfileHealthScoreCard
              profile={currentUser}
              profileType="candidate"
              onActionClick={(target) => {
                setActiveSubTab('profile');
                setIsEditing(true);
              }}
            />
          </div>
        )}

        {/* SUBTAB: RESUME HEALTH SCORE UTILITY */}
        {activeSubTab === 'resume_health' && <SeekerResumeHealthScore />}

        {/* SUBTAB: AI JOB MATCH */}
        {activeSubTab === 'ai_job_match' && <SeekerAiJobMatch />}

        {/* SUBTAB: AI RESUME PARSER & JOB SKILL GAP */}
        {activeSubTab === 'ai_resume_parser' && <SeekerAiResumeParser />}

        {/* SUBTAB: AI RESUME ANALYZER */}
        {activeSubTab === 'ai_resume_analyzer' && <SeekerAiResumeAnalyzer />}

        {/* SUBTAB: AI RESUME BUILDER & STAR OPTIMIZER */}
        {activeSubTab === 'ai_resume_builder' && <SeekerAiResumeBuilder />}

        {/* SUBTAB: AI COVER LETTER */}
        {activeSubTab === 'ai_cover_letter' && <SeekerAiCoverLetter />}

        {/* SUBTAB: AI INTERVIEW COACH */}
        {activeSubTab === 'ai_interview_coach' && <SeekerAiInterviewCoach />}

        {/* SUBTAB: AI CAREER ADVISOR & ROADMAP */}
        {activeSubTab === 'ai_career_advisor' && <SeekerAiCareerAdvisor />}

        {/* SUBTAB: AI SKILL GAP */}
        {activeSubTab === 'ai_skill_gap' && <SeekerAiSkillGap />}

        {/* SUBTAB: AI PROFILE WRITER */}
        {activeSubTab === 'ai_profile_writer' && <SeekerAiProfileWriter />}

        {/* SUBTAB: MY APPLICATIONS & APPLICATION TRACKER */}
        {activeSubTab === 'applications' && (
          <div className="space-y-6">
            <SeekerAiApplicationTracker />

            {/* List of Applications */}
            <div className="p-6 rounded-3xl bg-[#0a1128]/90 border border-cyan-500/20 space-y-4">
              <h3 className="text-base font-extrabold text-white">
                Detailed Application History ({applications.length})
              </h3>
              
              <div className="space-y-3">
                {applications.map(app => {
                  const job = jobs.find(j => j.id === app.jobId);
                  return (
                    <div key={app.id} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-white text-sm">{job?.title || 'Applied Position'}</h4>
                        <p className="text-xs text-cyan-300">{job?.company} • {job?.location}</p>
                        <span className="text-[11px] text-slate-400 mt-1 block">Applied on {app.appliedAt}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-xl text-xs font-bold capitalize ${
                          app.status === 'offered' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                          app.status === 'interviewing' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' :
                          'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}>
                          {app.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB: SAVED JOBS */}
        {activeSubTab === 'saved_jobs' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-gradient-to-r from-cyan-950/60 via-[#0a1128] to-blue-950/60 border border-cyan-500/30">
              <h2 className="text-xl font-extrabold text-white">
                Saved Positions ({savedJobs.length})
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Roles bookmarked for later review or 1-Click Quick Apply.
              </p>
            </div>

            {savedJobs.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 text-slate-400 space-y-3">
                <Bookmark className="w-8 h-8 mx-auto text-cyan-400" />
                <h4 className="text-base font-bold text-white">No Saved Jobs</h4>
                <p className="text-xs">Browse all open roles and click the bookmark icon to save jobs here.</p>
                <button
                  onClick={() => setActiveTab('all_jobs')}
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold"
                >
                  Explore Jobs
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {savedJobs.map(job => (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className="p-5 rounded-2xl bg-[#0a1128]/80 hover:bg-[#0f172a] border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={job.companyLogo}
                        alt={job.company}
                        className="w-12 h-12 rounded-xl object-cover ring-1 ring-cyan-500/30 bg-slate-950"
                      />
                      <div>
                        <h3 className="font-bold text-white text-sm sm:text-base">{job.title}</h3>
                        <p className="text-xs text-slate-400">{job.company} • {job.location}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        onClick={(e) => handleQuickApply(e, job)}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-md shadow-cyan-500/20"
                      >
                        <Zap className="w-3.5 h-3.5 fill-slate-950" />
                        <span>Quick Apply</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSaveJob(job.id);
                        }}
                        className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400 hover:text-red-400"
                        title="Remove bookmark"
                      >
                        <Bookmark className="w-4 h-4 fill-cyan-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
};
