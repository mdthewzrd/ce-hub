'use client'

/**
 * Enhanced Project Sidebar
 * Provides proper project management with linked chat sessions
 */

import React, { useState } from 'react'
import {
  FolderPlus,
  MessageSquare,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  Hash,
  Calendar,
  BarChart3,
  TrendingUp
} from 'lucide-react'
import { EnhancedProject, ChatSession } from '@/types/projectTypes'

interface EnhancedProjectSidebarProps {
  projects: EnhancedProject[]
  activeProject?: EnhancedProject
  activeChatSession?: ChatSession
  projectChatSessions: ChatSession[]
  onCreateProject: () => void
  onSelectProject: (projectId: string) => void
  onCreateChatSession: (projectId: string) => void
  onSelectChatSession: (chatId: string) => void
  onDeleteProject: (projectId: string) => void
  onDeleteChatSession: (chatId: string) => void
  isLoading?: boolean
  // Recent scans props
  recentScans?: any[]
  onLoadScan?: (scan: any) => void
}

export default function EnhancedProjectSidebar({
  projects,
  activeProject,
  activeChatSession,
  projectChatSessions,
  onCreateProject,
  onSelectProject,
  onCreateChatSession,
  onSelectChatSession,
  onDeleteProject,
  onDeleteChatSession,
  isLoading = false,
  recentScans = [],
  onLoadScan
}: EnhancedProjectSidebarProps) {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
  const [showProjectMenu, setShowProjectMenu] = useState<string | null>(null)
  const [showChatMenu, setShowChatMenu] = useState<string | null>(null)

  const toggleProjectExpansion = (projectId: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev)
      if (newSet.has(projectId)) {
        newSet.delete(projectId)
      } else {
        newSet.add(projectId)
      }
      return newSet
    })
  }

  const handleProjectSelect = (project: EnhancedProject) => {
    onSelectProject(project.id)
    // Auto-expand when selecting a project
    setExpandedProjects(prev => new Set([...prev, project.id]))
  }

  const getProjectChatSessions = (projectId: string) => {
    return projectChatSessions.filter(chat => chat.projectId === projectId)
  }

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getProjectColor = (color?: string) => {
    return color || '#FFD700'
  }

  return (
    <div className="flex flex-col h-full">
      {/* Navigation Items (moved from top header) */}
      <div className="content-bumper-all border-b border-studio-border">
        <div className="space-y-3">
          {/* Edge.dev Gap Up Scanner */}
          <div className="flex items-center gap-2 p-2 rounded-md hover:bg-studio-surface transition-colors cursor-pointer">
            <BarChart3 className="h-4 w-4 text-studio-accent" />
            <span className="text-sm font-medium text-studio-text">Edge.dev Gap Up Scanner</span>
          </div>

          {/* Market Scanner */}
          <div className="flex items-center gap-2 p-2 rounded-md hover:bg-studio-surface transition-colors cursor-pointer">
            <TrendingUp className="h-4 w-4 text-studio-accent" />
            <span className="text-sm font-medium text-studio-text">Market Scanner</span>
          </div>

          {/* Real-time Analysis */}
          <div className="flex items-center gap-2 p-2 rounded-md hover:bg-studio-surface transition-colors cursor-pointer">
            <Calendar className="h-4 w-4 text-yellow-400" />
            <span className="text-sm font-medium text-yellow-400">Real-time Analysis</span>
          </div>
        </div>
      </div>

      {/* Projects Header */}
      <div className="content-bumper-all border-b border-studio-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-studio-text">PROJECTS</h2>
          <button
            onClick={onCreateProject}
            className="p-2 rounded-md hover:bg-studio-surface transition-colors"
            title="Create New Project"
          >
            <FolderPlus className="h-4 w-4 text-studio-accent" />
          </button>
        </div>
        <p className="text-xs text-studio-muted mt-1">
          {projects.length} projects • Organize scans and chats by strategy
        </p>
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto">
        {projects.length === 0 ? (
          <div className="content-bumper-all text-center">
            <div className="text-4xl mb-3">📁</div>
            <p className="text-sm text-studio-muted">No projects yet</p>
            <button
              onClick={onCreateProject}
              className="mt-3 text-xs text-studio-accent hover:text-yellow-300 transition-colors"
            >
              Create your first project
            </button>
          </div>
        ) : (
          <div className="space-y-2 p-4">
            {projects.map((project) => {
              const isActive = activeProject?.id === project.id
              const isExpanded = expandedProjects.has(project.id)
              const chats = getProjectChatSessions(project.id)
              const hasChats = chats.length > 0

              return (
                <div key={project.id} className="space-y-1">
                  {/* Project Item */}
                  <div
                    className={`group relative rounded-lg cursor-pointer transition-all duration-200 ${
                      isActive
                        ? 'bg-studio-accent/10 border border-studio-accent/30'
                        : 'bg-studio-surface border border-studio-border hover:border-studio-accent/20'
                    }`}
                  >
                    <div
                      onClick={() => handleProjectSelect(project)}
                      className="p-3 flex items-center gap-3"
                    >
                      {/* Expansion Toggle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleProjectExpansion(project.id)
                        }}
                        className="p-0.5 rounded hover:bg-studio-border transition-colors"
                      >
                        {hasChats ? (
                          isExpanded ? (
                            <ChevronDown className="h-3 w-3 text-studio-muted" />
                          ) : (
                            <ChevronRight className="h-3 w-3 text-studio-muted" />
                          )
                        ) : (
                          <div className="h-3 w-3" />
                        )}
                      </button>

                      {/* Project Color Indicator */}
                      <div
                        className="w-3 h-3 rounded-full border border-gray-600"
                        style={{ backgroundColor: getProjectColor(project.color) }}
                      />

                      {/* Project Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-studio-text truncate">
                            {project.name}
                          </h3>

                          {/* Project Menu */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowProjectMenu(showProjectMenu === project.id ? null : project.id)
                              }}
                              className="p-1 rounded hover:bg-studio-border transition-colors"
                            >
                              <MoreVertical className="h-3 w-3 text-studio-muted" />
                            </button>

                            {/* Project Menu Dropdown */}
                            {showProjectMenu === project.id && (
                              <div className="absolute right-0 top-full mt-1 w-40 bg-studio-surface border border-studio-border rounded-lg shadow-lg z-10">
                                <button
                                  onClick={() => {
                                    onCreateChatSession(project.id)
                                    setShowProjectMenu(null)
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm text-studio-text hover:bg-studio-border transition-colors flex items-center gap-2"
                                >
                                  <MessageSquare className="h-3 w-3" />
                                  New Chat
                                </button>
                                <button
                                  onClick={() => {
                                    onDeleteProject(project.id)
                                    setShowProjectMenu(null)
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  Delete Project
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-xs text-studio-muted flex items-center gap-2 mt-1">
                          <span className="flex items-center gap-1">
                            <BarChart3 className="h-3 w-3" />
                            {project.scanResults?.length || 0} scans
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {chats.length} chats
                          </span>
                        </div>

                        {/* Strategy Tag */}
                        <div className="mt-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-studio-border rounded-full text-xs text-studio-accent">
                            <Hash className="h-2.5 w-2.5" />
                            {project.strategy}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chat Sessions */}
                  {isExpanded && hasChats && (
                    <div className="ml-6 space-y-1">
                      {chats.map((chat) => {
                        const isChatActive = activeChatSession?.id === chat.id

                        return (
                          <div
                            key={chat.id}
                            onClick={() => onSelectChatSession(chat.id)}
                            className={`group relative p-2 rounded-md cursor-pointer transition-all duration-200 ${
                              isChatActive
                                ? 'bg-blue-500/10 border border-blue-500/30'
                                : 'hover:bg-studio-border'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <MessageSquare className="h-3 w-3 text-studio-muted flex-shrink-0" />
                                  <span className="text-sm text-studio-text truncate">
                                    {chat.title}
                                  </span>
                                </div>
                                <div className="text-xs text-studio-muted flex items-center gap-2 mt-0.5">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-2.5 w-2.5" />
                                    {formatDate(chat.lastActiveAt)}
                                  </span>
                                  <span>{chat.messages.length} messages</span>
                                </div>
                              </div>

                              {/* Chat Menu */}
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setShowChatMenu(showChatMenu === chat.id ? null : chat.id)
                                  }}
                                  className="p-1 rounded hover:bg-studio-border transition-colors"
                                >
                                  <MoreVertical className="h-2.5 w-2.5 text-studio-muted" />
                                </button>

                                {/* Chat Menu Dropdown */}
                                {showChatMenu === chat.id && (
                                  <div className="absolute right-0 top-full mt-1 w-32 bg-studio-surface border border-studio-border rounded-lg shadow-lg z-20">
                                    <button
                                      onClick={() => {
                                        onDeleteChatSession(chat.id)
                                        setShowChatMenu(null)
                                      }}
                                      className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Create Chat Button for Expanded Projects */}
                  {isExpanded && (
                    <div className="ml-6">
                      <button
                        onClick={() => onCreateChatSession(project.id)}
                        className="w-full p-2 rounded-md border border-dashed border-studio-border hover:border-studio-accent/50 transition-colors flex items-center justify-center gap-2 text-sm text-studio-muted hover:text-studio-accent"
                      >
                        <Plus className="h-3 w-3" />
                        New Chat
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Recent Scans Section */}
      {recentScans && recentScans.length > 0 && (
        <div className="border-t border-studio-border">
          <div className="content-bumper-all">
            <h3 className="text-sm font-semibold text-studio-text mb-3 uppercase tracking-wide">
              RECENT SCANS
            </h3>
            <div className="space-y-2">
              {recentScans.slice(0, 3).map((scan, index) => (
                <button
                  key={scan.id || index}
                  onClick={() => onLoadScan && onLoadScan(scan)}
                  className="w-full text-left p-2 rounded bg-studio-surface hover:bg-studio-border transition-colors"
                >
                  <div className="text-sm font-medium text-studio-text truncate">{scan.name}</div>
                  <div className="text-xs text-studio-muted">{scan.resultCount || 0} results</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer Stats */}
      {projects.length > 0 && (
        <div className="content-bumper-all border-t border-studio-border">
          <div className="text-xs text-studio-muted">
            <div className="flex justify-between">
              <span>Total Projects: {projects.length}</span>
              <span>Total Chats: {projectChatSessions.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}