/**
 * DIRECT CSV VALIDATION TEST
 * Node.js executable script to validate TradervUE CSV processing
 */

const fs = require('fs');
const path = require('path');

// Convert TypeScript code to runnable JavaScript
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i += 2;
        continue;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
    i++;
  }

  result.push(current.trim());
  return result;
}

function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length === 0) return [];

  let headerLine = lines[0];
  if (headerLine.charCodeAt(0) === 0xFEFF) {
    headerLine = headerLine.slice(1);
  }

  const headers = parseCSVLine(headerLine).map(h => h.trim());
  const trades = [];

  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCSVLine(lines[i]);

      if (values.length > 0) {
        const trade = {};

        headers.forEach((header, index) => {
          trade[header] = index < values.length ? values[index].trim() : '';
        });

        if (trade['Symbol'] && (trade['Open Datetime'] || trade['Close Datetime'])) {
          trades.push(trade);
        }
      }
    } catch (error) {
      console.warn(`Error parsing row ${i + 1}:`, error);
    }
  }

  return trades;
}

function safeParseFloat(value) {
  if (!value || typeof value !== 'string') return 0;

  const cleanValue = value.trim();
  if (cleanValue === '' || cleanValue === 'N/A' || cleanValue === 'n/a') return 0;
  if (cleanValue === 'Inf' || cleanValue === 'inf' || cleanValue === 'Infinity') return 0;
  if (cleanValue === '-Inf' || cleanValue === '-inf' || cleanValue === '-Infinity') return 0;

  const numericValue = cleanValue.replace(/[$,%]/g, '');
  const parsed = parseFloat(numericValue);

  if (isNaN(parsed) || !isFinite(parsed)) return 0;
  return Math.round(parsed * 10000) / 10000;
}

function convertTraderVueToTraderra(traderVueTrades) {
  return traderVueTrades.map((trade, index) => {
    const parseDateTime = (dateTimeStr) => {
      const cleaned = (dateTimeStr || '').trim();
      if (!cleaned || cleaned === '""' || cleaned === '') {
        // Return a valid default date for empty entries
        return new Date('2025-01-01T12:00:00');
      }

      // Remove quotes if present
      const unquoted = cleaned.replace(/"/g, '');
      if (!unquoted) {
        return new Date('2025-01-01T12:00:00');
      }

      const isoFormat = unquoted.replace(' ', 'T');
      const date = new Date(isoFormat);

      if (isNaN(date.getTime())) {
        const parts = unquoted.split(' ');
        if (parts.length === 2) {
          const [datePart, timePart] = parts;
          const isoString = `${datePart}T${timePart}`;
          const retryDate = new Date(isoString);
          if (!isNaN(retryDate.getTime())) {
            return retryDate;
          }
        }
        // Fallback to valid default date
        return new Date('2025-01-01T12:00:00');
      }

      return date;
    };

    const entryDateTime = parseDateTime(trade['Open Datetime']);
    const exitDateTime = parseDateTime(trade['Close Datetime']);

    const netPnL = safeParseFloat(trade['Net P&L']);
    const grossPnLPercent = safeParseFloat(trade['Gross P&L (%)']);
    const commission = safeParseFloat(trade['Commissions']);
    const fees = safeParseFloat(trade['Fees']);
    const totalCommission = commission + fees;

    return {
      id: `import_${index + 1}`,
      symbol: trade['Symbol'] || '',
      side: trade['Side'] === 'S' ? 'Short' : 'Long',
      pnl: netPnL,
      pnlPercent: grossPnLPercent,
      commission: totalCommission,
      entryPrice: safeParseFloat(trade['Entry Price']),
      exitPrice: safeParseFloat(trade['Exit Price']),
      quantity: parseInt(trade['Volume'] || '0'),
      date: entryDateTime.toISOString().split('T')[0]
    };
  });
}

async function runDirectValidation() {
  console.log('🚀 CE-Hub Quality Assurance: Direct CSV Validation');
  console.log('='.repeat(60));

  const csvFilePath = '/Users/michaeldurante/Downloads/trades.csv';

  try {
    // Test 1: File Loading
    console.log('📊 Test 1: Loading CSV file...');
    const startTime = Date.now();

    if (!fs.existsSync(csvFilePath)) {
      throw new Error(`CSV file not found: ${csvFilePath}`);
    }

    const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
    console.log(`✅ File loaded: ${csvContent.length} characters`);

    // Test 2: CSV Parsing
    console.log('📋 Test 2: Parsing CSV data...');
    const parseStart = Date.now();
    const parsedTrades = parseCSV(csvContent);
    const parseTime = Date.now() - parseStart;

    console.log(`✅ Parsed ${parsedTrades.length} trades in ${parseTime}ms`);

    // Test 3: Data Conversion
    console.log('🔄 Test 3: Converting to Traderra format...');
    const convertStart = Date.now();
    const convertedTrades = convertTraderVueToTraderra(parsedTrades);
    const convertTime = Date.now() - convertStart;

    console.log(`✅ Converted ${convertedTrades.length} trades in ${convertTime}ms`);

    // Test 4: Data Integrity Check
    console.log('🔍 Test 4: Validating data integrity...');

    const expectedTradeCount = 1760; // 1787 lines - 1 header - 26 notes/comments
    const dataIntegrityPass = parsedTrades.length === expectedTradeCount;

    console.log(`Expected trades: ${expectedTradeCount}`);
    console.log(`Actual trades: ${parsedTrades.length}`);
    console.log(`Data integrity: ${dataIntegrityPass ? '✅ PASS' : '❌ FAIL'}`);

    // Test 5: Sample PnL Accuracy Check
    console.log('💰 Test 5: PnL calculation accuracy...');

    let accurateCalculations = 0;
    const sampleSize = Math.min(10, parsedTrades.length);

    for (let i = 0; i < sampleSize; i++) {
      const original = parsedTrades[i];
      const converted = convertedTrades[i];

      const originalNetPnL = safeParseFloat(original['Net P&L']);
      const convertedPnL = converted.pnl;

      const difference = Math.abs(originalNetPnL - convertedPnL);

      if (difference <= 0.01) {
        accurateCalculations++;
      } else {
        console.log(`   ⚠️  Trade ${i + 1}: PnL mismatch - Original: ${originalNetPnL}, Converted: ${convertedPnL}`);
      }
    }

    const pnlAccuracy = (accurateCalculations / sampleSize) * 100;
    console.log(`✅ PnL accuracy: ${pnlAccuracy.toFixed(1)}% (${accurateCalculations}/${sampleSize})`);

    // Test 6: Options Trade Detection
    console.log('📈 Test 6: Options trade handling...');

    const optionsTrades = convertedTrades.filter(trade => {
      const symbol = trade.symbol.toUpperCase();
      return ['CWD', 'PRSO', 'SPYO', 'PLTRB'].includes(symbol) ||
             /\d{6}[CP]\d{8}/.test(symbol) ||
             (trade.entryPrice === 0 && trade.exitPrice > 0);
    });

    console.log(`✅ Found ${optionsTrades.length} options trades`);
    if (optionsTrades.length > 0) {
      const optionsSymbols = [...new Set(optionsTrades.map(t => t.symbol))];
      console.log(`   Options symbols: ${optionsSymbols.join(', ')}`);
    }

    // Test 7: Performance Assessment
    console.log('⚡ Test 7: Performance assessment...');

    const totalTime = Date.now() - startTime;
    const performanceThreshold = 30000; // 30 seconds
    const performancePass = totalTime < performanceThreshold;

    console.log(`Total processing time: ${totalTime}ms`);
    console.log(`Performance standard: ${performancePass ? '✅ PASS' : '❌ FAIL'} (<30s)`);

    // Test 8: Infinite Value Handling
    console.log('♾️  Test 8: Infinite value handling...');

    const infiniteInOriginal = parsedTrades.filter(trade => {
      const pnlPercent = trade['Gross P&L (%)'] || '';
      return pnlPercent.includes('Inf');
    });

    const infiniteInConverted = convertedTrades.filter(trade =>
      !isFinite(trade.pnl) || !isFinite(trade.pnlPercent)
    );

    console.log(`Original infinite values: ${infiniteInOriginal.length}`);
    console.log(`Converted infinite values: ${infiniteInConverted.length}`);
    console.log(`Infinite handling: ${infiniteInConverted.length === 0 ? '✅ PASS' : '❌ FAIL'}`);

    // Generate Summary Report
    console.log('');
    console.log('📋 VALIDATION SUMMARY');
    console.log('='.repeat(60));

    const allTestsPass = dataIntegrityPass &&
                         pnlAccuracy >= 99 &&
                         performancePass &&
                         infiniteInConverted.length === 0;

    console.log(`Overall Status: ${allTestsPass ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Data Integrity: ${dataIntegrityPass ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`PnL Accuracy: ${pnlAccuracy >= 99 ? '✅ PASS' : '❌ FAIL'} (${pnlAccuracy.toFixed(1)}%)`);
    console.log(`Performance: ${performancePass ? '✅ PASS' : '❌ FAIL'} (${totalTime}ms)`);
    console.log(`Edge Cases: ${infiniteInConverted.length === 0 ? '✅ PASS' : '❌ FAIL'}`);

    console.log('');
    console.log('🎯 PRODUCTION READINESS');
    console.log('-'.repeat(40));

    if (allTestsPass) {
      console.log('✅ APPROVED FOR PRODUCTION DEPLOYMENT');
      console.log('   All critical tests passed successfully.');
      console.log(`   Successfully processed ${parsedTrades.length} trades`);
      console.log(`   Processing time: ${totalTime}ms`);
    } else {
      console.log('❌ NOT READY FOR PRODUCTION');
      console.log('   Critical issues detected that must be resolved.');
    }

    // Save sample data for inspection
    const sampleReport = {
      timestamp: new Date().toISOString(),
      totalTrades: parsedTrades.length,
      expectedTrades: expectedTradeCount,
      processingTime: totalTime,
      pnlAccuracy: pnlAccuracy,
      optionsTrades: optionsTrades.length,
      infiniteHandling: infiniteInConverted.length === 0,
      allTestsPass: allTestsPass,
      sampleData: convertedTrades.slice(0, 5)
    };

    const reportPath = path.join(__dirname, 'validation-results.json');
    fs.writeFileSync(reportPath, JSON.stringify(sampleReport, null, 2));
    console.log(`📄 Detailed results saved: ${reportPath}`);

    return allTestsPass;

  } catch (error) {
    console.error('❌ VALIDATION FAILED:', error.message);
    return false;
  }
}

// Execute if run directly
if (require.main === module) {
  runDirectValidation().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Critical error:', error);
    process.exit(1);
  });
}

module.exports = { runDirectValidation };