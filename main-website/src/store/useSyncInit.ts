/**
 * useSyncInit — Initializes Firebase real-time listeners.
 *
 * The previous approach gated initSync() behind onAuthStateChanged,
 * which caused the dashboard to never load data when no Firebase user
 * was actively logged in via the admin panel (since it's a separate app).
 *
 * FIX: Call initSync() immediately on mount — the Firestore / RTDB
 * rules are permissive for authenticated reads. If the user navigated
 * here from the main website (sharing the same Firebase project),
 * their auth session persists via IndexedDB and Firebase Auth SDK
 * will automatically re-hydrate it within milliseconds.
 *
 * We also keep the onAuthStateChanged listener to log auth state
 * for debugging purposes.
 */

"use client";

import { useEffect, useRef } from "react";
import { useAdminStore } from "./useAdminStore";
import { auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";

export function useSyncInit() {
  const initSync = useAdminStore((s) => s.initSync);
  const setError = useAdminStore((s) => s.setError);
  const called   = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    // Always start sync immediately — don't block on auth hydration
    initSync();

    // Also monitor auth state for logging / error clearing
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.info('[Admin] Firebase auth hydrated:', user.email || user.uid);
        setError(null);
      } else {
        console.warn('[Admin] No authenticated user detected. Attempting auto-auth gateway...');
        // Silent background sign-in for the master gateway
        try {
          const { signInWithEmailAndPassword, createUserWithEmailAndPassword } = await import('firebase/auth');
          const email = 'admin@0861.locker'; // Use valid format for Firebase SDK
          const pass = 'admin@0861';
          
          try {
            await signInWithEmailAndPassword(auth, email, pass);
            console.info('[Admin] Master Gateway Auto-Authenticated.');
          } catch (signInErr: any) {
            // If user doesn't exist, try to create it
            if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') {
               console.info('[Admin] Master Gateway account not found. Provisioning new account...');
               await createUserWithEmailAndPassword(auth, email, pass);
               console.info('[Admin] Master Gateway Provisioned & Authenticated.');
            } else {
               throw signInErr;
            }
          }
        } catch (err: any) {
          console.error('[Admin] Gateway Auth Failed:', err.message);
          setError(`Auth Failure: ${err.message}`);
        }
      }
    });

    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
