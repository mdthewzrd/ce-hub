/**
 * Test Suite for Trade Matching Algorithm
 *
 * Comprehensive tests for the AI-powered trade matching engine
 * including edge cases and real-world scenarios.
 */

import { describe, test, expect, beforeEach } from '@jest/globals'
import { TradeMatchingEngine } from '../trade-matcher'
import { TraderVueTrade, DOSExecution } from '../../types/enhanced-trade'

describe('TradeMatchingEngine', () => {
  let matchingEngine: TradeMatchingEngine
  let mockTradervueTrade: TraderVueTrade
  let mockDOSExecutions: DOSExecution[]

  beforeEach(() => {
    matchingEngine = new TradeMatchingEngine()

    // Create mock Tradervue trade
    mockTradervueTrade = {
      'Open Datetime': '2024-10-23 09:30:00',
      'Close Datetime': '2024-10-23 15:45:00',
      'Symbol': 'AAPL',
      'Side': 'L',
      'Volume': '1000',
      'Exec Count': '3',
      'Entry Price': '175.50',
      'Exit Price': '178.25',
      'Gross P&L': '2750.00',
      'Gross P&L (%)': '1.57',
      'Shared': 'No',
      'Notes': 'Test trade',
      'Tags': 'momentum',
      'Gross P&L (t)': '2750.00',
      'Net P&L': '2740.00',
      'Commissions': '5.00',
      'Fees': '5.00',
      'Initial Risk': '1000.00',
      'P&L (R)': '2.75R',
      'Position MFE': '3000.00',
      'Position MAE': '-200.00',
      'Price MFE': '179.50',
      'Price MAE': '174.80',
      'Position MFE Datetime': '2024-10-23 14:30:00',
      'Position MAE Datetime': '2024-10-23 10:15:00',
      'Price MFE Datetime': '2024-10-23 14:30:00',
      'Price MAE Datetime': '2024-10-23 10:15:00',
      'Best Exit P&L': '3000.00',
      'Best Exit Datetime': '2024-10-23 14:30:00'
    }

    // Create mock DOS executions
    mockDOSExecutions = [
      {
        id: 'dos_1',
        timestamp: '2024-10-23T09:31:00.000Z',
        symbol: 'AAPL',
        side: 'Buy',
        quantity: 500,
        price: 175.45,
        venue: 'ARCA',
        commission: 2.50,
        fees: 0.50,
        executionId: 'exec_1',
        orderId: 'order_1'
      },
      {
        id: 'dos_2',
        timestamp: '2024-10-23T09:32:00.000Z',
        symbol: 'AAPL',
        side: 'Buy',
        quantity: 500,
        price: 175.55,
        venue: 'NASDAQ',
        commission: 2.50,
        fees: 0.50,
        executionId: 'exec_2',
        orderId: 'order_1'
      },
      {
        id: 'dos_3',
        timestamp: '2024-10-23T15:44:00.000Z',
        symbol: 'AAPL',
        side: 'Sell',
        quantity: 1000,
        price: 178.25,
        venue: 'NYSE',
        commission: 5.00,
        fees: 0.00,
        executionId: 'exec_3',
        orderId: 'order_2'
      }
    ]
  })

  describe('Single Trade Matching', () => {
    test('should successfully match perfect trade scenario', () => {
      const result = matchingEngine.matchTrade(mockTradervueTrade, mockDOSExecutions)

      expect(result.matchScore).toBeGreaterThan(0.8)
      expect(result.enhancedTrade).toBeDefined()
      expect(result.enhancedTrade.executions.entries).toHaveLength(2)
      expect(result.enhancedTrade.executions.exits).toHaveLength(1)
      expect(result.errors).toHaveLength(0)
    })

    test('should handle symbol mismatch', () => {
      const mismatchedExecutions = mockDOSExecutions.map(exec => ({
        ...exec,
        symbol: 'TSLA'
      }))

      const result = matchingEngine.matchTrade(mockTradervueTrade, mismatchedExecutions)

      expect(result.matchScore).toBe(0)
      expect(result.dosExecutions).toHaveLength(0)
      expect(result.warnings).toContain('No suitable DOS execution match found')
    })

    test('should handle time window mismatches', () => {
      const timeShiftedExecutions = mockDOSExecutions.map(exec => ({
        ...exec,
        timestamp: '2024-10-24T09:30:00.000Z' // Next day
      }))

      const result = matchingEngine.matchTrade(mockTradervueTrade, timeShiftedExecutions)

      expect(result.matchScore).toBe(0)
    })

    test('should handle quantity discrepancies', () => {
      const quantityMismatchExecutions = mockDOSExecutions.map(exec => ({
        ...exec,
        quantity: exec.quantity * 2 // Double the quantities
      }))

      const result = matchingEngine.matchTrade(mockTradervueTrade, quantityMismatchExecutions)

      expect(result.matchScore).toBeLessThan(0.8)
      expect(result.warnings.length).toBeGreaterThan(0)
    })

    test('should handle partial executions correctly', () => {
      const partialExecutions = [
        {
          ...mockDOSExecutions[0],
          quantity: 300
        },
        {
          ...mockDOSExecutions[1],
          quantity: 700
        },
        mockDOSExecutions[2]
      ]

      const result = matchingEngine.matchTrade(mockTradervueTrade, partialExecutions)

      expect(result.matchScore).toBeGreaterThan(0.7)
      expect(result.enhancedTrade.executions.entries).toHaveLength(2)
    })

    test('should calculate execution statistics correctly', () => {
      const result = matchingEngine.matchTrade(mockTradervueTrade, mockDOSExecutions)

      expect(result.enhancedTrade.executionStats.totalExecutions).toBe(3)
      expect(result.enhancedTrade.executionStats.vwapEntry).toBeCloseTo(175.5, 2)
      expect(result.enhancedTrade.executionStats.vwapExit).toBeCloseTo(178.25, 2)
      expect(result.enhancedTrade.executionStats.venueDistribution).toEqual({
        'ARCA': 1,
        'NASDAQ': 1,
        'NYSE': 1
      })
    })
  })

  describe('Batch Processing', () => {
    test('should process multiple trades in batch', async () => {
      const multipleTrades = [mockTradervueTrade]
      const result = await matchingEngine.processTradesBatch(multipleTrades, mockDOSExecutions)

      expect(result.processed).toBe(1)
      expect(result.matched).toBe(1)
      expect(result.unmatched).toBe(0)
      expect(result.enhancedTrades).toHaveLength(1)
    })

    test('should handle unmatched trades correctly', async () => {
      const unmatchableTrade = {
        ...mockTradervueTrade,
        'Symbol': 'NONEXISTENT'
      }

      const result = await matchingEngine.processTradesBatch([unmatchableTrade], mockDOSExecutions)

      expect(result.processed).toBe(1)
      expect(result.matched).toBe(0)
      expect(result.unmatched).toBe(1)
      expect(result.unmatchedTradervue).toHaveLength(1)
    })

    test('should track processing statistics', async () => {
      const result = await matchingEngine.processTradesBatch([mockTradervueTrade], mockDOSExecutions)

      expect(result.processingStats.startTime).toBeDefined()
      expect(result.processingStats.endTime).toBeDefined()
      expect(result.processingStats.duration).toBeGreaterThan(0)
      expect(result.processingStats.averageMatchScore).toBeGreaterThan(0)
    })
  })

  describe('Edge Cases', () => {
    test('should handle empty input data', () => {
      const result = matchingEngine.matchTrade(mockTradervueTrade, [])

      expect(result.matchScore).toBe(0)
      expect(result.dosExecutions).toHaveLength(0)
    })

    test('should handle malformed trade data', () => {
      const malformedTrade = {
        ...mockTradervueTrade,
        'Volume': 'invalid',
        'Entry Price': '',
        'Open Datetime': 'invalid-date'
      }

      const result = matchingEngine.matchTrade(malformedTrade, mockDOSExecutions)

      expect(result.matchScore).toBeLessThan(0.5)
      expect(result.warnings.length).toBeGreaterThan(0)
    })

    test('should handle short trade matching', () => {
      const shortTrade = {
        ...mockTradervueTrade,
        'Side': 'S',
        'Entry Price': '175.50',
        'Exit Price': '172.25'
      }

      const shortExecutions = [
        {
          ...mockDOSExecutions[0],
          side: 'Sell',
          price: 175.50
        },
        {
          ...mockDOSExecutions[1],
          side: 'Sell',
          price: 175.50
        },
        {
          ...mockDOSExecutions[2],
          side: 'Buy',
          price: 172.25
        }
      ]

      const result = matchingEngine.matchTrade(shortTrade, shortExecutions)

      expect(result.matchScore).toBeGreaterThan(0.7)
      expect(result.enhancedTrade.side).toBe('Short')
    })

    test('should handle options symbols correctly', () => {
      const optionsTrade = {
        ...mockTradervueTrade,
        'Symbol': 'AAPL240315C00180000'
      }

      const optionsExecutions = mockDOSExecutions.map(exec => ({
        ...exec,
        symbol: 'AAPL240315C00180000'
      }))

      const result = matchingEngine.matchTrade(optionsTrade, optionsExecutions)

      expect(result.matchScore).toBeGreaterThan(0.8)
    })

    test('should handle multi-day trades', () => {
      const multiDayTrade = {
        ...mockTradervueTrade,
        'Open Datetime': '2024-10-23 15:30:00',
        'Close Datetime': '2024-10-24 10:30:00'
      }

      const multiDayExecutions = [
        {
          ...mockDOSExecutions[0],
          timestamp: '2024-10-23T15:31:00.000Z'
        },
        {
          ...mockDOSExecutions[1],
          timestamp: '2024-10-23T15:32:00.000Z'
        },
        {
          ...mockDOSExecutions[2],
          timestamp: '2024-10-24T10:31:00.000Z'
        }
      ]

      const result = matchingEngine.matchTrade(multiDayTrade, multiDayExecutions)

      expect(result.matchScore).toBeGreaterThan(0.7)
    })
  })

  describe('Quality Scoring', () => {
    test('should penalize large price discrepancies', () => {
      const priceDiscrepancyExecutions = mockDOSExecutions.map(exec => ({
        ...exec,
        price: exec.price * 1.1 // 10% price difference
      }))

      const result = matchingEngine.matchTrade(mockTradervueTrade, priceDiscrepancyExecutions)

      expect(result.matchScore).toBeLessThan(0.9)
    })

    test('should reward exact matches', () => {
      // Perfect match scenario
      const result = matchingEngine.matchTrade(mockTradervueTrade, mockDOSExecutions)

      expect(result.matchScore).toBeGreaterThan(0.9)
      expect(result.enhancedTrade.matchingInfo.confidence).toBeGreaterThan(0.9)
    })

    test('should handle time proximity correctly', () => {
      const closeTimeExecutions = mockDOSExecutions.map((exec, index) => ({
        ...exec,
        timestamp: index < 2
          ? '2024-10-23T09:31:00.000Z' // Close to entry time
          : '2024-10-23T15:45:00.000Z' // Close to exit time
      }))

      const result = matchingEngine.matchTrade(mockTradervueTrade, closeTimeExecutions)

      expect(result.matchScore).toBeGreaterThan(0.8)
    })
  })

  describe('Performance Tests', () => {
    test('should process large batches efficiently', async () => {
      const largeTradeBatch = Array(100).fill(mockTradervueTrade).map((trade, index) => ({
        ...trade,
        'Symbol': `TEST${index}`,
        'Open Datetime': `2024-10-${23 + (index % 7)} 09:30:00`
      }))

      const largeExecutionBatch = Array(300).fill(null).map((_, index) => ({
        ...mockDOSExecutions[index % 3],
        id: `dos_${index}`,
        executionId: `exec_${index}`,
        symbol: `TEST${Math.floor(index / 3)}`,
        timestamp: `2024-10-${23 + (Math.floor(index / 3) % 7)}T09:3${index % 6}:00.000Z`
      }))

      const startTime = Date.now()
      const result = await matchingEngine.processTradesBatch(largeTradeBatch, largeExecutionBatch)
      const processingTime = Date.now() - startTime

      expect(processingTime).toBeLessThan(5000) // Should complete in under 5 seconds
      expect(result.processed).toBe(100)
      expect(result.processingStats.duration).toBeLessThan(5000)
    }, 10000) // 10 second timeout

    test('should handle memory efficiently with large datasets', async () => {
      const initialMemory = process.memoryUsage().heapUsed

      // Create a reasonably large dataset
      const largeTradeBatch = Array(500).fill(mockTradervueTrade)
      const largeExecutionBatch = Array(1500).fill(mockDOSExecutions[0])

      await matchingEngine.processTradesBatch(largeTradeBatch, largeExecutionBatch)

      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory

      // Memory increase should be reasonable (less than 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024)
    }, 15000) // 15 second timeout
  })

  describe('Configuration Tests', () => {
    test('should respect custom matching configuration', () => {
      const strictEngine = new TradeMatchingEngine({
        minMatchScore: 0.95,
        quantityTolerance: 0.01,
        priceTolerance: 0.005
      })

      const slightlyOffExecutions = mockDOSExecutions.map(exec => ({
        ...exec,
        quantity: exec.quantity * 1.02 // 2% off
      }))

      const result = strictEngine.matchTrade(mockTradervueTrade, slightlyOffExecutions)

      expect(result.matchScore).toBeLessThan(0.95)
    })

    test('should handle loose matching configuration', () => {
      const looseEngine = new TradeMatchingEngine({
        minMatchScore: 0.5,
        quantityTolerance: 0.2,
        priceTolerance: 0.1,
        timeWindowMinutes: 120
      })

      const veryOffExecutions = mockDOSExecutions.map(exec => ({
        ...exec,
        quantity: exec.quantity * 1.15, // 15% off
        price: exec.price * 1.05 // 5% off
      }))

      const result = looseEngine.matchTrade(mockTradervueTrade, veryOffExecutions)

      expect(result.matchScore).toBeGreaterThan(0.5)
    })
  })
})

// Helper functions for testing
export function createMockTradervueTrade(overrides: Partial<TraderVueTrade> = {}): TraderVueTrade {
  return {
    'Open Datetime': '2024-10-23 09:30:00',
    'Close Datetime': '2024-10-23 15:45:00',
    'Symbol': 'AAPL',
    'Side': 'L',
    'Volume': '1000',
    'Exec Count': '2',
    'Entry Price': '175.50',
    'Exit Price': '178.25',
    'Gross P&L': '2750.00',
    'Gross P&L (%)': '1.57',
    'Shared': 'No',
    'Notes': '',
    'Tags': '',
    'Gross P&L (t)': '2750.00',
    'Net P&L': '2740.00',
    'Commissions': '10.00',
    'Fees': '0.00',
    'Initial Risk': '1000.00',
    'P&L (R)': '2.75R',
    'Position MFE': '3000.00',
    'Position MAE': '-200.00',
    'Price MFE': '179.50',
    'Price MAE': '174.80',
    'Position MFE Datetime': '2024-10-23 14:30:00',
    'Position MAE Datetime': '2024-10-23 10:15:00',
    'Price MFE Datetime': '2024-10-23 14:30:00',
    'Price MAE Datetime': '2024-10-23 10:15:00',
    'Best Exit P&L': '3000.00',
    'Best Exit Datetime': '2024-10-23 14:30:00',
    ...overrides
  }
}

export function createMockDOSExecution(overrides: Partial<DOSExecution> = {}): DOSExecution {
  return {
    id: 'dos_test',
    timestamp: '2024-10-23T09:31:00.000Z',
    symbol: 'AAPL',
    side: 'Buy',
    quantity: 1000,
    price: 175.50,
    venue: 'ARCA',
    commission: 5.00,
    fees: 0.00,
    executionId: 'exec_test',
    ...overrides
  }
}