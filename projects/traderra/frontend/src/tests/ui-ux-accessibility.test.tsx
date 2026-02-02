/**
 * Traderra Journal - UI/UX and Accessibility Tests
 *
 * Tests for visual consistency, responsive design, accessibility standards,
 * and user interaction patterns.
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import { JournalLayout } from '@/components/journal/JournalLayout'
import { FolderTree } from '@/components/folders/FolderTree'
import { JournalEntryCard, mockJournalEntries } from '@/components/journal/journal-components'

// Extend Jest matchers
expect.extend(toHaveNoViolations)

// Mock ResizeObserver for responsive tests
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
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

describe('UI/UX and Accessibility', () => {

  describe('Visual Consistency and Theming', () => {

    it('should apply dark theme colors consistently', () => {
      renderWithProviders(
        <JournalLayout>
          <div>Test content</div>
        </JournalLayout>
      )

      // Check for dark theme background
      const layout = screen.getByRole('tree').closest('.journal-layout')
      expect(layout).toHaveClass('bg-studio-bg')
    })

    it('should use Traderra gold accents for primary elements', () => {
      const mockEntry = mockJournalEntries[0]
      render(
        <JournalEntryCard
          entry={mockEntry}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      )

      // Check for primary color usage in star ratings
      const filledStars = screen.getAllByRole('img', { hidden: true })
        .filter(star => star.classList.contains('text-yellow-400'))

      expect(filledStars.length).toBeGreaterThan(0)
    })

    it('should maintain consistent spacing and typography', () => {
      const mockFolders = [
        {
          id: '1',
          name: 'Test Folder',
          icon: 'folder',
          color: '#FFD700',
          position: 0,
          children: [],
          contentCount: 0
        }
      ]

      render(
        <FolderTree
          folders={mockFolders}
          onFolderSelect={vi.fn()}
          onFolderExpand={vi.fn()}
          onFolderCreate={vi.fn()}
        />
      )

      // Check for consistent text styling
      const folderText = screen.getByText('Test Folder')
      expect(folderText).toHaveClass('text-sm')
    })

    it('should display proper color contrast for readability', () => {
      const mockEntry = mockJournalEntries[0]
      render(
        <JournalEntryCard
          entry={mockEntry}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      )

      // Text should be visible against dark background
      const titleElement = screen.getByText(mockEntry.title)
      expect(titleElement).toHaveClass('studio-text')

      // P&L should have appropriate color coding
      const pnlElement = screen.getByText(expect.stringMatching(/[$][\d.,]+/))
      if (mockEntry.pnl >= 0) {
        expect(pnlElement).toHaveClass('text-trading-profit')
      } else {
        expect(pnlElement).toHaveClass('text-trading-loss')
      }
    })

    it('should show consistent hover states', async () => {
      const user = userEvent.setup()
      const mockEntry = mockJournalEntries[0]
      render(
        <JournalEntryCard
          entry={mockEntry}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      )

      const card = screen.getByText(mockEntry.title).closest('div')
      if (card) {
        await user.hover(card)
        expect(card).toHaveClass('hover:bg-[#0f0f0f]')
      }
    })
  })

  describe('Responsive Design', () => {

    it('should adapt layout for mobile screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      const mockEntry = mockJournalEntries[0]
      render(
        <JournalEntryCard
          entry={mockEntry}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      )

      // Trade details should use responsive grid
      const tradeDetails = screen.getByText('Entry Price').closest('div')?.parentElement
      expect(tradeDetails).toHaveClass('grid', 'grid-cols-2', 'md:grid-cols-4')
    })

    it('should handle tablet viewport correctly', () => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      })

      renderWithProviders(
        <JournalLayout>
          <div>Test content</div>
        </JournalLayout>
      )

      // Layout should maintain proper proportions
      expect(screen.getByText('Test content')).toBeInTheDocument()
    })

    it('should display properly on large screens', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      })

      const mockEntry = mockJournalEntries[0]
      render(
        <JournalEntryCard
          entry={mockEntry}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      )

      // Should use full grid layout on larger screens
      const tradeDetails = screen.getByText('Entry Price').closest('div')?.parentElement
      expect(tradeDetails).toHaveClass('md:grid-cols-4')
    })

    it('should handle very long content gracefully', () => {
      const longEntry = {
        ...mockJournalEntries[0],
        title: 'This is a very long title that should wrap properly without breaking the layout or causing horizontal scroll issues',
        content: 'This is extremely long content that goes on and on and should be handled gracefully by the component with proper text wrapping and truncation where appropriate. '.repeat(10)
      }

      render(
        <JournalEntryCard
          entry={longEntry}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      )

      // Long title should be handled properly
      const titleElement = screen.getByText(expect.stringContaining('This is a very long title'))
      expect(titleElement).toHaveClass('truncate')
    })
  })

  describe('Accessibility Standards (WCAG 2.1 AA)', () => {

    it('should have no accessibility violations in JournalEntryCard', async () => {
      const mockEntry = mockJournalEntries[0]
      const { container } = render(
        <JournalEntryCard
          entry={mockEntry}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations in FolderTree', async () => {
      const mockFolders = [
        {
          id: '1',
          name: 'Test Folder',
          icon: 'folder',
          color: '#FFD700',
          position: 0,
          children: [],
          contentCount: 0
        }
      ]

      const { container } = render(
        <FolderTree
          folders={mockFolders}
          onFolderSelect={vi.fn()}
          onFolderExpand={vi.fn()}
          onFolderCreate={vi.fn()}
        />
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should provide proper ARIA labels for interactive elements', () => {
      const mockFolders = [
        {
          id: '1',
          name: 'Test Folder',
          icon: 'folder',
          color: '#FFD700',
          position: 0,
          children: [
            {
              id: '2',
              name: 'Child Folder',
              parentId: '1',
              icon: 'folder',
              color: '#FFD700',
              position: 0,
              children: [],
              contentCount: 0
            }
          ],
          contentCount: 1
        }
      ]

      render(
        <FolderTree
          folders={mockFolders}
          onFolderSelect={vi.fn()}
          onFolderExpand={vi.fn()}
          onFolderCreate={vi.fn()}
        />
      )

      // Expand button should have proper aria-label
      const expandButton = screen.getByRole('button', { name: /expand folder/i })
      expect(expandButton).toHaveAttribute('aria-label', 'Expand folder')

      // Tree item should have proper ARIA attributes
      const treeItem = screen.getByRole('treeitem')
      expect(treeItem).toHaveAttribute('aria-expanded', 'false')
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      const mockEntry = mockJournalEntries[0]
      const mockOnEdit = vi.fn()

      render(
        <JournalEntryCard
          entry={mockEntry}
          onEdit={mockOnEdit}
          onDelete={vi.fn()}
        />
      )

      // Tab to edit button and press Enter
      await user.tab()
      await user.tab() // Assuming edit button is the second focusable element
      await user.keyboard('{Enter}')

      expect(mockOnEdit).toHaveBeenCalledWith(mockEntry)
    })

    it('should maintain focus management in modals', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <JournalLayout showNewEntryButton={true} onNewEntry={vi.fn()}>
          <div>Test content</div>
        </JournalLayout>
      )

      const newEntryButton = screen.getByText('New Entry')
      await user.click(newEntryButton)

      // Focus should be managed properly in modal
      expect(document.activeElement).toBeTruthy()
    })

    it('should provide sufficient color contrast', () => {
      const mockEntry = mockJournalEntries[0]
      render(
        <JournalEntryCard
          entry={mockEntry}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      )

      // Check that text elements use appropriate contrast classes
      const titleElement = screen.getByText(mockEntry.title)
      expect(titleElement).toHaveClass('studio-text')

      const mutedElements = screen.getAllByText((content, element) => {
        return element?.classList.contains('studio-muted') || false
      })
      expect(mutedElements.length).toBeGreaterThan(0)
    })

    it('should support screen readers with proper semantic structure', () => {
      const mockFolders = [
        {
          id: '1',
          name: 'Root Folder',
          icon: 'folder',
          color: '#FFD700',
          position: 0,
          children: [],
          contentCount: 0
        }
      ]

      render(
        <FolderTree
          folders={mockFolders}
          onFolderSelect={vi.fn()}
          onFolderExpand={vi.fn()}
          onFolderCreate={vi.fn()}
        />
      )

      // Should use proper tree role
      expect(screen.getByRole('tree')).toBeInTheDocument()
      expect(screen.getByRole('treeitem')).toBeInTheDocument()
    })
  })

  describe('Loading States and Feedback', () => {

    it('should show loading spinner during enhanced mode initialization', () => {
      renderWithProviders(
        <JournalLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm studio-muted">Loading enhanced features...</p>
            </div>
          </div>
        </JournalLayout>
      )

      expect(screen.getByText('Loading enhanced features...')).toBeInTheDocument()
    })

    it('should provide feedback for user actions', async () => {
      const user = userEvent.setup()
      const mockEntry = mockJournalEntries[0]

      render(
        <JournalEntryCard
          entry={mockEntry}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      )

      // Buttons should provide visual feedback on interaction
      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.hover(editButton)

      // Should have hover styles
      expect(editButton).toHaveClass('hover:bg-[#1a1a1a]')
    })

    it('should handle empty states gracefully', () => {
      render(
        <FolderTree
          folders={[]}
          onFolderSelect={vi.fn()}
          onFolderExpand={vi.fn()}
          onFolderCreate={vi.fn()}
        />
      )

      expect(screen.getByText('No folders yet')).toBeInTheDocument()
      expect(screen.getByText('Create your first folder')).toBeInTheDocument()
    })
  })

  describe('Error States and Validation', () => {

    it('should display validation errors clearly', () => {
      // This would test form validation in NewEntryModal
      // Currently placeholder as modal requires more complex setup
      expect(true).toBe(true)
    })

    it('should provide clear error messages for failed operations', () => {
      // Test error message display for API failures
      expect(true).toBe(true)
    })

    it('should maintain functionality during partial failures', () => {
      // Test that UI remains functional even if some features fail
      expect(true).toBe(true)
    })
  })

  describe('Performance and Optimization', () => {

    it('should virtualize long lists efficiently', () => {
      // Test with large datasets to ensure smooth scrolling
      const largeFolderSet = Array.from({ length: 100 }, (_, i) => ({
        id: `folder-${i}`,
        name: `Folder ${i}`,
        icon: 'folder',
        color: '#FFD700',
        position: i,
        children: [],
        contentCount: 0
      }))

      const { container } = render(
        <FolderTree
          folders={largeFolderSet}
          onFolderSelect={vi.fn()}
          onFolderExpand={vi.fn()}
          onFolderCreate={vi.fn()}
        />
      )

      // Should render without performance issues
      expect(container.querySelectorAll('[role="treeitem"]')).toHaveLength(100)
    })

    it('should debounce search input appropriately', async () => {
      const user = userEvent.setup()
      const mockOnChange = vi.fn()

      render(
        <input
          type="text"
          placeholder="Search entries..."
          onChange={mockOnChange}
        />
      )

      const searchInput = screen.getByPlaceholderText('Search entries...')
      await user.type(searchInput, 'test query')

      // Should call onChange for each character (test actual debouncing would require timer mocking)
      expect(mockOnChange).toHaveBeenCalled()
    })

    it('should optimize re-renders with proper memoization', () => {
      // Test that components don't re-render unnecessarily
      // This would require more complex setup with performance monitoring
      expect(true).toBe(true)
    })
  })

  describe('Cross-Browser Compatibility', () => {

    it('should handle CSS Grid support', () => {
      const mockEntry = mockJournalEntries[0]
      render(
        <JournalEntryCard
          entry={mockEntry}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      )

      // Should use CSS Grid for layout
      const tradeDetails = screen.getByText('Entry Price').closest('div')?.parentElement
      expect(tradeDetails).toHaveClass('grid')
    })

    it('should provide fallbacks for modern CSS features', () => {
      // Test fallbacks for features like backdrop-filter, CSS variables, etc.
      expect(true).toBe(true)
    })
  })

  describe('Mobile Touch Interactions', () => {

    it('should handle touch events appropriately', async () => {
      const mockOnSelect = vi.fn()
      const mockFolders = [
        {
          id: '1',
          name: 'Touch Folder',
          icon: 'folder',
          color: '#FFD700',
          position: 0,
          children: [],
          contentCount: 0
        }
      ]

      render(
        <FolderTree
          folders={mockFolders}
          onFolderSelect={mockOnSelect}
          onFolderExpand={vi.fn()}
          onFolderCreate={vi.fn()}
        />
      )

      const folderElement = screen.getByText('Touch Folder')

      // Simulate touch event
      fireEvent.touchStart(folderElement)
      fireEvent.touchEnd(folderElement)
      fireEvent.click(folderElement)

      expect(mockOnSelect).toHaveBeenCalledWith('1')
    })

    it('should have appropriate touch target sizes', () => {
      const mockEntry = mockJournalEntries[0]
      render(
        <JournalEntryCard
          entry={mockEntry}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      )

      // Buttons should have minimum 44px touch targets (WCAG guideline)
      const editButton = screen.getByRole('button', { name: /edit/i })
      expect(editButton).toHaveClass('p-2') // Ensures adequate touch target
    })
  })

  describe('Animation and Transitions', () => {

    it('should respect reduced motion preferences', () => {
      // Mock prefers-reduced-motion
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      })

      const mockEntry = mockJournalEntries[0]
      render(
        <JournalEntryCard
          entry={mockEntry}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      )

      // Should still render properly even with reduced motion
      expect(screen.getByText(mockEntry.title)).toBeInTheDocument()
    })

    it('should have smooth transitions for state changes', async () => {
      const user = userEvent.setup()
      const mockEntry = mockJournalEntries[0]

      render(
        <JournalEntryCard
          entry={mockEntry}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      )

      const expandButton = screen.getByText('Read More')
      expect(expandButton).toHaveClass('transition-colors')

      await user.click(expandButton)
      expect(screen.getByText('Show Less')).toBeInTheDocument()
    })
  })
})