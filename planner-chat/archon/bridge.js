// CE-Hub Planner Chat - Archon Bridge
// MCP client and REST bridge for document management

const { v4: uuidv4 } = require('uuid')

class ArchonBridge {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || process.env.ARCHON_BASE_URL || 'http://localhost:8181'
    this.mcpUrl = options.mcpUrl || process.env.ARCHON_MCP_URL || 'http://localhost:8051'
    this.projectWhitelist = (options.projectWhitelist || process.env.ARCHON_PROJECT_WHITELIST || '')
      .split(',').filter(Boolean)
  }

  /**
   * Export planning document to Archon knowledge graph
   * @param {Object} document - Document to export
   * @param {string} document.title - Document title
   * @param {string} document.content - Document content (markdown)
   * @param {string} document.projectId - Target project ID
   * @param {Array} document.tags - Document tags
   * @returns {Promise<Object>} Export result with source_id
   */
  async exportDocument(document) {
    try {
      // Validate project whitelist
      if (this.projectWhitelist.length > 0 && !this.projectWhitelist.includes(document.projectId)) {
        throw new Error(`Project ${document.projectId} not in whitelist: ${this.projectWhitelist.join(', ')}`)
      }

      // Prepare document for Archon
      const archonDocument = this.formatDocumentForArchon(document)

      // Try MCP first, fallback to REST API
      try {
        return await this.exportViaMCP(archonDocument)
      } catch (mcpError) {
        console.warn('MCP export failed, falling back to REST API:', mcpError.message)
        return await this.exportViaREST(archonDocument)
      }

    } catch (error) {
      console.error('Document export failed:', error)
      throw new Error(`Failed to export document: ${error.message}`)
    }
  }

  /**
   * Format document for Archon ingestion
   */
  formatDocumentForArchon(document) {
    const timestamp = new Date().toISOString()

    return {
      project_id: document.projectId,
      title: document.title,
      document_type: 'plan',
      content: {
        summary: this.extractSummary(document.content),
        full_content: document.content,
        planning_type: document.planningType || 'strategic',
        created_via: 'planner-chat',
        export_timestamp: timestamp,
        word_count: document.content.split(/\s+/).length,
        sections: this.extractSections(document.content)
      },
      tags: [
        'scope:meta',
        'type:plan',
        'source:planner-chat',
        'domain:ce-hub',
        ...document.tags
      ],
      author: 'CE-Hub Planner Chat',
      status: 'draft'
    }
  }

  /**
   * Export via MCP protocol (preferred method)
   */
  async exportViaMCP(document) {
    const mcpPayload = {
      method: 'tools/call',
      params: {
        name: 'manage_document',
        arguments: {
          action: 'create',
          ...document
        }
      }
    }

    const response = await fetch(`${this.mcpUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mcpPayload)
    })

    if (!response.ok) {
      throw new Error(`MCP request failed: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()

    if (result.error) {
      throw new Error(`MCP error: ${result.error.message}`)
    }

    return {
      success: true,
      source_id: result.result?.document_id || uuidv4(),
      method: 'mcp',
      document_id: result.result?.document_id,
      message: 'Document exported successfully via MCP'
    }
  }

  /**
   * Export via REST API (fallback method)
   */
  async exportViaREST(document) {
    const response = await fetch(`${this.baseUrl}/api/projects/${document.project_id}/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(document)
    })

    if (!response.ok) {
      throw new Error(`REST API request failed: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()

    return {
      success: true,
      source_id: result.document_id || result.id || uuidv4(),
      method: 'rest',
      document_id: result.document_id || result.id,
      message: 'Document exported successfully via REST API'
    }
  }

  /**
   * Extract summary from document content
   */
  extractSummary(content) {
    // Look for explicit summary section
    const summaryMatch = content.match(/## (?:Summary|Overview|Project Overview)\s*\n([\s\S]*?)(?=\n##|\n#|$)/i)
    if (summaryMatch) {
      return summaryMatch[1].trim().substring(0, 500)
    }

    // Extract first paragraph as summary
    const firstParagraph = content.split('\n\n')[0]
    return firstParagraph.replace(/^#+\s*/, '').trim().substring(0, 500)
  }

  /**
   * Extract section structure from document
   */
  extractSections(content) {
    const sections = []
    const sectionMatches = content.match(/^#+\s+(.+)$/gm)

    if (sectionMatches) {
      sectionMatches.forEach(match => {
        const level = match.match(/^#+/)[0].length
        const title = match.replace(/^#+\s+/, '')
        sections.push({ level, title })
      })
    }

    return sections
  }

  /**
   * Validate Archon connectivity
   */
  async validateConnection() {
    try {
      // Test MCP health
      const mcpResponse = await fetch(`${this.mcpUrl}/health`, {
        method: 'GET',
        timeout: 5000
      })
      const mcpHealthy = mcpResponse.ok

      // Test REST API health
      const restResponse = await fetch(`${this.baseUrl}/api/health`, {
        method: 'GET',
        timeout: 5000
      })
      const restHealthy = restResponse.ok

      return {
        mcp: mcpHealthy,
        rest: restHealthy,
        overall: mcpHealthy || restHealthy
      }
    } catch (error) {
      console.warn('Archon connectivity check failed:', error.message)
      return {
        mcp: false,
        rest: false,
        overall: false,
        error: error.message
      }
    }
  }

  /**
   * Get available projects for document export
   */
  async getAvailableProjects() {
    try {
      if (this.projectWhitelist.length > 0) {
        return this.projectWhitelist.map(id => ({ id, name: `Project ${id}` }))
      }

      // Fetch from Archon if no whitelist
      const response = await fetch(`${this.baseUrl}/api/projects`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.status}`)
      }

      const projects = await response.json()
      return projects.map(p => ({ id: p.id, name: p.title || p.name }))

    } catch (error) {
      console.warn('Failed to fetch available projects:', error.message)
      return this.projectWhitelist.map(id => ({ id, name: `Project ${id}` }))
    }
  }
}

module.exports = ArchonBridge