// Simple test of the natural date parser
const { parseNaturalDateRange } = require('./src/utils/natural-date-parser.ts')

// Test cases
const testCases = [
  "show me July to the end of August",
  "show me the 15th of January to the 13th of March",
  "display last quarter",
  "switch to year to date",
  "show me all time"
]

console.log('🧪 Testing Natural Date Parser...\n')

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: "${testCase}"`)
  try {
    const result = parseNaturalDateRange(testCase)
    if (result.success) {
      const { dateRange } = result
      console.log(`  ✅ SUCCESS: ${dateRange.label}`)
      if (dateRange.isCustom) {
        console.log(`     Custom: ${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`)
      }
      console.log(`     Confidence: ${result.confidence}`)
    } else {
      console.log(`  ❌ FAILED: ${result.error}`)
    }
  } catch (error) {
    console.log(`  💥 ERROR: ${error.message}`)
  }
  console.log('')
})