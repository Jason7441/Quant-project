
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio

# Import the refactored analysis functions
from QUANT import analyze_stock, analyze_commodity

app = FastAPI()

# --- CORS Configuration ---
# This allows the React frontend (running on a different port) to communicate with this API.
origins = [
    "http://localhost:3000", # Default React dev server port
    "http://localhost:3001", # Sometimes React uses the next available port
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Stock & Commodity Lists ---
# These are the assets the dashboard will load by default.
STOCKS_TO_ANALYZE = ['AAPL', 'MSFT', 'TSLA', 'NVDA', 'AMZN', 'GOOGL', 'META', 'NFLX', 'SPY', 'QQQ']
COMMODITIES_TO_ANALYZE = {
    'GLD': 'Gold', 'SLV': 'Silver', 'USO': 'Oil', 'UNG': 'Natural Gas',
    'DBA': 'Agriculture', 'CORN': 'Corn', 'WEAT': 'Wheat', 'CPER': 'Copper',
    'PDBC': 'Commodities Basket', 'GC=F': 'Gold Futures'
}

# --- API Endpoints ---

@app.get("/api/analysis/stocks")
async def get_stock_analysis():
    """
    Analyzes a predefined list of stocks concurrently and returns the results.
    """
    tasks = [asyncio.to_thread(analyze_stock, ticker) for ticker in STOCKS_TO_ANALYZE]
    results = await asyncio.gather(*tasks)
    return [res for res in results if "error" not in res]

@app.get("/api/analysis/commodities")
async def get_commodity_analysis():
    """
    Analyzes a predefined list of commodities concurrently and returns the results.
    """
    tasks = [asyncio.to_thread(analyze_commodity, ticker, name) for ticker, name in COMMODITIES_TO_ANALYZE.items()]
    results = await asyncio.gather(*tasks)
    return [res for res in results if "error" not in res]

@app.get("/api/analysis/search/{ticker_symbol}")
async def search_ticker(ticker_symbol: str):
    """
    Analyzes a single ticker provided by the user.
    This endpoint powers the search bar in the UI.
    """
    # Basic input validation
    if not ticker_symbol or len(ticker_symbol) > 5:
        return {"error": "Invalid ticker symbol"}
    
    # Run analysis in a separate thread to avoid blocking the server
    result = await asyncio.to_thread(analyze_stock, ticker_symbol.upper())
    return result

@app.get("/api/chart/{ticker_symbol}")
async def get_chart_data(ticker_symbol: str):
    """
    Fetches historical data and calculates indicators for the chart.
    """
    import yfinance as yf
    from QUANT import calculate_rsi, calculate_macd, calculate_bollinger_bands
    import pandas as pd

    ticker = yf.Ticker(ticker_symbol)
    # Fetch 1 year of historical data
    hist = ticker.history(period="1y")

    if hist.empty:
        return {"error": "Could not fetch historical data."}

    # Reset index to make 'Date' a column
    hist.reset_index(inplace=True)
    # Convert timestamp to string 'YYYY-MM-DD' for JSON compatibility
    hist['Date'] = hist['Date'].dt.strftime('%Y-%m-%d')

    # Calculate indicators
    close_prices = hist['Close']
    rsi = calculate_rsi(close_prices)
    macd, signal_line, _ = calculate_macd(close_prices)
    upper_bb, middle_bb, lower_bb = calculate_bollinger_bands(close_prices)

    # Format data for Lightweight Charts
    ohlc_data = hist[['Date', 'Open', 'High', 'Low', 'Close']].rename(columns={'Date': 'time', 'Open': 'open', 'High': 'high', 'Low': 'low', 'Close': 'close'}).to_dict(orient='records')
    volume_data = hist[['Date', 'Volume']].rename(columns={'Date': 'time', 'Volume': 'value'}).to_dict(orient='records')
    rsi_data = pd.DataFrame({'time': hist['Date'], 'value': rsi}).dropna().to_dict(orient='records')
    macd_data = pd.DataFrame({'time': hist['Date'], 'value': macd}).dropna().to_dict(orient='records')
    signal_line_data = pd.DataFrame({'time': hist['Date'], 'value': signal_line}).dropna().to_dict(orient='records')
    bollinger_data = pd.DataFrame({
        'time': hist['Date'], 
        'upper': upper_bb, 
        'middle': middle_bb, 
        'lower': lower_bb
    }).dropna().to_dict(orient='records')

    return {
        "ohlc": ohlc_data,
        "volume": volume_data,
        "rsi": rsi_data,
        "macd": {
            "macd_line": macd_data,
            "signal_line": signal_line_data
        },
        "bollinger_bands": bollinger_data
    }

@app.get("/")
def read_root():
    return {"message": "Quant Analysis API is running."}
