'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

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
  subscriptions: Array<{ plan: { name: string; code: string } }>;
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const query = [];
      if (search) query.push(`search=${encodeURIComponent(search)}`);
      if (roleFilter) query.push(`role=${encodeURIComponent(roleFilter)}`);
      const queryString = query.length ? `?${query.join('&')}` : '';

      const data = await api.request<UserItem[]>(`/admin/users${queryString}`);
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const toggleVerification = async (userId: string, currentStatus: boolean) => {
    setUpdatingId(userId);
    try {
      await api.request(`/admin/users/${userId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ isVerified: !currentStatus }),
      });
      // Refresh list
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update user verification');
    } finally {
      setUpdatingId(null);
    }
  };

  const changeRole = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    try {
      await api.request(`/admin/users/${userId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole }),
      });
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update user role');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-primary/20 p-5 rounded-xl border border-primary-light/40 backdrop-blur-sm shadow-xl">
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md flex gap-2">
          <input
            type="text"
            placeholder="Search students by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-navy/60 border border-primary-light/60 focus:border-gold rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none transition-colors duration-200 text-sm"
          />
          <button
            type="submit"
            className="bg-gold hover:bg-gold-dark text-primary px-4 py-2 rounded-lg font-bold text-sm transition-colors duration-200 cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-navy/60 border border-primary-light/60 focus:border-gold rounded-lg px-4 py-2.5 text-white focus:outline-none text-sm transition-colors duration-200"
          >
            <option value="">All Roles</option>
            <option value="STUDENT">Student</option>
            <option value="TUTOR">Examiner / Tutor</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-center">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-primary/20 border border-primary-light/40 rounded-xl overflow-hidden shadow-xl backdrop-blur-sm">
        {loading ? (
          <div className="py-24 w-full flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-24">No users found matching search criteria.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase text-slate-400 bg-primary/40 border-b border-primary-light/40 font-bold">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Target Exam / Band</th>
                  <th className="px-6 py-4">Active Subscription</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-light/20">
                {users.map((user) => {
                  const currentSub = user.subscriptions[0];
                  return (
                    <tr key={user.id} className="hover:bg-primary-light/10 transition-colors duration-200">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white font-bold">{user.name}</p>
                          <p className="text-slate-500 text-xs mt-0.5">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          disabled={updatingId === user.id || user.role === 'SUPER_ADMIN'}
                          value={user.role}
                          onChange={(e) => changeRole(user.id, e.target.value)}
                          className="bg-navy/80 border border-primary-light/40 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-gold"
                        >
                          <option value="STUDENT">Student</option>
                          <option value="TUTOR">Tutor / Examiner</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        {user.role === 'STUDENT' ? (
                          <div>
                            <span className="bg-primary-light/40 text-slate-300 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                              {user.targetExam.replace('_', ' ')}
                            </span>
                            <span className="text-gold font-bold text-xs ml-2">Band {user.targetBand}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {currentSub ? (
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            currentSub.plan.code === 'FREE'
                              ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                              : 'bg-gold/15 text-gold border border-gold/30'
                          }`}>
                            {currentSub.plan.name}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs">No Plan</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          user.isVerified ? 'bg-emerald/10 text-emerald' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {user.isVerified ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          disabled={updatingId === user.id || user.role === 'SUPER_ADMIN'}
                          onClick={() => toggleVerification(user.id, user.isVerified)}
                          className={`text-xs font-bold px-3 py-1.5 rounded transition-all duration-200 cursor-pointer ${
                            user.isVerified
                              ? 'border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400'
                              : 'border border-emerald/20 bg-emerald/5 hover:bg-emerald/10 text-emerald'
                          } disabled:opacity-50`}
                        >
                          {user.isVerified ? 'Revoke Verify' : 'Verify'}
                        </button>
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
