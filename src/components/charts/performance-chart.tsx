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
            tick={{ fill: "#64748b", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="left"
            tick={{ fill: "#64748b", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill: "#64748b", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 18,
              border: "1px solid rgba(148,163,184,0.22)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.94))",
              boxShadow: "0 16px 40px rgba(15,23,42,0.12)",
            }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="impressions"
            stroke="#21c6d9"
            strokeWidth={3}
            dot={{ r: 4, fill: "#21c6d9", strokeWidth: 0 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="engagementRate"
            stroke="#e63e8c"
            strokeWidth={3}
            dot={{ r: 4, fill: "#e63e8c", strokeWidth: 0 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="leads"
            stroke="#8b5cf6"
            strokeWidth={3}
            dot={{ r: 4, fill: "#8b5cf6", strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
