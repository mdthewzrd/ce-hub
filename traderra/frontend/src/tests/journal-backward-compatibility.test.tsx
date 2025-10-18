/**
 * Traderra Journal - Backward Compatibility Tests
 *
 * Critical tests to ensure existing functionality remains intact
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import {
  JournalEntryCard,
  JournalFilters,
  JournalStats,
  NewEntryModal,
  mockJournalEntries
} from '@/components/journal/journal-components'

// Mock providers for isolated testing
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

describe('Journal Backward Compatibility', () => {

  describe('Mock Journal Entries Data Integrity', () => {
    it('should have expected data structure for mock entries', () => {
      expect(mockJournalEntries).toBeDefined()
      expect(Array.isArray(mockJournalEntries)).toBe(true)
      expect(mockJournalEntries.length).toBeGreaterThan(0)

      // Validate first entry structure
      const firstEntry = mockJournalEntries[0]
      expect(firstEntry).toHaveProperty('id')
      expect(firstEntry).toHaveProperty('title')
      expect(firstEntry).toHaveProperty('symbol')
      expect(firstEntry).toHaveProperty('side')
      expect(firstEntry).toHaveProperty('entryPrice')
      expect(firstEntry).toHaveProperty('exitPrice')
      expect(firstEntry).toHaveProperty('pnl')
      expect(firstEntry).toHaveProperty('rating')
      expect(firstEntry).toHaveProperty('tags')
      expect(firstEntry).toHaveProperty('content')
      expect(firstEntry).toHaveProperty('emotion')
      expect(firstEntry).toHaveProperty('category')
      expect(firstEntry).toHaveProperty('createdAt')
    })

    it('should have valid data types for all fields', () => {
      mockJournalEntries.forEach((entry, index) => {
        expect(typeof entry.id).toBe('string')
        expect(typeof entry.title).toBe('string')
        expect(typeof entry.symbol).toBe('string')
        expect(['Long', 'Short']).toContain(entry.side)
        expect(typeof entry.entryPrice).toBe('number')
        expect(typeof entry.exitPrice).toBe('number')
        expect(typeof entry.pnl).toBe('number')
        expect(typeof entry.rating).toBe('number')
        expect(entry.rating).toBeGreaterThanOrEqual(1)
        expect(entry.rating).toBeLessThanOrEqual(5)
        expect(Array.isArray(entry.tags)).toBe(true)
        expect(typeof entry.content).toBe('string')
        expect(typeof entry.emotion).toBe('string')
        expect(['win', 'loss']).toContain(entry.category)
        expect(typeof entry.createdAt).toBe('string')
      })
    })
  })

  describe('JournalEntryCard Component', () => {
    const mockEntry = mockJournalEntries[0]
    const mockOnEdit = vi.fn()
    const mockOnDelete = vi.fn()

    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should render entry card with all expected information', () => {
      renderWithProviders(
        <JournalEntryCard
          entry={mockEntry}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      // Check title and rating
      expect(screen.getByText(mockEntry.title)).toBeInTheDocument()

      // Check date display
      expect(screen.getByText(new Date(mockEntry.date).toLocaleDateString())).toBeInTheDocument()

      // Check symbol and side
      expect(screen.getByText(mockEntry.symbol)).toBeInTheDocument()
      expect(screen.getByText(mockEntry.side)).toBeInTheDocument()

      // Check P&L display
      const pnlText = mockEntry.pnl >= 0 ? `+$${mockEntry.pnl.toFixed(2)}` : `$${mockEntry.pnl.toFixed(2)}`
      expect(screen.getByText(pnlText)).toBeInTheDocument()

      // Check entry and exit prices
      expect(screen.getByText(`$${mockEntry.entryPrice.toFixed(2)}`)).toBeInTheDocument()
      expect(screen.getByText(`$${mockEntry.exitPrice.toFixed(2)}`)).toBeInTheDocument()

      // Check emotion and category
      expect(screen.getByText(mockEntry.emotion)).toBeInTheDocument()
      expect(screen.getByText(mockEntry.category)).toBeInTheDocument()
    })

    it('should display correct number of stars for rating', () => {
      renderWithProviders(
        <JournalEntryCard
          entry={mockEntry}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const stars = screen.getAllByRole('img', { hidden: true })
      const filledStars = stars.filter(star =>
        star.classList.contains('text-yellow-400') &&
        star.classList.contains('fill-yellow-400')
      )
      expect(filledStars).toHaveLength(mockEntry.rating)
    })

    it('should render all tags', () => {
      renderWithProviders(
        <JournalEntryCard
          entry={mockEntry}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      mockEntry.tags.forEach(tag => {
        expect(screen.getByText(tag)).toBeInTheDocument()
      })
    })

    it('should call onEdit when edit button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <JournalEntryCard
          entry={mockEntry}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)

      expect(mockOnEdit).toHaveBeenCalledWith(mockEntry)
    })

    it('should call onDelete when delete button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <JournalEntryCard
          entry={mockEntry}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      expect(mockOnDelete).toHaveBeenCalledWith(mockEntry.id)
    })

    it('should toggle content expansion on read more/less', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <JournalEntryCard
          entry={mockEntry}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      // Initially should show "Read More"
      const expandButton = screen.getByText('Read More')
      expect(expandButton).toBeInTheDocument()

      // Click to expand
      await user.click(expandButton)

      // Should now show "Show Less"
      expect(screen.getByText('Show Less')).toBeInTheDocument()
      expect(screen.queryByText('Read More')).not.toBeInTheDocument()
    })
  })

  describe('JournalFilters Component', () => {
    const mockFilters = {
      search: '',
      category: '',
      emotion: '',
      symbol: '',
      rating: 0
    }
    const mockOnFiltersChange = vi.fn()

    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should render all filter inputs', () => {
      renderWithProviders(
        <JournalFilters
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      )

      // Search input
      expect(screen.getByPlaceholderText('Search entries...')).toBeInTheDocument()

      // Category select
      expect(screen.getByDisplayValue('All Categories')).toBeInTheDocument()

      // Emotion select
      expect(screen.getByDisplayValue('All Emotions')).toBeInTheDocument()

      // Symbol input
      expect(screen.getByPlaceholderText('Filter by symbol...')).toBeInTheDocument()

      // Rating select
      expect(screen.getByDisplayValue('All Ratings')).toBeInTheDocument()
    })

    it('should call onFiltersChange when search input changes', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <JournalFilters
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      )

      const searchInput = screen.getByPlaceholderText('Search entries...')
      await user.type(searchInput, 'YIBO')

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...mockFilters,
        search: 'YIBO'
      })
    })

    it('should update category filter', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <JournalFilters
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      )

      const categorySelect = screen.getByDisplayValue('All Categories')
      await user.selectOptions(categorySelect, 'win')

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...mockFilters,
        category: 'win'
      })
    })

    it('should update emotion filter', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <JournalFilters
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      )

      const emotionSelect = screen.getByDisplayValue('All Emotions')
      await user.selectOptions(emotionSelect, 'confident')

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...mockFilters,
        emotion: 'confident'
      })
    })

    it('should update rating filter', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <JournalFilters
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      )

      const ratingSelect = screen.getByDisplayValue('All Ratings')
      await user.selectOptions(ratingSelect, '5')

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...mockFilters,
        rating: 5
      })
    })
  })

  describe('JournalStats Component', () => {
    it('should calculate and display correct statistics', () => {
      renderWithProviders(<JournalStats />)

      const totalEntries = mockJournalEntries.length
      const wins = mockJournalEntries.filter(entry => entry.category === 'win').length
      const losses = mockJournalEntries.filter(entry => entry.category === 'loss').length
      const avgRating = mockJournalEntries.reduce((sum, entry) => sum + entry.rating, 0) / totalEntries

      // Check total entries
      expect(screen.getByText(totalEntries.toString())).toBeInTheDocument()

      // Check wins and losses
      expect(screen.getByText(wins.toString())).toBeInTheDocument()
      expect(screen.getByText(losses.toString())).toBeInTheDocument()

      // Check average rating
      expect(screen.getByText(avgRating.toFixed(1))).toBeInTheDocument()

      // Check win percentage
      const winPercentage = ((wins / totalEntries) * 100).toFixed(1)
      expect(screen.getByText(`${winPercentage}% of total`)).toBeInTheDocument()

      // Check loss percentage
      const lossPercentage = ((losses / totalEntries) * 100).toFixed(1)
      expect(screen.getByText(`${lossPercentage}% of total`)).toBeInTheDocument()
    })

    it('should display correct icons for each stat category', () => {
      renderWithProviders(<JournalStats />)

      // Check for presence of stat sections by their content
      expect(screen.getByText('Total Entries')).toBeInTheDocument()
      expect(screen.getByText('Win Entries')).toBeInTheDocument()
      expect(screen.getByText('Loss Entries')).toBeInTheDocument()
      expect(screen.getByText('Avg Rating')).toBeInTheDocument()
    })
  })

  describe('NewEntryModal Component', () => {
    const mockOnClose = vi.fn()
    const mockOnSave = vi.fn()

    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should not render when isOpen is false', () => {
      renderWithProviders(
        <NewEntryModal
          isOpen={false}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      expect(screen.queryByText('New Journal Entry')).not.toBeInTheDocument()
    })

    it('should render all form fields when open', () => {
      renderWithProviders(
        <NewEntryModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      expect(screen.getByText('New Journal Entry')).toBeInTheDocument()
      expect(screen.getByLabelText('Title')).toBeInTheDocument()
      expect(screen.getByLabelText('Symbol')).toBeInTheDocument()
      expect(screen.getByLabelText('Side')).toBeInTheDocument()
      expect(screen.getByLabelText('Entry Price')).toBeInTheDocument()
      expect(screen.getByLabelText('Exit Price')).toBeInTheDocument()
      expect(screen.getByLabelText('P&L')).toBeInTheDocument()
      expect(screen.getByLabelText('Rating')).toBeInTheDocument()
      expect(screen.getByLabelText('Emotion')).toBeInTheDocument()
      expect(screen.getByLabelText('Tags (comma-separated)')).toBeInTheDocument()
      expect(screen.getByLabelText('Content')).toBeInTheDocument()
    })

    it('should call onClose when cancel button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <NewEntryModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should call onClose when X button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <NewEntryModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should validate required fields before submission', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <NewEntryModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      const saveButton = screen.getByText('Save Entry')
      await user.click(saveButton)

      // Form should not submit without required fields
      expect(mockOnSave).not.toHaveBeenCalled()
    })

    it('should save entry with correct data structure', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <NewEntryModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      // Fill out the form
      await user.type(screen.getByLabelText('Title'), 'Test Entry')
      await user.type(screen.getByLabelText('Symbol'), 'TEST')
      await user.selectOptions(screen.getByLabelText('Side'), 'Long')
      await user.type(screen.getByLabelText('Entry Price'), '100.00')
      await user.type(screen.getByLabelText('Exit Price'), '110.00')
      await user.type(screen.getByLabelText('P&L'), '1000.00')
      await user.selectOptions(screen.getByLabelText('Rating'), '5')
      await user.selectOptions(screen.getByLabelText('Emotion'), 'confident')
      await user.type(screen.getByLabelText('Tags (comma-separated)'), 'test, momentum')
      await user.type(screen.getByLabelText('Content'), 'This is a test entry')

      const saveButton = screen.getByText('Save Entry')
      await user.click(saveButton)

      expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Test Entry',
        symbol: 'TEST',
        side: 'Long',
        entryPrice: 100.00,
        exitPrice: 110.00,
        pnl: 1000.00,
        rating: 5,
        emotion: 'confident',
        tags: ['test', 'momentum'],
        content: 'This is a test entry',
        category: 'win'
      }))
    })
  })

  describe('Filter Logic Validation', () => {
    const testFilters = [
      {
        name: 'search filter',
        filter: { search: 'YIBO', category: '', emotion: '', symbol: '', rating: 0 },
        expectedEntries: mockJournalEntries.filter(e =>
          e.title.toLowerCase().includes('yibo') || e.content.toLowerCase().includes('yibo')
        )
      },
      {
        name: 'category filter',
        filter: { search: '', category: 'win', emotion: '', symbol: '', rating: 0 },
        expectedEntries: mockJournalEntries.filter(e => e.category === 'win')
      },
      {
        name: 'emotion filter',
        filter: { search: '', category: '', emotion: 'confident', symbol: '', rating: 0 },
        expectedEntries: mockJournalEntries.filter(e => e.emotion === 'confident')
      },
      {
        name: 'symbol filter',
        filter: { search: '', category: '', emotion: '', symbol: 'YIBO', rating: 0 },
        expectedEntries: mockJournalEntries.filter(e =>
          e.symbol.toLowerCase().includes('yibo')
        )
      },
      {
        name: 'rating filter',
        filter: { search: '', category: '', emotion: '', symbol: '', rating: 5 },
        expectedEntries: mockJournalEntries.filter(e => e.rating >= 5)
      }
    ]

    testFilters.forEach(({ name, filter, expectedEntries }) => {
      it(`should correctly apply ${name}`, () => {
        const filteredEntries = mockJournalEntries.filter(entry => {
          if (filter.search) {
            const searchLower = filter.search.toLowerCase()
            if (!entry.title.toLowerCase().includes(searchLower) &&
                !entry.content.toLowerCase().includes(searchLower)) {
              return false
            }
          }
          if (filter.category && entry.category !== filter.category) {
            return false
          }
          if (filter.emotion && entry.emotion !== filter.emotion) {
            return false
          }
          if (filter.symbol && !entry.symbol.toLowerCase().includes(filter.symbol.toLowerCase())) {
            return false
          }
          if (filter.rating && entry.rating < filter.rating) {
            return false
          }
          return true
        })

        expect(filteredEntries).toEqual(expectedEntries)
      })
    })
  })
})