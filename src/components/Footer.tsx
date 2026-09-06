import React, { useState } from 'react';
import { 
  Briefcase, 
  Sparkles, 
  Rss, 
  Building2, 
  PlusCircle, 
  ShieldCheck, 
  FileText, 
  Mail, 
  Globe, 
  X, 
  CheckCircle2, 
  Lock, 
  Scale, 
  HelpCircle, 
  Send,
  Github,
  Twitter,
  Linkedin,
  Radio,
  Users
} from 'lucide-react';
import { useJobContext } from '../context/JobContext';
import { ActiveTab } from '../types';

export const Footer: React.FC = () => {
  const { setActiveTab } = useJobContext();

  // Interactive Modals for Footer Pages (About, Contact, Privacy, Terms)
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'about' | 'contact' | null>(null);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '', topic: 'General Inquiry' });

  const navigateTo = (tab: ActiveTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      setContactSubmitted(false);
      setContactForm({ name: '', email: '', message: '', topic: 'General Inquiry' });
      setActiveModal(null);
    }, 2000);
  };

  return (
    <>
      <footer className="w-full bg-[#030612] border-t border-cyan-500/20 text-slate-400 text-sm">
        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
            
            {/* Col 1: Brand & Platform Overview */}
            <div className="lg:col-span-2 space-y-4">
              <div 
                onClick={() => navigateTo('home')}
                className="flex items-center gap-3 cursor-pointer group inline-flex"
              >
                <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-400/40 transition-all">
                  <Briefcase className="w-5 h-5 text-white" />
                  <Sparkles className="w-3 h-3 text-cyan-200 absolute -top-1 -right-1" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-black tracking-tight text-white font-sans">
                    Fast<span className="text-cyan-400">Jobs</span>
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-extrabold bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-xs">
                    AI
                  </span>
                </div>
              </div>

              <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                Next-generation intelligent recruitment network connecting elite tech candidates with verified engineering teams. Powered by semantic vector matching, real-time fraud mitigation, and universal feed distribution.
              </p>

              {/* Status Indicator */}
              <div className="flex items-center gap-2 pt-1 text-xs">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-slate-300 font-medium font-mono text-[11px]">Universal Feed Pipeline v2.0 • Systems 100% Operational</span>
              </div>

              {/* Social Channels */}
              <div className="flex items-center gap-3 pt-2">
                <a 
                  href="https://github.com" 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-300 flex items-center justify-center transition-all cursor-pointer"
                  aria-label="GitHub"
                >
                  <Github className="w-4 h-4" />
                </a>
                <a 
                  href="https://twitter.com" 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-300 flex items-center justify-center transition-all cursor-pointer"
                  aria-label="Twitter / X"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <a 
                  href="https://linkedin.com" 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-300 flex items-center justify-center transition-all cursor-pointer"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setActiveModal('contact')}
                  className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-300 flex items-center justify-center transition-all cursor-pointer"
                  aria-label="Contact Support"
                  title="Contact Support"
                >
                  <Mail className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Col 2: For Candidates */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span>Job Seekers</span>
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <button
                    onClick={() => navigateTo('all_jobs')}
                    className="hover:text-cyan-300 transition-colors text-left flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Browse All Jobs</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigateTo('my_profile')}
                    className="hover:text-cyan-300 transition-colors text-left flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>AI Seeker Hub</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigateTo('applications')}
                    className="hover:text-cyan-300 transition-colors text-left flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3 h-3 text-slate-400" />
                    <span>Track Applications</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigateTo('all_jobs')}
                    className="hover:text-cyan-300 transition-colors text-left cursor-pointer"
                  >
                    <span>Remote Tech Positions</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigateTo('my_profile')}
                    className="hover:text-cyan-300 transition-colors text-left cursor-pointer"
                  >
                    <span>AI Resume Health Audit</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: For Employers & Feed Distribution (Featuring BOTH requested links) */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Employers & Feeds</span>
              </h4>
              <ul className="space-y-2 text-sm">
                {/* 1. For Employers link (Requested Item #2) */}
                <li>
                  <button
                    id="footer-for-employers-btn"
                    onClick={() => navigateTo('for_employers')}
                    className="hover:text-blue-300 transition-colors font-medium text-left flex items-center gap-2 cursor-pointer text-slate-200 hover:text-white"
                  >
                    <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>For Employers</span>
                  </button>
                </li>

                {/* 2. Feed Engine link (Requested Item #1 with existing Feed Engine SVG/Rss icon) */}
                <li>
                  <button
                    id="footer-feed-engine-btn"
                    onClick={() => navigateTo('feed_engine')}
                    className="hover:text-emerald-300 transition-colors font-medium text-left flex items-center gap-2 cursor-pointer text-slate-200 hover:text-white"
                  >
                    <Rss className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
                    <span>Feed Engine</span>
                  </button>
                </li>

                <li>
                  <button
                    onClick={() => navigateTo('post_a_job')}
                    className="hover:text-cyan-300 transition-colors text-left flex items-center gap-1.5 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>Post a Job Opening</span>
                  </button>
                </li>

                <li>
                  <button
                    onClick={() => navigateTo('for_employers')}
                    className="hover:text-cyan-300 transition-colors text-left cursor-pointer"
                  >
                    <span>Candidate AI Ranking</span>
                  </button>
                </li>

                <li>
                  <button
                    onClick={() => navigateTo('admin_hub')}
                    className="hover:text-cyan-300 transition-colors text-left flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Admin Operations Hub</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 4: Company & Legal Information */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span>Company & Legal</span>
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <button
                    onClick={() => setActiveModal('about')}
                    className="hover:text-cyan-300 transition-colors text-left flex items-center gap-1.5 cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                    <span>About FastJobs</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveModal('contact')}
                    className="hover:text-cyan-300 transition-colors text-left flex items-center gap-1.5 cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Contact Support</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveModal('privacy')}
                    className="hover:text-cyan-300 transition-colors text-left flex items-center gap-1.5 cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Privacy Policy</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveModal('terms')}
                    className="hover:text-cyan-300 transition-colors text-left flex items-center gap-1.5 cursor-pointer"
                  >
                    <Scale className="w-3.5 h-3.5 text-slate-400" />
                    <span>Terms of Service</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigateTo('feed_engine')}
                    className="hover:text-cyan-300 transition-colors text-left flex items-center gap-1.5 cursor-pointer"
                  >
                    <Radio className="w-3.5 h-3.5 text-emerald-400" />
                    <span>XML & RSS Feeds</span>
                  </button>
                </li>
              </ul>
            </div>

          </div>
        </div>

        {/* Bottom Legal & Compliance Bar */}
        <div className="border-t border-slate-800/80 bg-[#02040b] py-6 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span>© {new Date().getFullYear()} FastJobs AI, Inc. All rights reserved.</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline text-slate-600">Built for modern tech careers</span>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <button 
                onClick={() => setActiveModal('privacy')}
                className="hover:text-slate-300 transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
              <button 
                onClick={() => setActiveModal('terms')}
                className="hover:text-slate-300 transition-colors cursor-pointer"
              >
                Terms of Service
              </button>
              <button 
                onClick={() => setActiveModal('about')}
                className="hover:text-slate-300 transition-colors cursor-pointer"
              >
                About
              </button>
              <button 
                onClick={() => setActiveModal('contact')}
                className="hover:text-slate-300 transition-colors cursor-pointer"
              >
                Contact
              </button>
              <span className="text-slate-700">|</span>
              <button
                id="footer-bottom-feed-engine-btn"
                onClick={() => navigateTo('feed_engine')}
                className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer font-medium"
              >
                <Rss className="w-3 h-3" />
                <span>Feed Engine</span>
              </button>
              <button
                id="footer-bottom-for-employers-btn"
                onClick={() => navigateTo('for_employers')}
                className="text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer font-medium"
              >
                <Building2 className="w-3 h-3" />
                <span>For Employers</span>
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* Interactive Modals: Privacy Policy, Terms, About Us, Contact Us          */}
      {/* ========================================================================= */}

      {/* Privacy Policy Modal */}
      {activeModal === 'privacy' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-[#0a1128] border border-cyan-500/30 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-500/30 text-cyan-400">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Privacy Policy</h3>
                  <p className="text-xs text-slate-400">FastJobs AI Data Protection & User Privacy Standards</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed">
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">1. Information We Collect</h4>
                <p>
                  FastJobs AI collects candidate profile data, resume attachments, application submissions, and interaction metadata solely to match job seekers with relevant opportunities and provide AI-assisted career tooling.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white mb-1">2. AI & Resume Data Processing</h4>
                <p>
                  Your resume text, skills, and work history analyzed through our AI Seeker Hub and Match Evaluators are processed strictly in ephemeral memory using secure models. Your private resume text is never used to train public foundation models without explicit consent.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white mb-1">3. Employer Sharing & Feed Distribution</h4>
                <p>
                  When you apply to an opening or authorize profile discovery, your verified profile and application details are shared exclusively with the recruiting company. Employers receiving applications agree to strict confidentiality terms.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white mb-1">4. Your Rights & Data Deletion (GDPR / CCPA)</h4>
                <p>
                  You retain full ownership of your data. You may request complete export or deletion of your profile, submitted resumes, and application history at any time through the AI Seeker Hub or by contacting support@fastjobs.ai.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/40 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all cursor-pointer"
              >
                Close Privacy Policy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terms of Service Modal */}
      {activeModal === 'terms' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-[#0a1128] border border-cyan-500/30 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-950 border border-indigo-500/30 text-indigo-400">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Terms of Service</h3>
                  <p className="text-xs text-slate-400">FastJobs AI Platform Rules & User Agreement</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed">
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">1. User Account Integrity</h4>
                <p>
                  Candidates and employers represent that all submitted credentials, job descriptions, salaries, and resume qualifications are authentic and verifiable. Misleading postings or fraudulent listings will result in immediate suspension.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white mb-1">2. Zero Tolerance for Scams & Fraud</h4>
                <p>
                  FastJobs employs an automated 9-dimension scam inspection model. Postings that require applicant upfront fees, pyramid schemes, or unverified contact channels are blocked and reported automatically.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white mb-1">3. Universal Feed Redistribution</h4>
                <p>
                  Job postings distributed via the FastJobs Universal Feed Engine are syndicated across authorized partner networks (Google Jobs, LinkedIn, Indeed, Glassdoor) under standard Schema.org and JobPosting compliance.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white mb-1">4. Disclaimers</h4>
                <p>
                  FastJobs operates as an intelligent discovery and recruitment coordination platform. While we rigorously screen listings and provide AI matching tools, ultimate hiring decisions rest between candidates and employer organizations.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/40 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 text-xs font-bold transition-all cursor-pointer"
              >
                Acknowledge Terms
              </button>
            </div>
          </div>
        </div>
      )}

      {/* About Us Modal */}
      {activeModal === 'about' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-[#0a1128] border border-cyan-500/30 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-500/30 text-cyan-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">About FastJobs AI</h3>
                  <p className="text-xs text-slate-400">Pioneering Intelligent Tech Recruitment</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed">
              <p>
                FastJobs AI was built with a singular mission: <strong className="text-cyan-300">eliminate friction from technical hiring</strong>. Traditional job boards rely on clumsy boolean keyword matching, burying top engineers and burdening hiring teams with unvetted applicants.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-cyan-500/20 space-y-1">
                  <div className="font-semibold text-white text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Semantic Vector Matching</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Calculates deep skill requirement compatibility, compensation alignment, and senior engineering context.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-emerald-500/20 space-y-1">
                  <div className="font-semibold text-white text-xs flex items-center gap-1.5">
                    <Rss className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Universal Feed Engine</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Instantly syndicates verified openings to Google Jobs, XML partner networks, and direct ATS pipelines.
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white mb-1">Our Core Commitment</h4>
                <p>
                  100% verified opportunities, crystal-clear compensation ranges, zero unsolicited recruiters, and continuous AI career assistance for engineers worldwide.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/40 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Us Modal */}
      {activeModal === 'contact' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl max-h-[85vh] flex flex-col rounded-2xl bg-[#0a1128] border border-cyan-500/30 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-500/30 text-cyan-400">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Contact FastJobs Support</h3>
                  <p className="text-xs text-slate-400">We respond within 2-4 business hours</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {contactSubmitted ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white">Message Sent Successfully</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Thank you for reaching out. Our support engineering team has received your message and will follow up via email shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="Alex Chen"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="alex@example.com"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Inquiry Topic</label>
                  <select
                    value={contactForm.topic}
                    onChange={(e) => setContactForm({ ...contactForm, topic: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                  >
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Employer Hiring & ATS">Employer Hiring & ATS</option>
                    <option value="Feed Engine Integration">Feed Engine Integration & XML</option>
                    <option value="Candidate Support">Candidate Support & Resume AI</option>
                    <option value="Report Listing / Scam">Report Job Listing / Fraud Shield</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Message</label>
                  <textarea
                    required
                    rows={4}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="How can we assist you?"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Direct: support@fastjobs.ai</span>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Message</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};
