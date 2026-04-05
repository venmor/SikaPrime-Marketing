"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function PerformanceChart({
  data,
}: {
  data: Array<{
    label: string;
    impressions: number;
    leads: number;
    engagementRate: number;
  }>;
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="4 8" stroke="rgba(148,163,184,0.22)" />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--muted)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="left"
            tick={{ fill: "var(--muted)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill: "var(--muted)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 18,
              border: "1px solid var(--border)",
              background: "var(--surface-elevated)",
              color: "var(--foreground)",
              boxShadow: "var(--shadow-panel)",
            }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="impressions"
            stroke="var(--secondary)"
            strokeWidth={3}
            dot={{ r: 4, fill: "var(--secondary)", strokeWidth: 0 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="engagementRate"
            stroke="var(--brand)"
            strokeWidth={3}
            dot={{ r: 4, fill: "var(--brand)", strokeWidth: 0 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="leads"
            stroke="var(--accent)"
            strokeWidth={3}
            dot={{ r: 4, fill: "var(--accent)", strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
