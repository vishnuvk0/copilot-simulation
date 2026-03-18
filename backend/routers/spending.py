from fastapi import APIRouter, Query
from services.spending import get_available_categories, get_spending_breakdown
from models.schemas import CategoryInfo, SpendingBreakdownResponse

router = APIRouter(prefix="/api/spending")


@router.get("/categories", response_model=list[CategoryInfo])
def categories():
    return get_available_categories()


@router.get("/breakdown", response_model=SpendingBreakdownResponse)
def breakdown(
    year_start: int = Query(2022),
    year_end: int = Query(2026),
):
    return get_spending_breakdown(year_start, year_end)
