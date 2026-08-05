'use client';

import React, { useState } from 'react';

interface AudioReviewSession {
  id: string;
  learnerName: string;
  learnerEmail: string;
  scenarioTitle: string;
  targetLanguage: string;
  cefrLevel: string;
  phoneticScore: number;
  transcriptSample: string;
  aiFeedbackText: string;
  createdAt: string;
}

const PENDING_VOICE_SESSIONS: AudioReviewSession[] = [
  {
    id: 'rev-1',
    learnerName: 'Alex Rivera',
    learnerEmail: 'alex@auralingo.ai',
    scenarioTitle: 'Tech Job Interview Simulation',
    targetLanguage: 'Spanish 🇪🇸',
    cefrLevel: 'B2',
    phoneticScore: 88,
    transcriptSample: 'Yo fui a la entrevista de trabajo ayer y tener mucho entusiasmo.',
    aiFeedbackText: 'Good past tense usage of "fui". Note: change infinitive "tener" to "tenía" for continuous state.',
    createdAt: '10 mins ago'
  },
  {
    id: 'rev-2',
    learnerName: 'Sofia Chen',
    learnerEmail: 'sofia.c@gmail.com',
    scenarioTitle: 'Tapas Bar Order & Small Talk',
    targetLanguage: 'Spanish 🇪🇸',
    cefrLevel: 'A2',
    phoneticScore: 92,
    transcriptSample: 'Quisiera dos tapas de jamón ibérico y una copa de vino tinto, por favor.',
    aiFeedbackText: 'Excellent polite phrasing using conditional "quisiera". Native pronunciation accent.',
    createdAt: '25 mins ago'
  }
];

export default function AuraLingoTutorReviews() {
  const [reviews, setReviews] = useState<AudioReviewSession[]>(PENDING_VOICE_SESSIONS);
  const [selectedReview, setSelectedReview] = useState<AudioReviewSession | null>(null);
  const [coachNote, setCoachNote] = useState('');
  const [scoreOverride, setScoreOverride] = useState(90);

  const handleApprove = (id: string) => {
    setReviews(reviews.filter(r => r.id !== id));
    setSelectedReview(null);
    setCoachNote('');
  };

  return (
    <div className="space-y-6 text-purple-50">
      {/* Header */}
      <div className="bg-primary/80 border border-primary-light/60 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-black bg-coral/10 text-coral border border-coral/30 px-3 py-1 rounded-full uppercase tracking-wider">
            AuraLingo AI Quality Control
          </span>
        </div>
        <h1 className="text-2xl font-black text-white">Live Voice Session Reviews & Human Coach Audit</h1>
        <p className="text-purple-300/70 text-xs mt-1">Review AI phonetic scores, transcript corrections, and human coach note overrides.</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reviews.map((rev) => (
          <div
            key={rev.id}
            className="bg-primary/80 border border-primary-light/60 hover:border-amethyst/60 p-6 rounded-2xl space-y-4 shadow-xl transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-white text-base">{rev.learnerName}</h3>
                  <p className="text-purple-300/60 text-xs">{rev.learnerEmail}</p>
                </div>
                <span className="text-xs font-bold text-coral bg-coral/10 border border-coral/30 px-2.5 py-0.5 rounded-full">
                  {rev.targetLanguage} ({rev.cefrLevel})
                </span>
              </div>

              <div className="bg-navy/80 p-3.5 rounded-xl border border-purple-900/60 space-y-1">
                <span className="text-[10px] font-black text-purple-400 uppercase tracking-wider block">Scenario</span>
                <p className="text-xs font-bold text-white">{rev.scenarioTitle}</p>
                <p className="text-xs text-purple-200/80 italic mt-1 font-serif">"{rev.transcriptSample}"</p>
              </div>

              <div className="flex items-center justify-between text-xs bg-emerald/10 p-3 rounded-xl border border-emerald/20">
                <span className="text-purple-200 font-semibold">AI Phonetic Accuracy</span>
                <span className="font-black text-emerald text-sm">{rev.phoneticScore}%</span>
              </div>
            </div>

            <div className="pt-4 border-t border-purple-900/60 flex items-center justify-between">
              <span className="text-[10px] text-purple-400">{rev.createdAt}</span>
              <button
                onClick={() => {
                  setSelectedReview(rev);
                  setScoreOverride(rev.phoneticScore);
                }}
                className="bg-gradient-to-r from-amethyst to-purple-600 hover:from-purple-600 hover:to-amethyst text-white font-black px-4 py-2 rounded-xl text-xs shadow-md shadow-amethyst/20 cursor-pointer"
              >
                Audit Session →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Review Modal */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-primary border border-primary-light/60 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-black text-coral uppercase tracking-wider">Coach Audit</span>
                <h3 className="text-xl font-black text-white">{selectedReview.learnerName}</h3>
                <p className="text-xs text-purple-300/70">{selectedReview.scenarioTitle}</p>
              </div>
              <button
                onClick={() => setSelectedReview(null)}
                className="text-purple-400 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-navy/80 p-4 rounded-2xl border border-purple-900/60 space-y-1">
                <span className="text-[10px] font-black text-purple-400 uppercase">Spoken Audio Transcript</span>
                <p className="text-white font-medium italic">"{selectedReview.transcriptSample}"</p>
              </div>

              <div className="bg-navy/80 p-4 rounded-2xl border border-purple-900/60 space-y-1">
                <span className="text-[10px] font-black text-coral uppercase">AI Automated Feedback</span>
                <p className="text-purple-200">{selectedReview.aiFeedbackText}</p>
              </div>

              <div>
                <label className="block text-purple-200 font-bold mb-1">Human Coach Phonetic Score Override (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={scoreOverride}
                  onChange={(e) => setScoreOverride(parseInt(e.target.value) || 0)}
                  className="w-full bg-navy/80 border border-purple-900/60 focus:border-amethyst rounded-xl px-4 py-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-purple-200 font-bold mb-1">Human Coach Personal Advice Note</label>
                <textarea
                  rows={3}
                  value={coachNote}
                  onChange={(e) => setCoachNote(e.target.value)}
                  placeholder="Add personalized encouraging tip for the learner..."
                  className="w-full bg-navy/80 border border-purple-900/60 focus:border-amethyst rounded-xl p-3 text-white placeholder-purple-400/50 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-purple-900/60">
              <button
                onClick={() => setSelectedReview(null)}
                className="bg-primary-light/40 text-purple-300 font-bold px-4 py-2 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApprove(selectedReview.id)}
                className="bg-gradient-to-r from-amethyst to-coral text-white font-black px-5 py-2 rounded-xl text-xs shadow-lg shadow-amethyst/30"
              >
                Approve & Send Feedback ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
