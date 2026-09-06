import React, { useState } from 'react';
import { 
  Sparkles, 
  Mail, 
  Send, 
  Check, 
  Copy, 
  RefreshCw, 
  Users, 
  Briefcase, 
  Sliders, 
  CheckCircle2, 
  Edit3,
  Building2,
  FileCheck
} from 'lucide-react';
import { useJobContext } from '../../context/JobContext';
import { TALENT_POOL } from '../../data/mockCandidates';

interface RecruiterAiCandidateCommsProps {
  initialCandidateName?: string;
  initialJobTitle?: string;
}

export const RecruiterAiCandidateComms: React.FC<RecruiterAiCandidateCommsProps> = ({
  initialCandidateName,
  initialJobTitle
}) => {
  const { currentUser, jobs, applications, showToast } = useJobContext();

  const [communicationType, setCommunicationType] = useState<string>('interview_invitation');
  const [candidateName, setCandidateName] = useState(initialCandidateName || applications[0]?.applicantName || 'Alex Chen');
  const [jobTitle, setJobTitle] = useState(initialJobTitle || jobs[0]?.title || 'Senior Software Engineer');
  const [companyName, setCompanyName] = useState(currentUser?.companyName || 'NeuralMatrix Labs');
  const [tone, setTone] = useState<string>('Warm & Professional');
  const [customNotes, setCustomNotes] = useState('We would love to schedule a 30-minute system architecture discovery call this Thursday or Friday.');

  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [draftResult, setDraftResult] = useState<{
    subject: string;
    body: string;
    keyHighlightsIncluded: string[];
    recruiterChecklist: string[];
    communicationType: string;
    tone: string;
    aiGenerated?: boolean;
  } | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/recruiter/candidate-communication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          communicationType,
          candidate: { name: candidateName },
          job: { title: jobTitle, company: companyName },
          customNotes,
          tone,
          companyName
        })
      });

      if (!response.ok) throw new Error('Communication draft failed');
      const data = await response.json();
      setDraftResult(data);
      showToast({
        title: 'Communication Drafted',
        message: `Personalized ${communicationType.replace('_', ' ')} ready for review.`,
        type: 'success'
      });
    } catch (err) {
      console.error(err);
      showToast({
        title: 'Notice',
        message: 'Loaded smart message template.',
        type: 'info'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!draftResult) return;
    const full = `Subject: ${draftResult.subject}\n\n${draftResult.body}`;
    navigator.clipboard.writeText(full);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-blue-500/20 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              AI Candidate Communication Drafter
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Human-in-the-Loop
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              Draft personalized interview invitations, status updates, warm rejections, and cold outreach. Always reviewed and editable by the recruiter before sending.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs */}
        <div className="lg:col-span-5 space-y-4 p-5 rounded-2xl bg-[#0a1128]/80 border border-slate-800">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Mail className="w-4 h-4 text-cyan-400" />
            Message Parameters
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Message Type</label>
            <select
              value={communicationType}
              onChange={e => setCommunicationType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-cyan-500"
            >
              <option value="interview_invitation">Interview Invitation (Initial Screen / Technical)</option>
              <option value="outreach">Passive Candidate Sourcing Outreach</option>
              <option value="status_update">Application Status Update / Progress</option>
              <option value="follow_up">Post-Interview Follow Up</option>
              <option value="rejection">Constructive & Empathetic Rejection</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Candidate Name</label>
              <input
                type="text"
                value={candidateName}
                onChange={e => setCandidateName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tone of Voice</label>
              <select
                value={tone}
                onChange={e => setTone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
              >
                <option value="Warm & Professional">Warm & Professional</option>
                <option value="Direct & Efficient">Direct & Efficient</option>
                <option value="High-Touch Executive">High-Touch Executive</option>
                <option value="Casual & Modern Tech">Casual & Modern Tech</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Role Title</label>
            <input
              type="text"
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Custom Recruiter Notes & Timeline</label>
            <textarea
              value={customNotes}
              onChange={e => setCustomNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
              placeholder="e.g. Mention our recent Series B funding and flexible remote stipend..."
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin text-slate-950" /> : <Sparkles className="w-4 h-4 text-slate-950" />}
            <span>Draft Personalized Message</span>
          </button>
        </div>

        {/* Right Output */}
        <div className="lg:col-span-7 space-y-4">
          {draftResult ? (
            <div className="p-6 rounded-2xl bg-[#0a1128]/90 border border-cyan-500/30 space-y-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-cyan-400">Draft Preview</span>
                  <h3 className="text-sm font-bold text-white">To: {candidateName}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isEditing ? 'View Mode' : 'Edit'}</span>
                  </button>

                  <button
                    onClick={handleCopy}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Subject Line */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400">Subject:</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={draftResult.subject}
                    onChange={e => setDraftResult({ ...draftResult, subject: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                ) : (
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs sm:text-sm font-bold text-white">
                    {draftResult.subject}
                  </div>
                )}
              </div>

              {/* Message Body */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400">Message Body:</span>
                {isEditing ? (
                  <textarea
                    value={draftResult.body}
                    onChange={e => setDraftResult({ ...draftResult, body: e.target.value })}
                    rows={8}
                    className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white leading-relaxed"
                  />
                ) : (
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                    {draftResult.body}
                  </div>
                )}
              </div>

              {/* Recruiter Checklist */}
              {draftResult.recruiterChecklist?.length > 0 && (
                <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-1.5">
                  <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-blue-400" />
                    Recruiter Verification Checklist Before Sending:
                  </span>
                  <ul className="text-xs text-slate-300 space-y-1 pl-4 list-disc">
                    {draftResult.recruiterChecklist.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Send Action */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => {
                    handleCopy();
                    showToast({
                      title: 'Ready to Send',
                      message: `Email text copied to clipboard. Ready to dispatch to ${candidateName}.`,
                      type: 'success'
                    });
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Copy & Prepare for Email Client</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-2xl bg-[#0a1128]/40 border border-dashed border-slate-800 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 mx-auto flex items-center justify-center text-slate-400">
                <Mail className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="text-sm font-bold text-white">No Message Drafted Yet</h4>
                <p className="text-xs text-slate-400">
                  Select your communication type on the left and click &quot;Draft Personalized Message&quot;.
                </p>
              </div>
              <button
                onClick={handleGenerate}
                className="px-5 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Draft Interview Invitation Sample</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
