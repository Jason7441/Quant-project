import yfinance as yf
import pandas as pd
import requests
from bs4 import BeautifulSoup
from textblob import TextBlob
from datetime import datetime, timedelta
import time
import csv
import os

# --- DATA CALCULATION FUNCTIONS ---

def calculate_rsi(prices, period=14):
    delta = prices.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    return rsi

def calculate_macd(prices, fast=12, slow=26, signal=9):
    ema_fast = prices.ewm(span=fast).mean()
    ema_slow = prices.ewm(span=slow).mean()
    macd = ema_fast - ema_slow
    signal_line = macd.ewm(span=signal).mean()
    histogram = macd - signal_line
    return macd, signal_line, histogram

def calculate_bollinger_bands(prices, period=20, std_dev=2):
    sma = prices.rolling(window=period).mean()
    std = prices.rolling(window=period).std()
    upper_band = sma + (std * std_dev)
    lower_band = sma - (std * std_dev)
    return upper_band, sma, lower_band

def calculate_stochastic(high, low, close, k_period=14, d_period=3):
    lowest_low = low.rolling(window=k_period).min()
    highest_high = high.rolling(window=k_period).max()
    k_percent = 100 * ((close - lowest_low) / (highest_high - lowest_low))
    d_percent = k_percent.rolling(window=d_period).mean()
    return k_percent, d_percent

def calculate_williams_r(high, low, close, period=14):
    highest_high = high.rolling(window=period).max()
    lowest_low = low.rolling(window=period).min()
    williams_r = -100 * ((highest_high - close) / (highest_high - lowest_low))
    return williams_r

def get_sentiment(headline):
    blob = TextBlob(headline)
    return blob.sentiment.polarity

def get_stock_news(ticker):
    """
    Scrapes news headlines from Finviz.
    """
    url = f"https://finviz.com/quote.ashx?t={ticker}"
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'}
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        news_table = soup.find(id='news-table')
        if not news_table:
            return []
        
        headlines = []
        for row in news_table.find_all('tr'):
            title_element = row.find('a', class_='tab-link-news')
            if title_element:
                headlines.append(title_element.get_text())
        return headlines[:5]
        
    except Exception:
        # Silently fail on news error, as it's not critical
        return []

# --- CORE ANALYSIS FUNCTIONS ---

def analyze_stock(ticker):
    stock = yf.Ticker(ticker)
    hist = stock.history(period="2mo") # Fetch 2 months of data for calculations
    
    if hist.empty:
        return {"error": f"No data available for {ticker}"}
    
    # --- Calculations ---
    latest_price = hist['Close'].iloc[-1]
    rsi = calculate_rsi(hist['Close']).iloc[-1]
    macd, signal_line, histogram = calculate_macd(hist['Close'])
    stoch_k, stoch_d = calculate_stochastic(hist['High'], hist['Low'], hist['Close'])
    williams_r = calculate_williams_r(hist['High'], hist['Low'], hist['Close']).iloc[-1]
    upper_bb, middle_bb, lower_bb = calculate_bollinger_bands(hist['Close'])
    
    headlines = get_stock_news(ticker)
    sentiments = [get_sentiment(h) for h in headlines]
    avg_sentiment = sum(sentiments) / len(sentiments) if sentiments else 0
    
    # --- Signal Logic ---
    signals = []
    if rsi < 30: signals.append("RSI_OVERSOLD")
    if rsi > 70: signals.append("RSI_OVERBOUGHT")
    if macd.iloc[-1] > signal_line.iloc[-1] and histogram.iloc[-1] > 0: signals.append("MACD_BULLISH")
    if macd.iloc[-1] < signal_line.iloc[-1] and histogram.iloc[-1] < 0: signals.append("MACD_BEARISH")
    if latest_price > upper_bb.iloc[-1]: signals.append("BB_OVERBOUGHT")
    if latest_price < lower_bb.iloc[-1]: signals.append("BB_OVERSOLD")
    if stoch_k.iloc[-1] < 20 and stoch_d.iloc[-1] < 20: signals.append("STOCH_OVERSOLD")
    if stoch_k.iloc[-1] > 80 and stoch_d.iloc[-1] > 80: signals.append("STOCH_OVERBOUGHT")
    if williams_r < -80: signals.append("WILLIAMS_OVERSOLD")
    if williams_r > -20: signals.append("WILLIAMS_OVERBOUGHT")

    # --- Recommendation Logic ---
    bullish_count = sum(1 for s in signals if any(word in s for word in ['OVERSOLD', 'BULLISH']))
    bearish_count = sum(1 for s in signals if any(word in s for word in ['OVERBOUGHT', 'BEARISH']))
    
    if bullish_count > bearish_count and avg_sentiment >= 0: suggestion = "BUY"
    elif bullish_count > bearish_count: suggestion = "BUY"
    elif bearish_count > bullish_count and avg_sentiment <= 0: suggestion = "SELL"
    elif bearish_count > bullish_count: suggestion = "SELL"
    else: suggestion = "HOLD"

    # --- Return JSON-friendly dictionary ---
    return {
        "ticker": ticker,
        "price": f"{latest_price:.2f}",
        "recommendation": suggestion,
        "confidence": f"{min(95, max(bullish_count, bearish_count) * 15)}%",
        "indicators": {
            "rsi": f"{rsi:.2f}",
            "macd": f"{macd.iloc[-1]:.2f}",
            "williams_r": f"{williams_r:.2f}",
            "sentiment": f"{avg_sentiment:.3f}"
        },
        "signals": signals,
        "news": [{"headline": h, "sentiment": f"{s:.3f}"} for h, s in zip(headlines, sentiments)]
    }

def analyze_commodity(ticker, name):
    stock = yf.Ticker(ticker)
    hist = stock.history(period="3mo") # More data for commodities
    
    if hist.empty:
        return {"error": f"No data available for {ticker}"}

    # --- Calculations ---
    latest_price = hist['Close'].iloc[-1]
    rsi = calculate_rsi(hist['Close']).iloc[-1]
    macd, signal_line, _ = calculate_macd(hist['Close'])
    
    # --- Signal Logic ---
    signals = []
    if rsi < 30: signals.append("RSI_OVERSOLD")
    if rsi > 70: signals.append("RSI_OVERBOUGHT")
    if macd.iloc[-1] > signal_line.iloc[-1]: signals.append("MACD_BULLISH")
    else: signals.append("MACD_BEARISH")

    # --- Recommendation Logic ---
    if rsi < 35 and macd.iloc[-1] > signal_line.iloc[-1]: recommendation = "BUY"
    elif rsi > 65 and macd.iloc[-1] < signal_line.iloc[-1]: recommendation = "SELL"
    else: recommendation = "HOLD"

    # --- Return JSON-friendly dictionary ---
    return {
        "ticker": ticker,
        "name": name,
        "price": f"{latest_price:.2f}",
        "recommendation": recommendation,
        "indicators": {
            "rsi": f"{rsi:.2f}",
            "macd": f"{macd.iloc[-1]:.2f}"
        },
        "signals": signals
    }