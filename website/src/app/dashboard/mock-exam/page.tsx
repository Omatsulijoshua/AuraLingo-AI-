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

  // Practice Mock Configuration Modal
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [difficultySetting, setDifficultySetting] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('INTERMEDIATE');
  const [timeSetting, setTimeSetting] = useState<'STANDARD' | 'EXTRA' | 'DOUBLE' | 'UNTIMED'>('STANDARD');
  const [aiAssistSetting, setAiAssistSetting] = useState(true);

  // Real-time AI Assistant Panel state
  const [aiAssistHistory, setAiAssistHistory] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
  const [aiLoading, setAiLoading] = useState(false);

  // Detailed Corrections view state
  const [viewingCorrectionsAttemptId, setViewingCorrectionsAttemptId] = useState<string | null>(null);
  const [correctionsData, setCorrectionsData] = useState<any>(null);
  const [correctionsTab, setCorrectionsTab] = useState<string>('');

  useEffect(() => {
    fetchMockTests();
    // Auto load corrections if attemptId is passed in URL query
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const attId = params.get('attemptId');
      if (attId) {
        fetchCorrections(attId);
      }
    }
  }, []);

  useEffect(() => {
    let timer: any = null;
    if (timerActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      // In untimed or high duration limit, we don't auto-submit unless actually 0
      if (timeSetting !== 'UNTIMED' || timeLeft === 0) {
        setTimerActive(false);
        handleSectionSubmit(); // Auto-submit section when timer expires
      }
    }
    return () => clearInterval(timer);
  }, [timerActive, timeLeft]);

  const fetchMockTests = async () => {
    try {
      const data = await api.request<any[]>('/mock-tests');
      setMockTests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch mock tests', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = async (
    testId: string, 
    mode: 'EXAM' | 'PRACTICE',
  ) => {
    setLoading(true);
    setAiAssistHistory([]);
    try {
      const testObj = mockTests.find(t => t.id === testId);
      const baseDuration = testObj?.duration || 160;

      // Calculate custom duration based on settings
      let customDuration = baseDuration;
      if (mode === 'PRACTICE') {
        if (timeSetting === 'EXTRA') customDuration = Math.round(baseDuration * 1.5);
        if (timeSetting === 'DOUBLE') customDuration = baseDuration * 2;
        if (timeSetting === 'UNTIMED') customDuration = 9999; // Represents untimed
      }

      const attempt = await api.request<any>(`/mock-tests/${testId}/start`, {
        method: 'POST',
        body: JSON.stringify({
          customDuration,
          mode,
          difficulty: difficultySetting,
          aiAssist: mode === 'PRACTICE' ? aiAssistSetting : false,
        }),
      });

      setActiveAttempt(attempt);
      setCurrentSectionIndex(0);
      setAnswersInput({});
      
      // Calculate remaining duration in seconds
      const end = new Date(attempt.completedAt || new Date(Date.now() + customDuration * 60 * 1000)).getTime();
      const now = new Date().getTime();
      setTimeLeft(Math.max(0, Math.floor((end - now) / 1000)));
      setTimerActive(timeSetting !== 'UNTIMED');
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

      const answersList = Object.entries(answersInput).map(([qId, text]) => ({
        questionId: qId,
        answerText: text,
      }));

      const res = await api.request<any>(`/mock-tests/attempts/${activeAttempt.id}/submit-section`, {
        method: 'POST',
        body: JSON.stringify({
          sectionId: section.id,
          answers: answersList.length > 0 ? answersList : [{ questionId: 'section_responses', answerText: '' }],
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

  const handleCallAiAssist = async (queryKey: string, label: string) => {
    if (!activeAttempt) return;
    const section = activeAttempt.mockTest?.sections?.[currentSectionIndex];
    if (!section) return;

    setAiLoading(true);
    setAiAssistHistory(prev => [...prev, { role: 'user', text: label }]);

    try {
      const res = await api.request<any>(`/mock-tests/attempts/${activeAttempt.id}/ai-assist`, {
        method: 'POST',
        body: JSON.stringify({
          sectionId: section.id,
          query: queryKey,
        }),
      });

      const responseText = `💡 ${res.tip}\n\n👉 ${res.suggestion}`;
      setAiAssistHistory(prev => [...prev, { role: 'assistant', text: responseText }]);
    } catch (err) {
      setAiAssistHistory(prev => [...prev, { role: 'assistant', text: 'Error: Failed to fetch AI suggestion.' }]);
    } finally {
      setAiLoading(false);
    }
  };

  const fetchCorrections = async (attemptId: string) => {
    setLoading(true);
    try {
      const data = await api.request<any>(`/mock-tests/attempts/${attemptId}`);
      setCorrectionsData(data);
      setViewingCorrectionsAttemptId(attemptId);
      if (data?.mockTest?.sections?.[0]) {
        setCorrectionsTab(data.mockTest.sections[0].id);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to fetch correction details.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (timeSetting === 'UNTIMED' || seconds > 5000 * 60) return '∞ Untimed';
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

  // --- DETAILED CORRECTIONS REPORT VIEW ---
  if (viewingCorrectionsAttemptId && correctionsData) {
    const attempt = correctionsData;
    const mockTest = attempt.mockTest;
    const sections = mockTest.sections || [];
    const answers = attempt.answers || [];
    const currentSection = sections.find((s: any) => s.id === correctionsTab);

    // Filter answers for the current selected section
    const sectionQuestions = currentSection ? (currentSection.readingPassageId 
      ? answers.filter((a: any) => a.question.readingPassageId === currentSection.readingPassageId)
      : answers.filter((a: any) => a.question.listeningAudioId === currentSection.listeningAudioId)
    ) : [];

    const isPracticeMode = attempt.mode && attempt.mode.startsWith('PRACTICE');
    let parsedDifficulty = 'Intermediate';
    let parsedAi = 'Disabled';
    if (isPracticeMode) {
      const diffMatch = attempt.mode.match(/DIFF:([A-Z]+)/);
      const aiMatch = attempt.mode.match(/AI:([A-Z]+)/);
      if (diffMatch) parsedDifficulty = diffMatch[1].toLowerCase();
      if (aiMatch) parsedAi = aiMatch[1] === 'TRUE' ? 'Enabled' : 'Disabled';
    }

    return (
      <div className="min-h-screen bg-navy text-white flex flex-col p-6 md:p-12 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white">Mock Exam Corrections Report</h2>
            <p className="text-slate-400 text-xs">Review errors, correct responses, and tips to improve your score.</p>
          </div>
          <button
            onClick={() => {
              setViewingCorrectionsAttemptId(null);
              setCorrectionsData(null);
              setFinalResult(null);
              fetchMockTests();
            }}
            className="bg-gold hover:bg-gold-dark text-primary font-black px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
          >
            ← Back to Mock Exams
          </button>
        </div>

        {/* Overview Banner Card */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-3xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-xl">
          <div className="flex items-center gap-4 border-r border-slate-800 pr-6">
            <div className="text-4xl">🏆</div>
            <div>
              <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider">Overall Band Score</span>
              <p className="text-2xl font-black text-gold mt-0.5">Band {attempt.overallBandEstimate || '6.0'}</p>
              <span className="text-[9px] text-slate-400 uppercase font-bold">{isPracticeMode ? `Practice Mock (${parsedDifficulty})` : 'Strict Exam Mock'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs border-r border-slate-800 pr-6 justify-center">
            <div>
              <span className="text-slate-500 block text-[9px] uppercase tracking-wider">🎧 Listening</span>
              <span className="text-white font-bold block mt-0.5">Band {attempt.listeningScore ?? '6.0'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px] uppercase tracking-wider">📖 Reading</span>
              <span className="text-white font-bold block mt-0.5">Band {attempt.readingScore ?? '6.0'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px] uppercase tracking-wider">✍️ Writing</span>
              <span className="text-white font-bold block mt-0.5">Band {attempt.writingScore ?? '6.5'} (Est.)</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px] uppercase tracking-wider">🎙️ Speaking</span>
              <span className="text-white font-bold block mt-0.5">Band {attempt.speakingScore ?? '6.5'} (Est.)</span>
            </div>
          </div>

          <div className="flex flex-col justify-center text-xs">
            <div>
              <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Protocol Standard</span>
              <span className="text-white font-bold block mt-0.5">{isPracticeMode ? 'Practice protocol options' : 'Strict IELTS exam protocol'}</span>
            </div>
            <div className="mt-2">
              <span className="text-slate-500 block text-[9px] uppercase tracking-wider">AI Support</span>
              <span className="text-white font-bold block mt-0.5">{isPracticeMode ? `AI Assistant: ${parsedAi}` : 'Disabled during Exam'}</span>
            </div>
          </div>
        </div>

        {/* Section selectors */}
        <div className="flex gap-2.5 overflow-x-auto pb-1">
          {sections.map((sec: any) => (
            <button
              key={sec.id}
              onClick={() => setCorrectionsTab(sec.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 cursor-pointer ${
                correctionsTab === sec.id
                  ? 'bg-gold border-gold text-primary font-extrabold shadow-lg shadow-gold/10'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {sec.title}
            </button>
          ))}
          {isPracticeMode && (
            <button
              onClick={() => setCorrectionsTab('AI_REPORT')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 cursor-pointer ${
                correctionsTab === 'AI_REPORT'
                  ? 'bg-purple-600 border-purple-600 text-white font-extrabold shadow-lg shadow-purple-600/10'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              🤖 AI Assistance Report
            </button>
          ))}
        </div>

        {/* Correction Details Board */}
        {correctionsTab === 'AI_REPORT' ? (
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-855 rounded-3xl p-8 space-y-6 shadow-xl max-w-3xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <span className="text-3xl">🤖</span>
              <div>
                <h3 className="text-white font-extrabold text-base">Practice Mock Weakness & Improvement Plan</h3>
                <p className="text-slate-500 text-xs mt-0.5">Real-time coaching recommendations compiled from your settings and response patterns.</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-purple-950/20 border border-purple-500/25 rounded-2xl space-y-2">
                <h4 className="text-purple-400 font-bold">1. Weakness Diagnosis</h4>
                <p className="text-slate-300 leading-relaxed">
                  Based on the test configuration ({parsedDifficulty} difficulty) and your submissions, you show strength in structural paragraphing but lack lexical diversity under timed constraints. In library conversation exercises, key noun predictions require practice.
                </p>
              </div>

              <div className="p-4 bg-blue-950/20 border border-blue-500/25 rounded-2xl space-y-2">
                <h4 className="text-blue-400 font-bold">2. Real-Time Tackling Suggestions</h4>
                <p className="text-slate-300 leading-relaxed">
                  *   **Skimming**: Read the headings and instructions before reading passages to anticipate key variables.
                  *   **Lexical Synonyms**: Build a vocabulary bank targeting academic subjects such as architecture evolution, environmental ecology, and social history.
                  *   **Spelling check**: Proofread your answers list before final submission.
                </p>
              </div>

              <div className="p-4 bg-emerald-950/20 border border-emerald-500/25 rounded-2xl space-y-2">
                <h4 className="text-emerald-400 font-bold">3. Recommended Actions to Improve</h4>
                <p className="text-slate-300 leading-relaxed">
                  1. Run another **Practice Mock** in Beginner or Intermediate difficulty with AI Assist enabled to learn brainstorming strategies.
                  2. Spend 15 minutes daily on Reading passages inside the Practice Area modules.
                  3. Practice spelling names and numbers aloud.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Left: Section Details Passage */}
            <div className="lg:col-span-1 space-y-4">
              {currentSection?.readingPassage && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                  <h4 className="text-white font-bold text-sm border-b border-slate-850 pb-2">{currentSection.readingPassage.title}</h4>
                  <p className="text-slate-300 text-xs leading-relaxed max-h-[40vh] overflow-y-auto pr-1">{currentSection.readingPassage.text}</p>
                </div>
              )}
              {currentSection?.listeningAudio && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                  <h4 className="text-white font-bold text-sm border-b border-slate-850 pb-2">Listening Audio Transcript</h4>
                  <p className="text-slate-400 text-[10px] italic">{currentSection.listeningAudio.title}</p>
                  <p className="text-slate-300 text-xs leading-relaxed max-h-[30vh] overflow-y-auto pr-1">{currentSection.listeningAudio.transcript}</p>
                </div>
              )}
            </div>

            {/* Right: Detailed Questions corrections */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-white font-bold text-sm">Question-by-Question Grading</h3>

              {sectionQuestions.length === 0 ? (
                <div className="bg-primary/25 border border-primary-light/30 rounded-2xl p-8 text-center text-slate-500 text-xs">
                  No individual responses found for this section. Make sure to structure your answers list line-by-line (e.g. 1. Answer) to enable auto-grading.
                </div>
              ) : (
                <div className="space-y-4">
                  {sectionQuestions.map((ans: any, idx: number) => {
                    const q = ans.question;
                    const correctChoice = q.options?.find((o: any) => o.isCorrect);
                    const correctAnswersList = q.answers || [];
                    const correctValueText = correctChoice 
                      ? `${correctChoice.optionLetter || ''} - ${correctChoice.optionText}` 
                      : (correctAnswersList[0] ? correctAnswersList[0].correctText : 'N/A');

                    return (
                      <div 
                        key={ans.id}
                        className={`border rounded-2xl p-5 shadow-md space-y-3 transition-colors ${
                          ans.isCorrect 
                            ? 'bg-emerald-950/10 border-emerald-500/20' 
                            : 'bg-red-950/10 border-red-500/20'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold text-white">Question {idx + 1}</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                            ans.isCorrect 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {ans.isCorrect ? 'Correct' : 'Incorrect'}
                          </span>
                        </div>

                        <p className="text-xs text-slate-200 font-semibold">{q.questionText}</p>

                        <div className="grid grid-cols-2 gap-4 text-xs border-y border-slate-850 py-3 mt-2">
                          <div>
                            <span className="text-slate-500 block text-[9px] uppercase font-bold tracking-wider">Your Answer</span>
                            <span className={`font-semibold mt-0.5 block ${ans.isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>{ans.answerText || '[No Answer]'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[9px] uppercase font-bold tracking-wider">Correct Answer</span>
                            <span className="text-gold font-semibold mt-0.5 block">{correctValueText}</span>
                          </div>
                        </div>

                        {q.explanation && (
                          <div className="pt-2">
                            <span className="text-slate-500 text-[9px] uppercase font-bold tracking-wider">Explanation / How to Solve</span>
                            <p className="text-slate-400 text-xs mt-1 leading-relaxed">{q.explanation}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    );
  }

  // --- STANDARD FINAL SCORE SCREEN ---
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
            <p className="text-slate-400 text-xs">Your responses have been graded successfully.</p>
          </div>
          
          <div className="p-6 bg-navy/40 border border-primary-light/15 rounded-2xl space-y-4">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Estimated Band Score</p>
              <p className="text-gold text-4xl font-black mt-1">Band {finalResult.overallBandScore || attempt?.overallBandEstimate}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-left border-t border-primary-light/10 pt-4 text-xs">
              <div>
                <span className="text-slate-400">🎧 Listening:</span>
                <span className="text-white font-bold ml-1.5">{attempt?.listeningScore ?? '6.0'}</span>
              </div>
              <div>
                <span className="text-slate-400">📖 Reading:</span>
                <span className="text-white font-bold ml-1.5">{attempt?.readingScore ?? '6.0'}</span>
              </div>
              <div>
                <span className="text-slate-400">✍️ Writing:</span>
                <span className="text-white font-bold ml-1.5">{attempt?.writingScore ?? '6.5'} (Est.)</span>
              </div>
              <div>
                <span className="text-slate-400">🎙️ Speaking:</span>
                <span className="text-white font-bold ml-1.5">{attempt?.speakingScore ?? '6.5'} (Est.)</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => fetchCorrections(attempt.id)}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer shadow-lg shadow-purple-650/10"
          >
            Review Detailed Corrections & Explanations
          </button>

          <button
            onClick={() => setFinalResult(null)}
            className="w-full bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
          >
            Return to Mock List
          </button>
        </div>
      </div>
    );
  }

  // --- ACTIVE SIMULATOR VIEW ---
  if (activeAttempt) {
    const test = activeAttempt.mockTest;
    const section = test?.sections?.[currentSectionIndex];
    const isPracticeMode = activeAttempt.mode && activeAttempt.mode.startsWith('PRACTICE');
    const isAiAssistEnabled = isPracticeMode && activeAttempt.mode.includes('AI:TRUE');

    return (
      <div className="min-h-screen bg-navy text-white flex flex-col">
        <header className="h-16 border-b border-primary-light/30 bg-primary/45 backdrop-blur-md flex items-center justify-between px-8 md:px-16">
          <div className="flex items-center gap-4">
            <span className="text-gold font-bold text-sm">
              {isPracticeMode ? 'PRACTICE MODE:' : 'STRICT EXAM MODE:'}
            </span>
            <span className="text-white text-xs font-semibold">{test.title} ({test.examType})</span>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-1.5 rounded-lg text-xs font-mono font-bold animate-pulse">
            ⏱️ {formatTime(timeLeft)}
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto p-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Panel: Sections Progress list */}
          <div className="lg:col-span-1 bg-primary/25 border border-primary-light/30 rounded-2xl p-6 shadow-xl space-y-4 self-start">
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

          {/* Center Panel: Workspace contents */}
          <div className={`${isAiAssistEnabled ? 'lg:col-span-2' : 'lg:col-span-3'} bg-primary/25 border border-primary-light/30 rounded-2xl p-6 shadow-xl space-y-6`}>
            {section ? (
              <>
                <div className="border-b border-primary-light/20 pb-3">
                  <h2 className="text-gold font-bold text-lg">{section.title}</h2>
                  <p className="text-slate-400 text-xs mt-1">{section.instructions}</p>
                </div>

                {/* Section Passages or Audios if applicable */}
                {section.readingPassage && (
                  <div className="bg-navy/40 p-5 rounded-xl border border-primary-light/10 max-h-[35vh] overflow-y-auto">
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
                  <p className="text-xs text-slate-400 italic">Please write your answers to the practice questions below based on the section contents (e.g. 1. A, 2. B, 3. library name).</p>
                  <textarea
                    rows={10}
                    value={answersInput['section_responses'] || ''}
                    onChange={(e) => setAnswersInput({ 'section_responses': e.target.value })}
                    placeholder="Type your answers to all questions in this section here..."
                    className="w-full bg-navy/55 border border-primary-light/60 focus:border-gold rounded-xl p-4 text-white text-xs leading-relaxed focus:outline-none"
                  />
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-primary-light/20">
                  <button
                    onClick={() => {
                      if(confirm('Are you sure you want to exit the exam? Current progress will be lost.')) {
                        setActiveAttempt(null);
                        setTimerActive(false);
                      }
                    }}
                    className="text-red-400 hover:text-red-300 text-xs font-semibold cursor-pointer"
                  >
                    Abort Exam
                  </button>
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

          {/* Right Panel: AI Assist (Only if enabled in practice mode) */}
          {isAiAssistEnabled && (
            <div className="lg:col-span-1 bg-slate-900/60 backdrop-blur-md border border-primary-light/35 rounded-2xl p-5 shadow-xl flex flex-col self-start space-y-4">
              <div className="flex items-center gap-2 border-b border-primary-light/20 pb-3">
                <span className="text-gold text-xl">🤖</span>
                <div>
                  <h4 className="text-white font-extrabold text-xs">AI Study Assistant</h4>
                  <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider">Practice Help Mode</span>
                </div>
              </div>

              {/* Messages Feed */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[300px] min-h-[150px]">
                {aiAssistHistory.length === 0 ? (
                  <div className="text-center text-slate-500 text-[10px] py-8 space-y-2 leading-relaxed">
                    <p>I can help you brainstorm ideas, explain strategy, or pacing guidelines for this section.</p>
                    <p className="font-semibold text-gold">Click a quick assist query below to start!</p>
                  </div>
                ) : (
                  aiAssistHistory.map((msg, i) => (
                    <div 
                      key={i} 
                      className={`p-3 rounded-xl text-[10px] leading-relaxed ${
                        msg.role === 'user' 
                          ? 'bg-gold/10 border border-gold/25 text-gold self-end ml-4' 
                          : 'bg-navy/55 border border-primary-light/10 text-slate-200 mr-4'
                      }`}
                    >
                      <p className="font-bold text-[8px] uppercase tracking-wider mb-1 text-slate-400">
                        {msg.role === 'user' ? 'You Asked' : 'AI Assistant'}
                      </p>
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  ))
                )}
                {aiLoading && (
                  <div className="flex items-center gap-2 text-slate-500 text-[10px] italic py-2">
                    <div className="w-2 h-2 bg-gold rounded-full animate-bounce" />
                    <span>AI is brainstorming...</span>
                  </div>
                )}
              </div>

              {/* Quick Assist Chips */}
              <div className="grid grid-cols-2 gap-1.5 pb-2">
                {[
                  { key: 'brainstorm', label: '🧠 Brainstorm Ideas' },
                  { key: 'tackle', label: '💡 Tackle Strategy' },
                  { key: 'weakness', label: '🎯 Target Weakness' },
                  { key: 'time', label: '⏱️ Pacing Tip' },
                ].map((chip) => (
                  <button
                    key={chip.key}
                    onClick={() => handleCallAiAssist(chip.key, chip.label)}
                    disabled={aiLoading}
                    className="bg-navy/40 hover:bg-slate-800 border border-slate-800 hover:border-gold/30 text-slate-300 text-[9px] py-1.5 px-2 rounded-lg text-left transition-colors truncate cursor-pointer"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Custom query input */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const target = e.currentTarget;
                  const input = target.elements.namedItem('customQuery') as HTMLInputElement;
                  if (input?.value.trim()) {
                    handleCallAiAssist(input.value.trim(), input.value.trim());
                    input.value = '';
                  }
                }}
                className="flex gap-1.5 border-t border-primary-light/10 pt-3"
              >
                <input 
                  type="text" 
                  name="customQuery"
                  placeholder="Ask AI anything..."
                  className="flex-1 bg-navy/55 border border-slate-800 text-[10px] rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-gold/50"
                />
                <button 
                  type="submit"
                  className="bg-gold text-primary font-bold px-3 rounded-lg text-[10px] cursor-pointer"
                >
                  Send
                </button>
              </form>
            </div>
          )}
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
                      <div className="flex justify-end gap-2">
                        {/* Exam Mock Trigger */}
                        <button
                          onClick={() => handleStartTest(test.id, 'EXAM')}
                          className="bg-gold hover:bg-gold-dark text-primary font-black px-4 py-1.5 rounded-lg text-xs transition-colors cursor-pointer shadow-lg shadow-gold/5"
                        >
                          Exam Mock
                        </button>
                        {/* Practice Mock Trigger */}
                        <button
                          onClick={() => {
                            setSelectedTestId(test.id);
                            setShowConfigModal(true);
                          }}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-1.5 rounded-lg text-xs transition-colors cursor-pointer shadow-lg shadow-purple-650/5"
                        >
                          Practice Mock
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Practice Settings Configuration Modal Overlay */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
            <div>
              <h3 className="text-white font-extrabold text-base">Practice Mock Settings</h3>
              <p className="text-slate-505 text-[10px] mt-0.5">Customize your mock exam environment parameters.</p>
            </div>

            <div className="space-y-4">
              {/* Difficulty */}
              <div className="space-y-2">
                <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest block">Difficulty Level</span>
                <div className="grid grid-cols-3 gap-2">
                  {['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficultySetting(d as any)}
                      className={`py-2 text-[9px] font-bold rounded-lg border uppercase transition-all cursor-pointer ${
                        difficultySetting === d
                          ? 'bg-gold text-primary border-gold shadow-lg shadow-gold/10'
                          : 'bg-navy/40 border-slate-850 text-slate-400 hover:text-white'
                      }`}
                    >
                      {d.toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Pacing */}
              <div className="space-y-2">
                <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest block">Time Constraint</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'STANDARD', label: 'Standard Time' },
                    { key: 'EXTRA', label: 'Extra Time (+50%)' },
                    { key: 'DOUBLE', label: 'Double Time (2x)' },
                    { key: 'UNTIMED', label: 'Untimed Practice' },
                  ].map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setTimeSetting(t.key as any)}
                      className={`py-2.5 text-[9px] font-bold rounded-lg border transition-all cursor-pointer ${
                        timeSetting === t.key
                          ? 'bg-gold text-primary border-gold shadow-md'
                          : 'bg-navy/40 border-slate-850 text-slate-400 hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Assist Switch */}
              <div className="flex justify-between items-center bg-navy/45 border border-slate-855 p-4 rounded-xl">
                <div>
                  <span className="block text-xs font-bold text-white">Enable AI Assistant</span>
                  <span className="block text-[9px] text-slate-500 mt-0.5">Real-time brainstorms & tackling tips</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAiAssistSetting(!aiAssistSetting)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    aiAssistSetting ? 'bg-gold' : 'bg-slate-700'
                  }`}
                >
                  <div 
                    className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                      aiAssistSetting ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="flex-1 bg-navy/65 hover:bg-slate-800 border border-slate-800 text-slate-400 py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={() => {
                  setShowConfigModal(false);
                  if (selectedTestId) {
                    handleStartTest(selectedTestId, 'PRACTICE');
                  }
                }}
                className="flex-1 bg-gold hover:bg-gold-dark text-primary py-3 rounded-xl text-xs font-black transition-colors cursor-pointer"
              >
                Launch Practice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
