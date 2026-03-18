"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";
import type { CategoryInfo } from "@/lib/types";
import { formatDollar } from "@/lib/formatters";

const PARENT_COLORS: Record<string, string> = {
  "Food & Drink": "#ef4444",
  "Necessities\u{1f612}": "#f59e0b",
  "Shopping": "#8b5cf6",
  "transport": "#3b82f6",
  "Travel & Weekends": "#10b981",
  "Other": "#6b7280",
};

interface SpendingBreakdownProps {
  categories: CategoryInfo[];
}

export default function SpendingBreakdown({ categories }: SpendingBreakdownProps) {
  const sorted = [...categories].sort((a, b) => b.total_spend - a.total_spend).slice(0, 20);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-800">Spending by Category</h3>
      <ResponsiveContainer width="100%" height={Math.max(400, sorted.length * 28)}>
        <BarChart data={sorted} layout="vertical" margin={{ left: 120 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
          <XAxis type="number" tickFormatter={(v) => formatDollar(v)} tick={{ fontSize: 12 }} />
          <YAxis type="category" dataKey="category" tick={{ fontSize: 12 }} width={110} />
          <Tooltip formatter={(v) => formatDollar(Number(v))} />
          <Bar dataKey="total_spend" name="Total Spend" radius={[0, 4, 4, 0]}>
            {sorted.map((c) => (
              <Cell key={c.category} fill={PARENT_COLORS[c.parent_category] || "#6b7280"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 flex flex-wrap gap-4">
        {Object.entries(PARENT_COLORS).map(([name, color]) => (
          <div key={name} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
            {name}
          </div>
        ))}
      </div>
    </div>
  );
}
