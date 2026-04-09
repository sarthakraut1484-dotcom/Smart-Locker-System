"use client";

import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";

const TOOLTIP_STYLE = {
  contentStyle: { backgroundColor: "#0d1117", borderColor: "#ffffff20", borderRadius: "12px", fontSize: "12px" },
  itemStyle: { color: "#a5b4fc", fontWeight: 600 },
  labelStyle: { color: "#94a3b8", marginBottom: "4px" },
};

const CHART_COLORS = ["#818cf8", "#34d399", "#f472b6", "#fb923c", "#a78bfa"];

export function RevenueLineChart({ data }: { data: { name: string; revenue: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
        <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickMargin={8} />
        <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `₹${v}`} />
        <Tooltip {...TOOLTIP_STYLE} formatter={((v: number) => [`₹${v}`, "Revenue"]) as any} />
        <Line
          type="monotone" dataKey="revenue" stroke="#818cf8" strokeWidth={3}
          dot={{ fill: "#818cf8", r: 4, strokeWidth: 0 }}
          activeDot={{ r: 7, fill: "#a5b4fc", strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function BookingBarChart({ data }: { data: { name: string; bookings: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} barSize={32}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
        <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickMargin={8} />
        <YAxis stroke="#64748b" fontSize={11} />
        <Tooltip {...TOOLTIP_STYLE} formatter={((v: number) => [v, "Bookings"]) as any} />
        <Bar dataKey="bookings" fill="#34d399" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function UsageDonutChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={65}
          outerRadius={95}
          paddingAngle={4}
          dataKey="value"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={0} />
          ))}
        </Pie>
        <Tooltip {...TOOLTIP_STYLE} />
        <Legend
          formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
          iconType="circle"
          iconSize={8}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
