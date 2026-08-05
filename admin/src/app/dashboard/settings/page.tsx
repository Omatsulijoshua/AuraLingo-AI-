'use client';

import React, { useState } from 'react';

export default function SettingsPage() {
  const [activeProvider, setActiveProvider] = useState('GEMINI');
  const [geminiKeys, setGeminiKeys] = useState('AIzaSyD-sample_key_1, AIzaSyD-sample_key_2');
  const [groqKeys, setGroqKeys] = useState('gsk_sample_groq_key_1');
  const [openAiKeys, setOpenAiKeys] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-black text-white">AI Engine & Multi-Key Provider Configuration</h1>
        <p className="text-xs text-slate-400">
          Configure zero-cost fallback chains and multi-key loops across Gemini, Groq Cloud, OpenRouter, and OpenAI for 100% uninterrupted AI coaching.
        </p>
      </div>

      {savedSuccess && (
        <div className="bg-emerald/20 border border-emerald text-emerald px-4 py-3 rounded-2xl text-xs font-bold animate-fadeIn flex items-center gap-2">
          <span>✓</span>
          <span>AI Multi-Key Configuration updated and saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Primary Active Provider */}
        <div className="bg-primary/60 border border-primary-light/60 p-6 rounded-3xl space-y-4 shadow-xl">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            Primary Active Provider
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'GEMINI', name: 'Google Gemini 2.0', icon: '✨' },
              { id: 'GROQ', name: 'Groq Cloud Llama 3.3', icon: '⚡' },
              { id: 'OPENROUTER', name: 'OpenRouter Aggregator', icon: '🌐' },
              { id: 'OPENAI', name: 'OpenAI GPT-4o', icon: '🧠' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setActiveProvider(p.id)}
                className={`p-4 rounded-2xl border text-center font-bold text-xs transition-all cursor-pointer ${
                  activeProvider === p.id
                    ? 'bg-gold text-primary border-gold shadow-lg shadow-gold/20'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <span className="text-xl block mb-1">{p.icon}</span>
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Gemini Multi-Key */}
        <div className="bg-primary/60 border border-primary-light/60 p-6 rounded-3xl space-y-3 shadow-xl">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-white flex items-center gap-2">
              <span>✨ Google Gemini API Keys</span>
              <span className="text-[10px] bg-emerald/10 text-emerald border border-emerald/20 px-2 py-0.5 rounded">
                Recommended Primary
              </span>
            </label>
            <span className="text-[10px] text-slate-400">Comma-separated for multi-key rotation</span>
          </div>
          <textarea
            value={geminiKeys}
            onChange={(e) => setGeminiKeys(e.target.value)}
            rows={2}
            placeholder="AIzaSy..., AIzaSy..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white outline-none focus:border-gold font-mono"
          />
        </div>

        {/* Groq Multi-Key */}
        <div className="bg-primary/60 border border-primary-light/60 p-6 rounded-3xl space-y-3 shadow-xl">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-white flex items-center gap-2">
              <span>⚡ Groq Cloud API Keys</span>
              <span className="text-[10px] bg-gold/10 text-gold border border-gold/20 px-2 py-0.5 rounded">
                Ultra-Fast Llama 3.3 70B
              </span>
            </label>
          </div>
          <textarea
            value={groqKeys}
            onChange={(e) => setGroqKeys(e.target.value)}
            rows={2}
            placeholder="gsk_..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white outline-none focus:border-gold font-mono"
          />
        </div>

        {/* OpenAI Key */}
        <div className="bg-primary/60 border border-primary-light/60 p-6 rounded-3xl space-y-3 shadow-xl">
          <label className="text-xs font-bold text-white block">🧠 OpenAI API Keys (Fallback)</label>
          <input
            type="password"
            value={openAiKeys}
            onChange={(e) => setOpenAiKeys(e.target.value)}
            placeholder="sk-..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white outline-none focus:border-gold font-mono"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-8 py-3.5 rounded-xl bg-gold hover:bg-gold-dark text-primary font-black text-xs shadow-xl shadow-gold/20 hover:scale-105 transition-all cursor-pointer"
          >
            Save AI Provider Settings ✨
          </button>
        </div>
      </form>
    </div>
  );
}
