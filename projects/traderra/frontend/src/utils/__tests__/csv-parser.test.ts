import { describe, it, expect } from 'vitest'
import {
  parseCSV,
  convertTraderVueToTraderra,
  validateTraderVueCSV,
  TraderVueTrade
} from '../csv-parser'

describe('CSV Parser - TradervUE Fixes', () => {
  // Sample TradervUE data matching the 29-column format
  const sampleTradervUECSV = `Open Datetime,Close Datetime,Symbol,Side,Volume,Exec Count,Entry Price,Exit Price,Gross P&L,Gross P&L (%),Shared,Notes,Tags,Gross P&L (t),Net P&L,Commissions,Fees,Initial Risk,P&L (R),Position MFE,Position MAE,Price MFE,Price MAE,Position MFE Datetime,Position MAE Datetime,Price MFE Datetime,Price MAE Datetime,Best Exit P&L,Best Exit Datetime
2025-10-10 09:42:38,2025-10-10 09:43:15,SPYO,L,100,2,1.50,1.55,5.00,3.33,,Test trade,swing,5.00,4.50,0.50,0.00,100.00,0.045R,6.00,-2.00,1.56,1.48,2025-10-10 09:42:45,2025-10-10 09:42:50,2025-10-10 09:42:45,2025-10-10 09:42:50,6.00,2025-10-10 09:42:45
2025-10-10 10:15:22,2025-10-10 10:16:08,AAPL,S,50,1,150.25,149.75,25.00,0.33,,Apple short,momentum,25.00,24.00,1.00,0.00,500.00,0.048R,30.00,-5.00,149.50,150.50,2025-10-10 10:15:30,2025-10-10 10:15:35,2025-10-10 10:15:30,2025-10-10 10:15:35,30.00,2025-10-10 10:15:30
2025-10-10 11:30:15,2025-10-10 11:31:22,QQQ,L,25,3,380.00,385.00,125.00,0.66,,QQQ calls,options,125.00,123.75,1.25,0.00,1000.00,0.124R,Inf,-10.00,386.00,379.00,2025-10-10 11:30:25,2025-10-10 11:30:30,2025-10-10 11:30:25,2025-10-10 11:30:30,130.00,2025-10-10 11:30:25`

  describe('Enhanced Numeric Parsing', () => {
    it('should handle infinite values correctly', () => {
      const trades = parseCSV(sampleTradervUECSV)
      expect(trades).toHaveLength(3)

      const convertedTrades = convertTraderVueToTraderra(trades)

      // Third trade has 'Inf' for Position MFE - should be converted to undefined
      expect(convertedTrades[2].mfe).toBeUndefined()
      expect(convertedTrades[2].pnl).toBe(123.75) // Net P&L should still work
    })

    it('should handle commission + fees calculation correctly', () => {
      const trades = parseCSV(sampleTradervUECSV)
      const convertedTrades = convertTraderVueToTraderra(trades)

      // First trade: 0.50 commission + 0.00 fees = 0.50 total
      expect(convertedTrades[0].commission).toBe(0.5)

      // Second trade: 1.00 commission + 0.00 fees = 1.00 total
      expect(convertedTrades[1].commission).toBe(1.0)

      // Third trade: 1.25 commission + 0.00 fees = 1.25 total
      expect(convertedTrades[2].commission).toBe(1.25)
    })

    it('should use Net P&L for accurate calculations', () => {
      const trades = parseCSV(sampleTradervUECSV)
      const convertedTrades = convertTraderVueToTraderra(trades)

      // Verify we're using Net P&L (not Gross P&L)
      expect(convertedTrades[0].pnl).toBe(4.5)  // Net P&L, not Gross P&L (5.00)
      expect(convertedTrades[1].pnl).toBe(24.0) // Net P&L, not Gross P&L (25.00)
      expect(convertedTrades[2].pnl).toBe(123.75) // Net P&L, not Gross P&L (125.00)
    })

    it('should handle currency symbols and formatting', () => {
      const csvWithCurrency = `Open Datetime,Close Datetime,Symbol,Side,Volume,Exec Count,Entry Price,Exit Price,Gross P&L,Gross P&L (%),Shared,Notes,Tags,Gross P&L (t),Net P&L,Commissions,Fees,Initial Risk,P&L (R),Position MFE,Position MAE,Price MFE,Price MAE,Position MFE Datetime,Position MAE Datetime,Price MFE Datetime,Price MAE Datetime,Best Exit P&L,Best Exit Datetime
2025-10-10 09:42:38,2025-10-10 09:43:15,TEST,L,100,1,$1.50,$1.55,$5.00,3.33%,,Test,$tag,$5.00,$4.50,$0.50,$0.10,$100.00,0.045R,$6.00,-$2.00,$1.56,$1.48,2025-10-10 09:42:45,2025-10-10 09:42:50,2025-10-10 09:42:45,2025-10-10 09:42:50,$6.00,2025-10-10 09:42:45`

      const trades = parseCSV(csvWithCurrency)
      const convertedTrades = convertTraderVueToTraderra(trades)

      expect(convertedTrades[0].entryPrice).toBe(1.5)
      expect(convertedTrades[0].exitPrice).toBe(1.55)
      expect(convertedTrades[0].pnl).toBe(4.5)
      expect(convertedTrades[0].commission).toBe(0.6) // 0.50 + 0.10
    })
  })

  describe('Options Symbol Validation', () => {
    it('should recognize common options symbols', () => {
      const optionsCSV = `Open Datetime,Close Datetime,Symbol,Side,Volume,Exec Count,Entry Price,Exit Price,Gross P&L,Gross P&L (%),Shared,Notes,Tags,Gross P&L (t),Net P&L,Commissions,Fees,Initial Risk,P&L (R),Position MFE,Position MAE,Price MFE,Price MAE,Position MFE Datetime,Position MAE Datetime,Price MFE Datetime,Price MAE Datetime,Best Exit P&L,Best Exit Datetime
2025-10-10 09:42:38,2025-10-10 09:43:15,SPYO,L,100,1,0.00,1.55,5.00,Inf,,Options trade,options,5.00,4.50,0.50,0.00,100.00,0.045R,6.00,-2.00,1.56,1.48,2025-10-10 09:42:45,2025-10-10 09:42:50,2025-10-10 09:42:45,2025-10-10 09:42:50,6.00,2025-10-10 09:42:45
2025-10-10 10:15:22,2025-10-10 10:16:08,PLTRB,S,50,1,0.00,2.50,125.00,Inf,,Palantir options,momentum,125.00,124.00,1.00,0.00,500.00,0.248R,130.00,-5.00,2.75,2.25,2025-10-10 10:15:30,2025-10-10 10:15:35,2025-10-10 10:15:30,2025-10-10 10:15:35,130.00,2025-10-10 10:15:30
2025-10-10 11:30:15,2025-10-10 11:31:22,AAPL240315C00180000,L,1,1,5.50,6.25,75.00,13.64,,Apple call option,options,75.00,74.00,1.00,0.00,550.00,0.135R,80.00,-25.00,6.50,5.25,2025-10-10 11:30:25,2025-10-10 11:30:30,2025-10-10 11:30:25,2025-10-10 11:30:30,80.00,2025-10-10 11:30:25`

      const validation = validateTraderVueCSV(optionsCSV)

      expect(validation.valid).toBe(true)
      expect(validation.statistics?.optionsTrades).toBe(3)
      expect(validation.warnings).toContain('Found 3 options trades - verify symbol handling')

      const trades = parseCSV(optionsCSV)
      const convertedTrades = convertTraderVueToTraderra(trades)

      // All options trades should be processed
      expect(convertedTrades).toHaveLength(3)

      // Options with 0.00 entry price should still work (common for options)
      expect(convertedTrades[0].entryPrice).toBe(0)
      expect(convertedTrades[0].symbol).toBe('SPYO')
      expect(convertedTrades[1].symbol).toBe('PLTRB')
      expect(convertedTrades[2].symbol).toBe('AAPL240315C00180000')
    })
  })

  describe('Enhanced Error Handling', () => {
    it('should provide detailed validation results', () => {
      const validation = validateTraderVueCSV(sampleTradervUECSV)

      expect(validation.valid).toBe(true)
      expect(validation.statistics).toBeDefined()
      expect(validation.statistics?.totalTrades).toBe(3)
      expect(validation.statistics?.processingTime).toBeGreaterThanOrEqual(0)
    })

    it('should handle missing columns gracefully', () => {
      const incompleteCSV = `Symbol,Net P&L,Volume,Entry Price
AAPL,100.00,100,150.00
MSFT,-50.00,50,200.00`

      const validation = validateTraderVueCSV(incompleteCSV)

      expect(validation.valid).toBe(false)
      expect(validation.error).toContain('Missing required columns')
    })

    it('should handle empty or malformed data', () => {
      const emptyCSV = ''
      const validation1 = validateTraderVueCSV(emptyCSV)
      expect(validation1.valid).toBe(false)

      const headerOnlyCSV = 'Open Datetime,Close Datetime,Symbol,Side,Volume,Entry Price,Exit Price,Net P&L'
      const validation2 = validateTraderVueCSV(headerOnlyCSV)
      expect(validation2.valid).toBe(false)
    })

    it('should continue processing despite individual row errors', () => {
      const csvWithErrors = `Open Datetime,Close Datetime,Symbol,Side,Volume,Exec Count,Entry Price,Exit Price,Gross P&L,Gross P&L (%),Shared,Notes,Tags,Gross P&L (t),Net P&L,Commissions,Fees,Initial Risk,P&L (R),Position MFE,Position MAE,Price MFE,Price MAE,Position MFE Datetime,Position MAE Datetime,Price MFE Datetime,Price MAE Datetime,Best Exit P&L,Best Exit Datetime
2025-10-10 09:42:38,2025-10-10 09:43:15,GOOD,L,100,1,1.50,1.55,5.00,3.33,,Good trade,swing,5.00,4.50,0.50,0.00,100.00,0.045R,6.00,-2.00,1.56,1.48,2025-10-10 09:42:45,2025-10-10 09:42:50,2025-10-10 09:42:45,2025-10-10 09:42:50,6.00,2025-10-10 09:42:45
,,,,,,,,,,,,,,,,,,,,,,,,,,,
2025-10-10 11:30:15,2025-10-10 11:31:22,GOOD2,L,25,1,380.00,385.00,125.00,0.66,,Another good,options,125.00,123.75,1.25,0.00,1000.00,0.124R,130.00,-10.00,386.00,379.00,2025-10-10 11:30:25,2025-10-10 11:30:30,2025-10-10 11:30:25,2025-10-10 11:30:30,130.00,2025-10-10 11:30:25`

      const trades = parseCSV(csvWithErrors)

      // Should parse 2 good trades, skip the empty row
      expect(trades).toHaveLength(2)
      expect(trades[0].Symbol).toBe('GOOD')
      expect(trades[1].Symbol).toBe('GOOD2')
    })
  })

  describe('Precision and Accuracy', () => {
    it('should maintain precision for penny-accurate calculations', () => {
      const precisionCSV = `Open Datetime,Close Datetime,Symbol,Side,Volume,Exec Count,Entry Price,Exit Price,Gross P&L,Gross P&L (%),Shared,Notes,Tags,Gross P&L (t),Net P&L,Commissions,Fees,Initial Risk,P&L (R),Position MFE,Position MAE,Price MFE,Price MAE,Position MFE Datetime,Position MAE Datetime,Price MFE Datetime,Price MAE Datetime,Best Exit P&L,Best Exit Datetime
2025-10-10 09:42:38,2025-10-10 09:43:15,TEST,L,1000,1,12.3456,12.3567,11.10,0.90,,Precision test,test,11.10,10.9950,0.1050,0.0000,1234.56,0.0089R,11.50,-0.50,12.3600,12.3400,2025-10-10 09:42:45,2025-10-10 09:42:50,2025-10-10 09:42:45,2025-10-10 09:42:50,11.50,2025-10-10 09:42:45`

      const trades = parseCSV(precisionCSV)
      const convertedTrades = convertTraderVueToTraderra(trades)

      // Verify precision is maintained to 4 decimal places
      expect(convertedTrades[0].entryPrice).toBe(12.3456)
      expect(convertedTrades[0].exitPrice).toBe(12.3567)
      expect(convertedTrades[0].pnl).toBe(10.995) // Net P&L
      expect(convertedTrades[0].commission).toBe(0.105) // Commissions + Fees
    })
  })

  describe('Real-world Edge Cases', () => {
    it('should handle BOM (Byte Order Mark) in CSV files', () => {
      const bomCSV = '\uFEFF' + sampleTradervUECSV

      const trades = parseCSV(bomCSV)
      expect(trades).toHaveLength(3)

      const convertedTrades = convertTraderVueToTraderra(trades)
      expect(convertedTrades).toHaveLength(3)
    })

    it('should handle quotes in CSV values', () => {
      const quotedCSV = `Open Datetime,Close Datetime,Symbol,Side,Volume,Exec Count,Entry Price,Exit Price,Gross P&L,Gross P&L (%),Shared,Notes,Tags,Gross P&L (t),Net P&L,Commissions,Fees,Initial Risk,P&L (R),Position MFE,Position MAE,Price MFE,Price MAE,Position MFE Datetime,Position MAE Datetime,Price MFE Datetime,Price MAE Datetime,Best Exit P&L,Best Exit Datetime
"2025-10-10 09:42:38","2025-10-10 09:43:15","TEST","L",100,1,"1.50","1.55","5.00","3.33","","Test ""quoted"" note","swing","5.00","4.50","0.50","0.00","100.00","0.045R","6.00","-2.00","1.56","1.48","2025-10-10 09:42:45","2025-10-10 09:42:50","2025-10-10 09:42:45","2025-10-10 09:42:50","6.00","2025-10-10 09:42:45"`

      const trades = parseCSV(quotedCSV)
      expect(trades).toHaveLength(1)

      const convertedTrades = convertTraderVueToTraderra(trades)
      expect(convertedTrades[0].notes).toBe('Test "quoted" note')
    })
  })
})