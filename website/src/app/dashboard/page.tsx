'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, User } from '@/lib/api';

interface Stats {
  overallBandEstimate: number;
  studyStreak: number;
  timeSpentStudying: number;
  lessonsCompletedCount: number;
  mockTestsCompletedCount: number;
  weakQuestionTypes: string[];
}

export default function StudentDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await api.request('/auth/profile');
        setProfile(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load user profile');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center p-6">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-xl text-center max-w-md">
          <p className="font-bold">Error loading dashboard</p>
          <p className="text-xs mt-2">{error || 'Please sign in again.'}</p>
          <Link href="/auth/login" className="mt-4 inline-block bg-gold text-primary font-bold px-4 py-2 rounded-lg text-xs hover:bg-gold-dark">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const sub = profile.subscriptions?.[0];
  const stats = profile.progressStats || {
    overallBandEstimate: 0,
    timeSpentStudying: 0,
    lessonsCompletedCount: 0,
    mockTestsCompletedCount: 0,
    weakQuestionTypes: [],
  };

  const modules = [
    { name: 'Listening Practice', path: '/dashboard/listening', icon: '🎧', color: 'border-l-blue-500', desc: 'Audio clips, form completion, and map labeling' },
    { name: 'Reading Practice', path: '/dashboard/reading', icon: '📖', color: 'border-l-emerald', desc: 'Academic and general training long-passages' },
    { name: 'Writing Correction', path: '/dashboard/writing', icon: '✍️', color: 'border-l-gold', desc: 'Instant AI grading for Task 1 and Task 2 essays' },
    { name: 'Speaking Feedback', path: '/dashboard/speaking', icon: '🎙️', color: 'border-l-purple-500', desc: 'Speech-to-text pronunciation and vocabulary review' },
  ];

  return (
    <div className="min-h-screen bg-navy text-white flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-primary-light/30 bg-primary/45 backdrop-blur-md flex items-center justify-between px-8 md:px-16">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold tracking-wider flex items-center gap-1.5">
            <span className="text-gold">BandUp</span> IELTS
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-300">
            <Link href="/dashboard/progress" className="hover:text-gold transition-colors">
              📈 AI Progress Report
            </Link>
            <Link href="/dashboard/history" className="hover:text-gold transition-colors">
              📜 Attempt History
            </Link>
            <Link href="/dashboard/referrals" className="hover:text-gold transition-colors">
              💸 Referral Program
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Streak:</span>
            <span className="text-gold font-extrabold text-sm">{profile.studyStreak} Days 🔥</span>
          </div>
          <button
            onClick={() => {
              api.clearTokens();
              window.location.href = '/auth/login';
            }}
            className="text-xs font-bold text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg bg-red-500/5 hover:bg-red-500/10 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-8 space-y-8">
        
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-primary to-primary-light border border-primary-light/40 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <h2 className="text-2xl md:text-3xl font-black">Welcome back, {profile.name}!</h2>
            <p className="text-slate-300 text-sm max-w-md">Your target exam is <span className="text-gold font-bold uppercase">{profile.targetExam}</span>. Let's practice to hit your goal!</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-primary-light/40">
              <div>
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Target Band</p>
                <p className="text-white text-xl font-bold mt-1">Band {profile.targetBand}</p>
              </div>
              <div>
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Current Estimate</p>
                <p className="text-gold text-xl font-bold mt-1">Band {stats.overallBandEstimate || '6.5'}</p>
              </div>
              <div>
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Completed Lessons</p>
                <p className="text-white text-xl font-bold mt-1">{stats.lessonsCompletedCount} Lessons</p>
              </div>
              <div>
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Billing Status</p>
                <p className="text-emerald text-xl font-bold mt-1 capitalize">{sub?.plan.code || 'FREE'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Practice Grid */}
        <div className="space-y-4">
          <h3 className="text-white font-bold text-lg">Practice Modules</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {modules.map((m) => (
              <div
                key={m.name}
                className={`bg-primary/25 border border-primary-light/30 border-l-4 ${m.color} rounded-2xl p-6 shadow-xl relative group hover:border-gold/30 transition-all duration-200`}
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="text-2xl">{m.icon}</div>
                    <h4 className="text-white font-bold text-base">{m.name}</h4>
                    <p className="text-slate-400 text-xs leading-relaxed max-w-sm">{m.desc}</p>
                  </div>
                  <Link
                    href={m.path}
                    className="bg-primary-light/50 border border-primary-light hover:bg-gold hover:text-primary text-slate-300 hover:border-gold font-bold px-4 py-2 rounded-lg text-xs transition-all duration-200 cursor-pointer"
                  >
                    Start Practice
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Analytics & Weak Areas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Weak areas card */}
          <div className="bg-primary/25 border border-primary-light/30 rounded-2xl p-6 shadow-xl col-span-2">
            <h4 className="text-white font-bold text-sm mb-4">Focus areas (Identified Weaknesses)</h4>
            {stats.weakQuestionTypes.length === 0 ? (
              <p className="text-slate-500 text-xs py-6 text-center">Great job! No persistent weaknesses detected so far.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {stats.weakQuestionTypes.map((type: string) => (
                  <span key={type} className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider">
                    {type.replace('_', ' ')}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Quick Mock exams card */}
          <div className="bg-primary/25 border border-primary-light/30 rounded-2xl p-6 shadow-xl space-y-4">
            <h4 className="text-white font-bold text-sm">Full Mock Exam</h4>
            <p className="text-slate-400 text-xs leading-relaxed">Take a timed 2.5-hour complete mock exam to simulate the official test conditions.</p>
            
            <button className="w-full bg-gold hover:bg-gold-dark text-primary font-bold py-2.5 rounded-lg text-xs transition-colors duration-200 cursor-pointer shadow-lg shadow-gold/10">
              Start Full Mock Exam
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}
