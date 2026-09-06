import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  MapPin, 
  Sparkles, 
  ArrowRight, 
  Briefcase, 
  TrendingUp, 
  Users, 
  ShieldCheck,
  Building,
  Cpu
} from 'lucide-react';
import { useJobContext } from '../context/JobContext';

export const HeroSection: React.FC = () => {
  const { 
    setSearchKeyword, 
    setSearchLocation, 
    setActiveTab, 
    filters,
    jobs
  } = useJobContext();

  const [inputKeyword, setInputKeyword] = useState(filters.keyword || '');
  const [inputLocation, setInputLocation] = useState(filters.location || '');
  const [videoError, setVideoError] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Synchronize initial filter values if any
  useEffect(() => {
    setInputKeyword(filters.keyword);
    setInputLocation(filters.location);
  }, [filters.keyword, filters.location]);

  // Subtle interactive particle network canvas overlay over the video background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 680);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    // Particle nodes representing AI talent connections
    interface Node {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
    }

    const nodeCount = 35;
    const nodes: Node[] = [];
    const colors = ['rgba(6, 182, 212, 0.6)', 'rgba(59, 130, 246, 0.5)', 'rgba(147, 197, 253, 0.4)'];

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw connection lines
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            const alpha = (1 - dist / 130) * 0.25;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      nodes.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchKeyword(inputKeyword);
    setSearchLocation(inputLocation);
    setActiveTab('all_jobs');
  };

  const handleQuickTagClick = (keyword: string, location?: string) => {
    setInputKeyword(keyword);
    setSearchKeyword(keyword);
    if (location !== undefined) {
      setInputLocation(location);
      setSearchLocation(location);
    }
    setActiveTab('all_jobs');
  };

  return (
    <section 
      id="hero-section"
      className="relative w-full h-[680px] overflow-hidden bg-[#040816] flex items-center justify-center border-b border-cyan-500/20"
    >
      {/* Cinematic AI-generated Video Background */}
      <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none">
        <video
          id="hero-bg-video"
          poster="/assets/hero-poster.jpg"
          autoPlay
          loop
          muted
          playsInline
          onError={() => setVideoError(true)}
          className="w-full h-full object-cover object-center transform scale-105"
        >
          <source src="/assets/job-marketplace-hero-video.mp4" type="video/mp4" />
          <source src="/assets/job-marketplace-hero-video.webm" type="video/webm" />
          {/* Fallback image in case browser blocks video element */}
          <img 
            src="/assets/hero-poster.jpg" 
            alt="FastJobs Career Network" 
            className="w-full h-full object-cover" 
          />
        </video>

        {/* Interactive canvas particle mesh */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full opacity-60 pointer-events-none"
        />

        {/* Subtle Dark Overlays for pristine UI readability & dark navy atmosphere */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#040816] via-[#040816]/75 to-[#040816]/85" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_40%,rgba(6,182,212,0.12),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.15),transparent_40%)]" />
      </div>

      {/* Floating Ambient AI Decorative Badge Rings */}
      <div className="absolute top-12 left-10 hidden xl:flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-cyan-500/20 shadow-xl text-xs text-slate-300 animate-bounce duration-1000">
        <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
        <span className="font-semibold text-cyan-300">Live AI Matching:</span>
        <span>98.4% Placement Fit</span>
      </div>

      <div className="absolute bottom-16 right-10 hidden xl:flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-blue-500/20 shadow-xl text-xs text-slate-300">
        <Building className="w-4 h-4 text-blue-400" />
        <span>Verified Top Tech Employers: <strong className="text-white">650+</strong></span>
      </div>

      {/* Hero Content Layer (High z-index) */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
        
        {/* Intelligence Tag */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-400/30 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-5 shadow-lg shadow-cyan-950/50 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>FastJobs AI • Find Jobs Faster with AI</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl font-sans">
          Find Jobs Faster with <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">AI</span>
        </h1>

        {/* Supporting Text */}
        <p className="mt-4 text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl font-normal leading-relaxed">
          Discover jobs, research companies, analyze salaries, improve resumes, and make better career decisions with FastJobs AI.
        </p>

        {/* Center Search Interface (Glassmorphism & High Interactivity) */}
        <div className="mt-8 w-full max-w-4xl">
          <form 
            onSubmit={handleSearchSubmit}
            className="p-2 sm:p-2.5 rounded-2xl sm:rounded-3xl bg-[#0a1128]/80 backdrop-blur-xl border border-cyan-500/30 shadow-2xl shadow-cyan-950/70 flex flex-col md:flex-row items-stretch gap-2 transition-all hover:border-cyan-400/50"
          >
            {/* First Input: Search jobs, keywords, or companies */}
            <div className="flex-1 flex items-center gap-3 px-4 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-slate-900/90 border border-slate-800 focus-within:border-cyan-400/60 focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all">
              <Search className="w-5 h-5 text-cyan-400 shrink-0" />
              <input
                id="hero-search-keyword"
                type="text"
                value={inputKeyword}
                onChange={(e) => setInputKeyword(e.target.value)}
                placeholder="Search jobs, keywords, or companies"
                className="w-full bg-transparent text-white placeholder-slate-400 text-sm sm:text-base outline-none"
              />
            </div>

            {/* Second Input: Job Location */}
            <div className="w-full md:w-72 flex items-center gap-3 px-4 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-slate-900/90 border border-slate-800 focus-within:border-cyan-400/60 focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all">
              <MapPin className="w-5 h-5 text-blue-400 shrink-0" />
              <input
                id="hero-search-location"
                type="text"
                value={inputLocation}
                onChange={(e) => setInputLocation(e.target.value)}
                placeholder="Job Location (e.g. Remote, SF, NY)"
                className="w-full bg-transparent text-white placeholder-slate-400 text-sm sm:text-base outline-none"
              />
            </div>

            {/* Search Job Button */}
            <button
              id="hero-search-btn"
              type="submit"
              className="px-7 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white font-semibold text-sm sm:text-base shadow-lg shadow-cyan-600/30 hover:shadow-cyan-400/50 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <span>Search Job</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Trending Tags / Suggestions */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1 font-medium text-slate-300">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              Popular:
            </span>
            {[
              { label: 'AI Engineer', kw: 'AI' },
              { label: 'Remote', kw: '', loc: 'Remote' },
              { label: 'React / TypeScript', kw: 'React' },
              { label: 'Staff Designer', kw: 'Product Designer' },
              { label: 'DevOps & Cloud', kw: 'DevOps' },
              { label: '$200k+ Tech', kw: 'Senior' }
            ].map((tag, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickTagClick(tag.kw, tag.loc)}
                className="px-2.5 py-1 rounded-full bg-slate-900/70 border border-slate-800 hover:border-cyan-400/40 hover:bg-cyan-950/30 text-slate-300 hover:text-cyan-300 transition-all"
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live Marketplace Highlights */}
        <div className="mt-8 grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl w-full border-t border-slate-800/80 pt-5 text-center">
          <div className="flex flex-col items-center">
            <span className="text-xl sm:text-2xl font-black text-white">
              {jobs.length * 120 + 24}+
            </span>
            <span className="text-[11px] sm:text-xs text-slate-400 font-medium">
              Verified Open Roles
            </span>
          </div>
          <div className="flex flex-col items-center border-x border-slate-800/80 px-2">
            <span className="text-xl sm:text-2xl font-black text-cyan-400">
              $178k
            </span>
            <span className="text-[11px] sm:text-xs text-slate-400 font-medium">
              Avg Market Salary
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xl sm:text-2xl font-black text-blue-400">
              1-Click
            </span>
            <span className="text-[11px] sm:text-xs text-slate-400 font-medium">
              AI Resume Match
            </span>
          </div>
        </div>

      </div>
    </section>
  );
};
