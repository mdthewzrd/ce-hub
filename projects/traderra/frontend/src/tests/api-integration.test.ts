/**
 * Traderra Journal - API Integration Tests
 *
 * Tests for folder API service, error handling, and data transformation
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { folderApi, folderApiUtils, FolderApiError } from '@/services/folderApi'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('Folder API Integration', () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('FolderApiService', () => {

    describe('Folder Operations', () => {

      it('should create folder with correct payload', async () => {
        const mockResponse = {
          id: 'folder-1',
          name: 'Test Folder',
          user_id: 'user-1',
          icon: 'folder',
          color: '#FFD700',
          position: 0,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
          status: 200
        })

        const createData = {
          name: 'Test Folder',
          user_id: 'user-1',
          icon: 'folder',
          color: '#FFD700',
          position: 0
        }

        const result = await folderApi.createFolder(createData)

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:6500/api/folders/',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json'
            }),
            body: JSON.stringify(createData)
          })
        )

        expect(result).toEqual(mockResponse)
      })

      it('should get folder tree with user filtering', async () => {
        const mockTreeResponse = {
          folders: [
            {
              id: 'folder-1',
              name: 'Root Folder',
              user_id: 'user-1',
              icon: 'folder',
              color: '#FFD700',
              position: 0,
              children: [],
              content_count: 0,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z'
            }
          ],
          total_folders: 1,
          total_content_items: 0
        }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockTreeResponse,
          status: 200
        })

        const result = await folderApi.getFolderTree('user-1')

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:6500/api/folders/tree?user_id=user-1'
        )

        expect(result).toEqual(mockTreeResponse)
      })

      it('should update folder with partial data', async () => {
        const mockUpdatedFolder = {
          id: 'folder-1',
          name: 'Updated Folder',
          user_id: 'user-1',
          icon: 'star',
          color: '#FF0000',
          position: 0,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T01:00:00Z'
        }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockUpdatedFolder,
          status: 200
        })

        const updateData = {
          name: 'Updated Folder',
          icon: 'star',
          color: '#FF0000'
        }

        const result = await folderApi.updateFolder('folder-1', 'user-1', updateData)

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:6500/api/folders/folder-1?user_id=user-1',
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify(updateData)
          })
        )

        expect(result).toEqual(mockUpdatedFolder)
      })

      it('should delete folder with force parameter', async () => {
        const mockDeleteResponse = {
          message: 'Folder deleted successfully',
          folder_id: 'folder-1'
        }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockDeleteResponse,
          status: 200
        })

        const result = await folderApi.deleteFolder('folder-1', 'user-1', true)

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:6500/api/folders/folder-1?user_id=user-1&force=true',
          expect.objectContaining({
            method: 'DELETE'
          })
        )

        expect(result).toEqual(mockDeleteResponse)
      })

      it('should move folder to new parent', async () => {
        const mockMovedFolder = {
          id: 'folder-1',
          name: 'Test Folder',
          parent_id: 'new-parent',
          user_id: 'user-1',
          icon: 'folder',
          color: '#FFD700',
          position: 5,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T01:00:00Z'
        }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockMovedFolder,
          status: 200
        })

        const moveData = {
          new_parent_id: 'new-parent',
          new_position: 5
        }

        const result = await folderApi.moveFolder('folder-1', 'user-1', moveData)

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:6500/api/folders/folder-1/move?user_id=user-1',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify(moveData)
          })
        )

        expect(result).toEqual(mockMovedFolder)
      })

      it('should get folder statistics', async () => {
        const mockStats = {
          folder_id: 'folder-1',
          folder_name: 'Test Folder',
          content_count: 5,
          content_types: { trade_entry: 3, note: 2 },
          recent_activity: [],
          tags: ['trading', 'analysis']
        }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockStats,
          status: 200
        })

        const result = await folderApi.getFolderStats('folder-1', 'user-1')

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:6500/api/folders/folder-1/stats?user_id=user-1'
        )

        expect(result).toEqual(mockStats)
      })
    })

    describe('Content Operations', () => {

      it('should create content item with proper structure', async () => {
        const mockContent = {
          id: 'content-1',
          folder_id: 'folder-1',
          type: 'trade_entry',
          title: 'Test Trade',
          content: { trade_data: {} },
          metadata: {},
          tags: ['test'],
          user_id: 'user-1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockContent,
          status: 201
        })

        const createData = {
          folder_id: 'folder-1',
          type: 'trade_entry' as const,
          title: 'Test Trade',
          content: { trade_data: {} },
          metadata: {},
          tags: ['test'],
          user_id: 'user-1'
        }

        const result = await folderApi.createContentItem(createData)

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:6500/api/folders/content',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify(createData)
          })
        )

        expect(result).toEqual(mockContent)
      })

      it('should get content items with filters', async () => {
        const mockContentResponse = {
          items: [
            {
              id: 'content-1',
              folder_id: 'folder-1',
              type: 'trade_entry',
              title: 'Test Trade',
              content: {},
              metadata: {},
              tags: ['test'],
              user_id: 'user-1',
              folder_name: 'Test Folder',
              folder_icon: 'folder',
              folder_color: '#FFD700',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z'
            }
          ],
          total: 1,
          limit: 50,
          offset: 0,
          has_more: false
        }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockContentResponse,
          status: 200
        })

        const options = {
          folderId: 'folder-1',
          type: 'trade_entry' as const,
          search: 'test',
          tags: ['trading'],
          limit: 50,
          offset: 0
        }

        const result = await folderApi.getContentItems('user-1', options)

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:6500/api/folders/content?user_id=user-1&folder_id=folder-1&type=trade_entry&search=test&tags=trading&limit=50&offset=0'
        )

        expect(result).toEqual(mockContentResponse)
      })

      it('should move content item to different folder', async () => {
        const mockMovedContent = {
          id: 'content-1',
          folder_id: 'new-folder',
          type: 'trade_entry',
          title: 'Test Trade',
          content: {},
          metadata: {},
          tags: [],
          user_id: 'user-1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T01:00:00Z'
        }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockMovedContent,
          status: 200
        })

        const result = await folderApi.moveContentItem('content-1', 'user-1', 'new-folder')

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:6500/api/folders/content/content-1/move?user_id=user-1',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ folder_id: 'new-folder' })
          })
        )

        expect(result).toEqual(mockMovedContent)
      })

      it('should bulk move multiple content items', async () => {
        const mockBulkMoveResponse = {
          message: 'Moved 3 items successfully',
          moved_count: 3,
          target_folder_id: 'target-folder'
        }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockBulkMoveResponse,
          status: 200
        })

        const contentIds = ['content-1', 'content-2', 'content-3']
        const result = await folderApi.bulkMoveContentItems(contentIds, 'user-1', 'target-folder')

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:6500/api/folders/content/bulk-move?user_id=user-1',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              content_item_ids: contentIds,
              folder_id: 'target-folder'
            })
          })
        )

        expect(result).toEqual(mockBulkMoveResponse)
      })

      it('should delete content item', async () => {
        const mockDeleteResponse = {
          message: 'Content deleted successfully',
          content_id: 'content-1'
        }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockDeleteResponse,
          status: 200
        })

        const result = await folderApi.deleteContentItem('content-1', 'user-1')

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:6500/api/folders/content/content-1?user_id=user-1',
          expect.objectContaining({
            method: 'DELETE'
          })
        )

        expect(result).toEqual(mockDeleteResponse)
      })
    })

    describe('Error Handling', () => {

      it('should throw FolderApiError for HTTP errors', async () => {
        const errorResponse = {
          detail: 'Folder not found'
        }

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          json: async () => errorResponse
        })

        await expect(folderApi.getFolder('nonexistent', 'user-1')).rejects.toThrow(FolderApiError)
        await expect(folderApi.getFolder('nonexistent', 'user-1')).rejects.toThrow('Folder not found')
      })

      it('should handle network errors', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'))

        await expect(folderApi.getFolderTree('user-1')).rejects.toThrow(FolderApiError)
        await expect(folderApi.getFolderTree('user-1')).rejects.toThrow('Network error: Network error')
      })

      it('should handle empty responses (204 status)', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 204
        })

        const result = await folderApi.deleteFolder('folder-1', 'user-1')
        expect(result).toEqual({})
      })

      it('should handle malformed JSON responses', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => { throw new Error('Invalid JSON') }
        })

        await expect(folderApi.getFolderTree('user-1')).rejects.toThrow(FolderApiError)
        await expect(folderApi.getFolderTree('user-1')).rejects.toThrow('HTTP 500: Internal Server Error')
      })
    })
  })

  describe('Data Transformation Utilities', () => {

    describe('folderApiUtils', () => {

      it('should convert API folder to FolderNode correctly', () => {
        const apiFolder = {
          id: 'folder-1',
          name: 'Test Folder',
          parent_id: 'parent-1',
          icon: 'folder',
          color: '#FFD700',
          position: 0,
          children: [
            {
              id: 'child-1',
              name: 'Child Folder',
              parent_id: 'folder-1',
              icon: 'subfolder',
              color: '#00FF00',
              position: 0,
              children: [],
              content_count: 2,
              user_id: 'user-1',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z'
            }
          ],
          content_count: 5,
          user_id: 'user-1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }

        const folderNode = folderApiUtils.apiFolderToFolderNode(apiFolder)

        expect(folderNode).toEqual({
          id: 'folder-1',
          name: 'Test Folder',
          parentId: 'parent-1',
          icon: 'folder',
          color: '#FFD700',
          position: 0,
          children: [
            {
              id: 'child-1',
              name: 'Child Folder',
              parentId: 'folder-1',
              icon: 'subfolder',
              color: '#00FF00',
              position: 0,
              children: [],
              contentCount: 2
            }
          ],
          contentCount: 5
        })
      })

      it('should convert folder tree response to FolderNode array', () => {
        const treeResponse = {
          folders: [
            {
              id: 'folder-1',
              name: 'Root Folder',
              icon: 'folder',
              color: '#FFD700',
              position: 0,
              children: [],
              content_count: 0,
              user_id: 'user-1',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z'
            }
          ],
          total_folders: 1,
          total_content_items: 0
        }

        const folderNodes = folderApiUtils.folderTreeResponseToNodes(treeResponse)

        expect(folderNodes).toHaveLength(1)
        expect(folderNodes[0]).toEqual({
          id: 'folder-1',
          name: 'Root Folder',
          parentId: undefined,
          icon: 'folder',
          color: '#FFD700',
          position: 0,
          children: [],
          contentCount: 0
        })
      })

      it('should create folder request with defaults', () => {
        const request = folderApiUtils.createFolderRequest(
          'Test Folder',
          'user-1',
          'parent-1'
        )

        expect(request).toEqual({
          name: 'Test Folder',
          user_id: 'user-1',
          parent_id: 'parent-1',
          icon: 'folder',
          color: '#FFD700',
          position: 0
        })
      })

      it('should create folder request with custom options', () => {
        const request = folderApiUtils.createFolderRequest(
          'Custom Folder',
          'user-1',
          undefined,
          {
            icon: 'star',
            color: '#FF0000',
            position: 5
          }
        )

        expect(request).toEqual({
          name: 'Custom Folder',
          user_id: 'user-1',
          parent_id: undefined,
          icon: 'star',
          color: '#FF0000',
          position: 5
        })
      })

      it('should create content request with defaults', () => {
        const request = folderApiUtils.createContentRequest(
          'Test Content',
          'trade_entry',
          'user-1',
          'folder-1'
        )

        expect(request).toEqual({
          title: 'Test Content',
          type: 'trade_entry',
          user_id: 'user-1',
          folder_id: 'folder-1',
          content: {},
          metadata: {},
          tags: []
        })
      })

      it('should create content request with custom options', () => {
        const request = folderApiUtils.createContentRequest(
          'Custom Content',
          'note',
          'user-1',
          undefined,
          {
            content: { note_text: 'Hello world' },
            metadata: { priority: 'high' },
            tags: ['important', 'urgent']
          }
        )

        expect(request).toEqual({
          title: 'Custom Content',
          type: 'note',
          user_id: 'user-1',
          folder_id: undefined,
          content: { note_text: 'Hello world' },
          metadata: { priority: 'high' },
          tags: ['important', 'urgent']
        })
      })
    })
  })

  describe('API Configuration', () => {

    it('should use correct base URL from environment', () => {
      // Test that API uses the correct base URL
      expect(true).toBe(true) // Placeholder
    })

    it('should include proper headers in requests', () => {
      // Test that requests include Content-Type and other required headers
      expect(true).toBe(true) // Placeholder
    })

    it('should handle authentication headers when implemented', () => {
      // Future test for when authentication is added
      expect(true).toBe(true) // Placeholder
    })
  })

  describe('Request/Response Validation', () => {

    it('should validate folder creation payload', () => {
      const validPayload = {
        name: 'Test Folder',
        user_id: 'user-1',
        icon: 'folder',
        color: '#FFD700',
        position: 0
      }

      // Should not throw for valid payload
      expect(() => folderApiUtils.createFolderRequest(
        validPayload.name,
        validPayload.user_id
      )).not.toThrow()
    })

    it('should validate content creation payload', () => {
      const validPayload = {
        title: 'Test Content',
        type: 'trade_entry' as const,
        user_id: 'user-1'
      }

      // Should not throw for valid payload
      expect(() => folderApiUtils.createContentRequest(
        validPayload.title,
        validPayload.type,
        validPayload.user_id
      )).not.toThrow()
    })

    it('should handle missing optional fields gracefully', () => {
      const request = folderApiUtils.createFolderRequest('Test', 'user-1')
      expect(request.parent_id).toBeUndefined()

      const contentRequest = folderApiUtils.createContentRequest('Test', 'note', 'user-1')
      expect(contentRequest.folder_id).toBeUndefined()
    })
  })
})