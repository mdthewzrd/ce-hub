// CE-Hub Planner Chat - Index Manager
// Manages the data/index.json file for fast tree loading

const fs = require('fs').promises
const path = require('path')
const crypto = require('crypto')

class IndexManager {
  constructor(config) {
    this.config = config
    this.indexPath = path.join(process.cwd(), 'data', 'index.json')
    this.projectsRoot = path.join(process.cwd(), config.projectsRoot)
  }

  // Load current index
  async loadIndex() {
    try {
      const indexData = await fs.readFile(this.indexPath, 'utf8')
      return JSON.parse(indexData)
    } catch (error) {
      console.warn('Index file not found, creating new one')
      return this.createEmptyIndex()
    }
  }

  // Create empty index structure
  createEmptyIndex() {
    return {
      version: "1.0.0",
      lastUpdated: new Date().toISOString(),
      projects: [],
      stats: {
        totalProjects: 0,
        totalFolders: 0,
        totalChats: 0,
        exportedChats: 0
      }
    }
  }

  // Rebuild entire index from filesystem
  async rebuildIndex() {
    try {
      console.log('🔄 Rebuilding index from filesystem...')

      const index = this.createEmptyIndex()

      // Scan projects directory
      const projectDirs = await fs.readdir(this.projectsRoot)

      for (const projectDir of projectDirs) {
        const projectPath = path.join(this.projectsRoot, projectDir)
        const projectJsonPath = path.join(projectPath, '_project.json')

        try {
          // Check if it's a valid project directory
          const stat = await fs.stat(projectPath)
          if (!stat.isDirectory()) continue

          // Load project metadata
          const projectData = await fs.readFile(projectJsonPath, 'utf8')
          const project = JSON.parse(projectData)

          // Scan folders and chats
          const projectIndex = await this.scanProject(projectPath, project)
          index.projects.push(projectIndex)

        } catch (error) {
          console.warn(`Skipping invalid project directory: ${projectDir}`)
        }
      }

      // Update stats
      index.stats = this.calculateStats(index.projects)
      index.lastUpdated = new Date().toISOString()

      // Save index
      await this.saveIndex(index)

      console.log(`✅ Index rebuilt: ${index.stats.totalProjects} projects, ${index.stats.totalChats} chats`)
      return index

    } catch (error) {
      console.error('Failed to rebuild index:', error)
      throw error
    }
  }

  // Scan a single project directory
  async scanProject(projectPath, projectMeta) {
    const project = {
      id: projectMeta.id,
      slug: projectMeta.slug,
      title: projectMeta.title,
      path: projectMeta.path,
      isDefault: projectMeta.isDefault || false,
      folders: [],
      chats: []
    }

    // Scan root-level chats
    const chatsDir = path.join(projectPath, 'chats')
    try {
      const chatFiles = await fs.readdir(chatsDir)
      for (const chatFile of chatFiles) {
        if (chatFile.endsWith('.md')) {
          const chatData = await this.scanChatFile(path.join(chatsDir, chatFile), project.id)
          if (chatData) {
            project.chats.push(chatData)
          }
        }
      }
    } catch (error) {
      // Chats directory might not exist
    }

    // Scan folders
    const foldersDir = path.join(projectPath, 'folders')
    try {
      const folderNames = await fs.readdir(foldersDir)
      for (const folderName of folderNames) {
        const folderPath = path.join(foldersDir, folderName)
        const folderStat = await fs.stat(folderPath)
        if (folderStat.isDirectory()) {
          const folder = await this.scanFolder(folderPath, folderName, project.id)
          project.folders.push(folder)
        }
      }
    } catch (error) {
      // Folders directory might not exist
    }

    return project
  }

  // Scan a folder and its chats
  async scanFolder(folderPath, folderName, projectId) {
    const folder = {
      id: this.generateId(folderName + projectId),
      name: folderName,
      path: `folders/${folderName}`,
      chats: []
    }

    // Scan chats in this folder (assuming chats/ subdirectory)
    const chatsDir = path.join(folderPath, 'chats')
    try {
      const chatFiles = await fs.readdir(chatsDir)
      for (const chatFile of chatFiles) {
        if (chatFile.endsWith('.md')) {
          const chatData = await this.scanChatFile(path.join(chatsDir, chatFile), projectId, folder.path)
          if (chatData) {
            folder.chats.push(chatData)
          }
        }
      }
    } catch (error) {
      // No chats directory in folder
    }

    return folder
  }

  // Scan a chat file and extract metadata
  async scanChatFile(filePath, projectId, folderPath = null) {
    try {
      const content = await fs.readFile(filePath, 'utf8')
      const fileName = path.basename(filePath)
      const chatId = this.generateId(fileName + projectId)

      // Extract title from first line or filename
      const lines = content.split('\n')
      let title = fileName.replace('.md', '').replace(/_/g, ' ')
      if (lines[0] && lines[0].startsWith('# ')) {
        title = lines[0].substring(2).trim()
      }

      // Count messages and words (rough estimate)
      const messageCount = (content.match(/^(User|Assistant):/gm) || []).length
      const wordCount = content.split(/\s+/).length

      // Check if exported (look for metadata)
      const metaPath = path.join(process.cwd(), 'data', 'meta', `${chatId}.meta.json`)
      let exported = false
      let archonSourceId = null

      try {
        const metaData = await fs.readFile(metaPath, 'utf8')
        const meta = JSON.parse(metaData)
        exported = meta.exported || false
        archonSourceId = meta.archonSourceId || null
      } catch (error) {
        // No metadata file
      }

      return {
        id: chatId,
        title: title,
        filePath: path.relative(process.cwd(), filePath),
        projectId: projectId,
        folderPath: folderPath,
        exported: exported,
        archonSourceId: archonSourceId,
        lastUpdated: new Date().toISOString(),
        messageCount: messageCount,
        wordCount: wordCount
      }
    } catch (error) {
      console.warn(`Failed to scan chat file ${filePath}:`, error.message)
      return null
    }
  }

  // Generate consistent ID from string
  generateId(input) {
    return crypto.createHash('md5').update(input).digest('hex').substring(0, 12)
  }

  // Calculate statistics
  calculateStats(projects) {
    let totalFolders = 0
    let totalChats = 0
    let exportedChats = 0

    for (const project of projects) {
      totalFolders += project.folders.length
      totalChats += project.chats.length

      // Count exported chats in project root
      exportedChats += project.chats.filter(chat => chat.exported).length

      // Count chats in folders
      for (const folder of project.folders) {
        totalChats += folder.chats.length
        exportedChats += folder.chats.filter(chat => chat.exported).length
      }
    }

    return {
      totalProjects: projects.length,
      totalFolders,
      totalChats,
      exportedChats
    }
  }

  // Save index to file
  async saveIndex(index) {
    try {
      const indexData = JSON.stringify(index, null, 2)
      await fs.writeFile(this.indexPath, indexData, 'utf8')
    } catch (error) {
      console.error('Failed to save index:', error)
      throw error
    }
  }

  // Update a specific project in index
  async updateProject(projectData) {
    const index = await this.loadIndex()
    const projectIndex = index.projects.findIndex(p => p.id === projectData.id)

    if (projectIndex >= 0) {
      index.projects[projectIndex] = projectData
    } else {
      index.projects.push(projectData)
    }

    index.stats = this.calculateStats(index.projects)
    index.lastUpdated = new Date().toISOString()

    await this.saveIndex(index)
    return index
  }

  // Remove project from index
  async removeProject(projectId) {
    const index = await this.loadIndex()
    index.projects = index.projects.filter(p => p.id !== projectId)

    index.stats = this.calculateStats(index.projects)
    index.lastUpdated = new Date().toISOString()

    await this.saveIndex(index)
    return index
  }

  // Add or update chat in index
  async updateChat(chatData) {
    const index = await this.loadIndex()
    const project = index.projects.find(p => p.id === chatData.projectId)

    if (!project) {
      throw new Error(`Project ${chatData.projectId} not found`)
    }

    // Find existing chat and remove it
    project.chats = project.chats.filter(c => c.id !== chatData.id)

    // Remove from folders too
    for (const folder of project.folders) {
      folder.chats = folder.chats.filter(c => c.id !== chatData.id)
    }

    // Add to appropriate location
    if (chatData.folderPath) {
      const folder = project.folders.find(f => f.path === chatData.folderPath)
      if (folder) {
        folder.chats.push(chatData)
      }
    } else {
      project.chats.push(chatData)
    }

    index.stats = this.calculateStats(index.projects)
    index.lastUpdated = new Date().toISOString()

    await this.saveIndex(index)
    return index
  }
}

module.exports = IndexManager