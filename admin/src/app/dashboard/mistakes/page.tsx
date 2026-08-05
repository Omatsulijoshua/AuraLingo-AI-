'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { LanguageAIService, MistakeRecord } from '@/lib/language-ai';

export default function MistakeBankPage() {
  const [mistakes, setMistakes] = useState<MistakeRecord[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  useEffect(() => {
    setMistakes(LanguageAIService.getMistakes());
  }, []);

  const categories = ['ALL', 'GRAMMAR', 'VOCABULARY', 'PRONUNCIATION', 'SYNTAX', 'CULTURAL_PRAGMATICS'];

  const filteredMistakes = mistakes.filter((m) =>
    selectedCategory === 'ALL' ? true : m.category === selectedCategory
  );

  const avgMastery = Math.round(
    mistakes.reduce((acc, m) => acc + m.masteryLevel, 0) / (mistakes.length || 1)
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Header & Stats Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black text-white">Persistent Error Memory & Mistake Bank</h1>
          <p className="text-xs text-slate-400">
            Every mistake made during voice roleplay sessions is vectorized, tracked, and recycled into custom dynamic drills.
          </p>
        </div>

        <Link
          href="/dashboard/exercises"
          className="bg-gradient-to-r from-gold to-amber-500 hover:from-amber-500 hover:to-gold text-primary font-black px-6 py-3 rounded-2xl text-xs shadow-xl shadow-gold/20 flex items-center gap-2 transition-all hover:scale-105"
        >
          <span>⚡ Generate Targeted Drill Session</span>
        </Link>
      </div>

      {/* Summary Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-primary/60 border border-primary-light/60 p-5 rounded-2xl space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total Logged Mistakes</span>
          <p className="text-3xl font-black text-white">{mistakes.length} Errors</p>
          <p className="text-[11px] text-slate-400">Recorded across all live sessions</p>
        </div>

        <div className="bg-primary/60 border border-primary-light/60 p-5 rounded-2xl space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Average Mistake Mastery</span>
          <p className="text-3xl font-black text-gold">{avgMastery}%</p>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
            <div className="bg-gold h-full rounded-full" style={{ width: `${avgMastery}%` }} />
          </div>
        </div>

        <div className="bg-primary/60 border border-primary-light/60 p-5 rounded-2xl space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">High Recurrence Risk</span>
          <p className="text-3xl font-black text-red-400">
            {mistakes.filter((m) => m.recurrenceCount >= 3).length} Items
          </p>
          <p className="text-[11px] text-slate-400">Repeated 3+ times in conversation</p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedCategory === cat
                ? 'bg-gold text-primary shadow-md'
                : 'bg-primary/60 border border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Mistakes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredMistakes.map((m) => (
          <div
            key={m.id}
            className="bg-primary/60 border border-primary-light/60 hover:border-gold/60 p-6 rounded-3xl space-y-4 shadow-xl transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-md uppercase">
                {m.category}
              </span>
              <span className="text-xs text-slate-400 font-semibold">
                Made {m.recurrenceCount}x · {m.lastMade}
              </span>
            </div>

            {/* Original vs Corrected Phrase */}
            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-red-400 uppercase tracking-widest block">Original Spoken Phrase</span>
                <p className="text-xs font-medium text-red-300 line-through leading-relaxed">
                  "{m.originalPhrase}"
                </p>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-800">
                <span className="text-[9px] font-bold text-emerald uppercase tracking-widest block">AI Recommended Phrasing</span>
                <p className="text-xs font-bold text-emerald leading-relaxed">
                  ✓ "{m.correctedPhrase}"
                </p>
              </div>
            </div>

            {/* Rule Explanation */}
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Rule Explanation</span>
              <p className="text-xs text-slate-300 leading-relaxed">{m.explanation}</p>
            </div>

            {/* Mastery Progress Bar & Action */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-4">
              <div className="flex-1 space-y-1">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-slate-400">Mastery Progress</span>
                  <span className="text-gold">{m.masteryLevel}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gold h-full rounded-full"
                    style={{ width: `${m.masteryLevel}%` }}
                  />
                </div>
              </div>

              <Link
                href="/dashboard/exercises"
                className="bg-gold/20 hover:bg-gold text-gold hover:text-primary font-black px-3.5 py-2 rounded-xl text-xs transition-all border border-gold/30 shrink-0"
              >
                Practice Drill
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
