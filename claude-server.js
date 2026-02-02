const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.argv[2] || 8107; // Server for Claude API (default 8107)

// Middleware
app.use(cors());
app.use(express.json());

// Claude API configuration
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
const ANTHROPIC_BASE_URL = process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com';
const GLM_API_KEY = process.env.GLM_API_KEY;

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', server: 'claude-api-server', port: PORT });
});

// Claude chat endpoint
app.post('/claude', async (req, res) => {
    try {
        const { question, model = 'claude-3-sonnet-20240229', provider = 'claude' } = req.body;

        if (!question) {
            return res.status(400).json({
                error: true,
                message: 'No question provided'
            });
        }

        console.log(`🤖 Claude request: ${question.substring(0, 50)}...`);
        console.log(`📍 Model: ${model}, Provider: ${provider}`);

        let response;

        if (provider === 'glm') {
            // GLM API call
            const glmRequest = {
                model: 'glm-4-flash', // Try GLM-4-flash model
                messages: [
                    {
                        role: 'user',
                        content: question
                    }
                ],
                max_tokens: 4000
            };

            response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GLM_API_KEY}`
                },
                body: JSON.stringify(glmRequest)
            });

        } else {
            // Claude API call
            const claudeRequest = {
                model: model === 'sonnet-4' ? 'claude-3-5-sonnet-20241022' :
                       model === 'sonnet-4.5' ? 'claude-3-5-sonnet-20241022' :
                       model === 'haiku' ? 'claude-3-5-haiku-20241022' :
                       model === 'opus' ? 'claude-3-opus-20240229' :
                       'claude-3-sonnet-20240229',
                max_tokens: 4000,
                messages: [
                    {
                        role: 'user',
                        content: question
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
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ ${provider} API error: ${response.status} - ${errorText}`);
            return res.status(response.status).json({
                error: true,
                message: `${provider} API error: ${response.status}`,
                output: errorText
            });
        }

        const data = await response.json();
        let apiResponse;

        if (provider === 'glm') {
            apiResponse = data.choices[0].message.content;
        } else {
            apiResponse = data.content[0].text;
        }

        console.log(`✅ ${provider} response: ${apiResponse.substring(0, 100)}...`);

        res.json({
            error: false,
            output: apiResponse,
            model: model,
            provider: provider,
            usage: data.usage || null
        });

    } catch (error) {
        console.error('❌ Server error:', error.message);
        res.status(500).json({
            error: true,
            message: 'Server error',
            output: error.message
        });
    }
});

// Real file system endpoints for CE-Hub
app.get('/files', async (req, res) => {
    const path = req.query.path || '';

    try {
        const fs = require('fs').promises;
        const pathModule = require('path');
        const CE_HUB_ROOT = __dirname;

        const fullPath = path ? pathModule.join(CE_HUB_ROOT, path) : CE_HUB_ROOT;
        const items = await fs.readdir(fullPath, { withFileTypes: true });

        const files = [];

        // Add parent directory link if not at root
        if (path && path !== '') {
            files.push({
                name: '..',
                type: 'folder',
                path: pathModule.dirname(path),
                isParent: true,
                size: ''
            });
        }

        for (const item of items) {
            if (item.name.startsWith('.')) continue; // Skip hidden files

            const itemPath = pathModule.join(fullPath, item.name);
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
            parent_path: path === '' ? null : pathModule.dirname(path),
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
app.post('/read-file', (req, res) => {
    const { path: filePath } = req.body;

    if (!filePath) {
        return res.status(400).json({
            error: true,
            message: 'No file path provided'
        });
    }

    // Mock file content
    const mockFileContent = {
        '/mobile-truly-optimized.html': `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CE-Hub Pro Mobile</title>
</head>
<body>
    <div class="terminal">
        <div>CE-Hub Pro - Mobile Optimized</div>
        <div>🚀 Ready for AI assistance</div>
    </div>
</body>
</html>`,
        '/README.md': `# CE-Hub Pro

Context Engineering Hub - Mobile Optimized

## Features
- 🚀 Claude AI Integration
- 📱 Mobile-Ready Interface
- 💻 Terminal
- 🔍 File Explorer

## Getting Started
1. Open on mobile device
2. Start chatting with Claude!
`,
        '/server.js': `// CE-Hub Claude API Server
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Claude endpoint
app.post('/claude', async (req, res) => {
    // Connect to Claude API
    res.json({ output: "Connected to Claude!" });
});

app.listen(8108, () => {
    console.log('🚀 CE-Hub API server running on port 8108');
});`
    };

    const content = mockFileContent[filePath] || `// File content for ${filePath}\n// This is mock content`;
    const lines = content.split('\n');

    res.json({
        error: false,
        content: content,
        file_info: {
            name: filePath.split('/').pop(),
            lines: lines.length,
            size: `${content.length}B`
        }
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 CE-Hub Claude API Server running on port ${PORT}`);
    console.log(`📱 Mobile access: http://100.95.223.19:${PORT}`);
    console.log(`💻 Local access: http://localhost:${PORT}`);
    console.log(`🔑 API Key configured: ${!!ANTHROPIC_API_KEY}`);

    if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY.includes('YOUR_KEY_HERE')) {
        console.log(`⚠️  WARNING: No valid Anthropic API key found in .env file`);
        console.log(`   Please add your API key to get real Claude responses`);
    }
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\\n🛑 Shutting down Claude API server...');
    process.exit(0);
});

module.exports = app;