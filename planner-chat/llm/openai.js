// CE-Hub Planner Chat - OpenAI Adapter
// Streaming chat completion with planning-only constraints

const OpenAI = require('openai')
const GenericLLMAdapter = require('./generic')

class OpenAIAdapter extends GenericLLMAdapter {
  constructor(apiKey, options = {}) {
    super(apiKey, options)
    this.client = new OpenAI({ apiKey })
    this.model = options.model || 'gpt-4'
  }

  async streamCompletion(messages, onChunk, onComplete, onError) {
    try {
      // Format messages with system prompt
      const formattedMessages = [
        {
          role: 'system',
          content: this.getEnhancedSystemPrompt()
        },
        ...this.formatMessages(messages)
      ]

      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages: formattedMessages,
        stream: true,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
      })

      let fullResponse = ''

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || ''
        if (content) {
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

module.exports = OpenAIAdapter