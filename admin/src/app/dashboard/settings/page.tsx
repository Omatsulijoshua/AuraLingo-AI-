'use client';

import React, { useEffect, useState } from 'react';
import { LanguageAIService, LanguageProfile, REGIONAL_ACCENT_OPTIONS } from '@/lib/language-ai';

export default function AuraLingoSettingsPage() {
  const [profile, setProfile] = useState<LanguageProfile | null>(null);
  const [voiceEngine, setVoiceEngine] = useState<'WEB_SPEECH' | 'GEMINI_AUDIO' | 'ELEVENLABS_PRO'>('WEB_SPEECH');
  const [regionalAccent, setRegionalAccent] = useState('ES_MADRID');
  const [elevenLabsApiKey, setElevenLabsApiKey] = useState('');
  const [elevenLabsVoiceId, setElevenLabsVoiceId] = useState('pNInz6obpgDQGcFmaJgB');
  
  const [activeProvider, setActiveProvider] = useState('GEMINI');
  const [geminiKeys, setGeminiKeys] = useState('AIzaSyD-sample_key_1, AIzaSyD-sample_key_2');
  const [groqKeys, setGroqKeys] = useState('gsk_sample_groq_key_1');
  const [openAiKeys, setOpenAiKeys] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const prof = LanguageAIService.getProfile();
    setProfile(prof);
    setVoiceEngine(prof.voiceEngine || 'WEB_SPEECH');
    setRegionalAccent(prof.regionalAccent || 'ES_MADRID');
    setElevenLabsApiKey(prof.elevenLabsApiKey || '');
    setElevenLabsVoiceId(prof.elevenLabsVoiceId || 'pNInz6obpgDQGcFmaJgB');
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (profile) {
      const updated: LanguageProfile = {
        ...profile,
        voiceEngine,
        regionalAccent,
        elevenLabsApiKey,
        elevenLabsVoiceId,
      };
      LanguageAIService.saveProfile(updated);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn text-purple-50">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-black bg-coral/10 text-coral border border-coral/30 px-3 py-1 rounded-full uppercase tracking-wider">
            AuraLingo AI Engine & Phase 2 Settings
          </span>
        </div>
        <h1 className="text-3xl font-black text-white">AI Engine & Voice Provider Settings</h1>
        <p className="text-xs text-purple-300/70 mt-1">
          Configure zero-cost voice engines, Phase 2 ElevenLabs hyper-realistic voice cloning, regional accents, and multi-key LLM fallback providers.
        </p>
      </div>

      {savedSuccess && (
        <div className="bg-emerald/20 border border-emerald text-emerald px-5 py-4 rounded-2xl text-xs font-bold animate-fadeIn flex items-center gap-2 shadow-lg">
          <span>✓</span>
          <span>AuraLingo AI Phase 2 Settings saved and applied successfully!</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* PHASE 2: Voice Speech Engine Selection */}
        <div className="bg-primary/80 border border-primary-light/60 p-6 rounded-3xl space-y-5 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-white">🎙️ Voice Speech Engine (Phase 2 Integration)</h2>
              <p className="text-xs text-purple-300/70">Select the voice synthesis mode for your 24/7 AI tutor.</p>
            </div>
            <span className="text-xs font-black bg-amethyst/20 text-amethyst-light border border-amethyst/30 px-3 py-1 rounded-full">
              Phase 2 Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { id: 'WEB_SPEECH', name: 'Web Speech API', cost: 'Free ($0/mo)', badge: 'Native Browser', desc: 'Instant zero-cost voice synthesis on all devices.' },
              { id: 'GEMINI_AUDIO', name: 'Gemini 2.0 Audio', cost: 'Free / Low Cost', badge: 'DeepMind AI', desc: 'Native AI voice turn streaming.' },
              { id: 'ELEVENLABS_PRO', name: 'ElevenLabs Pro', cost: 'Phase 2 Pro', badge: 'Ultra-Realistic', desc: 'Hyper-realistic voice clones with regional accents.' },
            ].map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVoiceEngine(v.id as any)}
                className={`p-5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  voiceEngine === v.id
                    ? 'bg-gradient-to-b from-amethyst/30 to-primary-light border-amethyst text-white shadow-xl shadow-amethyst/20 scale-102 font-bold'
                    : 'bg-navy/80 border-purple-900/60 text-purple-200 hover:text-white'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-sm text-white">{v.name}</span>
                    <span className="text-[9px] font-bold text-coral bg-coral/10 px-2 py-0.5 rounded border border-coral/20">{v.badge}</span>
                  </div>
                  <p className="text-xs text-purple-300/70 mt-1">{v.desc}</p>
                </div>
                <span className="text-xs font-bold text-emerald mt-3 block">{v.cost}</span>
              </button>
            ))}
          </div>

          {/* Regional Accent Picker */}
          <div className="space-y-2 pt-3 border-t border-purple-900/60">
            <label className="text-xs font-black text-purple-200 uppercase tracking-wider block">Regional Accent & Pronunciation Target</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {REGIONAL_ACCENT_OPTIONS.map((acc) => (
                <button
                  key={acc.code}
                  type="button"
                  onClick={() => setRegionalAccent(acc.code)}
                  className={`p-3 rounded-xl border text-xs text-left transition-all ${
                    regionalAccent === acc.code
                      ? 'bg-gradient-to-r from-amethyst to-purple-600 text-white border-amethyst font-black shadow-md'
                      : 'bg-navy/80 border-purple-900/60 text-purple-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{acc.flag}</span>
                    <span className="truncate">{acc.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ElevenLabs API Key Configuration */}
          {voiceEngine === 'ELEVENLABS_PRO' && (
            <div className="space-y-4 pt-4 border-t border-purple-900/60 animate-fadeIn">
              <div>
                <label className="block text-xs font-bold text-purple-200 mb-1">ElevenLabs API Key</label>
                <input
                  type="password"
                  value={elevenLabsApiKey}
                  onChange={(e) => setElevenLabsApiKey(e.target.value)}
                  placeholder="xi-..."
                  className="w-full bg-navy/80 border border-purple-900/60 focus:border-amethyst rounded-xl px-4 py-2.5 text-white font-mono text-xs outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-purple-200 mb-1">ElevenLabs Custom Voice ID</label>
                <input
                  type="text"
                  value={elevenLabsVoiceId}
                  onChange={(e) => setElevenLabsVoiceId(e.target.value)}
                  placeholder="pNInz6obpgDQGcFmaJgB"
                  className="w-full bg-navy/80 border border-purple-900/60 focus:border-amethyst rounded-xl px-4 py-2.5 text-white font-mono text-xs outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Primary LLM Active Provider */}
        <div className="bg-primary/80 border border-primary-light/60 p-6 rounded-3xl space-y-4 shadow-2xl backdrop-blur-md">
          <label className="text-xs font-black text-purple-200 uppercase tracking-wider block">
            Multi-Key LLM Provider Router
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'GEMINI', name: 'Google Gemini 2.0', icon: '✨' },
              { id: 'GROQ', name: 'Groq Llama 3.3', icon: '⚡' },
              { id: 'OPENROUTER', name: 'OpenRouter Aggregator', icon: '🌐' },
              { id: 'OPENAI', name: 'OpenAI GPT-4o', icon: '🧠' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setActiveProvider(p.id)}
                className={`p-4 rounded-2xl border text-center font-bold text-xs transition-all cursor-pointer ${
                  activeProvider === p.id
                    ? 'bg-gradient-to-r from-amethyst to-coral text-white border-amethyst shadow-lg shadow-amethyst/30 font-black'
                    : 'bg-navy/80 border-purple-900/60 text-purple-300 hover:text-white'
                }`}
              >
                <span className="text-2xl block mb-1">{p.icon}</span>
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Gemini Multi-Key */}
        <div className="bg-primary/80 border border-primary-light/60 p-6 rounded-3xl space-y-3 shadow-2xl backdrop-blur-md">
          <div className="flex justify-between items-center">
            <label className="text-xs font-black text-white flex items-center gap-2">
              <span>✨ Google Gemini API Keys</span>
              <span className="text-[10px] bg-emerald/10 text-emerald border border-emerald/20 px-2 py-0.5 rounded font-bold">
                Recommended Primary ($0)
              </span>
            </label>
            <span className="text-[10px] text-purple-300/60">Comma-separated for key rotation</span>
          </div>
          <textarea
            value={geminiKeys}
            onChange={(e) => setGeminiKeys(e.target.value)}
            rows={2}
            placeholder="AIzaSy..., AIzaSy..."
            className="w-full bg-navy/80 border border-purple-900/60 rounded-xl p-3 text-xs text-white outline-none focus:border-amethyst font-mono"
          />
        </div>

        {/* Groq Multi-Key */}
        <div className="bg-primary/80 border border-primary-light/60 p-6 rounded-3xl space-y-3 shadow-2xl backdrop-blur-md">
          <div className="flex justify-between items-center">
            <label className="text-xs font-black text-white flex items-center gap-2">
              <span>⚡ Groq Cloud API Keys</span>
              <span className="text-[10px] bg-coral/10 text-coral border border-coral/20 px-2 py-0.5 rounded font-bold">
                Ultra-Fast Llama 3.3 70B
              </span>
            </label>
          </div>
          <textarea
            value={groqKeys}
            onChange={(e) => setGroqKeys(e.target.value)}
            rows={2}
            placeholder="gsk_..."
            className="w-full bg-navy/80 border border-purple-900/60 rounded-xl p-3 text-xs text-white outline-none focus:border-amethyst font-mono"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amethyst to-coral hover:from-coral hover:to-amethyst text-white font-black text-sm shadow-xl shadow-amethyst/30 hover:scale-105 transition-all cursor-pointer"
          >
            Save AuraLingo AI Settings ✨
          </button>
        </div>
      </form>
    </div>
  );
}
