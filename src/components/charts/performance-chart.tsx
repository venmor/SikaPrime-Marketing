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
          <CartesianGrid strokeDasharray="4 8" stroke="rgba(95,107,104,0.2)" />
          <XAxis
            dataKey="label"
            tick={{ fill: "#5f6b68", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="left"
            tick={{ fill: "#5f6b68", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill: "#5f6b68", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="impressions"
            stroke="#123e4a"
            strokeWidth={3}
            dot={{ r: 4 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="engagementRate"
            stroke="#d28f36"
            strokeWidth={3}
            dot={{ r: 4 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="leads"
            stroke="#1a7d61"
            strokeWidth={3}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
