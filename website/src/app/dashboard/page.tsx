'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Stats {
  overallBandEstimate: number;
  studyStreak: number;
  timeSpentStudying: number;
  lessonsCompletedCount: number;
  mockTestsCompletedCount: number;
  weakQuestionTypes: string[];
}

export default function StudentDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Manual payment modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [uploadedReceiptUrl, setUploadedReceiptUrl] = useState('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchNotifications = async () => {
    try {
      const data = await api.request<any[]>('/notifications');
      setNotifications(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      await api.request(`/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const loadProfile = async () => {
    try {
      const data = await api.request('/auth/profile');
      setProfile(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    fetchNotifications();
  }, []);

  const loadPaymentDetails = async () => {
    try {
      const [info, activePlans] = await Promise.all([
        api.request('/subscriptions/payment-info'),
        api.request('/subscriptions/plans'),
      ]);
      setPaymentInfo(info);
      const filtered = activePlans.filter((p: any) => p.code !== 'FREE');
      setPlans(filtered);
      if (filtered.length > 0) {
        setSelectedPlanId(filtered[0].id);
      }
    } catch (err) {
      console.error('Failed to load payment coordinates', err);
    }
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingReceipt(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const data = await api.request<{ url: string }>('/admin/upload', {
        method: 'POST',
        body: formData,
      });
      setUploadedReceiptUrl(data.url);
      alert('Receipt uploaded successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to upload receipt file');
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleSubmitReceipt = async () => {
    if (!selectedPlanId) return alert('Please select a plan');
    if (!uploadedReceiptUrl) return alert('Please upload your payment receipt');

    setSubmittingRequest(true);
    try {
      await api.request('/subscriptions/manual-request', {
        method: 'POST',
        body: JSON.stringify({
          planId: selectedPlanId,
          receiptUrl: uploadedReceiptUrl,
        }),
      });
      alert('Proof of payment submitted successfully! Tutors will review and activate your account shortly.');
      setShowPaymentModal(false);
      setUploadedReceiptUrl('');
      await loadProfile();
    } catch (err: any) {
      alert(err.message || 'Failed to submit receipt request');
    } finally {
      setSubmittingRequest(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center p-6">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-xl text-center max-w-md">
          <p className="font-bold">Error loading dashboard</p>
          <p className="text-xs mt-2">{error || 'Please sign in again.'}</p>
          <Link href="/auth/login" className="mt-4 inline-block bg-gold text-primary font-bold px-4 py-2 rounded-lg text-xs hover:bg-gold-dark">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const sub = profile.subscriptions?.find((s: any) => s.status === 'ACTIVE') || profile.subscriptions?.[0];
  const stats = profile.progressStats || {
    overallBandEstimate: 0,
    timeSpentStudying: 0,
    lessonsCompletedCount: 0,
    mockTestsCompletedCount: 0,
    weakQuestionTypes: [],
  };

  const modules = [
    { name: 'Listening Practice', path: '/dashboard/listening', icon: '🎧', color: 'border-l-blue-500', desc: 'Audio clips, form completion, and map labeling' },
    { name: 'Reading Practice', path: '/dashboard/reading', icon: '📖', color: 'border-l-emerald', desc: 'Academic and general training long-passages' },
    { name: 'Writing Correction', path: '/dashboard/writing', icon: '✍️', color: 'border-l-gold', desc: 'Instant AI grading for Task 1 and Task 2 essays' },
    { name: 'Speaking Feedback', path: '/dashboard/speaking', icon: '🎙️', color: 'border-l-purple-500', desc: 'Speech-to-text pronunciation and vocabulary review' },
  ];

  return (
    <div className="min-h-screen bg-navy text-white flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-primary-light/30 bg-primary/45 backdrop-blur-md flex items-center justify-between px-8 md:px-16">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold tracking-wider flex items-center gap-1.5">
            <span className="text-gold">BandUp</span> IELTS
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-300">
            <Link href="/dashboard/progress" className="hover:text-gold transition-colors">
              📈 AI Progress Report
            </Link>
            <Link href="/dashboard/history" className="hover:text-gold transition-colors">
              📜 Attempt History
            </Link>
             <Link href="/dashboard/referrals" className="hover:text-gold transition-colors">
              💸 Referral Program
             </Link>
             <Link href="/dashboard/support" className="hover:text-gold transition-colors">
              💬 Help & Support
             </Link>
             <Link href="/dashboard/billing" className="hover:text-gold transition-colors">
              💳 Billing History
             </Link>
             <button
               onClick={() => {
                 loadPaymentDetails();
                 setShowPaymentModal(true);
               }}
               className="bg-gold hover:bg-gold-dark text-primary font-black px-3.5 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap"
             >
               💳 Upgrade Premium
             </button>
          </nav>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Streak:</span>
            <span className="text-gold font-extrabold text-sm">{profile.studyStreak} Days 🔥</span>
          </div>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-1.5 rounded-lg hover:bg-primary-light/25 text-slate-300 hover:text-white transition-all cursor-pointer text-xs"
            >
              <span>🔔</span>
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border border-navy" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2.5 w-80 bg-primary border border-primary-light/45 rounded-xl shadow-2xl p-4 z-50 space-y-3 max-h-96 overflow-y-auto">
                <h4 className="text-white font-bold text-xs border-b border-primary-light/10 pb-2">Notifications</h4>
                {notifications.length === 0 ? (
                  <p className="text-slate-500 text-[11px] italic py-2">No notifications yet.</p>
                ) : (
                  <div className="space-y-2.5">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => !n.read && markNotificationRead(n.id)}
                        className={`p-2.5 rounded-lg text-left text-xs transition-colors cursor-pointer border ${
                          n.read
                            ? 'bg-navy/40 text-slate-400 border-primary-light/10'
                            : 'bg-primary-light/25 text-white font-semibold border-primary-light/35'
                        }`}
                      >
                        <p className="font-bold text-slate-200">{n.title}</p>
                        <p className="text-[10px] mt-0.5 leading-relaxed text-slate-300">{n.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => {
              api.clearTokens();
              window.location.href = '/auth/login';
            }}
            className="text-xs font-bold text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg bg-red-500/5 hover:bg-red-500/10 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-8 space-y-8">
        {/* Global Expiry/Upgrade Notification Bar */}
        {(!sub || sub.plan.code === 'FREE') ? (
          <div className="bg-gradient-to-r from-amber-500/10 to-gold/15 border border-gold/30 rounded-xl p-4 flex items-center justify-between shadow-lg text-xs md:text-sm">
            <div className="flex items-center gap-2 text-gold font-bold">
              <span>✨</span>
              <span>You are currently on the Free Starter plan. Upgrade to Premium for unlimited AI writing/speaking evaluations and full mock tests!</span>
            </div>
            <button
              onClick={() => {
                loadPaymentDetails();
                setShowPaymentModal(true);
              }}
              className="bg-gold hover:bg-gold-dark text-primary font-black px-3.5 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap"
            >
              Upgrade Now
            </button>
          </div>
        ) : (() => {
          const daysLeft = Math.ceil((new Date(sub.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          if (daysLeft <= 3) {
            return (
              <div className="bg-gradient-to-r from-red-500/10 to-rose-600/15 border border-red-500/35 rounded-xl p-4 flex items-center justify-between shadow-lg text-xs md:text-sm">
                <div className="flex items-center gap-2 text-red-400 font-bold">
                  <span>⚠️</span>
                  <span>Your premium subscription is about to end in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}! Renew now to keep your study progress active.</span>
                </div>
                <button
                  onClick={() => {
                    loadPaymentDetails();
                    setShowPaymentModal(true);
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white font-black px-3.5 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap"
                >
                  Renew Subscription
                </button>
              </div>
            );
          }
          return null;
        })()}

        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-primary to-primary-light border border-primary-light/40 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-black">Welcome back, {profile.name}!</h2>
                <p className="text-slate-300 text-sm mt-1">Your target exam is <span className="text-gold font-bold uppercase">{profile.targetExam}</span>. Let's practice to hit your goal!</p>
              </div>
              <div className="bg-navy/55 border border-primary-light/35 rounded-xl px-4 py-2 text-xs flex items-center gap-2 max-w-sm self-start md:self-auto">
                <span className="text-slate-400">ID:</span>
                <span className="font-mono text-white text-[10px] select-all">{profile.id}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(profile.id);
                    alert('Your Personal ID has been copied to your clipboard!');
                  }}
                  className="text-gold hover:text-white transition-colors font-bold px-1 ml-1"
                >
                  📋 Copy
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-primary-light/40">
              <div>
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Target Band</p>
                <select
                  value={profile.targetBand}
                  onChange={async (e) => {
                    const newBand = parseFloat(e.target.value);
                    setProfile({ ...profile, targetBand: newBand });
                    try {
                      await api.request('/auth/update-target-band', {
                        method: 'PUT',
                        body: JSON.stringify({ targetBand: newBand }),
                      });
                    } catch (err: any) {
                      alert('Failed to update target band');
                    }
                  }}
                  className="bg-navy/70 border border-primary-light/50 text-white rounded px-2 py-0.5 text-xs font-bold mt-1 focus:outline-none focus:border-gold transition-colors cursor-pointer"
                >
                  {[4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0].map((b) => (
                    <option key={b} value={b}>Band {b}</option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Current Estimate</p>
                <p className="text-gold text-xl font-bold mt-1">Band {stats.overallBandEstimate > 0 ? stats.overallBandEstimate.toFixed(1) : '0.0'}</p>
              </div>
              <div>
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Completed Lessons</p>
                <p className="text-white text-xl font-bold mt-1">{stats.lessonsCompletedCount} Lessons</p>
              </div>
              <div>
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Billing Status</p>
                <p className="text-emerald text-xl font-bold mt-1 capitalize">{sub?.plan.code || 'FREE'}</p>
                {sub && sub.status === 'ACTIVE' && sub.endDate ? (
                  (() => {
                    const diffTime = new Date(sub.endDate).getTime() - new Date().getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    const expiryDate = new Date(sub.endDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    });
                    return (
                      <div className="mt-2 space-y-1 bg-navy/60 border border-primary-light/20 rounded-lg p-2.5">
                        <div className="flex justify-between items-center gap-3">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Days Left</span>
                          <span className="text-[11px] text-gold font-extrabold">{diffDays > 0 ? `${diffDays} Days` : '0 Days'}</span>
                        </div>
                        <div className="flex justify-between items-center gap-3 border-t border-primary-light/10 pt-1">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Expires</span>
                          <span className="text-[10px] text-slate-200 font-bold">{expiryDate}</span>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <p className="text-[10px] text-slate-500 mt-2 font-semibold">
                    No active paid plan
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Account Limits & Usage */}
        <div className="bg-primary/25 border border-primary-light/45 rounded-2xl p-6 shadow-xl backdrop-blur-sm space-y-4">
          <h3 className="text-white font-bold text-sm">Account Limits & Usage</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Daily Practice */}
            <div className="bg-navy/40 p-4 rounded-xl border border-primary-light/15 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium">Daily Practice Questions</span>
                <span className="text-gold font-bold">
                  {sub?.plan.limitDailyPractice === -1 
                    ? 'Unlimited' 
                    : `${profile.todayAnswersCount || 0} / ${sub?.plan.limitDailyPractice || 5} Used`}
                </span>
              </div>
              <div className="w-full bg-primary/40 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gold h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${sub?.plan.limitDailyPractice === -1 
                      ? 0 
                      : Math.min(100, ((profile.todayAnswersCount || 0) / (sub?.plan.limitDailyPractice || 5)) * 100)}%` 
                  }}
                />
              </div>
              <p className="text-[10px] text-slate-500">
                {sub?.plan.limitDailyPractice === -1 
                  ? 'Answer as many questions as you like.' 
                  : `You have ${Math.max(0, (sub?.plan.limitDailyPractice || 5) - (profile.todayAnswersCount || 0))} questions remaining for today.`}
              </p>
            </div>

            {/* Mock Exams */}
            <div className="bg-navy/40 p-4 rounded-xl border border-primary-light/15 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium">Full Mock Exams (All sections)</span>
                <span className="text-emerald font-bold">
                  {sub?.plan.limitMockTests === -1 
                    ? 'Unlimited' 
                    : `${profile.totalMockTestsCount || 0} / ${sub?.plan.limitMockTests || 1} Completed`}
                </span>
              </div>
              <div className="w-full bg-primary/40 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-emerald h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${sub?.plan.limitMockTests === -1 
                      ? 0 
                      : Math.min(100, ((profile.totalMockTestsCount || 0) / (sub?.plan.limitMockTests || 1)) * 100)}%` 
                  }}
                />
              </div>
              <p className="text-[10px] text-slate-500">
                {sub?.plan.limitMockTests === -1 
                  ? 'Take unlimited complete mock tests anytime.' 
                  : `You have ${Math.max(0, (sub?.plan.limitMockTests || 1) - (profile.totalMockTestsCount || 0))} mock exams remaining on your current cycle.`}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-primary-light/20 flex justify-end">
            <button
              onClick={() => {
                loadPaymentDetails();
                setShowPaymentModal(true);
              }}
              className="bg-gold hover:bg-gold-dark text-primary font-bold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer"
            >
              💸 Upgrade via Manual Bank Transfer
            </button>
          </div>
        </div>

        {/* Quick Navigation Cards for Mobile Parity */}
        <div className="grid grid-cols-3 gap-3 md:hidden">
          <Link href="/dashboard/progress" className="bg-primary/30 border border-primary-light/45 rounded-xl p-3.5 text-center flex flex-col items-center justify-center space-y-2 hover:border-gold/30 transition-colors">
            <span className="text-lg">📈</span>
            <span className="text-[10px] font-extrabold text-slate-200">AI Report</span>
          </Link>
          <Link href="/dashboard/history" className="bg-primary/30 border border-primary-light/45 rounded-xl p-3.5 text-center flex flex-col items-center justify-center space-y-2 hover:border-gold/30 transition-colors">
            <span className="text-lg">📜</span>
            <span className="text-[10px] font-extrabold text-slate-200">History</span>
          </Link>
          <Link href="/dashboard/referrals" className="bg-primary/30 border border-primary-light/45 rounded-xl p-3.5 text-center flex flex-col items-center justify-center space-y-2 hover:border-gold/30 transition-colors">
            <span className="text-lg">💸</span>
            <span className="text-[10px] font-extrabold text-slate-200">Referrals</span>
          </Link>
        </div>

        {/* Practice Grid */}
        <div className="space-y-4">
          <h3 className="text-white font-bold text-lg">Practice Modules</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {modules.map((m) => (
              <div
                key={m.name}
                className={`bg-primary/25 border border-primary-light/30 border-l-4 ${m.color} rounded-2xl p-6 shadow-xl relative group hover:border-gold/30 transition-all duration-200`}
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="text-2xl">{m.icon}</div>
                    <h4 className="text-white font-bold text-base">{m.name}</h4>
                    <p className="text-slate-400 text-xs leading-relaxed max-w-sm">{m.desc}</p>
                  </div>
                  <Link
                    href={m.path}
                    className="bg-primary-light/50 border border-primary-light hover:bg-gold hover:text-primary text-slate-300 hover:border-gold font-bold px-4 py-2 rounded-lg text-xs transition-all duration-200 cursor-pointer"
                  >
                    Start Practice
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Analytics & Weak Areas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Weak areas card */}
          <div className="bg-primary/25 border border-primary-light/30 rounded-2xl p-6 shadow-xl col-span-2">
            <h4 className="text-white font-bold text-sm mb-4">Focus areas (Identified Weaknesses)</h4>
            {stats.weakQuestionTypes.length === 0 ? (
              <p className="text-slate-500 text-xs py-6 text-center">Great job! No persistent weaknesses detected so far.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {stats.weakQuestionTypes.map((type: string) => (
                  <span key={type} className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider">
                    {type.replace('_', ' ')}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Quick Mock exams card */}
          <div className="bg-primary/25 border border-primary-light/30 rounded-2xl p-6 shadow-xl space-y-4">
            <h4 className="text-white font-bold text-sm">Full Mock Exam</h4>
            <p className="text-slate-400 text-xs leading-relaxed">Take a timed 2.5-hour complete mock exam to simulate the official test conditions.</p>
            
            <Link 
              href="/dashboard/mock-exam"
              className="block w-full text-center bg-gold hover:bg-gold-dark text-primary font-bold py-2.5 rounded-lg text-xs transition-colors duration-200 cursor-pointer shadow-lg shadow-gold/10"
            >
              Start Full Mock Exam
            </Link>
          </div>
        </div>

      </main>

      {/* Manual Payment Request Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-primary border border-primary-light rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-white font-bold text-base">Manual Bank Transfer Upgrade</h3>
                <p className="text-slate-400 text-xs mt-1">Submit your transfer receipt details to activate your plan.</p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {paymentInfo && (
              <div className="bg-navy/40 p-4 rounded-xl border border-primary-light/10 space-y-2">
                <p className="text-gold text-[10px] font-bold uppercase tracking-wider">Bank Payment Coordinates</p>
                <div className="text-xs space-y-1.5 text-slate-300">
                  <p><span className="text-slate-500">Bank Name:</span> {paymentInfo.bankName}</p>
                  <p><span className="text-slate-500">Account Number:</span> <span className="font-mono font-bold text-white">{paymentInfo.accountNumber}</span></p>
                  <p><span className="text-slate-500">Account Name:</span> {paymentInfo.accountName}</p>
                </div>
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1.5">Select Plan Paid For</label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full bg-navy/60 border border-primary-light/60 focus:border-gold rounded-lg px-3 py-2 text-white focus:outline-none"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ₦{p.price.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1.5">Upload Payment Receipt / Screenshot</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Receipt URL (Uploaded)"
                    value={uploadedReceiptUrl}
                    readOnly
                    className="flex-1 bg-navy/60 border border-primary-light/60 rounded-lg px-3 py-2 text-slate-400 placeholder-slate-600 focus:outline-none"
                  />
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleReceiptUpload}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      disabled={uploadingReceipt}
                    />
                    <button
                      type="button"
                      className="bg-primary-light/35 border border-primary-light text-slate-200 hover:text-white px-3 py-2 rounded-lg font-bold whitespace-nowrap cursor-pointer"
                      disabled={uploadingReceipt}
                    >
                      {uploadingReceipt ? 'Uploading...' : '📁 Choose File'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-primary-light/20">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="bg-primary-light/35 text-slate-200 font-bold px-4 py-2 rounded-lg text-xs hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReceipt}
                disabled={submittingRequest || uploadingReceipt || !uploadedReceiptUrl}
                className="bg-gold hover:bg-gold-dark text-primary font-bold px-4 py-2 rounded-lg text-xs disabled:opacity-50 cursor-pointer"
              >
                {submittingRequest ? 'Submitting...' : 'Confirm & Submit Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
