'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function ReferralDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verification Form
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Withdrawal Form
  const [withdrawAmount, setWithdrawAmount] = useState(1000);
  const [withdrawing, setWithdrawing] = useState(false);

  // Month Picker Filter
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${mm}`;
  });

  const fetchStats = async () => {
    try {
      const data = await api.request('/referrals/stats');
      setStats(data);
      if (data.bankName) setBankName(data.bankName);
      if (data.accountNumber) setAccountNumber(data.accountNumber);
      if (data.accountName) setAccountName(data.accountName);
    } catch (err: any) {
      setError(err.message || 'Failed to load referral statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    try {
      await api.request('/referrals/verify', {
        method: 'POST',
        body: JSON.stringify({ bankName, accountNumber, accountName }),
      });
      alert('Billing bank account details verified successfully!');
      await fetchStats();
    } catch (err: any) {
      alert(err.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawing(true);
    try {
      await api.request('/referrals/withdraw', {
        method: 'POST',
        body: JSON.stringify({ amount: Number(withdrawAmount) }),
      });
      alert('Withdrawal request submitted successfully! Processing in 24 hours.');
      setWithdrawAmount(1000);
      await fetchStats();
    } catch (err: any) {
      alert(err.message || 'Withdrawal request failed');
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const referralLink = typeof window !== 'undefined' ? `${window.location.origin}/auth/register?ref=${stats?.userId || 'your-id'}` : '';

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
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-center">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Earnings Overview */}
          <div className="bg-primary/25 border border-primary-light/30 rounded-2xl p-6 shadow-xl space-y-4 md:col-span-2">
            <h3 className="text-white font-bold text-base">Referral Earnings Dashboard</h3>
            
            {/* Extended Balances Info */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-navy/40 p-4 rounded-xl border border-primary-light/20">
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Total Balance</p>
                <p className="text-white text-xl font-black mt-1">₦{stats?.referralBalance?.toLocaleString() || '0'}</p>
              </div>
              <div className="bg-navy/40 p-4 rounded-xl border border-emerald-500/10">
                <p className="text-emerald text-[10px] uppercase font-bold tracking-wider">Withdrawable</p>
                <p className="text-gold text-xl font-black mt-1">₦{stats?.withdrawableBalance?.toLocaleString() || '0'}</p>
              </div>
              <div className="bg-navy/40 p-4 rounded-xl border border-amber-500/10">
                <p className="text-amber-500 text-[10px] uppercase font-bold tracking-wider">Pending</p>
                <p className="text-amber-500 text-xl font-black mt-1">₦{stats?.lockedBalance?.toLocaleString() || '0'}</p>
              </div>
              <div className="bg-navy/40 p-4 rounded-xl border border-green-500/10">
                <p className="text-green-400 text-[10px] uppercase font-bold tracking-wider">This Month</p>
                <p className="text-green-400 text-xl font-black mt-1">₦{stats?.madeThisMonth?.toLocaleString() || '0'}</p>
              </div>
            </div>

            <div className="bg-navy/40 p-4 rounded-xl border border-primary-light/20 space-y-2">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Your Unique Referral Link</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={referralLink}
                  className="w-full bg-navy border border-primary-light rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(referralLink);
                    alert('Referral link copied to clipboard!');
                  }}
                  className="bg-gold hover:bg-gold-dark text-primary font-bold px-4 py-2 rounded-lg text-xs transition-colors shrink-0 cursor-pointer"
                >
                  Copy
                </button>
              </div>
              <p className="text-[10px] text-slate-500">
                🚨 Earn ₦1,000 for every signup! Payouts become **Withdrawable** as soon as your referee activates a paid plan (keeps the system safe from spam).
              </p>
            </div>
          </div>

          {/* Withdraw Request */}
          <div className="bg-primary/25 border border-primary-light/30 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-white font-bold text-base">Request Payout</h3>
            {stats?.isReferralVerified ? (
              <form onSubmit={handleWithdraw} className="space-y-4">
                <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 p-3 rounded-lg text-[10px] leading-relaxed">
                  ℹ️ <strong>Payout Schedule Notice:</strong> Payout requests are verified and paid on the <strong>21st of every month</strong>. You can only have one active request at a time.
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-2">Withdrawal Amount (₦)</label>
                  <input
                    type="number"
                    min="500"
                    step="100"
                    required
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                    className="w-full bg-navy border border-primary-light focus:border-gold rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none text-center font-bold"
                  />
                  <p className="text-[9px] text-slate-500 mt-2 text-center">
                    Maximum withdrawable right now: ₦{stats?.withdrawableBalance?.toLocaleString()}
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={withdrawing || (stats?.withdrawableBalance || 0) < withdrawAmount}
                  className="w-full bg-gold hover:bg-gold-dark text-primary font-bold py-2.5 rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-40"
                >
                  {withdrawing ? 'Processing Withdrawal...' : 'Request Payout'}
                </button>
              </form>
            ) : (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-lg text-center text-xs space-y-2">
                <p className="font-bold">Verification Required</p>
                <p>You must fill in your bank details on the verification panel before you can request withdrawals.</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Bank Details Verification */}
          <div className="bg-primary/25 border border-primary-light/30 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-white font-bold text-base">Payout Bank Account</h3>
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1.5">Bank Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Opay, Kuda, GTBank"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full bg-navy border border-primary-light focus:border-gold rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1.5">Account Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 8158075936"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full bg-navy border border-primary-light focus:border-gold rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1.5">Account Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Joshua Omatsuli"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full bg-navy border border-primary-light focus:border-gold rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={verifying}
                className="w-full bg-emerald text-primary font-bold py-2 rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {verifying ? 'Updating Account...' : 'Save Bank Account'}
              </button>
            </form>
          </div>

          {/* Referred signups history & Withdrawal logs */}
          <div className="bg-primary/25 border border-primary-light/30 rounded-2xl p-6 shadow-xl md:col-span-2 space-y-6">
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <h4 className="text-white font-bold text-sm">Your Referrals List</h4>
                
                {/* Month Picker */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-505 uppercase font-black">Filter Month:</span>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-navy border border-primary-light/45 focus:border-gold rounded-lg px-2.5 py-1 text-[11px] text-white focus:outline-none cursor-pointer"
                  />
                </div>
              </div>

              {(() => {
                const filtered = stats?.referralsList?.filter((refUser: any) => {
                  if (!selectedMonth) return true;
                  const refDate = new Date(refUser.createdAt);
                  const mm = String(refDate.getMonth() + 1).padStart(2, '0');
                  const referralMonth = `${refDate.getFullYear()}-${mm}`;
                  return referralMonth === selectedMonth;
                }) || [];

                if (filtered.length === 0) {
                  return <p className="text-slate-500 text-xs py-6 text-center">No referred signups found for this month.</p>;
                }

                return (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {filtered.map((refUser: any) => (
                      <div key={refUser.id} className="p-3 bg-navy/40 border border-primary-light/20 rounded-lg flex justify-between text-xs items-center">
                        <div className="space-y-0.5">
                          <p className="font-bold text-white">{refUser.name}</p>
                          <p className="text-[10px] text-slate-500">{refUser.email}</p>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              refUser.isPaidUser 
                                ? 'bg-emerald/10 text-emerald border border-emerald/20' 
                                : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                            }`}>
                              {refUser.isPaidUser ? 'PAID' : 'PENDING'}
                            </span>
                            <span className={`font-bold text-[10px] ${refUser.isPaidUser ? 'text-emerald' : 'text-slate-500'}`}>
                              {refUser.isPaidUser ? `+₦${(refUser.rewardEarned || stats?.rewardPerUser || 1000).toLocaleString()}` : '₦0'}
                            </span>
                          </div>
                          <p className="text-[9px] text-slate-500">{new Date(refUser.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div className="space-y-3 border-t border-primary-light/20 pt-4">
              <h4 className="text-white font-bold text-sm">Withdrawals Log</h4>
              {stats?.withdrawalsHistory?.length === 0 ? (
                <p className="text-slate-500 text-xs py-6 text-center">No payouts requested yet.</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {stats?.withdrawalsHistory?.map((w: any) => (
                    <div key={w.id} className="p-3 bg-navy/40 border border-primary-light/20 rounded-lg flex justify-between text-xs items-center">
                      <div>
                        <p className="font-bold text-white">₦{w.amount.toLocaleString()}</p>
                        <p className="text-[9px] text-slate-500">{new Date(w.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          w.status === 'PROCESSED' 
                            ? 'bg-emerald/10 text-emerald border border-emerald/20' 
                            : w.status === 'FAILED'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : 'bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse'
                        }`}>
                          {w.status}
                        </span>
                        {w.transactionSlipUrl && (
                          <a 
                            href={w.transactionSlipUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="block text-[9px] text-gold hover:underline font-bold mt-1"
                          >
                            View Receipt
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
