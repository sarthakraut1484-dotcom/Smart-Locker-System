"use client";

import { useAdminStore } from '@/store/useAdminStore';
import { Activity, Clock, ShieldAlert, XCircle, Zap, Play, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export default function SessionsPage() {
  const { lockers, users, isInitializing, endSession, overrideStart, showModal } = useAdminStore();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  
  const activeLockers = Object.values(lockers).filter(l => l.status === 'ACTIVE' || l.status === 'OCCUPIED');

  const handleEnd = async (id: string) => {
    showModal(
      'Force Termination',
      `Are you sure you want to FORCE TERMINATE the session for Locker #${id}?\n\nThis action will stop the timer and release the lock immediately.`,
      'warning',
      async () => {
        setLoadingId(id);
        try {
          await endSession(id);
          showModal('Session Terminated', `Locker #${id} has been released and reset to AVAILABLE.`, 'success');
        } catch (err) {
          showModal('Command Failed', 'Could not terminate session. Please check hardware connectivity.', 'error');
        } finally {
          setLoadingId(null);
        }
      },
      'Terminate Session'
    );
  };

  const handleOverride = async (id: string) => {
    showModal(
      'Manual Override',
      `Open Locker #${id} without an active booking?\n\nThis will trigger the hardware solenoid and bypass the security gate.`,
      'info',
      async () => {
        setLoadingId(id);
        try {
          await overrideStart(id);
          showModal('Manual Override', `Locker #${id} has been triggered to OPEN.`, 'success');
        } catch (err) {
          showModal('Override Failed', 'Could not open locker. Hardware might be offline.', 'error');
        } finally {
          setLoadingId(null);
        }
      },
      'Confirm Unlock'
    );
  };

  return (
    <div className="space-y-10 pt-4">
      <div>
        <h1 className="text-5xl font-black text-white font-outfit uppercase italic tracking-tighter leading-none mb-1 text-shadow-glow">
          Active <span className="text-primary italic border-b-4 border-primary/20 pb-2">Sessions</span>
        </h1>
        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-6">Real-time hardware synchronization & telemetry.</p>
      </div>

      <div className="glass-panel rounded-[2.5rem] overflow-hidden border-white/5 shadow-2xl relative z-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.03] text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 border-b border-white/5">
              <tr>
                <th className="px-8 py-5">Locker Unit</th>
                <th className="px-8 py-5">User Manifest</th>
                <th className="px-8 py-5">Sync Status</th>
                <th className="px-8 py-5">Countdown</th>
                <th className="px-8 py-5 text-right">Operational Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {isInitializing ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                       <Activity className="w-6 h-6 text-primary animate-pulse" />
                       <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Decrypting Live Data...</span>
                    </div>
                  </td>
                </tr>
              ) : activeLockers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-20">
                      <Zap className="w-12 h-12 text-gray-400" />
                      <span className="text-xs font-bold uppercase tracking-[0.3em]">No active sessions detected</span>
                    </div>
                  </td>
                </tr>
              ) : (
                activeLockers.map((locker, i) => {
                  const isPending = !locker.startTime;
                  const remainingMs = locker.sessionEnd ? locker.sessionEnd - Date.now() : 0;
                  const h = Math.floor(Math.max(0, remainingMs) / 3600000);
                  const m = Math.floor((Math.max(0, remainingMs) % 3600000) / 60000);
                  const s = Math.floor((Math.max(0, remainingMs) % 60000) / 1000);

                  return (
                    <motion.tr 
                      key={locker.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-outfit text-lg font-black text-primary italic">
                             #{locker.id}
                           </div>
                           <div>
                             <div className="text-white font-bold text-sm font-outfit">Coach S3</div>
                             <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Unit Tracking Active</div>
                           </div>
                        </div>
                      </td>
                      
                      <td className="px-8 py-6">
                        <div className="text-white font-bold text-sm tracking-tight">
                          {locker.userName || (locker.userId ? users[locker.userId]?.name : null) || 'Guest User'}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                           <ShieldAlert className="w-3 h-3 text-primary/40" />
                           <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Verified Session</span>
                        </div>
                      </td>

                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-2">
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider w-fit border ${
                            isPending 
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]' 
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                          }`}>
                            <div className={`w-1 h-1 rounded-full ${isPending ? 'bg-amber-500 animate-pulse' : 'bg-emerald-400'}`} />
                            {isPending ? 'Reserved - Pending' : 'Live - In Progress'}
                          </div>
                          <div className="flex items-center gap-2 text-[8px] text-gray-600 font-bold uppercase tracking-widest pl-1">
                             <CheckCircle2 className="w-2.5 h-2.5" /> Physical Unlocks: {locker.unlockCount || 0}
                          </div>
                        </div>
                      </td>

                      <td className="px-8 py-6">
                        {isPending ? (
                          <div className="text-gray-600 font-black font-outfit text-xl tracking-tighter opacity-50">--:--:--</div>
                        ) : (
                          <div className="text-white font-black font-outfit text-xl tracking-tighter">
                            {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
                          </div>
                        )}
                      </td>

                      <td className="px-8 py-6 text-right">
                         <div className="flex justify-end gap-3">
                           {isPending && (
                             <button 
                               onClick={() => handleOverride(locker.id)}
                               disabled={loadingId === locker.id}
                               className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-primary/20 transition-all flex items-center gap-2"
                             >
                               {loadingId === locker.id ? "Syncing..." : <><Play className="w-3 h-3 fill-current" /> Force Start</>}
                             </button>
                           )}
                           <button 
                             onClick={() => handleEnd(locker.id)}
                             disabled={loadingId === locker.id}
                             className="px-4 py-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-rose-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                           >
                              {loadingId === locker.id ? "Ending..." : <><XCircle className="w-3.5 h-3.5" /> End Session</>}
                           </button>
                         </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
