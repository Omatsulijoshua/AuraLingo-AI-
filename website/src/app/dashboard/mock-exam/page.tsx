'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function MockExamsPage() {
  const [mockTests, setMockTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeAttempt, setActiveAttempt] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [finalResult, setFinalResult] = useState<any>(null);

  // Form answers state for current section
  const [answersInput, setAnswersInput] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchMockTests();
  }, []);

  useEffect(() => {
    let timer: any = null;
    if (timerActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      handleSectionSubmit(); // Auto-submit section when timer expires
    }
    return () => clearInterval(timer);
  }, [timerActive, timeLeft]);

  const fetchMockTests = async () => {
    try {
      const data = await api.request<any[]>('/mock-tests');
      setMockTests(data || []);
    } catch (err) {
      console.error('Failed to fetch mock tests', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = async (testId: string) => {
    setLoading(true);
    try {
      const attempt = await api.request<any>(`/mock-tests/${testId}/start`, {
        method: 'POST',
      });
      setActiveAttempt(attempt);
      setCurrentSectionIndex(0);
      setAnswersInput({});
      
      // Calculate remaining duration in seconds
      const end = new Date(attempt.completedAt || new Date(Date.now() + 160 * 60 * 1000)).getTime();
      const now = new Date().getTime();
      setTimeLeft(Math.max(0, Math.floor((end - now) / 1000)));
      setTimerActive(true);
    } catch (err: any) {
      alert(err.message || 'Failed to start mock test');
    } finally {
      setLoading(false);
    }
  };

  const handleSectionSubmit = async () => {
    if (!activeAttempt) return;
    setSubmitting(true);

    try {
      const section = activeAttempt.mockTest?.sections?.[currentSectionIndex];
      if (!section) return;

      // Submit all inputs formatted
      const answersList = Object.entries(answersInput).map(([qId, text]) => ({
        questionId: qId,
        answerText: text,
      }));

      const res = await api.request<any>(`/mock-tests/attempts/${activeAttempt.id}/submit-section`, {
        method: 'POST',
        body: JSON.stringify({
          sectionId: section.id,
          answers: answersList,
        }),
      });

      // Move to next section or complete
      if (currentSectionIndex + 1 < (activeAttempt.mockTest?.sections?.length || 0)) {
        setCurrentSectionIndex((prev) => prev + 1);
        setAnswersInput({});
        alert('Section submitted successfully! Moving to next section.');
      } else {
        setTimerActive(false);
        setActiveAttempt(null);
        setFinalResult(res);
        fetchMockTests();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to submit section');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? `${h}:` : ''}${m < 10 && h > 0 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (finalResult) {
    const attempt = finalResult.attempt;
    return (
      <div className="min-h-screen bg-navy text-white flex flex-col items-center justify-center p-8">
        <div className="max-w-md w-full bg-primary/25 border border-primary-light/30 rounded-3xl p-8 shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 bg-gold/10 border border-gold/20 rounded-full flex items-center justify-center mx-auto">
            <span className="text-gold text-2xl font-bold">🏆</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-white font-extrabold text-2xl">Mock Test Completed!</h2>
            <p className="text-slate-400 text-xs">Your responses have been fully graded by the IELTS evaluation service.</p>
          </div>
          
          <div className="p-6 bg-navy/40 border border-primary-light/15 rounded-2xl space-y-4">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Estimated Band Score</p>
              <p className="text-gold text-4xl font-black mt-1">Band {finalResult.overallBandScore || attempt?.overallBandEstimate}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-left border-t border-primary-light/10 pt-4 text-xs">
              <div>
                <span className="text-slate-400">🎧 Listening:</span>
                <span className="text-white font-bold ml-1.5">{attempt?.listeningScore}</span>
              </div>
              <div>
                <span className="text-slate-400">📖 Reading:</span>
                <span className="text-white font-bold ml-1.5">{attempt?.readingScore}</span>
              </div>
              <div>
                <span className="text-slate-400">✍️ Writing:</span>
                <span className="text-white font-bold ml-1.5">{attempt?.writingScore} (Est.)</span>
              </div>
              <div>
                <span className="text-slate-400">🎙️ Speaking:</span>
                <span className="text-white font-bold ml-1.5">{attempt?.speakingScore} (Est.)</span>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-500 italic">This AI marking is for practice only and does not represent an official IELTS score.</p>

          <button
            onClick={() => setFinalResult(null)}
            className="w-full bg-gold hover:bg-gold-dark text-primary font-black py-3 rounded-xl text-xs transition-colors cursor-pointer"
          >
            Return to Mock List
          </button>
        </div>
      </div>
    );
  }

  // Active testing view
  if (activeAttempt) {
    const test = activeAttempt.mockTest;
    const section = test?.sections?.[currentSectionIndex];

    return (
      <div className="min-h-screen bg-navy text-white flex flex-col">
        <header className="h-16 border-b border-primary-light/30 bg-primary/45 backdrop-blur-md flex items-center justify-between px-8 md:px-16">
          <div className="flex items-center gap-4">
            <span className="text-gold font-bold text-sm">TEST IN PROGRESS:</span>
            <span className="text-white text-xs font-semibold">{test.title} ({test.examType})</span>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-1.5 rounded-lg text-xs font-mono font-bold animate-pulse">
            ⏱️ {formatTime(timeLeft)}
          </div>
        </header>

        <main className="flex-1 max-w-5xl w-full mx-auto p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sidebar Section Progress */}
          <div className="bg-primary/25 border border-primary-light/30 rounded-2xl p-6 shadow-xl space-y-4 self-start">
            <h3 className="text-white font-bold text-sm">Exam Sections</h3>
            <div className="space-y-2">
              {test?.sections?.map((sec: any, idx: number) => (
                <div 
                  key={sec.id}
                  className={`p-3.5 rounded-xl border text-xs flex justify-between items-center ${
                    idx === currentSectionIndex
                      ? 'bg-primary border-gold text-white font-bold'
                      : idx < currentSectionIndex
                        ? 'bg-navy/35 border-primary-light/10 text-slate-500'
                        : 'bg-navy/35 border-primary-light/40 text-slate-400'
                  }`}
                >
                  <span>{sec.title}</span>
                  {idx < currentSectionIndex && <span className="text-emerald font-extrabold">✓ Done</span>}
                  {idx === currentSectionIndex && <span className="text-gold font-bold">Active</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Workspace for Current Section */}
          <div className="md:col-span-2 bg-primary/25 border border-primary-light/30 rounded-2xl p-6 shadow-xl space-y-6">
            {section ? (
              <>
                <div className="border-b border-primary-light/20 pb-3">
                  <h2 className="text-gold font-bold text-lg">{section.title}</h2>
                  <p className="text-slate-400 text-xs mt-1">{section.instructions}</p>
                </div>

                {/* Section Passages or Audios if applicable */}
                {section.readingPassage && (
                  <div className="bg-navy/40 p-5 rounded-xl border border-primary-light/10 max-h-[30vh] overflow-y-auto">
                    <p className="text-white font-bold text-sm mb-2">{section.readingPassage.title}</p>
                    <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap">{section.readingPassage.text}</p>
                  </div>
                )}

                {section.listeningAudio && (
                  <div className="bg-navy/40 p-4 rounded-xl border border-primary-light/10">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">🎧 Section Audio Track</p>
                    <audio src={section.listeningAudio.audioUrl} controls className="w-full accent-gold" />
                  </div>
                )}

                {/* Simulated practice questions block */}
                <div className="space-y-4">
                  <p className="text-xs text-slate-400 italic">Please write your answers to the practice questions below based on the section contents.</p>
                  <textarea
                    rows={8}
                    value={answersInput['section_responses'] || ''}
                    onChange={(e) => setAnswersInput({ 'section_responses': e.target.value })}
                    placeholder="Type your answers to all questions in this section here..."
                    className="w-full bg-navy/55 border border-primary-light/60 focus:border-gold rounded-xl p-4 text-white text-xs leading-relaxed focus:outline-none"
                  />
                </div>

                <div className="flex justify-end pt-4 border-t border-primary-light/20">
                  <button
                    onClick={handleSectionSubmit}
                    disabled={submitting}
                    className="bg-emerald hover:bg-emerald-dark text-primary font-black px-6 py-2.5 rounded-lg text-xs cursor-pointer transition-colors shadow-lg shadow-emerald/10"
                  >
                    {submitting ? 'Submitting...' : 'Submit Section & Proceed'}
                  </button>
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-500 italic text-center py-12">No active section configured for this test.</p>
            )}
          </div>
        </main>
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
          Exit Mock Exams
        </Link>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-8 space-y-8">
        <div>
          <h2 className="text-white font-extrabold text-2xl">IELTS Mock Exams</h2>
          <p className="text-slate-400 text-xs mt-1">Simulate official exam conditions with full timed Listening, Reading, Writing and Speaking mocks.</p>
        </div>

        {mockTests.length === 0 ? (
          <div className="bg-primary/25 border border-primary-light/30 rounded-2xl p-12 text-center text-slate-500 text-xs shadow-xl">
            No mock tests have been published by developers yet. Check back soon!
          </div>
        ) : (
          <div className="bg-primary/25 border border-primary-light/30 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase text-slate-400 bg-primary/40 border-b border-primary-light/45 font-bold">
                <tr>
                  <th className="px-6 py-4">Test Title</th>
                  <th className="px-6 py-4">Format</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-light/20 text-xs">
                {mockTests.map((test) => (
                  <tr key={test.id} className="hover:bg-primary-light/10 transition-colors duration-200">
                    <td className="px-6 py-4 font-semibold text-white">{test.title}</td>
                    <td className="px-6 py-4">
                      <span className="bg-primary-light/40 border border-primary-light/50 px-2 py-0.5 rounded text-[9px] font-bold text-slate-300">
                        {test.examType}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono">{test.duration} Minutes</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleStartTest(test.id)}
                        className="bg-gold hover:bg-gold-dark text-primary font-black px-4 py-1.5 rounded-lg text-xs transition-colors cursor-pointer shadow-lg shadow-gold/5"
                      >
                        Start Mock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
