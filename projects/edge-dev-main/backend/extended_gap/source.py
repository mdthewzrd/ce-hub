import requests
import datetime
import numpy as np

API_KEY = 'Fm7brz4s23eSocDErnL68cE7wspz2K1I'

def fetch_aggregates(ticker, start_date, end_date):
    """Fetch OHLC aggregates for a ticker within a date range."""
    url = f'https://api.polygon.io/v2/aggs/ticker/{ticker}/range/1/day/{start_date}/{end_date}?apiKey={API_KEY}'
    response = requests.get(url)
    response.raise_for_status()
    data = response.json().get('results', [])
    return data

def calculate_ema(prices, days):
    """Calculate EMA for a list of prices."""
    if len(prices) < days:
        return None  # Not enough data for EMA
    weights = np.exp(np.linspace(-1., 0., days))
    weights /= weights.sum()
    ema = np.convolve(prices, weights, mode='valid')
    return ema[-1]  # Return the most recent EMA

def calculate_atr(highs, lows, closes, days):
    """Calculate ATR for a given period."""
    if len(highs) < days or len(lows) < days or len(closes) < days:
        return None  # Not enough data
    tr = [max(h - l, abs(h - c), abs(l - c)) for h, l, c in zip(highs, lows, closes)]
    atr = np.mean(tr[-days:])  # Average True Range
    return atr

def scan_ticker(ticker, start_date, end_date, criteria, open_above_atr_multiplier):
    """Scan a ticker for criteria over a date range."""
    ohlc_data = fetch_aggregates(ticker, start_date, end_date)

    if len(ohlc_data) < 60:  # Ensure sufficient data for calculations
        return []

    results = []
    closes = [d['c'] for d in ohlc_data]
    highs = [d['h'] for d in ohlc_data]
    lows = [d['l'] for d in ohlc_data]
    opens = [d['o'] for d in ohlc_data]
    volumes = [d['v'] for d in ohlc_data]

    # Loop through each date
    for idx in range(60, len(ohlc_data)):
        # Calculate ATR for Day -1
        atr_d1 = calculate_atr(highs[:idx], lows[:idx], closes[:idx], 14)

        # Day -1 High vs. 14-Day Highest High (from Day -4 to Day -19)
        day_minus_1_high = highs[idx-1]
        highest_high_14d = max(highs[idx-19:idx-4]) if idx >= 19 else None
        breakout_extension = (day_minus_1_high - highest_high_14d) / atr_d1 if atr_d1 and highest_high_14d else None

        # Day -1 High to 10 EMA / ATR
        ema_10 = calculate_ema(closes[:idx], 10) if idx >= 10 else None
        day_minus_1_high_to_10ema = (day_minus_1_high - ema_10) / atr_d1 if ema_10 and atr_d1 else None

        # Day -1 High to 30 EMA / ATR
        ema_30 = calculate_ema(closes[:idx], 30) if idx >= 30 else None
        day_minus_1_high_to_30ema = (day_minus_1_high - ema_30) / atr_d1 if ema_30 and atr_d1 else None

        # Day -1 Low to Day 0 PMH vs ATR and EMA
        day_0_pmh = highs[idx] * 1.075  # Approximate PMH as 7.5% above Day 0 High
        day_minus_1_low = lows[idx-1]
        range_d1_low_to_pmh_vs_atr = (day_0_pmh - day_minus_1_low) / atr_d1 if atr_d1 else None
        ema_d1 = calculate_ema(closes[:idx], 10) if idx >= 1 else None
        range_d1_low_to_pmh_vs_ema_d1 = (day_0_pmh - ema_d1) / atr_d1 if ema_d1 and atr_d1 else None

        # Day -1 Change
        day_minus_1_change = ((closes[idx-1] / closes[idx-2]) - 1) * 100 if idx >= 2 else None

        # Pre-Market High Day 0 %
        pre_market_high_pct = ((day_0_pmh / closes[idx-1]) - 1) * 100 if closes[idx-1] else None

        # Day 0 Open >= X ATR above the highest high from Day -2 to Day -14
        highest_high_d2_to_d14 = max(highs[idx-14:idx-2]) if idx >= 14 else None
        day_0_open_above_x_atr = ((opens[idx] - highest_high_d2_to_d14) / atr_d1) if atr_d1 and highest_high_d2_to_d14 else None

        # Day 0 Open vs. Day -1 High
        day_0_open_vs_day_minus_1_high = opens[idx] >= highs[idx-1]

        # Metrics
        metrics = {
            "Day -1 Volume": volumes[idx-1],
            "14-Day Breakout Extension": breakout_extension,
            "Day -1 High to 10 EMA / ATR": day_minus_1_high_to_10ema,
            "Day -1 High to 30 EMA / ATR": day_minus_1_high_to_30ema,
            "Day -1 Low to Day 0 PMH vs ATR": range_d1_low_to_pmh_vs_atr,
            "Day -1 Low to Day 0 PMH vs D-1 EMA": range_d1_low_to_pmh_vs_ema_d1,
            "Day 0 PMH %": pre_market_high_pct,
            "Day -1 Change %": day_minus_1_change,
            "Day 0 Open >= Day -1 High": day_0_open_vs_day_minus_1_high,
            "Day 0 Open Above D-2 to D-14 High (in ATR multiples)": day_0_open_above_x_atr,
            "Range to ATR Ratio D-1 High/D-2 Low": (highs[idx-1] - lows[idx-2]) / atr_d1 if atr_d1 else None,
            "Range to ATR Ratio D-1 High/D-3 Low": (highs[idx-1] - lows[idx-3]) / atr_d1 if atr_d1 else None,
            "Range to ATR Ratio D-1 High/D-8 Low": (highs[idx-1] - lows[idx-8]) / atr_d1 if atr_d1 else None,
            "Range to ATR Ratio D-1 High/D-15 Low": (highs[idx-1] - lows[idx-15]) / atr_d1 if atr_d1 else None,
        }

        # Check if the metrics pass the criteria
        passes_all = all(metrics[key] >= criteria[key] if isinstance(metrics[key], (int, float)) else metrics[key]
                         for key in criteria if metrics[key] is not None)

        # Check if Day 0 Open >= X ATR above D-2 to D-14 High
        if day_0_open_above_x_atr is not None and day_0_open_above_x_atr >= open_above_atr_multiplier:
            passes_all = passes_all and True
        else:
            passes_all = False

        if passes_all:
            results.append({
                "Ticker": ticker,
                "Date": datetime.datetime.fromtimestamp(ohlc_data[idx]['t'] / 1000).strftime('%Y-%m-%d'),
                "Metrics": metrics,
            })

    # Sort results in reverse chronological order
    results.sort(key=lambda x: x["Date"], reverse=True)
    return results

if __name__ == "__main__":
    # Define the criteria for the scan
    criteria = {
        "Day -1 Volume": 20000000,
        "14-Day Breakout Extension": 1,
        "Day -1 High to 10 EMA / ATR": 1,
        "Day -1 High to 30 EMA / ATR": 1,
        "Day -1 Low to Day 0 PMH vs ATR": 1,
        "Day -1 Low to Day 0 PMH vs D-1 EMA": 1,
        "Day 0 PMH %": 5,
        "Day -1 Change %": 2,
        "Day 0 Open >= Day -1 High": True,
        "Range to ATR Ratio D-1 High/D-2 Low": 1.5,
        "Range to ATR Ratio D-1 High/D-3 Low": 3,
        "Range to ATR Ratio D-1 High/D-8 Low": 5,
        "Range to ATR Ratio D-1 High/D-15 Low": 6,
    }

    # ATR multiplier for Day 0 Open condition
    open_above_atr_multiplier = 1  # Change this value as needed

    # Tickers to scan
    tickers = [
        "NVDA", "SMCI", "MSTR", "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", 
    "AMD", "NFLX", "INTC", "BABA", "BA", "PYPL", "QCOM", "ORCL", "T", "CSCO", 
    "VZ", "KO", "PEP", "MRK", "PFE", "ABBV", "JNJ", "DIS", "CRM", "BAC", "C", 
    "JPM", "WMT", "CVX", "XOM", "COP", "RTX", "SPGI", "GS", "TGT", "HD", "LOW", 
    "COST", "UNH", "NEE", "NKE", "LMT", "HON", "CAT", "MMM", "LIN", "ADBE", 
    "AVGO", "TXN", "ACN", "UPS", "BLK", "PM", "MO", "ELV", "VRTX", "ZTS", "NOW", 
    "ISRG", "PLD", "MS", "MDT", "WM", "GE", "IBM", "BKNG", "FDX", "ADP", "EQIX", 
    "DHR", "SNPS", "REGN", "SYK", "TMO", "CVS", "INTU", "SCHW", "CI", "APD", 
    "SO", "MMC", "ICE", "FIS", "ADI", "CSX", "LRCX", "GILD", "RIVN", "LCID", 
    "PLTR", "SNOW", "SPY", "QQQ", "DIA", "IWM", "TQQQ", "SQQQ", "ARKK", "SOXL", 
    "LABU", "TECL", "UVXY", "XLE", "XLK", "XLF", "IBB", "KWEB", "TAN", "XOP", 
    "EEM", "HYG", "EFA", "USO", "GLD", "SLV", "BITO", "RIOT", "MARA", "COIN", 
    "SQ", "AFRM", "DKNG", "ZM", "DOCU", "SHOP", "UPST", "CLF", "AA", "F", "GM", 
    "ROKU", "WBD", "WBA", "PARA", "PINS", "LYFT", "SNAP", "BYND", "DJT", "RDDT", 
    "GME", "VKTX", "APLD", "KGEI", "INOD", "LMB", "AMR", "PMTS", "SAVA", "CELH", 
    "ESOA", "IVT", "MOD", "SKYE", "AR", "VIXY", "TECS", "LABD", "SPXS", "SPXL", 
    "DRV", "TZA", "FAZ", "WEBS", "PSQ", "SDOW" "GME","VKTX",
    ]

    # Date range: last year
    start_date = (datetime.datetime.now() - datetime.timedelta(days=360)).strftime("%Y-%m-%d")
    end_date = datetime.datetime.now().strftime("%Y-%m-%d")

    print("Scanning specified tickers for the last year...\n")
    for ticker in tickers:
        results = scan_ticker(ticker, start_date, end_date, criteria, open_above_atr_multiplier)
        for result in results:
            print(f"{result['Ticker']} - {result['Date']}")
            for key, value in result["Metrics"].items():
                print(f"  {key}: {value}")
            print()
