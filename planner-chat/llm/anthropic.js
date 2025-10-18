// CE-Hub Planner Chat - Anthropic Adapter
// Streaming chat completion with planning-only constraints

const Anthropic = require('@anthropic-ai/sdk')
const GenericLLMAdapter = require('./generic')

class AnthropicAdapter extends GenericLLMAdapter {
  constructor(apiKey, options = {}) {
    super(apiKey, options)
    this.client = new Anthropic({ apiKey })
    this.model = options.model || 'claude-3-sonnet-20240229'
  }

  async streamCompletion(messages, onChunk, onComplete, onError) {
    try {
      // Format messages for Anthropic (system prompt separate)
      const formattedMessages = this.formatMessages(messages)

      const stream = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        system: this.getEnhancedSystemPrompt(),
        messages: formattedMessages,
        stream: true,
      })

      let fullResponse = ''

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          const content = chunk.delta.text
          fullResponse += content
          onChunk({
            role: 'assistant',
            content: content,
            partial: true
          })
        }
      }

      // Validate planning constraints and complete
      const validatedResponse = this.validatePlanningConstraints(fullResponse)
      onComplete({
        role: 'assistant',
        content: validatedResponse,
        partial: false
      })

    } catch (error) {
      this.handleError(error, onError)
    }
  }

  formatMessages(messages) {
    return messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }))
  }
}

module.exports = AnthropicAdapter