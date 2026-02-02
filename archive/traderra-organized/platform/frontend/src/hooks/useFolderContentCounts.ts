import { useMemo, useCallback } from 'react'
import { FolderNode } from '@/components/folders/FolderTree'

// Mock content items (this would normally come from an API or context)
// This should match the data structure used in journal/page.tsx
const getMockContentItems = () => [
  {
    id: 'content-1',
    title: 'Strong Momentum Play on YIBO',
    type: 'trade_entry',
    folder_id: 'folder-1-1', // Daily Trades
    created_at: '2024-01-29T16:45:00Z',
    tags: ['momentum', 'breakout', 'pre-market']
  },
  {
    id: 'content-2',
    title: 'Quick Loss on YIBO Reversal',
    type: 'trade_entry',
    folder_id: 'folder-1-1', // Daily Trades
    created_at: '2024-01-29T17:05:00Z',
    tags: ['reversal', 'mistake', 'fomo']
  },
  {
    id: 'content-3',
    title: 'Excellent LPO Swing Trade',
    type: 'trade_entry',
    folder_id: 'folder-2-1', // Swing Trading
    created_at: '2024-01-28T14:30:00Z',
    tags: ['swing', 'support', 'earnings']
  },
  {
    id: 'content-4',
    title: 'Range Trading CMAX',
    type: 'trade_entry',
    folder_id: 'folder-2-2', // Day Trading
    created_at: '2024-01-26T11:20:00Z',
    tags: ['range', 'scalp', 'low-volume']
  },
  {
    id: 'content-5',
    title: 'Daily Review - January 2nd, 2025',
    type: 'daily_review',
    folder_id: 'folder-1-2', // Daily Reviews
    created_at: '2025-01-02T20:00:00Z',
    date: '2025-01-02',
    tags: ['daily-review', 'calendar-linked', 'analysis'],
    content: {
      daily_review_data: {
        date: '2025-01-02',
        day_performance: {
          total_trades: 2,
          winning_trades: 2,
          losing_trades: 0,
          win_rate: 100,
          total_pnl: 485.20,
          best_trade: 'AAPL momentum play (+$325.20)',
          worst_trade: 'None - all winners today'
        },
        market_conditions: 'Strong opening momentum, tech sector leading',
        lessons_learned: [
          'Early morning momentum setups worked perfectly',
          'Tech sector rotation provided clear opportunities',
          'Volume confirmation was key for entries'
        ],
        tomorrow_focus: [
          'Continue monitoring tech sector strength',
          'Look for pullback entries if momentum stalls',
          'Keep position sizing consistent'
        ]
      }
    }
  },
  {
    id: 'content-6',
    title: 'Daily Review - January 3rd, 2025',
    type: 'daily_review',
    folder_id: 'folder-1-2', // Daily Reviews
    created_at: '2025-01-03T20:00:00Z',
    date: '2025-01-03',
    tags: ['daily-review', 'calendar-linked', 'analysis'],
    content: {
      daily_review_data: {
        date: '2025-01-03',
        day_performance: {
          total_trades: 4,
          winning_trades: 3,
          losing_trades: 1,
          win_rate: 75,
          total_pnl: 1485.75,
          best_trade: 'NVDA breakout (+$985.75)',
          worst_trade: 'Small TSLA loss (-$125.00)'
        },
        market_conditions: 'Volatile day with strong tech breakouts',
        lessons_learned: [
          'NVDA breakout above resistance was textbook',
          'Quick stop on TSLA saved capital',
          'Multiple opportunities in AI/chip sector'
        ],
        tomorrow_focus: [
          'Watch for continuation in chip stocks',
          'Monitor overall market sentiment',
          'Stay disciplined with stops'
        ]
      }
    }
  },
  {
    id: 'content-7',
    title: 'Daily Review - January 9th, 2025',
    type: 'daily_review',
    folder_id: 'folder-1-2', // Daily Reviews
    created_at: '2025-01-09T20:00:00Z',
    date: '2025-01-09',
    tags: ['daily-review', 'calendar-linked', 'analysis'],
    content: {
      daily_review_data: {
        date: '2025-01-09',
        day_performance: {
          total_trades: 5,
          winning_trades: 4,
          losing_trades: 1,
          win_rate: 80,
          total_pnl: 1245.60,
          best_trade: 'AMD swing continuation (+$745.60)',
          worst_trade: 'Early exit on MSFT (-$85.00)'
        },
        market_conditions: 'Steady uptrend with sector rotation',
        lessons_learned: [
          'Patience with swing trades paying off',
          'Early exit cost potential profits',
          'Sector momentum continuing strong'
        ],
        tomorrow_focus: [
          'Hold winners longer when trend is clear',
          'Look for new sector rotation opportunities',
          'Maintain consistent position sizing'
        ]
      }
    }
  },
  {
    id: 'content-8',
    title: 'Daily Review - January 15th, 2025',
    type: 'daily_review',
    folder_id: 'folder-1-2', // Daily Reviews
    created_at: '2025-01-15T20:00:00Z',
    date: '2025-01-15',
    tags: ['daily-review', 'calendar-linked', 'analysis'],
    content: {
      daily_review_data: {
        date: '2025-01-15',
        day_performance: {
          total_trades: 3,
          winning_trades: 3,
          losing_trades: 0,
          win_rate: 100,
          total_pnl: 985.40,
          best_trade: 'GOOGL earnings play (+$565.40)',
          worst_trade: 'None - perfect day'
        },
        market_conditions: 'Earnings season momentum building',
        lessons_learned: [
          'Earnings pre-positioning strategy worked perfectly',
          'Options flow gave early signals',
          'Risk management kept size appropriate'
        ],
        tomorrow_focus: [
          'Continue earnings season plays',
          'Monitor for overextension signals',
          'Look for new sector catalysts'
        ]
      }
    }
  },
  {
    id: 'content-9',
    title: 'Daily Review - January 30th, 2025',
    type: 'daily_review',
    folder_id: 'folder-1-2', // Daily Reviews
    created_at: '2025-01-30T20:00:00Z',
    date: '2025-01-30',
    tags: ['daily-review', 'calendar-linked', 'analysis'],
    content: {
      daily_review_data: {
        date: '2025-01-30',
        day_performance: {
          total_trades: 6,
          winning_trades: 5,
          losing_trades: 1,
          win_rate: 83.33,
          total_pnl: 1485.90,
          best_trade: 'PLTR AI momentum (+$785.90)',
          worst_trade: 'Quick AMZN stop (-$125.00)'
        },
        market_conditions: 'Month-end strength with AI sector leadership',
        lessons_learned: [
          'AI momentum theme extremely strong',
          'Month-end flows provided extra liquidity',
          'Quick stops prevented larger losses'
        ],
        tomorrow_focus: [
          'New month - assess AI theme sustainability',
          'Look for rotation opportunities',
          'Maintain disciplined approach into February'
        ]
      }
    }
  },
  {
    id: 'content-12',
    title: 'Daily Trading Review - October 9th, 2025',
    type: 'daily_review',
    folder_id: 'folder-1-2', // Daily Reviews
    created_at: '2025-10-09T20:00:00Z',
    date: '2025-10-09',
    tags: ['daily-review', 'calendar-linked', 'lesson-learned', 'position-sizing', 'psychology'],
    content: {
      daily_review_data: {
        date: '2025-10-09',
        day_performance: {
          total_trades: 3,
          winning_trades: 2,
          losing_trades: 1,
          win_rate: 66.67,
          total_pnl: 425.75,
          best_trade: 'AAPL breakout (+$325.75)',
          worst_trade: 'TSLA overtrading (-$125.00)'
        },
        market_conditions: 'Choppy session with mixed sector rotation',
        lessons_learned: [
          'Position sizing discipline paid off today',
          'Overtrading on TSLA was emotional, not logical',
          'AAPL setup was textbook - patience rewarded'
        ],
        tomorrow_focus: [
          'Stick to planned position sizes',
          'Wait for A+ setups only',
          'Review overnight news for sector themes'
        ]
      }
    }
  },
  {
    id: 'content-13',
    title: 'Quick Notes - October 10th',
    type: 'daily_review',
    folder_id: 'folder-1-2', // Daily Reviews
    created_at: '2025-10-10T20:00:00Z',
    date: '2025-10-10',
    tags: ['daily-review', 'calendar-linked', 'good-day', 'discipline', 'consistency'],
    content: {
      daily_review_data: {
        date: '2025-10-10',
        day_performance: {
          total_trades: 4,
          winning_trades: 4,
          losing_trades: 0,
          win_rate: 100,
          total_pnl: 785.40,
          best_trade: 'NVDA gap fill (+$385.40)',
          worst_trade: 'None - all winners!'
        },
        market_conditions: 'Strong opening with clear sector themes',
        lessons_learned: [
          'Preparation the night before made all the difference',
          'Clear sector themes made trade selection easier',
          'Staying patient allowed for better entries'
        ],
        tomorrow_focus: [
          'Continue the same preparation routine',
          'Look for continuation in semiconductor theme',
          'Don\'t get overconfident - stick to process'
        ]
      }
    }
  },
  {
    id: 'content-10',
    title: 'Weekly Review - January 2024',
    type: 'review',
    folder_id: 'folder-1-3', // Weekly Reviews
    created_at: '2024-01-28T20:00:00Z',
    tags: ['review', 'analysis', 'performance']
  },
  {
    id: 'content-11',
    title: 'Market Research - Biotech Sector',
    type: 'research',
    folder_id: 'folder-3', // Research
    created_at: '2024-01-25T10:00:00Z',
    tags: ['biotech', 'sector', 'analysis']
  }
]

interface ContentItem {
  id: string
  title: string
  type: string
  folder_id: string
  created_at: string
  date?: string
  tags: string[]
}

/**
 * Hook for managing folder content counts across the application
 * This ensures consistent folder counts between journal, calendar, and other pages
 */
export function useFolderContentCounts(customContentItems?: ContentItem[]) {
  // Use custom content items if provided, otherwise use mock data
  const contentItems = customContentItems || getMockContentItems()

  // Helper function to count content items per folder
  const getContentCountForFolder = useCallback((folderId: string): number => {
    return contentItems.filter(item => item.folder_id === folderId).length
  }, [contentItems])

  // Generate folders with calculated content counts
  const getFoldersWithCounts = useCallback((): FolderNode[] => {
    const baseFolders: FolderNode[] = [
      {
        id: 'folder-1',
        name: 'Trading Journal',
        icon: 'journal-text',
        color: '#3B82F6',
        position: 0,
        contentCount: 0, // Will be calculated
        children: [
          {
            id: 'folder-1-1',
            name: 'Daily Trades',
            parentId: 'folder-1',
            icon: 'calendar',
            color: '#10B981',
            position: 1,
            contentCount: getContentCountForFolder('folder-1-1'),
            children: []
          },
          {
            id: 'folder-1-2',
            name: 'Daily Reviews',
            parentId: 'folder-1',
            icon: 'calendar-days',
            color: '#FFD700',
            position: 2,
            contentCount: getContentCountForFolder('folder-1-2'),
            children: []
          },
          {
            id: 'folder-1-3',
            name: 'Weekly Reviews',
            parentId: 'folder-1',
            icon: 'star',
            color: '#F59E0B',
            position: 3,
            contentCount: getContentCountForFolder('folder-1-3'),
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
        contentCount: 0, // Will be calculated
        children: [
          {
            id: 'folder-2-1',
            name: 'Swing Trading',
            parentId: 'folder-2',
            icon: 'trending-up',
            color: '#EF4444',
            position: 1,
            contentCount: getContentCountForFolder('folder-2-1'),
            children: []
          },
          {
            id: 'folder-2-2',
            name: 'Day Trading',
            parentId: 'folder-2',
            icon: 'trending-up',
            color: '#EF4444',
            position: 2,
            contentCount: getContentCountForFolder('folder-2-2'),
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
        contentCount: getContentCountForFolder('folder-3'),
        children: []
      }
    ]

    // Calculate parent folder content counts as sum of children
    baseFolders.forEach(folder => {
      if (folder.children.length > 0) {
        folder.contentCount = folder.children.reduce((sum, child) => sum + child.contentCount, 0)
      }
    })

    return baseFolders
  }, [getContentCountForFolder])

  // Get the folders with counts (memoized for performance)
  const foldersWithCounts = useMemo(() => getFoldersWithCounts(), [getFoldersWithCounts])

  // Helper to get content items for a specific folder
  const getContentForFolder = useCallback((folderId: string) => {
    return contentItems.filter(item => item.folder_id === folderId)
  }, [contentItems])

  // Helper to get all descendant folder IDs (including the folder itself)
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

  // Get content for folder and all its descendants
  const getContentForFolderAndDescendants = useCallback((folderId: string) => {
    const descendantIds = getDescendantFolderIds(folderId, foldersWithCounts)
    return contentItems.filter(item => descendantIds.includes(item.folder_id))
  }, [contentItems, foldersWithCounts, getDescendantFolderIds])

  return {
    folders: foldersWithCounts,
    contentItems,
    getContentCountForFolder,
    getContentForFolder,
    getContentForFolderAndDescendants,
    getDescendantFolderIds: (folderId: string) => getDescendantFolderIds(folderId, foldersWithCounts)
  }
}