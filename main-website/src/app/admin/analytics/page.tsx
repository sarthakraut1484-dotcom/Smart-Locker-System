"use client";

import { useAdminStore } from "@/store/useAdminStore";
import { PageHeader, Badge } from "@/components/dashboard/Skeletons";
import { RevenueLineChart, BookingBarChart } from "@/components/charts/Charts";
import { StatCard } from "@/components/dashboard/StatCard";
import { TrendingUp, BarChart3, Clock, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo } from "react";

export default function AnalyticsPage() {
  const { bookings, lockers, isInitializing } = useAdminStore();

  const totalRevenue  = bookings.reduce((s, b) => s + (Number(b.amount) || 0), 0);
  const totalBookings = bookings.length;
  const avgRevenue    = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0;
  const avgDuration   = totalBookings > 0
    ? (bookings.reduce((s, b) => s + (Number(b.hours || b.duration) || 0), 0) / totalBookings).toFixed(1)
    : "0";

  const lockerUtilization = useMemo(() => {
    const usage: Record<string, number> = {};
    bookings.forEach(b => { usage[`#${b.lockerId}`] = (usage[`#${b.lockerId}`] || 0) + 1; });
    return Object.entries(usage)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name, bookings]) => ({ name, bookings }));
  }, [bookings]);

  const revByDay = useMemo(() => {
    const map: Record<string, number> = {};
    
    // 1. Group by date string
    bookings.forEach(b => {
      if (!b.createdAt) return;
      const d = new Date(b.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      map[d] = (map[d] || 0) + (Number(b.amount) || 0);
    });

    // 2. Convert to array and sort by actual timestamp to maintain chronological order
    const sorted = Object.entries(map).map(([name, revenue]) => {
      // Find a representative timestamp for this grouping to sort correctly
      const rep = bookings.find(b => new Date(b.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) === name);
      return { name, revenue, ts: rep?.createdAt || 0 };
    }).sort((a, b) => a.ts - b.ts);

    return sorted.slice(-14).map(({ name, revenue }) => ({ name, revenue }));
  }, [bookings]);

  const peakDay = useMemo(() => {
    const map: Record<string, number> = {};
    bookings.forEach(b => {
      if (!b.createdAt) return;
      const d = new Date(b.createdAt).toLocaleDateString("en-IN", { weekday: "long" });
      map[d] = (map[d] || 0) + 1;
    });
    return Object.entries(map).sort(([, a], [, b]) => b - a)[0]?.[0] || "N/A";
  }, [bookings]);

  return (
    <div className="space-y-8">
      <PageHeader title="Analytics" subtitle="Historical trends and locker performance insights." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue"      value={`₹${totalRevenue.toLocaleString("en-IN")}`} icon={TrendingUp} color="amber"  loading={isInitializing} delay={0.0} />
        <StatCard label="Total Bookings"     value={totalBookings}        icon={BarChart3} color="blue"    loading={isInitializing} delay={0.1} />
        <StatCard label="Avg Booking Value"  value={`₹${avgRevenue}`}    icon={Star}      color="indigo"  loading={isInitializing} delay={0.2} />
        <StatCard label="Avg Session Length" value={`${avgDuration} hrs`} icon={Clock}     color="emerald" loading={isInitializing} delay={0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass-panel rounded-2xl p-6 border border-white/5"
        >
          <h2 className="text-base font-semibold text-white mb-1">Revenue Over Time</h2>
          <p className="text-xs text-muted-foreground mb-5">Daily cumulative revenue (last 14 days)</p>
          <div className="h-60">
            {revByDay.length > 0 ? <RevenueLineChart data={revByDay} /> : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">{isInitializing ? "Loading..." : "No data"}</div>}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="glass-panel rounded-2xl p-6 border border-white/5"
        >
          <h2 className="text-base font-semibold text-white mb-1">Most Popular Lockers</h2>
          <p className="text-xs text-muted-foreground mb-5">By number of bookings (all time)</p>
          <div className="h-60">
            {lockerUtilization.length > 0 ? <BookingBarChart data={lockerUtilization} /> : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">{isInitializing ? "Loading..." : "No data"}</div>}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="glass-panel rounded-2xl p-6 border border-white/5"
      >
        <div className="flex justify-between items-center mb-5">
          <div>
            <h2 className="text-base font-semibold text-white">Locker Utilization Breakdown</h2>
            <p className="text-xs text-muted-foreground">Ranked by total bookings</p>
          </div>
          <Badge variant="info">Peak: {peakDay}</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase border-b border-white/10">
              <tr>
                <th className="pb-3">Locker</th>
                <th className="pb-3">Total Bookings</th>
                <th className="pb-3">Utilization %</th>
                <th className="pb-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {lockerUtilization.map((row, i) => {
                const pct = totalBookings > 0 ? Math.round((row.bookings / totalBookings) * 100) : 0;
                return (
                  <tr key={i} className="hover:bg-white/3 transition-colors">
                    <td className="py-3 font-bold text-white">{row.name}</td>
                    <td className="py-3 text-muted-foreground">{row.bookings}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-white/5 rounded-full h-1.5 max-w-[120px]">
                          <div className="h-1.5 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{pct}%</span>
                      </div>
                    </td>
                    <td className="py-3 text-right"><Badge variant="success">Active</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
