# Investment Simulator

An interactive web app for portfolio analysis, spending breakdowns, and investment simulations. Built with **Next.js 16** and **FastAPI**.

## Features

### Portfolio Overview
- Total portfolio value, cost basis, and gains across 7 investment accounts (401k, HSA, ESPP, vests, brokerage)
- Portfolio value vs cost basis chart with gain/loss shading
- Stacked area chart showing account breakdown over time
- Per-account performance table with TWR and MWR (XIRR) returns

### Spending Analysis
- Category breakdown with horizontal bar chart (31 categories across 6 parent groups)
- Filterable by year range
- Monthly averages and totals

### What-If Simulator
- Select spending categories to hypothetically redirect into SPY investments
- Monthly lump sum mode: sum removed spending per month, invest on 1st trading day of next month
- Overlay chart showing actual portfolio, hypothetical gains, and combined value
- TWR computation for the hypothetical portfolio

### Monte Carlo Projections
- Forward-looking portfolio growth using bootstrap sampling from historical SPY monthly returns
- Configurable monthly investment amount and projection horizon
- Percentile band visualization (10th–90th)
- Probability of reaching $500K and $1M milestones

## Prerequisites

- Python 3.11+
- Node.js 18+
- npm

## Data Files

The app expects three CSV files (not included in the repo):

| File | Description | Expected Location |
|------|-------------|-------------------|
| `SPY ETF Stock Price History (4).csv` | Daily SPY prices (Date, Price columns) | `~/Downloads/` |
| `amazon_price_history.csv` | Daily AMZN prices (Date, Price columns) | `~/Downloads/` |
| `transactions.csv` | Personal transactions with categories | `~/Documents/` |

File paths are configured in `backend/config.py` — update them if your files are in different locations.

### Transaction CSV format

```
date,name,amount,status,category,parent category,excluded,tags,type,account
```

## Setup

### Backend

```bash
cd backend
pip install fastapi uvicorn pandas numpy scipy
python -m uvicorn main:app --port 8000
```

The backend loads all data at startup and precomputes portfolio results. You should see output like:

```
Loaded: 1054 SPY days, 418 AMZN days, 7918 transactions
Portfolio precomputed: $228,419 invested -> $294,355 value
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/portfolio` | Full portfolio summary with daily time series |
| GET | `/api/spending/categories` | All spending categories with totals |
| GET | `/api/spending/breakdown?year_start=2022&year_end=2026` | Monthly spending aggregation |
| POST | `/api/simulate/what-if` | What-if simulation (body: `{categories, year_start, year_end}`) |
| POST | `/api/simulate/monte-carlo` | Monte Carlo projection (body: `{monthly_investment, num_years, num_simulations, starting_value}`) |

## Architecture

```
investment-sim/
├── backend/
│   ├── main.py              # FastAPI app with CORS and lifespan
│   ├── config.py            # File paths and constants
│   ├── data/loader.py       # CSV loading and trading day utilities
│   ├── models/schemas.py    # Pydantic response models
│   ├── services/
│   │   ├── portfolio.py     # Portfolio simulation and return computation
│   │   ├── spending.py      # Category breakdown analysis
│   │   ├── what_if.py       # What-if simulation engine
│   │   └── monte_carlo.py   # Monte Carlo simulation engine
│   └── routers/
│       ├── portfolio.py     # GET /api/portfolio
│       ├── spending.py      # GET /api/spending/*
│       └── simulation.py    # POST /api/simulate/*
└── frontend/
    ├── next.config.ts       # API proxy rewrites to localhost:8000
    └── src/
        ├── app/page.tsx     # Main dashboard with 4 tabbed views
        ├── components/
        │   ├── charts/      # Recharts visualizations
        │   ├── controls/    # CategorySelector, DateRangePicker
        │   └── layout/      # TabNav, StatCard, SummaryTable
        └── lib/
            ├── api.ts       # Typed fetch wrappers
            ├── types.ts     # TypeScript interfaces
            └── formatters.ts
```
