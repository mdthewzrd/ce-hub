import datetime
import time
import os
import json
import requests

# Polygon.io API Key
API_KEY = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"

# Set the extension distance (in multiples of ATR)
EXTENSION_DISTANCE = 1.0  # Change this value to set the distance

# Function to fetch tickers from the NASDAQ exchange
def get_nasdaq_tickers():
    url = f"https://api.polygon.io/v3/reference/tickers"
    params = {
        "market": "stocks",
        "exchange": "XNAS",
        "type": "CS",
        "active": "true",
        "apiKey": API_KEY
    }
    tickers = []
    while True:
        response = requests.get(url, params=params)
        if response.status_code == 200:
            data = response.json()
            tickers.extend([item["ticker"] for item in data.get("results", [])])
            if "next_url" in data:
                url = data["next_url"]
            else:
                break
        else:
            raise Exception(f"Error fetching tickers: {response.status_code} - {response.json()}")
    return tickers

# Function to fetch and cache historical aggregates for ATR and EMA calculations
def get_historical_aggregates_cached(ticker, start_date, end_date, timespan="day"):
    cache_file = f"{ticker}_data.json"
    if os.path.exists(cache_file):
        with open(cache_file, "r") as f:
            return json.load(f)

    url = f"https://api.polygon.io/v2/aggs/ticker/{ticker}/range/1/{timespan}/{start_date}/{end_date}"
    params = {"adjusted": "true", "apiKey": API_KEY}
    response = requests.get(url, params=params)
    time.sleep(0.5)  # Throttle API requests
    if response.status_code == 200:
        data = response.json().get("results", [])
        with open(cache_file, "w") as f:
            json.dump(data, f)
        return data
    else:
        raise Exception(f"Error fetching data for {ticker}: {response.status_code} - {response.json()}")

# Calculate ATR (Average True Range)
def calculate_atr(data, period=14):
    tr_list = []
    for i in range(1, len(data)):
        high = data[i]["h"]
        low = data[i]["l"]
        prev_close = data[i - 1]["c"]
        tr = max(high - low, abs(high - prev_close), abs(low - prev_close))
        tr_list.append(tr)
    return sum(tr_list[-period:]) / period if len(tr_list) >= period else None

# Calculate EMA
def calculate_ema(prices, period):
    ema = []
    multiplier = 2 / (period + 1)
    for i, price in enumerate(prices):
        if i == 0:
            ema.append(price)
        else:
            ema.append((price - ema[-1]) * multiplier + ema[-1])
    return ema[-1]

# Calculate daily average EMA distance as a multiple of Day -1 ATR
def calculate_avg_ema_distance_multiple(data, period, ema_period, atr_day_1):
    distances = []
    for i in range(period):
        high = data[-(i + 1)]["h"]
        close_prices = [d["c"] for d in data[-(i + ema_period + 1):-(i + 1)]]
        ema = calculate_ema(close_prices, ema_period)
        distance_multiple = (high - ema) / atr_day_1
        distances.append(distance_multiple)
    return sum(distances) / len(distances)

# Calculate highest swing high in a range
def calculate_swing_high(data, start_offset, end_offset):
    """
    Calculate the highest swing high within a specified range of historical data.
    A swing high is defined as a high surrounded by lower highs on both sides.

    Args:
        data (list): List of historical data points.
        start_offset (int): Start offset (relative to the end of the list).
        end_offset (int): End offset (relative to the end of the list).

    Returns:
        float: The highest swing high in the range, or None if no swing highs are found.
    """
    if len(data) < abs(start_offset) or len(data) < abs(end_offset):
        return None  # Not enough data to calculate

    range_data = data[start_offset:end_offset]
    swing_highs = []

    for i in range(1, len(range_data) - 1):
        prev_high = range_data[i - 1]["h"]
        curr_high = range_data[i]["h"]
        next_high = range_data[i + 1]["h"]

        if curr_high > prev_high and curr_high > next_high:
            swing_highs.append(curr_high)

    return max(swing_highs) if swing_highs else None

# Evaluate conditions
def evaluate_conditions(historical_data, atr_day_1, closing_prices, extension_distance):
    # Calculate average EMA distances (as multiples of Day -1 ATR) for Day -14, -7, and -3
    day_14_avg_ema_10 = calculate_avg_ema_distance_multiple(historical_data[:-14], 14, 10, atr_day_1)
    day_14_avg_ema_30 = calculate_avg_ema_distance_multiple(historical_data[:-14], 14, 30, atr_day_1)
    day_7_avg_ema_10 = calculate_avg_ema_distance_multiple(historical_data[:-7], 7, 10, atr_day_1)
    day_7_avg_ema_30 = calculate_avg_ema_distance_multiple(historical_data[:-7], 7, 30, atr_day_1)
    day_3_avg_ema_10 = calculate_avg_ema_distance_multiple(historical_data[:-3], 3, 10, atr_day_1)
    day_3_avg_ema_30 = calculate_avg_ema_distance_multiple(historical_data[:-3], 3, 30, atr_day_1)

    # Extract days
    day_1 = historical_data[-2]
    day_0 = historical_data[-1]

    # Day -2 metrics
    day_2_high = historical_data[-3]["h"]
    day_2_ema_distance_10 = (day_2_high - calculate_ema(closing_prices[:-2], 10)) / atr_day_1
    day_2_ema_distance_30 = (day_2_high - calculate_ema(closing_prices[:-2], 30)) / atr_day_1

    # Day -1 metrics
    day_1_high = day_1["h"]
    day_1_close = day_1["c"]
    day_1_vol = day_1["v"]
    day_1_ema_distance_10 = (day_1_high - calculate_ema(closing_prices[:-1], 10)) / atr_day_1
    day_1_ema_distance_30 = (day_1_high - calculate_ema(closing_prices[:-1], 30)) / atr_day_1

    # Day 0 metrics
    day_0_open = day_0["o"]
    day_0_gap = (day_0_open - day_1["c"]) / atr_day_1
    day_0_open_high_diff = (day_0_open - day_1_high) / atr_day_1

    # Swing high logic for day -5 to -65
    highest_swing_high_5_to_65 = calculate_swing_high(historical_data, -65, -2)
    day_1_high_vs_5_to_65 = (day_1_high - highest_swing_high_5_to_65) / atr_day_1 if highest_swing_high_5_to_65 else None

    # Conditions
    conditions = {
        "Day -14 Avg EMA 10 >= 1x ATR": day_14_avg_ema_10 >= .25,
        "Day -14 Avg EMA 30 >= 2x ATR": day_14_avg_ema_30 >= .5,
        "Day -7 Avg EMA 10 >= 1x ATR": day_7_avg_ema_10 >= .25,
        "Day -7 Avg EMA 30 >= 2x ATR": day_7_avg_ema_30 >= .75,
        "Day -3 Avg EMA 10 >= 1x ATR": day_3_avg_ema_10 >= .5,
        "Day -3 Avg EMA 30 >= 2x ATR": day_3_avg_ema_30 >= 1,
        "Day -2 EMA 10 Distance >= 1.25x ATR": day_2_ema_distance_10 >= 1.,
        "Day -2 EMA 30 Distance >= 2.5x ATR": day_2_ema_distance_30 >= 2,
        "Day -1 EMA 10 Distance >= 1.5x ATR": day_1_ema_distance_10 >= 1.5,
        "Day -1 EMA 30 Distance >= 3x ATR": day_1_ema_distance_30 >= 3,
        "Day -1 Volume >= 7,000,000": day_1_vol >= 7_000_000,
        "Day -1 Close >= 20": day_1_close >= 20,
        f"Day -1 High >= {extension_distance}x ATR above Swing High (-5 to -65)": day_1_high_vs_5_to_65 >= extension_distance if day_1_high_vs_5_to_65 is not None else False,
        "Day 0 Gap >= 0.6x ATR": day_0_gap >= 0.5,
        "Day 0 Open - Day -1 High >= 0.5x ATR": day_0_open_high_diff >= 0.1,
    }

    # Check if all conditions are met
    all_passed = all(conditions.values())
    return all_passed, conditions

# Scan tickers
def scan_tickers():
    tickers = [
        "SOXL", "MRVL", "TGT", "DOCU", "ZM", "DIS", "NFLX", "AMC", "RKT", "SNAP", "RBLX", "META", "SE", "NVDA",
        "SMCI", "MSTR", "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "AMD", "NFLX", "INTC", "BABA", "BA",
        "PYPL", "QCOM", "ORCL", "T", "CSCO", "VZ", "KO", "PEP", "MRK", "PFE", "ABBV", "JNJ", "DIS", "CRM",
        "BAC", "C", "JPM", "WMT", "CVX", "XOM", "COP", "RTX", "SPGI", "GS", "TGT", "HD", "LOW", "COST", "UNH",
        "NEE", "NKE", "LMT", "HON", "CAT", "MMM", "LIN", "ADBE", "AVGO", "TXN", "ACN", "UPS", "BLK", "PM", "MO",
        "ELV", "VRTX", "ZTS", "NOW", "ISRG", "PLD", "MS", "MDT", "WM", "GE", "IBM", "BKNG", "FDX", "ADP", "EQIX",
        "DHR", "SNPS", "REGN", "SYK", "TMO", "CVS", "INTU", "SCHW", "CI", "APD", "SO", "MMC", "ICE", "FIS",
        "ADI", "CSX", "LRCX", "GILD", "RIVN", "LCID", "PLTR", "SNOW", "SPY", "QQQ", "DIA", "IWM", "TQQQ",
        "SQQQ", "ARKK", "SOXL", "LABU", "TECL", "UVXY", "XLE", "XLK", "XLF", "IBB", "KWEB", "TAN", "XOP",
        "EEM", "HYG", "EFA", "USO", "GLD", "SLV", "BITO", "RIOT", "MARA", "COIN", "SQ", "AFRM", "DKNG", "ZM",
        "DOCU", "SHOP", "UPST", "CLF", "AA", "F", "GM", "ROKU", "WBD", "WBA", "PARA", "PINS", "LYFT", "SNAP",
        "BYND", "DJT", "RDDT", "GME", "VKTX", "APLD", "KGEI", "INOD", "LMB", "AMR", "PMTS", "SAVA", "CELH",
        "ESOA", "IVT", "MOD", "SKYE", "AR", "VIXY", "TECS", "LABD", "SPXS", "SPXL", "DRV", "TZA", "FAZ", "WEBS",
        "PSQ", "SDOW", "GME", "VKTX", "MSTU", "MSTZ", "NFLU", "BTCL", "BTCZ", "ETU", "ETQ", "SOXL", "TECL",
        "FAS", "SPXL", "TNA", "NUGT", "TSLL", "NVDU", "AMZU", "MSFU", "NFLU", "TQQQ", "SPXL", "SOXL", "FAS",
        "TECL", "UVXY", "UVIX"
    ]

    start_date = (datetime.datetime.now() - datetime.timedelta(days=705)).strftime("%Y-%m-%d")
    end_date = datetime.datetime.now().strftime("%Y-%m-%d")
    results = set()  # Use a set to avoid duplicates

    for ticker in tickers:
        try:
            historical_data = get_historical_aggregates_cached(ticker, start_date, end_date)

            # Ensure sufficient data
            if len(historical_data) < 65:
                print(f"Not enough data for {ticker}.")
                continue

            for i in range(65, len(historical_data)):
                data_slice = historical_data[i - 65:i]
                closing_prices = [day["c"] for day in historical_data[:i]]
                atr_day_1 = calculate_atr(historical_data[:i], period=14)

                if atr_day_1 is None or atr_day_1 == 0:
                    continue

                passed, _ = evaluate_conditions(data_slice, atr_day_1, closing_prices, EXTENSION_DISTANCE)

                if passed:
                    date = datetime.datetime.utcfromtimestamp(data_slice[-1]["t"] / 1000).strftime("%Y-%m-%d")
                    results.add((date, ticker))  # Add result as tuple (date, ticker)
        except Exception as e:
            print(f"Error processing {ticker}: {e}")

    # Sort results by date
    results = sorted(results)

    # Print results
    for date, ticker in results:
        print(f"{ticker}, {date}")

# Run the scan
scan_tickers()
