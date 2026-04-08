"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

interface UserProfile {
  uid: string;
  email: string | null;
  name: string;
  credits: number;
}

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: UserProfile | null) => void;
  initAuth: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  initialized: false,

  setUser: (user) => set({ user, loading: false }),

  initAuth: () => {
    if (get().initialized) return;
    set({ initialized: true });

    onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Direct REAL-TIME listener for profile
        const userRef = doc(db, "users", firebaseUser.uid);
        onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const profile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: data.name || firebaseUser.displayName || 'User',
              credits: data.credits || 0
            };
            set({ user: profile, loading: false });
          } else {
            // Fallback if doc doesn't exist yet
            set({ 
              user: { 
                uid: firebaseUser.uid, 
                email: firebaseUser.email, 
                name: firebaseUser.displayName || 'User', 
                credits: 0 
              }, 
              loading: false 
            });
          }
        });
      } else {
        set({ user: null, loading: false });
      }
    });
  },
}));
