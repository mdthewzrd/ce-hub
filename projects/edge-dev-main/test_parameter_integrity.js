#!/usr/bin/env node

/**
 * CRITICAL TEST: Parameter Integrity Verification
 *
 * This test verifies that the Edge Dev platform preserves
 * parameter integrity exactly when formatting scanners.
 *
 * BASELINE: 8 exact hits from terminal execution
 * TEST: Edge Dev platform must produce identical results
 */

const fs = require('fs');
const http = require('http');
const { execSync } = require('child_process');

function makeRequest(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const http = require('http');

    const options = {
      hostname: 'localhost',
      port: 5656,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve(parsed);
        } catch (e) {
          console.log(`❌ JSON Parse Error: ${e.message}`);
          console.log(`Raw Response: ${responseData.substring(0, 500)}...`);
          resolve(responseData);
        }
      });
    });

    req.on('error', (e) => {
      console.error('❌ Request error:', e.message);
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

async function runFormattedCode(formattedCode, testId) {
  return new Promise((resolve, reject) => {
    const codePath = `/tmp/backside_b_formatted_${testId}.py`;

    // Write formatted code to temp file
    fs.writeFileSync(codePath, formattedCode);
    console.log(`💾 Saved formatted code to: ${codePath}`);

    // Execute the formatted code
    try {
      const result = execSync(`cd /tmp && python "${codePath}"`, {
        encoding: 'utf8',
        timeout: 120000,
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });

      // Clean up
      fs.unlinkSync(codePath);

      resolve(result);
    } catch (error) {
      // Clean up on error too
      try { fs.unlinkSync(codePath); } catch (e) {}
      reject(error);
    }
  });
}

function parseResults(output) {
  const lines = output.trim().split('\n');
  const results = [];

  // Find the line with results header
  let headerIndex = lines.findIndex(line => line.includes('trade-day hits'));
  if (headerIndex === -1) return results;

  // Parse the data rows
  for (let i = headerIndex + 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line === 'No hits.') continue;

    // Parse a result line (adjust parsing based on actual format)
    const parts = line.split(/\s+/);
    if (parts.length >= 12) {
      results.push({
        ticker: parts[0],
        date: parts[1],
        trigger: parts[2],
        posAbs: parseFloat(parts[3]),
        bodyATR: parseFloat(parts[4]),
        gapATR: parseFloat(parts[10]),
        openPrevHigh: parts[11] === 'True',
        openEMA9: parseFloat(parts[12])
      });
    }
  }

  return results;
}

function compareResults(baseline, edgeDev, testId) {
  console.log(`\n🔍 Parameter Integrity Comparison (Test ${testId}):`);
  console.log('=' .repeat(60));
  console.log(`Baseline Results: ${baseline.length} hits`);
  console.log(`Edge Dev Results: ${edgeDev.length} hits`);

  if (baseline.length !== edgeDev.length) {
    console.log(`\n❌ CRITICAL FAILURE: Different number of hits!`);
    console.log(`   Expected: ${baseline.length} hits`);
    console.log(`   Got: ${edgeDev.length} hits`);
    return false;
  }

  console.log(`✅ Hit count matches: ${baseline.length}`);

  // Check each result for exact parameter integrity
  let mismatches = 0;
  for (let i = 0; i < baseline.length; i++) {
    const b = baseline[i];
    const e = edgeDev[i];

    if (b.ticker !== e.ticker || b.date !== e.date) {
      console.log(`\n❌ Result ${i+1} MISMATCH:`);
      console.log(`   Baseline: ${b.ticker} ${b.date} (Gap/ATR: ${b.gapATR})`);
      console.log(`   EdgeDev: ${e.ticker} ${e.date} (Gap/ATR: ${e.gapATR})`);
      mismatches++;
    } else if (Math.abs(b.posAbs - e.posAbs) > 0.001 ||
               Math.abs(b.bodyATR - e.bodyATR) > 0.01 ||
               Math.abs(b.gapATR - e.gapATR) > 0.01) {
      console.log(`\n⚠️  Result ${i+1} Parameter MISMATCH:`);
      console.log(`   ${b.ticker} ${b.date}`);
      console.log(`     PosAbs: ${b.posAbs} → ${e.posAbs} (diff: ${(e.posAbs - b.posAbs).toFixed(3)})`);
      console.log(`     Body/ATR: ${b.bodyATR} → ${e.bodyATR} (diff: ${(e.bodyATR - b.bodyATR).toFixed(2)})`);
      console.log(`     Gap/ATR: ${b.gapATR} → ${e.gapATR} (diff: ${(e.gapATR - b.gapATR).toFixed(2)})`);
      mismatches++;
    }
  }

  if (mismatches === 0) {
    console.log(`\n✅ PERFECT PARAMETER INTEGRITY!`);
    console.log(`   All ${baseline.length} results match exactly`);
    console.log(`   Market-wide scanning preserved correctly`);
    return true;
  } else {
    console.log(`\n❌ PARAMETER INTEGRITY CORRUPTED!`);
    console.log(`   ${mismatches}/${baseline.length} results have corrupted parameters`);
    return false;
  }
}

async function testParameterIntegrity() {
  console.log('🧪 CRITICAL TEST: Parameter Integrity Verification');
  console.log('==================================================');
  console.log('Testing: Backside B Scanner Parameter Preservation');
  console.log('Expected: 8 exact matching results with terminal baseline');

  try {
    // Step 1: Read original file and get baseline results
    console.log('\n📊 Step 1: Running Baseline Test...');
    const originalCode = fs.readFileSync('/Users/michaeldurante/Downloads/backside para b copy.py', 'utf8');
    console.log(`📄 Original file: ${originalCode.length} chars, ${originalCode.split('\n').length} lines`);

    const baselineOutput = await runFormattedCode(originalCode, 'baseline');
    const baselineResults = parseResults(baselineOutput);
    console.log(`📋 Baseline Results: ${baselineResults.length} hits`);
    baselineResults.forEach((r, i) => {
      console.log(`   ${i+1}. ${r.ticker} ${r.date} (Gap/ATR: ${r.gapATR}, PosAbs: ${r.posAbs})`);
    });

    // Step 2: Format via Edge Dev API
    console.log('\n🤖 Step 2: Formatting via Edge Dev API...');
    const formatMessage = `format this code\n\n--- File: backside para b copy.py ---\n${originalCode}`;

    const formatStart = Date.now();
    const formatResponse = await makeRequest('/api/renata/chat', {
      message: formatMessage,
      context: { action: 'format' }
    });
    const formatTime = Date.now() - formatStart;

    console.log(`⏱️ Formatting Time: ${formatTime}ms`);
    console.log(`🔧 Processing Type: ${formatTime > 2000 ? 'REAL AI' : 'LOCAL FORMATTING'}`);

    // Extract formatted code from the response data
    let formattedCode;
    if (formatResponse.data && formatResponse.data.formattedCode) {
      formattedCode = formatResponse.data.formattedCode;
    } else if (formatResponse.formattedCode) {
      formattedCode = formatResponse.formattedCode;
    } else {
      console.error('❌ No formatted code found in response');
      console.log('Response structure:', Object.keys(formatResponse));
      return false;
    }

    console.log(`📝 Formatted Code: ${formattedCode.length} chars, ${formattedCode.split('\n').length} lines`);

    // Step 3: Run formatted code and compare
    console.log('\n🧪 Step 3: Testing Formatted Code...');
    const edgeDevOutput = await runFormattedCode(formattedCode, 'edgeDev');
    const edgeDevResults = parseResults(edgeDevOutput);
    console.log(`📋 Edge Dev Results: ${edgeDevResults.length} hits`);

    // Step 4: Compare for parameter integrity
    const integrityPass = compareResults(baselineResults, edgeDevResults, 'main');

    // Final Result
    console.log('\n' + '='.repeat(60));
    console.log('🎯 PARAMETER INTEGRITY TEST RESULT:');
    if (integrityPass) {
      console.log('✅ SUCCESS: Parameter integrity preserved!');
      console.log('✅ Edge Dev platform maintains market-wide scanning accuracy');
      console.log('✅ All original scanner parameters preserved exactly');
    } else {
      console.log('❌ FAILURE: Parameter integrity corrupted!');
      console.log('❌ Edge Dev platform is changing scanner behavior');
      console.log('❌ Market-wide scanning results DO NOT match baseline');
      console.log('\n🔧 RECOMMENDATION:');
      console.log('   - Fix AI formatting to preserve ALL parameters exactly');
      console.log('   - Disable any code modifications that change algorithm behavior');
      console.log('   - Ensure 100% parameter integrity preservation');
    }

    return integrityPass;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run the critical test
testParameterIntegrity().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});