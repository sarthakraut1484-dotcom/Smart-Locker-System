"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Target, Eye, Globe, Zap, Users } from 'lucide-react';

const AboutSection = ({ title, children, icon: Icon, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay }}
    className="glass-panel p-8 md:p-12 rounded-[2.5rem] mb-8 border-white/5 hover:border-primary/20 transition-all group"
  >
    <div className="flex flex-col md:flex-row gap-8 items-start">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
        <Icon className="w-7 h-7 text-primary" />
      </div>
      <div>
        <h2 className="text-2xl font-black text-white font-outfit uppercase italic mb-4 tracking-tight">{title}</h2>
        <div className="text-gray-400 leading-relaxed text-lg font-medium">
          {children}
        </div>
      </div>
    </div>
  </motion.div>
);

export default function AboutPage() {
  return (
    <div className="container mx-auto px-6 py-20 max-w-5xl">
      <div className="text-center mb-24">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-6xl md:text-7xl font-black text-white font-outfit uppercase italic tracking-tighter mb-6"
        >
          About <span className="text-primary italic">LocknLeave</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-gray-400 max-w-2xl mx-auto font-medium"
        >
          Innovation, security, and convenience — built for modern travelers and local urban explorers.
        </motion.p>
      </div>

      <div className="space-y-12">
        <AboutSection title="Who We Are" icon={Users} delay={0.1}>
          LocknLeave System is a next-generation solution for travelers, offering safe, automated storage lockers that
          can be booked online. With digital PIN access, 24/7 availability, and secure cloud management, we redefine
          luggage safety and ease of use.
        </AboutSection>

        <AboutSection title="Our Mission" icon={Target} delay={0.2}>
          We aim to eliminate travel stress by giving users secure, easy-to-access lockers at public places, railway
          stations, and airports. With real-time tracking, instant unlocks, and digital payments, we ensure peace of mind
          during every journey.
        </AboutSection>

        <AboutSection title="Our Vision" icon={Eye} delay={0.3}>
          To revolutionize personal storage across cities by integrating IoT-based lockers, providing not just security —
          but convenience powered by technology. We envision a world where physical baggage never holds back human mobility.
        </AboutSection>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="mt-32 p-12 rounded-[3.5rem] bg-linear-to-br from-primary/20 to-transparent border border-white/5 text-center"
      >
        <Globe className="w-16 h-16 text-primary mx-auto mb-8" />
        <h3 className="text-3xl font-black text-white font-outfit uppercase mb-4">India's First IoT Locker Network</h3>
        <p className="text-gray-400 max-w-lg mx-auto mb-8 font-medium">
          Starting with major railway hubs, we are expanding to every corner of the nation to make storage smarter.
        </p>
        <div className="flex flex-wrap justify-center gap-8">
          {[
            { label: 'Active Hubs', val: '50+' },
            { label: 'Happy Users', val: '100k+' },
            { label: 'Secure Hours', val: '1M+' }
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-4xl font-black text-white font-outfit">{stat.val}</div>
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
