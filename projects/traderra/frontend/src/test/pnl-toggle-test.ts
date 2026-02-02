// Simple test to validate P&L toggle functionality
import { getPnLValue, calculateGrossPnL, calculateNetPnL } from '../utils/trade-statistics'

// Mock trade data for testing
const mockTrade = {
  id: 'test-1',
  date: '2024-01-01',
  symbol: 'AAPL',
  side: 'Long' as const,
  quantity: 100,
  entryPrice: 150.00,
  exitPrice: 155.00,
  pnl: 490.00, // Net P&L after $10 commission
  pnlPercent: 3.33,
  commission: 10.00, // $10 commission
  duration: '02:30:00',
  strategy: 'Test',
  notes: 'Test trade',
  entryTime: '2024-01-01T09:30:00',
  exitTime: '2024-01-01T12:00:00'
}

// Test calculations
console.log('🧪 Testing P&L calculations...')

const netPnL = calculateNetPnL(mockTrade)
const grossPnL = calculateGrossPnL(mockTrade)

console.log(`Net P&L: $${netPnL}`) // Should be $490.00
console.log(`Gross P&L: $${grossPnL}`) // Should be $500.00 ($490 + $10 commission)

const netModeValue = getPnLValue(mockTrade, 'net')
const grossModeValue = getPnLValue(mockTrade, 'gross')

console.log(`Net mode value: $${netModeValue}`) // Should be $490.00
console.log(`Gross mode value: $${grossModeValue}`) // Should be $500.00

// Validate calculations
const testsPass =
  netPnL === 490 &&
  grossPnL === 500 &&
  netModeValue === 490 &&
  grossModeValue === 500

console.log(`✅ All tests ${testsPass ? 'PASSED' : 'FAILED'}`)

if (testsPass) {
  console.log('🎉 P&L toggle calculations are working correctly!')
  console.log('📊 Net P&L shows trade profit after commissions')
  console.log('📈 Gross P&L shows trade profit before commissions')
} else {
  console.log('❌ Some tests failed, check calculations')
}

export { testsPass }