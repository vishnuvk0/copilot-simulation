from fastapi import APIRouter
import pandas as pd
from services.portfolio import get_cache
from config import ACCOUNT_ORDER, COLORS
from models.schemas import PortfolioSummary, AccountResult, YearlyBreakdown

router = APIRouter(prefix="/api")


def _to_ts_list(series: pd.Series) -> list[list[float]]:
    return [[int(d.timestamp() * 1000), round(float(v), 2)] for d, v in series.items()]


@router.get("/portfolio", response_model=PortfolioSummary)
def get_portfolio():
    cache = get_cache()
    results = cache["results"]
    daily_values = cache["daily_values"]
    daily_cost_basis = cache["daily_cost_basis"]

    ordered = [a for a in ACCOUNT_ORDER if a in results]

    accounts = []
    for acct in ordered:
        r = results[acct]
        yearly = [
            YearlyBreakdown(year=yr, **data)
            for yr, data in sorted(r["yearly"].items())
        ]
        accounts.append(AccountResult(
            name=acct,
            asset=r["asset"],
            color=COLORS.get(acct, "#888888"),
            first_date=r["first_date"].strftime("%Y-%m-%d"),
            total_cost=round(r["total_cost"], 2),
            final_value=round(r["final_value"], 2),
            total_gain=round(r["total_gain"], 2),
            full_twr=r["full_twr"],
            full_twr_ann=r["full_twr_ann"],
            full_mwr=r["full_mwr"],
            yearly=yearly,
            daily_values=_to_ts_list(daily_values[acct]),
            daily_cost_basis=_to_ts_list(daily_cost_basis[acct]),
        ))

    # Totals
    all_vals = pd.DataFrame({a: daily_values[a] for a in ordered}).fillna(0)
    total_series = all_vals.sum(axis=1)
    all_costs = pd.DataFrame({a: daily_cost_basis[a] for a in ordered}).fillna(0)
    total_cost_series = all_costs.sum(axis=1)

    total_cost = sum(r["total_cost"] for r in results.values())
    total_value = sum(r["final_value"] for r in results.values())

    return PortfolioSummary(
        total_cost=round(total_cost, 2),
        total_value=round(total_value, 2),
        total_gain=round(total_value - total_cost, 2),
        overall_return=round((total_value - total_cost) / total_cost * 100, 2) if total_cost > 0 else 0,
        accounts=accounts,
        total_daily_values=_to_ts_list(total_series),
        total_daily_cost_basis=_to_ts_list(total_cost_series),
    )
