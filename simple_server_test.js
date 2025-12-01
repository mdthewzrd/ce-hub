#!/usr/bin/env node
/**
 * Simple test server to validate API bridge integration
 */

const express = require('express')
const cors = require('cors')
const http = require('http')

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

// Test API bridge functions
function fetchEdgeDevProjects() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 8000,
      path: '/api/projects',
      method: 'GET',
      timeout: 5000
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            resolve(JSON.parse(data))
          } else {
            console.warn(`Edge-Dev API responded with status ${res.statusCode}`)
            resolve([])
          }
        } catch (error) {
          console.warn('Failed to parse Edge-Dev projects:', error.message)
          resolve([])
        }
      })
    })

    req.on('error', (error) => {
      console.warn('Edge-Dev API connection failed:', error.message)
      resolve([])
    })

    req.on('timeout', () => {
      console.warn('Edge-Dev API request timed out')
      req.destroy()
      resolve([])
    })

    req.end()
  })
}

function convertEdgeDevProject(edgeProject) {
  return {
    id: edgeProject.id,
    slug: edgeProject.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').trim(),
    title: edgeProject.name,
    description: edgeProject.description || '',
    path: `external/edge-dev/${edgeProject.id}`,
    isDefault: false,
    isExternal: true,
    source: 'edge-dev',
    scannerCount: edgeProject.scanner_count || 0,
    aggregationMethod: edgeProject.aggregation_method || 'union',
    tags: edgeProject.tags || [],
    createdAt: edgeProject.created_at,
    updatedAt: edgeProject.updated_at,
    lastExecuted: edgeProject.last_executed,
    executionCount: edgeProject.execution_count || 0,
    folders: [],
    chats: []
  }
}

// Mock local projects (from index.json)
const mockLocalProjects = [
  {
    "id": "personal-scratch-001",
    "slug": "personal-scratch",
    "title": "Personal Scratch",
    "path": "projects/personal-scratch",
    "isDefault": true,
    "folders": [],
    "chats": []
  },
  {
    "id": "c2699fc02c9c",
    "slug": "testing-workflows",
    "title": "Testing Workflows",
    "path": "projects/testing-workflows",
    "isDefault": false,
    "folders": [],
    "chats": []
  },
  {
    "id": "7366cbdc16f8",
    "slug": "trading-journal",
    "title": "Trading Journal",
    "path": "projects/trading-journal",
    "isDefault": false,
    "folders": [],
    "chats": []
  }
]

// Enhanced project tree endpoint
app.get('/api/projects/tree', async (req, res) => {
  try {
    console.log('📡 Fetching project tree with Edge-Dev integration...')

    // Get local projects
    const localProjects = mockLocalProjects

    // Fetch Edge-Dev projects
    const edgeDevProjects = await fetchEdgeDevProjects()
    const convertedEdgeProjects = edgeDevProjects.map(convertEdgeDevProject)

    // Merge projects
    const allProjects = [...localProjects, ...convertedEdgeProjects]

    // Calculate stats
    const stats = {
      totalProjects: allProjects.length,
      totalLocalProjects: localProjects.length,
      totalEdgeDevProjects: convertedEdgeProjects.length,
      totalScannerProjects: convertedEdgeProjects.filter(p => p.scannerCount > 0).length,
      totalFolders: 0,
      totalChats: 0,
      exportedChats: 0
    }

    console.log(`📊 Project Tree: ${localProjects.length} local + ${convertedEdgeProjects.length} edge-dev = ${allProjects.length} total`)

    const response = {
      projects: allProjects,
      stats: stats,
      lastUpdated: new Date().toISOString(),
      sources: {
        local: "2025-10-13T02:19:58.274Z",
        edgeDev: new Date().toISOString()
      }
    }

    res.json(response)

  } catch (error) {
    console.error('Project tree error:', error)
    res.status(500).json({ error: 'Failed to fetch project tree' })
  }
})

// Basic info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    server: 'CE-Hub API Bridge Test Server',
    status: 'running',
    port: PORT,
    edgeDevIntegration: true
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Test Server running on http://localhost:${PORT}`)
  console.log(`📊 Test project tree: http://localhost:${PORT}/api/projects/tree`)
  console.log('🔗 Edge-Dev integration enabled')
})