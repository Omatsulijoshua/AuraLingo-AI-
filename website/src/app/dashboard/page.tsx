'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { getTranslation, languagesList } from '@/lib/localization';

export default function StudentDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'home' | 'plan' | 'tools' | 'history' | 'settings'>('home');
  const [locale, setLocale] = useState('EN');

  // Onboarding parameters
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [targetBand, setTargetBand] = useState(7.0);
  const [testType, setTestType] = useState('ACADEMIC');
  const [hasBookedTest, setHasBookedTest] = useState(false);
  const [currentLevel, setCurrentLevel] = useState('INTERMEDIATE');
  const [selectedWeaknesses, setSelectedWeaknesses] = useState<string[]>([]);
  const [studyTimeCommitment, setStudyTimeCommitment] = useState('1h');

  // Schedule Plan State
  const [schedule, setSchedule] = useState<any[]>([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  // Band Calculator state
  const [listeningScore, setListeningScore] = useState(6.0);
  const [readingScore, setReadingScore] = useState(6.0);
  const [writingScore, setWritingScore] = useState(6.0);
  const [speakingScore, setSpeakingScore] = useState(6.0);
  const [calculatedBand, setCalculatedBand] = useState(6.0);

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

  const _t = (key: string) => getTranslation(key, locale);

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
      const data = await api.request<any>('/auth/profile');
      setProfile(data);
      if (data) {
        setLocale(data.preferredLanguage || 'EN');
        setTargetBand(data.targetBand || 7.0);
        setTestType(data.targetExam || 'ACADEMIC');
        if (data.currentLevel) {
          setCurrentLevel(data.currentLevel);
        }
        if (data.weaknesses) {
          setSelectedWeaknesses(data.weaknesses);
        }
        if (data.studyTimeCommitment) {
          setStudyTimeCommitment(data.studyTimeCommitment);
        }
        setHasBookedTest(data.hasBookedTest || false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedule = async () => {
    setLoadingSchedule(true);
    try {
      const data = await api.request<any[]>('/content/schedule');
      setSchedule(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSchedule(false);
    }
  };

  useEffect(() => {
    loadProfile();
    fetchNotifications();
    const storedLocale = localStorage.getItem('preferredLanguage') || 'EN';
    setLocale(storedLocale);
  }, []);

  useEffect(() => {
    if (profile && profile.currentLevel) {
      fetchSchedule();
    }
  }, [profile]);

  useEffect(() => {
    const avg = (listeningScore + readingScore + writingScore + speakingScore) / 4.0;
    const fraction = avg - Math.floor(avg);
    let rounded = Math.floor(avg);
    if (fraction >= 0.75) {
      rounded += 1.0;
    } else if (fraction >= 0.25) {
      rounded += 0.5;
    }
    setCalculatedBand(rounded);
  }, [listeningScore, readingScore, writingScore, speakingScore]);

  const loadPaymentDetails = async () => {
    try {
      const [info, activePlans] = await Promise.all([
        api.request<any>('/subscriptions/payment-info'),
        api.request<any[]>('/subscriptions/plans'),
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

  const saveOnboardingProfile = async (completed: boolean = true) => {
    setLoading(true);
    try {
      await api.request('/auth/onboarding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetExam: testType,
          targetBand: targetBand,
          currentLevel: completed ? currentLevel : 'INTERMEDIATE',
          weaknesses: selectedWeaknesses,
          studyTimeCommitment: studyTimeCommitment,
          hasBookedTest: hasBookedTest,
          preferredLanguage: locale,
        }),
      });
      api.clearTokens();
      window.location.href = '/auth/register';
    } catch (e: any) {
      alert(e.message || 'Failed to submit preferences');
      setLoading(false);
    }
  };

  const handleLanguageChange = (code: string) => {
    setLocale(code);
    localStorage.setItem('preferredLanguage', code);
    if (profile) {
      api.request('/auth/onboarding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferredLanguage: code }),
      }).then(() => loadProfile());
    }
  };

  // 1. Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 2. Onboarding wizard blocker
  if (profile && !profile.currentLevel) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-[#020617] via-[#0b1329] to-[#0f172a] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Ambient background glow ring */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#D4AF37]/5 rounded-full blur-[130px] pointer-events-none" />
        
        <div className="backdrop-blur-xl bg-slate-950/65 border border-slate-800/80 rounded-3xl w-full max-w-md p-8 md:p-10 shadow-2xl relative transition-all duration-300 z-10 flex flex-col">
          
          {/* Header language selector */}
          <div className="absolute top-6 right-6">
            <select
              value={locale}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none cursor-pointer focus:border-[#D4AF37] transition-all"
            >
              {languagesList.map(l => (
                <option key={l.code} value={l.code}>{l.name}</option>
              ))}
            </select>
          </div>

          {/* Progress Indicator */}
          {onboardingStep > 0 && (
            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mb-8">
              <div 
                className="bg-[#D4AF37] h-full transition-all duration-300 rounded-full" 
                style={{ width: `${(onboardingStep / 7) * 100}%` }}
              />
            </div>
          )}

          {/* Steps */}
          {onboardingStep === 0 && (
            <div className="space-y-6 text-center">
              <div className="w-20 h-20 bg-[#D4AF37] rounded-full flex items-center justify-center text-[#050E1A] text-3xl font-extrabold mx-auto shadow-lg shadow-[#D4AF37]/30 transform hover:scale-105 transition-transform duration-300">
                IELTS
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white tracking-tight">{_t('welcome_title')}</h2>
                <p className="text-slate-400 text-xs leading-relaxed max-w-sm mx-auto">{_t('welcome_desc')}</p>
              </div>
              
              <div className="grid grid-cols-3 gap-3 py-4 bg-slate-900/40 rounded-2xl border border-slate-800/60 max-w-sm mx-auto">
                <div className="text-center">
                  <p className="text-base font-black text-white">4.8 ★</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">Rating</p>
                </div>
                <div className="text-center border-x border-slate-800/60">
                  <p className="text-base font-black text-white">300+</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">Mock Tests</p>
                </div>
                <div className="text-center">
                  <p className="text-base font-black text-white">+1.5</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">Avg Band ↑</p>
                </div>
              </div>

              <button
                onClick={() => setOnboardingStep(1)}
                className="w-full max-w-sm mx-auto block bg-[#D4AF37] hover:bg-[#C5A028] text-[#050E1A] font-bold py-3.5 rounded-full text-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-lg shadow-[#D4AF37]/10"
              >
                {_t('get_started')}
              </button>
            </div>
          )}

          {onboardingStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-white tracking-tight">{_t('target_score_title')}</h3>
                <p className="text-slate-400 text-xs mt-1">{_t('target_score_desc')}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[5.5, 6.0, 6.5, 7.0, 7.5, 8.0].map((band) => {
                  const isSelected = targetBand === band;
                  return (
                    <button
                      key={band}
                      onClick={() => setTargetBand(band)}
                      className={`p-3.5 rounded-xl border text-left flex justify-between items-center transition-all hover:scale-[1.02] active:scale-[0.98] ${
                        isSelected
                          ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-white shadow-md shadow-[#D4AF37]/5'
                          : 'bg-slate-900/50 border-slate-800/80 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="font-bold text-xs">Band {band}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isSelected ? 'bg-[#D4AF37] text-[#050E1A]' : 'bg-slate-800 text-slate-400'}`}>
                        {band >= 7.5 ? 'Expert' : (band >= 7.0 ? 'Very Good' : 'Competent')}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-900/60">
                <button onClick={() => setOnboardingStep(0)} className="flex-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 py-3 rounded-full text-xs font-bold transition-all active:scale-[0.98]">Back</button>
                <button onClick={() => setOnboardingStep(2)} className="flex-1 bg-[#D4AF37] hover:bg-[#C5A028] text-[#050E1A] py-3 rounded-full text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98]">{_t('continue_btn')}</button>
              </div>
            </div>
          )}

          {onboardingStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-white tracking-tight">{_t('test_type_title')}</h3>
                <p className="text-slate-400 text-xs mt-1">{_t('test_type_desc')}</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setTestType('ACADEMIC')}
                  className={`w-full p-4.5 rounded-xl border text-left flex items-center gap-4 transition-all hover:scale-[1.01] active:scale-[0.99] ${
                    testType === 'ACADEMIC' ? 'bg-[#D4AF37]/15 border-[#D4AF37] shadow-md shadow-[#D4AF37]/5' : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <span className="text-2xl">🎓</span>
                  <div>
                    <h4 className="font-bold text-xs text-white">{_t('academic')}</h4>
                    <p className="text-slate-400 text-[10px] mt-0.5 leading-relaxed">{_t('academic_desc')}</p>
                  </div>
                </button>

                <button
                  onClick={() => setTestType('GENERAL')}
                  className={`w-full p-4.5 rounded-xl border text-left flex items-center gap-4 transition-all hover:scale-[1.01] active:scale-[0.99] ${
                    testType === 'GENERAL' ? 'bg-[#D4AF37]/15 border-[#D4AF37] shadow-md shadow-[#D4AF37]/5' : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <span className="text-2xl">💼</span>
                  <div>
                    <h4 className="font-bold text-xs text-white">{_t('general')}</h4>
                    <p className="text-slate-400 text-[10px] mt-0.5 leading-relaxed">{_t('general_desc')}</p>
                  </div>
                </button>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-900/60">
                <button onClick={() => setOnboardingStep(1)} className="flex-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 py-3 rounded-full text-xs font-bold transition-all active:scale-[0.98]">Back</button>
                <button onClick={() => setOnboardingStep(3)} className="flex-1 bg-[#D4AF37] hover:bg-[#C5A028] text-[#050E1A] py-3 rounded-full text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98]">{_t('continue_btn')}</button>
              </div>
            </div>
          )}

          {onboardingStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-white tracking-tight">{_t('test_date_title')}</h3>
                <p className="text-slate-400 text-xs mt-1">{_t('test_date_desc')}</p>
              </div>

              <div className="bg-slate-900/50 border border-slate-800/80 p-4 rounded-xl flex justify-between items-center">
                <span className="text-xs font-bold text-white">{_t('booked_switch')}</span>
                <input
                  type="checkbox"
                  checked={hasBookedTest}
                  onChange={(e) => setHasBookedTest(e.target.checked)}
                  className="w-4.5 h-4.5 rounded accent-[#D4AF37] cursor-pointer"
                />
              </div>

              <div className="bg-slate-900/40 border border-slate-800/40 p-5 rounded-2xl text-center space-y-2.5">
                <span className="text-3xl block">📅</span>
                <h4 className="font-bold text-xs text-white">{_t('no_worries')}</h4>
                <p className="text-slate-400 text-[10px] leading-relaxed max-w-xs mx-auto">{_t('flexible_plan')}</p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-900/60">
                <button onClick={() => setOnboardingStep(2)} className="flex-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 py-3 rounded-full text-xs font-bold transition-all active:scale-[0.98]">Back</button>
                <button onClick={() => setOnboardingStep(4)} className="flex-1 bg-[#D4AF37] hover:bg-[#C5A028] text-[#050E1A] py-3 rounded-full text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98]">{_t('continue_btn')}</button>
              </div>
            </div>
          )}

          {onboardingStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-white tracking-tight">{_t('level_title')}</h3>
                <p className="text-slate-400 text-xs mt-1">{_t('level_desc')}</p>
              </div>

              <div className="space-y-3">
                {[
                  { code: 'BEGINNER', label: _t('level_beg'), desc: _t('level_beg_desc'), icon: '🌱' },
                  { code: 'INTERMEDIATE', label: _t('level_int'), desc: _t('level_int_desc'), icon: '📖' },
                  { code: 'ADVANCED', label: _t('level_adv'), desc: _t('level_adv_desc'), icon: '🚀' },
                ].map((lvl) => (
                  <button
                    key={lvl.code}
                    onClick={() => setCurrentLevel(lvl.code)}
                    className={`w-full p-3.5 rounded-xl border text-left flex items-center gap-4 transition-all hover:scale-[1.01] active:scale-[0.99] ${
                      currentLevel === lvl.code ? 'bg-[#D4AF37]/15 border-[#D4AF37] shadow-md shadow-[#D4AF37]/5' : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xl">{lvl.icon}</span>
                    <div>
                      <h4 className="font-bold text-xs text-white">{lvl.label}</h4>
                      <p className="text-slate-400 text-[10px] mt-0.5 leading-relaxed">{lvl.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-900/60">
                <button onClick={() => setOnboardingStep(3)} className="flex-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 py-3 rounded-full text-xs font-bold transition-all active:scale-[0.98]">Back</button>
                <button onClick={() => setOnboardingStep(5)} className="flex-1 bg-[#D4AF37] hover:bg-[#C5A028] text-[#050E1A] py-3 rounded-full text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98]">{_t('continue_btn')}</button>
              </div>
            </div>
          )}

          {onboardingStep === 5 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-white tracking-tight">{_t('stoppers_title')}</h3>
                <p className="text-slate-400 text-xs mt-1">{_t('stoppers_desc')}</p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                {[
                  { key: 'speaking_confidence', label: _t('stop_speaking') },
                  { key: 'reading_speed', label: _t('stop_reading') },
                  { key: 'writing_structure', label: _t('stop_writing') },
                  { key: 'listening_comprehension', label: _t('stop_listening') },
                  { key: 'time_management', label: _t('stop_time') },
                  { key: 'vocabulary', label: _t('stop_vocab') },
                ].map((item) => {
                  const isSelected = selectedWeaknesses.includes(item.key);
                  return (
                    <button
                      key={item.key}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedWeaknesses(selectedWeaknesses.filter(k => k !== item.key));
                        } else {
                          setSelectedWeaknesses([...selectedWeaknesses, item.key]);
                        }
                      }}
                      className={`p-3 rounded-xl border text-left text-[11px] font-bold transition-all hover:scale-[1.02] active:scale-[0.98] ${
                        isSelected
                          ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-white shadow-md shadow-[#D4AF37]/5'
                          : 'bg-slate-900/50 border-slate-800/80 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-900/60">
                <button onClick={() => setOnboardingStep(4)} className="flex-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 py-3 rounded-full text-xs font-bold transition-all active:scale-[0.98]">Back</button>
                <button onClick={() => setOnboardingStep(6)} className="flex-1 bg-[#D4AF37] hover:bg-[#C5A028] text-[#050E1A] py-3 rounded-full text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98]">{_t('continue_btn')}</button>
              </div>
            </div>
          )}

          {onboardingStep === 6 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-white tracking-tight">{_t('study_time_title')}</h3>
                <p className="text-slate-400 text-xs mt-1">{_t('study_time_desc')}</p>
              </div>

              <div className="space-y-3">
                {[
                  { code: '15m', label: _t('time_15'), desc: _t('time_15_desc'), icon: '⚡' },
                  { code: '30m', label: _t('time_30'), desc: _t('time_30_desc'), icon: '☕' },
                  { code: '1h', label: _t('time_1h'), desc: _t('time_1h_desc'), icon: '📚' },
                  { code: '2h+', label: _t('time_2h'), desc: _t('time_2h_desc'), icon: '🚀' },
                ].map((item) => (
                  <button
                    key={item.code}
                    onClick={() => setStudyTimeCommitment(item.code)}
                    className={`w-full p-3.5 rounded-xl border text-left flex items-center gap-4 transition-all hover:scale-[1.01] active:scale-[0.99] ${
                      studyTimeCommitment === item.code ? 'bg-[#D4AF37]/15 border-[#D4AF37] shadow-md shadow-[#D4AF37]/5' : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <h4 className="font-bold text-xs text-white">{item.label}</h4>
                      <p className="text-slate-400 text-[10px] mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-900/60">
                <button onClick={() => setOnboardingStep(5)} className="flex-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 py-3 rounded-full text-xs font-bold transition-all active:scale-[0.98]">Back</button>
                <button onClick={() => setOnboardingStep(7)} className="flex-1 bg-[#D4AF37] hover:bg-[#C5A028] text-[#050E1A] py-3 rounded-full text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98]">{_t('continue_btn')}</button>
              </div>
            </div>
          )}

          {onboardingStep === 7 && (
            <div className="space-y-6 text-center">
              <div>
                <h3 className="text-lg font-black text-white tracking-tight">{_t('projected_title')}</h3>
                <p className="text-slate-400 text-xs mt-1">{_t('projected_desc')}</p>
              </div>

              <div className="w-36 h-36 rounded-full border-[6px] border-[#D4AF37] flex flex-col justify-center items-center mx-auto bg-slate-900/40 shadow-lg shadow-[#D4AF37]/5">
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Target Band</span>
                <span className="text-3xl font-black text-white mt-0.5">{targetBand}</span>
                <span className="text-[10px] text-green-400 font-bold mt-1">↗ +2.5 Boost</span>
              </div>

              <button
                onClick={() => saveOnboardingProfile(true)}
                className="w-full bg-[#D4AF37] hover:bg-[#C5A028] text-[#050E1A] font-bold py-3.5 rounded-full text-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer mt-4 shadow-lg shadow-[#D4AF37]/10"
              >
                Finish & Go to Sign In
              </button>
            </div>
          )}

        </div>
      </div>
    );
  }

  // 3. Authenticated Dashboard with Tabs
  return (
    <div className="min-h-screen bg-navy text-white flex flex-col pb-16 md:pb-0">
      
      {/* Header Layout */}
      <header className="h-16 border-b border-primary-light/30 bg-primary/45 backdrop-blur-md flex items-center justify-between px-8 md:px-16 z-30">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold tracking-wider flex items-center gap-1.5">
            <span className="text-gold">BandUp</span> IELTS
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold">
            <button
              onClick={() => setActiveTab('home')}
              className={`transition-colors ${activeTab === 'home' ? 'text-gold' : 'text-slate-300 hover:text-white'}`}
            >
              {_t('menu_home')}
            </button>
            <button
              onClick={() => setActiveTab('plan')}
              className={`transition-colors ${activeTab === 'plan' ? 'text-gold' : 'text-slate-300 hover:text-white'}`}
            >
              {_t('menu_plan')}
            </button>
            <button
              onClick={() => setActiveTab('tools')}
              className={`transition-colors ${activeTab === 'tools' ? 'text-gold' : 'text-slate-300 hover:text-white'}`}
            >
              {_t('menu_tools')}
            </button>
            <Link
              href="/dashboard/mock-exam"
              className="transition-colors text-slate-300 hover:text-white"
            >
              Mock Exam
            </Link>
            <button
              onClick={() => setActiveTab('history')}
              className={`transition-colors ${activeTab === 'history' ? 'text-gold' : 'text-slate-300 hover:text-white'}`}
            >
              {_t('menu_history')}
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`transition-colors ${activeTab === 'settings' ? 'text-gold' : 'text-slate-300 hover:text-white'}`}
            >
              {_t('menu_settings')}
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {/* Header language switcher */}
          <select
            value={locale}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-navy/80 border border-primary-light rounded-lg px-2 py-1 text-xs text-white outline-none"
          >
            {languagesList.map(l => (
              <option key={l.code} value={l.code}>{l.name}</option>
            ))}
          </select>

          <button
            onClick={() => {
              loadPaymentDetails();
              setShowPaymentModal(true);
            }}
            className="bg-gold hover:bg-gold-dark text-primary font-black px-3.5 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap"
          >
            💳 {_t('upgrade')}
          </button>

          {/* Quick Access Header Logout */}
          <button
            onClick={() => {
              api.clearTokens();
              window.location.href = '/auth/login';
            }}
            className="bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/20 text-red-400 font-bold px-3 py-1.5 rounded-lg text-[10px] transition-all cursor-pointer whitespace-nowrap flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Log Out
          </button>
        </div>
      </header>

      {/* Main Tab Render Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-12 space-y-8">
        
        {activeTab === 'home' && (
          <div className="space-y-8">
            {/* Header Greeting Banner */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-200">
                  {DateTimeGreeting(locale)} {profile.name}!
                </h2>
                <p className="text-xs text-slate-500">Let's reach your goal today!</p>
              </div>
            </div>

            {/* Current Level Widget */}
            <div className="bg-primary/25 border border-primary-light/30 rounded-2xl p-6 shadow-xl flex items-center gap-6 max-w-2xl">
              <div className="w-20 h-20 rounded-full border-4 border-[#D4AF37] flex flex-col justify-center items-center bg-navy/40">
                <span className="text-xs font-bold text-white">{targetBand}</span>
                <span className="text-[8px] text-slate-400">Band</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Current Level</span>
                <h3 className="text-lg font-black text-white mt-1">
                  {currentLevel === 'BEGINNER' ? _t('level_beg') : (currentLevel === 'ADVANCED' ? _t('level_adv') : 'Advance')}
                </h3>
                <p className="text-xs text-slate-400 mt-2">{_t('level_sub')}</p>
              </div>
            </div>

            {/* Mock Exam Simulation Card */}
            <div className="bg-slate-950/80 border border-gold/25 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 max-w-2xl">
              <div className="flex items-start gap-4">
                <div className="text-3xl bg-gold/10 p-3 rounded-xl border border-gold/20 text-gold shrink-0">
                  🏆
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-white">IELTS Mock Exam Simulation</h3>
                    <span className="bg-gold/10 border border-gold/30 text-gold text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider">
                      Premium
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-md">
                    Experience the real timed exam environment. Complete Listening, Reading, Writing, and Speaking modules with overall band grading and AI tutor feedback.
                  </p>
                </div>
              </div>
              <Link 
                href="/dashboard/mock-exam"
                className="w-full md:w-auto bg-[#D4AF37] hover:bg-[#C5A028] text-[#050E1A] font-bold px-6 py-3 rounded-xl text-xs text-center transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0 shadow-lg shadow-[#D4AF37]/10"
              >
                Start Simulation
              </Link>
            </div>

            {/* Metrics Dashboard Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl">
              {/* Card 1: Completed Lessons */}
              <div className="bg-primary/25 border border-primary-light/30 rounded-2xl p-5 shadow-xl flex items-center gap-4">
                <div className="text-2xl">📚</div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Completed Lessons</p>
                  <p className="text-base font-black text-white mt-1">
                    {profile.completedLessonsCount ?? 0} Lessons
                  </p>
                </div>
              </div>

              {/* Card 2: Current Estimate */}
              <div className="bg-primary/25 border border-primary-light/30 rounded-2xl p-5 shadow-xl flex items-center gap-4">
                <div className="text-2xl text-gold">📈</div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Current Estimate</p>
                  <p className="text-base font-black text-gold mt-1">
                    Band {profile.currentEstimateBand ?? 6.3}
                  </p>
                </div>
              </div>

              {/* Card 3: Days Left / Expiry */}
              <div className="bg-primary/25 border border-primary-light/30 rounded-2xl p-5 shadow-xl flex items-center gap-4">
                <div className="text-2xl">💳</div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                    {profile.subscriptionDaysLeft && profile.subscriptionDaysLeft > 0 ? 'Days Left' : 'Subscription'}
                  </p>
                  {profile.subscriptionDaysLeft && profile.subscriptionDaysLeft > 0 ? (
                    <div className="mt-1">
                      <p className="text-sm font-black text-white">{profile.subscriptionDaysLeft} Days</p>
                      <p className="text-[9px] text-slate-500">Expires {profile.subscriptionExpiresAt}</p>
                    </div>
                  ) : (
                    <p className="text-sm font-black text-slate-400 mt-1">Free Plan</p>
                  )}
                </div>
              </div>
            </div>

            {/* Practice Grid */}
            <div className="space-y-4">
              <h3 className="text-white font-bold text-sm tracking-wide uppercase text-gold">{_t('practice_area')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { name: 'Speaking', path: '/dashboard/speaking', icon: '🎙️', desc: 'Speech evaluation' },
                  { name: 'Writing', path: '/dashboard/writing', icon: '✍️', desc: 'AI correction' },
                  { name: 'Reading', path: '/dashboard/reading', icon: '📖', desc: 'Academic articles' },
                  { name: 'Listening', path: '/dashboard/listening', icon: '🎧', desc: 'Audio clips' },
                ].map((m) => (
                  <Link
                    key={m.name}
                    href={m.path}
                    className="bg-primary/30 border border-primary-light/45 rounded-xl p-5 hover:border-gold/30 transition-all text-center flex flex-col items-center justify-center space-y-2 cursor-pointer"
                  >
                    <span className="text-3xl">{m.icon}</span>
                    <span className="text-sm font-bold text-slate-200">{m.name}</span>
                    <span className="text-[10px] text-slate-500">{m.desc}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Continue Learning list */}
            <div className="space-y-4">
              <h3 className="text-white font-extrabold text-lg tracking-normal">{_t('continue_learning') || 'Continue Learning'}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
                {[
                  {
                    module: 'Listening',
                    title: 'IELTS Book 10 Test 1',
                    progressText: '0/44 tests completed',
                    progressPercent: 0,
                    icon: '🎧',
                    path: '/dashboard/listening',
                    themeColor: 'blue',
                    bgIcon: 'bg-blue-500/10 text-blue-400',
                    pillBg: 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  },
                  {
                    module: 'Reading',
                    title: 'History/Architecture',
                    progressText: '0/132 passages completed',
                    progressPercent: 0,
                    icon: '📖',
                    path: '/dashboard/reading',
                    themeColor: 'purple',
                    bgIcon: 'bg-purple-500/10 text-purple-400',
                    pillBg: 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                  },
                  {
                    module: 'Writing',
                    title: 'Test 1 Task 1',
                    progressText: '0/88 tasks completed',
                    progressPercent: 0,
                    icon: '✍️',
                    path: '/dashboard/writing',
                    themeColor: 'amber',
                    bgIcon: 'bg-amber-500/10 text-amber-400',
                    pillBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  },
                  {
                    module: 'Speaking',
                    title: 'IELTS Book 10 Test 1',
                    progressText: '0/44 tests completed',
                    progressPercent: 0,
                    icon: '🎙️',
                    path: '/dashboard/speaking',
                    themeColor: 'emerald',
                    bgIcon: 'bg-emerald-500/10 text-emerald-400',
                    pillBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }
                ].map((item) => (
                  <Link
                    key={item.module}
                    href={item.path}
                    className="bg-primary/20 border border-primary-light/30 hover:border-gold/30 transition-all rounded-2xl p-4 flex justify-between items-center group cursor-pointer"
                  >
                    <div className="flex items-center gap-4 w-full">
                      {/* Icon container */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${item.bgIcon}`}>
                        {item.icon}
                      </div>
 
                      {/* Details */}
                      <div className="space-y-1.5 flex-1 min-w-0 pr-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${item.pillBg}`}>
                          {item.module}
                        </span>
                        <h4 className="text-sm font-bold text-white truncate group-hover:text-gold transition-colors">
                          {item.title}
                        </h4>
                        
                        {/* Progress Bar & Text */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[9px] text-slate-500">
                            <span>{item.progressText}</span>
                            <span>{item.progressPercent}%</span>
                          </div>
                          <div className="w-full bg-navy/60 h-1.5 rounded-full overflow-hidden border border-primary-light/10">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                item.themeColor === 'blue' ? 'bg-blue-500' :
                                item.themeColor === 'purple' ? 'bg-purple-500' :
                                item.themeColor === 'amber' ? 'bg-amber-500' :
                                'bg-emerald-500'
                              }`}
                              style={{ width: `${item.progressPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
 
                    {/* Chevron right */}
                    <div className="text-slate-500 group-hover:text-gold transition-colors shrink-0 pl-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'plan' && (
          <div className="space-y-8 max-w-5xl">
            {/* Header Section */}
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white tracking-normal">Your Study Plan</h2>
                <div className="flex items-center gap-4 text-xs font-bold">
                  <div className="flex items-center gap-1.5 text-red-400">
                    <span>🎯</span>
                    <span>Band {profile.targetBand ?? '7.0'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span>📅</span>
                    <span>
                      {profile.testDate
                        ? new Date(profile.testDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'Oct 11, 2026'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={fetchSchedule}
                className="p-2.5 bg-primary/30 border border-primary-light/45 hover:border-gold/30 hover:text-gold transition-all rounded-xl text-slate-300 cursor-pointer"
                title="Refresh schedule"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12" />
                </svg>
              </button>
            </div>

            {/* Metrics Counters Row */}
            <div className="bg-primary/25 border border-primary-light/35 rounded-2xl p-5 shadow-xl grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { label: 'Listening', val: profile.progressStats?.listeningHistory ? (typeof profile.progressStats.listeningHistory === 'string' ? JSON.parse(profile.progressStats.listeningHistory).length : profile.progressStats.listeningHistory.length) : 0, icon: '🎧', bg: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
                { label: 'Reading', val: profile.progressStats?.readingHistory ? (typeof profile.progressStats.readingHistory === 'string' ? JSON.parse(profile.progressStats.readingHistory).length : profile.progressStats.readingHistory.length) : 0, icon: '📖', bg: 'bg-purple-500/10 text-purple-400 border border-purple-500/20' },
                { label: 'Writing', val: profile.progressStats?.writingHistory ? (typeof profile.progressStats.writingHistory === 'string' ? JSON.parse(profile.progressStats.writingHistory).length : profile.progressStats.writingHistory.length) : 0, icon: '✍️', bg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
                { label: 'Speaking', val: profile.progressStats?.speakingHistory ? (typeof profile.progressStats.speakingHistory === 'string' ? JSON.parse(profile.progressStats.speakingHistory).length : profile.progressStats.speakingHistory.length) : 0, icon: '🎙️', bg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center space-y-2">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${item.bg}`}>
                    {item.icon}
                  </div>
                  <span className="text-base font-extrabold text-white mt-1">{item.val}</span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{item.label}</span>
                </div>
              ))}
            </div>

            {/* Split Progress & Schedule Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Left widgets: Progress & Pace */}
              <div className="space-y-6 md:col-span-1">
                {/* Weekly progress card */}
                <div className="bg-primary/25 border border-primary-light/35 rounded-2xl p-5 shadow-xl space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-bold text-white">This Week</h4>
                      <p className="text-[10px] text-slate-500 font-semibold mt-1">
                        {(() => {
                          let completed = 0;
                          let total = 0;
                          schedule.forEach((d: any) => d.tasks.forEach((t: any) => {
                            total++;
                            if (t.completed) completed++;
                          }));
                          return `${completed}/${total > 0 ? total : 23} tasks done`;
                        })()}
                      </p>
                    </div>
                    <span className="text-xl font-extrabold text-gold">
                      {(() => {
                        let completed = 0;
                        let total = 0;
                        schedule.forEach((d: any) => d.tasks.forEach((t: any) => {
                          total++;
                          if (t.completed) completed++;
                        }));
                        const totalTasks = total > 0 ? total : 23;
                        return `${Math.round((completed / totalTasks) * 100)}%`;
                      })()}
                    </span>
                  </div>
                  <div className="w-full bg-navy/60 h-1.5 rounded-full overflow-hidden border border-primary-light/10">
                    <div
                      className="bg-gold h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(() => {
                          let completed = 0;
                          let total = 0;
                          schedule.forEach((d: any) => d.tasks.forEach((t: any) => {
                            total++;
                            if (t.completed) completed++;
                          }));
                          const totalTasks = total > 0 ? total : 23;
                          return Math.round((completed / totalTasks) * 100);
                        })()}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Pace Card */}
                <div className="bg-primary/25 border border-primary-light/35 rounded-2xl p-5 shadow-xl flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center text-lg shrink-0">
                    ↑
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Ahead of Schedule</h4>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Great pace — keep it up!</p>
                  </div>
                </div>
              </div>

              {/* Right widgets: Schedule timeline */}
              <div className="md:col-span-2 space-y-6">
                <h3 className="text-base font-extrabold text-white tracking-normal">Your Schedule</h3>
                
                {loadingSchedule ? (
                  <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
                ) : schedule.length > 0 ? (
                  <div className="space-y-4">
                    {schedule.map((day: any, dayIdx: number) => {
                      const dateObj = new Date(day.date);
                      const dayNumber = dateObj.getDate();
                      const dayShort = day.dayLabel.substring(0, 3);
                      const isToday = dayIdx === 0;

                      return (
                        <div key={day.date} className="flex gap-4 items-stretch">
                          {/* Timeline Day Node */}
                          <div className="flex flex-col items-center shrink-0">
                            <div
                              className={`w-12 h-12 rounded-2xl border flex flex-col justify-center items-center font-bold shadow-lg transition-all ${
                                isToday
                                  ? 'bg-red-800 border-red-700 text-white'
                                  : 'bg-primary/20 border-primary-light/35 text-slate-300'
                              }`}
                            >
                              <span className={`text-[8px] uppercase tracking-wider ${isToday ? 'text-white/70' : 'text-slate-500'}`}>
                                {dayShort}
                              </span>
                              <span className="text-sm font-black leading-tight mt-0.5">{dayNumber}</span>
                            </div>
                            {dayIdx < schedule.length - 1 && (
                              <div className="w-0.5 bg-primary-light/25 flex-1 my-1.5" />
                            )}
                          </div>

                          {/* Day tasks card list */}
                          <div className="flex-1 space-y-2 pb-6">
                            {day.tasks.map((task: any) => {
                              const module = task.module.toLowerCase();
                              let themeColor = 'blue';
                              let icon = '🎧';
                              let bgStyle = 'bg-blue-500/10 text-blue-400 border border-blue-500/20';

                              if (module === 'reading') {
                                themeColor = 'purple';
                                icon = '📖';
                                bgStyle = 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
                              } else if (module === 'writing') {
                                themeColor = 'amber';
                                icon = '✍️';
                                bgStyle = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
                              } else if (module === 'speaking') {
                                themeColor = 'emerald';
                                icon = '🎙️';
                                bgStyle = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                              }

                              return (
                                <Link
                                  key={task.id}
                                  href={`/dashboard/${module}`}
                                  className="bg-primary/20 border border-primary-light/30 hover:border-gold/30 rounded-2xl p-3.5 flex justify-between items-center group cursor-pointer transition-all shadow-md"
                                >
                                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                    <div className={`w-9.5 h-9.5 rounded-xl flex items-center justify-center text-base shrink-0 ${bgStyle}`}>
                                      {icon}
                                    </div>
                                    <div className="min-w-0 pr-4">
                                      <h4 className="text-xs font-bold text-white truncate group-hover:text-gold transition-colors">
                                        {task.title}
                                      </h4>
                                      <p
                                        className={`text-[8px] font-bold uppercase tracking-wider mt-1 ${
                                          isToday ? 'text-red-400' : 'text-slate-500'
                                        }`}
                                      >
                                        {isToday ? "Today's Task" : 'Upcoming'}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3 shrink-0">
                                    {/* Status dot */}
                                    <div
                                      className={`w-2 h-2 rounded-full ${
                                        task.completed ? 'bg-emerald-500' : (isToday ? 'bg-red-500' : 'bg-slate-600')
                                      }`}
                                    />
                                    {/* Arrow icon */}
                                    <div className="text-slate-500 group-hover:text-gold transition-colors pl-1">
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                      </svg>
                                    </div>
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-slate-500 text-xs">No schedule generated yet. Please save your onboarding preferences in Settings.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tools' && (
          <div className="space-y-8">
            <h2 className="text-xl font-bold text-slate-200">{_t('ai_tools_title')}</h2>
            
            {/* AI Tools Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: _t('essay_checker'), desc: _t('essay_checker_desc'), path: '/dashboard/writing', icon: '📝' },
                { name: _t('grammar_check'), desc: _t('grammar_check_desc'), path: '/dashboard/writing', icon: '🔍' },
                { name: _t('paraphrase'), desc: _t('paraphrase_desc'), path: '/dashboard/writing', icon: '🔄' },
                { name: _t('speaking_samples'), desc: _t('speaking_samples_desc'), path: '/dashboard/speaking', icon: '🎙️' },
              ].map((tool) => (
                <div key={tool.name} className="bg-primary/20 border border-primary-light/30 rounded-xl p-5 space-y-4">
                  <span className="text-3xl">{tool.icon}</span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">{tool.name}</h4>
                    <p className="text-xs text-slate-500 mt-1">{tool.desc}</p>
                  </div>
                  <Link href={tool.path} className="inline-block bg-primary-light hover:bg-gold hover:text-primary px-3 py-1.5 rounded-lg text-[10px] font-bold">
                    Open Tool
                  </Link>
                </div>
              ))}
            </div>

            {/* Dynamic Band Score Calculator Utility widget */}
            <div className="bg-primary/20 border border-primary-light/30 rounded-2xl p-8 max-w-xl">
              <h3 className="text-sm font-bold text-gold uppercase tracking-wide mb-6">{_t('band_calculator')}</h3>
              
              <div className="bg-navy/60 border border-[#D4AF37]/30 p-6 rounded-xl text-center mb-6 space-y-1">
                <p className="text-[10px] text-slate-500">Calculated Overall Band Score</p>
                <p className="text-4xl font-black text-white">{calculatedBand}</p>
              </div>

              <div className="space-y-4">
                {[
                  { name: 'Listening', score: listeningScore, setScore: setListeningScore },
                  { name: 'Reading', score: readingScore, setScore: setReadingScore },
                  { name: 'Writing', score: writingScore, setScore: setWritingScore },
                  { name: 'Speaking', score: speakingScore, setScore: setSpeakingScore },
                ].map((s) => (
                  <div key={s.name} className="flex justify-between items-center text-xs">
                    <span className="w-24 text-slate-300 font-bold">{s.name}</span>
                    <input
                      type="range"
                      min="4.0"
                      max="9.0"
                      step="0.5"
                      value={s.score}
                      onChange={(e) => s.setScore(parseFloat(e.target.value))}
                      className="flex-1 mx-4 accent-gold"
                    />
                    <span className="w-8 font-mono font-bold text-gold">{s.score.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-200">Attempt History</h2>
            <p className="text-xs text-slate-500">Review all your previous learning practice answers and band grades.</p>
            <div className="pt-4">
              <Link href="/dashboard/history" className="bg-gold text-primary font-bold px-4 py-2 rounded-lg text-xs">
                View Full Attempt History Panel
              </Link>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-8 max-w-2xl">
            <h2 className="text-xl font-bold text-slate-200">{_t('menu_settings')}</h2>
            
            {/* User ID Badge Card */}
            <div className="bg-primary/25 border border-primary-light/30 rounded-xl p-6 flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <h3 className="text-base font-bold text-white">{profile.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{profile.email}</p>
              </div>
              <div className="flex items-center gap-2 bg-navy/60 px-4 py-2 border border-primary-light/30 rounded-xl text-xs">
                <span className="text-slate-400 font-medium">ID:</span>
                <span className="font-mono text-white select-all">{profile.id}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(profile.id);
                    alert('User ID copied to clipboard!');
                  }}
                  className="text-gold hover:text-gold-dark font-bold ml-2 transition-colors cursor-pointer flex items-center gap-1"
                >
                  📋 Copy
                </button>
              </div>
            </div>

            {/* My Account Quick Links Card */}
            <div className="bg-primary/25 border border-primary-light/30 rounded-xl p-6 space-y-4">
              <h3 className="text-xs font-bold text-gold uppercase tracking-wide">My Account</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link 
                  href="/dashboard/progress"
                  className="flex items-center gap-3 bg-navy/50 border border-primary-light/20 p-4 rounded-xl text-left hover:border-gold/30 transition-all text-xs font-medium cursor-pointer"
                >
                  <span className="text-lg">📈</span>
                  <div>
                    <p className="text-white font-bold">AI Progress Report</p>
                    <p className="text-slate-500 text-[10px] mt-0.5">Real-time profile performance</p>
                  </div>
                </Link>

                <button 
                  onClick={() => setActiveTab('history')}
                  className="flex items-center gap-3 bg-navy/50 border border-primary-light/20 p-4 rounded-xl text-left hover:border-gold/30 transition-all text-xs font-medium cursor-pointer"
                >
                  <span className="text-lg">📜</span>
                  <div>
                    <p className="text-white font-bold">Attempt History</p>
                    <p className="text-slate-500 text-[10px] mt-0.5">Mock tests and practice runs</p>
                  </div>
                </button>

                <Link 
                  href="/dashboard/referrals"
                  className="flex items-center gap-3 bg-navy/50 border border-primary-light/20 p-4 rounded-xl text-left hover:border-gold/30 transition-all text-xs font-medium cursor-pointer"
                >
                  <span className="text-lg">💸</span>
                  <div>
                    <p className="text-white font-bold">Referral Program</p>
                    <p className="text-slate-500 text-[10px] mt-0.5">Invite friends and earn rewards</p>
                  </div>
                </Link>

                <button 
                  onClick={() => {
                    loadPaymentDetails();
                    setShowPaymentModal(true);
                  }}
                  className="flex items-center gap-3 bg-navy/50 border border-primary-light/20 p-4 rounded-xl text-left hover:border-gold/30 transition-all text-xs font-medium cursor-pointer"
                >
                  <span className="text-lg">💳</span>
                  <div>
                    <p className="text-white font-bold">Billing History</p>
                    <p className="text-slate-500 text-[10px] mt-0.5">Subscriptions and invoices</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Preferred Language Settings Card */}
            <div className="bg-primary/25 border border-primary-light/30 rounded-xl p-6 space-y-4">
              <h3 className="text-xs font-bold text-gold uppercase tracking-wide">Language Settings</h3>
              <div className="flex justify-between items-center text-xs">
                <span>Select App Language Switcher</span>
                <select
                  value={locale}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="bg-navy border border-primary-light rounded-lg px-3 py-1.5 text-white"
                >
                  {languagesList.map(l => (
                    <option key={l.code} value={l.code}>{l.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Profile configuration parameters */}
            <div className="bg-primary/25 border border-primary-light/30 rounded-xl p-6 space-y-4">
              <h3 className="text-xs font-bold text-gold uppercase tracking-wide">Study Settings</h3>
              
              <div className="flex justify-between items-center text-xs">
                <span>{_t('exam_type')}</span>
                <select
                  value={testType}
                  onChange={(e) => {
                    setTestType(e.target.value);
                    api.request('/auth/onboarding', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ targetExam: e.target.value }),
                    }).then(() => loadProfile());
                  }}
                  className="bg-navy border border-primary-light rounded-lg px-3 py-1.5 text-white"
                >
                  <option value="ACADEMIC">Academic</option>
                  <option value="GENERAL">General Training</option>
                </select>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span>{_t('target_band')}</span>
                <select
                  value={targetBand}
                  onChange={(e) => {
                    const band = parseFloat(e.target.value);
                    setTargetBand(band);
                    api.request('/auth/onboarding', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ targetBand: band }),
                    }).then(() => loadProfile());
                  }}
                  className="bg-navy border border-primary-light rounded-lg px-3 py-1.5 text-white"
                >
                  {[5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5].map(b => (
                    <option key={b} value={b}>Band {b}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-between items-center text-xs pt-4 border-t border-primary-light/20">
                <span className="text-orange-400 font-bold">{_t('reset_plan')}</span>
                <button
                  onClick={() => {
                    saveOnboardingProfile(true);
                    alert('Study plan schedule recalculated successfully!');
                  }}
                  className="bg-primary-light hover:bg-gold hover:text-primary font-bold px-3 py-1.5 rounded-lg text-[10px] transition-colors"
                >
                  Reset & Recalculate
                </button>
              </div>
            </div>

            {/* Session Settings Card */}
            <div className="bg-primary/25 border border-primary-light/30 rounded-xl p-6 space-y-4">
              <h3 className="text-xs font-bold text-red-400 uppercase tracking-wide">Session</h3>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300">Log out of your account on this device</span>
                <button
                  onClick={() => {
                    api.clearTokens();
                    window.location.href = '/auth/login';
                  }}
                  className="bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/20 text-red-400 font-bold px-4 py-2 rounded-lg text-xs transition-all cursor-pointer"
                >
                  Log Out
                </button>
              </div>
            </div>
          </div>
        )}

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

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-primary border-t border-primary-light/40 z-40 flex items-center justify-around px-4">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-colors ${activeTab === 'home' ? 'text-gold' : 'text-slate-400 hover:text-white'}`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>Home</span>
        </button>
        <button
          onClick={() => setActiveTab('plan')}
          className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-colors ${activeTab === 'plan' ? 'text-gold' : 'text-slate-400 hover:text-white'}`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Plan</span>
        </button>
        <button
          onClick={() => setActiveTab('tools')}
          className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-colors ${activeTab === 'tools' ? 'text-gold' : 'text-slate-400 hover:text-white'}`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          </svg>
          <span>Tools</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-colors ${activeTab === 'history' ? 'text-gold' : 'text-slate-400 hover:text-white'}`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>History</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-colors ${activeTab === 'settings' ? 'text-gold' : 'text-slate-400 hover:text-white'}`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
}

// Helpers
function DateTimeGreeting(locale: string): string {
  const hr = new Date().getHours();
  if (locale === 'AR') {
    return hr < 12 ? 'صباح الخير ☀️' : 'مساء الخير 🌙';
  }
  return hr < 12 ? 'Good Morning ☀️' : 'Good Night 🌙';
}
