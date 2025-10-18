#!/usr/bin/env node

// Test script to verify API connectivity and Co-PilotKit integration
// Run with: node test-api.js

const fetch = require('node-fetch')

const API_BASE_URL = 'http://localhost:6500'
const FRONTEND_URL = 'http://localhost:6565'

async function testEndpoint(url, description, options = {}) {
  console.log(`\n🧪 Testing: ${description}`)
  console.log(`   URL: ${url}`)

  try {
    const response = await fetch(url, {
      timeout: 5000,
      ...options,
    })

    const status = response.status
    const data = await response.text()

    console.log(`   ✅ Status: ${status}`)
    if (data.length < 500) {
      console.log(`   📄 Response: ${data}`)
    } else {
      console.log(`   📄 Response: ${data.slice(0, 200)}...`)
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`)
  }
}

async function runTests() {
  console.log('🚀 Traderra API Integration Test')
  console.log('================================')

  // Test backend health
  await testEndpoint(`${API_BASE_URL}/health`, 'Backend Health Check')

  // Test backend debug endpoints
  await testEndpoint(`${API_BASE_URL}/debug/status`, 'Backend Status')
  await testEndpoint(`${API_BASE_URL}/debug/archon`, 'Archon Connection')

  // Test API endpoints
  await testEndpoint(`${API_BASE_URL}/api/performance/metrics`, 'Performance Metrics')

  // Test Renata AI endpoints
  await testEndpoint(`${API_BASE_URL}/api/ai/renata/chat`, 'Renata Chat (POST)', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'How is my performance?',
      mode: 'coach',
      performance_data: {
        totalPnL: 1000,
        winRate: 0.6,
        expectancy: 0.5,
        profitFactor: 1.2,
        maxDrawdown: -0.1,
        totalTrades: 10,
        avgWinner: 100,
        avgLoser: -50,
      },
      trading_context: {
        timeRange: 'week',
        activeFilters: ['all'],
      },
    }),
  })

  // Test Archon endpoints
  await testEndpoint(`${API_BASE_URL}/api/archon/sources`, 'Archon Knowledge Sources')

  // Test frontend Co-PilotKit endpoint
  await testEndpoint(`${FRONTEND_URL}/api/copilotkit`, 'Frontend Co-PilotKit Endpoint (GET)')

  console.log('\n🎯 Test Summary')
  console.log('===============')
  console.log('Backend should be running on port 6500')
  console.log('Frontend should be running on port 6565')
  console.log('Archon MCP should be running on port 8051')
  console.log('')
  console.log('To start the services:')
  console.log('1. Backend: cd backend && uvicorn app.main:app --host 0.0.0.0 --port 6500 --reload')
  console.log('2. Frontend: cd frontend && npm run dev -- --port 6565')
  console.log('3. Archon: Follow CE-Hub setup instructions')
}

runTests().catch(console.error)