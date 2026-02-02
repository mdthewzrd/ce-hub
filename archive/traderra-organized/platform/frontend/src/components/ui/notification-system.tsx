'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  clearAll: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 15)
    const newNotification: Notification = {
      id,
      duration: 5000,
      ...notification,
    }

    setNotifications(prev => [...prev, newNotification])

    // Auto-remove after duration
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearAll
    }}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  )
}

function NotificationContainer() {
  const { notifications, removeNotification } = useNotifications()

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 w-96 max-w-full">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  )
}

interface NotificationItemProps {
  notification: Notification
  onClose: () => void
}

function NotificationItem({ notification, onClose }: NotificationItemProps) {
  const [isExiting, setIsExiting] = useState(false)

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(onClose, 200) // Allow animation to complete
  }

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-400" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-400" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />
      case 'info':
        return <Info className="h-5 w-5 text-blue-400" />
    }
  }

  const getColors = () => {
    switch (notification.type) {
      case 'success':
        return 'border-green-400/50 bg-green-900/20'
      case 'error':
        return 'border-red-400/50 bg-red-900/20'
      case 'warning':
        return 'border-yellow-400/50 bg-yellow-900/20'
      case 'info':
        return 'border-blue-400/50 bg-blue-900/20'
    }
  }

  return (
    <div
      className={cn(
        'studio-surface border rounded-lg p-4 shadow-lg transform transition-all duration-200',
        getColors(),
        isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
      )}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium studio-text">{notification.title}</h4>
          {notification.message && (
            <p className="text-sm studio-muted mt-1">{notification.message}</p>
          )}

          {notification.action && (
            <button
              onClick={() => {
                notification.action?.onClick()
                handleClose()
              }}
              className="text-sm font-medium text-primary hover:text-primary/80 mt-2 transition-colors"
            >
              {notification.action.label}
            </button>
          )}
        </div>

        <button
          onClick={handleClose}
          className="flex-shrink-0 p-1 hover:bg-[#1a1a1a] rounded transition-colors"
        >
          <X className="h-4 w-4 studio-muted" />
        </button>
      </div>
    </div>
  )
}

// Utility functions for common notification types
export const notify = {
  success: (title: string, message?: string, options?: Partial<Notification>) => ({
    type: 'success' as const,
    title,
    message,
    ...options,
  }),

  error: (title: string, message?: string, options?: Partial<Notification>) => ({
    type: 'error' as const,
    title,
    message,
    duration: 8000, // Longer duration for errors
    ...options,
  }),

  warning: (title: string, message?: string, options?: Partial<Notification>) => ({
    type: 'warning' as const,
    title,
    message,
    ...options,
  }),

  info: (title: string, message?: string, options?: Partial<Notification>) => ({
    type: 'info' as const,
    title,
    message,
    ...options,
  }),
}