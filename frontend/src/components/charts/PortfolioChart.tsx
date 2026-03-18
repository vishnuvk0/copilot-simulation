"use client";

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { formatDollar, formatDate } from "@/lib/formatters";

interface PortfolioChartProps {
  data: [number, number][];
  costBasis: [number, number][];
}

export default function PortfolioChart({ data, costBasis }: PortfolioChartProps) {
  const merged = data.map(([ts, val], i) => {
    const cb = costBasis.find(([t]) => t === ts);
    return { ts, value: val, cost: cb ? cb[1] : (i > 0 ? costBasis[costBasis.length - 1]?.[1] ?? 0 : 0) };
  });

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-800">Portfolio Value vs Cost Basis</h3>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={merged}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="ts"
            tickFormatter={formatDate}
            tick={{ fontSize: 12 }}
            minTickGap={60}
          />
          <YAxis
            tickFormatter={(v) => formatDollar(v)}
            tick={{ fontSize: 12 }}
            width={90}
          />
          <Tooltip
            labelFormatter={(label) => formatDate(Number(label))}
            formatter={(v, name) => [formatDollar(Number(v)), name === "value" ? "Market Value" : "Cost Basis"]}
          />
          <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={false} name="value" />
          <Line type="monotone" dataKey="cost" stroke="#ef4444" strokeWidth={2} strokeDasharray="6 3" dot={false} name="cost" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
