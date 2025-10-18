---
tags:
- scope:meta
- type:sop
- project:ce-hub
- domain:documentation
- stage:active
---

# CE-Hub Tag Policy
**Document Type**: Policy & Standards
**Created**: 2025-10-11
**Version**: 1.0
**Status**: Active

## Overview

This document defines the standardized tagging taxonomy for the CE-Hub ecosystem. Consistent tagging enables efficient knowledge retrieval, systematic content organization, and optimal RAG query performance across all documentation, artifacts, and knowledge sources.

## Tag Structure Format

All tags MUST follow the `category:value` format with lowercase values and hyphens for multi-word terms.

**Format**: `category:value`
**Examples**: `scope:meta`, `type:implementation`, `domain:context-engineering`

## Core Tag Categories

### 1. Scope (Required)
Defines the operational boundary and context level.

**Required for**: All documents and artifacts
**Values**:
- `scope:global` - Cross-domain knowledge, universal patterns
- `scope:project` - Project-specific content (ce-hub, auth-edge, etc.)
- `scope:meta` - Meta-knowledge about CE-Hub itself (reflections, policies, reports)
- `scope:local` - Environment or instance-specific content

**Examples**:
```yaml
scope:global    # Supabase docs, React patterns, universal methodologies
scope:project   # CE-Hub setup guides, project-specific implementations
scope:meta      # Weekly reflections, tag policies, operational reports
scope:local     # Local environment configs, personal preferences
```

### 2. Type (Required)
Categorizes the document's primary function and content structure.

**Required for**: All documents and artifacts
**Values**:
- `type:plan` - Strategic planning documents, PRPs, project blueprints
- `type:sop` - Standard Operating Procedures, workflows, methodologies
- `type:report` - Analysis reports, status updates, assessments
- `type:implementation` - Code, configuration, technical implementations
- `type:summary` - Chat summaries, condensed information, abstracts
- `type:specialist` - Domain-specific deep knowledge, expert content
- `type:reflection` - Meta-analysis, learning synthesis, retrospectives
- `type:docs` - Reference documentation, guides, tutorials
- `type:patterns` - Reusable templates, design patterns, methodologies
- `type:examples` - Code examples, use cases, demonstrations
- `type:api` - API documentation, endpoint specifications
- `type:guide` - Step-by-step instructions, how-to content
- `type:status-report` - Operational status, health checks, metrics

**Examples**:
```yaml
type:plan           # PRP documents, strategic plans
type:implementation # Edge functions, scripts, configurations
type:reflection     # Weekly reflections, learning analysis
type:docs           # API documentation, user guides
```

### 3. Stage (Optional)
Indicates the lifecycle stage or temporal context.

**Used for**: Workflow tracking, version control, process management
**Values**:
- `stage:draft` - Work in progress, preliminary content
- `stage:review` - Ready for validation, pending approval
- `stage:active` - Current operational status, live content
- `stage:archived` - Historical content, superseded versions
- `stage:weekly` - Weekly cycle content (reflections, reports)
- `stage:monthly` - Monthly cycle content (archives, reviews)
- `stage:planning` - Pre-implementation planning phase
- `stage:development` - Active development phase
- `stage:testing` - Validation and testing phase
- `stage:production` - Live deployment, production use

**Examples**:
```yaml
stage:weekly     # Weekly reflection documents
stage:active     # Current operational procedures
stage:archived   # Historical versions, archived chats
```

### 4. Project (Conditional)
Identifies the specific project when scope is project-level.

**Required when**: `scope:project` is used
**Values**:
- `project:ce-hub` - Core CE-Hub ecosystem project
- `project:auth-edge` - Authentication edge function project
- `project:planner-chat` - Planning chat interface project
- `project:archon` - Archon MCP integration project
- `project:agui` - Autonomous GUI interface project

**Examples**:
```yaml
# Authentication project content
scope:project + project:auth-edge

# Core CE-Hub content
scope:project + project:ce-hub
```

### 5. Domain (Optional)
Specifies the technical or knowledge domain.

**Used for**: Technology-specific content, domain expertise
**Values**:
- `domain:context-engineering` - Context engineering methodologies
- `domain:frontend` - UI, React, Vue, component development
- `domain:backend` - Server-side, APIs, databases
- `domain:devops` - Infrastructure, deployment, operations
- `domain:security` - Authentication, authorization, security patterns
- `domain:testing` - Testing strategies, validation, QA
- `domain:documentation` - Documentation practices, standards
- `domain:supabase` - Supabase-specific knowledge
- `domain:pydantic` - Pydantic framework knowledge
- `domain:typescript` - TypeScript language and patterns
- `domain:vercel` - Vercel platform and edge functions

**Examples**:
```yaml
domain:security      # Authentication guides, security patterns
domain:frontend      # React components, UI patterns
domain:devops        # Deployment scripts, infrastructure
```

### 6. Intelligence (Optional)
Indicates the level of meta-intelligence or analysis depth.

**Used for**: Meta-analysis, intelligence artifacts, learning content
**Values**:
- `intelligence:meta-analysis` - Deep analysis of patterns and trends
- `intelligence:pattern-recognition` - Identification of reusable patterns
- `intelligence:learning-synthesis` - Synthesis of learnings and insights
- `intelligence:knowledge-aggregation` - Compilation of distributed knowledge
- `intelligence:trend-analysis` - Analysis of temporal patterns and trends

**Examples**:
```yaml
intelligence:meta-analysis     # Weekly reflections with deep analysis
intelligence:pattern-recognition # Reusable workflow templates
```

### 7. Source (Optional)
Identifies the origination system or tool.

**Used for**: Content provenance, system tracking
**Values**:
- `source:claude-code` - Generated through Claude Code IDE
- `source:planner-chat` - Created via planning chat interface
- `source:archon` - Originated from Archon system
- `source:manual` - Manually created or edited
- `source:automated` - System-generated content

## Tag Validation Rules

### Mandatory Combinations
1. **All documents** must have `scope` and `type` tags
2. **Project scope** documents must include `project` tag
3. **Meta content** should include `intelligence` tag when applicable
4. **Stage tags** required for workflow tracking

### Validation Requirements
- Minimum 2 tags per document (`scope` + `type`)
- Maximum 8 tags per document (avoid over-tagging)
- No duplicate categories (only one `scope`, one `type`, etc.)
- All tags must be lowercase with hyphens for multi-word values

### Format Validation
- Pattern: `^[a-z-]+:[a-z0-9-]+$`
- No spaces, underscores, or special characters
- Use hyphens for word separation: `context-engineering`, `status-report`

## Standard Tag Combinations

### Documentation Patterns
```yaml
# Global documentation
tags:
  - scope:global
  - type:docs
  - domain:supabase

# Project documentation
tags:
  - scope:project
  - type:docs
  - project:ce-hub
  - domain:context-engineering

# Meta documentation
tags:
  - scope:meta
  - type:docs
  - domain:documentation
```

### Implementation Patterns
```yaml
# Project implementations
tags:
  - scope:project
  - type:implementation
  - project:auth-edge
  - domain:security
  - stage:production

# Global patterns
tags:
  - scope:global
  - type:patterns
  - domain:frontend
  - intelligence:pattern-recognition
```

### Analysis & Reflection Patterns
```yaml
# Weekly reflections
tags:
  - scope:meta
  - type:reflection
  - stage:weekly
  - intelligence:meta-analysis
  - project:ce-hub

# Status reports
tags:
  - scope:meta
  - type:status-report
  - project:ce-hub
  - stage:active
```

## Migration Guidelines

### Existing Content
All existing content should be updated to comply with this policy:

1. **Immediate Priority**: Meta documents (reflections, reports, policies)
2. **Secondary Priority**: Project documentation and implementations
3. **Ongoing**: Global knowledge sources and external documentation

### Legacy Tag Handling
- Simple tags like `["documentation", "pydantic"]` should be converted to structured format
- Preserve original meaning while adopting new taxonomy
- Example: `documentation` → `type:docs`, `pydantic` → `domain:pydantic`

## Quality Assurance

### Validation Tools
- Automated tag validation script: `scripts/validate_tags.py`
- Pre-commit hooks for tag format validation
- Archon ingestion validation for tag compliance

### Review Process
1. All new documents must pass tag validation
2. Periodic review of tag usage patterns
3. Quarterly taxonomy refinement based on usage analytics

## Examples by Document Type

### PRP Documents
```yaml
tags:
  - scope:meta
  - type:plan
  - project:ce-hub
  - stage:active
  - intelligence:pattern-recognition
```

### Chat Summaries
```yaml
tags:
  - scope:project
  - type:summary
  - project:ce-hub
  - stage:archived
  - domain:context-engineering
```

### Implementation Code
```yaml
tags:
  - scope:project
  - type:implementation
  - project:auth-edge
  - domain:security
  - stage:production
  - source:claude-code
```

### Weekly Reflections
```yaml
tags:
  - scope:meta
  - type:reflection
  - stage:weekly
  - project:ce-hub
  - intelligence:meta-analysis
```

### Knowledge Reports
```yaml
tags:
  - scope:meta
  - type:report
  - project:ce-hub
  - stage:active
  - intelligence:knowledge-aggregation
```

## Enforcement

### Automated Validation
- Tag format validation on all document creation/modification
- Archon ingestion requires compliant tags
- CI/CD integration for tag validation

### Manual Review
- Weekly tag usage review during reflection cycles
- Monthly taxonomy effectiveness assessment
- Quarterly policy updates based on usage patterns

## Conclusion

This tag policy ensures consistent, searchable, and meaningful organization of all CE-Hub knowledge artifacts. Compliance with this taxonomy enables optimal RAG performance, efficient knowledge retrieval, and systematic intelligence accumulation across the CE-Hub ecosystem.

**Policy Status**: ✅ Active
**Next Review**: 2025-11-11
**Validator Script**: `scripts/validate_tags.py`

---

*This document follows its own tagging policy:*
```yaml
tags:
  - scope:meta
  - type:sop
  - project:ce-hub
  - domain:documentation
  - stage:active
```