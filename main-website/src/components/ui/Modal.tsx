"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, CheckCircle2, Info, AlertOctagon } from "lucide-react";
import { useAdminStore } from "@/store/useAdminStore";

export function GlobalModal() {
  const { modal, closeModal } = useAdminStore();

  if (!modal.isOpen) return null;

  const icons: Record<string, React.ReactElement> = {
    error:   <AlertOctagon className="w-12 h-12 text-rose-500 mb-4" />,
    success: <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-4" />,
    warning: <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />,
    info:    <Info className="w-12 h-12 text-blue-500 mb-4" />
  };

  const colors: Record<string, string> = {
    error:   "border-rose-500/30 shadow-rose-500/10",
    success: "border-emerald-500/30 shadow-emerald-500/10",
    warning: "border-amber-500/30 shadow-amber-500/10",
    info:    "border-blue-500/30 shadow-blue-500/10"
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeModal}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className={`relative w-full max-w-md bg-[#0D0E17] border ${colors[modal.type]} p-8 rounded-3xl shadow-2xl overflow-hidden`}
        >
          {/* Background Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-primary/10 blur-[60px] rounded-full pointer-events-none" />

          <button 
            onClick={closeModal}
            className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center text-center">
            {icons[modal.type]}
            <h2 className="text-2xl font-black text-white uppercase tracking-tight italic mb-2">
              {modal.title}
            </h2>
            <div className="text-gray-400 text-sm leading-relaxed font-medium whitespace-pre-line">
              {modal.message}
            </div>

            {modal.onConfirm ? (
              <div className="mt-8 flex gap-3 w-full">
                <button
                  onClick={closeModal}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest py-4 rounded-2xl border border-white/10 transition-all active:scale-95 text-[10px]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    modal.onConfirm?.();
                    closeModal();
                  }}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest py-4 rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95 text-[10px]"
                >
                  {modal.confirmLabel || "Confirm"}
                </button>
              </div>
            ) : (
              <button
                onClick={closeModal}
                className="mt-8 w-full bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest py-4 rounded-2xl border border-white/10 transition-all active:scale-95 text-[10px]"
              >
                Acknowledge & Close
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
