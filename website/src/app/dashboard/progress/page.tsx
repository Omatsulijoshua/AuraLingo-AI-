'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function StudentProgressReport() {
  const [reportText, setReportText] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    try {
      const data = await api.request<{ report: string }>('/analytics/progress-report');
      setReportText(data.report);
    } catch (err: any) {
      setError(err.message || 'Failed to generate progress report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-semibold text-xs animate-pulse">AI is generating your improvement report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy text-white flex flex-col">
      <header className="h-16 border-b border-primary-light/30 bg-primary/45 backdrop-blur-md flex items-center justify-between px-8 md:px-16">
        <Link href="/dashboard" className="text-xl font-bold tracking-wider flex items-center gap-1.5">
          <span className="text-gold">BandUp</span> IELTS
        </Link>
        <Link href="/dashboard" className="text-xs font-bold text-slate-300 hover:text-gold transition-colors">
          Back to Dashboard
        </Link>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto p-8 space-y-8">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-center">
            {error}
          </div>
        )}

        <div className="bg-primary/25 border border-primary-light/40 rounded-2xl p-8 shadow-2xl space-y-6">
          <div className="flex justify-between items-center border-b border-primary-light/20 pb-4">
            <div>
              <h2 className="text-xl font-black">AI Tutor Progress Assessment</h2>
              <p className="text-slate-400 text-xs mt-1">Personalized calibration comparing your mock histories and weaknesses</p>
            </div>
            <button
              onClick={() => {
                setLoading(true);
                fetchReport();
              }}
              className="bg-gold hover:bg-gold-dark text-primary font-bold px-3 py-1.5 rounded text-xs transition-colors cursor-pointer"
            >
              Re-Analyze
            </button>
          </div>

          {/* Render markdown report text */}
          <div className="prose prose-invert max-w-none text-slate-200 text-xs leading-relaxed space-y-4 whitespace-pre-wrap font-sans bg-navy/40 p-6 rounded-xl border border-primary-light/10">
            {reportText}
          </div>
        </div>
      </main>
    </div>
  );
}
