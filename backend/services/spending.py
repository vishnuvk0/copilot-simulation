"""Spending analysis service — category breakdown from transactions.csv."""

import pandas as pd
import data.loader as loader


def _filtered_spending():
    """Return spending transactions: excluded==False, type==regular, amount>0, non-empty parent category."""
    df = loader.txn_df
    mask = (
        (df["excluded"] == False)
        & (df["type"] == "regular")
        & (df["amount"] > 0)
        & (df["parent category"] != "")
    )
    return df[mask]


def get_available_categories() -> list[dict]:
    df = _filtered_spending()
    grouped = df.groupby(["category", "parent category"]).agg(
        total_spend=("amount", "sum"),
        transaction_count=("amount", "count"),
    ).reset_index()
    grouped = grouped.sort_values("total_spend", ascending=False)
    return [
        {
            "category": row["category"],
            "parent_category": row["parent category"],
            "total_spend": round(row["total_spend"], 2),
            "transaction_count": int(row["transaction_count"]),
        }
        for _, row in grouped.iterrows()
    ]


def get_spending_breakdown(year_start: int, year_end: int) -> dict:
    df = _filtered_spending()
    df = df[
        (df["date"].dt.year >= year_start)
        & (df["date"].dt.year <= year_end)
    ].copy()

    df["year"] = df["date"].dt.year
    df["month"] = df["date"].dt.month

    grouped = df.groupby(["category", "parent category", "year", "month"]).agg(
        amount=("amount", "sum"),
    ).reset_index()

    items = [
        {
            "category": row["category"],
            "parent_category": row["parent category"],
            "year": int(row["year"]),
            "month": int(row["month"]),
            "amount": round(row["amount"], 2),
        }
        for _, row in grouped.iterrows()
    ]

    total_spend = round(df["amount"].sum(), 2)
    num_months = df.groupby(["year", "month"]).ngroups
    monthly_average = round(total_spend / max(num_months, 1), 2)

    return {
        "items": items,
        "total_spend": total_spend,
        "monthly_average": monthly_average,
    }
