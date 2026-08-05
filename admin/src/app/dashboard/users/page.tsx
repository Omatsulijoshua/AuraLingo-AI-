'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface PlanItem {
  id: string;
  name: string;
  code: string;
  price: number;
}

interface UserItem {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'TUTOR' | 'STUDENT';
  targetExam: 'ACADEMIC' | 'GENERAL';
  targetBand: number;
  studyStreak: number;
  isVerified: boolean;
  createdAt: string;
  subscriptions: Array<{ plan: { id: string; name: string; code: string } }>;
}

const MOCK_AURALINGO_STUDENTS: UserItem[] = [
  {
    id: 'usr-1',
    name: 'Alex Rivera',
    email: 'alex@auralingo.ai',
    role: 'STUDENT',
    targetExam: 'ACADEMIC',
    targetBand: 8,
    studyStreak: 7,
    isVerified: true,
    createdAt: '2026-08-01T10:00:00Z',
    subscriptions: [{ plan: { id: 'p-pro', name: 'AuraLingo Pro AI Unlimited', code: 'PRO_MONTHLY' } }]
  },
  {
    id: 'usr-2',
    name: 'Sofia Chen',
    email: 'sofia.c@gmail.com',
    role: 'STUDENT',
    targetExam: 'GENERAL',
    targetBand: 7,
    studyStreak: 14,
    isVerified: true,
    createdAt: '2026-07-28T14:20:00Z',
    subscriptions: [{ plan: { id: 'p-pro', name: 'AuraLingo Pro AI Unlimited', code: 'PRO_MONTHLY' } }]
  },
  {
    id: 'usr-3',
    name: 'Mateo Rossi',
    email: 'mateo@rossi.it',
    role: 'STUDENT',
    targetExam: 'ACADEMIC',
    targetBand: 8,
    studyStreak: 3,
    isVerified: false,
    createdAt: '2026-08-04T09:15:00Z',
    subscriptions: []
  }
];

export default function AuraLingoUserManagement() {
  const [users, setUsers] = useState<UserItem[]>(MOCK_AURALINGO_STUDENTS);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const toggleVerification = (userId: string, currentStatus: boolean) => {
    setUpdatingId(userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, isVerified: !currentStatus } : u));
    setTimeout(() => setUpdatingId(null), 300);
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter ? u.role === roleFilter : true;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6 text-purple-50">
      {/* Search & Filter Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-primary/80 p-5 rounded-2xl border border-primary-light/60 backdrop-blur-md shadow-xl">
        <div className="flex-1 max-w-md flex gap-2">
          <input
            type="text"
            placeholder="Search AuraLingo learners by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-navy/80 border border-purple-900/60 focus:border-amethyst rounded-xl px-4 py-2.5 text-white placeholder-purple-400/50 focus:outline-none transition-all text-sm"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-navy/80 border border-purple-900/60 focus:border-amethyst rounded-xl px-4 py-2.5 text-white focus:outline-none text-sm transition-all"
          >
            <option value="">All Learner Roles</option>
            <option value="STUDENT">Active Student</option>
            <option value="TUTOR">Human Coach / Examiner</option>
            <option value="ADMIN">Platform Admin</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-primary/80 border border-primary-light/60 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-purple-200">
            <thead className="text-xs uppercase text-purple-300/70 bg-navy/80 border-b border-primary-light/60 font-black">
              <tr>
                <th className="px-6 py-4">Learner Profile</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Target Language & CEFR</th>
                <th className="px-6 py-4">Active AI Subscription</th>
                <th className="px-6 py-4">Verification</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-900/40">
              {filteredUsers.map((user) => {
                const currentSub = user.subscriptions[0];
                return (
                  <tr key={user.id} className="hover:bg-primary-light/30 transition-all duration-200">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white font-bold text-sm">{user.name}</p>
                        <p className="text-purple-300/60 text-xs mt-0.5">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-amethyst/20 text-amethyst-light border border-amethyst/30 text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🇪🇸</span>
                        <span className="text-xs font-bold text-white">Spanish (B2)</span>
                        <span className="text-[10px] text-coral font-black bg-coral/10 px-2 py-0.5 rounded border border-coral/20">
                          🔥 {user.studyStreak}d Streak
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-emerald bg-emerald/10 border border-emerald/20 px-2.5 py-1 rounded-full">
                        {currentSub?.plan.name || 'AuraLingo Pro AI'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase border ${
                        user.isVerified ? 'bg-emerald/10 text-emerald border-emerald/30' : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}>
                        {user.isVerified ? 'Verified Learner' : 'Pending Verification'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        disabled={updatingId === user.id}
                        onClick={() => toggleVerification(user.id, user.isVerified)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer ${
                          user.isVerified
                            ? 'border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300'
                            : 'border border-emerald/30 bg-emerald/10 hover:bg-emerald/20 text-emerald'
                        }`}
                      >
                        {user.isVerified ? 'Revoke Access' : 'Verify Learner'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
