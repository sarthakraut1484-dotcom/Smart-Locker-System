"use client";

import { useAdminStore } from "@/store/useAdminStore";
import { PageHeader, Badge } from "@/components/dashboard/Skeletons";
import { AlertTriangle, AlertCircle, Info, CheckCircle, Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const PRIORITY_MAP: any = {
  HIGH:   { variant: "danger"  as const, icon: AlertTriangle, label: "CRITICAL" },
  MEDIUM: { variant: "warning" as const, icon: AlertCircle,   label: "WARNING"  },
  LOW:    { variant: "info"    as const, icon: Info,           label: "INFO"     },
};

export default function AlertsPage() {
  const { alerts, acknowledgeAlert } = useAdminStore();
  const [filter, setFilter] = useState<"ALL" | "HIGH" | "MEDIUM" | "LOW">("ALL");

  const filtered = alerts.filter(a => filter === "ALL" || a.priority === filter);
  const unackCount = alerts.filter(a => !a.acknowledged).length;

  const formatTime = (ts: any) => {
    const timestamp = typeof ts === 'number' ? ts : (ts?.toMillis?.() || Date.now());
    const diff = Date.now() - timestamp;
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Alert Center" subtitle="Real-time security and hardware anomaly notifications.">
        <div className="flex items-center gap-2 bg-emerald-500/10 px-4 py-2 rounded-lg text-sm font-semibold border border-emerald-500/20 text-emerald-400">
           <CheckCircle className="w-4 h-4" /> Live Syncing
        </div>
      </PageHeader>

      {/* Summary row */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="flex items-center gap-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 px-4 py-2 rounded-xl text-sm font-semibold">
          <Bell className="w-4 h-4" /> {unackCount} Unacknowledged
        </div>
        {(["ALL","HIGH","MEDIUM","LOW"] as const).map(p => (
          <button key={p} onClick={() => setFilter(p)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === p ? "bg-primary text-primary-foreground" : "bg-white/5 text-muted-foreground hover:bg-white/10"}`}>
            {p}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">{filtered.length} alerts</span>
      </div>

      {/* Alert List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filtered.map((alert) => {
            const p = PRIORITY_MAP[alert.priority] || PRIORITY_MAP.MEDIUM;
            const Icon = p.icon;
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`glass-panel rounded-xl p-5 border flex items-start justify-between gap-4 transition-opacity ${alert.acknowledged ? "opacity-50" : ""} ${alert.priority === "HIGH" ? "border-rose-500/30" : alert.priority === "MEDIUM" ? "border-amber-500/30" : "border-blue-500/30"}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${alert.priority === "HIGH" ? "bg-rose-500/10 text-rose-400" : alert.priority === "MEDIUM" ? "bg-amber-500/10 text-amber-400" : "bg-blue-500/10 text-blue-400"}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={p.variant}>{p.label}</Badge>
                      <span className="text-xs font-mono text-muted-foreground">Locker #{alert.lockerId}</span>
                      <span className="text-xs text-muted-foreground">{alert.type?.replace("_", " ") || "GENERAL"}</span>
                    </div>
                    <p className="text-sm text-white font-medium">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatTime(alert.timestamp)}</p>
                  </div>
                </div>
                {!alert.acknowledged && (
                  <button
                    onClick={() => acknowledgeAlert(alert.id)}
                    className="shrink-0 flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-lg border border-emerald-500/20 transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Acknowledge
                  </button>
                )}
                {alert.acknowledged && <span className="shrink-0 text-xs text-muted-foreground italic">Resolved</span>}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="glass-panel rounded-2xl p-16 text-center border border-white/5">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-400 opacity-60" />
            <p className="text-muted-foreground">All clear — no live alerts found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
