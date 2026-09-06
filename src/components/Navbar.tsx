import React, { useState } from 'react';
import { 
  Briefcase, 
  Sparkles, 
  User, 
  PlusCircle, 
  Menu, 
  X, 
  LogOut, 
  ChevronDown,
  FileText,
  Layers,
  FileCheck
} from 'lucide-react';
import { useJobContext } from '../context/JobContext';

export const Navbar: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    currentUser, 
    logout, 
    setAuthModalOpen, 
    setAuthModalMode
  } = useJobContext();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleNavClick = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openAuth = (mode: 'login' | 'signup') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[#040816]/90 backdrop-blur-md border-b border-cyan-500/15 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          
          {/* Brand / Logo */}
          <div 
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3 cursor-pointer group shrink-0"
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-400/40 transition-all">
              <div className="relative flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
                <Sparkles className="w-3 h-3 text-cyan-200 absolute -top-1.5 -right-1.5 animate-pulse" />
              </div>
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl blur-xs opacity-40 group-hover:opacity-80 transition duration-300"></div>
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-white font-sans">
                  Fast<span className="text-cyan-400">Jobs</span>
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-extrabold bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-xs">
                  AI
                </span>
              </div>
              <span className="text-[10px] font-medium tracking-wide text-slate-400 hidden sm:inline-block">
                Find Jobs Faster with AI
              </span>
            </div>
          </div>

          {/* Desktop Navigation Items: 1. All Jobs, 2. Post a Job, 5. AI Seeker Hub */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <button
              id="nav-all-jobs-btn"
              onClick={() => handleNavClick('all_jobs')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'all_jobs'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Briefcase className="w-4 h-4 text-cyan-400" />
              <span>All Jobs</span>
            </button>

            <button
              id="nav-post-job-btn"
              onClick={() => handleNavClick('post_a_job')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'post_a_job'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <PlusCircle className="w-4 h-4 text-cyan-400" />
              <span>Post a Job</span>
            </button>

            <button
              id="nav-ai-hub-btn"
              onClick={() => handleNavClick('my_profile')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'my_profile'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>AI Seeker Hub</span>
            </button>

            <button
              id="nav-contracts-btn"
              onClick={() => handleNavClick('contracts')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'contracts'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <FileCheck className="w-4 h-4 text-cyan-400" />
              <span>Contracts</span>
            </button>
          </nav>

          {/* Desktop Right Action Area: 3. Login, 4. Sign Up (or User Profile + Sign Out) */}
          <div className="hidden md:flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 transition-all text-left cursor-pointer"
                  >
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-7 h-7 rounded-full object-cover ring-1 ring-cyan-400/50"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-200 leading-tight">
                        {currentUser.name}
                      </span>
                      <span className="text-[10px] text-cyan-400 font-medium capitalize">
                        {currentUser.role === 'employer' ? 'Employer' : 'Candidate'}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {userDropdownOpen && (
                    <div 
                      className="absolute right-0 mt-2 w-56 rounded-xl bg-[#0a1128] border border-cyan-500/20 shadow-xl py-2 z-50 text-sm backdrop-blur-xl"
                      onMouseLeave={() => setUserDropdownOpen(false)}
                    >
                      <div className="px-4 py-2 border-b border-slate-800">
                        <p className="font-medium text-slate-200 text-xs truncate">{currentUser.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                      </div>

                      <button
                        onClick={() => {
                          setActiveTab('my_profile');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-slate-300 hover:text-cyan-300 hover:bg-slate-800/60 flex items-center gap-2.5 cursor-pointer"
                      >
                        <User className="w-4 h-4 text-cyan-400" />
                        <span>AI Seeker Hub</span>
                      </button>

                      {currentUser.role === 'employer' ? (
                        <button
                          onClick={() => {
                            setActiveTab('for_employers');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-slate-300 hover:text-blue-300 hover:bg-slate-800/60 flex items-center gap-2.5 cursor-pointer"
                        >
                          <Layers className="w-4 h-4 text-blue-400" />
                          <span>Hiring Dashboard</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setActiveTab('applications');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-slate-300 hover:text-cyan-300 hover:bg-slate-800/60 flex items-center gap-2.5 cursor-pointer"
                        >
                          <FileText className="w-4 h-4 text-cyan-400" />
                          <span>My Applications</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setActiveTab('contracts');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-slate-300 hover:text-indigo-300 hover:bg-slate-800/60 flex items-center gap-2.5 cursor-pointer"
                      >
                        <FileCheck className="w-4 h-4 text-indigo-400" />
                        <span>Contracts</span>
                      </button>

                      <div className="border-t border-slate-800 mt-1 pt-1">
                        <button
                          onClick={() => {
                            logout();
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-rose-400 hover:bg-rose-500/10 flex items-center gap-2.5 cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => logout()}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 transition-all flex items-center gap-1 cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="nav-login-btn"
                  onClick={() => openAuth('login')}
                  className="px-3.5 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  Login
                </button>
                <button
                  id="nav-signup-btn"
                  onClick={() => openAuth('signup')}
                  className="px-4 py-2 text-sm font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 rounded-lg shadow-md shadow-cyan-500/20 hover:shadow-cyan-400/30 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Sign Up</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu - Matches Exact Requested Structure */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-cyan-500/20 bg-[#040816]/98 backdrop-blur-xl px-4 pt-3 pb-6 space-y-3">
          <div className="grid grid-cols-1 gap-1">
            <button
              id="mobile-nav-all-jobs-btn"
              onClick={() => handleNavClick('all_jobs')}
              className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2.5 cursor-pointer ${
                activeTab === 'all_jobs' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-300'
              }`}
            >
              <Briefcase className="w-4 h-4 text-cyan-400" />
              <span>All Jobs</span>
            </button>

            <button
              id="mobile-nav-post-job-btn"
              onClick={() => handleNavClick('post_a_job')}
              className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2.5 cursor-pointer ${
                activeTab === 'post_a_job' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-300'
              }`}
            >
              <PlusCircle className="w-4 h-4 text-cyan-400" />
              <span>Post a Job</span>
            </button>

            <button
              id="mobile-nav-ai-hub-btn"
              onClick={() => handleNavClick('my_profile')}
              className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2.5 cursor-pointer ${
                activeTab === 'my_profile' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-300'
              }`}
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>AI Seeker Hub</span>
            </button>

            <button
              id="mobile-nav-contracts-btn"
              onClick={() => handleNavClick('contracts')}
              className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2.5 cursor-pointer ${
                activeTab === 'contracts' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-300'
              }`}
            >
              <FileCheck className="w-4 h-4 text-cyan-400" />
              <span>Contracts</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-800">
            {currentUser ? (
              <div className="space-y-2">
                <button
                  onClick={() => { setActiveTab('my_profile'); setMobileMenuOpen(false); }}
                  className="w-full py-2.5 px-3 rounded-lg bg-slate-900 border border-slate-800 text-sm font-medium text-slate-200 flex items-center gap-2 cursor-pointer"
                >
                  <User className="w-4 h-4 text-cyan-400" />
                  <span>{currentUser.name}</span>
                </button>
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="w-full py-2 px-3 rounded-lg bg-rose-500/10 text-rose-300 text-sm font-medium flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  id="mobile-nav-login-btn"
                  onClick={() => openAuth('login')}
                  className="flex-1 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-sm font-medium text-slate-200 text-center cursor-pointer"
                >
                  Login
                </button>
                <button
                  id="mobile-nav-signup-btn"
                  onClick={() => openAuth('signup')}
                  className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-400 text-slate-950 font-semibold text-sm text-center cursor-pointer"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
