# 🤖 GlobalRenataAgent - Quick Reference Guide

**Status**: ✅ FULLY INTEGRATED WITH LOCAL RENATA ORCHESTRATOR
**Last Updated**: 2026-01-05

---

## 🎯 What Can You Do Now?

### 1. **General Chat** 💬
Ask Renata anything about scanners, patterns, and trading strategies.

**Examples**:
- "How does parameter optimization work?"
- "What's the V31 standard?"
- "Explain the multi-agent system"
- "Best practices for scanner design?"

**Response**: Coordinated by Renata Orchestrator with 6 specialized agents

---

### 2. **Generate Scanners** 🔥
Describe a scanner in natural language, and Renata will generate V31-compliant code.

**Examples**:
- "Create a backside_b scanner that finds stocks gapping down 2% with high volume"
- "Generate an LC scanner for gap-up patterns with volume confirmation"
- "Create a scanner for small-cap stocks with momentum breakout"
- "Generate an A+ pattern scanner with multi-timeframe confirmation"

**Response**: ✅ Scanner generated with:
- Generated ID and name
- Confidence score
- Agent attribution (which agents contributed)
- Ready to use or optimize

**How it Works**:
```
Your description
    ↓
CodeAnalyzerAgent (analyzes requirements)
    ↓
CodeFormatterAgent (transforms to V31 standard)
    ↓
ParameterExtractorAgent (extracts parameters)
    ↓
Generated scanner + metadata
```

---

### 3. **Optimize Parameters** ⚡
Ask Renata to optimize your existing scanner parameters.

**Examples**:
- "Optimize my lc-d2 scanner parameters"
- "Improve the performance of my backside-b scanner"
- "Find better parameters for my gap scanner"
- "Optimize for maximum Sharpe ratio"

**Response**: ✅ Optimization completed with:
- Optimized parameters
- Validation results (V31 compliance)
- Performance insights
- Agent attribution
- Learnings captured

**How it Works**:
```
Your current parameters
    ↓
ParameterExtractorAgent (analyzes parameters)
    ↓
OptimizerAgent (applies optimization strategy)
    ↓
ValidatorAgent (validates results)
    ↓
DocumentationAgent (captures learnings)
    ↓
Optimized parameters + validation + learnings
```

---

### 4. **Debug Issues** 🔧
Get help troubleshooting scanner problems.

**Examples**:
- "My scanner isn't finding results"
- "Why is my validation failing?"
- "Help me fix parameter errors"
- "Debug my backtest results"

**Response**: Diagnostic analysis with:
- Common issues identified
- Quick troubleshooting steps
- Optimization suggestions
- Parameter recommendations

---

## 🎨 Quick Action Buttons

Three pre-configured buttons for common tasks:

### **Optimize Scanner** 🟢 (Green)
- Automatically optimizes your scanner parameters
- Uses agent coordination for best results
- Shows validation and learnings

### **AI Splitting** 🔵 (Blue)
- Explains AI-powered scanner splitting features
- Shows how to use multi-scanner workflows
- Demonstrates parameter isolation

### **Debug Issues** 🔴 (Red)
- Provides troubleshooting guidance
- Analyzes common scanner problems
- Suggests fixes and optimizations

---

## 📊 Message Types Explained

Renata shows different colored badges to indicate message type:

| Badge | Color | Meaning | When Used |
|-------|-------|---------|-----------|
| **conversion** | Blue | Code transformation | Generating/splitting scanners |
| **troubleshooting** | Red | Debugging help | Fixing errors or issues |
| **analysis** | Green | Analysis/optimization | Optimizing parameters, performance analysis |
| **general** | Yellow | General chat | Questions, explanations, chat |

---

## 🤖 Agent Attribution

When Renata processes your request, you'll see which agents contributed:

### **Scanner Generation Shows**:
- 🤖 **CodeAnalyzerAgent**: Analyzed requirements
- 🎨 **CodeFormatterAgent**: Applied V31 standards
- 📊 **ParameterExtractorAgent**: Extracted parameters

### **Optimization Shows**:
- 🔍 **ParameterExtractorAgent**: Analyzed current parameters
- ⚙️ **OptimizerAgent**: Applied optimization strategy
- ✅ **ValidatorAgent**: Validated results
- 📚 **DocumentationAgent**: Documented learnings

---

## 💡 Pro Tips

### Tip 1: Be Specific for Generation
❌ "Create a scanner"
✅ "Create a backside_b scanner that finds stocks gapping down 2% with high volume (>2M)"

### Tip 2: Mention Scanner Type for Optimization
❌ "Optimize my scanner"
✅ "Optimize my lc-d2 scanner parameters"

### Tip 3: Provide Context for Debugging
❌ "Not working"
✅ "My backside-b scanner isn't finding results when I scan with gap_threshold=2.5"

### Tip 4: Use Keywords for Smart Detection
The chat automatically detects these keywords:
- **"generate"**, **"create"**, **"new"** → Scanner generation
- **"optimize"**, **"improve"** → Parameter optimization
- **"debug"**, **"error"**, **"problem"** → Troubleshooting
- **"scanner:"** → Scanner workflow

---

## 🔄 Complete Workflow Example

### Scenario: Create and Optimize a New Scanner

**Step 1: Generate Scanner**
```
You: "Create a backside_b scanner for stocks gapping down 2% with high volume"

Renata: ✅ **Scanner Generated Successfully!**

**Name**: gap-down-high-volume
**ID**: scanner-1767650100123-xyz789
**Confidence**: 85%

Generated using Renata's multi-agent system:
- 🤖 CodeAnalyzerAgent: Analyzed requirements
- 🎨 CodeFormatterAgent: Applied V31 standards
- 📊 ParameterExtractorAgent: Extracted parameters

Ready to use! Would you like me to run it or optimize the parameters?
```

**Step 2: Optimize Parameters**
```
You: "Optimize the parameters for this scanner"

Renata: ✅ **Scanner Optimized Successfully!**

**Scanner Type**: backside-b
**Execution Time**: 0.8s

**Optimized Parameters**:
- gap_threshold: 2.0 → 1.8 (improved coverage)
- min_volume: 1000000 → 800000 (increased opportunities)
- min_market_cap: 50000000 (preserved)

**Validation**: ✅ Passed
- V31 Compliant: ✅ Yes
- Parameter Integrity: valid

**Learnings Captured**: ✅ Yes
- Patterns Found: 3
- Recommendations: 2

Optimized using Renata's multi-agent system:
- 🔍 ParameterExtractorAgent: Analyzed current parameters
- ⚙️ OptimizerAgent: Applied optimization strategy
- ✅ ValidatorAgent: Validated results
- 📚 DocumentationAgent: Documented learnings
```

---

## 🚀 Advanced Features

### 1. **Context Awareness**
Renata knows which page you're on and adapts responses:
- On `/exec` page → Focus on execution and backtesting
- On `/projects` page → Focus on project management
- On home page → General assistance

### 2. **Continuous Learning**
Every interaction:
- DocumentationAgent captures learnings
- Patterns stored for future reference
- Ready for Archon knowledge graph ingestion

### 3. **Agent Coordination**
Behind the scenes, Renata coordinates:
- 6 specialized agents
- Multi-step workflows
- Validation and quality gates
- Fallback to original services if needed

### 4. **Zero External Dependencies**
- All processing happens locally
- No API calls to external services
- Faster response times
- Complete data privacy

---

## 📝 Quick Command Reference

| Command | What It Does | Example |
|---------|--------------|---------|
| `"Generate X scanner"` | Creates new scanner | `"Generate a backside_b scanner..."` |
| `"Create scanner for..."` | Creates new scanner | `"Create scanner for gap-up patterns..."` |
| `"Optimize X scanner"` | Optimizes parameters | `"Optimize my lc-d2 scanner..."` |
| `"Improve parameters"` | Optimizes parameters | `"Improve the performance..."` |
| `"Debug X scanner"` | Troubleshooting | `"Debug my backtest results..."` |
| `"Help me fix..."` | Troubleshooting | `"Help me fix validation errors..."` |
| `"How does X work?"` | General chat | `"How does parameter optimization work?"` |
| `"Explain X"` | General chat | `"Explain the V31 standard"` |

---

## ✅ Getting Started

1. **Open the Chat**: Click the yellow Renata AI button (bottom-right corner)
2. **Start Simple**: Try "Hello Renata!" to see the agent introduction
3. **Generate a Scanner**: Use "Create a scanner for..." to test generation
4. **Optimize Parameters**: Use "Optimize my scanner" to test optimization
5. **Explore Quick Actions**: Click the quick action buttons for common tasks

---

## 🎓 Learning Resources

- **Full Integration Details**: See `GLOBAL_RENATA_AGENT_LOCAL_INTEGRATION_COMPLETE.md`
- **Scan Workflow**: See `RENATA_ORCHESTRATOR_SCAN_INTEGRATION_COMPLETE.md`
- **Agent System**: See `/src/services/renata/agents/`

---

## 🆘 Troubleshooting

### Chat Not Responding?
1. Check browser console for errors
2. Verify dev server is running on port 5665
3. Check `/api/renata/chat` endpoint is accessible

### Scanner Generation Failing?
1. Be more specific in your description
2. Include scanner type (lc-d2, backside-b, etc.)
3. Mention key parameters (gap threshold, volume, etc.)

### Optimization Not Working?
1. Specify which scanner type you're optimizing
2. Ensure scanner exists in your system
3. Check current parameters are valid

### Agent Errors?
1. Check backend server is running on port 5666
2. Verify agent services are initialized
3. Check server logs for detailed error messages

---

## 🎯 Summary

Your GlobalRenataAgent is now:
- ✅ **Fully Local** - No external API dependencies
- ✅ **Agent-Powered** - 6 specialized agents coordinate responses
- ✅ **Scan-Integrated** - Generate and optimize scanners from chat
- ✅ **Smart Routing** - Automatically detects what you want to do
- ✅ **Transparent** - See which agents contribute to each response
- ✅ **Learning** - Continuous improvement with every interaction

**Ready to use! Just click the yellow Renata AI button and start chatting!** 🚀
