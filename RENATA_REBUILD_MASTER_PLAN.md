# RENATA AI AGENT - COMPREHENSIVE REBUILD PLAN
**Edge Dev Platform AI Assistant Architecture & Implementation Strategy**

---

## 📋 EXECUTIVE SUMMARY

**Current State**: Edge Dev platform has sophisticated components (UI, backend, AI analysis) but critical disconnects prevent cohesive operation. Renata exists as multiple competing implementations without unified architecture.

**Root Cause**: 7 months of "winging it" without systematic planning or proper agent architecture patterns. The platform has working pieces that don't communicate.

**Solution**: Implement production-grade AI agent architecture using proven 2025 best practices (CopilotKit v1.50 + AG-UI + FastAPI) with proper planning, modular design, and systematic testing.

**Timeline**: Phase-based implementation with validation gates at each stage.

---

## 🔍 COMPREHENSIVE PROBLEM ANALYSIS

### Critical System Disconnects

#### 1. **Execution Paralysis** (CRITICAL)
- **Location**: `/src/app/exec/page.tsx:112-122`
- **Issue**: Upload → Analysis flow converts code but never executes
- **Impact**: Users can analyze strategies but cannot run them
- **Fix Required**: Connect `handleStrategyUpload` to FastAPI backend execution

#### 2. **Backend Orphaned** (CRITICAL)
- **Location**: FastAPI backend on port 8000
- **Issue**: Sophisticated execution engine sits completely unused
- **Impact**: 315-second scans with 9 real results are inaccessible
- **Fix Required**: Route frontend execution calls to FastAPI instead of broken Next.js API routes

#### 3. **Temporal Stagnation** (CRITICAL)
- **Location**: `/src/app/api/systematic/scan/route.ts`
- **Issue**: `const scanDate = '2024-02-23';` (9+ months old)
- **Impact**: All scans return 0 results regardless of scanner quality
- **Fix Required**: Implement dynamic date selection with proper validation

#### 4. **Progress Deception** (HIGH)
- **Issue**: Progress bars complete in 7 seconds, real work takes 30+ seconds
- **Impact**: Users think scans are complete when backend still processing
- **Fix Required**: Connect UI progress tracking to actual backend execution status

### AI Agent Architecture Issues

#### Multiple Competing Implementations
```
❌ renataAIAgentService.ts       # Primary AI service
❌ renataCodeService.ts          # Code formatting service
❌ enhancedRenataCodeService.ts  # Enhanced version (why?)
❌ pydanticAiService.ts          # Alternative AI service
```

**Problem**: No clear ownership, duplicated functionality, inconsistent patterns

**Solution**: Consolidate into single service with modular architecture

#### Scattered Backend Implementations
```
❌ ai_scanner_service_bulletproof.py
❌ ai_scanner_service_fast.py
❌ ai_scanner_service_fixed.py
❌ ai_scanner_service_guaranteed.py
❌ ai_scanner_service_optimized.py
```

**Problem**: Naming indicates desperate fixes rather than systematic improvement

**Solution**: Single canonical implementation with proper testing

### Platform Foundation Issues

#### Archon MCP Integration
- **Status**: Configured in `.mcp.json` but **NOT RUNNING**
- **Port**: 8051 (health check failed)
- **Impact**: No knowledge graph synchronization, no RAG, no systematic learning
- **Fix Required**: Start Archon MCP server and implement proper workflow integration

---

## 🎯 RENATA V2.0 - PRODUCTION ARCHITECTURE

### Design Principles (Based on 2025 Best Practices)

1. **AG-UI Protocol Compliance**: Standardized agent-user communication
2. **CopilotKit v1.50 Integration**: Modern React agent hooks and runtime
3. **FastAPI Backend**: Existing proven backend, properly integrated
4. **LangGraph Orchestration**: Complex multi-step workflows
5. **Modular Design**: Clear separation of concerns
6. **Archon-First**: All workflows start with knowledge graph sync
7. **Production-Ready**: Proper error handling, monitoring, testing

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    EDGE DEV FRONTEND (Next.js)                      │
│                          Port: 5665                                 │
│                                                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐  │
│  │   /scan          │  │   /backtest     │  │  Renata UI      │  │
│  │   Dashboard      │  │   Dashboard     │  │  (CopilotKit)   │  │
│  │                  │  │                  │  │                 │  │
│  │  ┌────────────┐  │  │  ┌────────────┐  │  │ ┌───────────┐ │  │
│  │  │Chart View  │  │  │  │Exec Stats  │  │  │  │Chat       │ │  │
│  │  │Scanner Nav │  │  │  │Performance │  │  │  │Actions    │ │  │
│  │  │Results     │  │  │  │Metrics     │  │  │  │State      │ │  │
│  │  └────────────┘  │  │  └────────────┘  │  │ └───────────┘ │  │
│  └──────────────────┘  └──────────────────┘  └─────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │         CopilotKit Runtime + AG-UI Protocol                   │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │  │
│  │  │ useAgent()   │  │useCopilotAct │  │  Message State   │   │  │
│  │  │ hook         │  │ion() hook    │  │  Management      │   │  │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                     AG-UI Protocol / HTTP
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│                   RENATA ORCHESTRATION LAYER                         │
│                      (FastAPI Backend)                               │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              AG-UI Message Router & Protocol Handler           │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐ │
│  │  Workflow   │  │   Code      │  │  Scanner    │  │ Results   │ │
│  │  Agent      │  │   Agent     │  │  Agent      │  │ Analyzer  │ │
│  │             │  │             │  │             │  │           │ │
│  │ (LangGraph) │  │ (AST + AI)  │  │ (Execution) │  │ (AI +     │ │
│  │             │  │             │  │             │  │  Stats)   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘ │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                    API Calls / Internal IPC
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│                      CORE SERVICES LAYER                              │
│                                                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐  │
│  │  Scanner Engine  │  │  Project Manager │  │  Data Service   │  │
│  │  (v31 Pipeline)  │  │  (JSON + DB)     │  │  (Polygon API)  │  │
│  └──────────────────┘  └──────────────────┘  └─────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │           Template System + Pattern Library                   │  │
│  │     (v31 Standard Scanners + Conversion Rules)               │  │
│  └──────────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                        Archon MCP Protocol
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│                      ARCHON KNOWLEDGE GRAPH                          │
│                        (Port: 8051)                                 │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │  RAG Search  │  │  Project     │  │  Task        │            │
│  │              │  │  Management  │  │  Tracking    │            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │         Knowledge Base + Pattern Repository + Learning       │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 IMPLEMENTATION PLAN

### PHASE 0: FOUNDATION REPAIR (Week 1)

**Objective**: Fix critical platform disconnects before building Renata

#### 0.1 Reconnect Execution Flow
**File**: `/src/app/exec/page.tsx`
```typescript
// CURRENT (BROKEN):
const handleStrategyUpload = async (file: File, code: string) => {
  const convertedStrategy = await converter.convertStrategy(code, file.name);
  setState(prev => ({ ...prev, strategy: convertedStrategy }));
  setShowUpload(false);  // Just closes dialog!
};

// FIXED:
const handleStrategyUpload = async (file: File, code: string) => {
  const convertedStrategy = await converter.convertStrategy(code, file.name);

  // Route to FastAPI backend for execution
  const response = await fetch('http://localhost:8000/execute_strategy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      strategy: convertedStrategy,
      scanDate: new Date().toISOString().split('T')[0]  // Dynamic date!
    })
  });

  const executionId = await response.json();
  setState(prev => ({ ...prev, strategy: convertedStrategy, executionId }));
  setShowUpload(false);

  // Start real-time progress tracking
  pollExecutionStatus(executionId);
};
```

#### 0.2 Fix Hardcoded Dates
**File**: `/src/app/api/systematic/scan/route.ts`
```typescript
// REMOVE:
const scanDate = '2024-02-23';

// REPLACE WITH:
const scanDate = req.body.scanDate || new Date().toISOString().split('T')[0];
const dateValidation = validateTradingDate(scanDate);
if (!dateValidation.isValid) {
  return NextResponse.json({ error: dateValidation.error }, { status: 400 });
}
```

#### 0.3 Connect to Working Backend
**Action**: Create unified API client
```typescript
// /src/services/edgeDevApi.ts
export class EdgeDevAPI {
  private backendUrl = 'http://localhost:8000';

  async executeScanner(scanner: v31Scanner, date: string): Promise<ExecutionResult> {
    const response = await fetch(`${this.backendUrl}/scan/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scanner, date })
    });
    return response.json();
  }

  async getExecutionStatus(executionId: string): Promise<ExecutionStatus> {
    const response = await fetch(`${this.backendUrl}/scan/status/${executionId}`);
    return response.json();
  }
}
```

#### 0.4 Start Archon MCP
**Action**: Start Archon server
```bash
# Navigate to Archon directory
cd /Users/michaeldurante/archon

# Start MCP server
python mcp_stdio_wrapper.py --port 8051
```

**Validation**: Test connection
```bash
curl http://localhost:8051/health
# Expected: {"status": "healthy"}
```

**Success Criteria**:
- ✅ Upload → Execute flow complete
- ✅ Dynamic date selection working
- ✅ Frontend calls FastAPI backend
- ✅ Archon MCP responding on port 8051

---

### PHASE 1: RENATA CORE ARCHITECTURE (Week 2-3)

**Objective**: Build unified AI agent service with proper architecture

#### 1.1 Install CopilotKit v1.50
```bash
npm install @copilotkit/react-ui@latest @copilotkit/react-core@latest
npm install @copilotkit/runtime class-validator
```

#### 1.2 Create Unified Renata Service
**File**: `/src/services/renata/UnifiedRenataService.ts`

```typescript
import { useCopilotAction, useAgent } from '@copilotkit/react-core';

interface RenataCapabilities {
  // Workflow Management
  planScannerCreation: (userIntent: string) => Promise<ScannerPlan>;
  coordinateScannerBuild: (plan: ScannerPlan) => Promise<BuildResult>;

  // Code Operations
  analyzeExistingCode: (code: string) => Promise<CodeAnalysis>;
  convertToV31: (code: string, format: string) => Promise<v31Scanner>;
  generateScanner: (specification: ScannerSpec) => Promise<v31Scanner>;

  // Execution Management
  executeScanner: (scanner: v31Scanner, config: ExecutionConfig) => Promise<ExecutionId>;
  monitorExecution: (executionId: string) => Promise<ExecutionStatus>;

  // Results Analysis
  analyzeResults: (results: ScanResult[]) => Promise<ResultAnalysis>;
  optimizeParameters: (scanner: v31Scanner, results: ScanResult[]) => Promise<OptimizationSuggestions>;

  // Project Management
  addToProject: (scanner: v31Scanner, projectId: string) => Promise<void>;
  createProject: (name: string, description: string) => Promise<Project>;
}

export class UnifiedRenataService implements RenataCapabilities {
  private backendUrl = 'http://localhost:8000';
  private archonClient: ArchonMCPClient;

  constructor() {
    this.archonClient = new ArchonMCPClient('http://localhost:8051');
  }

  // Initialize with Archon sync (MANDATORY)
  async initialize(): Promise<void> {
    // Sync with Archon knowledge graph before any operation
    await this.archonClient.syncProjectStatus();
  }

  // Workflow: Idea → Plan → Build → Execute → Analyze
  async planScannerCreation(userIntent: string): Promise<ScannerPlan> {
    // 1. Query Archon for similar scanners
    const similarScanners = await this.archonClient.ragSearch('scanners', userIntent);

    // 2. Analyze user intent
    const intent = await this.analyzeIntent(userIntent, similarScanners);

    // 3. Create comprehensive plan
    return {
      objective: intent.objective,
      approach: intent.approach,
      parameters: intent.parameters,
      template: intent.template,
      estimatedComplexity: intent.complexity,
      similarScanners: similarScanners
    };
  }

  async coordinateScannerBuild(plan: ScannerPlan): Promise<BuildResult> {
    // Use LangGraph for multi-step coordination
    const workflow = new ScannerBuildWorkflow();
    return await workflow.execute(plan);
  }

  // Code Operations
  async analyzeExistingCode(code: string): Promise<CodeAnalysis> {
    // AST parsing + AI analysis
    const ast = this.parseAST(code);
    const aiAnalysis = await this.backendAnalyze(code);

    return {
      structure: ast,
      quality: aiAnalysis.quality,
      v31Compliance: aiAnalysis.compliance,
      requiredChanges: aiAnalysis.changes,
      conversionPath: aiAnalysis.path
    };
  }

  async convertToV31(code: string, format: string): Promise<v31Scanner> {
    // 1. Detect current format
    const detectedFormat = await this.detectFormat(code, format);

    // 2. Select appropriate conversion strategy
    const strategy = await this.selectConversionStrategy(detectedFormat);

    // 3. Execute conversion
    const converted = await this.backendConvert(code, strategy);

    // 4. Validate v31 compliance
    const validation = await this.validateV31(converted);

    if (!validation.isValid) {
      throw new Error(`v31 validation failed: ${validation.errors.join(', ')}`);
    }

    return converted;
  }

  async executeScanner(scanner: v31Scanner, config: ExecutionConfig): Promise<ExecutionId> {
    // 1. Validate scanner
    await this.validateV31(scanner);

    // 2. Sync with Archon
    await this.archonClient.logExecutionStart(scanner);

    // 3. Execute on backend
    const response = await fetch(`${this.backendUrl}/scan/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scanner, config })
    });

    const executionId = await response.json();

    // 4. Log to knowledge graph
    await this.archonClient.updateTaskStatus(executionId, 'running');

    return executionId;
  }

  async monitorExecution(executionId: string): Promise<ExecutionStatus> {
    const status = await this.getExecutionStatus(executionId);

    // Update Archon with progress
    await this.archonClient.updateTaskStatus(executionId, status.state);

    return status;
  }

  async analyzeResults(results: ScanResult[]): Promise<ResultAnalysis> {
    // AI-powered analysis
    const analysis = await this.backendAnalyze('/results/analyze', { results });

    return {
      summary: analysis.summary,
      insights: analysis.insights,
      recommendations: analysis.recommendations,
      performanceMetrics: analysis.metrics
    };
  }

  // Private helper methods
  private async backendAnalyze(endpoint: string, data: any): Promise<any> {
    const response = await fetch(`${this.backendUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }

  private parseAST(code: string): ASTNode {
    // Python AST parsing on backend
    return this.backendAnalyze('/code/parse', { code });
  }

  private async validateV31(scanner: v31Scanner): Promise<ValidationResult> {
    return this.backendAnalyze('/scanner/validate', { scanner });
  }
}
```

#### 1.3 Create CopilotKit Integration
**File**: `/src/components/renata/RenataCopilotKit.tsx`

```typescript
'use client';

import { CopilotKit, useCopilotAction, useAgent } from '@copilotkit/react-core';
import { CopilotPopup } from '@copilotkit/react-ui';
import { UnifiedRenataService } from '@/services/renata/UnifiedRenataService';

const renataService = new UnifiedRenataService();

export function RenataCopilotKit({ children }: { children: React.ReactNode }) {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
      <RenataActions />
      <RenataAgent />
      {children}
      <RenataChatInterface />
    </CopilotKit>
  );
}

function RenataActions() {
  // Define actions Renata can execute

  useCopilotAction({
    name: "executeScanner",
    description: "Execute a scanner with the given configuration",
    parameters: [
      { name: "scannerCode", type: "string", description: "v31 scanner code" },
      { name: "date", type: "string", description: "Scan date (YYYY-MM-DD)" },
      { name: "config", type: "object", description: "Execution configuration" }
    ],
    handler: async ({ scannerCode, date, config }) => {
      const scanner = JSON.parse(scannerCode);
      return await renataService.executeScanner(scanner, { ...config, date });
    }
  });

  useCopilotAction({
    name: "analyzeCode",
    description: "Analyze existing trading strategy code",
    parameters: [
      { name: "code", type: "string", description: "Python code to analyze" }
    ],
    handler: async ({ code }) => {
      return await renataService.analyzeExistingCode(code);
    }
  });

  useCopilotAction({
    name: "convertToV31",
    description: "Convert code to Edge Dev v31 standard",
    parameters: [
      { name: "code", type: "string", description: "Code to convert" },
      { name: "format", type: "string", description: "Source format (optional)" }
    ],
    handler: async ({ code, format }) => {
      return await renataService.convertToV31(code, format || 'auto');
    }
  });

  useCopilotAction({
    name: "addToProject",
    description: "Add scanner to a project",
    parameters: [
      { name: "scanner", type: "string", description: "v31 scanner JSON" },
      { name: "projectId", type: "string", description: "Project ID" }
    ],
    handler: async ({ scanner, projectId }) => {
      const scannerObj = JSON.parse(scanner);
      await renataService.addToProject(scannerObj, projectId);
      return { success: true, message: "Scanner added to project" };
    }
  });

  useCopilotAction({
    name: "createProject",
    description: "Create a new project",
    parameters: [
      { name: "name", type: "string", description: "Project name" },
      { name: "description", type: "string", description: "Project description" }
    ],
    handler: async ({ name, description }) => {
      return await renataService.createProject(name, description);
    }
  });

  return null;
}

function RenataAgent() {
  const { agentState, sendMessage } = useAgent();

  // Listen for agent state changes and update UI
  React.useEffect(() => {
    if (agentState === 'processing') {
      // Show loading state
    }
  }, [agentState]);

  return null;
}

function RenataChatInterface() {
  return (
    <CopilotPopup
      instructions="You are Renata, the AI trading strategy assistant for Edge Dev platform. You help users:
1. Turn ideas into production-ready v31 scanners
2. Convert existing code to v31 standard
3. Execute and analyze scans
4. Optimize parameters based on results
5. Manage projects and workflows

Always start by understanding the user's goal, then break it down into clear steps."
      labels={{
        title: "Renata AI Assistant",
        initial: "How can I help with your trading strategies today?"
      }}
    />
  );
}
```

**Success Criteria**:
- ✅ CopilotKit v1.50 installed and configured
- ✅ Unified Renata service created
- ✅ All Renata actions registered
- ✅ AG-UI protocol working

---

### PHASE 2: BACKEND INTEGRATION (Week 4)

**Objective**: Connect Renata to FastAPI backend with proper API design

#### 2.1 Create FastAPI Endpoints
**File**: `/backend/api/renata_agent.py`

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
import ast
import json

app = FastAPI(title="Renata Agent Backend API")

# ============= Code Analysis Endpoints =============

class CodeAnalysisRequest(BaseModel):
    code: str
    language: str = "python"

@app.post("/api/analyze/code")
async def analyze_code(request: CodeAnalysisRequest):
    """Analyze Python code structure and quality"""

    try:
        # Parse AST
        tree = ast.parse(request.code)

        # Extract structure
        analyzer = CodeAnalyzer()
        analyzer.visit(tree)

        # AI analysis (via OpenRouter)
        ai_analysis = await analyze_with_ai(request.code)

        return {
            "structure": analyzer.get_structure(),
            "quality": ai_analysis.quality,
            "v31_compliance": ai_analysis.compliance,
            "required_changes": ai_analysis.changes,
            "conversion_path": ai_analysis.path
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ============= Scanner Conversion Endpoints =============

class ConversionRequest(BaseModel):
    code: str
    source_format: Optional[str] = "auto"
    target_format: str = "v31"

@app.post("/api/convert/scanner")
async def convert_scanner(request: ConversionRequest):
    """Convert scanner code to v31 standard"""

    try:
        # Detect format if auto
        if request.source_format == "auto":
            request.source_format = detect_code_format(request.code)

        # Select conversion strategy
        strategy = get_conversion_strategy(request.source_format, request.target_format)

        # Execute conversion
        converted = await convert_code(request.code, strategy)

        # Validate v31 compliance
        validation = validate_v31_scanner(converted)

        return {
            "converted_code": converted,
            "validation": validation,
            "changes_made": strategy.changes
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ============= Scanner Execution Endpoints =============

class ExecutionRequest(BaseModel):
    scanner: Dict[str, Any]
    config: ExecutionConfig

@app.post("/api/scan/execute")
async def execute_scanner(request: ExecutionRequest):
    """Execute scanner and return execution ID"""

    try:
        # Validate scanner
        validation = validate_v31_scanner(request.scanner)
        if not validation.is_valid:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid scanner: {validation.errors}"
            )

        # Create execution context
        execution_id = create_execution_id()

        # Submit to execution queue
        await submit_to_execution_queue(execution_id, request.scanner, request.config)

        # Log to Archon (if available)
        await log_execution_start(execution_id, request.scanner)

        return {
            "execution_id": execution_id,
            "status": "queued",
            "estimated_time": estimate_execution_time(request.scanner)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/scan/status/{execution_id}")
async def get_execution_status(execution_id: str):
    """Get real-time execution status"""

    status = await get_execution_from_queue(execution_id)

    return {
        "execution_id": execution_id,
        "status": status.state,
        "progress": status.progress,
        "current_stage": status.current_stage,
        "results": status.results if status.complete else None
    }

# ============= Results Analysis Endpoints =============

class AnalysisRequest(BaseModel):
    results: List[Dict[str, Any]]
    scanner: Dict[str, Any]

@app.post("/api/analyze/results")
async def analyze_results(request: AnalysisRequest):
    """AI-powered analysis of scan results"""

    try:
        # Calculate metrics
        metrics = calculate_performance_metrics(request.results)

        # Generate insights
        insights = await generate_insights(request.scanner, request.results)

        # Optimization suggestions
        optimizations = await suggest_optimizations(
            request.scanner,
            request.results,
            metrics
        )

        return {
            "summary": insights.summary,
            "metrics": metrics,
            "insights": insights.findings,
            "optimizations": optimizations
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============= Helper Functions =============

async def analyze_with_ai(code: str) -> AIAnalysis:
    """Use OpenRouter AI for code analysis"""
    # Implementation using OpenRouter API
    pass

def detect_code_format(code: str) -> str:
    """Auto-detect code format"""
    # Implementation
    pass

def validate_v31_scanner(scanner: Dict) -> ValidationResult:
    """Validate scanner meets v31 standard"""
    # Implementation
    pass

# ... (other helper functions)
```

#### 2.2 Create Execution Manager
**File**: `/backend/services/execution_manager.py`

```python
import asyncio
from typing import Dict, Any
import uuid

class ExecutionManager:
    """Manages scanner execution with real-time status updates"""

    def __init__(self):
        self.active_executions: Dict[str, Execution] = {}
        self.execution_queue = asyncio.Queue()

    async def submit_execution(
        self,
        scanner: Dict[str, Any],
        config: ExecutionConfig
    ) -> str:
        """Submit scanner for execution"""

        execution_id = str(uuid.uuid4())

        execution = Execution(
            id=execution_id,
            scanner=scanner,
            config=config,
            status="queued",
            progress=0.0
        )

        self.active_executions[execution_id] = execution
        await self.execution_queue.put(execution)

        # Start execution in background
        asyncio.create_task(self._execute_scanner(execution))

        return execution_id

    async def _execute_scanner(self, execution: Execution):
        """Execute scanner with progress tracking"""

        execution.status = "running"

        try:
            # Stage 1: Fetch data
            execution.current_stage = "fetching_data"
            execution.progress = 0.2
            await self._notify_progress(execution)

            data = await fetch_market_data(execution.config.date)

            # Stage 2: Apply filters
            execution.current_stage = "applying_filters"
            execution.progress = 0.4
            await self._notify_progress(execution)

            filtered_data = apply_smart_filters(data, execution.scanner.filters)

            # Stage 3: Detect patterns
            execution.current_stage = "detecting_patterns"
            execution.progress = 0.6
            await self._notify_progress(execution)

            results = detect_patterns(filtered_data, execution.scanner.patterns)

            # Stage 4: Format results
            execution.current_stage = "formatting_results"
            execution.progress = 0.8
            await self._notify_progress(execution)

            formatted = format_results(results)

            # Complete
            execution.status = "complete"
            execution.progress = 1.0
            execution.results = formatted
            await self._notify_progress(execution)

        except Exception as e:
            execution.status = "failed"
            execution.error = str(e)
            await self._notify_progress(execution)

    async def _notify_progress(self, execution: Execution):
        """Notify frontend of progress"""
        # Send via WebSocket or update status endpoint
        await broadcast_execution_update(execution)

    async def get_status(self, execution_id: str) -> ExecutionStatus:
        """Get current execution status"""

        execution = self.active_executions.get(execution_id)
        if not execution:
            raise ValueError(f"Execution {execution_id} not found")

        return ExecutionStatus(
            id=execution.id,
            status=execution.status,
            progress=execution.progress,
            current_stage=execution.current_stage,
            results=execution.results
        )

# Global execution manager instance
execution_manager = ExecutionManager()
```

**Success Criteria**:
- ✅ All API endpoints functional
- ✅ Execution manager with real-time progress
- ✅ Proper error handling
- ✅ Integration with existing scanner engine

---

### PHASE 3: ARCHON INTEGRATION (Week 5)

**Objective**: Implement Archon-First protocol for systematic learning

#### 3.1 Create Archon MCP Client
**File**: `/src/services/archon/ArchonMCPClient.ts`

```typescript
export class ArchonMCPClient {
  private endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  // ============= Project Management =============

  async syncProjectStatus(): Promise<ProjectStatus> {
    const response = await this.callMCP('find_projects', {
      query: { name: 'edge-dev-platform' }
    });
    return response.projects[0];
  }

  async logExecutionStart(scanner: v31Scanner): Promise<void> {
    await this.callMCP('manage_task', {
      action: 'create',
      project_id: 'edge-dev-platform',
      task: {
        title: `Execute scanner: ${scanner.name}`,
        description: `Executing ${scanner.pattern} scanner`,
        status: 'in_progress'
      }
    });
  }

  async updateTaskStatus(taskId: string, status: string): Promise<void> {
    await this.callMCP('manage_task', {
      action: 'update',
      task_id: taskId,
      updates: { status }
    });
  }

  // ============= Knowledge Search =============

  async ragSearch(domain: string, query: string): Promise<any[]> {
    const response = await this.callMCP('rag_search_knowledge_base', {
      domain,
      query,
      limit: 5
    });
    return response.results;
  }

  async searchCodeExamples(pattern: string): Promise<CodeExample[]> {
    const response = await this.callMCP('rag_search_code_examples', {
      pattern,
      limit: 10
    });
    return response.examples;
  }

  // ============= Knowledge Ingestion =============

  async ingestLearnings(learnings: KnowledgeArtifact): Promise<void> {
    await this.callMCP('ingest_knowledge', {
      artifact: learnings,
      project_id: 'edge-dev-platform'
    });
  }

  // ============= Helper Methods =============

  private async callMCP(method: string, params: any): Promise<any> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params
      })
    });

    return response.json();
  }
}
```

#### 3.2 Implement Archon-First Workflow
**File**: `/src/services/renata/ArchonFirstWorkflow.ts`

```typescript
export class ArchonFirstWorkflow {
  private archon: ArchonMCPClient;

  constructor() {
    this.archon = new ArchonMCPClient('http://localhost:8051');
  }

  async executeWorkflow(userRequest: string): Promise<WorkflowResult> {
    // MANDATORY: Start all workflows with Archon sync

    // 1. Sync project status
    const projectStatus = await this.archon.syncProjectStatus();

    // 2. Search knowledge base for similar approaches
    const similarWorkflows = await this.archon.ragSearch('workflows', userRequest);

    // 3. Find applicable patterns
    const patterns = await this.archon.searchCodeExamples(userRequest);

    // 4. Create or update task in Archon
    const task = await this.archon.callMCP('manage_task', {
      action: 'create',
      project_id: 'edge-dev-platform',
      task: {
        title: userRequest,
        status: 'planning'
      }
    });

    // 5. Execute workflow with context
    const result = await this.executeWithContext(
      userRequest,
      similarWorkflows,
      patterns
    );

    // 6. Ingest learnings back into Archon
    await this.archon.ingestLearnings({
      type: 'workflow_result',
      input: userRequest,
      output: result,
      context: {
        similar_workflows: similarWorkflows,
        patterns_used: patterns
      }
    });

    // 7. Update task status
    await this.archon.updateTaskStatus(task.id, 'complete');

    return result;
  }

  private async executeWithContext(
    request: string,
    context: any[],
    patterns: CodeExample[]
  ): Promise<WorkflowResult> {
    // Execute with full context from Archon
    // Implementation...
  }
}
```

**Success Criteria**:
- ✅ Archon MCP client functional
- ✅ All workflows start with Archon sync
- ✅ Knowledge search working
- ✅ Learnings ingested after each operation

---

### PHASE 4: TESTING & VALIDATION (Week 6)

**Objective**: Comprehensive testing of all components

#### 4.1 Unit Tests
```typescript
// /src/services/renata/__tests__/UnifiedRenataService.test.ts
describe('UnifiedRenataService', () => {
  test('analyzes existing code correctly', async () => {
    const service = new UnifiedRenataService();
    const code = `
      def my_scanner(data):
          results = []
          for ticker, df in data.items():
              if df['close'].iloc[-1] > df['open'].iloc[-1]:
                  results.append(ticker)
          return results
    `;

    const analysis = await service.analyzeExistingCode(code);

    expect(analysis.structure.type).toBe('function');
    expect(analysis.v31Compliance).toBe(false);
    expect(analysis.requiredChanges.length).toBeGreaterThan(0);
  });

  test('converts code to v31 standard', async () => {
    const service = new UnifiedRenataService();
    const code = '// non-v31 code';

    const converted = await service.convertToV31(code, 'auto');

    expect(converted).toHaveProperty('fetch_grouped_data');
    expect(converted).toHaveProperty('apply_smart_filters');
    expect(converted).toHaveProperty('detect_patterns');
    expect(converted).toHaveProperty('format_results');
    expect(converted).toHaveProperty('run_scan');
  });
});
```

#### 4.2 Integration Tests
```typescript
// /src/services/renata/__tests__/integration/end-to-end.test.ts
describe('Renata End-to-End Workflow', () => {
  test('complete workflow: idea → scanner → execution → analysis', async () => {
    const service = new UnifiedRenataService();
    await service.initialize();

    // 1. Plan scanner creation
    const plan = await service.planScannerCreation(
      "Find stocks that gap up 2% on high volume"
    );

    expect(plan.objective).toBeDefined();
    expect(plan.approach).toBeDefined();

    // 2. Build scanner
    const buildResult = await service.coordinateScannerBuild(plan);

    expect(buildResult.scanner).toBeDefined();
    expect(buildResult.isValid).toBe(true);

    // 3. Execute scanner
    const executionId = await service.executeScanner(
      buildResult.scanner,
      { date: '2024-12-01', maxResults: 100 }
    );

    expect(executionId).toBeDefined();

    // 4. Monitor execution
    let status = await service.monitorExecution(executionId);

    while (status.state === 'running') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      status = await service.monitorExecution(executionId);
    }

    expect(status.state).toBe('complete');
    expect(status.results).toBeDefined();

    // 5. Analyze results
    const analysis = await service.analyzeResults(status.results);

    expect(analysis.summary).toBeDefined();
    expect(analysis.insights).toBeDefined();
  });
});
```

#### 4.3 Manual Validation Checklist
```
Renata Validation Checklist

☐ Upload converts code to v31 standard
☐ Execute button runs scanner on backend
☐ Progress bar shows real progress
☐ Results display correctly
☐ Renata can explain results
☐ Renata suggests optimizations
☐ Add to project works
☐ Create project works
☐ Chat interface responds appropriately
☐ Archon sync working
```

**Success Criteria**:
- ✅ 90%+ test coverage
- ✅ All integration tests passing
- ✅ Manual validation complete

---

### PHASE 5: DOCUMENTATION & HANDOFF (Week 7)

**Objective**: Complete documentation and team handoff

#### 5.1 Architecture Documentation
- System architecture diagram
- API documentation
- Component interaction flows
- Data models

#### 5.2 User Documentation
- Renata capabilities guide
- Workflow tutorials
- Troubleshooting guide
- Best practices

#### 5.3 Developer Documentation
- Setup instructions
- Contributing guidelines
- Code standards
- Testing procedures

**Success Criteria**:
- ✅ Complete documentation
- ✅ Team training complete
- ✅ Knowledge base updated

---

## 📊 SUCCESS METRICS

### Technical Metrics
- **Execution Flow**: 100% successful upload → execute → results
- **API Response Time**: <2 seconds for 95% of requests
- **Scanner Conversion**: 95%+ accuracy v31 compliance
- **Progress Tracking**: Real-time updates with <5% error
- **Test Coverage**: 90%+ critical paths

### User Experience Metrics
- **Time to First Scanner**: <10 minutes from sign-up to execution
- **Renata Response Time**: <3 seconds for AI responses
- **Workflow Success**: 95%+ completion rate
- **User Satisfaction**: 4.5+ / 5.0 rating

### System Reliability Metrics
- **Uptime**: 99.5%+ availability
- **Error Rate**: <1% failed operations
- **Recovery Time**: <5 minutes from failures

---

## 🎯 KEY PRINCIPLES FOR SUCCESS

### 1. **Archon-First Protocol** (NON-NEGOTIABLE)
- EVERY workflow starts with Archon sync
- Knowledge graph queried before generating solutions
- All learnings ingested back into Archon
- System intelligence compounds over time

### 2. **Plan-Mode Precedence**
- Present comprehensive plans before execution
- Require user approval for all significant operations
- Structure complex tasks systematically
- Prevent costly iterations through planning

### 3. **Modular Architecture**
- Clear separation of concerns
- Each component has single responsibility
- Easy to test and maintain
- Simple to extend and enhance

### 4. **Production-Ready Code**
- Proper error handling
- Comprehensive logging
- Performance monitoring
- Security best practices

### 5. **Continuous Improvement**
- Every operation increases system intelligence
- Closed learning loops implemented
- Patterns and templates evolve
- Metrics drive optimization

---

## 📚 RESEARCH REFERENCES

### AI Agent Frameworks
- [CopilotKit GitHub Repository](https://github.com/CopilotKit/CopilotKit)
- [CopilotKit Documentation](https://docs.copilotkit.ai/)
- [CopilotKit v1.50 Release Notes](https://docs.copilotkit.ai/whats-new/v1-50)
- [AG-UI Protocol Documentation](https://docs.ag-ui.com/)
- [Microsoft Agent Framework AG-UI Integration](https://learn.microsoft.com/en-us/agent-framework/integrations/ag-ui/)
- [The Complete Guide to AI Agent Protocols](https://justaithings.org/the-complete-guide-to-ai-agent-protocols-mcp-a2a-and-ag-ui-c19042fe9352)

### Integration Patterns
- [Full-Stack FastAPI + Next.js Template](https://github.com/vstorm-co/full-stack-fastapi-nextjs-llm-template)
- [Building AI Agents with LangGraph](https://www.akveo.com/blog/langgraph-and-nextjs-how-to-integrate-ai-agents-in-a-modern-web-stack)
- [RAG Applications with Next.js, FastAPI & Llama 3](https://metadesignsolutions.com/full-stack-ai-building-rag-apps-with-nextjs-fastapi-and-llama-3-retrievalaugmented-generation-vector-dbs/)

### OpenRouter Integration
- [OpenRouter Quickstart Documentation](https://openrouter.ai/docs/quickstart)
- [Building Your First Agentic AI Workflow with OpenRouter](https://dev.to/allanninal/building-your-first-agentic-ai-workflow-with-openrouter-api-1fo6)
- [AI Trading Agent with OpenRouter](https://docs.chainstack.com/docs/ai-trading-agent-grok4-openrouter-integration)

---

## 🚨 CRITICAL SUCCESS FACTORS

### MUST HAVE (Non-Negotiable)
1. ✅ Fix execution flow (upload → execute)
2. ✅ Connect frontend to working backend
3. ✅ Implement dynamic date selection
4. ✅ Start and integrate Archon MCP
5. ✅ Implement CopilotKit v1.50
6. ✅ Create unified Renata service
7. ✅ Implement AG-UI protocol

### SHOULD HAVE (High Priority)
1. Real-time progress tracking
2. Comprehensive error handling
3. Test coverage >90%
4. Complete documentation
5. Performance monitoring

### NICE TO HAVE (Future Enhancements)
1. Advanced visualizations
2. Multi-language support
3. Mobile optimization
4. Collaboration features
5. Advanced analytics

---

## 📅 IMPLEMENTATION TIMELINE

| Phase | Duration | Key Deliverables | Validation Gate |
|-------|----------|------------------|-----------------|
| 0 - Foundation Repair | Week 1 | Execution flow, backend connection, Archon running | Upload executes successfully |
| 1 - Renata Core | Week 2-3 | CopilotKit integration, unified service | All Renata actions working |
| 2 - Backend Integration | Week 4 | API endpoints, execution manager | Backend processes requests |
| 3 - Archon Integration | Week 5 | MCP client, knowledge sync | Workflows sync with Archon |
| 4 - Testing | Week 6 | Test suite, validation | All tests passing |
| 5 - Documentation | Week 7 | Complete docs, handoff | Team trained and ready |

**Total Timeline**: 7 weeks to production-ready Renata

---

## 🎬 NEXT STEPS

1. **Review this plan** - Confirm approach and priorities
2. **Start Archon MCP** - Get knowledge graph online
3. **Fix execution flow** - Reconnect upload to backend
4. **Install CopilotKit** - Begin frontend integration
5. **Create unified service** - Consolidate Renata implementations
6. **Test incrementally** - Validate each phase before proceeding

---

**Remember**: The goal is not just to fix what's broken, but to build a systematic, scalable AI agent platform that compounds intelligence through every interaction. Every operation should contribute to the growing intelligence of the system. Every artifact should be designed for reuse. Every workflow should enhance the collective capability of the Edge Dev platform.

**This is the definitive plan for building Renata the right way.**
