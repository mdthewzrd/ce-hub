// CE-Hub Planner Chat - Project Manager
// Manages project CRUD operations and filesystem structure

const fs = require('fs').promises
const path = require('path')
const crypto = require('crypto')

class ProjectManager {
  constructor(config, indexManager) {
    this.config = config
    this.indexManager = indexManager
    this.projectsRoot = path.join(process.cwd(), config.projectsRoot)
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

  // Get project tree (projects + folders + chats)
  async getProjectTree() {
    const index = await this.indexManager.loadIndex()
    return {
      projects: index.projects,
      stats: index.stats,
      lastUpdated: index.lastUpdated
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