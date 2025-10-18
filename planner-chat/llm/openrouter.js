// CE-Hub Planner Chat - OpenRouter Adapter
// Streaming chat completion with planning-only constraints via OpenRouter

const GenericLLMAdapter = require('./generic')

class OpenRouterAdapter extends GenericLLMAdapter {
  constructor(apiKey, options = {}) {
    super(apiKey, options)
    this.apiKey = apiKey
    this.model = options.model || 'meta-llama/llama-3.2-3b-instruct:free'
    this.baseUrl = 'https://openrouter.ai/api/v1'
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

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://ce-hub.planner.chat',
          'X-Title': 'CE-Hub Planner Chat'
        },
        body: JSON.stringify({
          model: this.model,
          messages: formattedMessages,
          stream: true,
          max_tokens: this.maxTokens,
          temperature: this.temperature,
        })
      })

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullResponse = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()

            if (data === '[DONE]') {
              break
            }

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content || ''

              if (content) {
                fullResponse += content
                onChunk({
                  role: 'assistant',
                  content: content,
                  partial: true
                })
              }
            } catch (parseError) {
              // Skip malformed JSON chunks
              continue
            }
          }
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

  // Get available models for OpenRouter
  static getAvailableModels() {
    return [
      // FREE MODELS (completely free)
      {
        id: 'meta-llama/llama-3.2-3b-instruct:free',
        name: 'Llama 3.2 3B Instruct',
        provider: 'Meta',
        pricing: 'Free',
        category: 'free',
        topPick: true
      },
      {
        id: 'meta-llama/llama-3.2-1b-instruct:free',
        name: 'Llama 3.2 1B Instruct',
        provider: 'Meta',
        pricing: 'Free',
        category: 'free'
      },
      {
        id: 'google/gemma-2-9b-it:free',
        name: 'Gemma 2 9B Instruct',
        provider: 'Google',
        pricing: 'Free',
        category: 'free'
      },
      {
        id: 'huggingface/zephyr-7b-beta:free',
        name: 'Zephyr 7B Beta',
        provider: 'HuggingFace',
        pricing: 'Free',
        category: 'free'
      },
      {
        id: 'microsoft/phi-3-mini-128k-instruct:free',
        name: 'Phi-3 Mini 128K Instruct',
        provider: 'Microsoft',
        pricing: 'Free',
        category: 'free'
      },

      // ULTRA CHEAP ($0.02-0.20 per 1M tokens)
      {
        id: 'qwen/qwen-2.5-7b-instruct',
        name: 'Qwen 2.5 7B Instruct',
        provider: 'Alibaba',
        pricing: '$0.07/1M',
        category: 'ultra-cheap',
        topPick: true
      },
      {
        id: 'qwen/qwen-2-7b-instruct',
        name: 'Qwen 2 7B Instruct',
        provider: 'Alibaba',
        pricing: '$0.07/1M',
        category: 'ultra-cheap'
      },
      {
        id: 'zhipuai/glm-4-9b-chat',
        name: 'GLM-4 9B Chat',
        provider: 'Zhipu AI',
        pricing: '$0.10/1M',
        category: 'ultra-cheap',
        topPick: true
      },
      {
        id: 'microsoft/phi-3-medium-128k-instruct',
        name: 'Phi-3 Medium 128K',
        provider: 'Microsoft',
        pricing: '$0.14/1M',
        category: 'ultra-cheap'
      },
      {
        id: 'meta-llama/llama-3.1-8b-instruct',
        name: 'Llama 3.1 8B Instruct',
        provider: 'Meta',
        pricing: '$0.18/1M',
        category: 'ultra-cheap'
      },
      {
        id: 'meta-llama/llama-3-8b-instruct',
        name: 'Llama 3 8B Instruct',
        provider: 'Meta',
        pricing: '$0.18/1M',
        category: 'ultra-cheap'
      },
      {
        id: 'mistralai/mistral-7b-instruct',
        name: 'Mistral 7B Instruct',
        provider: 'Mistral',
        pricing: '$0.18/1M',
        category: 'ultra-cheap'
      },
      {
        id: 'openchat/openchat-7b',
        name: 'OpenChat 7B',
        provider: 'OpenChat',
        pricing: '$0.18/1M',
        category: 'ultra-cheap'
      },
      {
        id: 'gryphe/mythomist-7b',
        name: 'MythoMist 7B',
        provider: 'Gryphe',
        pricing: '$0.18/1M',
        category: 'ultra-cheap'
      },
      {
        id: 'undi95/toppy-m-7b',
        name: 'Toppy M 7B',
        provider: 'Undi95',
        pricing: '$0.18/1M',
        category: 'ultra-cheap'
      },
      {
        id: 'nousresearch/nous-capybara-7b',
        name: 'Nous Capybara 7B',
        provider: 'NousResearch',
        pricing: '$0.18/1M',
        category: 'ultra-cheap'
      },

      // SUPER CHEAP ($0.20-0.60 per 1M tokens)
      {
        id: 'qwen/qwen-2.5-72b-instruct',
        name: 'Qwen 2.5 72B Instruct',
        provider: 'Alibaba',
        pricing: '$0.56/1M',
        category: 'super-cheap',
        topPick: true
      },
      {
        id: 'google/gemma-2-27b-it',
        name: 'Gemma 2 27B Instruct',
        provider: 'Google',
        pricing: '$0.27/1M',
        category: 'super-cheap',
        topPick: true
      },
      {
        id: 'mistralai/mistral-nemo',
        name: 'Mistral Nemo',
        provider: 'Mistral',
        pricing: '$0.27/1M',
        category: 'super-cheap'
      },
      {
        id: 'qwen/qwen-2.5-32b-instruct',
        name: 'Qwen 2.5 32B Instruct',
        provider: 'Alibaba',
        pricing: '$0.30/1M',
        category: 'super-cheap'
      },
      {
        id: 'qwen/qwen-2-72b-instruct',
        name: 'Qwen 2 72B Instruct',
        provider: 'Alibaba',
        pricing: '$0.56/1M',
        category: 'super-cheap'
      },
      {
        id: 'deepseek/deepseek-coder',
        name: 'DeepSeek Coder',
        provider: 'DeepSeek',
        pricing: '$0.14/1M',
        category: 'super-cheap'
      },
      {
        id: 'cognitivecomputations/dolphin-mixtral-8x7b',
        name: 'Dolphin Mixtral 8x7B',
        provider: 'Cognitive Computations',
        pricing: '$0.50/1M',
        category: 'super-cheap'
      },
      {
        id: 'mistralai/mixtral-8x7b-instruct',
        name: 'Mixtral 8x7B Instruct',
        provider: 'Mistral',
        pricing: '$0.54/1M',
        category: 'super-cheap'
      },
      {
        id: 'lizpreciatior/lzlv-70b-fp16-hf',
        name: 'LZLV 70B',
        provider: 'Lizpreciatior',
        pricing: '$0.59/1M',
        category: 'super-cheap'
      },

      // AFFORDABLE ($0.60-2.00 per 1M tokens)
      {
        id: 'openai/gpt-4o-mini',
        name: 'GPT-4o Mini',
        provider: 'OpenAI',
        pricing: '$0.60/1M',
        category: 'affordable',
        topPick: true
      },
      {
        id: 'google/gemini-flash-1.5',
        name: 'Gemini Flash 1.5',
        provider: 'Google',
        pricing: '$0.75/1M',
        category: 'affordable'
      },
      {
        id: 'nvidia/llama-3.1-nemotron-70b-instruct',
        name: 'Nemotron 70B Instruct',
        provider: 'NVIDIA',
        pricing: '$0.86/1M',
        category: 'affordable'
      },
      {
        id: 'meta-llama/llama-3.1-70b-instruct',
        name: 'Llama 3.1 70B Instruct',
        provider: 'Meta',
        pricing: '$0.88/1M',
        category: 'affordable'
      },
      {
        id: 'anthropic/claude-3-haiku',
        name: 'Claude 3 Haiku',
        provider: 'Anthropic',
        pricing: '$1.25/1M',
        category: 'affordable'
      },
      {
        id: 'cohere/command-r',
        name: 'Command R',
        provider: 'Cohere',
        pricing: '$1.50/1M',
        category: 'affordable'
      },
      {
        id: 'perplexity/llama-3.1-sonar-large-128k-online',
        name: 'Sonar Large 128K Online',
        provider: 'Perplexity',
        pricing: '$1.00/1M',
        category: 'affordable'
      },

      // MID-TIER ($2.00-8.00 per 1M tokens)
      {
        id: 'anthropic/claude-3-sonnet',
        name: 'Claude 3 Sonnet',
        provider: 'Anthropic',
        pricing: '$3.00/1M',
        category: 'mid-tier'
      },
      {
        id: 'google/gemini-pro-1.5',
        name: 'Gemini Pro 1.5',
        provider: 'Google',
        pricing: '$7.00/1M',
        category: 'mid-tier'
      },
      {
        id: 'mistralai/mistral-large',
        name: 'Mistral Large',
        provider: 'Mistral',
        pricing: '$8.00/1M',
        category: 'mid-tier'
      },
      {
        id: 'cohere/command-r-plus',
        name: 'Command R+',
        provider: 'Cohere',
        pricing: '$3.00/1M',
        category: 'mid-tier'
      },

      // PREMIUM ($8.00-20.00 per 1M tokens)
      {
        id: 'anthropic/claude-3.5-sonnet',
        name: 'Claude 3.5 Sonnet',
        provider: 'Anthropic',
        pricing: '$15.00/1M',
        category: 'premium',
        topPick: true
      },
      {
        id: 'openai/gpt-4o',
        name: 'GPT-4o',
        provider: 'OpenAI',
        pricing: '$15.00/1M',
        category: 'premium'
      },
      {
        id: 'openai/gpt-4-turbo',
        name: 'GPT-4 Turbo',
        provider: 'OpenAI',
        pricing: '$10.00/1M',
        category: 'premium'
      },
      {
        id: 'openai/gpt-4',
        name: 'GPT-4',
        provider: 'OpenAI',
        pricing: '$30.00/1M',
        category: 'premium'
      },

      // ENTERPRISE ($20.00+ per 1M tokens)
      {
        id: 'anthropic/claude-3-opus',
        name: 'Claude 3 Opus',
        provider: 'Anthropic',
        pricing: '$75.00/1M',
        category: 'enterprise'
      },
      {
        id: 'openai/o1-preview',
        name: 'o1-preview',
        provider: 'OpenAI',
        pricing: '$150.00/1M',
        category: 'enterprise'
      },
      {
        id: 'openai/o1-mini',
        name: 'o1-mini',
        provider: 'OpenAI',
        pricing: '$30.00/1M',
        category: 'enterprise'
      }
    ]
  }
}

module.exports = OpenRouterAdapter