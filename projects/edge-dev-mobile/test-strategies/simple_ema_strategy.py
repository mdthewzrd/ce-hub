# Simple EMA Crossover Strategy
import pandas as pd
import numpy as np

def entry_signal(data):
    """
    Entry logic: Buy when fast EMA crosses above slow EMA
    """
    ema_fast = data['close'].ewm(span=9).mean()
    ema_slow = data['close'].ewm(span=20).mean()

    # Entry when fast EMA crosses above slow EMA
    if ema_fast.iloc[-1] > ema_slow.iloc[-1] and ema_fast.iloc[-2] <= ema_slow.iloc[-2]:
        return True
    return False

def exit_signal(data, entry_price):
    """
    Exit logic: Sell when fast EMA crosses below slow EMA or stop loss/take profit
    """
    current_price = data['close'].iloc[-1]

    # Stop loss at 2%
    if current_price <= entry_price * 0.98:
        return True, "stop_loss"

    # Take profit at 4%
    if current_price >= entry_price * 1.04:
        return True, "take_profit"

    # Exit when fast EMA crosses below slow EMA
    ema_fast = data['close'].ewm(span=9).mean()
    ema_slow = data['close'].ewm(span=20).mean()

    if ema_fast.iloc[-1] < ema_slow.iloc[-1] and ema_fast.iloc[-2] >= ema_slow.iloc[-2]:
        return True, "ema_cross"

    return False, None

# Risk management parameters
stop_loss = 2.0  # 2% stop loss
take_profit = 4.0  # 4% take profit
position_size = 1000  # $1000 per position