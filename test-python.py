# Test Python Scanner
import pandas as pd
import numpy as np

def scan_stocks():
    symbols = ["AAPL", "GOOGL", "MSFT", "TSLA"]
    results = []

    for symbol in symbols:
        print(f"Scanning {symbol}")
        if symbol == "AAPL":
            results.append({"symbol": symbol, "action": "BUY"})
        elif symbol == "GOOGL":
            results.append({"symbol": symbol, "action": "HOLD"})

    return results

if __name__ == "__main__":
    scan_results = scan_stocks()
    print("Scan complete:", scan_results)