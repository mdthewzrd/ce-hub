/**
 * Working Progress Test - This demonstrates the progress system actually working
 * Shows step-by-step progress updates that should appear in the exec dashboard
 */

async function testWorkingProgress() {
  console.log("🧪 Testing Working Progress System\n");

  const response = await fetch('http://localhost:5657/api/systematic/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filters: {
        lc_frontside_d2_extended: true,
        lc_frontside_d3_extended_1: true,
        min_gap: 0.5,
        min_pm_vol: 5000000,
        min_prev_close: 0.75
      },
      scan_date: '2024-10-25',
      enable_progress: true
    })
  });

  console.log("📡 Response status:", response.status);

  if (!response.ok) {
    console.error("❌ Failed:", await response.text());
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let progressCount = 0;

  console.log("📈 Real-time progress updates:\n");

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(line => line.trim());

    for (const line of lines) {
      try {
        const data = JSON.parse(line);
        progressCount++;

        if (data.type === 'progress') {
          console.log(`🔄 [${progressCount}] ${data.progress}% - ${data.message}`);
        } else if (data.type === 'complete') {
          console.log(`✅ [${progressCount}] COMPLETE - Found ${data.results.length} results`);
          console.log("Sample results:", data.results.slice(0, 2));
        } else if (data.type === 'error') {
          console.log(`❌ [${progressCount}] ERROR - ${data.message}`);
          console.log("Error details:", data.error);
        }
      } catch (e) {
        console.log("Raw data:", line);
      }
    }
  }

  console.log(`\n📊 Total progress updates received: ${progressCount}`);

  if (progressCount >= 2) {
    console.log("✅ SUCCESS: Progress system is working!");
    console.log("You should see these same updates in the exec dashboard");
  } else {
    console.log("❌ ISSUE: Not enough progress updates received");
  }
}

testWorkingProgress().catch(console.error);