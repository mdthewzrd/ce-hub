/**
 * Test Systematic Scan API
 * Tests both streaming and non-streaming modes to validate progress feedback
 */

async function testScanAPI() {
  console.log("🔄 Testing Systematic Scan API...\n");

  const baseUrl = "http://localhost:5657";
  const scanFilters = {
    lc_frontside_d2_extended: true,
    lc_frontside_d3_extended_1: true,
    min_gap: 0.5,
    min_pm_vol: 5000000,
    min_prev_close: 0.75
  };

  console.log("📊 Testing streaming scan with progress updates...");
  console.log("Filters:", JSON.stringify(scanFilters, null, 2));

  try {
    const response = await fetch(`${baseUrl}/api/systematic/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filters: scanFilters,
        scan_date: '2024-10-25',
        enable_progress: true
      }),
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API Error:", errorText);
      return;
    }

    console.log("✅ Response received, processing stream...\n");

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (reader) {
      let receivedData = [];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            receivedData.push(data);

            if (data.type === 'progress') {
              console.log(`📈 Progress: ${data.progress}% - ${data.message}`);
            } else if (data.type === 'complete') {
              console.log(`✅ Scan Complete: Found ${data.results.length} tickers`);
              console.log("Sample results:", data.results.slice(0, 2));
            } else if (data.type === 'error') {
              console.log(`❌ Error: ${data.message}`);
            }
          } catch (parseError) {
            console.log("Raw data:", line);
          }
        }
      }

      console.log(`\n📋 Summary: Received ${receivedData.length} progress updates`);

      const progressUpdates = receivedData.filter(d => d.type === 'progress');
      const completeData = receivedData.find(d => d.type === 'complete');

      console.log(`   Progress updates: ${progressUpdates.length}`);
      console.log(`   Final results: ${completeData ? completeData.results.length : 0} tickers`);

      if (progressUpdates.length === 0) {
        console.log("⚠️  No progress updates received - this explains the missing progress bar!");
      }

    } else {
      console.error("❌ No reader available from response");
    }

  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("Full error:", error);
  }

  console.log("\n🔧 Testing non-streaming mode for comparison...");

  try {
    const response = await fetch(`${baseUrl}/api/systematic/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filters: scanFilters,
        scan_date: '2024-10-25',
        enable_progress: false
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log("✅ Non-streaming scan result:", {
        success: result.success,
        resultsCount: result.results?.length || 0,
        message: result.message
      });
    } else {
      console.log("❌ Non-streaming scan failed:", response.status);
    }

  } catch (error) {
    console.error("❌ Non-streaming test failed:", error.message);
  }

  console.log("\n🎯 Diagnosis Complete!");
  console.log("If you see progress updates above, the API works and the frontend should show progress.");
  console.log("If no progress updates, there's a backend issue preventing the progress stream.");
}

// Run the test
testScanAPI().catch(console.error);