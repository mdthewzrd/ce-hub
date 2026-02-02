/**
 * Test Suite for Validation and Audit Tools
 *
 * Comprehensive tests for validation engine and audit tools
 * including compliance checks and data quality analysis.
 */

import { describe, test, expect, beforeEach } from '@jest/globals'
import { ValidationAuditEngine, validationAuditEngine } from '../validation-audit-tools'
import { EnhancedTrade, TradeEnhancementResult } from '../../types/enhanced-trade'
import { createMockTradervueTrade, createMockDOSExecution } from './trade-matcher.test'

describe('ValidationAuditEngine', () => {
  let auditEngine: ValidationAuditEngine
  let mockEnhancedTrade: EnhancedTrade
  let mockEnhancementResult: TradeEnhancementResult

  beforeEach(() => {
    auditEngine = new ValidationAuditEngine()

    // Create mock enhanced trade
    mockEnhancedTrade = {
      id: 'enhanced_test_1',
      date: '2024-10-23',
      symbol: 'AAPL',
      side: 'Long',
      quantity: 1000,
      entryPrice: 175.50,
      exitPrice: 178.25,
      pnl: 2750.00,
      pnlPercent: 1.57,
      commission: 10.00,
      duration: '06:15:00',
      strategy: 'momentum',
      notes: 'Test trade',
      entryTime: '2024-10-23T09:30:00.000Z',
      exitTime: '2024-10-23T15:45:00.000Z',
      riskAmount: 1000.00,
      rMultiple: 2.75,

      executions: {
        entries: [
          {
            ...createMockDOSExecution({
              side: 'Buy',
              quantity: 500,
              price: 175.45,
              venue: 'ARCA'
            }),
            arrowColor: '#00ff00',
            arrowSize: 'medium'
          },
          {
            ...createMockDOSExecution({
              side: 'Buy',
              quantity: 500,
              price: 175.55,
              venue: 'NASDAQ',
              executionId: 'exec_2'
            }),
            arrowColor: '#00ff00',
            arrowSize: 'medium'
          }
        ],
        exits: [
          {
            ...createMockDOSExecution({
              side: 'Sell',
              quantity: 1000,
              price: 178.25,
              venue: 'NYSE',
              executionId: 'exec_3'
            }),
            arrowColor: '#ff3300',
            arrowSize: 'medium'
          }
        ]
      },

      executionStats: {
        totalExecutions: 3,
        averageSlippage: 0.02,
        totalCommissions: 7.50,
        totalFees: 2.50,
        vwapEntry: 175.50,
        vwapExit: 178.25,
        executionTimeSpan: 22500000, // 6.25 hours in ms
        venueDistribution: {
          'ARCA': 1,
          'NASDAQ': 1,
          'NYSE': 1
        },
        qualityScore: 85
      },

      matchingInfo: {
        matched: true,
        confidence: 0.95,
        tradervueTradeId: 'tv_AAPL_20241023',
        dosTradeGroup: 'dos_AAPL_group1',
        discrepancies: [],
        matchingCriteria: {
          symbolMatch: true,
          timeWindowMatch: true,
          quantityMatch: true,
          sideMatch: true
        }
      },

      sourceData: {
        tradervue: createMockTradervueTrade(),
        dosRaw: [
          createMockDOSExecution({ side: 'Buy', quantity: 500 }),
          createMockDOSExecution({ side: 'Buy', quantity: 500, executionId: 'exec_2' }),
          createMockDOSExecution({ side: 'Sell', quantity: 1000, executionId: 'exec_3' })
        ],
        importTimestamp: '2024-10-23T16:00:00.000Z',
        version: '1.0'
      }
    }

    // Create mock enhancement result
    mockEnhancementResult = {
      processed: 10,
      matched: 8,
      unmatched: 2,
      errors: 0,
      enhancedTrades: [mockEnhancedTrade],
      unmatchedTradervue: [],
      unmatchedDOS: [],
      processingStats: {
        startTime: '2024-10-23T16:00:00.000Z',
        endTime: '2024-10-23T16:05:00.000Z',
        duration: 300000, // 5 minutes
        averageMatchScore: 0.85,
        qualityDistribution: {
          'Excellent (90-100)': 2,
          'Good (70-89)': 5,
          'Fair (50-69)': 1,
          'Poor (0-49)': 0
        }
      }
    }
  })

  describe('Single Trade Validation', () => {
    test('should validate a valid enhanced trade', () => {
      const result = auditEngine.validateEnhancedTrade(mockEnhancedTrade)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.trade).toBeDefined()
    })

    test('should detect missing required fields', () => {
      const invalidTrade = {
        ...mockEnhancedTrade,
        symbol: '', // Missing symbol
        quantity: 0  // Invalid quantity
      }

      const result = auditEngine.validateEnhancedTrade(invalidTrade)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.some(e => e.field === 'symbol')).toBe(true)
      expect(result.errors.some(e => e.field === 'quantity')).toBe(true)
    })

    test('should detect invalid timing', () => {
      const invalidTrade = {
        ...mockEnhancedTrade,
        entryTime: '2024-10-23T15:45:00.000Z',
        exitTime: '2024-10-23T09:30:00.000Z' // Exit before entry
      }

      const result = auditEngine.validateEnhancedTrade(invalidTrade)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.field === 'timing')).toBe(true)
    })

    test('should detect P&L calculation discrepancies', () => {
      const invalidTrade = {
        ...mockEnhancedTrade,
        pnl: 5000.00 // Incorrect P&L
      }

      const result = auditEngine.validateEnhancedTrade(invalidTrade)

      expect(result.warnings.some(w => w.field === 'pnl')).toBe(true)
    })

    test('should detect execution quantity mismatches', () => {
      const invalidTrade = {
        ...mockEnhancedTrade,
        executions: {
          entries: [
            {
              ...mockEnhancedTrade.executions.entries[0],
              quantity: 300 // Mismatch
            }
          ],
          exits: mockEnhancedTrade.executions.exits
        }
      }

      const result = auditEngine.validateEnhancedTrade(invalidTrade)

      expect(result.warnings.some(w => w.field === 'execution_quantities')).toBe(true)
    })

    test('should detect unrealistic price movements', () => {
      const invalidTrade = {
        ...mockEnhancedTrade,
        entryPrice: 100.00,
        exitPrice: 200.00 // 100% gain - unrealistic
      }

      const result = auditEngine.validateEnhancedTrade(invalidTrade)

      expect(result.warnings.some(w => w.field === 'price_movement')).toBe(true)
    })

    test('should detect long trade durations', () => {
      const longTrade = {
        ...mockEnhancedTrade,
        entryTime: '2024-10-01T09:30:00.000Z',
        exitTime: '2024-11-15T15:45:00.000Z' // 45 days
      }

      const result = auditEngine.validateEnhancedTrade(longTrade)

      expect(result.warnings.some(w => w.field === 'duration')).toBe(true)
    })
  })

  describe('Discrepancy Analysis', () => {
    test('should analyze volume discrepancies', async () => {
      const tradeWithVolumeDiscrepancy = {
        ...mockEnhancedTrade,
        sourceData: {
          ...mockEnhancedTrade.sourceData,
          tradervue: {
            ...mockEnhancedTrade.sourceData.tradervue!,
            'Volume': '1200' // Different from DOS total
          }
        }
      }

      const discrepancies = await auditEngine.analyzeTradeDiscrepancies(tradeWithVolumeDiscrepancy)

      expect(discrepancies.length).toBeGreaterThan(0)
      expect(discrepancies.some(d => d.discrepancyType === 'volume')).toBe(true)
    })

    test('should analyze price discrepancies', async () => {
      const tradeWithPriceDiscrepancy = {
        ...mockEnhancedTrade,
        sourceData: {
          ...mockEnhancedTrade.sourceData,
          tradervue: {
            ...mockEnhancedTrade.sourceData.tradervue!,
            'Entry Price': '180.00' // Significantly different
          }
        }
      }

      const discrepancies = await auditEngine.analyzeTradeDiscrepancies(tradeWithPriceDiscrepancy)

      expect(discrepancies.some(d => d.discrepancyType === 'price')).toBe(true)
      expect(discrepancies.find(d => d.discrepancyType === 'price')?.severity).toBe('critical')
    })

    test('should analyze commission discrepancies', async () => {
      const tradeWithCommissionDiscrepancy = {
        ...mockEnhancedTrade,
        sourceData: {
          ...mockEnhancedTrade.sourceData,
          tradervue: {
            ...mockEnhancedTrade.sourceData.tradervue!,
            'Commissions': '20.00' // Different from DOS total
          }
        }
      }

      const discrepancies = await auditEngine.analyzeTradeDiscrepancies(tradeWithCommissionDiscrepancy)

      expect(discrepancies.some(d => d.discrepancyType === 'commission')).toBe(true)
    })

    test('should handle trades without source data', async () => {
      const tradeWithoutSource = {
        ...mockEnhancedTrade,
        sourceData: {
          ...mockEnhancedTrade.sourceData,
          tradervue: undefined,
          dosRaw: undefined
        }
      }

      const discrepancies = await auditEngine.analyzeTradeDiscrepancies(tradeWithoutSource)

      expect(discrepancies).toHaveLength(0)
    })
  })

  describe('Full Audit Report', () => {
    test('should generate comprehensive audit report', async () => {
      const report = await auditEngine.runFullAudit(mockEnhancementResult)

      expect(report.reportId).toBeDefined()
      expect(report.generatedAt).toBeDefined()
      expect(report.scope).toBe('full')
      expect(report.summary.totalRecords).toBe(1)
      expect(report.dataIntegrityScore).toBeGreaterThanOrEqual(0)
      expect(report.dataIntegrityScore).toBeLessThanOrEqual(100)
    })

    test('should include compliance results', async () => {
      const report = await auditEngine.runFullAudit(mockEnhancementResult)

      expect(report.complianceResults).toBeDefined()
      expect(Object.keys(report.complianceResults).length).toBeGreaterThan(0)

      const requiredFieldsCheck = report.complianceResults['required_fields']
      expect(requiredFieldsCheck).toBeDefined()
      expect(requiredFieldsCheck.passed).toBe(true)
    })

    test('should generate recommendations', async () => {
      const report = await auditEngine.runFullAudit(mockEnhancementResult)

      expect(report.recommendations).toBeDefined()
      expect(Array.isArray(report.recommendations)).toBe(true)
    })

    test('should calculate data integrity score', async () => {
      const report = await auditEngine.runFullAudit(mockEnhancementResult)

      expect(report.dataIntegrityScore).toBeGreaterThan(80) // Should be high for good data
    })

    test('should handle poor quality data', async () => {
      const poorQualityResult = {
        ...mockEnhancementResult,
        enhancedTrades: [
          {
            ...mockEnhancedTrade,
            symbol: '', // Missing symbol
            quantity: 0, // Invalid quantity
            entryTime: 'invalid-date'
          }
        ]
      }

      const report = await auditEngine.runFullAudit(poorQualityResult)

      expect(report.dataIntegrityScore).toBeLessThan(50)
      expect(report.summary.errorRecords).toBeGreaterThan(0)
      expect(report.recommendations.length).toBeGreaterThan(0)
    })

    test('should skip discrepancy analysis when requested', async () => {
      const report = await auditEngine.runFullAudit(mockEnhancementResult, false)

      const discrepancyResults = report.auditResults.filter(r => r.auditType === 'discrepancy')
      expect(discrepancyResults).toHaveLength(0)
    })
  })

  describe('Data Quality Report', () => {
    test('should generate data quality report', () => {
      const trades = [mockEnhancedTrade]
      const report = auditEngine.generateDataQualityReport(trades)

      expect(report.timestamp).toBeDefined()
      expect(report.totalTrades).toBe(1)
      expect(report.qualityMetrics.completeness).toBeGreaterThan(0)
      expect(report.qualityMetrics.accuracy).toBeGreaterThan(0)
      expect(report.qualityMetrics.consistency).toBeGreaterThan(0)
      expect(report.qualityMetrics.timeliness).toBeGreaterThan(0)
    })

    test('should detect missing data issues', () => {
      const tradesWithMissingData = [
        {
          ...mockEnhancedTrade,
          symbol: '',
          entryTime: ''
        }
      ]

      const report = auditEngine.generateDataQualityReport(tradesWithMissingData)

      expect(report.issuesSummary.missingData).toBeGreaterThan(0)
      expect(report.recommendations.some(r => r.includes('missing critical data'))).toBe(true)
    })

    test('should detect inconsistent data issues', () => {
      const tradesWithInconsistentData = [
        {
          ...mockEnhancedTrade,
          quantity: -100, // Negative quantity
          entryPrice: 0    // Zero price
        }
      ]

      const report = auditEngine.generateDataQualityReport(tradesWithInconsistentData)

      expect(report.issuesSummary.inconsistentData).toBeGreaterThan(0)
    })

    test('should detect outliers', () => {
      const tradesWithOutliers = [
        {
          ...mockEnhancedTrade,
          pnlPercent: 150 // 150% gain - outlier
        }
      ]

      const report = auditEngine.generateDataQualityReport(tradesWithOutliers)

      expect(report.issuesSummary.outliers).toBeGreaterThan(0)
    })

    test('should handle empty trade list', () => {
      const report = auditEngine.generateDataQualityReport([])

      expect(report.totalTrades).toBe(0)
      expect(report.qualityMetrics.completeness).toBe(1) // 100% for empty set
    })
  })

  describe('Performance Analysis', () => {
    test('should detect slow processing', async () => {
      const slowResult = {
        ...mockEnhancementResult,
        processingStats: {
          ...mockEnhancementResult.processingStats,
          duration: 120000 // 2 minutes - slow
        }
      }

      const report = await auditEngine.runFullAudit(slowResult)

      const performanceIssues = report.auditResults.filter(r => r.auditType === 'performance')
      expect(performanceIssues.some(i => i.message.includes('Processing time exceeded'))).toBe(true)
    })

    test('should detect low match rates', async () => {
      const lowMatchResult = {
        ...mockEnhancementResult,
        processed: 10,
        matched: 5 // 50% match rate - low
      }

      const report = await auditEngine.runFullAudit(lowMatchResult)

      const performanceIssues = report.auditResults.filter(r => r.auditType === 'performance')
      expect(performanceIssues.some(i => i.message.includes('matching rate below'))).toBe(true)
    })

    test('should calculate processing rates', async () => {
      const report = await auditEngine.runFullAudit(mockEnhancementResult)

      const performanceResults = report.auditResults.filter(r => r.auditType === 'performance')
      if (performanceResults.length > 0) {
        expect(performanceResults[0].details.recordsPerSecond).toBeGreaterThan(0)
      }
    })
  })

  describe('Compliance Checks', () => {
    test('should pass all compliance checks for valid data', async () => {
      const report = await auditEngine.runFullAudit(mockEnhancementResult)

      const failedChecks = Object.values(report.complianceResults).filter(c => !c.passed)
      expect(failedChecks).toHaveLength(0)
    })

    test('should fail required fields check', async () => {
      const invalidResult = {
        ...mockEnhancementResult,
        enhancedTrades: [{
          ...mockEnhancedTrade,
          symbol: '' // Missing required field
        }]
      }

      const report = await auditEngine.runFullAudit(invalidResult)

      const requiredFieldsCheck = report.complianceResults['required_fields']
      expect(requiredFieldsCheck.passed).toBe(false)
      expect(requiredFieldsCheck.affectedCount).toBeGreaterThan(0)
    })

    test('should fail price validation check', async () => {
      const invalidResult = {
        ...mockEnhancementResult,
        enhancedTrades: [{
          ...mockEnhancedTrade,
          entryPrice: -100, // Invalid price
          exitPrice: 0      // Invalid price
        }]
      }

      const report = await auditEngine.runFullAudit(invalidResult)

      const priceCheck = report.complianceResults['price_validation']
      expect(priceCheck.passed).toBe(false)
    })

    test('should fail execution consistency check', async () => {
      const invalidResult = {
        ...mockEnhancementResult,
        enhancedTrades: [{
          ...mockEnhancedTrade,
          executions: {
            entries: [], // No entries
            exits: []    // No exits
          }
        }]
      }

      const report = await auditEngine.runFullAudit(invalidResult)

      const executionCheck = report.complianceResults['execution_consistency']
      expect(executionCheck.passed).toBe(false)
    })

    test('should fail timing validation check', async () => {
      const invalidResult = {
        ...mockEnhancementResult,
        enhancedTrades: [{
          ...mockEnhancedTrade,
          entryTime: '2024-10-23T15:45:00.000Z',
          exitTime: '2024-10-23T09:30:00.000Z' // Exit before entry
        }]
      }

      const report = await auditEngine.runFullAudit(invalidResult)

      const timingCheck = report.complianceResults['timing_validation']
      expect(timingCheck.passed).toBe(false)
    })
  })

  describe('Utility Functions', () => {
    test('should use default validation engine', () => {
      expect(validationAuditEngine).toBeDefined()
      expect(validationAuditEngine).toBeInstanceOf(ValidationAuditEngine)
    })

    test('should validate multiple trades', () => {
      const trades = [mockEnhancedTrade, mockEnhancedTrade]
      const errors = []

      trades.forEach(trade => {
        const result = auditEngine.validateEnhancedTrade(trade)
        errors.push(...result.errors)
      })

      expect(errors).toHaveLength(0) // Both trades should be valid
    })

    test('should handle audit report serialization', async () => {
      const report = await auditEngine.runFullAudit(mockEnhancementResult)

      // Report should be serializable to JSON
      const serialized = JSON.stringify(report)
      const deserialized = JSON.parse(serialized)

      expect(deserialized.reportId).toBe(report.reportId)
      expect(deserialized.dataIntegrityScore).toBe(report.dataIntegrityScore)
    })
  })

  describe('Edge Cases', () => {
    test('should handle null/undefined trades gracefully', () => {
      const nullTrade = null as any
      const undefinedTrade = undefined as any

      expect(() => auditEngine.validateEnhancedTrade(nullTrade)).toThrow()
      expect(() => auditEngine.validateEnhancedTrade(undefinedTrade)).toThrow()
    })

    test('should handle empty enhancement result', async () => {
      const emptyResult = {
        ...mockEnhancementResult,
        processed: 0,
        matched: 0,
        unmatched: 0,
        enhancedTrades: []
      }

      const report = await auditEngine.runFullAudit(emptyResult)

      expect(report.summary.totalRecords).toBe(0)
      expect(report.dataIntegrityScore).toBeGreaterThan(0) // Should still have a score
    })

    test('should handle malformed execution data', () => {
      const malformedTrade = {
        ...mockEnhancedTrade,
        executions: {
          entries: [null, undefined] as any,
          exits: [{}] as any // Empty object
        }
      }

      const result = auditEngine.validateEnhancedTrade(malformedTrade)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    test('should handle very large datasets', async () => {
      const largeTrades = Array(1000).fill(mockEnhancedTrade).map((trade, index) => ({
        ...trade,
        id: `trade_${index}`,
        symbol: `SYM${index}`
      }))

      const largeResult = {
        ...mockEnhancementResult,
        processed: 1000,
        matched: 950,
        enhancedTrades: largeTrades
      }

      const startTime = Date.now()
      const report = await auditEngine.runFullAudit(largeResult)
      const auditTime = Date.now() - startTime

      expect(report.summary.totalRecords).toBe(1000)
      expect(auditTime).toBeLessThan(30000) // Should complete in under 30 seconds
    }, 35000)
  })
})