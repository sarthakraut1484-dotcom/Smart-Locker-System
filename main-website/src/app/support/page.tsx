"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  MessageSquare, 
  Phone, 
  HelpCircle, 
  MapPin, 
  Globe, 
  Clock,
  Send,
  CheckCircle,
  Loader2,
  ChevronRight
} from 'lucide-react';

const SupportCard = ({ icon: Icon, title, desc, actionText, actionLink, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay }}
    className="glass-panel p-8 rounded-3xl text-center border-white/5 hover:border-primary/20 transition-all group"
  >
    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
      <Icon className="w-8 h-8 text-primary" />
    </div>
    <h3 className="text-xl font-bold text-white font-outfit uppercase italic mb-3">{title}</h3>
    <p className="text-gray-400 font-medium text-sm mb-6 leading-relaxed">{desc}</p>
    <button 
      onClick={() => window.location.href = actionLink}
      className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px] mx-auto group-hover:gap-4 transition-all"
    >
      {actionText} <ChevronRight className="w-4 h-4" />
    </button>
  </motion.div>
);

export default function SupportPage() {
  const [formState, setFormState] = useState<'idle' | 'submitting' | 'success'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormState('submitting');
    setTimeout(() => setFormState('success'), 2000);
  };

  return (
    <div className="container mx-auto px-6 py-20 max-w-6xl">
      <div className="text-center mb-24">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-6xl md:text-7xl font-black text-white font-outfit uppercase italic tracking-tighter mb-6"
        >
          We're Here to <span className="text-primary italic">Help</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-gray-400 max-w-2xl mx-auto font-medium"
        >
          Get in touch with our support command center for any technical or service related assistance.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-32">
        <SupportCard 
          icon={Mail} 
          title="Email Direct" 
          desc="Send us an email and we'll respond within 24 hours." 
          actionText="support@locknleave.com" 
          actionLink="mailto:support@locknleave.com"
          delay={0.1}
        />
        <SupportCard 
          icon={MessageSquare} 
          title="Live Chat" 
          desc="Priority real-time assistance for active locker sessions." 
          actionText="Start Transmission" 
          actionLink="#"
          delay={0.2}
        />
        <SupportCard 
          icon={Phone} 
          title="Phone Support" 
          desc="Voice assistance available Mon-Sat, 9AM - 8PM IST." 
          actionText="+91 123 456 7890" 
          actionLink="tel:+911234567890"
          delay={0.3}
        />
        <SupportCard 
          icon={HelpCircle} 
          title="Knowledge base" 
          desc="Browse our detailed guides and common solutions." 
          actionText="Explore FAQ" 
          actionLink="/faq"
          delay={0.4}
        />
        <SupportCard 
          icon={MapPin} 
          title="Visit Hub" 
          desc="Stop by our physical headquarters for enterprise queries." 
          actionText="Get Directions" 
          actionLink="/contact"
          delay={0.5}
        />
        <SupportCard 
          icon={Globe} 
          title="Social Pulse" 
          desc="Follow us for maintenance updates and status pings." 
          actionText="@LocknLeave" 
          actionLink="#"
          delay={0.6}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-stretch">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="glass-panel p-12 rounded-[3.5rem] border-white/5 flex flex-col justify-center"
        >
          <div className="space-y-10">
            <div>
              <h2 className="text-3xl font-black text-white font-outfit uppercase italic mb-6">Operating <span className="text-primary">Timeline</span></h2>
              <div className="space-y-4">
                {[
                  { day: 'Mon - Fri', time: '09:00 - 20:00 IST' },
                  { day: 'Saturday', time: '10:00 - 18:00 IST' },
                  { day: 'Sunday', time: 'Emergency Email Only' }
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center pb-4 border-b border-white/5">
                    <span className="text-gray-400 font-bold uppercase tracking-widest text-xs">{item.day}</span>
                    <span className="text-white font-black font-outfit">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-linear-to-br from-primary/10 to-transparent border border-primary/20">
               <div className="text-primary font-black uppercase tracking-[0.2em] text-[10px] mb-4">Security Protocol</div>
               <p className="text-gray-400 text-sm leading-relaxed">
                 Our support agents will NEVER ask for your account password or payment card full details. Only provide your Booking ID when requested.
               </p>
            </div>
          </div>
        </motion.div>

        <motion.div
           initial={{ opacity: 0, x: 30 }}
           whileInView={{ opacity: 1, x: 0 }}
           viewport={{ once: true }}
           className="glass-panel p-10 md:p-14 rounded-[3.5rem] border-white/5"
        >
          {formState === 'success' ? (
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="text-center py-20"
             >
               <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
                 <CheckCircle className="w-10 h-10 text-emerald-500" />
               </div>
               <h3 className="text-2xl font-black text-white font-outfit uppercase italic mb-4">Ticket Generated</h3>
               <p className="text-gray-400 font-medium mb-10 max-w-xs mx-auto">Reference #SUPPORT-{Math.floor(Math.random() * 8999) + 1000}. Our team is reviewing your transmission.</p>
               <button onClick={() => setFormState('idle')} className="text-primary font-black uppercase tracking-widest text-xs">Generate New Ticket</button>
             </motion.div>
          ) : (
            <>
              <h2 className="text-2xl font-black text-white font-outfit uppercase italic mb-8">Submit a <span className="text-primary">Request</span></h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-4">Full Name</label>
                  <input required type="text" placeholder="John Doe" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-gray-700 focus:border-primary/50 outline-hidden transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-4">Email Address</label>
                  <input required type="email" placeholder="john@example.com" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-gray-700 focus:border-primary/50 outline-hidden transition-all" />
                </div>
                <div className="space-y-2 col-span-full">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-4">Issue Category</label>
                  <select required className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-primary/50 outline-hidden transition-all appearance-none cursor-pointer">
                    <option value="" disabled className="bg-black text-gray-700">Select Category</option>
                    <option value="booking" className="bg-black">Booking Issues</option>
                    <option value="payment" className="bg-black">Payment Problems</option>
                    <option value="hardware" className="bg-black">Locker Malfunction</option>
                    <option value="other" className="bg-black">General Query</option>
                  </select>
                </div>
                <div className="space-y-2 col-span-full">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-4">Problem Detail</label>
                  <textarea required rows={5} placeholder="Describe your issue in detail..." className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-gray-700 focus:border-primary/50 outline-hidden transition-all resize-none" />
                </div>
                <button type="submit" disabled={formState === 'submitting'} className="col-span-full btn-primary py-5 text-lg flex items-center justify-center gap-3">
                  {formState === 'submitting' ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>Submit Security Ticket <Send className="w-5 h-5" /></>
                  )}
                </button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
