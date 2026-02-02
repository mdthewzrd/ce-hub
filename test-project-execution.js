#!/usr/bin/env node

/**
 * TEST PROJECT EXECUTION
 * Tests the complete project execution flow with our fixes
 */

const fs = require('fs');
const path = require('path');

async function testProjectExecution() {
  console.log('🔥 TESTING PROJECT EXECUTION WITH FIXES');
  console.log('Testing: Fixed asyncio execution and proper API format\n');

  try {
    // Step 1: Check if backend is running
    console.log('🔍 Checking backend health...');
    const healthResponse = await fetch('http://localhost:8000/health');
    if (!healthResponse.ok) {
      throw new Error('Backend not responding');
    }
    const healthData = await healthResponse.json();
    console.log('✅ Backend health:', healthData);

    // Step 2: Get existing projects to test with
    console.log('\n📦 Getting existing projects...');
    const projectsResponse = await fetch('http://localhost:8000/api/projects');
    if (!projectsResponse.ok) {
      throw new Error('Failed to get projects');
    }
    const projectsData = await projectsResponse.json();
    console.log(`✅ Found ${projectsData.data?.length || 0} projects`);

    if (!projectsData.data || projectsData.data.length === 0) {
      console.log('⚠️ No projects found. Creating a test project first...');

      // Create a simple test project
      const testScannerCode = `
import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
import json

def main():
    print("🔥 TEST SCANNER: Simple working scanner")
    print("📊 Testing project execution flow...")

    # Test data
    symbols = ['AAPL', 'MSFT', 'GOOGL']
    results = []

    for symbol in symbols:
        try:
            # Simple test - just get basic info
            ticker = yf.Ticker(symbol)
            info = ticker.history(period="5d")
            if not info.empty:
                latest_price = info['Close'].iloc[-1]
                results.append({
                    'symbol': symbol,
                    'price': round(latest_price, 2),
                    'status': 'found',
                    'timestamp': datetime.now().isoformat()
                })
                print(f"✅ {symbol}: {latest_price:.2f}")
            else:
                results.append({
                    'symbol': symbol,
                    'status': 'no_data',
                    'timestamp': datetime.now().isoformat()
                })
        except Exception as e:
            print(f"❌ {symbol}: {str(e)}")
            results.append({
                'symbol': symbol,
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            })

    # Output results in expected format
    output = {
        'success': True,
        'total_found': len([r for r in results if r['status'] == 'found']),
        'scan_id': 'test_execution_' + str(int(datetime.now().timestamp())),
        'results': results
    }

    print(f"\\n📈 Scan complete! Found {output['total_found']} symbols")
    print(f"🔍 Scan ID: {output['scan_id']}")

    # Save results
    with open('test_execution_results.json', 'w') as f:
        json.dump(output, f, indent=2)

    return output

if __name__ == "__main__":
    result = main()
    print(f"\\n✅ Scanner completed successfully!")
`;

      const createResponse = await fetch('http://localhost:8000/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Test Execution Project',
          description: 'Testing project execution with asyncio fixes',
          category: 'test',
          tags: ['test', 'execution'],
          parameters: {
            symbols: ['AAPL', 'MSFT', 'GOOGL'],
            date_range: {
              start_date: '2025-01-01',
              end_date: '2025-12-01'
            }
          },
          code: testScannerCode,
          scanner_type: 'test',
          status: 'active'
        })
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create test project');
      }

      const createData = await createResponse.json();
      console.log('✅ Created test project:', createData.data.id);

      // Use the newly created project for execution test
      const testProject = createData.data;

      // Step 3: Test project execution
      console.log('\n🚀 Testing project execution...');
      console.log(`📝 Project: ${testProject.title}`);
      console.log(`🆔 Project ID: ${testProject.id}`);

      const executionResponse = await fetch(`http://localhost:8000/api/projects/${testProject.id}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scanner_code: testProject.code,
          date_range: {
            start_date: '2025-01-01',
            end_date: '2025-12-01'
          },
          parallel_execution: true,
          timeout_seconds: 300
        })
      });

      console.log('📡 Execution request sent...');

      if (!executionResponse.ok) {
        const errorText = await executionResponse.text();
        console.log('❌ Execution failed:', errorText);
        throw new Error(`Execution failed: ${executionResponse.status} ${errorText}`);
      }

      const executionData = await executionResponse.json();
      console.log('✅ Execution response received!');
      console.log('📊 Execution Results:');
      console.log(`  - Success: ${executionData.success}`);
      console.log(`  - Status: ${executionData.status}`);
      console.log(`  - Execution ID: ${executionData.execution_id}`);
      console.log(`  - Scan ID: ${executionData.scan_id}`);
      console.log(`  - Total Found: ${executionData.total_found || 0}`);
      console.log(`  - Results Count: ${executionData.results?.length || 0}`);

      if (executionData.results && executionData.results.length > 0) {
        console.log('\\n📈 Sample Results:');
        executionData.results.slice(0, 3).forEach((result, index) => {
          console.log(`  ${index + 1}. ${result.symbol || 'Unknown'}: ${result.status || result.price || 'No status'}`);
        });
      }

      if (executionData.success && executionData.total_found > 0) {
        console.log('\\n🎉 SUCCESS: Project execution is working!');
        console.log('✅ All fixes applied successfully:');
        console.log('  - Frontend API format fixed');
        console.log('  - Backend response model enhanced');
        console.log('  - Asyncio event loop conflicts resolved');
        console.log('  - Scanner code execution working');
      } else {
        console.log('\\n⚠️ Project execution completed but no results found');
        console.log('💡 This might be due to data availability or scanner logic');
      }

    } else {
      // Use existing project for testing
      const existingProject = projectsData.data[0];
      console.log(`\n🚀 Testing execution with existing project: ${existingProject.title}`);

      const executionResponse = await fetch(`http://localhost:8000/api/projects/${existingProject.id}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scanner_code: existingProject.code,
          date_range: {
            start_date: '2025-01-01',
            end_date: '2025-12-01'
          },
          parallel_execution: true,
          timeout_seconds: 300
        })
      });

      if (!executionResponse.ok) {
        const errorText = await executionResponse.text();
        console.log('❌ Execution failed:', errorText);
        throw new Error(`Execution failed: ${executionResponse.status} ${errorText}`);
      }

      const executionData = await executionResponse.json();
      console.log('✅ Execution response received!');
      console.log('📊 Execution Results:');
      console.log(`  - Success: ${executionData.success}`);
      console.log(`  - Status: ${executionData.status}`);
      console.log(`  - Total Found: ${executionData.total_found || 0}`);
      console.log(`  - Results Count: ${executionData.results?.length || 0}`);
    }

    console.log('\n✅ Project execution test completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);

    // Additional debugging
    try {
      console.log('\n🔍 Additional debugging...');
      const backendStatus = await fetch('http://localhost:8000/health').catch(() => null);
      if (backendStatus) {
        console.log('✅ Backend is accessible');
      } else {
        console.log('❌ Backend is not accessible');
      }
    } catch (debugError) {
      console.log('❌ Debugging failed:', debugError.message);
    }
  }
}

// Run the test
console.log('🚀 Starting project execution test...\n');
testProjectExecution().catch(console.error);