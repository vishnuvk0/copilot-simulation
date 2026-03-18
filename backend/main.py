from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    from data.loader import load_all
    from services.portfolio import precompute
    load_all()
    precompute()
    yield


app = FastAPI(title="Investment Simulator", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers.portfolio import router as portfolio_router
from routers.spending import router as spending_router
from routers.simulation import router as simulation_router

app.include_router(portfolio_router)
app.include_router(spending_router)
app.include_router(simulation_router)
