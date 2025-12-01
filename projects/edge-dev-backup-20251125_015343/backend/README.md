# LC Scanner FastAPI Backend

High-performance FastAPI backend that wraps the existing Python LC scanner while preserving all threading optimizations. This backend provides real-time scan execution with WebSocket progress updates and comprehensive API endpoints.

## Features

### Core Capabilities
- **Preserved Threading**: Maintains ALL original threading optimizations (`ProcessPoolExecutor`, `ThreadPoolExecutor`, `aiohttp` async patterns)
- **Dynamic Date Range**: API-driven date range selection (replaces hardcoded dates)
- **Real-time Progress**: WebSocket and SSE support for live scan updates
- **Full Ticker Universe**: Supports complete ticker universe scanning (not limited to 84 tickers)
- **High Performance**: Same execution speed as original Python file with added real-time capabilities

### API Features
- **RESTful Endpoints**: Standard REST API for scan management
- **WebSocket Support**: Real-time progress updates
- **Scan Management**: Track multiple concurrent scans
- **Results Storage**: Persistent storage with JSON and CSV export
- **Error Handling**: Comprehensive error handling and recovery
- **Logging**: Structured logging with performance monitoring

## Quick Start

### Prerequisites
- Python 3.8+
- Polygon API key
- 8GB+ RAM (for threading optimizations)
- Multi-core CPU (recommended)

### Installation

1. **Clone and Setup**
```bash
cd /Users/michaeldurante/ai\ dev/ce-hub/edge-dev/backend
chmod +x start.sh
./start.sh
```

2. **Manual Setup**
```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export POLYGON_API_KEY="your_api_key_here"

# Start server
python start.py
```

3. **Docker Deployment**
```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build manually
docker build -t lc-scanner-backend .
docker run -p 8000:8000 -e POLYGON_API_KEY="your_key" lc-scanner-backend
```

## API Endpoints

### Core Endpoints

#### Execute Scan
```
POST /api/scan/execute
```

**Request Body:**
```json
{
  "start_date": "2024-01-01",
  "end_date": "2025-10-29",
  "filters": {
    "min_volume": 10000000,
    "min_dollar_volume": 500000000,
    "min_price": 5.0,
    "exclude_tickers": ["SPY", "QQQ"],
    "include_tickers": []
  }
}
```

**Response:**
```json
{
  "success": true,
  "scan_id": "scan_20251029_143022_a1b2c3d4",
  "message": "Scan initiated successfully",
  "status": "running"
}
```

#### Get Scan Progress
```
GET /api/scan/progress/{scan_id}
```

**Response:**
```json
{
  "scan_id": "scan_20251029_143022_a1b2c3d4",
  "status": "running",
  "progress_percent": 75.5,
  "message": "Processing intraday data...",
  "current_ticker": "AAPL",
  "total_tickers": 5000,
  "processed_tickers": 3775,
  "start_date": "2024-01-01",
  "end_date": "2025-10-29",
  "created_at": "2025-10-29T14:30:22.123456",
  "started_at": "2025-10-29T14:30:25.789012",
  "execution_time": 127.3,
  "results_found": 15
}
```

#### Get Scan Results
```
GET /api/scan/results/{scan_id}
```

**Response:**
```json
{
  "success": true,
  "scan_id": "scan_20251029_143022_a1b2c3d4",
  "results": [
    {
      "ticker": "AAPL",
      "date": "2025-10-29",
      "gap_pct": 0.034,
      "parabolic_score": 85.2,
      "lc_frontside_d2_extended": 1,
      "volume": 45000000,
      "dollar_volume": 7650000000,
      "close_price": 170.25,
      "high_price": 172.50,
      "low_price": 169.80,
      "open_price": 170.00,
      "ema9": 168.50,
      "ema20": 165.75,
      "ema50": 160.25,
      "ema200": 155.00,
      "atr": 3.25,
      "high_chg_atr": 1.85,
      "dist_h_9ema_atr": 2.15,
      "dist_h_20ema_atr": 3.45,
      "close_range": 0.82
    }
  ],
  "total_found": 15,
  "execution_time": 127.3,
  "message": "Scan completed successfully"
}
```

#### List All Scans
```
GET /api/scan/list
```

#### Get Universe Info
```
GET /api/scan/universe
```

#### Health Check
```
GET /api/health
```

### WebSocket Real-time Updates

```
WebSocket: ws://localhost:8000/ws/scan/{scan_id}
```

**Message Format:**
```json
{
  "type": "progress",
  "scan_id": "scan_20251029_143022_a1b2c3d4",
  "data": {
    "progress_percent": 75.5,
    "message": "Processing intraday data...",
    "current_ticker": "AAPL",
    "processed_tickers": 3775
  },
  "timestamp": "2025-10-29T14:45:30.123456"
}
```

## Performance Optimization

### Threading Preservation

The backend preserves ALL original threading optimizations:

1. **ProcessPoolExecutor**: Multi-core processing for CPU-intensive tasks
   ```python
   with ProcessPoolExecutor(max_workers=cpu_count()) as executor:
       future_lc = executor.submit(process_dataframe, process_lc_row, rows_lc)
   ```

2. **ThreadPoolExecutor**: Async I/O operations
   ```python
   executor = ThreadPoolExecutor()  # Global executor preserved
   ```

3. **aiohttp Async Patterns**: Concurrent API requests
   ```python
   async with aiohttp.ClientSession() as session:
       tasks = [fetch_intial_stock_list(session, date, adj) for date in DATES]
       results = await asyncio.gather(*tasks, return_exceptions=True)
   ```

4. **Batch Processing**: Rate limiting and retry mechanisms preserved

### Performance Monitoring

The backend includes comprehensive performance monitoring:

- Execution time tracking
- Memory usage monitoring
- Threading efficiency metrics
- API response time logging

## Configuration

### Environment Variables

```bash
# API Configuration
POLYGON_API_KEY=your_api_key_here

# Server Configuration
SCANNER_HOST=0.0.0.0
SCANNER_PORT=8000
SCANNER_WORKERS=1
SCANNER_RELOAD=true
SCANNER_LOG_LEVEL=info

# Storage Configuration
SCANNER_RESULTS_DIR=scan_results

# Performance Configuration
MAX_CONCURRENT_SCANS=3
SCAN_TIMEOUT_MINUTES=60
```

### Logging Configuration

Logs are written to multiple files:
- `logs/scanner_app.log` - Main application log
- `logs/scanner_performance.log` - Performance metrics
- `logs/scanner_api.log` - API access log
- `logs/scanner_errors.log` - Error details

## Development

### Project Structure

```
backend/
├── main.py                 # FastAPI application
├── start.py               # Startup script
├── requirements.txt       # Dependencies
├── Dockerfile            # Docker configuration
├── docker-compose.yml    # Docker Compose
├── api/                  # API route handlers
├── core/                 # Core scanner logic
│   ├── scanner.py        # Original scanner (copied)
│   ├── scanner_wrapper.py # Threading-preserved wrapper
│   └── scan_manager.py   # Scan orchestration
├── models/               # Data models
│   └── schemas.py        # Pydantic schemas
├── utils/                # Utilities
│   ├── websocket_manager.py # WebSocket handling
│   ├── logging_config.py    # Logging setup
│   └── error_handlers.py    # Error handling
└── scan_results/         # Results storage
```

### Adding New Features

1. **New API Endpoints**: Add to `main.py` or create new route files in `api/`
2. **Scanner Modifications**: Modify `scanner_wrapper.py` to preserve threading
3. **Data Models**: Add new schemas to `models/schemas.py`
4. **Error Handling**: Add custom exceptions to `utils/error_handlers.py`

### Testing

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest

# Test specific endpoint
curl -X POST http://localhost:8000/api/scan/execute \
  -H "Content-Type: application/json" \
  -d '{"start_date": "2024-01-01", "end_date": "2024-01-31"}'
```

## Deployment

### Production Deployment

1. **Environment Setup**
```bash
export SCANNER_RELOAD=false
export SCANNER_WORKERS=4
export SCANNER_LOG_LEVEL=warning
```

2. **Docker Production**
```bash
docker-compose -f docker-compose.yml --profile production up -d
```

3. **Reverse Proxy** (nginx configuration included)

4. **Monitoring**: Prometheus metrics available at `/metrics`

### Scaling Considerations

- **Horizontal Scaling**: Multiple backend instances with load balancer
- **Database**: Consider PostgreSQL for scan metadata (currently file-based)
- **Caching**: Redis for scan results caching
- **Queue System**: Celery for scan job management

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure `scanner.py` is in `core/` directory
2. **Threading Issues**: Check CPU core count and memory availability
3. **API Rate Limits**: Verify Polygon API key and rate limits
4. **Memory Usage**: Monitor memory usage during large scans

### Performance Tuning

1. **CPU Cores**: Set `ProcessPoolExecutor(max_workers=cpu_count())`
2. **Memory**: Increase available RAM for large date ranges
3. **Network**: Optimize `aiohttp` session settings
4. **Storage**: Use SSD for results storage

### Monitoring

- **Health Check**: `GET /api/health`
- **Performance Logs**: Check `logs/scanner_performance.log`
- **WebSocket Connections**: Monitor active connections
- **Resource Usage**: CPU and memory monitoring

## API Documentation

Interactive API documentation is available at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Support

For issues related to:
- **Threading Optimizations**: Check original scanner logic preservation
- **API Integration**: Review FastAPI endpoint implementations
- **Performance**: Monitor logs and adjust configuration
- **WebSocket Issues**: Check connection handling and message flow

The backend is designed to be a drop-in replacement for the original scanner with enhanced API capabilities while maintaining 100% performance compatibility.