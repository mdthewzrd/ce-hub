// CE-Hub Planner Chat - Chat Manager
// Manages chat file operations and metadata

const fs = require('fs').promises
const path = require('path')
const crypto = require('crypto')

class ChatManager {
  constructor(config, indexManager) {
    this.config = config
    this.indexManager = indexManager
    this.projectsRoot = path.join(process.cwd(), config.projectsRoot)
    this.metaDir = path.join(process.cwd(), 'data', 'meta')
  }

  // Create a new chat
  async createChat(data) {
    const { title, projectId, folderPath, content = '' } = data

    // Get project info
    const index = await this.indexManager.loadIndex()
    const project = index.projects.find(p => p.id === projectId)
    if (!project) {
      throw new Error(`Project ${projectId} not found`)
    }

    // Generate chat ID and filename
    const chatId = this.generateId(title + projectId)
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `${timestamp}_${this.generateSlug(title)}.md`

    // Determine file path
    let filePath
    if (folderPath) {
      filePath = path.join(this.projectsRoot, project.slug, folderPath, 'chats', filename)
    } else {
      filePath = path.join(this.projectsRoot, project.slug, 'chats', filename)
    }

    // Ensure directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true })

    // Create chat content
    const chatContent = this.formatChatContent(title, content)

    // Write chat file
    await fs.writeFile(filePath, chatContent, 'utf8')

    // Create metadata
    const metadata = {
      chatId: chatId,
      exported: false,
      archonSourceId: null,
      exportedAt: null,
      tags: [],
      summary: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    await this.saveMetadata(chatId, metadata)

    // Create chat object
    const chat = {
      id: chatId,
      title: title,
      filePath: path.relative(process.cwd(), filePath),
      projectId: projectId,
      folderPath: folderPath,
      exported: false,
      archonSourceId: null,
      lastUpdated: new Date().toISOString(),
      messageCount: 0,
      wordCount: this.countWords(chatContent)
    }

    // Update index
    await this.indexManager.updateChat(chat)

    console.log(`✅ Created chat: ${title}`)
    return chat
  }

  // Get chat content
  async getChatContent(chatId) {
    const chat = await this.getChat(chatId)
    const fullPath = path.join(process.cwd(), chat.filePath)

    try {
      const content = await fs.readFile(fullPath, 'utf8')
      return {
        id: chatId,
        title: chat.title,
        content: content,
        lastUpdated: chat.lastUpdated,
        messageCount: this.countMessages(content),
        wordCount: this.countWords(content)
      }
    } catch (error) {
      throw new Error(`Failed to read chat content: ${error.message}`)
    }
  }

  // Save chat content
  async saveChatContent(chatId, content) {
    const chat = await this.getChat(chatId)
    const fullPath = path.join(process.cwd(), chat.filePath)

    try {
      await fs.writeFile(fullPath, content, 'utf8')

      // Update chat in index
      const updatedChat = {
        ...chat,
        lastUpdated: new Date().toISOString(),
        messageCount: this.countMessages(content),
        wordCount: this.countWords(content)
      }

      await this.indexManager.updateChat(updatedChat)

      // Update metadata
      const metadata = await this.getMetadata(chatId)
      metadata.updatedAt = new Date().toISOString()
      await this.saveMetadata(chatId, metadata)

      console.log(`✅ Saved chat content: ${chat.title}`)
      return updatedChat
    } catch (error) {
      throw new Error(`Failed to save chat content: ${error.message}`)
    }
  }

  // Get chat by ID
  async getChat(chatId) {
    const index = await this.indexManager.loadIndex()

    for (const project of index.projects) {
      // Check root chats
      const rootChat = project.chats.find(c => c.id === chatId)
      if (rootChat) return rootChat

      // Check folder chats
      for (const folder of project.folders) {
        const folderChat = folder.chats.find(c => c.id === chatId)
        if (folderChat) return folderChat
      }
    }

    throw new Error(`Chat ${chatId} not found`)
  }

  // List chats with filters
  async listChats(filters = {}) {
    const { projectId, folderPath, exported } = filters
    const index = await this.indexManager.loadIndex()

    let chats = []

    for (const project of index.projects) {
      if (projectId && project.id !== projectId) continue

      // Add root chats
      if (!folderPath) {
        chats.push(...project.chats)
      }

      // Add folder chats
      for (const folder of project.folders) {
        if (folderPath && folder.path !== folderPath) continue
        chats.push(...folder.chats)
      }
    }

    // Filter by export status
    if (exported !== undefined) {
      chats = chats.filter(chat => chat.exported === exported)
    }

    return chats.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
  }

  // Update chat metadata
  async updateChat(chatId, updates) {
    const chat = await this.getChat(chatId)
    const oldPath = path.join(process.cwd(), chat.filePath)

    // Handle moving to different project or folder
    if (updates.projectId || updates.folderPath !== undefined) {
      const targetProjectId = updates.projectId || chat.projectId
      const targetFolderPath = updates.folderPath

      // Get target project
      const index = await this.indexManager.loadIndex()
      const targetProject = index.projects.find(p => p.id === targetProjectId)
      if (!targetProject) {
        throw new Error(`Target project ${targetProjectId} not found`)
      }

      // Generate new file path
      const filename = path.basename(chat.filePath)
      let newPath

      if (targetFolderPath) {
        newPath = path.join(this.projectsRoot, targetProject.slug, targetFolderPath, 'chats', filename)
      } else {
        newPath = path.join(this.projectsRoot, targetProject.slug, 'chats', filename)
      }

      // Ensure target directory exists
      await fs.mkdir(path.dirname(newPath), { recursive: true })

      // Move file
      await fs.rename(oldPath, newPath)

      // Update file path
      updates.filePath = path.relative(process.cwd(), newPath)
    }

    // Handle title change
    if (updates.title && updates.title !== chat.title) {
      // Update content with new title
      const content = await fs.readFile(path.join(process.cwd(), updates.filePath || chat.filePath), 'utf8')
      const updatedContent = this.updateChatTitle(content, updates.title)
      await fs.writeFile(path.join(process.cwd(), updates.filePath || chat.filePath), updatedContent, 'utf8')
    }

    // Create updated chat object
    const updatedChat = {
      ...chat,
      ...updates,
      lastUpdated: new Date().toISOString()
    }

    // Update index
    await this.indexManager.updateChat(updatedChat)

    console.log(`✅ Updated chat: ${updatedChat.title}`)
    return updatedChat
  }

  // Delete chat
  async deleteChat(chatId) {
    const chat = await this.getChat(chatId)
    const fullPath = path.join(process.cwd(), chat.filePath)

    // Delete file
    await fs.unlink(fullPath)

    // Delete metadata
    await this.deleteMetadata(chatId)

    // Remove from index by rebuilding
    const index = await this.indexManager.loadIndex()
    for (const project of index.projects) {
      project.chats = project.chats.filter(c => c.id !== chatId)
      for (const folder of project.folders) {
        folder.chats = folder.chats.filter(c => c.id !== chatId)
      }
    }

    index.stats = this.indexManager.calculateStats(index.projects)
    index.lastUpdated = new Date().toISOString()
    await this.indexManager.saveIndex(index)

    console.log(`✅ Deleted chat: ${chat.title}`)
    return { success: true, deletedChat: chat }
  }

  // Mark chat as exported
  async markAsExported(chatId, archonSourceId, documentId = null) {
    const metadata = await this.getMetadata(chatId)

    metadata.exported = true
    metadata.archonSourceId = archonSourceId
    metadata.documentId = documentId
    metadata.exportedAt = new Date().toISOString()

    await this.saveMetadata(chatId, metadata)

    // Update chat in index
    const chat = await this.getChat(chatId)
    const updatedChat = {
      ...chat,
      exported: true,
      archonSourceId: archonSourceId
    }

    await this.indexManager.updateChat(updatedChat)

    console.log(`✅ Marked chat as exported: ${chat.title}`)
    return updatedChat
  }

  // Get/save metadata
  async getMetadata(chatId) {
    const metaPath = path.join(this.metaDir, `${chatId}.meta.json`)

    try {
      const metaData = await fs.readFile(metaPath, 'utf8')
      return JSON.parse(metaData)
    } catch (error) {
      // Return default metadata
      return {
        chatId: chatId,
        exported: false,
        archonSourceId: null,
        exportedAt: null,
        tags: [],
        summary: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }
  }

  async saveMetadata(chatId, metadata) {
    const metaPath = path.join(this.metaDir, `${chatId}.meta.json`)
    await fs.mkdir(this.metaDir, { recursive: true })
    await fs.writeFile(metaPath, JSON.stringify(metadata, null, 2), 'utf8')
  }

  async deleteMetadata(chatId) {
    const metaPath = path.join(this.metaDir, `${chatId}.meta.json`)
    try {
      await fs.unlink(metaPath)
    } catch (error) {
      // Metadata file might not exist
    }
  }

  // Utility functions
  formatChatContent(title, content = '') {
    const timestamp = new Date().toISOString()
    return `# ${title}

**Created**: ${timestamp}
**Project**: Planning Session
**Type**: Strategic Planning

---

${content || 'Planning session started...'}`
  }

  updateChatTitle(content, newTitle) {
    const lines = content.split('\n')
    if (lines[0] && lines[0].startsWith('# ')) {
      lines[0] = `# ${newTitle}`
    }
    return lines.join('\n')
  }

  countMessages(content) {
    return (content.match(/^(User|Assistant):/gm) || []).length
  }

  countWords(content) {
    return content.split(/\s+/).filter(word => word.length > 0).length
  }

  generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50)
      .trim()
  }

  generateId(input) {
    return crypto.createHash('md5').update(input + Date.now()).digest('hex').substring(0, 12)
  }
}

module.exports = ChatManager