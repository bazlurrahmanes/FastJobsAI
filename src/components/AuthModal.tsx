import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  User, 
  Building2, 
  Mail, 
  Lock, 
  ArrowRight, 
  Briefcase, 
  Zap,
  Loader2
} from 'lucide-react';
import { useJobContext } from '../context/JobContext';
import { UserRole } from '../types';

export const AuthModal: React.FC = () => {
  const { 
    authModalOpen, 
    setAuthModalOpen, 
    authModalMode, 
    setAuthModalMode, 
    login, 
    signup, 
    loginWithGoogle,
    switchDemoUser 
  } = useJobContext();

  const [role, setRole] = useState<UserRole>('job_seeker');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [location, setLocation] = useState('San Francisco, CA');
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!authModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      if (authModalMode === 'login') {
        const success = await login(email, password, role);
        if (!success) {
          setErrorMessage('Could not sign in. Please verify your email and password.');
        }
      } else {
        const success = await signup({
          name: name || (role === 'employer' ? 'Tech Recruiter' : 'AI Specialist'),
          email: email || 'user@fastjobs.io',
          password,
          role,
          title: title || (role === 'employer' ? 'Talent Acquisition' : 'Senior Systems Engineer'),
          companyName: role === 'employer' ? (companyName || 'InnovateAI Labs') : undefined,
          location
        });
        if (!success) {
          setErrorMessage('Could not register account. Password must be at least 6 characters.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const ok = await loginWithGoogle(role);
      if (!ok) {
        setErrorMessage('Google authentication cancelled or closed.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Google authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-3xl bg-[#0a1128] border border-cyan-500/30 p-6 sm:p-8 shadow-2xl shadow-cyan-950/80 text-slate-100 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        
        {/* Close button */}
        <button
          onClick={() => setAuthModalOpen(false)}
          className="absolute top-5 right-5 p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Brand Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20 mb-3">
            <div className="relative flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-white" />
              <Sparkles className="w-3 h-3 text-cyan-200 absolute -top-1 -right-1" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-white">
            {authModalMode === 'login' ? 'Sign In with Firebase' : 'Create Cloud Account'}
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Powered by Firebase Auth & Firestore Database
          </p>
        </div>

        {/* Google One-Click Sign In */}
        <div className="mb-4">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleGoogleSignIn}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-sm font-semibold flex items-center justify-center gap-3 transition-colors disabled:opacity-60 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>

        <div className="relative flex py-2 items-center mb-4">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink mx-3 text-[11px] uppercase font-bold text-slate-500">Or with Email</span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        {/* 1-Click Demo Logins Banner */}
        <div className="mb-5 p-3 rounded-2xl bg-slate-900/90 border border-cyan-500/20 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            Quick Demo Profiles:
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                switchDemoUser('job_seeker');
                setAuthModalOpen(false);
              }}
              className="px-2.5 py-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/80 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>Alex (Candidate)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                switchDemoUser('employer');
                setAuthModalOpen(false);
              }}
              className="px-2.5 py-2 rounded-xl bg-blue-950/80 hover:bg-blue-900/80 border border-blue-500/30 text-blue-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>TechSphere (Employer)</span>
            </button>
          </div>
        </div>

        {/* Role Selector (Job Seeker vs Employer) */}
        {authModalMode === 'signup' && (
          <div className="mb-5">
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">
              Select Your Account Type:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('job_seeker')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1 text-xs font-bold transition-all cursor-pointer ${
                  role === 'job_seeker'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500 shadow-xs'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Job Seeker</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('employer')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1 text-xs font-bold transition-all cursor-pointer ${
                  role === 'employer'
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500 shadow-xs'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Employer / Recruiter</span>
              </button>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300 text-xs">
            {errorMessage}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {authModalMode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Chen"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-cyan-400 outline-none"
              />
            </div>
          )}

          {authModalMode === 'signup' && role === 'employer' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Company Name
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. NeuralMatrix Labs"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-cyan-400 outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-cyan-400 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••••••••• (min 6 characters)"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-cyan-400 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:from-cyan-300 hover:via-blue-400 hover:to-indigo-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>{authModalMode === 'login' ? 'Sign In' : 'Create Firebase Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode Switcher */}
        <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
          {authModalMode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMessage('');
                  setAuthModalMode('signup');
                }}
                className="text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer"
              >
                Sign Up here
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMessage('');
                  setAuthModalMode('login');
                }}
                className="text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer"
              >
                Log In
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
};
