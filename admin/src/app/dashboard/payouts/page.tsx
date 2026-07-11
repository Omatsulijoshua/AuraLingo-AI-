'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface PayoutRequest {
  id: string;
  userId: string;
  amount: number;
  status: 'PROCESSING' | 'PROCESSED' | 'FAILED';
  transactionSlipUrl: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    referralBankName: string;
    referralAccountNumber: string;
    referralAccountName: string;
    referrals: Array<{
      id: string;
      payments: Array<{ id: string }>;
    }>;
  };
}

export default function PayoutManagement() {
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab state
  const [payoutsTab, setPayoutsTab] = useState<'untreated' | 'treated'>('untreated');

  // Form states for resolving request
  const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null);
  const [slipUrl, setSlipUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      const data = await api.request<PayoutRequest[]>('/admin/payouts');
      setPayouts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch payouts list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const data = await api.request<{ url: string }>('/admin/upload', {
        method: 'POST',
        body: formData,
      });
      setSlipUrl(data.url);
      alert('Receipt slip uploaded successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleResolvePayout = async (status: 'PROCESSED' | 'FAILED') => {
    if (!selectedPayout) return;
    setSubmitting(true);
    try {
      await api.request(`/admin/payouts/${selectedPayout.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          status,
          transactionSlipUrl: status === 'PROCESSED' ? slipUrl.trim() || null : null,
        }),
      });
      setSelectedPayout(null);
      setSlipUrl('');
      await fetchPayouts();
    } catch (err: any) {
      alert(err.message || 'Failed to resolve payout request');
    } finally {
      setSubmitting(false);
    }
  };

  const untreatedPayouts = payouts.filter((p) => p.status === 'PROCESSING');
  const treatedPayouts = payouts.filter((p) => p.status !== 'PROCESSING');
  const activePayouts = payoutsTab === 'untreated' ? untreatedPayouts : treatedPayouts;

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-primary/25 border border-primary-light/40 rounded-xl p-6 shadow-xl backdrop-blur-sm flex justify-between items-center">
        <div>
          <h2 className="text-white font-extrabold text-lg">Referral Payouts Management</h2>
          <p className="text-slate-400 text-xs mt-1">Review and process commission withdrawal requests from tutors and referred students.</p>
        </div>
        <button
          onClick={fetchPayouts}
          className="bg-primary-light/35 border border-primary-light text-slate-200 hover:text-white px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer"
        >
          Refresh List
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-center text-xs">
          {error}
        </div>
      )}

      {/* Main List */}
      <div className="bg-primary/20 border border-primary-light/40 rounded-xl overflow-hidden shadow-xl backdrop-blur-sm">
        
        {/* Tab Headers */}
        <div className="flex border-b border-primary-light/25 bg-navy/20 px-6 pt-4">
          <button
            onClick={() => setPayoutsTab('untreated')}
            className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              payoutsTab === 'untreated'
                ? 'border-gold text-gold font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Untreated Payouts ({untreatedPayouts.length})
          </button>
          <button
            onClick={() => setPayoutsTab('treated')}
            className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              payoutsTab === 'treated'
                ? 'border-gold text-gold font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Treated Payouts ({treatedPayouts.length})
          </button>
        </div>

        {loading ? (
          <div className="py-24 w-full flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activePayouts.length === 0 ? (
          <p className="text-slate-500 text-xs text-center py-24">No withdrawal requests found in this section.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase text-slate-400 bg-primary/40 border-b border-primary-light/40 font-bold">
                <tr>
                  <th className="px-6 py-4">Requesting User</th>
                  <th className="px-6 py-4">Bank Payout Info</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Telemetry (Referrals)</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-light/20 text-xs">
                {activePayouts.map((req) => {
                  const totalRefs = req.user?.referrals?.length || 0;
                  const paidRefs = req.user?.referrals?.filter((r) => r.payments?.length > 0).length || 0;
                  const trialRefs = totalRefs - paidRefs;

                  return (
                    <tr key={req.id} className="hover:bg-primary-light/10 transition-colors duration-200">
                      {/* Requesting User */}
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white font-bold">{req.user?.name || 'Unknown'}</p>
                          <p className="text-slate-500 text-[10px] mt-0.5">{req.user?.email}</p>
                          <p className="text-slate-500 text-[9px] mt-1 font-mono">ID: {req.id.slice(0, 8)}</p>
                        </div>
                      </td>

                      {/* Bank Payout Info */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="text-slate-300"><span className="text-slate-500">Bank:</span> {req.user?.referralBankName || '-'}</p>
                          <p className="text-slate-300"><span className="text-slate-500">Acct:</span> {req.user?.referralAccountNumber || '-'}</p>
                          <p className="text-slate-300"><span className="text-slate-500">Name:</span> {req.user?.referralAccountName || '-'}</p>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4">
                        <span className="text-gold font-extrabold text-sm">₦{req.amount.toLocaleString()}</span>
                      </td>

                      {/* Telemetry */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="text-slate-300 font-semibold">{totalRefs} Total Invites</p>
                          <p className="text-[10px]">
                            <span className="text-emerald font-bold">{paidRefs} Paid</span>
                            <span className="text-slate-500 mx-1.5">|</span>
                            <span className="text-amber-500 font-bold">{trialRefs} Trial</span>
                          </p>
                          {trialRefs > 0 && paidRefs === 0 && (
                            <span className="inline-block bg-red-500/10 text-red-400 border border-red-500/25 px-1.5 py-0.5 rounded text-[9px] font-bold">
                              ⚠️ High Fraud Risk (No Paid Ref)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                            req.status === 'PROCESSED'
                              ? 'bg-emerald/10 text-emerald border border-emerald/20'
                              : req.status === 'FAILED'
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : 'bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse'
                          }`}
                        >
                          {req.status}
                        </span>
                        {req.transactionSlipUrl && (
                          <a
                            href={req.transactionSlipUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-[10px] text-gold hover:underline mt-1.5 font-bold"
                          >
                            📄 View Receipt Slip
                          </a>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        {req.status === 'PROCESSING' ? (
                          <button
                            onClick={() => setSelectedPayout(req)}
                            className="bg-gold hover:bg-gold-dark text-primary px-3 py-1.5 rounded font-bold text-xs cursor-pointer transition-colors"
                          >
                            Process Payout
                          </button>
                        ) : (
                          <span className="text-slate-500 text-xs font-semibold">Completed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resolve Payout Modal */}
      {selectedPayout && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-primary border border-primary-light rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6">
            <div>
              <h3 className="text-white font-bold text-base">Resolve Payout Request</h3>
              <p className="text-slate-400 text-xs mt-1">Submit receipt details for payout of ₦{selectedPayout.amount.toLocaleString()} to {selectedPayout.user?.name}.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1.5">Transaction Receipt Slip</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://imgur.com/your-slip.png"
                    value={slipUrl}
                    onChange={(e) => setSlipUrl(e.target.value)}
                    className="flex-1 bg-navy/60 border border-primary-light/60 focus:border-gold rounded-lg px-3 py-2 text-white text-xs placeholder-slate-600 focus:outline-none"
                  />
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      disabled={uploading}
                    />
                    <button
                      type="button"
                      className="bg-primary-light/35 border border-primary-light text-slate-200 hover:text-white px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer"
                      disabled={uploading}
                    >
                      {uploading ? 'Uploading...' : '📁 Upload File'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-navy/40 p-4 rounded-xl border border-primary-light/10 space-y-2">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Account Details Recap</p>
                <div className="text-xs space-y-1 text-slate-300">
                  <p><span className="text-slate-500">Bank Name:</span> {selectedPayout.user?.referralBankName}</p>
                  <p><span className="text-slate-500">Account Number:</span> {selectedPayout.user?.referralAccountNumber}</p>
                  <p><span className="text-slate-500">Account Name:</span> {selectedPayout.user?.referralAccountName}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-primary-light/20">
              <button
                onClick={() => {
                  setSelectedPayout(null);
                  setSlipUrl('');
                }}
                className="bg-primary-light/35 text-slate-200 font-bold px-4 py-2 rounded-lg text-xs hover:text-white cursor-pointer"
                disabled={submitting}
              >
                Close
              </button>
              <button
                onClick={() => handleResolvePayout('FAILED')}
                className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-lg text-xs cursor-pointer"
                disabled={submitting || uploading}
              >
                Reject Payout
              </button>
              <button
                onClick={() => handleResolvePayout('PROCESSED')}
                className="bg-emerald hover:opacity-90 text-primary font-bold px-4 py-2 rounded-lg text-xs cursor-pointer"
                disabled={submitting || uploading}
              >
                {submitting ? 'Processing...' : 'Approve & Mark Paid'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
