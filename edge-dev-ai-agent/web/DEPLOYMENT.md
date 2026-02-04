# EdgeDev AI Agent - Deployment Guide

## Prerequisites

- Node.js 18+ installed
- Python 3.13+ installed
- OpenRouter API key
- EdgeDev API access (port 5665)

## Environment Setup

### 1. Set up environment variables

Copy the appropriate environment file:

```bash
# For development
cp .env.development.example .env.development

# For production
cp .env.production.example .env.production
```

Edit the file and add your API keys:

```env
OPENROUTER_API_KEY=your_actual_api_key_here
NEXT_PUBLIC_BACKEND_URL=http://localhost:7447
NEXT_PUBLIC_EDGEDEV_URL=http://localhost:5665
```

### 2. Install dependencies

```bash
npm install --legacy-peer-deps
```

## Development

### Start Development Server

```bash
npm run dev
```

The frontend will be available at http://localhost:7446

### Start Backend Server

```bash
cd ..
source /Users/michaeldurante/.venv/bin/activate
python -m uvicorn src.main:app --host 0.0.0.0 --port 7447 --reload
```

The backend will be available at http://localhost:7447

## Production Build

### 1. Build for Production

```bash
chmod +x build-production.sh
./build-production.sh
```

Or manually:

```bash
npm run build
```

### 2. Test Production Build Locally

```bash
npm run start
```

The production server will run at http://localhost:3000

### 3. Deploy to Vercel

Install Vercel CLI:

```bash
npm install -g vercel
```

Deploy:

```bash
vercel --prod
```

## Environment Variables in Production

Set these in your hosting platform (Vercel, Netlify, etc.):

```
OPENROUTER_API_KEY=your_actual_api_key
NEXT_PUBLIC_BACKEND_URL=https://your-backend-domain.com
NEXT_PUBLIC_EDGEDEV_URL=https://your-edgedev-domain.com
NEXT_PUBLIC_APP_ENV=production
```

## Health Checks

### Frontend Health

```bash
curl http://localhost:7446
```

### Backend Health

```bash
curl http://localhost:7447/health
```

### API Test

```bash
curl -X POST http://localhost:7447/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"health check"}'
```

## Troubleshooting

### Build Errors

If you encounter build errors:

1. Clear Next.js cache:
```bash
rm -rf .next
npm run build
```

2. Clear node_modules and reinstall:
```bash
rm -rf node_modules
npm install --legacy-peer-deps
```

### API Connection Errors

1. Verify backend is running on port 7447
2. Check firewall settings
3. Verify CORS configuration
4. Check API keys in environment variables

### Missing Components

If components are missing:

1. Check all imports are correct
2. Verify component files exist
3. Check for TypeScript errors

## Monitoring

### Production Monitoring

Enable monitoring in production by setting:

```env
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_ERROR_TRACKING=true
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true
```

### Log Files

- Frontend logs: Check browser console
- Backend logs: `/tmp/backend_venv.log`

## Performance Optimization

### Build Optimization

The production build includes:

- Automatic code splitting
- Tree shaking
- Asset optimization
- CSS minification
- Image optimization

### Bundle Analysis

Analyze bundle size:

```bash
npm run build
npm run analyze
```

## Security

### API Key Security

- Never commit `.env` files
- Use environment variables in production
- Rotate API keys regularly
- Use different keys for dev/prod

### CORS Configuration

Update allowed origins in your hosting platform:

```
NEXT_PUBLIC_ALLOWED_ORIGINS=https://yourdomain.com
```

## Support

For issues or questions:

1. Check the logs
2. Verify environment variables
3. Check API status
4. Review documentation
