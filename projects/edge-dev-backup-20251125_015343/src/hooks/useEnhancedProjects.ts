/**
 * Enhanced Project Management Hook
 * Manages projects, chat sessions, and their integration
 */

import { useState, useEffect, useCallback } from 'react'
import {
  EnhancedProject,
  ChatSession,
  ChatMessage,
  ScanResult,
  CreateChatSessionRequest,
  UpdateChatSessionRequest,
  EnhancedProjectManagementState,
  FileAttachment
} from '@/types/projectTypes'

// Mock data for initial development
const INITIAL_PROJECTS: EnhancedProject[] = [
  {
    id: 'proj_1',
    name: 'Backside Momentum Strategy',
    description: 'Focus on stocks at bottom of range ready for momentum plays',
    aggregation_method: 'union' as any,
    tags: ['momentum', 'backside', 'gap'],
    scanner_count: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_executed: null,
    execution_count: 0,
    strategy: 'Backside Momentum',
    color: '#FFD700',
    chatSessions: [],
    scanResults: [],
  },
  {
    id: 'proj_2',
    name: 'LC Pattern Analysis',
    description: 'Last chance pattern identification and analysis',
    aggregation_method: 'intersection' as any,
    tags: ['lc', 'patterns', 'analysis'],
    scanner_count: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_executed: null,
    execution_count: 0,
    strategy: 'LC Patterns',
    color: '#00CED1',
    chatSessions: [],
    scanResults: [],
  }
]

export function useEnhancedProjects() {
  const [state, setState] = useState<EnhancedProjectManagementState>({
    projects: INITIAL_PROJECTS,
    activeProjectId: undefined,
    activeChatId: undefined,
    chatSessions: [],
    isLoading: false,
    error: undefined,
    filters: {},
    chatFilters: {}
  })

  // Load projects and chat sessions from localStorage
  useEffect(() => {
    const loadStoredData = () => {
      try {
        const storedProjects = localStorage.getItem('enhancedProjects')
        const storedChatSessions = localStorage.getItem('chatSessions')

        if (storedProjects) {
          const projects = JSON.parse(storedProjects)
          setState(prev => ({ ...prev, projects }))
        }

        if (storedChatSessions) {
          const chatSessions = JSON.parse(storedChatSessions)
          setState(prev => ({ ...prev, chatSessions }))
        }
      } catch (error) {
        console.error('Error loading stored project data:', error)
      }
    }

    loadStoredData()
  }, [])

  // Save to localStorage whenever projects or chat sessions change
  const saveToStorage = useCallback((projects: EnhancedProject[], chatSessions: ChatSession[]) => {
    try {
      localStorage.setItem('enhancedProjects', JSON.stringify(projects))
      localStorage.setItem('chatSessions', JSON.stringify(chatSessions))
    } catch (error) {
      console.error('Error saving project data:', error)
    }
  }, [])

  // Create new project
  const createProject = useCallback(async (config: {
    name: string
    description?: string
    strategy: string
    tags?: string[]
    color?: string
  }) => {
    setState(prev => ({ ...prev, isLoading: true }))

    try {
      const newProject: EnhancedProject = {
        id: `proj_${Date.now()}`,
        name: config.name,
        description: config.description || '',
        aggregation_method: 'union' as any,
        tags: config.tags || [],
        scanner_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_executed: null,
        execution_count: 0,
        strategy: config.strategy,
        color: config.color || '#FFD700',
        chatSessions: [],
        scanResults: [],
      }

      setState(prev => {
        const newProjects = [...prev.projects, newProject]
        saveToStorage(newProjects, prev.chatSessions)
        return {
          ...prev,
          projects: newProjects,
          activeProjectId: newProject.id,
          isLoading: false
        }
      })
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to create project', isLoading: false }))
    }
  }, [saveToStorage])

  // Delete project
  const deleteProject = useCallback(async (projectId: string) => {
    setState(prev => ({ ...prev, isLoading: true }))

    try {
      setState(prev => {
        const newProjects = prev.projects.filter(p => p.id !== projectId)
        const newChatSessions = prev.chatSessions.filter(c => c.projectId !== projectId)

        saveToStorage(newProjects, newChatSessions)

        return {
          ...prev,
          projects: newProjects,
          chatSessions: newChatSessions,
          activeProjectId: prev.activeProjectId === projectId ? undefined : prev.activeProjectId,
          activeChatId: undefined,
          isLoading: false
        }
      })
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to delete project', isLoading: false }))
    }
  }, [saveToStorage])

  // Create new chat session
  const createChatSession = useCallback(async (config: CreateChatSessionRequest) => {
    setState(prev => ({ ...prev, isLoading: true }))

    try {
      const newChatSession: ChatSession = {
        id: `chat_${Date.now()}`,
        title: config.title,
        projectId: config.projectId,
        messages: config.initialMessage ? [{
          id: `msg_${Date.now()}`,
          type: 'user',
          content: config.initialMessage,
          timestamp: new Date()
        }] : [],
        createdAt: new Date(),
        lastActiveAt: new Date(),
        isActive: true,
        tags: config.tags || []
      }

      setState(prev => {
        const newChatSessions = [...prev.chatSessions, newChatSession]
        saveToStorage(prev.projects, newChatSessions)

        return {
          ...prev,
          chatSessions: newChatSessions,
          activeChatId: newChatSession.id,
          activeProjectId: config.projectId,
          isLoading: false
        }
      })
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to create chat session', isLoading: false }))
    }
  }, [saveToStorage])

  // Add message to chat session
  const addMessageToChatSession = useCallback(async (
    chatId: string,
    content: string,
    type: 'user' | 'assistant' = 'user',
    attachments?: FileAttachment[]
  ) => {
    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random()}`,
      type,
      content,
      timestamp: new Date(),
      attachments
    }

    setState(prev => {
      const newChatSessions = prev.chatSessions.map(chat =>
        chat.id === chatId
          ? {
              ...chat,
              messages: [...chat.messages, newMessage],
              lastActiveAt: new Date()
            }
          : chat
      )

      saveToStorage(prev.projects, newChatSessions)

      return {
        ...prev,
        chatSessions: newChatSessions
      }
    })
  }, [saveToStorage])

  // Delete chat session
  const deleteChatSession = useCallback(async (chatId: string) => {
    setState(prev => {
      const newChatSessions = prev.chatSessions.filter(c => c.id !== chatId)
      saveToStorage(prev.projects, newChatSessions)

      return {
        ...prev,
        chatSessions: newChatSessions,
        activeChatId: prev.activeChatId === chatId ? undefined : prev.activeChatId
      }
    })
  }, [saveToStorage])

  // Select project
  const selectProject = useCallback((projectId: string) => {
    setState(prev => ({
      ...prev,
      activeProjectId: projectId,
      activeChatId: undefined // Clear active chat when switching projects
    }))
  }, [])

  // Select chat session
  const selectChatSession = useCallback((chatId: string) => {
    const chatSession = state.chatSessions.find(c => c.id === chatId)
    if (chatSession) {
      setState(prev => ({
        ...prev,
        activeChatId: chatId,
        activeProjectId: chatSession.projectId
      }))
    }
  }, [state.chatSessions])

  // Add scan result to project
  const addScanResultToProject = useCallback((projectId: string, scanResult: Omit<ScanResult, 'id' | 'projectId'>) => {
    const newScanResult: ScanResult = {
      ...scanResult,
      id: `scan_${Date.now()}`,
      projectId
    }

    setState(prev => {
      const newProjects = prev.projects.map(project =>
        project.id === projectId
          ? {
              ...project,
              scanResults: [...project.scanResults, newScanResult],
              last_executed: new Date().toISOString(),
              execution_count: project.execution_count + 1
            }
          : project
      )

      saveToStorage(newProjects, prev.chatSessions)

      return {
        ...prev,
        projects: newProjects
      }
    })
  }, [saveToStorage])

  // Get active project
  const activeProject = state.activeProjectId
    ? state.projects.find(p => p.id === state.activeProjectId)
    : undefined

  // Get active chat session
  const activeChatSession = state.activeChatId
    ? state.chatSessions.find(c => c.id === state.activeChatId)
    : undefined

  // Get chat sessions for active project
  const projectChatSessions = state.activeProjectId
    ? state.chatSessions.filter(c => c.projectId === state.activeProjectId)
    : []

  return {
    // State
    projects: state.projects,
    activeProject,
    activeChatSession,
    projectChatSessions,
    isLoading: state.isLoading,
    error: state.error,

    // Actions
    createProject,
    deleteProject,
    selectProject,
    createChatSession,
    deleteChatSession,
    selectChatSession,
    addMessageToChatSession,
    addScanResultToProject,

    // Utilities
    clearError: () => setState(prev => ({ ...prev, error: undefined })),
    getProjectStats: () => ({
      totalProjects: state.projects.length,
      totalChatSessions: state.chatSessions.length,
      averageChatsPerProject: state.projects.length > 0 ? state.chatSessions.length / state.projects.length : 0,
    })
  }
}