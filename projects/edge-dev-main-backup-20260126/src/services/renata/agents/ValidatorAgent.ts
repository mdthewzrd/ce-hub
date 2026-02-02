/**
 * ✅ Validator Agent
 *
 * Validates code against EdgeDev v31 standards
 */

export interface ValidationResult {
  score: number;
  checks: Record<string, { passed: boolean; description: string }>;
  passed: string[];
  failed: string[];
  recommendations: string[];
}

export interface AgentResult {
  success: boolean;
  agentType: string;
  data: ValidationResult;
  executionTime: number;
  timestamp: string;
}

export class ValidatorAgent {
  async validate(code: string, options: { standard?: string } = {}): Promise<AgentResult> {
    const startTime = Date.now();

    const checks = {
      run_scan: {
        passed: /def\s+run_scan\s*\(/.test(code),
        description: 'Has run_scan() entry point method'
      },
      d0_start_user: {
        passed: /d0_start_user/.test(code),
        description: 'Uses d0_start_user variable (with _user suffix)'
      },
      fetch_grouped_data: {
        passed: /def\s+fetch_grouped_data\s*\(/.test(code) && !/fetch_all/.test(code),
        description: 'Uses fetch_grouped_data() (not fetch_all)'
      },
      apply_smart_filters: {
        passed: /def\s+apply_smart_filters\s*\(/.test(code),
        description: 'Has apply_smart_filters() method for D0 filtering'
      },
      compute_features: {
        passed: /def\s+compute_(simple|full)_features\s*\(/.test(code),
        description: 'Has compute_simple_features() and/or compute_full_features()'
      },
      adv20_usd: {
        passed: /adv20_usd/.test(code) && !/ADV20_\$/.test(code),
        description: 'Uses adv20_usd (not ADV20_$)'
      },
      no_execute: {
        passed: !/def\s+(execute|run_and_save)\s*\(/.test(code),
        description: 'No deprecated execute() or run_and_save() methods'
      },
      market_calendar: {
        passed: /mcal\.get_calendar/.test(code),
        description: 'Uses mcal.get_calendar for market calendar'
      },
      prev_high_bug_fix: {
        passed: /require_open_gt_prev_high.*r1\['Prev_High'\]|require_open_gt_prev_high.*r1\["Prev_High"\]/.test(code),
        description: 'Uses Prev_High (D-2 high) not High (D-1 high) - CRITICAL BUG FIX v30'
      }
    };

    const passed = Object.entries(checks)
      .filter(([_, check]) => check.passed)
      .map(([name, _]) => `${name}: ${checks[name as keyof typeof checks].description}`);

    const failed = Object.entries(checks)
      .filter(([_, check]) => !check.passed)
      .map(([name, _]) => `${name}: ${checks[name as keyof typeof checks].description}`);

    const score = Math.round((passed.length / Object.keys(checks).length) * 100);

    const recommendations = failed.map(f => {
      const [check] = f.split(':');
      return `Fix: ${check}`;
    });

    return {
      success: true,
      agentType: 'validator',
      data: {
        score,
        checks,
        passed,
        failed,
        recommendations
      },
      executionTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
  }
}

export default ValidatorAgent;
