# CE-Hub Planner Chat Scaffolding

**PRP-09A Implementation** - Specialized minimal web chat application for planning and research that exports documents to Archon.

## 🎯 Overview

Planner Chat is a specialized ChatGPT-like interface designed exclusively for strategic planning and research activities. It enforces planning-only constraints to prevent implementation while enabling comprehensive planning workflows that export structured documents to the Archon knowledge graph.

### Key Features

- **Planning-Only Focus**: Strict constraints prevent code implementation, ensuring focus on strategic planning
- **Multi-LLM Support**: Compatible with OpenAI GPT and Anthropic Claude models
- **Streaming Interface**: Real-time streaming responses with ChatGPT-like UX
- **Archon Integration**: Export planning documents via MCP protocol with REST fallback
- **Dark Mode UI**: Professional dark theme optimized for planning workflows
- **Speech Features**: Optional STT/TTS support for accessibility
- **Responsive Design**: Mobile-friendly interface with adaptive layouts

## 🏗️ Architecture

```
planner-chat/
├── web/              # Frontend (Dark Mode ChatGPT-like UI)
│   ├── index.html    # Main interface with export modal
│   ├── style.css     # Dark theme styling and responsive design
│   └── app.js        # Streaming client with STT/TTS toggles
├── server/           # Backend (Express with streaming endpoints)
│   └── main.js       # SSE streaming and document export
├── llm/              # LLM Adapters (Multi-provider support)
│   ├── generic.js    # Base adapter with planning constraints
│   ├── openai.js     # OpenAI GPT streaming adapter
│   └── anthropic.js  # Anthropic Claude streaming adapter
├── archon/           # Archon Integration
│   └── bridge.js     # MCP client for document management
├── prompts/          # System Prompts
│   └── planner_system.md  # Planning-only persona constraints
├── package.json      # Dependencies and scripts
└── .env.example      # Configuration template
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- LLM API keys (OpenAI or Anthropic)
- Archon server running (optional for development)

### Installation

1. **Clone and setup**:
   ```bash
   cd planner-chat
   npm install
   cp .env.example .env
   ```

2. **Configure environment** (edit `.env`):
   ```bash
   # LLM Configuration
   DEFAULT_LLM_PROVIDER=openai          # or 'anthropic'
   DEFAULT_MODEL=gpt-4                  # or 'claude-3-sonnet-20240229'
   OPENAI_API_KEY=your_openai_key       # Required for OpenAI
   ANTHROPIC_API_KEY=your_anthropic_key # Required for Anthropic

   # Archon Integration
   ARCHON_BASE_URL=http://localhost:8181    # Archon REST API
   ARCHON_MCP_URL=http://localhost:8051     # Archon MCP Gateway
   ARCHON_PROJECT_WHITELIST=proj-1,proj-2   # Optional: restrict projects

   # Server Configuration
   PORT=3000
   NODE_ENV=development
   ALLOWED_ORIGINS=http://localhost:3000
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Access interface**:
   - Open `http://localhost:3000`
   - Start planning and research conversations
   - Export documents to Archon when ready

## 📋 Core Components

### Frontend (web/)

#### `index.html`
- ChatGPT-like interface with dark mode
- Welcome message emphasizing planning-only focus
- Export modal for Archon document submission
- STT/TTS toggle buttons for accessibility
- Responsive design for mobile and desktop

**Key Features**:
- Planning constraint notification in welcome message
- Export button enabled after conversation starts
- Modal workflow for document metadata collection
- Success confirmation with Archon source ID

#### `style.css`
- Professional dark theme with planning color scheme
- Responsive design with mobile-first approach
- Smooth animations and micro-interactions
- ChatGPT-inspired message bubbles and layout
- Custom CSS variables for easy theming

**Design System**:
- Primary colors: Planning purple (#7c3aed) with dark backgrounds
- Typography: Inter font family for readability
- Spacing: Consistent 0.25rem base unit system
- Animations: Smooth transitions with 0.3s timing

#### `app.js`
- Streaming chat client with Server-Sent Events
- Speech-to-text and text-to-speech integration
- Document export workflow with Archon integration
- Real-time typing indicators and message streaming
- Auto-resize input with character counting

**Key Classes**:
- `PlannerChatApp`: Main application controller
- Message handling with streaming support
- Export modal management and document generation
- Speech feature integration (optional)

### Backend (server/)

#### `main.js`
- Express server with CORS and streaming support
- Health check endpoint for service monitoring
- Chat streaming via Server-Sent Events
- Document export endpoint with Archon integration
- Project listing for export modal

**API Endpoints**:
- `GET /api/health`: Service health and connectivity status
- `POST /api/chat`: Streaming chat completion with SSE
- `POST /api/export`: Document export to Archon
- `GET /api/projects`: Available projects for export
- `GET /`: Serve static web interface

### LLM Adapters (llm/)

#### `generic.js`
- Base adapter class with planning constraint validation
- System prompt enhancement with planning-only constraints
- Response validation to detect implementation attempts
- Error handling and constraint enforcement

**Core Methods**:
- `validatePlanningConstraints()`: Detects and warns about implementation
- `getEnhancedSystemPrompt()`: Adds planning constraints to system prompt
- `handleError()`: Standardized error handling across adapters

#### `openai.js` & `anthropic.js`
- Provider-specific streaming implementations
- Message formatting for each LLM API
- Streaming completion with planning validation
- Model configuration and parameter management

**Streaming Flow**:
1. Format messages for provider API
2. Create streaming completion request
3. Process chunks and validate planning constraints
4. Return formatted responses with constraint warnings

### Archon Integration (archon/)

#### `bridge.js`
- MCP client with REST API fallback
- Document formatting for Archon knowledge graph
- Project whitelist validation for security
- Export metadata and tagging system

**Export Process**:
1. Validate project whitelist (if configured)
2. Format document with planning metadata
3. Attempt MCP export (preferred method)
4. Fallback to REST API if MCP fails
5. Return source ID and export confirmation

**Document Structure**:
- Title and content from conversation
- Planning-specific metadata and tags
- Section extraction and word count
- Export timestamp and source attribution

### System Prompts (prompts/)

#### `planner_system.md`
- Comprehensive planning-only persona definition
- Strict implementation prevention constraints
- Planning capability definitions and examples
- Context engineering for strategic thinking

**Key Constraints**:
- **NO IMPLEMENTATION EVER**: Never write code or create files
- **PLANNING FOCUS**: Strategic thinking and requirement analysis only
- **RESEARCH SYNTHESIS**: Knowledge organization and gap identification
- **EXPORT READINESS**: Generate structured planning documents

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DEFAULT_LLM_PROVIDER` | `openai` | LLM provider: `openai` or `anthropic` |
| `DEFAULT_MODEL` | `gpt-4` | Model name for the selected provider |
| `OPENAI_API_KEY` | - | OpenAI API key (required for OpenAI) |
| `ANTHROPIC_API_KEY` | - | Anthropic API key (required for Anthropic) |
| `ARCHON_BASE_URL` | `http://localhost:8181` | Archon REST API base URL |
| `ARCHON_MCP_URL` | `http://localhost:8051` | Archon MCP Gateway URL |
| `ARCHON_PROJECT_WHITELIST` | - | Comma-separated project IDs (optional) |
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment mode |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | CORS allowed origins |

### LLM Model Configuration

**OpenAI Models**:
- `gpt-4`: Best for complex planning and strategic thinking
- `gpt-4-turbo`: Faster responses with similar quality
- `gpt-3.5-turbo`: Cost-effective for simpler planning tasks

**Anthropic Models**:
- `claude-3-sonnet-20240229`: Excellent for detailed planning analysis
- `claude-3-haiku-20240307`: Fast responses for quick planning questions

### Archon Integration

**MCP Protocol** (Preferred):
- Primary export method via Archon MCP Gateway
- Full metadata support and proper tagging
- Real-time knowledge graph integration

**REST API** (Fallback):
- Secondary export method via direct REST calls
- Basic document creation without advanced features
- Used when MCP is unavailable

## 🔒 Security & Constraints

### Planning-Only Enforcement

The system implements multiple layers of planning-only constraints:

1. **System Prompt Level**: Core persona definition prevents implementation
2. **Response Validation**: Post-processing detects implementation attempts
3. **UI Messaging**: Clear planning-only focus in interface
4. **Export Metadata**: Documents tagged as planning artifacts

### Access Control

- **Project Whitelist**: Optional restriction of available projects
- **CORS Configuration**: Controlled origin access for web interface
- **API Key Management**: Secure LLM provider authentication
- **Environment Isolation**: Development/production configuration separation

### Data Privacy

- **No Persistent Storage**: Conversations exist only in memory during session
- **Secure Export**: Documents encrypted during Archon transmission
- **API Key Protection**: Environment-based credential management
- **Session Isolation**: Each conversation is independent

## 🧪 Development Workflow

### Local Development

1. **Start Dependencies**:
   ```bash
   # Start Archon (if needed)
   # Ensure MCP gateway is running on :8051
   ```

2. **Configure Environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and URLs
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   # Server starts on http://localhost:3000
   ```

4. **Test Planning Workflow**:
   - Open browser to `http://localhost:3000`
   - Start planning conversation
   - Verify planning-only constraints
   - Test document export to Archon

### Testing Checklist

- [ ] **Server Health**: `/api/health` returns service status
- [ ] **LLM Connectivity**: Chat streaming works with configured provider
- [ ] **Planning Constraints**: Implementation attempts are blocked
- [ ] **Archon Integration**: Document export succeeds
- [ ] **Responsive UI**: Interface works on mobile and desktop
- [ ] **Speech Features**: STT/TTS toggles work (if supported)

### Production Deployment

1. **Environment Configuration**:
   ```bash
   NODE_ENV=production
   PORT=3000
   ALLOWED_ORIGINS=https://yourdomain.com
   ```

2. **Security Hardening**:
   - Use HTTPS for all external connections
   - Implement rate limiting for API endpoints
   - Configure proper CORS origins
   - Use environment-based API key management

3. **Monitoring**:
   - Health check endpoint for load balancer
   - Error logging and alerting
   - Performance monitoring for streaming
   - Archon connectivity validation

## 📊 Usage Patterns

### Strategic Planning

**Typical Workflow**:
1. User describes project or initiative
2. Planner guides requirement analysis
3. Breaking down into phases and deliverables
4. Identifying knowledge gaps and dependencies
5. Exporting structured planning document

**Example Conversation**:
```
User: "I want to build an AI agent for customer support"

Planner: "Let's break this down systematically. First, let's clarify the scope:
- What specific customer support functions should the agent handle?
- What's your existing support infrastructure?
- What are your success criteria?

Based on your answers, I'll help you plan the phases, identify requirements, and structure the implementation approach."
```

### Research Synthesis

**Typical Workflow**:
1. User provides research domain or questions
2. Planner organizes information systematically
3. Identifying knowledge sources and gaps
4. Structuring research methodology
5. Exporting research plan document

### Agent Development Planning

**Typical Workflow**:
1. User describes desired agent capabilities
2. Planner maps agent architecture and workflows
3. Planning integration points and dependencies
4. Defining testing and validation approaches
5. Exporting agent development plan

## 🤝 Integration Points

### Archon Knowledge Graph

**Document Export Format**:
```json
{
  "project_id": "proj-123",
  "title": "Customer Support Agent Planning",
  "document_type": "plan",
  "content": {
    "summary": "Strategic planning for AI customer support agent",
    "full_content": "# Planning Session Export\n\n...",
    "planning_type": "strategic",
    "created_via": "planner-chat",
    "sections": [
      {"level": 1, "title": "Project Overview"},
      {"level": 2, "title": "Requirements Analysis"}
    ]
  },
  "tags": ["scope:meta", "type:plan", "source:planner-chat"],
  "author": "CE-Hub Planner Chat"
}
```

### CE-Hub Ecosystem

**Role in Four-Layer Architecture**:
1. **Archon Layer**: Export planning documents to knowledge graph
2. **CE-Hub Layer**: Local development and artifact creation
3. **Sub-agent Layer**: Planning for agent coordination workflows
4. **Claude Code IDE**: Strategic planning for implementation projects

## 🔄 Future Enhancements

### Planned Features

- **Planning Templates**: Pre-built planning frameworks for common scenarios
- **Collaborative Planning**: Multi-user planning sessions with real-time sync
- **Visual Planning**: Diagrams and flowcharts within planning documents
- **Integration Plugins**: Direct connections to project management tools
- **Advanced Analytics**: Planning session analysis and improvement recommendations

### Technical Improvements

- **WebSocket Support**: Full bidirectional streaming for enhanced responsiveness
- **Offline Capability**: Service worker for offline planning sessions
- **Advanced Speech**: Improved STT/TTS with custom voice models
- **Multi-language**: International language support for global teams
- **Performance Optimization**: Caching and CDN integration for faster loading

## 📝 License & Contributing

This implementation is part of the CE-Hub Master Operating System for intelligent agent creation. See the main CE-Hub repository for contribution guidelines and licensing information.

For questions, issues, or contributions related to Planner Chat specifically, please follow the established CE-Hub workflow patterns and maintain the planning-only constraints that define this tool's core value proposition.

---

**Built with the CE-Hub Vision**: Context is the product. Every planning session contributes to the growing intelligence of the system through structured knowledge capture and reuse.