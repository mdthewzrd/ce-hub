// CE-Hub Planner Chat - Frontend Client
// WebSocket/SSE streaming client with planning-only focus

class PlannerChatApp {
    constructor() {
        this.messages = []
        this.isStreaming = false
        this.currentEventSource = null
        this.isConnected = false
        this.speechRecognition = null
        this.speechSynthesis = null
        this.currentMessage = null
        this.uploadedFiles = []
        this.chatHistory = []
        this.currentChatId = null
        this.sidebarOpen = false
        this.selectedProjectId = null
        this.selectedFolderId = null

        // Artifact system state
        this.currentArtifact = null
        this.artifactIsVisible = false
        this.artifactContent = ""
        this.artifactTitle = "Document Artifact"
        this.artifactType = "prd" // prd, strategy, research, etc.

        this.initializeElements()
        this.initializeEventListeners()
        this.checkServerHealth()
        this.loadProjectTree()
        this.loadAvailableProjectsForExport()
        this.loadAvailableModels()
        this.initializeSpeechFeatures()
        this.loadChatHistory()
    }

    initializeElements() {
        // Chat elements
        this.messagesArea = document.getElementById('messages')
        this.messageInput = document.getElementById('message-input')
        this.sendBtn = document.getElementById('send-btn')
        this.typingIndicator = document.getElementById('typing-indicator')
        this.charCount = document.getElementById('char-count')

        // Header elements
        this.connectionStatus = document.getElementById('connection-status')
        this.statusText = document.getElementById('status-text')
        this.exportBtn = document.getElementById('export-btn')
        this.modelSelect = document.getElementById('model-select')

        // Modal elements
        this.exportModal = document.getElementById('export-modal')
        this.successModal = document.getElementById('success-modal')
        this.uploadChoiceModal = document.getElementById('upload-choice-modal')
        this.pasteTextModal = document.getElementById('paste-text-modal')
        this.exportForm = document.getElementById('export-form')
        this.pasteTextForm = document.getElementById('paste-text-form')
        this.docTitle = document.getElementById('doc-title')
        this.projectSelect = document.getElementById('project-select')
        this.docTags = document.getElementById('doc-tags')
        this.planningType = document.getElementById('planning-type')
        this.textFilename = document.getElementById('text-filename')
        this.textContent = document.getElementById('text-content')

        // Speech elements
        this.sttToggle = document.getElementById('stt-toggle')
        this.ttsToggle = document.getElementById('tts-toggle')

        // File upload elements
        this.fileUpload = document.getElementById('file-upload')
        this.fileInput = document.getElementById('file-input')
        this.uploadedFilesContainer = document.getElementById('uploaded-files')

        // Three-panel layout elements
        this.sidebarToggle = document.getElementById('sidebar-toggle')
        this.projectSidebar = document.getElementById('project-sidebar')
        this.detailsPanel = document.getElementById('details-panel')
        this.sidebarOverlay = document.getElementById('sidebar-overlay')
        this.mainContent = document.querySelector('.main-content')

        // Artifact panel elements
        this.artifactPanel = document.getElementById('artifact-panel')
        this.artifactTitle = document.getElementById('artifact-title')
        this.artifactContent = document.getElementById('artifact-content')
        this.artifactStatus = document.getElementById('artifact-status')
        this.downloadArtifactBtn = document.getElementById('download-artifact')
        this.copyArtifactBtn = document.getElementById('copy-artifact')
        this.toggleArtifactBtn = document.getElementById('toggle-artifact')

        // Project tree elements
        this.newProjectBtn = document.getElementById('new-project-btn')
        this.newChatBtn = document.getElementById('new-chat-btn')
        this.projectTree = document.getElementById('project-tree')
        this.treeStatsText = document.getElementById('tree-stats-text')

        // Chat details elements
        this.toggleDetailsBtn = document.getElementById('toggle-details')
        this.chatDetails = document.getElementById('chat-details')

        // Legacy elements (for backward compatibility)
        this.newChatBtn = document.getElementById('new-chat-btn')
        this.clearHistoryBtn = document.getElementById('clear-history-btn')
        this.chatList = document.getElementById('chat-list')
    }

    initializeEventListeners() {
        // Input handlers
        this.messageInput.addEventListener('input', this.handleInputChange.bind(this))
        this.messageInput.addEventListener('keydown', this.handleKeyDown.bind(this))
        this.sendBtn.addEventListener('click', this.sendMessage.bind(this))

        // Export handlers
        this.exportBtn.addEventListener('click', this.openExportModal.bind(this))
        this.exportForm.addEventListener('submit', this.handleExport.bind(this))

        // Modal handlers
        document.getElementById('close-modal').addEventListener('click', this.closeExportModal.bind(this))
        document.getElementById('close-success').addEventListener('click', this.closeSuccessModal.bind(this))
        document.getElementById('cancel-export').addEventListener('click', this.closeExportModal.bind(this))
        document.getElementById('start-new-session').addEventListener('click', this.startNewSession.bind(this))

        // Speech handlers
        this.sttToggle.addEventListener('click', this.toggleSpeechToText.bind(this))
        this.ttsToggle.addEventListener('click', this.toggleTextToSpeech.bind(this))

        // File upload handlers
        this.fileUpload.addEventListener('click', this.showUploadChoiceModal.bind(this))
        this.fileInput.addEventListener('change', this.handleFileUpload.bind(this))

        // Upload choice modal handlers
        document.getElementById('close-upload-choice').addEventListener('click', this.closeUploadChoiceModal.bind(this))
        document.getElementById('choose-file-upload').addEventListener('click', this.chooseFileUpload.bind(this))
        document.getElementById('choose-paste-text').addEventListener('click', this.showPasteTextModal.bind(this))

        // Paste text modal handlers
        document.getElementById('close-paste-text').addEventListener('click', this.closePasteTextModal.bind(this))
        document.getElementById('cancel-paste-text').addEventListener('click', this.closePasteTextModal.bind(this))
        this.pasteTextForm.addEventListener('submit', this.handlePasteText.bind(this))

        // Clipboard paste handlers for screenshots
        document.addEventListener('paste', this.handleClipboardPaste.bind(this))

        // Starting point option handlers
        document.addEventListener('click', this.handleStartingOptionClick.bind(this))

        // Attachment preview handlers (using event delegation)
        this.messagesArea.addEventListener('click', this.handleAttachmentClick.bind(this))

        // Three-panel layout handlers
        this.sidebarToggle.addEventListener('click', this.toggleProjectSidebar.bind(this))
        this.toggleDetailsBtn?.addEventListener('click', this.toggleDetailsPanel.bind(this))
        this.sidebarOverlay?.addEventListener('click', this.closePanels.bind(this))
        this.newProjectBtn?.addEventListener('click', this.createNewProject.bind(this))
        this.newChatBtn?.addEventListener('click', this.createNewChatInProject.bind(this))

        // Artifact panel handlers
        this.toggleArtifactBtn?.addEventListener('click', this.toggleArtifactPanel.bind(this))
        this.downloadArtifactBtn?.addEventListener('click', this.downloadArtifact.bind(this))
        this.copyArtifactBtn?.addEventListener('click', this.copyArtifactToClipboard.bind(this))

        // Legacy sidebar handlers (for backward compatibility)
        this.clearHistoryBtn?.addEventListener('click', this.clearChatHistory.bind(this))

        // Click outside modal to close
        this.exportModal.addEventListener('click', (e) => {
            if (e.target === this.exportModal) this.closeExportModal()
        })
        this.successModal.addEventListener('click', (e) => {
            if (e.target === this.successModal) this.closeSuccessModal()
        })
        this.uploadChoiceModal.addEventListener('click', (e) => {
            if (e.target === this.uploadChoiceModal) this.closeUploadChoiceModal()
        })
        this.pasteTextModal.addEventListener('click', (e) => {
            if (e.target === this.pasteTextModal) this.closePasteTextModal()
        })
    }

    async checkServerHealth() {
        try {
            const response = await fetch('/api/health')
            const health = await response.json()

            if (health.status === 'healthy') {
                this.updateConnectionStatus('online', 'Connected')
                this.isConnected = true
                this.enableExportIfReady()
            } else {
                this.updateConnectionStatus('offline', 'Server issues detected')
            }
        } catch (error) {
            console.error('Health check failed:', error)
            this.updateConnectionStatus('offline', 'Connection failed')
        }
    }

    async loadProjectTree() {
        try {
            const response = await fetch('/api/projects/tree')
            const treeData = await response.json()

            this.renderProjectTree(treeData)
            this.updateTreeStats(treeData)
        } catch (error) {
            console.error('Failed to load project tree:', error)
            this.projectTree.innerHTML = `
                <div class="loading-tree">
                    <span>❌</span> Failed to load projects
                </div>
            `
        }
    }

    async loadAvailableProjectsForExport() {
        try {
            const response = await fetch('/api/projects')
            const projects = await response.json()

            this.projectSelect.innerHTML = '<option value="">Select a project...</option>'
            projects.forEach(project => {
                const option = document.createElement('option')
                option.value = project.id
                option.textContent = project.name || project.title || `Project ${project.id}`
                this.projectSelect.appendChild(option)
            })
        } catch (error) {
            console.error('Failed to load projects for export:', error)
            this.projectSelect.innerHTML = '<option value="">Error loading projects</option>'
        }
    }

    async loadAvailableModels() {
        try {
            const response = await fetch('/api/models')
            const data = await response.json()

            this.modelSelect.innerHTML = ''

            // Add Top Models section first - best overall models across all price points
            const topModels = [
                // Free models
                'meta-llama/llama-3.2-3b-instruct:free',
                'google/gemma-2-9b-it:free',
                // Ultra cheap but excellent value
                'qwen/qwen-2.5-7b-instruct',
                'zhipuai/glm-4-9b-chat',
                // Super cheap but very capable
                'qwen/qwen-2.5-72b-instruct',
                'google/gemma-2-27b-it',
                // Affordable and excellent
                'openai/gpt-4o-mini',
                // Premium - best quality
                'anthropic/claude-3.5-sonnet',
                'openai/gpt-4o'
            ]

            const topModelsGroup = document.createElement('optgroup')
            topModelsGroup.label = '🏆 Top Models - Best Overall'

            topModels.forEach(modelId => {
                const model = data.models.find(m => m.id === modelId)
                if (model) {
                    const option = document.createElement('option')
                    option.value = model.id
                    const priceDisplay = model.pricing === 'Free' ? '(Free)' : '(' + model.pricing + ')'
                    option.textContent = `🏆 ${model.name} ${priceDisplay} - ${model.provider}`
                    option.setAttribute('data-category', 'top-model')
                    topModelsGroup.appendChild(option)
                }
            })
            this.modelSelect.appendChild(topModelsGroup)

            // Get top picks from each category
            const topPicks = data.models.filter(m => m.topPick)

            // Add Top Picks section
            if (topPicks.length > 0) {
                const topPicksGroup = document.createElement('optgroup')
                topPicksGroup.label = '⭐ Top Picks - Best Value per Category'
                topPicks.forEach(model => {
                    const option = document.createElement('option')
                    option.value = model.id
                    option.textContent = `⭐ ${model.name} ${model.pricing === 'Free' ? '(Free)' : '(' + model.pricing + ')'} - ${model.provider}`
                    option.setAttribute('data-category', 'top-pick')
                    topPicksGroup.appendChild(option)
                })
                this.modelSelect.appendChild(topPicksGroup)
            }

            // Group models by category
            const categories = {
                'free': { models: [], label: '🆓 Free Models', emoji: '🆓' },
                'ultra-cheap': { models: [], label: '⚡ Ultra Cheap ($0.02-0.20/1M)', emoji: '⚡' },
                'super-cheap': { models: [], label: '💰 Super Cheap ($0.20-0.60/1M)', emoji: '💰' },
                'affordable': { models: [], label: '💎 Affordable ($0.60-2.00/1M)', emoji: '💎' },
                'mid-tier': { models: [], label: '🌟 Mid-Tier ($2.00-8.00/1M)', emoji: '🌟' },
                'premium': { models: [], label: '👑 Premium ($8.00-20.00/1M)', emoji: '👑' },
                'enterprise': { models: [], label: '🏢 Enterprise ($20.00+/1M)', emoji: '🏢' }
            }

            // Categorize models
            data.models.forEach(model => {
                const category = model.category || 'premium'
                if (categories[category]) {
                    categories[category].models.push(model)
                }
            })

            // Add models by category
            Object.keys(categories).forEach(categoryKey => {
                const category = categories[categoryKey]
                if (category.models.length > 0) {
                    const group = document.createElement('optgroup')
                    group.label = category.label

                    category.models.forEach(model => {
                        const option = document.createElement('option')
                        option.value = model.id
                        option.textContent = `${model.name} ${model.pricing === 'Free' ? '' : '(' + model.pricing + ')'} - ${model.provider}`
                        option.setAttribute('data-category', categoryKey)
                        group.appendChild(option)
                    })

                    this.modelSelect.appendChild(group)
                }
            })

            // Set default model if available
            const defaultModel = 'meta-llama/llama-3.2-3b-instruct:free'
            if (data.models.find(m => m.id === defaultModel)) {
                this.modelSelect.value = defaultModel
            }

        } catch (error) {
            console.error('Failed to load models:', error)
            this.modelSelect.innerHTML = '<option value="">Error loading models</option>'
        }
    }

    updateConnectionStatus(status, text) {
        this.connectionStatus.className = `status-dot ${status}`
        this.statusText.textContent = text
    }

    handleInputChange() {
        const length = this.messageInput.value.length
        this.charCount.textContent = `${length}/4000`

        // Enable/disable send button
        this.sendBtn.disabled = !this.messageInput.value.trim() || this.isStreaming

        // Auto-resize textarea
        this.messageInput.style.height = 'auto'
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px'
    }

    handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            if (!this.sendBtn.disabled) {
                this.sendMessage()
            }
        }
    }

    async sendMessage() {
        const content = this.messageInput.value.trim()
        if (!content || this.isStreaming) return

        // Include uploaded files in the message
        const attachments = this.uploadedFiles.map(file => ({
            id: file.id,
            name: file.name,
            size: file.size,
            type: file.type,
            url: file.url
        }))

        // Create message with content and attachments
        const messageContent = content

        // Add user message with attachments
        this.addMessage('user', messageContent, false, attachments)
        this.messageInput.value = ''
        this.handleInputChange()

        // Clear uploaded files after sending
        this.clearUploadedFiles()

        // Show typing indicator
        this.showTypingIndicator()
        this.isStreaming = true

        try {
            await this.streamResponse()
        } catch (error) {
            console.error('Stream error:', error)
            this.addMessage('assistant', '❌ Sorry, I encountered an error. Please try again.')
            this.hideTypingIndicator()
            this.isStreaming = false
        }
    }

    async streamResponse() {
        const selectedModel = this.modelSelect.value
        const payload = {
            messages: this.messages.map(msg => ({
                role: msg.role,
                content: msg.content
            })),
            options: {
                stream: true,
                temperature: 0.7,
                model: selectedModel || undefined
            }
        }

        try {
            this.currentEventSource = new EventSource('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            })

            // For EventSource, we need to use fetch with streaming
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            })

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }

            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let assistantMessage = ''
            let messageElement = null

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value, { stream: true })
                const lines = chunk.split('\n')

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6))

                            if (data.type === 'connected') {
                                console.log('Stream connected')
                            } else if (data.type === 'chunk') {
                                if (!messageElement) {
                                    this.hideTypingIndicator()
                                    messageElement = this.addMessage('assistant', '', true)
                                }
                                assistantMessage += data.content
                                this.updateMessageContent(messageElement, assistantMessage)
                            } else if (data.type === 'complete') {
                                if (messageElement) {
                                    assistantMessage = data.content
                                    this.updateMessageContent(messageElement, assistantMessage)
                                    this.finalizeMessage(messageElement)
                                }
                            } else if (data.type === 'error') {
                                console.error('Stream error:', data.error)
                                if (!messageElement) {
                                    this.addMessage('assistant', `❌ Error: ${data.error}`)
                                } else {
                                    this.updateMessageContent(messageElement, `❌ Error: ${data.error}`)
                                    this.finalizeMessage(messageElement)
                                }
                            } else if (data.type === 'done') {
                                break
                            }
                        } catch (parseError) {
                            console.error('Failed to parse SSE data:', parseError)
                        }
                    }
                }
            }

            // Update messages array with final assistant response
            if (assistantMessage) {
                this.messages.push({
                    role: 'assistant',
                    content: assistantMessage,
                    timestamp: new Date()
                })

                this.enableExportIfReady()

                // Update chat history with assistant response
                if (this.currentChatId) {
                    setTimeout(() => this.updateCurrentChat(), 500)
                }

                // Text-to-speech if enabled
                if (this.speechSynthesis && this.speechSynthesis.enabled) {
                    this.speakText(assistantMessage)
                }
            }

        } finally {
            this.hideTypingIndicator()
            this.isStreaming = false
            this.sendBtn.disabled = !this.messageInput.value.trim()
            this.scrollToBottom()
        }
    }

    addMessage(role, content, isStreaming = false, attachments = []) {
        // Remove welcome message if it exists
        const welcomeMessage = this.messagesArea.querySelector('.welcome-message')
        if (welcomeMessage) {
            welcomeMessage.remove()
        }

        const messageDiv = document.createElement('div')
        messageDiv.className = `message message-${role}`

        const contentDiv = document.createElement('div')
        contentDiv.className = 'message-content'

        if (isStreaming) {
            contentDiv.innerHTML = this.formatMessageContent(content) + '<span class="cursor">|</span>'
        } else {
            contentDiv.innerHTML = this.formatMessageContent(content)

            // Add attachments if any
            if (attachments && attachments.length > 0) {
                const attachmentsDiv = document.createElement('div')
                attachmentsDiv.className = 'message-attachments'

                attachments.forEach(attachment => {
                    const attachmentDiv = this.createAttachmentPreview(attachment)
                    attachmentsDiv.appendChild(attachmentDiv)
                })

                messageDiv.appendChild(attachmentsDiv)
            }

            // Add to messages array for non-streaming messages
            this.messages.push({
                role,
                content,
                attachments,
                timestamp: new Date()
            })

            // Auto-save chat when new messages are added
            if (role === 'user' && !this.currentChatId) {
                // Create new chat when user starts typing
                setTimeout(() => {
                    if (this.messages.length > 0) {
                        this.createNewChat()
                    }
                }, 1000)
            } else if (this.currentChatId) {
                // Update existing chat
                setTimeout(() => this.updateCurrentChat(), 500)
            }
        }

        messageDiv.appendChild(contentDiv)
        this.messagesArea.appendChild(messageDiv)
        this.scrollToBottom()

        return messageDiv
    }

    updateMessageContent(messageElement, content) {
        const contentDiv = messageElement.querySelector('.message-content')
        contentDiv.innerHTML = this.formatMessageContent(content) + '<span class="cursor">|</span>'
        this.scrollToBottom()
    }

    finalizeMessage(messageElement) {
        const contentDiv = messageElement.querySelector('.message-content')
        const cursorSpan = contentDiv.querySelector('.cursor')
        if (cursorSpan) {
            cursorSpan.remove()
        }
    }

    formatMessageContent(content) {
        // Basic markdown-like formatting
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            .replace(/\n/g, '<br>')
    }

    showTypingIndicator() {
        this.typingIndicator.classList.remove('hidden')
        this.scrollToBottom()
    }

    hideTypingIndicator() {
        this.typingIndicator.classList.add('hidden')
    }

    scrollToBottom() {
        setTimeout(() => {
            this.messagesArea.scrollTop = this.messagesArea.scrollHeight
        }, 10)
    }

    enableExportIfReady() {
        const hasConversation = this.messages.filter(m => m.role === 'assistant').length > 0
        if (hasConversation && this.isConnected) {
            this.exportBtn.disabled = false
            this.exportBtn.title = 'Export your planning session to Archon'
        }
    }

    openExportModal() {
        if (this.messages.length === 0) return

        // Generate default title from first user message
        const firstUserMessage = this.messages.find(m => m.role === 'user')
        if (firstUserMessage) {
            const title = firstUserMessage.content.slice(0, 50).trim()
            this.docTitle.value = title + (firstUserMessage.content.length > 50 ? '...' : '')
        }

        this.exportModal.classList.remove('hidden')
    }

    closeExportModal() {
        this.exportModal.classList.add('hidden')
    }

    closeSuccessModal() {
        this.successModal.classList.add('hidden')
    }

    async handleExport(e) {
        e.preventDefault()

        const title = this.docTitle.value.trim()
        const projectId = this.projectSelect.value
        const tags = this.docTags.value.split(',').map(tag => tag.trim()).filter(Boolean)
        const planningType = this.planningType.value

        if (!title || !projectId) {
            alert('Please fill in all required fields')
            return
        }

        // Generate document content from conversation
        const content = this.generateDocumentContent()

        try {
            const response = await fetch('/api/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title,
                    content,
                    projectId,
                    tags,
                    planningType
                })
            })

            const result = await response.json()

            if (result.success) {
                this.closeExportModal()
                this.showSuccessModal(result)
            } else {
                alert(`Export failed: ${result.error || 'Unknown error'}`)
            }
        } catch (error) {
            console.error('Export error:', error)
            alert('Export failed: Network error')
        }
    }

    generateDocumentContent() {
        const timestamp = new Date().toISOString()
        const userMessages = this.messages.filter(m => m.role === 'user')
        const assistantMessages = this.messages.filter(m => m.role === 'assistant')

        let content = `# Planning Session Export\n\n`
        content += `**Generated:** ${new Date().toLocaleString()}\n`
        content += `**Planning Type:** ${this.planningType.value}\n`
        content += `**Session Length:** ${userMessages.length} exchanges\n\n`

        content += `## Session Overview\n\n`
        if (userMessages.length > 0) {
            content += `**Initial Request:** ${userMessages[0].content.slice(0, 200)}...\n\n`
        }

        content += `## Planning Conversation\n\n`

        this.messages.forEach((message, index) => {
            const role = message.role === 'user' ? '**User**' : '**Planner**'
            content += `### ${role} (${index + 1})\n\n`
            content += `${message.content}\n\n`
            content += `---\n\n`
        })

        content += `## Key Planning Outcomes\n\n`
        content += `*This section should be reviewed and enhanced with specific planning deliverables, requirements identified, and next steps outlined.*\n\n`

        content += `## Recommended Next Steps\n\n`
        content += `*Based on this planning session, outline specific implementation tasks and requirements gathering needs.*\n\n`

        return content
    }

    showSuccessModal(result) {
        document.getElementById('export-source-id').textContent = result.source_id || 'N/A'
        document.getElementById('export-method').textContent = result.method || 'Unknown'
        this.successModal.classList.remove('hidden')
    }

    startNewSession() {
        this.startNewChat()
        this.closeSuccessModal()
    }

    // Speech Recognition Features
    initializeSpeechFeatures() {
        // Check for speech recognition support
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
            this.speechRecognition = new SpeechRecognition()
            this.speechRecognition.continuous = false
            this.speechRecognition.interimResults = true
            this.speechRecognition.lang = 'en-US'

            this.speechRecognition.onresult = (event) => {
                const transcript = Array.from(event.results)
                    .map(result => result[0])
                    .map(result => result.transcript)
                    .join('')

                this.messageInput.value = transcript
                this.handleInputChange()
            }

            this.speechRecognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error)
                this.sttToggle.style.backgroundColor = 'var(--status-offline)'
            }

            this.speechRecognition.onend = () => {
                this.sttToggle.style.backgroundColor = 'transparent'
            }
        } else {
            this.sttToggle.disabled = true
            this.sttToggle.title = 'Speech recognition not supported'
        }

        // Check for speech synthesis support
        if ('speechSynthesis' in window) {
            this.speechSynthesis = {
                enabled: false,
                speaking: false
            }
        } else {
            this.ttsToggle.disabled = true
            this.ttsToggle.title = 'Speech synthesis not supported'
        }
    }

    toggleSpeechToText() {
        if (!this.speechRecognition) return

        if (this.speechRecognition.recording) {
            this.speechRecognition.stop()
            this.sttToggle.style.backgroundColor = 'transparent'
        } else {
            this.speechRecognition.start()
            this.sttToggle.style.backgroundColor = 'var(--status-warning)'
        }
    }

    toggleTextToSpeech() {
        if (!this.speechSynthesis) return

        this.speechSynthesis.enabled = !this.speechSynthesis.enabled
        this.ttsToggle.style.backgroundColor = this.speechSynthesis.enabled
            ? 'var(--planning-primary)'
            : 'transparent'

        if (this.speechSynthesis.enabled) {
            this.ttsToggle.title = 'Text-to-Speech enabled'
        } else {
            this.ttsToggle.title = 'Text-to-Speech disabled'
            window.speechSynthesis.cancel() // Stop current speech
        }
    }

    speakText(text) {
        if (!this.speechSynthesis || !this.speechSynthesis.enabled) return

        // Clean text for speech
        const cleanText = text
            .replace(/[*_`#]/g, '') // Remove markdown
            .replace(/\[(.*?)\]/g, '$1') // Remove brackets
            .replace(/\((.*?)\)/g, '') // Remove parentheses
            .slice(0, 500) // Limit length

        const utterance = new SpeechSynthesisUtterance(cleanText)
        utterance.rate = 1.0
        utterance.pitch = 1.0
        utterance.volume = 0.8

        window.speechSynthesis.speak(utterance)
    }

    // File Upload Methods
    handleFileUpload(event) {
        const files = Array.from(event.target.files)

        files.forEach(file => {
            if (this.isValidFile(file)) {
                this.addFileToUploadQueue(file)
            }
        })

        // Clear the input so the same file can be selected again
        event.target.value = ''
    }

    isValidFile(file) {
        const maxSize = 10 * 1024 * 1024 // 10MB
        const allowedTypes = [
            // Images
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff', 'image/svg+xml',

            // Documents
            'application/pdf',

            // Text files
            'text/plain', 'text/markdown', 'text/csv', 'text/tab-separated-values', 'text/html', 'text/xml', 'text/rtf',

            // Microsoft Office
            'application/msword', // .doc
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
            'application/vnd.ms-excel', // .xls
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-powerpoint', // .ppt
            'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx

            // OpenDocument formats
            'application/vnd.oasis.opendocument.text', // .odt
            'application/vnd.oasis.opendocument.spreadsheet', // .ods
            'application/vnd.oasis.opendocument.presentation', // .odp

            // Other formats
            'application/json', // .json
            'application/xml', // .xml
            'application/zip', // .zip (for document packages)
            'application/x-zip-compressed', // .zip alternative
            'application/vnd.rar', // .rar
            'application/x-7z-compressed', // .7z

            // Code files
            'text/javascript', 'application/javascript', // .js
            'text/typescript', 'application/typescript', // .ts
            'text/css', // .css
            'text/html', // .html
            'application/x-python', 'text/x-python', // .py
            'text/x-java-source', // .java
            'text/x-c', 'text/x-c++', // .c, .cpp
            'text/x-csharp', // .cs
            'application/x-php', // .php
            'application/x-ruby', // .rb
            'text/x-go', // .go
            'application/x-rust', // .rs

            // Various text formats
            'text/comma-separated-values', // .csv alternative
            'application/csv', // .csv alternative
            'text/tsv', // .tsv
            'application/vnd.ms-excel.sheet.macroEnabled.12', // .xlsm
            'text/yaml', 'application/x-yaml', // .yml, .yaml
            'application/toml', // .toml
            'application/x-ini', // .ini
            'text/x-log', // .log

            // Fallback for unknown MIME types
            'application/octet-stream' // Generic binary type (we'll check extension)
        ]

        // Get file extension
        const extension = file.name.toLowerCase().split('.').pop()
        const allowedExtensions = [
            // Images
            'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'svg',
            // Documents
            'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp',
            // Text & Code
            'txt', 'md', 'csv', 'tsv', 'html', 'htm', 'xml', 'rtf', 'json',
            'js', 'ts', 'css', 'py', 'java', 'c', 'cpp', 'cs', 'php', 'rb', 'go', 'rs',
            'yml', 'yaml', 'toml', 'ini', 'log', 'config', 'conf',
            // Archives
            'zip', 'rar', '7z'
        ]

        if (file.size > maxSize) {
            alert(`File "${file.name}" is too large. Maximum size is 10MB.`)
            return false
        }

        // Check by MIME type first, then fallback to extension check
        if (allowedTypes.includes(file.type)) {
            return true
        }

        // If MIME type is application/octet-stream or unknown, check by file extension
        if (file.type === 'application/octet-stream' || file.type === '') {
            if (allowedExtensions.includes(extension)) {
                return true
            }
        }

        alert(`File type "${file.type}" (${file.name}) is not supported. Supported formats: ${allowedExtensions.join(', ')}.`)
        return false
    }

    addFileToUploadQueue(file) {
        const fileId = Date.now() + '_' + Math.random().toString(36).substr(2, 9)

        const fileData = {
            id: fileId,
            file: file,
            name: file.name,
            size: file.size,
            type: file.type,
            uploaded: false,
            url: null
        }

        this.uploadedFiles.push(fileData)
        this.displayUploadedFile(fileData)
        this.uploadFileToServer(fileData)
    }

    displayUploadedFile(fileData) {
        this.uploadedFilesContainer.classList.remove('hidden')

        const filePreview = document.createElement('div')
        filePreview.className = 'file-preview'
        filePreview.setAttribute('data-file-id', fileData.id)

        // Create preview content
        if (fileData.type.startsWith('image/')) {
            const img = document.createElement('img')
            img.src = URL.createObjectURL(fileData.file)
            img.onload = () => URL.revokeObjectURL(img.src)
            filePreview.appendChild(img)
        } else {
            const icon = document.createElement('div')
            icon.className = 'file-icon'
            icon.textContent = this.getFileIcon(fileData.type)
            filePreview.appendChild(icon)
        }

        const fileInfo = document.createElement('div')
        fileInfo.className = 'file-info'

        const fileName = document.createElement('div')
        fileName.className = 'file-name'
        fileName.textContent = fileData.name

        const fileSize = document.createElement('div')
        fileSize.className = 'file-size'
        fileSize.textContent = this.formatFileSize(fileData.size)

        fileInfo.appendChild(fileName)
        fileInfo.appendChild(fileSize)

        const removeBtn = document.createElement('button')
        removeBtn.className = 'remove-file'
        removeBtn.innerHTML = '×'
        removeBtn.onclick = (e) => {
            e.stopPropagation() // Prevent triggering the preview click
            this.removeFile(fileData.id)
        }

        // Add click handler for preview functionality
        filePreview.onclick = (e) => {
            // Don't trigger preview if clicking the remove button
            if (e.target.classList.contains('remove-file')) return
            this.previewUploadedFile(fileData)
        }
        filePreview.style.cursor = 'pointer'
        filePreview.title = 'Click to preview'

        filePreview.appendChild(fileInfo)
        filePreview.appendChild(removeBtn)

        this.uploadedFilesContainer.appendChild(filePreview)
    }

    getFileIcon(fileType) {
        // Images
        if (fileType.startsWith('image/')) return '🖼️'

        // PDFs
        if (fileType.includes('pdf')) return '📄'

        // Microsoft Office Documents
        if (fileType.includes('word') || fileType.includes('opendocument.text')) return '📄'

        // Spreadsheets
        if (fileType.includes('excel') || fileType.includes('spreadsheet') || fileType.includes('csv')) return '📊'

        // Presentations
        if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📽️'

        // Code files
        if (fileType.includes('javascript') || fileType.includes('typescript') ||
            fileType.includes('python') || fileType.includes('java') ||
            fileType.includes('c++') || fileType.includes('csharp') ||
            fileType.includes('php') || fileType.includes('ruby') ||
            fileType.includes('go') || fileType.includes('rust')) return '💻'

        // Markup and web files
        if (fileType.includes('html') || fileType.includes('xml') || fileType.includes('css')) return '🌐'

        // Data and config files
        if (fileType.includes('json') || fileType.includes('yaml') ||
            fileType.includes('toml') || fileType.includes('ini')) return '⚙️'

        // Archives
        if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) return '🗜️'

        // Markdown
        if (fileType.includes('markdown')) return '📝'

        // Plain text and others
        if (fileType.includes('text')) return '📝'

        // Default
        return '📎'
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    async uploadFileToServer(fileData) {
        try {
            const formData = new FormData()
            formData.append('file', fileData.file)

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            })

            if (response.ok) {
                const result = await response.json()
                fileData.uploaded = true
                fileData.url = result.url
                console.log('File uploaded successfully:', result)
            } else {
                throw new Error('Upload failed')
            }
        } catch (error) {
            console.error('File upload error:', error)
            // For now, we'll keep the file in the queue even if upload fails
            // In a real implementation, you might want to show an error state
        }
    }

    removeFile(fileId) {
        // Remove from uploaded files array
        this.uploadedFiles = this.uploadedFiles.filter(f => f.id !== fileId)

        // Remove from UI
        const filePreview = this.uploadedFilesContainer.querySelector(`[data-file-id="${fileId}"]`)
        if (filePreview) {
            filePreview.remove()
        }

        // Hide container if no files
        if (this.uploadedFiles.length === 0) {
            this.uploadedFilesContainer.classList.add('hidden')
        }
    }

    clearUploadedFiles() {
        // Clear the array
        this.uploadedFiles = []

        // Clear the UI
        this.uploadedFilesContainer.innerHTML = ''
        this.uploadedFilesContainer.classList.add('hidden')
    }

    createAttachmentPreview(attachment) {
        const attachmentDiv = document.createElement('div')
        attachmentDiv.className = 'attachment-preview'
        attachmentDiv.setAttribute('data-attachment-id', attachment.id)

        // Make it clickable for preview (handled by event delegation)
        attachmentDiv.style.cursor = 'pointer'
        attachmentDiv.title = 'Click to preview'

        // Create preview content
        if (attachment.type.startsWith('image/')) {
            const img = document.createElement('img')
            img.src = attachment.url || URL.createObjectURL(attachment.file || new Blob())
            img.className = 'attachment-image'
            attachmentDiv.appendChild(img)
        } else {
            const icon = document.createElement('div')
            icon.className = 'attachment-icon'
            icon.textContent = this.getFileIcon(attachment.type)
            attachmentDiv.appendChild(icon)
        }

        const attachmentInfo = document.createElement('div')
        attachmentInfo.className = 'attachment-info'

        const fileName = document.createElement('div')
        fileName.className = 'attachment-name'
        fileName.textContent = attachment.name

        const fileSize = document.createElement('div')
        fileSize.className = 'attachment-size'
        fileSize.textContent = this.formatFileSize(attachment.size)

        attachmentInfo.appendChild(fileName)
        attachmentInfo.appendChild(fileSize)
        attachmentDiv.appendChild(attachmentInfo)

        return attachmentDiv
    }

    previewUploadedFile(fileData) {
        // Convert fileData to attachment format for preview
        const attachment = {
            id: fileData.id,
            name: fileData.name,
            size: fileData.size,
            type: fileData.type,
            file: fileData.file, // Include the raw file for blob URL creation
            url: fileData.url // May be null if not uploaded yet
        }

        if (attachment.type.startsWith('image/')) {
            // Create modal for image preview
            this.showImagePreview(attachment)
        } else {
            // For non-images, show file details or try to open
            this.showFilePreview(attachment)
        }
    }

    previewAttachment(attachment) {
        if (attachment.type.startsWith('image/')) {
            // Create modal for image preview
            this.showImagePreview(attachment)
        } else {
            // For non-images, show file details or try to open
            this.showFilePreview(attachment)
        }
    }

    showImagePreview(attachment) {
        // Create image preview modal
        const modal = document.createElement('div')
        modal.className = 'image-preview-modal'
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            cursor: pointer;
        `

        const img = document.createElement('img')
        img.src = attachment.url || URL.createObjectURL(attachment.file || new Blob())
        img.style.cssText = `
            max-width: 90%;
            max-height: 90%;
            object-fit: contain;
            border-radius: 8px;
        `

        modal.appendChild(img)
        modal.onclick = () => modal.remove()

        document.body.appendChild(modal)
    }

    showFilePreview(attachment) {
        // Create file info modal
        const modal = document.createElement('div')
        modal.className = 'file-preview-modal'
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--background);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 20px;
            z-index: 1000;
            min-width: 300px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        `

        const content = document.createElement('div')
        content.innerHTML = `
            <h3 style="margin: 0 0 10px 0;">File Details</h3>
            <p><strong>Name:</strong> ${attachment.name}</p>
            <p><strong>Size:</strong> ${this.formatFileSize(attachment.size)}</p>
            <p><strong>Type:</strong> ${attachment.type}</p>
            <div style="margin-top: 15px; text-align: right;">
                <button onclick="this.parentElement.parentElement.parentElement.remove()"
                        style="padding: 8px 16px; background: var(--primary); color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Close
                </button>
            </div>
        `

        modal.appendChild(content)

        // Add overlay
        const overlay = document.createElement('div')
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 999;
        `
        overlay.onclick = () => {
            modal.remove()
            overlay.remove()
        }

        document.body.appendChild(overlay)
        document.body.appendChild(modal)
    }

    // Sidebar Management Methods
    toggleSidebar() {
        this.sidebarOpen = !this.sidebarOpen

        if (this.sidebarOpen) {
            this.chatSidebar.classList.remove('hidden')
            this.sidebarOverlay.classList.remove('hidden')
            this.mainContent.classList.add('sidebar-open')
        } else {
            this.closeSidebar()
        }
    }

    closeSidebar() {
        this.sidebarOpen = false
        this.chatSidebar.classList.add('hidden')
        this.sidebarOverlay.classList.add('hidden')
        this.mainContent.classList.remove('sidebar-open')
    }

    // Chat History Management Methods
    loadChatHistory() {
        try {
            const stored = localStorage.getItem('ce-hub-chat-history')
            this.chatHistory = stored ? JSON.parse(stored) : []
            this.renderChatHistory()
        } catch (error) {
            console.error('Failed to load chat history:', error)
            this.chatHistory = []
        }
    }

    saveChatHistory() {
        try {
            localStorage.setItem('ce-hub-chat-history', JSON.stringify(this.chatHistory))
        } catch (error) {
            console.error('Failed to save chat history:', error)
        }
    }

    createNewChat() {
        const chatId = 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
        const firstMessage = this.messages.find(m => m.role === 'user')

        const chat = {
            id: chatId,
            title: this.generateChatTitle(firstMessage?.content || 'New Chat'),
            messages: [...this.messages],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }

        this.chatHistory.unshift(chat)
        this.currentChatId = chatId
        this.saveChatHistory()
        this.renderChatHistory()
        return chat
    }

    updateCurrentChat() {
        if (!this.currentChatId || this.messages.length === 0) return

        const chatIndex = this.chatHistory.findIndex(c => c.id === this.currentChatId)
        if (chatIndex !== -1) {
            const firstMessage = this.messages.find(m => m.role === 'user')
            this.chatHistory[chatIndex] = {
                ...this.chatHistory[chatIndex],
                title: this.generateChatTitle(firstMessage?.content || 'Chat'),
                messages: [...this.messages],
                updatedAt: new Date().toISOString()
            }
            this.saveChatHistory()
            this.renderChatHistory()
        }
    }

    generateChatTitle(content) {
        if (!content) return 'New Chat'

        // Clean and truncate the content for title
        const cleaned = content
            .replace(/[*_`#]/g, '') // Remove markdown
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim()

        return cleaned.length > 40 ? cleaned.substring(0, 40) + '...' : cleaned
    }

    loadChat(chatId) {
        const chat = this.chatHistory.find(c => c.id === chatId)
        if (!chat) return

        this.currentChatId = chatId
        this.messages = [...chat.messages]
        this.renderMessages()
        this.renderChatHistory() // Update active state
        this.closeSidebar()
        this.enableExportIfReady()
    }

    renderMessages() {
        // Clear current messages
        this.messagesArea.innerHTML = ''

        if (this.messages.length === 0) {
            this.messagesArea.innerHTML = `
                <div class="welcome-message">
                    <div class="welcome-icon">🎯</div>
                    <h2>Welcome to CE-Hub Planner Chat</h2>
                    <p>I'm your specialized planning and research assistant. I help you:</p>
                    <ul>
                        <li>🔍 <strong>Strategic Planning</strong> - Break down complex projects into actionable phases</li>
                        <li>📚 <strong>Research Synthesis</strong> - Organize knowledge and identify information gaps</li>
                        <li>🏗️ <strong>Agent Development Planning</strong> - Design agent capabilities and workflows</li>
                        <li>📋 <strong>Knowledge Organization</strong> - Structure requirements and decision documentation</li>
                    </ul>
                    <div class="planning-constraint">
                        <strong>⚠️ Planning Focus:</strong> I specialize in planning and research only - I don't implement or write code, but I'll help you create comprehensive plans for implementation.
                    </div>
                    <p>Start by describing what you'd like to plan or research, and I'll guide you through the process!</p>
                </div>
            `
            return
        }

        // Render all messages
        this.messages.forEach(message => {
            this.addMessageToDOM(message.role, message.content)
        })

        this.scrollToBottom()
    }

    addMessageToDOM(role, content) {
        const messageDiv = document.createElement('div')
        messageDiv.className = `message message-${role}`

        const contentDiv = document.createElement('div')
        contentDiv.className = 'message-content'
        contentDiv.innerHTML = this.formatMessageContent(content)

        messageDiv.appendChild(contentDiv)
        this.messagesArea.appendChild(messageDiv)
    }

    renderChatHistory() {
        this.chatList.innerHTML = ''

        if (this.chatHistory.length === 0) {
            this.chatList.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 2rem;">No chat history yet</div>'
            return
        }

        this.chatHistory.forEach(chat => {
            const chatItem = document.createElement('div')
            chatItem.className = `chat-item ${chat.id === this.currentChatId ? 'active' : ''}`
            chatItem.onclick = () => this.loadChat(chat.id)

            const title = document.createElement('div')
            title.className = 'chat-item-title'
            title.textContent = chat.title

            const preview = document.createElement('div')
            preview.className = 'chat-item-preview'
            const lastMessage = chat.messages[chat.messages.length - 1]
            if (lastMessage) {
                const previewText = lastMessage.content.replace(/[*_`#]/g, '').substring(0, 60)
                preview.textContent = previewText + (lastMessage.content.length > 60 ? '...' : '')
            }

            const time = document.createElement('div')
            time.className = 'chat-item-time'
            time.textContent = this.formatChatTime(chat.updatedAt)

            chatItem.appendChild(title)
            chatItem.appendChild(preview)
            chatItem.appendChild(time)

            this.chatList.appendChild(chatItem)
        })
    }

    formatChatTime(isoString) {
        const date = new Date(isoString)
        const now = new Date()
        const diffMs = now - date
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMins / 60)
        const diffDays = Math.floor(diffHours / 24)

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffDays < 7) return `${diffDays}d ago`

        return date.toLocaleDateString()
    }

    startNewChat() {
        // Save current chat if it has messages
        if (this.messages.length > 0 && !this.currentChatId) {
            this.createNewChat()
        }

        // Start fresh
        this.currentChatId = null
        this.messages = []
        this.renderMessages()
        this.renderChatHistory()
        this.closeSidebar()
        this.exportBtn.disabled = true
        this.exportBtn.title = 'Complete your planning session to export'
    }

    clearChatHistory() {
        if (confirm('Are you sure you want to clear all chat history? This cannot be undone.')) {
            this.chatHistory = []
            this.currentChatId = null
            this.saveChatHistory()
            this.renderChatHistory()
        }
    }

    // Project Tree Methods
    renderProjectTree(treeData) {
        if (!this.projectTree) return

        this.projectTree.innerHTML = ''

        if (!treeData.projects || treeData.projects.length === 0) {
            this.projectTree.innerHTML = `
                <div class="loading-tree">
                    <span>📁</span> No projects found
                </div>
            `
            return
        }

        treeData.projects.forEach(project => {
            const projectElement = this.createProjectElement(project)
            this.projectTree.appendChild(projectElement)
        })
    }

    createProjectElement(project) {
        const projectDiv = document.createElement('div')
        projectDiv.className = 'project-item'
        projectDiv.setAttribute('data-project-id', project.id)

        const projectHeader = document.createElement('div')
        projectHeader.className = 'project-header'
        projectHeader.onclick = () => this.toggleProject(project.id)

        // Add drop zone functionality
        this.addDropZoneHandlers(projectHeader, project.id, null)

        const projectIcon = document.createElement('span')
        projectIcon.className = 'project-icon'
        projectIcon.textContent = '📁'

        const projectTitle = document.createElement('span')
        projectTitle.textContent = project.title

        projectHeader.appendChild(projectIcon)
        projectHeader.appendChild(projectTitle)
        projectDiv.appendChild(projectHeader)

        // Add folders
        if (project.folders && project.folders.length > 0) {
            const foldersDiv = document.createElement('div')
            foldersDiv.className = 'project-folders'
            foldersDiv.style.display = 'none'

            project.folders.forEach(folder => {
                const folderElement = this.createFolderElement(project.id, folder)
                foldersDiv.appendChild(folderElement)
            })

            projectDiv.appendChild(foldersDiv)
        }

        // Add root chats
        if (project.chats && project.chats.length > 0) {
            const chatsDiv = document.createElement('div')
            chatsDiv.className = 'project-folders'
            chatsDiv.style.display = 'none'

            project.chats.forEach(chat => {
                const chatElement = this.createChatElement(project.id, null, chat)
                chatsDiv.appendChild(chatElement)
            })

            projectDiv.appendChild(chatsDiv)
        }

        return projectDiv
    }

    createFolderElement(projectId, folder) {
        const folderDiv = document.createElement('div')
        folderDiv.className = 'folder-item'
        folderDiv.setAttribute('data-folder-id', folder.id)
        folderDiv.textContent = `📂 ${folder.name}`
        folderDiv.onclick = () => this.toggleFolder(projectId, folder.id)

        // Add drop zone functionality
        this.addDropZoneHandlers(folderDiv, projectId, folder.id)

        if (folder.chats && folder.chats.length > 0) {
            const chatsDiv = document.createElement('div')
            chatsDiv.className = 'folder-chats'
            chatsDiv.style.display = 'none'

            folder.chats.forEach(chat => {
                const chatElement = this.createChatElement(projectId, folder.id, chat)
                chatsDiv.appendChild(chatElement)
            })

            folderDiv.appendChild(chatsDiv)
        }

        return folderDiv
    }

    createChatElement(projectId, folderId, chat) {
        const chatDiv = document.createElement('div')
        chatDiv.className = `chat-item-tree ${chat.exported ? 'exported' : ''}`
        chatDiv.setAttribute('data-chat-id', chat.id)
        chatDiv.setAttribute('data-project-id', projectId)
        chatDiv.setAttribute('data-folder-id', folderId || '')
        chatDiv.setAttribute('draggable', 'true')
        chatDiv.textContent = chat.title
        chatDiv.onclick = () => this.selectChat(projectId, folderId, chat)

        // Add drag & drop event listeners
        this.addDragDropHandlers(chatDiv, chat)

        return chatDiv
    }

    toggleProject(projectId) {
        const projectElement = document.querySelector(`[data-project-id="${projectId}"]`)
        if (!projectElement) return

        const foldersDiv = projectElement.querySelector('.project-folders')
        if (!foldersDiv) return

        const isExpanded = projectElement.classList.contains('expanded')

        if (isExpanded) {
            projectElement.classList.remove('expanded')
            foldersDiv.style.display = 'none'
        } else {
            projectElement.classList.add('expanded')
            foldersDiv.style.display = 'block'
        }

        // Update selection
        this.selectProject(projectId)
    }

    toggleFolder(projectId, folderId) {
        const folderElement = document.querySelector(`[data-folder-id="${folderId}"]`)
        if (!folderElement) return

        const chatsDiv = folderElement.querySelector('.folder-chats')
        if (!chatsDiv) return

        const isExpanded = folderElement.classList.contains('active')

        if (isExpanded) {
            folderElement.classList.remove('active')
            chatsDiv.style.display = 'none'
        } else {
            folderElement.classList.add('active')
            chatsDiv.style.display = 'block'
        }

        // Update selection
        this.selectFolder(projectId, folderId)
    }

    selectChat(projectId, folderId, chat) {
        // Clear current active chat
        document.querySelectorAll('.chat-item-tree.active').forEach(el =>
            el.classList.remove('active')
        )

        // Mark this chat as active
        const chatElement = document.querySelector(`[data-chat-id="${chat.id}"]`)
        if (chatElement) {
            chatElement.classList.add('active')
        }

        // Load chat content and open in main chat window
        this.openChatInMainWindow(chat)

        // Update chat details panel
        this.updateChatDetails(chat)
    }

    async loadChatFromServer(chatId) {
        try {
            const response = await fetch(`/api/chats/${chatId}`)
            const chatData = await response.json()

            if (chatData.success) {
                // Convert server chat format to local format if needed
                this.currentChatId = chatId
                // For now, we'll keep the existing local chat system
                // In a full implementation, you'd integrate this with the server-side chats
            }
        } catch (error) {
            console.error('Failed to load chat from server:', error)
        }
    }

    openChatInMainWindow(chat) {
        // Clear current messages and start fresh for the selected chat
        this.currentChatId = chat.id
        this.messages = []

        // Clear the main chat area and show the proper welcome message with starting points
        this.messagesArea.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-icon">🎯</div>
                <h2>Welcome to CE-Hub Planner Chat</h2>
                <p>I'm your specialized planning and research assistant. I help you:</p>
                <ul>
                    <li>🔍 <strong>Strategic Planning</strong> - Break down complex projects into actionable phases</li>
                    <li>📚 <strong>Research Synthesis</strong> - Organize knowledge and identify information gaps</li>
                    <li>🏗️ <strong>Agent Development Planning</strong> - Design agent capabilities and workflows</li>
                    <li>📋 <strong>Knowledge Organization</strong> - Structure requirements and decision documentation</li>
                </ul>
                <div class="planning-constraint">
                    <strong>⚠️ Planning Focus:</strong> I specialize in planning and research only - I don't implement or write code, but I'll help you create comprehensive plans for implementation.
                </div>
                <div class="starting-points">
                    <p><strong>How would you like to start?</strong></p>
                    <div class="start-options">
                        <div class="start-option">💭 <strong>Spitball ideas</strong> - brainstorm from scratch</div>
                        <div class="start-option">📄 <strong>Upload existing documents</strong> - you already have materials</div>
                        <div class="start-option">💡 <strong>Use inspiration</strong> - base it on something you've seen</div>
                        <div class="start-option">💬 <strong>Just chat through it</strong> - discuss and iterate conversationally</div>
                    </div>
                </div>
                <p>Tell me what you'd like to plan and which approach sounds right!</p>
                <div class="chat-info-summary">
                    <div class="info-item">
                        <strong>Chat:</strong> ${chat.title}
                    </div>
                    <div class="info-item">
                        <strong>Project:</strong> ${chat.projectId}
                    </div>
                    <div class="info-item">
                        <strong>Status:</strong> ${chat.exported ? '✅ Exported' : '❌ Not Exported'}
                    </div>
                </div>
            </div>
        `

        // Enable export button if this chat has content
        if (chat.messageCount > 0) {
            this.enableExportIfReady()
        } else {
            this.exportBtn.disabled = true
            this.exportBtn.title = 'Complete your planning session to export'
        }

        // Update the chat history to reflect this as the current chat
        this.renderChatHistory()
    }

    updateChatDetails(chat) {
        if (!this.chatDetails) return

        this.chatDetails.innerHTML = `
            <div class="chat-info">
                <h4>${chat.title}</h4>
                <div class="chat-meta-compact">
                    <span class="meta-item-compact">
                        <strong>Updated:</strong> ${new Date(chat.lastUpdated).toLocaleDateString()}
                    </span>
                    <span class="meta-item-compact">
                        <strong>Messages:</strong> ${chat.messageCount || 0}
                    </span>
                    <span class="meta-item-compact">
                        <strong>Words:</strong> ${chat.wordCount || 0}
                    </span>
                    <span class="meta-item-compact">
                        <strong>Status:</strong>
                        <span class="${chat.exported ? 'exported' : 'not-exported'}">
                            ${chat.exported ? '✅ Exported' : '❌ Not Exported'}
                        </span>
                    </span>
                    ${chat.archonSourceId ? `
                        <span class="meta-item-compact">
                            <strong>Archon ID:</strong> <code>${chat.archonSourceId}</code>
                        </span>
                    ` : ''}
                </div>
            </div>
        `
    }

    updateTreeStats(treeData) {
        if (!this.treeStatsText || !treeData.stats) return

        const stats = treeData.stats
        this.treeStatsText.textContent =
            `${stats.totalProjects} projects, ${stats.totalChats} chats`
    }

    // Three-panel layout methods
    toggleProjectSidebar() {
        if (!this.projectSidebar) return

        const isHidden = this.projectSidebar.classList.contains('hidden')

        if (isHidden) {
            this.projectSidebar.classList.remove('hidden')
            if (window.innerWidth <= 768) {
                this.showOverlay()
            }
        } else {
            this.projectSidebar.classList.add('hidden')
            this.hideOverlay()
        }
    }

    toggleDetailsPanel() {
        if (!this.detailsPanel) return

        const isHidden = this.detailsPanel.classList.contains('hidden')

        if (isHidden) {
            this.detailsPanel.classList.remove('hidden')
            if (window.innerWidth <= 768) {
                this.showOverlay()
            }
        } else {
            this.detailsPanel.classList.add('hidden')
            this.hideOverlay()
        }
    }

    closePanels() {
        if (window.innerWidth <= 768) {
            this.projectSidebar?.classList.add('hidden')
            this.detailsPanel?.classList.add('hidden')
            this.hideOverlay()
        }
    }

    showOverlay() {
        if (this.sidebarOverlay) {
            this.sidebarOverlay.classList.remove('hidden')
            this.sidebarOverlay.classList.add('show')
        }
    }

    hideOverlay() {
        if (this.sidebarOverlay) {
            this.sidebarOverlay.classList.remove('show')
            this.sidebarOverlay.classList.add('hidden')
        }
    }

    async createNewProject() {
        const projectTitle = prompt('Enter project title:')
        if (!projectTitle) return

        try {
            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: projectTitle
                })
            })

            const result = await response.json()

            if (result.success) {
                // Reload project tree
                this.loadProjectTree()
                console.log('Project created successfully:', result.project)
            } else {
                alert(`Failed to create project: ${result.error}`)
            }
        } catch (error) {
            console.error('Failed to create project:', error)
            alert('Failed to create project: Network error')
        }
    }

    // Legacy sidebar methods (for backward compatibility)
    toggleSidebar() {
        this.toggleProjectSidebar()
    }

    closeSidebar() {
        this.closePanels()
    }

    // Drag & Drop Methods
    addDragDropHandlers(chatElement, chat) {
        chatElement.addEventListener('dragstart', (e) => {
            this.handleDragStart(e, chat)
        })

        chatElement.addEventListener('dragend', (e) => {
            this.handleDragEnd(e)
        })
    }

    addDropZoneHandlers(element, projectId, folderId) {
        element.addEventListener('dragover', (e) => {
            e.preventDefault()
            this.handleDragOver(e, element)
        })

        element.addEventListener('dragleave', (e) => {
            this.handleDragLeave(e, element)
        })

        element.addEventListener('drop', (e) => {
            e.preventDefault()
            this.handleDrop(e, projectId, folderId, element)
        })
    }

    handleDragStart(e, chat) {
        this.draggedChat = chat
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/html', e.target.outerHTML)
        e.target.classList.add('dragging')

        // Store original location for potential cancellation
        this.draggedChatOriginal = {
            projectId: e.target.getAttribute('data-project-id'),
            folderId: e.target.getAttribute('data-folder-id') || null
        }
    }

    handleDragEnd(e) {
        e.target.classList.remove('dragging')
        this.clearDragIndicators()
        this.draggedChat = null
        this.draggedChatOriginal = null
    }

    handleDragOver(e, element) {
        e.preventDefault()
        if (!this.draggedChat) return

        element.classList.add('drag-over')
    }

    handleDragLeave(e, element) {
        // Only remove drag-over if we're actually leaving the element
        if (!element.contains(e.relatedTarget)) {
            element.classList.remove('drag-over')
        }
    }

    async handleDrop(e, targetProjectId, targetFolderId, element) {
        e.preventDefault()
        element.classList.remove('drag-over')

        if (!this.draggedChat) return

        const sourceProjectId = this.draggedChatOriginal.projectId
        const sourceFolderId = this.draggedChatOriginal.folderId

        // Don't do anything if dropping in the same location
        if (sourceProjectId === targetProjectId && sourceFolderId === targetFolderId) {
            return
        }

        try {
            const response = await fetch(`/api/chats/${this.draggedChat.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    projectId: targetProjectId,
                    folderPath: targetFolderId ? `folders/${targetFolderId}` : undefined
                })
            })

            const result = await response.json()

            if (result.success) {
                // Reload project tree to reflect changes
                this.loadProjectTree()
                console.log('Chat moved successfully:', result.chat)
            } else {
                alert(`Failed to move chat: ${result.error}`)
            }
        } catch (error) {
            console.error('Failed to move chat:', error)
            alert('Failed to move chat: Network error')
        }
    }

    clearDragIndicators() {
        document.querySelectorAll('.drag-over').forEach(el => {
            el.classList.remove('drag-over')
        })

        document.querySelectorAll('.drag-indicator').forEach(el => {
            el.remove()
        })
    }

    // Project/Folder Selection Methods
    selectProject(projectId) {
        this.selectedProjectId = projectId
        this.selectedFolderId = null
        this.showNewChatButton()
    }

    selectFolder(projectId, folderId) {
        this.selectedProjectId = projectId
        this.selectedFolderId = folderId
        this.showNewChatButton()
    }

    showNewChatButton() {
        if (this.newChatBtn && this.selectedProjectId) {
            this.newChatBtn.classList.remove('hidden')
            this.newChatBtn.title = this.selectedFolderId
                ? `New Chat in ${this.selectedFolderId} folder`
                : `New Chat in ${this.selectedProjectId} project`
        }
    }

    hideNewChatButton() {
        if (this.newChatBtn) {
            this.newChatBtn.classList.add('hidden')
        }
    }

    async createNewChatInProject() {
        if (!this.selectedProjectId) {
            alert('Please select a project first')
            return
        }

        const chatTitle = prompt('Enter chat title:')
        if (!chatTitle) return

        try {
            const requestBody = {
                title: chatTitle,
                projectId: this.selectedProjectId,
                content: ''
            }

            // Add folder path if a folder is selected
            if (this.selectedFolderId) {
                requestBody.folderPath = `folders/${this.selectedFolderId}`
            }

            const response = await fetch('/api/chats', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            })

            const result = await response.json()

            if (result.success) {
                // Reload project tree to show new chat
                this.loadProjectTree()

                // Clear current chat and start fresh for the new chat
                this.currentChatId = null
                this.messages = []
                this.renderMessages()

                console.log('Chat created successfully:', result.chat)
            } else {
                alert(`Failed to create chat: ${result.error}`)
            }
        } catch (error) {
            console.error('Failed to create chat:', error)
            alert('Failed to create chat: Network error')
        }
    }

    // Upload Choice Modal Methods
    showUploadChoiceModal() {
        this.uploadChoiceModal.classList.remove('hidden')
    }

    closeUploadChoiceModal() {
        this.uploadChoiceModal.classList.add('hidden')
    }

    chooseFileUpload() {
        this.closeUploadChoiceModal()
        this.fileInput.click()
    }

    showPasteTextModal() {
        this.closeUploadChoiceModal()
        this.textFilename.value = ''
        this.textContent.value = ''
        this.pasteTextModal.classList.remove('hidden')
        this.textContent.focus()
    }

    closePasteTextModal() {
        this.pasteTextModal.classList.add('hidden')
    }

    async handlePasteText(e) {
        e.preventDefault()

        const filename = this.textFilename.value.trim() || 'pasted-text.txt'
        const content = this.textContent.value.trim()

        if (!content) {
            alert('Please enter some text content')
            return
        }

        // Create a virtual file object from the text content
        const blob = new Blob([content], { type: 'text/plain' })
        const file = new File([blob], filename, { type: 'text/plain' })

        // Add to upload queue like a regular file
        if (this.isValidFile(file)) {
            this.addFileToUploadQueue(file)
            this.closePasteTextModal()
        }
    }

    // Clipboard Paste Methods for Screenshots
    async handleClipboardPaste(e) {
        const items = e.clipboardData?.items
        if (!items) return

        // Check if we have an image in the clipboard
        let hasImage = false
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                hasImage = true
                break
            }
        }

        // If no image, let the default paste behavior continue
        if (!hasImage) return

        // Only handle image paste - prevent default paste for images only
        for (let i = 0; i < items.length; i++) {
            const item = items[i]

            // Handle image paste (screenshots)
            if (item.type.indexOf('image') !== -1) {
                e.preventDefault() // Prevent default paste behavior for images
                const blob = item.getAsFile()
                if (blob) {
                    // Create a filename with timestamp
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
                    const filename = `screenshot-${timestamp}.png`

                    // Create a File object
                    const file = new File([blob], filename, { type: blob.type })

                    // Add to upload queue
                    if (this.isValidFile(file)) {
                        this.addFileToUploadQueue(file)
                    }
                }
                break
            }
        }
    }

    // Handle Starting Option Clicks
    handleStartingOptionClick(e) {
        // Check if clicked element is a start option
        if (!e.target.classList.contains('start-option')) return

        // Get the text content to determine which option was clicked
        const optionText = e.target.textContent.trim()
        let message = ''

        if (optionText.includes('Spitball ideas')) {
            message = "I'd like to spitball ideas - brainstorm from scratch without any existing materials."
        } else if (optionText.includes('Upload existing documents')) {
            message = "I have existing documents I'd like to upload as a starting point for our planning session."
        } else if (optionText.includes('Use inspiration')) {
            message = "I want to use inspiration - base this on something I've seen before."
        } else if (optionText.includes('Just chat through it')) {
            message = "Let's just chat through it - discuss and iterate conversationally."
        }

        if (message) {
            // Set the message in the input and send it
            this.messageInput.value = message
            this.handleInputChange()
            this.sendMessage()
        }
    }

    // Handle Attachment Clicks (Event Delegation)
    handleAttachmentClick(e) {
        // Find if we clicked on an attachment preview or one of its children
        const attachmentElement = e.target.closest('.attachment-preview')
        if (!attachmentElement) return

        // Get the attachment data from the element
        const attachmentId = attachmentElement.getAttribute('data-attachment-id')
        if (!attachmentId) return

        // Find the attachment data from the current message
        let attachment = null
        for (const message of this.messages) {
            if (message.attachments) {
                attachment = message.attachments.find(att => att.id === attachmentId)
                if (attachment) break
            }
        }

        if (attachment) {
            this.previewAttachment(attachment)
        }
    }

    // Artifact System Methods
    toggleArtifactPanel() {
        if (!this.artifactPanel) return

        this.artifactIsVisible = !this.artifactIsVisible

        if (this.artifactIsVisible) {
            this.artifactPanel.classList.remove('hidden')
        } else {
            this.artifactPanel.classList.add('hidden')
        }
    }

    showArtifactPanel() {
        if (!this.artifactPanel) return

        this.artifactIsVisible = true
        this.artifactPanel.classList.remove('hidden')
    }

    hideArtifactPanel() {
        if (!this.artifactPanel) return

        this.artifactIsVisible = false
        this.artifactPanel.classList.add('hidden')
    }

    createArtifact(title, type = 'prd') {
        this.currentArtifact = {
            id: 'artifact_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            title: title,
            type: type,
            content: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }

        this.artifactTitle.textContent = `📄 ${title}`
        this.artifactType = type
        this.artifactContent = ''

        // Show the artifact panel
        this.showArtifactPanel()

        // Update the content area
        this.updateArtifactDisplay()

        // Set status to building
        this.setArtifactStatus('building', 'Building document...')

        return this.currentArtifact
    }

    updateArtifactContent(content, isIncremental = false) {
        if (!this.currentArtifact) return

        if (isIncremental) {
            this.artifactContent += content
        } else {
            this.artifactContent = content
        }

        this.currentArtifact.content = this.artifactContent
        this.currentArtifact.updatedAt = new Date().toISOString()

        this.updateArtifactDisplay()
    }

    updateArtifactDisplay() {
        const contentElement = document.getElementById('artifact-content')
        if (!contentElement) return

        if (!this.artifactContent || !this.currentArtifact) {
            // Show no artifact state
            contentElement.innerHTML = `
                <div class="no-artifact">
                    <span class="no-artifact-icon">📄</span>
                    <p>No document artifact active</p>
                    <small>Start a planning conversation to create an artifact</small>
                </div>
            `
            return
        }

        // Convert markdown-like content to HTML and display
        const formattedContent = this.formatArtifactContent(this.artifactContent)
        contentElement.innerHTML = formattedContent

        // Scroll to bottom to show new content
        contentElement.scrollTop = contentElement.scrollHeight
    }

    formatArtifactContent(content) {
        // Enhanced markdown formatting for artifacts
        return content
            // Headers
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            // Bold and italic
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Code blocks
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            // Lists
            .replace(/^\* (.*$)/gm, '<li>$1</li>')
            .replace(/^- (.*$)/gm, '<li>$1</li>')
            .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
            // Blockquotes
            .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
            // Line breaks
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            // Wrap in paragraphs
            .replace(/^(.+)$/gm, '<p>$1</p>')
            // Clean up empty paragraphs
            .replace(/<p><\/p>/g, '')
            // Fix list formatting
            .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    }

    setArtifactStatus(status, text) {
        if (!this.artifactStatus) return

        // Remove existing status classes
        this.artifactStatus.classList.remove('building', 'error')

        // Add new status class
        if (status !== 'ready') {
            this.artifactStatus.classList.add(status)
        }

        // Update status text
        const statusTextEl = this.artifactStatus.querySelector('.status-text')
        if (statusTextEl) {
            statusTextEl.textContent = text
        }
    }

    downloadArtifact() {
        if (!this.currentArtifact || !this.artifactContent) {
            alert('No artifact to download')
            return
        }

        const content = this.artifactContent
        const filename = `${this.currentArtifact.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`

        const blob = new Blob([content], { type: 'text/markdown' })
        const url = URL.createObjectURL(blob)

        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)

        URL.revokeObjectURL(url)
    }

    copyArtifactToClipboard() {
        if (!this.currentArtifact || !this.artifactContent) {
            alert('No artifact to copy')
            return
        }

        navigator.clipboard.writeText(this.artifactContent).then(() => {
            // Temporarily change the copy button text
            const originalText = this.copyArtifactBtn.innerHTML
            this.copyArtifactBtn.innerHTML = '<span>✓</span>'

            setTimeout(() => {
                this.copyArtifactBtn.innerHTML = originalText
            }, 2000)
        }).catch(err => {
            console.error('Failed to copy artifact to clipboard:', err)
            alert('Failed to copy to clipboard')
        })
    }

    // Step-by-step PRD workflow method (placeholder for future implementation)
    startPRDWorkflow(initialContent = '') {
        const title = 'Product Requirements Document'
        this.createArtifact(title, 'prd')

        if (initialContent) {
            this.updateArtifactContent(initialContent)
        }

        this.setArtifactStatus('building', 'Building PRD step by step...')
        return this.currentArtifact
    }

    // Method to handle streaming updates to artifacts (like ChatGPT)
    streamToArtifact(content) {
        if (!this.currentArtifact) {
            // Create a default artifact if none exists
            this.createArtifact('Planning Document', 'document')
        }

        this.updateArtifactContent(content, true)
        this.setArtifactStatus('building', 'Building document...')
    }

    finalizeArtifact() {
        if (!this.currentArtifact) return

        this.setArtifactStatus('ready', 'Document ready')
        return this.currentArtifact
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.plannerChat = new PlannerChatApp()
})

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.plannerChat?.currentEventSource) {
        window.plannerChat.currentEventSource.close()
    } else if (!document.hidden && window.plannerChat) {
        window.plannerChat.checkServerHealth()
    }
})

// Handle beforeunload to cleanup
window.addEventListener('beforeunload', () => {
    if (window.plannerChat?.currentEventSource) {
        window.plannerChat.currentEventSource.close()
    }
})