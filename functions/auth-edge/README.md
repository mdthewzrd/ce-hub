# CE-Hub Authentication Edge Function

A production-ready, hardened Supabase authentication microservice deployed as a Vercel Edge Function. Provides centralized authentication services for all CE-Hub applications with advanced security features, rate limiting, and comprehensive monitoring.

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your Supabase credentials
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_ANON_KEY=your-anon-key
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Start local development server
./scripts/local-test.sh
```

### Production Deployment

```bash
# Deploy to Vercel
./scripts/deploy.sh
```

## 📋 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check and service status |
| `/verify` | GET, POST | JWT token verification |
| `/refresh` | POST | Refresh access tokens |

### `/health` - Health Check

**GET** `/health`

Returns service health status and metrics.

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "services": {
    "supabase": {
      "status": "healthy",
      "responseTime": 45
    },
    "environment": {
      "status": "healthy"
    }
  },
  "uptime": 86400000
}
```

### `/verify` - Token Verification

**GET** `/verify`

Verify a JWT token via Authorization header.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "role": "user",
      "permissions": ["read"],
      "app_metadata": {},
      "user_metadata": {}
    },
    "exp": 1642248600,
    "iat": 1642245000
  }
}
```

**POST** `/verify`

Verify a JWT token via JSON body with optional validation rules.

**Body:**
```json
{
  "token": "jwt-token-here",
  "options": {
    "requireRole": "admin",
    "requirePermissions": ["read", "write"]
  }
}
```

### `/refresh` - Token Refresh

**POST** `/refresh`

Refresh an access token using a refresh token.

**Body:**
```json
{
  "refreshToken": "refresh-token-here"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "new-jwt-token",
    "refresh_token": "new-refresh-token",
    "expires_in": 3600,
    "expires_at": 1642248600,
    "token_type": "bearer",
    "user": {
      "id": "user-uuid",
      "email": "user@example.com"
    }
  }
}
```

## 🔒 Security Features

### Rate Limiting

- **Verify endpoint**: 100 requests/minute (configurable)
- **Refresh endpoint**: 10 requests/minute
- **Health endpoint**: 60 requests/minute
- **Failed auth**: 5 attempts/15 minutes

### Security Headers

All responses include comprehensive security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security: max-age=31536000`

### CORS Support

Configurable CORS policies with environment variables:
```bash
ALLOWED_ORIGINS=https://app.yourdomain.com,https://admin.yourdomain.com
```

## 🔧 Configuration

### Environment Variables

#### Required
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### Optional
```bash
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
RATE_LIMIT_MAX=100
NODE_ENV=production
```

### Vercel Configuration

The function is automatically configured for:
- Edge Runtime for optimal performance
- Global deployment (US East/West)
- Environment variable management
- Automatic security headers

## 🧪 Testing

### Smoke Tests

Run basic functional tests:

```bash
# Test local development server
./tests/smoke-test.sh --local

# Test production deployment
./tests/smoke-test.sh --url https://your-auth-edge.vercel.app

# Test with real tokens
./tests/smoke-test.sh --local --token eyJ... --refresh-token ref...
```

### Integration Tests

Run comprehensive integration tests:

```bash
# Local testing
node tests/integration-test.js

# Production testing with tokens
TEST_BASE_URL=https://your-auth-edge.vercel.app \
TEST_TOKEN=eyJ... \
TEST_REFRESH_TOKEN=ref... \
node tests/integration-test.js
```

## 📊 Monitoring

### Health Monitoring

Monitor the `/health` endpoint for:
- Service availability
- Supabase connectivity
- Response times
- Memory usage

### Vercel Dashboard

Key metrics to monitor:
- Function invocations
- Error rates
- Response times (95th percentile)
- Cold start frequency

### Structured Logging

All requests are logged with structured JSON:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "message": "Request completed",
  "requestId": "req_1642248600000_abc123",
  "method": "POST",
  "path": "/verify",
  "status": 200,
  "duration": 145
}
```

## 🛠 Development

### Project Structure

```
functions/auth-edge/
├── index.ts                    # Main handler
├── supabase.ts                 # Supabase configuration
├── routes/                     # Route handlers
│   ├── verify.ts              # Token verification
│   ├── refresh.ts             # Token refresh
│   └── health.ts              # Health checks
├── utils/                      # Utilities
│   ├── security.ts            # Security functions
│   ├── responses.ts           # Response formatting
│   └── errors.ts              # Error handling
├── middleware/                 # Middleware
│   └── rateLimiting.ts        # Rate limiting
├── scripts/                    # Scripts
│   ├── deploy.sh              # Deployment
│   └── local-test.sh          # Local testing
└── tests/                      # Test suites
    ├── smoke-test.sh          # Smoke tests
    └── integration-test.js    # Integration tests
```

### Adding New Features

1. **New Routes**: Add handlers in `routes/` directory
2. **Middleware**: Add to `middleware/` directory
3. **Utilities**: Add to `utils/` directory
4. **Tests**: Update test suites
5. **Documentation**: Update this README

### Code Quality

- TypeScript with strict configuration
- Comprehensive error handling
- Security-first design
- Extensive logging
- 100% test coverage target

## 📚 Documentation

- **[Operations Runbook](AUTH_EDGE_RUNBOOK.md)**: Complete operations guide
- **[Environment Setup](.env.example)**: Environment configuration
- **[Deployment Guide](scripts/deploy.sh)**: Production deployment
- **[Testing Guide](tests/)**: Test documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Update documentation
6. Submit a pull request

## 📄 License

Part of the CE-Hub project. See main project for license details.

## 🆘 Support

- **Documentation**: Check the [Operations Runbook](AUTH_EDGE_RUNBOOK.md)
- **Issues**: Create GitHub issues for bugs/features
- **Security**: Report security issues privately

---

**Built with ❤️ for the CE-Hub ecosystem**