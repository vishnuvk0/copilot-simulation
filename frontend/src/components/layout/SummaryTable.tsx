"use client";

import type { AccountResult } from "@/lib/types";
import { formatDollar, formatPercent } from "@/lib/formatters";

interface SummaryTableProps {
  accounts: AccountResult[];
}

export default function SummaryTable({ accounts }: SummaryTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Account</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Asset</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-700">Invested</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-700">Value</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-700">Gain</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-700">TWR (ann.)</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-700">MWR (ann.)</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((acct) => (
            <tr key={acct.name} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-4 py-3 font-medium">
                <span className="mr-2 inline-block h-3 w-3 rounded-full" style={{ backgroundColor: acct.color }} />
                {acct.name}
              </td>
              <td className="px-4 py-3 text-gray-500">{acct.asset}</td>
              <td className="px-4 py-3 text-right">{formatDollar(acct.total_cost)}</td>
              <td className="px-4 py-3 text-right">{formatDollar(acct.final_value)}</td>
              <td className={`px-4 py-3 text-right ${acct.total_gain >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                {formatDollar(acct.total_gain)}
              </td>
              <td className="px-4 py-3 text-right">{formatPercent(acct.full_twr_ann)}</td>
              <td className="px-4 py-3 text-right">{formatPercent(acct.full_mwr)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50 font-semibold">
            <td className="px-4 py-3">Total</td>
            <td className="px-4 py-3"></td>
            <td className="px-4 py-3 text-right">{formatDollar(accounts.reduce((s, a) => s + a.total_cost, 0))}</td>
            <td className="px-4 py-3 text-right">{formatDollar(accounts.reduce((s, a) => s + a.final_value, 0))}</td>
            <td className={`px-4 py-3 text-right ${accounts.reduce((s, a) => s + a.total_gain, 0) >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              {formatDollar(accounts.reduce((s, a) => s + a.total_gain, 0))}
            </td>
            <td className="px-4 py-3"></td>
            <td className="px-4 py-3"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
