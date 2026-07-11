'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: 'OPEN' | 'RESOLVED' | 'CLOSED';
  reply: string | null;
  createdAt: string;
}

export default function StudentSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New ticket form state
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = async () => {
    try {
      const data = await api.request<Ticket[]>('/support/tickets');
      setTickets(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setSubmitting(true);
    try {
      await api.request('/support/tickets', {
        method: 'POST',
        body: JSON.stringify({ subject, message }),
      });
      alert('Support ticket submitted successfully! Tutors will review and respond shortly.');
      setSubject('');
      setMessage('');
      await fetchTickets();
    } catch (err: any) {
      alert(err.message || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
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
          Back to Practice
        </Link>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-8 space-y-8">
        <div>
          <h2 className="text-2xl font-black">💬 Help & Support Tickets</h2>
          <p className="text-slate-400 text-xs mt-1">Submit support requests to administrators or check responses from tutors.</p>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-center text-xs">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Submit New Ticket Form */}
          <div className="bg-primary/25 border border-primary-light/30 rounded-2xl p-6 shadow-xl space-y-4 h-fit">
            <h3 className="text-white font-bold text-base">Submit a Ticket</h3>
            <form onSubmit={handleSubmitTicket} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1.5">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Subscription issue, Speaking feedback lag"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-navy border border-primary-light focus:border-gold rounded-lg px-3 py-2 text-xs text-white focus:outline-none placeholder-slate-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1.5">Describe your issue</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Provide details about the issue you are facing..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-navy border border-primary-light focus:border-gold rounded-lg px-3 py-2 text-xs text-white focus:outline-none placeholder-slate-500"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gold hover:bg-gold-dark text-primary font-bold py-2.5 rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-40"
              >
                {submitting ? 'Submitting...' : 'Submit Support Ticket'}
              </button>
            </form>
          </div>

          {/* Ticket History */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-white font-bold text-base">My Tickets</h3>
            {tickets.length === 0 ? (
              <div className="p-8 bg-primary/10 border border-primary-light/20 rounded-2xl text-center text-slate-400 text-xs">
                You have not submitted any support tickets yet.
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="bg-primary/15 border border-primary-light/25 rounded-2xl p-5 shadow-lg space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm text-white">{ticket.subject}</h4>
                        <span className="text-[9px] text-slate-500">
                          Submitted on {new Date(ticket.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded text-[9px] font-bold ${
                          ticket.status === 'OPEN'
                            ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                            : ticket.status === 'RESOLVED'
                            ? 'bg-emerald/10 text-emerald border border-emerald/20'
                            : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </div>

                    <p className="text-slate-300 text-xs leading-relaxed bg-navy/40 p-3 rounded-lg border border-primary-light/5">
                      {ticket.message}
                    </p>

                    {ticket.reply && (
                      <div className="bg-emerald/5 border-l-2 border-emerald p-3 rounded-r-lg space-y-1">
                        <span className="text-[9px] text-emerald font-bold uppercase tracking-wider">Tutor/Admin Response:</span>
                        <p className="text-slate-200 text-xs leading-relaxed">{ticket.reply}</p>
                      </div>
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
