'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomeRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-amethyst border-t-transparent rounded-full animate-spin shadow-lg shadow-amethyst/30" />
        <p className="text-purple-300 font-bold text-sm">Launching AuraLingo AI Coach...</p>
      </div>
    </div>
  );
}
