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
        <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 font-semibold text-sm">Redirecting to Dashboard...</p>
      </div>
    </div>
  );
}
