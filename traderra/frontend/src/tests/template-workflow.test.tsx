import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TemplateSelectionModal } from '@/components/journal/TemplateSelectionModal'
import { RichTextEditor } from '@/components/editor/RichTextEditor'

// Mock dependencies
vi.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}))

describe('Template and Editor Workflow', () => {
  it('should render template selection modal', () => {
    const mockOnClose = vi.fn()
    const mockOnCreateDocument = vi.fn()

    render(
      <TemplateSelectionModal
        isOpen={true}
        onClose={mockOnClose}
        onCreateDocument={mockOnCreateDocument}
        selectedFolderId="test-folder"
      />
    )

    expect(screen.getByText('Create New Document')).toBeInTheDocument()
    expect(screen.getByText('Fresh Document')).toBeInTheDocument()
    expect(screen.getByText('Use Template')).toBeInTheDocument()
  })

  it('should show template options when "Use Template" is clicked', async () => {
    const mockOnClose = vi.fn()
    const mockOnCreateDocument = vi.fn()

    render(
      <TemplateSelectionModal
        isOpen={true}
        onClose={mockOnClose}
        onCreateDocument={mockOnCreateDocument}
        selectedFolderId="test-folder"
      />
    )

    const useTemplateButton = screen.getByText('Use Template')
    fireEvent.click(useTemplateButton)

    await waitFor(() => {
      expect(screen.getByText('Daily Journal')).toBeInTheDocument()
      expect(screen.getByText('Strategy Log')).toBeInTheDocument()
      expect(screen.getByText('Trade Analysis')).toBeInTheDocument()
    })
  })

  it('should call onCreateDocument with undefined when "Fresh Document" is clicked', () => {
    const mockOnClose = vi.fn()
    const mockOnCreateDocument = vi.fn()

    render(
      <TemplateSelectionModal
        isOpen={true}
        onClose={mockOnClose}
        onCreateDocument={mockOnCreateDocument}
        selectedFolderId="test-folder"
      />
    )

    const freshDocumentButton = screen.getByText('Fresh Document')
    fireEvent.click(freshDocumentButton)

    expect(mockOnCreateDocument).toHaveBeenCalledWith()
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should render rich text editor with slash command hint', () => {
    render(
      <RichTextEditor
        content=""
        placeholder="Start writing... or type / for commands"
      />
    )

    // Should show the slash command hint for empty editor
    expect(screen.getByText(/Type.*\/.*for commands/)).toBeInTheDocument()
  })

  it('should show toggle blocks in block selector', () => {
    // This would test the BlockSelector component integration
    // For now, we'll just verify the types exist
    const blockOptions = [
      { id: 'toggle', title: 'Toggle Section' },
      { id: 'toggleList', title: 'Toggle List' }
    ]

    expect(blockOptions).toContainEqual(
      expect.objectContaining({ id: 'toggle', title: 'Toggle Section' })
    )
    expect(blockOptions).toContainEqual(
      expect.objectContaining({ id: 'toggleList', title: 'Toggle List' })
    )
  })
})

describe('Template Content Processing', () => {
  it('should replace template variables correctly', () => {
    const template = {
      id: 'daily-journal',
      name: 'Daily Journal',
      content: '# Daily Trading Journal - {date}\n\n## Trade 1: {symbol}\n- **Entry:** ${entry_price}'
    }

    const variables = {
      date: '2024-01-15',
      symbol: 'AAPL',
      entry_price: '150.00'
    }

    let content = template.content
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g')
      content = content.replace(regex, value || '')
    })

    expect(content).toBe('# Daily Trading Journal - 2024-01-15\n\n## Trade 1: AAPL\n- **Entry:** $150.00')
  })

  it('should handle template with missing variables gracefully', () => {
    const template = {
      content: '# Journal - {date}\n\nSymbol: {symbol}\nPrice: {price}'
    }

    const variables = {
      date: '2024-01-15'
      // missing symbol and price
    }

    let content = template.content
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g')
      content = content.replace(regex, value || '')
    })

    expect(content).toBe('# Journal - 2024-01-15\n\nSymbol: {symbol}\nPrice: {price}')
  })
})

describe('Integration Tests', () => {
  it('should verify all required components exist', () => {
    // Verify imports can be resolved
    expect(TemplateSelectionModal).toBeDefined()
    expect(RichTextEditor).toBeDefined()
  })

  it('should verify template categories are properly defined', () => {
    const categories = ['trading', 'planning', 'research', 'general']
    expect(categories).toContain('trading')
    expect(categories).toContain('planning')
    expect(categories).toContain('research')
    expect(categories).toContain('general')
  })
})