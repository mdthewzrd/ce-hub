// CE-Hub Planner Chat - Main Server
// Express server with streaming chat and document export endpoints

require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const multer = require('multer')

// Import LLM adapters
const OpenAIAdapter = require('../llm/openai')
const AnthropicAdapter = require('../llm/anthropic')
const OpenRouterAdapter = require('../llm/openrouter')
const ArchonBridge = require('../archon/bridge')

// Import project management services
const IndexManager = require('./services/IndexManager')
const ProjectManager = require('./services/ProjectManager')
const ChatManager = require('./services/ChatManager')

// Load configuration
const config = require('../planner.config.json')

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors({
  origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.static(path.join(__dirname, '../web')))

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    cb(null, uniqueSuffix + ext)
  }
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Comprehensive file type support - images, PDFs, documents, text files, code files, archives
    const allowedTypes = [
      // Images
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff', 'image/svg+xml',

      // Documents
      'application/pdf',
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-powerpoint', // .ppt
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'application/vnd.oasis.opendocument.text', // .odt
      'application/vnd.oasis.opendocument.spreadsheet', // .ods
      'application/vnd.oasis.opendocument.presentation', // .odp
      'application/rtf', // .rtf

      // Text files
      'text/plain', // .txt
      'text/markdown', // .md
      'text/csv', // .csv
      'text/tab-separated-values', // .tsv
      'application/json', // .json
      'application/xml', // .xml
      'text/xml', // .xml
      'text/html', // .html
      'text/css', // .css
      'text/javascript', // .js
      'application/javascript', // .js
      'application/typescript', // .ts
      'text/x-python', // .py
      'application/x-python-code', // .py
      'text/x-java-source', // .java
      'text/x-c', // .c
      'text/x-c++', // .cpp
      'text/x-csharp', // .cs
      'application/x-php', // .php
      'text/x-ruby', // .rb
      'text/x-go', // .go
      'text/x-rust', // .rs
      'application/x-yaml', // .yml, .yaml
      'text/yaml', // .yml, .yaml
      'application/toml', // .toml
      'text/x-ini', // .ini
      'text/x-log', // .log

      // Archives
      'application/zip', // .zip
      'application/x-rar-compressed', // .rar
      'application/x-7z-compressed', // .7z

      // Fallback for files with unknown MIME types (like .md files sometimes)
      'application/octet-stream'
    ]

    // Check file extension as fallback for octet-stream
    if (file.mimetype === 'application/octet-stream') {
      const allowedExtensions = [
        '.md', '.txt', '.csv', '.json', '.xml', '.html', '.css', '.js', '.ts',
        '.py', '.java', '.c', '.cpp', '.cs', '.php', '.rb', '.go', '.rs',
        '.yml', '.yaml', '.toml', '.ini', '.log', '.rtf', '.tsv'
      ]

      const fileExtension = require('path').extname(file.originalname).toLowerCase()
      if (allowedExtensions.includes(fileExtension)) {
        cb(null, true)
        return
      }
    }

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error(`File type '${file.mimetype}' is not supported. Please upload images, PDFs, documents, text files, code files, or archives.`))
    }
  }
})

// Initialize LLM adapters and Archon bridge
let llmAdapter
let archonBridge

// Initialize project management services
let indexManager
let projectManager
let chatManager

// Load system prompt
let systemPrompt = ''
try {
  systemPrompt = fs.readFileSync(path.join(__dirname, '../prompts/planner_system.md'), 'utf8')
} catch (error) {
  console.warn('Could not load system prompt:', error.message)
}

// Helper function to get adapter for specific model
function getAdapterForModel(modelId) {
  // Determine provider based on model ID
  let provider = 'openai'
  if (modelId.includes('claude')) {
    provider = 'anthropic'
  } else if (modelId.includes('/') || modelId.includes('llama') || modelId.includes('gemma') || modelId.includes('phi')) {
    provider = 'openrouter'
  }

  try {
    let adapter = null
    const systemPrompt = fs.readFileSync(path.join(__dirname, '../prompts/planner_system.md'), 'utf8')

    switch (provider) {
      case 'anthropic':
        if (process.env.ANTHROPIC_API_KEY) {
          adapter = new AnthropicAdapter(process.env.ANTHROPIC_API_KEY, {
            model: modelId,
            systemPrompt,
            maxTokens: 4000,
            temperature: 0.7
          })
        }
        break

      case 'openrouter':
        if (process.env.OPENROUTER_API_KEY) {
          adapter = new OpenRouterAdapter(process.env.OPENROUTER_API_KEY, {
            model: modelId,
            systemPrompt,
            maxTokens: 4000,
            temperature: 0.7
          })
        }
        break

      case 'openai':
      default:
        if (process.env.OPENAI_API_KEY) {
          adapter = new OpenAIAdapter(process.env.OPENAI_API_KEY, {
            model: modelId,
            systemPrompt,
            maxTokens: 4000,
            temperature: 0.7
          })
        }
        break
    }

    return { provider, adapter }
  } catch (error) {
    console.error(`Failed to create adapter for model ${modelId}:`, error.message)
    return { provider, adapter: null }
  }
}

// Initialize services
async function initializeServices() {
  // Initialize Archon bridge
  archonBridge = new ArchonBridge()

  // Test Archon connectivity
  const archonHealth = await archonBridge.validateConnection()
  console.log('Archon connectivity:', archonHealth)

  // Initialize project management services
  indexManager = new IndexManager(config)
  projectManager = new ProjectManager(config, indexManager)
  chatManager = new ChatManager(config, indexManager)

  // Rebuild index if configured
  if (config.indexRebuildOnStart) {
    console.log('🔄 Rebuilding index on startup...')
    await indexManager.rebuildIndex()
  }

  // Initialize LLM adapter based on configuration
  const provider = process.env.DEFAULT_LLM_PROVIDER || 'openai'
  const model = process.env.DEFAULT_MODEL || 'gpt-4'

  try {
    switch (provider) {
      case 'anthropic':
        if (!process.env.ANTHROPIC_API_KEY) {
          throw new Error('ANTHROPIC_API_KEY not configured')
        }
        llmAdapter = new AnthropicAdapter(process.env.ANTHROPIC_API_KEY, {
          model,
          systemPrompt,
          maxTokens: 4000,
          temperature: 0.7
        })
        break

      case 'openrouter':
        if (!process.env.OPENROUTER_API_KEY) {
          throw new Error('OPENROUTER_API_KEY not configured')
        }
        llmAdapter = new OpenRouterAdapter(process.env.OPENROUTER_API_KEY, {
          model,
          systemPrompt,
          maxTokens: 4000,
          temperature: 0.7
        })
        break

      case 'openai':
      default:
        if (!process.env.OPENAI_API_KEY) {
          throw new Error('OPENAI_API_KEY not configured')
        }
        llmAdapter = new OpenAIAdapter(process.env.OPENAI_API_KEY, {
          model,
          systemPrompt,
          maxTokens: 4000,
          temperature: 0.7
        })
        break
    }
    console.log(`Initialized ${provider} adapter with model ${model}`)
  } catch (error) {
    console.error(`Failed to initialize ${provider} adapter:`, error.message)
    process.exit(1)
  }
}

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const archonHealth = await archonBridge.validateConnection()

  res.json({
    status: 'healthy',
    services: {
      llm: !!llmAdapter,
      archon: archonHealth.overall
    },
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  })
})

// Get available models endpoint
app.get('/api/models', async (req, res) => {
  try {
    const models = []

    // OpenAI models
    if (process.env.OPENAI_API_KEY) {
      models.push(
        { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', free: false },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI', free: false },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', free: false }
      )
    }

    // Anthropic models
    if (process.env.ANTHROPIC_API_KEY) {
      models.push(
        { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', provider: 'Anthropic', free: false },
        { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: 'Anthropic', free: false }
      )
    }

    // OpenRouter models
    if (process.env.OPENROUTER_API_KEY) {
      models.push(...OpenRouterAdapter.getAvailableModels())
    }

    res.json({ models })
  } catch (error) {
    console.error('Models endpoint error:', error)
    res.status(500).json({ error: 'Failed to fetch models' })
  }
})

// Chat streaming endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, options = {} } = req.body

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' })
    }

    // Use custom model/provider if specified in options
    let currentAdapter = llmAdapter
    if (options.model && options.model !== process.env.DEFAULT_MODEL) {
      const { provider: modelProvider, adapter } = getAdapterForModel(options.model)
      if (adapter) {
        currentAdapter = adapter
      }
    }

    // Set up Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    })

    // Send initial connection confirmation
    res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)

    // Stream response from LLM
    await currentAdapter.streamCompletion(
      messages,
      // onChunk
      (chunk) => {
        res.write(`data: ${JSON.stringify({
          type: 'chunk',
          content: chunk.content,
          partial: chunk.partial
        })}\n\n`)
      },
      // onComplete
      (response) => {
        res.write(`data: ${JSON.stringify({
          type: 'complete',
          content: response.content
        })}\n\n`)
        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
        res.end()
      },
      // onError
      (error) => {
        res.write(`data: ${JSON.stringify({
          type: 'error',
          error: error.content || error.message
        })}\n\n`)
        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
        res.end()
      }
    )

  } catch (error) {
    console.error('Chat endpoint error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Document export endpoint
app.post('/api/export', async (req, res) => {
  try {
    const {
      title,
      content,
      projectId,
      tags = [],
      planningType = 'strategic',
      chatId  // Optional: if exporting from a specific chat
    } = req.body

    if (!title || !content || !projectId) {
      return res.status(400).json({
        error: 'Title, content, and projectId are required'
      })
    }

    // Export to Archon
    const result = await archonBridge.exportDocument({
      title,
      content,
      projectId,
      tags,
      planningType
    })

    // If this export is from a specific chat, mark it as exported
    if (chatId && chatManager) {
      try {
        await chatManager.markAsExported(chatId, result.source_id, result.document_id)
        console.log(`✅ Marked chat ${chatId} as exported`)
      } catch (error) {
        console.warn(`Failed to mark chat ${chatId} as exported:`, error.message)
      }
    }

    res.json({
      success: true,
      source_id: result.source_id,
      document_id: result.document_id,
      method: result.method,
      message: result.message,
      export_url: `${archonBridge.baseUrl}/projects/${projectId}/documents/${result.document_id}`
    })

  } catch (error) {
    console.error('Export endpoint error:', error)
    res.status(500).json({
      error: 'Failed to export document',
      details: error.message
    })
  }
})

// File upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' })
    }

    const fileUrl = `/uploads/${req.file.filename}`
    const fileInfo = {
      id: req.file.filename,
      name: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype,
      url: fileUrl,
      path: req.file.path,
      uploaded: true
    }

    console.log('File uploaded successfully:', fileInfo)

    res.json({
      success: true,
      file: fileInfo,
      url: fileUrl,
      message: 'File uploaded successfully'
    })

  } catch (error) {
    console.error('File upload error:', error)
    res.status(500).json({ error: 'File upload failed' })
  }
})

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// Get available projects for export (Archon)
app.get('/api/archon/projects', async (req, res) => {
  try {
    const projects = await archonBridge.getAvailableProjects()
    res.json(projects)
  } catch (error) {
    console.error('Archon projects endpoint error:', error)
    res.status(500).json({ error: 'Failed to fetch Archon projects' })
  }
})

// ============================================
// PROJECT MANAGEMENT API ROUTES
// ============================================

// Get project tree (projects + folders + chats)
app.get('/api/projects/tree', async (req, res) => {
  try {
    const tree = await projectManager.getProjectTree()
    res.json(tree)
  } catch (error) {
    console.error('Project tree endpoint error:', error)
    res.status(500).json({ error: 'Failed to fetch project tree' })
  }
})

// Create new project
app.post('/api/projects', async (req, res) => {
  try {
    const { title, slug, description } = req.body

    if (!title) {
      return res.status(400).json({ error: 'Project title is required' })
    }

    const project = await projectManager.createProject({ title, slug, description })
    res.status(201).json({ success: true, project })
  } catch (error) {
    console.error('Create project error:', error)
    res.status(400).json({ error: error.message })
  }
})

// Update project
app.patch('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    const project = await projectManager.updateProject(id, updates)
    res.json({ success: true, project })
  } catch (error) {
    console.error('Update project error:', error)
    res.status(400).json({ error: error.message })
  }
})

// Delete project
app.delete('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await projectManager.deleteProject(id)
    res.json(result)
  } catch (error) {
    console.error('Delete project error:', error)
    res.status(400).json({ error: error.message })
  }
})

// Create folder in project
app.post('/api/folders', async (req, res) => {
  try {
    const { projectId, parentPath, name } = req.body

    if (!projectId || !name) {
      return res.status(400).json({ error: 'Project ID and folder name are required' })
    }

    const folder = await projectManager.createFolder(projectId, { name, parentPath })
    res.status(201).json({ success: true, folder })
  } catch (error) {
    console.error('Create folder error:', error)
    res.status(400).json({ error: error.message })
  }
})

// Delete folder
app.delete('/api/folders', async (req, res) => {
  try {
    const { projectId, folderPath } = req.query

    if (!projectId || !folderPath) {
      return res.status(400).json({ error: 'Project ID and folder path are required' })
    }

    const result = await projectManager.deleteFolder(projectId, folderPath)
    res.json(result)
  } catch (error) {
    console.error('Delete folder error:', error)
    res.status(400).json({ error: error.message })
  }
})

// ============================================
// CHAT MANAGEMENT API ROUTES
// ============================================

// Create new chat
app.post('/api/chats', async (req, res) => {
  try {
    const { title, projectId, folderPath, content } = req.body

    if (!title || !projectId) {
      return res.status(400).json({ error: 'Chat title and project ID are required' })
    }

    const chat = await chatManager.createChat({ title, projectId, folderPath, content })
    res.status(201).json({ success: true, chat })
  } catch (error) {
    console.error('Create chat error:', error)
    res.status(400).json({ error: error.message })
  }
})

// Get chats with filters
app.get('/api/chats', async (req, res) => {
  try {
    const { projectId, folderPath, exported } = req.query
    const filters = {}

    if (projectId) filters.projectId = projectId
    if (folderPath) filters.folderPath = folderPath
    if (exported !== undefined) filters.exported = exported === 'true'

    const chats = await chatManager.listChats(filters)
    res.json({ success: true, chats })
  } catch (error) {
    console.error('List chats error:', error)
    res.status(500).json({ error: 'Failed to fetch chats' })
  }
})

// Get chat content
app.get('/api/chats/:id/content', async (req, res) => {
  try {
    const { id } = req.params
    const chatContent = await chatManager.getChatContent(id)
    res.json({ success: true, chat: chatContent })
  } catch (error) {
    console.error('Get chat content error:', error)
    res.status(404).json({ error: error.message })
  }
})

// Save chat content
app.post('/api/chats/:id/content', async (req, res) => {
  try {
    const { id } = req.params
    const { content } = req.body

    if (!content) {
      return res.status(400).json({ error: 'Chat content is required' })
    }

    const chat = await chatManager.saveChatContent(id, content)
    res.json({ success: true, chat })
  } catch (error) {
    console.error('Save chat content error:', error)
    res.status(400).json({ error: error.message })
  }
})

// Update chat (move, rename)
app.patch('/api/chats/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    const chat = await chatManager.updateChat(id, updates)
    res.json({ success: true, chat })
  } catch (error) {
    console.error('Update chat error:', error)
    res.status(400).json({ error: error.message })
  }
})

// Delete chat
app.delete('/api/chats/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await chatManager.deleteChat(id)
    res.json(result)
  } catch (error) {
    console.error('Delete chat error:', error)
    res.status(400).json({ error: error.message })
  }
})

// ============================================
// SYSTEM MANAGEMENT API ROUTES
// ============================================

// Rebuild index
app.post('/api/system/rebuild-index', async (req, res) => {
  try {
    const index = await indexManager.rebuildIndex()
    res.json({ success: true, index, message: 'Index rebuilt successfully' })
  } catch (error) {
    console.error('Rebuild index error:', error)
    res.status(500).json({ error: 'Failed to rebuild index' })
  }
})

// Audit metadata
app.get('/api/system/audit', async (req, res) => {
  try {
    const index = await indexManager.loadIndex()
    // TODO: Implement audit logic
    res.json({
      success: true,
      stats: index.stats,
      message: 'System audit completed'
    })
  } catch (error) {
    console.error('System audit error:', error)
    res.status(500).json({ error: 'Failed to audit system' })
  }
})

// Serve web app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../web/index.html'))
})

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error)
  res.status(500).json({ error: 'Internal server error' })
})

// Start server
async function startServer() {
  try {
    await initializeServices()

    app.listen(PORT, () => {
      console.log(`🚀 CE-Hub Planner Chat running on http://localhost:${PORT}`)
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`)
      console.log(`💬 Chat API: http://localhost:${PORT}/api/chat`)
      console.log(`📤 Export API: http://localhost:${PORT}/api/export`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully')
  process.exit(0)
})

// Start the server
startServer()