"use client";

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2, Server } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthenticated(true);
      } else {
        setAuthenticated(false);
        if (pathname !== '/login') {
          router.push('/login');
        }
      }
      setLoading(false);
    });

    return () => unsub();
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0B14] flex flex-col items-center justify-center gap-6">
        <Server className="w-12 h-12 text-primary animate-pulse shadow-glow" />
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
          <span className="text-[10px] font-black text-gray-700 uppercase tracking-[0.4em]">Establishing Uplink...</span>
        </div>
      </div>
    );
  }

  // If on login page, or authenticated, show children
  if (pathname === '/login' || authenticated) {
    return <>{children}</>;
  }

  // Prevent flash while redirecting
  return (
    <div className="min-h-screen bg-[#0A0B14]" />
  );
}
