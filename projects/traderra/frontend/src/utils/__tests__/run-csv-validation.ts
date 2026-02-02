#!/usr/bin/env node

/**
 * STANDALONE CSV VALIDATION RUNNER
 * Executes comprehensive quality assurance testing for TradervUE CSV processing
 */

import { runCSVValidationSuite, ComprehensiveTestReport } from './csv-validation-suite'
import { writeFileSync } from 'fs'
import { join } from 'path'

async function main() {
  console.log('🚀 CE-Hub Quality Assurance: CSV Upload Validation Suite')
  console.log('=' + '='.repeat(79))
  console.log('📋 Mission: Validate 1,787 TradervUE trades processing')
  console.log('🎯 Objective: Ensure zero data loss and accurate calculations')
  console.log('⚡ Performance Target: <30 seconds processing time')
  console.log('')

  const csvFilePath = '/Users/michaeldurante/Downloads/trades.csv'

  try {
    // Execute comprehensive validation
    const report = await runCSVValidationSuite(csvFilePath)

    // Display results
    displayReport(report)

    // Save detailed report
    const reportPath = join(__dirname, 'validation-report.json')
    writeFileSync(reportPath, JSON.stringify(report, null, 2))
    console.log(`📄 Detailed report saved: ${reportPath}`)

    // Save human-readable summary
    const summaryPath = join(__dirname, 'validation-summary.md')
    writeFileSync(summaryPath, generateMarkdownReport(report))
    console.log(`📋 Summary report saved: ${summaryPath}`)

    // Exit with appropriate code
    process.exit(report.overallStatus === 'FAIL' ? 1 : 0)

  } catch (error) {
    console.error('❌ CRITICAL FAILURE:', error)
    process.exit(1)
  }
}

function displayReport(report: ComprehensiveTestReport) {
  console.log('')
  console.log('📊 VALIDATION RESULTS')
  console.log('=' + '='.repeat(79))

  // Overall status
  const statusIcon = report.overallStatus === 'PASS' ? '✅' :
                    report.overallStatus === 'WARNING' ? '⚠️' : '❌'
  console.log(`${statusIcon} Overall Status: ${report.overallStatus}`)
  console.log(`⏱️  Execution Time: ${report.executionTime}ms`)
  console.log(`📈 Tests: ${report.passedTests}/${report.totalTests} passed`)

  if (report.failedTests > 0) {
    console.log(`❌ Failed Tests: ${report.failedTests}`)
  }
  if (report.warningTests > 0) {
    console.log(`⚠️  Tests with Warnings: ${report.warningTests}`)
  }

  console.log('')
  console.log('🏆 QUALITY GATES')
  console.log('-'.repeat(40))
  console.log(`Data Integrity:       ${report.summary.dataIntegrity === 'PASS' ? '✅' : '❌'} ${report.summary.dataIntegrity}`)
  console.log(`Calculation Accuracy: ${report.summary.calculationAccuracy === 'PASS' ? '✅' : '❌'} ${report.summary.calculationAccuracy}`)
  console.log(`Performance Standards:${report.summary.performanceStandards === 'PASS' ? '✅' : '❌'} ${report.summary.performanceStandards}`)
  console.log(`Security Validation:  ${report.summary.securityValidation === 'PASS' ? '✅' : '❌'} ${report.summary.securityValidation}`)
  console.log(`Production Readiness: ${report.summary.productionReadiness === 'PASS' ? '✅' : '❌'} ${report.summary.productionReadiness}`)

  console.log('')
  console.log('🔍 DETAILED TEST RESULTS')
  console.log('-'.repeat(80))

  report.results.forEach(result => {
    const icon = result.passed ? '✅' : '❌'
    const duration = result.duration.toString().padStart(4, ' ')
    console.log(`${icon} ${result.testName.padEnd(35, ' ')} ${duration}ms`)

    if (result.errors.length > 0) {
      result.errors.forEach(error => {
        console.log(`   ❌ ${error}`)
      })
    }

    if (result.warnings.length > 0) {
      result.warnings.forEach(warning => {
        console.log(`   ⚠️  ${warning}`)
      })
    }
  })

  if (report.criticalIssues.length > 0) {
    console.log('')
    console.log('🚨 CRITICAL ISSUES')
    console.log('-'.repeat(80))
    report.criticalIssues.forEach(issue => {
      console.log(`❌ ${issue}`)
    })
  }

  console.log('')
  console.log('📋 RECOMMENDATION')
  console.log('-'.repeat(80))

  if (report.summary.productionReadiness === 'PASS') {
    console.log('✅ APPROVED FOR PRODUCTION DEPLOYMENT')
    console.log('   All quality gates passed. Implementation ready for user deployment.')
  } else if (report.overallStatus === 'WARNING') {
    console.log('⚠️  CONDITIONAL APPROVAL')
    console.log('   Minor issues detected. Review warnings before deployment.')
  } else {
    console.log('❌ NOT READY FOR PRODUCTION')
    console.log('   Critical issues must be resolved before deployment.')
  }
}

function generateMarkdownReport(report: ComprehensiveTestReport): string {
  return `# CSV Upload Validation Report

## Executive Summary

- **Overall Status**: ${report.overallStatus}
- **Execution Time**: ${report.executionTime}ms
- **Tests Passed**: ${report.passedTests}/${report.totalTests}
- **Production Ready**: ${report.summary.productionReadiness}

## Quality Gates

| Component | Status |
|-----------|--------|
| Data Integrity | ${report.summary.dataIntegrity} |
| Calculation Accuracy | ${report.summary.calculationAccuracy} |
| Performance Standards | ${report.summary.performanceStandards} |
| Security Validation | ${report.summary.securityValidation} |
| **Production Readiness** | **${report.summary.productionReadiness}** |

## Test Results

${report.results.map(result => `
### ${result.testName}
- **Status**: ${result.passed ? 'PASS' : 'FAIL'}
- **Duration**: ${result.duration}ms
${result.errors.length > 0 ? `- **Errors**: ${result.errors.join(', ')}` : ''}
${result.warnings.length > 0 ? `- **Warnings**: ${result.warnings.join(', ')}` : ''}
`).join('')}

${report.criticalIssues.length > 0 ? `
## Critical Issues
${report.criticalIssues.map(issue => `- ${issue}`).join('\n')}
` : ''}

## Recommendation

${report.summary.productionReadiness === 'PASS'
  ? '✅ **APPROVED FOR PRODUCTION DEPLOYMENT**\n\nAll quality gates passed. Implementation ready for user deployment.'
  : report.overallStatus === 'WARNING'
  ? '⚠️ **CONDITIONAL APPROVAL**\n\nMinor issues detected. Review warnings before deployment.'
  : '❌ **NOT READY FOR PRODUCTION**\n\nCritical issues must be resolved before deployment.'
}

---
*Generated by CE-Hub Quality Assurance Suite*
`
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}

export { main as runValidation }