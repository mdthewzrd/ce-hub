#!/usr/bin/env node

/**
 * Simple mobile-optimized web server for CE-Hub
 * Serves the mobile interface at /mobile/
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8081; // Different port to avoid conflicts with code-server
const HOST = '127.0.0.1';
const MOBILE_ROOT = __dirname;

// MIME types for different file extensions
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'text/plain';
}

function serveFile(res, filePath, statusCode = 200) {
  try {
    const content = fs.readFileSync(filePath);
    const mimeType = getMimeType(filePath);

    res.writeHead(statusCode, {
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff'
    });

    res.end(content);
    return true;
  } catch (error) {
    console.error('Error serving file:', filePath, error.message);
    return false;
  }
}

function serveNotFound(res) {
  const notFoundHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>404 - CE-Hub Mobile</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      background: #0d1117;
      color: #f0f6fc;
      text-align: center;
      padding: 40px 20px;
      margin: 0;
    }
    .container {
      max-width: 400px;
      margin: 0 auto;
    }
    .error-icon {
      font-size: 64px;
      margin-bottom: 20px;
    }
    .error-title {
      font-size: 24px;
      margin-bottom: 16px;
    }
    .error-message {
      color: #8b949e;
      line-height: 1.6;
      margin-bottom: 32px;
    }
    .back-button {
      background: #238636;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      text-decoration: none;
      display: inline-block;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="error-icon">📱</div>
    <h1 class="error-title">Page Not Found</h1>
    <p class="error-message">
      The page you're looking for doesn't exist in CE-Hub Mobile.
    </p>
    <a href="/mobile/" class="back-button">Go to Dashboard</a>
  </div>
</body>
</html>`;

  res.writeHead(404, {
    'Content-Type': 'text/html; charset=utf-8'
  });
  res.end(notFoundHTML);
}

function serveAPI(res, pathname) {
  // Simple API endpoints for mobile interface
  const routes = {
    '/mobile/api/status': () => ({
      status: 'online',
      codeserver: true,
      tailscale: true,
      timestamp: new Date().toISOString()
    }),

    '/mobile/api/files': () => ({
      recent: [
        { name: 'MOBILE_VSCODE_GUIDE.md', icon: '📝', modified: '2m ago' },
        { name: 'settings.json', icon: '⚙️', modified: '5m ago' },
        { name: 'index.html', icon: '🌐', modified: 'now' }
      ]
    }),

    '/mobile/api/stats': () => ({
      files: 287,
      projects: 15,
      active: 8,
      uptime: '2h 34m'
    })
  };

  if (routes[pathname]) {
    const data = routes[pathname]();
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify(data, null, 2));
    return true;
  }

  return false;
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  console.log(\`\${new Date().toISOString()} - \${req.method} \${pathname}\`);

  // Enable CORS for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Only handle GET requests
  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed');
    return;
  }

  // API routes
  if (pathname.startsWith('/mobile/api/')) {
    if (serveAPI(res, pathname)) {
      return;
    }
  }

  // Root mobile route
  if (pathname === '/mobile' || pathname === '/mobile/') {
    const indexPath = path.join(MOBILE_ROOT, 'index.html');
    if (serveFile(res, indexPath)) {
      return;
    }
  }

  // Static files in mobile directory
  if (pathname.startsWith('/mobile/')) {
    const relativePath = pathname.replace('/mobile/', '');
    const filePath = path.join(MOBILE_ROOT, relativePath);

    // Security check - prevent directory traversal
    if (!filePath.startsWith(MOBILE_ROOT)) {
      serveNotFound(res);
      return;
    }

    if (serveFile(res, filePath)) {
      return;
    }
  }

  // Redirect to mobile interface for mobile user agents
  const userAgent = req.headers['user-agent'] || '';
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);

  if (isMobile && pathname === '/') {
    res.writeHead(302, {
      'Location': '/mobile/'
    });
    res.end();
    return;
  }

  // 404 for everything else
  serveNotFound(res);
});

server.listen(PORT, HOST, () => {
  console.log(\`📱 CE-Hub Mobile Server running at http://\${HOST}:\${PORT}/mobile/\`);
  console.log('Press Ctrl+C to stop');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

module.exports = server;