/**
 * 🤖 Renata Rebuild Service
 * Connects to Python Renata Rebuild API for intelligent code transformation
 */

interface TransformRequest {
  code: string;
  filename?: string;
  preserve_logic?: boolean;
  validate_only?: boolean;
}

interface TransformResponse {
  success: boolean;
  scanner_type: string;
  confidence: number;
  transformed_code?: string;
  analysis?: any;
  validation?: any;
  errors?: string[];
}

interface AnalysisResponse {
  success: boolean;
  scanner_type?: string;
  structure_type?: string;
  parameters?: any;
  anti_patterns?: string[];
  standardizations?: string[];
  errors?: string[];
}

interface ScannerDetectionResponse {
  success: boolean;
  scanner_type?: string;
  structure_type?: string;
  confidence?: number;
  matching_patterns?: string[];
  reasoning?: string;
  error?: string;
}

export class RenataRebuildService {
  private apiBaseUrl: string;
  private enabled: boolean;

  constructor() {
    // Python API runs on port 5667 (5665: frontend, 5666: backend, 5667: AI)
    this.apiBaseUrl = process.env.RENATA_REBUILD_API || 'http://127.0.0.1:5667';
    this.enabled = true;
  }

  /**
   * Check if the Python API is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000) // 2 second timeout
      });
      return response.ok;
    } catch (error) {
      console.warn('Renata Rebuild API not available:', error);
      return false;
    }
  }

  /**
   * Transform code to EdgeDev standards
   */
  async transformCode(request: TransformRequest): Promise<TransformResponse> {
    if (!this.enabled) {
      throw new Error('Renata Rebuild service is disabled');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/transform`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: request.code,
          filename: request.filename || 'scanner.py',
          preserve_logic: request.preserve_logic !== false,
          validate_only: request.validate_only || false
        }),
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Renata Rebuild transform error:', error);
      return {
        success: false,
        scanner_type: 'unknown',
        confidence: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Analyze code without transformation
   */
  async analyzeCode(code: string, filename: string = 'scanner.py'): Promise<AnalysisResponse> {
    if (!this.enabled) {
      throw new Error('Renata Rebuild service is disabled');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, filename }),
        signal: AbortSignal.timeout(15000)
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Renata Rebuild analyze error:', error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Detect scanner type
   */
  async detectScannerType(code: string, description?: string): Promise<ScannerDetectionResponse> {
    if (!this.enabled) {
      throw new Error('Renata Rebuild service is disabled');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/detect-scanner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, description }),
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Renata Rebuild detection error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validate code against EdgeDev standards
   */
  async validateCode(code: string, filename: string = 'scanner.py'): Promise<any> {
    if (!this.enabled) {
      throw new Error('Renata Rebuild service is disabled');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, filename }),
        signal: AbortSignal.timeout(15000)
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Renata Rebuild validation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get available templates
   */
  async getTemplates(): Promise<any> {
    if (!this.enabled) {
      throw new Error('Renata Rebuild service is disabled');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/templates`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Renata Rebuild templates error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate a conversational response from transform result
   */
  generateTransformResponse(result: TransformResponse, originalCode: string): string {
    if (!result.success) {
      return `❌ **Transformation Failed**

I encountered errors transforming your code:
${result.errors?.map(e => `• ${e}`).join('\n') || 'Unknown error'}

Please check your code and try again.`;
    }

    let response = `🔧 **EdgeDev Code Transformation Complete!**

**Scanner Type**: ${this.formatScannerType(result.scanner_type)}
**Confidence**: ${Math.round(result.confidence * 100)}%

`;

    if (result.analysis) {
      const analysis = result.analysis;

      if (analysis.parameters_extracted) {
        response += `**Parameters Preserved**: ${Object.keys(analysis.parameters_extracted).length}\n`;
      }

      if (analysis.standardizations_applied) {
        response += `**EdgeDev Standardizations Applied**: ${analysis.standardizations_applied.length}\n`;
        response += `\n✨ **Applied Standardizations:**\n`;
        analysis.standardizations_applied.forEach((std: string) => {
          response += `• ${std}\n`;
        });
        response += '\n';
      }
    }

    if (result.validation) {
      const validation = result.validation;
      if (validation.valid) {
        response += `✅ **Validation**: All checks passed!\n`;
      } else {
        response += `⚠️ **Validation**: Some checks failed\n`;
        if (validation.validation_results) {
          validation.validation_results.forEach((v: any) => {
            if (!v.passed) {
              response += `• ${v.category}: ${v.message}\n`;
            }
          });
        }
      }
    }

    response += `\nYour code is now fully standardized with EdgeDev 3-stage architecture and all 7 mandatory standardizations!`;

    return response;
  }

  /**
   * Format scanner type for display
   */
  private formatScannerType(type: string): string {
    const displayNames: Record<string, string> = {
      'backside_b': 'Backside B',
      'a_plus': 'A Plus',
      'half_a_plus': 'Half A Plus',
      'lc_d2': 'LC D2',
      'lc_3d_gap': 'LC 3D Gap',
      'd1_gap': 'D1 Gap',
      'extended_gap': 'Extended Gap',
      'sc_dmr': 'SC DMR',
      'custom': 'Custom Scanner'
    };

    return displayNames[type] || type;
  }
}

// Export singleton instance
export const renataRebuildService = new RenataRebuildService();
