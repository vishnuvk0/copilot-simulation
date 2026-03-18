"use client";

import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import type { AccountResult } from "@/lib/types";
import { formatDollar, formatDate } from "@/lib/formatters";

interface AccountBreakdownProps {
  accounts: AccountResult[];
}

export default function AccountBreakdown({ accounts }: AccountBreakdownProps) {
  // Build unified time series
  const allTimestamps = new Set<number>();
  accounts.forEach((a) => a.daily_values.forEach(([ts]) => allTimestamps.add(ts)));
  const sortedTs = Array.from(allTimestamps).sort((a, b) => a - b);

  const data = sortedTs.map((ts) => {
    const point: Record<string, number> = { ts };
    accounts.forEach((a) => {
      const entry = a.daily_values.find(([t]) => t === ts);
      point[a.name] = entry ? entry[1] : 0;
    });
    return point;
  });

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-800">Account Breakdown</h3>
      <ResponsiveContainer width="100%" height={350}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="ts" tickFormatter={formatDate} tick={{ fontSize: 12 }} minTickGap={60} />
          <YAxis tickFormatter={(v) => formatDollar(v)} tick={{ fontSize: 12 }} width={90} />
          <Tooltip
            labelFormatter={(label) => formatDate(Number(label))}
            formatter={(v) => formatDollar(Number(v))}
          />
          {accounts.map((a) => (
            <Area
              key={a.name}
              type="monotone"
              dataKey={a.name}
              stackId="1"
              fill={a.color}
              stroke={a.color}
              fillOpacity={0.8}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
