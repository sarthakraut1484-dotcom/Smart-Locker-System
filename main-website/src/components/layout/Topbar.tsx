"use client";

import { useAdminStore } from "@/store/useAdminStore";
import { RefreshCw, Download, Activity, Bell, AlertTriangle, CloudIcon, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function downloadAllData() {
  const { bookings } = useAdminStore.getState();
  if (!bookings.length) { alert("No booking data available to export."); return; }
  const rows = [["ID","Locker","User","Contact","Amount (₹)","Hours","Duration (ms)","Status","Date","Start Time"]];
  bookings.forEach(b => rows.push([
    b.id,
    `#${b.lockerId}`,
    b.userName || "N/A",
    b.userContact || "N/A",
    String(b.amount),
    String(b.hours),
    String(b.duration || 0),
    b.status,
    new Date(b.createdAt).toLocaleDateString("en-IN"),
    b.startTime ? new Date(b.startTime).toLocaleTimeString("en-IN") : "N/A",
  ]));
  const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `locknleave_full_export_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function Topbar() {
  const { pulse, initSync, isInitializing, error } = useAdminStore();

  const handleSync = () => {
    useAdminStore.setState({ initialized: false, isInitializing: true, error: null });
    setTimeout(() => initSync(), 100);
  };

  return (
    <>
      <header className="h-20 bg-background/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-8 sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/10 group cursor-pointer hover:bg-white/10 transition-all">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Compute Sync</span>
            <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none ml-2 border-l border-white/10 pl-4">{process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'ASEP-SMART-LOCKER'}</span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={handleSync} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all active:scale-95">
            <RefreshCw className="w-3.5 h-3.5" /> Sync All Data
          </button>
          <button onClick={downloadAllData} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          
          <div className="w-px h-8 bg-white/10 mx-2" />
          
          <div className="relative">
            <button className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all group">
              <Bell className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-rose-500 rounded-full border-2 border-background" />
            </button>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-rose-500/10 border-b border-rose-500/30 px-10 py-3 flex items-center gap-3 z-30"
          >
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest leading-none mb-1 text-shadow-glow">Firebase Connection Error</p>
              <p className="text-[10px] text-rose-400/60 font-bold tracking-tight truncate">{error}</p>
            </div>
            <p className="text-[8px] text-rose-400/40 uppercase font-black tracking-widest hidden md:block">
              Verify Credentials & Connectivity
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

