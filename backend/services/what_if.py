"""What-if simulation — redirect category spending into SPY investments."""

import pandas as pd
import data.loader as loader
from services.portfolio import compute_twr, annualize_return, get_cache


def simulate_what_if(categories: list[str], year_start: int, year_end: int) -> dict:
    df = loader.txn_df

    # Filter to selected categories' spending
    mask = (
        (df["excluded"] == False)
        & (df["type"] == "regular")
        & (df["category"].isin(categories))
        & (df["amount"] > 0)
        & (df["parent category"] != "")
        & (df["date"].dt.year >= year_start)
        & (df["date"].dt.year <= year_end)
    )
    filtered = df[mask].copy()

    if filtered.empty:
        return _empty_result()

    # Aggregate by month
    filtered["year"] = filtered["date"].dt.year
    filtered["month"] = filtered["date"].dt.month
    monthly = filtered.groupby(["year", "month"])["amount"].sum().reset_index()

    # Create investment events: invest on 1st trading day of NEXT month
    investment_events = []
    monthly_breakdown = []

    for _, row in monthly.iterrows():
        yr, mo, amt = int(row["year"]), int(row["month"]), row["amount"]
        # Next month
        if mo == 12:
            invest_date = pd.Timestamp(f"{yr + 1}-01-01")
        else:
            invest_date = pd.Timestamp(f"{yr}-{mo + 1:02d}-01")
        td = loader.get_next_trading_day(invest_date)
        investment_events.append((td, amt))
        monthly_breakdown.append({
            "year": yr,
            "month": mo,
            "saved": round(amt, 2),
            "invest_date": td.strftime("%Y-%m-%d"),
        })

    investment_events.sort()
    total_redirected = sum(amt for _, amt in investment_events)

    # Simulate hypothetical portfolio
    event_by_date = {}
    for d, amt in investment_events:
        event_by_date[d] = event_by_date.get(d, 0) + amt

    first_event_date = investment_events[0][0]
    shares = 0.0
    cost = 0.0
    hyp_vals = {}

    for td in loader.trading_days:
        if td < first_event_date:
            continue
        price = loader.spy_prices[td]
        if td in event_by_date:
            amt = event_by_date[td]
            shares += amt / price
            cost += amt
        hyp_vals[td] = shares * price

    hyp_series = pd.Series(hyp_vals)
    hyp_final = hyp_series.iloc[-1] if len(hyp_series) > 0 else 0
    hyp_gain = hyp_final - total_redirected

    # TWR for hypothetical
    end_date = loader.trading_days[-1]
    hyp_twr = compute_twr(investment_events, 0, first_event_date, end_date, loader.spy_prices)
    hyp_twr_ann = annualize_return(hyp_twr, first_event_date, end_date)

    # Actual portfolio values (from precomputed cache)
    cache = get_cache()
    dv = cache.get("daily_values", {})
    actual_df = pd.DataFrame(dv).fillna(0)
    actual_total = actual_df.sum(axis=1)

    # Build aligned time series
    all_dates = sorted(set(actual_total.index) | set(hyp_series.index))
    actual_aligned = actual_total.reindex(all_dates).ffill().fillna(0)
    hyp_aligned = hyp_series.reindex(all_dates).ffill().fillna(0)
    combined = actual_aligned + hyp_aligned

    actual_final = actual_aligned.iloc[-1] if len(actual_aligned) > 0 else 0
    combined_final = combined.iloc[-1] if len(combined) > 0 else 0
    additional_pct = (hyp_final / actual_final * 100) if actual_final > 0 else 0

    def to_ts_list(series):
        return [[int(d.timestamp() * 1000), round(v, 2)] for d, v in series.items()]

    return {
        "total_redirected": round(total_redirected, 2),
        "hypothetical_final_value": round(hyp_final, 2),
        "hypothetical_gain": round(hyp_gain, 2),
        "hypothetical_twr": hyp_twr,
        "hypothetical_twr_ann": hyp_twr_ann,
        "actual_final_value": round(actual_final, 2),
        "combined_final_value": round(combined_final, 2),
        "additional_return_pct": round(additional_pct, 2),
        "hypothetical_daily_values": to_ts_list(hyp_series),
        "actual_daily_values": to_ts_list(actual_total),
        "combined_daily_values": to_ts_list(combined),
        "monthly_breakdown": monthly_breakdown,
    }


def _empty_result():
    return {
        "total_redirected": 0,
        "hypothetical_final_value": 0,
        "hypothetical_gain": 0,
        "hypothetical_twr": None,
        "hypothetical_twr_ann": None,
        "actual_final_value": 0,
        "combined_final_value": 0,
        "additional_return_pct": 0,
        "hypothetical_daily_values": [],
        "actual_daily_values": [],
        "combined_daily_values": [],
        "monthly_breakdown": [],
    }
