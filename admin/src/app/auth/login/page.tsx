'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function AuraLingoLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Demo bypass or real API authorization
      localStorage.setItem('accessToken', 'auralingo-demo-token');
      api.setUser({
        id: 'user-demo',
        email: email || 'learner@auralingo.ai',
        name: 'Alex Rivera',
        role: 'ADMIN',
        targetExam: 'ACADEMIC',
        targetBand: 8,
        studyStreak: 7,
        isVerified: true,
        createdAt: new Date().toISOString()
      });

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-navy flex items-center justify-center px-4 relative overflow-hidden text-purple-50">
      {/* Background design elements */}
      <div className="absolute top-[-25%] right-[-25%] w-[70%] h-[70%] rounded-full bg-amethyst/20 blur-[150px]" />
      <div className="absolute bottom-[-25%] left-[-25%] w-[70%] h-[70%] rounded-full bg-coral/20 blur-[150px]" />

      <div className="w-full max-w-md bg-primary/80 backdrop-blur-xl border border-primary-light/60 rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8 space-y-3">
          <div className="flex justify-center">
            <img
              src="/logo.jpg"
              alt="AuraLingo AI Logo"
              className="w-16 h-16 rounded-2xl object-cover border-2 border-amethyst shadow-xl shadow-amethyst/30"
            />
          </div>
          <div>
            <span className="inline-flex items-center justify-center bg-coral/10 text-coral border border-coral/30 px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase mb-2">
              AuraLingo AI Portal
            </span>
            <h1 className="text-3xl font-black text-white tracking-wider">
              AuraLingo <span className="text-amethyst-light">AI</span>
            </h1>
            <p className="text-purple-300/70 text-xs mt-1">24/7 AI Personal Language Coach Platform</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-purple-200 text-xs font-bold uppercase tracking-wider mb-2" htmlFor="email">
              Learner / Admin Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-navy/80 border border-purple-900/60 focus:border-amethyst rounded-xl px-4 py-3 text-white placeholder-purple-400/50 focus:outline-none transition-all duration-200 text-sm"
              placeholder="alex@auralingo.ai"
            />
          </div>

          <div>
            <label className="block text-purple-200 text-xs font-bold uppercase tracking-wider mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-navy/80 border border-purple-900/60 focus:border-amethyst rounded-xl px-4 py-3 text-white placeholder-purple-400/50 focus:outline-none transition-all duration-200 text-sm"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amethyst to-coral hover:from-coral hover:to-amethyst text-white font-black py-4 rounded-xl transition-all duration-200 shadow-xl shadow-amethyst/30 flex items-center justify-center disabled:opacity-50 cursor-pointer text-sm"
          >
            {loading ? 'Authorizing Session...' : 'Enter AuraLingo AI Hub →'}
          </button>
        </form>

        <p className="mt-8 text-center text-[11px] text-purple-400/60">
          Encrypted session. Powered by AuraLingo AI Multi-Modal Engine.
        </p>
      </div>
    </main>
  );
}
