'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Stats {
  totalUsers: number;
  monthNewUsers: number;
  activeSubscribers: number;
  freeUsers: number;
  expiredSubscribers: number;
  lifetimeRevenue: number;
  monthRevenue: number;
  mockTestsTaken: number;
  writingSubmissions: number;
  speakingSubmissions: number;
  userGrowth: Array<{ month: string; count: number }>;
  selectedMonth: string;
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Month selector state
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  });

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const data = await api.request<Stats>(`/admin/stats?month=${selectedMonth}`);
        setStats(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch admin stats');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [selectedMonth]);

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-center">
        {error || 'Could not load statistics.'}
      </div>
    );
  }

  const statCards = [
    { name: 'Total Students', value: stats.totalUsers, description: 'Life-time registered students', color: 'border-l-blue-500' },
    { name: 'New Students (This Month)', value: stats.monthNewUsers, description: `Registrations in ${stats.selectedMonth}`, color: 'border-l-indigo-500' },
    { name: 'Active Subscriptions', value: stats.activeSubscribers, description: 'Premium accounts', color: 'border-l-gold' },
    { name: 'Free Users', value: stats.freeUsers, description: 'Free starter tier', color: 'border-l-slate-500' },
    { name: 'Lifetime Revenue', value: `₦${stats.lifetimeRevenue.toLocaleString()}`, description: 'Life-time earnings', color: 'border-l-emerald' },
    { name: 'Revenue (This Month)', value: `₦${stats.monthRevenue.toLocaleString()}`, description: `Earnings in ${stats.selectedMonth}`, color: 'border-l-teal-500' },
    { name: 'Mock Tests Taken', value: stats.mockTestsTaken, description: 'Completed test runs', color: 'border-l-purple-500' },
    { name: 'Writing Tasks', value: stats.writingSubmissions, description: 'Submitted tasks', color: 'border-l-pink-500' },
  ];

  return (
    <div className="space-y-8">
      {/* Month Filter Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-primary/25 border border-primary-light/30 rounded-2xl p-4 shadow-xl">
        <div>
          <h2 className="text-white font-extrabold text-lg">Performance Overview</h2>
          <p className="text-slate-400 text-xs mt-0.5">Filter statistics and monthly revenue breakdown</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Select Month:</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-primary-light/45 border border-primary-light/80 hover:border-gold/60 focus:border-gold rounded-lg px-4 py-2 text-sm font-bold text-white focus:outline-none cursor-pointer transition-all"
          />
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <div
            key={card.name}
            className={`bg-primary/30 border border-primary-light/40 border-l-4 ${card.color} rounded-xl p-6 shadow-xl backdrop-blur-sm`}
          >
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{card.name}</p>
            <p className="text-white text-3xl font-extrabold mt-3">{card.value}</p>
            <p className="text-slate-500 text-xs mt-2">{card.description}</p>
          </div>
        ))}
      </div>

      {/* Analytics Growth Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Growth List */}
        <div className="bg-primary/30 border border-primary-light/40 rounded-xl p-6 shadow-xl col-span-2">
          <h3 className="text-white font-bold text-base mb-6">Student Account Growth</h3>
          
          {stats.userGrowth.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-12">No student registrations recorded yet.</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 border-b border-primary-light/40 pb-2 text-xs font-semibold text-slate-400 uppercase">
                <span>Month</span>
                <span className="text-right">Sign Ups</span>
              </div>
              {stats.userGrowth.map((g) => (
                <div key={g.month} className="grid grid-cols-2 text-slate-300 text-sm font-semibold py-1.5 border-b border-primary-light/20 last:border-0">
                  <span>{g.month}</span>
                  <span className="text-right text-gold">{g.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-primary/30 border border-primary-light/40 rounded-xl p-6 shadow-xl space-y-4">
          <h3 className="text-white font-bold text-base mb-4">Quick Administrator Actions</h3>
          
          <button
            onClick={() => window.location.href = '/dashboard/users'}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-primary-light/40 hover:bg-gold hover:text-primary border border-primary-light text-slate-300 text-sm font-bold transition-all duration-200 cursor-pointer"
          >
            Manage Users
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            onClick={() => window.location.href = '/dashboard/settings'}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-primary-light/40 hover:bg-gold hover:text-primary border border-primary-light text-slate-300 text-sm font-bold transition-all duration-200 cursor-pointer"
          >
            Configure AI Provider
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
