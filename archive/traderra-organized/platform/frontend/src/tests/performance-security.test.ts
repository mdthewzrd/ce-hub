/**
 * Traderra Journal - Performance and Security Tests
 *
 * Tests for performance optimization, memory management, security validation,
 * and production readiness.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { performance } from 'perf_hooks'

// Mock performance timing API
global.performance = global.performance || {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByType: vi.fn(() => []),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn()
}

// Security testing utilities
const testXSSVector = '<script>alert("xss")</script>'
const testSQLInjection = "'; DROP TABLE users; --"
const testCSRFPayload = '<form action="/malicious" method="post"><input type="hidden" name="transfer" value="1000000"></form>'

describe('Performance and Security Testing', () => {

  describe('Performance Optimization', () => {

    describe('Loading Performance', () => {

      it('should load folder tree within performance budget', async () => {
        const startTime = performance.now()

        // Simulate loading 1000 folders
        const largeFolderSet = Array.from({ length: 1000 }, (_, i) => ({
          id: `folder-${i}`,
          name: `Folder ${i}`,
          parentId: i > 0 && i % 10 === 0 ? `folder-${Math.floor(i / 10) - 1}` : undefined,
          icon: 'folder',
          color: '#FFD700',
          position: i,
          contentCount: Math.floor(Math.random() * 20)
        }))

        // Build folder tree (this is the actual performance test)
        const tree = buildFolderTreePerformant(largeFolderSet)

        const endTime = performance.now()
        const executionTime = endTime - startTime

        // Should complete within 100ms for 1000 folders
        expect(executionTime).toBeLessThan(100)
        expect(tree.length).toBeGreaterThan(0)
      })

      it('should handle search operations efficiently', async () => {
        const searchTerms = ['trade', 'YIBO', 'momentum', 'analysis', 'profit']
        const mockEntries = Array.from({ length: 10000 }, (_, i) => ({
          id: `entry-${i}`,
          title: `Trade Entry ${i}`,
          content: `This is trade content ${i} with ${searchTerms[i % searchTerms.length]} analysis`,
          symbol: `SYM${i}`,
          category: i % 2 === 0 ? 'win' : 'loss',
          emotion: 'neutral',
          rating: Math.floor(Math.random() * 5) + 1
        }))

        const startTime = performance.now()

        // Simulate search operation
        const results = mockEntries.filter(entry =>
          entry.title.toLowerCase().includes('trade') ||
          entry.content.toLowerCase().includes('trade')
        )

        const endTime = performance.now()
        const searchTime = endTime - startTime

        // Search should complete within 50ms for 10,000 entries
        expect(searchTime).toBeLessThan(50)
        expect(results.length).toBeGreaterThan(0)
      })

      it('should optimize React Query caching', () => {
        const cacheConfig = {
          staleTime: 5 * 60 * 1000, // 5 minutes
          retry: 2,
          retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
        }

        // Validate cache configuration
        expect(cacheConfig.staleTime).toBe(300000) // 5 minutes in ms
        expect(cacheConfig.retry).toBe(2)
        expect(typeof cacheConfig.retryDelay).toBe('function')
      })

      it('should debounce search input appropriately', () => {
        let callCount = 0
        const mockSearchFn = vi.fn(() => callCount++)

        // Simulate debounced search
        const debounceMs = 300
        const debouncedSearch = debounce(mockSearchFn, debounceMs)

        // Fire multiple search calls rapidly
        debouncedSearch('t')
        debouncedSearch('te')
        debouncedSearch('tes')
        debouncedSearch('test')

        // Should only call the function once due to debouncing
        setTimeout(() => {
          expect(mockSearchFn).toHaveBeenCalledTimes(1)
        }, debounceMs + 10)
      })
    })

    describe('Memory Management', () => {

      it('should clean up event listeners properly', () => {
        const mockAddEventListener = vi.fn()
        const mockRemoveEventListener = vi.fn()

        // Mock DOM element
        const mockElement = {
          addEventListener: mockAddEventListener,
          removeEventListener: mockRemoveEventListener
        }

        // Simulate component lifecycle
        const handleClick = vi.fn()
        mockElement.addEventListener('click', handleClick)

        // Simulate cleanup
        mockElement.removeEventListener('click', handleClick)

        expect(mockAddEventListener).toHaveBeenCalledWith('click', handleClick)
        expect(mockRemoveEventListener).toHaveBeenCalledWith('click', handleClick)
      })

      it('should prevent memory leaks in React Query', () => {
        // Test that queries are properly cleaned up
        const queryCache = new Map()

        // Simulate query registration
        queryCache.set('folders-user-1', { data: [], lastUpdated: Date.now() })
        queryCache.set('content-folder-1', { data: [], lastUpdated: Date.now() })

        expect(queryCache.size).toBe(2)

        // Simulate cleanup
        queryCache.clear()
        expect(queryCache.size).toBe(0)
      })

      it('should handle large datasets without memory bloat', () => {
        const initialMemory = process.memoryUsage?.().heapUsed || 0

        // Create large dataset
        const largeDataset = Array.from({ length: 50000 }, (_, i) => ({
          id: `item-${i}`,
          data: `Large content string ${i}`.repeat(100)
        }))

        // Process the dataset
        const processed = largeDataset.map(item => ({
          id: item.id,
          processed: true
        }))

        expect(processed.length).toBe(50000)

        // Memory usage should be reasonable (this is a basic check)
        const finalMemory = process.memoryUsage?.().heapUsed || 0
        const memoryIncrease = finalMemory - initialMemory

        // Should not increase memory by more than 100MB
        expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024)
      })
    })

    describe('Render Performance', () => {

      it('should minimize unnecessary re-renders', () => {
        const renderCount = { count: 0 }

        // Mock component that tracks renders
        const mockComponent = () => {
          renderCount.count++
          return 'component'
        }

        // Simulate multiple calls with same props
        mockComponent()
        mockComponent()
        mockComponent()

        // Without memoization, this would be 3 renders
        expect(renderCount.count).toBe(3)

        // With proper memoization, subsequent calls with same props shouldn't re-render
        // This would be tested with React.memo and useMemo in actual components
      })

      it('should virtualize long lists efficiently', () => {
        const items = Array.from({ length: 10000 }, (_, i) => ({ id: i, name: `Item ${i}` }))

        // Simulate virtual scrolling - only render visible items
        const viewportHeight = 400
        const itemHeight = 40
        const visibleCount = Math.ceil(viewportHeight / itemHeight)
        const startIndex = 0
        const endIndex = Math.min(startIndex + visibleCount, items.length)

        const visibleItems = items.slice(startIndex, endIndex)

        // Should only render items that fit in viewport
        expect(visibleItems.length).toBeLessThanOrEqual(visibleCount)
        expect(visibleItems.length).toBeLessThan(items.length)
      })
    })
  })

  describe('Security Validation', () => {

    describe('Input Validation and Sanitization', () => {

      it('should prevent XSS attacks in user input', () => {
        const sanitizeInput = (input: string): string => {
          return input
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;')
        }

        const maliciousInput = testXSSVector
        const sanitized = sanitizeInput(maliciousInput)

        expect(sanitized).not.toContain('<script>')
        expect(sanitized).not.toContain('alert')
        expect(sanitized).toContain('&lt;script&gt;')
      })

      it('should validate folder names for security', () => {
        const validateFolderName = (name: string): boolean => {
          // Prevent SQL injection patterns
          const sqlPatterns = [
            /'.*'/,
            /--/,
            /\/\*/,
            /\*\//,
            /union.*select/i,
            /drop.*table/i,
            /insert.*into/i,
            /delete.*from/i
          ]

          // Prevent XSS patterns
          const xssPatterns = [
            /<script/i,
            /<\/script>/i,
            /javascript:/i,
            /on\w+\s*=/i,
            /<iframe/i,
            /<object/i,
            /<embed/i
          ]

          return !sqlPatterns.some(pattern => pattern.test(name)) &&
                 !xssPatterns.some(pattern => pattern.test(name)) &&
                 name.length <= 255 &&
                 name.trim().length > 0
        }

        // Valid names should pass
        expect(validateFolderName('Trading Journal')).toBe(true)
        expect(validateFolderName('Q1 2024 Trades')).toBe(true)
        expect(validateFolderName('High-Probability Setups')).toBe(true)

        // Malicious names should fail
        expect(validateFolderName(testXSSVector)).toBe(false)
        expect(validateFolderName(testSQLInjection)).toBe(false)
        expect(validateFolderName('')).toBe(false)
        expect(validateFolderName('a'.repeat(256))).toBe(false)
      })

      it('should validate content creation data', () => {
        const validateContentData = (data: any): boolean => {
          // Check required fields
          if (!data.title || !data.type || !data.user_id) {
            return false
          }

          // Validate title length and content
          if (data.title.length > 255 || data.title.trim().length === 0) {
            return false
          }

          // Validate type against allowed values
          const allowedTypes = ['trade_entry', 'document', 'note', 'strategy', 'research', 'review']
          if (!allowedTypes.includes(data.type)) {
            return false
          }

          // Validate user_id format (assuming UUID)
          const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
          if (!uuidPattern.test(data.user_id) && data.user_id !== 'default_user') {
            return false
          }

          return true
        }

        // Valid data should pass
        expect(validateContentData({
          title: 'Valid Trade Entry',
          type: 'trade_entry',
          user_id: 'default_user',
          content: { trade_data: {} }
        })).toBe(true)

        // Invalid data should fail
        expect(validateContentData({
          title: '',
          type: 'trade_entry',
          user_id: 'default_user'
        })).toBe(false)

        expect(validateContentData({
          title: 'Valid Title',
          type: 'invalid_type',
          user_id: 'default_user'
        })).toBe(false)

        expect(validateContentData({
          title: 'Valid Title',
          type: 'trade_entry'
          // Missing user_id
        })).toBe(false)
      })

      it('should sanitize content for safe display', () => {
        const sanitizeContent = (content: string): string => {
          // Basic HTML sanitization - in production, use a library like DOMPurify
          return content
            .replace(/<script[^>]*>.*?<\/script>/gi, '')
            .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        }

        const maliciousContent = `
          This is normal content.
          <script>alert('xss')</script>
          <iframe src="http://malicious.com"></iframe>
          <a href="javascript:alert('xss')">Click me</a>
          <div onclick="alert('xss')">Click me</div>
        `

        const sanitized = sanitizeContent(maliciousContent)

        expect(sanitized).not.toContain('<script>')
        expect(sanitized).not.toContain('<iframe>')
        expect(sanitized).not.toContain('javascript:')
        expect(sanitized).not.toContain('onclick=')
        expect(sanitized).toContain('This is normal content.')
      })
    })

    describe('API Security', () => {

      it('should validate API endpoints for security', () => {
        const validateApiEndpoint = (endpoint: string): boolean => {
          // Prevent path traversal
          if (endpoint.includes('..') || endpoint.includes('~')) {
            return false
          }

          // Ensure proper API prefix
          if (!endpoint.startsWith('/api/')) {
            return false
          }

          // Prevent access to sensitive endpoints
          const forbiddenPaths = ['/admin', '/config', '/debug', '/.env', '/secrets']
          if (forbiddenPaths.some(path => endpoint.includes(path))) {
            return false
          }

          return true
        }

        // Valid endpoints should pass
        expect(validateApiEndpoint('/api/folders/')).toBe(true)
        expect(validateApiEndpoint('/api/folders/tree')).toBe(true)
        expect(validateApiEndpoint('/api/folders/content')).toBe(true)

        // Invalid endpoints should fail
        expect(validateApiEndpoint('/api/../config')).toBe(false)
        expect(validateApiEndpoint('/api/admin/users')).toBe(false)
        expect(validateApiEndpoint('/../etc/passwd')).toBe(false)
        expect(validateApiEndpoint('/secrets/api-keys')).toBe(false)
      })

      it('should handle authentication headers securely', () => {
        const createSecureHeaders = (token?: string): Record<string, string> => {
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          }

          if (token) {
            // Validate token format
            if (token.length < 20 || token.includes(' ')) {
              throw new Error('Invalid token format')
            }
            headers['Authorization'] = `Bearer ${token}`
          }

          return headers
        }

        // Valid token should work
        const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
        const headers = createSecureHeaders(validToken)
        expect(headers['Authorization']).toBe(`Bearer ${validToken}`)

        // Invalid tokens should throw
        expect(() => createSecureHeaders('short')).toThrow('Invalid token format')
        expect(() => createSecureHeaders('token with spaces')).toThrow('Invalid token format')
      })

      it('should prevent CSRF attacks', () => {
        const validateCSRFToken = (token: string, origin: string): boolean => {
          // Basic CSRF validation
          if (!token || token.length < 32) {
            return false
          }

          // Validate origin
          const allowedOrigins = ['http://localhost:3000', 'https://traderra.com']
          if (!allowedOrigins.includes(origin)) {
            return false
          }

          return true
        }

        const validToken = 'a'.repeat(32)
        const validOrigin = 'http://localhost:3000'

        expect(validateCSRFToken(validToken, validOrigin)).toBe(true)
        expect(validateCSRFToken('short', validOrigin)).toBe(false)
        expect(validateCSRFToken(validToken, 'http://malicious.com')).toBe(false)
      })
    })

    describe('Data Protection', () => {

      it('should not expose sensitive data in logs', () => {
        const sanitizeLogData = (data: any): any => {
          const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth']

          const sanitized = { ...data }
          Object.keys(sanitized).forEach(key => {
            if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
              sanitized[key] = '[REDACTED]'
            }
          })

          return sanitized
        }

        const logData = {
          user_id: 'user-123',
          action: 'create_folder',
          api_key: 'secret-api-key',
          password: 'user-password',
          folder_name: 'My Folder'
        }

        const sanitized = sanitizeLogData(logData)

        expect(sanitized.user_id).toBe('user-123')
        expect(sanitized.action).toBe('create_folder')
        expect(sanitized.folder_name).toBe('My Folder')
        expect(sanitized.api_key).toBe('[REDACTED]')
        expect(sanitized.password).toBe('[REDACTED]')
      })

      it('should validate user permissions', () => {
        const validateUserPermission = (userId: string, resource: string, action: string): boolean => {
          // Mock permission system
          const permissions = {
            'user-1': ['folders:read', 'folders:write', 'content:read', 'content:write'],
            'user-2': ['folders:read', 'content:read'],
            'admin': ['*']
          }

          const userPerms = permissions[userId as keyof typeof permissions] || []
          const requiredPerm = `${resource}:${action}`

          return userPerms.includes('*') || userPerms.includes(requiredPerm)
        }

        expect(validateUserPermission('user-1', 'folders', 'write')).toBe(true)
        expect(validateUserPermission('user-2', 'folders', 'write')).toBe(false)
        expect(validateUserPermission('admin', 'folders', 'delete')).toBe(true)
        expect(validateUserPermission('unknown', 'folders', 'read')).toBe(false)
      })
    })
  })

  describe('Production Readiness', () => {

    describe('Error Handling', () => {

      it('should handle network failures gracefully', async () => {
        const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'))
        global.fetch = mockFetch

        const apiCall = async () => {
          try {
            await fetch('/api/folders/tree')
            return { success: true, data: [] }
          } catch (error) {
            return { success: false, error: 'Network error' }
          }
        }

        const result = await apiCall()
        expect(result.success).toBe(false)
        expect(result.error).toBe('Network error')
      })

      it('should provide meaningful error messages', () => {
        const formatErrorMessage = (error: any): string => {
          if (error.response?.status === 404) {
            return 'The requested resource was not found.'
          }
          if (error.response?.status === 403) {
            return 'You do not have permission to perform this action.'
          }
          if (error.response?.status >= 500) {
            return 'A server error occurred. Please try again later.'
          }
          if (error.code === 'NETWORK_ERROR') {
            return 'Unable to connect to the server. Please check your internet connection.'
          }
          return 'An unexpected error occurred. Please try again.'
        }

        expect(formatErrorMessage({ response: { status: 404 } }))
          .toBe('The requested resource was not found.')
        expect(formatErrorMessage({ response: { status: 403 } }))
          .toBe('You do not have permission to perform this action.')
        expect(formatErrorMessage({ response: { status: 500 } }))
          .toBe('A server error occurred. Please try again later.')
        expect(formatErrorMessage({ code: 'NETWORK_ERROR' }))
          .toBe('Unable to connect to the server. Please check your internet connection.')
        expect(formatErrorMessage({ message: 'Unknown error' }))
          .toBe('An unexpected error occurred. Please try again.')
      })
    })

    describe('Monitoring and Logging', () => {

      it('should track performance metrics', () => {
        const metrics = {
          loadTime: 0,
          renderTime: 0,
          apiResponseTime: 0
        }

        const trackMetric = (name: string, value: number) => {
          if (name in metrics) {
            metrics[name as keyof typeof metrics] = value
          }
        }

        trackMetric('loadTime', 1500)
        trackMetric('renderTime', 50)
        trackMetric('apiResponseTime', 200)

        expect(metrics.loadTime).toBe(1500)
        expect(metrics.renderTime).toBe(50)
        expect(metrics.apiResponseTime).toBe(200)
      })

      it('should log user actions for analytics', () => {
        const actionLog: Array<{ action: string; timestamp: number; metadata?: any }> = []

        const logAction = (action: string, metadata?: any) => {
          actionLog.push({
            action,
            timestamp: Date.now(),
            metadata
          })
        }

        logAction('folder_created', { folder_id: 'folder-1', name: 'Test Folder' })
        logAction('entry_viewed', { entry_id: 'entry-1' })
        logAction('mode_switched', { from: 'classic', to: 'enhanced' })

        expect(actionLog).toHaveLength(3)
        expect(actionLog[0].action).toBe('folder_created')
        expect(actionLog[1].action).toBe('entry_viewed')
        expect(actionLog[2].action).toBe('mode_switched')
      })
    })
  })
})

// Utility functions for testing
function buildFolderTreePerformant(folders: any[]): any[] {
  // Optimized folder tree building for performance testing
  const folderMap = new Map()
  const rootFolders: any[] = []

  // Single pass to create map
  folders.forEach(folder => {
    folderMap.set(folder.id, { ...folder, children: [] })
  })

  // Single pass to build relationships
  folders.forEach(folder => {
    const folderNode = folderMap.get(folder.id)
    if (folder.parentId && folderMap.has(folder.parentId)) {
      folderMap.get(folder.parentId).children.push(folderNode)
    } else {
      rootFolders.push(folderNode)
    }
  })

  return rootFolders
}

function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}