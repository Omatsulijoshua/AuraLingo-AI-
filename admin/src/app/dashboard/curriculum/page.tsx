'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { LanguageAIService, CurriculumUnit } from '@/lib/language-ai';

export default function CurriculumExplorerPage() {
  const [curriculum, setCurriculum] = useState<CurriculumUnit[]>([]);

  useEffect(() => {
    setCurriculum(LanguageAIService.getCurriculum());
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Personalized Adaptive Curriculum Roadmap</h1>
          <p className="text-xs text-slate-400">
            Automatically designed AI roadmap tailored to your native language, target language level, and learning goals.
          </p>
        </div>

        <Link
          href="/onboarding"
          className="bg-primary/80 hover:bg-primary-light border border-slate-700 text-slate-200 font-bold px-4 py-2.5 rounded-xl text-xs transition-all flex items-center gap-2"
        >
          <span>⚙️ Re-target Learning Goals</span>
        </Link>
      </div>

      {/* Curriculum Milestone Nodes */}
      <div className="space-y-6">
        {curriculum.map((unit, index) => {
          const isCompleted = unit.status === 'COMPLETED';
          const isInProgress = unit.status === 'IN_PROGRESS';
          const isLocked = unit.status === 'LOCKED';

          return (
            <div
              key={unit.id}
              className={`p-6 rounded-3xl border transition-all shadow-xl relative overflow-hidden ${
                isInProgress
                  ? 'bg-primary/80 border-gold/60 shadow-gold/5'
                  : isCompleted
                  ? 'bg-primary/40 border-emerald/40'
                  : 'bg-primary/30 border-slate-800 opacity-60'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-3 max-w-3xl">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${
                        isCompleted
                          ? 'bg-emerald text-white'
                          : isInProgress
                          ? 'bg-gold text-primary shadow-md shadow-gold/20'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className="text-xs font-black text-gold uppercase tracking-wider">
                      {unit.cefrLevel} Level · {unit.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h2 className="text-xl font-black text-white">{unit.title}</h2>
                  <p className="text-xs text-slate-300 leading-relaxed">{unit.description}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Grammar Focus</span>
                      <p className="text-xs font-bold text-white mt-0.5">{unit.grammarFocus}</p>
                    </div>

                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Key Scenario Checkpoint</span>
                      <p className="text-xs font-bold text-gold mt-0.5">{unit.keyScenarios[0]}</p>
                    </div>
                  </div>
                </div>

                <div className="lg:w-64 space-y-4 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-800 pt-4 lg:pt-0 lg:pl-6">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-400">Completion</span>
                      <span className="text-gold">{unit.progressPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
                      <div
                        className="bg-gold h-full rounded-full"
                        style={{ width: `${unit.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {!isLocked ? (
                    <Link
                      href="/dashboard/coach"
                      className="w-full py-3 rounded-xl bg-gold hover:bg-gold-dark text-primary font-black text-xs text-center block shadow-md shadow-gold/20 transition-all"
                    >
                      {isInProgress ? 'Continue Milestone →' : 'Review Unit'}
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="w-full py-3 rounded-xl bg-slate-800 text-slate-500 font-bold text-xs cursor-not-allowed text-center block border border-slate-700"
                    >
                      🔒 Locked (Complete Unit {index})
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
