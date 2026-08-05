'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { LanguageAIService, DynamicExercise } from '@/lib/language-ai';

export default function RealtimeExercisesPage() {
  const [exercises, setExercises] = useState<DynamicExercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [fillBlankInput, setFillBlankInput] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const generated = LanguageAIService.generateExercisesFromMistakes();
    setExercises(generated);
  }, []);

  const currentEx = exercises[currentIndex];

  const handleSubmitAnswer = () => {
    if (!currentEx || isSubmitted) return;

    let isCorrect = false;
    if (currentEx.type === 'MULTIPLE_CHOICE') {
      isCorrect = selectedOption === currentEx.correctAnswer;
    } else if (currentEx.type === 'FILL_IN_BLANK') {
      isCorrect = fillBlankInput.trim().toLowerCase() === currentEx.correctAnswer.toLowerCase();
    } else {
      isCorrect = true; // Pronunciation mimic always awards completion
    }

    if (isCorrect) {
      setScore((prev) => prev + 1);
    }
    setIsSubmitted(true);
  };

  const handleNextExercise = () => {
    setSelectedOption(null);
    setFillBlankInput('');
    setIsSubmitted(false);

    if (currentIndex + 1 < exercises.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  if (!currentEx && !isCompleted) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4 text-white">
        <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 font-semibold text-sm">Synthesizing personalized drills from mistake memory...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Real-Time Dynamic Exercise Drills</h1>
          <p className="text-xs text-slate-400">
            Tailored exercises synthesized on-the-fly targeting your specific active mistake log.
          </p>
        </div>

        {!isCompleted && (
          <div className="text-right">
            <span className="text-xs font-bold text-slate-400">Question {currentIndex + 1} of {exercises.length}</span>
            <div className="w-32 bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700 mt-1">
              <div
                className="bg-gold h-full transition-all duration-300 rounded-full"
                style={{ width: `${((currentIndex + 1) / exercises.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {!isCompleted ? (
        <div className="bg-primary/60 border border-primary-light/60 p-8 rounded-3xl space-y-6 shadow-2xl">
          {/* Question Badge */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black bg-gold/10 text-gold border border-gold/20 px-3 py-1 rounded-full uppercase">
              {currentEx.type.replace('_', ' ')}
            </span>
            <span className="text-xs font-bold text-slate-400">Target Mistake Practice</span>
          </div>

          {/* Question Title & Context */}
          <div className="space-y-2">
            <h2 className="text-xl font-black text-white">{currentEx.question}</h2>
            {currentEx.contextPhrase && (
              <p className="text-xs text-amber-400/90 font-mono bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                {currentEx.contextPhrase}
              </p>
            )}
          </div>

          {/* Interactive Input Form by Exercise Type */}
          {currentEx.type === 'MULTIPLE_CHOICE' && currentEx.options && (
            <div className="space-y-3">
              {currentEx.options.map((opt, idx) => {
                const isSelected = selectedOption === opt;
                let btnStyle = 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600';

                if (isSubmitted) {
                  if (opt === currentEx.correctAnswer) {
                    btnStyle = 'bg-emerald/20 border-emerald text-emerald font-bold';
                  } else if (isSelected) {
                    btnStyle = 'bg-red-500/20 border-red-500 text-red-400 line-through';
                  }
                } else if (isSelected) {
                  btnStyle = 'bg-gold/20 border-gold text-white font-bold';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => !isSubmitted && setSelectedOption(opt)}
                    className={`w-full p-4 rounded-2xl border text-left text-xs transition-all cursor-pointer ${btnStyle}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {currentEx.type === 'FILL_IN_BLANK' && (
            <div className="space-y-3">
              <input
                type="text"
                value={fillBlankInput}
                onChange={(e) => setFillBlankInput(e.target.value)}
                disabled={isSubmitted}
                placeholder="Type the correct replacement word..."
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-sm text-white outline-none focus:border-gold placeholder:text-slate-500"
              />
            </div>
          )}

          {currentEx.type === 'PRONUNCIATION_MIMIC' && (
            <div className="text-center p-8 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4">
              <div className="w-16 h-16 rounded-full bg-gold/20 text-gold flex items-center justify-center text-2xl mx-auto shadow-lg shadow-gold/10">
                🎙️
              </div>
              <p className="text-sm font-bold text-white">Press Mic & Repeat Aloud:</p>
              <p className="text-base font-extrabold text-gold">"{currentEx.contextPhrase}"</p>
            </div>
          )}

          {/* Answer Explanation Box */}
          {isSubmitted && (
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2 animate-fadeIn">
              <span className="text-xs font-black text-gold uppercase tracking-wider block">Explanation</span>
              <p className="text-xs text-slate-300 leading-relaxed">{currentEx.explanation}</p>
            </div>
          )}

          {/* Submit / Next Button */}
          <div className="flex justify-end pt-4 border-t border-slate-800">
            {!isSubmitted ? (
              <button
                onClick={handleSubmitAnswer}
                disabled={
                  (currentEx.type === 'MULTIPLE_CHOICE' && !selectedOption) ||
                  (currentEx.type === 'FILL_IN_BLANK' && !fillBlankInput.trim())
                }
                className="px-8 py-3 rounded-xl bg-gold hover:bg-gold-dark text-primary font-black text-xs shadow-lg shadow-gold/20 disabled:opacity-40 transition-all cursor-pointer"
              >
                Submit Answer →
              </button>
            ) : (
              <button
                onClick={handleNextExercise}
                className="px-8 py-3 rounded-xl bg-emerald hover:bg-emerald-dark text-white font-black text-xs shadow-lg shadow-emerald/20 transition-all cursor-pointer"
              >
                {currentIndex + 1 < exercises.length ? 'Next Drill Question →' : 'View Drill Summary 🎉'}
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Completion Card */
        <div className="bg-primary/60 border border-primary-light/60 p-10 rounded-3xl text-center space-y-6 shadow-2xl animate-fadeIn max-w-xl mx-auto">
          <div className="w-20 h-20 rounded-full bg-emerald/20 border border-emerald text-emerald flex items-center justify-center text-4xl mx-auto shadow-2xl shadow-emerald/30">
            🏆
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-white">Dynamic Drill Completed!</h2>
            <p className="text-slate-400 text-sm">
              You scored <span className="text-gold font-bold">{score} out of {exercises.length}</span> correct.
            </p>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-1">
            <p className="font-bold text-emerald">✓ Mistake Memory Updated!</p>
            <p className="text-slate-400">Mastery scores for tested items increased by +15%.</p>
          </div>

          <div className="flex gap-3 justify-center">
            <Link
              href="/dashboard/coach"
              className="px-6 py-3 rounded-xl bg-gold hover:bg-gold-dark text-primary font-black text-xs shadow-lg shadow-gold/20 transition-all"
            >
              Return to Live AI Voice Coach →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
