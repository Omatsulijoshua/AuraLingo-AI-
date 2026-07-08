'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function AdminLoginPage() {
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
      const data = await api.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (data.user.role === 'STUDENT') {
        api.clearTokens();
        throw new Error('Access denied. Admin portal is only accessible by administrators and examiners.');
      }

      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      api.setUser(data.user);

      // Redirect to Admin dashboard home
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-navy flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background design elements */}
      <div className="absolute top-[-25%] right-[-25%] w-[70%] h-[70%] rounded-full bg-primary-light/35 blur-[150px]" />
      <div className="absolute bottom-[-25%] left-[-25%] w-[70%] h-[70%] rounded-full bg-gold/15 blur-[150px]" />

      <div className="w-full max-w-md bg-primary/45 backdrop-blur-lg border border-primary-light/50 rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-gold/15 text-gold border border-gold/30 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-3">
            Admin Panel
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wider">
            <span className="text-gold">BandUp</span> IELTS
          </h1>
          <p className="text-slate-400 mt-2 text-sm">Sign in with administrator credentials.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2" htmlFor="email">
              Admin Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-navy/60 border border-primary-light/60 focus:border-gold rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none transition-all duration-200"
              placeholder="admin@bandup.com"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-navy/60 border border-primary-light/60 focus:border-gold rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none transition-all duration-200"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold hover:bg-gold-dark text-primary font-bold py-3.5 rounded-lg transition-all duration-200 shadow-lg shadow-gold/20 flex items-center justify-center disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Authorizing...' : 'Authorize Session'}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-slate-500">
          Secure portal. All login attempts are audited.
        </p>
      </div>
    </main>
  );
}
