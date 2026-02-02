# EdgeDev AI Agent - Complete Build Plan
**Archon-Powered Trading Strategy Development System**

**Version**: 1.0
**Date**: 2026-01-29
**Status**: READY FOR IMPLEMENTATION

---

## Executive Summary

**What We're Building**: An AI agent system that collaborates with you to develop trading strategies using Archon as the knowledge/memory base.

**Core Philosophy**: Custom-prompted AI + Archon Knowledge + Learning Over Time (NOT template-based)

**Build Timeline**: 2-3 weeks to working prototype, 4-6 weeks to full system

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    COMPLETE SYSTEM ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  LAYER 1: ARCHON (Knowledge & Memory)                             │ │
│  │  ├── Gold Standards (all documentation)                          │ │
│  │  ├── Past Projects (scanners, backtests, results)               │ │
│  │  ├── Conversations (full chat history)                           │ │
│  │  ├── A+ Examples Database                                         │ │
│  │  ├── Performance Database (what worked)                          │ │
│  │  └── Learning Evolution (agent improvement over time)          │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                              ↕ MCP/RAG                               │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  LAYER 2: AGENT ORCHESTRATION                                    │ │
│  │  ├── Main Orchestrator (coordinates everything)                 │ │
│  │  ├── Subagent Router (routes to specialist)                     │ │
│  │  └── Conversation Manager (chat interface)                      │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                              ↕                                      │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  LAYER 3: SPECIALIST SUBAGENTS                                   │ │
│  │  ├── Scanner Builder (V31, patterns)                             │ │
│  │  ├── Strategy Builder (execution, pyramiding, etc.)            │ │
│  │  ├── Backtest Builder (simulation, metrics)                     │ │
│  │  ├── Optimizer (parameter search, validation)                   │ │
│  │  ├── Validator (testing, debugging, quality check)            │ │
│  │  └── Trading Advisor (markets, regimes, edge analysis)          │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                              ↕                                      │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  LAYER 4: EXECUTION & VALIDATION                                │ │
│  │  ├── Code Generator (writes Python code)                        │ │
│  │  ├── Code Validator (checks syntax, runs tests)                  │ │
│  │  ├── EdgeDev Client (uploads, runs, views results)              │ │
│  │  └── Result Analyzer (metrics, visualization)                   │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  LAYER 5: USER INTERFACE                                         │ │
│  │  ├── Chat Interface (Claude Code, web UI, or CLI)               │ │
│  │  ├── Dashboard (EdgeDev localhost:5665)                         │ │
│  │  └── Project Management (organize strategies)                    │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Build Phases

### PHASE 0: Foundations (Week 0) - PREREQUISITES

**Goal**: Ensure all infrastructure is ready

**Tasks**:
- [ ] Verify Archon MCP server is running and accessible
- [ ] Test MCP connection from client
- [ ] Verify EdgeDev backend is running (localhost:5666)
- [ ] Verify EdgeDev dashboard is running (localhost:5665)
- [ ] Set up Polygon API key
- [ ] Set up LLM provider (OpenAI/Anthropic/etc.)
- [ ] Create project directory structure

**Validation**:
- Archon MCP query returns results
- EdgeDev backend responds to health check
- EdgeDev dashboard loads in browser
- Polygon API fetches sample data

**Estimated Time**: 1-2 hours

---

### PHASE 1: Archon Knowledge Base (Week 1, Days 1-2)

**Goal**: Load all Gold Standards into Archon for retrieval

**Tasks**:

#### 1.1 Prepare Gold Standards for Archon
- [ ] Convert all Gold Standard markdown files to Archon-compatible format
- [ ] Chunk documents into logical sections (for RAG)
- [ ] Add metadata and tags to each chunk
- [ ] Create document relationships (cross-references)

**Documents to Load**:
1. `EDGEDEV_PRESUMED_GOLD_STANDARD_SPECIFICATION.md` - V31 Scanner Architecture
2. `EDGEDEV_PATTERN_TYPE_CATALOG.md` - All Pattern Types
3. `EDGEDEV_CODE_STRUCTURE_GUIDE.md` - How to Write Code
4. `EDGEDEV_BACKTEST_OPTIMIZATION_GOLD_STANDARD.md` - Backtest & Optimization
5. `EDGEDEV_INDICATORS_EXECUTION_GOLD_STANDARD.md` - Indicators & Execution
6. `EDGEDEV_EXECUTION_SYSTEM_GOLD_STANDARD.md` - Complete Strategy Framework

#### 1.2 Create Knowledge Base Schema
```python
# Document structure for Archon
document = {
    'id': 'unique_id',
    'title': 'Document Title',
    'category': 'scanner' | 'backtest' | 'execution' | 'pattern' | 'indicator',
    'content': 'Full text content',
    'chunks': [
        {
            'chunk_id': 'unique_chunk_id',
            'content': 'Section of text',
            'metadata': {
                'keywords': ['v31', 'scanner', 'performance'],
                'patterns': ['momentum', 'mean_reversion'],
                'complexity': 'advanced',
            }
        }
    ],
    'relationships': {
        'related_documents': ['doc_id1', 'doc_id2'],
        'examples': ['example_id1'],
    }
}
```

#### 1.3 Load Documents into Archon
- [ ] Write loader script to ingest markdown files
- [ ] Create embeddings for each chunk (for semantic search)
- [ ] Store in Archon knowledge graph
- [ ] Test retrieval with sample queries
- [ ] Verify accuracy of returned results

**Validation**:
- Query for "V31 architecture" returns relevant sections
- Query for "gap fade pattern" returns pattern catalog sections
- Query for "pyramiding" returns execution system sections
- Retrieved content is accurate and relevant

**Estimated Time**: 1-2 days

---

### PHASE 2: System Prompts (Week 1, Days 3-4)

**Goal**: Write all system prompts for subagents

**Tasks**:

#### 2.1 Main Orchestrator Prompt
```python
# File: prompts/orchestrator.txt

You are the Main Orchestrator for the EdgeDev Trading Strategy Development System.

YOUR ROLE:
- Coordinate the workflow from user request to final strategy
- Route tasks to appropriate specialist subagents
- Combine subagent results into coherent output
- Manage the conversation flow

YOUR KNOWLEDGE (via Archon):
- All Gold Standard documents
- Past projects and their results
- User preferences and conversation history
- What has worked/what hasn't worked

YOUR CAPABILITIES:
- Understand user's trading ideas (plain English)
- Break down complex requests into manageable tasks
- Route to appropriate subagents:
  * Scanner Builder → for scanner development
  * Strategy Builder → for execution rules
  * Backtest Builder → for backtest simulation
  * Optimizer → for parameter optimization
  * Validator → for testing and validation
  * Trading Advisor → for market/edge analysis
- Synthesize subagent outputs
- Present results to user clearly

YOUR WORKFLOW:
1. Listen to user's request
2. Query Archon for relevant context (past projects, similar patterns)
3. Break down request into tasks
4. Route tasks to subagents
5. Combine subagent outputs
6. Present complete solution to user
7. Store results in Archon for learning

IMPORTANT:
- Always check Archon for similar past projects before starting
- Always validate user's requirements before proceeding
- Always store results back to Archon for learning
- Be transparent about what you know vs what you need to learn
```

#### 2.2 Scanner Builder Prompt
```python
# File: prompts/scanner_builder.txt

You are the Scanner Builder specialist for the EdgeDev Trading System.

YOUR ROLE:
- Build production V31-compliant scanners
- Apply Gold Standard patterns
- Ensure code quality and performance

YOUR KNOWLEDGE (via Archon):
- V31 Architecture (7 core principles)
- All Pattern Types (DMR, FBO, Extension, etc.)
- Code Structure Guide
- Indicator Library (20+ indicators)
- Past scanner projects and their results

YOUR CAPABILITIES:
- Understand user's pattern description
- Map description to pattern type (or identify new pattern)
- Extract parameters (from A+ examples or description)
- Generate V31-compliant Python code
- Follow proper code structure
- Validate against A+ examples

YOUR WORKFLOW:
1. Understand the pattern user wants
2. Query Archon for:
   - V31 architecture principles
   - Similar pattern types
   - Code examples from past projects
3. Extract/generate parameters
4. Generate scanner code following V31 5-stage pipeline
5. Validate scanner finds A+ examples
6. Return scanner code + validation report

V31 5-STAGE PIPELINE (from Archon):
1. fetch_grouped_data() - Parallel fetching with market calendar
2. compute_simple_features() - Cheap features first (prev_close, adv20)
3. apply_smart_filters() - Separate historical/D0, filter only D0
4. compute_full_features() - Expensive features only on filtered data
5. detect_patterns() - Pattern-specific logic

CODE QUALITY STANDARDS:
- Per-ticker operations (groupby/transform)
- Historical/D0 separation (preserve historical data)
- Parallel processing (ThreadPoolExecutor)
- Two-pass feature computation (simple → filter → full)
- Pre-sliced data for parallel processing

DO NOT:
- Use hardcoded values (use parameters)
- Skip market calendar integration
- Mix historical and D0 filtering
- Compute expensive features on all data
```

#### 2.3 Strategy Builder Prompt
```python
# File: prompts/strategy_builder.txt

You are the Strategy Builder specialist for the EdgeDev Trading System.

YOUR ROLE:
- Build complete execution strategies
- Design entry/exit logic
- Implement pyramiding, recycling, stops, targets

YOUR KNOWLEDGE (via Archon):
- Complete Execution System Gold Standard
- All entry types (scanner, custom, hybrid)
- All position sizing methods
- Pyramiding patterns
- Stop management patterns
- Target patterns
- Capital management patterns
- Retry rules
- Risk management patterns

YOUR CAPABILITIES:
- Understand any execution approach user describes
- Generate complete strategy definition
- Build execution engine code
- Implement all components (entry, stops, targets, pyramiding, etc.)
- Ensure code is production-ready

YOUR WORKFLOW:
1. Understand user's execution requirements
2. Query Archon for:
   - Similar execution patterns
   - Best practices for user's requirements
   - Past successful strategies
3. Generate strategy definition
4. Generate execution engine code
5. Ensure all components work together
6. Return complete strategy + code

STRATEGY COMPONENTS (from Archon):
- Entry Logic (scanner-based, custom, hybrid)
- Position Sizing (fixed, %, ATR, Kelly)
- Pyramiding (add to winners)
- Stop Management (initial, breakeven, trailing)
- Target Management (R-based, partial exits)
- Retry Rules (re-entry conditions)
- Capital Management (recycling, compounding)
- Risk Management (portfolio-level)

DATA INPUT MODES (from Archon):
- Single Ticker (test execution logic)
- Multi-Ticker (test on group)
- Scanner Results (scan → backtest)
- Custom Signal (custom logic → backtest)

EXECUTION ENGINE REQUIREMENTS:
- Realistic entry/exit simulation
- Multi-position tracking
- Stop management (all types)
- Target management (partial exits)
- Pyramiding logic
- Capital recycling
- Retry logic
- Risk limit enforcement
```

#### 2.4 Backtest Builder Prompt
```python
# File: prompts/backtest_builder.txt

You are the Backtest Builder specialist for the EdgeDev Trading System.

YOUR ROLE:
- Build backtest simulation engines
- Calculate all performance metrics
- Ensure realistic execution assumptions

YOUR KNOWLEDGE (via Archon):
- Complete Backtest & Optimization Gold Standard
- Performance metrics definitions
- Validation patterns
- Monte Carlo simulation
- Walk-forward testing

YOUR CAPABILITIES:
- Understand backtesting requirements
- Generate backtest engine code
- Calculate all required metrics
- Implement validation framework
- Ensure statistical rigor

YOUR WORKFLOW:
1. Understand what user wants to backtest
2. Query Archon for:
   - Backtest patterns for similar strategies
   - Performance metric definitions
   - Validation best practices
3. Generate backtest engine
4. Implement all required metrics
5. Add validation framework
6. Return backtest code + validation report

BACKTEST TYPES (from Archon):
- Simple P&L (daily bars, quick validation)
- Enhanced Intraday (minute bars, realistic)
- Monte Carlo (resampling for confidence)
- Walk-Forward (rolling window validation)

REQUIRED METRICS:
- Trade count, win rate, avg win/loss
- Expectancy, profit factor, Sharpe ratio
- Max drawdown, consecutive losses
- Component analysis (what adds value)
- Regime breakdown

VALIDATION REQUIREMENTS:
- Train/validation/forward split
- Overfitting detection
- Statistical significance
- Regime robustness
```

#### 2.5 Optimizer Prompt
```python
# File: prompts/optimizer.txt

You are the Optimization specialist for the EdgeDev Trading System.

YOUR ROLE:
- Optimize strategy parameters
- Find robust parameter sets
- Avoid overfitting

YOUR KNOWLEDGE (via Archon):
- Complete Backtest & Optimization Gold Standard
- Parameter optimization methods
- Overfitting detection patterns
- What has worked in past optimizations

YOUR CAPABILITIES:
- Run parameter searches (grid, random, Bayesian)
- Detect overfitting
- Validate out-of-sample
- Find robust parameter sets

YOUR WORKFLOW:
1. Understand what to optimize
2. Query Archon for:
   - Optimization best practices
   - Past optimization results
   - Overfitting patterns to avoid
3. Design parameter search space
4. Run optimization
5. Validate results
6. Return optimal parameters + validation report

OPTIMIZATION METHODS (from Archon):
- Grid Search (exhaustive, small parameter spaces)
- Random Search (efficient, large parameter spaces)
- Bayesian Optimization (smart, expensive functions)

OVERFITTING DETECTION:
- Train/validation gap analysis
- Parameter count vs signal count
- Holdout period testing
- Cross-validation

VALIDATION REQUIREMENTS:
- Train/validation/forward split (60/20/20)
- Walk-forward testing
- Forward testing (unseen data)
- Statistical significance
```

#### 2.6 Validator Prompt
```python
# File: prompts/validator.txt

You are the Validation specialist for the EdgeDev Trading System.

YOUR ROLE:
- Validate scanner quality
- Test backtest results
- Ensure edge is real

YOUR KNOWLEDGE (via Archon):
- Validation patterns and best practices
- A+ example testing
- Debugging methods
- Edge assessment criteria

YOUR CAPABILITIES:
- Run validation tests
- Check A+ examples are found
- Debug why examples are missing
- Assess edge quality
- Identify overfitting

YOUR WORKFLOW:
1. Understand what to validate
2. Query Archon for:
   - Validation best practices
   - Similar past validations
   - Common failure modes
3. Run validation tests
4. Generate validation report
5. If failures, debug and report issues
6. Return validation results + recommendations

VALIDATION STEPS:
- A+ Example Testing (must appear in results)
- Parameter Sensitivity Analysis
- Overfitting Detection
- Walk-Forward Testing
- Forward Testing
- Regime Analysis
- Monte Carlo Simulation

EDGE ASSESSMENT:
- Expectancy > 0.10R
- Sharpe > 1.0
- Consistency across regimes
- Walk-forward pass rate > 70%
- Forward test degradation < 30%
```

#### 2.7 Trading Advisor Prompt
```python
# File: prompts/trading_advisor.txt

You are the Trading Advisor specialist for the EdgeDev Trading System.

YOUR ROLE:
- Advise on trading approach
- Assess market regimes
- Evaluate edge potential
- Suggest improvements

YOUR KNOWLEDGE (via Archon):
- All Pattern Types (mean reversion focus)
- Market regime characteristics
- Edge assessment criteria
- Past successful/failed strategies

YOUR CAPABILITIES:
- Identify pattern type from description
- Assess edge potential
- Suggest improvements
- Analyze market regimes
- Provide trading insights

YOUR WORKFLOW:
1. Understand user's trading idea
2. Query Archon for:
   - Similar patterns and their characteristics
   - Current market regime
   - Past strategies in this regime
3. Assess edge potential
4. Suggest improvements
5. Identify risks
6. Return trading advice + assessment

PATTERN TYPES (from Archon):
- DMR (Multi-Day Momentum Fade)
- FBO (Fade Breakout)
- Extension Gaps
- Daily Para (Parabolic Fade)
- FRD EXT Gap (Frontside Extension)
- LC 3d Gap (3-Day Gap)
- Backside B (Gap Up → Hold → Fade)

EDGE ASSESSMENT:
- Is the pattern valid?
- Does it have edge?
- What market conditions?
- What are the risks?
- How to improve?
```

**Estimated Time**: 2 days

---

### PHASE 3: Archon Client (Week 1, Days 4-5)

**Goal**: Build Python client to interact with Archon MCP

**Tasks**:

#### 3.1 MCP Connection
- [ ] Install required MCP packages
- [ ] Create connection manager
- [ ] Implement retry logic
- [ ] Add error handling

#### 3.2 Knowledge Retrieval
- [ ] Implement semantic search (embeddings)
- [ ] Implement keyword search
- [ ] Implement document retrieval
- [ ] Implement chunk retrieval
- [ ] Add relevance scoring

#### 3.3 Knowledge Storage
- [ ] Implement document storage
- [ ] Implement chunk storage
- [ ] Implement result storage
- [ ] Add metadata tagging
- [ ] Add relationship tracking

#### 3.4 Memory/History
- [ ] Implement conversation storage
- [ ] Implement project storage
- [ ] Implement result storage
- [ ] Implement learning update

**File Structure**:
```python
# archon_client.py
class ArchonClient:
    """Main client for Archon MCP interaction"""

    def __init__(self, mcp_url):
        self.mcp_url = mcp_url

    def search_knowledge(self, query, category=None, limit=10):
        """Search knowledge base"""

    def get_document(self, document_id):
        """Get full document"""

    def store_result(self, result):
        """Store backtest/validation result"""

    def store_conversation(self, conversation):
        """Store conversation for learning"""

    def get_similar_projects(self, query):
        """Get similar past projects"""
```

**Estimated Time**: 1-2 days

---

### PHASE 4: Orchestrator & Router (Week 2, Days 1-2)

**Goal**: Build main orchestrator that routes to subagents

**Tasks**:

#### 4.1 Main Orchestrator
```python
# orchestrator.py
class MainOrchestrator:
    """Main orchestrator for EdgeDev AI Agent"""

    def __init__(self, archon_client, llm_client):
        self.archon = archon_client
        self.llm = llm_client

        # Load system prompts
        self.prompts = self._load_prompts()

        # Initialize subagents
        self.subagents = {
            'scanner': ScannerBuilder(archon, llm, self.prompts['scanner']),
            'strategy': StrategyBuilder(archon, llm, self.prompts['strategy']),
            'backtest': BacktestBuilder(archon, llm, self.prompts['backtest']),
            'optimizer': Optimizer(archon, llm, self.prompts['optimizer']),
            'validator': Validator(archon, llm, self.prompts['validator']),
            'advisor': TradingAdvisor(archon, llm, self.prompts['advisor']),
        }

    def process_request(self, user_input):
        """Main entry point"""
        # Step 1: Understand request
        request_type = self._classify_request(user_input)

        # Step 2: Retrieve context from Archon
        context = self.archon.search_knowledge(user_input)

        # Step 3: Route to subagent(s)
        results = self._route_to_subagents(request_type, user_input, context)

        # Step 4: Synthesize results
        response = self._synthesize_results(results)

        # Step 5: Store in Archon
        self.archon.store_conversation({
            'user_input': user_input,
            'response': response,
            'context': context,
            'results': results,
        })

        return response
```

#### 4.2 Request Classifier
```python
# classifier.py
class RequestClassifier:
    """Classify user request and determine routing"""

    def classify(self, user_input):
        """Classify request type"""
        # Check keywords and patterns
        if self._is_scanner_request(user_input):
            return 'scanner'
        elif self._is_strategy_request(user_input):
            return 'strategy'
        elif self._is_backtest_request(user_input):
            return 'backtest'
        elif self._is_optimization_request(user_input):
            return 'optimizer'
        elif self._is_validation_request(user_input):
            return 'validator'
        elif self._is_advisory_request(user_input):
            return 'advisor'
        else:
            return 'orchestrator'  # Needs multiple subagents
```

**Estimated Time**: 1-2 days

---

### PHASE 5: Subagent Implementation (Week 2, Days 3-5)

**Goal**: Implement all specialist subagents

**Tasks**:

#### 5.1 Base Subagent Class
```python
# base_subagent.py
class BaseSubagent:
    """Base class for all subagents"""

    def __init__(self, archon_client, llm_client, system_prompt):
        self.archon = archon_client
        self.llm = llm_client
        self.system_prompt = system_prompt

    def process(self, task, context):
        """Process task with Archon knowledge"""
        # Step 1: Retrieve relevant knowledge
        knowledge = self.archon.search_knowledge(task)

        # Step 2: Build prompt with knowledge
        prompt = self._build_prompt(task, knowledge)

        # Step 3: Call LLM
        response = self.llm.generate(prompt, self.system_prompt)

        # Step 4: Parse response
        result = self._parse_response(response)

        return result
```

#### 5.2 Implement Each Subagent
- [ ] ScannerBuilder subagent
- [ ] StrategyBuilder subagent
- [ ] BacktestBuilder subagent
- [ ] Optimizer subagent
- [ ] Validator subagent
- [ ] TradingAdvisor subagent

**Estimated Time**: 2-3 days

---

### PHASE 6: Code Generation & Validation (Week 2, Day 5 - Week 3, Day 1)

**Goal**: Build code generator and validator

**Tasks**:

#### 6.1 Code Generator
```python
# code_generator.py
class CodeGenerator:
    """Generates Python code from subagent output"""

    def __init__(self):
        self.templates = {}  # Not template-based, but pattern-based

    def generate_scanner(self, spec, context):
        """Generate V31 scanner code"""
        # Retrieve patterns from Archon
        v31_patterns = self._retrieve_v31_patterns()

        # Generate code following patterns
        code = self._generate_from_patterns(spec, v31_patterns)

        return code

    def generate_strategy(self, spec, context):
        """Generate execution engine code"""
        # Retrieve execution patterns from Archon
        execution_patterns = self._retrieve_execution_patterns()

        # Generate code
        code = self._generate_from_patterns(spec, execution_patterns)

        return code
```

#### 6.2 Code Validator
```python
# code_validator.py
class CodeValidator:
    """Validates generated code"""

    def validate_scanner(self, code, spec):
        """Validate scanner code"""
        # Check syntax
        syntax_ok = self._check_syntax(code)

        # Check V31 compliance
        v31_ok = self._check_v31_compliance(code)

        # Test execution (dry run)
        execution_ok = self._test_execution(code, spec)

        return {
            'syntax_ok': syntax_ok,
            'v31_ok': v31_ok,
            'execution_ok': execution_ok,
            'overall_valid': syntax_ok and v31_ok and execution_ok
        }
```

**Estimated Time**: 2-3 days

---

### PHASE 7: EdgeDev Integration (Week 3, Days 2-3)

**Goal**: Integrate with EdgeDev platform for testing/validation

**Tasks**:

#### 7.1 EdgeDev Client
```python
# edgedev_client.py
class EdgeDevClient:
    """Client for EdgeDev platform integration"""

    def __init__(self, backend_url='http://localhost:5666',
                 dashboard_url='http://localhost:5665'):
        self.backend_url = backend_url
        self.dashboard_url = dashboard_url

    def upload_scanner(self, code, name):
        """Upload scanner code to EdgeDev backend"""

    def run_scan(self, scanner_name, start_date, end_date):
        """Run scanner and get results"""

    def format_for_chart(self, results):
        """Format results for dashboard visualization"""

    def launch_dashboard(self, results):
        """Launch EdgeDev dashboard with results"""
        import webbrowser
        webbrowser.open(f'{self.dashboard_url}?results={json.dumps(results)}')
```

#### 7.2 Integration Testing
- [ ] Test scanner upload
- [ ] Test scan execution
- [ ] Test result formatting
- [ ] Test dashboard launch
- [ ] Test full workflow (scanner → run → view)

**Estimated Time**: 1-2 days

---

### PHASE 8: Learning Loop (Week 3, Day 4)

**Goal**: Implement learning from results

**Tasks**:

#### 8.1 Result Analyzer
```python
# learning.py
class ResultAnalyzer:
    """Analyze results and extract learning"""

    def analyze_backtest(self, results):
        """Analyze backtest results"""
        learning = {
            'what_worked': [],
            'what_didnt_work': [],
            'parameter_insights': [],
            'regime_performance': {},
        }

        # Analyze components
        if results['pyramid_contrib_r'] > 0.2:
            learning['what_worked'].append('Pyramiding')

        if results['retry_win_rate'] < results['initial_win_rate']:
            learning['what_didnt_work'].append('Retry rules')

        return learning

    def store_learning(self, learning):
        """Store learning back to Archon"""
        self.archon.store_learning(learning)
```

#### 8.2 Pattern Evolution
```python
# pattern_evolution.py
class PatternEvolution:
    """Track pattern evolution over time"""

    def update_pattern_performance(self, pattern_id, results):
        """Update pattern performance stats"""
        stats = {
            'pattern_id': pattern_id,
            'times_used': self._get_usage_count(pattern_id) + 1,
            'avg_expectancy': self._calculate_avg_expectancy(pattern_id, results),
            'last_used': datetime.now(),
        }

        self.archon.update_pattern_stats(pattern_id, stats)
```

**Estimated Time**: 1 day

---

### PHASE 9: User Interface (Week 3, Day 5)

**Goal**: Build user interface

**Options**:

#### Option 1: Claude Code Integration (Simplest)
- Use Claude Code's built-in chat interface
- Add custom instructions with our system prompts
- Use MCP for Archon integration
- **Estimated**: 1 day (fastest path)

#### Option 2: Simple CLI
- Terminal-based chat interface
- Commands: `/scan`, `/backtest`, `/optimize`
- **Estimated**: 2-3 days

#### Option 3: Web UI
- Simple chat web interface
- Integrates with all components
- **Estimated**: 3-5 days

**Recommendation**: Start with Claude Code (Option 1), can add other interfaces later

**Estimated Time**: 1 day (Claude Code) or 2-5 days (other options)

---

## Priority Matrix

### Must Have (MVP)
| Phase | Priority | Dependencies | Time |
|-------|----------|--------------|------|
| Phase 0: Foundations | CRITICAL | None | 1-2h |
| Phase 1: Archon Knowledge Base | CRITICAL | None | 1-2d |
| Phase 2: System Prompts | CRITICAL | Phase 1 | 2d |
| Phase 4: Orchestrator | HIGH | Phase 2, 3 | 1-2d |
| Phase 5: Subagents | HIGH | Phase 4 | 2-3d |
| Phase 6: Code Generation | HIGH | Phase 5 | 2-3d |
| Phase 7: EdgeDev Integration | HIGH | Phase 6 | 1-2d |
| Phase 9: UI (Claude Code) | HIGH | Phase 4 | 1d |

### Nice to Have (Post-MVP)
| Phase | Priority | Dependencies | Time |
|-------|----------|--------------|------|
| Phase 3: Archon Client | MEDIUM | Phase 1 | 1-2d |
| Phase 8: Learning Loop | MEDIUM | Phase 7 | 1d |
| Phase 9: UI (Web) | LOW | Phase 4 | 3-5d |

---

## Timeline

### Week 1: Foundation & Knowledge
- Day 1-2: Phase 0 (Foundations) + Phase 1 (Archon Knowledge Base)
- Day 3-4: Phase 2 (System Prompts)
- Day 5: Phase 3 (Archon Client) - start

### Week 2: Core Agent
- Day 1-2: Phase 4 (Orchestrator)
- Day 3-5: Phase 5 (Subagents)
- Day 5: Phase 6 (Code Generation) - start

### Week 3: Integration & Polish
- Day 1: Phase 6 (Code Generation) - finish
- Day 2-3: Phase 7 (EdgeDev Integration)
- Day 4: Phase 8 (Learning Loop)
- Day 5: Phase 9 (UI)

### Week 4+: Testing & Iteration
- Test all components
- Fix bugs
- Add features
- Optimize performance

---

## Validation Criteria

### Phase 0: Foundations
- [ ] Archon MCP responds to queries
- [ ] EdgeDev backend accessible
- [ ] EdgeDev dashboard loads
- [ ] Polygon API works

### Phase 1: Archon Knowledge Base
- [ ] All 7 Gold Standards loaded
- [ ] Search returns relevant results
- [ ] Retrieved content is accurate
- [ ] Relationships work (cross-references)

### Phase 2: System Prompts
- [ ] All 7 prompts written
- [ ] Prompts reference Archon knowledge
- [ ] Prompts specify workflows clearly
- [ ] Prompts include validation criteria

### Phase 4: Orchestrator
- [ ] Classifies requests correctly
- [ ] Routes to correct subagent
- [ ] Retrieves context from Archon
- [ ] Synthesizes results properly

### Phase 5: Subagents
- [ ] Each subagent processes requests
- [ ] Each subagent queries Archon
- [ ] Each subagent returns valid output
- [ ] All subagents work together

### Phase 6: Code Generation
- [ ] Generates valid Python code
- [ ] Code follows V31 principles
- [ ] Code passes validation
- [ ] Code runs without errors

### Phase 7: EdgeDev Integration
- [ ] Scanner uploads successfully
- [ ] Scanner runs successfully
- [ ] Results format correctly
- [ ] Dashboard launches with results

### Phase 8: Learning Loop
- [ ] Results are analyzed
- [ ] Learning is extracted
- [ ] Learning is stored in Archon
- [ ] Agent improves over time

### Phase 9: User Interface
- [ ] User can interact via chat
- [ ] Requests are processed correctly
- [ ] Results are displayed clearly
- [ ] Conversation history is maintained

---

## Risk Mitigation

### Risk 1: Archon Integration Complexity
**Mitigation**: Start with simple file-based knowledge, migrate to full Archon later
**Fallback**: Use document embeddings with vector DB

### Risk 2: LLM API Costs
**Mitigation**: Use efficient prompting, cache results, use smaller models for subtasks
**Fallback**: Local LLM (Ollama, etc.)

### Risk 3: Code Quality
**Mitigation**: Multiple validation layers, human in loop for testing
**Fallback**: Manual code review before execution

### Risk 4: Complexity Overwhelm
**Mitigation**: Build incrementally, test each phase thoroughly
**Fallback**: Simplify to MVP (scanner + backtest only)

---

## Success Criteria

### MVP Success (Week 3)
- [ ] User can describe strategy in plain English
- [ ] Agent retrieves relevant knowledge from Archon
- [ ] Agent generates V31-compliant scanner code
- [ ] Agent generates backtest code
- [ ] Code runs successfully
- [ ] Results display in EdgeDev dashboard
- [ ] Results are stored in Archon

### Full System Success (Week 4+)
- [ ] All subagents working
- [ ] Learning loop operational
- [ ] Agent improves over time
- [ ] User can build complete strategies end-to-end
- [ ] System handles edge cases gracefully

---

## Next Steps

### Immediate (Today)
1. ✅ Complete build plan (this document)
2. Choose LLM provider (OpenAI, Anthropic, or local)
3. Set up development environment

### This Week
1. Complete Phase 0 (Foundations)
2. Complete Phase 1 (Archon Knowledge Base)
3. Start Phase 2 (System Prompts)

### Decision Points
1. **LLM Provider**: OpenAI GPT-4 (easiest) or Anthropic Claude (best) or local Ollama (free)?
2. **UI**: Claude Code integration (fastest) or custom CLI or web UI?
3. **Archon**: Full MCP server or simplified file-based for MVP?

---

## File Structure

```
edge-dev-ai-agent/
├── README.md
├── requirements.txt
├── .env.example
├── config/
│   ├── mcp_config.yaml
│   └── agent_config.yaml
├── prompts/
│   ├── orchestrator.txt
│   ├── scanner_builder.txt
│   ├── strategy_builder.txt
│   ├── backtest_builder.txt
│   ├── optimizer.txt
│   ├── validator.txt
│   └── trading_advisor.txt
├── src/
│   ├── __init__.py
│   ├── main.py
│   ├── orchestrator.py
│   ├── classifier.py
│   ├── base_subagent.py
│   ├── subagents/
│   │   ├── __init__.py
│   │   ├── scanner_builder.py
│   │   ├── strategy_builder.py
│   │   ├── backtest_builder.py
│   │   ├── optimizer.py
│   │   ├── validator.py
│   │   └── trading_advisor.py
│   ├── archon_client.py
│   ├── code_generator.py
│   ├── code_validator.py
│   ├── edgedev_client.py
│   ├── learning.py
│   └── utils.py
├── tests/
│   ├── test_archon_client.py
│   ├── test_orchestrator.py
│   ├── test_subagents.py
│   └── integration_tests.py
└── docs/
    ├── architecture.md
    ├── api_reference.md
    └── user_guide.md
```

---

## Summary

**What We're Building**:
- Custom-prompted AI agent system
- Archon-powered knowledge and memory
- Specialist subagents for different tasks
- Full trading strategy development workflow
- Learning and improvement over time

**Timeline**:
- Week 1: Foundation & Knowledge
- Week 2: Core Agent
- Week 3: Integration & Polish
- Week 4+: Testing & Iteration

**Key Success Factor**:
Agent is NOT template-based. It's knowledge-based with Archon, allowing flexibility, creativity, and continuous learning.

---

**Status**: READY TO BUILD
**Version**: 1.0
**Date**: 2026-01-29
