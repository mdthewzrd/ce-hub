# CE-Hub Authentication Edge Function - Operations Runbook

## Overview

The CE-Hub Authentication Edge Function is a production-ready, hardened Supabase authentication microservice deployed as a Vercel Edge Function. It provides centralized authentication services for all CE-Hub applications with advanced security features, rate limiting, and comprehensive monitoring.

## Table of Contents

1. [Architecture](#architecture)
2. [Deployment](#deployment)
3. [Configuration](#configuration)
4. [Monitoring](#monitoring)
5. [Troubleshooting](#troubleshooting)
6. [Security](#security)
7. [Performance](#performance)
8. [Maintenance](#maintenance)

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    CE-Hub Applications                      │
├─────────────────────────────────────────────────────────────┤
│  Planner Chat  │  AGUI Apps  │  Future Apps  │  External   │
└─────────────────┴─────────────┴───────────────┴─────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                Auth Edge Function (Vercel)                 │
├─────────────────────────────────────────────────────────────┤
│  Rate Limiting  │  Security  │  Validation  │  Logging     │
└─────────────────┴────────────┴──────────────┴──────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Supabase Backend                         │
├─────────────────────────────────────────────────────────────┤
│  Authentication │  User Management  │  Session Handling    │
└─────────────────────────────────────────────────────────────┘
```

### Edge Function Structure

```
functions/auth-edge/
├── index.ts                    # Main handler and routing
├── supabase.ts                 # Supabase client configuration
├── package.json                # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── vercel.json                # Deployment configuration
├── routes/                    # Route handlers
│   ├── verify.ts              # Token verification
│   ├── refresh.ts             # Token refresh
│   └── health.ts              # Health checks
├── utils/                     # Utility modules
│   ├── security.ts            # Security utilities
│   ├── responses.ts           # Response formatting
│   └── errors.ts              # Error handling
├── middleware/                # Middleware functions
│   └── rateLimiting.ts        # Rate limiting logic
└── scripts/                   # Deployment scripts
    ├── deploy.sh              # Production deployment
    └── local-test.sh          # Local testing
```

## Deployment

### Prerequisites

1. **Vercel Account**: Active Vercel account with CLI access
2. **Supabase Project**: Configured Supabase project with authentication enabled
3. **Environment Variables**: All required environment variables configured

### Environment Variables

#### Required Variables

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

#### Optional Variables

```bash
# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# Rate Limiting Configuration
RATE_LIMIT_MAX=100

# Environment
NODE_ENV=production
```

### Deployment Commands

#### Production Deployment

```bash
cd functions/auth-edge
./scripts/deploy.sh
```

#### Local Testing

```bash
cd functions/auth-edge
./scripts/local-test.sh
```

#### Manual Deployment

```bash
cd functions/auth-edge
npm install
npm run build
vercel --prod
```

### Vercel Configuration

The function is configured with:
- **Runtime**: Edge Runtime for optimal performance
- **Regions**: `iad1` (US East) and `sfo1` (US West) for global coverage
- **Security Headers**: Comprehensive security headers applied automatically
- **CORS**: Configurable CORS support for cross-origin requests

## Configuration

### Rate Limiting Configuration

The function implements adaptive rate limiting with different limits per endpoint:

| Endpoint | Window | Max Requests | Purpose |
|----------|--------|--------------|---------|
| `/verify` | 60s | 100 (configurable) | Token verification |
| `/refresh` | 60s | 10 | Token refresh |
| `/health` | 60s | 60 | Health checks |
| Failed Auth | 15min | 5 | Failed authentication attempts |

### Security Configuration

#### CORS Settings

Configure allowed origins in environment variables:

```bash
# Development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Production
ALLOWED_ORIGINS=https://app.yourdomain.com,https://admin.yourdomain.com
```

#### Security Headers

Automatically applied security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Content-Security-Policy: default-src 'none'; frame-ancestors 'none';`

## Monitoring

### Health Check Endpoint

**Endpoint**: `GET /health`

**Response Format**:
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
    },
    "memory": {
      "used": 15,
      "total": 64,
      "percentage": 23
    }
  },
  "uptime": 86400000
}
```

### Logging

All requests are logged with structured JSON format:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "message": "Request completed",
  "requestId": "req_1642248600000_abc123def",
  "method": "POST",
  "path": "/verify",
  "status": 200,
  "duration": 145
}
```

### Key Metrics to Monitor

1. **Response Times**: Average response time should be < 200ms
2. **Error Rates**: Error rate should be < 1%
3. **Rate Limit Hits**: Monitor for unusual rate limiting patterns
4. **Supabase Health**: Monitor Supabase connectivity and response times
5. **Memory Usage**: Track memory consumption in edge runtime

### Vercel Dashboard Monitoring

Monitor the following in Vercel dashboard:
- **Function Invocations**: Total requests per time period
- **Error Rate**: Percentage of failed requests
- **Duration**: 95th percentile response times
- **Memory Usage**: Peak memory consumption
- **Cold Starts**: Frequency and duration of cold starts

## Troubleshooting

### Common Issues

#### 1. Environment Variable Issues

**Symptoms**:
- 503 Service Unavailable errors
- "Missing required environment variable" in logs

**Solution**:
```bash
# Check environment variables in Vercel dashboard
vercel env ls

# Add missing variables
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

#### 2. CORS Errors

**Symptoms**:
- Browser console shows CORS errors
- 403 "Origin not allowed" responses

**Solution**:
```bash
# Update ALLOWED_ORIGINS environment variable
vercel env add ALLOWED_ORIGINS "https://yourdomain.com,https://app.yourdomain.com"

# Redeploy
vercel --prod
```

#### 3. Rate Limiting Issues

**Symptoms**:
- 429 "Rate limit exceeded" responses
- Legitimate users being blocked

**Solution**:
```bash
# Increase rate limit
vercel env add RATE_LIMIT_MAX "200"

# Or implement user-specific rate limiting
```

#### 4. Supabase Connection Issues

**Symptoms**:
- Health check fails
- Authentication timeouts

**Diagnostics**:
```bash
# Check health endpoint
curl https://your-auth-edge.vercel.app/health

# Verify Supabase credentials
# Check Supabase dashboard for API issues
```

### Log Analysis

#### Finding Specific Requests

```bash
# In Vercel dashboard, filter logs by:
# - Request ID: "req_1642248600000_abc123def"
# - User ID: Search for specific user ID
# - Error level: Filter by "error" or "warning"
```

#### Common Log Patterns

**Successful Authentication**:
```json
{
  "level": "info",
  "message": "Token verification successful",
  "userId": "user-123",
  "userEmail": "user@example.com"
}
```

**Failed Authentication**:
```json
{
  "level": "info",
  "message": "Token validation failed - invalid claims",
  "error": "Missing subject claim",
  "userId": "user-123"
}
```

**Rate Limiting**:
```json
{
  "level": "warning",
  "message": "Rate limit exceeded",
  "key": "auth_edge:ip:192.168.1.1",
  "limit": 100
}
```

## Security

### Security Best Practices

1. **Environment Variables**: Never commit secrets to repository
2. **Rate Limiting**: Monitor for unusual patterns indicating attacks
3. **CORS**: Maintain restrictive CORS policies
4. **Logging**: Ensure sensitive data is not logged (tokens are automatically redacted)
5. **Updates**: Keep dependencies updated for security patches

### Security Incident Response

#### Suspected Token Compromise

1. **Immediate Actions**:
   - Check Supabase dashboard for unusual activity
   - Review authentication logs for suspicious patterns
   - Consider temporary rate limit reduction

2. **Investigation**:
   - Trace request patterns by IP and user agent
   - Check for replay attacks or token theft
   - Verify token expiration times

3. **Mitigation**:
   - Revoke compromised tokens in Supabase
   - Update CORS policies if needed
   - Implement additional security measures

#### DDoS or Rate Limit Attacks

1. **Detection**:
   - Monitor for high rate limit hit ratios
   - Check for requests from single IPs or user agents
   - Review error rate spikes

2. **Response**:
   - Verify rate limiting is working correctly
   - Consider reducing rate limits temporarily
   - Block specific IPs if needed (Vercel WAF)

## Performance

### Performance Benchmarks

| Metric | Target | Acceptable | Action Required |
|--------|--------|------------|-----------------|
| Response Time (P95) | < 150ms | < 300ms | > 300ms |
| Error Rate | < 0.5% | < 2% | > 2% |
| Cold Start Time | < 100ms | < 200ms | > 200ms |
| Memory Usage | < 32MB | < 48MB | > 48MB |

### Performance Optimization

#### Edge Runtime Benefits

- **Cold Start**: ~50-100ms vs ~500ms+ for Node.js
- **Memory Usage**: Lower baseline memory consumption
- **Global Distribution**: Automatic edge deployment

#### Optimization Strategies

1. **Minimize Dependencies**: Keep bundle size small
2. **Efficient Supabase Calls**: Use connection pooling and timeouts
3. **Smart Caching**: Cache validation results where appropriate
4. **Request Optimization**: Minimize round trips to Supabase

### Performance Monitoring

#### Key Metrics

```bash
# Vercel CLI performance check
vercel logs --follow

# Monitor specific metrics
# - Function duration
# - Memory usage
# - Cold start frequency
# - Error rates by endpoint
```

## Maintenance

### Regular Maintenance Tasks

#### Weekly
- [ ] Review error logs and rates
- [ ] Check performance metrics
- [ ] Verify health check responses
- [ ] Monitor rate limiting patterns

#### Monthly
- [ ] Update dependencies
- [ ] Review security logs
- [ ] Analyze usage patterns
- [ ] Performance optimization review

#### Quarterly
- [ ] Security audit
- [ ] Dependency vulnerability scan
- [ ] Performance baseline review
- [ ] Documentation updates

### Dependency Updates

```bash
# Check for outdated packages
npm outdated

# Update packages
npm update

# Check for security vulnerabilities
npm audit

# Fix security issues
npm audit fix
```

### Backup and Recovery

#### Configuration Backup

```bash
# Export environment variables
vercel env pull .env.backup

# Backup vercel.json configuration
cp vercel.json vercel.json.backup
```

#### Recovery Procedures

1. **Function Failure**: Redeploy from known good commit
2. **Configuration Issues**: Restore from backup configuration
3. **Performance Degradation**: Rollback to previous deployment
4. **Security Incident**: Follow security incident response procedures

### Documentation Maintenance

Keep this runbook updated with:
- Configuration changes
- New monitoring procedures
- Troubleshooting experiences
- Performance optimization results
- Security incident learnings

## Contact and Escalation

### Support Contacts

- **Development Team**: CE-Hub developers
- **Infrastructure**: Vercel support
- **Backend Services**: Supabase support
- **Security Issues**: Security team escalation

### Escalation Procedures

1. **P1 - Service Down**: Immediate escalation to on-call
2. **P2 - Performance Issues**: 1-hour response time
3. **P3 - Minor Issues**: Next business day response
4. **Security Incidents**: Immediate security team notification

---

*This runbook is maintained by the CE-Hub development team. Last updated: January 2024*