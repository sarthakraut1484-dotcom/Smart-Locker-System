"use client";

import { useAdminStore } from '@/store/useAdminStore';
import { Lock, Unlock, Settings2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { decryptData } from '@/lib/crypto';

export default function LockersPage() {
  const { lockers, isInitializing, forceOpenLocker, endSession, showModal } = useAdminStore();

  const handleOverride = async (id: string) => {
    const locker = lockers[id];
    if (locker?.status === 'AVAILABLE') {
      showModal(
        'Operation Denied',
        `Locker #${id} is currently NOT BOOKED.\n\nFor security reasons, you cannot force open a vacant unit from this interface.\n\nPlease set as 'MAINTENANCE' to override.`,
        'warning'
      );
      return;
    }

    try {
      await forceOpenLocker(id);
      showModal(
        'Command Dispatched',
        `Remote OPEN command sent to Locker #${id}.\n\nThe hardware solenoid has been triggered successfully.`,
        'success'
      );
    } catch (err: any) {
      showModal('Override Failed', err.message, 'error');
    }
  };

  const handleReset = async (id: string) => {
    showModal(
      'Initialize Reset',
      `Are you sure you want to FORCE RESET Locker #${id}?\n\nThis will terminate any active session, clear the assigned PIN, and release the hardware lock immediately.`,
      'warning',
      async () => {
        try {
          await endSession(id);
          showModal('Locker Reset', `Unit #${id} has been successfully released and reset to AVAILABLE state.`, 'success');
        } catch (err: any) {
          showModal('Reset Failed', err.message, 'error');
        }
      },
      'Proceed with Reset'
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white shadow-sm">Fleet Manager</h1>
          <p className="text-muted-foreground mt-1">Live hardware oversight and manual override controls.</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-lg border border-emerald-400/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div> Total: {Object.keys(lockers).length}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isInitializing ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass-panel p-6 rounded-2xl animate-pulse h-48 border border-white/5"></div>
          ))
        ) : (
          Object.values(lockers).map((locker, i) => (
            <motion.div 
              key={locker.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="glass-panel p-6 rounded-2xl relative overflow-hidden group"
            >
              {/* Status Indicator Bar */}
              <div className={`absolute top-0 left-0 w-1 h-full 
                ${locker.status === 'AVAILABLE' ? 'bg-emerald-400' : 
                  locker.status === 'ACTIVE' || locker.status === 'OCCUPIED' ? 'bg-blue-400' : 
                  'bg-red-400'}`} 
              />
              
              <div className="flex justify-between items-start mb-4 pl-2">
                <div>
                  <h3 className="text-xl font-bold text-white tracking-wider">Unit #{locker.id}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    {locker.status === 'AVAILABLE' && <ShieldCheck className="w-3 h-3 text-emerald-400" />}
                    {locker.status === 'MAINTENANCE' && <AlertTriangle className="w-3 h-3 text-red-400" />}
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {locker.status}
                    </span>
                  </div>
                </div>
                
                <div className={`p-2 rounded-full ${locker.doorStatus === 'OPEN' ? 'bg-amber-400/20 text-amber-400' : 'bg-emerald-400/20 text-emerald-400'}`}>
                  {locker.doorStatus === 'OPEN' ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </div>
              </div>

              <div className="space-y-2 mb-6 pl-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current PIN</span>
                  <span className="font-mono text-white tracking-widest">
                    {locker.status === 'ACTIVE' && locker.currentPin ? '••••' : '---'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Occupancy</span>
                  <span className="font-medium text-white">{locker.occupancy}</span>
                </div>
              </div>

              <div className="flex gap-2 pl-2">
                <button 
                  onClick={() => handleOverride(locker.id)}
                  className="flex-1 bg-white/5 hover:bg-primary/20 text-white text-xs font-semibold py-2 px-3 rounded border border-white/10 hover:border-primary/50 transition-colors flex items-center justify-center gap-1"
                >
                  <Unlock className="w-3 h-3" /> Force Open
                </button>
                <button 
                  onClick={() => handleReset(locker.id)}
                  className="w-10 bg-white/5 hover:bg-white/10 text-white flex items-center justify-center rounded border border-white/10 transition-colors"
                  title="Force Reset Locker"
                >
                  <Settings2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
