"""
Data loading module — loads CSVs once at startup and exposes globals.
Refactored from investment_analysis.py section 1 (lines 1-71).
"""

import pandas as pd
from config import SPY_CSV, AMZN_CSV, TRANSACTIONS_CSV

# Globals populated by load_all()
spy_prices: dict[pd.Timestamp, float] = {}
amzn_prices: dict[pd.Timestamp, float] = {}
trading_days: list[pd.Timestamp] = []
amzn_trading_days: list[pd.Timestamp] = []
txn_df: pd.DataFrame = pd.DataFrame()


def load_all():
    global spy_prices, amzn_prices, trading_days, amzn_trading_days, txn_df

    # Load SPY prices
    spy_df = pd.read_csv(SPY_CSV)
    spy_df["Date"] = pd.to_datetime(spy_df["Date"], format="%m/%d/%Y")
    spy_df["Price"] = spy_df["Price"].astype(float)
    spy_df = spy_df.sort_values("Date").reset_index(drop=True)
    spy_prices = dict(zip(spy_df["Date"], spy_df["Price"]))
    trading_days = sorted(spy_prices.keys())

    # Load AMZN prices
    amzn_df = pd.read_csv(AMZN_CSV)
    amzn_df["Date"] = pd.to_datetime(amzn_df["Date"], format="%m/%d/%Y")
    amzn_df["Price"] = amzn_df["Price"].astype(float)
    amzn_df = amzn_df.sort_values("Date").reset_index(drop=True)
    amzn_prices = dict(zip(amzn_df["Date"], amzn_df["Price"]))
    amzn_trading_days = sorted(amzn_prices.keys())

    # Load transactions
    txn_df = pd.read_csv(TRANSACTIONS_CSV)
    txn_df["date"] = pd.to_datetime(txn_df["date"])
    txn_df["tags"] = txn_df["tags"].fillna("").astype(str)
    txn_df["type"] = txn_df["type"].fillna("").astype(str)
    txn_df["account"] = txn_df["account"].fillna("").astype(str)
    txn_df["name"] = txn_df["name"].fillna("").astype(str)
    txn_df["category"] = txn_df["category"].fillna("").astype(str)
    txn_df["parent category"] = txn_df["parent category"].fillna("").astype(str)
    txn_df["excluded"] = txn_df["excluded"].fillna(False)

    print(
        f"Loaded: {len(trading_days)} SPY days, "
        f"{len(amzn_trading_days)} AMZN days, "
        f"{len(txn_df)} transactions"
    )


def get_next_trading_day(date) -> pd.Timestamp:
    if isinstance(date, str):
        date = pd.Timestamp(date)
    date = pd.Timestamp(date)
    for td in trading_days:
        if td >= date:
            return td
    return trading_days[-1]


def get_next_amzn_trading_day(date) -> pd.Timestamp:
    if isinstance(date, str):
        date = pd.Timestamp(date)
    date = pd.Timestamp(date)
    for td in amzn_trading_days:
        if td >= date:
            return td
    return amzn_trading_days[-1]
