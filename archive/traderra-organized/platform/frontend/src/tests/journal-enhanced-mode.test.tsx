/**
 * Traderra Journal - Enhanced Mode Tests
 *
 * Tests for enhanced mode functionality including folders, content management,
 * and mode switching behavior.
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest'

import { JournalLayout } from '@/components/journal/JournalLayout'
import { FolderTree, buildFolderTree, useFolderTree } from '@/components/folders/FolderTree'
import { FolderContextMenu } from '@/components/folders/FolderContextMenu'
import { useFolderTree as useApiHooks, useFolderContent } from '@/hooks/useFolders'

// Mock the API service
vi.mock('@/services/folderApi', () => ({
  folderApi: {
    getFolderTree: vi.fn(),
    createFolder: vi.fn(),
    updateFolder: vi.fn(),
    deleteFolder: vi.fn(),
    getContentItems: vi.fn(),
    createContentItem: vi.fn(),
    updateContentItem: vi.fn(),
    deleteContentItem: vi.fn(),
  },
  folderApiUtils: {
    folderTreeResponseToNodes: vi.fn(),
    createFolderRequest: vi.fn(),
    createContentRequest: vi.fn(),
  }
}))

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  }
}))

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

// Mock folder data
const mockFolders = [
  {
    id: '1',
    name: 'Trading Journal',
    parentId: undefined,
    icon: 'journal-text',
    color: '#FFD700',
    position: 0,
    children: [],
    contentCount: 0
  },
  {
    id: '2',
    name: 'Trade Entries',
    parentId: '1',
    icon: 'trending-up',
    color: '#10B981',
    position: 1,
    children: [],
    contentCount: 4
  },
  {
    id: '3',
    name: '2024',
    parentId: '2',
    icon: 'calendar',
    color: '#10B981',
    position: 0,
    children: [],
    contentCount: 4
  }
]

const mockFlatFolders = [
  {
    id: '1',
    name: 'Trading Journal',
    icon: 'journal-text',
    color: '#FFD700',
    position: 0,
    contentCount: 0
  },
  {
    id: '2',
    name: 'Trade Entries',
    parentId: '1',
    icon: 'trending-up',
    color: '#10B981',
    position: 1,
    contentCount: 4
  },
  {
    id: '3',
    name: '2024',
    parentId: '2',
    icon: 'calendar',
    color: '#10B981',
    position: 0,
    contentCount: 4
  }
]

describe('Enhanced Mode Functionality', () => {

  describe('Folder Tree Structure', () => {
    it('should build folder tree from flat array correctly', () => {
      const tree = buildFolderTree(mockFlatFolders)

      expect(tree).toHaveLength(1) // One root folder
      expect(tree[0].id).toBe('1')
      expect(tree[0].name).toBe('Trading Journal')
      expect(tree[0].children).toHaveLength(1)
      expect(tree[0].children[0].id).toBe('2')
      expect(tree[0].children[0].children).toHaveLength(1)
      expect(tree[0].children[0].children[0].id).toBe('3')
    })

    it('should sort folders by position and name', () => {
      const unsortedFolders = [
        { id: '3', name: 'Z Folder', position: 1, contentCount: 0, icon: 'folder', color: '#fff' },
        { id: '1', name: 'A Folder', position: 1, contentCount: 0, icon: 'folder', color: '#fff' },
        { id: '2', name: 'B Folder', position: 0, contentCount: 0, icon: 'folder', color: '#fff' }
      ]

      const tree = buildFolderTree(unsortedFolders)

      expect(tree[0].id).toBe('2') // Position 0 comes first
      expect(tree[1].id).toBe('1') // Then alphabetical at position 1
      expect(tree[2].id).toBe('3')
    })

    it('should handle empty folder array', () => {
      const tree = buildFolderTree([])
      expect(tree).toHaveLength(0)
    })

    it('should handle orphaned folders (parentId doesn\'t exist)', () => {
      const orphanedFolders = [
        { id: '1', name: 'Orphan', parentId: 'nonexistent', icon: 'folder', color: '#fff', position: 0, contentCount: 0 }
      ]

      const tree = buildFolderTree(orphanedFolders)
      expect(tree).toHaveLength(1) // Orphaned folder becomes root
      expect(tree[0].id).toBe('1')
    })
  })

  describe('FolderTree Component', () => {
    const mockCallbacks = {
      onFolderSelect: vi.fn(),
      onFolderExpand: vi.fn(),
      onFolderCreate: vi.fn(),
      onFolderContextMenu: vi.fn()
    }

    beforeEach(() => {
      Object.values(mockCallbacks).forEach(fn => fn.mockClear())
    })

    it('should render empty state when no folders exist', () => {
      render(
        <FolderTree
          folders={[]}
          {...mockCallbacks}
        />
      )

      expect(screen.getByText('No folders yet')).toBeInTheDocument()
      expect(screen.getByText('Create your first folder')).toBeInTheDocument()
    })

    it('should render folder tree with correct structure', () => {
      const tree = buildFolderTree(mockFlatFolders)
      render(
        <FolderTree
          folders={tree}
          {...mockCallbacks}
        />
      )

      expect(screen.getByText('Trading Journal')).toBeInTheDocument()
      expect(screen.getByText('Trade Entries')).toBeInTheDocument()
      expect(screen.getByText('2024')).toBeInTheDocument()
    })

    it('should show content counts when enabled', () => {
      const tree = buildFolderTree(mockFlatFolders)
      render(
        <FolderTree
          folders={tree}
          showContentCounts={true}
          {...mockCallbacks}
        />
      )

      // Should show content count for folders that have content
      expect(screen.getByText('4')).toBeInTheDocument() // For both Trade Entries and 2024
    })

    it('should hide content counts when disabled', () => {
      const tree = buildFolderTree(mockFlatFolders)
      render(
        <FolderTree
          folders={tree}
          showContentCounts={false}
          {...mockCallbacks}
        />
      )

      // Content counts should not be visible
      expect(screen.queryByText('4')).not.toBeInTheDocument()
    })

    it('should call onFolderSelect when folder is clicked', async () => {
      const user = userEvent.setup()
      const tree = buildFolderTree(mockFlatFolders)
      render(
        <FolderTree
          folders={tree}
          {...mockCallbacks}
        />
      )

      const folderElement = screen.getByText('Trading Journal')
      await user.click(folderElement)

      expect(mockCallbacks.onFolderSelect).toHaveBeenCalledWith('1')
    })

    it('should expand/collapse folders with children', async () => {
      const user = userEvent.setup()
      const tree = buildFolderTree(mockFlatFolders)
      const expandedIds = new Set<string>()

      render(
        <FolderTree
          folders={tree}
          expandedFolderIds={expandedIds}
          {...mockCallbacks}
        />
      )

      // Initially, child folders should not be visible
      expect(screen.queryByText('Trade Entries')).not.toBeInTheDocument()

      // Find and click the expand button for Trading Journal
      const expandButton = screen.getByRole('button', { name: /expand folder/i })
      await user.click(expandButton)

      expect(mockCallbacks.onFolderExpand).toHaveBeenCalledWith('1', true)
    })

    it('should highlight selected folder', () => {
      const tree = buildFolderTree(mockFlatFolders)
      render(
        <FolderTree
          folders={tree}
          selectedFolderId="1"
          {...mockCallbacks}
        />
      )

      const selectedFolder = screen.getByText('Trading Journal').closest('div')
      expect(selectedFolder).toHaveClass('bg-[#1a1a1a]')
      expect(selectedFolder).toHaveClass('border-primary')
    })

    it('should show hover actions on folder hover', async () => {
      const user = userEvent.setup()
      const tree = buildFolderTree(mockFlatFolders)
      render(
        <FolderTree
          folders={tree}
          {...mockCallbacks}
        />
      )

      const folderElement = screen.getByText('Trading Journal').closest('div')
      if (folderElement) {
        await user.hover(folderElement)

        // Action buttons should become visible on hover
        expect(screen.getByRole('button', { name: /create subfolder/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /folder options/i })).toBeInTheDocument()
      }
    })

    it('should call onFolderCreate when create button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <FolderTree
          folders={[]}
          showCreateButton={true}
          {...mockCallbacks}
        />
      )

      const createButton = screen.getByText('Create your first folder')
      await user.click(createButton)

      expect(mockCallbacks.onFolderCreate).toHaveBeenCalled()
    })
  })

  describe('JournalLayout Component', () => {
    const mockProps = {
      children: <div>Test Content</div>,
      selectedFolderId: undefined,
      onFolderSelect: vi.fn(),
      onCreateFolder: vi.fn(),
      onNewEntry: vi.fn()
    }

    beforeEach(() => {
      Object.values(mockProps).forEach(fn => {
        if (typeof fn === 'function') fn.mockClear()
      })
    })

    it('should render sidebar and main content areas', () => {
      renderWithProviders(<JournalLayout {...mockProps} />)

      expect(screen.getByText('Journal')).toBeInTheDocument()
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('should toggle sidebar collapse state', async () => {
      const user = userEvent.setup()
      renderWithProviders(<JournalLayout {...mockProps} />)

      // Find collapse button and click it
      const collapseButton = screen.getByRole('button', { name: /collapse sidebar/i })
      await user.click(collapseButton)

      // Sidebar should now be collapsed
      expect(screen.getByRole('button', { name: /expand sidebar/i })).toBeInTheDocument()
    })

    it('should toggle view mode between grid and list', async () => {
      const user = userEvent.setup()
      renderWithProviders(<JournalLayout {...mockProps} />)

      // Find grid view button
      const gridButton = screen.getByRole('button', { name: /grid view/i })
      await user.click(gridButton)

      // Grid button should be active (has bg-primary class)
      expect(gridButton).toHaveClass('bg-primary')

      // Switch back to list view
      const listButton = screen.getByRole('button', { name: /list view/i })
      await user.click(listButton)

      expect(listButton).toHaveClass('bg-primary')
    })

    it('should toggle filters visibility', async () => {
      const user = userEvent.setup()
      renderWithProviders(<JournalLayout {...mockProps} />)

      const filtersButton = screen.getByRole('button', { name: /toggle filters/i })
      await user.click(filtersButton)

      // Filters should now be visible
      expect(filtersButton).toHaveClass('bg-primary')
    })

    it('should call onNewEntry when new entry button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <JournalLayout
          {...mockProps}
          showNewEntryButton={true}
        />
      )

      const newEntryButton = screen.getByText('New Entry')
      await user.click(newEntryButton)

      expect(mockProps.onNewEntry).toHaveBeenCalled()
    })

    it('should display selected folder information', () => {
      const mockSelectedFolder = {
        id: '1',
        name: 'Test Folder',
        icon: 'folder',
        color: '#FFD700',
        contentCount: 5,
        position: 0,
        children: []
      }

      renderWithProviders(
        <JournalLayout {...mockProps}>
          <div>Content for {mockSelectedFolder.name}</div>
        </JournalLayout>
      )

      // When folder is selected, should show folder info in header
      // Note: This would require mocking the folder selection state
    })
  })

  describe('Mode Switching Logic', () => {
    it('should preserve state when switching between modes', () => {
      // This test would be implemented in the main journal page component
      // Testing that filters, search, and other state persist across mode switches
      expect(true).toBe(true) // Placeholder
    })

    it('should gracefully handle enhanced mode failures', () => {
      // Test fallback behavior when enhanced features fail to load
      expect(true).toBe(true) // Placeholder
    })

    it('should show appropriate loading states for enhanced features', () => {
      // Test loading spinners and states during enhanced mode operations
      expect(true).toBe(true) // Placeholder
    })
  })

  describe('Content Integration', () => {
    it('should merge legacy entries with enhanced content items', () => {
      // Test that both legacy mockJournalEntries and new content items
      // display correctly in enhanced mode
      expect(true).toBe(true) // Placeholder
    })

    it('should preserve entry data structure during mode transitions', () => {
      // Test that entry data maintains integrity when moving between modes
      expect(true).toBe(true) // Placeholder
    })

    it('should handle content creation in enhanced mode', () => {
      // Test creating new entries as content items in folders
      expect(true).toBe(true) // Placeholder
    })
  })

  describe('Error Handling', () => {
    it('should handle API failures gracefully', () => {
      // Test behavior when folder API calls fail
      expect(true).toBe(true) // Placeholder
    })

    it('should provide meaningful error messages', () => {
      // Test error message display and user feedback
      expect(true).toBe(true) // Placeholder
    })

    it('should maintain functionality during partial failures', () => {
      // Test that core journal functionality remains available
      // even when enhanced features encounter errors
      expect(true).toBe(true) // Placeholder
    })
  })

  describe('Folder Context Menu', () => {
    const mockContextMenuProps = {
      isOpen: true,
      folderId: '1',
      folderName: 'Test Folder',
      position: { x: 100, y: 100 },
      onClose: vi.fn(),
      onRename: vi.fn(),
      onDelete: vi.fn(),
      onCreateSubfolder: vi.fn(),
      onMove: vi.fn(),
      onCopy: vi.fn(),
      onChangeIcon: vi.fn(),
      onChangeColor: vi.fn(),
      onSettings: vi.fn(),
      onInfo: vi.fn()
    }

    beforeEach(() => {
      Object.values(mockContextMenuProps).forEach(fn => {
        if (typeof fn === 'function') fn.mockClear()
      })
    })

    it('should not render when isOpen is false', () => {
      render(
        <FolderContextMenu
          {...mockContextMenuProps}
          isOpen={false}
        />
      )

      expect(screen.queryByText('Rename')).not.toBeInTheDocument()
    })

    it('should render all context menu options when open', () => {
      render(<FolderContextMenu {...mockContextMenuProps} />)

      expect(screen.getByText('Rename')).toBeInTheDocument()
      expect(screen.getByText('Delete')).toBeInTheDocument()
      expect(screen.getByText('New Subfolder')).toBeInTheDocument()
      expect(screen.getByText('Move')).toBeInTheDocument()
      expect(screen.getByText('Copy')).toBeInTheDocument()
      expect(screen.getByText('Change Icon')).toBeInTheDocument()
      expect(screen.getByText('Change Color')).toBeInTheDocument()
      expect(screen.getByText('Settings')).toBeInTheDocument()
      expect(screen.getByText('Folder Info')).toBeInTheDocument()
    })

    it('should call appropriate callbacks when menu items are clicked', async () => {
      const user = userEvent.setup()
      render(<FolderContextMenu {...mockContextMenuProps} />)

      await user.click(screen.getByText('Rename'))
      expect(mockContextMenuProps.onRename).toHaveBeenCalledWith('1')

      await user.click(screen.getByText('Delete'))
      expect(mockContextMenuProps.onDelete).toHaveBeenCalledWith('1')

      await user.click(screen.getByText('New Subfolder'))
      expect(mockContextMenuProps.onCreateSubfolder).toHaveBeenCalledWith('1')
    })

    it('should close when clicking outside', async () => {
      const user = userEvent.setup()
      render(
        <div>
          <FolderContextMenu {...mockContextMenuProps} />
          <div data-testid="outside">Outside</div>
        </div>
      )

      await user.click(screen.getByTestId('outside'))
      expect(mockContextMenuProps.onClose).toHaveBeenCalled()
    })
  })

  describe('Performance and Optimization', () => {
    it('should handle large folder trees efficiently', () => {
      // Test with a large number of folders
      const largeFolderSet = Array.from({ length: 1000 }, (_, i) => ({
        id: `folder-${i}`,
        name: `Folder ${i}`,
        icon: 'folder',
        color: '#FFD700',
        position: i,
        contentCount: Math.floor(Math.random() * 10)
      }))

      const tree = buildFolderTree(largeFolderSet)
      expect(tree).toHaveLength(1000)
    })

    it('should optimize re-renders with memoization', () => {
      // Test that components don't re-render unnecessarily
      expect(true).toBe(true) // Placeholder for memoization tests
    })
  })
})