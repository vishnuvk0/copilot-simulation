"use client";

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
}

export default function StatCard({ label, value, change, positive }: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      {change && (
        <p className={`mt-1 text-sm font-medium ${positive ? "text-emerald-600" : "text-red-500"}`}>
          {change}
        </p>
      )}
    </div>
  );
}
