// CE-Hub Planner Chat - Project Manager
// Manages project CRUD operations and filesystem structure

const fs = require('fs').promises
const path = require('path')
const crypto = require('crypto')
const https = require('https')
const http = require('http')

class ProjectManager {
  constructor(config, indexManager) {
    this.config = config
    this.indexManager = indexManager
    this.projectsRoot = path.join(process.cwd(), config.projectsRoot)

    // Edge-Dev API configuration
    this.edgeDevAPI = {
      host: 'localhost',
      port: 8000,
      protocol: 'http:'
    }
  }

  // Fetch projects from Edge-Dev backend
  async fetchEdgeDevProjects() {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.edgeDevAPI.host,
        port: this.edgeDevAPI.port,
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
              resolve([]) // Return empty array instead of failing
            }
          } catch (error) {
            console.warn('Failed to parse Edge-Dev projects response:', error.message)
            resolve([]) // Return empty array instead of failing
          }
        })
      })

      req.on('error', (error) => {
        console.warn('Edge-Dev API connection failed:', error.message)
        resolve([]) // Return empty array instead of failing
      })

      req.on('timeout', () => {
        console.warn('Edge-Dev API request timed out')
        req.destroy()
        resolve([]) // Return empty array instead of failing
      })

      req.end()
    })
  }

  // Convert Edge-Dev project to planner-chat format
  convertEdgeDevProject(edgeProject) {
    return {
      id: edgeProject.id,
      slug: edgeProject.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').trim(),
      title: edgeProject.name,
      description: edgeProject.description || '',
      path: `external/edge-dev/${edgeProject.id}`,
      isDefault: false,
      isExternal: true, // Mark as external project
      source: 'edge-dev',
      scannerCount: edgeProject.scanner_count || 0,
      aggregationMethod: edgeProject.aggregation_method || 'union',
      tags: edgeProject.tags || [],
      createdAt: edgeProject.created_at,
      updatedAt: edgeProject.updated_at,
      lastExecuted: edgeProject.last_executed,
      executionCount: edgeProject.execution_count || 0,
      folders: [], // Edge-Dev projects don't have folders
      chats: [] // Edge-Dev projects don't have chats (they're scanner projects)
    }
  }

  // Create a new project
  async createProject(data) {
    const { title, slug, description } = data

    // Generate slug if not provided
    const projectSlug = slug || this.generateSlug(title)
    const projectId = this.generateId(projectSlug)
    const projectPath = path.join(this.projectsRoot, projectSlug)

    // Check if project already exists
    try {
      await fs.access(projectPath)
      throw new Error(`Project "${projectSlug}" already exists`)
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error
      }
    }

    // Create project structure
    await fs.mkdir(projectPath, { recursive: true })
    await fs.mkdir(path.join(projectPath, 'chats'), { recursive: true })
    await fs.mkdir(path.join(projectPath, 'summaries'), { recursive: true })
    await fs.mkdir(path.join(projectPath, 'folders'), { recursive: true })

    // Create project metadata
    const project = {
      id: projectId,
      slug: projectSlug,
      title: title,
      description: description || '',
      path: `projects/${projectSlug}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDefault: false
    }

    // Save project metadata
    const projectJsonPath = path.join(projectPath, '_project.json')
    await fs.writeFile(projectJsonPath, JSON.stringify(project, null, 2), 'utf8')

    // Update index
    const projectIndex = await this.indexManager.scanProject(projectPath, project)
    await this.indexManager.updateProject(projectIndex)

    console.log(`✅ Created project: ${title} (${projectSlug})`)
    return project
  }

  // Get all projects
  async getProjects() {
    const index = await this.indexManager.loadIndex()
    return index.projects
  }

  // Get project by ID
  async getProject(projectId) {
    const index = await this.indexManager.loadIndex()
    const project = index.projects.find(p => p.id === projectId)
    if (!project) {
      throw new Error(`Project ${projectId} not found`)
    }
    return project
  }

  // Update project metadata
  async updateProject(projectId, updates) {
    const project = await this.getProject(projectId)
    const projectPath = path.join(this.projectsRoot, project.slug)
    const projectJsonPath = path.join(projectPath, '_project.json')

    // Load current metadata
    const projectData = await fs.readFile(projectJsonPath, 'utf8')
    const currentProject = JSON.parse(projectData)

    // Apply updates
    const updatedProject = {
      ...currentProject,
      ...updates,
      updatedAt: new Date().toISOString()
    }

    // Save updated metadata
    await fs.writeFile(projectJsonPath, JSON.stringify(updatedProject, null, 2), 'utf8')

    // Update index
    const projectIndex = await this.indexManager.scanProject(projectPath, updatedProject)
    await this.indexManager.updateProject(projectIndex)

    console.log(`✅ Updated project: ${updatedProject.title}`)
    return updatedProject
  }

  // Delete project
  async deleteProject(projectId) {
    const project = await this.getProject(projectId)

    if (project.isDefault) {
      throw new Error('Cannot delete default project')
    }

    const projectPath = path.join(this.projectsRoot, project.slug)

    // Remove from filesystem
    await fs.rm(projectPath, { recursive: true, force: true })

    // Remove from index
    await this.indexManager.removeProject(projectId)

    console.log(`✅ Deleted project: ${project.title}`)
    return { success: true, deletedProject: project }
  }

  // Create folder in project
  async createFolder(projectId, folderData) {
    const { name, parentPath } = folderData
    const project = await this.getProject(projectId)
    const folderId = this.generateId(name + projectId)

    // Construct folder path
    const folderPath = parentPath ? `${parentPath}/${name}` : `folders/${name}`
    const fullFolderPath = path.join(this.projectsRoot, project.slug, folderPath)

    // Create folder structure
    await fs.mkdir(fullFolderPath, { recursive: true })
    await fs.mkdir(path.join(fullFolderPath, 'chats'), { recursive: true })

    const folder = {
      id: folderId,
      name: name,
      path: folderPath,
      projectId: projectId,
      createdAt: new Date().toISOString()
    }

    // Rebuild index to include new folder
    const projectPath = path.join(this.projectsRoot, project.slug)
    const projectJsonPath = path.join(projectPath, '_project.json')
    const projectData = await fs.readFile(projectJsonPath, 'utf8')
    const projectMeta = JSON.parse(projectData)

    const projectIndex = await this.indexManager.scanProject(projectPath, projectMeta)
    await this.indexManager.updateProject(projectIndex)

    console.log(`✅ Created folder: ${name} in ${project.title}`)
    return folder
  }

  // Delete folder
  async deleteFolder(projectId, folderPath) {
    const project = await this.getProject(projectId)
    const fullFolderPath = path.join(this.projectsRoot, project.slug, folderPath)

    // Remove from filesystem
    await fs.rm(fullFolderPath, { recursive: true, force: true })

    // Rebuild index
    const projectPath = path.join(this.projectsRoot, project.slug)
    const projectJsonPath = path.join(projectPath, '_project.json')
    const projectData = await fs.readFile(projectJsonPath, 'utf8')
    const projectMeta = JSON.parse(projectData)

    const projectIndex = await this.indexManager.scanProject(projectPath, projectMeta)
    await this.indexManager.updateProject(projectIndex)

    console.log(`✅ Deleted folder: ${folderPath} from ${project.title}`)
    return { success: true }
  }

  // Get project tree (projects + folders + chats) - Enhanced with Edge-Dev integration
  async getProjectTree() {
    // Get local planner-chat projects
    const index = await this.indexManager.loadIndex()
    const localProjects = index.projects || []

    // Fetch Edge-Dev projects
    const edgeDevProjects = await this.fetchEdgeDevProjects()
    const convertedEdgeProjects = edgeDevProjects.map(project => this.convertEdgeDevProject(project))

    // Merge projects (local first, then Edge-Dev)
    const allProjects = [...localProjects, ...convertedEdgeProjects]

    // Update stats to include Edge-Dev projects
    const totalLocalStats = index.stats || {
      totalProjects: localProjects.length,
      totalFolders: 0,
      totalChats: 0,
      exportedChats: 0
    }

    // Calculate combined stats
    const totalFolders = localProjects.reduce((sum, p) => sum + (p.folders?.length || 0), 0)
    const totalChats = localProjects.reduce((sum, p) => sum + (p.chats?.length || 0), 0)
    const exportedChats = localProjects.reduce((sum, p) =>
      sum + (p.chats?.filter(chat => chat.exported)?.length || 0), 0)

    const combinedStats = {
      totalProjects: allProjects.length,
      totalLocalProjects: localProjects.length,
      totalEdgeDevProjects: convertedEdgeProjects.length,
      totalScannerProjects: convertedEdgeProjects.filter(p => p.scannerCount > 0).length,
      totalFolders,
      totalChats,
      exportedChats
    }

    console.log(`📊 Project Tree: ${localProjects.length} local + ${convertedEdgeProjects.length} edge-dev = ${allProjects.length} total projects`)

    return {
      projects: allProjects,
      stats: combinedStats,
      lastUpdated: new Date().toISOString(),
      sources: {
        local: index.lastUpdated,
        edgeDev: new Date().toISOString()
      }
    }
  }

  // Utility functions
  generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim()
  }

  generateId(input) {
    return crypto.createHash('md5').update(input + Date.now()).digest('hex').substring(0, 12)
  }
}

module.exports = ProjectManager