"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Fingerprint, Share2, Cookie, UserCheck } from 'lucide-react';

const PolicyBlock = ({ title, children, icon: Icon, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay }}
    className="glass-panel p-8 rounded-3xl mb-6 border-white/5 hover:border-primary/20 transition-all group"
  >
    <div className="flex gap-6 items-start">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-white font-outfit uppercase tracking-tight mb-3">{title}</h3>
        <p className="text-gray-400 leading-relaxed font-medium">
          {children}
        </p>
      </div>
    </div>
  </motion.div>
);

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-6 py-20 max-w-4xl">
      <div className="text-center mb-16">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-black text-white font-outfit uppercase italic tracking-tighter mb-4"
        >
          Privacy <span className="text-primary italic">Policy</span>
        </motion.h1>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Last updated: January 2025</p>
      </div>

      <div className="space-y-6">
        <PolicyBlock title="1. Data Collection" icon={Fingerprint} delay={0.1}>
          We collect only essential information such as name, email, phone, and booking details to provide locker
          services effectively. We may collect usage data to improve our services and ensure hardware reliability.
        </PolicyBlock>

        <PolicyBlock title="2. Data Security" icon={ShieldAlert} delay={0.2}>
          All data is encrypted using AES-256 encryption. Only authorized personnel and secure cloud servers have access 
          to session information. We use industry-standard security measures to protect your physical and digital assets.
        </PolicyBlock>

        <PolicyBlock title="3. Third-Party Sharing" icon={Share2} delay={0.3}>
          LocknLeave does not sell or share your personal data with advertisers. Payment transactions are handled by
          trusted, compliant third-party gateways (e.g., Stripe, Razorpay) and we do not store your payment card details.
        </PolicyBlock>

        <PolicyBlock title="4. Cookies" icon={Cookie} delay={0.4}>
          Our site uses cookies for smooth operation, session management, and analytics. You can choose to disable
          cookies in your browser settings, though some features like persistence and real-time sync may be impacted.
        </PolicyBlock>

        <PolicyBlock title="5. User Rights" icon={UserCheck} delay={0.5}>
          You can request to view, update, or delete your stored data anytime by contacting support@locknleave.com. You
          have the right to be forgotten and can close your account at any time.
        </PolicyBlock>
      </div>
    </div>
  );
}
