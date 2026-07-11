'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface User {
  name: string;
  email: string;
}

interface Ticket {
  id: string;
  userId: string;
  user: User;
  subject: string;
  message: string;
  status: 'OPEN' | 'RESOLVED' | 'CLOSED';
  reply: string | null;
  createdAt: string;
}

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Reply state
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const fetchTickets = async () => {
    try {
      const data = await api.request<Ticket[]>('/support/admin/tickets');
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

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicketId || !replyText.trim()) return;

    setSubmittingReply(true);
    try {
      await api.request(`/support/admin/tickets/${activeTicketId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ reply: replyText.trim() }),
      });
      alert('Response sent successfully! Ticket marked as RESOLVED.');
      setReplyText('');
      setActiveTicketId(null);
      await fetchTickets();
    } catch (err: any) {
      alert(err.message || 'Failed to send response');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleCloseTicket = async (ticketId: string) => {
    if (!confirm('Are you sure you want to close this ticket?')) return;

    try {
      await api.request(`/support/admin/tickets/${ticketId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'CLOSED' }),
      });
      alert('Ticket marked as CLOSED.');
      await fetchTickets();
    } catch (err: any) {
      alert(err.message || 'Failed to close ticket');
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesStatus = statusFilter === 'ALL' || ticket.status === statusFilter;
    const matchesSearch =
      ticket.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex-1 bg-navy text-white flex items-center justify-center min-h-[500px]">
        <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-navy text-white p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-black">💬 Support Tickets</h2>
        <p className="text-slate-400 text-xs mt-1">Review student issues, write responses, and manage ticket lifecycle.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs text-center">
          {error}
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-primary/25 border border-primary-light/30 rounded-2xl p-4 shadow-xl">
        <div className="flex gap-2">
          {['ALL', 'OPEN', 'RESOLVED', 'CLOSED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === status
                  ? 'bg-gold text-primary shadow-md shadow-gold/10'
                  : 'bg-navy/60 text-slate-400 hover:text-white border border-primary-light/10'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search by student, subject, or message..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-navy border border-primary-light focus:border-gold rounded-lg px-4 py-2 text-xs text-white focus:outline-none placeholder-slate-500 min-w-[280px]"
        />
      </div>

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <div className="p-16 bg-primary/10 border border-primary-light/20 rounded-2xl text-center text-slate-400 text-xs">
          No support tickets matched your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-primary/20 border border-primary-light/35 rounded-2xl p-6 shadow-xl space-y-4"
            >
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3">
                    <h4 className="font-extrabold text-base text-white">{ticket.subject}</h4>
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
                  <p className="text-xs text-slate-400 mt-1.5">
                    From <span className="font-bold text-white">{ticket.user.name}</span> ({ticket.user.email}) ·{' '}
                    {new Date(ticket.createdAt).toLocaleString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {ticket.status === 'OPEN' && (
                    <button
                      onClick={() => setActiveTicketId(ticket.id)}
                      className="bg-gold hover:bg-gold-dark text-primary font-bold px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      ✍️ Reply
                    </button>
                  )}
                  {ticket.status !== 'CLOSED' && (
                    <button
                      onClick={() => handleCloseTicket(ticket.id)}
                      className="bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      🔒 Close Ticket
                    </button>
                  )}
                </div>
              </div>

              {/* Message Details */}
              <p className="text-slate-300 text-xs leading-relaxed bg-navy/40 p-4 rounded-xl border border-primary-light/5">
                {ticket.message}
              </p>

              {/* Response Display */}
              {ticket.reply && (
                <div className="bg-emerald/5 border-l-2 border-emerald p-4 rounded-r-xl space-y-1">
                  <span className="text-[10px] text-emerald font-bold uppercase tracking-wider">Replied Response:</span>
                  <p className="text-slate-200 text-xs leading-relaxed">{ticket.reply}</p>
                </div>
              )}

              {/* Reply Form Modal / Inline Box */}
              {activeTicketId === ticket.id && (
                <form onSubmit={handleReplySubmit} className="bg-navy/85 border border-primary-light/60 rounded-xl p-4 mt-2 space-y-3">
                  <span className="text-xs font-bold text-slate-300">Reply to this issue:</span>
                  <textarea
                    required
                    rows={4}
                    placeholder="Type your response to the student issue..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full bg-navy border border-primary-light focus:border-gold rounded-lg px-3 py-2 text-xs text-white focus:outline-none placeholder-slate-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTicketId(null)}
                      className="bg-primary/20 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-primary/30"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingReply}
                      className="bg-gold hover:bg-gold-dark text-primary font-bold px-4 py-1.5 rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-40"
                    >
                      {submittingReply ? 'Sending...' : 'Send Response'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
