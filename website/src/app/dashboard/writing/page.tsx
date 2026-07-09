'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function WritingPractice() {
  const [prompts, setPrompts] = useState<any[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<any>(null);
  const [mode, setMode] = useState<'PRACTICE' | 'EXAM'>('PRACTICE');
  const [userText, setUserText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [examSuccess, setExamSuccess] = useState(false);

  // Timer for Exam Mode (40 minutes = 2400 seconds)
  const [timeLeft, setTimeLeft] = useState(2400);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    fetchPrompts();
  }, []);

  useEffect(() => {
    let interval: any = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      handleSubmit(); // Auto submit when time runs out
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const fetchPrompts = async () => {
    try {
      const data = await api.request<any[]>('/content/writing/prompts');
      setPrompts(data);
      if (data.length > 0) setSelectedPrompt(data[0]);
    } catch (err) {
      console.error('Failed to fetch writing prompts', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartPractice = () => {
    setUserText('');
    setFeedback(null);
    setExamSuccess(false);
    if (mode === 'EXAM') {
      setTimeLeft(2400); // 40 mins
      setTimerActive(true);
    } else {
      setTimerActive(false);
    }
  };

  const handleSubmit = async () => {
    if (!userText.trim()) return;
    setSubmitting(true);
    setTimerActive(false);

    try {
      const result = await api.request<any>('/content/writing/submit', {
        method: 'POST',
        body: JSON.stringify({
          promptId: selectedPrompt.id,
          userText,
          mode,
        }),
      });

      if (mode === 'EXAM') {
        setExamSuccess(true);
      } else {
        setFeedback(result.feedbackJson);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to submit writing response.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const wordCount = userText.trim() === '' ? 0 : userText.trim().split(/\s+/).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy text-white flex flex-col">
      <header className="h-16 border-b border-primary-light/30 bg-primary/45 backdrop-blur-md flex items-center justify-between px-8 md:px-16">
        <Link href="/dashboard" className="text-xl font-bold tracking-wider flex items-center gap-1.5">
          <span className="text-gold">BandUp</span> IELTS
        </Link>
        <Link href="/dashboard" className="text-xs font-bold text-slate-300 hover:text-gold transition-colors">
          Exit Practice
        </Link>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Side: Select Prompts & Mode */}
        <div className="bg-primary/25 border border-primary-light/30 rounded-2xl p-6 shadow-xl space-y-6 self-start">
          <div>
            <h3 className="text-white font-bold text-sm mb-3">1. Select Mode</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMode('PRACTICE')}
                disabled={timerActive}
                className={`py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                  mode === 'PRACTICE'
                    ? 'bg-gold border-gold text-primary shadow-lg shadow-gold/25'
                    : 'bg-navy/40 border-primary-light text-slate-400 hover:text-white'
                }`}
              >
                Practice Mode
              </button>
              <button
                onClick={() => setMode('EXAM')}
                disabled={timerActive}
                className={`py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                  mode === 'EXAM'
                    ? 'bg-gold border-gold text-primary shadow-lg shadow-gold/25'
                    : 'bg-navy/40 border-primary-light text-slate-400 hover:text-white'
                }`}
              >
                Exam Mode
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
              {mode === 'PRACTICE'
                ? '⭐ Practice untimed with real-time AI scoring, step-by-step model rewrites, and strategic time-management tips!'
                : '⏱️ Strict 40-minute timer. Submissions will be logged quietly for official tutor grading evaluation.'}
            </p>
          </div>

          <div>
            <h3 className="text-white font-bold text-sm mb-3">2. Choose Writing Prompt</h3>
            <div className="space-y-3">
              {prompts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    if (!timerActive) {
                      setSelectedPrompt(p);
                      setUserText('');
                      setFeedback(null);
                    }
                  }}
                  disabled={timerActive}
                  className={`w-full text-left p-3 rounded-xl border text-xs leading-relaxed transition-all cursor-pointer ${
                    selectedPrompt?.id === p.id
                      ? 'bg-primary border-gold text-white font-semibold'
                      : 'bg-navy/35 border-primary-light/40 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-gold">{p.taskType}</span>
                    <span className="text-[9px] text-slate-500">{p.difficulty}</span>
                  </div>
                  {p.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Workspace */}
        <div className="md:col-span-2 space-y-6">
          {selectedPrompt && (
            <div className="bg-primary/25 border border-primary-light/30 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex justify-between items-center border-b border-primary-light/20 pb-3">
                <h2 className="text-white font-bold text-lg">{selectedPrompt.title}</h2>
                {timerActive && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-1.5 rounded-lg text-xs font-mono font-bold animate-pulse">
                    ⏱️ {formatTime(timeLeft)}
                  </div>
                )}
              </div>
              <p className="text-slate-300 text-xs leading-relaxed bg-navy/40 p-4 rounded-xl border border-primary-light/10 italic">
                {selectedPrompt.promptText}
              </p>

              {!timerActive && !feedback && !examSuccess ? (
                <button
                  onClick={handleStartPractice}
                  className="bg-gold hover:bg-gold-dark text-primary font-bold px-6 py-2.5 rounded-lg text-xs tracking-wider cursor-pointer transition-colors"
                >
                  {mode === 'EXAM' ? 'Start Exam Timer' : 'Start Practice'}
                </button>
              ) : null}

              {(timerActive || feedback || examSuccess) && (
                <div className="space-y-4">
                  <textarea
                    rows={12}
                    disabled={!timerActive && mode === 'EXAM'}
                    value={userText}
                    onChange={(e) => setUserText(e.target.value)}
                    placeholder="Type your essay response here..."
                    className="w-full bg-navy/55 border border-primary-light/60 focus:border-gold rounded-xl p-4 text-white text-xs leading-relaxed focus:outline-none"
                  />
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Word Count: <span className="text-white font-bold">{wordCount}</span></span>
                    {timerActive && (
                      <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="bg-emerald hover:bg-emerald-dark text-primary font-bold px-6 py-2 rounded-lg text-xs cursor-pointer transition-colors"
                      >
                        {submitting ? 'Submitting...' : 'Submit Essay'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Practice Mode AI Feedback */}
          {feedback && mode === 'PRACTICE' && (
            <div className="bg-primary/25 border border-primary-light/40 rounded-2xl p-6 shadow-2xl space-y-6">
              <h3 className="text-gold font-bold text-base border-b border-primary-light/20 pb-2">AI Correction & Strategies</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-navy/40 p-3 rounded-lg border border-primary-light/15 text-center">
                  <p className="text-slate-500 text-[9px] uppercase font-bold">Estimated Band</p>
                  <p className="text-gold text-xl font-black mt-0.5">Band {feedback.estimatedBand}</p>
                </div>
                <div className="bg-navy/40 p-3 rounded-lg border border-primary-light/15 text-center">
                  <p className="text-slate-500 text-[9px] uppercase font-bold">Task Achievement</p>
                  <p className="text-slate-300 text-sm font-bold mt-0.5">{feedback.breakdown?.taskAchievement || 6.0}</p>
                </div>
                <div className="bg-navy/40 p-3 rounded-lg border border-primary-light/15 text-center">
                  <p className="text-slate-500 text-[9px] uppercase font-bold">Coherence & Cohesion</p>
                  <p className="text-slate-300 text-sm font-bold mt-0.5">{feedback.breakdown?.coherenceCohesion || 6.0}</p>
                </div>
                <div className="bg-navy/40 p-3 rounded-lg border border-primary-light/15 text-center">
                  <p className="text-slate-500 text-[9px] uppercase font-bold">Grammar Accuracy</p>
                  <p className="text-slate-300 text-sm font-bold mt-0.5">{feedback.breakdown?.grammarAccuracy || 6.0}</p>
                </div>
              </div>

              {/* Time management strategy recommendations */}
              <div className="bg-navy/40 p-4 rounded-xl border border-primary-light/10 space-y-2">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">⏱️ Time Management Advice</p>
                <p className="text-slate-300 text-xs leading-relaxed">
                  In Task 1, spend no more than 20 minutes describing the visual details. In Task 2, allocate 40 minutes: 5 minutes planning, 30 minutes writing, and 5 minutes proofreading to eliminate agreement errors.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-white font-bold text-xs mb-1.5">What You Did Well</h4>
                  <p className="text-slate-300 text-xs leading-relaxed">{feedback.wellDone}</p>
                </div>
                {feedback.mistakes?.length > 0 && (
                  <div>
                    <h4 className="text-white font-bold text-xs mb-1.5">Key Grammatical Corrections</h4>
                    <ul className="list-disc list-inside text-slate-300 text-xs space-y-1">
                      {feedback.mistakes.map((m: string, idx: number) => (
                        <li key={idx}>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div>
                  <h4 className="text-white font-bold text-xs mb-1.5">High Band Model Rewrite</h4>
                  <pre className="text-slate-300 text-xs font-sans bg-navy/40 p-4 border border-primary-light/15 rounded-xl whitespace-pre-wrap leading-relaxed">
                    {feedback.improvedAnswer}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Exam Mode Success Popup */}
          {examSuccess && (
            <div className="bg-emerald/10 border border-emerald/20 text-emerald p-6 rounded-2xl text-center space-y-4">
              <h3 className="text-base font-bold">🎉 Exam Submitted Successfully!</h3>
              <p className="text-xs leading-relaxed max-w-md mx-auto">
                Your writing response has been locked and archived under **Exam Mode**. An official IELTS evaluator will grade it, and you can view the final band score in your history records shortly.
              </p>
              <button
                onClick={() => setExamSuccess(false)}
                className="bg-emerald text-primary font-bold px-4 py-2 rounded-lg text-xs hover:bg-emerald-dark"
              >
                Practice Again
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
