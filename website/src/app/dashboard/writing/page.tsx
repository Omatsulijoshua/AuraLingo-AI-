'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function WritingPractice() {
  const [prompts, setPrompts] = useState<any[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<any>(null);
  const [mode, setMode] = useState<'PRACTICE' | 'EXAM' | 'EXAMINER'>('PRACTICE');
  const [userText, setUserText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [examSuccess, setExamSuccess] = useState(false);
  const [customQuestionText, setCustomQuestionText] = useState('');
  const [customTaskType, setCustomTaskType] = useState('TASK_2');
  const [customExamType, setCustomExamType] = useState('ACADEMIC');

  // AI Examiner Mode states
  const [examinerFeedback, setExaminerFeedback] = useState<any>(null);
  const [selectedSentence, setSelectedSentence] = useState<any>(null);
  const [draft2Text, setDraft2Text] = useState('');
  const [comparisonResult, setComparisonResult] = useState<any>(null);
  const [comparing, setComparing] = useState(false);

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
      const customOption = {
        id: 'CUSTOM',
        title: '✍️ Write on my own Topic',
        promptText: 'Type your custom question topic in the input box below to start practicing.',
        taskType: 'TASK_2',
        difficulty: 'CUSTOM',
        examType: 'ACADEMIC'
      };
      const list = [...data, customOption];
      setPrompts(list);
      if (list.length > 0) setSelectedPrompt(list[0]);
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
    setExaminerFeedback(null);
    setSelectedSentence(null);
    setDraft2Text('');
    setComparisonResult(null);
    if (mode === 'EXAM') {
      setTimeLeft(2400); // 40 mins
      setTimerActive(true);
    } else {
      setTimerActive(false);
    }
  };

  const handleSubmitDraft1 = async () => {
    if (!userText.trim()) return;
    setSubmitting(true);

    try {
      const result = await api.request<any>('/content/writing/submit-examiner', {
        method: 'POST',
        body: JSON.stringify({
          promptId: selectedPrompt.id,
          userText,
          customQuestionText: selectedPrompt.id === 'CUSTOM' ? customQuestionText : undefined,
          customTaskType: selectedPrompt.id === 'CUSTOM' ? customTaskType : undefined,
          customExamType: selectedPrompt.id === 'CUSTOM' ? customExamType : undefined,
        }),
      });

      setExaminerFeedback(result.feedbackJson);
      setDraft2Text(userText);
    } catch (err) {
      console.error(err);
      alert('Failed to submit Draft 1 for examiner analysis.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitDraft2 = async () => {
    if (!draft2Text.trim()) return;
    setComparing(true);

    try {
      const result = await api.request<any>('/content/writing/compare-drafts', {
        method: 'POST',
        body: JSON.stringify({
          promptId: selectedPrompt.id,
          draft1Text: userText,
          draft2Text,
        }),
      });

      setComparisonResult(result.feedbackJson);
    } catch (err) {
      console.error(err);
      alert('Failed to submit Draft 2 for comparison.');
    } finally {
      setComparing(false);
    }
  };

  const handleApplySuggestion = (sentence: any) => {
    if (!sentence || !sentence.rewrite) return;
    const original = sentence.text;
    const rewrite = sentence.rewrite;
    
    setDraft2Text((prev) => {
      if (prev.includes(original)) {
        return prev.replace(original, rewrite);
      }
      return prev;
    });
    alert('Applied rewrite suggestion to Draft 2!');
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
          customQuestionText: selectedPrompt.id === 'CUSTOM' ? customQuestionText : undefined,
          customTaskType: selectedPrompt.id === 'CUSTOM' ? customTaskType : undefined,
          customExamType: selectedPrompt.id === 'CUSTOM' ? customExamType : undefined,
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
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => {
                  setMode('PRACTICE');
                  handleStartPractice();
                }}
                disabled={timerActive}
                className={`w-full py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                  mode === 'PRACTICE'
                    ? 'bg-gold border-gold text-primary shadow-lg shadow-gold/25'
                    : 'bg-navy/40 border-primary-light text-slate-400 hover:text-white'
                }`}
              >
                Practice Mode
              </button>
              <button
                onClick={() => {
                  setMode('EXAMINER');
                  handleStartPractice();
                }}
                disabled={timerActive}
                className={`w-full py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                  mode === 'EXAMINER'
                    ? 'bg-gradient-to-r from-amber-500 to-gold border-gold text-primary shadow-lg shadow-gold/25'
                    : 'bg-navy/40 border-primary-light text-slate-400 hover:text-white'
                }`}
              >
                🤖 AI Examiner Mode
              </button>
              <button
                onClick={() => {
                  setMode('EXAM');
                  handleStartPractice();
                }}
                disabled={timerActive}
                className={`w-full py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                  mode === 'EXAM'
                    ? 'bg-gold border-gold text-primary shadow-lg shadow-gold/25'
                    : 'bg-navy/40 border-primary-light text-slate-400 hover:text-white'
                }`}
              >
                Exam Mode
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
              {mode === 'PRACTICE' && '⭐ Practice untimed with real-time AI scoring, step-by-step model rewrites, and strategic time-management tips!'}
              {mode === 'EXAMINER' && '🤖 Sentence-by-sentence highlighting, interactive rewriting critiques, and a comparison engine for Draft 2!'}
              {mode === 'EXAM' && '⏱️ Strict 40-minute timer. Submissions will be logged quietly for official tutor grading evaluation.'}
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

              {selectedPrompt.id === 'CUSTOM' && !timerActive && !feedback && !examSuccess && (
                <div className="space-y-4 p-4 bg-navy/40 rounded-xl border border-primary-light/10 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Task Type</label>
                      <select
                        value={customTaskType}
                        onChange={(e) => setCustomTaskType(e.target.value)}
                        className="w-full bg-navy border border-primary-light/40 focus:border-gold rounded px-3 py-2 text-white focus:outline-none"
                      >
                        <option value="TASK_1">Task 1 (Report or Letter)</option>
                        <option value="TASK_2">Task 2 (Essay)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Exam Format</label>
                      <select
                        value={customExamType}
                        onChange={(e) => setCustomExamType(e.target.value)}
                        className="w-full bg-navy border border-primary-light/40 focus:border-gold rounded px-3 py-2 text-white focus:outline-none"
                      >
                        <option value="ACADEMIC">Academic</option>
                        <option value="GENERAL">General</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Input Custom Question/Topic</label>
                    <textarea
                      rows={4}
                      placeholder="e.g. In many countries, university education is free. Discuss the advantages and disadvantages."
                      value={customQuestionText}
                      onChange={(e) => setCustomQuestionText(e.target.value)}
                      className="w-full bg-navy border border-primary-light/40 focus:border-gold rounded p-3 text-white focus:outline-none resize-none"
                    />
                  </div>
                </div>
              )}

              {!timerActive && !feedback && !examSuccess && mode !== 'EXAMINER' ? (
                <button
                  onClick={handleStartPractice}
                  disabled={selectedPrompt.id === 'CUSTOM' && !customQuestionText.trim()}
                  className="bg-gold hover:bg-gold-dark text-primary font-bold px-6 py-2.5 rounded-lg text-xs tracking-wider cursor-pointer transition-colors disabled:opacity-40"
                >
                  {mode === 'EXAM' ? 'Start Exam Timer' : 'Start Practice'}
                </button>
              ) : null}

              {mode === 'EXAMINER' && !examinerFeedback && (
                <div className="space-y-4">
                  <textarea
                    rows={12}
                    value={userText}
                    onChange={(e) => setUserText(e.target.value)}
                    placeholder="Write your Draft 1 response here under examiner conditions..."
                    className="w-full bg-navy/55 border border-primary-light/60 focus:border-gold rounded-xl p-4 text-white text-xs leading-relaxed focus:outline-none"
                  />
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Word Count: <span className="text-white font-bold">{wordCount}</span></span>
                    <button
                      onClick={handleSubmitDraft1}
                      disabled={submitting || !userText.trim()}
                      className="bg-gold hover:bg-gold-dark text-primary font-extrabold px-6 py-2 rounded-lg text-xs cursor-pointer transition-colors disabled:opacity-40"
                    >
                      {submitting ? 'Analyzing Draft 1...' : '🤖 Analyze Draft 1'}
                    </button>
                  </div>
                </div>
              )}

              {(timerActive || feedback || examSuccess) && mode !== 'EXAMINER' && (
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

          {/* AI Examiner Mode - Draft 1 Highlights & Draft 2 Workspace */}
          {mode === 'EXAMINER' && examinerFeedback && !comparisonResult && (
            <div className="space-y-6">
              {/* Overall Estimated Band */}
              <div className="bg-primary/25 border border-primary-light/40 rounded-2xl p-6 shadow-2xl space-y-6">
                <div className="flex justify-between items-center border-b border-primary-light/20 pb-3">
                  <h3 className="text-gold font-bold text-base">🤖 AI Examiner Mode - Draft 1 Evaluation</h3>
                  <div className="bg-amber-500/10 border border-amber-500/20 text-gold px-3 py-1.5 rounded-lg text-xs font-bold font-mono">
                    Estimated Band: {examinerFeedback.estimatedBand}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-navy/40 p-3 rounded-lg border border-primary-light/15 text-center">
                    <p className="text-slate-500 text-[9px] uppercase font-bold">Task Achievement</p>
                    <p className="text-slate-300 text-sm font-bold mt-0.5">{examinerFeedback.breakdown?.taskAchievement || 6.0}</p>
                  </div>
                  <div className="bg-navy/40 p-3 rounded-lg border border-primary-light/15 text-center">
                    <p className="text-slate-500 text-[9px] uppercase font-bold">Coherence & Cohesion</p>
                    <p className="text-slate-300 text-sm font-bold mt-0.5">{examinerFeedback.breakdown?.coherenceCohesion || 6.0}</p>
                  </div>
                  <div className="bg-navy/40 p-3 rounded-lg border border-primary-light/15 text-center">
                    <p className="text-slate-500 text-[9px] uppercase font-bold">Lexical Resource</p>
                    <p className="text-slate-300 text-sm font-bold mt-0.5">{examinerFeedback.breakdown?.lexicalResource || 6.0}</p>
                  </div>
                  <div className="bg-navy/40 p-3 rounded-lg border border-primary-light/15 text-center">
                    <p className="text-slate-500 text-[9px] uppercase font-bold">Grammar Accuracy</p>
                    <p className="text-slate-300 text-sm font-bold mt-0.5">{examinerFeedback.breakdown?.grammarAccuracy || 6.0}</p>
                  </div>
                </div>

                <div className="bg-gold/5 border border-gold/20 p-4 rounded-xl text-xs text-slate-300 leading-relaxed">
                  <strong className="text-gold font-bold block mb-1">💡 Coaching Tip for Draft 2:</strong>
                  {examinerFeedback.coachingTip}
                </div>
              </div>

              {/* Interactive Sentence Highlighter & Draft 2 Split Screen */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Panel: Highlighted Sentences */}
                <div className="bg-primary/25 border border-primary-light/30 rounded-2xl p-6 shadow-xl space-y-4">
                  <h4 className="text-white font-bold text-sm">Sentence-by-Sentence Analysis</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Click on any sentence highlighted in <span className="text-red-400 font-bold">red</span> (Weak) or <span className="text-amber-400 font-bold">yellow</span> (Okay) to view the examiner critique and suggested rewrite.
                  </p>
                  <div className="bg-navy/40 p-4 rounded-xl border border-primary-light/10 text-xs leading-relaxed space-y-2">
                    {examinerFeedback.sentences?.map((s: any, idx: number) => {
                      let hlClass = '';
                      if (s.strength === 'STRONG') hlClass = 'bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-200/90 hover:bg-emerald-500/20';
                      else if (s.strength === 'OKAY') hlClass = 'bg-amber-500/10 border-b border-amber-500/20 text-amber-200 hover:bg-amber-500/20';
                      else hlClass = 'bg-red-500/10 border-b border-red-500/20 text-red-300 font-bold hover:bg-red-500/20';

                      return (
                        <span
                          key={idx}
                          onClick={() => setSelectedSentence(s)}
                          className={`${hlClass} transition-colors px-0.5 cursor-pointer inline-block mr-1 rounded`}
                        >
                          {s.text}{' '}
                        </span>
                      );
                    })}
                  </div>

                  {/* Critique Details Card */}
                  {selectedSentence && (
                    <div className="bg-navy/60 border border-primary-light/20 p-4 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                          selectedSentence.strength === 'STRONG' ? 'bg-emerald-500/20 text-emerald-400' :
                          selectedSentence.strength === 'OKAY' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {selectedSentence.strength} Sentence
                        </span>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Critique</p>
                        <p className="text-slate-300 text-xs leading-relaxed mt-0.5">{selectedSentence.critique}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Suggested Rewrite</p>
                        <p className="text-gold text-xs leading-relaxed mt-0.5 italic">{selectedSentence.rewrite}</p>
                      </div>
                      <button
                        onClick={() => handleApplySuggestion(selectedSentence)}
                        className="bg-gold hover:bg-gold-dark text-primary font-black px-4 py-1.5 rounded text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        ✍️ Apply Rewrite to Draft 2
                      </button>
                    </div>
                  )}
                </div>

                {/* Right Panel: Draft 2 Workspace */}
                <div className="bg-primary/25 border border-primary-light/30 rounded-2xl p-6 shadow-xl space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-white font-bold text-sm">Draft 2 Refinement Workspace</h4>
                    <span className="text-[10px] text-slate-500">
                      Word Count: {draft2Text.trim() === '' ? 0 : draft2Text.trim().split(/\s+/).length}
                    </span>
                  </div>
                  <textarea
                    rows={12}
                    value={draft2Text}
                    onChange={(e) => setDraft2Text(e.target.value)}
                    placeholder="Refine your essay here... Apply rewrites to replace weak sentences."
                    className="w-full bg-navy/55 border border-primary-light/60 focus:border-gold rounded-xl p-4 text-white text-xs leading-relaxed focus:outline-none"
                  />
                  <button
                    onClick={handleSubmitDraft2}
                    disabled={comparing || !draft2Text.trim()}
                    className="w-full bg-emerald hover:bg-emerald-dark text-primary font-black py-2.5 rounded-lg text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-40"
                  >
                    {comparing ? 'Comparing Drafts...' : '🤖 Submit Revised Draft (Draft 2)'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* AI Examiner Mode - Draft 1 vs Draft 2 Comparison Results */}
          {mode === 'EXAMINER' && comparisonResult && (
            <div className="bg-primary/25 border border-primary-light/40 rounded-2xl p-6 shadow-2xl space-y-6">
              <div className="text-center space-y-2 border-b border-primary-light/20 pb-4">
                <h3 className="text-gold font-black text-lg">📈 AI Examiner Mode - Comparison Analysis</h3>
                <p className="text-slate-300 text-xs">Fantastic job refining your essay! Here is how your revision compared to Draft 1.</p>
              </div>

              {/* Band Score Progress Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-navy/40 p-4 rounded-xl border border-primary-light/15 text-center space-y-1">
                  <p className="text-slate-500 text-[10px] uppercase font-bold">Draft 1 Band</p>
                  <p className="text-slate-400 text-lg font-bold">Band {comparisonResult.draft1Band}</p>
                </div>
                <div className="bg-gold/10 p-4 rounded-xl border border-gold/30 text-center space-y-1">
                  <p className="text-gold text-[10px] uppercase font-black">Draft 2 Band</p>
                  <p className="text-white text-2xl font-black">Band {comparisonResult.draft2Band}</p>
                </div>
                <div className="bg-emerald/10 p-4 rounded-xl border border-emerald-500/35 text-center flex flex-col justify-center items-center">
                  <p className="text-emerald-400 text-[10px] uppercase font-black">Score Progress</p>
                  <p className="text-emerald-400 text-xl font-black mt-1">
                    +{comparisonResult.improvement} Band Score! 🎉
                  </p>
                </div>
              </div>

              {/* Specific Improvement Areas */}
              <div className="space-y-4 pt-2">
                <div className="bg-navy/40 p-4 rounded-xl border border-primary-light/10">
                  <h4 className="text-gold font-bold text-xs mb-1">✍️ Lexical Improvements</h4>
                  <p className="text-slate-300 text-xs leading-relaxed">{comparisonResult.lexicalImprovements}</p>
                </div>
                <div className="bg-navy/40 p-4 rounded-xl border border-primary-light/10">
                  <h4 className="text-gold font-bold text-xs mb-1">📐 Grammatical Improvements</h4>
                  <p className="text-slate-300 text-xs leading-relaxed">{comparisonResult.grammarImprovements}</p>
                </div>
                <div className="bg-navy/40 p-4 rounded-xl border border-primary-light/10">
                  <h4 className="text-gold font-bold text-xs mb-1">🔗 Coherence & Cohesion Improvements</h4>
                  <p className="text-slate-300 text-xs leading-relaxed">{comparisonResult.coherenceImprovements}</p>
                </div>
                <div className="bg-navy/40 p-4 rounded-xl border border-primary-light/10">
                  <h4 className="text-white font-bold text-xs mb-1">💡 Examiner Summary</h4>
                  <p className="text-slate-300 text-xs leading-relaxed">{comparisonResult.summary}</p>
                </div>
              </div>

              <div className="text-center pt-2">
                <button
                  onClick={handleStartPractice}
                  className="bg-gold hover:bg-gold-dark text-primary font-black px-6 py-2.5 rounded-lg text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Start New examiner practice
                </button>
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
