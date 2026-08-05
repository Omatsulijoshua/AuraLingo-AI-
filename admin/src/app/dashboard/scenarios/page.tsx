'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PRESET_SCENARIOS, Scenario } from '@/lib/language-ai';

export default function ScenarioSimulatorPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>(PRESET_SCENARIOS);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Custom Scenario Form State
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGeneratingCustom, setIsGeneratingCustom] = useState(false);

  const categories = ['ALL', 'BUSINESS', 'FOOD_DINING', 'HOUSING', 'TRAVEL', 'EMERGENCY'];
  const levels = ['ALL', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  const filteredScenarios = scenarios.filter((sc) => {
    const matchCategory = selectedCategory === 'ALL' || sc.category === selectedCategory;
    const matchLevel = selectedLevel === 'ALL' || sc.cefrLevel === selectedLevel;
    return matchCategory && matchLevel;
  });

  const handleGenerateCustomScenario = () => {
    if (!customPrompt.trim()) return;

    setIsGeneratingCustom(true);

    setTimeout(() => {
      const newScenario: Scenario = {
        id: `custom-${Date.now()}`,
        title: customPrompt,
        category: 'CUSTOM',
        cefrLevel: 'B1',
        description: `Custom AI Roleplay Environment generated for: "${customPrompt}".`,
        tutorPersona: {
          name: 'Elena AI Tutor',
          role: 'Personal Scenario Partner',
          avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
          greeting: `¡Hola! Entendido perfectamente. Vamos a practicar la situación: "${customPrompt}". ¿Listo para empezar?`
        },
        keyVocabulary: ['Vocabulario clave', 'Expresiones útiles', 'Modismos locales'],
        culturalNote: 'Custom scenario generated based on your custom prompt requirements.',
        isCustom: true
      };

      setScenarios((prev) => [newScenario, ...prev]);
      setIsGeneratingCustom(false);
      setShowCreateModal(false);
      setCustomPrompt('');
    }, 1200);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Real-World Scenario Simulator</h1>
          <p className="text-xs text-slate-400">
            Practice immersion in authentic situations with 24/7 AI personas tailored to your CEFR level.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-gold to-amber-500 hover:from-amber-500 hover:to-gold text-primary font-black px-5 py-3 rounded-2xl text-xs shadow-xl shadow-gold/20 flex items-center gap-2 transition-all cursor-pointer"
        >
          <span>✨ Generate Custom Scenario</span>
        </button>
      </div>

      {/* Filter Bar: Category & CEFR Level */}
      <div className="bg-primary/60 border border-primary-light/60 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-400 mr-2">Category:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-gold text-primary shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-400 mr-2">Level:</span>
          {levels.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedLevel(lvl)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedLevel === lvl
                  ? 'bg-gold text-primary shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Scenario Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredScenarios.map((sc) => (
          <div
            key={sc.id}
            className="bg-primary/60 border border-primary-light/60 hover:border-gold/60 p-6 rounded-3xl space-y-4 flex flex-col justify-between transition-all group shadow-xl"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black bg-gold/10 text-gold px-2.5 py-0.5 rounded-md border border-gold/20">
                  {sc.category}
                </span>
                <span className="text-xs font-black bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-700">
                  {sc.cefrLevel} Level
                </span>
              </div>

              <h3 className="font-extrabold text-base text-white group-hover:text-gold transition-colors">
                {sc.title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">{sc.description}</p>

              {/* Key Vocabulary Pills */}
              <div className="pt-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  Key Vocabulary Cheatsheet
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {sc.keyVocabulary.map((vocab, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] bg-slate-900 text-slate-300 px-2 py-0.5 rounded border border-slate-800"
                    >
                      {vocab}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={sc.tutorPersona.avatarUrl}
                  alt={sc.tutorPersona.name}
                  className="w-8 h-8 rounded-full object-cover border border-gold/40"
                />
                <div>
                  <p className="text-xs font-bold text-slate-200">{sc.tutorPersona.name}</p>
                  <p className="text-[10px] text-slate-400">{sc.tutorPersona.role}</p>
                </div>
              </div>

              <Link
                href={`/dashboard/coach?scenario=${sc.id}`}
                className="bg-gold hover:bg-gold-dark text-primary font-black px-4 py-2 rounded-xl text-xs transition-all shadow-md shadow-gold/20 hover:scale-105"
              >
                Launch Roleplay
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Custom Scenario Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-navy/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-primary border border-slate-700 max-w-lg w-full p-6 rounded-3xl space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-white">✨ Create Custom AI Scenario</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-300 block">
                Describe the situation or conversation topic:
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Example: Asking for medical advice at a pharmacy in Barcelona or negotiating rent with a picky landlord in Paris..."
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-xs text-white outline-none focus:border-gold h-28 resize-none placeholder:text-slate-500"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs text-slate-300 hover:text-white font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateCustomScenario}
                disabled={!customPrompt.trim() || isGeneratingCustom}
                className="px-6 py-2.5 rounded-xl bg-gold hover:bg-gold-dark text-primary font-black text-xs shadow-lg shadow-gold/20 disabled:opacity-40 transition-all cursor-pointer"
              >
                {isGeneratingCustom ? 'Synthesizing Scenario...' : 'Generate Scenario ✨'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
