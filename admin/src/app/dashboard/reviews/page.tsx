'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface SubmissionItem {
  id: string;
  userId: string;
  user: { name: string; email: string };
  prompt: { title: string; promptText: string; taskType?: string; topic?: string };
  userText?: string;
  transcription?: string;
  audioUrl?: string;
  bandScoreEstimate: number;
  feedbackJson: any;
  createdAt: string;
}

export default function TutorReviews() {
  const [writing, setWriting] = useState<SubmissionItem[]>([]);
  const [speaking, setSpeaking] = useState<SubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected for review
  const [selectedSub, setSelectedSub] = useState<SubmissionItem | null>(null);
  const [selectedType, setSelectedType] = useState<'WRITING' | 'SPEAKING' | null>(null);

  // Grading form
  const [tutorScore, setTutorScore] = useState(7.0);
  const [tutorComment, setTutorComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPending = async () => {
    try {
      const data = await api.request('/content/tutor/pending');
      setWriting(data.writing || []);
      setSpeaking(data.speaking || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tutor tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleOpenReview = (sub: SubmissionItem, type: 'WRITING' | 'SPEAKING') => {
    setSelectedSub(sub);
    setSelectedType(type);
    setTutorScore(sub.bandScoreEstimate || 7.0);
    setTutorComment('');
  };

  const handleCloseReview = () => {
    setSelectedSub(null);
    setSelectedType(null);
  };

  const handleSubmitGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub || !selectedType) return;
    setSubmitting(true);

    try {
      await api.request(`/content/tutor/grade/${selectedSub.id}`, {
        method: 'POST',
        body: JSON.stringify({
          bandScore: Number(tutorScore),
          feedbackText: tutorComment,
          submissionType: selectedType,
        }),
      });

      alert('Tutor feedback submitted successfully!');
      handleCloseReview();
      await fetchPending();
    } catch (err: any) {
      alert(err.message || 'Failed to submit grade override');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-center">
          {error}
        </div>
      )}

      {/* Grid listing submissions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Writing Submissions list */}
        <div className="bg-primary/20 border border-primary-light/40 rounded-xl p-6 shadow-xl space-y-4">
          <h3 className="text-white font-bold text-base border-b border-primary-light/20 pb-3">
            Pending Writing Submissions ({writing.length})
          </h3>
          {writing.length === 0 ? (
            <p className="text-slate-500 text-xs py-12 text-center">No writing submissions pending tutor review.</p>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {writing.map((sub) => (
                <div key={sub.id} className="p-4 bg-navy/40 border border-primary-light/30 rounded-lg flex justify-between items-center hover:border-gold transition-colors">
                  <div>
                    <p className="text-white font-bold text-sm">{sub.user.name}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{sub.prompt.title} (Est. Band {sub.bandScoreEstimate})</p>
                  </div>
                  <button
                    onClick={() => handleOpenReview(sub, 'WRITING')}
                    className="bg-gold hover:bg-gold-dark text-primary font-bold px-3 py-1.5 rounded text-xs transition-colors cursor-pointer"
                  >
                    Grade
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Speaking Submissions list */}
        <div className="bg-primary/20 border border-primary-light/40 rounded-xl p-6 shadow-xl space-y-4">
          <h3 className="text-white font-bold text-base border-b border-primary-light/20 pb-3">
            Pending Speaking Submissions ({speaking.length})
          </h3>
          {speaking.length === 0 ? (
            <p className="text-slate-500 text-xs py-12 text-center">No speaking submissions pending tutor review.</p>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {speaking.map((sub) => (
                <div key={sub.id} className="p-4 bg-navy/40 border border-primary-light/30 rounded-lg flex justify-between items-center hover:border-gold transition-colors">
                  <div>
                    <p className="text-white font-bold text-sm">{sub.user.name}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{sub.prompt.topic} (Est. Band {sub.bandScoreEstimate})</p>
                  </div>
                  <button
                    onClick={() => handleOpenReview(sub, 'SPEAKING')}
                    className="bg-gold hover:bg-gold-dark text-primary font-bold px-3 py-1.5 rounded text-xs transition-colors cursor-pointer"
                  >
                    Grade
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Review Modal Form overlay */}
      {selectedSub && selectedType && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-primary border border-primary-light/40 rounded-2xl max-w-2xl w-full p-8 shadow-2xl relative space-y-6">
            <button
              onClick={handleCloseReview}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              ✕
            </button>

            <div className="border-b border-primary-light/20 pb-4">
              <span className="bg-gold/15 text-gold text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border border-gold/30">
                {selectedType} Review
              </span>
              <h3 className="text-white text-xl font-bold mt-2">Grading Submission for {selectedSub.user.name}</h3>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {/* Prompt Text */}
              <div className="bg-navy/40 p-4 rounded-lg border border-primary-light/20">
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Prompt</p>
                <p className="text-white text-xs font-semibold">{selectedSub.prompt.promptText || selectedSub.prompt.topic}</p>
              </div>

              {/* Student Response */}
              <div className="bg-navy/40 p-4 rounded-lg border border-primary-light/20">
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Student Answer</p>
                <p className="text-slate-200 text-xs whitespace-pre-wrap leading-relaxed">
                  {selectedSub.userText || selectedSub.transcription}
                </p>
              </div>

              {/* AI Estimate */}
              <div className="bg-navy/40 p-4 rounded-lg border border-primary-light/20 flex justify-between items-center">
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">AI Estimate Score</p>
                  <p className="text-white text-xs mt-1">Overall Band Score</p>
                </div>
                <div className="text-right">
                  <span className="bg-emerald/10 border border-emerald/30 text-emerald font-black text-xl px-4 py-2 rounded-lg">
                    {selectedSub.bandScoreEstimate || '6.5'}
                  </span>
                </div>
              </div>
            </div>

            {/* Grading Form */}
            <form onSubmit={handleSubmitGrade} className="space-y-4 pt-4 border-t border-primary-light/20">
              <div className="grid grid-cols-3 gap-4 items-center">
                <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider col-span-2">
                  Tutor Final Band Score
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.0"
                  max="9.0"
                  required
                  value={tutorScore}
                  onChange={(e) => setTutorScore(Number(e.target.value))}
                  className="bg-navy border border-primary-light focus:border-gold rounded-lg px-3 py-2 text-white text-sm focus:outline-none text-center font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-2">
                  Tutor Detailed Comments & Advice
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide guidance, point out specific errors, and give advice to reach the target band..."
                  value={tutorComment}
                  onChange={(e) => setTutorComment(e.target.value)}
                  className="w-full bg-navy border border-primary-light focus:border-gold rounded-lg p-3 text-white text-xs focus:outline-none leading-relaxed"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleCloseReview}
                  className="flex-1 border border-primary-light hover:border-red-500/40 text-slate-300 hover:text-red-400 font-bold py-3 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gold hover:bg-gold-dark text-primary font-bold py-3 rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Submitting Override...' : 'Submit Override Grade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
