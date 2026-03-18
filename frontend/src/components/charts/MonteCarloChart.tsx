"use client";

import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Line,
} from "recharts";
import type { MonteCarloResult } from "@/lib/types";
import { formatDollar } from "@/lib/formatters";

interface MonteCarloChartProps {
  result: MonteCarloResult;
}

export default function MonteCarloChart({ result }: MonteCarloChartProps) {
  const { percentiles } = result;
  if (!percentiles.p50) return null;

  const data = percentiles.p50.map(([month], i) => ({
    month,
    year: Math.floor(month / 12),
    p10: percentiles.p10?.[i]?.[1] ?? 0,
    p25: percentiles.p25?.[i]?.[1] ?? 0,
    p50: percentiles.p50[i][1],
    p75: percentiles.p75?.[i]?.[1] ?? 0,
    p90: percentiles.p90?.[i]?.[1] ?? 0,
  }));

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-800">Monte Carlo Projection</h3>
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="month"
            tickFormatter={(m) => `Year ${Math.floor(m / 12)}`}
            tick={{ fontSize: 12 }}
            minTickGap={40}
          />
          <YAxis tickFormatter={(v) => formatDollar(v)} tick={{ fontSize: 12 }} width={100} />
          <Tooltip
            labelFormatter={(m) => `Month ${m} (Year ${(Number(m) / 12).toFixed(1)})`}
            formatter={(v, name) => {
              const labels: Record<string, string> = { p10: "10th %ile", p25: "25th %ile", p50: "Median", p75: "75th %ile", p90: "90th %ile" };
              return [formatDollar(Number(v)), labels[String(name)] || String(name)];
            }}
          />
          <Area type="monotone" dataKey="p90" stackId="bg" fill="#dbeafe" stroke="none" fillOpacity={0.4} />
          <Area type="monotone" dataKey="p75" stackId="bg2" fill="#93c5fd" stroke="none" fillOpacity={0.4} />
          <Area type="monotone" dataKey="p25" stackId="bg3" fill="#60a5fa" stroke="none" fillOpacity={0.3} />
          <Area type="monotone" dataKey="p10" stackId="bg4" fill="#3b82f6" stroke="none" fillOpacity={0.2} />
          <Line type="monotone" dataKey="p50" stroke="#1d4ed8" strokeWidth={3} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
        <span>Shaded bands: 10th-90th percentile range</span>
        <span>Bold line: median (50th percentile)</span>
      </div>
    </div>
  );
}
