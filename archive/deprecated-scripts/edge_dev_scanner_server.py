#!/usr/bin/env python3
"""
Edge.dev LC Scanner Server
Runs on port 5658 and executes the Late Cycle scanning algorithm
"""

from flask import Flask, jsonify, render_template_string
import pandas as pd
import asyncio
import subprocess
import sys
import os
from datetime import datetime
import threading
import time

app = Flask(__name__)

# Global variable to store the latest scan results
latest_scan_results = None
scan_status = "Not started"
scan_error = None

# HTML template for the web interface
HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>Edge.dev LC Scanner</title>
    <style>
        body {
            font-family: 'Courier New', monospace;
            background-color: #0d1117;
            color: #58a6ff;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
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
        .date {
            color: #7ee787;
        }
        .error {
            color: #f85149;
            background-color: #161b22;
            border: 1px solid #f85149;
            border-radius: 6px;
            padding: 16px;
            margin-bottom: 20px;
        }
        .refresh-btn {
            background-color: #238636;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            margin-right: 10px;
        }
        .refresh-btn:hover {
            background-color: #2ea043;
        }
        .run-btn {
            background-color: #1f6feb;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
        }
        .run-btn:hover {
            background-color: #388bfd;
        }
    </style>
    <script>
        function refreshResults() {
            location.reload();
        }

        function runScan() {
            document.getElementById('status').innerHTML = 'Starting scan...';
            fetch('/run_scan', {method: 'POST'})
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        setTimeout(refreshResults, 2000);
                    } else {
                        document.getElementById('status').innerHTML = 'Error: ' + data.error;
                    }
                });
        }

        // Auto-refresh every 30 seconds
        setInterval(refreshResults, 30000);
    </script>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Edge.dev Late Cycle Scanner</h1>
            <p>Port 5658 | Real-time Stock Scanning</p>
        </div>

        <div class="status" id="status">
            <strong>Status:</strong> {{ status }}
            {% if last_update %}
            <br><strong>Last Update:</strong> {{ last_update }}
            {% endif %}
        </div>

        <div style="margin-bottom: 20px;">
            <button class="refresh-btn" onclick="refreshResults()">🔄 Refresh Results</button>
            <button class="run-btn" onclick="runScan()">▶️ Run Scan</button>
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
                        <th>Ticker</th>
                        <th>Date</th>
                        <th>Close</th>
                        <th>Volume</th>
                        <th>LC Patterns</th>
                        <th>Score</th>
                    </tr>
                </thead>
                <tbody>
                    {% for row in results %}
                    <tr>
                        <td class="ticker">{{ row.ticker }}</td>
                        <td class="date">{{ row.date }}</td>
                        <td>${{ "%.2f"|format(row.close) }}</td>
                        <td>{{ "{:,.0f}"|format(row.volume) }}</td>
                        <td>{{ row.patterns }}</td>
                        <td>{{ row.score }}</td>
                    </tr>
                    {% endfor %}
                </tbody>
            </table>
        </div>
        {% else %}
        <div class="status">
            <p>No scan results available. Click "Run Scan" to execute the scanner.</p>
        </div>
        {% endif %}

        <div style="margin-top: 30px; text-align: center; color: #7d8590;">
            <p>Edge.dev Scanner | Monitoring {{ ticker_count }} potential candidates</p>
        </div>
    </div>
</body>
</html>
"""

def run_scanner():
    """Execute the LC scanner script and return results"""
    global latest_scan_results, scan_status, scan_error

    try:
        scan_status = "Running scan..."
        scan_error = None

        # Path to the scanner script
        scanner_path = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py"

        # Run the scanner script
        result = subprocess.run([sys.executable, scanner_path],
                              capture_output=True, text=True, timeout=300)

        if result.returncode == 0:
            # Try to read the generated CSV file
            csv_path = os.path.join(os.path.dirname(scanner_path), "lc_backtest.csv")
            if os.path.exists(csv_path):
                df = pd.read_csv(csv_path)

                # Process results for display
                results = []
                for _, row in df.iterrows():
                    # Identify which LC patterns are active
                    patterns = []
                    lc_columns = [col for col in df.columns if col.startswith('lc_') and row.get(col, 0) == 1]
                    patterns = [col.replace('lc_', '').replace('_', ' ').title() for col in lc_columns]

                    results.append({
                        'ticker': row.get('ticker', 'N/A'),
                        'date': str(row.get('date', 'N/A'))[:10],
                        'close': row.get('c', 0),
                        'volume': row.get('v', 0),
                        'patterns': ', '.join(patterns) if patterns else 'None',
                        'score': row.get('parabolic_score', 0)
                    })

                latest_scan_results = results
                scan_status = f"Scan completed successfully at {datetime.now().strftime('%H:%M:%S')} - Found {len(results)} candidates"
            else:
                scan_status = "Scan completed but no results file found"
                latest_scan_results = []
        else:
            scan_error = f"Scanner failed: {result.stderr}"
            scan_status = "Scan failed"

    except subprocess.TimeoutExpired:
        scan_error = "Scanner timed out after 5 minutes"
        scan_status = "Scan timed out"
    except Exception as e:
        scan_error = f"Error running scanner: {str(e)}"
        scan_status = "Scan error"

@app.route('/')
def index():
    """Main dashboard page"""
    results = latest_scan_results or []

    return render_template_string(HTML_TEMPLATE,
                                status=scan_status,
                                error=scan_error,
                                results=results,
                                last_update=datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                                ticker_count=len(results))

@app.route('/api/results')
def api_results():
    """API endpoint for getting scan results"""
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
        # Run scanner in background thread
        thread = threading.Thread(target=run_scanner)
        thread.daemon = True
        thread.start()

        return jsonify({'success': True, 'message': 'Scan started'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'port': 5658
    })

if __name__ == '__main__':
    print("🚀 Starting Edge.dev LC Scanner Server on port 5658")
    print("📊 Dashboard: http://localhost:5658")
    print("🔌 API: http://localhost:5658/api/results")
    print("❤️  Health: http://localhost:5658/health")

    # Run initial scan on startup
    print("🔄 Running initial scan...")
    threading.Thread(target=run_scanner, daemon=True).start()

    app.run(host='0.0.0.0', port=5658, debug=False)