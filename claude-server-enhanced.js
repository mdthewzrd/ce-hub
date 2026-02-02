const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.argv[2] || 8107; // Server for Claude API (default 8107)

// Middleware
app.use(cors());
app.use(express.json());

// CE-Hub ecosystem paths
const CE_HUB_ROOT = __dirname;
const CORE_AGENTS_PATH = path.join(CE_HUB_ROOT, 'core/agents');
const CORE_SCRIPTS_PATH = path.join(CE_HUB_ROOT, 'core/scripts');
const PROJECTS_PATH = path.join(CE_HUB_ROOT, 'projects');

// Claude API configuration
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
const ANTHROPIC_BASE_URL = process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com';
const GLM_API_KEY = process.env.GLM_API_KEY;

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        server: 'ce-hub-claude-api',
        port: PORT,
        features: ['claude-api', 'glm-api', 'archon-integration', 'agents', 'projects', 'knowledge-base']
    });
});

// Get CE-Hub agents
app.get('/agents', async (req, res) => {
    try {
        const agents = [];
        try {
            const agentFiles = await fs.readdir(CORE_AGENTS_PATH);
            for (const file of agentFiles) {
                if (file.endsWith('.md')) {
                    const content = await fs.readFile(path.join(CORE_AGENTS_PATH, file), 'utf-8');
                    const name = file.replace('.md', '');
                    const lines = content.split('\n');
                    const title = lines.find(line => line.startsWith('# ')) || `Agent: ${name}`;
                    agents.push({
                        id: name,
                        name: title.replace('# ', ''),
                        file: file,
                        description: lines.slice(1, 3).join(' ').trim()
                    });
                }
            }
        } catch (err) {
            console.log('Could not read agents directory:', err.message);
        }
        res.json({ error: false, agents: agents });
    } catch (error) {
        res.status(500).json({ error: true, message: error.message });
    }
});

// Get CE-Hub projects
app.get('/projects', async (req, res) => {
    try {
        const projects = [];
        try {
            const projectFiles = await fs.readdir(PROJECTS_PATH);
            for (const file of projectFiles) {
                const stat = await fs.stat(path.join(PROJECTS_PATH, file));
                if (stat.isDirectory()) {
                    projects.push({
                        id: file,
                        name: file,
                        path: `projects/${file}`,
                        type: 'folder'
                    });
                }
            }
        } catch (err) {
            console.log('Could not read projects directory:', err.message);
        }
        res.json({ error: false, projects: projects });
    } catch (error) {
        res.status(500).json({ error: true, message: error.message });
    }
});

// Archon knowledge base search
app.post('/archon/search', async (req, res) => {
    try {
        const { query, match_count = 5 } = req.body;
        if (!query) {
            return res.status(400).json({ error: true, message: 'No query provided' });
        }

        // Call Archon MCP endpoint for RAG search
        const archonResponse = await fetch('http://localhost:8051/rag/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: query,
                match_count: match_count
            })
        });

        if (archonResponse.ok) {
            const data = await archonResponse.json();
            res.json({ error: false, results: data });
        } else {
            // Fallback to local search if Archon not available
            const mockResults = {
                results: [{
                    content: `Knowledge base search for "${query}" - Archon integration pending`,
                    source: 'local-search',
                    score: 0.8
                }],
                query: query,
                total: 1
            };
            res.json({ error: false, results: mockResults });
        }
    } catch (error) {
        res.json({
            error: false,
            results: {
                results: [{
                    content: `Search functionality for "${req.body.query}" - CE-Hub integration`,
                    source: 'fallback-search',
                    score: 0.5
                }],
                query: req.body.query,
                total: 1
            }
        });
    }
});

// Enhanced Claude chat endpoint with CE-Hub integration
app.post('/claude', async (req, res) => {
    try {
        const {
            question,
            model = 'claude-3-sonnet-20240229',
            provider = 'claude',
            use_archon = true,
            context = {}
        } = req.body;

        if (!question) {
            return res.status(400).json({
                error: true,
                message: 'No question provided'
            });
        }

        console.log(`🤖 CE-Hub Claude request: ${question.substring(0, 50)}...`);
        console.log(`📍 Model: ${model}, Provider: ${provider}, Archon: ${use_archon}`);

        // Build enhanced system prompt with CE-Hub context
        let systemPrompt = `You are Claude AI, integrated with the CE-Hub ecosystem.

CE-HUB CONTEXT:
- You have access to the user's CE-Hub knowledge base, agents, and projects
- You can help with Context Engineering, AI agent orchestration, and project management
- The user has Archon MCP integration for advanced knowledge retrieval
- Available agents and scripts are in the core/ directory
- Projects are managed in the projects/ directory

When responding, consider the full CE-Hub ecosystem capabilities and integrate with the user's existing workflows.`;

        let enhancedQuestion = question;

        // Add Archon knowledge search if enabled
        if (use_archon && !question.toLowerCase().includes('search knowledge')) {
            try {
                const archonResponse = await fetch('http://localhost:8051/rag/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        query: question,
                        match_count: 3
                    })
                });

                if (archonResponse.ok) {
                    const archonData = await archonResponse.json();
                    if (archonData.results && archonData.results.length > 0) {
                        const contextStr = archonData.results.map(r => r.content).join('\n\n');
                        enhancedQuestion = `CE-Hub Knowledge Context:\n${contextStr}\n\nUser Question: ${question}`;
                    }
                }
            } catch (err) {
                console.log('Archon search failed, using regular query');
            }
        }

        let response;

        if (provider === 'claude') {
            // Claude API call
            const claudeRequest = {
                model: model === 'sonnet-4' ? 'claude-3-5-sonnet-20241022' :
                       model === 'sonnet-4.5' ? 'claude-3-5-sonnet-20241022' :
                       model === 'haiku' ? 'claude-3-5-haiku-20241022' :
                       model === 'opus' ? 'claude-3-opus-20240229' :
                       'claude-3-sonnet-20240229',
                max_tokens: 4000,
                system: systemPrompt,
                messages: [
                    {
                        role: 'user',
                        content: enhancedQuestion
                    }
                ]
            };

            response = await fetch(`${ANTHROPIC_BASE_URL}/v1/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': ANTHROPIC_API_KEY,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify(claudeRequest)
            });

        } else if (provider === 'glm') {
            // GLM API call
            response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GLM_API_KEY}`
                },
                body: JSON.stringify({
                    model: model === 'glm-4-plus' ? 'glm-4-plus' :
                           model === 'glm-4.5' ? 'glm-4.5' :
                           model === 'glm-4.5-air' ? 'glm-4.5-air' :
                           model === 'glm-4.6' ? 'glm-4.6' :
                           'glm-4',
                    messages: [
                        {
                            role: 'system',
                            content: systemPrompt
                        },
                        {
                            role: 'user',
                            content: enhancedQuestion
                        }
                    ],
                    max_tokens: 4000
                })
            });
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ API error: ${response.status} - ${errorText}`);
            return res.status(response.status).json({
                error: true,
                message: `${provider} API error: ${response.status}`,
                output: errorText
            });
        }

        const data = await response.json();
        let claudeResponse;

        if (provider === 'claude') {
            claudeResponse = data.content[0].text;
        } else if (provider === 'glm') {
            claudeResponse = data.choices[0].message.content;
        }

        console.log(`✅ CE-Hub response: ${claudeResponse.substring(0, 100)}...`);

        res.json({
            error: false,
            output: claudeResponse,
            model: model,
            provider: provider,
            usage: data.usage || null,
            ce_hub_features: ['archon-search', 'agents-access', 'projects-integration']
        });

    } catch (error) {
        console.error('❌ CE-Hub server error:', error.message);
        res.status(500).json({
            error: true,
            message: 'CE-Hub server error',
            output: error.message
        });
    }
});

// Enhanced file system endpoints with CE-Hub integration
app.get('/files', async (req, res) => {
    const path = req.query.path || '';

    try {
        const fullPath = path ? path.join(CE_HUB_ROOT, path) : CE_HUB_ROOT;
        const items = await fs.readdir(fullPath, { withFileTypes: true });

        const files = [];

        for (const item of items) {
            if (item.name.startsWith('.') && item.name !== '.mcp.json') continue;

            const itemPath = path.join(fullPath, item.name);
            const stats = await fs.stat(itemPath);

            if (item.isDirectory()) {
                files.push({
                    name: item.name,
                    type: 'folder',
                    path: path ? `${path}/${item.name}` : item.name,
                    size: '-'
                });
            } else {
                files.push({
                    name: item.name,
                    type: 'file',
                    path: path ? `${path}/${item.name}` : item.name,
                    size: `${Math.round(stats.size / 1024)}KB`
                });
            }
        }

        res.json({
            error: false,
            current_path: path,
            parent_path: path === '' ? null : path.split('/').slice(0, -1).join('/'),
            files: files.sort((a, b) => {
                if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
                return a.name.localeCompare(b.name);
            })
        });
    } catch (error) {
        res.status(500).json({ error: true, message: error.message });
    }
});

// Read file endpoint
app.post('/read-file', async (req, res) => {
    const { path: filePath } = req.body;

    if (!filePath) {
        return res.status(400).json({
            error: true,
            message: 'No file path provided'
        });
    }

    try {
        const fullPath = path.join(CE_HUB_ROOT, filePath);
        const content = await fs.readFile(fullPath, 'utf-8');
        const lines = content.split('\n');

        res.json({
            error: false,
            content: content,
            file_info: {
                name: path.basename(filePath),
                lines: lines.length,
                size: `${content.length}B`
            }
        });
    } catch (error) {
        res.status(500).json({ error: true, message: error.message });
    }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 CE-Hub Claude API Server running on port ${PORT}`);
    console.log(`📱 Mobile access: http://100.95.223.19:${PORT}`);
    console.log(`💻 Local access: http://localhost:${PORT}`);
    console.log(`🔑 API Keys configured: ${!!ANTHROPIC_API_KEY} (Claude), ${!!GLM_API_KEY} (GLM)`);
    console.log(`🧠 Archon Integration: http://localhost:8051`);
    console.log(`🤖 CE-Hub Features: Agents, Projects, Knowledge Base, MCP`);

    if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY.includes('YOUR_KEY_HERE')) {
        console.log(`⚠️  WARNING: No valid Anthropic API key found in .env file`);
    }

    if (!GLM_API_KEY || GLM_API_KEY.includes('YOUR_KEY_HERE')) {
        console.log(`⚠️  WARNING: No valid GLM API key found in .env file`);
    }
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down CE-Hub Claude API server...');
    process.exit(0);
});

module.exports = app;