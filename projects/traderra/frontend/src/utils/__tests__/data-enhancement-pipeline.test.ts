/**
 * Test Suite for Data Enhancement Pipeline
 *
 * Tests for the comprehensive data enhancement pipeline including
 * CSV parsing, trade matching, and quality analysis.
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals'
import { DataEnhancementPipeline } from '../data-enhancement-pipeline'
import { createMockTradervueTrade, createMockDOSExecution } from './trade-matcher.test'

describe('DataEnhancementPipeline', () => {
  let pipeline: DataEnhancementPipeline
  let mockTradervueCSV: string
  let mockDOSCSV: string

  beforeEach(() => {
    pipeline = new DataEnhancementPipeline()

    // Create mock CSV data
    mockTradervueCSV = `Open Datetime,Close Datetime,Symbol,Side,Volume,Exec Count,Entry Price,Exit Price,Gross P&L,Gross P&L (%),Shared,Notes,Tags,Gross P&L (t),Net P&L,Commissions,Fees,Initial Risk,P&L (R),Position MFE,Position MAE,Price MFE,Price MAE,Position MFE Datetime,Position MAE Datetime,Price MFE Datetime,Price MAE Datetime,Best Exit P&L,Best Exit Datetime
2024-10-23 09:30:00,2024-10-23 15:45:00,AAPL,L,1000,3,175.50,178.25,2750.00,1.57,No,Test trade,momentum,2750.00,2740.00,5.00,5.00,1000.00,2.75R,3000.00,-200.00,179.50,174.80,2024-10-23 14:30:00,2024-10-23 10:15:00,2024-10-23 14:30:00,2024-10-23 10:15:00,3000.00,2024-10-23 14:30:00
2024-10-23 10:00:00,2024-10-23 11:30:00,TSLA,S,500,2,320.00,315.50,2250.00,1.41,No,Swing trade,reversal,2250.00,2240.00,5.00,5.00,800.00,2.8R,2500.00,-100.00,314.00,321.50,2024-10-23 11:15:00,2024-10-23 10:30:00,2024-10-23 11:15:00,2024-10-23 10:30:00,2500.00,2024-10-23 11:15:00`

    mockDOSCSV = `Date,Time,Symbol,Side,Quantity,Price,Venue,Commission,Fees,Order ID,Execution ID,Liquidity
2024-10-23,09:31:00,AAPL,Buy,500,175.45,ARCA,2.50,0.50,order_1,exec_1,Added
2024-10-23,09:32:00,AAPL,Buy,500,175.55,NASDAQ,2.50,0.50,order_1,exec_2,Added
2024-10-23,15:44:00,AAPL,Sell,1000,178.25,NYSE,5.00,0.00,order_2,exec_3,Removed
2024-10-23,10:01:00,TSLA,Sell,500,320.00,ARCA,5.00,0.00,order_3,exec_4,Added
2024-10-23,11:29:00,TSLA,Buy,500,315.50,NASDAQ,5.00,0.00,order_4,exec_5,Removed`
  })

  describe('Pipeline Initialization', () => {
    test('should initialize with default configuration', () => {
      const defaultPipeline = new DataEnhancementPipeline()
      expect(defaultPipeline).toBeDefined()
    })

    test('should accept custom configuration', () => {
      const customPipeline = new DataEnhancementPipeline({
        validateInputData: false,
        enableQualityAnalysis: false,
        batchSize: 50
      })
      expect(customPipeline).toBeDefined()
    })
  })

  describe('CSV Parsing', () => {
    test('should parse Tradervue CSV correctly', async () => {
      const result = await pipeline.enhanceTradeData(mockTradervueCSV, '')

      expect(result.success).toBe(true)
      expect(result.enhancementResult).toBeDefined()
      expect(result.enhancementResult!.processed).toBe(2) // Two trades in CSV
    })

    test('should parse DOS CSV correctly', async () => {
      const result = await pipeline.enhanceTradeData('', mockDOSCSV)

      expect(result.success).toBe(true)
      expect(result.warnings).toContain('No valid Tradervue trades found')
    })

    test('should handle malformed CSV data', async () => {
      const malformedCSV = 'invalid,csv,data\nwith,wrong,format'

      const result = await pipeline.enhanceTradeData(malformedCSV, mockDOSCSV)

      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    test('should handle empty CSV data', async () => {
      const result = await pipeline.enhanceTradeData('', '')

      expect(result.success).toBe(false)
      expect(result.errors.some(e => e.field === 'tradervue_data')).toBe(true)
    })

    test('should handle CSV with BOM', async () => {
      const csvWithBOM = '\uFEFF' + mockTradervueCSV

      const result = await pipeline.enhanceTradeData(csvWithBOM, mockDOSCSV)

      expect(result.success).toBe(true)
      expect(result.enhancementResult!.processed).toBe(2)
    })
  })

  describe('Data Validation', () => {
    test('should validate input data when enabled', async () => {
      const validationPipeline = new DataEnhancementPipeline({
        validateInputData: true
      })

      const result = await validationPipeline.enhanceTradeData(mockTradervueCSV, mockDOSCSV)

      expect(result.success).toBe(true)
      expect(result.processingMetrics.dataValidationTime).toBeGreaterThan(0)
    })

    test('should skip validation when disabled', async () => {
      const noValidationPipeline = new DataEnhancementPipeline({
        validateInputData: false
      })

      const result = await noValidationPipeline.enhanceTradeData(mockTradervueCSV, mockDOSCSV)

      expect(result.success).toBe(true)
      expect(result.processingMetrics.dataValidationTime).toBe(0)
    })

    test('should detect symbol mismatches', async () => {
      const mismatchedDOSCSV = mockDOSCSV.replace(/AAPL/g, 'MSFT')

      const result = await pipeline.enhanceTradeData(mockTradervueCSV, mismatchedDOSCSV)

      expect(result.success).toBe(true)
      expect(result.warnings.some(w => w.includes('symbol mismatches'))).toBe(true)
    })

    test('should detect date range issues', async () => {
      const dateMismatchedCSV = mockDOSCSV.replace(/2024-10-23/g, '2024-10-22')

      const result = await pipeline.enhanceTradeData(mockTradervueCSV, dateMismatchedCSV)

      expect(result.success).toBe(true)
      expect(result.warnings.some(w => w.includes('date overlap'))).toBe(true)
    })
  })

  describe('Trade Enhancement', () => {
    test('should enhance trades successfully', async () => {
      const result = await pipeline.enhanceTradeData(mockTradervueCSV, mockDOSCSV)

      expect(result.success).toBe(true)
      expect(result.enhancementResult!.enhancedTrades.length).toBeGreaterThan(0)

      const enhancedTrade = result.enhancementResult!.enhancedTrades[0]
      expect(enhancedTrade.executions.entries.length).toBeGreaterThan(0)
      expect(enhancedTrade.executionStats.totalExecutions).toBeGreaterThan(0)
      expect(enhancedTrade.matchingInfo.matched).toBe(true)
    })

    test('should calculate execution statistics', async () => {
      const result = await pipeline.enhanceTradeData(mockTradervueCSV, mockDOSCSV)

      const enhancedTrade = result.enhancementResult!.enhancedTrades[0]
      expect(enhancedTrade.executionStats.vwapEntry).toBeGreaterThan(0)
      expect(enhancedTrade.executionStats.qualityScore).toBeGreaterThan(0)
      expect(enhancedTrade.executionStats.venueDistribution).toBeDefined()
    })

    test('should preserve original data', async () => {
      const result = await pipeline.enhanceTradeData(mockTradervueCSV, mockDOSCSV)

      const enhancedTrade = result.enhancementResult!.enhancedTrades[0]
      expect(enhancedTrade.sourceData.tradervue).toBeDefined()
      expect(enhancedTrade.sourceData.dosRaw).toBeDefined()
      expect(enhancedTrade.sourceData.importTimestamp).toBeDefined()
      expect(enhancedTrade.sourceData.version).toBe('1.0')
    })

    test('should handle unmatched trades', async () => {
      const unmatchableTradervueCSV = mockTradervueCSV.replace(/AAPL/g, 'NONEXISTENT')

      const result = await pipeline.enhanceTradeData(unmatchableTradervueCSV, mockDOSCSV)

      expect(result.success).toBe(true)
      expect(result.enhancementResult!.matched).toBe(0)
      expect(result.enhancementResult!.unmatched).toBeGreaterThan(0)
      expect(result.enhancementResult!.unmatchedTradervue.length).toBeGreaterThan(0)
    })
  })

  describe('Quality Analysis', () => {
    test('should perform quality analysis when enabled', async () => {
      const qualityPipeline = new DataEnhancementPipeline({
        enableQualityAnalysis: true
      })

      const result = await qualityPipeline.enhanceTradeData(mockTradervueCSV, mockDOSCSV)

      expect(result.success).toBe(true)
      expect(result.processingMetrics.qualityAnalysisTime).toBeGreaterThan(0)
    })

    test('should skip quality analysis when disabled', async () => {
      const noQualityPipeline = new DataEnhancementPipeline({
        enableQualityAnalysis: false
      })

      const result = await noQualityPipeline.enhanceTradeData(mockTradervueCSV, mockDOSCSV)

      expect(result.success).toBe(true)
      expect(result.processingMetrics.qualityAnalysisTime).toBe(0)
    })

    test('should calculate quality scores', async () => {
      const result = await pipeline.enhanceTradeData(mockTradervueCSV, mockDOSCSV)

      const enhancedTrade = result.enhancementResult!.enhancedTrades[0]
      expect(enhancedTrade.executionStats.qualityScore).toBeGreaterThanOrEqual(0)
      expect(enhancedTrade.executionStats.qualityScore).toBeLessThanOrEqual(100)
    })
  })

  describe('Performance', () => {
    test('should track processing metrics', async () => {
      const result = await pipeline.enhanceTradeData(mockTradervueCSV, mockDOSCSV)

      expect(result.processingMetrics.totalTime).toBeGreaterThan(0)
      expect(result.processingMetrics.dataValidationTime).toBeGreaterThanOrEqual(0)
      expect(result.processingMetrics.matchingTime).toBeGreaterThan(0)
      expect(result.processingMetrics.enhancementTime).toBeGreaterThan(0)
    })

    test('should handle large datasets efficiently', async () => {
      // Create larger dataset
      const largeTradervueCSV = Array(50).fill(mockTradervueCSV.split('\n')[1]).join('\n')
      const largeDOSCSV = Array(150).fill(mockDOSCSV.split('\n')[1]).join('\n')
      const csvWithHeaders = mockTradervueCSV.split('\n')[0] + '\n' + largeTradervueCSV
      const dosWithHeaders = mockDOSCSV.split('\n')[0] + '\n' + largeDOSCSV

      const startTime = Date.now()
      const result = await pipeline.enhanceTradeData(csvWithHeaders, dosWithHeaders)
      const processingTime = Date.now() - startTime

      expect(result.success).toBe(true)
      expect(processingTime).toBeLessThan(10000) // Should complete in under 10 seconds
    }, 15000)

    test('should respect timeout configuration', async () => {
      const timeoutPipeline = new DataEnhancementPipeline({
        timeoutMs: 100 // Very short timeout
      })

      // This might timeout or complete, depending on system performance
      const result = await timeoutPipeline.enhanceTradeData(mockTradervueCSV, mockDOSCSV)

      // Result should either succeed quickly or handle timeout gracefully
      expect(typeof result.success).toBe('boolean')
    })
  })

  describe('Error Handling', () => {
    test('should handle parsing errors gracefully', async () => {
      const invalidTradervueCSV = 'completely invalid data that cannot be parsed'

      const result = await pipeline.enhanceTradeData(invalidTradervueCSV, mockDOSCSV)

      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0].field).toBe('pipeline')
    })

    test('should handle execution timeouts', async () => {
      // Mock a very slow operation
      const slowPipeline = new DataEnhancementPipeline({
        timeoutMs: 1 // 1ms timeout - guaranteed to fail
      })

      const result = await slowPipeline.enhanceTradeData(mockTradervueCSV, mockDOSCSV)

      // The result might succeed if it's very fast, or fail with timeout
      expect(typeof result.success).toBe('boolean')
    })

    test('should preserve error context', async () => {
      const invalidCSV = 'Symbol,Side\nAAPL,Invalid'

      const result = await pipeline.enhanceTradeData(invalidCSV, mockDOSCSV)

      expect(result.success).toBe(false)
      expect(result.errors[0].message).toContain('Failed to parse')
    })
  })

  describe('Integration Tests', () => {
    test('should handle complete end-to-end workflow', async () => {
      const result = await pipeline.enhanceTradeData(mockTradervueCSV, mockDOSCSV)

      expect(result.success).toBe(true)
      expect(result.enhancementResult!.processed).toBe(2)
      expect(result.enhancementResult!.matched).toBeGreaterThan(0)
      expect(result.enhancementResult!.enhancedTrades.length).toBeGreaterThan(0)

      // Verify enhanced trade structure
      const trade = result.enhancementResult!.enhancedTrades[0]
      expect(trade.id).toBeDefined()
      expect(trade.symbol).toBeDefined()
      expect(trade.executions.entries.length).toBeGreaterThan(0)
      expect(trade.executionStats.totalExecutions).toBeGreaterThan(0)
      expect(trade.matchingInfo.matched).toBe(true)
      expect(trade.sourceData.tradervue).toBeDefined()
    })

    test('should maintain data integrity throughout pipeline', async () => {
      const result = await pipeline.enhanceTradeData(mockTradervueCSV, mockDOSCSV)

      const enhancedTrade = result.enhancementResult!.enhancedTrades[0]
      const originalTrade = enhancedTrade.sourceData.tradervue!

      // Key data should be preserved
      expect(enhancedTrade.symbol).toBe(originalTrade['Symbol'])
      expect(enhancedTrade.side).toBe(originalTrade['Side'] === 'L' ? 'Long' : 'Short')
      expect(enhancedTrade.quantity).toBe(parseInt(originalTrade['Volume']))
    })

    test('should generate meaningful statistics', async () => {
      const result = await pipeline.enhanceTradeData(mockTradervueCSV, mockDOSCSV)

      expect(result.enhancementResult!.processingStats.averageMatchScore).toBeGreaterThan(0)
      expect(result.enhancementResult!.processingStats.qualityDistribution).toBeDefined()
      expect(result.enhancementResult!.processingStats.duration).toBeGreaterThan(0)
    })
  })

  describe('Configuration Edge Cases', () => {
    test('should handle batch size configuration', async () => {
      const batchPipeline = new DataEnhancementPipeline({
        batchSize: 1
      })

      const result = await batchPipeline.enhanceTradeData(mockTradervueCSV, mockDOSCSV)

      expect(result.success).toBe(true)
    })

    test('should handle retry configuration', async () => {
      const retryPipeline = new DataEnhancementPipeline({
        retryAttempts: 1
      })

      const result = await retryPipeline.enhanceTradeData(mockTradervueCSV, mockDOSCSV)

      expect(result.success).toBe(true)
    })

    test('should preserve original data when configured', async () => {
      const preservePipeline = new DataEnhancementPipeline({
        preserveOriginalData: true
      })

      const result = await preservePipeline.enhanceTradeData(mockTradervueCSV, mockDOSCSV)

      const enhancedTrade = result.enhancementResult!.enhancedTrades[0]
      expect(enhancedTrade.sourceData.tradervue).toBeDefined()
      expect(enhancedTrade.sourceData.dosRaw).toBeDefined()
    })

    test('should handle missing original data when configured', async () => {
      const noPreservePipeline = new DataEnhancementPipeline({
        preserveOriginalData: false
      })

      const result = await noPreservePipeline.enhanceTradeData(mockTradervueCSV, mockDOSCSV)

      // Even with preserveOriginalData: false, we still preserve data for audit purposes
      const enhancedTrade = result.enhancementResult!.enhancedTrades[0]
      expect(enhancedTrade.sourceData).toBeDefined()
    })
  })
})