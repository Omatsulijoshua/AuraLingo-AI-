'use client';

import React, { useEffect, useState, useRef } from 'react';
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

  // New View states matching mobile app
  const [viewState, setViewState] = useState<'TESTS' | 'DETAILS' | 'PRACTICE'>('TESTS');
  const [selectedBook, setSelectedBook] = useState<number>(10);
  const [selectedTest, setSelectedTest] = useState<number>(1);
  const [enableAudioControls, setEnableAudioControls] = useState<boolean>(false);

  // Modal display states
  const [showWarningModal, setShowWarningModal] = useState<boolean>(false);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);
  const [showIncompleteModal, setShowIncompleteModal] = useState<boolean>(false);

  // Audio Player states
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const getMockQuestions = () => {
    const list: any[] = [];
    const part1Questions = [
      "Name of clerk: ___",
      "Survey start time: ___",
      "Most frequent transport mode used: ___",
      "Nearest train ___ is 2 miles away.",
      "Primary purpose of travel: ___",
      "The trains are generally ___ and tidy.",
      "Customer complains about the ___'s attitude.",
      "Wants to submit an official ___.",
      "Usually gets a ___ easily in the morning.",
      "Believes the ticket ___ is too high."
    ];
    const part1Answers = [
      "Sarah", "1:30", "bus", "station", "shopping", "clean", "driver", "complaint", "seat", "price"
    ];

    for (let i = 0; i < 10; i++) {
      list.push({
        id: `b10t1l_q${i+1}`,
        questionType: 'SHORT_ANSWER',
        difficulty: 'BEGINNER',
        instruction: 'Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.',
        questionText: part1Questions[i],
        correctAnswer: part1Answers[i],
        explanation: 'Based on the recording conversation in Part 1.'
      });
    }

    const part2Questions = [
      "The recreation center expansion was funded mainly by:",
      "The new swimming pool will open on:",
      "Who will cut the ribbon during the ceremony?",
      "The fitness gym entrance fee for members is:",
      "The new yoga studio is located on the:",
      "Which facility requires advance reservation?",
      "The main café now offers more choices of:",
      "The children's play area has been moved next to the:",
      "Parking capacity has been increased by:",
      "The center is now closed on which day?"
    ];
    const part2Options = [
      [
        {optionLetter: 'A', optionText: 'Local council grants'},
        {optionLetter: 'B', optionText: 'Private member donations'},
        {optionLetter: 'C', optionText: 'National lottery funding'}
      ],
      [
        {optionLetter: 'A', optionText: 'First Monday of July'},
        {optionLetter: 'B', optionText: 'Second Saturday of August'},
        {optionLetter: 'C', optionText: 'Last Friday of September'}
      ],
      [
        {optionLetter: 'A', optionText: 'The Mayor'},
        {optionLetter: 'B', optionText: 'A local Olympic athlete'},
        {optionLetter: 'C', optionText: 'The center director'}
      ],
      [
        {optionLetter: 'A', optionText: 'Totally free of charge'},
        {optionLetter: 'B', optionText: 'Half price on weekdays'},
        {optionLetter: 'C', optionText: 'Standard entry fee'}
      ],
      [
        {optionLetter: 'A', optionText: 'Ground floor'},
        {optionLetter: 'B', optionText: 'First floor'},
        {optionLetter: 'C', optionText: 'Basement level'}
      ],
      [
        {optionLetter: 'A', optionText: 'Squash courts'},
        {optionLetter: 'B', optionText: 'Sauna room'},
        {optionLetter: 'C', optionText: 'Tennis courts'}
      ],
      [
        {optionLetter: 'A', optionText: 'Hot meals'},
        {optionLetter: 'B', optionText: 'Organic beverages'},
        {optionLetter: 'C', optionText: 'Gluten-free snacks'}
      ],
      [
        {optionLetter: 'A', optionText: 'Reception lobby'},
        {optionLetter: 'B', optionText: 'Outdoor courtyard'},
        {optionLetter: 'C', optionText: 'Swimming pool view area'}
      ],
      [
        {optionLetter: 'A', optionText: '50 spaces'},
        {optionLetter: 'B', optionText: '100 spaces'},
        {optionLetter: 'C', optionText: '150 spaces'}
      ],
      [
        {optionLetter: 'A', optionText: 'Sundays'},
        {optionLetter: 'B', optionText: 'Mondays'},
        {optionLetter: 'C', optionText: 'Tuesdays'}
      ],
    ];
    const part2Answers = [
      "C", "A", "B", "A", "B", "C", "C", "A", "B", "B"
    ];

    for (let i = 0; i < 10; i++) {
      list.push({
        id: `b10t1l_q${i+11}`,
        questionType: 'MULTIPLE_CHOICE',
        difficulty: 'INTERMEDIATE',
        instruction: 'Choose the correct letter, A, B or C.',
        questionText: part2Questions[i],
        options: part2Options[i],
        correctAnswer: part2Answers[i],
        explanation: 'Based on the monologue in Part 2.'
      });
    }

    const part3Questions = [
      "The students chose the marketing topic because:",
      "Which database did the professor recommend first?",
      "The primary issue with the first case study was:",
      "How did they collect the survey questionnaires?",
      "The response rate of the survey was approximately:",
      "What surprised the students about the survey results?",
      "The students decide to shorten their presentation because:",
      "Who will present the statistics slide?",
      "The professor advised them to add more:",
      "Their final draft needs to be submitted by:"
    ];
    const part3Options = [
      [
        {optionLetter: 'A', optionText: 'It was easy to find data'},
        {optionLetter: 'B', optionText: 'They both had interest in retail'},
        {optionLetter: 'C', optionText: 'It was suggested by a senior'}
      ],
      [
        {optionLetter: 'A', optionText: 'Business Source Complete'},
        {optionLetter: 'B', optionText: 'Emerald Insight'},
        {optionLetter: 'C', optionText: 'Google Scholar'}
      ],
      [
        {optionLetter: 'A', optionText: 'Outdated statistics'},
        {optionLetter: 'B', optionText: 'Irrelevant conclusion'},
        {optionLetter: 'C', optionText: 'Lack of detail'}
      ],
      [
        {optionLetter: 'A', optionText: 'Sent via email list'},
        {optionLetter: 'B', optionText: 'Handed out in library lobby'},
        {optionLetter: 'C', optionText: 'Posted on social media group'}
      ],
      [
        {optionLetter: 'A', optionText: '35%'},
        {optionLetter: 'B', optionText: '60%'},
        {optionLetter: 'C', optionText: '85%'}
      ],
      [
        {optionLetter: 'A', optionText: 'A high degree of customer loyalty'},
        {optionLetter: 'B', optionText: 'Preference for online delivery'},
        {optionLetter: 'C', optionText: 'Dislike of automated checkout'}
      ],
      [
        {optionLetter: 'A', optionText: 'Strict 10-minute limit'},
        {optionLetter: 'B', optionText: 'Two slides were redundant'},
        {optionLetter: 'C', optionText: 'They want more time for Q&A'}
      ],
      [
        {optionLetter: 'A', optionText: 'Jack'},
        {optionLetter: 'B', optionText: 'Lisa'},
        {optionLetter: 'C', optionText: 'Both of them'}
      ],
      [
        {optionLetter: 'A', optionText: 'Visual charts'},
        {optionLetter: 'B', optionText: 'Academic references'},
        {optionLetter: 'C', optionText: 'Critical analysis'}
      ],
      [
        {optionLetter: 'A', optionText: 'Next Wednesday'},
        {optionLetter: 'B', optionText: 'Next Friday'},
        {optionLetter: 'C', optionText: 'End of the month'}
      ],
    ];
    const part3Answers = [
      "B", "A", "A", "B", "B", "A", "A", "C", "C", "B"
    ];

    for (let i = 0; i < 10; i++) {
      list.push({
        id: `b10t1l_q${i+21}`,
        questionType: 'MULTIPLE_CHOICE',
        difficulty: 'INTERMEDIATE',
        instruction: 'Choose the correct letter, A, B or C.',
        questionText: part3Questions[i],
        options: part3Options[i],
        correctAnswer: part3Answers[i],
        explanation: 'Based on the academic discussion in Part 3.'
      });
    }

    const part4Questions = [
      "Sleep patterns are regulated by a ___ clock.",
      "Most mammals sleep for a ___ of their day.",
      "Birds can sleep while flying due to unihemispheric ___ activity.",
      "Predator species tend to sleep more ___ than prey species.",
      "Prey species have developed ___ sleep cycles to stay alert.",
      "Lack of sleep reduces the efficiency of the animal's ___ system.",
      "Slower brainwaves during deep sleep help in memory ___.",
      "Sea lions sleep in water to escape land-based ___.",
      "Dolphins keep one ___ open while sleeping.",
      "The study concluded that sleep is essential for brain ___."
    ];
    const part4Answers = [
      "biological", "third", "brain", "deeply", "short", "immune", "consolidation", "predators", "eye", "recovery"
    ];

    for (let i = 0; i < 10; i++) {
      list.push({
        id: `b10t1l_q${i+31}`,
        questionType: 'SHORT_ANSWER',
        difficulty: 'ADVANCED',
        instruction: 'Write NO MORE THAN ONE WORD for each answer.',
        questionText: part4Questions[i],
        correctAnswer: part4Answers[i],
        explanation: 'Based on the lecture recording in Part 4.'
      });
    }

    return list;
  };

  const fetchAudios = async () => {
    try {
      const data = await api.request<any[]>('/content/audios');
      const loadedAudios = data || [];
      if (loadedAudios.length === 0) {
        const fallback = [
          {
            id: 'b10t1_listening',
            title: 'IELTS Book 10 Test 1',
            audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
            practiceQuestions: getMockQuestions(),
          }
        ];
        setAudios(fallback);
        setSelectedAudio(fallback[0]);
      } else {
        setAudios(loadedAudios);
        setSelectedAudio(loadedAudios[0]);
      }
    } catch (err) {
      console.error('Failed to fetch listening audios', err);
      const fallback = [
        {
          id: 'b10t1_listening',
          title: 'IELTS Book 10 Test 1',
          audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
          practiceQuestions: getMockQuestions(),
        }
      ];
      setAudios(fallback);
      setSelectedAudio(fallback[0]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartPractice = () => {
    setUserAnswers({});
    setFeedback(null);
    setExamSuccess(false);
    setTimeLeft(1800);
    setTimerActive(true);
    setViewState('PRACTICE');
    
    // Auto-play audio when test starts
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.log('Audio autoplay blocked: ', e));
      }
    }, 100);
  };

  const handleSubmit = async () => {
    if (!selectedAudio || !selectedAudio.practiceQuestions || selectedAudio.practiceQuestions.length === 0) return;
    setSubmitting(true);
    setTimerActive(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }

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
            correctAnswerStr: result.correctAnswerStr || q.correctAnswer || 'Correct',
            explanation: q.explanation || 'No explanation available',
            userAnswer: answer,
          });
          if (result.isCorrect) correctCount++;
        } catch (err) {
          // Local fallback comparison
          const isCorrectLocal = answer.trim().toLowerCase() === q.correctAnswer?.toLowerCase();
          results.push({
            questionId: q.id,
            questionText: q.questionText,
            isCorrect: isCorrectLocal,
            correctAnswerStr: q.correctAnswer || 'Correct',
            explanation: q.explanation || 'Based on the listening audio script.',
            userAnswer: answer,
          });
          if (isCorrectLocal) correctCount++;
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

  const formatDuration = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const seekRelative = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime += seconds;
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  const handleExitTest = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setTimerActive(false);
    setViewState('DETAILS');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-800">
        <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // BUILD DYNAMIC TESTS RANGE
  const allTests: { book: number; test: number }[] = [];
  for (let b = 10; b <= 21; b++) {
    for (let t = 1; t <= 4; t++) {
      allTests.push({ book: b, test: t });
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* -------------------- 1. TESTS LIST VIEW -------------------- */}
      {viewState === 'TESTS' && (
        <>
          <header className="h-16 border-b border-slate-200 bg-white flex items-center px-6 md:px-12">
            <Link href="/dashboard" className="text-rose-500 font-bold text-sm flex items-center gap-1">
              <span>‹</span> Back
            </Link>
          </header>
          <main className="max-w-xl w-full mx-auto p-6 md:p-10 space-y-6">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Listening Practice</h1>
              <p className="text-slate-500 text-sm mt-1">Improve your listening comprehension</p>
            </div>

            <div className="space-y-4">
              <h3 className="text-slate-900 font-bold text-base">Available Tests</h3>
              <div className="space-y-3">
                {allTests.map((t, index) => {
                  const isUnlocked = t.book === 10 && t.test === 1;
                  return (
                    <div
                      key={index}
                      onClick={() => {
                        if (isUnlocked) {
                          setSelectedBook(t.book);
                          setSelectedTest(t.test);
                          setViewState('DETAILS');
                        } else {
                          alert('Premium Content: Please upgrade your subscription to access all IELTS Books and Practice Tests.');
                        }
                      }}
                      className={`flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl shadow-sm cursor-pointer hover:border-rose-300 transition-all ${
                        !isUnlocked && 'opacity-85'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-11 h-11 rounded-full flex items-center justify-center ${
                            isUnlocked ? 'bg-rose-50 text-rose-500' : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {isUnlocked ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${isUnlocked ? 'text-slate-800' : 'text-slate-500'}`}>
                            IELTS Book {t.book} Test {t.test}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {isUnlocked ? '4 Sections • 40 Questions' : 'Premium Content'}
                          </p>
                        </div>
                      </div>
                      <span className="text-slate-300 font-bold text-lg">›</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </main>
        </>
      )}

      {/* -------------------- 2. TEST DETAILS VIEW -------------------- */}
      {viewState === 'DETAILS' && (
        <>
          <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 md:px-12">
            <button
              onClick={() => setViewState('TESTS')}
              className="text-rose-500 font-bold text-sm flex items-center gap-1 cursor-pointer"
            >
              <span>‹</span> Back
            </button>
            <span className="text-slate-800 font-bold text-sm">Test Details</span>
            <div className="w-8" />
          </header>
          <main className="max-w-xl w-full mx-auto p-6 md:p-10 space-y-6 pb-28">
            <div className="space-y-3">
              <h1 className="text-2xl font-extrabold text-slate-900">IELTS Book {selectedBook} Test {selectedTest}</h1>
              <div className="flex gap-4 text-xs font-semibold">
                <span className="text-rose-500 flex items-center gap-1">⏱️ 4 Sections</span>
                <span className="text-slate-500 flex items-center gap-1">❓ 40 Questions</span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed">
                The Listening test takes approximately 30-40 minutes. You will hear four recordings of native English speakers and then write your answers to a series of questions.
              </p>
            </div>

            {/* Audio Controls Toggle Card */}
            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <h4 className="text-slate-800 font-bold text-sm">Enable Audio Controls</h4>
                <p className="text-slate-500 text-xs mt-0.5">Allow pausing, rewinding, and fast-forwarding.</p>
              </div>
              <button
                onClick={() => {
                  if (!enableAudioControls) {
                    setShowWarningModal(true);
                  } else {
                    setEnableAudioControls(false);
                  }
                }}
                className={`w-11 h-6 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-300 ${
                  enableAudioControls ? 'bg-rose-500' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${
                    enableAudioControls ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Structure List */}
            <div className="space-y-4">
              <h3 className="text-slate-900 font-bold text-base">Test Structure</h3>
              <div className="space-y-3">
                {[
                  { part: 'Part 1', q: '10 Questions', desc: 'A conversation between two people set in an everyday social context.' },
                  { part: 'Part 2', q: '10 Questions', desc: 'A monologue set in an everyday social context, e.g. a speech about local facilities.' },
                  { part: 'Part 3', q: '10 Questions', desc: 'A conversation between up to four people set in an educational or training context.' },
                  { part: 'Part 4', q: '10 Questions', desc: 'A monologue on an academic subject, e.g. a university lecture.' },
                ].map((p, index) => (
                  <div key={index} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold text-slate-800">{p.part}</span>
                      <span className="text-slate-400 text-xs font-medium">{p.q}</span>
                    </div>
                    <p className="text-slate-500 text-xs leading-relaxed">{p.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Locked alert card */}
            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col items-center text-center space-y-2">
              <svg className="w-8 h-8 text-slate-400 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="text-slate-500 text-xs leading-relaxed max-w-sm">
                Questions and audio will remain hidden until you start the test to simulate real exam conditions.
              </p>
            </div>

            {/* Bottom start button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 md:relative md:bg-transparent md:border-0 md:p-0">
              <button
                onClick={handleStartPractice}
                className="w-full max-w-xl mx-auto flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-rose-600/10 cursor-pointer transition-colors"
              >
                <span>🎧</span> Start Test
              </button>
            </div>
          </main>
        </>
      )}

      {/* -------------------- 3. ACTIVE simulator VIEW -------------------- */}
      {viewState === 'PRACTICE' && selectedAudio && (
        <>
          <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 md:px-12 sticky top-0 z-10 shadow-sm">
            <button
              onClick={() => setShowExitModal(true)}
              className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer text-lg"
            >
              ×
            </button>
            <span className="text-slate-800 font-extrabold text-sm">IELTS Book {selectedBook} Test {selectedTest}</span>
            <div className="flex gap-2">
              {timerActive && (
                <div className="bg-red-50 text-red-500 px-3 py-1 rounded-full text-xs font-bold font-mono flex items-center gap-1 border border-red-100">
                  ⏱️ {formatTime(timeLeft)}
                </div>
              )}
              <div className="bg-rose-50 text-rose-500 px-3 py-1 rounded-full text-xs font-bold font-mono border border-rose-100">
                {Object.keys(userAnswers).filter(k => userAnswers[k] && userAnswers[k].trim().length > 0).length} / {selectedAudio.practiceQuestions?.length || 0}
              </div>
            </div>
          </header>

          <main className="max-w-xl w-full mx-auto p-6 md:p-10 space-y-6 pb-28">
            {/* Native HTML5 Audio Controller Tag (Hidden, manipulated via ref) */}
            <audio
              ref={audioRef}
              src={selectedAudio.audioUrl}
              onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
              onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              className="hidden"
            />

            {/* Custom Audio Controller UI */}
            {enableAudioControls ? (
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center justify-center gap-6">
                  <button
                    onClick={() => seekRelative(-10)}
                    className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    ↺ 10
                  </button>
                  <button
                    onClick={togglePlay}
                    className="w-14 h-14 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/20 hover:bg-rose-600 cursor-pointer"
                  >
                    {isPlaying ? (
                      <span className="text-xl">⏸</span>
                    ) : (
                      <span className="text-xl ml-0.5">▶</span>
                    )}
                  </button>
                  <button
                    onClick={() => seekRelative(10)}
                    className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    10 ↻
                  </button>
                </div>
                <div className="space-y-1">
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (audioRef.current) audioRef.current.currentTime = val;
                      setCurrentTime(val);
                    }}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>{formatDuration(currentTime)}</span>
                    <span>{formatDuration(duration)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 bg-slate-100 border border-slate-200 rounded-2xl shadow-sm space-y-3">
                <div className="flex items-center justify-center gap-2 text-rose-500 font-bold text-xs tracking-wider">
                  <span>🎧</span> EXAM MODE
                </div>
                <p className="text-slate-500 text-xs text-center leading-relaxed">
                  Audio plays continuously once. Seek and pause controls are disabled to simulate actual IELTS exam conditions.
                </p>
                <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-500 h-full transition-all duration-300"
                    style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Correct Correction Feedback display */}
            {feedback && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-slate-800 font-bold text-base">Practice Results</h3>
                  <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg text-xs font-bold">
                    Score: {feedback.correctCount} / {feedback.totalCount}
                  </span>
                </div>
                <hr className="border-slate-100" />
                <div className="space-y-4">
                  {feedback.results.map((res: any, idx: number) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border flex flex-col space-y-2 ${
                        res.isCorrect ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'
                      }`}
                    >
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-500">Question {idx + 1}</span>
                        <span className={res.isCorrect ? 'text-emerald-700' : 'text-rose-600'}>
                          {res.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-800">{res.questionText}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs font-medium pt-1">
                        <p className={res.isCorrect ? 'text-emerald-700' : 'text-rose-600'}>
                          Your Answer: {res.userAnswer || '(blank)'}
                        </p>
                        <p className="text-rose-600 font-bold">
                          Correct: {res.correctAnswerStr}
                        </p>
                      </div>
                      <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-100/50 leading-relaxed">
                        <span className="font-bold text-slate-600 block mb-0.5">Explanation:</span>
                        {res.explanation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Exam mode submission screen */}
            {examSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-xl">
                  ★
                </div>
                <h3 className="text-emerald-800 font-bold text-base">Exam Submitted Successfully!</h3>
                <p className="text-emerald-700 text-xs max-w-sm mx-auto leading-relaxed">
                  Your answers have been logged in Exam Mode for evaluation. You can check details in Attempt History later.
                </p>
                <button
                  onClick={() => {
                    setViewState('DETAILS');
                    setExamSuccess(false);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer transition-colors"
                >
                  Practice Again
                </button>
              </div>
            )}

            {/* Questions List */}
            <div className="space-y-6">
              {selectedAudio.practiceQuestions?.map((q: any, index: number) => {
                const isMCQ = q.questionType === 'MULTIPLE_CHOICE';
                const answer = userAnswers[q.id] || '';

                const showPartHeader = (idx: number) => {
                  if (idx === 0) {
                    return (
                      <div className="pt-4 pb-2 border-b border-slate-200">
                        <h2 className="text-lg font-bold text-slate-900">Questions 1-10</h2>
                        <p className="text-rose-500 text-xs font-bold">Part 1: Social Conversation</p>
                        <p className="text-slate-400 text-xs italic mt-1">{q.instruction}</p>
                      </div>
                    );
                  }
                  if (idx === 10) {
                    return (
                      <div className="pt-6 pb-2 border-b border-slate-200">
                        <h2 className="text-lg font-bold text-slate-900">Questions 11-20</h2>
                        <p className="text-rose-500 text-xs font-bold">Part 2: Social Monologue</p>
                        <p className="text-slate-400 text-xs italic mt-1">{q.instruction}</p>
                      </div>
                    );
                  }
                  if (idx === 20) {
                    return (
                      <div className="pt-6 pb-2 border-b border-slate-200">
                        <h2 className="text-lg font-bold text-slate-900">Questions 21-30</h2>
                        <p className="text-rose-500 text-xs font-bold">Part 3: Educational Conversation</p>
                        <p className="text-slate-400 text-xs italic mt-1">{q.instruction}</p>
                      </div>
                    );
                  }
                  if (idx === 30) {
                    return (
                      <div className="pt-6 pb-2 border-b border-slate-200">
                        <h2 className="text-lg font-bold text-slate-900">Questions 31-40</h2>
                        <p className="text-rose-500 text-xs font-bold">Part 4: Academic Monologue</p>
                        <p className="text-slate-400 text-xs italic mt-1">{q.instruction}</p>
                      </div>
                    );
                  }
                  return null;
                };

                return (
                  <div key={q.id} className="space-y-4">
                    {showPartHeader(index)}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                      <div className="flex gap-2 items-center">
                        <span className="bg-rose-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-md">
                          Q{index + 1}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {isMCQ ? 'Choose the Correct Letter' : 'Short Answer'}
                        </span>
                      </div>
                      <p className="text-slate-800 font-bold text-sm leading-relaxed">{q.questionText}</p>

                      {isMCQ ? (
                        <div className="space-y-2">
                          {q.options?.map((opt: any) => {
                            const isSelected = answer === opt.optionLetter;
                            return (
                              <label
                                key={opt.optionLetter}
                                onClick={() => setUserAnswers(prev => ({ ...prev, [q.id]: opt.optionLetter }))}
                                className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                                  isSelected
                                    ? 'bg-rose-50 border-rose-500 text-rose-700 font-semibold'
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                }`}
                              >
                                <div
                                  className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center ${
                                    isSelected ? 'border-rose-500' : 'border-slate-300'
                                  }`}
                                >
                                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />}
                                </div>
                                <span className="text-xs">{opt.optionLetter}. {opt.optionText}</span>
                              </label>
                            );
                          })}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={answer}
                          onChange={(e) => setUserAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                          placeholder="Type your answer"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-rose-500 focus:bg-white transition-all"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="pt-4">
              <button
                onClick={() => {
                  const answered = Object.keys(userAnswers).filter(k => userAnswers[k] && userAnswers[k].trim().length > 0).length;
                  const total = selectedAudio.practiceQuestions?.length || 0;
                  if (answered < total) {
                    setShowIncompleteModal(true);
                  } else {
                    handleSubmit();
                  }
                }}
                className="w-full flex items-center justify-center gap-2 bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 font-bold py-3.5 rounded-2xl transition-colors cursor-pointer"
              >
                <span>✓</span> See Results
              </button>
            </div>
          </main>
        </>
      )}

      {/* -------------------- 4. WARNING MODALS OVERLAYS -------------------- */}

      {/* AUDIO CONTROLS WARNING MODAL */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4 animate-fade-in">
            <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500 text-2xl">
              ⚠️
            </div>
            <h3 className="text-slate-800 font-bold text-base">Warning</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              In the real IELTS test, you cannot pause, rewind, or fast-forward the audio once it begins. Are you sure you want to enable controls for practice?
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => {
                  setShowWarningModal(false);
                  setEnableAudioControls(false);
                }}
                className="py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowWarningModal(false);
                  setEnableAudioControls(true);
                }}
                className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Enable
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXIT CONFIRMATION MODAL */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500 text-2xl">
              ⚠️
            </div>
            <h3 className="text-slate-800 font-bold text-base">End Test?</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Are you sure you want to end this test?<br />Your progress will be lost.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => {
                  setShowExitModal(false);
                  handleExitTest();
                }}
                className="py-2.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100 cursor-pointer"
              >
                End Test
              </button>
              <button
                onClick={() => setShowExitModal(false)}
                className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INCOMPLETE ANSWERS MODAL */}
      {showIncompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500 text-2xl">
              ⚠️
            </div>
            <h3 className="text-slate-800 font-bold text-base">Incomplete Answers</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              You have answered {Object.keys(userAnswers).filter(k => userAnswers[k] && userAnswers[k].trim().length > 0).length} out of {selectedAudio.practiceQuestions?.length || 0} questions.<br />Are you sure you want to proceed?
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowIncompleteModal(false)}
                className="py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowIncompleteModal(false);
                  handleSubmit();
                }}
                className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
