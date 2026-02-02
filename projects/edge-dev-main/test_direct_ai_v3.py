#!/usr/bin/env python3
"""
Direct test of OpenRouter AI with enhanced Stage 2/3 separation prompts
"""
import requests
import json

# Read the messy test file
with open('/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/backside_b_MESSY_TEST.py', 'r') as f:
    messy_code = f.read()

# Read the reference template
with open('/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-exact/templates/backside_b/fixed_formatted.py', 'r') as f:
    template_code = f.read()

# Build the enhanced prompt
prompt = f"""You are an expert Python code architect specializing in trading scanner transformation.

TRANSFORM THE FOLLOWING MESSY CODE INTO PRODUCTION-GRADE CODE
=============================================================

CRITICAL REQUIREMENTS - MUST FOLLOW EXACTLY:
==============================================

1. 3-STAGE ARCHITECTURE WITH STAGE 2/3 SEPARATION (MANDATORY):

   class ScannerName:
       def __init__(self):
           # Calculate historical data range
           lookback_buffer = self.params['abs_lookback_days'] + 50
           scan_start_dt = pd.to_datetime(self.d0_start) - pd.Timedelta(days=lookback_buffer)
           self.scan_start = scan_start_dt.strftime('%Y-%m-%d')
           self.scan_end = self.d0_end

           # Worker configuration
           self.stage1_workers = 5
           self.stage3_workers = 10

       def run_scan(self):
           # Stage 1: Fetch grouped data (all tickers for all dates)
           stage1_data = self.fetch_grouped_data()

           # Stage 2a: Compute SIMPLE features (prev_close, ADV20, price_range ONLY)
           stage2a_data = self.compute_simple_features(stage1_data)

           # Stage 2b: Apply smart filters (separate historical from D0, filter D0 only)
           stage2_data = self.apply_smart_filters(stage2a_data)

           # Stage 3a: Compute FULL features (EMA, ATR, slopes, etc.)
           stage3a_data = self.compute_full_features(stage2_data)

           # Stage 3b: Detect patterns
           stage3_results = self.detect_patterns(stage3a_data)

           return stage3_results

   ⚠️ CRITICAL: Stage 2 computes SIMPLE features only (3 metrics)
   ⚠️ CRITICAL: Stage 3 computes FULL features (all indicators)
   ⚠️ CRITICAL: Do NOT compute EMA/ATR/slopes in Stage 2!

2. HISTORICAL DATA RANGE CALCULATION:

   def __init__(self, d0_start, d0_end):
       self.d0_start = d0_start
       self.d0_end = d0_end

       # Calculate historical range
       lookback_buffer = self.params['abs_lookback_days'] + 50
       scan_start_dt = pd.to_datetime(self.d0_start) - pd.Timedelta(days=lookback_buffer)
       self.scan_start = scan_start_dt.strftime('%Y-%m-%d')

       # Fetch historical data
       self.trading_dates = nyse.schedule(start_date=self.scan_start, end_date=self.scan_end)

3. STAGE 2: SIMPLE FEATURES + SMART FILTERS:

   def compute_simple_features(self, df):
       # Compute ONLY: prev_close, ADV20_$, price_range
       df['prev_close'] = df.groupby('ticker')['close'].shift(1)
       df['ADV20_$'] = (df['close'] * df['volume']).groupby(df['ticker']).transform(
           lambda x: x.rolling(window=20, min_periods=20).mean()
       )
       df['price_range'] = df['high'] - df['low']
       return df

   def apply_smart_filters(self, df):
       # Separate historical from D0 output range
       df_historical = df[~df['date'].between(self.d0_start, self.d0_end)]
       df_output_range = df[df['date'].between(self.d0_start, self.d0_end)]

       # Apply smart filters ONLY to D0 dates
       df_output_filtered = df_output_range[
           (df_output_range['prev_close'] >= self.params['price_min']) &
           (df_output_range['ADV20_$'] >= self.params['adv20_min_usd']) &
           (df_output_range['price_range'] >= 0.50)
       ]

       # Get tickers with passing D0 dates
       tickers_with_valid_d0 = df_output_filtered['ticker'].unique()

       # Combine: all historical data + filtered D0 dates
       df_combined = pd.concat([df_historical, df_output_filtered[df_output_filtered['ticker'].isin(tickers_with_valid_d0)]])
       return df_combined

4. STAGE 3: FULL FEATURES + PATTERN DETECTION:

   def compute_full_features(self, df):
       # Compute ALL indicators: EMA, ATR, slopes, volume metrics, etc.
       df['ema_9'] = df.groupby('ticker')['close'].transform(lambda x: x.ewm(span=9).mean())
       df['atr'] = ... # True Range calculations
       # ... all other indicators
       return df

   def detect_patterns(self, df):
       # Apply pattern detection logic
       # Use parallel workers (self.stage3_workers)
       return signals

REFERENCE TEMPLATE STRUCTURE (Learn the PATTERN, don't copy):
{template_code[:3000]}...

USER CODE TO TRANSFORM:
=======================
{messy_code}

Transform the code following ALL requirements above. Output ONLY the Python code.
"""

# Call OpenRouter API
response = requests.post(
    'https://openrouter.ai/api/v1/chat/completions',
    headers={
        'Authorization': 'Bearer sk-or-v1-a4286218b868fb00daab8e84d5b0e00d7bf785b3dc3e0a5e6ae6cb9b7e4be5',
        'HTTP-Referer': 'http://localhost:5665',
        'X-Title': 'CE-Hub Renata AI',
    },
    json={
        'model': 'qwen/qwen-2.5-coder-32b-instruct',
        'messages': [
            {'role': 'user', 'content': prompt}
        ],
        'max_tokens': 8000,
        'temperature': 0.1,
    },
    timeout=180
)

print(f"Status Code: {response.status_code}")

if response.status_code == 200:
    result = response.json()
    formatted_code = result['choices'][0]['message']['content']

    # Save to file
    with open('/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/backside_b_AI_DIRECT_V3.py', 'w') as f:
        f.write(formatted_code)

    print(f"✅ Direct AI formatting complete!")
    print(f"Input: {len(messy_code)} chars")
    print(f"Output: {len(formatted_code)} chars")
    print(f"Saved to: backside_b_AI_DIRECT_V3.py")
else:
    print(f"❌ Error: {response.text}")
