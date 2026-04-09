"use client";

import { motion } from "framer-motion";

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="glass-panel rounded-2xl overflow-hidden border border-white/5">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 border-b border-white/5">
            <tr>
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="px-6 py-4">
                  <div className="h-3 bg-white/10 rounded animate-pulse w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i} className="border-b border-white/5">
                {Array.from({ length: cols }).map((_, j) => (
                  <td key={j} className="px-6 py-4">
                    <div className={`h-4 bg-white/5 rounded animate-pulse`} style={{ width: `${Math.random() * 40 + 40}%`, animationDelay: `${i * 0.1}s` }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="glass-panel rounded-2xl p-6 border border-white/5 animate-pulse h-36"
        >
          <div className="h-3 bg-white/10 rounded w-2/3 mb-4" />
          <div className="h-8 bg-white/5 rounded w-1/2 mb-2" />
          <div className="h-2 bg-white/5 rounded w-1/3" />
        </motion.div>
      ))}
    </div>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-3xl font-bold tracking-tight text-white"
        >
          {title}
        </motion.h1>
        {subtitle && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground mt-1 text-sm"
          >
            {subtitle}
          </motion.p>
        )}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
}

export function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "success" | "warning" | "danger" | "info" }) {
  const VARIANT_MAP = {
    default: "bg-white/10 text-white border-white/10",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    danger:  "bg-rose-500/10 text-rose-400 border-rose-500/20",
    info:    "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${VARIANT_MAP[variant]}`}>
      {children}
    </span>
  );
}
