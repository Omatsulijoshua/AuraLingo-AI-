'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function LoginPage() {
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

      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      api.setUser(data.user);

      // Redirect based on role
      if (data.user.role === 'SUPER_ADMIN' || data.user.role === 'ADMIN') {
        // Redirection message or routing to Admin dashboard
        window.location.href = 'http://localhost:3001/dashboard'; // Assuming Admin runs on 3001
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-navy flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-primary-light/20 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-gold/10 blur-[120px]" />

      <div className="w-full max-w-md bg-primary/40 backdrop-blur-md border border-primary-light/40 rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-white tracking-wider flex items-center justify-center gap-2">
            <span className="text-gold">BandUp</span> IELTS
          </Link>
          <p className="text-slate-400 mt-2 text-sm">Welcome back! Sign in to continue your preparation.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-navy/60 border border-primary-light/60 focus:border-gold rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none transition-all duration-200"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider" htmlFor="password">
                Password
              </label>
              <Link href="/auth/forgot-password" className="text-xs text-gold hover:text-white transition-colors duration-200">
                Forgot password?
              </Link>
            </div>
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
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-400">
          Don't have an account?{' '}
          <Link href="/auth/register" className="text-gold font-semibold hover:underline">
            Create account
          </Link>
        </p>
      </div>
    </main>
  );
}
