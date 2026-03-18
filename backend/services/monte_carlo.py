"""Monte Carlo simulation — forward-looking portfolio projection."""

import numpy as np
import pandas as pd
import data.loader as loader


def _compute_historical_monthly_returns() -> list[float]:
    """Compute monthly SPY returns from historical data."""
    # Group trading days by (year, month), take first and last price
    monthly = {}
    for td in loader.trading_days:
        key = (td.year, td.month)
        if key not in monthly:
            monthly[key] = {"first": loader.spy_prices[td], "last": loader.spy_prices[td]}
        else:
            monthly[key]["last"] = loader.spy_prices[td]

    sorted_months = sorted(monthly.keys())
    returns = []
    for i in range(1, len(sorted_months)):
        prev_last = monthly[sorted_months[i - 1]]["last"]
        curr_last = monthly[sorted_months[i]]["last"]
        returns.append(curr_last / prev_last - 1)

    return returns


def run_monte_carlo(
    monthly_investment: float,
    num_years: int,
    num_simulations: int,
    starting_value: float,
) -> dict:
    historical_returns = _compute_historical_monthly_returns()
    if not historical_returns:
        return _empty_result()

    hist_arr = np.array(historical_returns)
    total_months = num_years * 12

    # Run simulations
    rng = np.random.default_rng(42)
    all_paths = np.zeros((num_simulations, total_months + 1))
    all_paths[:, 0] = starting_value

    for sim in range(num_simulations):
        drawn_returns = rng.choice(hist_arr, size=total_months, replace=True)
        portfolio = starting_value
        for m in range(total_months):
            portfolio = portfolio * (1 + drawn_returns[m]) + monthly_investment
            all_paths[sim, m + 1] = portfolio

    # Percentiles at each month
    percentile_keys = {"p10": 10, "p25": 25, "p50": 50, "p75": 75, "p90": 90}
    percentiles = {}
    for label, pct in percentile_keys.items():
        vals = np.percentile(all_paths, pct, axis=0)
        percentiles[label] = [[i, round(float(vals[i]), 2)] for i in range(total_months + 1)]

    final_values = all_paths[:, -1]

    return {
        "percentiles": percentiles,
        "median_final": round(float(np.median(final_values)), 2),
        "p10_final": round(float(np.percentile(final_values, 10)), 2),
        "p90_final": round(float(np.percentile(final_values, 90)), 2),
        "prob_500k": round(float(np.mean(final_values >= 500_000) * 100), 1),
        "prob_1m": round(float(np.mean(final_values >= 1_000_000) * 100), 1),
    }


def _empty_result():
    return {
        "percentiles": {},
        "median_final": 0,
        "p10_final": 0,
        "p90_final": 0,
        "prob_500k": 0,
        "prob_1m": 0,
    }
