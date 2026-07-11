'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

interface Plan {
  name: string;
  code: string;
  price: number;
}

interface SubscriptionLog {
  id: string;
  planId: string;
  plan: Plan;
  status: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export default function BillingHistoryPage() {
  const [logs, setLogs] = useState<SubscriptionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date range picker states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      let url = '/subscriptions/history';
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', new Date(startDate).toISOString());
      if (endDate) params.append('endDate', new Date(endDate).toISOString());
      
      const queryStr = params.toString();
      if (queryStr) url += `?${queryStr}`;

      const data = await api.request<SubscriptionLog[]>(url);
      setLogs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load billing history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHistory();
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    // We fetch again with empty filters
    setTimeout(() => {
      setLoading(true);
      api.request<SubscriptionLog[]>('/subscriptions/history')
        .then(setLogs)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }, 50);
  };

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
        <div>
          <h2 className="text-2xl font-black">💳 Billing & Subscriptions History</h2>
          <p className="text-slate-400 text-xs mt-1">Review all your previous subscription plan logs, activation dates, and pricing.</p>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs text-center">
            {error}
          </div>
        )}

        {/* Date Time Picker Filter Panel */}
        <form onSubmit={handleFilterSubmit} className="bg-primary/25 border border-primary-light/30 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1.5">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-navy border border-primary-light focus:border-gold rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1.5">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-navy border border-primary-light focus:border-gold rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-gold hover:bg-gold-dark text-primary font-bold px-5 py-2.5 rounded-lg text-xs transition-colors cursor-pointer"
              >
                🔍 Filter
              </button>
              <button
                type="button"
                onClick={handleClearFilters}
                className="bg-primary/20 hover:bg-primary/30 text-slate-300 font-bold px-4 py-2.5 rounded-lg text-xs transition-colors cursor-pointer border border-primary-light/10"
              >
                Clear
              </button>
            </div>
          </div>
        </form>

        {/* Logs Table */}
        <div className="bg-primary/20 border border-primary-light/25 rounded-2xl shadow-xl overflow-hidden">
          {loading ? (
            <div className="p-16 flex justify-center">
              <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <p className="text-slate-500 text-xs py-16 text-center">No subscription logs found for the selected date range.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-primary/45 border-b border-primary-light/20 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                    <th className="px-6 py-4">Subscription Plan</th>
                    <th className="px-6 py-4">Start Date</th>
                    <th className="px-6 py-4">End Date</th>
                    <th className="px-6 py-4">Amount Paid</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Purchased At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-light/10">
                  {logs.map((log) => {
                    const status = log.status;
                    return (
                      <tr key={log.id} className="hover:bg-primary/5 transition-colors">
                        <td className="px-6 py-4 font-bold text-white">
                          {log.plan.name} <span className="text-[10px] text-slate-400 font-mono">({log.plan.code})</span>
                        </td>
                        <td className="px-6 py-4 text-slate-300">
                          {new Date(log.startDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-slate-300">
                          {new Date(log.endDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 font-bold text-gold">
                          ₦{log.plan.price.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              status === 'ACTIVE'
                                ? 'bg-emerald/10 text-emerald border border-emerald/20'
                                : status === 'EXPIRED'
                                ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
