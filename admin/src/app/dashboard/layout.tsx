'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { api, User } from '@/lib/api';
import { LanguageAIService, LanguageProfile } from '@/lib/language-ai';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<LanguageProfile | null>(null);

  useEffect(() => {
    const activeUser = api.getUser();
    const token = localStorage.getItem('accessToken');

    const langProf = LanguageAIService.getProfile();
    setProfile(langProf);

    if (!token || !activeUser) {
      setUser({
        id: 'user-demo',
        email: 'learner@auralingo.ai',
        name: 'Alex Rivera',
        role: 'STUDENT',
        targetExam: 'ACADEMIC',
        targetBand: 8,
        studyStreak: langProf.studyStreak || 7,
        isVerified: true,
        createdAt: new Date().toISOString()
      });
      setLoading(false);
    } else {
      setUser(activeUser);
      setLoading(false);
    }
  }, [pathname]);

  const handleLogout = () => {
    api.clearTokens();
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amethyst border-t-transparent rounded-full animate-spin" />
          <p className="text-purple-300 font-semibold text-sm">Initializing AuraLingo AI...</p>
        </div>
      </div>
    );
  }

  const navLinks = [
    {
      name: 'AI Coach Hub',
      path: '/dashboard',
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      badge: 'PRO'
    },
    {
      name: 'Voice & Text Studio',
      path: '/dashboard/coach',
      icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z',
      badge: 'LIVE AI'
    },
    {
      name: 'Scenario Simulator',
      path: '/dashboard/scenarios',
      icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
    },
    {
      name: 'Mistake Bank (Memory)',
      path: '/dashboard/mistakes',
      icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
      badge: 'MEMORY'
    },
    {
      name: 'Dynamic Exercise Drills',
      path: '/dashboard/exercises',
      icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    },
    {
      name: 'Adaptive Curriculum',
      path: '/dashboard/curriculum',
      icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
    },
    {
      name: 'AI & Language Settings',
      path: '/dashboard/settings',
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
    },
  ];

  return (
    <div className="min-h-screen bg-navy flex font-sans text-purple-50">
      {/* Sidebar */}
      <aside className="w-72 bg-primary border-r border-primary-light/60 flex flex-col justify-between z-20 shrink-0 shadow-2xl">
        <div>
          {/* Logo & Brand Header */}
          <div className="h-20 border-b border-primary-light/60 flex items-center px-6 justify-between">
            <Link href="/dashboard" className="flex items-center gap-3">
              <img
                src="/logo.jpg"
                alt="AuraLingo AI Logo"
                className="w-10 h-10 rounded-xl object-cover border-2 border-amethyst shadow-lg shadow-amethyst/30"
              />
              <div>
                <span className="text-white font-black text-lg tracking-wider block">AuraLingo</span>
                <span className="text-coral font-bold text-[10px] uppercase tracking-widest block">AI Personal Coach</span>
              </div>
            </Link>
          </div>

          {/* User Active Target Language Badge */}
          {profile && (
            <div className="mx-4 my-4 p-3 rounded-xl bg-gradient-to-r from-primary-light/80 to-primary border border-amethyst/40 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🇪🇸</span>
                <div>
                  <p className="text-xs font-bold text-white">{profile.targetLanguage}</p>
                  <p className="text-[10px] text-amethyst-light font-semibold">{profile.cefrLevel} Level · Native {profile.nativeLanguage}</p>
                </div>
              </div>
              <Link
                href="/onboarding"
                className="text-[10px] font-black bg-amethyst/20 hover:bg-amethyst/40 text-amethyst-light px-2.5 py-1 rounded border border-amethyst/30 transition-all"
              >
                Change
              </Link>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="px-3 space-y-1.5">
            <div className="px-3 text-[10px] font-black text-purple-400/60 uppercase tracking-widest mb-1">
              AI Coach Core
            </div>
            {navLinks.map((link) => {
              const isActive = pathname === link.path;
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-amethyst to-purple-600 text-white shadow-lg shadow-amethyst/30 scale-102 font-black'
                      : 'text-purple-200/80 hover:bg-primary-light/50 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={link.icon} />
                    </svg>
                    <span>{link.name}</span>
                  </div>
                  {link.badge && (
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${isActive ? 'bg-navy text-coral' : 'bg-coral/20 text-coral border border-coral/30'}`}>
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info & Streak Footer */}
        <div className="p-4 border-t border-primary-light/60 space-y-3">
          <div className="flex items-center justify-between bg-primary-light/40 p-3 rounded-xl border border-purple-900/40">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔥</span>
              <div>
                <p className="text-xs font-extrabold text-white">{profile?.studyStreak || 7} Day Streak</p>
                <p className="text-[10px] text-purple-300/70">Daily Target: {profile?.dailyMinutes || 20}m</p>
              </div>
            </div>
            <span className="text-[10px] font-black text-emerald bg-emerald/10 border border-emerald/20 px-2 py-0.5 rounded-full">
              ACTIVE
            </span>
          </div>

          <div className="flex items-center justify-between px-2">
            <div className="min-w-0">
              <p className="text-white text-xs font-bold truncate">{user?.name || 'Alex Rivera'}</p>
              <p className="text-purple-300/60 text-[10px] truncate">{user?.email || 'learner@auralingo.ai'}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 rounded-lg border border-coral/30 bg-coral/10 hover:bg-coral/20 text-coral transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar Header */}
        <header className="h-16 border-b border-primary-light/60 bg-primary/80 backdrop-blur-md flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-white font-extrabold text-base">
              {pathname === '/dashboard' && 'AI Personal Coach Hub'}
              {pathname === '/dashboard/coach' && 'Live AI Voice & Text Studio'}
              {pathname === '/dashboard/scenarios' && 'Real-World Scenario Simulator'}
              {pathname === '/dashboard/mistakes' && 'Persistent Error Memory & Mistake Bank'}
              {pathname === '/dashboard/exercises' && 'Dynamic Real-Time Exercise Drills'}
              {pathname === '/dashboard/curriculum' && 'Personalized Adaptive Curriculum'}
              {pathname === '/dashboard/settings' && 'AI Multi-Provider & Model Settings'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/coach"
              className="bg-gradient-to-r from-amethyst to-coral hover:from-coral hover:to-amethyst text-white font-black px-4 py-2 rounded-xl text-xs shadow-md shadow-amethyst/30 flex items-center gap-2 transition-all hover:scale-105"
            >
              <span>🎙️ Start Live Voice Session</span>
            </Link>
          </div>
        </header>

        {/* Dynamic Page View */}
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
