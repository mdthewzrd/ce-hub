"""
Test script to verify scanner type detection fix
This simulates the detection patterns from the small cap gap scanner
"""

# Sample code snippets from different scanner types for testing
GAP_SCANNER_CODE = """
import pandas as pd
from datetime import time
import pandas_market_calendars as mcal

# Load data
df = pd.read_feather("data_2019_current_temp.feather")

# Calculate triggers
df['trig_day'] = ((df['pm_high'] / df['prev_close'] - 1 >= .5) &
                  (df['gap'] >= 0.5) &
                  (df['open'] / df['prev_high'] - 1 >= .3) &
                  (df['pm_vol'] >= 5000000) &
                  (df['prev_close'] >= 0.75)).astype(int)

# D2 filter
df['d2'] = ((df['prev_close'] / df['prev_close_1'] - 1 >= .3) &
            (df['prev_volume'] >= 10000000)).astype(int)

# EMA validation
for i, row in df_trig_day.iterrows():
    c = daily_data_a['c'].iloc[-1]
    ema200 = daily_data_a['ema200'].iloc[-1]

    # EMA200 filter - UNIQUE TO GAP SCANNER
    if c <= ema200 * 0.8 and len(daily_data_a) >= 200:
        df_trig_day.loc[i, 'ema_valid'] = 1

# D2 exclusion - Gap scanners avoid D2 days
df_trig_day = df_trig_day[(df_trig_day['d2'] == 0)]

# Output
df_trig_day.to_csv("D1 Gap.csv")
"""

BACKSIDE_B_CODE = """
# Backside B Para Scanner
def scan():
    # Check for para decline
    para_decline = df['para_b_decline'].sum()

    # Bag day tracking
    if row['bag_day'] == 1:
        bag_day_max_high = row['high']

    # ADV20 parameters
    adv20_min_usd = 30000000
    pos_abs_max = abs(row['close'] - row['open']) / row['close']

    if pos_abs_max > 0.75:
        return True

    return False
"""

A_PLUS_CODE = """
# A+ Para Scanner
def scan():
    # A+ parameters
    ADV20_min_price = 5.0
    ADV20_min_volume = 1000000
    ADV20_slope_min = -0.5

    # Para pattern (without decline)
    if row['para_signal'] and not row['declining']:
        return True

    return False
"""

LC_D2_CODE = """
# LC D2 Scanner
def scan():
    # LC parameters
    lc_min_price = 10.0
    lc_d2_threshold = 0.3

    # D2 pattern (looks for D2, unlike Gap Scanner)
    if row['d2'] >= 0.3:
        return True

    if row['lc_frontside_d2']:
        return True

    return False
"""

# Pattern detection function (simulates the TypeScript logic)
def detect_scanner_type(code):
    code_lower = code.lower()

    scores = {
        'gap_scanner': 0,
        'backside_b': 0,
        'a_plus': 0,
        'lc_d2': 0
    }

    # Gap Scanner patterns
    if 'ema200' in code_lower or 'ema * 0.8' in code_lower:
        scores['gap_scanner'] += 50
    if 'd2 == 0' in code_lower or 'd2==0' in code_lower:
        scores['gap_scanner'] += 20
    if 'close <= ema200' in code_lower or 'c<=ema200' in code_lower:
        scores['gap_scanner'] += 30
    if '.csv' in code_lower and 'gap' in code_lower:
        scores['gap_scanner'] += 25

    # Backside B patterns
    if 'para' in code_lower and 'decline' in code_lower:
        scores['backside_b'] += 40
    if 'bag_day' in code_lower:
        scores['backside_b'] += 30
    if 'adv20_min_usd' in code_lower and 'abs_' in code_lower:
        scores['backside_b'] += 50

    # A+ patterns
    if 'adv20_' in code_lower and 'adv20_min_usd' not in code_lower:
        scores['a_plus'] += 50
    if 'a_plus' in code_lower or 'a-plus' in code_lower:
        scores['a_plus'] += 30

    # LC D2 patterns
    if 'lc_' in code_lower:
        scores['lc_d2'] += 40
    if 'd2 >= 0.3' in code_lower or 'd2>=0.3' in code_lower:
        scores['lc_d2'] += 30

    # Find max score
    max_score = max(scores.values())
    detected_type = max(scores, key=scores.get)

    return detected_type, scores

# Run tests
print("=" * 60)
print("SCANNER TYPE DETECTION TEST")
print("=" * 60)

test_cases = [
    ("Gap Scanner", GAP_SCANNER_CODE),
    ("Backside B", BACKSIDE_B_CODE),
    ("A+ Para", A_PLUS_CODE),
    ("LC D2", LC_D2_CODE)
]

all_passed = True

for name, code in test_cases:
    detected, scores = detect_scanner_type(code)
    expected = name.lower().replace(' ', '_').replace('+', '_plus')

    passed = detected == expected
    status = "✅ PASS" if passed else "❌ FAIL"

    print(f"\n{status} - {name}")
    print(f"  Expected: {expected}")
    print(f"  Detected: {detected}")
    print(f"  Scores: {scores}")

    if not passed:
        all_passed = False

print("\n" + "=" * 60)
if all_passed:
    print("✅ ALL TESTS PASSED")
else:
    print("❌ SOME TESTS FAILED")
print("=" * 60)
