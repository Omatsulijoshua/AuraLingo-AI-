'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface AppSetting {
  id: string;
  key: string;
  value: string;
  description: string | null;
  isEncrypted: boolean;
}

interface PendingPayment {
  id: string;
  amount: number;
  providerReference: string;
  receiptUrl: string | null;
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED';
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
}

export default function SubscriptionSettings() {
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Receipts tab state
  const [receiptsTab, setReceiptsTab] = useState<'untreated' | 'treated'>('untreated');

  // Form states for manual bank details
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  // Edit settings
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const fetchSettings = async () => {
    try {
      const data = await api.request<AppSetting[]>('/admin/settings');
      setSettings(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load subscription settings');
    }
  };

  const fetchPendingPayments = async () => {
    try {
      const data = await api.request<PendingPayment[]>('/subscriptions/all-manual');
      setPendingPayments(data);
    } catch (err) {
      console.error('Failed to fetch manual payments', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchSettings(), fetchPendingPayments()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const bankSetting = settings.find(s => s.key === 'manual_bank_payment_details');
    if (bankSetting && bankSetting.value) {
      try {
        const parsed = JSON.parse(bankSetting.value);
        setBankName(parsed.bankName || '');
        setAccountNumber(parsed.accountNumber || '');
        setAccountName(parsed.accountName || '');
      } catch (e) {
        console.error("Failed to parse bank settings JSON:", e);
      }
    }
  }, [settings]);

  const handleUpdate = async (key: string, value: string) => {
    try {
      await api.request('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({ key, value }),
      });
      setEditingKey(null);
      await fetchSettings();
      alert('Subscription setting updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to update setting');
    }
  };

  const handleApprovePayment = async (paymentId: string) => {
    if (!confirm('Are you sure you want to approve this manual payment receipt and activate the student subscription?')) return;
    try {
      await api.request('/subscriptions/manual-approve', {
        method: 'POST',
        body: JSON.stringify({ paymentId }),
      });
      alert('Subscription manually activated successfully!');
      await fetchPendingPayments();
    } catch (err: any) {
      alert(err.message || 'Failed to approve payment');
    }
  };

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const getSetting = (key: string) => settings.find((s) => s.key === key);

  const untreatedReceipts = pendingPayments.filter(p => p.status === 'PENDING');
  const treatedReceipts = pendingPayments.filter(p => p.status !== 'PENDING');
  const activeReceipts = receiptsTab === 'untreated' ? untreatedReceipts : treatedReceipts;

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Title Header */}
      <div className="bg-primary/25 border border-primary-light/40 rounded-xl p-6 shadow-xl backdrop-blur-sm">
        <h2 className="text-white font-extrabold text-lg">Subscription & Referral Settings</h2>
        <p className="text-slate-400 text-xs mt-1">Configure pay-in bank coordinates and promo code referral rewards program rules.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-center text-xs">
          {error}
        </div>
      )}

      {/* Manual Bank Payment Details Configuration */}
      <div className="bg-primary/25 border border-primary-light/40 rounded-xl p-6 shadow-xl backdrop-blur-sm space-y-6">
        <h3 className="text-white font-bold text-base">Student Subscription Manual Payment Bank Account</h3>
        <p className="text-slate-400 text-xs leading-relaxed">
          Configure the bank account details shown to students when they choose manual payment options for paid subscriptions checkout.
        </p>

        {getSetting('manual_bank_payment_details') && (
          <div className="space-y-4">
            {editingKey === 'manual_bank_payment_details' ? (
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full bg-navy/60 border border-primary-light/60 focus:border-gold rounded-lg px-3 py-2 text-white text-xs focus:outline-none"
                    placeholder="e.g. Opay"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Account Number</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full bg-navy/60 border border-primary-light/60 focus:border-gold rounded-lg px-3 py-2 text-white text-xs focus:outline-none"
                    placeholder="e.g. 8158075936"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Account Name</label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="w-full bg-navy/60 border border-primary-light/60 focus:border-gold rounded-lg px-3 py-2 text-white text-xs focus:outline-none"
                    placeholder="e.g. Joshua toritseju omatsuli"
                  />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    onClick={() => {
                      const combined = JSON.stringify({ bankName, accountNumber, accountName });
                      handleUpdate('manual_bank_payment_details', combined);
                    }}
                    className="bg-emerald text-primary font-bold px-4 py-1.5 rounded text-xs cursor-pointer hover:opacity-90"
                  >
                    Save Details
                  </button>
                  <button
                    onClick={() => setEditingKey(null)}
                    className="bg-red-500 text-white font-bold px-4 py-1.5 rounded text-xs cursor-pointer hover:opacity-90"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-start">
                <div className="bg-navy/40 p-5 rounded-lg border border-primary-light/20 flex-1 mr-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <span className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Bank Name</span>
                    <span className="text-white text-sm font-bold mt-1 block">{bankName || '(Not Set)'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Account Number</span>
                    <span className="text-white text-sm font-mono font-bold mt-1 block">{accountNumber || '(Not Set)'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Account Name</span>
                    <span className="text-white text-sm font-bold mt-1 block">{accountName || '(Not Set)'}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEditingKey('manual_bank_payment_details');
                  }}
                  className="text-xs font-bold text-gold hover:underline cursor-pointer pt-4"
                >
                  Edit Bank Config
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Referral Program Settings */}
      <div className="bg-primary/25 border border-primary-light/40 rounded-xl p-6 shadow-xl backdrop-blur-sm space-y-6">
        <h3 className="text-white font-bold text-base">Referral & Promo Code Rewards Configuration</h3>
        <p className="text-slate-400 text-xs leading-relaxed">
          Configure the percentage discount given to referred students on their first month, and the immediate sign-up reward (in Naira) credited to referrers.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Discount Percentage */}
          {getSetting('referral_discount_percentage') && (
            <div className="bg-navy/40 p-4 rounded-xl border border-primary-light/15 space-y-2">
              <p className="text-slate-300 text-xs font-bold">Automatic Referral Discount (%)</p>
              <p className="text-[10px] text-slate-500">Applied automatically to the student’s first monthly subscription payment.</p>
              {editingKey === 'referral_discount_percentage' ? (
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    className="bg-navy border border-gold rounded px-2.5 py-1 text-white text-xs w-24 focus:outline-none"
                  />
                  <button
                    onClick={() => handleUpdate('referral_discount_percentage', editingValue)}
                    className="bg-emerald text-primary font-bold px-3 py-1 rounded text-[10px] cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingKey(null)}
                    className="bg-red-500 text-white font-bold px-3 py-1 rounded text-[10px] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-center pt-2">
                  <span className="text-gold font-extrabold text-lg">{getSetting('referral_discount_percentage')?.value}%</span>
                  <button
                    onClick={() => {
                      setEditingKey('referral_discount_percentage');
                      setEditingValue(getSetting('referral_discount_percentage')?.value || '');
                    }}
                    className="text-[10px] font-bold text-gold hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Referrer Reward Amount */}
          {getSetting('referral_reward_naira') && (
            <div className="bg-navy/40 p-4 rounded-xl border border-primary-light/15 space-y-2">
              <p className="text-slate-300 text-xs font-bold">Referrer Sign-Up Reward (₦)</p>
              <p className="text-[10px] text-slate-500">Naira reward credited instantly to the referrer’s balance upon registration.</p>
              {editingKey === 'referral_reward_naira' ? (
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    className="bg-navy border border-gold rounded px-2.5 py-1 text-white text-xs w-24 focus:outline-none"
                  />
                  <button
                    onClick={() => handleUpdate('referral_reward_naira', editingValue)}
                    className="bg-emerald text-primary font-bold px-3 py-1 rounded text-[10px] cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingKey(null)}
                    className="bg-red-500 text-white font-bold px-3 py-1 rounded text-[10px] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-center pt-2">
                  <span className="text-emerald font-extrabold text-lg">₦{getSetting('referral_reward_naira')?.value}</span>
                  <button
                    onClick={() => {
                      setEditingKey('referral_reward_naira');
                      setEditingValue(getSetting('referral_reward_naira')?.value || '');
                    }}
                    className="text-[10px] font-bold text-gold hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Recurring Commission Strategy */}
          {getSetting('referral_commission_type') && (
            <div className="bg-navy/40 p-4 rounded-xl border border-primary-light/15 space-y-2">
              <p className="text-slate-300 text-xs font-bold">Recurring Commission Strategy</p>
              <p className="text-[10px] text-slate-500">Reward strategy applied to referrers upon student resubscriptions.</p>
              {editingKey === 'referral_commission_type' ? (
                <div className="flex gap-2">
                  <select
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    className="bg-navy border border-gold rounded px-2.5 py-1 text-white text-xs focus:outline-none"
                  >
                    <option value="NONE">NONE (No Commission)</option>
                    <option value="FLAT">FLAT (Fixed Naira Reward)</option>
                    <option value="PERCENT">PERCENT (Percentage Commission)</option>
                  </select>
                  <button
                    onClick={() => handleUpdate('referral_commission_type', editingValue)}
                    className="bg-emerald text-primary font-bold px-3 py-1 rounded text-[10px] cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingKey(null)}
                    className="bg-red-500 text-white font-bold px-3 py-1 rounded text-[10px] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-center pt-2">
                  <span className="text-gold font-extrabold text-xs uppercase tracking-wider bg-gold/15 px-2.5 py-0.5 rounded border border-gold/20">
                    {getSetting('referral_commission_type')?.value}
                  </span>
                  <button
                    onClick={() => {
                      setEditingKey('referral_commission_type');
                      setEditingValue(getSetting('referral_commission_type')?.value || 'FLAT');
                    }}
                    className="text-[10px] font-bold text-gold hover:underline cursor-pointer"
                  >
                    Edit Strategy
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Recurring Commission Strategy Value */}
          {getSetting('referral_commission_value') && (
            <div className="bg-navy/40 p-4 rounded-xl border border-primary-light/15 space-y-2">
              <p className="text-slate-300 text-xs font-bold">Commission Value (₦ or %)</p>
              <p className="text-[10px] text-slate-500">Value corresponding to the chosen strategy (flat amount or percentage).</p>
              {editingKey === 'referral_commission_value' ? (
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    className="bg-navy border border-gold rounded px-2.5 py-1 text-white text-xs w-24 focus:outline-none"
                  />
                  <button
                    onClick={() => handleUpdate('referral_commission_value', editingValue)}
                    className="bg-emerald text-primary font-bold px-3 py-1 rounded text-[10px] cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingKey(null)}
                    className="bg-red-500 text-white font-bold px-3 py-1 rounded text-[10px] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-center pt-2">
                  <span className="text-white font-extrabold text-lg">
                    {getSetting('referral_commission_type')?.value === 'PERCENT'
                      ? `${getSetting('referral_commission_value')?.value}%`
                      : `₦${getSetting('referral_commission_value')?.value}`}
                  </span>
                  <button
                    onClick={() => {
                      setEditingKey('referral_commission_value');
                      setEditingValue(getSetting('referral_commission_value')?.value || '');
                    }}
                    className="text-[10px] font-bold text-gold hover:underline cursor-pointer"
                  >
                    Edit Value
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Student Payment Receipts Section */}
      <div className="bg-primary/25 border border-primary-light/40 rounded-xl p-6 shadow-xl backdrop-blur-sm space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-white font-bold text-base">Student Payment Receipts</h3>
            <p className="text-slate-400 text-xs mt-1">Review manual bank transfer receipts submitted by students to activate paid accounts.</p>
          </div>
        </div>

        {/* Tabs Headers */}
        <div className="flex border-b border-primary-light/25">
          <button
            onClick={() => setReceiptsTab('untreated')}
            className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              receiptsTab === 'untreated'
                ? 'border-gold text-gold font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Untreated Receipts ({untreatedReceipts.length})
          </button>
          <button
            onClick={() => setReceiptsTab('treated')}
            className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              receiptsTab === 'treated'
                ? 'border-gold text-gold font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Treated Receipts ({treatedReceipts.length})
          </button>
        </div>

        {activeReceipts.length === 0 ? (
          <p className="text-slate-500 text-xs py-8 text-center bg-navy/20 rounded-lg border border-primary-light/10">
            No receipts found in this section.
          </p>
        ) : (
          <div className="overflow-hidden border border-primary-light/20 rounded-lg">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[10px] uppercase text-slate-400 bg-primary/40 border-b border-primary-light/40 font-bold">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Reference / Slip</th>
                  <th className="px-4 py-3 text-right">Status / Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-light/15 bg-navy/20">
                {activeReceipts.map((pmt) => (
                  <tr key={pmt.id} className="hover:bg-primary-light/5 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-white font-bold">{pmt.user?.name || 'Unknown'}</p>
                      <p className="text-slate-500 text-[10px]">{pmt.user?.email}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gold">
                      ₦{pmt.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-400 text-[10px] font-mono">{pmt.providerReference}</p>
                      {pmt.receiptUrl && (
                        <a
                          href={pmt.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gold hover:underline font-bold mt-1 inline-block text-[10px]"
                        >
                          📄 View Uploaded Receipt
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {pmt.status === 'PENDING' ? (
                        <button
                          onClick={() => handleApprovePayment(pmt.id)}
                          className="bg-emerald text-primary font-bold px-3 py-1.5 rounded text-[10px] hover:opacity-90 transition-opacity cursor-pointer"
                        >
                          Approve Activation
                        </button>
                      ) : (
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                            pmt.status === 'SUCCESSFUL'
                              ? 'bg-emerald/10 text-emerald border border-emerald/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {pmt.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
