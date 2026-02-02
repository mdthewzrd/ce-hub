import { NextRequest, NextResponse } from "next/server";
import { renataOrchestrator } from "@/services/renata/agents";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('📦 RENATA V2 Orchestrator Request');
    console.log('📦 Message:', body.message?.substring(0, 100));

    const { message, context = {} } = body;

    // Validate required fields
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // ✅ RENATA V2 ORCHESTRATOR INTEGRATION
    // Call Python backend orchestrator
    const orchestratorUrl = 'http://localhost:5666/api/renata/chat';

    try {
      const orchestratorResponse = await fetch(orchestratorUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          context: context
        })
      });

      if (!orchestratorResponse.ok) {
        console.error('❌ Orchestrator backend error:', orchestratorResponse.status);
        throw new Error('Orchestrator service unavailable');
      }

      const orchestratorData = await orchestratorResponse.json();

      if (!orchestratorData.success) {
        console.error('❌ Orchestrator returned error:', orchestratorData.response);
        throw new Error(orchestratorData.response || 'Orchestrator error');
      }

      console.log('✅ RENATA V2 Response received');
      console.log('🔧 Tools used:', orchestratorData.tools_used);
      console.log('⏱️  Execution time:', orchestratorData.execution_time, 'seconds');

      // Return in format expected by frontend
      return NextResponse.json({
        success: true,
        message: orchestratorData.response,
        type: 'chat',
        timestamp: new Date().toISOString(),
        ai_engine: 'RENATA V2 Orchestrator',
        tools_used: orchestratorData.tools_used,
        execution_time: orchestratorData.execution_time,
        intent: orchestratorData.intent,
        data: {
          formattedCode: orchestratorData.response,
          workflow: orchestratorData.intent,
          summary: {
            agentsUsed: orchestratorData.tools_used,
            validationScore: 100
          }
        }
      });

    } catch (fetchError) {
      console.error('❌ RENATA V2 Orchestrator connection error:', fetchError);

      // Fallback to old system if orchestrator is not available
      console.log('⚠️  Falling back to legacy multi-agent system');

      // Use existing multi-agent workflow
      const result = await renataOrchestrator.processCodeTransformation(
        message,
        {
          transformationType: 'v31_standard',
          preserveParameters: true,
          addDocumentation: true,
          optimizePerformance: true,
          validateOutput: true
        }
      );

      if (!result.success) {
        throw new Error('Both orchestrator and legacy systems failed');
      }

      return NextResponse.json({
        success: true,
        message: buildMultiAgentSuccessMessage(result, 'v31_standard'),
        type: 'code',
        timestamp: new Date().toISOString(),
        ai_engine: 'Renata Multi-Agent (Fallback)',
        tools_used: result.summary.agentsUsed,
        data: {
          formattedCode: result.transformedCode,
          workflow: result.workflow,
          summary: result.summary
        }
      });
    }

  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: `An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'api_error'
      },
      { status: 500 }
    );
  }
}

function buildMultiAgentSuccessMessage(result: any, transformationType: string): string {
  const { workflow, summary } = result;

  const agentNames: Record<string, string> = {
    code_analyzer: '🔍 Analyzer',
    code_formatter: '✨ Formatter',
    parameter_extractor: '🔧 Parameter Extractor',
    validator: '✅ Validator',
    optimizer: '⚡ Optimizer',
    documentation: '📝 Documentation'
  };

  const agentsUsed = summary.agentsUsed.map((a: string) => agentNames[a] || a);

  return `✅ **Multi-Agent Transformation Complete!**

**Transformation Type:** ${transformationType.replace('_', ' ').toUpperCase()}

**Workflow:** ${workflow.workflowId}
**Agents Used:** ${agentsUsed.join(' → ')}

**Results:**
• **Lines:** ${summary.originalLines} → ${summary.transformedLines}
• **Parameters Preserved:** ${summary.parametersPreserved}
• **V31 Compliance Score:** ${summary.validationScore}%
• **Optimizations:** ${summary.optimizationsApplied.length}

**What the multi-agent system did:**
${workflow.results.map((r: any) => `• ${agentNames[r.agentType] || r.agentType}: ${r.data?.description || 'Completed'}`).join('\n')}

Your code is now transformed and ready to use! 🚀`;
}
