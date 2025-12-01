#!/usr/bin/env node

/**
 * Direct test of Python execution service with backside scanner
 */

const fs = require('fs');
const path = require('path');

// Import the service directly
const { pythonExecutorService } = require('./src/services/pythonExecutorService.ts');

async function testBacksideExecution() {
  console.log('🚀 Testing Backside Scanner with Enhanced Service');

  // Read the backside scanner code
  const backsideCode = fs.readFileSync('/Users/michaeldurante/Downloads/backside para b copy.py', 'utf8');

  console.log(`📊 Code length: ${backsideCode.length} characters`);
  console.log(`📅 Date range: 2025-01-01 to 2025-11-01`);
  console.log(`🔑 API Key: Fm7brz4s23eSocDErnL68cE7wspz2K1I`);
  console.log();

  try {
    console.log('🔥 Starting Python execution with market-wide scanning...');

    const executionRequest = {
      code: backsideCode,
      start_date: '2025-01-01',
      end_date: '2025-11-01',
      scanner_type: 'custom',
      api_key: 'Fm7brz4s23eSocDErnL68cE7wspz2K1I',
      symbols: [],
      parameters: {
        price_min: 8.0,
        adv20_min_usd: 30000000,
        atr_mult: 0.9,
        vol_mult: 0.9,
        gap_div_atr_min: 0.75,
        d1_volume_min: 15000000
      }
    };

    // Execute the scanner
    const result = await pythonExecutorService.executeScanner(executionRequest);

    console.log(`✅ Execution completed!`);
    console.log(`📈 Success: ${result.success}`);

    if (result.success) {
      const signals = result.results || [];
      console.log(`🎯 Signals found: ${signals.length}`);
      console.log(`⏱️ Execution time: ${result.execution_time || 0} seconds`);
      console.log(`🔑 Execution ID: ${result.execution_id || 'unknown'}`);

      if (signals.length > 0) {
        console.log(`\n📊 First 5 trading signals:`);
        signals.slice(0, 5).forEach((signal, i) => {
          console.log(`  ${i+1}. ${signal.ticker || 'N/A'} - ${signal.date || 'N/A'} - Gap/ATR: ${signal.gap_atr || 0}`);
        });

        if (signals.length >= 8) {
          console.log(`\n✅ SUCCESS: Found ${signals.length} signals (8+ as requested!)`);
        } else {
          console.log(`\n⚠️  Found ${signals.length} signals (expected 8+)`);
        }
      } else {
        console.log('\n❌ No signals found');
      }
    } else {
      console.log(`❌ Execution failed: ${result.error || 'Unknown error'}`);
    }

  } catch (error) {
    console.error('❌ Exception occurred:', error);
  }
}

testBacksideExecution().catch(console.error);