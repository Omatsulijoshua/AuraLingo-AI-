'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function ListeningPractice() {
  const [audios, setAudios] = useState<any[]>([]);
  const [selectedAudio, setSelectedAudio] = useState<any>(null);
  const [mode, setMode] = useState<'PRACTICE' | 'EXAM'>('PRACTICE');
  const [userAnswers, setUserAnswers] = useState<{ [questionId: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [examSuccess, setExamSuccess] = useState(false);

  // Timer for Exam Mode (30 minutes = 1800 seconds)
  const [timeLeft, setTimeLeft] = useState(1800);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    fetchAudios();
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

  const fetchAudios = async () => {
    try {
      const data = await api.request<any[]>('/content/audios');
      setAudios(data || []);
      if (data && data.length > 0) {
        setSelectedAudio(data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch listening audios', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartPractice = () => {
    setUserAnswers({});
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
    if (!selectedAudio || !selectedAudio.practiceQuestions || selectedAudio.practiceQuestions.length === 0) return;
    setSubmitting(true);
    setTimerActive(false);

    try {
      const results: any[] = [];
      let correctCount = 0;

      for (const q of selectedAudio.practiceQuestions) {
        const answer = userAnswers[q.id] || '';
        try {
          const result = await api.request<any>(`/content/questions/${q.id}/submit`, {
            method: 'POST',
            body: JSON.stringify({
              answerText: answer.trim(),
              mode,
            }),
          });
          results.push({
            questionId: q.id,
            questionText: q.questionText,
            isCorrect: result.isCorrect,
            correctAnswerStr: result.correctAnswerStr || q.options?.find((o: any) => o.isCorrect)?.optionLetter || 'Correct',
            explanation: q.explanation || 'No explanation available',
            userAnswer: answer,
          });
          if (result.isCorrect) correctCount++;
        } catch (err) {
          console.error(`Failed to submit answer for question ${q.id}`, err);
        }
      }

      if (mode === 'EXAM') {
        setExamSuccess(true);
      } else {
        setFeedback({
          correctCount,
          totalCount: selectedAudio.practiceQuestions.length,
          results,
        });
      }
    } catch (err) {
      console.error(err);
      alert('Failed to submit answers.');
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
            <h3 className="text-white font-bold text-sm mb-3">2. Choose Listening Track</h3>
            {audios.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No listening tracks generated yet. Go to Admin Dashboard to spin tracks.</p>
            ) : (
              <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                {audios.map((a, idx) => (
                  <button
                    key={a.id}
                    onClick={() => {
                      if (!timerActive) {
                        setSelectedAudio(a);
                        setUserAnswers({});
                        setFeedback(null);
                        setExamSuccess(false);
                      }
                    }}
                    disabled={timerActive}
                    className={`w-full text-left p-3 rounded-xl border text-xs leading-relaxed transition-all cursor-pointer ${
                      selectedAudio?.id === a.id
                        ? 'bg-primary border-gold text-white font-semibold'
                        : 'bg-navy/35 border-primary-light/40 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-gold">Track #{idx + 1}</span>
                      <span className="text-[9px] text-slate-500">{a.difficulty}</span>
                    </div>
                    {a.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Workspace */}
        <div className="md:col-span-2 space-y-6">
          {selectedAudio ? (
            <div className="bg-primary/25 border border-primary-light/30 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex justify-between items-center border-b border-primary-light/20 pb-3">
                <h2 className="text-white font-bold text-lg">{selectedAudio.title}</h2>
                {timerActive && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-1.5 rounded-lg text-xs font-mono font-bold animate-pulse">
                    ⏱️ {formatTime(timeLeft)}
                  </div>
                )}
              </div>

              {/* Audio player if audioUrl exists */}
              {selectedAudio.audioUrl && (
                <div className="bg-navy/40 border border-primary-light/10 p-4 rounded-xl space-y-2">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">🎧 Listening Audio File</p>
                  <audio 
                    src={selectedAudio.audioUrl.startsWith('/uploads/') ? `${api.baseUrl.replace('/api', '')}${selectedAudio.audioUrl}` : selectedAudio.audioUrl} 
                    controls 
                    className="w-full mt-1.5 accent-gold"
                  />
                </div>
              )}

              {/* Answering Workspace */}
              {!timerActive && !feedback && !examSuccess ? (
                <button
                  onClick={handleStartPractice}
                  className="bg-gold hover:bg-gold-dark text-primary font-bold px-6 py-2.5 rounded-lg text-xs tracking-wider cursor-pointer transition-colors"
                >
                  {mode === 'EXAM' ? 'Start Exam Timer' : 'Start Practice'}
                </button>
              ) : (
                <div className="space-y-6">
                  {selectedAudio.practiceQuestions?.map((q: any, index: number) => (
                    <div key={q.id} className="bg-navy/40 p-5 rounded-xl border border-primary-light/10 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gold font-bold text-[10px] uppercase tracking-wider">Question {index + 1}</span>
                        <span className="text-[9px] text-slate-500">{q.difficulty}</span>
                      </div>
                      <p className="text-slate-400 text-xs italic">{q.instruction}</p>
                      <p className="text-white font-semibold text-sm mt-2">{q.questionText}</p>

                      {q.questionType === 'MULTIPLE_CHOICE' ? (
                        <div className="space-y-2.5 mt-3">
                          {q.options?.map((opt: any) => (
                            <label 
                              key={opt.id}
                              className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                                userAnswers[q.id] === opt.optionLetter
                                  ? 'bg-primary border-gold text-white font-semibold'
                                  : 'bg-navy/30 border-primary-light/10 hover:border-primary-light/30 text-slate-300'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`option-${q.id}`}
                                value={opt.optionLetter}
                                checked={userAnswers[q.id] === opt.optionLetter}
                                onChange={() => setUserAnswers(prev => ({ ...prev, [q.id]: opt.optionLetter }))}
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
                          value={userAnswers[q.id] || ''}
                          onChange={(e) => setUserAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                          disabled={!timerActive && mode === 'EXAM'}
                          className="w-full bg-navy/55 border border-primary-light/60 focus:border-gold rounded-xl px-4 py-2.5 text-white text-xs leading-relaxed focus:outline-none mt-3"
                        />
                      )}
                    </div>
                  ))}

                  <div className="flex justify-end items-center text-xs pt-2">
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="bg-emerald hover:bg-emerald-dark text-primary font-bold px-8 py-2.5 rounded-lg text-xs cursor-pointer transition-all disabled:opacity-40"
                    >
                      {submitting ? 'Submitting...' : 'Submit All Answers'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-primary/25 border border-primary-light/30 rounded-2xl p-12 text-center text-slate-500 text-xs shadow-xl">
              Select a listening track from the sidebar to begin.
            </div>
          )}

          {/* Practice Mode AI Feedback */}
          {feedback && mode === 'PRACTICE' && (
            <div className="bg-primary/25 border border-primary-light/40 rounded-2xl p-6 shadow-2xl space-y-6">
              <div className="flex justify-between items-center border-b border-primary-light/20 pb-3">
                <h3 className="text-gold font-bold text-base">📝 Practice Results</h3>
                <span className="bg-emerald/10 border border-emerald/20 text-emerald px-3 py-1 rounded text-xs font-bold">
                  Score: {feedback.correctCount} / {feedback.totalCount} Correct
                </span>
              </div>

              <div className="space-y-4">
                {feedback.results?.map((res: any, idx: number) => (
                  <div key={res.questionId} className="bg-navy/40 p-4 rounded-xl border border-primary-light/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Question {idx + 1}</span>
                      {res.isCorrect ? (
                        <span className="text-emerald text-xs font-bold">✅ Correct</span>
                      ) : (
                        <span className="text-red-400 text-xs font-bold">❌ Incorrect</span>
                      )}
                    </div>
                    <p className="text-white text-xs font-semibold">{res.questionText}</p>
                    <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                      <div>
                        <span className="text-slate-500 block">Your Answer:</span>
                        <span className={res.isCorrect ? 'text-emerald font-bold' : 'text-red-400 font-bold'}>
                          {res.userAnswer || '[Empty]'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Correct Answer:</span>
                        <span className="text-gold font-bold">{res.correctAnswerStr}</span>
                      </div>
                    </div>
                    <div className="bg-navy/60 p-3 rounded-lg border border-primary-light/5 text-[11px] text-slate-300 leading-relaxed mt-2 italic">
                      <strong className="text-gold block mb-0.5">Explanation:</strong>
                      {res.explanation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exam Mode Success Popup */}
          {examSuccess && (
            <div className="bg-emerald/10 border border-emerald/20 text-emerald p-6 rounded-2xl text-center space-y-4">
              <h3 className="text-base font-bold">🎉 Test Answers Logged successfully!</h3>
              <p className="text-xs leading-relaxed max-w-md mx-auto">
                Your answers for this listening track have been registered under **Exam Mode**. Results are logged silently for tutor review. Choose another track from the sidebar to continue.
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
