"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; positive: boolean };
  color: "blue" | "emerald" | "amber" | "rose" | "indigo" | "violet";
  loading?: boolean;
  delay?: number;
}

const COLOR_MAP = {
  blue:    { bg: "bg-blue-500/10",   text: "text-blue-400",    border: "border-blue-500/20",    glow: "shadow-blue-500/10" },
  emerald: { bg: "bg-emerald-500/10",text: "text-emerald-400", border: "border-emerald-500/20", glow: "shadow-emerald-500/10" },
  amber:   { bg: "bg-amber-500/10",  text: "text-amber-400",   border: "border-amber-500/20",   glow: "shadow-amber-500/10" },
  rose:    { bg: "bg-rose-500/10",   text: "text-rose-400",    border: "border-rose-500/20",    glow: "shadow-rose-500/10" },
  indigo:  { bg: "bg-indigo-500/10", text: "text-indigo-400",  border: "border-indigo-500/20",  glow: "shadow-indigo-500/10" },
  violet:  { bg: "bg-violet-500/10", text: "text-violet-400",  border: "border-violet-500/20",  glow: "shadow-violet-500/10" },
};

export function StatCard({ label, value, icon: Icon, trend, color, loading = false, delay = 0 }: StatCardProps) {
  const c = COLOR_MAP[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 260, damping: 20 }}
      className={cn(
        "glass-panel rounded-2xl p-6 border hover:border-opacity-60 transition-all duration-300 cursor-default group relative overflow-hidden",
        c.border
      )}
    >
      {/* Glow blob */}
      <div className={cn("absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity", c.bg)} />

      <div className="relative flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">{label}</p>
          {loading ? (
            <div className="h-9 w-28 bg-white/5 rounded-lg animate-pulse" />
          ) : (
            <h3 className="text-3xl font-bold text-white tracking-tight truncate">{value}</h3>
          )}
          {trend && !loading && (
            <p className={cn("text-xs mt-1.5 font-medium", trend.positive ? "text-emerald-400" : "text-rose-400")}>
              {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}% vs last week
            </p>
          )}
        </div>
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ml-4", c.bg)}>
          <Icon className={cn("w-6 h-6", c.text)} />
        </div>
      </div>
    </motion.div>
  );
}
