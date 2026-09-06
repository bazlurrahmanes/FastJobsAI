import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  Job, 
  UserProfile, 
  Application, 
  FilterState, 
  ActiveTab, 
  JobCategory, 
  JobType, 
  ExperienceLevel,
  UserRole,
  ToastNotification,
  ChatMessage,
  ChatContextInfo,
  AdminActionProposal,
  Contract
} from '../types';
import { INITIAL_JOBS, INITIAL_USER, INITIAL_EMPLOYER, INITIAL_ADMIN, INITIAL_APPLICATIONS } from '../data/mockJobs';
import { INITIAL_CONTRACTS } from '../data/mockContracts';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from '../lib/firebase';
import {
  seedInitialJobsIfEmpty,
  subscribeToJobs,
  saveJobToFirestore,
  deleteJobFromFirestore,
  syncUserProfileToFirestore,
  fetchUserProfileFromFirestore,
  saveApplicationToFirestore,
  subscribeToApplications,
  updateApplicationStatusInFirestore,
  seedInitialContractsIfEmpty,
  subscribeToContracts,
  saveContractToFirestore
} from '../services/firestoreService';

interface JobContextType {
  // Navigation & View
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  
  // Jobs
  jobs: Job[];
  addJob: (job: Omit<Job, 'id' | 'postedAt' | 'applicantCount' | 'status'>) => Job;
  updateJob: (id: string, updates: Partial<Job>) => void;
  deleteJob: (id: string) => void;
  toggleJobStatus: (id: string) => void;
  
  // Filter & Search
  filters: FilterState;
  setSearchKeyword: (keyword: string) => void;
  setSearchLocation: (location: string) => void;
  toggleCategoryFilter: (category: JobCategory) => void;
  toggleJobTypeFilter: (jobType: JobType) => void;
  toggleExperienceFilter: (level: ExperienceLevel) => void;
  setRemoteOnly: (remoteOnly: boolean) => void;
  setMinSalary: (salary: number) => void;
  setMaxSalary: (salary: number) => void;
  setSalaryRange: (minSalary: number, maxSalary: number) => void;
  setSortBy: (sort: FilterState['sortBy']) => void;
  resetFilters: () => void;
  filteredJobs: Job[];
  
  // User & Auth
  currentUser: UserProfile | null;
  authLoading: boolean;
  login: (email: string, password?: string, role?: UserRole) => Promise<boolean>;
  signup: (data: Partial<UserProfile> & { password?: string }) => Promise<boolean>;
  loginWithGoogle: (role?: UserRole) => Promise<boolean>;
  logout: () => Promise<void>;
  switchDemoUser: (role: 'job_seeker' | 'employer' | 'admin') => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  isFirebaseConnected: boolean;
  
  // Admin AI Actions
  executeAdminAction: (proposal: AdminActionProposal, reason?: string) => Promise<{ success: boolean; message: string; auditLogId?: string }>;
  
  // Saved Jobs
  savedJobIds: string[];
  toggleSaveJob: (jobId: string) => void;
  isJobSaved: (jobId: string) => boolean;
  
  // Applications
  applications: Application[];
  applyToJob: (jobId: string, coverLetter?: string, customResumeName?: string, silentToast?: boolean) => Promise<boolean>;
  quickApplyToJob: (jobId: string) => Promise<boolean>;
  updateApplicationStatus: (appId: string, status: Application['status'], notes?: string) => void;
  hasAppliedToJob: (jobId: string) => boolean;

  // Standalone Contract Management (Strict RBAC)
  contracts: Contract[];
  contractsLoading: boolean;
  selectedContract: Contract | null;
  setSelectedContract: (contract: Contract | null) => void;
  contractModalMode: 'view' | 'create' | 'edit' | 'sign' | null;
  setContractModalMode: (mode: 'view' | 'create' | 'edit' | 'sign' | null) => void;
  createContract: (data: Partial<Contract>) => Promise<Contract>;
  updateContract: (contractId: string, updates: Partial<Contract>) => Promise<Contract>;
  sendContract: (contractId: string) => Promise<Contract>;
  acceptContract: (contractId: string, signatureName: string) => Promise<Contract>;
  cancelContract: (contractId: string, reason: string) => Promise<Contract>;
  completeContract: (contractId: string) => Promise<Contract>;
  logContractAudit: (contractId: string, action: 'DOWNLOADED' | 'TERMS_VIEWED', details?: string) => Promise<void>;
  refreshContracts: () => Promise<void>;
  
  // Modals
  selectedJob: Job | null;
  setSelectedJob: (job: Job | null) => void;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authModalMode: 'login' | 'signup';
  setAuthModalMode: (mode: 'login' | 'signup') => void;
  applyModalJob: Job | null;
  setApplyModalJob: (job: Job | null) => void;
  profileModalOpen: boolean;
  setProfileModalOpen: (open: boolean) => void;

  // Toast Notifications
  toasts: ToastNotification[];
  showToast: (toast: Omit<ToastNotification, 'id'>) => void;
  hideToast: (id?: string) => void;

  // Gemini Chatbot
  chatbotOpen: boolean;
  setChatbotOpen: (open: boolean) => void;
  toggleChatbot: () => void;
  chatMessages: ChatMessage[];
  isChatLoading: boolean;
  sendChatMessage: (content: string) => Promise<void>;
  openChatWithPrompt: (promptText: string) => void;
  clearChatMessages: () => void;
  executeChatAction: (action?: ChatMessage['suggestedAction']) => void;

  // AI Helpers
  calculateMatchScore: (job: Job) => Promise<{
    score: number;
    matchedSkills: string[];
    growthAreas: string[];
    insights: string[];
    interviewTip: string;
  }>;
}

const DEFAULT_FILTERS: FilterState = {
  keyword: '',
  location: '',
  categories: [],
  jobTypes: [],
  experienceLevels: [],
  remoteOnly: false,
  minSalary: 0,
  maxSalary: 500000,
  sortBy: 'newest'
};

const JobContext = createContext<JobContextType | undefined>(undefined);

export const JobProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');

  // Jobs state
  const [jobs, setJobs] = useState<Job[]>(() => {
    try {
      const saved = localStorage.getItem('jobxora_jobs');
      return saved ? JSON.parse(saved) : INITIAL_JOBS;
    } catch {
      return INITIAL_JOBS;
    }
  });

  // User state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('jobxora_current_user');
      return saved ? JSON.parse(saved) : INITIAL_USER;
    } catch {
      return INITIAL_USER;
    }
  });

  // Applications
  const [applications, setApplications] = useState<Application[]>(() => {
    try {
      const saved = localStorage.getItem('jobxora_applications');
      return saved ? JSON.parse(saved) : INITIAL_APPLICATIONS;
    } catch {
      return INITIAL_APPLICATIONS;
    }
  });

  // Standalone Contract Management State
  const [contracts, setContracts] = useState<Contract[]>(() => {
    try {
      const saved = localStorage.getItem('fastjobs_contracts');
      return saved ? JSON.parse(saved) : INITIAL_CONTRACTS;
    } catch {
      return INITIAL_CONTRACTS;
    }
  });
  const [contractsLoading, setContractsLoading] = useState<boolean>(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [contractModalMode, setContractModalMode] = useState<'view' | 'create' | 'edit' | 'sign' | null>(null);

  // Filters
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  // Firebase auth and connectivity state
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);

  // Modals
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [applyModalJob, setApplyModalJob] = useState<Job | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState<boolean>(false);

  // Toast Notifications
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // JobXora AI Chatbot State
  const [chatbotOpen, setChatbotOpen] = useState<boolean>(false);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-msg',
      role: 'model',
      content: `**Welcome to FastJobs AI 👋**

**Find Jobs Faster with AI**

I can help you:

* 🔎 Find and explore job opportunities
* 🏢 Research companies and employee reviews
* 💰 Compare salaries
* 📄 Improve your resume
* ✍️ Write cover letters
* 🎯 Prepare for interviews
* 📊 Compare job opportunities
* 🚀 Plan your career

Start by asking me anything about jobs or your career.`,
      timestamp: 'Just now',
      suggestedFollowups: [
        'Find Jobs',
        'Compare Jobs',
        'Research a Company',
        'Analyze Salary',
        'Improve My Resume',
        'Prepare for Interview'
      ]
    }
  ]);

  const toggleChatbot = useCallback(() => {
    setChatbotOpen(prev => !prev);
  }, []);

  const clearChatMessages = useCallback(() => {
    setChatMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'model',
        content: `**Welcome to FastJobs AI 👋**

**Find Jobs Faster with AI**

I can help you:

* 🔎 Find and explore job opportunities
* 🏢 Research companies and employee reviews
* 💰 Compare salaries
* 📄 Improve your resume
* ✍️ Write cover letters
* 🎯 Prepare for interviews
* 📊 Compare job opportunities
* 🚀 Plan your career

Start by asking me anything about jobs or your career.`,
        timestamp: 'Just now',
        suggestedFollowups: [
          'Find Jobs',
          'Compare Jobs',
          'Research a Company',
          'Analyze Salary',
          'Improve My Resume',
          'Prepare for Interview'
        ]
      }
    ]);
  }, []);

  const hideToast = useCallback((id?: string) => {
    if (!id) {
      setToasts([]);
    } else {
      setToasts(prev => prev.filter(t => t.id !== id));
    }
  }, []);

  const showToast = useCallback((toastData: Omit<ToastNotification, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newToast: ToastNotification = { ...toastData, id };
    
    setToasts(prev => [newToast, ...prev.slice(0, 2)]);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      hideToast(id);
    }, 5000);
  }, [hideToast]);

  // Initialize Firestore seeding & jobs listener
  useEffect(() => {
    // Seed initial jobs if firestore collection is empty
    seedInitialJobsIfEmpty().catch(err => {
      console.warn('Initial seeding error:', err);
    });

    // Realtime listener for jobs
    const unsubscribeJobs = subscribeToJobs(
      (remoteJobs) => {
        if (remoteJobs && remoteJobs.length > 0) {
          setJobs(remoteJobs);
          setIsFirebaseConnected(true);
        }
      },
      (err) => {
        console.warn('Firestore jobs sync error, falling back to local state:', err);
        setIsFirebaseConnected(false);
      }
    );

    return () => {
      unsubscribeJobs();
    };
  }, []);

  // Persist contracts locally
  useEffect(() => {
    try {
      localStorage.setItem('fastjobs_contracts', JSON.stringify(contracts));
    } catch (err) {
      console.warn('Failed to persist contracts to localStorage:', err);
    }
  }, [contracts]);

  // Realtime listener & seeding for standalone contracts
  useEffect(() => {
    seedInitialContractsIfEmpty().catch(err => {
      console.warn('Initial contracts seeding error:', err);
    });

    const unsubscribeContracts = subscribeToContracts(
      (remoteContracts) => {
        if (remoteContracts && remoteContracts.length > 0) {
          setContracts(remoteContracts);
        }
      },
      currentUser?.id,
      currentUser?.email,
      currentUser?.role
    );

    return () => {
      unsubscribeContracts();
    };
  }, [currentUser?.id, currentUser?.email, currentUser?.role]);

  // Firebase Auth state listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      setAuthLoading(true);
      if (fbUser) {
        // Fetch or create profile in Firestore
        try {
          const profile = await fetchUserProfileFromFirestore(fbUser.uid);
          if (profile) {
            setCurrentUser({
              ...profile,
              isFirebaseUser: true,
              authProvider: fbUser.providerData[0]?.providerId === 'google.com' ? 'google' : 'password'
            });
          } else {
            // New Firebase user without stored profile
            const newProfile: UserProfile = {
              id: fbUser.uid,
              email: fbUser.email || 'user@fastjobs.io',
              name: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'FastJobs User'),
              role: 'job_seeker',
              avatar: fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
              title: 'AI & Systems Specialist',
              bio: 'Active candidate profile powered by FastJobs and Firebase.',
              location: 'Remote',
              skills: [
                { name: 'TypeScript', level: 'Expert' },
                { name: 'React', level: 'Advanced' }
              ],
              experience: [],
              education: [],
              savedJobIds: [],
              isFirebaseUser: true,
              authProvider: fbUser.providerData[0]?.providerId === 'google.com' ? 'google' : 'password'
            };
            await syncUserProfileToFirestore(newProfile);
            setCurrentUser(newProfile);
          }
        } catch (e) {
          console.error('Error syncing auth state with firestore:', e);
        }
      } else {
        // If not logged in to Firebase and user is marked as firebase user, clear user
        setCurrentUser(prev => (prev?.isFirebaseUser ? null : prev));
      }
      setAuthLoading(false);
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  // Realtime listener for applications
  useEffect(() => {
    if (!currentUser) return;
    const unsubApps = subscribeToApplications(
      currentUser.id,
      currentUser.role,
      (remoteApps) => {
        if (remoteApps && remoteApps.length > 0) {
          setApplications(remoteApps);
        }
      }
    );
    return () => unsubApps();
  }, [currentUser?.id, currentUser?.role]);

  // Persist jobs
  useEffect(() => {
    try {
      localStorage.setItem('jobxora_jobs', JSON.stringify(jobs));
    } catch (e) {
      console.error('Failed to persist jobs', e);
    }
  }, [jobs]);

  // Persist current user
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('jobxora_current_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('jobxora_current_user');
      }
    } catch (e) {
      console.error('Failed to persist user', e);
    }
  }, [currentUser]);

  // Persist applications
  useEffect(() => {
    try {
      localStorage.setItem('jobxora_applications', JSON.stringify(applications));
    } catch (e) {
      console.error('Failed to persist applications', e);
    }
  }, [applications]);

  // Saved jobs IDs
  const savedJobIds = currentUser?.savedJobIds || [];

  const toggleSaveJob = (jobId: string) => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }
    const exists = savedJobIds.includes(jobId);
    const updated = exists 
      ? savedJobIds.filter(id => id !== jobId)
      : [...savedJobIds, jobId];

    setCurrentUser({
      ...currentUser,
      savedJobIds: updated
    });
  };

  const isJobSaved = (jobId: string) => savedJobIds.includes(jobId);

  // Filter modifiers
  const setSearchKeyword = (keyword: string) => setFilters(prev => ({ ...prev, keyword }));
  const setSearchLocation = (location: string) => setFilters(prev => ({ ...prev, location }));
  
  const toggleCategoryFilter = (category: JobCategory) => {
    setFilters(prev => {
      const exists = prev.categories.includes(category);
      return {
        ...prev,
        categories: exists 
          ? prev.categories.filter(c => c !== category)
          : [...prev.categories, category]
      };
    });
  };

  const toggleJobTypeFilter = (jobType: JobType) => {
    setFilters(prev => {
      const exists = prev.jobTypes.includes(jobType);
      return {
        ...prev,
        jobTypes: exists 
          ? prev.jobTypes.filter(t => t !== jobType)
          : [...prev.jobTypes, jobType]
      };
    });
  };

  const toggleExperienceFilter = (level: ExperienceLevel) => {
    setFilters(prev => {
      const exists = prev.experienceLevels.includes(level);
      return {
        ...prev,
        experienceLevels: exists 
          ? prev.experienceLevels.filter(l => l !== level)
          : [...prev.experienceLevels, level]
      };
    });
  };

  const setRemoteOnly = (remoteOnly: boolean) => setFilters(prev => ({ ...prev, remoteOnly }));
  const setMinSalary = (minSalary: number) => setFilters(prev => ({ ...prev, minSalary }));
  const setMaxSalary = (maxSalary: number) => setFilters(prev => ({ ...prev, maxSalary }));
  const setSalaryRange = (minSalary: number, maxSalary: number) => setFilters(prev => ({ ...prev, minSalary, maxSalary }));
  const setSortBy = (sortBy: FilterState['sortBy']) => setFilters(prev => ({ ...prev, sortBy }));
  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  // Filtered and Sorted Jobs logic
  const filteredJobs = jobs.filter(job => {
    // Keyword match across title, company, skills, description
    if (filters.keyword.trim()) {
      const q = filters.keyword.toLowerCase().trim();
      const matchTitle = job.title.toLowerCase().includes(q);
      const matchCompany = job.company.toLowerCase().includes(q);
      const matchSkills = job.skills.some(s => s.toLowerCase().includes(q));
      const matchCategory = job.category.toLowerCase().includes(q);
      const matchDesc = job.description.toLowerCase().includes(q);
      if (!matchTitle && !matchCompany && !matchSkills && !matchCategory && !matchDesc) {
        return false;
      }
    }

    // Location filter
    if (filters.location.trim()) {
      const loc = filters.location.toLowerCase().trim();
      const jobLoc = job.location.toLowerCase();
      const isMatchLoc = jobLoc.includes(loc) || (loc === 'remote' && job.isRemote);
      if (!isMatchLoc) return false;
    }

    // Remote Only
    if (filters.remoteOnly && !job.isRemote) {
      return false;
    }

    // Categories
    if (filters.categories.length > 0 && !filters.categories.includes(job.category)) {
      return false;
    }

    // Job Types
    if (filters.jobTypes.length > 0 && !filters.jobTypes.includes(job.jobType)) {
      return false;
    }

    // Experience Levels
    if (filters.experienceLevels.length > 0 && !filters.experienceLevels.includes(job.experienceLevel)) {
      return false;
    }

    // Salary Range (Min & Max)
    if (job.salaryPeriod === 'year') {
      if (filters.minSalary > 0 && job.salaryMax < filters.minSalary) {
        return false;
      }
      if (filters.maxSalary < 500000 && job.salaryMin > filters.maxSalary) {
        return false;
      }
    } else if (job.salaryPeriod === 'hour') {
      // Annualized hourly equivalent for filtering
      const annualMin = job.salaryMin * 2080;
      const annualMax = job.salaryMax * 2080;
      if (filters.minSalary > 0 && annualMax < filters.minSalary) {
        return false;
      }
      if (filters.maxSalary < 500000 && annualMin > filters.maxSalary) {
        return false;
      }
    }

    return true;
  }).sort((a, b) => {
    if (filters.sortBy === 'salary_high') {
      return (b.salaryMax || 0) - (a.salaryMax || 0);
    }
    if (filters.sortBy === 'match_score') {
      return (b.matchScore || 0) - (a.matchScore || 0);
    }
    if (filters.sortBy === 'featured') {
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    }
    // Default newest (featured first, then id/posted)
    return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
  });

  // Add Job (stores in state & Firestore)
  const addJob = (jobData: Omit<Job, 'id' | 'postedAt' | 'applicantCount' | 'status'>): Job => {
    const newJob: Job = {
      ...jobData,
      id: `job-${Date.now()}`,
      postedAt: 'Just now',
      applicantCount: 0,
      status: 'active',
      matchScore: 90
    };

    setJobs(prev => [newJob, ...prev]);

    // Persist to Cloud Firestore
    saveJobToFirestore(newJob).catch(err => {
      console.warn('Could not save job to Firestore:', err);
    });

    return newJob;
  };

  const updateJob = (id: string, updates: Partial<Job>) => {
    let updatedJob: Job | null = null;
    setJobs(prev => prev.map(j => {
      if (j.id === id) {
        updatedJob = { ...j, ...updates };
        return updatedJob;
      }
      return j;
    }));

    if (updatedJob) {
      saveJobToFirestore(updatedJob).catch(err => {
        console.warn('Could not update job in Firestore:', err);
      });
    }
  };

  const deleteJob = (id: string) => {
    setJobs(prev => prev.filter(j => j.id !== id));
    deleteJobFromFirestore(id).catch(err => {
      console.warn('Could not delete job from Firestore:', err);
    });
  };

  const toggleJobStatus = (id: string) => {
    let updatedJob: Job | null = null;
    setJobs(prev => prev.map(j => {
      if (j.id === id) {
        const nextStatus = j.status === 'active' ? 'paused' : 'active';
        updatedJob = { ...j, status: nextStatus };
        return updatedJob;
      }
      return j;
    }));

    if (updatedJob) {
      saveJobToFirestore(updatedJob).catch(err => {
        console.warn('Could not toggle status in Firestore:', err);
      });
    }
  };

  // Firebase Auth methods
  const login = async (email: string, password?: string, role?: UserRole): Promise<boolean> => {
    try {
      if (password) {
        // Authenticate with Firebase Auth
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const fbUser = cred.user;
        const storedProfile = await fetchUserProfileFromFirestore(fbUser.uid);
        if (storedProfile) {
          setCurrentUser({
            ...storedProfile,
            isFirebaseUser: true,
            authProvider: 'password'
          });
        }
        setAuthModalOpen(false);
        showToast({
          title: 'Welcome Back!',
          message: `Signed in as ${fbUser.email}`,
          type: 'success'
        });
        return true;
      } else {
        // Quick fallback for demo / passwordless
        if (email.includes('employer') || role === 'employer') {
          setCurrentUser(INITIAL_EMPLOYER);
        } else {
          setCurrentUser({
            ...INITIAL_USER,
            email: email || INITIAL_USER.email
          });
        }
        setAuthModalOpen(false);
        return true;
      }
    } catch (err: any) {
      console.error('Firebase sign in error:', err);
      showToast({
        title: 'Sign In Failed',
        message: err.message || 'Could not sign in with provided credentials.',
        type: 'error'
      });
      return false;
    }
  };

  const signup = async (data: Partial<UserProfile> & { password?: string }): Promise<boolean> => {
    try {
      if (data.email && data.password) {
        // Create account in Firebase Auth
        const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
        const fbUser = cred.user;

        const newProfile: UserProfile = {
          id: fbUser.uid,
          email: data.email,
          name: data.name || 'FastJobs Professional',
          role: data.role || 'job_seeker',
          avatar: data.avatar || (data.role === 'employer' 
            ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' 
            : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
          title: data.title || (data.role === 'employer' ? 'Hiring Lead' : 'Software Professional'),
          bio: data.bio || '',
          location: data.location || 'Remote',
          skills: data.skills || [
            { name: 'TypeScript', level: 'Expert' },
            { name: 'React', level: 'Advanced' }
          ],
          experience: data.experience || [],
          education: data.education || [],
          companyName: data.companyName || (data.role === 'employer' ? 'InnovateTech Labs' : undefined),
          savedJobIds: [],
          isFirebaseUser: true,
          authProvider: 'password'
        };

        // Persist profile to Firestore
        await syncUserProfileToFirestore(newProfile);
        setCurrentUser(newProfile);
        setAuthModalOpen(false);

        showToast({
          title: 'Account Created!',
          message: `Welcome to FastJobs, ${newProfile.name}`,
          type: 'success'
        });
        return true;
      } else {
        // Fallback demo signup
        const newUser: UserProfile = {
          id: `user-${Date.now()}`,
          email: data.email || 'user@fastjobs.io',
          name: data.name || 'Professional User',
          role: data.role || 'job_seeker',
          avatar: data.avatar || (data.role === 'employer' 
            ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' 
            : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
          title: data.title || (data.role === 'employer' ? 'Hiring Lead' : 'Software Professional'),
          bio: data.bio || '',
          location: data.location || 'Remote',
          skills: data.skills || [
            { name: 'TypeScript', level: 'Expert' },
            { name: 'React', level: 'Advanced' }
          ],
          experience: data.experience || [],
          education: data.education || [],
          companyName: data.companyName || (data.role === 'employer' ? 'InnovateTech Labs' : undefined),
          savedJobIds: []
        };
        setCurrentUser(newUser);
        setAuthModalOpen(false);
        return true;
      }
    } catch (err: any) {
      console.error('Firebase sign up error:', err);
      showToast({
        title: 'Registration Error',
        message: err.message || 'Could not create account.',
        type: 'error'
      });
      return false;
    }
  };

  const loginWithGoogle = async (role: UserRole = 'job_seeker'): Promise<boolean> => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const fbUser = res.user;

      let profile = await fetchUserProfileFromFirestore(fbUser.uid);
      if (!profile) {
        profile = {
          id: fbUser.uid,
          email: fbUser.email || 'user@fastjobs.io',
          name: fbUser.displayName || 'FastJobs User',
          role,
          avatar: fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          title: role === 'employer' ? 'Technical Recruiter' : 'Software Engineer',
          bio: 'Verified FastJobs profile synced with Google & Firebase Authentication.',
          location: 'Remote',
          skills: [
            { name: 'TypeScript', level: 'Expert' },
            { name: 'React', level: 'Advanced' }
          ],
          experience: [],
          education: [],
          savedJobIds: [],
          isFirebaseUser: true,
          authProvider: 'google'
        };
        await syncUserProfileToFirestore(profile);
      }

      setCurrentUser({
        ...profile,
        isFirebaseUser: true,
        authProvider: 'google'
      });
      setAuthModalOpen(false);

      showToast({
        title: 'Signed in with Google',
        message: `Welcome, ${fbUser.displayName || fbUser.email}!`,
        type: 'success'
      });
      return true;
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      showToast({
        title: 'Google Sign In Failed',
        message: err.message || 'Popup closed or authentication interrupted.',
        type: 'error'
      });
      return false;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Sign out error:', e);
    }
    setCurrentUser(null);
    showToast({
      title: 'Signed Out',
      message: 'You have been logged out of your account.',
      type: 'info'
    });
  };

  const switchDemoUser = (role: 'job_seeker' | 'employer' | 'admin') => {
    if (role === 'admin') {
      setCurrentUser(INITIAL_ADMIN);
      setActiveTab('admin_hub');
    } else if (role === 'employer') {
      setCurrentUser(INITIAL_EMPLOYER);
      setActiveTab('for_employers');
    } else {
      setCurrentUser(INITIAL_USER);
      setActiveTab('all_jobs');
    }
  };

  const executeAdminAction = async (proposal: AdminActionProposal, reason?: string): Promise<{ success: boolean; message: string; auditLogId?: string }> => {
    try {
      const res = await fetch('/api/admin/ai/execute-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-role': 'admin'
        },
        body: JSON.stringify({
          actionType: proposal.actionType,
          targetId: proposal.targetId,
          reason: reason || proposal.explanation,
          adminUserId: currentUser?.id || 'usr_admin_master',
          confirmed: true,
          parameters: proposal.parameters
        })
      });

      const data = await res.json();
      if (!res.ok) {
        showToast({
          title: 'Action Execution Failed',
          message: data.error || 'Failed to execute administrative action.',
          type: 'error'
        });
        return { success: false, message: data.error };
      }

      showToast({
        title: 'Action Executed & Audited',
        message: data.message || 'Action executed successfully.',
        type: 'success'
      });
      return data;
    } catch (err: any) {
      showToast({
        title: 'Execution Error',
        message: err.message || 'Network error executing action',
        type: 'error'
      });
      return { success: false, message: err.message };
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);
    // Persist to Cloud Firestore if connected / user ID exists
    try {
      await syncUserProfileToFirestore(updated);
    } catch (e) {
      console.warn('Could not sync user profile to Firestore:', e);
    }
  };

  // Applications
  const applyToJob = async (
    jobId: string, 
    coverLetter?: string, 
    customResumeName?: string,
    silentToast?: boolean
  ): Promise<boolean> => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return false;
    }

    const job = jobs.find(j => j.id === jobId);
    if (!job) return false;

    // Check if already applied
    if (hasAppliedToJob(jobId)) {
      if (!silentToast) {
        showToast({
          title: 'Already Applied',
          message: `You have already submitted an application for ${job.title} at ${job.company}.`,
          type: 'info',
          companyLogo: job.companyLogo,
          companyName: job.company,
          actionLabel: 'View in Profile',
          onAction: () => setActiveTab('my_profile')
        });
      }
      return true;
    }

    // Calculate match score
    const matchAnalysis = await calculateMatchScore(job);
    const resumeFile = customResumeName || currentUser.resumeFileName || 'Alex_Chen_Resume_2026.pdf';

    const newApp: Application = {
      id: `app-${Date.now()}`,
      jobId: job.id,
      jobTitle: job.title,
      companyName: job.company,
      companyLogo: job.companyLogo,
      applicantId: currentUser.id,
      applicantName: currentUser.name,
      applicantEmail: currentUser.email,
      applicantAvatar: currentUser.avatar,
      applicantTitle: currentUser.title || 'Applicant',
      applicantSkills: currentUser.skills.map(s => s.name),
      resumeFileName: resumeFile,
      coverLetter: coverLetter || '',
      matchScore: matchAnalysis.score,
      matchInsights: matchAnalysis.insights,
      appliedAt: 'Just now',
      status: 'submitted'
    };

    setApplications(prev => [newApp, ...prev]);

    // Save to Firestore
    saveApplicationToFirestore(newApp).catch(err => {
      console.warn('Could not persist application to Firestore:', err);
    });

    // Increment applicant count on job
    setJobs(prev => prev.map(j => {
      if (j.id === jobId) {
        const updated = { ...j, applicantCount: j.applicantCount + 1 };
        saveJobToFirestore(updated).catch(console.warn);
        return updated;
      }
      return j;
    }));

    if (!silentToast) {
      showToast({
        title: 'Application Submitted!',
        message: `Successfully applied to ${job.title} at ${job.company} using your primary resume profile.`,
        type: 'success',
        companyLogo: job.companyLogo,
        companyName: job.company,
        jobTitle: job.title,
        resumeFileName: resumeFile,
        actionLabel: 'Track Application Status',
        onAction: () => setActiveTab('my_profile')
      });
    }

    return true;
  };

  // Quick Apply 1-Click using primary resume profile
  const quickApplyToJob = async (jobId: string): Promise<boolean> => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return false;
    }

    const job = jobs.find(j => j.id === jobId);
    if (!job) return false;

    if (hasAppliedToJob(jobId)) {
      showToast({
        title: 'Already Applied',
        message: `You have already applied to ${job.title} at ${job.company}.`,
        type: 'info',
        companyLogo: job.companyLogo,
        companyName: job.company,
        actionLabel: 'View Application',
        onAction: () => setActiveTab('my_profile')
      });
      return true;
    }

    const primaryResume = currentUser.resumeFileName || 'Alex_Chen_Resume_AI_Engineer_2026.pdf';
    const matchAnalysis = await calculateMatchScore(job);

    const autoIntro = `Quick Application submitted using verified FastJobs candidate profile for ${currentUser.name} (${currentUser.title || 'Software Professional'}). Key competencies include ${currentUser.skills.slice(0, 4).map(s => s.name).join(', ')}.`;

    const newApp: Application = {
      id: `app-${Date.now()}`,
      jobId: job.id,
      jobTitle: job.title,
      companyName: job.company,
      companyLogo: job.companyLogo,
      applicantId: currentUser.id,
      applicantName: currentUser.name,
      applicantEmail: currentUser.email,
      applicantAvatar: currentUser.avatar,
      applicantTitle: currentUser.title || 'Applicant',
      applicantSkills: currentUser.skills.map(s => s.name),
      resumeFileName: primaryResume,
      coverLetter: autoIntro,
      matchScore: matchAnalysis.score,
      matchInsights: matchAnalysis.insights,
      appliedAt: 'Just now',
      status: 'submitted'
    };

    setApplications(prev => [newApp, ...prev]);

    // Save to Firestore
    saveApplicationToFirestore(newApp).catch(err => {
      console.warn('Could not persist application to Firestore:', err);
    });

    // Increment applicant count on job
    setJobs(prev => prev.map(j => {
      if (j.id === jobId) {
        const updated = { ...j, applicantCount: j.applicantCount + 1 };
        saveJobToFirestore(updated).catch(console.warn);
        return updated;
      }
      return j;
    }));

    // Show high visibility rich toast
    showToast({
      title: 'Quick Application Submitted!',
      message: `Directly applied to ${job.title} at ${job.company} with your verified profile and primary resume.`,
      type: 'success',
      companyLogo: job.companyLogo,
      companyName: job.company,
      jobTitle: job.title,
      resumeFileName: primaryResume,
      actionLabel: 'View in Applications',
      onAction: () => setActiveTab('my_profile')
    });

    return true;
  };

  const updateApplicationStatus = (appId: string, status: Application['status'], notes?: string) => {
    setApplications(prev => prev.map(a => {
      if (a.id === appId) {
        const updated = {
          ...a,
          status,
          employerNotes: notes !== undefined ? notes : a.employerNotes
        };
        // Persist status change to Firestore
        updateApplicationStatusInFirestore(appId, status, notes).catch(err => {
          console.warn('Could not update application status in Firestore:', err);
        });
        return updated;
      }
      return a;
    }));
  };

  const hasAppliedToJob = (jobId: string) => {
    if (!currentUser) return false;
    return applications.some(a => a.jobId === jobId && a.applicantId === currentUser.id);
  };

  // ============================================================================
  // Standalone Contract Management Actions (Strict RBAC & Audit Trail)
  // ============================================================================

  const refreshContracts = useCallback(async () => {
    if (!currentUser) return;
    setContractsLoading(true);
    try {
      const res = await fetch('/api/contracts', {
        headers: {
          'x-user-id': currentUser.id,
          'x-user-role': currentUser.role,
          'x-user-email': currentUser.email,
          'x-user-name': currentUser.name
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.contracts) {
          setContracts(data.contracts);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch contracts from backend:', err);
    } finally {
      setContractsLoading(false);
    }
  }, [currentUser]);

  const createContract = useCallback(async (data: Partial<Contract>): Promise<Contract> => {
    if (!currentUser) throw new Error('You must be signed in to create a contract');
    
    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
          'x-user-role': currentUser.role,
          'x-user-email': currentUser.email,
          'x-user-name': currentUser.name
        },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create contract on server');
      }

      const result = await res.json();
      const newContract: Contract = result.contract;
      
      setContracts(prev => [newContract, ...prev.filter(c => c.id !== newContract.id)]);
      await saveContractToFirestore(newContract).catch(() => {});
      
      showToast({
        type: 'success',
        title: 'Contract Created',
        message: `Contract ${newContract.contractNumber} (${newContract.status}) successfully generated.`
      });
      return newContract;
    } catch (err: any) {
      console.warn('Backend createContract encountered error, using local fallback:', err);
      const now = new Date().toISOString();
      const fallbackId = `ctr-${Date.now()}`;
      const contractNumber = `FJ-CTR-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const fallbackContract: Contract = {
        id: fallbackId,
        contractNumber,
        title: data.title || 'Employment Agreement',
        status: data.status || 'draft',
        contractType: data.contractType || 'full_time',
        employerId: currentUser.id,
        companyName: currentUser.companyName || currentUser.name,
        employerContactName: currentUser.name,
        employerEmail: currentUser.email,
        employerAddress: currentUser.location,
        candidateId: data.candidateId || `usr_${Date.now()}`,
        candidateName: data.candidateName || 'Candidate',
        candidateEmail: data.candidateEmail || '',
        candidatePhone: data.candidatePhone,
        candidateAddress: data.candidateAddress,
        jobId: data.jobId,
        jobTitle: data.jobTitle || 'Contractor Role',
        department: data.department,
        workLocation: data.workLocation || 'Remote',
        expectedHoursPerWeek: data.expectedHoursPerWeek || 40,
        startDate: data.startDate || new Date().toISOString().split('T')[0],
        endDate: data.endDate,
        isOngoing: data.isOngoing ?? true,
        noticePeriodDays: data.noticePeriodDays || 14,
        probationPeriodMonths: data.probationPeriodMonths || 0,
        compensation: data.compensation || {
          rate: 100000,
          currency: 'USD',
          frequency: 'annually',
          paymentSchedule: 'Bi-weekly'
        },
        scopeOfWork: data.scopeOfWork || 'Scope as agreed.',
        confidentialityClause: data.confidentialityClause || 'Strict confidentiality.',
        ipAssignmentClause: data.ipAssignmentClause || 'Work made for hire IP assignment.',
        terminationClause: data.terminationClause || 'Either party may terminate upon 14 days notice.',
        governingJurisdiction: data.governingJurisdiction || 'State of California, USA',
        createdAt: now,
        updatedAt: now,
        history: [
          {
            id: `aud-${Date.now()}`,
            timestamp: now,
            action: 'CREATED',
            actorId: currentUser.id,
            actorName: currentUser.name,
            actorRole: currentUser.role,
            actorEmail: currentUser.email,
            summary: 'Contract created by employer',
            newStatus: data.status || 'draft'
          }
        ]
      };
      setContracts(prev => [fallbackContract, ...prev]);
      await saveContractToFirestore(fallbackContract).catch(() => {});
      showToast({
        type: 'success',
        title: 'Contract Created',
        message: `Contract ${contractNumber} drafted.`
      });
      return fallbackContract;
    }
  }, [currentUser, showToast]);

  const updateContract = useCallback(async (contractId: string, updates: Partial<Contract>): Promise<Contract> => {
    if (!currentUser) throw new Error('You must be signed in to edit a contract');

    try {
      const res = await fetch(`/api/contracts/${contractId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
          'x-user-role': currentUser.role,
          'x-user-email': currentUser.email,
          'x-user-name': currentUser.name
        },
        body: JSON.stringify(updates)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update contract');
      }

      const result = await res.json();
      const updated: Contract = result.contract;
      
      setContracts(prev => prev.map(c => c.id === contractId ? updated : c));
      if (selectedContract?.id === contractId) {
        setSelectedContract(updated);
      }
      await saveContractToFirestore(updated).catch(() => {});

      showToast({
        type: 'success',
        title: 'Contract Updated',
        message: `Contract ${updated.contractNumber} terms updated.`
      });
      return updated;
    } catch (err: any) {
      console.warn('Backend updateContract failed, using local update:', err);
      let updatedContract: Contract | null = null;
      setContracts(prev => prev.map(c => {
        if (c.id === contractId) {
          const now = new Date().toISOString();
          const audit: any = {
            id: `aud-${Date.now()}`,
            timestamp: now,
            action: 'UPDATED',
            actorId: currentUser.id,
            actorName: currentUser.name,
            actorRole: currentUser.role,
            actorEmail: currentUser.email,
            summary: 'Contract terms updated',
            previousStatus: c.status,
            newStatus: c.status
          };
          updatedContract = {
            ...c,
            ...updates,
            updatedAt: now,
            history: [...(c.history || []), audit]
          };
          return updatedContract;
        }
        return c;
      }));
      if (updatedContract) {
        if (selectedContract?.id === contractId) setSelectedContract(updatedContract);
        await saveContractToFirestore(updatedContract).catch(() => {});
        showToast({
          type: 'success',
          title: 'Contract Updated',
          message: 'Changes saved locally.'
        });
        return updatedContract;
      }
      throw err;
    }
  }, [currentUser, selectedContract, showToast]);

  const sendContract = useCallback(async (contractId: string): Promise<Contract> => {
    if (!currentUser) throw new Error('You must be signed in to send a contract');

    try {
      const res = await fetch(`/api/contracts/${contractId}/send`, {
        method: 'POST',
        headers: {
          'x-user-id': currentUser.id,
          'x-user-role': currentUser.role,
          'x-user-email': currentUser.email,
          'x-user-name': currentUser.name
        }
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to dispatch contract');
      }

      const result = await res.json();
      const updated: Contract = result.contract;

      setContracts(prev => prev.map(c => c.id === contractId ? updated : c));
      if (selectedContract?.id === contractId) {
        setSelectedContract(updated);
      }
      await saveContractToFirestore(updated).catch(() => {});

      showToast({
        type: 'success',
        title: 'Contract Sent to Candidate',
        message: `Contract ${updated.contractNumber} dispatched to ${updated.candidateEmail} for execution.`
      });
      return updated;
    } catch (err: any) {
      console.warn('Backend sendContract failed, using local update:', err);
      let updatedContract: Contract | null = null;
      setContracts(prev => prev.map(c => {
        if (c.id === contractId) {
          const now = new Date().toISOString();
          const audit: any = {
            id: `aud-${Date.now()}`,
            timestamp: now,
            action: 'SENT_TO_CANDIDATE',
            actorId: currentUser.id,
            actorName: currentUser.name,
            actorRole: currentUser.role,
            actorEmail: currentUser.email,
            summary: 'Contract sent to candidate for signature',
            previousStatus: c.status,
            newStatus: 'pending'
          };
          updatedContract = {
            ...c,
            status: 'pending',
            employerSignedAt: now,
            employerSignedBy: `${currentUser.name} (Authorized Signatory)`,
            updatedAt: now,
            history: [...(c.history || []), audit]
          };
          return updatedContract;
        }
        return c;
      }));
      if (updatedContract) {
        if (selectedContract?.id === contractId) setSelectedContract(updatedContract);
        await saveContractToFirestore(updatedContract).catch(() => {});
        showToast({
          type: 'success',
          title: 'Contract Sent',
          message: 'Contract marked as pending signature.'
        });
        return updatedContract;
      }
      throw err;
    }
  }, [currentUser, selectedContract, showToast]);

  const acceptContract = useCallback(async (contractId: string, signatureName: string): Promise<Contract> => {
    if (!currentUser) throw new Error('You must be signed in to sign a contract');

    try {
      const res = await fetch(`/api/contracts/${contractId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
          'x-user-role': currentUser.role,
          'x-user-email': currentUser.email,
          'x-user-name': currentUser.name
        },
        body: JSON.stringify({ signatureName })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to sign contract');
      }

      const result = await res.json();
      const updated: Contract = result.contract;

      setContracts(prev => prev.map(c => c.id === contractId ? updated : c));
      if (selectedContract?.id === contractId) {
        setSelectedContract(updated);
      }
      await saveContractToFirestore(updated).catch(() => {});

      showToast({
        type: 'success',
        title: 'Contract Executed & Active!',
        message: `You have successfully accepted and signed contract ${updated.contractNumber}.`
      });
      return updated;
    } catch (err: any) {
      console.warn('Backend acceptContract failed, using local update:', err);
      let updatedContract: Contract | null = null;
      setContracts(prev => prev.map(c => {
        if (c.id === contractId) {
          const now = new Date().toISOString();
          const audit: any = {
            id: `aud-${Date.now()}`,
            timestamp: now,
            action: 'ACCEPTED_BY_CANDIDATE',
            actorId: currentUser.id,
            actorName: currentUser.name,
            actorRole: currentUser.role,
            actorEmail: currentUser.email,
            summary: 'Contract accepted and digitally signed by candidate',
            details: `Candidate signed as "${signatureName}".`,
            previousStatus: c.status,
            newStatus: 'active'
          };
          updatedContract = {
            ...c,
            status: 'active',
            candidateSignedAt: now,
            candidateSignedBy: `${signatureName} (Digital Signature Verified)`,
            updatedAt: now,
            history: [...(c.history || []), audit]
          };
          return updatedContract;
        }
        return c;
      }));
      if (updatedContract) {
        if (selectedContract?.id === contractId) setSelectedContract(updatedContract);
        await saveContractToFirestore(updatedContract).catch(() => {});
        showToast({
          type: 'success',
          title: 'Contract Activated',
          message: 'Signed agreement recorded.'
        });
        return updatedContract;
      }
      throw err;
    }
  }, [currentUser, selectedContract, showToast]);

  const cancelContract = useCallback(async (contractId: string, reason: string): Promise<Contract> => {
    if (!currentUser) throw new Error('You must be signed in to cancel a contract');

    try {
      const res = await fetch(`/api/contracts/${contractId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
          'x-user-role': currentUser.role,
          'x-user-email': currentUser.email,
          'x-user-name': currentUser.name
        },
        body: JSON.stringify({ reason })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to cancel contract');
      }

      const result = await res.json();
      const updated: Contract = result.contract;

      setContracts(prev => prev.map(c => c.id === contractId ? updated : c));
      if (selectedContract?.id === contractId) {
        setSelectedContract(updated);
      }
      await saveContractToFirestore(updated).catch(() => {});

      showToast({
        type: 'info',
        title: 'Contract Cancelled',
        message: `Contract ${updated.contractNumber} has been cancelled.`
      });
      return updated;
    } catch (err: any) {
      console.warn('Backend cancelContract failed, using local update:', err);
      let updatedContract: Contract | null = null;
      setContracts(prev => prev.map(c => {
        if (c.id === contractId) {
          const now = new Date().toISOString();
          const audit: any = {
            id: `aud-${Date.now()}`,
            timestamp: now,
            action: 'CANCELLED',
            actorId: currentUser.id,
            actorName: currentUser.name,
            actorRole: currentUser.role,
            actorEmail: currentUser.email,
            summary: `Contract cancelled by ${currentUser.role}`,
            details: `Reason: ${reason}`,
            previousStatus: c.status,
            newStatus: 'cancelled'
          };
          updatedContract = {
            ...c,
            status: 'cancelled',
            cancellationReason: reason,
            cancelledBy: `${currentUser.name} (${currentUser.role})`,
            cancelledAt: now,
            updatedAt: now,
            history: [...(c.history || []), audit]
          };
          return updatedContract;
        }
        return c;
      }));
      if (updatedContract) {
        if (selectedContract?.id === contractId) setSelectedContract(updatedContract);
        await saveContractToFirestore(updatedContract).catch(() => {});
        showToast({
          type: 'info',
          title: 'Contract Cancelled',
          message: 'Cancellation recorded.'
        });
        return updatedContract;
      }
      throw err;
    }
  }, [currentUser, selectedContract, showToast]);

  const completeContract = useCallback(async (contractId: string): Promise<Contract> => {
    if (!currentUser) throw new Error('You must be signed in to complete a contract');

    try {
      const res = await fetch(`/api/contracts/${contractId}/complete`, {
        method: 'POST',
        headers: {
          'x-user-id': currentUser.id,
          'x-user-role': currentUser.role,
          'x-user-email': currentUser.email,
          'x-user-name': currentUser.name
        }
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to complete contract');
      }

      const result = await res.json();
      const updated: Contract = result.contract;

      setContracts(prev => prev.map(c => c.id === contractId ? updated : c));
      if (selectedContract?.id === contractId) {
        setSelectedContract(updated);
      }
      await saveContractToFirestore(updated).catch(() => {});

      showToast({
        type: 'success',
        title: 'Contract Term Completed',
        message: `Contract ${updated.contractNumber} marked as completed.`
      });
      return updated;
    } catch (err: any) {
      console.warn('Backend completeContract failed, using local update:', err);
      let updatedContract: Contract | null = null;
      setContracts(prev => prev.map(c => {
        if (c.id === contractId) {
          const now = new Date().toISOString();
          const audit: any = {
            id: `aud-${Date.now()}`,
            timestamp: now,
            action: 'COMPLETED',
            actorId: currentUser.id,
            actorName: currentUser.name,
            actorRole: currentUser.role,
            actorEmail: currentUser.email,
            summary: 'Contract completed',
            previousStatus: c.status,
            newStatus: 'completed'
          };
          updatedContract = {
            ...c,
            status: 'completed',
            completedAt: now,
            updatedAt: now,
            history: [...(c.history || []), audit]
          };
          return updatedContract;
        }
        return c;
      }));
      if (updatedContract) {
        if (selectedContract?.id === contractId) setSelectedContract(updatedContract);
        await saveContractToFirestore(updatedContract).catch(() => {});
        showToast({
          type: 'success',
          title: 'Contract Completed',
          message: 'Term finished.'
        });
        return updatedContract;
      }
      throw err;
    }
  }, [currentUser, selectedContract, showToast]);

  const logContractAudit = useCallback(async (contractId: string, action: 'DOWNLOADED' | 'TERMS_VIEWED', details?: string): Promise<void> => {
    if (!currentUser) return;
    try {
      await fetch(`/api/contracts/${contractId}/audit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
          'x-user-role': currentUser.role,
          'x-user-email': currentUser.email,
          'x-user-name': currentUser.name
        },
        body: JSON.stringify({ action, details })
      });
    } catch (err) {
      console.warn('Failed to log contract audit on backend:', err);
    }
  }, [currentUser]);

  // AI Matching Helper
  const calculateMatchScore = async (job: Job) => {
    try {
      const response = await fetch('/api/ai/match-candidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job,
          candidateProfile: currentUser || INITIAL_USER
        })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          score: data.matchScore || 90,
          matchedSkills: data.matchedSkills || job.skills.slice(0, 3),
          growthAreas: data.growthAreas || ['Domain depth'],
          insights: data.insights || ['High technical overlap.'],
          interviewTip: data.interviewTip || 'Emphasize your hands-on problem solving.'
        };
      }
    } catch (e) {
      console.warn('AI Match fallback used:', e);
    }

    // Deterministic fallback
    const candidateSkills = (currentUser || INITIAL_USER).skills.map(s => s.name.toLowerCase());
    const jobSkills = job.skills.map(s => s.toLowerCase());
    const matched = jobSkills.filter(s => candidateSkills.some(cs => cs.includes(s) || s.includes(cs)));
    const ratio = jobSkills.length > 0 ? (matched.length / jobSkills.length) : 0.8;
    const score = Math.min(98, Math.max(68, Math.round(ratio * 35 + 60)));

    return {
      score,
      matchedSkills: matched.length > 0 ? matched : job.skills.slice(0, 2),
      growthAreas: ['Advanced platform scale'],
      insights: [
        `Direct experience with ${matched.slice(0, 3).join(', ') || 'required tech stack'}.`,
        'Seniority and leadership traits match expectations.',
        'High potential for technical interview success.'
      ],
      interviewTip: 'Prepare to discuss architecture trade-offs and quantitative performance wins.'
    };
  };

  // Gemini Chatbot Actions & Messaging
  const executeChatAction = useCallback((action?: ChatMessage['suggestedAction']) => {
    if (!action || typeof action !== 'object') return;

    const allowedTypes = ['filter', 'open_job', 'quick_apply', 'navigate', 'switch_role'];
    if (!allowedTypes.includes(action.type)) return;

    if (action.type === 'filter') {
      const allowedCategories = [
        'AI & Machine Learning',
        'Engineering',
        'Product & Design',
        'Data & Analytics',
        'DevOps & Cloud',
        'Marketing & Growth',
        'Sales & Success',
        'Operations & Finance'
      ];
      if (action.data?.category && typeof action.data.category === 'string' && allowedCategories.includes(action.data.category)) {
        setFilters(prev => ({
          ...prev,
          categories: [action.data.category as any]
        }));
      }
      if (action.data?.keyword && typeof action.data.keyword === 'string') {
        const cleanKeyword = action.data.keyword.replace(/[<>'"]/g, '').slice(0, 60);
        setFilters(prev => ({
          ...prev,
          keyword: cleanKeyword
        }));
      }
      if (action.data?.remoteOnly !== undefined) {
        setFilters(prev => ({
          ...prev,
          remoteOnly: Boolean(action.data.remoteOnly)
        }));
      }
      setActiveTab('all_jobs');
      showToast({
        title: 'Filter Applied',
        message: `Updated marketplace filters.`,
        type: 'info'
      });
    } else if (action.type === 'open_job') {
      if (typeof action.data?.jobId === 'string') {
        const targetJob = jobs.find(j => j.id === action.data?.jobId);
        if (targetJob) {
          setSelectedJob(targetJob);
        }
      }
    } else if (action.type === 'quick_apply') {
      if (typeof action.data?.jobId === 'string') {
        const targetJob = jobs.find(j => j.id === action.data?.jobId);
        if (!targetJob) {
          showToast({
            title: 'Job Not Found',
            message: 'The requested job opening could not be located.',
            type: 'warning'
          });
          return;
        }
        if (!currentUser) {
          setAuthModalOpen(true);
          return;
        }
        quickApplyToJob(targetJob.id);
      }
    } else if (action.type === 'navigate') {
      const allowedTabs = ['home', 'all_jobs', 'for_employers', 'my_profile', 'post_a_job'];
      if (typeof action.data?.tab === 'string' && allowedTabs.includes(action.data.tab)) {
        setActiveTab(action.data.tab as any);
      }
    } else if (action.type === 'switch_role') {
      if (action.data?.role === 'employer' || action.data?.role === 'job_seeker') {
        switchDemoUser(action.data.role);
      }
    }
  }, [jobs, currentUser, quickApplyToJob, showToast, switchDemoUser]);

  const sendChatMessage = useCallback(async (content: string) => {
    const cleanContent = content.trim().slice(0, 2000);
    if (!cleanContent || isChatLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: cleanContent,
      timestamp: 'Just now'
    };

    const newMessages = [...chatMessages, userMessage];
    setChatMessages(newMessages);
    setIsChatLoading(true);

    try {
      // If user is Admin, route directly to FastJobs AI Admin Copilot with strict RBAC headers
      if (currentUser?.role === 'admin') {
        const adminRes = await fetch('/api/admin/ai/copilot/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-role': 'admin'
          },
          body: JSON.stringify({
            message: cleanContent,
            history: newMessages.slice(-6).map(m => ({
              role: m.role,
              content: m.content
            }))
          })
        });

        if (adminRes.ok) {
          const data = await adminRes.json();
          const assistantMessage: ChatMessage = {
            id: `ai-admin-${Date.now()}`,
            role: 'model',
            content: data.answer || data.reply || 'Admin Copilot analysis completed.',
            timestamp: 'Just now',
            facts: data.facts || [],
            recommendations: data.recommendations || [],
            proposedAction: data.proposedAction,
            suggestedFollowups: [
              'Give me a platform health summary',
              'Which platform feeds are failing?',
              'Show companies waiting for verification',
              'Which jobs have duplicate warnings?',
              'Summarize the last 24 hours of feed errors',
              'Which distribution platforms have the highest application conversion?'
            ]
          };
          setChatMessages(prev => [...prev, assistantMessage]);
          return;
        }
      }

      // Build strictly sanitized, minimized context summary
      const availableJobsSummary = jobs.slice(0, 8).map(j => ({
        id: j.id,
        title: j.title,
        company: j.company,
        location: j.location,
        salary: `$${Math.round(j.salaryMin / 1000)}k - $${Math.round(j.salaryMax / 1000)}k`,
        category: j.category,
        skills: j.skills.slice(0, 6)
      }));

      const contextPayload: ChatContextInfo = {
        currentUser: currentUser ? {
          name: currentUser.name,
          role: currentUser.role,
          title: currentUser.title,
          skills: currentUser.skills.slice(0, 8).map(s => s.name),
          bio: currentUser.bio?.slice(0, 200)
        } : null,
        activeTab,
        selectedJob: selectedJob ? {
          id: selectedJob.id,
          title: selectedJob.title,
          company: selectedJob.company,
          location: selectedJob.location,
          salaryMin: selectedJob.salaryMin,
          salaryMax: selectedJob.salaryMax,
          skills: selectedJob.skills.slice(0, 6),
          category: selectedJob.category
        } : null,
        filters: {
          keyword: filters.keyword.slice(0, 60),
          location: filters.location.slice(0, 60),
          categories: filters.categories,
          remoteOnly: filters.remoteOnly
        },
        availableJobsSummary
      };

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.slice(-10).map(m => ({
            role: m.role,
            content: m.content.slice(0, 2000)
          })),
          context: contextPayload
        })
      });

      if (response.status === 429) {
        const errData = await response.json().catch(() => ({}));
        showToast({
          title: 'Rate Limit',
          message: errData.message || 'Please wait a moment before sending more messages.',
          type: 'warning'
        });
        const rateLimitMessage: ChatMessage = {
          id: `ai-rl-${Date.now()}`,
          role: 'model',
          content: '⚠️ **Request Rate Limit Reached**\n\nPlease wait a few seconds before sending another message to ensure optimal performance.',
          timestamp: 'Just now',
          suggestedFollowups: ['Find Jobs', 'Compare Jobs', 'Analyze Salary']
        };
        setChatMessages(prev => [...prev, rateLimitMessage]);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'model',
          content: data.reply || 'Here is what I found for you.',
          timestamp: 'Just now',
          recommendedJobIds: Array.isArray(data.recommendedJobIds) ? data.recommendedJobIds : [],
          suggestedFollowups: Array.isArray(data.suggestedFollowups) ? data.suggestedFollowups : [],
          suggestedAction: data.suggestedAction || undefined
        };

        setChatMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(`Server returned ${response.status}`);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      const fallbackAiMessage: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        role: 'model',
        content: `I am currently analyzing your request in connection with your **${currentUser?.title || 'profile'}** and the **${jobs.length} active roles** in FastJobs AI. Let me know if you would like me to match specific skills or prepare interview points!`,
        timestamp: 'Just now',
        suggestedFollowups: [
          'Recommend top jobs for my profile',
          'Practice technical interview questions',
          'Salary ranges for AI Engineers'
        ]
      };
      setChatMessages(prev => [...prev, fallbackAiMessage]);
    } finally {
      setIsChatLoading(false);
    }
  }, [chatMessages, isChatLoading, jobs, currentUser, activeTab, selectedJob, filters, showToast]);

  const openChatWithPrompt = useCallback((promptText: string) => {
    setChatbotOpen(true);
    sendChatMessage(promptText);
  }, [sendChatMessage]);

  return (
    <JobContext.Provider
      value={{
        activeTab,
        setActiveTab,
        jobs,
        addJob,
        updateJob,
        deleteJob,
        toggleJobStatus,
        filters,
        setSearchKeyword,
        setSearchLocation,
        toggleCategoryFilter,
        toggleJobTypeFilter,
        toggleExperienceFilter,
        setRemoteOnly,
        setMinSalary,
        setMaxSalary,
        setSalaryRange,
        setSortBy,
        resetFilters,
        filteredJobs,
        currentUser,
        authLoading,
        login,
        signup,
        loginWithGoogle,
        logout,
        switchDemoUser,
        updateProfile,
        isFirebaseConnected,
        savedJobIds,
        toggleSaveJob,
        isJobSaved,
        applications,
        applyToJob,
        quickApplyToJob,
        updateApplicationStatus,
        hasAppliedToJob,
        contracts,
        contractsLoading,
        selectedContract,
        setSelectedContract,
        contractModalMode,
        setContractModalMode,
        createContract,
        updateContract,
        sendContract,
        acceptContract,
        cancelContract,
        completeContract,
        logContractAudit,
        refreshContracts,
        selectedJob,
        setSelectedJob,
        authModalOpen,
        setAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        applyModalJob,
        setApplyModalJob,
        profileModalOpen,
        setProfileModalOpen,
        toasts,
        showToast,
        hideToast,
        chatbotOpen,
        setChatbotOpen,
        toggleChatbot,
        chatMessages,
        isChatLoading,
        sendChatMessage,
        openChatWithPrompt,
        clearChatMessages,
        executeChatAction,
        calculateMatchScore,
        executeAdminAction
      }}
    >
      {children}
    </JobContext.Provider>
  );
};

export const useJobContext = () => {
  const context = useContext(JobContext);
  if (!context) {
    throw new Error('useJobContext must be used within a JobProvider');
  }
  return context;
};
