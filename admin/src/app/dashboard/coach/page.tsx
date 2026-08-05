'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  LanguageAIService,
  PRESET_SCENARIOS,
  Scenario,
  ConversationTurn,
  CoachingFeedback
} from '@/lib/language-ai';

export default function VoiceCoachStudioPage() {
  const searchParams = useSearchParams();
  const scenarioId = searchParams.get('scenario') || 'job-interview-tech';

  const [activeScenario, setActiveScenario] = useState<Scenario>(
    PRESET_SCENARIOS.find((s) => s.id === scenarioId) || PRESET_SCENARIOS[0]
  );
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeFeedback, setActiveFeedback] = useState<CoachingFeedback | null>(null);

  // Initialize initial tutor greeting turn
  useEffect(() => {
    const sc = PRESET_SCENARIOS.find((s) => s.id === scenarioId) || PRESET_SCENARIOS[0];
    setActiveScenario(sc);
    setTurns([
      {
        id: 'turn-init',
        sender: 'AI_TUTOR',
        text: sc.tutorPersona.greeting,
        timestamp: 'Just now'
      }
    ]);
  }, [scenarioId]);

  const handleSendMessage = async (textToSend?: string) => {
    const message = textToSend || inputText;
    if (!message.trim() || isProcessing) return;

    const userTurn: ConversationTurn = {
      id: `turn-${Date.now()}`,
      sender: 'USER',
      text: message,
      timestamp: 'Just now'
    };

    setTurns((prev) => [...prev, userTurn]);
    setInputText('');
    setIsProcessing(true);

    try {
      const { responseText, feedback } = await LanguageAIService.simulateAITutorTurn(
        activeScenario,
        message
      );

      const aiTurn: ConversationTurn = {
        id: `turn-ai-${Date.now()}`,
        sender: 'AI_TUTOR',
        text: responseText,
        timestamp: 'Just now',
        feedback
      };

      setTurns((prev) => [...prev, aiTurn]);
      setActiveFeedback(feedback);
    } catch (err) {
      console.error('Error during AI turn simulation', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMicToggle = () => {
    if (isRecording) {
      setIsRecording(false);
      // Simulate recognized spoken speech
      handleSendMessage('Yo ir a la entrevista de trabajo ayer y tener mucho entusiasmo.');
    } else {
      setIsRecording(true);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      {/* Studio Header: Scenario Selector & AI Tutor Persona Info */}
      <div className="bg-primary/80 border border-primary-light/60 p-5 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0 shadow-xl">
        <div className="flex items-center gap-4">
          <img
            src={activeScenario.tutorPersona.avatarUrl}
            alt={activeScenario.tutorPersona.name}
            className="w-14 h-14 rounded-2xl object-cover border-2 border-gold shadow-lg shadow-gold/20"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white">{activeScenario.tutorPersona.name}</h2>
              <span className="text-[10px] font-black bg-gold/20 text-gold border border-gold/30 px-2 py-0.5 rounded-full uppercase">
                {activeScenario.cefrLevel} Tutor
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              {activeScenario.tutorPersona.role} · {activeScenario.title}
            </p>
          </div>
        </div>

        {/* Scenario Selector Dropdown */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="text-xs text-slate-400 font-bold hidden sm:block">Switch Scenario:</label>
          <select
            value={activeScenario.id}
            onChange={(e) => {
              const sc = PRESET_SCENARIOS.find((s) => s.id === e.target.value);
              if (sc) {
                setActiveScenario(sc);
                setTurns([
                  {
                    id: `turn-init-${Date.now()}`,
                    sender: 'AI_TUTOR',
                    text: sc.tutorPersona.greeting,
                    timestamp: 'Just now'
                  }
                ]);
                setActiveFeedback(null);
              }
            }}
            className="bg-slate-900 border border-slate-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl outline-none focus:border-gold transition-all w-full md:w-auto cursor-pointer"
          >
            {PRESET_SCENARIOS.map((sc) => (
              <option key={sc.id} value={sc.id}>
                {sc.title} ({sc.cefrLevel})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Studio Body: Left (Dialogue Feed) & Right (Micro-Coaching Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Left Column (2 Cols): Live Dialogue Feed */}
        <div className="lg:col-span-2 bg-primary/60 border border-primary-light/60 rounded-3xl flex flex-col min-h-0 shadow-2xl overflow-hidden">
          {/* Messages Feed Container */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {turns.map((t) => {
              const isAI = t.sender === 'AI_TUTOR';
              return (
                <div
                  key={t.id}
                  className={`flex items-start gap-3 max-w-[85%] ${
                    isAI ? 'mr-auto' : 'ml-auto flex-row-reverse'
                  }`}
                >
                  {isAI ? (
                    <img
                      src={activeScenario.tutorPersona.avatarUrl}
                      alt="AI"
                      className="w-8 h-8 rounded-full object-cover border border-gold/40 shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gold text-primary font-black flex items-center justify-center text-xs shrink-0 shadow-md">
                      YOU
                    </div>
                  )}

                  <div
                    className={`p-4 rounded-2xl space-y-2 text-xs leading-relaxed ${
                      isAI
                        ? 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                        : 'bg-gradient-to-r from-gold to-amber-500 text-primary font-semibold rounded-tr-none shadow-md shadow-gold/10'
                    }`}
                  >
                    <p className="text-sm font-medium">{t.text}</p>
                    <span
                      className={`text-[9px] block text-right font-bold ${
                        isAI ? 'text-slate-500' : 'text-primary/70'
                      }`}
                    >
                      {t.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {isProcessing && (
              <div className="flex items-center gap-3 text-xs text-gold font-bold animate-pulse">
                <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                <span>AI Tutor analyzing grammar, phonetics & cultural nuances...</span>
              </div>
            )}
          </div>

          {/* Controls Bar: Voice Mic & Text Input */}
          <div className="p-4 bg-slate-900/90 border-t border-slate-800 space-y-3">
            {/* Quick Test Helper Button */}
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-semibold">Need inspiration? Try typing or speaking:</span>
              <button
                onClick={() =>
                  handleSendMessage('Yo ir a la entrevista de trabajo ayer y tener mucho entusiasmo.')
                }
                className="text-gold font-bold underline hover:text-white transition-colors"
              >
                + Test Grammar Mistake Trigger
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* Mic Toggle Button */}
              <button
                onClick={handleMicToggle}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                  isRecording
                    ? 'bg-red-500 text-white animate-bounce shadow-lg shadow-red-500/40'
                    : 'bg-gold hover:bg-gold-dark text-primary shadow-lg shadow-gold/20'
                }`}
                title={isRecording ? 'Click to Stop & Send Voice' : 'Hold to Speak in Target Language'}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              </button>

              {/* Text Input Field */}
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={`Speak or type response in ${activeScenario.title}...`}
                className="flex-1 bg-primary/80 border border-slate-700 focus:border-gold rounded-2xl px-4 py-3 text-xs text-white outline-none transition-all placeholder:text-slate-500"
              />

              <button
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isProcessing}
                className="px-5 py-3 rounded-2xl bg-gold hover:bg-gold-dark disabled:opacity-40 text-primary font-black text-xs transition-all cursor-pointer"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Live Micro-Coaching Inspector */}
        <div className="bg-primary/60 border border-primary-light/60 rounded-3xl p-6 flex flex-col space-y-6 overflow-y-auto shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-extrabold text-sm text-white">Instant Micro-Coaching</h3>
              <p className="text-[11px] text-slate-400">Live AI phonetic & syntax feedback</p>
            </div>
            <span className="text-xs font-black bg-emerald/10 text-emerald px-2.5 py-0.5 rounded-full border border-emerald/30">
              Active
            </span>
          </div>

          {activeFeedback ? (
            <div className="space-y-6 text-xs">
              {/* Pronunciation Score */}
              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    Phonetic Accuracy
                  </span>
                  <span className="text-sm font-black text-emerald">
                    {activeFeedback.pronunciationScore}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald h-full rounded-full"
                    style={{ width: `${activeFeedback.pronunciationScore}%` }}
                  />
                </div>
                {activeFeedback.mispronouncedWords.map((mw, idx) => (
                  <div key={idx} className="text-[11px] text-slate-300 pt-1">
                    <span className="text-red-400 font-bold">{mw.word}:</span> expected{' '}
                    <code className="text-emerald">{mw.expectedPhonetic}</code>
                  </div>
                ))}
              </div>

              {/* Grammar Corrections */}
              {activeFeedback.grammarCorrections.length > 0 && (
                <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-2">
                  <span className="text-amber-400 font-bold uppercase tracking-wider text-[10px] block">
                    Grammar Breakdown
                  </span>
                  {activeFeedback.grammarCorrections.map((gc, idx) => (
                    <div key={idx} className="space-y-1">
                      <p className="text-red-400 line-through text-[11px]">{gc.original}</p>
                      <p className="text-emerald font-bold text-xs">✓ {gc.corrected}</p>
                      <p className="text-slate-400 text-[10px] leading-relaxed pt-1">{gc.explanation}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Vocabulary Upgrades */}
              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-2">
                <span className="text-gold font-bold uppercase tracking-wider text-[10px] block">
                  Native Synonym Upgrades
                </span>
                {activeFeedback.vocabularyUpgrades.map((vu, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <p className="text-slate-300 font-bold">
                      "{vu.word}" → <span className="text-gold">{vu.upgrade}</span>
                    </p>
                    <p className="text-slate-500 text-[10px]">{vu.context}</p>
                  </div>
                ))}
              </div>

              {/* Cultural Context Tip */}
              {activeFeedback.culturalTip && (
                <div className="bg-gradient-to-br from-indigo-950 to-primary border border-indigo-500/30 p-4 rounded-2xl space-y-1">
                  <span className="text-indigo-400 font-black uppercase tracking-wider text-[10px] block">
                    💡 Cultural Pragmatics
                  </span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">{activeFeedback.culturalTip}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="my-auto text-center space-y-3 p-6 text-slate-500">
              <span className="text-4xl block opacity-40">🎧</span>
              <p className="text-xs font-semibold">Speak or send a message to trigger instant live coaching analysis.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
