'use client'

import { useState, useCallback, useMemo } from 'react'
// import { CopilotSidebar } from '@copilotkit/react-ui' // Temporarily disabled due to module resolution errors
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { Plus, Download, Upload, BookOpen, Folders, List, LayoutGrid, Settings } from 'lucide-react'
import { TopNavigation } from '@/components/layout/top-nav'
import {
  JournalEntryCard,
  JournalFilters,
  JournalStats,
  NewEntryModal,
  TimePeriodFilter,
  mockJournalEntries
} from '@/components/journal/journal-components'
import { TemplateSelectionModal, DocumentTemplate } from '@/components/journal/TemplateSelectionModal'
import { JournalLayout } from '@/components/journal/JournalLayout'
import { FolderNode, useFolderTree as useLocalFolderTree } from '@/components/folders/FolderTree'
import { useFolderContent, useFolderDragDrop } from '@/hooks/useFolders'
import { RenataChat } from '@/components/dashboard/renata-chat'
import { cn } from '@/lib/utils'

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
    <div className="space-y-6">
      {/* Results Summary */}
      <div className="flex items-center justify-between">
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

      {/* Journal Entries */}
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
  const [viewMode, setViewMode] = useState<'classic' | 'enhanced'>('enhanced')
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

  // Mock content items that are associated with folders
  const mockContentItems = useMemo(() => [
    {
      id: 'content-1',
      title: 'Strong Momentum Play on YIBO',
      type: 'trade_entry',
      folder_id: 'folder-1-1', // Daily Trades
      created_at: '2024-01-29T16:45:00Z',
      tags: ['momentum', 'breakout', 'pre-market'],
      content: {
        trade_data: {
          symbol: 'YIBO',
          side: 'Long',
          entry_price: 49.86,
          exit_price: 51.52,
          pnl: 531.20,
          rating: 5,
          emotion: 'confident',
          category: 'win',
          setup_analysis: `Perfect setup today on YIBO. Stock showed strong pre-market activity with heavy volume. Entered on the breakout above $49.80 resistance level.

**Setup Analysis:**
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
- Profit of $531.20 (3.33% gain)

**Lessons:**
- Pre-market volume was key indicator
- Patience paid off waiting for clean breakout
- Exit timing was good, avoided the pullback`
        }
      }
    },
    {
      id: 'content-2',
      title: 'Quick Loss on YIBO Reversal',
      type: 'trade_entry',
      folder_id: 'folder-1-1', // Daily Trades
      created_at: '2024-01-29T17:05:00Z',
      tags: ['reversal', 'mistake', 'fomo'],
      content: {
        trade_data: {
          symbol: 'YIBO',
          side: 'Long',
          entry_price: 52.15,
          exit_price: 51.45,
          pnl: -84.00,
          rating: 2,
          emotion: 'frustrated',
          category: 'loss',
          setup_analysis: `Made a mistake here. Chased YIBO after missing the initial move.

**Setup Analysis:**
- Stock already extended from the breakout
- No clear setup, just FOMO
- Should have waited for pullback

**Execution:**
- Entry at $52.15 was too high
- Position size was appropriate
- Quick stop at $51.45 limited damage

**Outcome:**
- Small loss of $84
- Quick recognition of mistake
- Preserved capital for better setups

**Lessons:**
- Don't chase extended moves
- Wait for pullbacks or new setups
- FOMO leads to poor entries
- Quick stops are crucial`
        }
      }
    },
    {
      id: 'content-3',
      title: 'Excellent LPO Swing Trade',
      type: 'trade_entry',
      folder_id: 'folder-2-1', // Swing Trading
      created_at: '2024-01-28T14:30:00Z',
      tags: ['swing', 'support', 'earnings'],
      content: {
        trade_data: {
          symbol: 'LPO',
          side: 'Long',
          entry_price: 65.20,
          exit_price: 66.87,
          pnl: 1636.60,
          rating: 5,
          emotion: 'excited',
          category: 'win',
          setup_analysis: `Outstanding swing trade on LPO. Entered at key support level ahead of earnings.

**Setup Analysis:**
- Perfect bounce off $65 support level
- Strong earnings setup with low expectations
- Good risk/reward ratio

**Execution:**
- Large position size (980 shares)
- Entry right at support
- Stop below $64.50

**Outcome:**
- Stock gapped up after earnings
- Exited at $66.87 for solid profit
- Best trade of the month so far

**Lessons:**
- Support levels work great for entries
- Earnings can provide catalyst
- Sizing up on high conviction trades pays off`
        }
      }
    },
    {
      id: 'content-4',
      title: 'Range Trading CMAX',
      type: 'trade_entry',
      folder_id: 'folder-2-2', // Day Trading
      created_at: '2024-01-26T11:20:00Z',
      tags: ['range', 'scalp', 'low-volume'],
      content: {
        trade_data: {
          symbol: 'CMAX',
          side: 'Long',
          entry_price: 21.15,
          exit_price: 21.26,
          pnl: 22.00,
          rating: 3,
          emotion: 'neutral',
          category: 'win',
          setup_analysis: `Small profit on CMAX range trade. Market was slow today.

**Setup Analysis:**
- Clear range between $21-$21.50
- Low volume environment
- Good for small scalps

**Execution:**
- Entry near range bottom
- Small position due to low conviction
- Quick profit target

**Outcome:**
- Small profit after commissions
- Not much size but consistent

**Lessons:**
- Range trading works in slow markets
- Keep size smaller on low conviction
- Small profits add up`
        }
      }
    },
    {
      id: 'content-5',
      title: 'Weekly Review - January 2024',
      type: 'review',
      folder_id: 'folder-1-2', // Weekly Reviews
      created_at: '2024-01-28T20:00:00Z',
      tags: ['review', 'analysis', 'performance'],
      content: {
        review_data: {
          week_performance: {
            total_trades: 8,
            winning_trades: 6,
            losing_trades: 2,
            win_rate: 75,
            total_pnl: 2105.80,
            best_trade: 'LPO swing trade (+$1636.60)',
            worst_trade: 'YIBO chase (-$84.00)'
          },
          lessons_learned: [
            'Pre-market volume is a strong momentum indicator',
            'Don\'t chase extended moves - wait for pullbacks',
            'Support levels work well for swing entries',
            'Position sizing matters on high conviction trades'
          ],
          next_week_focus: [
            'Continue to avoid FOMO entries',
            'Look for more earnings setups',
            'Practice patience on breakout entries'
          ]
        }
      }
    },
    {
      id: 'content-6',
      title: 'Market Research - Biotech Sector',
      type: 'research',
      folder_id: 'folder-3', // Research
      created_at: '2024-01-25T10:00:00Z',
      tags: ['biotech', 'sector', 'analysis'],
      content: {
        research_data: {
          sector: 'Biotechnology',
          key_findings: [
            'Strong momentum in biotech ETFs',
            'FDA approval catalysts coming in Q1',
            'High volume breakouts showing follow-through'
          ],
          watchlist: ['YIBO', 'CRSP', 'EDIT', 'NTLA'],
          risk_factors: [
            'Regulatory uncertainty',
            'High volatility',
            'News-driven price action'
          ]
        }
      }
    }
  ], [])

  // Mock folder data - EXACT SAME structure as JournalLayout for consistency
  const testFolders: FolderNode[] = useMemo(() => [
    {
      id: 'folder-1',
      name: 'Trading Journal',
      icon: 'journal-text',
      color: '#3B82F6',
      position: 0,
      contentCount: 3,
      children: [
        {
          id: 'folder-1-1',
          name: 'Daily Trades',
          parentId: 'folder-1',
          icon: 'calendar',
          color: '#10B981',
          position: 1,
          contentCount: 2,
          children: []
        },
        {
          id: 'folder-1-2',
          name: 'Weekly Reviews',
          parentId: 'folder-1',
          icon: 'star',
          color: '#F59E0B',
          position: 2,
          contentCount: 1,
          children: []
        }
      ]
    },
    {
      id: 'folder-2',
      name: 'Strategies',
      icon: 'target',
      color: '#F59E0B',
      position: 1,
      contentCount: 2,
      children: [
        {
          id: 'folder-2-1',
          name: 'Swing Trading',
          parentId: 'folder-2',
          icon: 'trending-up',
          color: '#EF4444',
          position: 1,
          contentCount: 1,
          children: []
        },
        {
          id: 'folder-2-2',
          name: 'Day Trading',
          parentId: 'folder-2',
          icon: 'trending-up',
          color: '#EF4444',
          position: 2,
          contentCount: 1,
          children: []
        }
      ]
    },
    {
      id: 'folder-3',
      name: 'Research',
      icon: 'search',
      color: '#8B5CF6',
      position: 2,
      contentCount: 1,
      children: []
    }
  ], [])

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
    if (viewMode !== 'enhanced') return null
    return {
      folderId: selectedFolderId,
      search: searchQuery,
      limit: 50
    }
  }, [viewMode, selectedFolderId, searchQuery])

  // Mock the folder content hook with our test data instead of making API calls
  const contentItems = mockContentItems
  const totalContent = mockContentItems.length
  const contentLoading = false


  // Mock content operations
  const createContent = useCallback((title: string, type: any, folderId?: string, options: any = {}) => {
    console.log('Mock: Creating content:', title, type, folderId, options)
    return Promise.resolve()
  }, [])

  const updateContent = useCallback((contentId: string, data: any) => {
    console.log('Mock: Updating content:', contentId, data)
    return Promise.resolve()
  }, [])

  const deleteContent = useCallback((contentId: string) => {
    console.log('Mock: Deleting content:', contentId)
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

    // In enhanced mode, add content items as journal entries
    if (viewMode === 'enhanced' && contentItems) {
      contentItems.forEach((item: any) => {
        if (item.type === 'trade_entry' && item.content) {
          const tradeData = item.content.trade_data || {}
          const processedEntry = {
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
          }
          entries.push(processedEntry)
        } else if (item.type !== 'trade_entry') {
          // Also process non-trade entries (strategies, reviews, etc.)
          const processedEntry = {
            id: item.id,
            date: item.created_at.split('T')[0],
            title: item.title,
            symbol: 'N/A',
            side: 'N/A',
            entryPrice: 0,
            exitPrice: 0,
            pnl: 0,
            rating: 3,
            tags: item.tags || [],
            content: JSON.stringify(item.content),
            emotion: 'neutral',
            category: 'neutral',
            createdAt: item.created_at,
            isContentItem: true,
            contentType: item.type
          }
          entries.push(processedEntry)
        }
      })
    }

    return entries
  }, [journalEntries, contentItems, viewMode])

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

    // In enhanced mode, determine which entries to show
    if (viewMode === 'enhanced') {
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
        // When no folder is selected, show all entries (both classic and enhanced)
        entriesToFilter = displayEntries
      }
    } else {
      // Classic mode - show all entries
      entriesToFilter = displayEntries
    }

    // Apply time period filter
    entriesToFilter = filterByTimePeriod(entriesToFilter, selectedTimePeriod)

    if (!filters) return entriesToFilter

    return entriesToFilter.filter(entry => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        if (!entry.title.toLowerCase().includes(searchLower) &&
            !entry.content.toLowerCase().includes(searchLower)) {
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
  }, [displayEntries, filters, viewMode, actualSelectedFolderId, selectedTimePeriod, getDescendantFolderIds, folders, contentItems])

  // Filter entries for classic mode (also includes time period filtering)
  const classicFilteredEntries = useMemo(() => {
    let entriesToFilter = filterByTimePeriod(journalEntries, selectedTimePeriod)

    return entriesToFilter.filter(entry => {
      if (filters.search && !entry.title.toLowerCase().includes(filters.search.toLowerCase()) &&
          !entry.content.toLowerCase().includes(filters.search.toLowerCase())) {
        return false
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
  }, [journalEntries, filters, selectedTimePeriod])

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

  const handleCreateFromTemplate = (template?: DocumentTemplate, variables?: Record<string, any>) => {
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

      // Create entry with template content
      const templateEntry = {
        id: Date.now().toString(),
        title: template.name + (variables?.date ? ` - ${variables.date}` : ''),
        date: new Date().toISOString().split('T')[0],
        symbol: variables?.symbol || 'N/A',
        side: variables?.side || 'Long',
        entryPrice: parseFloat(variables?.entry_price || '0'),
        exitPrice: parseFloat(variables?.exit_price || '0'),
        pnl: parseFloat(variables?.pnl || '0'),
        rating: 3,
        tags: [],
        content: content,
        emotion: 'neutral',
        category: 'win',
        createdAt: new Date().toISOString(),
        isTemplate: true,
        templateId: template.id
      }

      if (viewMode === 'enhanced') {
        // TODO: Create as content item in selected folder with rich content
        handleSaveEntry(templateEntry)
      } else {
        handleSaveEntry(templateEntry)
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
    if (viewMode === 'enhanced') {
      return (
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
              if (viewMode === 'enhanced') {
                setShowTemplateModal(true)
              } else {
                setShowNewEntryModal(true)
              }
            }}
            folders={folders}
            foldersLoading={foldersLoading}
          >
            <div className="space-y-6">
              {/* Time Period Filter */}
              <div className="flex items-center justify-between">
                <TimePeriodFilter
                  selectedPeriod={selectedTimePeriod}
                  onPeriodChange={setSelectedTimePeriod}
                />
              </div>

              <EnhancedJournalContent
                selectedFolderId={actualSelectedFolderId}
                searchQuery={searchQuery}
                filters={filters}
                mode={viewMode}
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
      )
    }

    // Classic Mode Layout
    return (
      <main className="flex-1 overflow-auto p-6" style={{ backgroundColor: '#0a0a0a' }}>
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Time Period Filter */}
          <div className="flex items-center justify-between">
            <TimePeriodFilter
              selectedPeriod={selectedTimePeriod}
              onPeriodChange={setSelectedTimePeriod}
            />
          </div>

          {/* Filters */}
          <JournalFilters
            filters={filters}
            onFiltersChange={setFilters}
          />

          {/* Results Summary */}
          <div className="flex items-center justify-between">
            <div className="text-sm studio-muted">
              Showing {classicFilteredEntries.length} of {journalEntries.length} entries
            </div>
            {filters.search || filters.category || filters.emotion || filters.symbol || filters.rating > 0 || selectedTimePeriod !== 'all' ? (
              <button
                onClick={() => {
                  setFilters({ search: '', category: '', emotion: '', symbol: '', rating: 0 })
                  setSelectedTimePeriod('all')
                }}
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Clear Filters
              </button>
            ) : null}
          </div>

          {/* Journal Entries */}
          <div className="space-y-6">
            {classicFilteredEntries.length > 0 ? (
              classicFilteredEntries.map((entry) => (
                <JournalEntryCard
                  key={entry.id}
                  entry={entry as any}
                  onEdit={handleEditEntry}
                  onDelete={handleDeleteEntry}
                />
              ))
            ) : (
              <div className="studio-surface rounded-lg p-12 text-center">
                <BookOpen className="h-12 w-12 studio-muted mx-auto mb-4" />
                <h3 className="text-lg font-semibold studio-text mb-2">
                  {journalEntries.length === 0 ? 'No journal entries yet' : 'No entries match your filters'}
                </h3>
                <p className="text-sm studio-muted mb-4">
                  {journalEntries.length === 0
                    ? 'Start documenting your trades to improve your performance'
                    : 'Try adjusting your search criteria or clear the filters'}
                </p>
                {journalEntries.length === 0 && (
                  <button
                    className="btn-primary"
                    onClick={() => setShowNewEntryModal(true)}
                  >
                    Create Your First Entry
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
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

              {/* Mode Toggle */}
              <div className="flex items-center space-x-1 bg-[#0a0a0a] rounded-lg p-1">
                <button
                  onClick={() => setViewMode('classic')}
                  className={cn(
                    'flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                    viewMode === 'classic'
                      ? 'bg-primary/10 text-primary'
                      : 'studio-muted hover:bg-[#161616] hover:studio-text'
                  )}
                >
                  <List className="h-4 w-4" />
                  <span>Classic</span>
                </button>
                <button
                  onClick={() => setViewMode('enhanced')}
                  className={cn(
                    'flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                    viewMode === 'enhanced'
                      ? 'bg-primary/10 text-primary'
                      : 'studio-muted hover:bg-[#161616] hover:studio-text'
                  )}
                >
                  <Folders className="h-4 w-4" />
                  <span>Enhanced</span>
                </button>
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
        <JournalContent />
      </div>

      {/* New Entry Modal */}
      <NewEntryModal
        isOpen={showNewEntryModal}
        onClose={() => {
          setShowNewEntryModal(false)
          setEditingEntry(null)
        }}
        onSave={viewMode === 'enhanced' ?
          (newEntry) => {
            // In enhanced mode, delegate to the enhanced content component
            // For now, fallback to classic mode handling
            handleSaveEntry(newEntry)
          } :
          handleSaveEntry
        }
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
        <div className="w-[600px] studio-surface border-l border-[#1a1a1a] z-40">
          <RenataChat />
        </div>
      )}
    </div>
  )
}