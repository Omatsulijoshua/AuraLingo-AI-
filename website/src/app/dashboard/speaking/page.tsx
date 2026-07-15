'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function SpeakingPractice() {
  const [prompts, setPrompts] = useState<any[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<any>(null);
  const [mode, setMode] = useState<'PRACTICE' | 'EXAM'>('PRACTICE');
  const [transcription, setTranscription] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [examSuccess, setExamSuccess] = useState(false);

  // Web Speech recognition state
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  // Timer for Exam Mode (2 minutes = 120 seconds for Cue Card talk)
  const [timeLeft, setTimeLeft] = useState(120);
  const [timerActive, setTimerActive] = useState(false);
  const [showTackleSteps, setShowTackleSteps] = useState(false);

  useEffect(() => {
    fetchPrompts();
    
    // Initialize Web Speech API if available
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        recog.continuous = true;
        recog.interimResults = true;
        recog.lang = 'en-US';

        recog.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            setTranscription((prev) => prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + finalTranscript);
          }
        };

        recog.onerror = (err: any) => {
          console.error('Speech recognition error:', err);
          setIsRecording(false);
        };

        recog.onend = () => {
          setIsRecording(false);
        };

        setRecognition(recog);
      }
    }
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
      const data = await api.request<any[]>('/content/speaking/prompts');
      const customOption = {
        id: 'CUSTOM',
        topic: '🎙️ Speak on my own Topic',
        cueCardText: 'Type your custom speaking topic/cue card context details in the box below to start practicing.',
        difficulty: 'CUSTOM',
      };
      const list = [...data, customOption];
      setPrompts(list);
      if (list.length > 0) setSelectedPrompt(list[0]);
    } catch (err) {
      console.error('Failed to fetch speaking prompts', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartPractice = () => {
    setTranscription('');
    setFeedback(null);
    setExamSuccess(false);
    if (mode === 'EXAM') {
      setTimeLeft(120); // 2 mins talk
      setTimerActive(true);
    } else {
      setTimerActive(false);
    }
  };

  const handleToggleRecord = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      try {
        recognition.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Failed to start recognition:', err);
      }
    }
  };

  const handleSubmit = async () => {
    if (!transcription.trim()) return;
    setSubmitting(true);
    setTimerActive(false);
    if (isRecording && recognition) {
      recognition.stop();
    }

    try {
      const result = await api.request<any>('/content/speaking/submit', {
        method: 'POST',
        body: JSON.stringify({
          promptId: selectedPrompt.id,
          audioUrl: 'https://placeholder.url/audio.mp3', // frontend audio placeholder
          transcription: transcription.trim(),
          mode,
          customQuestionText: selectedPrompt.id === 'CUSTOM' ? selectedPrompt.cueCardText : undefined,
        }),
      });

      if (mode === 'EXAM') {
        setExamSuccess(true);
      } else {
        setFeedback(result.feedbackJson);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to submit speaking response.');
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
                : '⏱️ Strict 2-minute timer representing IELTS Cue Card response timing guidelines.'}
            </p>
          </div>

          <div>
            <h3 className="text-white font-bold text-sm mb-3">2. Choose Cue Card</h3>
            {prompts.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No speaking prompts generated yet. Go to Admin Dashboard to spin questions.</p>
            ) : (
              <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                {prompts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      if (!timerActive) {
                        setSelectedPrompt(p);
                        setTranscription('');
                        setFeedback(null);
                        setExamSuccess(false);
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
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-gold">Part 2 Cue Card</span>
                      <span className="text-[9px] text-slate-500">{p.difficulty}</span>
                    </div>
                    {p.topic}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Workspace */}
        <div className="md:col-span-2 space-y-6">
          {selectedPrompt ? (
            <div className="bg-primary/25 border border-primary-light/30 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex justify-between items-center border-b border-primary-light/20 pb-3">
                <h2 className="text-white font-bold text-lg">{selectedPrompt.topic}</h2>
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
                  <span className="flex items-center gap-2">💡 How to Tackle this Speaking Task (Fast & Accurately)</span>
                  <span className="text-[10px] text-slate-400 font-mono">{showTackleSteps ? '▲ Hide Steps' : '▼ Show Steps'}</span>
                </button>
                {showTackleSteps && (
                  <div className="p-4 border-t border-primary-light/15 text-[10px] text-slate-300 space-y-3 bg-navy/20 leading-relaxed">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-primary/20 p-3 rounded-lg border border-primary-light/10">
                        <p className="font-bold text-gold mb-1 uppercase tracking-wider">1. Prepare (1 Min)</p>
                        <p className="text-[9px]">Write brief keywords/outlines during your 1-minute prep time. Never write full sentences; focus on triggering points instead.</p>
                      </div>
                      <div className="bg-primary/20 p-3 rounded-lg border border-primary-light/10">
                        <p className="font-bold text-gold mb-1 uppercase tracking-wider">2. Speak Fluently</p>
                        <p className="text-[9px]">Speak continuously until the examiner stops you. Use linking words ("In addition", "Consequently") to connect ideas naturally.</p>
                      </div>
                      <div className="bg-primary/20 p-3 rounded-lg border border-primary-light/10">
                        <p className="font-bold text-gold mb-1 uppercase tracking-wider">3. Range of Tenses</p>
                        <p className="text-[9px]">Use a rich range of tenses (past simple, present perfect, conditional) and varied vocabulary to describe events clearly.</p>
                      </div>
                      <div className="bg-primary/20 p-3 rounded-lg border border-primary-light/10">
                        <p className="font-bold text-gold mb-1 uppercase tracking-wider">4. Pronunciation</p>
                        <p className="text-[9px]">Speak at a steady, natural pace. Enounce clearly and pause naturally at full stops instead of using vocal fillers ("uhm", "like").</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="bg-navy/40 p-5 rounded-xl border border-primary-light/10 space-y-2">
                <p className="text-gold font-bold text-xs uppercase tracking-wider">Cue Card Bullet Points</p>
                <p className="text-slate-300 text-xs italic leading-relaxed whitespace-pre-wrap">
                  {selectedPrompt.cueCardText}
                </p>
              </div>

              {selectedPrompt.id === 'CUSTOM' && !timerActive && !feedback && !examSuccess && (
                <div className="space-y-2 p-4 bg-navy/40 rounded-xl border border-primary-light/10 text-xs">
                  <label className="block text-slate-400 font-semibold mb-1">Input Custom Speaking Cue Card Topic Details</label>
                  <textarea
                    rows={4}
                    placeholder="e.g. Describe a family member you admire. You should say: who they are, what they do, why you admire them..."
                    value={selectedPrompt.cueCardText}
                    onChange={(e) => setSelectedPrompt({ ...selectedPrompt, cueCardText: e.target.value })}
                    className="w-full bg-navy border border-primary-light/40 focus:border-gold rounded p-3 text-white focus:outline-none resize-none"
                  />
                </div>
              )}

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
                  <div className="relative">
                    <textarea
                      rows={8}
                      disabled={!timerActive && mode === 'EXAM'}
                      value={transcription}
                      onChange={(e) => setTranscription(e.target.value)}
                      placeholder="Use speech-to-text recording, or type your speaking transcript response here..."
                      className="w-full bg-navy/55 border border-primary-light/60 focus:border-gold rounded-xl p-4 text-white text-xs leading-relaxed focus:outline-none"
                    />
                    
                    {/* Speech-to-Text Button overlay */}
                    {timerActive && (
                      <button
                        type="button"
                        onClick={handleToggleRecord}
                        className={`absolute bottom-4 right-4 p-3 rounded-full flex items-center justify-center cursor-pointer transition-all shadow-lg ${
                          isRecording 
                            ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                            : 'bg-gold hover:bg-gold-dark text-primary'
                        }`}
                      >
                        {isRecording ? '⏹️ Stop' : '🎙️ Record Speech'}
                      </button>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Speech status: <span className={isRecording ? "text-red-400 font-bold" : "text-slate-500"}>{isRecording ? "Recording speech..." : "Microphone idle"}</span></span>
                    {timerActive && (
                      <button
                        onClick={handleSubmit}
                        disabled={submitting || !transcription.trim()}
                        className="bg-emerald hover:bg-emerald-dark text-primary font-bold px-6 py-2.5 rounded-lg text-xs cursor-pointer transition-colors disabled:opacity-40"
                      >
                        {submitting ? 'Submitting...' : 'Submit Response'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-primary/25 border border-primary-light/30 rounded-2xl p-12 text-center text-slate-500 text-xs shadow-xl">
              Select a speaking prompt from the sidebar to begin.
            </div>
          )}

          {/* Practice Mode AI Feedback */}
          {feedback && mode === 'PRACTICE' && (
            <div className="bg-primary/25 border border-primary-light/40 rounded-2xl p-6 shadow-2xl space-y-6">
              <h3 className="text-gold font-bold text-base border-b border-primary-light/20 pb-2">AI Speaking Evaluation</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-navy/40 p-3 rounded-lg border border-primary-light/15 text-center">
                  <p className="text-slate-500 text-[9px] uppercase font-bold">Estimated Band</p>
                  <p className="text-gold text-xl font-black mt-0.5">Band {feedback.estimatedBand}</p>
                </div>
                <div className="bg-navy/40 p-3 rounded-lg border border-primary-light/15 text-center">
                  <p className="text-slate-500 text-[9px] uppercase font-bold">Fluency & Coherence</p>
                  <p className="text-slate-300 text-sm font-bold mt-0.5">{feedback.breakdown?.fluencyCoherence || 6.0}</p>
                </div>
                <div className="bg-navy/40 p-3 rounded-lg border border-primary-light/15 text-center">
                  <p className="text-slate-500 text-[9px] uppercase font-bold">Grammar Accuracy</p>
                  <p className="text-slate-300 text-sm font-bold mt-0.5">{feedback.breakdown?.grammarAccuracy || 6.0}</p>
                </div>
                <div className="bg-navy/40 p-3 rounded-lg border border-primary-light/15 text-center">
                  <p className="text-slate-500 text-[9px] uppercase font-bold">Pronunciation</p>
                  <p className="text-slate-300 text-sm font-bold mt-0.5">{feedback.breakdown?.pronunciation || 6.0}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-white font-bold text-xs mb-1.5 font-bold uppercase tracking-wider text-slate-400">⭐ Key Strengths</h4>
                  <p className="text-slate-300 text-xs leading-relaxed">{feedback.wellDone}</p>
                </div>
                {feedback.mistakes?.length > 0 && (
                  <div>
                    <h4 className="text-white font-bold text-xs mb-1.5 font-bold uppercase tracking-wider text-red-400">⚠️ Mistakes & Pronunciation Corrections</h4>
                    <ul className="list-disc list-inside text-slate-300 text-xs space-y-1">
                      {feedback.mistakes.map((m: string, idx: number) => (
                        <li key={idx}>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div>
                  <h4 className="text-white font-bold text-xs mb-1.5 font-bold uppercase tracking-wider text-slate-400">High Band Model Answer</h4>
                  <pre className="text-slate-300 text-xs font-sans bg-navy/40 p-4 border border-primary-light/15 rounded-xl whitespace-pre-wrap leading-relaxed">
                    {feedback.improvedAnswer}
                  </pre>
                  <p className="text-[10px] text-slate-500 italic mt-2">Why this is better: {feedback.whyBetter}</p>
                </div>
                <div>
                  <h4 className="text-white font-bold text-xs mb-1.5 font-bold uppercase tracking-wider text-gold">📈 Practice Recommendation</h4>
                  <p className="text-slate-300 text-xs leading-relaxed">{feedback.practiceRecommendation}</p>
                </div>
              </div>
            </div>
          )}

          {/* Exam Mode Success Popup */}
          {examSuccess && (
            <div className="bg-emerald/10 border border-emerald/20 text-emerald p-6 rounded-2xl text-center space-y-4">
              <h3 className="text-base font-bold">🎉 Exam Submitted Successfully!</h3>
              <p className="text-xs leading-relaxed max-w-md mx-auto">
                Your speaking response has been locked and archived under **Exam Mode**. An evaluator will review it shortly.
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
