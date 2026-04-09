"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative px-6 pt-16 pb-24 text-center">
        <div className="container mx-auto">
          {/* Hero Badges */}
          <div className="inline-flex flex-wrap justify-center gap-3 mb-10 bg-white/5 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
              <span className="text-amber-500">⚡</span> Instant Booking
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest border-l border-white/10 pl-3">
              <span className="text-primary">🛡️</span> Secure
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest border-l border-white/10 pl-3">
              <span className="text-emerald-500">🕒</span> 24/7 Access
            </div>
          </div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black text-white font-outfit mb-6 leading-[1.1] tracking-tighter"
          >
            Secure Your Luggage,<br />
            <span className="text-primary italic">Travel Hands-Free</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed font-medium"
          >
            Experience the ultimate freedom of travel with our fully automated, secure LocknLeaves. Book in seconds, access anytime.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row justify-center gap-5"
          >
            <button 
              onClick={() => router.push('/login')}
              className="px-12 py-4.5 bg-primary text-white rounded-full font-bold text-lg shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95"
            >
              Book a Locker Now
            </button>
            <button 
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-12 py-4.5 bg-white/5 text-white border border-white/10 rounded-full font-bold text-lg hover:bg-white/10 transition-all active:scale-95 backdrop-blur-md"
            >
              How it Works
            </button>
          </motion.div>
        </div>
      </section>

      {/* Process Section */}
      <section id="how-it-works" className="py-28 px-6 relative border-t border-white/5">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white font-outfit mb-4">Simple Process</h2>
            <p className="text-gray-500 text-lg">Get started in just three easy steps.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ProcessCard 
              number="1"
              title="Book Online"
              description="Choose your location, select a locker size, and pay securely in seconds."
            />
            <ProcessCard 
              number="2"
              title="Get Your Code"
              description="Receive an instant digital key and PIN via email and SMS for easy access."
            />
            <ProcessCard 
              number="3"
              title="Store & Go"
              description="Scan your code, drop your bags, and enjoy your day worry-free."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="container mx-auto">
          <div className="bg-linear-to-br from-primary/20 to-primary-dark/10 border border-white/10 rounded-[3rem] p-12 md:p-24 text-center backdrop-blur-3xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-primary to-transparent opacity-50" />
            
            <h2 className="text-4xl md:text-5xl font-black text-white font-outfit mb-6 tracking-tight">Ready to lighten your load?</h2>
            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto font-medium">Join thousands of travelers who trust LocknLeave for secure luggage storage.</p>
            
            <button 
              onClick={() => router.push('/signup')}
              className="px-14 py-5 bg-primary text-white rounded-full font-bold text-xl shadow-2xl shadow-primary/40 hover:scale-105 transition-transform active:scale-95"
            >
              Get Started for Free
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

const ProcessCard = ({ number, title, description }: any) => (
  <motion.div 
    whileHover={{ translateY: -8 }}
    className="p-10 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md text-left transition-all hover:border-primary/20 group"
  >
    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold font-outfit mb-8 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
      {number}
    </div>
    <h3 className="text-2xl font-bold text-white mb-4 font-outfit tracking-tight italic uppercase">{title}</h3>
    <p className="text-gray-500 font-medium leading-relaxed">{description}</p>
  </motion.div>
);
