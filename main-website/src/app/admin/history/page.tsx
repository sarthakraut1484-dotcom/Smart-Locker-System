"use client";

import { useAdminStore } from "@/store/useAdminStore";
import { PageHeader, Badge, TableSkeleton } from "@/components/dashboard/Skeletons";
import { History, Filter, Download } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";

export default function HistoryPage() {
  const { bookings, isInitializing, showModal } = useAdminStore();
  const [search, setSearch]   = useState("");
  const [lockerId, setLockerId] = useState("");

  const filtered = useMemo(() => bookings.filter(b => {
    const matchUser   = !search   || (b.userName || "").toLowerCase().includes(search.toLowerCase());
    const matchLocker = !lockerId || String(b.lockerId) === lockerId;
    return matchUser && matchLocker;
  }), [bookings, search, lockerId]);

  const handleExport = () => {
    if (!filtered.length) {
      showModal("No Records Found", "There are no filtered records to export in the current view.", "warning");
      return;
    }
    const rows = [["ID","Locker","User","Email","Amount","Hours","Status","Date"]];
    filtered.forEach(b => rows.push([
      b.id, b.lockerId, b.userName || "N/A", b.userContact || "N/A",
      `₹${b.amount}`, `${b.hours || b.duration || 0}h`,
      b.status,
      new Date(b.createdAt || 0).toLocaleDateString("en-IN")
    ]));
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "booking_history.csv"; a.click();
  };

  const statusVariant = (s: string): any => {
    if (s === "COMPLETED") return "success";
    if (s === "ACTIVE" || s === "CONFIRMED") return "info";
    if (s === "EXPIRED") return "warning";
    return "default";
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Booking History" subtitle="Full transaction ledger with filter and export controls.">
        <button onClick={handleExport} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-primary/20">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </PageHeader>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text" placeholder="Search user..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary w-52"
          />
        </div>
        <input
          type="text" placeholder="Locker ID..." value={lockerId}
          onChange={e => setLockerId(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary w-36"
        />
        <span className="flex items-center text-xs text-muted-foreground ml-auto">
          Showing {filtered.length} / {bookings.length} records
        </span>
      </div>

      {isInitializing ? (
        <TableSkeleton rows={8} cols={7} />
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden border border-white/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-white/5 text-xs uppercase text-muted-foreground border-b border-white/5">
                <tr>
                  <th className="px-5 py-4">Booking ID</th>
                  <th className="px-5 py-4">Locker</th>
                  <th className="px-5 py-4">User</th>
                  <th className="px-5 py-4">Amount</th>
                  <th className="px-5 py-4">Duration</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center text-muted-foreground">
                      <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      No bookings match your filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((b, i) => (
                    <motion.tr
                      key={b.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(i * 0.03, 0.5) }}
                      className="border-b border-white/5 hover:bg-white/3 transition-colors"
                    >
                      <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{b.id.slice(0, 8)}…</td>
                      <td className="px-5 py-3 font-bold text-white">#{b.lockerId}</td>
                      <td className="px-5 py-3 text-primary">{b.userName || "N/A"}</td>
                      <td className="px-5 py-3 font-semibold text-emerald-400">₹{b.amount}</td>
                      <td className="px-5 py-3">{b.hours || b.duration || 0} hrs</td>
                      <td className="px-5 py-3"><Badge variant={statusVariant(b.status)}>{b.status}</Badge></td>
                      <td className="px-5 py-3 text-muted-foreground text-xs">
                        {new Date(b.createdAt || 0).toLocaleString("en-IN")}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
