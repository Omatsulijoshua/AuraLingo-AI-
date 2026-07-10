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

  useEffect(() => {
    const activeUser = api.getUser();
    const token = localStorage.getItem('accessToken');

    if (!token || !activeUser || activeUser.role === 'STUDENT') {
      api.clearTokens();
      router.push('/auth/login');
    } else {
      setUser(activeUser);
      setLoading(false);
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
    { name: 'Payout Requests', path: '/dashboard/payouts', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { name: 'System Settings', path: '/dashboard/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
    { name: 'Tutor Reviews', path: '/dashboard/reviews', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
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
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-gold text-primary shadow-lg shadow-gold/15'
                      : 'text-slate-400 hover:bg-primary-light/30 hover:text-white'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={link.icon} />
                  </svg>
                  {link.name}
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
            {pathname === '/dashboard/settings' && 'AI Configuration Settings'}
            {pathname === '/dashboard/reviews' && 'Tutor Submissions Review'}
          </h2>
          <div className="flex items-center gap-4">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald"></span>
            </span>
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-widest">Active Session</span>
          </div>
        </header>

        {/* Content View */}
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
