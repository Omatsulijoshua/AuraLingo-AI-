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

  const [viewState, setViewState] = useState<'BOOKS' | 'BOOK_DETAIL' | 'PRACTICE'>('BOOKS');
  const [selectedBook, setSelectedBook] = useState<number>(10);
  const [selectedTaskType, setSelectedTaskType] = useState<'TASK_1' | 'TASK_2'>('TASK_1');

  // AI Examiner Mode states
  const [examinerFeedback, setExaminerFeedback] = useState<any>(null);
  const [selectedSentence, setSelectedSentence] = useState<any>(null);
  const [draft2Text, setDraft2Text] = useState('');
  const [comparisonResult, setComparisonResult] = useState<any>(null);
  const [comparing, setComparing] = useState(false);

  // Timer for Exam Mode (40 minutes = 2400 seconds)
  const [timeLeft, setTimeLeft] = useState(2400);
  const [timerActive, setTimerActive] = useState(false);
  const [showTackleSteps, setShowTackleSteps] = useState(false);

  const showPremiumAlert = () => {
    alert('Premium Content: Please upgrade your subscription to access all IELTS Books and Practice Tests.');
  };

  const startPracticeForTest = (bookNum: number, taskType: 'TASK_1' | 'TASK_2', testNum: number) => {
    if (bookNum !== 10 || testNum !== 1) {
      showPremiumAlert();
      return;
    }

    const matching = prompts.filter((p) => p.taskType === taskType);
    if (matching.length > 0) {
      setSelectedPrompt(matching[0]);
      setViewState('PRACTICE');
      setUserText('');
      setFeedback(null);
      setExamSuccess(false);
      setExaminerFeedback(null);
      setComparisonResult(null);
      setSelectedSentence(null);
    } else {
      setSelectedPrompt(prompts.length > 0 ? prompts[0] : null);
      setViewState('PRACTICE');
      setUserText('');
      setFeedback(null);
      setExamSuccess(false);
      setExaminerFeedback(null);
      setComparisonResult(null);
      setSelectedSentence(null);
    }
  };

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

  const getWritingTips = (promptId: string) => {
    if (promptId === 'academic-w1') {
      return [
        'Connect energy use with emissions',
        'Compare the proportions in both charts',
        'Highlight key disparities'
      ];
    } else if (promptId === 'academic-w2') {
      return [
        'Address both parts of the question',
        'Give clear reasons for your opinion',
        'Include relevant examples'
      ];
    } else {
      return [
        'Outline your main ideas before writing',
        'Maintain a formal academic tone',
        'Check grammar and spelling'
      ];
    }
  };

  const renderBooksView = () => {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white">Writing Lab</h1>
          <p className="text-xs text-slate-400 mt-1">Practice IELTS Academic Writing Tasks</p>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4">Available Books</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 11 }).map((_, idx) => {
              const bookNum = 10 + idx;
              const isUnlocked = bookNum === 10;

              return (
                <div
                  key={bookNum}
                  onClick={() => {
                    if (isUnlocked) {
                      setSelectedBook(bookNum);
                      setViewState('BOOK_DETAIL');
                      setSelectedTaskType('TASK_1');
                    } else {
                      showPremiumAlert();
                    }
                  }}
                  className={`bg-primary/20 border rounded-2xl p-5 flex items-center justify-between cursor-pointer transition-all ${
                    isUnlocked
                      ? 'border-primary-light/30 hover:border-gold hover:bg-primary/30'
                      : 'border-primary-light/10 opacity-70 hover:bg-primary/20'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center text-lg ${
                      isUnlocked ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {isUnlocked ? '📖' : '🔒'}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">IELTS Book {bookNum}</h4>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {isUnlocked ? '4 Tests • 0/8 Tasks' : 'Premium Content'}
                      </p>
                    </div>
                  </div>
                  <span className="text-slate-500 text-sm">→</span>
                </div>
              );
            })}

            {/* Custom topic card */}
            <div
              onClick={() => {
                const customPrompt = prompts.find((p) => p.id === 'CUSTOM');
                if (customPrompt) {
                  setSelectedPrompt(customPrompt);
                  setViewState('PRACTICE');
                  setUserText('');
                  setFeedback(null);
                  setExamSuccess(false);
                  setExaminerFeedback(null);
                  setComparisonResult(null);
                  setSelectedSentence(null);
                }
              }}
              className="bg-primary/20 border border-primary-light/30 rounded-2xl p-5 flex items-center justify-between cursor-pointer hover:border-gold hover:bg-primary/30 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 flex items-center justify-center text-lg">
                  ✍️
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Write on my own Topic</h4>
                  <p className="text-[10px] text-slate-500 mt-1">Practice with custom prompt & AI scoring</p>
                </div>
              </div>
              <span className="text-slate-500 text-sm">→</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBookDetailView = () => {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white">IELTS Book {selectedBook}</h1>
          <p className="text-xs text-slate-400 mt-1">Select a task to practice</p>
        </div>

        {/* Task tabs */}
        <div className="flex bg-primary/20 p-1.5 rounded-xl border border-primary-light/20 w-fit">
          <button
            onClick={() => setSelectedTaskType('TASK_1')}
            className={`px-6 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedTaskType === 'TASK_1' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Task 1: Graph/Chart
          </button>
          <button
            onClick={() => setSelectedTaskType('TASK_2')}
            className={`px-6 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedTaskType === 'TASK_2' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Task 2: Essay
          </button>
        </div>

        {/* Description */}
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-200">
            {selectedTaskType === 'TASK_1' ? 'Task 1: Describe Visual Data' : 'Task 2: Essay Writing'}
          </h3>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            {selectedTaskType === 'TASK_1'
              ? 'Describe graphs, charts, tables, or diagrams. Write at least 150 words in about 20 minutes.'
              : 'Write an essay responding to a point of view or argument. Write at least 250 words in about 40 minutes.'}
          </p>
        </div>

        {/* Tests List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {Array.from({ length: 4 }).map((_, idx) => {
            const testNum = idx + 1;
            const isUnlocked = testNum === 1;

            return (
              <div
                key={testNum}
                onClick={() => startPracticeForTest(selectedBook, selectedTaskType, testNum)}
                className={`bg-primary/20 border rounded-2xl p-5 flex items-center justify-between cursor-pointer transition-all ${
                  isUnlocked
                    ? 'border-primary-light/30 hover:border-gold hover:bg-primary/30'
                    : 'border-primary-light/10 opacity-70 hover:bg-primary/20'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-lg ${
                    isUnlocked ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {isUnlocked ? (selectedTaskType === 'TASK_1' ? '📊' : '💬') : '🔒'}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Test {testNum}</h4>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {isUnlocked
                        ? (selectedTaskType === 'TASK_1' ? '150+ words • 20 min' : '250+ words • 40 min')
                        : 'Premium Content'}
                    </p>
                  </div>
                </div>
                <span className="text-slate-500 text-sm">→</span>
              </div>
            );
          })}
        </div>
      </div>
    );
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
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-xl font-bold tracking-wider flex items-center gap-1.5">
            <span className="text-gold">BandUp</span> IELTS
          </Link>
        </div>
        
        {viewState !== 'BOOKS' ? (
          <button
            onClick={() => {
              if (viewState === 'PRACTICE') setViewState('BOOK_DETAIL');
              else if (viewState === 'BOOK_DETAIL') setViewState('BOOKS');
            }}
            className="text-xs font-bold text-slate-300 hover:text-gold transition-colors cursor-pointer"
          >
            ← Back
          </button>
        ) : (
          <Link href="/dashboard" className="text-xs font-bold text-slate-300 hover:text-gold transition-colors">
            Exit Practice
          </Link>
        )}
      </header>

      {viewState === 'BOOKS' ? (
        renderBooksView()
      ) : viewState === 'BOOK_DETAIL' ? (
        renderBookDetailView()
      ) : (
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

          {selectedPrompt?.id === 'CUSTOM' && (
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
          )}
        </div>

        {/* Right Side: Workspace */}
        <div className="md:col-span-2 space-y-6">
          {selectedPrompt && (
            <>
              {/* Visual Data (if has image) */}
              {(selectedPrompt.imageUrl || selectedPrompt.id === 'academic-w1') && (
                <div className="bg-primary/25 border border-primary-light/30 rounded-2xl p-6 shadow-xl space-y-3">
                  <div className="border-b border-primary-light/20 pb-2">
                    <h3 className="text-white font-bold text-sm">Visual Data</h3>
                  </div>
                  <div className="bg-white p-4 rounded-xl flex items-center justify-center border border-primary-light/20">
                    <img
                      src="/assets/australian_household_energy_use.png"
                      alt="Australian Household Energy Use"
                      className="max-h-72 object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Question card */}
              <div className="bg-primary/25 border border-primary-light/30 rounded-2xl p-6 shadow-xl space-y-3">
                <div className="flex justify-between items-center border-b border-primary-light/20 pb-2">
                  <h3 className="text-white font-bold text-sm">Question</h3>
                  <div className="flex gap-4 text-[10px] text-slate-400">
                    <span>📄 {selectedPrompt.taskType === 'TASK_1' ? '150+ words' : '250+ words'}</span>
                    <span>⏱️ {selectedPrompt.taskType === 'TASK_1' ? '20 min' : '40 min'}</span>
                  </div>
                </div>
                <p className="text-white text-xs font-semibold leading-relaxed bg-navy/40 p-4 rounded-xl border border-primary-light/10">
                  {selectedPrompt.promptText}
                </p>
              </div>

              {/* Response Workspace */}
              <div className="bg-primary/25 border border-primary-light/30 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex justify-between items-center border-b border-primary-light/20 pb-3">
                  <h2 className="text-gold font-black text-sm">Your Response</h2>
                  {timerActive && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-1.5 rounded-lg text-xs font-mono font-bold animate-pulse">
                      ⏱️ {formatTime(timeLeft)}
                    </div>
                  )}
                </div>

              {/* Collapsible Steps Card */}
              <div className="bg-navy/45 border border-primary-light/20 rounded-xl overflow-hidden shadow-inner">
                <button
                  type="button"
                  onClick={() => setShowTackleSteps(!showTackleSteps)}
                  className="w-full flex justify-between items-center px-4 py-3 text-xs font-bold text-gold hover:bg-primary-light/10 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">💡 How to Tackle this Writing Task (Fast & Accurately)</span>
                  <span className="text-[10px] text-slate-400 font-mono">{showTackleSteps ? '▲ Hide Steps' : '▼ Show Steps'}</span>
                </button>
                {showTackleSteps && (
                  <div className="p-4 border-t border-primary-light/15 text-[10px] text-slate-300 space-y-3 bg-navy/20 leading-relaxed">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-primary/20 p-3 rounded-lg border border-primary-light/10">
                        <p className="font-bold text-gold mb-1 uppercase tracking-wider">1. Analyze (2 Mins)</p>
                        <p className="text-[9px]">Deconstruct the prompt. Identify the core topic, target essay type (Opinion, Discussion, Solution), and highlight key keywords.</p>
                      </div>
                      <div className="bg-primary/20 p-3 rounded-lg border border-primary-light/10">
                        <p className="font-bold text-gold mb-1 uppercase tracking-wider">2. Plan (3 Mins)</p>
                        <p className="text-[9px]">Write a brief outline. Map out your Intro (thesis statement), Body 1 (first point + example), Body 2 (second point + example), and Conclusion.</p>
                      </div>
                      <div className="bg-primary/20 p-3 rounded-lg border border-primary-light/10">
                        <p className="font-bold text-gold mb-1 uppercase tracking-wider">3. Write (32 Mins)</p>
                        <p className="text-[9px]">Maintain an academic tone. Aim for 150+ words (Task 1) or 250+ words (Task 2). Use linking words and cohesive connectors naturally.</p>
                      </div>
                      <div className="bg-primary/20 p-3 rounded-lg border border-primary-light/10">
                        <p className="font-bold text-gold mb-1 uppercase tracking-wider">4. Check (3 Mins)</p>
                        <p className="text-[9px]">Proofread immediately. Scan for spelling mistakes (check red underlines), subject-verb agreement errors, and correct punctuation.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

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
                      spellCheck={true}
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
                    spellCheck={true}
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
                    spellCheck={true}
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

            {/* Writing Tips Card */}
              <div className="bg-primary/25 border border-primary-light/30 rounded-2xl p-6 shadow-xl space-y-3">
                <div className="border-b border-primary-light/20 pb-2">
                  <h3 className="text-white font-bold text-sm">Writing Tips</h3>
                </div>
                <div className="space-y-2 pt-2">
                  {getWritingTips(selectedPrompt.id).map((tip: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <span>💡</span>
                      <p className="leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
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
    )}
    </div>
  );
}
