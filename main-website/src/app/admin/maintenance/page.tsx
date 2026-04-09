"use client";

import { useAdminStore } from "@/store/useAdminStore";
import { PageHeader, Badge } from "@/components/dashboard/Skeletons";
import { Wrench, CheckCircle, AlertCircle, Plus, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { db } from "@/lib/firebase/config";
import { collection, addDoc } from "firebase/firestore";

export default function MaintenancePage() {
  const { lockers, maintenanceLogs, resolveMaintenance, showModal } = useAdminStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ lockerId: "", issue: "", notes: "" });
  const [loading, setLoading] = useState(false);

  const addLog = async () => {
    if (!form.lockerId || !form.issue) return;
    setLoading(true);
    try {
      await addDoc(collection(db, "maintenance_logs"), {
        lockerId: form.lockerId,
        issue: form.issue,
        notes: form.notes,
        status: "OPEN",
        createdAt: Date.now()
      });
      setForm({ lockerId: "", issue: "", notes: "" });
      setShowForm(false);
      showModal('Request Logged', `Maintenance ticket for Locker #${form.lockerId} has been submitted successfully to the engineering queue.`, 'success');
    } catch (err) {
      console.error(err);
      showModal('Submission Failed', 'Failed to submit maintenance request. Check your cloud connection.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const statusMap: Record<string, any> = {
    OPEN: "danger", IN_PROGRESS: "warning", RESOLVED: "success"
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Maintenance" subtitle="Track hardware issues and locker service logs.">
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" /> Log Issue
        </button>
      </PageHeader>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Open Issues",       count: maintenanceLogs.filter(l => l.status === "OPEN").length,        color: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
          { label: "In Progress",       count: maintenanceLogs.filter(l => l.status === "IN_PROGRESS").length, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
          { label: "Resolved (Total)",  count: maintenanceLogs.filter(l => l.status === "RESOLVED").length,    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
        ].map((s, i) => (
          <div key={i} className={`glass-panel rounded-2xl p-5 border ${s.color}`}>
            <p className="text-xs uppercase tracking-widest mb-2 opacity-70">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color.split(" ")[0]}`}>{s.count}</p>
          </div>
        ))}
      </div>

      {/* New Issue Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4 overflow-hidden">
            <h3 className="font-semibold text-white">Log New Maintenance Issue</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Locker ID</label>
                <input value={form.lockerId} onChange={e => setForm(p => ({ ...p, lockerId: e.target.value }))}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary text-sm" placeholder="e.g. 5" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Issue Description</label>
                <input value={form.issue} onChange={e => setForm(p => ({ ...p, issue: e.target.value }))}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary text-sm" placeholder="Describe the problem" />
              </div>
            </div>
            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary text-sm" rows={2} placeholder="Additional notes (optional)" />
            <div className="flex gap-3 justify-end">
              <button disabled={loading} onClick={() => setShowForm(false)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm border border-white/10 transition-colors">Cancel</button>
              <button disabled={loading} onClick={addLog} className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Request"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logs Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-white/5 text-xs uppercase text-muted-foreground border-b border-white/5">
              <tr>
                <th className="px-6 py-4">Locker</th>
                <th className="px-6 py-4">Issue</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Reported</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {maintenanceLogs.map((log, i) => (
                <motion.tr key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                  className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-6 py-4 font-bold text-white">#{log.lockerId}</td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-white">{log.issue}</p>
                    {log.notes && <p className="text-xs text-muted-foreground mt-0.5">{log.notes}</p>}
                  </td>
                  <td className="px-6 py-4"><Badge variant={statusMap[log.status] || "default"}>{log.status?.replace("_", " ") || "UNKNOWN"}</Badge></td>
                  <td className="px-6 py-4 text-muted-foreground text-xs">{new Date(log.createdAt).toLocaleString("en-IN")}</td>
                  <td className="px-6 py-4 text-right">
                    {log.status !== "RESOLVED" ? (
                      <button onClick={() => resolveMaintenance(log.id)}
                        className="flex items-center gap-1.5 ml-auto bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-lg border border-emerald-500/20 transition-colors">
                        <CheckCircle className="w-3.5 h-3.5" /> Mark Resolved
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Closed</span>
                    )}
                  </td>
                </motion.tr>
              ))}
              {maintenanceLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic text-xs uppercase tracking-widest">
                    No active maintenance records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
