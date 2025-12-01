#!/usr/bin/env node
/**
 * Test script for API bridge functionality
 */

const http = require('http')

// Test function to fetch Edge-Dev projects
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

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const projects = JSON.parse(data)
            resolve(projects)
          } else {
            console.warn(`Edge-Dev API responded with status ${res.statusCode}`)
            resolve([])
          }
        } catch (error) {
          console.warn('Failed to parse Edge-Dev projects response:', error.message)
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

// Convert Edge-Dev project to planner-chat format
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

async function testAPIBridge() {
  console.log('🧪 Testing API Bridge Functionality')
  console.log('=' * 50)

  try {
    // Test Edge-Dev API connection
    console.log('📡 Fetching projects from Edge-Dev backend...')
    const edgeDevProjects = await fetchEdgeDevProjects()
    console.log(`✅ Found ${edgeDevProjects.length} projects from Edge-Dev`)

    if (edgeDevProjects.length > 0) {
      console.log('\n📋 Edge-Dev Projects:')
      edgeDevProjects.forEach((project, i) => {
        console.log(`  ${i + 1}. ${project.name} (ID: ${project.id}, Scanners: ${project.scanner_count})`)
      })

      // Test conversion
      console.log('\n🔄 Converting to planner-chat format...')
      const convertedProjects = edgeDevProjects.map(convertEdgeDevProject)

      console.log('✅ Converted Projects:')
      convertedProjects.forEach((project, i) => {
        console.log(`  ${i + 1}. ${project.title}`)
        console.log(`     - ID: ${project.id}`)
        console.log(`     - Slug: ${project.slug}`)
        console.log(`     - Source: ${project.source}`)
        console.log(`     - Scanner Count: ${project.scannerCount}`)
        console.log(`     - External: ${project.isExternal}`)
      })

      // Look for the specific project the user is missing
      const backsideProject = convertedProjects.find(p =>
        p.title.toLowerCase().includes('backside') &&
        p.title.toLowerCase().includes('para')
      )

      if (backsideProject) {
        console.log('\n🎯 Found missing "Backside Para B Copy" project!')
        console.log('📋 Project details:')
        console.log(JSON.stringify(backsideProject, null, 2))
      } else {
        console.log('\n⚠️ "Backside Para B Copy" project not found in Edge-Dev')
      }

    } else {
      console.log('❌ No projects found from Edge-Dev API')
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  }

  console.log('\n🧪 Test completed!')
}

// Run the test
testAPIBridge()