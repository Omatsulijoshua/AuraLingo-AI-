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
      window.location.href = '/auth/login';
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
      <div className="min-h-screen bg-navy text-white flex flex-col items-center justify-center p-4">
        <div className="bg-primary border border-primary-light rounded-2xl w-full max-w-2xl p-8 shadow-2xl relative">
          
          {/* Header language switcher */}
          <div className="absolute top-4 right-4">
            <select
              value={locale}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="bg-navy/80 border border-primary-light rounded-lg px-2 py-1 text-xs text-white"
            >
              {languagesList.map(l => (
                <option key={l.code} value={l.code}>{l.name}</option>
              ))}
            </select>
          </div>

          {/* Steps */}
          {onboardingStep === 0 && (
            <div className="space-y-6 text-center">
              <div className="w-20 h-20 bg-[#D4AF37] rounded-full flex items-center justify-center text-[#050E1A] text-3xl font-extrabold mx-auto shadow-lg shadow-[#D4AF37]/30">
                IELTS
              </div>
              <h2 className="text-2xl font-black text-white">{_t('welcome_title')}</h2>
              <p className="text-slate-400 text-sm max-w-md mx-auto">{_t('welcome_desc')}</p>
              
              <div className="grid grid-cols-3 gap-4 py-4 bg-navy/40 rounded-xl border border-primary-light/10 max-w-md mx-auto">
                <div>
                  <p className="text-lg font-black text-white">4.8 ★</p>
                  <p className="text-[10px] text-slate-500">Rating</p>
                </div>
                <div>
                  <p className="text-lg font-black text-white">300+</p>
                  <p className="text-[10px] text-slate-500">Mock Tests</p>
                </div>
                <div>
                  <p className="text-lg font-black text-white">+1.5</p>
                  <p className="text-[10px] text-slate-500">Avg Band ↑</p>
                </div>
              </div>

              <button
                onClick={() => setOnboardingStep(1)}
                className="w-full max-w-md mx-auto block bg-[#D4AF37] hover:bg-[#C5A028] text-[#050E1A] font-bold py-3.5 rounded-full text-sm transition-colors cursor-pointer"
              >
                {_t('get_started')}
              </button>
            </div>
          )}

          {onboardingStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold">{_t('target_score_title')}</h3>
              <p className="text-slate-400 text-xs">{_t('target_score_desc')}</p>

              <div className="grid grid-cols-2 gap-4">
                {[5.5, 6.0, 6.5, 7.0, 7.5, 8.0].map((band) => (
                  <button
                    key={band}
                    onClick={() => setTargetBand(band)}
                    className={`p-4 rounded-xl border text-left flex justify-between items-center transition-all ${
                      targetBand === band
                        ? 'bg-[#D4AF37]/25 border-[#D4AF37] text-white'
                        : 'bg-navy/60 border-primary-light/50 text-slate-300'
                    }`}
                  >
                    <span className="font-bold text-sm">Band {band}</span>
                    <span className="text-[10px] opacity-60">
                      {band >= 7.5 ? 'Expert' : (band >= 7.0 ? 'Very Good' : 'Competent')}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={() => setOnboardingStep(0)} className="flex-1 bg-primary-light/30 py-3 rounded-full text-xs font-bold">Back</button>
                <button onClick={() => setOnboardingStep(2)} className="flex-1 bg-[#D4AF37] hover:bg-[#C5A028] text-[#050E1A] py-3 rounded-full text-xs font-bold">{_t('continue_btn')}</button>
              </div>
            </div>
          )}

          {onboardingStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold">{_t('test_type_title')}</h3>
              <p className="text-slate-400 text-xs">{_t('test_type_desc')}</p>

              <div className="space-y-4">
                <button
                  onClick={() => setTestType('ACADEMIC')}
                  className={`w-full p-5 rounded-xl border text-left flex items-center gap-4 transition-all ${
                    testType === 'ACADEMIC' ? 'bg-[#D4AF37]/25 border-[#D4AF37]' : 'bg-navy/60 border-primary-light/50'
                  }`}
                >
                  <span className="text-2xl">🎓</span>
                  <div>
                    <h4 className="font-bold text-sm">{_t('academic')}</h4>
                    <p className="text-slate-400 text-[10px] mt-1">{_t('academic_desc')}</p>
                  </div>
                </button>

                <button
                  onClick={() => setTestType('GENERAL')}
                  className={`w-full p-5 rounded-xl border text-left flex items-center gap-4 transition-all ${
                    testType === 'GENERAL' ? 'bg-[#D4AF37]/25 border-[#D4AF37]' : 'bg-navy/60 border-primary-light/50'
                  }`}
                >
                  <span className="text-2xl">💼</span>
                  <div>
                    <h4 className="font-bold text-sm">{_t('general')}</h4>
                    <p className="text-slate-400 text-[10px] mt-1">{_t('general_desc')}</p>
                  </div>
                </button>
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={() => setOnboardingStep(1)} className="flex-1 bg-primary-light/30 py-3 rounded-full text-xs font-bold">Back</button>
                <button onClick={() => setOnboardingStep(3)} className="flex-1 bg-[#D4AF37] hover:bg-[#C5A028] text-[#050E1A] py-3 rounded-full text-xs font-bold">{_t('continue_btn')}</button>
              </div>
            </div>
          )}

          {onboardingStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold">{_t('test_date_title')}</h3>
              <p className="text-slate-400 text-xs">{_t('test_date_desc')}</p>

              <div className="bg-navy/60 border border-primary-light/50 p-4 rounded-xl flex justify-between items-center">
                <span className="text-sm font-bold">{_t('booked_switch')}</span>
                <input
                  type="checkbox"
                  checked={hasBookedTest}
                  onChange={(e) => setHasBookedTest(e.target.checked)}
                  className="w-5 h-5 rounded accent-[#D4AF37]"
                />
              </div>

              <div className="bg-navy/40 border border-primary-light/20 p-6 rounded-xl text-center space-y-3">
                <span className="text-3xl text-[#D4AF37]">📅</span>
                <h4 className="font-bold text-sm">{_t('no_worries')}</h4>
                <p className="text-slate-400 text-[10px] leading-relaxed max-w-sm mx-auto">{_t('flexible_plan')}</p>
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={() => setOnboardingStep(2)} className="flex-1 bg-primary-light/30 py-3 rounded-full text-xs font-bold">Back</button>
                <button onClick={() => setOnboardingStep(4)} className="flex-1 bg-[#D4AF37] hover:bg-[#C5A028] text-[#050E1A] py-3 rounded-full text-xs font-bold">{_t('continue_btn')}</button>
              </div>
            </div>
          )}

          {onboardingStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold">{_t('level_title')}</h3>
              <p className="text-slate-400 text-xs">{_t('level_desc')}</p>

              <div className="space-y-3">
                {[
                  { code: 'BEGINNER', label: _t('level_beg'), desc: _t('level_beg_desc'), icon: '🌱' },
                  { code: 'INTERMEDIATE', label: _t('level_int'), desc: _t('level_int_desc'), icon: '📖' },
                  { code: 'ADVANCED', label: _t('level_adv'), desc: _t('level_adv_desc'), icon: '🚀' },
                ].map((lvl) => (
                  <button
                    key={lvl.code}
                    onClick={() => setCurrentLevel(lvl.code)}
                    className={`w-full p-4 rounded-xl border text-left flex items-center gap-4 transition-all ${
                      currentLevel === lvl.code ? 'bg-[#D4AF37]/25 border-[#D4AF37]' : 'bg-navy/60 border-primary-light/50'
                    }`}
                  >
                    <span className="text-xl">{lvl.icon}</span>
                    <div>
                      <h4 className="font-bold text-sm">{lvl.label}</h4>
                      <p className="text-slate-400 text-[10px] mt-0.5">{lvl.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={() => setOnboardingStep(3)} className="flex-1 bg-primary-light/30 py-3 rounded-full text-xs font-bold">Back</button>
                <button onClick={() => setOnboardingStep(5)} className="flex-1 bg-[#D4AF37] hover:bg-[#C5A028] text-[#050E1A] py-3 rounded-full text-xs font-bold">{_t('continue_btn')}</button>
              </div>
            </div>
          )}

          {onboardingStep === 5 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold">{_t('stoppers_title')}</h3>
              <p className="text-slate-400 text-xs">{_t('stoppers_desc')}</p>

              <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
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
                      className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                        isSelected ? 'bg-[#D4AF37]/25 border-[#D4AF37] text-white' : 'bg-navy/60 border-primary-light/50 text-slate-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={() => setOnboardingStep(4)} className="flex-1 bg-primary-light/30 py-3 rounded-full text-xs font-bold">Back</button>
                <button onClick={() => setOnboardingStep(6)} className="flex-1 bg-[#D4AF37] hover:bg-[#C5A028] text-[#050E1A] py-3 rounded-full text-xs font-bold">{_t('continue_btn')}</button>
              </div>
            </div>
          )}

          {onboardingStep === 6 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold">{_t('study_time_title')}</h3>
              <p className="text-slate-400 text-xs">{_t('study_time_desc')}</p>

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
                    className={`w-full p-4 rounded-xl border text-left flex items-center gap-4 transition-all ${
                      studyTimeCommitment === item.code ? 'bg-[#D4AF37]/25 border-[#D4AF37]' : 'bg-navy/60 border-primary-light/50'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <h4 className="font-bold text-sm">{item.label}</h4>
                      <p className="text-slate-400 text-[10px] mt-0.5">{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={() => setOnboardingStep(5)} className="flex-1 bg-primary-light/30 py-3 rounded-full text-xs font-bold">Back</button>
                <button onClick={() => setOnboardingStep(7)} className="flex-1 bg-[#D4AF37] hover:bg-[#C5A028] text-[#050E1A] py-3 rounded-full text-xs font-bold">{_t('continue_btn')}</button>
              </div>
            </div>
          )}

          {onboardingStep === 7 && (
            <div className="space-y-6 text-center">
              <h3 className="text-xl font-bold">{_t('projected_title')}</h3>
              <p className="text-slate-400 text-xs">{_t('projected_desc')}</p>

              <div className="w-40 h-40 rounded-full border-8 border-[#D4AF37] flex flex-col justify-center items-center mx-auto bg-navy/40">
                <span className="text-[10px] text-slate-500">Band</span>
                <span className="text-3xl font-black text-white">{targetBand}</span>
                <span className="text-[10px] text-green-400 font-bold mt-1">↗ +2.5</span>
              </div>

              <button
                onClick={() => saveOnboardingProfile(true)}
                className="w-full bg-[#D4AF37] hover:bg-[#C5A028] text-[#050E1A] font-bold py-3.5 rounded-full text-sm transition-colors cursor-pointer mt-4"
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
    <div className="min-h-screen bg-navy text-white flex flex-col">
      
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
            className="bg-navy/80 border border-primary-light rounded-lg px-2 py-1 text-xs text-white"
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
              <h3 className="text-white font-bold text-sm tracking-wide uppercase text-gold">{_t('continue_learning')}</h3>
              {loadingSchedule ? (
                <div className="text-xs text-slate-500">Loading daily planner...</div>
              ) : schedule.length > 0 ? (
                <div className="space-y-3 max-w-xl">
                  {schedule[0].tasks.slice(0, 2).map((task: any) => (
                    <div key={task.id} className="bg-primary/20 border border-primary-light/30 rounded-xl p-4 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <span className="text-lg">🎯</span>
                        <div>
                          <h4 className="text-xs font-bold text-slate-200">{task.title}</h4>
                          <p className="text-[10px] text-slate-500 mt-1">Daily Planner Practice</p>
                        </div>
                      </div>
                      <Link
                        href={`/dashboard/${task.module.toLowerCase()}`}
                        className="bg-gold text-primary font-bold px-3 py-1.5 rounded-lg text-[10px] transition-colors"
                      >
                        Start
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No tasks generated. Recalculate schedule in Settings.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'plan' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-200">{_t('schedule_title')}</h2>
            
            {loadingSchedule ? (
              <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
            ) : schedule.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Horizontal day buttons */}
                <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
                  {schedule.map((day, idx) => (
                    <button
                      key={day.date}
                      onClick={() => setSelectedDayIndex(idx)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedDayIndex === idx ? 'bg-[#D4AF37]/20 border-gold text-white' : 'bg-primary/20 border-primary-light/20 text-slate-400'
                      }`}
                    >
                      <p className="text-[10px] uppercase font-bold">{day.dayLabel}</p>
                      <p className="text-xs font-black mt-0.5">{day.date}</p>
                    </button>
                  ))}
                </div>

                {/* Day Tasks List */}
                <div className="md:col-span-3 space-y-4">
                  <h3 className="text-sm font-bold text-slate-400">Tasks for {schedule[selectedDayIndex].dayLabel}</h3>
                  <div className="space-y-3">
                    {schedule[selectedDayIndex].tasks.map((task: any) => (
                      <div key={task.id} className="bg-primary/20 border border-primary-light/30 rounded-xl p-4 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <span className="text-lg">📚</span>
                          <div>
                            <h4 className="text-xs font-bold text-slate-200">{task.title}</h4>
                            <p className="text-[9px] text-slate-500 uppercase font-semibold mt-1">{task.module} PRACTICE</p>
                          </div>
                        </div>
                        <Link
                          href={`/dashboard/${task.module.toLowerCase()}`}
                          className="bg-gold text-primary font-bold px-4 py-2 rounded-lg text-xs"
                        >
                          Start
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 text-xs">No schedule generated yet. Please save your onboarding preferences in Settings.</p>
            )}
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
