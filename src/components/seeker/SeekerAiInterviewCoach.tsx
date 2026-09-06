import React, { useState } from 'react';
import { 
  Sparkles, 
  Mic, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Lightbulb, 
  Award, 
  RotateCcw, 
  ChevronRight, 
  Play, 
  Star,
  Zap,
  Briefcase
} from 'lucide-react';
import { useJobContext } from '../../context/JobContext';

export const SeekerAiInterviewCoach: React.FC = () => {
  const { jobs, currentUser } = useJobContext();
  const [targetRole, setTargetRole] = useState(currentUser?.title || 'Senior Software Engineer');
  const [category, setCategory] = useState<'technical' | 'behavioral' | 'system_design'>('technical');
  const [questions, setQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number>(0);
  
  // Interactive answering state
  const [candidateAnswer, setCandidateAnswer] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);

  const fetchQuestions = async () => {
    setLoadingQuestions(true);
    setEvaluationResult(null);
    try {
      const res = await fetch('/api/ai/interview-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole,
          category,
          candidateExperienceYears: 5
        })
      });
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions || []);
        setSelectedQuestionIndex(0);
      }
    } catch (e) {
      console.error('Error fetching interview questions:', e);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleEvaluateAnswer = async () => {
    if (!candidateAnswer.trim() || !currentQ) return;
    setEvaluating(true);
    try {
      const res = await fetch('/api/ai/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQ.question,
          category: currentQ.category || category,
          candidateAnswer,
          targetRole
        })
      });
      if (res.ok) {
        const data = await res.json();
        setEvaluationResult(data);
      }
    } catch (e) {
      console.error('Error evaluating answer:', e);
    } finally {
      setEvaluating(false);
    }
  };

  const currentQ = questions[selectedQuestionIndex];

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950/60 via-[#0a1128] to-cyan-950/60 border border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold mb-2 border border-cyan-500/30">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            AI Feature #5 • Interactive Mock Interview & Real-Time Scoring
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            AI Interview Coach & Readiness Simulator
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Simulate realistic technical and behavioral interview rounds, submit answers, and receive instant rubric scores with ideal model answers.
          </p>
        </div>
      </div>

      {/* Control Panel */}
      <div className="p-5 rounded-3xl bg-[#0a1128]/90 border border-cyan-500/30 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          <div>
            <label className="text-xs font-bold text-slate-300">Target Role:</label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full mt-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300">Interview Track:</label>
            <select
              value={category}
              onChange={(e: any) => setCategory(e.target.value)}
              className="w-full mt-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-cyan-400"
            >
              <option value="technical">Technical & Coding Core</option>
              <option value="system_design">Architecture & System Design</option>
              <option value="behavioral">Behavioral (STAR Method)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchQuestions}
              disabled={loadingQuestions}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20"
            >
              <Play className={`w-3.5 h-3.5 fill-slate-950 ${loadingQuestions ? 'animate-spin' : ''}`} />
              <span>{loadingQuestions ? 'Generating Round...' : 'Start Interview Round'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* Question Selector & Active Question */}
      {questions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Question List Side Panel */}
          <div className="space-y-2 lg:col-span-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Round Questions ({questions.length})
            </span>
            <div className="space-y-2">
              {questions.map((q, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedQuestionIndex(idx);
                    setCandidateAnswer('');
                    setEvaluationResult(null);
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-xs ${
                    selectedQuestionIndex === idx
                      ? 'bg-cyan-950/40 border-cyan-400 text-white shadow-md'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-cyan-300">Question {idx + 1}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-500">{q.difficulty || 'Medium'}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 leading-relaxed">{q.question}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Active Question & Answer Area */}
          <div className="lg:col-span-2 space-y-5">
            
            {/* Question Display Card */}
            <div className="p-6 rounded-3xl bg-[#0a1128]/90 border border-cyan-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 font-bold text-xs border border-cyan-500/40">
                  Question {selectedQuestionIndex + 1} of {questions.length}
                </span>
                <span className="text-xs font-semibold text-slate-400 capitalize">{category.replace('_', ' ')}</span>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                "{currentQ?.question}"
              </h3>

              {currentQ?.context && (
                <p className="text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <strong className="text-slate-300">Scenario Context:</strong> {currentQ.context}
                </p>
              )}

              {/* Answer Input */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Your Response:</label>
                  <span className="text-[11px] text-slate-500">Provide specific examples, trade-offs, and metrics</span>
                </div>
                <textarea
                  value={candidateAnswer}
                  onChange={(e) => setCandidateAnswer(e.target.value)}
                  placeholder="Type your structured answer here (explain your thought process, architecture decisions, or STAR scenario)..."
                  rows={6}
                  className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-400 resize-none leading-relaxed"
                />
              </div>

              {/* Submit Answer */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleEvaluateAnswer}
                  disabled={evaluating || !candidateAnswer.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
                >
                  <Send className={`w-3.5 h-3.5 ${evaluating ? 'animate-spin' : ''}`} />
                  <span>{evaluating ? 'Evaluating with AI Rubric...' : 'Submit Answer for AI Scoring'}</span>
                </button>
              </div>
            </div>

            {/* Instant AI Evaluation Feedback */}
            {evaluationResult && (
              <div className="p-6 rounded-3xl bg-gradient-to-br from-[#0a1128] via-slate-900 to-cyan-950/40 border border-cyan-500/40 space-y-5 animate-in fade-in duration-200">
                
                {/* Score & Verdict Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                      Response Evaluation Rubric
                    </span>
                    <h4 className="text-lg font-black text-white mt-0.5">
                      Interview Readiness: {evaluationResult.score}%
                    </h4>
                  </div>

                  <div className="px-4 py-2 rounded-2xl bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-black text-xl">
                    {evaluationResult.score}/100
                  </div>
                </div>

                {/* Strengths & Missed Points */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30 space-y-2">
                    <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      What You Did Well:
                    </span>
                    <ul className="space-y-1 text-slate-300 pl-4 list-disc">
                      {evaluationResult.strengths?.map((s: string, idx: number) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 space-y-2">
                    <span className="font-bold text-amber-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      Missed Points & Gaps:
                    </span>
                    <ul className="space-y-1 text-slate-300 pl-4 list-disc">
                      {evaluationResult.missedPoints?.map((m: string, idx: number) => (
                        <li key={idx}>{m}</li>
                      ))}
                    </ul>
                  </div>

                </div>

                {/* Model Answer */}
                {evaluationResult.modelAnswer && (
                  <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4 text-cyan-400" />
                      Ideal Model Answer:
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans italic bg-slate-900/60 p-3 rounded-xl">
                      "{evaluationResult.modelAnswer}"
                    </p>
                  </div>
                )}

              </div>
            )}

          </div>

        </div>
      )}

      {/* Initial Empty State */}
      {questions.length === 0 && !loadingQuestions && (
        <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 text-slate-400 space-y-3">
          <Mic className="w-10 h-10 mx-auto text-cyan-400 opacity-60" />
          <h4 className="text-base font-bold text-white">Start Your Mock Interview</h4>
          <p className="text-xs max-w-md mx-auto">
            Choose your target role and track above, then click "Start Interview Round" to receive tailored technical, system design, or behavioral scenarios.
          </p>
        </div>
      )}

    </div>
  );
};
