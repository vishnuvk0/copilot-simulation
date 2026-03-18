from pydantic import BaseModel


class YearlyBreakdown(BaseModel):
    year: int
    twr: float | None
    mwr: float | None
    contributions: float
    start_value: float
    end_value: float
    gain: float


class AccountResult(BaseModel):
    name: str
    asset: str
    color: str
    first_date: str
    total_cost: float
    final_value: float
    total_gain: float
    full_twr: float | None
    full_twr_ann: float | None
    full_mwr: float | None
    yearly: list[YearlyBreakdown]
    daily_values: list[list[float]]  # [[timestamp_ms, value], ...]
    daily_cost_basis: list[list[float]]


class PortfolioSummary(BaseModel):
    total_cost: float
    total_value: float
    total_gain: float
    overall_return: float
    accounts: list[AccountResult]
    total_daily_values: list[list[float]]
    total_daily_cost_basis: list[list[float]]


class CategoryInfo(BaseModel):
    category: str
    parent_category: str
    total_spend: float
    transaction_count: int


class SpendingBreakdownItem(BaseModel):
    category: str
    parent_category: str
    year: int
    month: int
    amount: float


class SpendingBreakdownResponse(BaseModel):
    items: list[SpendingBreakdownItem]
    total_spend: float
    monthly_average: float


class WhatIfRequest(BaseModel):
    categories: list[str]
    year_start: int
    year_end: int


class WhatIfResult(BaseModel):
    total_redirected: float
    hypothetical_final_value: float
    hypothetical_gain: float
    hypothetical_twr: float | None
    hypothetical_twr_ann: float | None
    actual_final_value: float
    combined_final_value: float
    additional_return_pct: float
    hypothetical_daily_values: list[list[float]]
    actual_daily_values: list[list[float]]
    combined_daily_values: list[list[float]]
    monthly_breakdown: list[dict]


class MonteCarloRequest(BaseModel):
    monthly_investment: float
    num_years: int
    num_simulations: int = 1000
    starting_value: float


class MonteCarloResult(BaseModel):
    percentiles: dict[str, list[list[float]]]  # p10, p25, p50, p75, p90 -> [[month_idx, value], ...]
    median_final: float
    p10_final: float
    p90_final: float
    prob_500k: float
    prob_1m: float
