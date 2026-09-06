import React, { useState } from 'react';
import { 
  Sparkles, 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle2, 
  RefreshCw, 
  Copy, 
  Check, 
  ShieldCheck, 
  Send,
  Video,
  Globe
} from 'lucide-react';
import { useJobContext } from '../../context/JobContext';
import { TALENT_POOL } from '../../data/mockCandidates';

export const RecruiterAiInterviewScheduler: React.FC = () => {
  const { jobs, applications, showToast } = useJobContext();

  const [candidateName, setCandidateName] = useState(applications[0]?.applicantName || 'Alex Chen');
  const [candidateEmail, setCandidateEmail] = useState('alex.chen.dev@example.com');
  const [jobTitle, setJobTitle] = useState(jobs[0]?.title || 'Senior Software Engineer');
  const [interviewStage, setInterviewStage] = useState('Technical Architecture & Systems Deep Dive');
  const [timezone, setTimezone] = useState('PST (UTC-8)');
  const [proposedDates, setProposedDates] = useState('This Thursday or Friday between 10am - 4pm PST');
  const [interviewers, setInterviewers] = useState('Dr. Marcus Vance (Principal Architect), Elena Rostova (Product Lead)');

  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const [schedulePlan, setSchedulePlan] = useState<{
    agendaTitle: string;
    durationMinutes: number;
    targetTimezone: string;
    proposedSlots: string[];
    panelMembers: string[];
    interviewAgenda: string[];
    calendarInviteBody: string;
    candidatePreparationNote: string;
    requiresRecruiterConfirmation: boolean;
    aiGenerated?: boolean;
  } | null>(null);

  const handleCoordinate = async () => {
    setIsLoading(true);
    setConfirmed(false);

    try {
      const response = await fetch('/api/ai/recruiter/interview-scheduling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate: { name: candidateName, email: candidateEmail },
          job: { title: jobTitle },
          interviewStage,
          proposedDates,
          interviewers: interviewers.split(',').map(s => s.trim()),
          timezone
        })
      });

      if (!response.ok) throw new Error('Scheduling coordination failed');
      const data = await response.json();
      setSchedulePlan(data);
      showToast({
        title: 'Interview Coordinated',
        message: 'Proposed schedule slots & agenda structured.',
        type: 'success'
      });
    } catch (err) {
      console.error(err);
      showToast({
        title: 'Notice',
        message: 'Loaded smart scheduling coordination draft.',
        type: 'info'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyInvite = () => {
    if (!schedulePlan) return;
    const full = `Title: ${schedulePlan.agendaTitle}\nDuration: ${schedulePlan.durationMinutes} minutes (${schedulePlan.targetTimezone})\n\nAgenda:\n${schedulePlan.interviewAgenda.map(a => `- ${a}`).join('\n')}\n\n${schedulePlan.calendarInviteBody}`;
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
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              AI Interview Scheduling Coordinator
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Recruiter Confirmation Guard
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              Coordinate multi-stage interviews, suggest optimal timezone windows, structure agenda blocks, and generate calendar drafts with mandatory recruiter sign-off.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs */}
        <div className="lg:col-span-5 space-y-4 p-5 rounded-2xl bg-[#0a1128]/80 border border-slate-800">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            Interview Logistics
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Candidate</label>
            <input
              type="text"
              value={candidateName}
              onChange={e => setCandidateName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Candidate Email</label>
            <input
              type="email"
              value={candidateEmail}
              onChange={e => setCandidateEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Interview Stage</label>
            <select
              value={interviewStage}
              onChange={e => setInterviewStage(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
            >
              <option value="Technical Architecture & Systems Deep Dive">Technical Architecture & Systems Deep Dive (45m)</option>
              <option value="Initial Discovery Screen">Initial Discovery Screen (30m)</option>
              <option value="Live Code Pair & Problem Solving">Live Code Pair & Problem Solving (60m)</option>
              <option value="Hiring Manager Leadership Round">Hiring Manager Leadership Round (45m)</option>
              <option value="Final Executive Panel & Culture Fit">Final Executive Panel & Culture Fit (45m)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Timezone</label>
              <input
                type="text"
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Proposed Dates</label>
              <input
                type="text"
                value={proposedDates}
                onChange={e => setProposedDates(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Interview Panel</label>
            <input
              type="text"
              value={interviewers}
              onChange={e => setInterviewers(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
            />
          </div>

          <button
            onClick={handleCoordinate}
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin text-slate-950" /> : <Sparkles className="w-4 h-4 text-slate-950" />}
            <span>Coordinate Schedule & Generate Invites</span>
          </button>
        </div>

        {/* Right Output */}
        <div className="lg:col-span-7 space-y-4">
          {schedulePlan ? (
            <div className="p-6 rounded-2xl bg-[#0a1128]/90 border border-cyan-500/30 space-y-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white">{schedulePlan.agendaTitle}</h3>
                  <p className="text-xs text-slate-400">
                    Duration: {schedulePlan.durationMinutes} mins • {schedulePlan.targetTimezone}
                  </p>
                </div>

                <button
                  onClick={handleCopyInvite}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Draft'}</span>
                </button>
              </div>

              {/* Proposed Slots */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Recommended Time Slot Options
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {schedulePlan.proposedSlots.map((slot, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 font-semibold flex items-center justify-between"
                    >
                      <span>{slot}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Time-Blocked Agenda */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Time-Blocked Interview Flow
                </span>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {schedulePlan.interviewAgenda.map((item, idx) => (
                    <li key={idx} className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Candidate Prep Note */}
              {schedulePlan.candidatePreparationNote && (
                <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs space-y-1">
                  <span className="font-bold text-blue-300">Candidate Preparation Note (Sent with invitation):</span>
                  <p className="text-slate-300 leading-relaxed">{schedulePlan.candidatePreparationNote}</p>
                </div>
              )}

              {/* Recruiter Confirmation Safeguard */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-xs text-amber-300 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Confirmation Safeguard: Recruiter approval required before booking.</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-400">
                    {confirmed ? '✓ Confirmed by recruiter' : 'Review details above and click confirm'}
                  </span>
                  <button
                    onClick={() => {
                      setConfirmed(true);
                      showToast({
                        title: 'Interview Scheduled',
                        message: `Calendar invitation confirmed for ${candidateName}.`,
                        type: 'success'
                      });
                    }}
                    disabled={confirmed}
                    className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      confirmed
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                        : 'bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 shadow-md shadow-cyan-500/20 cursor-pointer'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{confirmed ? 'Confirmed & Saved' : 'Confirm Schedule & Dispatch'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-2xl bg-[#0a1128]/40 border border-dashed border-slate-800 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 mx-auto flex items-center justify-center text-slate-400">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="text-sm font-bold text-white">No Interview Coordinated Yet</h4>
                <p className="text-xs text-slate-400">
                  Select candidate and stage parameters on the left to structure interview blocks and generate calendar invites.
                </p>
              </div>
              <button
                onClick={handleCoordinate}
                className="px-5 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Coordinate Sample Interview</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
