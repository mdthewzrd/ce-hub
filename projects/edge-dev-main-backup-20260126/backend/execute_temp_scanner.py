"""
TEMPORARY SCANNER EXECUTION ENDPOINT
====================================

Executes scanner code sent from the frontend and returns the results.
Used by the execution validation system to compare original vs formatted scanners.

This endpoint:
1. Receives scanner code as a string
2. Saves it to a temporary file
3. Executes it with the given parameters
4. Returns the signals/results
5. Cleans up temporary files
"""

import os
import sys
import json
import tempfile
import subprocess
import re
from datetime import datetime
from typing import Dict, Any, List, Union, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


def fix_pattern_assignments_for_eval(code: str) -> str:
    """
    Fix pattern_assignments to be compatible with df.eval()

    The bug: Pattern logic may have inconsistent column references.
    The fix: Remove ALL df[' prefixes for df.eval() compatibility.

    Args:
        code: Scanner code with potentially broken pattern_assignments

    Returns:
        Fixed code with pattern_assignments compatible with df.eval()
    """

    # Find the pattern_assignments section
    pattern_match = re.search(
        r'self\.pattern_assignments = \[(.*?)\]',
        code,
        re.DOTALL
    )

    if not pattern_match:
        return code  # No pattern_assignments found

    patterns_str = pattern_match.group(1)

    # Fix by removing ALL df[' prefixes and closing brackets
    # This is the correct format for df.eval()
    def fix_logic(match):
        logic = match.group(1)

        # Remove all df['...' and make them bare column names
        fixed_logic = re.sub(r"df\['([^']+)'\]", r'\1', logic)

        return fixed_logic

    # Apply the fix to each pattern's logic
    fixed_patterns = re.sub(
        r'"logic":\s*"([^"]*(?:h>|l>|c_>|o_>|v_>|high_|low_|close_|open_|gap_|high_pct_|pct_chg|dist_|ema_|highest_|lowest_|c_ua|l_ua|v_ua|dol_|range|rvol|atr|true_|close_|d1_|high_chg)[^"]*)"',
        lambda m: '"logic": "' + fix_logic(m) + '"',
        patterns_str,
        flags=re.DOTALL
    )

    # Replace the old pattern_assignments with the fixed version
    fixed_code = code[:pattern_match.start()] + 'self.pattern_assignments = [' + fixed_patterns + ']' + code[pattern_match.end():]

    print("✅ Applied pattern_assignments fix for df.eval() compatibility")

    return fixed_code


class ExecutionRequest(BaseModel):
    scanner_code: str
    start_date: str
    end_date: str
    tickers: Optional[List[str]] = None
    timeout: int = 30


class ExecutionResponse(BaseModel):
    success: bool
    results: List[Dict[str, Any]] = []
    scanner_type: str = "unknown"
    tickers_tested: int = 0
    execution_time: float = 0.0
    error: Optional[str] = None


@router.post("/execute-temp", response_model=ExecutionResponse)
async def execute_temp_scanner(request: ExecutionRequest):
    """
    Execute a temporary scanner and return the results.

    This is used by the execution validation system to:
    1. Test if formatted scanners produce the same results as templates
    2. Validate pattern preservation by actual execution
    3. Compare outputs between original and formatted versions
    """
    start_time = datetime.now()
    temp_file_path = None

    try:
        # Validate inputs
        if not request.scanner_code or not request.scanner_code.strip():
            raise HTTPException(status_code=400, detail="Scanner code is empty")

        # 🎯 Apply pattern_assignments fix for multi-scanners
        scanner_code = fix_pattern_assignments_for_eval(request.scanner_code)

        # Create temporary scanner file
        with tempfile.NamedTemporaryFile(
            mode='w',
            suffix='_temp_scanner.py',
            delete=False,
            dir=os.path.dirname(os.path.abspath(__file__))
        ) as temp_file:
            temp_file_path = temp_file.name

            # Write the fixed scanner code to the temp file
            temp_file.write(scanner_code)
            temp_file.flush()

        # Prepare execution command
        scanner_name = os.path.basename(temp_file_path).replace('.py', '')
        exec_command = [
            sys.executable,  # Use current Python interpreter
            temp_file_path,
            '--start-date', request.start_date,
            '--end-date', request.end_date
        ]

        # Add tickers if provided
        if request.tickers:
            exec_command.extend(['--tickers', ','.join(request.tickers)])

        # Execute the scanner
        print(f"🔬 Executing temporary scanner: {temp_file_path}")
        print(f"   Command: {' '.join(exec_command)}")

        result = subprocess.run(
            exec_command,
            capture_output=True,
            text=True,
            timeout=request.timeout,
            cwd=os.path.dirname(os.path.abspath(__file__))
        )

        # Check for execution errors
        if result.returncode != 0:
            error_output = result.stderr or result.stdout or "Unknown error"
            print(f"❌ Scanner execution failed:")
            print(f"   Return code: {result.returncode}")
            print(f"   Error: {error_output}")

            return ExecutionResponse(
                success=False,
                error=f"Scanner execution failed: {error_output}",
                execution_time=(datetime.now() - start_time).total_seconds()
            )

        # Parse the output
        print(f"✅ Scanner executed successfully")
        print(f"   Output length: {len(result.stdout)} characters")

        # Try to parse as JSON first
        try:
            output_data = json.loads(result.stdout)

            # Handle different output formats
            if isinstance(output_data, dict):
                results = output_data.get('results', output_data.get('signals', []))
                scanner_type = output_data.get('scanner_type', 'unknown')
            elif isinstance(output_data, list):
                results = output_data
                scanner_type = 'detected'
            else:
                results = []
                scanner_type = 'unknown'

        except json.JSONDecodeError:
            # Not JSON, try to parse as text output from multi-scanner
            print(f"⚠️  Output is not JSON, attempting text parsing...")

            # Check if it's a multi-scanner with signals
            if "✅ SCAN COMPLETE" in result.stdout and "Final signals" in result.stdout:
                print("🎯 Detected multi-scanner output")

                # Parse the signals section
                results = []
                in_signals_section = False
                for line in result.stdout.split('\n'):
                    line = line.strip()

                    # Look for the signal lines (format:  TICKER   | DATE       | PATTERN)
                    if '|' in line and not line.startswith('='):
                        parts = [p.strip() for p in line.split('|')]
                        if len(parts) >= 3:
                            # Try to parse as signal line
                            try:
                                ticker = parts[0]
                                date_str = parts[1]
                                pattern = parts[2]

                                # Clean up formatting
                                ticker = ticker.strip()
                                date_str = date_str.strip()
                                pattern = pattern.strip()

                                # Skip header lines
                                if ticker in ['Ticker', '📊'] or date_str in ['Date', 'ALL']:
                                    continue

                                results.append({
                                    'Ticker': ticker,
                                    'Date': date_str,
                                    'Scanner_Label': pattern,
                                    'symbol': ticker
                                })
                            except Exception as e:
                                print(f"⚠️  Could not parse line: {line} ({e})")
                                continue

                scanner_type = 'multi_scanner_text'
                print(f"✅ Parsed {len(results)} signals from multi-scanner output")

            elif len(result.stdout.strip()) > 0 and "❌ NO SIGNALS FOUND" not in result.stdout:
                # Try to parse as CSV or other format
                lines = result.stdout.strip().split('\n')
                if len(lines) > 1:
                    headers = lines[0].split(',')
                    results = []
                    for line in lines[1:]:
                        values = line.split(',')
                        if len(values) == len(headers):
                            result_dict = dict(zip(headers, values))
                            results.append(result_dict)

                    scanner_type = 'csv_format'
                else:
                    results = []
                    scanner_type = 'unknown'
            else:
                results = []
                scanner_type = 'no_signals'

        execution_time = (datetime.now() - start_time).total_seconds()

        print(f"📊 Execution results:")
        print(f"   Results: {len(results)} signals")
        print(f"   Scanner type: {scanner_type}")
        print(f"   Execution time: {execution_time:.2f}s")

        return ExecutionResponse(
            success=True,
            results=results,
            scanner_type=scanner_type,
            tickers_tested=len(set(r.get('T', r.get('ticker', '')) for r in results)),
            execution_time=execution_time
        )

    except subprocess.TimeoutExpired:
        print(f"⏱️  Scanner execution timed out after {request.timeout}s")
        return ExecutionResponse(
            success=False,
            error=f"Scanner execution timed out after {request.timeout} seconds",
            execution_time=request.timeout
        )

    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()

        return ExecutionResponse(
            success=False,
            error=f"Unexpected error: {str(e)}",
            execution_time=(datetime.now() - start_time).total_seconds()
        )

    finally:
        # Clean up temporary file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
                print(f"🧹 Cleaned up temporary file: {temp_file_path}")
            except Exception as e:
                print(f"⚠️  Failed to clean up temporary file: {e}")


@router.get("/health")
async def health_check():
    """Health check endpoint for the execution service."""
    return {
        "service": "scanner-execution",
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }
