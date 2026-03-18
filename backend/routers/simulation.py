from fastapi import APIRouter
from services.what_if import simulate_what_if
from services.monte_carlo import run_monte_carlo
from models.schemas import WhatIfRequest, WhatIfResult, MonteCarloRequest, MonteCarloResult

router = APIRouter(prefix="/api/simulate")


@router.post("/what-if", response_model=WhatIfResult)
def what_if(req: WhatIfRequest):
    return simulate_what_if(req.categories, req.year_start, req.year_end)


@router.post("/monte-carlo", response_model=MonteCarloResult)
def monte_carlo(req: MonteCarloRequest):
    return run_monte_carlo(
        monthly_investment=req.monthly_investment,
        num_years=req.num_years,
        num_simulations=req.num_simulations,
        starting_value=req.starting_value,
    )
