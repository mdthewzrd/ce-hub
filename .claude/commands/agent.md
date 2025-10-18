# Agent Command

Access and interact with the CE-Hub digital team agents.

Run the agent manager to interact with CE-Hub agents:

```bash
cd "/Users/michaeldurante/ai dev/ce-hub"
python3 scripts/agent_manager.py "$1" "$2" "$3"
```

Usage: `/agent <action> [target] [task]`

Examples:
- `/agent list`
- `/agent info researcher`
- `/agent execute engineer "implement auth API"`
- `/agent parallel engineer,tester "build auth system"`

## Agent Routing

The system will automatically:
1. Route simple tasks directly to specialist agents
2. Involve the Orchestrator for complex multi-agent coordination
3. Apply the Archon-First protocol for all workflows
4. Follow Plan → Research → Produce → Ingest methodology

## Available Agents

### Orchestrator
- **Role**: Master coordinator for CE-Hub ecosystem
- **Use for**: Complex tasks requiring multiple agents, workflow coordination, plan-mode execution
- **Specializations**: Task routing, context management, quality assurance

### Researcher
- **Role**: Information gathering and knowledge synthesis specialist
- **Use for**: Research tasks, system analysis, knowledge discovery
- **Specializations**: RAG queries, pattern recognition, intelligence synthesis

### Engineer
- **Role**: Technical implementation and development specialist
- **Use for**: Code development, system configuration, technical integration
- **Specializations**: Multi-language development, architecture, defensive security

### Tester
- **Role**: Quality assurance and validation specialist
- **Use for**: Testing strategies, quality validation, defect management
- **Specializations**: Automated testing, security testing, quality analysis

### Documenter
- **Role**: Knowledge capture and documentation specialist
- **Use for**: Documentation creation, knowledge management, content organization
- **Specializations**: Technical writing, information architecture, knowledge capture

## Notes

- All agent workflows begin with Archon MCP synchronization
- Complex tasks automatically trigger Orchestrator coordination
- Plan-mode precedence enforced for significant operations
- Knowledge artifacts prepared for Archon ingestion