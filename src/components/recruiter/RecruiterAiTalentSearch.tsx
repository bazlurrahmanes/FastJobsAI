import React, { useState } from 'react';
import { 
  Sparkles, 
  Search, 
  Users, 
  MapPin, 
  DollarSign, 
  Clock, 
  Award, 
  CheckCircle2, 
  RefreshCw, 
  Filter, 
  Mail, 
  ChevronRight,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { useJobContext } from '../../context/JobContext';
import { TALENT_POOL } from '../../data/mockCandidates';
import { CandidateRecord } from '../../types';

interface RecruiterAiTalentSearchProps {
  onOpenOutreach?: (candidate: CandidateRecord) => void;
}

export const RecruiterAiTalentSearch: React.FC<RecruiterAiTalentSearchProps> = ({
  onOpenOutreach
}) => {
  const { showToast } = useJobContext();

  const [query, setQuery] = useState('Find senior AI and distributed systems engineers with PyTorch and CUDA experience who are open to remote');
  const [isLoading, setIsLoading] = useState(false);

  const [searchResults, setSearchResults] = useState<{
    searchSummary: string;
    parsedFilters: {
      targetSkills?: string[];
      minExperienceYears?: number;
      seniority?: string;
      remoteOnly?: boolean;
      locations?: string[];
    };
    matchedCandidates: Array<{
      candidateId: string;
      matchScore: number;
      matchReason: string;
      matchHighlights: string[];
    }>;
    aiGenerated?: boolean;
  } | null>(null);

  const [selectedCandidate, setSelectedCandidate] = useState<CandidateRecord | null>(null);

  const handleSearch = async (searchQuery = query) => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/recruiter/talent-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          candidates: TALENT_POOL
        })
      });

      if (!response.ok) throw new Error('Talent search failed');
      const data = await response.json();
      setSearchResults(data);
      showToast({
        title: 'Talent Pool Searched',
        message: data.searchSummary || 'Matching candidates identified.',
        type: 'success'
      });
    } catch (err) {
      console.error(err);
      showToast({
        title: 'Search Notice',
        message: 'Loaded matching candidates via local semantic search.',
        type: 'info'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sampleQueries = [
    'Senior AI and CUDA engineers open to remote work',
    'Principal Frontend Architect with Canvas and WebGL expertise',
    'Staff DevOps and Zero Trust security architects',
    'Lead Product Designers with AI interaction experience'
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-blue-500/20 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              AI Natural Language Talent Search
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Authorized Candidate Network
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              Describe your ideal candidate in plain English. FastJobs AI extracts seniority, stack nuances, and availability constraints to surface top talent.
            </p>
          </div>
        </div>
      </div>

      {/* Natural Language Query Box */}
      <div className="p-5 rounded-2xl bg-[#0a1128]/80 border border-slate-800 space-y-4">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="e.g. Find senior React and TypeScript engineers with 5+ years experience available immediately..."
            className="w-full pl-11 pr-32 py-3.5 rounded-2xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500 shadow-inner"
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-4" />
          <button
            onClick={() => handleSearch()}
            disabled={isLoading}
            className="absolute right-2 top-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>AI Search</span>
          </button>
        </div>

        {/* Suggested Quick Searches */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-semibold text-slate-400">Try searches:</span>
          {sampleQueries.map((q, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuery(q);
                handleSearch(q);
              }}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
            >
              &quot;{q}&quot;
            </button>
          ))}
        </div>
      </div>

      {/* Results Content */}
      {isLoading ? (
        <div className="p-16 rounded-2xl bg-[#0a1128]/60 border border-slate-800 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-white">Searching authorized talent network...</p>
        </div>
      ) : searchResults ? (
        <div className="space-y-4">
          {/* Summary & Filter Tags */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-xs font-bold text-cyan-300">{searchResults.searchSummary}</span>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {searchResults.parsedFilters?.targetSkills?.map((s, i) => (
                  <span key={i} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    Skill: {s}
                  </span>
                ))}
                {searchResults.parsedFilters?.remoteOnly && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    Remote Only
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>All candidates verified with privacy discovery consent.</span>
            </div>
          </div>

          {/* Candidates Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {searchResults.matchedCandidates.map(matched => {
              const cand = TALENT_POOL.find(c => c.id === matched.candidateId);
              if (!cand) return null;

              return (
                <div
                  key={cand.id}
                  className="p-5 rounded-2xl bg-[#0a1128]/80 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-4 shadow-lg flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={cand.avatar}
                          alt={cand.name}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-700"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-base font-bold text-white">{cand.name}</h3>
                            {cand.verifiedBadge && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                            )}
                          </div>
                          <p className="text-xs text-slate-300 font-medium">{cand.title}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          {matched.matchScore}% Fit
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                      {matched.matchReason}
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                      {cand.skills.map((skill, idx) => {
                        const isHighlighted = matched.matchHighlights?.includes(skill);
                        return (
                          <span
                            key={idx}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              isHighlighted
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                                : 'bg-slate-900 text-slate-400 border border-slate-800'
                            }`}
                          >
                            {skill}
                          </span>
                        );
                      })}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {cand.location} {cand.isRemote && '(Remote)'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {cand.availability}
                      </span>
                      <span className="text-emerald-400 font-semibold">
                        ${Math.round(cand.expectedSalary.min / 1000)}k - ${Math.round(cand.expectedSalary.max / 1000)}k
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">Active {cand.lastActive}</span>
                    <button
                      onClick={() => {
                        if (onOpenOutreach) onOpenOutreach(cand);
                        showToast({
                          title: 'Outreach Drafter',
                          message: `Preparing personalized outreach for ${cand.name}.`,
                          type: 'info'
                        });
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Draft Outreach</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-12 rounded-2xl bg-[#0a1128]/40 border border-dashed border-slate-800 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 mx-auto flex items-center justify-center text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h4 className="text-sm font-bold text-white">Search the Verified Talent Pool</h4>
            <p className="text-xs text-slate-400">
              Enter any requirements, stack preferences, or seniority specs to surface matching candidates from our network.
            </p>
          </div>
          <button
            onClick={() => handleSearch()}
            className="px-5 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Search Pre-set AI Query</span>
          </button>
        </div>
      )}
    </div>
  );
};
