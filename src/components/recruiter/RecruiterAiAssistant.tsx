import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  RefreshCw, 
  Briefcase, 
  Users, 
  FileText, 
  CheckCircle2, 
  ChevronRight,
  MessageSquare,
  Building2,
  Trash2
} from 'lucide-react';
import { useJobContext } from '../../context/JobContext';

export const RecruiterAiAssistant: React.FC = () => {
  const { currentUser, jobs, applications, showToast } = useJobContext();

  const [messages, setMessages] = useState<Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    actions?: Array<{ label: string; action: string }>;
  }>>([
    {
      id: 'init-1',
      role: 'assistant',
      content: `### Welcome to FastJobs AI Recruiter Assistant\n\nI am your specialized talent acquisition copilot for **${currentUser?.companyName || 'NeuralMatrix Labs'}**. How can I accelerate your hiring pipeline today?\n\n**Quick actions:**\n- Summarize candidate strengths for an open role\n- Optimize job descriptions for technical engagement\n- Draft outreach templates and interview rubrics\n- Diagnose pipeline conversion bottlenecks`,
      timestamp: 'Just now',
      actions: [
        { label: 'Screen Top Applicants', action: 'screen_top' },
        { label: 'Generate Interview Rubric', action: 'interview_rubric' },
        { label: 'Draft Sourcing Message', action: 'draft_sourcing' }
      ]
    }
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend = input) => {
    if (!textToSend.trim() || isLoading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user' as const,
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/recruiter/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          context: {
            companyName: currentUser?.companyName || 'NeuralMatrix Labs',
            activeJobsCount: jobs.filter(j => j.status === 'active').length,
            selectedJobTitle: jobs[0]?.title || 'Senior Software Engineer',
            currentView: 'recruiter_assistant'
          },
          conversationHistory: messages.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            content: m.content
          }))
        })
      });

      if (!response.ok) throw new Error('Assistant failed');
      const data = await response.json();

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant' as const,
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: data.suggestedActions
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant' as const,
          content: '### Sourcing & Screening Tip\n\nWhen evaluating high-caliber candidates on FastJobs AI, prioritize verified open-source contributions and concrete distributed systems metrics. You can also run the **AI CV / Resume Screening** or **AI Candidate Match** tools directly from the tabs above.',
          timestamp: 'Just now'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: 'init-fresh',
        role: 'assistant',
        content: `### FastJobs AI Recruiter Assistant Ready\n\nAsk me anything regarding hiring strategies, candidate profiles, interview plans, or team scaling.`,
        timestamp: 'Just now'
      }
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-blue-500/20 shadow-lg">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                AI Recruiter Copilot Assistant
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Gemini 3.7 Flash
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Strategic recruitment copilot for candidate sourcing, screening summaries, job drafting, workflows, and communication drafting.
              </p>
            </div>
          </div>

          <button
            onClick={handleClear}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-xs flex items-center gap-1.5"
            title="Clear Chat"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Chat Container */}
      <div className="rounded-2xl bg-[#0a1128]/80 border border-slate-800 overflow-hidden flex flex-col h-[560px] shadow-xl">
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shrink-0 mt-1 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed space-y-3 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-tr-xs shadow-md'
                    : 'bg-slate-900/90 text-slate-200 border border-slate-800 rounded-tl-xs shadow-sm'
                }`}
              >
                <div className="whitespace-pre-line">{msg.content}</div>

                {msg.actions && msg.actions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800/80">
                    {msg.actions.map((act, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(`Help me with: ${act.label}`)}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>{act.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                <div
                  className={`text-[10px] ${
                    msg.role === 'user' ? 'text-blue-200 text-right' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 shrink-0 mt-1 border border-slate-700">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-3 justify-start">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span>Synthesizing talent strategy...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask Recruiter Assistant (e.g. 'Draft an outreach for senior ML engineers' or 'Summarize our hiring pipeline')..."
            className="flex-1 px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isLoading}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
