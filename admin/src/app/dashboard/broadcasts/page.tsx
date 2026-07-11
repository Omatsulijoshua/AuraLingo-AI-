'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';

export default function BroadcastNotification() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetRole, setTargetRole] = useState<'ALL' | 'STUDENT' | 'TUTOR' | 'ADMIN'>('ALL');
  const [type, setType] = useState<'ANNOUNCEMENT' | 'NEW_LESSON' | 'PAYMENT' | 'REMINDER'>('ANNOUNCEMENT');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const response = await api.request<{ message: string }>('/admin/broadcast-notification', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          targetRole,
          type,
        }),
      });

      setSuccessMsg(response.message || 'Notification broadcasted successfully!');
      setTitle('');
      setMessage('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to broadcast notification.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Title Header */}
      <div className="bg-primary/25 border border-primary-light/40 rounded-xl p-6 shadow-xl backdrop-blur-sm">
        <h2 className="text-white font-extrabold text-lg">Send Broadcast Notification</h2>
        <p className="text-slate-400 text-xs mt-1">Send a push/in-app notification directly to a group of users or all users in the system.</p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald/10 border border-emerald/20 text-emerald rounded-xl text-center text-xs font-bold animate-pulse">
          🎉 {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-center text-xs">
          {errorMsg}
        </div>
      )}

      <div className="bg-primary/20 border border-primary-light/40 rounded-xl p-6 shadow-xl backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider">Notification Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. New Mock Exam Available!"
              className="w-full bg-navy/60 border border-primary-light/60 focus:border-gold rounded-lg px-4 py-2.5 text-white text-xs placeholder-slate-600 focus:outline-none transition-colors"
              required
            />
          </div>

          {/* Message Body */}
          <div className="space-y-2">
            <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider">Message Body</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write the message details here..."
              rows={5}
              className="w-full bg-navy/60 border border-primary-light/60 focus:border-gold rounded-lg px-4 py-2.5 text-white text-xs placeholder-slate-600 focus:outline-none transition-colors resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Target Group */}
            <div className="space-y-2">
              <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider">Target Audience</label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value as any)}
                className="w-full bg-navy/60 border border-primary-light/60 focus:border-gold rounded-lg px-3 py-2.5 text-white text-xs focus:outline-none"
              >
                <option value="ALL">All Users (Students, Tutors, Admins)</option>
                <option value="STUDENT">Students Only</option>
                <option value="TUTOR">Tutors / Examiners Only</option>
                <option value="ADMIN">Administrators Only</option>
              </select>
            </div>

            {/* Notification Type */}
            <div className="space-y-2">
              <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider">Category / Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full bg-navy/60 border border-primary-light/60 focus:border-gold rounded-lg px-3 py-2.5 text-white text-xs focus:outline-none"
              >
                <option value="ANNOUNCEMENT">Announcement</option>
                <option value="NEW_LESSON">New Lesson / Practice</option>
                <option value="PAYMENT">Billing & Payment</option>
                <option value="REMINDER">Study Reminder</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-primary-light/20 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-gold hover:bg-gold-dark text-primary font-bold px-6 py-2.5 rounded-lg text-xs transition-colors duration-200 cursor-pointer shadow-lg shadow-gold/10 disabled:opacity-50"
            >
              {loading ? 'Broadcasting...' : '📢 Send Broadcast Notification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
