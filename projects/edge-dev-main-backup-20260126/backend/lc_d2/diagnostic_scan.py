"""
Diagnostic script to show pre-validation and post-validation signals
This helps us understand if we're missing signals due to validation or pattern detection
"""

import pandas as pd
from fixed_formatted import GroupedEndpointLCD2Scanner

# Run the scan and save both pre and post-validation results
print("Running diagnostic scan...")

scanner = GroupedEndpointLCD2Scanner(d0_start='2025-01-01', d0_end='2025-12-31')

# Get trading dates
trading_dates = scanner.get_trading_dates(scanner.scan_start, scanner.scan_end)
print(f"Trading days: {len(trading_dates)}")

# Stage 1: Fetch grouped data
df = scanner.fetch_all_grouped_data(trading_dates)

if df.empty:
    print("No data available!")
    exit(1)

# Compute features
df = scanner.compute_simple_features(df)
df = scanner.compute_full_features(df)

# Get signals BEFORE validation (all pattern detections)
signals_pre_validation = scanner.detect_patterns(df)

print(f"\n{'='*70}")
print(f"PRE-VALIDATION SIGNALS: {len(signals_pre_validation)}")
print(f"{'='*70}")

if not signals_pre_validation.empty:
    # Sort by date
    signals_pre_validation = signals_pre_validation.sort_values('Date')
    print(signals_pre_validation.to_string(index=False))

    # Save to CSV
    signals_pre_validation.to_csv('lc_d2_pre_validation.csv', index=False)
    print(f"\nSaved to: lc_d2_pre_validation.csv")
else:
    print("No signals found in pattern detection!")

# Now apply validation
if not signals_pre_validation.empty:
    validated_signals = scanner.fetch_intraday_for_signals(df, signals_pre_validation)

    if not validated_signals.empty:
        output = scanner.apply_validation_filters(df, validated_signals)

        print(f"\n{'='*70}")
        print(f"POST-VALIDATION SIGNALS: {len(output)}")
        print(f"{'='*70}")

        if not output.empty:
            output = output.sort_values('Date')
            print(output.to_string(index=False))

            # Save to CSV
            output.to_csv('lc_d2_post_validation.csv', index=False)
            print(f"\nSaved to: lc_d2_post_validation.csv")

        # Calculate filter rate
        filter_rate = (1 - len(output) / len(signals_pre_validation)) * 100
        print(f"\n{'='*70}")
        print(f"VALIDATION FILTER RATE: {filter_rate:.1f}%")
        print(f"Signals filtered out: {len(signals_pre_validation) - len(output)}")
        print(f"{'='*70}")
