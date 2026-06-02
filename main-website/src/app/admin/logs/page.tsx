"use client";

import { useAdminStore } from "@/store/useAdminStore";
import { PageHeader, Badge } from "@/components/dashboard/Skeletons";
import { ScrollText, Activity } from "lucide-react";
import { motion } from "framer-motion";

export default function LogsPage() {
  const { adminLogs } = useAdminStore();

  const ACTION_COLOR: Record<string, any> = {
    "Force-Open":       "danger",
    "Force-Terminated": "danger",
    "Surge":            "success",
    "Pricing":          "info",
    "Reset":            "success",
    "Sync":             "success",
    "Start":            "success",
    "Override":         "success"
  };

  const getBadge = (action: string) => {
    if (!action) return "success";
    for (const key of Object.keys(ACTION_COLOR)) {
      if (action.includes(key)) return ACTION_COLOR[key];
    }
    return "success";
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Logs" subtitle="Immutable audit trail of all administrative actions.">
        <div className="flex items-center gap-2 bg-indigo-500/10 px-4 py-2 rounded-lg text-sm font-semibold border border-indigo-500/20 text-indigo-400">
           <Activity className="w-4 h-4" /> Live Manifest
        </div>
      </PageHeader>

      <div className="glass-panel rounded-2xl overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-white/5 text-xs uppercase text-muted-foreground border-b border-white/5">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Target Unit</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {adminLogs.map((log, i) => (
                <motion.tr key={log.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-6 py-4 text-muted-foreground text-xs font-mono">
                    {new Date(log.timestamp || log.createdAt).toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-4 font-semibold text-white uppercase tracking-tight text-xs">{log.action || "ACTION"}</td>
                  <td className="px-6 py-4 text-primary font-bold">{log.target || "GLOBAL"}</td>
                  <td className="px-6 py-4">
                    <Badge variant={getBadge(log.action)}>
                       {getBadge(log.action) === 'success' ? 'SUCCESS' : getBadge(log.action).toUpperCase()}
                    </Badge>
                  </td>
                </motion.tr>
              ))}
              {adminLogs.length === 0 && (
                <tr>
                   <td colSpan={4} className="px-6 py-20 text-center text-muted-foreground italic text-xs uppercase tracking-widest">
                     Logs are currently empty. Real-time audit data will appear here.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center pb-4">
        🔒 All logged actions are immutable. Connected to live <code>admin_logs</code> manifest.
      </p>
    </div>
  );
}
