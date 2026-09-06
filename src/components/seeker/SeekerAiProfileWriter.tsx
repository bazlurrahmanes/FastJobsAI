import React, { useState } from 'react';
import { 
  Sparkles, 
  Wand2, 
  Check, 
  Copy, 
  CheckCircle2, 
  User, 
  ArrowRight, 
  Save, 
  Edit3,
  FileCheck
} from 'lucide-react';
import { useJobContext } from '../../context/JobContext';

export const SeekerAiProfileWriter: React.FC = () => {
  const { currentUser, updateProfile } = useJobContext();
  const [targetRole, setTargetRole] = useState(currentUser?.title || 'Senior Software Engineer');
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);

  const handleGenerateProfileContent = async () => {
    setLoading(true);
    setAppliedNotice(null);
    try {
      const res = await fetch('/api/ai/profile-writer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentProfile: currentUser,
          targetRole
        })
      });
      if (res.ok) {
        const data = await res.json();
        setProfileData(data);
      }
    } catch (e) {
      console.error('Error generating profile content:', e);
    } finally {
      setLoading(false);
    }
  };

  const applyHeadline = (headlineText: string) => {
    if (!currentUser) return;
    updateProfile({
      title: headlineText
    });
    setAppliedNotice(`Updated headline to: "${headlineText}"`);
    setTimeout(() => setAppliedNotice(null), 3000);
  };

  const applyBio = (bioText: string) => {
    if (!currentUser) return;
    updateProfile({
      bio: bioText
    });
    setAppliedNotice(`Applied bio to your candidate profile!`);
    setTimeout(() => setAppliedNotice(null), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-cyan-950/60 via-[#0a1128] to-blue-950/60 border border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold mb-2 border border-cyan-500/30">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            AI Feature #14 • High-Conversion Profile Copywriter
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            AI Profile Writer & Headline Enhancer
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Generate impactful recruiter headlines, professional summary narratives, and work achievement bullets with 1-click apply.
          </p>
        </div>

        {/* Target Role & Generator Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="Target Career Headline..."
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-cyan-400"
          />
          <button
            onClick={handleGenerateProfileContent}
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
          >
            <Wand2 className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Crafting...' : 'Generate Copy'}</span>
          </button>
        </div>
      </div>

      {/* Notice Banner */}
      {appliedNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{appliedNotice}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center rounded-3xl bg-slate-900/40 border border-slate-800 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Sparkles className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-sm font-semibold text-white">Synthesizing executive headlines, bio narratives, and impact statements...</p>
        </div>
      ) : profileData ? (
        <div className="space-y-6">
          
          {/* Headlines Section */}
          <div className="p-6 rounded-3xl bg-[#0a1128]/90 border border-cyan-500/30 space-y-4">
            <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              <Edit3 className="w-4 h-4 text-cyan-400" />
              High-CTR Profile Headlines
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {profileData.headlines?.map((item: any, idx: number) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between gap-3 text-xs">
                  <div>
                    <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 font-bold text-[10px] uppercase border border-cyan-500/20">
                      {item.style || 'Headline'}
                    </span>
                    <p className="text-white font-medium mt-2 leading-relaxed">
                      "{item.text}"
                    </p>
                  </div>

                  <button
                    onClick={() => applyHeadline(item.text)}
                    className="w-full py-1.5 rounded-xl bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply as Profile Title</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* About / Bio Summaries */}
          <div className="p-6 rounded-3xl bg-[#0a1128]/90 border border-cyan-500/30 space-y-4">
            <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-cyan-400" />
              Executive Bio & Summary Variations
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {profileData.aboutSummaries?.map((bioItem: any, idx: number) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between gap-3 text-xs">
                  <div>
                    <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-400 font-bold text-[10px] uppercase border border-blue-500/20">
                      {bioItem.tone || 'Summary'} Style
                    </span>
                    <p className="text-slate-200 mt-2 leading-relaxed text-[11px]">
                      {bioItem.content}
                    </p>
                  </div>

                  <button
                    onClick={() => applyBio(bioItem.content)}
                    className="w-full py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-emerald-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply as Profile Bio</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      ) : (
        <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 text-slate-400 space-y-3">
          <FileCheck className="w-10 h-10 mx-auto text-cyan-400 opacity-60" />
          <h4 className="text-base font-bold text-white">Generate High-Impact Profile Content</h4>
          <p className="text-xs max-w-md mx-auto">
            Click "Generate Copy" to create high-impact headlines and recruiter bio summaries tailored to your authentic experience.
          </p>
        </div>
      )}

    </div>
  );
};
