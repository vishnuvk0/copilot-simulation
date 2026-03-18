export interface YearlyBreakdown {
  year: number;
  twr: number | null;
  mwr: number | null;
  contributions: number;
  start_value: number;
  end_value: number;
  gain: number;
}

export interface AccountResult {
  name: string;
  asset: string;
  color: string;
  first_date: string;
  total_cost: number;
  final_value: number;
  total_gain: number;
  full_twr: number | null;
  full_twr_ann: number | null;
  full_mwr: number | null;
  yearly: YearlyBreakdown[];
  daily_values: [number, number][];
  daily_cost_basis: [number, number][];
}

export interface PortfolioSummary {
  total_cost: number;
  total_value: number;
  total_gain: number;
  overall_return: number;
  accounts: AccountResult[];
  total_daily_values: [number, number][];
  total_daily_cost_basis: [number, number][];
}

export interface CategoryInfo {
  category: string;
  parent_category: string;
  total_spend: number;
  transaction_count: number;
}

export interface SpendingBreakdownItem {
  category: string;
  parent_category: string;
  year: number;
  month: number;
  amount: number;
}

export interface SpendingBreakdownResponse {
  items: SpendingBreakdownItem[];
  total_spend: number;
  monthly_average: number;
}

export interface WhatIfResult {
  total_redirected: number;
  hypothetical_final_value: number;
  hypothetical_gain: number;
  hypothetical_twr: number | null;
  hypothetical_twr_ann: number | null;
  actual_final_value: number;
  combined_final_value: number;
  additional_return_pct: number;
  hypothetical_daily_values: [number, number][];
  actual_daily_values: [number, number][];
  combined_daily_values: [number, number][];
  monthly_breakdown: { year: number; month: number; saved: number; invest_date: string }[];
}

export interface MonteCarloResult {
  percentiles: Record<string, [number, number][]>;
  median_final: number;
  p10_final: number;
  p90_final: number;
  prob_500k: number;
  prob_1m: number;
}
