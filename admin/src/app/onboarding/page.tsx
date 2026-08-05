'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LanguageAIService, LanguageProfile, DEFAULT_LANGUAGE_PROFILE } from '@/lib/language-ai';

const TARGET_LANGUAGES = [
  { code: 'es', name: 'Spanish', flag: '🇪🇸', native: 'Español', popular: true, accent: 'Castilian & LatAm' },
  { code: 'fr', name: 'French', flag: '🇫🇷', native: 'Français', popular: true, accent: 'Parisian & Canadian' },
  { code: 'de', name: 'German', flag: '🇩🇪', native: 'Deutsch', popular: true, accent: 'Hochdeutsch' },
  { code: 'zh', name: 'Mandarin Chinese', flag: '🇨🇳', native: '中文', popular: true, accent: 'Standard Putonghua' },
  { code: 'en', name: 'English', flag: '🇬🇧', native: 'English', popular: true, accent: 'RP & General American' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵', native: '日本語', popular: true, accent: 'Tokyo Standard' },
  { code: 'it', name: 'Italian', flag: '🇮🇹', native: 'Italiano', popular: false, accent: 'Standard Italian' },
  { code: 'pt', name: 'Portuguese', flag: '🇧🇷', native: 'Português', popular: false, accent: 'Brazilian & European' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷', native: '한국어', popular: false, accent: 'Seoul Dialect' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺', native: 'Русский', popular: false, accent: 'Standard Russian' },
];

const NATIVE_LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Mandarin Chinese',
  'Yoruba', 'Hausa', 'Igbo', 'Arabic', 'Portuguese', 'Hindi', 'Japanese',
  'Russian', 'Turkish', 'Vietnamese', 'Korean', 'Italian', 'Polish'
];

const GOALS = [
  { id: 'CAREER', title: 'Career & Business', desc: 'Master tech job interviews, lead international meetings & negotiate deals', icon: '💼', tag: 'High Impact' },
  { id: 'RELOCATION', title: 'Relocation & Immigration', desc: 'Adapt effortlessly to living, renting apartments, and working in a new country', icon: '🛫', tag: 'Essential' },
  { id: 'TRAVEL', title: 'Travel & Local Exploration', desc: 'Order food at tapas bars, navigate transport, and converse with locals', icon: '🌍', tag: 'Popular' },
  { id: 'EXAM_PREP', title: 'CEFR / DELE Certification', desc: 'Prepare for official DELE, DELF, TestDaF, HSK, or TOEFL speaking tests', icon: '🎓', tag: 'Academic' },
  { id: 'DATING', title: 'Dating & Relationships', desc: 'Express emotions, banter naturally, and connect deeply with family & partners', icon: '❤️', tag: 'Conversational' },
  { id: 'CASUAL', title: 'Media & Casual Fluency', desc: 'Enjoy movies, podcasts, literature, and spontaneous coffee shop chats', icon: '🎧', tag: 'Lifestyle' },
];

const CEFR_LEVELS = [
  { level: 'A1', title: 'Complete Beginner', desc: 'I know basic greetings and isolated vocabulary' },
  { level: 'A2', title: 'Elementary Spoken', desc: 'I can order meals and navigate simple daily routines' },
  { level: 'B1', title: 'Intermediate (Recommended)', desc: 'I can construct sentences but make past/future tense errors' },
  { level: 'B2', title: 'Upper-Intermediate', desc: 'I speak comfortably but lack native idioms, speed & nuance' },
  { level: 'C1', title: 'Advanced Specialist', desc: 'I need polish for complex technical, political & cultural debates' },
  { level: 'C2', title: 'Near-Native Mastery', desc: 'I aim to refine accent, subtle pragmatics, humor & speed' },
];

export default function WebOnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<LanguageProfile>({
    ...DEFAULT_LANGUAGE_PROFILE,
    isOnboarded: false,
  });
  const [selectedProvider, setSelectedProvider] = useState<'GEMINI' | 'GROQ' | 'OPENROUTER' | 'OPENAI'>('GEMINI');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [genStatusText, setGenStatusText] = useState('Initializing AI Multi-Key Provider...');

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    } else if (step === 5) {
      setStep(6);
      setIsGenerating(true);
      
      const statusSequence = [
        'Analyzing native language contrast rules...',
        'Synthesizing real-world roleplay scenarios...',
        'Indexing past-tense & phonetic error memory bank...',
        'Configuring 24/7 AI Tutor Persona voice model...',
        'Personalized AuraLingo AI Curriculum Ready! ✨'
      ];

      let p = 0;
      let seqIdx = 0;
      const interval = setInterval(() => {
        p += 20;
        setGenProgress(p);
        if (seqIdx < statusSequence.length) {
          setGenStatusText(statusSequence[seqIdx]);
          seqIdx++;
        }
        if (p >= 100) {
          clearInterval(interval);
          setIsGenerating(false);
          const updated = { ...profile, isOnboarded: true };
          LanguageAIService.saveProfile(updated);
        }
      }, 500);
    }
  };

  const handleFinishOnboarding = () => {
    const updated = { ...profile, isOnboarded: true };
    LanguageAIService.saveProfile(updated);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-navy text-purple-50 flex flex-col justify-between p-6 md:p-12 relative overflow-hidden font-sans">
      {/* Background Ambient Glow Orbs */}
      <div className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] bg-amethyst/20 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] bg-coral/20 rounded-full blur-[160px] pointer-events-none" />

      {/* Header */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <img
            src="/logo.jpg"
            alt="AuraLingo AI Logo"
            className="w-12 h-12 rounded-2xl object-cover border-2 border-amethyst shadow-xl shadow-amethyst/30"
          />
          <div>
            <h1 className="font-black text-2xl text-white tracking-wide">AuraLingo <span className="text-amethyst-light">AI</span></h1>
            <p className="text-xs text-purple-300/70 font-semibold">24/7 AI Personal Language Coach</p>
          </div>
        </div>

        {step <= 5 && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-black text-coral uppercase tracking-wider bg-coral/10 border border-coral/20 px-3 py-1 rounded-full">
              Step {step} of 5
            </span>
            <div className="w-36 bg-primary-light/60 h-2.5 rounded-full overflow-hidden border border-purple-900/60 shadow-inner">
              <div
                className="bg-gradient-to-r from-amethyst to-coral h-full transition-all duration-500 rounded-full"
                style={{ width: `${(step / 5) * 100}%` }}
              />
            </div>
          </div>
        )}
      </header>

      {/* Main Wizard Container */}
      <main className="max-w-5xl w-full mx-auto my-auto py-8 z-10">
        {/* STEP 1: TARGET LANGUAGE */}
        {step === 1 && (
          <div className="space-y-8 animate-fadeIn">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-amethyst-light text-xs font-black tracking-widest uppercase bg-amethyst/10 px-3.5 py-1 rounded-full border border-amethyst/30">
                Step 1 · Target Language Goal
              </span>
              <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
                Which language do you want to master?
              </h2>
              <p className="text-purple-200/80 text-sm leading-relaxed">
                Your AI coach synthesizes real-world conversation scenarios, phonetic accent coaching, and cultural nuances tailored to your target language.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {TARGET_LANGUAGES.map((lang) => {
                const isSelected = profile.targetLanguage === lang.name;
                return (
                  <button
                    key={lang.code}
                    onClick={() => setProfile({ ...profile, targetLanguage: lang.name })}
                    className={`p-5 rounded-3xl border flex flex-col items-center justify-center gap-3 transition-all duration-300 cursor-pointer relative group ${
                      isSelected
                        ? 'bg-gradient-to-b from-amethyst/40 to-primary-light border-amethyst text-white shadow-2xl shadow-amethyst/30 scale-105'
                        : 'bg-primary/80 border-primary-light/60 hover:border-amethyst/60 text-purple-200 hover:text-white'
                    }`}
                  >
                    <span className="text-5xl drop-shadow-lg group-hover:scale-110 transition-transform">{lang.flag}</span>
                    <div className="text-center space-y-0.5">
                      <p className="font-extrabold text-base text-white">{lang.name}</p>
                      <p className="text-xs text-purple-300/70 font-medium">{lang.native}</p>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] font-black bg-coral text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-md">
                        Selected Target
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: NATIVE LANGUAGE BACKGROUND */}
        {step === 2 && (
          <div className="space-y-8 animate-fadeIn">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-amethyst-light text-xs font-black tracking-widest uppercase bg-amethyst/10 px-3.5 py-1 rounded-full border border-amethyst/30">
                Step 2 · Native Background Contrast
              </span>
              <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
                What is your native language?
              </h2>
              <p className="text-purple-200/80 text-sm leading-relaxed">
                Your AI coach leverages your mother tongue to explain complex grammar rules, false cognates, and phonetic contrasts in natural terms.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 max-w-4xl mx-auto">
              {NATIVE_LANGUAGES.map((nativeLang) => {
                const isSelected = profile.nativeLanguage === nativeLang;
                return (
                  <button
                    key={nativeLang}
                    onClick={() => setProfile({ ...profile, nativeLanguage: nativeLang })}
                    className={`p-4 rounded-2xl border font-bold text-xs transition-all duration-200 cursor-pointer text-center ${
                      isSelected
                        ? 'bg-gradient-to-r from-amethyst to-purple-600 text-white border-amethyst shadow-lg shadow-amethyst/30 scale-105 font-black'
                        : 'bg-primary/80 border-primary-light/60 hover:border-amethyst/50 text-purple-200 hover:text-white'
                    }`}
                  >
                    {nativeLang}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: MOTIVATION / GOAL */}
        {step === 3 && (
          <div className="space-y-8 animate-fadeIn">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-amethyst-light text-xs font-black tracking-widest uppercase bg-amethyst/10 px-3.5 py-1 rounded-full border border-amethyst/30">
                Step 3 · Practical Goal Focus
              </span>
              <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
                What is your primary objective?
              </h2>
              <p className="text-purple-200/80 text-sm leading-relaxed">
                We prioritize vocabulary clusters, real-life roleplay scenarios, and conversation speed based on your target goal.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {GOALS.map((g) => {
                const isSelected = profile.goal === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => setProfile({ ...profile, goal: g.id as any })}
                    className={`p-6 rounded-3xl border flex items-start gap-5 transition-all duration-300 text-left cursor-pointer relative ${
                      isSelected
                        ? 'bg-gradient-to-r from-amethyst/30 via-primary-light to-primary border-amethyst text-white shadow-2xl shadow-amethyst/20 scale-102'
                        : 'bg-primary/80 border-primary-light/60 hover:border-amethyst/60 text-purple-200 hover:text-white'
                    }`}
                  >
                    <span className="text-4xl p-3 bg-navy/80 rounded-2xl border border-purple-900/60 shadow-inner">{g.icon}</span>
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-black text-lg text-white">{g.title}</h3>
                        <span className="text-[10px] font-black text-coral bg-coral/10 border border-coral/30 px-2 py-0.5 rounded-full uppercase">
                          {g.tag}
                        </span>
                      </div>
                      <p className="text-xs text-purple-300/80 leading-relaxed">{g.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4: CEFR PROFICIENCY LEVEL */}
        {step === 4 && (
          <div className="space-y-8 animate-fadeIn">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-amethyst-light text-xs font-black tracking-widest uppercase bg-amethyst/10 px-3.5 py-1 rounded-full border border-amethyst/30">
                Step 4 · CEFR Self Assessment
              </span>
              <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
                What is your current level in {profile.targetLanguage}?
              </h2>
              <p className="text-purple-200/80 text-sm leading-relaxed">
                Your 24/7 AI tutor continuously adapts speed, vocabulary difficulty, and grammar corrections as your fluency evolves.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {CEFR_LEVELS.map((lvl) => {
                const isSelected = profile.cefrLevel === lvl.level;
                return (
                  <button
                    key={lvl.level}
                    onClick={() => setProfile({ ...profile, cefrLevel: lvl.level as any })}
                    className={`p-5 rounded-3xl border flex items-center justify-between transition-all duration-300 cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-amethyst to-purple-600 text-white border-amethyst shadow-xl shadow-amethyst/30 scale-102'
                        : 'bg-primary/80 border-primary-light/60 hover:border-amethyst/60 text-purple-200 hover:text-white'
                    }`}
                  >
                    <div className="space-y-1 text-left">
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${isSelected ? 'bg-navy text-coral border border-coral/30' : 'bg-amethyst/20 text-amethyst-light border border-amethyst/30'}`}>
                          {lvl.level}
                        </span>
                        <span className="font-black text-base text-white">{lvl.title}</span>
                      </div>
                      <p className="text-xs text-purple-300/80 leading-snug">{lvl.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 5: DAILY ROUTINE & AI PROVIDER ENGINE */}
        {step === 5 && (
          <div className="space-y-8 animate-fadeIn">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-amethyst-light text-xs font-black tracking-widest uppercase bg-amethyst/10 px-3.5 py-1 rounded-full border border-amethyst/30">
                Step 5 · Practice Routine & AI Engine
              </span>
              <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
                Configure your learning commitment
              </h2>
              <p className="text-purple-200/80 text-sm leading-relaxed">
                Consistency is key to fluency. 20 minutes a day of live conversation with an active AI coach outperforms hours of passive app drills.
              </p>
            </div>

            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="bg-primary/80 border border-primary-light/60 p-6 rounded-3xl space-y-4 shadow-xl">
                <label className="text-xs font-black text-purple-200 uppercase tracking-wider block">Daily Practice Target</label>
                <div className="grid grid-cols-3 gap-3">
                  {[15, 20, 30].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => setProfile({ ...profile, dailyMinutes: mins })}
                      className={`py-3.5 rounded-2xl border text-sm font-black transition-all ${
                        profile.dailyMinutes === mins
                          ? 'bg-gradient-to-r from-amethyst to-purple-600 text-white border-amethyst shadow-lg shadow-amethyst/30'
                          : 'bg-navy/80 border-purple-900/60 text-purple-200 hover:text-white'
                      }`}
                    >
                      {mins} mins / day 🔥
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-primary/80 border border-primary-light/60 p-6 rounded-3xl space-y-4 shadow-xl">
                <label className="text-xs font-black text-purple-200 uppercase tracking-wider block">Preferred Multi-Key AI Engine</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'GEMINI', name: 'Gemini 2.0', badge: 'Ultra-Fast' },
                    { id: 'GROQ', name: 'Groq Llama 3.3', badge: '70B Speed' },
                    { id: 'OPENROUTER', name: 'OpenRouter', badge: 'Multi-LLM' },
                    { id: 'OPENAI', name: 'OpenAI GPT-4o', badge: 'High Precision' },
                  ].map((prov) => (
                    <button
                      key={prov.id}
                      onClick={() => setSelectedProvider(prov.id as any)}
                      className={`p-3 rounded-2xl border text-xs font-bold text-center transition-all ${
                        selectedProvider === prov.id
                          ? 'bg-gradient-to-r from-amethyst to-purple-600 text-white border-amethyst shadow-md'
                          : 'bg-navy/80 border-purple-900/60 text-purple-300 hover:text-white'
                      }`}
                    >
                      <p className="font-extrabold text-white">{prov.name}</p>
                      <span className="text-[9px] text-coral font-bold">{prov.badge}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: AI BLUEPRINT GENERATION SEQUENCE */}
        {step === 6 && (
          <div className="text-center max-w-xl mx-auto space-y-8 animate-fadeIn py-10">
            {isGenerating ? (
              <div className="space-y-6">
                <div className="w-24 h-24 border-4 border-amethyst border-t-transparent rounded-full animate-spin mx-auto shadow-2xl shadow-amethyst/40" />
                <div className="space-y-2">
                  <h3 className="text-3xl font-black text-white">Synthesizing AuraLingo AI Curriculum...</h3>
                  <p className="text-amethyst-light text-sm font-bold animate-pulse">{genStatusText}</p>
                </div>
                <div className="w-full bg-primary-light/60 h-3.5 rounded-full overflow-hidden border border-purple-900/60 shadow-inner">
                  <div
                    className="bg-gradient-to-r from-amethyst via-purple-500 to-coral h-full transition-all duration-500 rounded-full"
                    style={{ width: `${genProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-purple-300 font-bold px-2">
                  <span>Target: {profile.targetLanguage} ({profile.cefrLevel})</span>
                  <span>{genProgress}%</span>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="w-24 h-24 rounded-3xl bg-emerald/20 border-2 border-emerald text-emerald flex items-center justify-center text-5xl mx-auto shadow-2xl shadow-emerald/30 animate-bounce">
                  ✨
                </div>
                <div className="space-y-2">
                  <span className="text-emerald text-xs font-black uppercase tracking-widest bg-emerald/10 px-3.5 py-1 rounded-full border border-emerald/30">
                    24/7 AI Personal Coach Configured
                  </span>
                  <h3 className="text-3xl font-black text-white">Your Conversational Blueprint is Live!</h3>
                  <p className="text-purple-200 text-sm max-w-md mx-auto leading-relaxed">
                    We've initialized your personalized AI tutor in <span className="text-coral font-bold">{profile.targetLanguage}</span> for native <span className="text-amethyst-light font-bold">{profile.nativeLanguage}</span> speakers.
                  </p>
                </div>

                <div className="bg-primary/90 border border-primary-light/60 p-6 rounded-3xl text-left space-y-3 shadow-xl">
                  <div className="flex justify-between text-xs border-b border-purple-900/60 pb-2.5">
                    <span className="text-purple-300/70 font-semibold">Target Language:</span>
                    <span className="font-bold text-white">{profile.targetLanguage} ({profile.cefrLevel})</span>
                  </div>
                  <div className="flex justify-between text-xs border-b border-purple-900/60 pb-2.5">
                    <span className="text-purple-300/70 font-semibold">Native Contrast Mode:</span>
                    <span className="font-bold text-white">{profile.nativeLanguage}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-purple-300/70 font-semibold">Primary Goal:</span>
                    <span className="font-bold text-coral">{profile.goal}</span>
                  </div>
                </div>

                <button
                  onClick={handleFinishOnboarding}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-amethyst to-coral hover:from-coral hover:to-amethyst text-white font-black text-base shadow-2xl shadow-amethyst/30 hover:scale-102 transition-all cursor-pointer"
                >
                  Enter AuraLingo AI Coach Hub →
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer Nav Controls */}
      {step <= 5 && (
        <footer className="max-w-5xl w-full mx-auto flex items-center justify-between z-10 pt-4 border-t border-purple-900/40">
          <button
            onClick={() => step > 1 && setStep(step - 1)}
            disabled={step === 1}
            className={`px-6 py-3 rounded-2xl border text-xs font-bold transition-all ${
              step === 1
                ? 'opacity-30 border-purple-900/40 text-purple-400/40 cursor-not-allowed'
                : 'border-purple-900/60 text-purple-200 hover:text-white hover:border-amethyst cursor-pointer'
            }`}
          >
            ← Back
          </button>

          <button
            onClick={handleNext}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amethyst to-coral hover:from-coral hover:to-amethyst text-white font-black text-xs shadow-xl shadow-amethyst/30 hover:scale-105 transition-all cursor-pointer"
          >
            {step === 5 ? 'Synthesize AI Curriculum ✨' : 'Continue →'}
          </button>
        </footer>
      )}
    </div>
  );
}
