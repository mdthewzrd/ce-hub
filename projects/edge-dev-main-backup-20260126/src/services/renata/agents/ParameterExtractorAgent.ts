/**
 * 🔧 Parameter Extractor Agent
 *
 * Extracts and preserves scanner parameters during transformation
 */

export interface ParameterExtractionResult {
  parameters: Record<string, any>;
  count: number;
  parameterClass: string;
  preservedIntegrity: boolean;
}

export interface AgentResult {
  success: boolean;
  agentType: string;
  data: ParameterExtractionResult;
  executionTime: number;
  timestamp: string;
  errors?: string[];
}

/**
 * Parameter Extractor Agent - Extracts and preserves parameters
 */
export class ParameterExtractorAgent {
  async extract(code: string, analysis: any): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      console.log('🔧 Extracting parameters...');

      const parameters = this.extractParameters(code);
      const parameterClass = this.extractParameterClass(code);

      console.log(`✅ Extracted ${parameters.count} parameters`);

      return {
        success: true,
        agentType: 'parameter_extractor',
        data: {
          parameters: parameters.params,
          count: parameters.count,
          parameterClass,
          preservedIntegrity: true
        },
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Parameter extraction failed:', error);

      return {
        success: false,
        agentType: 'parameter_extractor',
        data: {
          parameters: {},
          count: 0,
          parameterClass: '',
          preservedIntegrity: false
        },
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  private extractParameters(code: string): { params: Record<string, any>; count: number } {
    const params: Record<string, any> = {};

    // Extract from ScannerConfig class
    const scannerConfigMatch = code.match(/class\s+ScannerConfig[^{]*:\s*([\s\S]*?)(?=\n\S|\n#|\nclass|\Z)/);
    if (scannerConfigMatch) {
      const content = scannerConfigMatch[1];
      const paramMatches = content.match(/^\s*(\w+)\s*=\s*([^#\n]+)/gm);

      if (paramMatches) {
        for (const match of paramMatches) {
          const [, name, value] = match.match(/^\s*(\w+)\s*=\s*([^#\n]+)/) || [];
          if (name && !name.startsWith('_') && name !== 'pass') {
            params[name] = value.trim();
          }
        }
      }
    }

    return { params, count: Object.keys(params).length };
  }

  private extractParameterClass(code: string): string {
    const scannerConfigMatch = code.match(/class\s+ScannerConfig[^{]*:\s*([\s\S]*?)(?=\n\S|\n#|\nclass|\Z)/);
    return scannerConfigMatch ? scannerConfigMatch[1].trim() : '';
  }
}

export default ParameterExtractorAgent;
