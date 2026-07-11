'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
}

interface Plan {
  name: string;
  code: string;
  price: number;
}

interface SubscriptionLog {
  id: string;
  userId: string;
  user: User;
  planId: string;
  plan: Plan;
  status: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export default function AdminSubscriptionsHistoryPage() {
  const [logs, setLogs] = useState<SubscriptionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and Date range states
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      let url = '/subscriptions/admin/history';
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.append('searchTerm', searchTerm.trim());
      if (startDate) params.append('startDate', new Date(startDate).toISOString());
      if (endDate) params.append('endDate', new Date(endDate).toISOString());
      
      const queryStr = params.toString();
      if (queryStr) url += `?${queryStr}`;

      const data = await api.request<SubscriptionLog[]>(url);
      setLogs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load subscription history');
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
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setTimeout(() => {
      setLoading(true);
      api.request<SubscriptionLog[]>('/subscriptions/admin/history')
        .then(setLogs)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }, 50);
  };

  return (
    <div className="flex-1 bg-navy text-white p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-black">📋 Subscriptions History Database</h2>
        <p className="text-slate-400 text-xs mt-1">Audit logs of all student subscription plans, pricing tiers, and active timelines.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs text-center">
          {error}
        </div>
      )}

      {/* Filters Toolbar */}
      <form onSubmit={handleFilterSubmit} className="bg-primary/25 border border-primary-light/30 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1.5">Search Student</label>
            <input
              type="text"
              placeholder="Search by student name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-navy border border-primary-light focus:border-gold rounded-lg px-3 py-2 text-xs text-white focus:outline-none placeholder-slate-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1.5">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-navy border border-primary-light focus:border-gold rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1.5">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-navy border border-primary-light focus:border-gold rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-primary-light/10">
          <button
            type="button"
            onClick={handleClearFilters}
            className="bg-primary/20 hover:bg-primary/30 text-slate-300 font-bold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer border border-primary-light/10"
          >
            Clear Filters
          </button>
          <button
            type="submit"
            className="bg-gold hover:bg-gold-dark text-primary font-bold px-6 py-2 rounded-lg text-xs transition-colors cursor-pointer"
          >
            🔍 Search & Filter
          </button>
        </div>
      </form>

      {/* Logs Table */}
      <div className="bg-primary/20 border border-primary-light/25 rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-16 flex justify-center">
            <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-slate-500 text-xs py-16 text-center">No subscription logs found matching your filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-primary/45 border-b border-primary-light/20 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Subscription Plan</th>
                  <th className="px-6 py-4">Timeline</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Processed Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-light/10">
                {logs.map((log) => {
                  const status = log.status;
                  return (
                    <tr key={log.id} className="hover:bg-primary/5 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-white">{log.user.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{log.user.email}</p>
                      </td>
                      <td className="px-6 py-4 font-bold text-white">
                        {log.plan.name} <span className="text-[10px] text-slate-400 font-mono">({log.plan.code})</span>
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        <span className="font-semibold text-emerald">{new Date(log.startDate).toLocaleDateString()}</span>
                        <span className="text-slate-500"> to </span>
                        <span className="font-semibold text-rose-400">{new Date(log.endDate).toLocaleDateString()}</span>
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
    </div>
  );
}
