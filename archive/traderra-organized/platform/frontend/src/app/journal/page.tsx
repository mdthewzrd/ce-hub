'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
// import { CopilotSidebar } from '@copilotkit/react-ui' // Temporarily disabled due to module resolution errors
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { Plus, Download, Upload, BookOpen, Folders, LayoutGrid, Settings } from 'lucide-react'
import { TopNavigation } from '@/components/layout/top-nav'
import {
  JournalEntryCard,
  JournalFilters,
  JournalStats,
  NewEntryModal,
  mockJournalEntries
} from '@/components/journal/journal-components'
import { TraderViewDateSelector } from '@/components/ui/traderview-date-selector'
import { DisplayModeToggle } from '@/components/ui/display-mode-toggle'
import { DateRangeProvider } from '@/contexts/DateRangeContext'
import { DisplayModeProvider } from '@/contexts/DisplayModeContext'
import { TemplateSelectionModal, DocumentTemplate } from '@/components/journal/TemplateSelectionModal'
import { JournalLayout } from '@/components/journal/JournalLayout'
import { FolderNode, useFolderTree as useLocalFolderTree } from '@/components/folders/FolderTree'
import { useFolderContent, useFolderDragDrop } from '@/hooks/useFolders'
import { useFolderContentCounts } from '@/hooks/useFolderContentCounts'
import { RenataChat } from '@/components/dashboard/renata-chat'
import { cn } from '@/lib/utils'
import { markdownToHtml } from '@/lib/markdown'


// Create a query client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    },
  },
})

// Enhanced Journal Content Component
interface EnhancedJournalContentProps {
  selectedFolderId?: string
  searchQuery?: string
  filters?: any
  mode: 'classic' | 'enhanced'
  journalEntries: any[]
  onSaveEntry: (entry: any) => void
  onEditEntry: (entry: any) => void
  onDeleteEntry: (id: string) => void
  folders?: any[]
  foldersLoading?: boolean
  contentItems?: any[]
  contentLoading?: boolean
  createFolder?: any
  createContent?: any
  deleteContent?: any
  isCreating?: boolean
  isUpdating?: boolean
  isDeleting?: boolean
  filteredEntries?: any[]
}

function EnhancedJournalContent({
  selectedFolderId,
  searchQuery,
  filters,
  mode,
  journalEntries,
  onSaveEntry,
  onEditEntry,
  onDeleteEntry,
  folders,
  foldersLoading,
  contentItems,
  contentLoading,
  createFolder,
  createContent,
  deleteContent,
  isCreating,
  isUpdating,
  isDeleting,
  filteredEntries: propFilteredEntries
}: EnhancedJournalContentProps) {
  // Mock user ID - in real app, this would come from auth
  const userId = 'default_user'

  // Drag and drop handling
  const { handleDrop } = useFolderDragDrop(userId, mode === 'enhanced')

  // Find selected folder
  const selectedFolder = useMemo(() => {
    if (!selectedFolderId || mode === 'classic') return undefined

    const findFolder = (folders: any[]): any => {
      for (const folder of folders) {
        if (folder.id === selectedFolderId) return folder
        const found = findFolder(folder.children || [])
        if (found) return found
      }
      return undefined
    }

    return findFolder(folders || [])
  }, [folders, selectedFolderId, mode])

  // Combine content items and legacy entries for display
  const displayEntries = useMemo(() => {
    const entries = [...journalEntries]

    // In enhanced mode, add content items as journal entries
    if (mode === 'enhanced' && contentItems) {
      contentItems.forEach(item => {
        if (item.type === 'trade_entry' && item.content) {
          const tradeData = item.content.trade_data || {}
          entries.push({
            id: item.id,
            date: item.created_at.split('T')[0],
            title: item.title,
            symbol: tradeData.symbol || 'N/A',
            side: tradeData.side || 'Long',
            entryPrice: tradeData.entry_price || 0,
            exitPrice: tradeData.exit_price || 0,
            pnl: tradeData.pnl || 0,
            rating: tradeData.rating || 3,
            tags: item.tags || [],
            content: tradeData.setup_analysis || '',
            emotion: tradeData.emotion || 'neutral',
            category: tradeData.category || 'win',
            createdAt: item.created_at,
            isContentItem: true
          })
        }
      })
    }

    return entries
  }, [journalEntries, contentItems, mode])

  // Enhanced mode entry creation
  const handleEnhancedSaveEntry = useCallback(async (newEntry: any) => {
    if (mode === 'classic') {
      onSaveEntry(newEntry)
      return
    }

    try {
      // Create as content item in selected folder
      // Create as content item in selected folder
      await createContent(
        newEntry.title,
        'trade_entry',
        selectedFolderId,
        {
          content: {
            trade_data: {
              symbol: newEntry.symbol,
              side: newEntry.side,
              entry_price: parseFloat(newEntry.entryPrice),
              exit_price: parseFloat(newEntry.exitPrice),
              pnl: parseFloat(newEntry.pnl),
              rating: newEntry.rating,
              emotion: newEntry.emotion,
              category: newEntry.category,
              setup_analysis: newEntry.content
            },
            blocks: [] // For future rich text editor
          },
          tags: typeof newEntry.tags === 'string'
            ? newEntry.tags.split(',').map((tag: string) => tag.trim())
            : newEntry.tags || []
        }
      )
    } catch (error) {
      console.error('Failed to create entry:', error)
      // Fallback to classic mode
      onSaveEntry(newEntry)
    }
  }, [mode, createContent, selectedFolderId, onSaveEntry])

  // Enhanced mode entry deletion
  const handleEnhancedDeleteEntry = useCallback(async (id: string) => {
    try {
      // Check if it's a content item or legacy entry
      const entry = displayEntries.find(e => e.id === id)
      if (entry?.isContentItem && mode === 'enhanced') {
        const confirmed = confirm('Are you sure you want to delete this entry?')
        if (!confirmed) return
        await deleteContent(id)
      } else {
        onDeleteEntry(id)
      }
    } catch (error) {
      console.error('Failed to delete entry:', error)
      onDeleteEntry(id)
    }
  }, [displayEntries, mode, deleteContent, onDeleteEntry])

  if (mode === 'enhanced' && foldersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm studio-muted">Loading enhanced features...</p>
        </div>
      </div>
    )
  }

  // Use the passed filteredEntries or fall back to displayEntries
  const entriesToShow = propFilteredEntries || displayEntries

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Results Summary */}
      <div className="flex items-center justify-between p-6 pb-4 shrink-0">
        <div className="text-sm studio-muted">
          {selectedFolder ? (
            <>Showing {entriesToShow.length} entries in "{selectedFolder.name}"</>
          ) : (
            <>Showing {entriesToShow.length} of {displayEntries.length} entries</>
          )}
        </div>
        {mode === 'enhanced' && contentLoading && (
          <div className="text-sm studio-muted">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary inline-block mr-2"></div>
            Loading content...
          </div>
        )}
      </div>

      {/* Journal Entries - Scrollable Container */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="space-y-6">
          {entriesToShow.length > 0 ? (
            entriesToShow.map((entry) => (
              <JournalEntryCard
                key={entry.id}
                entry={entry as any}
                onEdit={onEditEntry}
                onDelete={handleEnhancedDeleteEntry}
              />
            ))
          ) : (
            <div className="studio-surface rounded-lg p-12 text-center">
              <BookOpen className="h-12 w-12 studio-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold studio-text mb-2">
                {selectedFolder ? (
                  `No entries in "${selectedFolder.name}"`
                ) : displayEntries.length === 0 ? (
                  'No journal entries yet'
                ) : (
                  'No entries match your filters'
                )}
              </h3>
              <p className="text-sm studio-muted mb-4">
                {selectedFolder ? (
                  'Start adding entries to this folder to organize your trading journal'
                ) : displayEntries.length === 0 ? (
                  'Start documenting your trades to improve your performance'
                ) : (
                  'Try adjusting your search criteria or clear the filters'
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Loading Overlay for Enhanced Mode */}
      {mode === 'enhanced' && (isCreating || isUpdating || isDeleting) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm studio-text">
              {isCreating && 'Creating folder...'}
              {isUpdating && 'Updating folder...'}
              {isDeleting && 'Deleting folder...'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function JournalPage() {
  const [aiSidebarOpen, setAiSidebarOpen] = useState(true)
  const [showNewEntryModal, setShowNewEntryModal] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [journalEntries, setJournalEntries] = useState(mockJournalEntries)
  // Enhanced mode is now the default and only mode (simplified)
  const [selectedFolderId, setSelectedFolderId] = useState<string>('folder-1-1') // Default to Daily Trades folder
  const [searchQuery, setSearchQuery] = useState('')
  const [editingEntry, setEditingEntry] = useState<any>(null)
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<string>('all')
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    emotion: '',
    symbol: '',
    rating: 0
  })

  // Mock user ID - in real app, this would come from auth
  const userId = 'default_user'

  // Handle calendar navigation parameters
  const searchParams = useSearchParams()

  useEffect(() => {
    const focus = searchParams.get('focus')
    const date = searchParams.get('date')

    if (focus === 'daily-reviews') {
      // Switch to Daily Reviews folder
      setSelectedFolderId('folder-1-2')

      if (date) {
        console.log('Navigating to daily review for date:', date)

        // Set the search filter to find entries matching the date
        setFilters(prevFilters => ({
          ...prevFilters,
          search: date
        }))

        // Also set the searchQuery state for UI consistency
        setSearchQuery(date)
      }
    }
  }, [searchParams])

  // Use shared content counting hook for consistent folder counts across pages
  const { folders: testFolders, contentItems: sharedContentItems } = useFolderContentCounts()

  // State for dynamic content items that can be updated (for managing local changes)
  const [localContentItems, setLocalContentItems] = useState(sharedContentItems)

  // Sync local content items when shared content changes
  useEffect(() => {
    setLocalContentItems(sharedContentItems)
  }, [sharedContentItems])

  // Use local folder tree hook (same as test page)
  const {
    folders,
    selectedFolderId: localSelectedFolderId,
    expandedFolderIds,
    handleFolderSelect,
    handleFolderExpand
  } = useLocalFolderTree(testFolders)

  // Override selectedFolderId if we have a state value
  const actualSelectedFolderId = selectedFolderId || localSelectedFolderId

  // Mock loading and mutation states for API compatibility
  const foldersLoading = false
  const isCreating = false
  const isUpdating = false
  const isDeleting = false

  // Mock folder operations
  const createFolder = useCallback((name?: string, parentId?: string) => {
    console.log('Create folder:', name, parentId)
    return Promise.resolve()
  }, [])

  const updateFolder = useCallback((folderId: string, data: any) => {
    console.log('Update folder:', folderId, data)
    return Promise.resolve()
  }, [])

  const deleteFolder = useCallback((folderId: string) => {
    console.log('Delete folder:', folderId)
    return Promise.resolve()
  }, [])

  // Memoize the folder content options to prevent React Query cache invalidation
  const folderContentOptions = useMemo(() => {
    return {
      folderId: selectedFolderId,
      search: searchQuery,
      limit: 50
    }
  }, [selectedFolderId, searchQuery])

  // Mock the folder content hook with our test data instead of making API calls
  const contentItems = localContentItems
  const totalContent = localContentItems.length
  const contentLoading = false


  // Real content operations that update state
  const createContent = useCallback((title: string, type: any, folderId?: string, options: any = {}) => {
    console.log('Creating content:', title, type, folderId, options)

    const newContent = {
      id: `content-${Date.now()}`,
      title,
      type,
      folder_id: folderId || actualSelectedFolderId || 'folder-1-2', // Default to Daily Reviews
      created_at: new Date().toISOString(),
      tags: options.tags || [],
      content: options.content || {}
    }

    // Add the new content to the state
    setLocalContentItems(prevItems => [...prevItems, newContent])

    return Promise.resolve(newContent)
  }, [actualSelectedFolderId])

  const updateContent = useCallback((contentId: string, data: any) => {
    console.log('Mock: Updating content:', contentId, data)
    return Promise.resolve()
  }, [])

  const deleteContent = useCallback((contentId: string) => {
    console.log('Deleting content:', contentId)

    // Remove the content from the state
    setLocalContentItems(prevItems => prevItems.filter(item => item.id !== contentId))

    return Promise.resolve()
  }, [])

  const moveContent = useCallback((contentId: string, folderId?: string) => {
    console.log('Mock: Moving content:', contentId, folderId)
    return Promise.resolve()
  }, [])

  // Original hook call (commented out for testing)
  // const {
  //   items: contentItems,
  //   total: totalContent,
  //   isLoading: contentLoading,
  //   createContent,
  //   updateContent,
  //   deleteContent,
  //   moveContent
  // } = useFolderContent(userId, folderContentOptions)

  // Combine content items and legacy entries for display
  const displayEntries = useMemo(() => {
    const entries = [...journalEntries]

    // Add content items as journal entries (enhanced mode is now default)
    if (contentItems) {
      contentItems.forEach((item: any) => {
        if (item.type === 'trade_entry' && item.content) {
          const tradeData = item.content.trade_data || {}

          // Convert markdown content to HTML for proper display
          let content = tradeData.setup_analysis || ''
          if (content) {
            content = markdownToHtml(content)
          }

          const processedEntry = {
            id: item.id,
            date: item.created_at.split('T')[0],
            title: item.title,
            strategy: tradeData.symbol || 'N/A',
            side: tradeData.side || 'Long',
            setup: `Entry: ${tradeData.entry_price || 0}, Exit: ${tradeData.exit_price || 0}`,
            bias: tradeData.side || 'Long',
            pnl: tradeData.pnl || 0,
            rating: tradeData.rating || 3,
            tags: item.tags || [],
            content: content,
            emotion: tradeData.emotion || 'neutral',
            category: tradeData.category || 'win',
            template: tradeData.template || '',
            createdAt: item.created_at,
            isContentItem: true
          }
          entries.push(processedEntry)
        } else if (item.type === 'daily_review') {
          // Handle daily review entries specially
          const reviewData = item.content?.daily_review_data || {}
          const performance = reviewData.day_performance || {}

          // Use the content_text if available, otherwise format the data nicely
          let formattedContent = reviewData.content_text || ''

          if (!formattedContent) {
            // Fallback: create formatted content from the data
            formattedContent = `**Market Conditions:**
${reviewData.market_conditions || 'N/A'}

**Performance Analysis:**
- Total P&L: ${performance.total_pnl >= 0 ? '+' : ''}$${performance.total_pnl || 0}
- Win Rate: ${performance.win_rate || 0}% (${performance.winning_trades || 0} wins, ${performance.losing_trades || 0} losses)
- Best Trade: ${performance.best_trade || 'N/A'}
- Worst Trade: ${performance.worst_trade || 'N/A'}

**Key Lessons:**
${(reviewData.lessons_learned || []).map((lesson: string) => `- ${lesson}`).join('\n')}

**Tomorrow's Focus:**
${(reviewData.tomorrow_focus || []).map((focus: string) => `- ${focus}`).join('\n')}`
          }

          // Convert markdown to HTML for proper display
          formattedContent = markdownToHtml(formattedContent)

          const processedEntry = {
            id: item.id,
            date: item.created_at.split('T')[0],
            title: item.title,
            strategy: 'Daily Review',
            side: 'N/A',
            setup: `P&L: ${performance.total_pnl >= 0 ? '+' : ''}$${performance.total_pnl || 0}`,
            bias: 'Neutral',
            pnl: performance.total_pnl || 0,
            rating: performance.win_rate >= 75 ? 5 : performance.win_rate >= 60 ? 4 : 3,
            tags: item.tags || [],
            content: formattedContent,
            emotion: performance.total_pnl > 0 ? 'positive' : performance.total_pnl < 0 ? 'negative' : 'neutral',
            category: performance.total_pnl > 0 ? 'win' : performance.total_pnl < 0 ? 'loss' : 'neutral',
            template: item.type || '',
            createdAt: item.created_at,
            isContentItem: true,
            contentType: item.type
          }
          entries.push(processedEntry)
        } else if (item.type !== 'trade_entry') {
          // Process other non-trade entries (strategies, reviews, documents, etc.)
          let content = ''
          let setup = 'N/A'

          // Handle template-created documents
          if (item.content?.markdown_content) {
            content = markdownToHtml(item.content.markdown_content)
            setup = `Template: ${item.content.template_name || item.type}`
          } else {
            content = JSON.stringify(item.content)
          }

          const processedEntry = {
            id: item.id,
            date: item.created_at.split('T')[0],
            title: item.title,
            strategy: item.content?.template_name || item.type || 'Document',
            side: 'N/A',
            setup: setup,
            bias: 'Neutral',
            pnl: 0,
            rating: 3,
            tags: item.tags || [],
            content: content,
            emotion: 'neutral',
            category: 'neutral',
            template: item.type || '',
            createdAt: item.created_at,
            isContentItem: true,
            contentType: item.type
          }
          entries.push(processedEntry)
        }
      })
    }

    return entries
  }, [journalEntries, contentItems])

  // Helper function to filter entries by time period
  const filterByTimePeriod = (entries: any[], period: string) => {
    if (period === 'all') return entries

    const now = new Date()
    let cutoffDate: Date

    switch (period) {
      case '7d':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      default:
        return entries
    }

    return entries.filter(entry => {
      const entryDate = new Date(entry.date || entry.createdAt)
      return entryDate >= cutoffDate
    })
  }

  // Helper function to get all descendant folder IDs (including the folder itself)
  const getDescendantFolderIds = useCallback((folderId: string, allFolders: FolderNode[]): string[] => {
    const ids = [folderId]

    const findDescendants = (folderList: FolderNode[]) => {
      for (const folder of folderList) {
        if (folder.id === folderId) {
          const collectChildIds = (children: FolderNode[]) => {
            for (const child of children) {
              ids.push(child.id)
              if (child.children.length > 0) {
                collectChildIds(child.children)
              }
            }
          }
          collectChildIds(folder.children)
          return
        }
        if (folder.children.length > 0) {
          findDescendants(folder.children)
        }
      }
    }

    findDescendants(allFolders)
    return ids
  }, [])

  // Filter entries based on current filters, folder selection, and time period
  const enhancedFilteredEntries = useMemo(() => {
    let entriesToFilter: any[] = []

    // Determine which entries to show based on folder selection
    if (actualSelectedFolderId) {
      // When a folder is selected, show content items from that folder AND all its descendants
      const descendantFolderIds = getDescendantFolderIds(actualSelectedFolderId, folders || [])

      entriesToFilter = displayEntries.filter((entry: any) => {
        if (!entry.isContentItem) return false

        // Check if the entry belongs to the selected folder or any of its descendants
        const contentFolderId = contentItems?.find((item: any) => item.id === entry.id)?.folder_id
        return contentFolderId && descendantFolderIds.includes(contentFolderId)
      })
    } else {
      // When no folder is selected, show all entries
      entriesToFilter = displayEntries
    }

    // Apply time period filter
    entriesToFilter = filterByTimePeriod(entriesToFilter, selectedTimePeriod)

    if (!filters) return entriesToFilter

    return entriesToFilter.filter(entry => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()

        // Check title, content, and date fields
        const titleMatch = entry.title.toLowerCase().includes(searchLower)
        const contentMatch = entry.content.toLowerCase().includes(searchLower)
        const dateMatch = entry.date && entry.date.toLowerCase().includes(searchLower)

        // Also check if it's a content item with a date field in the original data
        let contentDateMatch = false
        if (entry.isContentItem) {
          const contentItem = contentItems?.find((item: any) => item.id === entry.id)
          if (contentItem?.date) {
            contentDateMatch = contentItem.date.toLowerCase().includes(searchLower)
          }
        }

        if (!titleMatch && !contentMatch && !dateMatch && !contentDateMatch) {
          return false
        }
      }
      if (filters.category && entry.category !== filters.category) {
        return false
      }
      if (filters.emotion && entry.emotion !== filters.emotion) {
        return false
      }
      if (filters.symbol && !entry.symbol.toLowerCase().includes(filters.symbol.toLowerCase())) {
        return false
      }
      if (filters.rating && entry.rating < filters.rating) {
        return false
      }
      return true
    })
  }, [displayEntries, filters, actualSelectedFolderId, selectedTimePeriod, getDescendantFolderIds, folders, contentItems])

  // Enhanced mode is now the only mode - using enhancedFilteredEntries for all filtering

  const handleSaveEntry = (newEntry: any) => {
    if (newEntry.id) {
      // Editing existing entry
      setJournalEntries(journalEntries.map(entry =>
        entry.id === newEntry.id ? { ...newEntry } : entry
      ))
    } else {
      // Creating new entry
      const entry = {
        ...newEntry,
        id: Date.now().toString(),
      }
      setJournalEntries([entry, ...journalEntries])
    }
    setEditingEntry(null) // Clear editing state
  }

  const handleEditEntry = (entry: any) => {
    // Set the entry to edit and open the modal
    setEditingEntry(entry)
    setShowNewEntryModal(true)
  }

  const handleDeleteEntry = (id: string) => {
    setJournalEntries(journalEntries.filter(entry => entry.id !== id))
  }

  const handleCreateFromTemplate = async (template?: DocumentTemplate, variables?: Record<string, any>) => {
    if (!template) {
      // Fresh document - open regular modal
      setShowNewEntryModal(true)
    } else {
      // Template document - create with template content
      let content = template.content

      // Replace variables in template
      if (variables && template.variables) {
        Object.entries(variables).forEach(([key, value]) => {
          const regex = new RegExp(`\\{${key}\\}`, 'g')
          content = content.replace(regex, value || '')
        })
      }

      // Create the proper document title
      let documentTitle = template.name
      if (variables?.date) {
        documentTitle += ` - ${variables.date}`
      } else if (variables?.symbol) {
        documentTitle += ` - ${variables.symbol}`
      } else if (variables?.topic) {
        documentTitle += ` - ${variables.topic}`
      }

      // Determine document type based on template
      let documentType = 'document'
      if (template.id === 'daily-journal') {
        documentType = 'daily_review'
      } else if (template.id === 'trade-entry') {
        documentType = 'trade_entry'
      } else if (template.id.includes('review')) {
        documentType = 'review'
      } else if (template.id === 'research-paper') {
        documentType = 'research'
      }

      // Create tags from template category and variables
      const tags = [template.category]
      if (variables?.symbol) tags.push(variables.symbol.toLowerCase())
      if (variables?.date) tags.push('date-specific')
      if (template.id === 'daily-journal') tags.push('journal-entry')

      try {
        // Create as content item in selected folder
        await createContent(
          documentTitle,
          documentType,
          actualSelectedFolderId,
          {
            content: {
              template_id: template.id,
              template_name: template.name,
              markdown_content: content,
              variables: variables || {},
              created_from_template: true
            },
            tags: tags
          }
        )

        console.log('Document created successfully from template:', template.name)
      } catch (error) {
        console.error('Failed to create document from template:', error)
      }
    }
  }

  const handleExportJournal = () => {
    // Export functionality
    console.log('Exporting journal...')
  }

  const handleImportJournal = () => {
    // Import functionality
    console.log('Importing journal...')
  }

  const JournalContent = () => {
    return (
      <DateRangeProvider>
        <DisplayModeProvider>
          <QueryClientProvider client={queryClient}>
        <JournalLayout
          selectedFolderId={actualSelectedFolderId}
          onFolderSelect={(folderId: string) => {
            setSelectedFolderId(folderId)
            handleFolderSelect(folderId)
          }}
          expandedFolderIds={expandedFolderIds}
          onFolderExpand={handleFolderExpand}
          onCreateFolder={(name, parentId) => createFolder(name, parentId)}
          showNewEntryButton
          onNewEntry={() => {
            setShowTemplateModal(true)
          }}
          folders={folders}
          foldersLoading={foldersLoading}
        >
          <div className="flex flex-col h-full min-h-0 space-y-6">
            {/* Time Period and Display Mode Filters */}
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-4">
                <TraderViewDateSelector />
                <DisplayModeToggle variant="flat" />
              </div>
            </div>

            <div className="flex-1 min-h-0">
              <EnhancedJournalContent
              selectedFolderId={actualSelectedFolderId}
              searchQuery={searchQuery}
              filters={filters}
              mode="enhanced"
              journalEntries={journalEntries}
              onSaveEntry={handleSaveEntry}
              onEditEntry={handleEditEntry}
              onDeleteEntry={handleDeleteEntry}
              folders={folders}
              foldersLoading={foldersLoading}
              contentItems={contentItems}
              contentLoading={contentLoading}
              createFolder={createFolder}
              createContent={createContent}
              deleteContent={deleteContent}
              isCreating={isCreating}
              isUpdating={isUpdating}
              isDeleting={isDeleting}
              filteredEntries={enhancedFilteredEntries}
              />
            </div>
          </div>
        </JournalLayout>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1a1a1a',
              color: '#e5e5e5',
              border: '1px solid #2a2a2a'
            }
          }}
        />
          </QueryClientProvider>
        </DisplayModeProvider>
      </DateRangeProvider>
    )
  }

  return (
    <div className="flex h-screen studio-bg" style={{ backgroundColor: '#0a0a0a', color: '#e5e5e5', minHeight: '100vh' }}>
      {/* Main content container with top navigation */}
      <div className="flex flex-1 flex-col overflow-hidden" style={{ backgroundColor: '#0a0a0a' }}>
        {/* Top Navigation */}
        <TopNavigation onAiToggle={() => setAiSidebarOpen(!aiSidebarOpen)} aiOpen={aiSidebarOpen} />

        {/* Page Header with Mode Toggle */}
        <div className="studio-surface border-b border-[#1a1a1a] px-6 py-4" style={{ backgroundColor: '#111111', borderColor: '#1a1a1a' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-semibold studio-text">Trading Journal</h1>
              </div>

            </div>

            <div className="flex items-center space-x-4">
              <button
                className="btn-ghost flex items-center space-x-2"
                onClick={handleImportJournal}
              >
                <Upload className="h-4 w-4" />
                <span>Import</span>
              </button>
              <button
                className="btn-ghost flex items-center space-x-2"
                onClick={handleExportJournal}
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Journal Content */}
        <div className="flex-1 min-h-0">
          <JournalContent />
        </div>
      </div>

      {/* New Entry Modal */}
      <NewEntryModal
        isOpen={showNewEntryModal}
        onClose={() => {
          setShowNewEntryModal(false)
          setEditingEntry(null)
        }}
        onSave={(newEntry) => {
            // Enhanced mode handling (now the only mode)
            handleSaveEntry(newEntry)
          }}
        editingEntry={editingEntry}
      />

      {/* Template Selection Modal */}
      <TemplateSelectionModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onCreateDocument={handleCreateFromTemplate}
        selectedFolderId={actualSelectedFolderId}
      />

      {/* AI Sidebar - Renata Chat */}
      {aiSidebarOpen && (
        <div className="w-[480px] studio-surface border-l border-[#1a1a1a] z-40">
          <RenataChat />
        </div>
      )}
    </div>
  )
}