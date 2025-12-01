#!/usr/bin/env node
/**
 * Test the ProjectManager API bridge for merging Edge-Dev and local projects
 */

// Simple mock for the required dependencies
const path = require('path')
const fs = require('fs').promises
const http = require('http')

// Simple IndexManager mock
class MockIndexManager {
  async loadIndex() {
    return {
      projects: [
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
        }
      ],
      stats: {
        totalProjects: 2,
        totalFolders: 0,
        totalChats: 0,
        exportedChats: 0
      },
      lastUpdated: "2025-10-13T02:19:58.274Z"
    }
  }
}

// Load the ProjectManager
const ProjectManager = require('./planner-chat/server/services/ProjectManager')

async function testAPIBridge() {
  console.log('🧪 Testing ProjectManager API Bridge Integration')
  console.log('=' * 60)

  try {
    // Create a ProjectManager instance
    const config = { projectsRoot: 'projects' }
    const indexManager = new MockIndexManager()
    const projectManager = new ProjectManager(config, indexManager)

    console.log('📡 Testing getProjectTree with API bridge...')
    const projectTree = await projectManager.getProjectTree()

    console.log(`✅ Successfully fetched merged project tree`)
    console.log(`📊 Total projects: ${projectTree.stats.totalProjects}`)
    console.log(`   - Local projects: ${projectTree.stats.totalLocalProjects}`)
    console.log(`   - Edge-Dev projects: ${projectTree.stats.totalEdgeDevProjects}`)
    console.log(`   - Scanner projects: ${projectTree.stats.totalScannerProjects}`)

    console.log('\n📋 All Projects:')
    projectTree.projects.forEach((project, i) => {
      const source = project.isExternal ? `[${project.source}]` : '[local]'
      const scanners = project.scannerCount ? ` (${project.scannerCount} scanners)` : ''
      console.log(`  ${i + 1}. ${source} ${project.title}${scanners}`)
    })

    // Look for the specific missing project
    const backsideProject = projectTree.projects.find(p =>
      p.title.toLowerCase().includes('backside') &&
      p.title.toLowerCase().includes('para') &&
      p.title.toLowerCase().includes('copy')
    )

    if (backsideProject) {
      console.log('\n🎯 Found missing "Backside Para B Copy" project in merged tree!')
      console.log('📋 Project details:')
      console.log(`   - ID: ${backsideProject.id}`)
      console.log(`   - Title: ${backsideProject.title}`)
      console.log(`   - Source: ${backsideProject.source}`)
      console.log(`   - Scanner Count: ${backsideProject.scannerCount}`)
      console.log(`   - External: ${backsideProject.isExternal}`)
    } else {
      console.log('\n❌ "Backside Para B Copy" project NOT found in merged tree')
    }

    console.log('\n✅ API Bridge test completed successfully!')
    return true

  } catch (error) {
    console.error('❌ API Bridge test failed:', error.message)
    return false
  }
}

// Run the test
testAPIBridge().then(success => {
  process.exit(success ? 0 : 1)
})