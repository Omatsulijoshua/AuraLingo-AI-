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

export default function SubscriptionSettings() {
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit settings
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const fetchSettings = async () => {
    try {
      const data = await api.request<AppSetting[]>('/admin/settings');
      setSettings(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load subscription settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

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

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const getSetting = (key: string) => settings.find((s) => s.key === key);

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
              <div className="space-y-4">
                <textarea
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  rows={4}
                  className="w-full bg-navy/60 border border-gold rounded-lg p-3 text-white text-xs focus:outline-none leading-relaxed font-mono"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => handleUpdate('manual_bank_payment_details', editingValue)}
                    className="bg-emerald text-primary font-bold px-4 py-1.5 rounded text-xs cursor-pointer"
                  >
                    Save Details
                  </button>
                  <button
                    onClick={() => setEditingKey(null)}
                    className="bg-red-500 text-white font-bold px-4 py-1.5 rounded text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-start">
                <pre className="text-slate-300 text-xs font-mono bg-navy/40 p-4 rounded-lg border border-primary-light/20 whitespace-pre-wrap leading-relaxed flex-1 mr-4">
                  {getSetting('manual_bank_payment_details')?.value}
                </pre>
                <button
                  onClick={() => {
                    setEditingKey('manual_bank_payment_details');
                    setEditingValue(getSetting('manual_bank_payment_details')?.value || '');
                  }}
                  className="text-xs font-bold text-gold hover:underline cursor-pointer"
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
    </div>
  );
}
