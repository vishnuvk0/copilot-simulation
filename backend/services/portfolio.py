"""
Portfolio simulation service — refactored from investment_analysis.py sections 2-4.
Builds account events, simulates daily portfolio, computes TWR/MWR returns.
"""

import pandas as pd
import numpy as np
from scipy.optimize import brentq
import data.loader as loader
from config import ROBINHOOD_STARTING_BALANCE, ROBINHOOD_START_DATE, ACCOUNT_ORDER, COLORS


# ── Pure return functions ──────────────────────────────────────────

def compute_twr(events, starting_balance, start_date, end_date, prices):
    boundaries = []
    if starting_balance > 0:
        boundaries.append((start_date, starting_balance))
    for d, amt in events:
        boundaries.append((d, amt))
    boundaries.sort()
    if not boundaries:
        return 0.0
    shares = 0
    v_after_prev = None
    sub_returns = []
    for d, amt in boundaries:
        price = prices[d]
        if v_after_prev is not None and v_after_prev > 0:
            v_before = shares * price
            r = v_before / v_after_prev - 1
            sub_returns.append((d, r))
        shares += amt / price
        v_after_prev = shares * price
    if v_after_prev is not None and v_after_prev > 0 and shares > 0:
        v_final = shares * prices[end_date]
        r = v_final / v_after_prev - 1
        sub_returns.append((end_date, r))
    twr = 1.0
    for _, r in sub_returns:
        twr *= (1 + r)
    return twr - 1


def compute_twr_for_period(events_in_period, shares_at_start, period_start, period_end, prices):
    boundaries = list(events_in_period)
    boundaries.sort()
    shares = shares_at_start
    v_after_prev = shares * prices[period_start] if shares > 0 else None
    sub_returns = []
    for d, amt in boundaries:
        price = prices[d]
        if v_after_prev is not None and v_after_prev > 0:
            v_before = shares * price
            r = v_before / v_after_prev - 1
            sub_returns.append(r)
        shares += amt / price
        v_after_prev = shares * price
    if v_after_prev is not None and v_after_prev > 0 and shares > 0:
        v_final = shares * prices[period_end]
        r = v_final / v_after_prev - 1
        sub_returns.append(r)
    twr = 1.0
    for r in sub_returns:
        twr *= (1 + r)
    return twr - 1


def compute_xirr(cf_list, max_rate=10.0):
    if len(cf_list) < 2:
        return None
    dates = [cf[0] for cf in cf_list]
    amounts = [cf[1] for cf in cf_list]
    d0 = min(dates)
    signs = set(np.sign(a) for a in amounts if a != 0)
    if len(signs) <= 1:
        return None

    def npv(rate):
        return sum(
            a / (1 + rate) ** ((d - d0).days / 365.25)
            for a, d in zip(amounts, dates)
        )
    try:
        return brentq(npv, -0.5, max_rate, maxiter=1000)
    except (ValueError, RuntimeError):
        try:
            return brentq(npv, -0.99, 50.0, maxiter=2000)
        except Exception:
            return None


def annualize_return(total_return, start_date, end_date):
    days = (end_date - start_date).days
    if days <= 0 or total_return <= -1:
        return None
    years = days / 365.25
    return (1 + total_return) ** (1 / years) - 1


# ── Account event building ─────────────────────────────────────────

def _map_account_by_tag(tags_str):
    tags = tags_str.lower()
    if "google 401k" in tags:
        return "Google 401k"
    elif "amzn 401k" in tags:
        return "Amazon 401(k)"
    elif "visa 401k" in tags:
        return "Visa 401k"
    elif "hsa" in tags:
        return "Amazon HSA"
    return "Unknown"


def build_account_events():
    """Filter transactions into logical accounts and build event lists."""
    df = loader.txn_df

    # Retirement
    retirement_mask = (
        (df["type"] == "income")
        & (df["tags"].str.contains("401k|hsa|pretax|roth", case=False))
    )
    retirement_txns = df[retirement_mask].copy()
    exclude_mask = retirement_txns["name"].str.contains("2% 401k transfer bonus", case=False)
    retirement_txns = retirement_txns[~exclude_mask].copy()
    retirement_txns["logical_account"] = retirement_txns["tags"].apply(_map_account_by_tag)
    retirement_txns["contribution"] = retirement_txns["amount"].abs()
    all_retirement = retirement_txns[["date", "logical_account", "contribution"]].sort_values("date")

    # Vests
    vest_mask = (df["type"] == "income") & (df["name"].str.contains("VEST", case=False))
    vest_txns = df[vest_mask][["date", "amount"]].copy()
    vest_txns["logical_account"] = "Amazon Vests"
    vest_txns["contribution"] = vest_txns["amount"].abs()

    # ESPP
    espp_mask = (df["type"] == "income") & (df["name"].str.contains("visa espp", case=False))
    espp_txns = df[espp_mask][["date", "amount"]].copy()
    espp_txns["logical_account"] = "Visa ESPP"
    espp_txns["contribution"] = espp_txns["amount"].abs()

    # Robinhood
    robinhood_mask = df["tags"].str.contains("robinhood transfer", case=False)
    robinhood_txns = df[robinhood_mask].copy()
    rsu_exclude_mask = (
        robinhood_txns["name"].str.contains("RSU transfer", case=False)
        & (robinhood_txns["date"] == pd.Timestamp("2024-07-17"))
    )
    robinhood_txns = robinhood_txns[~rsu_exclude_mask]
    robinhood_txns = robinhood_txns[["date", "amount"]].copy()
    robinhood_txns["logical_account"] = "Robinhood"
    robinhood_txns = robinhood_txns.rename(columns={"amount": "contribution"})

    # Build per-account event dicts
    account_events = {}

    for acct in all_retirement["logical_account"].unique():
        acct_txns = all_retirement[all_retirement["logical_account"] == acct]
        events = []
        for _, row in acct_txns.iterrows():
            td = loader.get_next_trading_day(row["date"])
            events.append((td, row["contribution"]))
        events.sort()
        account_events[acct] = {
            "events": events,
            "starting_balance": 0,
            "start_date": events[0][0] if events else None,
            "asset": "SPY",
        }

    # Amazon Vests — AMZN prices
    vest_events = []
    for _, row in vest_txns.iterrows():
        td = loader.get_next_amzn_trading_day(row["date"])
        vest_events.append((td, row["contribution"]))
    vest_events.sort()
    account_events["Amazon Vests"] = {
        "events": vest_events,
        "starting_balance": 0,
        "start_date": vest_events[0][0] if vest_events else None,
        "asset": "AMZN",
    }

    # Visa ESPP — SPY prices
    espp_events = []
    for _, row in espp_txns.iterrows():
        td = loader.get_next_trading_day(row["date"])
        espp_events.append((td, row["contribution"]))
    espp_events.sort()
    account_events["Visa ESPP"] = {
        "events": espp_events,
        "starting_balance": 0,
        "start_date": espp_events[0][0] if espp_events else None,
        "asset": "SPY",
    }

    # Robinhood
    rh_events = []
    for _, row in robinhood_txns.iterrows():
        td = loader.get_next_trading_day(row["date"])
        rh_events.append((td, row["contribution"]))
    rh_events.sort()
    account_events["Robinhood"] = {
        "events": rh_events,
        "starting_balance": ROBINHOOD_STARTING_BALANCE,
        "start_date": pd.Timestamp(ROBINHOOD_START_DATE),
        "asset": "SPY",
    }

    return account_events


# ── Daily simulation ────────────────────────────────────────────────

def simulate_portfolio(account_events):
    """Simulate daily portfolio values for each account. Returns (daily_values, daily_shares, daily_cost_basis)."""
    daily_values = {}
    daily_shares = {}
    daily_cost_basis = {}

    for acct, data in account_events.items():
        events = data["events"]
        start_bal = data["starting_balance"]
        start_date = data["start_date"]
        asset = data["asset"]

        if start_date is None:
            continue

        prices = loader.amzn_prices if asset == "AMZN" else loader.spy_prices
        tdays = loader.amzn_trading_days if asset == "AMZN" else loader.trading_days

        event_by_date = {}
        for d, amt in events:
            event_by_date[d] = event_by_date.get(d, 0) + amt

        shares = 0.0
        cost = 0.0
        vals, shr, costs = {}, {}, {}

        if start_bal > 0:
            shares = start_bal / prices[start_date]
            cost = start_bal

        for td in tdays:
            if td < start_date:
                continue
            price = prices[td]
            if td in event_by_date:
                amt = event_by_date[td]
                shares += amt / price
                cost += amt
            vals[td] = shares * price
            shr[td] = shares
            costs[td] = cost

        daily_values[acct] = pd.Series(vals)
        daily_shares[acct] = pd.Series(shr)
        daily_cost_basis[acct] = pd.Series(costs)

    return daily_values, daily_shares, daily_cost_basis


# ── Return computation ──────────────────────────────────────────────

def compute_all_returns(account_events, daily_values, daily_shares, daily_cost_basis):
    """Compute TWR, MWR, yearly breakdowns for all accounts."""
    results = {}

    for acct, data in account_events.items():
        events = data["events"]
        start_bal = data["starting_balance"]
        start_date = data["start_date"]
        asset = data["asset"]
        vals = daily_values.get(acct)
        shr = daily_shares.get(acct)
        cb = daily_cost_basis.get(acct)

        if vals is None or len(vals) == 0:
            continue

        prices = loader.amzn_prices if asset == "AMZN" else loader.spy_prices
        tdays = loader.amzn_trading_days if asset == "AMZN" else loader.trading_days

        acct_dates = vals.index
        first_date = acct_dates[0]
        final_value = vals.iloc[-1]
        total_cost = cb.iloc[-1]
        total_gain = final_value - total_cost
        acct_end_date = tdays[-1]

        full_twr = compute_twr(events, start_bal, start_date, acct_end_date, prices)

        xirr_cfs = []
        if start_bal > 0:
            xirr_cfs.append((start_date, -start_bal))
        for d, amt in events:
            xirr_cfs.append((d, -amt))
        xirr_cfs.append((acct_end_date, final_value))
        full_mwr = compute_xirr(xirr_cfs)

        # Yearly
        years = sorted(set(d.year for d in acct_dates))
        yearly = {}

        for year in years:
            yr_start = pd.Timestamp(f"{year}-01-01")
            yr_end = pd.Timestamp(f"{year}-12-31")
            yr_tds = [td for td in tdays if yr_start <= td <= yr_end]
            if not yr_tds:
                continue

            if year == first_date.year:
                yr_period_start = first_date
                yr_shares_at_start = start_bal / prices[first_date] if start_bal > 0 else 0
            else:
                yr_period_start = yr_tds[0]
                prev_yr_tds = [td for td in tdays if td.year == year - 1 and td in shr.index]
                yr_shares_at_start = shr[prev_yr_tds[-1]] if prev_yr_tds else 0

            yr_period_end = yr_tds[-1]
            if yr_period_end > acct_end_date:
                yr_period_end = acct_end_date

            yr_events = [(d, amt) for d, amt in events if yr_period_start <= d <= yr_period_end]

            if year == first_date.year and start_bal > 0:
                yr_twr = compute_twr_for_period(yr_events, yr_shares_at_start, yr_period_start, yr_period_end, prices)
            elif year == first_date.year:
                yr_twr = compute_twr(yr_events, 0, yr_period_start, yr_period_end, prices)
            else:
                yr_twr = compute_twr_for_period(yr_events, yr_shares_at_start, yr_period_start, yr_period_end, prices)

            yr_xirr_cfs = []
            yr_start_val = vals.get(yr_period_start, 0)
            if year == first_date.year:
                if start_bal > 0:
                    yr_xirr_cfs.append((yr_period_start, -start_bal))
            else:
                if yr_start_val > 0:
                    yr_xirr_cfs.append((yr_period_start, -yr_start_val))

            for d, amt in yr_events:
                yr_xirr_cfs.append((d, -amt))

            yr_end_val = vals.get(yr_period_end, 0)
            yr_xirr_cfs.append((yr_period_end, yr_end_val))
            yr_mwr = compute_xirr(yr_xirr_cfs)

            yr_contribs = sum(amt for _, amt in yr_events)
            yr_start_value = start_bal if (year == first_date.year) else yr_start_val
            yr_gain = yr_end_val - yr_start_value - yr_contribs

            yearly[year] = {
                "twr": yr_twr,
                "mwr": yr_mwr,
                "contributions": yr_contribs,
                "start_value": yr_start_value,
                "end_value": yr_end_val,
                "gain": yr_gain,
            }

        full_twr_ann = annualize_return(full_twr, start_date, acct_end_date)

        results[acct] = {
            "full_twr": full_twr,
            "full_twr_ann": full_twr_ann,
            "full_mwr": full_mwr,
            "total_cost": total_cost,
            "final_value": final_value,
            "total_gain": total_gain,
            "first_date": first_date,
            "yearly": yearly,
            "asset": asset,
        }

    return results


# ── Precomputed cache ────────────────────────────────────────────────

_cache: dict = {}


def precompute():
    """Run full portfolio computation and cache results."""
    account_events = build_account_events()
    dv, ds, dcb = simulate_portfolio(account_events)
    results = compute_all_returns(account_events, dv, ds, dcb)

    _cache["account_events"] = account_events
    _cache["daily_values"] = dv
    _cache["daily_shares"] = ds
    _cache["daily_cost_basis"] = dcb
    _cache["results"] = results

    total_cost = sum(r["total_cost"] for r in results.values())
    total_value = sum(r["final_value"] for r in results.values())
    print(f"Portfolio precomputed: ${total_cost:,.0f} invested -> ${total_value:,.0f} value")


def get_cache():
    return _cache
