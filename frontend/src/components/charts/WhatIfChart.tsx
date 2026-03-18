"use client";

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import type { WhatIfResult } from "@/lib/types";
import { formatDollar, formatDate } from "@/lib/formatters";

interface WhatIfChartProps {
  result: WhatIfResult;
}

export default function WhatIfChart({ result }: WhatIfChartProps) {
  // Merge all series by timestamp
  const tsMap = new Map<number, { actual: number; hypothetical: number; combined: number }>();

  result.actual_daily_values.forEach(([ts, v]) => {
    const entry = tsMap.get(ts) || { actual: 0, hypothetical: 0, combined: 0 };
    entry.actual = v;
    tsMap.set(ts, entry);
  });
  result.hypothetical_daily_values.forEach(([ts, v]) => {
    const entry = tsMap.get(ts) || { actual: 0, hypothetical: 0, combined: 0 };
    entry.hypothetical = v;
    tsMap.set(ts, entry);
  });
  result.combined_daily_values.forEach(([ts, v]) => {
    const entry = tsMap.get(ts) || { actual: 0, hypothetical: 0, combined: 0 };
    entry.combined = v;
    tsMap.set(ts, entry);
  });

  const data = Array.from(tsMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([ts, vals]) => ({ ts, ...vals }));

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-800">What-If Projection</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="ts" tickFormatter={formatDate} tick={{ fontSize: 12 }} minTickGap={60} />
          <YAxis tickFormatter={(v) => formatDollar(v)} tick={{ fontSize: 12 }} width={90} />
          <Tooltip
            labelFormatter={(label) => formatDate(Number(label))}
            formatter={(v, name) => [
              formatDollar(Number(v)),
              name === "actual" ? "Actual Portfolio" : name === "hypothetical" ? "Hypothetical (redirected)" : "Combined",
            ]}
          />
          <Legend />
          <Line type="monotone" dataKey="actual" stroke="#2563eb" strokeWidth={2} dot={false} name="Actual Portfolio" />
          <Line type="monotone" dataKey="hypothetical" stroke="#f59e0b" strokeWidth={2} strokeDasharray="6 3" dot={false} name="Hypothetical" />
          <Line type="monotone" dataKey="combined" stroke="#10b981" strokeWidth={3} dot={false} name="Combined" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
