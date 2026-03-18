import type {
  PortfolioSummary,
  CategoryInfo,
  SpendingBreakdownResponse,
  WhatIfResult,
  MonteCarloResult,
} from "./types";

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url}: ${res.status}`);
  return res.json();
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${url}: ${res.status}`);
  return res.json();
}

export const api = {
  getPortfolio: () => get<PortfolioSummary>("/api/portfolio"),
  getCategories: () => get<CategoryInfo[]>("/api/spending/categories"),
  getSpendingBreakdown: (yearStart: number, yearEnd: number) =>
    get<SpendingBreakdownResponse>(
      `/api/spending/breakdown?year_start=${yearStart}&year_end=${yearEnd}`
    ),
  simulateWhatIf: (categories: string[], yearStart: number, yearEnd: number) =>
    post<WhatIfResult>("/api/simulate/what-if", {
      categories,
      year_start: yearStart,
      year_end: yearEnd,
    }),
  simulateMonteCarlo: (
    monthlyInvestment: number,
    numYears: number,
    numSimulations: number,
    startingValue: number
  ) =>
    post<MonteCarloResult>("/api/simulate/monte-carlo", {
      monthly_investment: monthlyInvestment,
      num_years: numYears,
      num_simulations: numSimulations,
      starting_value: startingValue,
    }),
};
