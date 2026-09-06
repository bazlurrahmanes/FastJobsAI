import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Briefcase, 
  Users, 
  PlusCircle, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Eye, 
  Edit3, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  FileText, 
  DollarSign, 
  MapPin, 
  Globe, 
  TrendingUp, 
  MessageSquare,
  ChevronRight,
  UserCheck,
  XCircle,
  Award,
  ShieldCheck,
  Phone,
  Mail,
  AlertTriangle
} from 'lucide-react';
import { useJobContext } from '../context/JobContext';
import { Application, Job } from '../types';
import { ProfileHealthScoreCard } from './ProfileHealthScoreCard';
import { evaluateEmployerProfileHealth } from '../utils/profileHealthEvaluator';

export const EmployerDashboard: React.FC = () => {
  const { 
    jobs, 
    applications, 
    currentUser, 
    updateProfile, 
    toggleJobStatus, 
    deleteJob, 
    updateApplicationStatus,
    setActiveTab,
    setSelectedJob
  } = useJobContext();

  const [activeEmployerTab, setActiveEmployerTab] = useState<'jobs' | 'applicants' | 'company_profile' | 'brand_health'>('jobs');
  const [applicantFilterStatus, setApplicantFilterStatus] = useState<string>('all');
  const [selectedApplicant, setSelectedApplicant] = useState<Application | null>(null);

  // Company profile edit state
  const [companyName, setCompanyName] = useState(currentUser?.companyName || 'NeuralMatrix Labs');
  const [companyLogo, setCompanyLogo] = useState(currentUser?.companyLogo || currentUser?.avatar || 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=150&auto=format&fit=crop&q=80');
  const [companyIndustry, setCompanyIndustry] = useState(currentUser?.companyIndustry || 'Artificial Intelligence');
  const [companySize, setCompanySize] = useState(currentUser?.companySize || '50 - 250 employees');
  const [companyWebsite, setCompanyWebsite] = useState(currentUser?.companyWebsite || 'https://neuralmatrix.ai');
  const [companyLocation, setCompanyLocation] = useState(currentUser?.companyLocation || currentUser?.location || 'San Francisco, CA • Remote First');
  const [companyPhone, setCompanyPhone] = useState(currentUser?.companyPhone || currentUser?.phone || '+1 (415) 555-0199');
  const [companyEmail, setCompanyEmail] = useState(currentUser?.companyEmail || currentUser?.email || 'recruiting@neuralmatrix.ai');
  const [companyBio, setCompanyBio] = useState(currentUser?.companyDescription || currentUser?.bio || 'Building foundational model inference infrastructure.');
  const [verifiedEmployer, setVerifiedEmployer] = useState<boolean>(currentUser?.verifiedEmployer ?? true);
  const [profileSaved, setProfileSaved] = useState(false);

  // Filter jobs posted by employer (or all if demo)
  const employerJobs = jobs.filter(j => j.employerId === currentUser?.id || currentUser?.role === 'employer' || true);

  // Employer Profile Health evaluation
  const employerHealth = useMemo(() => {
    return evaluateEmployerProfileHealth(currentUser, employerJobs);
  }, [currentUser, employerJobs]);

  // Calculate statistics
  const totalApplicants = applications.length;
  const interviewingCount = applications.filter(a => a.status === 'interviewing').length;
  const activeJobsCount = jobs.filter(j => j.status === 'active').length;

  const filteredApplications = applications.filter(app => {
    if (applicantFilterStatus === 'all') return true;
    return app.status === applicantFilterStatus;
  });

  const handleSaveCompanyProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      companyName,
      companyLogo,
      companyIndustry,
      companySize,
      companyWebsite,
      companyLocation,
      companyPhone,
      companyEmail,
      companyDescription: companyBio,
      bio: companyBio,
      verifiedEmployer,
      profileHealthScore: employerHealth.overallScore,
      profileHealthGrade: employerHealth.grade,
      profileHealthAuditDate: new Date().toISOString()
    });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#040816] text-slate-100 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#0a1128] via-slate-900 to-blue-950/40 border border-blue-500/20 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0 overflow-hidden ring-1 ring-cyan-500/30">
            {companyLogo ? (
              <img 
                src={companyLogo} 
                alt={companyName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <Building2 className="w-8 h-8 text-white" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                {currentUser?.companyName || companyName}
              </h1>
              {verifiedEmployer && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-cyan-400" />
                  Verified Tech Employer
                </span>
              )}
              <button
                onClick={() => setActiveEmployerTab('brand_health')}
                className={`px-2.5 py-0.5 rounded-full text-xs font-black border transition-all flex items-center gap-1.5 cursor-pointer ${
                  employerHealth.overallScore >= 85
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                    : employerHealth.overallScore >= 70
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/30 hover:bg-rose-500/30'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Health Score: {employerHealth.overallScore}/100 • Grade {employerHealth.grade}</span>
              </button>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Employer Hiring Dashboard • AI Talent Matching Pipeline • {employerHealth.statusText}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setActiveEmployerTab('brand_health')}
            className="px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/40 text-slate-200 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Profile Health Audit</span>
          </button>

          <button
            onClick={() => setActiveTab('post_a_job')}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-slate-950" />
            <span>Post a New Job</span>
          </button>
        </div>
      </div>

      {/* Metrics Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="p-5 rounded-2xl bg-[#0a1128]/70 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Active Listings</span>
            <Briefcase className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-2">
            {activeJobsCount}
          </div>
          <span className="text-[11px] text-emerald-400 font-medium">All systems operational</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0a1128]/70 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Total Applicants</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-2">
            {totalApplicants}
          </div>
          <span className="text-[11px] text-cyan-400 font-medium">+4 new this week</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0a1128]/70 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Interviews Active</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-2">
            {interviewingCount}
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Candidates in final stages</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0a1128]/70 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Avg AI Match Fit</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-cyan-300 mt-2">
            95.2%
          </div>
          <span className="text-[11px] text-slate-400 font-medium">High quality candidate pool</span>
        </div>

        <div 
          onClick={() => setActiveEmployerTab('brand_health')}
          className="p-5 rounded-2xl bg-[#0a1128]/70 border border-slate-800 hover:border-emerald-500/40 backdrop-blur-md cursor-pointer transition-all group col-span-2 md:col-span-1"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Profile Health</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400">
              {employerHealth.overallScore}
            </span>
            <span className="text-xs font-bold text-slate-400">/100</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {employerHealth.grade}
            </span>
          </div>
          <span className="text-[11px] text-emerald-300/80 font-medium truncate block mt-0.5">
            {employerHealth.statusText}
          </span>
        </div>
      </div>

      {/* Navigation Tabs for Employer */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveEmployerTab('jobs')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
            activeEmployerTab === 'jobs'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Manage Active Jobs ({jobs.length})</span>
        </button>

        <button
          onClick={() => setActiveEmployerTab('applicants')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
            activeEmployerTab === 'applicants'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Candidate Pipeline ({applications.length})</span>
        </button>

        <button
          onClick={() => setActiveEmployerTab('company_profile')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
            activeEmployerTab === 'company_profile'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Employer Profile</span>
        </button>

        <button
          onClick={() => setActiveEmployerTab('brand_health')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
            activeEmployerTab === 'brand_health'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Profile Health Score</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/30 text-emerald-300 border border-emerald-500/40">
            {employerHealth.overallScore}/100
          </span>
        </button>
      </div>

      {/* TAB 1: Manage Active Jobs */}
      {activeEmployerTab === 'jobs' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">Your Listed Roles</h2>
            <button
              onClick={() => setActiveTab('post_a_job')}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <PlusCircle className="w-4 h-4" />
              Post Another Role
            </button>
          </div>

          <div className="space-y-3">
            {jobs.map(job => (
              <div
                key={job.id}
                className="p-5 rounded-2xl bg-[#0a1128]/70 border border-slate-800 hover:border-cyan-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      job.status === 'active' 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {job.status === 'active' ? '● Active & Live' : '○ Paused'}
                    </span>
                    <span className="text-xs text-slate-400">{job.category}</span>
                    <span className="text-xs text-slate-500">• Posted {job.postedAt}</span>
                  </div>

                  <h3 
                    onClick={() => setSelectedJob(job)}
                    className="text-base sm:text-lg font-bold text-white hover:text-cyan-300 cursor-pointer"
                  >
                    {job.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {job.location}
                    </span>
                    <span className="text-emerald-400 font-medium">
                      ${Math.round(job.salaryMin/1000)}k - ${Math.round(job.salaryMax/1000)}k/yr
                    </span>
                    <span className="text-cyan-300 font-semibold flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {job.applicantCount} Candidates
                    </span>
                  </div>
                </div>

                {/* Job Action Controls */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setSelectedJob(job)}
                    className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                    title="Preview Public Listing"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => toggleJobStatus(job.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      job.status === 'active'
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                    }`}
                  >
                    {job.status === 'active' ? 'Pause Role' : 'Activate Role'}
                  </button>

                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this job listing?')) {
                        deleteJob(job.id);
                      }
                    }}
                    className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
                    title="Delete Job"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Candidate Applications Pipeline */}
      {activeEmployerTab === 'applicants' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-white">
              Candidate Applications Pipeline ({filteredApplications.length})
            </h2>

            {/* Status Filter Buttons */}
            <div className="flex flex-wrap gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              {['all', 'submitted', 'under_review', 'interviewing', 'offered', 'rejected'].map(status => (
                <button
                  key={status}
                  onClick={() => setApplicantFilterStatus(status)}
                  className={`px-3 py-1 rounded-lg capitalize font-medium transition-all ${
                    applicantFilterStatus === status
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {status.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredApplications.map(app => (
              <div
                key={app.id}
                className="p-5 rounded-2xl bg-[#0a1128]/70 border border-slate-800 hover:border-cyan-500/40 backdrop-blur-md space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={app.applicantAvatar}
                        alt={app.applicantName}
                        className="w-12 h-12 rounded-xl object-cover ring-1 ring-cyan-500/40"
                      />
                      <div>
                        <h4 className="font-bold text-white text-sm">{app.applicantName}</h4>
                        <p className="text-xs text-slate-400 truncate max-w-[140px]">{app.applicantTitle}</p>
                      </div>
                    </div>

                    <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                      {app.matchScore}% Match
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-semibold">Applying For</span>
                      <span className="text-slate-200 font-medium truncate block">{app.jobTitle}</span>
                    </div>

                    {app.applicantSkills && app.applicantSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {app.applicantSkills.slice(0, 3).map(s => (
                          <span key={s} className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 text-[10px] border border-slate-800">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}

                    {app.coverLetter && (
                      <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60 text-slate-300 text-[11px] italic line-clamp-2">
                        "{app.coverLetter}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Progression Controls */}
                <div className="pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">Status:</span>
                    <select
                      value={app.status}
                      onChange={(e) => updateApplicationStatus(app.id, e.target.value as any)}
                      className="bg-slate-900 border border-slate-700 text-cyan-300 text-xs rounded-lg px-2 py-1 outline-none font-semibold cursor-pointer"
                    >
                      <option value="submitted">Submitted</option>
                      <option value="under_review">Under Review</option>
                      <option value="interviewing">Interviewing</option>
                      <option value="offered">Offered</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3 text-cyan-400" />
                      {app.resumeFileName}
                    </span>
                    <span className="text-slate-500">{app.appliedAt}</span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Employer Profile */}
      {activeEmployerTab === 'company_profile' && (
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Quick Health Diagnostic Banner */}
          <div className="p-5 rounded-2xl bg-[#0a1128]/90 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-emerald-950/20">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-white">Company Profile Health</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                    employerHealth.overallScore >= 85
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : employerHealth.overallScore >= 70
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    {employerHealth.overallScore}/100 • Grade {employerHealth.grade}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {employerHealth.missingInformation.length === 0
                    ? 'All employer health dimensions are satisfied!'
                    : `${employerHealth.missingInformation.length} profile item${employerHealth.missingInformation.length > 1 ? 's' : ''} to improve: ${employerHealth.missingInformation.slice(0, 2).join(', ')}`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveEmployerTab('brand_health')}
              className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Full Health Audit</span>
            </button>
          </div>

          <form onSubmit={handleSaveCompanyProfile} className="p-6 sm:p-8 rounded-3xl bg-[#0a1128]/80 border border-cyan-500/20 backdrop-blur-md space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white">Company Brand Profile</h2>
                <p className="text-xs text-slate-400">Control how your organization appears to top tech candidates & AI match systems.</p>
              </div>
              {profileSaved && (
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Profile Updated!
                </span>
              )}
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Company Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:border-cyan-400 outline-none"
                    placeholder="e.g. NeuralMatrix Labs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Company Logo URL</label>
                  <input
                    type="url"
                    value={companyLogo}
                    onChange={(e) => setCompanyLogo(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:border-cyan-400 outline-none"
                    placeholder="https://... logo image link"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Industry</label>
                  <input
                    type="text"
                    value={companyIndustry}
                    onChange={(e) => setCompanyIndustry(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:border-cyan-400 outline-none"
                    placeholder="e.g. Artificial Intelligence"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Company Size</label>
                  <input
                    type="text"
                    value={companySize}
                    onChange={(e) => setCompanySize(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:border-cyan-400 outline-none"
                    placeholder="e.g. 50 - 250 employees"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Official Website URL</label>
                  <input
                    type="text"
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:border-cyan-400 outline-none"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Location / Headquarters</label>
                  <input
                    type="text"
                    value={companyLocation}
                    onChange={(e) => setCompanyLocation(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:border-cyan-400 outline-none"
                    placeholder="e.g. San Francisco, CA • Remote First"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Recruiting Contact Email</span>
                  </label>
                  <input
                    type="email"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:border-cyan-400 outline-none"
                    placeholder="recruiting@company.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Recruiting Contact Phone</span>
                  </label>
                  <input
                    type="tel"
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:border-cyan-400 outline-none"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  About the Organization (Company Description)
                </label>
                <textarea
                  rows={4}
                  value={companyBio}
                  onChange={(e) => setCompanyBio(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:border-cyan-400 outline-none leading-relaxed"
                  placeholder="Describe your company mission, culture, technical stack, and perks..."
                />
                <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
                  <span>{companyBio.length} characters</span>
                  <span>Recommended: 80+ chars for top health rating</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                  <div>
                    <span className="text-xs font-bold text-white block">Employer Verification Badge</span>
                    <span className="text-[11px] text-slate-400 block">Increases applicant trust score and visibility in search results.</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verifiedEmployer}
                    onChange={(e) => setVerifiedEmployer(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                Save Company Profile
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: Employer Profile Health Diagnostic */}
      {activeEmployerTab === 'brand_health' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-[#0a1128]/90 border border-emerald-500/30 shadow-xl shadow-emerald-950/40">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Employer & Company Profile Health Diagnostic
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                9-dimension evaluation: Company Info, Logo, Description, Industry, Location, Website, Verification, Active Job Quality, and Contact Info.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setActiveEmployerTab('company_profile')}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Edit Company Profile</span>
              </button>

              <button
                onClick={() => setActiveTab('post_a_job')}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5 text-slate-950" />
                <span>Post a Job</span>
              </button>
            </div>
          </div>

          <ProfileHealthScoreCard
            profile={currentUser}
            profileType="employer"
            activeJobs={employerJobs}
            onActionClick={(target) => {
              if (target === 'post_a_job') {
                setActiveTab('post_a_job');
              } else if (target === 'manage_jobs') {
                setActiveEmployerTab('jobs');
              } else {
                setActiveEmployerTab('company_profile');
              }
            }}
          />
        </div>
      )}

    </div>
  );
};
