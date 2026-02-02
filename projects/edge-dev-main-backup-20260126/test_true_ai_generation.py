#!/usr/bin/env python3
"""
NOVEL MOMENTUM SCANNER - Different from Backside B and A+ templates
This tests if the AI can generate truly new code, not just copy templates
"""

# Different parameter structure (not P = {} or self.a_plus_params = {})
SCANNER_CONFIG = {
    "momentum_threshold": 0.05,
    "volume_multiplier": 1.5,
    "rsi_oversold": 30,
    "rsi_overbought": 70,
    "min_price": 5.0,
    "max_price": 500.0,
    "lookback_period": 20,
    "min_trading_days": 250,
    "sector_filter": ["Technology", "Healthcare", "Finance"],
    "market_cap_min": 1000000000,
    "exclude_penny_stocks": True,
    "require_positive_earnings": True,
    "debt_to_equity_max": 0.5,
    "roe_min": 0.15
}

def calculate_momentum_metrics(symbol, data):
    """Calculate custom momentum indicators"""
    returns = data['close'].pct_change()
    momentum_5d = returns.rolling(5).sum()
    momentum_20d = returns.rolling(20).sum()
    rsi = calculate_rsi(data['close'])

    return {
        'momentum_5d': momentum_5d.iloc[-1],
        'momentum_20d': momentum_20d.iloc[-1],
        'rsi': rsi.iloc[-1],
        'volume_ratio': data['volume'].iloc[-1] / data['volume'].rolling(20).mean().iloc[-1]
    }

def calculate_rsi(prices, period=14):
    """Calculate RSI indicator"""
    delta = prices.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss
    return 100 - (100 / (1 + rs))

def scan_momentum_stocks(symbols, market_data):
    """Main scanning logic for momentum strategy"""
    qualified_stocks = []

    for symbol in symbols:
        if symbol not in market_data:
            continue

        data = market_data[symbol]
        metrics = calculate_momentum_metrics(symbol, data)

        # Apply custom filtering logic (different from Backside B)
        if (metrics['momentum_20d'] > SCANNER_CONFIG["momentum_threshold"] and
            metrics['volume_ratio'] > SCANNER_CONFIG["volume_multiplier"] and
            SCANNER_CONFIG["rsi_oversold"] < metrics['rsi'] < SCANNER_CONFIG["rsi_overbought"]):

            qualified_stocks.append({
                'symbol': symbol,
                'momentum_score': metrics['momentum_20d'],
                'rsi': metrics['rsi'],
                'volume_ratio': metrics['volume_ratio']
            })

    return qualified_stocks

def main():
    """Main execution function"""
    print("Starting Novel Momentum Scanner...")
    print(f"Configuration: {len(SCANNER_CONFIG)} parameters")

    # This is a different structure than Backside B or A+
    for param_name, param_value in SCANNER_CONFIG.items():
        print(f"{param_name}: {param_value}")

    # Simulate scanning process
    test_symbols = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"]
    mock_data = {}  # Would contain real market data

    signals = scan_momentum_stocks(test_symbols, mock_data)
    print(f"Found {len(signals)} momentum signals")

    return signals

if __name__ == "__main__":
    main()