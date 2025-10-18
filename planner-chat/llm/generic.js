// CE-Hub Planner Chat - Generic LLM Adapter Interface
// Provides standardized interface for all LLM providers

class GenericLLMAdapter {
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey
    this.options = options
    this.systemPrompt = options.systemPrompt || ''
    this.maxTokens = options.maxTokens || 4000
    this.temperature = options.temperature || 0.7
  }

  /**
   * Stream chat completion - must be implemented by specific adapters
   * @param {Array} messages - Conversation history
   * @param {Function} onChunk - Callback for streaming chunks
   * @param {Function} onComplete - Callback for completion
   * @param {Function} onError - Callback for errors
   */
  async streamCompletion(messages, onChunk, onComplete, onError) {
    throw new Error('streamCompletion must be implemented by specific adapter')
  }

  /**
   * Format messages for the specific LLM provider
   * @param {Array} messages - Raw conversation messages
   * @returns {Array} Provider-specific formatted messages
   */
  formatMessages(messages) {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }))
  }

  /**
   * Validate and enforce planning-only constraints
   * @param {string} response - LLM response to validate
   * @returns {string} Potentially modified response
   */
  validatePlanningConstraints(response) {
    // Check for common implementation patterns and warn
    const implementationPatterns = [
      /```[\s\S]*?```/g, // Code blocks
      /function\s+\w+\s*\(/g, // Function definitions
      /class\s+\w+/g, // Class definitions
      /import\s+.*from/g, // Import statements
      /npm\s+install/g, // Package installation
      /git\s+clone/g, // Git operations
    ]

    let hasImplementation = false
    for (const pattern of implementationPatterns) {
      if (pattern.test(response)) {
        hasImplementation = true
        break
      }
    }

    if (hasImplementation) {
      return response + `

⚠️ **Planning Assistant Note**: I notice this response contains implementation details. As a planning specialist, I focus on strategic planning rather than implementation. The above should be considered planning guidance rather than code to execute directly.`
    }

    return response
  }

  /**
   * Add planning context to system prompt
   * @returns {string} Enhanced system prompt with planning constraints
   */
  getEnhancedSystemPrompt() {
    const planningConstraints = `

CRITICAL PLANNING CONSTRAINTS:
- You are a PLANNING SPECIALIST only - never provide implementation
- Focus on strategic planning, research synthesis, and knowledge organization
- Structure all outputs for export to Archon knowledge management system
- End conversations by recommending document export when planning is complete`

    return this.systemPrompt + planningConstraints
  }

  /**
   * Standard error handling for all adapters
   */
  handleError(error, onError) {
    console.error('LLM Adapter Error:', error)
    const errorMessage = {
      role: 'assistant',
      content: `I apologize, but I encountered an error while processing your request. This might be due to:

- Network connectivity issues
- API rate limits
- Invalid API configuration

Please check your connection and try again. If the issue persists, verify your API key and endpoint configuration.

Error details: ${error.message}`
    }
    onError(errorMessage)
  }

  /**
   * Standard rate limiting and retry logic
   */
  async withRetry(operation, maxRetries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        if (attempt === maxRetries) throw error

        // Exponential backoff for rate limiting
        const retryDelay = delay * Math.pow(2, attempt - 1)
        await new Promise(resolve => setTimeout(resolve, retryDelay))
      }
    }
  }
}

module.exports = GenericLLMAdapter