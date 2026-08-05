'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LanguageAIService,
  LanguageProfile,
  CurriculumUnit,
  MistakeRecord,
  PRESET_SCENARIOS,
} from '@/lib/language-ai';

export default function DashboardOverviewPage() {
  const [profile, setProfile] = useState<LanguageProfile | null>(null);
  const [curriculum, setCurriculum] = useState<CurriculumUnit[]>([]);
  const [mistakes, setMistakes] = useState<MistakeRecord[]>([]);

  useEffect(() => {
    setProfile(LanguageAIService.getProfile());
    setCurriculum(LanguageAIService.getCurriculum());
    setMistakes(LanguageAIService.getMistakes());
  }, []);

  const activeUnit = curriculum.find((u) => u.status === 'IN_PROGRESS') || curriculum[0];
  const activeMistakesCount = mistakes.filter((m) => m.masteryLevel < 80).length;

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto text-purple-50">
      {/* Top Banner: AuraLingo AI Personal Tutor Greeting */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-light via-primary to-navy border border-amethyst/40 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amethyst/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-black bg-coral text-white px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                24/7 AuraLingo AI Tutor Ready
              </span>
              <span className="text-xs font-bold text-purple-200 bg-primary-light/80 px-3 py-1 rounded-full border border-purple-800/60">
                🇪🇸 {profile?.targetLanguage || 'Spanish'} ({profile?.cefrLevel || 'B1'} Level)
              </span>
              <span className="text-xs font-bold text-emerald bg-emerald/10 border border-emerald/30 px-3 py-1 rounded-full">
                Native: {profile?.nativeLanguage || 'English'}
              </span>
            </div>

            <h1 className="text-3xl lg:text-4xl font-black text-white leading-tight">
              ¡Hola, Alex! Ready for your daily conversational practice?
            </h1>
            <p className="text-purple-200/80 text-sm leading-relaxed">
              Your AI coach has designed a dynamic scenario session based on your career goals and recent past-tense grammar patterns.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/dashboard/coach"
              className="bg-gradient-to-r from-amethyst to-coral hover:from-coral hover:to-amethyst text-white font-black px-6 py-4 rounded-2xl shadow-xl shadow-amethyst/30 flex items-center gap-3 text-sm transition-all hover:scale-105"
            >
              <span className="text-xl">🎙️</span>
              <span>Launch Live AI Voice Studio</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Analytics & Mastery Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-primary/80 border border-primary-light/60 p-6 rounded-2xl space-y-2 relative overflow-hidden group hover:border-amethyst/60 transition-all shadow-xl">
          <div className="flex justify-between items-center text-purple-300/70">
            <span className="text-xs font-bold uppercase tracking-wider">Pronunciation Score</span>
            <span className="text-xl">🗣️</span>
          </div>
          <p className="text-3xl font-black text-white">88%</p>
          <div className="flex items-center justify-between text-xs">
            <span className="text-emerald font-bold">+4% this week</span>
            <span className="text-purple-300/60">Target: 95%</span>
          </div>
          <div className="w-full bg-navy h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald h-full rounded-full" style={{ width: '88%' }} />
          </div>
        </div>

        <div className="bg-primary/80 border border-primary-light/60 p-6 rounded-2xl space-y-2 relative overflow-hidden group hover:border-amethyst/60 transition-all shadow-xl">
          <div className="flex justify-between items-center text-purple-300/70">
            <span className="text-xs font-bold uppercase tracking-wider">Grammar Mastery</span>
            <span className="text-xl">📚</span>
          </div>
          <p className="text-3xl font-black text-white">76%</p>
          <div className="flex items-center justify-between text-xs">
            <span className="text-coral font-bold">Past Tenses Focus</span>
            <span className="text-purple-300/60">Unit 1 Active</span>
          </div>
          <div className="w-full bg-navy h-1.5 rounded-full overflow-hidden">
            <div className="bg-coral h-full rounded-full" style={{ width: '76%' }} />
          </div>
        </div>

        <div className="bg-primary/80 border border-primary-light/60 p-6 rounded-2xl space-y-2 relative overflow-hidden group hover:border-amethyst/60 transition-all shadow-xl">
          <div className="flex justify-between items-center text-purple-300/70">
            <span className="text-xs font-bold uppercase tracking-wider">Active Mistake Log</span>
            <span className="text-xl">🧠</span>
          </div>
          <p className="text-3xl font-black text-amethyst-light">{activeMistakesCount} Errors</p>
          <div className="flex items-center justify-between text-xs">
            <span className="text-amethyst-light font-bold">Need Practice</span>
            <Link href="/dashboard/exercises" className="text-coral underline font-bold hover:text-white">Drill Now →</Link>
          </div>
          <div className="w-full bg-navy h-1.5 rounded-full overflow-hidden">
            <div className="bg-amethyst h-full rounded-full" style={{ width: '60%' }} />
          </div>
        </div>

        <div className="bg-primary/80 border border-primary-light/60 p-6 rounded-2xl space-y-2 relative overflow-hidden group hover:border-amethyst/60 transition-all shadow-xl">
          <div className="flex justify-between items-center text-purple-300/70">
            <span className="text-xs font-bold uppercase tracking-wider">Study Streak</span>
            <span className="text-xl">🔥</span>
          </div>
          <p className="text-3xl font-black text-white">{profile?.studyStreak || 7} Days</p>
          <div className="flex items-center justify-between text-xs">
            <span className="text-emerald font-bold">Daily Goal: 20m</span>
            <span className="text-purple-300/60">Streak Shield Active</span>
          </div>
          <div className="w-full bg-navy h-1.5 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-amethyst to-coral h-full rounded-full" style={{ width: '100%' }} />
          </div>
        </div>
      </div>

      {/* Main Content Grid: Curriculum & Scenarios */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {activeUnit && (
            <div className="bg-primary/80 border border-primary-light/60 rounded-3xl p-6 space-y-6 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-amethyst/20 text-amethyst-light flex items-center justify-center font-black text-lg">
                    🗺️
                  </span>
                  <div>
                    <span className="text-xs font-black text-coral uppercase tracking-wider block">Active Curriculum Milestone</span>
                    <h2 className="text-xl font-black text-white">{activeUnit.title}</h2>
                  </div>
                </div>
                <span className="text-xs font-black bg-amethyst/20 text-amethyst-light border border-amethyst/30 px-3 py-1 rounded-full">
                  {activeUnit.cefrLevel} Level
                </span>
              </div>

              <p className="text-purple-200/80 text-sm leading-relaxed">{activeUnit.description}</p>

              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-purple-300/70">Milestone Progress</span>
                  <span className="text-coral">{activeUnit.progressPercent}% Completed</span>
                </div>
                <div className="w-full bg-navy h-2.5 rounded-full overflow-hidden border border-purple-900/60">
                  <div
                    className="bg-gradient-to-r from-amethyst to-coral h-full rounded-full"
                    style={{ width: `${activeUnit.progressPercent}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-navy/80 p-4 rounded-2xl border border-purple-900/60">
                <div>
                  <span className="text-[10px] font-black text-purple-400/80 uppercase tracking-widest block">Grammar Focus</span>
                  <p className="text-xs font-bold text-white mt-1">{activeUnit.grammarFocus}</p>
                </div>
                <div>
                  <span className="text-[10px] font-black text-purple-400/80 uppercase tracking-widest block">Recommended Practice</span>
                  <p className="text-xs font-bold text-coral mt-1">{activeUnit.keyScenarios[0]}</p>
                </div>
              </div>

              <div className="flex justify-end">
                <Link
                  href="/dashboard/curriculum"
                  className="text-xs font-black text-amethyst-light hover:text-white flex items-center gap-1 transition-all"
                >
                  View Complete Curriculum Roadmap →
                </Link>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-white">Featured Conversational Scenarios</h2>
                <p className="text-xs text-purple-300/70">Simulate real-life encounters with live AI voice & micro-coaching.</p>
              </div>
              <Link href="/dashboard/scenarios" className="text-xs font-bold text-coral hover:underline">
                Explore All Scenarios →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PRESET_SCENARIOS.slice(0, 2).map((sc) => (
                <div
                  key={sc.id}
                  className="bg-primary/80 border border-primary-light/60 hover:border-amethyst/60 p-5 rounded-2xl space-y-4 flex flex-col justify-between transition-all group shadow-xl"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black bg-coral/10 text-coral px-2.5 py-0.5 rounded-md border border-coral/20">
                        {sc.category} · {sc.cefrLevel}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-base text-white group-hover:text-amethyst-light transition-colors">
                      {sc.title}
                    </h3>
                    <p className="text-xs text-purple-200/70 line-clamp-2 leading-relaxed">{sc.description}</p>
                  </div>

                  <div className="pt-2 border-t border-purple-900/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={sc.tutorPersona.avatarUrl}
                        alt={sc.tutorPersona.name}
                        className="w-7 h-7 rounded-full object-cover border border-amethyst/50"
                      />
                      <span className="text-xs font-bold text-purple-200">{sc.tutorPersona.name}</span>
                    </div>
                    <Link
                      href={`/dashboard/coach?scenario=${sc.id}`}
                      className="bg-gradient-to-r from-amethyst to-purple-600 hover:from-purple-600 hover:to-amethyst text-white font-black px-3.5 py-1.5 rounded-lg text-xs transition-all shadow-md shadow-amethyst/20"
                    >
                      Start Session
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Mistake Bank Spotlight */}
        <div className="space-y-6">
          <div className="bg-primary/80 border border-primary-light/60 rounded-3xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🧠</span>
                <h3 className="font-extrabold text-base text-white">Persistent Error Memory</h3>
              </div>
              <span className="text-[10px] font-black bg-coral/10 text-coral border border-coral/30 px-2 py-0.5 rounded-full">
                {mistakes.length} Active
              </span>
            </div>

            <p className="text-xs text-purple-300/70 leading-relaxed">
              Your AI coach records every mistake made during voice sessions and prioritizes them in real-time drills.
            </p>

            <div className="space-y-3">
              {mistakes.slice(0, 3).map((m) => (
                <div key={m.id} className="bg-navy/90 p-3.5 rounded-xl border border-purple-900/60 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-black text-coral uppercase tracking-wider">{m.category}</span>
                    <span className="text-purple-400">{m.recurrenceCount}x recorded</span>
                  </div>
                  <p className="text-xs font-medium text-red-300 line-through truncate">{m.originalPhrase}</p>
                  <p className="text-xs font-bold text-emerald truncate">✓ {m.correctedPhrase}</p>
                </div>
              ))}
            </div>

            <Link
              href="/dashboard/exercises"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amethyst to-coral text-white font-black text-xs text-center block shadow-lg shadow-amethyst/30 hover:scale-102 transition-all"
            >
              Generate Real-Time Custom Drills ✨
            </Link>
          </div>

          <div className="bg-gradient-to-br from-purple-950 to-primary border border-amethyst/30 rounded-3xl p-6 space-y-3 shadow-xl">
            <div className="flex items-center gap-2 text-amethyst-light text-xs font-black uppercase tracking-wider">
              <span>💡</span>
              <span>Cultural Context Tip of the Day</span>
            </div>
            <p className="text-xs text-purple-200/90 leading-relaxed italic">
              "In Spain, asking for 'La cuenta, por favor' when you are done eating is polite and customary; waiters rarely bring the check unsolicited to avoid rushing guests."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
