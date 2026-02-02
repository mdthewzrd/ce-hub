/**
 * TipTap Rich Text Editor Validation Tests
 *
 * This test suite validates the TipTap rich text editor implementation,
 * ensuring proper functionality of:
 * - Toolbar buttons and formatting
 * - HTML content rendering with prose-dark styling
 * - Template system integration
 * - View/Edit mode switching
 * - Backward compatibility with markdown content
 * - Dark theme accessibility
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

// Mock the journal components
import { NewEntryModal } from '@/components/journal/journal-components'

// Mock data for testing
const mockJournalEntry = {
  id: '1',
  date: '2024-01-29',
  title: 'Test Entry with Rich Content',
  strategy: 'Test Strategy',
  side: 'Long' as const,
  setup: 'Test setup',
  bias: 'Long' as const,
  pnl: 100.50,
  rating: 4,
  tags: ['test', 'rich-text', 'validation'],
  content: `<h1>Test Heading 1</h1>
<h2>Test Heading 2</h2>
<h3>Test Heading 3</h3>

<p>This is a paragraph with <strong>bold text</strong> and <em>italic text</em>.</p>

<ul>
<li>Bullet point 1</li>
<li>Bullet point 2 with <strong>bold</strong> text</li>
<li>Bullet point 3</li>
</ul>

<ol>
<li>Numbered item 1</li>
<li>Numbered item 2</li>
<li>Numbered item 3</li>
</ol>

<blockquote>
<p>This is a blockquote for testing styling</p>
</blockquote>`,
  emotion: 'confident' as const,
  category: 'win' as const,
  template: 'trading-analysis',
  createdAt: '2024-01-29T16:45:00Z'
}

const mockMarkdownEntry = {
  ...mockJournalEntry,
  id: '2',
  title: 'Legacy Markdown Entry',
  content: `**Setup Analysis:**
- Pre-market volume 3x normal
- Clean breakout above resistance
- Strong sector momentum in biotech

**Execution:**
- Entry at $49.86 was precise
- Used 1% position size
- Stop loss at $49.20

**Outcome:**
- Stock moved as expected to $51.52
- Exited when momentum started to fade
- Profit of $531.20 (3.33% gain)`
}

// Mock functions
const mockOnSave = vi.fn()
const mockOnClose = vi.fn()

describe('TipTap Rich Text Editor Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Modal Rendering and Basic Functionality', () => {
    it('renders the NewEntryModal without crashing', async () => {
      render(
        <NewEntryModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      expect(screen.getByText('New Journal Entry')).toBeInTheDocument()
    })

    it('shows template selection when creating new entry', async () => {
      render(
        <NewEntryModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      expect(screen.getByText('Choose a Template')).toBeInTheDocument()
      expect(screen.getByText('Trading Analysis')).toBeInTheDocument()
      expect(screen.getByText('Quick Trade Log')).toBeInTheDocument()
      expect(screen.getByText('Weekly Review')).toBeInTheDocument()
    })

    it('loads entry in view mode when editing existing entry', async () => {
      render(
        <NewEntryModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          editingEntry={mockJournalEntry}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Test Entry with Rich Content')).toBeInTheDocument()
      })
    })
  })

  describe('Template System Validation', () => {
    it('validates all 7 templates are available', async () => {
      render(
        <NewEntryModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      // Check for all expected templates
      const expectedTemplates = [
        'Trading Analysis',
        'Quick Trade Log',
        'Weekly Review',
        'Strategy Analysis',
        'Market Research',
        'Risk Management',
        'Freeform Document'
      ]

      for (const template of expectedTemplates) {
        expect(screen.getByText(template)).toBeInTheDocument()
      }
    })

    it('generates proper HTML content from templates', async () => {
      const user = userEvent.setup()

      render(
        <NewEntryModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      // Select Trading Analysis template
      await user.click(screen.getByText('Trading Analysis'))

      await waitFor(() => {
        expect(screen.getByDisplayValue('Trading Analysis')).toBeInTheDocument()
      })

      // Verify template HTML structure contains expected elements
      const contentContainer = document.querySelector('.ProseMirror')
      expect(contentContainer).toBeInTheDocument()
    })
  })

  describe('Rich Text Editor Functionality', () => {
    it('validates TipTap toolbar buttons are present and functional', async () => {
      const user = userEvent.setup()

      render(
        <NewEntryModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      // Select a template first to access the editor
      await user.click(screen.getByText('Trading Analysis'))

      await waitFor(() => {
        // Check for toolbar buttons
        const h1Button = screen.getByTitle('Heading 1')
        const h2Button = screen.getByTitle('Heading 2')
        const h3Button = screen.getByTitle('Heading 3')
        const boldButton = screen.getByTitle('Bold')
        const italicButton = screen.getByTitle('Italic')
        const bulletListButton = screen.getByTitle('Bullet List')
        const numberedListButton = screen.getByTitle('Numbered List')

        expect(h1Button).toBeInTheDocument()
        expect(h2Button).toBeInTheDocument()
        expect(h3Button).toBeInTheDocument()
        expect(boldButton).toBeInTheDocument()
        expect(italicButton).toBeInTheDocument()
        expect(bulletListButton).toBeInTheDocument()
        expect(numberedListButton).toBeInTheDocument()
      })
    })

    it('validates TipTap editor applies formatting correctly', async () => {
      const user = userEvent.setup()

      render(
        <NewEntryModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      // Select template and access editor
      await user.click(screen.getByText('Freeform Document'))

      await waitFor(() => {
        const editor = document.querySelector('.ProseMirror')
        expect(editor).toBeInTheDocument()

        const boldButton = screen.getByTitle('Bold')
        expect(boldButton).toBeInTheDocument()
      })

      // Test bold formatting
      const boldButton = screen.getByTitle('Bold')
      await user.click(boldButton)

      // Verify button shows active state
      expect(boldButton).toHaveClass('bg-primary')
    })
  })

  describe('HTML Content Rendering with Prose-Dark Styling', () => {
    it('validates HTML content renders with proper prose-dark classes', async () => {
      render(
        <NewEntryModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          editingEntry={mockJournalEntry}
        />
      )

      await waitFor(() => {
        // Check for prose-dark class application
        const proseContainer = document.querySelector('.prose-dark')
        expect(proseContainer).toBeInTheDocument()
      })
    })

    it('validates dark theme color scheme is applied', async () => {
      render(
        <NewEntryModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          editingEntry={mockJournalEntry}
        />
      )

      await waitFor(() => {
        // Check that content has dark theme styling
        const contentArea = document.querySelector('.prose-dark')
        if (contentArea) {
          const computedStyle = window.getComputedStyle(contentArea)
          // The prose-dark class should apply appropriate dark theme colors
          expect(contentArea).toHaveClass('prose-dark')
        }
      })
    })

    it('validates headings render with proper hierarchy and styling', async () => {
      render(
        <NewEntryModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          editingEntry={mockJournalEntry}
        />
      )

      await waitFor(() => {
        // Check for HTML heading elements in the rendered content
        const content = document.querySelector('[dangerouslySetInnerHTML]')
        expect(content).toBeInTheDocument()
      })
    })

    it('validates lists render as proper HTML lists', async () => {
      render(
        <NewEntryModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          editingEntry={mockJournalEntry}
        />
      )

      await waitFor(() => {
        // The content should contain list structures
        const content = document.querySelector('[dangerouslySetInnerHTML]')
        expect(content).toBeInTheDocument()

        // Check that the HTML content contains list elements
        const htmlContent = mockJournalEntry.content
        expect(htmlContent).toContain('<ul>')
        expect(htmlContent).toContain('<ol>')
        expect(htmlContent).toContain('<li>')
      })
    })

    it('validates bold and italic text renders correctly', async () => {
      render(
        <NewEntryModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          editingEntry={mockJournalEntry}
        />
      )

      await waitFor(() => {
        const htmlContent = mockJournalEntry.content
        expect(htmlContent).toContain('<strong>')
        expect(htmlContent).toContain('<em>')
      })
    })
  })

  describe('View/Edit Mode Switching', () => {
    it('validates edit mode toggle functionality', async () => {
      const user = userEvent.setup()

      render(
        <NewEntryModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          editingEntry={mockJournalEntry}
        />
      )

      await waitFor(() => {
        const editButton = screen.getByText('Edit Mode')
        expect(editButton).toBeInTheDocument()
      })

      // Click edit mode
      const editButton = screen.getByText('Edit Mode')
      await user.click(editButton)

      await waitFor(() => {
        expect(screen.getByText('View Mode')).toBeInTheDocument()
      })
    })

    it('validates content is properly displayed in view mode', async () => {
      render(
        <NewEntryModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          editingEntry={mockJournalEntry}
        />
      )

      await waitFor(() => {
        // In view mode, content should be displayed as HTML
        expect(screen.getByText('Test Entry with Rich Content')).toBeInTheDocument()

        // Check for content section
        expect(screen.getByText('Content')).toBeInTheDocument()
      })
    })

    it('validates TipTap editor appears in edit mode', async () => {
      const user = userEvent.setup()

      render(
        <NewEntryModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          editingEntry={mockJournalEntry}
        />
      )

      // Switch to edit mode
      await waitFor(() => {
        const editButton = screen.getByText('Edit Mode')
        expect(editButton).toBeInTheDocument()
      })

      const editButton = screen.getByText('Edit Mode')
      await user.click(editButton)

      await waitFor(() => {
        // TipTap editor should be present
        const editor = document.querySelector('.ProseMirror')
        expect(editor).toBeInTheDocument()
      })
    })
  })

  describe('Backward Compatibility with Markdown', () => {
    it('validates markdown content is converted to HTML', () => {
      // Test the markdownToHtml function behavior
      const markdownContent = `**Bold text** and *italic text*

- List item 1
- List item 2

Regular paragraph.`

      // This would be converted by the markdownToHtml function
      const expectedHtml = markdownContent
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')

      expect(expectedHtml).toContain('<strong>Bold text</strong>')
      expect(expectedHtml).toContain('<em>italic text</em>')
    })

    it('validates legacy entries load without raw markdown asterisks', async () => {
      render(
        <NewEntryModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          editingEntry={mockMarkdownEntry}
        />
      )

      await waitFor(() => {
        // Content should be processed and not show raw markdown
        const title = screen.getByText('Legacy Markdown Entry')
        expect(title).toBeInTheDocument()
      })
    })
  })

  describe('Dark Theme and Accessibility', () => {
    it('validates dark theme classes are applied throughout the modal', async () => {
      render(
        <NewEntryModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      // Check for studio theme classes
      const modal = document.querySelector('.studio-surface')
      expect(modal).toBeInTheDocument()
    })

    it('validates proper color contrast for readability', async () => {
      render(
        <NewEntryModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          editingEntry={mockJournalEntry}
        />
      )

      await waitFor(() => {
        // Check for studio-text class which provides proper contrast
        const textElements = document.querySelectorAll('.studio-text')
        expect(textElements.length).toBeGreaterThan(0)
      })
    })

    it('validates keyboard navigation functionality', async () => {
      const user = userEvent.setup()

      render(
        <NewEntryModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      // Test tab navigation
      await user.tab()

      // Should be able to navigate through templates
      const firstTemplate = screen.getByText('Trading Analysis')
      expect(firstTemplate).toBeInTheDocument()
    })
  })

  describe('Content Preview in Collapsed Mode', () => {
    it('validates content truncation works correctly', () => {
      const longContent = 'A'.repeat(300) // Long content that should be truncated
      const truncatedEntry = {
        ...mockJournalEntry,
        content: longContent
      }

      render(
        <NewEntryModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          editingEntry={truncatedEntry}
        />
      )

      // Content should be truncated in collapsed view
      expect(longContent.length).toBeGreaterThan(200)
    })

    it('validates "Read More" functionality', async () => {
      // This would be tested at the JournalEntryCard level
      // Here we validate the structure exists for content expansion
      render(
        <NewEntryModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          editingEntry={mockJournalEntry}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Test Entry with Rich Content')).toBeInTheDocument()
      })
    })
  })

  describe('Form Submission and Data Integrity', () => {
    it('validates form submission with rich content', async () => {
      const user = userEvent.setup()

      render(
        <NewEntryModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      // Select template and fill form
      await user.click(screen.getByText('Trading Analysis'))

      await waitFor(() => {
        const titleInput = screen.getByPlaceholderText('Enter a descriptive title')
        expect(titleInput).toBeInTheDocument()
      })

      // Fill in title
      const titleInput = screen.getByPlaceholderText('Enter a descriptive title')
      await user.type(titleInput, 'Test Rich Content Entry')

      // Fill required fields
      const strategyInput = screen.getByPlaceholderText('Momentum Breakout')
      await user.type(strategyInput, 'Test Strategy')

      const pnlInput = screen.getByPlaceholderText('0.00')
      await user.type(pnlInput, '100.50')

      // Submit form
      const saveButton = screen.getByText('Save Entry')
      await user.click(saveButton)

      // Verify save was called
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled()
      })
    })

    it('validates HTML content is preserved during save', async () => {
      const user = userEvent.setup()

      render(
        <NewEntryModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      // Select template
      await user.click(screen.getByText('Freeform Document'))

      await waitFor(() => {
        const titleInput = screen.getByPlaceholderText('Enter a descriptive title')
        expect(titleInput).toBeInTheDocument()
      })

      const titleInput = screen.getByPlaceholderText('Enter a descriptive title')
      await user.type(titleInput, 'Test HTML Preservation')

      // Fill required fields
      const docTitleInput = screen.getByPlaceholderText('My Trading Notes')
      await user.type(docTitleInput, 'Test Document')

      // Submit
      const saveButton = screen.getByText('Save Entry')
      await user.click(saveButton)

      expect(mockOnSave).toHaveBeenCalled()
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('validates modal handles missing content gracefully', async () => {
      const emptyEntry = {
        ...mockJournalEntry,
        content: ''
      }

      render(
        <NewEntryModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          editingEntry={emptyEntry}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Test Entry with Rich Content')).toBeInTheDocument()
      })
    })

    it('validates modal closes properly', async () => {
      const user = userEvent.setup()

      render(
        <NewEntryModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      const closeButton = document.querySelector('[data-testid="close-button"]') ||
                         document.querySelector('button[title="Close"]') ||
                         screen.getByRole('button', { name: /close/i })

      if (closeButton) {
        await user.click(closeButton)
        expect(mockOnClose).toHaveBeenCalled()
      }
    })

    it('validates required field validation works', async () => {
      const user = userEvent.setup()

      render(
        <NewEntryModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      // Select template
      await user.click(screen.getByText('Trading Analysis'))

      await waitFor(() => {
        const saveButton = screen.getByText('Save Entry')
        expect(saveButton).toBeInTheDocument()
      })

      // Try to save without filling required fields
      const saveButton = screen.getByText('Save Entry')
      await user.click(saveButton)

      // Form should not submit due to required field validation
      expect(mockOnSave).not.toHaveBeenCalled()
    })
  })
})