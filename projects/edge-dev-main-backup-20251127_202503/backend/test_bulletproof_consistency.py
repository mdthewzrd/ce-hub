#!/usr/bin/env python3
"""
Bulletproof AI Scanner Consistency Test
Validates that the new retry logic ensures 100% consistent results
"""

import asyncio
import aiohttp
import json
import time
from typing import Dict, List

async def test_bulletproof_consistency():
    """Test the bulletproof AI scanner with multiple runs to ensure consistency"""

    print("🎯 BULLETPROOF AI SCANNER CONSISTENCY TEST")
    print("=" * 60)
    print("Testing new retry logic and validation system...")
    print()

    # Load the user's scanner file
    file_path = '/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (2).py'
    with open(file_path, 'r') as f:
        code = f.read()

    print(f"📄 File: {file_path}")
    print(f"📊 Size: {len(code):,} characters")
    print()

    payload = {'code': code, 'filename': 'lc d2 scan - oct 25 new ideas (2).py'}

    # Track results across multiple runs
    results = []
    success_count = 0
    total_runs = 5

    print(f"🔄 Running {total_runs} consistency tests...")
    print()

    async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=60)) as session:
        for run in range(1, total_runs + 1):
            print(f"Run {run}/{total_runs}: ", end="", flush=True)

            try:
                start_time = time.time()

                async with session.post('http://localhost:8000/api/format/ai-split-scanners', json=payload) as response:
                    duration = time.time() - start_time

                    if response.status == 200:
                        result = await response.json()

                        scanner_count = result.get('total_scanners', 0)
                        success = result.get('success', False)
                        confidence = result.get('analysis_confidence', 0)
                        method = result.get('method', 'Unknown')

                        # Check if this is the bulletproof method
                        is_bulletproof = 'Bulletproof' in method

                        # Analyze result quality
                        if success and scanner_count == 3:
                            print(f"✅ SUCCESS - {scanner_count} scanners ({duration:.1f}s)")
                            success_count += 1

                            # Analyze parameter extraction
                            scanners = result.get('scanners', [])
                            total_params = sum(len(scanner.get('parameters', [])) for scanner in scanners)

                            result_summary = {
                                'run': run,
                                'success': True,
                                'scanner_count': scanner_count,
                                'parameter_count': total_params,
                                'confidence': confidence,
                                'duration': duration,
                                'method': method,
                                'is_bulletproof': is_bulletproof
                            }
                        else:
                            print(f"❌ FAILED - {scanner_count} scanners ({duration:.1f}s)")
                            result_summary = {
                                'run': run,
                                'success': False,
                                'scanner_count': scanner_count,
                                'parameter_count': 0,
                                'confidence': confidence,
                                'duration': duration,
                                'method': method,
                                'is_bulletproof': is_bulletproof
                            }

                        results.append(result_summary)

                    else:
                        print(f"❌ HTTP {response.status} ({time.time() - start_time:.1f}s)")
                        results.append({
                            'run': run,
                            'success': False,
                            'scanner_count': 0,
                            'parameter_count': 0,
                            'confidence': 0,
                            'duration': time.time() - start_time,
                            'method': 'ERROR',
                            'is_bulletproof': False,
                            'error': f"HTTP {response.status}"
                        })

            except asyncio.TimeoutError:
                print(f"⏰ TIMEOUT (60s+)")
                results.append({
                    'run': run,
                    'success': False,
                    'scanner_count': 0,
                    'parameter_count': 0,
                    'confidence': 0,
                    'duration': 60.0,
                    'method': 'TIMEOUT',
                    'is_bulletproof': False,
                    'error': 'Timeout'
                })

            except Exception as e:
                print(f"❌ EXCEPTION: {str(e)[:50]}")
                results.append({
                    'run': run,
                    'success': False,
                    'scanner_count': 0,
                    'parameter_count': 0,
                    'confidence': 0,
                    'duration': 0,
                    'method': 'EXCEPTION',
                    'is_bulletproof': False,
                    'error': str(e)
                })

            if run < total_runs:
                await asyncio.sleep(2)  # Wait between tests

    print()
    print("📊 CONSISTENCY ANALYSIS")
    print("=" * 30)

    # Analyze results
    success_rate = (success_count / total_runs) * 100
    print(f"Success Rate: {success_count}/{total_runs} ({success_rate:.1f}%)")

    successful_results = [r for r in results if r['success']]

    if successful_results:
        # Check consistency of scanner counts
        scanner_counts = [r['scanner_count'] for r in successful_results]
        consistent_scanners = all(count == 3 for count in scanner_counts)

        # Check parameter extraction consistency
        param_counts = [r['parameter_count'] for r in successful_results]
        avg_params = sum(param_counts) / len(param_counts) if param_counts else 0
        min_params = min(param_counts) if param_counts else 0
        max_params = max(param_counts) if param_counts else 0

        # Check response times
        durations = [r['duration'] for r in successful_results]
        avg_duration = sum(durations) / len(durations) if durations else 0

        # Check bulletproof method usage
        bulletproof_count = sum(1 for r in successful_results if r['is_bulletproof'])

        print()
        print("📈 DETAILED METRICS:")
        print(f"  Scanner Detection: {'✅ Consistent (3 scanners)' if consistent_scanners else '❌ Inconsistent'}")
        print(f"  Parameter Extraction: {avg_params:.1f} avg ({min_params}-{max_params} range)")
        print(f"  Average Duration: {avg_duration:.1f} seconds")
        print(f"  Bulletproof Method: {bulletproof_count}/{len(successful_results)} runs")

        print()
        print("🎯 USER EXPERIENCE PREDICTION:")
        if success_rate >= 100 and consistent_scanners and avg_params > 0:
            print("  ✅ EXCELLENT: User will see consistent 3 scanners with parameters")
            print("  ✅ \"0 Parameters Made Configurable\" issue is RESOLVED!")
        elif success_rate >= 80 and consistent_scanners:
            print("  ⚠️ GOOD: Mostly consistent, occasional retries needed")
        else:
            print("  ❌ POOR: User will still experience inconsistent results")

    else:
        print("❌ NO SUCCESSFUL RUNS - System needs further debugging")

    print()
    print("📋 RUN-BY-RUN BREAKDOWN:")
    for result in results:
        status = "✅" if result['success'] else "❌"
        method_info = result['method']
        if result.get('error'):
            method_info += f" ({result['error']})"

        print(f"  Run {result['run']}: {status} {result['scanner_count']} scanners, "
              f"{result.get('parameter_count', 0)} params, "
              f"{result['duration']:.1f}s - {method_info}")

    print()
    print("🔧 BULLETPROOF SYSTEM STATUS:")
    if bulletproof_count == success_count:
        print("  ✅ Bulletproof method working correctly")
    else:
        print(f"  ⚠️ Bulletproof method used in {bulletproof_count}/{success_count} successful runs")

    return {
        'success_rate': success_rate,
        'consistent_scanners': consistent_scanners if successful_results else False,
        'average_parameters': avg_params if successful_results else 0,
        'average_duration': avg_duration if successful_results else 0,
        'bulletproof_usage': bulletproof_count,
        'total_runs': total_runs,
        'successful_runs': success_count
    }

async def main():
    """Main test execution"""
    start_time = time.time()

    try:
        results = await test_bulletproof_consistency()

        print()
        print("=" * 60)
        print("🏁 FINAL ASSESSMENT")

        if (results['success_rate'] == 100 and
            results['consistent_scanners'] and
            results['average_parameters'] > 0):
            print("🎉 BULLETPROOF SYSTEM IS WORKING PERFECTLY!")
            print("✅ User's consistency issue has been COMPLETELY RESOLVED")
        elif results['success_rate'] >= 80:
            print("⚡ BULLETPROOF SYSTEM IS MOSTLY WORKING")
            print("⚠️ Some improvement still needed for 100% consistency")
        else:
            print("🚨 BULLETPROOF SYSTEM NEEDS MORE WORK")
            print("❌ User will still experience inconsistent results")

    except Exception as e:
        print(f"❌ Test execution failed: {str(e)}")

    total_time = time.time() - start_time
    print(f"⏱️ Total test time: {total_time:.1f} seconds")

if __name__ == "__main__":
    asyncio.run(main())