'use client'

import React, { useState, useCallback } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import {
  FileText,
  Plus,
  Library,
  Settings,
  Lightbulb,
  TrendingUp,
  Search,
  BarChart3,
  Target,
  BookOpen,
} from 'lucide-react'

import { RichTextEditor, Document } from '@/components/editor/RichTextEditor'
import { DocumentTemplates, documentTemplates } from '@/components/editor/templates/DocumentTemplates'
import { DocumentManager } from '@/components/editor/DocumentManager'
import { EditorSidebar } from '@/components/editor/EditorSidebar'
import { TradeEntryBlock, TradeData } from '@/components/editor/blocks/TradeEntryBlock'
import { ChartBlock, ChartConfig } from '@/components/editor/blocks/ChartBlock'
import { CalculationBlock, CalculationFormula, calculationTemplates } from '@/components/editor/blocks/CalculationBlock'
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

// Example documents with sample content
const exampleDocuments: Document[] = [
  {
    id: 'example-trade-analysis',
    folderId: 'examples',
    title: 'AAPL Long Position Analysis - Q4 2024',
    type: 'trade_analysis',
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'AAPL Long Position Analysis - Q4 2024' }]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Date: ' },
            { type: 'text', marks: [{ type: 'bold' }], text: 'December 15, 2024' }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '📊 Trade Overview' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'This analysis covers my long position in Apple Inc. (AAPL) during the Q4 earnings run-up. The trade was based on strong iPhone 16 sales data and positive AI sentiment surrounding Apple Intelligence features.' }]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '🎯 Setup Analysis' }]
        },
        {
          type: 'heading',
          attrs: { level: 3 },
          content: [{ type: 'text', text: 'Market Context' }]
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Overall market trend: Bullish momentum into year-end' }] }]
            },
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Sector performance: Technology leading with 15% monthly gains' }] }]
            },
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Key economic events: Fed dovish stance supporting growth stocks' }] }]
            }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '📈 Results & Performance' }]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'The position yielded a ' },
            { type: 'text', marks: [{ type: 'bold' }, { type: 'highlight' }], text: '+12.5% return' },
            { type: 'text', text: ' over 3 weeks, significantly outperforming my target of 8%.' }
          ]
        },
        {
          type: 'blockquote',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', marks: [{ type: 'italic' }], text: 'Key lesson: AI narrative combined with solid fundamentals created a powerful momentum play. The risk-reward ratio of 1:3 was well-executed with disciplined position sizing.' }]
            }
          ]
        }
      ]
    },
    metadata: {
      tags: ['AAPL', 'earnings', 'technology', 'AI', 'momentum'],
      category: 'trading',
      template: 'trade-analysis-template',
      lastModified: '2024-12-15T14:30:00Z',
      wordCount: 187,
      readTime: 1
    }
  },
  {
    id: 'example-strategy',
    folderId: 'examples',
    title: 'Momentum Breakout Strategy v2.1',
    type: 'strategy',
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Momentum Breakout Strategy v2.1' }]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Version: ' },
            { type: 'text', marks: [{ type: 'bold' }], text: '2.1' },
            { type: 'text', text: ' | Created: ' },
            { type: 'text', marks: [{ type: 'bold' }], text: 'November 2024' }
          ]
        },
        {
          type: 'horizontalRule'
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '🎯 Strategy Overview' }]
        },
        {
          type: 'blockquote',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', marks: [{ type: 'italic' }], text: 'A systematic approach to capturing momentum breakouts in trending markets, focusing on high-volume breakouts above key resistance levels with strong relative strength.' }]
            }
          ]
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    { type: 'text', marks: [{ type: 'bold' }], text: 'Market Type: ' },
                    { type: 'text', text: 'Trending markets with clear directional bias' }
                  ]
                }
              ]
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    { type: 'text', marks: [{ type: 'bold' }], text: 'Timeframe: ' },
                    { type: 'text', text: 'Daily charts for entries, 4-hour for monitoring' }
                  ]
                }
              ]
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    { type: 'text', marks: [{ type: 'bold' }], text: 'Risk per Trade: ' },
                    { type: 'text', text: '1-2% of account capital' }
                  ]
                }
              ]
            }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '📋 Entry Criteria' }]
        },
        {
          type: 'taskList',
          content: [
            {
              type: 'taskItem',
              attrs: { checked: false },
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Stock breaking above 20-day high with volume 150% of average' }] }]
            },
            {
              type: 'taskItem',
              attrs: { checked: false },
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'RSI between 60-80 (strong but not overbought)' }] }]
            },
            {
              type: 'taskItem',
              attrs: { checked: false },
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Market cap > $1B for liquidity' }] }]
            },
            {
              type: 'taskItem',
              attrs: { checked: false },
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Sector showing relative strength vs. SPY' }] }]
            }
          ]
        }
      ]
    },
    metadata: {
      tags: ['momentum', 'breakout', 'strategy', 'systematic'],
      category: 'strategy',
      template: 'strategy-document-template',
      lastModified: '2024-11-20T10:15:00Z',
      wordCount: 156,
      readTime: 1
    }
  },
  {
    id: 'example-research',
    folderId: 'examples',
    title: 'AI Chip Sector Analysis - December 2024',
    type: 'research',
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'AI Chip Sector Analysis - December 2024' }]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Research Date: ' },
            { type: 'text', marks: [{ type: 'bold' }], text: 'December 10, 2024' },
            { type: 'text', text: ' | Analyst: ' },
            { type: 'text', marks: [{ type: 'bold' }], text: 'Senior Trader' }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '📋 Executive Summary' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', marks: [{ type: 'italic' }], text: 'The AI chip sector continues to show robust growth despite geopolitical headwinds. NVIDIA maintains market leadership while AMD and Intel position for increased market share in 2025. Supply chain constraints are easing, supporting margin expansion across the sector.' }]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '🔍 Key Findings' }]
        },
        {
          type: 'orderedList',
          content: [
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'NVIDIA H200 demand exceeding supply by 300%, driving pricing power' }] }]
            },
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'AMD MI300X gaining traction with cloud providers as cost-effective alternative' }] }]
            },
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Intel Gaudi 3 delayed to Q2 2025, creating opportunity gap' }] }]
            }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '💡 Investment Thesis' }]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Sector rotation into AI infrastructure providers presents compelling risk-reward opportunity. Target allocation: ' },
            { type: 'text', marks: [{ type: 'bold' }], text: '60% NVDA, 25% AMD, 15% emerging players' },
            { type: 'text', text: '.' }
          ]
        }
      ]
    },
    metadata: {
      tags: ['AI', 'semiconductors', 'NVIDIA', 'AMD', 'research'],
      category: 'research',
      template: 'research-note-template',
      lastModified: '2024-12-10T16:45:00Z',
      wordCount: 143,
      readTime: 1
    }
  }
]

// Sample trading data for blocks
const sampleTradeData: TradeData = {
  id: 'trade-1',
  symbol: 'AAPL',
  side: 'Long',
  entryPrice: 185.50,
  exitPrice: 208.75,
  quantity: 100,
  entryDate: '2024-11-25T09:30:00Z',
  exitDate: '2024-12-15T15:45:00Z',
  pnl: 2325,
  pnlPercentage: 12.53,
  stopLoss: 175.00,
  takeProfit: 210.00,
  strategy: 'Momentum Breakout',
  notes: 'Strong earnings momentum with AI catalyst. Exceeded target due to market-wide tech rally.',
  tags: ['earnings', 'AI', 'momentum'],
  status: 'closed',
  risk: 1050,
  reward: 2450,
  commission: 2.50
}

const sampleChartConfig: ChartConfig = {
  id: 'chart-1',
  symbol: 'AAPL',
  timeframe: '1d',
  chartType: 'candlestick',
  indicators: ['RSI', 'MACD', 'Volume'],
  overlays: ['SMA(20)', 'SMA(50)'],
  theme: 'dark',
  height: 400,
  showVolume: true,
  showGrid: true,
  title: 'AAPL Daily Chart - Breakout Analysis',
  caption: 'Clear breakout above 20-day resistance with strong volume confirmation'
}

export default function EditorDemoPage() {
  const [currentDocument, setCurrentDocument] = useState<Document>(exampleDocuments[0])
  const [showTemplates, setShowTemplates] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeView, setActiveView] = useState<'editor' | 'blocks'>('editor')

  // Handle document selection
  const handleDocumentSelect = useCallback((document: Document) => {
    setCurrentDocument(document)
  }, [])

  // Handle document save
  const handleDocumentSave = useCallback(async (document: Document) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log('Document saved:', document)
  }, [])

  // Handle template selection
  const handleTemplateSelect = useCallback((template: any) => {
    const newDocument: Document = {
      id: `doc-${Date.now()}`,
      folderId: 'new',
      title: template.name === 'Blank Document' ? 'Untitled Document' : `New ${template.name}`,
      type: template.category,
      content: template.content,
      metadata: {
        tags: template.tags || [],
        category: template.category,
        template: template.id,
        lastModified: new Date().toISOString(),
        wordCount: 0,
        readTime: 0
      }
    }
    setCurrentDocument(newDocument)
    setShowTemplates(false)
  }, [])

  // Handle document export
  const handleDocumentExport = useCallback(async (document: Document, format: 'pdf' | 'markdown' | 'json') => {
    // Simulate export
    await new Promise(resolve => setTimeout(resolve, 1500))
    console.log(`Exported ${document.title} as ${format}`)
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen studio-bg">
        {/* Header */}
        <div className="bg-card border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-8 h-8 text-primary" />
                  <div>
                    <h1 className="text-xl font-bold">Traderra Rich Text Editor</h1>
                    <p className="text-sm text-muted-foreground">Notion-like editor for trading journals</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* View Toggle */}
                <div className="flex bg-muted rounded-lg p-1">
                  <button
                    onClick={() => setActiveView('editor')}
                    className={cn(
                      'px-3 py-1 rounded text-sm font-medium transition-colors',
                      activeView === 'editor'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Editor
                  </button>
                  <button
                    onClick={() => setActiveView('blocks')}
                    className={cn(
                      'px-3 py-1 rounded text-sm font-medium transition-colors',
                      activeView === 'blocks'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Blocks
                  </button>
                </div>

                <button
                  onClick={() => setShowTemplates(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Document
                </button>

                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 rounded-lg hover:bg-accent transition-colors"
                  title="Toggle sidebar"
                >
                  <Library className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex h-[calc(100vh-64px)]">
          {/* Main Editor Area */}
          <div className="flex-1 flex flex-col">
            {activeView === 'editor' ? (
              <>
                {/* Document Manager */}
                <DocumentManager
                  document={currentDocument}
                  onDocumentChange={setCurrentDocument}
                  onSave={handleDocumentSave}
                  onExport={handleDocumentExport}
                  className="p-6"
                />

                {/* Rich Text Editor */}
                <div className="flex-1 p-6 pt-0">
                  <RichTextEditor
                    document={currentDocument}
                    onChange={(content) => setCurrentDocument(prev => ({ ...prev, content }))}
                    onSave={handleDocumentSave}
                    className="h-full"
                  />
                </div>
              </>
            ) : (
              /* Blocks Showcase */
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="max-w-4xl mx-auto space-y-8">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold mb-4">Trading-Specific Blocks</h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                      Explore the custom blocks designed specifically for trading journals and analysis.
                      These components can be inserted into any document using the slash command menu.
                    </p>
                  </div>

                  {/* Trade Entry Block */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-6 h-6 text-primary" />
                      <div>
                        <h3 className="text-xl font-semibold">Trade Entry Block</h3>
                        <p className="text-muted-foreground">Structured trade data with P&L calculation and risk metrics</p>
                      </div>
                    </div>
                    <TradeEntryBlock
                      tradeData={sampleTradeData}
                      editable={true}
                      onEdit={(data) => console.log('Edit trade:', data)}
                      onDelete={(id) => console.log('Delete trade:', id)}
                      onDuplicate={(data) => console.log('Duplicate trade:', data)}
                    />
                  </div>

                  {/* Chart Block */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-6 h-6 text-primary" />
                      <div>
                        <h3 className="text-xl font-semibold">Chart Block</h3>
                        <p className="text-muted-foreground">Interactive trading charts with technical indicators</p>
                      </div>
                    </div>
                    <ChartBlock
                      config={sampleChartConfig}
                      editable={true}
                      onEdit={(config) => console.log('Edit chart:', config)}
                      onDelete={(id) => console.log('Delete chart:', id)}
                    />
                  </div>

                  {/* Calculation Blocks */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Target className="w-6 h-6 text-primary" />
                      <div>
                        <h3 className="text-xl font-semibold">Calculation Blocks</h3>
                        <p className="text-muted-foreground">Financial calculations with real-time results</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {calculationTemplates.slice(0, 4).map((calc) => (
                        <CalculationBlock
                          key={calc.id}
                          calculation={calc}
                          editable={true}
                          onEdit={(calc) => console.log('Edit calculation:', calc)}
                          onDelete={(id) => console.log('Delete calculation:', id)}
                          onDuplicate={(calc) => console.log('Duplicate calculation:', calc)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="bg-card border border-border rounded-lg p-6 mt-12">
                    <h3 className="text-lg font-semibold mb-4">Key Features</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                        <Lightbulb className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <h4 className="font-medium">Slash Commands</h4>
                          <p className="text-sm text-muted-foreground">Type "/" to access block menu</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <h4 className="font-medium">Document Templates</h4>
                          <p className="text-sm text-muted-foreground">Pre-built structures for different journal types</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Settings className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <h4 className="font-medium">Auto-save</h4>
                          <p className="text-sm text-muted-foreground">Automatic saving with conflict resolution</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Search className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <h4 className="font-medium">Document Management</h4>
                          <p className="text-sm text-muted-foreground">Search, organize, and version control</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          {sidebarOpen && (
            <EditorSidebar
              documents={exampleDocuments}
              document={currentDocument}
              onDocumentSelect={handleDocumentSelect}
              className="w-80 flex-shrink-0"
            />
          )}
        </div>

        {/* Templates Modal */}
        {showTemplates && (
          <DocumentTemplates
            onSelectTemplate={handleTemplateSelect}
            onClose={() => setShowTemplates(false)}
          />
        )}

        {/* Toast Notifications */}
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
      </div>
    </QueryClientProvider>
  )
}