'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function HistoryDashboard() {
  const [history, setHistory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'EXAM' | 'PRACTICE'>('EXAM');

  const fetchHistory = async () => {
    try {
      const data = await api.request<any>('/analytics/history');
      setHistory(data);
    } catch (err) {
      console.error('Failed to load history data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const logs = selectedTab === 'EXAM' ? history?.examMode : history?.practiceMode;

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

      <main className="flex-1 max-w-5xl w-full mx-auto p-8 space-y-8">
        
        {/* Toggle Mode */}
        <div className="flex justify-between items-center bg-primary/25 border border-primary-light/30 rounded-2xl p-4 shadow-xl">
          <div>
            <h2 className="text-white font-extrabold text-base">Attempt History Breakdown</h2>
            <p className="text-slate-400 text-xs mt-0.5">Review performance logs split by training format</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedTab('EXAM')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedTab === 'EXAM'
                  ? 'bg-gold text-primary shadow-lg shadow-gold/25'
                  : 'bg-navy/40 text-slate-400 hover:text-white'
              }`}
            >
              Exam Mode Logs
            </button>
            <button
              onClick={() => setSelectedTab('PRACTICE')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedTab === 'PRACTICE'
                  ? 'bg-gold text-primary shadow-lg shadow-gold/25'
                  : 'bg-navy/40 text-slate-400 hover:text-white'
              }`}
            >
              Practice Mode Logs
            </button>
          </div>
        </div>

        {/* Logs content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Mock Exams History */}
          <div className="bg-primary/20 border border-primary-light/25 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-white font-bold text-sm">Mock Test Attempts</h3>
            {logs?.mockExams?.length === 0 ? (
              <p className="text-slate-500 text-xs py-8 text-center">No mock exam attempts recorded under this mode.</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {logs.mockExams.map((exam: any) => (
                  <div key={exam.id} className="p-4 bg-navy/40 border border-primary-light/15 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-white">{exam.mockTest.title}</p>
                      <p className="text-[10px] text-slate-500 mt-1">{new Date(exam.startedAt).toLocaleDateString()} • {exam.status}</p>
                    </div>
                    {exam.overallBandEstimate ? (
                      <span className="bg-gold/15 text-gold border border-gold/20 px-2.5 py-1 rounded font-bold">
                        Band {exam.overallBandEstimate}
                      </span>
                    ) : (
                      <span className="text-slate-500">In Progress</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sectional Practice History */}
          <div className="bg-primary/20 border border-primary-light/25 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-white font-bold text-sm">Practice Answers (Listening & Reading)</h3>
            {logs?.practiceAnswers?.length === 0 ? (
              <p className="text-slate-500 text-xs py-8 text-center">No practice answers logged under this mode.</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {logs.practiceAnswers.map((ans: any) => (
                  <div key={ans.id} className="p-4 bg-navy/40 border border-primary-light/15 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">{ans.question.module.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        ans.isCorrect ? 'bg-emerald/10 text-emerald' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {ans.isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>
                    <p className="text-slate-300 line-clamp-2">{ans.question.questionText}</p>
                    <p className="text-[10px] text-slate-500">Submitted: {new Date(ans.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Writing Submissions History */}
          <div className="bg-primary/20 border border-primary-light/25 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-white font-bold text-sm">Writing Practice Submissions</h3>
            {logs?.writing?.length === 0 ? (
              <p className="text-slate-500 text-xs py-8 text-center">No writing evaluations recorded under this mode.</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {logs.writing.map((sub: any) => (
                  <div key={sub.id} className="p-4 bg-navy/40 border border-primary-light/15 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-white">{sub.prompt.title}</p>
                      <p className="text-[10px] text-slate-500 mt-1">{sub.wordCount} words • {new Date(sub.createdAt).toLocaleDateString()}</p>
                    </div>
                    {sub.bandScoreEstimate ? (
                      <span className="bg-gold/15 text-gold border border-gold/20 px-2.5 py-1 rounded font-bold">
                        Band {sub.bandScoreEstimate}
                      </span>
                    ) : (
                      <span className="text-slate-500">Grading...</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Speaking Submissions History */}
          <div className="bg-primary/20 border border-primary-light/25 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-white font-bold text-sm">Speaking Feedback History</h3>
            {logs?.speaking?.length === 0 ? (
              <p className="text-slate-500 text-xs py-8 text-center">No speaking recordings found under this mode.</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {logs.speaking.map((sub: any) => (
                  <div key={sub.id} className="p-4 bg-navy/40 border border-primary-light/15 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-white">{sub.prompt.topic}</p>
                      <p className="text-[10px] text-slate-500 mt-1">Part {sub.prompt.part} • {new Date(sub.createdAt).toLocaleDateString()}</p>
                    </div>
                    {sub.bandScoreEstimate ? (
                      <span className="bg-gold/15 text-gold border border-gold/20 px-2.5 py-1 rounded font-bold">
                        Band {sub.bandScoreEstimate}
                      </span>
                    ) : (
                      <span className="text-slate-500">Processing...</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
