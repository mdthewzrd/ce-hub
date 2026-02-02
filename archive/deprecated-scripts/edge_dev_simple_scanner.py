#!/usr/bin/env python3
"""
Simplified Edge.dev LC Scanner Server
Uses the working quick scanner for immediate results
"""

from flask import Flask, jsonify, render_template_string
import pandas as pd
import asyncio
import aiohttp
from datetime import datetime, timedelta
import threading
import time

app = Flask(__name__)

# Configuration
API_KEY = '4r6MZNWLy2ucmhVI7fY8MrvXfXTSmxpy'

# Global variables
latest_scan_results = None
scan_status = "Not started"
scan_error = None

# HTML Template
HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>Edge.dev LC Scanner (Simple)</title>
    <style>
        body {
            font-family: 'Courier New', monospace;
            background-color: #0d1117;
            color: #58a6ff;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #58a6ff;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .status {
            background-color: #161b22;
            border: 1px solid #30363d;
            border-radius: 6px;
            padding: 16px;
            margin-bottom: 20px;
        }
        .results-table {
            background-color: #161b22;
            border: 1px solid #30363d;
            border-radius: 6px;
            overflow-x: auto;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            padding: 8px 12px;
            text-align: left;
            border-bottom: 1px solid #30363d;
        }
        th {
            background-color: #21262d;
            color: #7d8590;
            font-weight: bold;
        }
        tr:hover {
            background-color: #21262d;
        }
        .ticker {
            color: #f85149;
            font-weight: bold;
        }
        .positive {
            color: #7ee787;
        }
        .negative {
            color: #f85149;
        }
        .neutral {
            color: #7d8590;
        }
        .error {
            color: #f85149;
            background-color: #161b22;
            border: 1px solid #f85149;
            border-radius: 6px;
            padding: 16px;
            margin-bottom: 20px;
        }
        .button {
            background-color: #238636;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            margin-right: 10px;
        }
        .button:hover {
            background-color: #2ea043;
        }
        .run-btn {
            background-color: #1f6feb;
        }
        .run-btn:hover {
            background-color: #388bfd;
        }
        .stats {
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
        }
        .stat-box {
            background-color: #161b22;
            border: 1px solid #30363d;
            border-radius: 6px;
            padding: 12px;
            flex: 1;
            text-align: center;
        }
        .stat-number {
            font-size: 24px;
            font-weight: bold;
            color: #58a6ff;
        }
        .stat-label {
            color: #7d8590;
            font-size: 12px;
        }
    </style>
    <script>
        function refreshResults() {
            location.reload();
        }

        function runScan() {
            document.getElementById('status-text').innerHTML = 'Starting scan...';
            fetch('/run_scan', {method: 'POST'})
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        setTimeout(refreshResults, 3000);
                    } else {
                        document.getElementById('status-text').innerHTML = 'Error: ' + data.error;
                    }
                });
        }

        // Auto-refresh every 60 seconds
        setInterval(refreshResults, 60000);
    </script>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Edge.dev LC Scanner</h1>
            <p>Port 5658 | Live Market Data Analysis</p>
        </div>

        <div class="stats">
            <div class="stat-box">
                <div class="stat-number">{{ total_stocks }}</div>
                <div class="stat-label">TOTAL SCANNED</div>
            </div>
            <div class="stat-box">
                <div class="stat-number">{{ filtered_stocks }}</div>
                <div class="stat-label">CANDIDATES FOUND</div>
            </div>
            <div class="stat-box">
                <div class="stat-number">{{ known_matches }}</div>
                <div class="stat-label">KNOWN TICKERS</div>
            </div>
            <div class="stat-box">
                <div class="stat-number">{{ avg_gain }}</div>
                <div class="stat-label">AVG GAIN %</div>
            </div>
        </div>

        <div class="status">
            <strong>Status:</strong> <span id="status-text">{{ status }}</span>
            {% if last_update %}
            <br><strong>Last Update:</strong> {{ last_update }}
            {% endif %}
        </div>

        <div style="margin-bottom: 20px;">
            <button class="button" onclick="refreshResults()">🔄 Refresh</button>
            <button class="button run-btn" onclick="runScan()">▶️ Run New Scan</button>
        </div>

        {% if error %}
        <div class="error">
            <strong>Error:</strong> {{ error }}
        </div>
        {% endif %}

        {% if results and results|length > 0 %}
        <div class="results-table">
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Ticker</th>
                        <th>Price</th>
                        <th>Change %</th>
                        <th>Volume</th>
                        <th>Range %</th>
                        <th>Dollar Vol</th>
                        <th>Known Ticker</th>
                    </tr>
                </thead>
                <tbody>
                    {% for row in results %}
                    <tr>
                        <td>{{ loop.index }}</td>
                        <td class="ticker">{{ row.ticker }}</td>
                        <td>${{ row.price|round(2) }}</td>
                        <td class="{{ 'positive' if row.change_pct > 0 else 'negative' if row.change_pct < 0 else 'neutral' }}">
                            {{ row.change_pct|round(2) }}%
                        </td>
                        <td>{{ row.volume|int }}</td>
                        <td class="positive">{{ row.range_pct|round(2) }}%</td>
                        <td>${{ row.dollar_volume|int }}</td>
                        <td>{{ "✓" if row.is_known else "" }}</td>
                    </tr>
                    {% endfor %}
                </tbody>
            </table>
        </div>
        {% else %}
        <div class="status">
            <p>No scan results available. Click "Run New Scan" to analyze the market.</p>
        </div>
        {% endif %}

        <div style="margin-top: 30px; text-align: center; color: #7d8590;">
            <p>Edge.dev Scanner v2.0 | Real-time market analysis</p>
        </div>
    </div>
</body>
</html>
"""

async def fetch_stock_data(session, date, adj):
    """Fetch stock data for a specific date"""
    url = f"https://api.polygon.io/v2/aggs/grouped/locale/us/market/stocks/{date}?adjusted={adj}&apiKey={API_KEY}"

    try:
        async with session.get(url) as response:
            if response.status == 200:
                data = await response.json()
                if 'results' in data:
                    df = pd.DataFrame(data['results'])
                    df['date'] = pd.to_datetime(df['t'], unit='ms').dt.date
                    df.rename(columns={'T': 'ticker'}, inplace=True)
                    return df
                else:
                    return pd.DataFrame()
            else:
                return pd.DataFrame()
    except Exception as e:
        print(f"Error fetching data: {e}")
        return pd.DataFrame()

def apply_lc_filters(df):
    """Apply Late Cycle scanning filters"""
    # Enhanced filters for LC candidates
    filtered = df[
        (df['c'] >= 5.0) &  # Close price >= $5
        (df['v'] >= 1000000) &  # Volume >= 1M
        (df['c'] > df['o']) &  # Closed higher than opened
        ((df['h'] - df['l']) / df['l'] >= 0.02) &  # Range >= 2%
        (df['c'] * df['v'] >= 50000000)  # Dollar volume >= $50M
    ].copy()

    # Calculate metrics
    filtered['pct_change'] = ((filtered['c'] / filtered['o']) - 1) * 100
    filtered['range_pct'] = ((filtered['h'] - filtered['l']) / filtered['l']) * 100
    filtered['dollar_volume'] = filtered['c'] * filtered['v']

    # Additional LC-specific filters
    filtered = filtered[
        (filtered['pct_change'] >= 0.5) &  # At least 0.5% gain
        (filtered['range_pct'] >= 3.0)    # At least 3% intraday range
    ]

    # Sort by combination of factors (range, volume, gain)
    filtered['score'] = (
        filtered['pct_change'] * 0.3 +
        filtered['range_pct'] * 0.4 +
        (filtered['dollar_volume'] / 1000000) * 0.3
    )

    filtered = filtered.sort_values('score', ascending=False)
    return filtered

def run_scanner():
    """Execute the scanner and return results"""
    global latest_scan_results, scan_status, scan_error

    try:
        scan_status = "Running scan..."
        scan_error = None

        # Use current trading day
        today = datetime.now()
        # If it's weekend, use Friday
        if today.weekday() >= 5:  # Saturday = 5, Sunday = 6
            days_back = today.weekday() - 4  # Go back to Friday
            scan_date = today - timedelta(days=days_back)
        else:
            scan_date = today

        date_str = scan_date.strftime('%Y-%m-%d')

        async def scan_async():
            async with aiohttp.ClientSession() as session:
                df = await fetch_stock_data(session, date_str, "true")

                if df.empty:
                    return []

                candidates = apply_lc_filters(df)

                if candidates.empty:
                    return []

                # Known tickers from user's list
                known_tickers = [
                    'QNTM', 'OKLO', 'AQST', 'HIMS', 'SMCI', 'TSLQ', 'MLGO', 'UVIX',
                    'CEP', 'ASST', 'CRNW', 'SBET', 'SRM', 'NKTR', 'BMNR', 'RKLB',
                    'THAR', 'SATS', 'QURE', 'BKNG', 'RGTI', 'UAMY', 'USAR', 'CRML',
                    'QWM', 'AQMS', 'TMQ'
                ]

                # Process results
                results = []
                for _, row in candidates.head(50).iterrows():  # Top 50 candidates
                    results.append({
                        'ticker': row['ticker'],
                        'price': row['c'],
                        'change_pct': row['pct_change'],
                        'volume': row['v'],
                        'range_pct': row['range_pct'],
                        'dollar_volume': row['dollar_volume'],
                        'is_known': row['ticker'] in known_tickers,
                        'score': row['score']
                    })

                return results

        # Run async scanner
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        results = loop.run_until_complete(scan_async())
        loop.close()

        latest_scan_results = results
        scan_status = f"Scan completed at {datetime.now().strftime('%H:%M:%S')} - Found {len(results)} candidates"

    except Exception as e:
        scan_error = f"Scanner error: {str(e)}"
        scan_status = "Scan failed"
        latest_scan_results = []

@app.route('/')
def index():
    """Main dashboard"""
    results = latest_scan_results or []

    # Calculate stats
    total_stocks = 10000  # Approximate
    filtered_stocks = len(results)
    known_matches = sum(1 for r in results if r.get('is_known', False))
    avg_gain = round(sum(r.get('change_pct', 0) for r in results) / max(len(results), 1), 2)

    return render_template_string(HTML_TEMPLATE,
                                status=scan_status,
                                error=scan_error,
                                results=results,
                                last_update=datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                                total_stocks=total_stocks,
                                filtered_stocks=filtered_stocks,
                                known_matches=known_matches,
                                avg_gain=avg_gain)

@app.route('/api/results')
def api_results():
    """API endpoint for results"""
    return jsonify({
        'status': scan_status,
        'error': scan_error,
        'results': latest_scan_results or [],
        'count': len(latest_scan_results) if latest_scan_results else 0,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/run_scan', methods=['POST'])
def run_scan_endpoint():
    """Trigger a new scan"""
    try:
        thread = threading.Thread(target=run_scanner)
        thread.daemon = True
        thread.start()
        return jsonify({'success': True, 'message': 'Scan started'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/health')
def health():
    """Health check"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'port': 5658,
        'version': '2.0'
    })

if __name__ == '__main__':
    print("🚀 Starting Edge.dev Simple LC Scanner")
    print("📊 Dashboard: http://localhost:5658")
    print("🔌 API: http://localhost:5658/api/results")

    # Run initial scan
    print("🔄 Running initial scan...")
    threading.Thread(target=run_scanner, daemon=True).start()

    app.run(host='0.0.0.0', port=5658, debug=False)