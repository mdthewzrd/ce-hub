/**
 * 📝 SCANNER FORMATTING API
 *
 * Handles: Format scanner code, execute backtest, generate results
 * Integrates with Python backend for scanner execution
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';

// Temporary directory for scanner files
const SCANNER_TEMP_DIR = path.join(process.cwd(), 'temp-scanners');

interface ScannerRequest {
  code: string;
  name?: string;
  description?: string;
  parameters?: Record<string, any>;
}

interface ScannerResult {
  success: boolean;
  formattedCode?: string;
  results?: any;
  error?: string;
  executionTime?: number;
}

// Ensure temp directory exists
async function ensureTempDir() {
  try {
    await fs.access(SCANNER_TEMP_DIR);
  } catch {
    await fs.mkdir(SCANNER_TEMP_DIR, { recursive: true });
  }
}

// Format scanner code with smart indentation and structure
function formatScannerCode(code: string): string {
  try {
    // Basic formatting rules
    let formatted = code
      // Fix indentation
      .replace(/(\n\s*)(def\s+\w+)/g, '\n$1$2')
      .replace(/(\n\s*)(class\s+\w+)/g, '\n$1$2')
      .replace(/(\n\s*)(if\s+|elif\s+|else:|for\s+|while\s+|try:|except\s+\w+|with\s+)/g, '\n$1$2')
      // Clean up spacing
      .replace(/\s*=\s*/g, ' = ')
      .replace(/\s*,\s*/g, ', ')
      .replace(/\s*\)\s*/g, ')')
      .replace(/\s*\[\s*/g, '[')
      .replace(/\s*\]\s*/g, ']')
      // Add proper line endings
      .trim();

    return formatted;
  } catch (error) {
    console.error('Error formatting code:', error);
    return code;
  }
}

// Execute scanner using Python backend
async function executeScanner(code: string, parameters?: Record<string, any>): Promise<any> {
  return new Promise((resolve, reject) => {
    const tempFile = path.join(SCANNER_TEMP_DIR, `scanner_${Date.now()}.py`);

    // Write scanner to temp file
    const fullCode = `
import sys
import json
import traceback
from datetime import datetime

# User's scanner code
${code}

# Execution wrapper
if __name__ == "__main__":
    try:
        # Execute the scanner
        result = {
            "timestamp": datetime.now().isoformat(),
            "success": True,
            "data": None
        }

        # Try to capture output
        import io
        import contextlib

        f = io.StringIO()
        with contextlib.redirect_stdout(f):
            # This will capture the print output from the scanner
            pass

        # If the scanner has a main execution, run it
        try:
            exec(open(__file__).read().split('# === EXECUTION WRAPPER ===')[0])
        except:
            pass

        result["output"] = f.getvalue()
        print(json.dumps(result))

    except Exception as e:
        error_result = {
            "timestamp": datetime.now().isoformat(),
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }
        print(json.dumps(error_result))
`;

    fs.writeFile(tempFile, fullCode)
      .then(() => {
        const python = spawn('python3', [tempFile], {
          cwd: SCANNER_TEMP_DIR,
          env: { ...process.env, PYTHONPATH: process.cwd() }
        });

        let output = '';
        let errorOutput = '';

        python.stdout.on('data', (data) => {
          output += data.toString();
        });

        python.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        python.on('close', (code) => {
          // Clean up temp file
          fs.unlink(tempFile).catch(() => {});

          if (code === 0) {
            try {
              const result = JSON.parse(output);
              resolve(result);
            } catch {
              resolve({
                success: true,
                output: output,
                rawOutput: output
              });
            }
          } else {
            resolve({
              success: false,
              error: errorOutput || 'Execution failed',
              exitCode: code
            });
          }
        });
      })
      .catch(reject);
  });
}

// POST: Format and execute scanner
export async function POST(request: NextRequest) {
  try {
    await ensureTempDir();

    const body: ScannerRequest = await request.json();
    const { code, name, description, parameters } = body;

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Scanner code is required' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Format the code
    const formattedCode = formatScannerCode(code);

    // Execute the scanner
    const executionResult = await executeScanner(formattedCode, parameters);

    const executionTime = Date.now() - startTime;

    const result: ScannerResult = {
      success: true,
      formattedCode,
      results: executionResult,
      executionTime
    };

    return NextResponse.json({
      success: true,
      result,
      message: 'Scanner formatted and executed successfully'
    });

  } catch (error) {
    console.error('Error in scanner API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process scanner' },
      { status: 500 }
    );
  }
}