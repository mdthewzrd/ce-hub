// Quick test to debug date range formatting issue
console.log('🧪 Date Range Format Test')

// Test the same formatting logic from DateRangeContext
function formatDateLocal(date) {
  const month = date.toLocaleDateString('en-US', { month: 'short' })
  const day = date.getDate()
  const year = date.getFullYear()
  return `${month} ${day}`
}

function formatDateRangeLocal(start, end) {
  if (start.getTime() === end.getTime()) {
    return formatDateLocal(start)
  }

  const startFormatted = formatDateLocal(start)
  const endFormatted = formatDateLocal(end)

  // Add year to end if different year
  if (start.getFullYear() !== end.getFullYear()) {
    return `${startFormatted} - ${endFormatted}, ${end.getFullYear()}`
  }

  return `${startFormatted} - ${endFormatted}`
}

// Test cases
const today = new Date()
const lastMonth = new Date(today)
lastMonth.setMonth(today.getMonth() - 1)

const testCases = [
  { start: today, end: today, label: 'Same day' },
  { start: lastMonth, end: today, label: 'Different months, same year' },
  { start: new Date(2023, 11, 25), end: new Date(2024, 0, 5), label: 'Different years' },
]

console.log('\n📅 Test Results:')
testCases.forEach(test => {
  const formatted = formatDateRangeLocal(test.start, test.end)
  console.log(`${test.label}: ${formatted}`)
})

// Export for use in component
window.debugDateRange = formatDateRangeLocal