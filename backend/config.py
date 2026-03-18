from pathlib import Path

HOME = Path.home()

SPY_CSV = HOME / "Downloads" / "SPY ETF Stock Price History (4).csv"
AMZN_CSV = HOME / "Downloads" / "amazon_price_history.csv"
TRANSACTIONS_CSV = HOME / "Documents" / "transactions.csv"

ROBINHOOD_STARTING_BALANCE = 17936.0
ROBINHOOD_START_DATE = "2022-01-03"

ACCOUNT_ORDER = [
    "Google 401k",
    "Amazon 401(k)",
    "Visa 401k",
    "Visa ESPP",
    "Amazon HSA",
    "Amazon Vests",
    "Robinhood",
]

COLORS = {
    "Google 401k": "#4285F4",
    "Amazon 401(k)": "#E67E22",
    "Visa 401k": "#3D4F8F",
    "Visa ESPP": "#1A1F71",
    "Amazon HSA": "#00A4EF",
    "Amazon Vests": "#FF9900",
    "Robinhood": "#00C805",
}
