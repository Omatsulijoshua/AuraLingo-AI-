'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [targetExam, setTargetExam] = useState<'ACADEMIC' | 'GENERAL'>('ACADEMIC');
  const [targetBand, setTargetBand] = useState<number>(7.0);
  const [referralCode, setReferralCode] = useState(searchParams.get('ref') || '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          password,
          targetExam,
          targetBand,
          role: 'STUDENT',
          referralCode: referralCode.trim() || undefined,
        }),
      });

      // Auto login on successful registration
      const loginData = await api.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      localStorage.setItem('accessToken', loginData.accessToken);
      localStorage.setItem('refreshToken', loginData.refreshToken);
      api.setUser(loginData.user);

      // Redirect directly to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-navy flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Decorative gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-primary-light/20 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-gold/10 blur-[120px]" />

      <div className="w-full max-w-md bg-primary/40 backdrop-blur-md border border-primary-light/40 rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-white tracking-wider flex items-center justify-center gap-2">
            <span className="text-gold">BandUp</span> IELTS
          </Link>
          <p className="text-slate-400 mt-2 text-sm">Create your free account to start practicing smarter.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2" htmlFor="name">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-navy/60 border border-primary-light/60 focus:border-gold rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none transition-all duration-200"
              placeholder="John Doe"
            />
          </div>

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
            <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2" htmlFor="password">
              Password (min 6 chars)
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

          <div>
            <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
              Select Target Exam Type
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setTargetExam('ACADEMIC')}
                className={`py-3 rounded-lg border font-semibold text-sm transition-all duration-200 cursor-pointer ${
                  targetExam === 'ACADEMIC'
                    ? 'bg-gold border-gold text-primary shadow-lg shadow-gold/10'
                    : 'bg-navy/60 border-primary-light/60 text-slate-300 hover:border-gold'
                }`}
              >
                Academic
              </button>
              <button
                type="button"
                onClick={() => setTargetExam('GENERAL')}
                className={`py-3 rounded-lg border font-semibold text-sm transition-all duration-200 cursor-pointer ${
                  targetExam === 'GENERAL'
                    ? 'bg-gold border-gold text-primary shadow-lg shadow-gold/10'
                    : 'bg-navy/60 border-primary-light/60 text-slate-300 hover:border-gold'
                }`}
              >
                General Training
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-slate-400 text-xs font-semibold">Target Band Score</label>
            <select
              value={targetBand}
              onChange={(e) => setTargetBand(parseFloat(e.target.value))}
              className="w-full bg-navy/60 border border-primary-light/60 focus:border-gold rounded-lg px-4 py-3 text-white focus:outline-none transition-all duration-200 text-sm font-semibold cursor-pointer"
            >
              {[4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0].map((b) => (
                <option key={b} value={b}>Band {b}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2" htmlFor="referralCode">
              Referral ID (Optional)
            </label>
            <input
              id="referralCode"
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              className="w-full bg-navy/60 border border-primary-light/60 focus:border-gold rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none transition-all duration-200"
              placeholder="e.g. USER-1234"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold hover:bg-gold-dark text-primary font-bold py-3.5 rounded-lg transition-all duration-200 shadow-lg shadow-gold/20 flex items-center justify-center disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-gold font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-navy flex items-center justify-center px-4 relative overflow-hidden">
        <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </main>
    }>
      <RegisterForm />
    </Suspense>
  );
}
