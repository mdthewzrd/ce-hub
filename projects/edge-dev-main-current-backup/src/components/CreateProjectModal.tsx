'use client'

/**
 * Create Project Modal
 * Modal for creating new projects with strategy selection
 */

import React, { useState } from 'react'
import { X, FolderPlus, Hash, Palette } from 'lucide-react'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateProject: (config: {
    name: string
    description?: string
    strategy: string
    tags?: string[]
    color?: string
  }) => Promise<void>
  isLoading?: boolean
}

const STRATEGY_OPTIONS = [
  'Backside Momentum',
  'LC Patterns',
  'Gap Trading',
  'Breakout Plays',
  'Momentum Scalping',
  'Swing Trading',
  'Day Trading',
  'Custom Strategy'
]

const COLOR_OPTIONS = [
  '#FFD700', // Gold
  '#00CED1', // Turquoise
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Light Yellow
  '#BB8FCE', // Light Purple
  '#85C1E9'  // Light Blue
]

export default function CreateProjectModal({
  isOpen,
  onClose,
  onCreateProject,
  isLoading = false
}: CreateProjectModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    strategy: 'Custom Strategy',
    tags: '',
    color: '#FFD700'
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  if (!isOpen) return null

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required'
    }

    if (!formData.strategy.trim()) {
      newErrors.strategy = 'Strategy is required'
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

      await onCreateProject({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        strategy: formData.strategy,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
        color: formData.color
      })

      // Reset form
      setFormData({
        name: '',
        description: '',
        strategy: 'Custom Strategy',
        tags: '',
        color: '#FFD700'
      })
      setErrors({})
      onClose()
    } catch (error) {
      console.error('Error creating project:', error)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: '',
      description: '',
      strategy: 'Custom Strategy',
      tags: '',
      color: '#FFD700'
    })
    setErrors({})
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-studio-surface border border-studio-border rounded-xl shadow-2xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-studio-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-studio-accent/10 rounded-lg flex items-center justify-center">
              <FolderPlus className="h-5 w-5 text-studio-accent" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-studio-text">Create New Project</h2>
              <p className="text-sm text-studio-muted">Organize your scans and strategies</p>
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
          {/* Project Name */}
          <div>
            <label htmlFor="projectName" className="block text-sm font-medium text-studio-text mb-2">
              Project Name *
            </label>
            <input
              id="projectName"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Backside Momentum Setup"
              className={`w-full px-3 py-2 bg-studio-bg border rounded-lg text-studio-text placeholder-studio-muted focus:outline-none focus:ring-2 focus:ring-studio-accent/50 transition-colors ${
                errors.name ? 'border-red-500' : 'border-studio-border focus:border-studio-accent'
              }`}
            />
            {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="projectDescription" className="block text-sm font-medium text-studio-text mb-2">
              Description
            </label>
            <textarea
              id="projectDescription"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Briefly describe your strategy and goals..."
              rows={3}
              className="w-full px-3 py-2 bg-studio-bg border border-studio-border rounded-lg text-studio-text placeholder-studio-muted focus:outline-none focus:ring-2 focus:ring-studio-accent/50 focus:border-studio-accent transition-colors resize-none"
            />
          </div>

          {/* Strategy Selection */}
          <div>
            <label htmlFor="strategy" className="block text-sm font-medium text-studio-text mb-2">
              Strategy Type *
            </label>
            <select
              id="strategy"
              value={formData.strategy}
              onChange={(e) => setFormData(prev => ({ ...prev, strategy: e.target.value }))}
              className={`w-full px-3 py-2 bg-studio-bg border rounded-lg text-studio-text focus:outline-none focus:ring-2 focus:ring-studio-accent/50 transition-colors ${
                errors.strategy ? 'border-red-500' : 'border-studio-border focus:border-studio-accent'
              }`}
            >
              {STRATEGY_OPTIONS.map(strategy => (
                <option key={strategy} value={strategy} className="bg-studio-bg">
                  {strategy}
                </option>
              ))}
            </select>
            {errors.strategy && <p className="text-red-400 text-sm mt-1">{errors.strategy}</p>}
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-studio-text mb-2">
              <Hash className="h-4 w-4 inline mr-1" />
              Tags
            </label>
            <input
              id="tags"
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="momentum, gap, backside (comma-separated)"
              className="w-full px-3 py-2 bg-studio-bg border border-studio-border rounded-lg text-studio-text placeholder-studio-muted focus:outline-none focus:ring-2 focus:ring-studio-accent/50 focus:border-studio-accent transition-colors"
            />
            <p className="text-xs text-studio-muted mt-1">Separate tags with commas</p>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium text-studio-text mb-3">
              <Palette className="h-4 w-4 inline mr-1" />
              Project Color
            </label>
            <div className="grid grid-cols-6 gap-2">
              {COLOR_OPTIONS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${
                    formData.color === color
                      ? 'border-white shadow-lg scale-110'
                      : 'border-studio-border hover:border-studio-accent/50'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
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
              className="flex-1 px-4 py-2 bg-studio-accent text-black rounded-lg hover:bg-studio-accent/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <FolderPlus className="h-4 w-4" />
                  Create Project
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}