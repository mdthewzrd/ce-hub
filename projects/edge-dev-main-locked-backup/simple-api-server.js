#!/usr/bin/env node

/**
 * Simple API Server for Edge Dev
 * Provides basic endpoints to resolve frontend connection errors
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;
const HOST = '0.0.0.0';

console.log('🚀 Starting Simple API Server...');
console.log(`📍 Server will run on: http://${HOST}:${PORT}`);

// Basic mock data for testing
const mockScanResult = {
  scan_id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
  status: "completed",
  progress: 100,
  message: "Mock scan completed successfully",
  results: [
    { ticker: "AAPL", date: "2024-11-22", gapPercent: 8.5, volume: 45230000, score: 82.4, result: "win", pnl: "+12.3%" },
    { ticker: "GOOGL", date: "2024-11-22", gapPercent: 5.2, volume: 23450000, score: 78.9, result: "win", pnl: "+8.7%" },
    { ticker: "MSFT", date: "2024-11-22", gapPercent: 3.8, volume: 31200000, score: 75.1, result: "loss", pnl: "-2.1%" }
  ],
  timestamp: new Date().toISOString()
};

const mockChartData = {
  symbol: "AAPL",
  timeframe: "5min",
  data: Array.from({ length: 50 }, (_, i) => ({
    timestamp: new Date(Date.now() - (50 - i) * 5 * 60 * 1000).toISOString(),
    open: 150 + Math.random() * 10,
    high: 155 + Math.random() * 10,
    low: 145 + Math.random() * 10,
    close: 150 + Math.random() * 10,
    volume: 1000000 + Math.random() * 500000
  }))
};

// Request handler
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  console.log(`📡 ${req.method} ${url.pathname} ${url.search}`);

  // API Routes
  if (url.pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      server: 'simple-api-server',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  if (url.pathname === '/api/scan/execute') {
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const data = JSON.parse(body || '{}');
          console.log('📊 Scan request:', data);

          const response = {
            ...mockScanResult,
            scan_id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
            request: data
          };

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(response));
        } catch (error) {
          console.error('❌ Error parsing scan request:', error);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });
    } else {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method not allowed' }));
    }
    return;
  }

  if (url.pathname.startsWith('/api/scan/status/')) {
    const scanId = url.pathname.split('/').pop();
    console.log('📈 Status request for scan:', scanId);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ...mockScanResult,
      scan_id: scanId,
      requested_at: new Date().toISOString()
    }));
    return;
  }

  if (url.pathname.startsWith('/api/chart/')) {
    const symbol = url.pathname.split('/').pop().split('?')[0];
    const timeframe = url.searchParams.get('timeframe') || '5min';

    console.log(`📊 Chart data request for ${symbol} (${timeframe})`);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ...mockChartData,
      symbol: symbol,
      timeframe: timeframe
    }));
    return;
  }

  if (url.pathname === '/api/format/code') {
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const data = JSON.parse(body || '{}');
          console.log('🔧 Format request for:', data.language || 'unknown');

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            formatted_code: data.code || '',
            language: data.language || 'python',
            success: true,
            timestamp: new Date().toISOString()
          }));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });
    } else {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method not allowed' }));
    }
    return;
  }

  // API documentation endpoint
  if (url.pathname === '/docs') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
        <head><title>Simple API Server - Documentation</title></head>
        <body>
          <h1>Simple API Server</h1>
          <p>A minimal API server for Edge Dev development</p>
          <h2>Available Endpoints:</h2>
          <ul>
            <li><code>GET /api/health</code> - Health check</li>
            <li><code>POST /api/scan/execute</code> - Execute scan</li>
            <li><code>GET /api/scan/status/{scan_id}</code> - Get scan status</li>
            <li><code>GET /api/chart/{symbol}</code> - Get chart data</li>
            <li><code>POST /api/format/code</code> - Format code</li>
          </ul>
          <p><strong>Status:</strong> Running on port ${PORT}</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        </body>
      </html>
    `);
    return;
  }

  // 404 for all other routes
  console.log('❌ Route not found:', url.pathname);
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    error: 'Not Found',
    path: url.pathname,
    available_routes: [
      '/api/health',
      '/api/scan/execute',
      '/api/scan/status/{scan_id}',
      '/api/chart/{symbol}',
      '/api/format/code',
      '/docs'
    ]
  }));
});

// Start server
server.listen(PORT, HOST, () => {
  console.log('✅ Simple API Server started successfully!');
  console.log(`🌐 Server available at: http://${HOST}:${PORT}`);
  console.log(`📋 API documentation: http://${HOST}:${PORT}/docs`);
  console.log(`🏥 Health check: http://${HOST}:${PORT}/api/health`);
  console.log('');
  console.log('Press Ctrl+C to stop the server');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Simple API Server...');
  server.close(() => {
    console.log('✅ Server stopped gracefully');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server stopped gracefully');
    process.exit(0);
  });
});