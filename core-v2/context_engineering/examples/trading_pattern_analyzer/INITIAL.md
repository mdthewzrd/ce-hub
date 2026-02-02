# Agent Context: Trading Pattern Analyzer

**Created**: 2026-01-05
**Version**: 1.0
**Status**: Ready for Implementation

---

## 1. Agent Identity & Purpose

### Agent Name
Trading Pattern Analyzer

### One-Sentence Mission
Analyzes stock market patterns in real-time and generates actionable trading signals with risk assessments.

### Success Criteria
- [ ] Detects trading patterns with >80% accuracy (backtested)
- [ ] Provides risk assessment for each signal
- [ ] Generates alerts within 2 seconds of pattern detection
- [ ] Handles 100+ concurrent symbol analysis
- [ ] Produces valid JSON output 100% of time
- [ ] Maintains <5% false positive rate

---

## 2. Core Capabilities

### What This Agent Does
1. Detects price gaps in market data
2. Analyzes volume surges and patterns
3. Calculates technical indicators (RSI, MACD, EMA)
4. Identifies trend direction and strength
5. Assesses risk levels for potential trades
6. Generates buy/sell/hold signals
7. Creates real-time alerts for pattern confirmations

### Tools Required (7 tools)

#### Tool 1: detect_gap
```python
def detect_gap(symbol: str, timeframe: str = "1D", threshold: float = 0.02) -> GapPattern:
    """Detects price gaps in market data.

    Args:
        symbol: Stock ticker symbol (e.g., "AAPL")
        timeframe: Timeframe for analysis (1m, 5m, 1H, 1D)
        threshold: Minimum gap size to consider (default: 2%)

    Returns:
        GapPattern object with gap details (open, close, size, type)
    """
```

#### Tool 2: analyze_volume
```python
def analyze_volume(symbol: str, periods: int = 20) -> VolumeAnalysis:
    """Analyzes volume patterns and surges.

    Args:
        symbol: Stock ticker symbol
        periods: Number of periods to average (default: 20)

    Returns:
        VolumeAnalysis with average, current, and ratio
    """
```

#### Tool 3: calculate_rsi
```python
def calculate_rsi(symbol: str, periods: int = 14) -> float:
    """Calculates Relative Strength Index.

    Args:
        symbol: Stock ticker symbol
        periods: RSI calculation period (default: 14)

    Returns:
        RSI value (0-100)
    """
```

#### Tool 4: check_trend
```python
def check_trend(symbol: str, timeframe: str = "1D") -> TrendInfo:
    """Identifies trend direction and strength.

    Args:
        symbol: Stock ticker symbol
        timeframe: Analysis timeframe

    Returns:
        TrendInfo with direction (bullish/bearish/neutral) and strength (0-100)
    """
```

#### Tool 5: assess_risk
```python
def assess_risk(symbol: str, entry_price: float, stop_loss: float) -> RiskAssessment:
    """Assesses risk level for potential trade.

    Args:
        symbol: Stock ticker symbol
        entry_price: Proposed entry price
        stop_loss: Proposed stop loss price

    Returns:
        RiskAssessment with risk score (0-100) and position size recommendation
    """
```

#### Tool 6: generate_signal
```python
def generate_signal(patterns: List[Pattern], indicators: Dict) -> TradingSignal:
    """Generates trading signal from patterns and indicators.

    Args:
        patterns: List of detected patterns
        indicators: Dictionary of technical indicators

    Returns:
        TradingSignal (BUY/SELL/HOLD) with confidence score
    """
```

#### Tool 7: create_alert
```python
def create_alert(signal: TradingSignal, recipients: List[str]) -> Alert:
    """Creates and sends alert for trading signal.

    Args:
        signal: Trading signal to alert
        recipients: List of recipient contacts

    Returns:
        Alert confirmation with delivery status
    """
```

### Data Access
- **Market Data**: Polygon.io API (OHLCV data, real-time quotes)
- **Historical Data**: SQLite database (last 5 years of daily data)
- **Real-time Quotes**: WebSocket stream (live price updates)
- **Reference Data**: CSV files (stock listings, sector classifications)

---

## 3. System Prompt Template

### Role
```
You are a Trading Pattern Analysis Specialist, an expert in technical analysis
and market pattern recognition with 15 years of experience in quantitative trading.

You identify high-probability trading opportunities by analyzing price action,
volume patterns, and technical indicators. Your analysis is data-driven, evidence-based,
and always includes proper risk management.
```

### Core Responsibilities
1. Analyze market patterns using technical indicators (RSI, MACD, EMA, gaps, volume)
2. Identify trading opportunities with clear entry/exit points and stop losses
3. Assess risk levels for each potential trade using position sizing and volatility
4. Provide evidence-based recommendations with specific data citations
5. Generate actionable alerts in real-time as patterns develop

### Operational Guidelines
- **Always provide data citations** for pattern detections (specific prices, dates, indicators)
- **Include risk assessment** with every signal (stop loss, position size, risk/reward ratio)
- **Use confidence scores** (0-100) for all predictions based on pattern strength
- **Prioritize quality over quantity** - Only report high-confidence setups (>70%)
- **Explain reasoning** behind each recommendation with specific technical justifications
- **Consider market context** - Overall trend, sector performance, market conditions
- **Never guarantee returns** - Always use probabilistic language

### Constraints
- **NEVER provide financial advice** without appropriate risk disclaimers
- **DON'T predict with 100% certainty** - Always use confidence ranges
- **AVOID analyzing more than 20 symbols simultaneously** - Quality degrades with volume
- **DON'T recommend positions >10% of portfolio** - Proper diversification required
- **NEVER ignore risk management** - Stop losses and position sizing are mandatory
- **DON'T trade against the trend** unless there's a compelling reversal signal
- **AVOID illiquid stocks** - Average daily volume must be >1M shares

### Output Format Requirements
```json
{
  "signal": "BUY|SELL|HOLD",
  "symbol": "AAPL",
  "timestamp": "2026-01-05T14:30:00Z",
  "confidence": 0.85,
  "entry_price": 175.50,
  "stop_loss": 172.00,
  "target_price": 185.00,
  "risk_reward_ratio": 2.5,
  "position_size_percent": 5,
  "reasoning": "Price broke above resistance at $175 on 2.1x normal volume with RSI at 62",
  "indicators": {
    "rsi": 62,
    "macd": "bullish_crossover",
    "ema_trend": "bullish",
    "volume_ratio": 2.3
  },
  "patterns": [
    {
      "type": "gap_up",
      "strength": "strong",
      "confirmation": true
    }
  ],
  "risk_assessment": {
    "risk_score": 35,
    "volatility": "moderate",
    "recommended_position": "5% of portfolio"
  },
  "disclaimer": "This is not financial advice. Past performance does not guarantee future results."
}
```

---

## 4. Tool Definitions

### Tool 1: detect_gap

**Purpose**: Identifies price gaps in market data where opening price is significantly different from previous close.

**Parameters**:
```python
symbol: str      # Stock ticker symbol (e.g., "AAPL")
timeframe: str   # Timeframe: 1m, 5m, 15m, 1H, 4H, 1D
threshold: float # Minimum gap size (default: 0.02 = 2%)
```

**Return Type**:
```python
class GapPattern(BaseModel):
    symbol: str
    timeframe: str
    previous_close: float
    open_price: float
    gap_size: float        # Percentage difference
    gap_type: str          # "gap_up" or "gap_down"
    volume_ratio: float    # Volume compared to average
    fill_probability: float # Likelihood gap will fill (0-1)
```

**Example Usage**:
```python
gap = detect_gap("AAPL", timeframe="1D", threshold=0.02)
print(gap)
# GapPattern(symbol="AAPL", timeframe="1D", previous_close=170.00,
#           open_price=175.00, gap_size=0.029, gap_type="gap_up",
#           volume_ratio=2.1, fill_probability=0.3)
```

**Error Handling**:
- Invalid symbol → `ValueError("Symbol INVALID not found")`
- No data available → `None`
- No gap detected → `GapPattern(gap_size=0)`

**Business Logic**:
1. Fetch OHLCV data for symbol
2. Calculate gap size: `(open - prev_close) / prev_close`
3. Classify as gap_up (>0) or gap_down (<0)
4. Check if gap_size exceeds threshold
5. Calculate volume ratio vs 20-day average
6. Estimate fill probability based on historical gap fills

### Tool 2: analyze_volume

**Purpose**: Analyzes trading volume patterns to identify accumulation, distribution, or breakout activity.

**Parameters**:
```python
symbol: str   # Stock ticker symbol
periods: int  # Number of periods to average (default: 20)
```

**Return Type**:
```python
class VolumeAnalysis(BaseModel):
    symbol: str
    current_volume: int
    avg_volume: float
    volume_ratio: float      # Current / Average
    trend: str               # "accumulating", "distributing", "neutral"
    surge_detected: bool
    surge_magnitude: float   # Strength of surge (0-1)
```

**Example Usage**:
```python
volume = analyze_volume("AAPL", periods=20)
print(volume)
# VolumeAnalysis(symbol="AAPL", current_volume=3_200_000,
#               avg_volume=1_500_000, volume_ratio=2.13,
#               trend="accumulating", surge_detected=True,
#               surge_magnitude=0.8)
```

**Business Logic**:
1. Fetch volume data for last N periods
2. Calculate average volume
3. Determine volume ratio
4. Detect if volume > 2x average (surge)
5. Classify trend based on volume pattern:
   - Accumulating: Volume increasing on price rises
   - Distributing: Volume increasing on price declines
   - Neutral: No clear pattern

### Tool 3: calculate_rsi

**Purpose**: Calculates Relative Strength Index (RSI) to identify overbought/oversold conditions.

**Parameters**:
```python
symbol: str   # Stock ticker symbol
periods: int  # RSI calculation period (default: 14, typically 14 or 21)
```

**Return Type**:
```python
float  # RSI value between 0 and 100
```

**Example Usage**:
```python
rsi = calculate_rsi("AAPL", periods=14)
print(f"RSI: {rsi}")  # RSI: 65.4
```

**Interpretation**:
- RSI > 70: Overbought (potential sell signal)
- RSI < 30: Oversold (potential buy signal)
- RSI 50: Neutral midpoint
- RSI 40-60: No clear trend

**Business Logic**:
1. Fetch price data for last (periods + 100) bars
2. Calculate average gain and loss over N periods
3. Compute RS = average_gain / average_loss
4. Calculate RSI = 100 - (100 / (1 + RS))

### Tool 4: check_trend

**Purpose**: Identifies trend direction and strength using moving averages and price action.

**Parameters**:
```python
symbol: str     # Stock ticker symbol
timeframe: str  # Analysis timeframe (default: "1D")
```

**Return Type**:
```python
class TrendInfo(BaseModel):
    symbol: str
    direction: str        # "bullish", "bearish", "neutral"
    strength: float       # Trend strength 0-100
    short_ema: float      # Short-term EMA (9-period)
    long_ema: float       # Long-term EMA (21-period)
    price_vs_ema: str     # "above" or "below"
    adx: float           # Average Directional Index
```

**Example Usage**:
```python
trend = check_trend("AAPL", timeframe="1D")
print(trend)
# TrendInfo(symbol="AAPL", direction="bullish", strength=72,
#           short_ema=174.50, long_ema=171.20, price_vs_ema="above",
#           adx=35.4)
```

**Interpretation**:
- Direction: Short EMA > Long EMA = bullish
- Strength: Higher ADX = stronger trend (ADX > 25 = trending)
- Price position: Price vs EMAs shows momentum

### Tool 5: assess_risk

**Purpose**: Calculates risk score and recommends position size based on volatility and account size.

**Parameters**:
```python
symbol: str       # Stock ticker symbol
entry_price: float # Proposed entry price
stop_loss: float  # Proposed stop loss price
account_size: float = 100000  # Total account size (default)
```

**Return Type**:
```python
class RiskAssessment(BaseModel):
    symbol: str
    risk_score: float        # 0-100 (higher = riskier)
        position_size_percent: float  # % of account to risk
    max_shares: int          # Maximum shares to trade
    dollar_risk: float       # Potential loss in dollars
    volatility: str          # "low", "moderate", "high"
    risk_reward_ratio: float # Expected gain vs loss
```

**Example Usage**:
```python
risk = assess_risk("AAPL", entry_price=175.50, stop_loss=172.00)
print(risk)
# RiskAssessment(symbol="AAPL", risk_score=35, position_size_percent=5,
#               max_shares=28, dollar_risk=350.00, volatility="moderate",
#               risk_reward_ratio=2.5)
```

**Business Logic**:
1. Calculate dollar risk per share: entry_price - stop_loss
2. Determine ATR (Average True Range) for volatility
3. Calculate risk score based on:
   - Volatility (higher volatility = higher risk)
   - Gap size (larger gaps = higher risk)
   - Volume pattern (erratic volume = higher risk)
4. Position size = 1-2% of account / dollar_risk
5. Ensure position_size_percent <= 10% (diversification rule)

### Tool 6: generate_signal

**Purpose**: Synthesizes all patterns and indicators into a final trading signal.

**Parameters**:
```python
patterns: List[Pattern]   # List of detected patterns
indicators: Dict[str, Any] # Dictionary of all technical indicators
symbol: str               # Stock ticker symbol
```

**Return Type**:
```python
class TradingSignal(BaseModel):
    signal: str            # "BUY", "SELL", "HOLD"
    symbol: str
    confidence: float      # 0-1
    entry_price: float
    stop_loss: float
    target_price: float
    risk_reward_ratio: float
    reasoning: str         # Explanation of signal
    timestamp: str
```

**Example Usage**:
```python
signal = generate_signal(
    patterns=[gap_pattern, volume_surge],
    indicators={"rsi": 62, "macd": "bullish", "trend": "bullish"},
    symbol="AAPL"
)
print(signal)
# TradingSignal(signal="BUY", symbol="AAPL", confidence=0.85,
#              entry_price=175.50, stop_loss=172.00, target_price=185.00,
#              risk_reward_ratio=2.5,
#              reasoning="Bullish gap up on high volume with RSI confirmation")
```

**Decision Logic**:
1. **BUY Signal** (confidence >0.7):
   - Gap up + volume surge + bullish trend + RSI 40-70
   - Breakout above resistance with volume confirmation
   - Bullish MACD crossover + trend support

2. **SELL Signal** (confidence >0.7):
   - Gap down + volume surge + bearish trend + RSI 30-60
   - Breakdown below support with volume confirmation
   - Bearish MACD crossover + trend resistance

3. **HOLD Signal**:
   - Conflicting signals (mixed bullish/bearish)
   - Low confidence (<0.7) on any signal
   - No clear patterns detected

### Tool 7: create_alert

**Purpose**: Creates and sends alert notification for trading signal.

**Parameters**:
```python
signal: TradingSignal           # Trading signal to alert
recipients: List[str]           # List of email addresses or phone numbers
channels: List[str] = ["email"] # Alert channels: email, sms, webhook
```

**Return Type**:
```python
class Alert(BaseModel):
    alert_id: str
    signal: TradingSignal
    recipients: List[str]
    status: str           # "pending", "sent", "failed"
    delivery_time: str
    error_message: str = None
```

**Example Usage**:
```python
alert = create_alert(
    signal=buy_signal,
    recipients=["trader@example.com"],
    channels=["email", "sms"]
)
print(alert)
# Alert(alert_id="alert_123", signal=buy_signal,
#       recipients=["trader@example.com"], status="sent",
#       delivery_time="2026-01-05T14:30:15Z")
```

---

## 5. Integration Points

### External APIs

**Polygon.io** (Market Data)
- Purpose: Real-time and historical OHLCV data
- Endpoint: `https://api.polygon.io/v2/aggs/ticker/{symbol}/range/{timespan}/{from}/{to}`
- Auth: API key in query string
- Rate Limit: 5 requests/minute (free tier)
- Required: `POLYGON_API_KEY` environment variable

**WebSocket** (Real-time Quotes)
- Purpose: Live price updates
- Endpoint: `wss://stream.polygon.io/stocks`
- Auth: API key in connection params
- Messages: Trade aggregates, quotes, bars

### Databases

**SQLite** (Historical Data)
- Path: `/data/market/historical_{symbol}.db`
- Table: `ohlcuv` (date, open, high, low, close, volume)
- Access: Read-only for agent
- Updated by: ETL job (runs daily at 6 PM ET)

**Redis** (Caching)
- Purpose: Cache recent analysis results
- Key Pattern: `analysis:{symbol}:{timeframe}`
- TTL: 300 seconds (5 minutes)
- Access: Read/write

**PostgreSQL** (Trade Log)
- Purpose: Log all generated signals and outcomes
- Table: `signals` (id, symbol, signal, confidence, outcome)
- Access: Write-only
- Updated by: Agent on signal generation

### Other Agents

**RiskManagerAgent**
- Purpose: Validates signals before sending
- Protocol: gRPC (port 50051)
- Input: TradingSignal
- Output: ValidatedSignal (approved/rejected)

**AlertManagerAgent**
- Purpose: Distributes notifications to users
- Protocol: HTTP POST (port 8001)
- Input: Alert
- Output: Confirmation

**PortfolioManagerAgent**
- Purpose: Tracks positions and performance
- Protocol: WebSocket (ws://localhost:8002)
- Input: Trade execution
- Output: Position update

### File System

**Data Files**:
- `/data/stocks/{symbol}.csv` - Daily OHLCV data (last 5 years)
- `/config/indicators.json` - Indicator parameters (RSI periods, EMA lengths, etc.)
- `/logs/signals/{date}.log` - Signal generation logs

**Config Files**:
- `/config/thresholds.json` - Detection thresholds (gap_size, volume_ratio, etc.)
- `/config/symbols_watchlist.txt` - Symbols to monitor

---

## 6. Validation Criteria

### Functional Tests

**Test 1: Gap Detection**
```python
gap = detect_gap("AAPL", timeframe="1D", threshold=0.02)
assert gap.gap_size > 0.02  # Gap detected correctly
assert gap.gap_type == "gap_up" or "gap_down"
assert 0 <= gap.fill_probability <= 1
```

**Test 2: Volume Analysis**
```python
volume = analyze_volume("AAPL", periods=20)
assert volume.volume_ratio > 0
assert volume.surge_detected in [True, False]
assert volume.trend in ["accumulating", "distributing", "neutral"]
```

**Test 3: RSI Calculation**
```python
rsi = calculate_rsi("AAPL", periods=14)
assert 0 <= rsi <= 100  # Valid RSI range
```

**Test 4: Trend Detection**
```python
trend = check_trend("AAPL", timeframe="1D")
assert trend.direction in ["bullish", "bearish", "neutral"]
assert 0 <= trend.strength <= 100
assert trend.adx >= 0
```

**Test 5: Risk Assessment**
```python
risk = assess_risk("AAPL", 175.50, 172.00)
assert 0 <= risk.risk_score <= 100
assert 0 < risk.position_size_percent <= 10  # Max 10% position
assert risk.dollar_risk > 0
assert risk.risk_reward_ratio > 0
```

**Test 6: Signal Generation**
```python
signal = generate_signal(patterns, indicators, "AAPL")
assert signal.signal in ["BUY", "SELL", "HOLD"]
assert 0 <= signal.confidence <= 1
assert signal.entry_price > 0
assert signal.stop_loss > 0
assert signal.target_price > 0
assert signal.risk_reward_ratio > 0
```

**Test 7: Alert Creation**
```python
alert = create_alert(signal, ["test@example.com"])
assert alert.alert_id is not None
assert alert.status in ["pending", "sent", "failed"]
assert alert.delivery_time is not None
```

### Integration Tests

**Test 8: Polygon.io API Connection**
```python
data = fetch_polygon_data("AAPL", "2024-01-01", "2024-01-31")
assert data is not None
assert len(data) > 0  # Data retrieved successfully
```

**Test 9: Database Query**
```python
result = query_historical_data("AAPL", "2024-01-01")
assert result is not None
```

**Test 10: WebSocket Connection**
```python
ws = connect_websocket()
assert ws.connected == True
```

### Output Validation

**Test 11: JSON Schema Validation**
```python
output = agent.analyze("AAPL")
validate_output(output, TradingSignal.schema())  # Must match schema
assert output["signal"] in ["BUY", "SELL", "HOLD"]
assert 0 <= output["confidence"] <= 1
```

**Test 12: Required Fields Present**
```python
output = agent.analyze("AAPL")
required_fields = ["signal", "symbol", "confidence", "entry_price",
                   "stop_loss", "target_price", "reasoning"]
for field in required_fields:
    assert field in output
```

### Performance Tests

**Test 13: Response Time**
```python
start = time.time()
result = agent.analyze("AAPL")
elapsed = time.time() - start
assert elapsed < 2.0  # Must complete in <2 seconds
```

**Test 14: Concurrent Load**
```python
symbols = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"]
results = asyncio.gather(*[agent.analyze(s) for s in symbols])
assert len(results) == 5  # All completed
```

**Test 15: Memory Usage**
```python
initial_memory = get_memory_usage()
agent.analyze("AAPL")
final_memory = get_memory_usage()
assert (final_memory - initial_memory) < 100_000_000  # <100MB increase
```

### Error Handling Tests

**Test 16: Invalid Symbol**
```python
try:
    agent.analyze("INVALID_TICKER")
    assert False, "Should have raised ValueError"
except ValueError as e:
    assert "not found" in str(e)
```

**Test 17: API Rate Limit**
```python
# Make 10 rapid requests
for i in range(10):
    agent.analyze("AAPL")
# Should handle rate limiting gracefully (wait or queue)
```

**Test 18: Network Failure Recovery**
```python
# Simulate network failure
with mock_network_failure():
    result = agent.analyze("AAPL")
    assert result["error"] is not None
    assert "network" in result["error"].lower()
```

---

## 7. Development Notes

### Dependencies
```txt
# Core
pandas>=2.2.0
numpy>=1.26.0
pydantic>=2.5.0

# Data & APIs
requests>=2.31.0
websocket-client>=1.6.0
python-dotenv>=1.0.0

# Database
sqlalchemy>=2.0.0
redis>=5.0.0
psycopg2-binary>=2.9.0

# Analysis
ta-lib>=0.4.0  # Technical analysis library
scipy>=1.11.0

# Testing
pytest>=7.4.0
pytest-asyncio>=0.21.0
```

### Environment Variables
```bash
# API Keys
POLYGON_API_KEY=sk_...
ALPHA_VANTAGE_KEY=...

# Database
DATABASE_URL=sqlite:///data/market.db
REDIS_URL=redis://localhost:6379
POSTGRES_URL=postgresql://user:pass@localhost/trading

# Configuration
LOG_LEVEL=INFO
MAX_CONCURRENT_ANALYSIS=100
DEFAULT_TIMEFRAME=1D
CACHE_TTL=300

# Agent Settings
MODEL_NAME=claude-3-5-sonnet-20241022
MAX_TOOLS=10
ENABLE_RAG=true
```

### Known Limitations
- **US Equities Only**: Does not support international markets or forex
- **Daily Data Only**: Backtesting uses daily OHLCV (no intraday granularity)
- **5-Minute Delay**: Real-time data may have delay on free API tier
- **No Options**: Does not analyze options patterns or chains
- **No Crypto**: Does not support cryptocurrency analysis
- **Max 100 Symbols**: Performance degrades above 100 concurrent symbols
- **Market Hours Only**: Real-time analysis only during US market hours (9:30 AM - 4:00 PM ET)

### Future Enhancements
1. **Multi-Timeframe Analysis**: Combine signals from multiple timeframes
2. **Machine Learning**: Add ML predictions for pattern success probability
3. **Options Integration**: Analyze options flow and gamma exposure
4. **Crypto Support**: Add cryptocurrency pattern detection
5. **Backtesting Interface**: Allow users to backtest strategies
6. **Multi-Asset**: Support for ETFs, futures, and forex
7. **Sentiment Analysis**: Integrate news and social sentiment
8. **Portfolio Optimization**: Suggest optimal portfolio allocations

---

## 8. Example Conversations

### Example 1: Bullish Signal

**User**: "Analyze AAPL for trading patterns"

**Agent Response**:
```json
{
  "signal": "BUY",
  "symbol": "AAPL",
  "timestamp": "2026-01-05T14:30:00Z",
  "confidence": 0.85,
  "entry_price": 175.50,
  "stop_loss": 172.00,
  "target_price": 185.00,
  "risk_reward_ratio": 2.5,
  "position_size_percent": 5,
  "reasoning": "Bullish gap up of 2.9% on 2.1x normal volume with RSI confirmation (62). Price broke above resistance at $175 with strong volume surge.",
  "indicators": {
    "rsi": 62,
    "macd": "bullish_crossover",
    "ema_trend": "bullish",
    "volume_ratio": 2.3,
    "adx": 35.4
  },
  "patterns": [
    {
      "type": "gap_up",
      "strength": "strong",
      "size": 0.029,
      "confirmation": true
    },
    {
      "type": "volume_surge",
      "magnitude": 0.8
    }
  ],
  "risk_assessment": {
    "risk_score": 35,
    "volatility": "moderate",
    "max_shares": 28,
    "dollar_risk": 350.00
  },
  "disclaimer": "This is not financial advice. Past performance does not guarantee future results. Always do your own research and consider your risk tolerance."
}
```

### Example 2: Bearish Signal

**User**: "What about TSLA?"

**Agent Response**:
```json
{
  "signal": "SELL",
  "symbol": "TSLA",
  "timestamp": "2026-01-05T14:31:00Z",
  "confidence": 0.72,
  "entry_price": 245.00,
  "stop_loss": 248.00,
  "target_price": 235.00,
  "risk_reward_ratio": 2.0,
  "position_size_percent": 4,
  "reasoning": "Bearish gap down of 1.8% on 1.8x volume. RSI declining from overbought levels (72→68). Price broke below support at $245 with increasing volume.",
  "indicators": {
    "rsi": 68,
    "macd": "bearish_crossover",
    "ema_trend": "bearish",
    "volume_ratio": 1.8
  },
  "patterns": [
    {
      "type": "gap_down",
      "strength": "moderate",
      "size": 0.018
    }
  ],
  "risk_assessment": {
    "risk_score": 42,
    "volatility": "moderate"
  }
}
```

### Example 3: No Signal (HOLD)

**User**: "Analyze MSFT"

**Agent Response**:
```json
{
  "signal": "HOLD",
  "symbol": "MSFT",
  "timestamp": "2026-01-05T14:32:00Z",
  "confidence": 0.45,
  "reasoning": "No clear pattern detected. RSI neutral at 52, price consolidating near moving averages, volume normal (1.1x average). Waiting for clearer setup.",
  "indicators": {
    "rsi": 52,
    "macd": "neutral",
    "volume_ratio": 1.1
  },
  "recommendation": "Monitor for breakout above $380 or breakdown below $370"
}
```

### Example 4: Error Handling

**User**: "Analyze INVALID_TICKER"

**Agent Response**:
```json
{
  "error": "Invalid symbol",
  "message": "INVALID_TICKER is not a recognized stock symbol. Please verify the ticker symbol.",
  "suggestions": ["INTC", "VTIP", "INVX"],
  "help": "Check the symbol against Polygon.io's ticker list: https://api.polygon.io/v3/reference/tickers"
}
```

---

## 9. Quick Reference

### Command-Line Usage
```bash
# Run single analysis
python agent.py --symbol AAPL --timeframe 1D

# Analyze multiple symbols
python agent.py --symbols AAPL MSFT GOOGL --timeframe 1D

# Run with custom thresholds
python agent.py --symbol AAPL --gap-threshold 0.03 --volume-ratio 2.0

# Enable debug logging
python agent.py --symbol AAPL --log-level DEBUG

# Deploy as service
cehub deploy-agent --config trading_pattern_analyzer.json
```

### Python API Usage
```python
from agents import TradingPatternAnalyzer

# Initialize agent
agent = TradingPatternAnalyzer(
    model="claude-3-5-sonnet-20241022",
    enable_rag=True
)

# Single symbol analysis
result = agent.analyze("AAPL")
print(f"Signal: {result.signal}, Confidence: {result.confidence}")

# Batch analysis
symbols = ["AAPL", "MSFT", "GOOGL"]
results = agent.analyze_batch(symbols)
for symbol, result in results.items():
    print(f"{symbol}: {result.signal}")

# Real-time monitoring
agent.monitor_symbols(["AAPL", "TSLA"], callback=alert_handler)
```

### Testing
```bash
# Run all tests
pytest tests/test_agent.py

# Run specific test
pytest tests/test_agent.py::test_gap_detection

# Run with coverage
pytest --cov=agents tests/

# Run integration tests
pytest tests/integration/ -v
```

### Troubleshooting

**Problem**: Agent returns "NO_DATA"
**Solutions**:
1. Check API key is set: `echo $POLYGON_API_KEY`
2. Verify network connectivity: `ping api.polygon.io`
3. Confirm symbol is valid: Check Polygon.io ticker list
4. Check API rate limits: Free tier = 5 req/min
5. Review logs: `tail -f logs/agent.log`

**Problem**: Agent is slow (>2 seconds)
**Solutions**:
1. Reduce number of tools (should be <10)
2. Enable Redis caching
3. Use faster model: `claude-3-5-haiku` for initial analysis
4. Check network latency: `traceroute api.polygon.io`
5. Profile code: `python -m cProfile agent.py`

**Problem**: Low confidence signals (<0.7)
**Solutions**:
1. Adjust detection thresholds (gap_size, volume_ratio)
2. Require more pattern confirmations
3. Check market conditions (volatility, trend)
4. Review historical performance of signals
5. Consider different timeframes

**Problem**: Memory usage increasing over time
**Solutions**:
1. Check for memory leaks in tool implementations
2. Clear cache periodically: `redis.flushall()`
3. Reduce data retention in memory
4. Monitor with: `memory_profiler` package
5. Restart agent daily to clear memory

---

## 10. Performance Benchmarks

### Expected Performance

| Metric | Target | Actual |
|--------|--------|--------|
| Single analysis | <2 seconds | TBD |
| Batch (10 symbols) | <10 seconds | TBD |
| Memory usage | <500MB | TBD |
| Concurrent capacity | 100 symbols | TBD |
| API success rate | >99% | TBD |
| False positive rate | <5% | TBD |

### Optimization Opportunities

1. **Caching**: Cache RSI calculations (expensive)
2. **Parallelization**: Analyze symbols concurrently
3. **Batch API Calls**: Fetch multiple symbols in one request
4. **Model Selection**: Use Haiku for quick scans, Sonnet for detailed analysis
5. **Database Indexing**: Speed up historical data queries

---

**End of Context Document**

---

## Implementation Checklist

Before implementing this agent:

- [ ] Copy this template to agent directory
- [ ] Fill in ALL required sections
- [ ] Define all 7 tools with exact signatures
- [ ] Set up environment variables
- [ ] Create database schema
- [ ] Implement all functional tests
- [ ] Test with historical data
- [ ] Validate output schema
- [ ] Measure performance
- [ ] Document any deviations from this spec

**Expected Outcome**: Clear, unambiguous agent specification that can be implemented without trial and error.
