'use client'

/**
 * Create Chat Session Modal
 * Modal for creating new chat sessions within projects
 */

import React, { useState } from 'react'
import { X, MessageSquare, Hash, Lightbulb } from 'lucide-react'

interface CreateChatModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateChat: (config: {
    projectId: string
    title: string
    initialMessage?: string
    tags?: string[]
  }) => Promise<void>
  projectId: string
  projectName: string
  isLoading?: boolean
}

const CHAT_STARTER_TEMPLATES = [
  'Strategy Analysis Session',
  'Scan Results Review',
  'Trade Planning Discussion',
  'Performance Analysis',
  'Market Research Chat',
  'Technical Analysis Review',
  'Risk Assessment Discussion',
  'Custom Chat Session'
]

const QUICK_STARTERS = [
  'Let\'s analyze the latest scan results for this project',
  'I want to discuss the strategy performance and optimization',
  'Help me plan trades based on current market conditions',
  'Review the risk parameters for this strategy',
  'Analyze market trends affecting this approach'
]

export default function CreateChatModal({
  isOpen,
  onClose,
  onCreateChat,
  projectId,
  projectName,
  isLoading = false
}: CreateChatModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    initialMessage: '',
    tags: '',
    useQuickStarter: false,
    selectedTemplate: 'Custom Chat Session'
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  if (!isOpen) return null

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Chat title is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)

      await onCreateChat({
        projectId,
        title: formData.title.trim(),
        initialMessage: formData.initialMessage.trim() || undefined,
        tags: tagsArray.length > 0 ? tagsArray : undefined
      })

      // Reset form
      setFormData({
        title: '',
        initialMessage: '',
        tags: '',
        useQuickStarter: false,
        selectedTemplate: 'Custom Chat Session'
      })
      setErrors({})
      onClose()
    } catch (error) {
      console.error('Error creating chat session:', error)
    }
  }

  const handleCancel = () => {
    setFormData({
      title: '',
      initialMessage: '',
      tags: '',
      useQuickStarter: false,
      selectedTemplate: 'Custom Chat Session'
    })
    setErrors({})
    onClose()
  }

  const handleTemplateSelect = (template: string) => {
    setFormData(prev => ({
      ...prev,
      selectedTemplate: template,
      title: template === 'Custom Chat Session' ? '' : template
    }))
  }

  const handleQuickStarterSelect = (starter: string) => {
    setFormData(prev => ({
      ...prev,
      initialMessage: starter,
      useQuickStarter: true
    }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-studio-surface border border-studio-border rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-studio-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-studio-text">New Chat Session</h2>
              <p className="text-sm text-studio-muted">Start chatting in "{projectName}"</p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 rounded-lg hover:bg-studio-border transition-colors"
          >
            <X className="h-5 w-5 text-studio-muted" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Chat Templates */}
          <div>
            <label className="block text-sm font-medium text-studio-text mb-3">
              Chat Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CHAT_STARTER_TEMPLATES.map(template => (
                <button
                  key={template}
                  type="button"
                  onClick={() => handleTemplateSelect(template)}
                  className={`p-3 text-xs rounded-lg border transition-all text-left ${
                    formData.selectedTemplate === template
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                      : 'border-studio-border bg-studio-bg text-studio-text hover:border-studio-accent/50'
                  }`}
                >
                  {template}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Title */}
          <div>
            <label htmlFor="chatTitle" className="block text-sm font-medium text-studio-text mb-2">
              Chat Title *
            </label>
            <input
              id="chatTitle"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Morning Scan Analysis"
              className={`w-full px-3 py-2 bg-studio-bg border rounded-lg text-studio-text placeholder-studio-muted focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors ${
                errors.title ? 'border-red-500' : 'border-studio-border focus:border-blue-500'
              }`}
            />
            {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
          </div>

          {/* Quick Starters */}
          <div>
            <label className="block text-sm font-medium text-studio-text mb-3">
              <Lightbulb className="h-4 w-4 inline mr-1" />
              Quick Starters
            </label>
            <div className="space-y-2">
              {QUICK_STARTERS.map((starter, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleQuickStarterSelect(starter)}
                  className="w-full p-2 text-xs text-left bg-studio-bg border border-studio-border rounded-lg text-studio-muted hover:text-studio-text hover:border-studio-accent/50 transition-colors"
                >
                  "{starter}"
                </button>
              ))}
            </div>
          </div>

          {/* Initial Message */}
          <div>
            <label htmlFor="initialMessage" className="block text-sm font-medium text-studio-text mb-2">
              Initial Message (Optional)
            </label>
            <textarea
              id="initialMessage"
              value={formData.initialMessage}
              onChange={(e) => setFormData(prev => ({ ...prev, initialMessage: e.target.value }))}
              placeholder="Start the conversation with a message or question..."
              rows={3}
              className="w-full px-3 py-2 bg-studio-bg border border-studio-border rounded-lg text-studio-text placeholder-studio-muted focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors resize-none"
            />
            <p className="text-xs text-studio-muted mt-1">This message will be sent automatically when the chat starts</p>
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="chatTags" className="block text-sm font-medium text-studio-text mb-2">
              <Hash className="h-4 w-4 inline mr-1" />
              Tags
            </label>
            <input
              id="chatTags"
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="analysis, trading, research (comma-separated)"
              className="w-full px-3 py-2 bg-studio-bg border border-studio-border rounded-lg text-studio-text placeholder-studio-muted focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
            />
            <p className="text-xs text-studio-muted mt-1">Separate tags with commas</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-2 bg-studio-border text-studio-text rounded-lg hover:bg-studio-muted/20 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4" />
                  Start Chat
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}