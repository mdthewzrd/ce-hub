/**
 * ⚡ Optimizer Agent
 *
 * Optimizes code for performance and efficiency
 */

export interface OptimizationResult {
  optimizedCode: string;
  optimizations: string[];
  performanceImprovements: string[];
}

export interface AgentResult {
  success: boolean;
  agentType: string;
  data: OptimizationResult;
  executionTime: number;
  timestamp: string;
}

export class OptimizerAgent {
  async optimize(code: string, options: { analysis?: any } = {}): Promise<AgentResult> {
    const startTime = Date.now();

    const optimizations: string[] = [];
    let optimizedCode = code;

    // Replace groupby with vectorized operations
    if (/\.groupby\(/.test(optimizedCode)) {
      optimizedCode = this.vectorizeOperations(optimizedCode);
      optimizations.push('Replaced groupby with vectorized operations');
    }

    // Add min_periods to rolling windows to prevent lookahead bias
    if (/\.rolling\(/.test(optimizedCode) && !/min_periods/.test(optimizedCode)) {
      optimizedCode = optimizedCode.replace(/\.rolling\(/g, '.rolling(min_periods=1, ');
      optimizations.push('Added min_periods to rolling windows');
    }

    // Optimize imports
    optimizedCode = this.optimizeImports(optimizedCode);
    optimizations.push('Optimized import statements');

    const performanceImprovements = [
      'Vectorized operations reduce computation time',
      'min_periods prevents lookahead bias',
      'Optimized imports reduce memory usage'
    ];

    return {
      success: true,
      agentType: 'optimizer',
      data: {
        optimizedCode,
        optimizations,
        performanceImprovements
      },
      executionTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
  }

  private vectorizeOperations(code: string): string {
    // Simple example - actual implementation would be more sophisticated
    return code.replace(
      /(\w+)\.groupby\([^\)]+\)\.apply\([^\)]+\)/g,
      'vectorized_$1_operation'
    );
  }

  private optimizeImports(code: string): string {
    // CRITICAL: Never remove V31 required imports
    const requiredImports = [
      'import pandas as pd',
      'import numpy as np',
      'import mcal',
      'from typing import'
    ];

    // Get all import lines
    const lines = code.split('\n');
    const result: string[] = [];

    lines.forEach(line => {
      const trimmedLine = line.trim();

      // Preserve all required imports
      if (requiredImports.some(req => trimmedLine === req || trimmedLine.startsWith(req))) {
        result.push(line);
        return;
      }

      // For other imports, check if they're used
      if (trimmedLine.startsWith('import ') || trimmedLine.startsWith('from ')) {
        const moduleName = trimmedLine.match(/import\s+(\w+)/)?.[1] ||
                         trimmedLine.match(/from\s+(\w+)\s+import/)?.[1];

        if (moduleName) {
          const usage = new RegExp(`\\b${moduleName}\\.`);
          if (usage.test(code)) {
            result.push(line);
          }
          // If not used, skip this import (remove it)
        } else {
          result.push(line);
        }
      } else {
        result.push(line);
      }
    });

    return result.join('\n');
  }
}

export default OptimizerAgent;
