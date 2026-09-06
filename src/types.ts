export type UserRole = 'job_seeker' | 'employer' | 'admin';

export type JobType = 'Full-time' | 'Part-time' | 'Contract' | 'Internship' | 'Freelance';

export type ExperienceLevel = 'Entry Level' | 'Mid-Level' | 'Senior' | 'Lead' | 'Executive';

export type JobCategory =
  | 'AI & Machine Learning'
  | 'Engineering'
  | 'Product & Design'
  | 'Data & Analytics'
  | 'DevOps & Cloud'
  | 'Marketing & Growth'
  | 'Sales & Success'
  | 'Operations & Finance';

export interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo: string;
  companyWebsite?: string;
  location: string;
  isRemote: boolean;
  jobType: JobType;
  category: JobCategory;
  experienceLevel: ExperienceLevel;
  salaryMin: number;
  salaryMax: number;
  salaryPeriod: 'year' | 'month' | 'hour';
  currency: string;
  skills: string[];
  description: string;
  requirements: string[];
  benefits: string[];
  applicationMethod: 'direct' | 'external' | 'email';
  applicationUrl?: string;
  postedAt: string;
  featured?: boolean;
  urgent?: boolean;
  employerId: string;
  applicantCount: number;
  status: 'active' | 'paused' | 'closed';
  matchScore?: number;
}

export interface SkillItem {
  name: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
}

export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string;
}

export interface EducationItem {
  id: string;
  school: string;
  degree: string;
  field: string;
  graduationYear: string;
}

export interface CandidateJobPreferences {
  desiredRole?: string;
  jobTypes?: JobType[];
  preferredLocations?: string[];
  remotePreference?: 'Remote' | 'Hybrid' | 'On-site' | 'Any';
  minExpectedSalary?: number;
  desiredCategories?: JobCategory[];
  availability?: 'Immediate' | '2 weeks' | '1 month' | 'Open to offers';
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar: string;
  title?: string;
  bio?: string;
  location?: string;
  phone?: string;
  skills: SkillItem[];
  experience: ExperienceItem[];
  education: EducationItem[];
  resumeUrl?: string;
  resumeFileName?: string;
  resumeSummary?: string;
  resumeHealthScore?: number;
  resumeHealthGrade?: string;
  resumeHealthAuditDate?: string;
  profileHealthScore?: number;
  profileHealthGrade?: string;
  profileHealthAuditDate?: string;
  jobPreferences?: CandidateJobPreferences;
  // Employer specific fields
  companyName?: string;
  companyLogo?: string;
  companySize?: string;
  companyIndustry?: string;
  companyWebsite?: string;
  companyLocation?: string;
  companyDescription?: string;
  companyEmail?: string;
  companyPhone?: string;
  verifiedEmployer?: boolean;
  contactEmail?: string;
  contactPhone?: string;
  savedJobIds: string[];
  isFirebaseUser?: boolean;
  authProvider?: 'google' | 'password' | 'demo';
}

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  companyLogo: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  applicantAvatar: string;
  applicantTitle: string;
  applicantSkills: string[];
  resumeFileName: string;
  coverLetter?: string;
  matchScore: number;
  matchInsights?: string[];
  appliedAt: string;
  status: 'submitted' | 'under_review' | 'interviewing' | 'offered' | 'rejected';
  employerNotes?: string;
}

export interface FilterState {
  keyword: string;
  location: string;
  categories: JobCategory[];
  jobTypes: JobType[];
  experienceLevels: ExperienceLevel[];
  remoteOnly: boolean;
  minSalary: number;
  maxSalary: number;
  sortBy: 'newest' | 'salary_high' | 'match_score' | 'featured';
}

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  jobTitle?: string;
  companyName?: string;
  companyLogo?: string;
  resumeFileName?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export interface AdminActionProposal {
  actionType: 'DELETE_JOB' | 'FLAG_JOB' | 'APPROVE_COMPANY' | 'REJECT_COMPANY' | 'DISABLE_PLATFORM' | 'ENABLE_PLATFORM' | 'RETRY_FEED' | 'SUSPEND_ACCOUNT' | 'RUN_DIAGNOSTIC' | 'OPTIMIZE_INDEX' | 'PURGE_CACHE' | 'REVIEW_PROFILE';
  targetId: string;
  targetName: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  explanation: string;
  requiresConfirmation: boolean;
  parameters?: Record<string, any>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'assistant';
  content: string;
  timestamp: string;
  recommendedJobIds?: string[];
  suggestedFollowups?: string[];
  suggestedAction?: {
    type: 'filter' | 'navigate' | 'open_job' | 'quick_apply' | 'switch_role' | 'admin_review';
    label: string;
    data?: any;
  };
  proposedAction?: AdminActionProposal;
  facts?: string[];
  recommendations?: string[];
  isStreaming?: boolean;
}

export interface ChatContextInfo {
  currentUser?: {
    name: string;
    role: UserRole;
    title?: string;
    skills: string[];
    bio?: string;
  } | null;
  activeTab: ActiveTab;
  selectedJob?: {
    id: string;
    title: string;
    company: string;
    location: string;
    salaryMin: number;
    salaryMax: number;
    skills: string[];
    category: string;
  } | null;
  filters?: Partial<FilterState>;
  availableJobsSummary?: Array<{
    id: string;
    title: string;
    company: string;
    location: string;
    salary: string;
    category: string;
    skills: string[];
  }>;
}

export interface CandidateRecord {
  id: string;
  name: string;
  avatar: string;
  title: string;
  location: string;
  isRemote: boolean;
  experienceYears: number;
  experienceLevel: ExperienceLevel;
  primaryCategory: JobCategory;
  skills: string[];
  bio: string;
  expectedSalary: { min: number; max: number; period: 'year' | 'month' | 'hour' };
  availability: 'Immediate' | '2 weeks' | '1 month' | 'Open to offers';
  authorizedForDiscovery: boolean;
  pastApplicationsCount?: number;
  lastActive: string;
  verifiedBadge?: boolean;
  education?: string;
  topAchievements?: string[];
  previousCompanies?: string[];
}

export type ActiveTab = 'home' | 'all_jobs' | 'feed_engine' | 'for_employers' | 'post_a_job' | 'my_profile' | 'applications' | 'admin_hub' | 'contracts';

// ============================================================================
// Resume Parsing & Job Skill Requirement Comparison Types
// ============================================================================

export interface ParsedSkillItem {
  name: string;
  category: 'Languages' | 'Frameworks' | 'Cloud & DevOps' | 'Databases & Systems' | 'AI & ML' | 'Architecture' | 'Tools & Other' | 'Soft Skills';
  proficiency?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  sourceContext?: string;
  confidence?: number;
}

export interface ParsedExperienceItem {
  role: string;
  company: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  period?: string;
  current?: boolean;
  description: string;
  extractedSkills?: string[];
}

export interface ParsedEducationItem {
  degree: string;
  field?: string;
  school: string;
  graduationYear?: string;
}

export interface ParsedResumeData {
  fileName?: string;
  fileSize?: number;
  rawText: string;
  candidateName: string;
  email?: string;
  phone?: string;
  currentTitle?: string;
  summary?: string;
  yearsOfExperience?: number;
  skills: ParsedSkillItem[];
  experience: ParsedExperienceItem[];
  education: ParsedEducationItem[];
  certifications?: string[];
  parsedAt: string;
  parseMethod: 'client_heuristic' | 'gemini_ai';
}

export interface SkillRequirementComparison {
  skill: string;
  status: 'matched' | 'missing' | 'partial';
  importance: 'mandatory' | 'high' | 'preferred';
  candidateEvidence?: string;
  missingSeverity: 'critical' | 'moderate' | 'low';
  explanation: string;
  advice: string;
  suggestedResumeBullet: string;
  interviewTalkingPoint: string;
  relatedCandidateSkills?: string[];
}

export interface ResumeJobComparisonResult {
  jobId: string;
  jobTitle: string;
  company: string;
  companyLogo?: string;
  matchScore: number;
  atsScore: number;
  qualificationStatus: 'Strong Match' | 'Good Match' | 'Moderate Gap' | 'Significant Gap';
  matchedCount: number;
  missingCount: number;
  partialCount: number;
  totalSkillsEvaluated: number;
  skillComparisons: SkillRequirementComparison[];
  missingQualifications: SkillRequirementComparison[];
  matchedSkills: SkillRequirementComparison[];
  partialSkills: SkillRequirementComparison[];
  experienceGap: {
    requiredLevel: string;
    candidateLevel: string;
    met: boolean;
    details: string;
  };
  educationAlignment: {
    met: boolean;
    details: string;
  };
  keyStrengths: string[];
  criticalMissingHighlights: string[];
  actionPlan: string[];
  tailoredCoverLetterHook: string;
  generatedAt: string;
}

export interface ResumeHealthCategoryScore {
  name: string;
  score: number; // 0-100
  benchmark: number; // e.g. 85
  status: 'pass' | 'warning' | 'fail';
  summary: string;
  details: {
    label: string;
    value: string | number;
    status: 'pass' | 'warning' | 'fail';
  }[];
}

export interface ResumeSectionScores {
  completeness: ResumeHealthCategoryScore;
  professionalSummary?: ResumeHealthCategoryScore;
  skills: ResumeHealthCategoryScore;
  workExperience: ResumeHealthCategoryScore;
  education: ResumeHealthCategoryScore;
  jobTargetRelevance: ResumeHealthCategoryScore;
  keywordsAtsCompatibility: ResumeHealthCategoryScore;
  formattingReadability: ResumeHealthCategoryScore;
  missingImportantInfo: ResumeHealthCategoryScore;
}

export interface JobMatchReadiness {
  score: number; // 0-100
  level: 'Top 5% Ready' | 'Interview Ready' | 'Near Ready' | 'Needs Optimization';
  targetRole: string;
  estimatedCallbackMultiplier: string;
  matchedRoles: string[];
  readinessFactors: string[];
  missingForNextTier: string[];
}

export interface ResumeImprovementSuggestion {
  id: string;
  category: 'impact' | 'verbs' | 'ats' | 'keywords' | 'brevity' | 'skills' | 'experience' | 'education' | 'completeness' | 'summary';
  categoryLabel: string;
  standardName: string;
  severity: 'critical' | 'recommended' | 'polish';
  title: string;
  originalSnippet: string;
  suggestedRevision: string;
  reasoning: string;
  metricImprovement: string;
  applied?: boolean;
}

export interface ResumeHealthScoreResult {
  overallScore: number;
  healthGrade: 'A+' | 'A' | 'B' | 'C' | 'D';
  healthStatusText: string;
  industryStandard: string;
  analyzedResumeName: string;
  targetRole?: string;
  wordCount: number;
  bulletCount: number;
  quantifiedPercentage: number;
  // Section-by-section scores covering all analyzed dimensions
  sectionScores: ResumeSectionScores;
  categoryScores?: {
    impactAndMetrics: ResumeHealthCategoryScore;
    actionVerbsAndTone: ResumeHealthCategoryScore;
    atsAndFormatting: ResumeHealthCategoryScore;
    keywordDensity: ResumeHealthCategoryScore;
    brevityAndReadability: ResumeHealthCategoryScore;
  };
  strengths: string[];
  problems: string[];
  suggestions: ResumeImprovementSuggestion[];
  jobMatchReadiness: JobMatchReadiness;
  quickWins: string[];
  atsReadabilityFeedback?: {
    formatCompliance: string;
    scanVerdict: string;
    readingEase: string;
    criticalAtsRules: string[];
  };
  recruiterAudit: {
    sixSecondScanVerdict: string;
    estimatedInterviewOdds: string;
    topStrengths: string[];
    criticalRisks: string[];
  };
  diagnosticsChecklist: Array<{
    item: string;
    standard: string;
    passed: boolean;
    note: string;
  }>;
  optimizedDraftPreview?: string;
  generatedAt: string;
  aiGenerated: boolean;
}

// ============================================================================
// Profile Health Score Types (Candidate & Employer)
// ============================================================================

export type ProfileHealthType = 'candidate' | 'employer';

export interface ProfileHealthDimension {
  id: string;
  name: string;
  category: string;
  score: number; // 0-100
  weight: number; // e.g. 10 or 15
  status: 'optimal' | 'warning' | 'critical';
  summary: string;
  details: string[];
  missingFields: string[];
}

export interface ProfileRecommendation {
  id: string;
  category: string;
  dimensionId: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionLabel: string;
  actionTarget?: string;
  potentialScoreGain: number; // e.g. 10
}

export interface ProfileHealthResult {
  profileType: ProfileHealthType;
  targetId: string;
  targetName: string;
  overallScore: number; // 0-100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D';
  statusText: string;
  dimensions: ProfileHealthDimension[];
  missingInformation: string[];
  warnings: string[];
  strengths: string[];
  recommendations: ProfileRecommendation[];
  calculatedAt: string;
  aiGenerated?: boolean;
}

// ============================================================================
// Admin Health Dashboard & Centralized System Health Types
// ============================================================================

export type PlatformHealthStatus = 'HEALTHY' | 'WARNING' | 'DEGRADED' | 'CRITICAL';

export interface HealthMonitorDimension {
  id: string;
  name: string;
  category: 'core_system' | 'data_feed' | 'ai_services' | 'profiles_security';
  status: PlatformHealthStatus;
  score: number; // 0-100
  summary: string;
  metrics: Record<string, string | number | boolean | null>;
  indicators: Array<{
    label: string;
    value: string | number;
    status: PlatformHealthStatus;
    trend?: 'up' | 'down' | 'stable';
  }>;
  recentIssues: string[];
  recommendations: string[];
  lastChecked: string;
}

export interface SystemIncident {
  id: string;
  timestamp: string;
  service: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  rootCause?: string;
  status: 'active' | 'investigating' | 'resolved';
  impact: string;
  suggestedAction?: string;
}

export interface SystemHealthTrendPoint {
  timestamp: string;
  timeLabel: string;
  overallScore: number;
  avgLatencyMs: number;
  errorRatePercent: number;
  activeJobs: number;
  feedSuccessRate: number;
}

export interface AdminHealthRecommendation {
  id: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  service: string;
  title: string;
  description: string;
  actionLabel: string;
  actionType: string;
  estimatedImpact: string;
  safeAction: boolean;
}

export interface CentralizedSystemHealthReport {
  overallStatus: PlatformHealthStatus;
  overallHealthScore: number; // 0-100
  statusSummary: string;
  monitoredDimensions: {
    applicationServer: HealthMonitorDimension;
    database: HealthMonitorDimension;
    apiErrors: HealthMonitorDimension;
    authentication: HealthMonitorDimension;
    jobPublishing: HealthMonitorDimension;
    xmlFeeds: HealthMonitorDimension;
    feedFailuresRetries: HealthMonitorDimension;
    aiService: HealthMonitorDimension;
    profileHealth: HealthMonitorDimension;
    suspiciousAbnormalActivity: HealthMonitorDimension;
    recentCriticalErrors: HealthMonitorDimension;
    systemPerformance: HealthMonitorDimension;
  };
  keyMetrics: {
    totalMonitoredServices: number;
    healthyServicesCount: number;
    warningServicesCount: number;
    degradedServicesCount: number;
    criticalServicesCount: number;
    avgSystemLatencyMs: number;
    systemUptimeHours: number;
    errorRate24hPercent: number;
    activeJobsCount: number;
    xmlFeedsCount: number;
    feedSuccessRatePercent: number;
    aiRequestsSuccessPercent: number;
    candidateAvgProfileScore: number;
    employerAvgProfileScore: number;
  };
  recentIncidents: SystemIncident[];
  trends: SystemHealthTrendPoint[];
  actionableRecommendations: AdminHealthRecommendation[];
  aiAnalysis?: {
    summary: string;
    identifiedProblems: Array<{
      title: string;
      rootCause: string;
      affectedComponents: string[];
      severity: 'CRITICAL' | 'WARNING' | 'INFO';
    }>;
    actionPlan: string[];
    safetyAdvisory: string;
    generatedAt: string;
  };
  generatedAt: string;
}

// ============================================================================
// Contract Management Module Types (Standalone, Strict RBAC)
// ============================================================================

export type ContractStatus = 'draft' | 'pending' | 'active' | 'completed' | 'cancelled';

export type ContractType = 'full_time' | 'part_time' | 'contractor' | 'freelance' | 'c2c' | 'internship';

export type PaymentFrequency = 'hourly' | 'weekly' | 'bi_weekly' | 'monthly' | 'annually' | 'milestone_based';

export type ContractAuditAction = 
  | 'CREATED'
  | 'UPDATED'
  | 'SENT_TO_CANDIDATE'
  | 'ACCEPTED_BY_CANDIDATE'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'CLAUSE_MODIFIED'
  | 'TERMS_VIEWED'
  | 'DOWNLOADED'
  | 'NOTE_ADDED';

export interface ContractAuditEntry {
  id: string;
  timestamp: string; // ISO string
  action: ContractAuditAction;
  actorId: string;
  actorName: string;
  actorRole: 'employer' | 'job_seeker' | 'admin' | 'system';
  actorEmail?: string;
  summary: string;
  details?: string;
  previousStatus?: ContractStatus;
  newStatus?: ContractStatus;
  ipAddress?: string;
}

export interface ContractMilestone {
  id: string;
  title: string;
  description?: string;
  amount: number;
  dueDate?: string;
  status: 'pending' | 'completed' | 'paid';
}

export interface ContractCompensation {
  rate: number;
  currency: string;
  frequency: PaymentFrequency;
  paymentSchedule: string; // e.g. "Bi-weekly on Fridays", "Net 15"
  overtimeRate?: number;
  bonusTerms?: string;
  bonusOrIncentives?: string;
  equityTerms?: string;
  benefitsSummary?: string;
  benefits?: string[];
  milestones?: ContractMilestone[];
}

export interface Contract {
  id: string;
  contractNumber: string; // e.g. FJ-CTR-2026-0042
  title: string;
  status: ContractStatus;
  contractType: ContractType;

  // Employer Information
  employerId: string;
  companyName: string;
  employerContactName: string;
  employerEmail: string;
  employerAddress?: string;
  signatoryTitle?: string;
  employerSignedAt?: string;
  employerSignedBy?: string;

  // Candidate Information
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  candidateAddress?: string;
  candidateSignedAt?: string;
  candidateSignedBy?: string;

  // Job / Position Information
  jobId?: string;
  jobTitle: string;
  department?: string;
  workLocation: string;
  expectedHoursPerWeek?: number;

  // Dates & Timeline
  startDate: string;
  endDate?: string;
  isOngoing: boolean;
  noticePeriodDays: number;
  probationPeriodMonths?: number;

  // Compensation Terms
  compensation: ContractCompensation;

  // Legal Clauses & Conditions
  scopeOfWork: string;
  confidentialityClause: string;
  ipAssignmentClause: string;
  terminationClause: string;
  nonSolicitationClause?: string;
  governingJurisdiction: string;
  specialConditions?: string;
  customClauses?: Array<{ title: string; content: string }>;

  // Cancellation & Closure Details
  cancellationReason?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  completedAt?: string;

  // Auditing & Metadata
  createdAt: string;
  updatedAt: string;
  templateId?: string;
  history: ContractAuditEntry[];
}

export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  contractType: ContractType;
  defaultScope: string;
  defaultConfidentiality: string;
  defaultIpAssignment: string;
  defaultTermination: string;
  defaultJurisdiction: string;
  title?: string;
  noticePeriodDays?: number;
  probationPeriodMonths?: number;
  defaultCompensation?: {
    rate: number;
    currency: string;
    frequency: PaymentFrequency;
    paymentSchedule: string;
  };
  standardScope?: string;
  standardConfidentiality?: string;
  standardIpAssignment?: string;
  standardTermination?: string;
}


