"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Phone, UserPlus, ArrowLeft, Loader2, Rocket } from 'lucide-react';
import { auth, db } from '@/lib/firebase/config';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await setDoc(doc(db, "users", user.uid), {
        name, email, phone, createdAt: Date.now(), uid: user.uid, credits: 0
      });
      alert("Account created successfully!");
      router.push('/login');
    } catch (err: any) {
      setError(err.message || "Signup failed.");
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    const provider = new GoogleAuthProvider();
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, "users", user.uid), {
          name: user.displayName || user.email?.split('@')[0],
          email: user.email,
          phone: "Not provided",
          createdAt: Date.now(),
          uid: user.uid,
          provider: "google",
          credits: 0
        });
      }
      router.push('/dashboard');
    } catch (err: any) {
      setLoading(false);
      if (err.code !== 'auth/popup-closed-by-user') setError("Google sign-up failed.");
    }
  };

  const GoogleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-6 py-10 overflow-y-auto">
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="w-full max-w-[440px] my-auto">
        <div className="bg-[#0f0f0f]/95 backdrop-blur-3xl rounded-[24px] p-10 border border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden ring-1 ring-white/5">
          
          <div className="text-center mb-8 relative z-10">
            <div className="w-16 h-16 rounded-[20px] bg-indigo-500/10 flex items-center justify-center mx-auto mb-4 text-indigo-400">
              <UserPlus className="w-8 h-8" />
            </div>
            <h2 className="text-[26px] font-bold text-white mb-1 font-outfit tracking-tight leading-none">Create Account</h2>
            <p className="text-slate-400 text-[15px] font-medium tracking-tight">Join LocknLeave System today</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4 relative z-10">
            <div className="space-y-2 text-left">
               <label className="text-[14px] font-bold text-white ml-1">Full Name</label>
               <input type="text" value={name} onChange={e => setName(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl py-4 px-4 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                  placeholder="John Doe" required />
            </div>

            <div className="space-y-2 text-left">
               <label className="text-[14px] font-bold text-white ml-1">Email Address</label>
               <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl py-4 px-4 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                  placeholder="name@example.com" required />
            </div>

            <div className="space-y-2 text-left">
               <label className="text-[14px] font-bold text-white ml-1">Phone Number</label>
               <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl py-4 px-4 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                  placeholder="Phone Number" required />
            </div>

            <div className="space-y-2 text-left">
               <label className="text-[14px] font-bold text-white ml-1">Password</label>
               <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl py-4 px-4 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                  placeholder="Password" required />
            </div>

            <div className="space-y-2 text-left">
               <label className="text-[14px] font-bold text-white ml-1">Confirm Password</label>
               <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl py-4 px-4 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                  placeholder="Confirm Password" required />
            </div>

            {error && <div className="text-rose-500 text-xs font-semibold text-center mt-1">{error}</div>}

            <button disabled={loading} className="w-full bg-indigo-500 hover:bg-indigo-600 active:scale-[0.98] text-white py-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg shadow-indigo-500/20 mt-4 text-sm uppercase tracking-wider">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <> <Rocket className="w-5 h-5" /> Create Account </>}
            </button>
          </form>

          <div className="relative my-7 relative z-10">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
            <div className="relative flex justify-center text-[13px] font-medium leading-none">
              <span className="bg-[#0f0f0f] px-4 text-slate-500">or join with</span>
            </div>
          </div>

          <button onClick={handleGoogleSignup} className="w-full bg-white/5 border border-white/10 text-white py-3.5 rounded-xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all mb-7 font-bold text-sm">
            <GoogleIcon /> Sign up with Google
          </button>

          <div className="text-center">
             <p className="text-sm text-slate-400 font-medium mb-3">
               Already have an account? <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-bold ml-1">Log In</Link>
             </p>
             <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-white transition-colors">
               <ArrowLeft className="w-4 h-4" /> ← Back to Home
             </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
