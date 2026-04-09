"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Scale, CreditCard, Ban, Radio, Database } from 'lucide-react';

const TermBox = ({ title, children, icon: Icon, delay }: any) => (
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

export default function TermsPage() {
  return (
    <div className="container mx-auto px-6 py-20 max-w-4xl">
      <div className="text-center mb-16">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-black text-white font-outfit uppercase italic tracking-tighter mb-4"
        >
          Terms & <span className="text-primary italic">Conditions</span>
        </motion.h1>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Last updated: January 2025</p>
      </div>

      <div className="space-y-6">
        <TermBox title="1. User Responsibility" icon={Scale} delay={0.1}>
          Users are responsible for ensuring that their belongings are securely placed and manually locked. The company is not
          liable for damage due to improper use of the lockers. Do not store illegal, restricted, or hazardous items.
        </TermBox>

        <TermBox title="2. Payment Policy" icon={CreditCard} delay={0.2}>
          All bookings are prepaid and non-refundable. Each session is digitally time-tracked and must be renewed before expiration
          to avoid account penalties or automatic locker locking. Early termination may result in loyalty credits.
        </TermBox>

        <TermBox title="3. Security & Access" icon={Ban} delay={0.3}>
          Access PINs are unique per session and should not be shared. Unauthorized access attempts, sharing of credentials, or
          physical tampering with the locker hardware will result in immediate and permanent account suspension.
        </TermBox>

        <TermBox title="4. Service Availability" icon={Radio} delay={0.4}>
          LocknLeave strives for 24/7 uptime; however, scheduled maintenance or technical network interruptions may occur.
          We are not liable for incidental losses caused by unforeseen downtime or hardware latency.
        </TermBox>

        <TermBox title="5. Data Privacy" icon={Database} delay={0.5}>
          User data is encrypted and used solely for booking verification and security log analysis. No personal data is shared with
          third parties without explicit legal requirement.
        </TermBox>
      </div>
    </div>
  );
}
