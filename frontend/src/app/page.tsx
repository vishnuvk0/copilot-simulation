"use client";

import { useState, useEffect, useCallback } from "react";
import TabNav, { type TabId } from "@/components/layout/TabNav";
import StatCard from "@/components/layout/StatCard";
import SummaryTable from "@/components/layout/SummaryTable";
import PortfolioChart from "@/components/charts/PortfolioChart";
import AccountBreakdown from "@/components/charts/AccountBreakdown";
import SpendingBreakdown from "@/components/charts/SpendingBreakdown";
import WhatIfChart from "@/components/charts/WhatIfChart";
import MonteCarloChart from "@/components/charts/MonteCarloChart";
import CategorySelector from "@/components/controls/CategorySelector";
import DateRangePicker from "@/components/controls/DateRangePicker";
import { api } from "@/lib/api";
import { formatDollar } from "@/lib/formatters";
import type {
  PortfolioSummary,
  CategoryInfo,
  SpendingBreakdownResponse,
  WhatIfResult,
  MonteCarloResult,
} from "@/lib/types";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("portfolio");
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [spending, setSpending] = useState<SpendingBreakdownResponse | null>(null);
  const [whatIfResult, setWhatIfResult] = useState<WhatIfResult | null>(null);
  const [monteCarloResult, setMonteCarloResult] = useState<MonteCarloResult | null>(null);
  const [loading, setLoading] = useState(true);

  // Spending controls
  const [spendYearStart, setSpendYearStart] = useState(2022);
  const [spendYearEnd, setSpendYearEnd] = useState(2026);

  // What-if controls
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [wifYearStart, setWifYearStart] = useState(2022);
  const [wifYearEnd, setWifYearEnd] = useState(2026);
  const [wifLoading, setWifLoading] = useState(false);

  // Monte Carlo controls
  const [mcMonthly, setMcMonthly] = useState(1000);
  const [mcYears, setMcYears] = useState(10);
  const [mcLoading, setMcLoading] = useState(false);

  // Load initial data
  useEffect(() => {
    Promise.all([api.getPortfolio(), api.getCategories()])
      .then(([p, c]) => {
        setPortfolio(p);
        setCategories(c);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  // Load spending when tab or year range changes
  useEffect(() => {
    if (activeTab === "spending") {
      api.getSpendingBreakdown(spendYearStart, spendYearEnd).then(setSpending).catch(console.error);
    }
  }, [activeTab, spendYearStart, spendYearEnd]);

  const runWhatIf = useCallback(async () => {
    if (selectedCategories.length === 0) return;
    setWifLoading(true);
    try {
      const result = await api.simulateWhatIf(selectedCategories, wifYearStart, wifYearEnd);
      setWhatIfResult(result);
    } catch (e) {
      console.error(e);
    }
    setWifLoading(false);
  }, [selectedCategories, wifYearStart, wifYearEnd]);

  const runMonteCarlo = useCallback(async () => {
    if (!portfolio) return;
    setMcLoading(true);
    try {
      const result = await api.simulateMonteCarlo(mcMonthly, mcYears, 1000, portfolio.total_value);
      setMonteCarloResult(result);
    } catch (e) {
      console.error(e);
    }
    setMcLoading(false);
  }, [mcMonthly, mcYears, portfolio]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-500">Loading portfolio data...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Investment Simulator</h1>
        <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Portfolio View */}
      {activeTab === "portfolio" && portfolio && (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <StatCard label="Total Value" value={formatDollar(portfolio.total_value)} />
            <StatCard label="Total Invested" value={formatDollar(portfolio.total_cost)} />
            <StatCard
              label="Total Gain"
              value={formatDollar(portfolio.total_gain)}
              positive={portfolio.total_gain >= 0}
              change={portfolio.total_gain >= 0 ? "Profit" : "Loss"}
            />
            <StatCard
              label="Overall Return"
              value={`${portfolio.overall_return.toFixed(2)}%`}
              positive={portfolio.overall_return >= 0}
            />
          </div>
          <PortfolioChart data={portfolio.total_daily_values} costBasis={portfolio.total_daily_cost_basis} />
          <AccountBreakdown accounts={portfolio.accounts} />
          <SummaryTable accounts={portfolio.accounts} />
        </div>
      )}

      {/* Spending View */}
      {activeTab === "spending" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <DateRangePicker
              yearStart={spendYearStart}
              yearEnd={spendYearEnd}
              onYearStartChange={setSpendYearStart}
              onYearEndChange={setSpendYearEnd}
            />
            {spending && (
              <div className="flex gap-6 text-sm text-gray-600">
                <span>Total: <strong>{formatDollar(spending.total_spend)}</strong></span>
                <span>Monthly avg: <strong>{formatDollar(spending.monthly_average)}</strong></span>
              </div>
            )}
          </div>
          <SpendingBreakdown categories={categories} />
        </div>
      )}

      {/* What-If View */}
      {activeTab === "whatif" && (
        <div className="space-y-6">
          <div className="grid grid-cols-[300px_1fr] gap-6">
            <div className="space-y-4">
              <CategorySelector
                categories={categories}
                selected={selectedCategories}
                onChange={setSelectedCategories}
              />
              <DateRangePicker
                yearStart={wifYearStart}
                yearEnd={wifYearEnd}
                onYearStartChange={setWifYearStart}
                onYearEndChange={setWifYearEnd}
              />
              <button
                onClick={runWhatIf}
                disabled={selectedCategories.length === 0 || wifLoading}
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {wifLoading ? "Simulating..." : "Run Simulation"}
              </button>
            </div>
            <div className="space-y-4">
              {whatIfResult && (
                <>
                  <div className="grid grid-cols-4 gap-4">
                    <StatCard label="Total Redirected" value={formatDollar(whatIfResult.total_redirected)} />
                    <StatCard
                      label="Hypothetical Gain"
                      value={formatDollar(whatIfResult.hypothetical_gain)}
                      positive={whatIfResult.hypothetical_gain >= 0}
                    />
                    <StatCard label="Combined Value" value={formatDollar(whatIfResult.combined_final_value)} />
                    <StatCard
                      label="Additional Return"
                      value={`${whatIfResult.additional_return_pct.toFixed(1)}%`}
                      positive
                      change="of actual portfolio"
                    />
                  </div>
                  <WhatIfChart result={whatIfResult} />
                </>
              )}
              {!whatIfResult && (
                <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-gray-300 text-gray-400">
                  Select categories and run simulation to see results
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Monte Carlo View */}
      {activeTab === "montecarlo" && (
        <div className="space-y-6">
          <div className="flex items-end gap-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Monthly Investment</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={5000}
                  step={100}
                  value={mcMonthly}
                  onChange={(e) => setMcMonthly(Number(e.target.value))}
                  className="w-40"
                />
                <span className="w-20 text-sm font-semibold">{formatDollar(mcMonthly)}</span>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Projection Years</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={5}
                  max={30}
                  step={1}
                  value={mcYears}
                  onChange={(e) => setMcYears(Number(e.target.value))}
                  className="w-40"
                />
                <span className="w-16 text-sm font-semibold">{mcYears} yrs</span>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Starting Value</label>
              <span className="text-sm text-gray-600">{portfolio ? formatDollar(portfolio.total_value) : "..."}</span>
            </div>
            <button
              onClick={runMonteCarlo}
              disabled={mcLoading}
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {mcLoading ? "Running..." : "Run Simulation"}
            </button>
          </div>

          {monteCarloResult && (
            <>
              <div className="grid grid-cols-4 gap-4">
                <StatCard label="Median Final Value" value={formatDollar(monteCarloResult.median_final)} />
                <StatCard label="10th Percentile" value={formatDollar(monteCarloResult.p10_final)} />
                <StatCard label="90th Percentile" value={formatDollar(monteCarloResult.p90_final)} />
                <StatCard
                  label="Prob. of $1M+"
                  value={`${monteCarloResult.prob_1m}%`}
                  positive={monteCarloResult.prob_1m > 50}
                />
              </div>
              <MonteCarloChart result={monteCarloResult} />
            </>
          )}
          {!monteCarloResult && (
            <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-gray-300 text-gray-400">
              Configure parameters and run simulation to see projections
            </div>
          )}
        </div>
      )}
    </div>
  );
}
