'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { api, User } from '@/lib/api';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Unattended counts state
  const [unattendedCounts, setUnattendedCounts] = useState<{
    unattendedPayouts: number;
    unattendedSubscriptions: number;
  }>({ unattendedPayouts: 0, unattendedSubscriptions: 0 });

  const fetchUnattendedCounts = async () => {
    try {
      const data = await api.request<{
        unattendedPayouts: number;
        unattendedSubscriptions: number;
      }>('/admin/unattended-counts');
      setUnattendedCounts(data);
    } catch (err) {
      console.error('Failed to fetch unattended counts', err);
    }
  };

  useEffect(() => {
    const activeUser = api.getUser();
    const token = localStorage.getItem('accessToken');

    if (!token || !activeUser || activeUser.role === 'STUDENT') {
      api.clearTokens();
      router.push('/auth/login');
    } else {
      setUser(activeUser);
      setLoading(false);
      // Fetch counts initially
      fetchUnattendedCounts();
      // Poll counts every 15 seconds to keep sidebar badges live!
      const interval = setInterval(fetchUnattendedCounts, 15000);
      return () => clearInterval(interval);
    }

    const handleAuthExpired = () => {
      router.push('/auth/login');
    };

    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, [router]);

  const handleLogout = () => {
    api.clearTokens();
    router.push('/auth/login');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-semibold text-sm">Verifying Session...</p>
        </div>
      </div>
    );
  }

  const sidebarLinks = [
    { name: 'Overview', path: '/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'Users', path: '/dashboard/users', icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm7-8a4 4 0 110 8m5 10v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75' },
    { 
      name: 'Subscriptions', 
      path: '/dashboard/subscriptions', 
      icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
      badge: unattendedCounts.unattendedSubscriptions > 0 ? unattendedCounts.unattendedSubscriptions : null
    },
    { 
      name: 'Subscriptions History', 
      path: '/dashboard/subscriptions-history', 
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
    },
    { 
      name: 'Payout Requests', 
      path: '/dashboard/payouts', 
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      badge: unattendedCounts.unattendedPayouts > 0 ? unattendedCounts.unattendedPayouts : null
    },
    { name: 'AI Settings', path: '/dashboard/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
    { name: 'Questions Builder', path: '/dashboard/questions', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { name: 'Mock Exam Builder', path: '/dashboard/mock-exams', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { name: 'Tutor Reviews', path: '/dashboard/reviews', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
    { name: 'Send Broadcasts', path: '/dashboard/broadcasts', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { name: 'Support Tickets', path: '/dashboard/tickets', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  ];

  return (
    <div className="min-h-screen bg-navy flex">
      {/* Sidebar */}
      <aside className="w-64 bg-primary border-r border-primary-light/40 flex flex-col justify-between z-20">
        <div>
          {/* Sidebar Header */}
          <div className="h-16 border-b border-primary-light/40 flex items-center px-6 gap-2">
            <span className="text-gold font-extrabold text-xl tracking-wider">BandUp</span>
            <span className="text-white font-semibold text-sm border border-slate-600 px-1.5 py-0.5 rounded uppercase">Admin</span>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {sidebarLinks.map((link) => {
              const isActive = pathname === link.path;
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-gold text-primary shadow-lg shadow-gold/15'
                      : 'text-slate-400 hover:bg-primary-light/30 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={link.icon} />
                    </svg>
                    <span>{link.name}</span>
                  </div>
                  {link.badge !== undefined && link.badge !== null && (
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${isActive ? 'bg-primary text-gold' : 'bg-red-500 text-white animate-pulse'}`}>
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info / Logout */}
        <div className="p-4 border-t border-primary-light/40 space-y-4">
          <div className="px-4">
            <p className="text-white text-sm font-bold truncate">{user.name}</p>
            <p className="text-slate-500 text-xs truncate capitalize">{user.role.toLowerCase()}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 text-sm font-semibold transition-colors duration-200 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-primary-light/40 bg-primary/40 backdrop-blur-md flex items-center justify-between px-8 z-10">
          <h2 className="text-white font-bold text-lg">
            {pathname === '/dashboard' && 'Dashboard Overview'}
            {pathname === '/dashboard/users' && 'User Management'}
            {pathname === '/dashboard/subscriptions' && 'Subscription & Referral Configuration'}
            {pathname === '/dashboard/payouts' && 'Referral Payouts Management'}
            {pathname === '/dashboard/settings' && 'AI Configuration Settings'}
            {pathname === '/dashboard/questions' && 'Questions Builder'}
            {pathname === '/dashboard/mock-exams' && 'Mock Exam Builder'}
            {pathname === '/dashboard/reviews' && 'Tutor Submissions Review'}
            {pathname === '/dashboard/broadcasts' && 'Broadcast Notifications'}
            {pathname === '/dashboard/tickets' && 'Support Tickets'}
          </h2>
          <div className="flex items-center gap-4">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald"></span>
            </span>
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-widest">Active Session</span>

            <button
              onClick={handleLogout}
              className="ml-2 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 text-xs font-semibold transition-colors duration-200 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </header>

        {/* Unattended Items Notification Bar */}
        {(unattendedCounts.unattendedPayouts > 0 || unattendedCounts.unattendedSubscriptions > 0) && (
          <div className="bg-gradient-to-r from-amber-500/10 to-gold/15 border-b border-gold/30 px-8 py-3 flex items-center justify-between text-xs md:text-sm shadow-md animate-pulse">
            <div className="flex items-center gap-2 text-gold font-bold">
              <span>🔔</span>
              <span>
                Attention: You have{' '}
                {unattendedCounts.unattendedPayouts > 0 && (
                  <span>
                    <Link href="/dashboard/payouts" className="underline hover:text-white">
                      {unattendedCounts.unattendedPayouts} pending payouts
                    </Link>
                  </span>
                )}
                {unattendedCounts.unattendedPayouts > 0 && unattendedCounts.unattendedSubscriptions > 0 && ' and '}
                {unattendedCounts.unattendedSubscriptions > 0 && (
                  <span>
                    <Link href="/dashboard/subscriptions" className="underline hover:text-white">
                      {unattendedCounts.unattendedSubscriptions} student bank receipts
                    </Link>
                  </span>
                )}
                {' '}to attend to.
              </span>
            </div>
            <Link
              href={unattendedCounts.unattendedPayouts > 0 ? '/dashboard/payouts' : '/dashboard/subscriptions'}
              className="bg-gold hover:bg-gold-dark text-primary font-black px-3.5 py-1 rounded text-[10px] uppercase tracking-wider transition-all"
            >
              Resolve Now
            </Link>
          </div>
        )}

        {/* Content View */}
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
