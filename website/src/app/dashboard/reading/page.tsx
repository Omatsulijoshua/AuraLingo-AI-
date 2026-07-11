'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function ReadingPractice() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [mode, setMode] = useState<'PRACTICE' | 'EXAM'>('PRACTICE');
  const [answerText, setAnswerText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [examSuccess, setExamSuccess] = useState(false);

  // Timer for Exam Mode (30 minutes = 1800 seconds)
  const [timeLeft, setTimeLeft] = useState(1800);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    fetchQuestions();
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

  const fetchQuestions = async () => {
    try {
      // 1. Fetch modules to resolve Reading ID
      const modules = await api.request<any[]>('/content/modules');
      const readingMod = modules.find((m) => m.name.toUpperCase() === 'READING');
      if (!readingMod) {
        setQuestions([]);
        return;
      }

      // 2. Fetch reading questions
      const data = await api.request<any[]>(`/content/questions?moduleId=${readingMod.id}`);
      setQuestions(data || []);
      if (data && data.length > 0) setSelectedQuestion(data[0]);
    } catch (err) {
      console.error('Failed to fetch reading questions', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartPractice = () => {
    setAnswerText('');
    setFeedback(null);
    setExamSuccess(false);
    if (mode === 'EXAM') {
      setTimeLeft(1800); // 30 mins
      setTimerActive(true);
    } else {
      setTimerActive(false);
    }
  };

  const handleSubmit = async () => {
    if (!answerText.trim() || !selectedQuestion) return;
    setSubmitting(true);
    setTimerActive(false);

    try {
      const result = await api.request<any>(`/content/questions/${selectedQuestion.id}/submit`, {
        method: 'POST',
        body: JSON.stringify({
          answerText: answerText.trim(),
          mode,
        }),
      });

      if (mode === 'EXAM') {
        setExamSuccess(true);
      } else {
        setFeedback({
          isCorrect: result.isCorrect,
          correctText: result.correctAnswerStr || (selectedQuestion.options?.find((o: any) => o.isCorrect)?.optionLetter) || 'Correct answer details',
          explanation: result.feedback || 'No explanation available',
        });
      }
    } catch (err) {
      console.error(err);
      alert('Failed to submit answer.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

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
        
        {/* Left Side: Select Questions & Mode */}
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
                : '⏱️ Strict 30-minute timer. Submissions will be logged quietly for official tutor grading evaluation.'}
            </p>
          </div>

          <div>
            <h3 className="text-white font-bold text-sm mb-3">2. Choose Question</h3>
            {questions.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No reading questions generated yet. Go to Admin Dashboard to spin questions.</p>
            ) : (
              <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                {questions.map((q, idx) => (
                  <button
                    key={q.id}
                    onClick={() => {
                      if (!timerActive) {
                        setSelectedQuestion(q);
                        setAnswerText('');
                        setFeedback(null);
                        setExamSuccess(false);
                      }
                    }}
                    disabled={timerActive}
                    className={`w-full text-left p-3 rounded-xl border text-xs leading-relaxed transition-all cursor-pointer ${
                      selectedQuestion?.id === q.id
                        ? 'bg-primary border-gold text-white font-semibold'
                        : 'bg-navy/35 border-primary-light/40 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-gold">Question #{idx + 1}</span>
                      <span className="text-[9px] text-slate-500">{q.difficulty}</span>
                    </div>
                    {q.instruction || 'Read and answer the question'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Workspace */}
        <div className="md:col-span-2 space-y-6">
          {selectedQuestion ? (
            <div className="bg-primary/25 border border-primary-light/30 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex justify-between items-center border-b border-primary-light/20 pb-3">
                <h2 className="text-white font-bold text-lg">Reading Workspace</h2>
                {timerActive && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-1.5 rounded-lg text-xs font-mono font-bold animate-pulse">
                    ⏱️ {formatTime(timeLeft)}
                  </div>
                )}
              </div>

              {/* Reading passage text if readingPassage exists */}
              {selectedQuestion.readingPassage && (
                <div className="bg-navy/40 border border-primary-light/10 p-5 rounded-xl space-y-2 max-h-[30vh] overflow-y-auto">
                  <p className="text-gold font-bold text-sm uppercase tracking-wider">{selectedQuestion.readingPassage.title}</p>
                  <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap mt-2">{selectedQuestion.readingPassage.text}</p>
                </div>
              )}

              {/* Question Details */}
              <div className="bg-navy/40 p-5 rounded-xl border border-primary-light/10 space-y-3">
                <p className="text-gold font-bold text-xs uppercase tracking-wider">Instructions</p>
                <p className="text-slate-300 text-xs italic">{selectedQuestion.instruction}</p>
                
                <p className="text-white font-semibold text-sm mt-4">{selectedQuestion.questionText}</p>
              </div>

              {/* Answer Input Workspace */}
              {!timerActive && !feedback && !examSuccess ? (
                <button
                  onClick={handleStartPractice}
                  className="bg-gold hover:bg-gold-dark text-primary font-bold px-6 py-2.5 rounded-lg text-xs tracking-wider cursor-pointer transition-colors"
                >
                  {mode === 'EXAM' ? 'Start Exam Timer' : 'Start Practice'}
                </button>
              ) : (
                <div className="space-y-4">
                  {selectedQuestion.questionType === 'MULTIPLE_CHOICE' ? (
                    <div className="space-y-2.5">
                      {selectedQuestion.options?.map((opt: any) => (
                        <label 
                          key={opt.id}
                          className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                            answerText === opt.optionLetter
                              ? 'bg-primary border-gold text-white font-semibold'
                              : 'bg-navy/30 border-primary-light/10 hover:border-primary-light/30 text-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="option"
                            value={opt.optionLetter}
                            checked={answerText === opt.optionLetter}
                            onChange={() => setAnswerText(opt.optionLetter)}
                            disabled={!timerActive && mode === 'EXAM'}
                            className="w-4 h-4 accent-gold"
                          />
                          <span className="font-extrabold text-gold text-xs">{opt.optionLetter}.</span>
                          <span className="text-xs">{opt.optionText}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder="Type your blank fill answer here..."
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      disabled={!timerActive && mode === 'EXAM'}
                      className="w-full bg-navy/55 border border-primary-light/60 focus:border-gold rounded-xl px-4 py-3 text-white text-xs leading-relaxed focus:outline-none"
                    />
                  )}

                  <div className="flex justify-end items-center text-xs pt-2">
                    {timerActive && (
                      <button
                        onClick={handleSubmit}
                        disabled={submitting || !answerText.trim()}
                        className="bg-emerald hover:bg-emerald-dark text-primary font-bold px-6 py-2.5 rounded-lg text-xs cursor-pointer transition-all disabled:opacity-40"
                      >
                        {submitting ? 'Submitting...' : 'Submit Answer'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-primary/25 border border-primary-light/30 rounded-2xl p-12 text-center text-slate-500 text-xs shadow-xl">
              Select a reading question from the sidebar to begin.
            </div>
          )}

          {/* Practice Mode AI Feedback */}
          {feedback && mode === 'PRACTICE' && (
            <div className="bg-primary/25 border border-primary-light/40 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-2 border-b border-primary-light/20 pb-2">
                {feedback.isCorrect ? (
                  <span className="text-emerald text-lg">✅ Correct!</span>
                ) : (
                  <span className="text-red-500 text-lg">❌ Incorrect</span>
                )}
              </div>
              <p className="text-xs text-slate-300">
                <span className="font-bold text-gold">Correct Answer:</span> {feedback.correctText}
              </p>

              <div className="bg-navy/40 p-4 rounded-xl border border-primary-light/10 space-y-2">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">💡 AI Explanation & Strategies</p>
                <div className="text-slate-300 text-xs leading-relaxed whitespace-pre-line">
                  {feedback.explanation}
                </div>
              </div>
            </div>
          )}

          {/* Exam Mode Success Popup */}
          {examSuccess && (
            <div className="bg-emerald/10 border border-emerald/20 text-emerald p-6 rounded-2xl text-center space-y-4">
              <h3 className="text-base font-bold">🎉 Question Answered successfully!</h3>
              <p className="text-xs leading-relaxed max-w-md mx-auto">
                Your response has been saved. In **Exam Mode**, correctness is logged silently for tutor review. Choose another question from the sidebar.
              </p>
              <button
                onClick={() => setExamSuccess(false)}
                className="bg-emerald text-primary font-bold px-4 py-2 rounded-lg text-xs hover:bg-emerald-dark"
              >
                Continue Practice
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
