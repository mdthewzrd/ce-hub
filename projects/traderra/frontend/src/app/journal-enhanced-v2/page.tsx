'use client'

import React, { useState, useCallback } from 'react'
import {
  PanelLeft,
  Search,
  Filter,
  Plus,
  FileText,
  Settings,
  Moon,
  Sun,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { EnhancedFolderTree } from '@/components/folders/EnhancedFolderTree'
import { ToastProvider } from '@/components/ui/Toast'
import { LoadingState, EmptyState, FolderTreeSkeleton } from '@/components/ui/LoadingStates'
import { SAMPLE_FOLDERS, SAMPLE_DOCUMENTS, SampleDocument, getFolderPath } from '@/data/sampleContent'

export default function EnhancedJournalPageV2() {
  const [selectedFolderId, setSelectedFolderId] = useState<string>()
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(true)

  // Get current folder and document
  const currentFolder = selectedFolderId ? SAMPLE_FOLDERS.find(f => f.id === selectedFolderId) : null
  const currentDocument = selectedDocumentId ? SAMPLE_DOCUMENTS.find(d => d.id === selectedDocumentId) : null

  // Get documents in current folder
  const folderDocuments = currentFolder
    ? SAMPLE_DOCUMENTS.filter(doc => doc.folderId === currentFolder.id)
    : []

  // Filtered documents based on search
  const filteredDocuments = folderDocuments.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Event handlers
  const handleFolderSelect = useCallback((folderId: string) => {
    setSelectedFolderId(folderId)
    setSelectedDocumentId(undefined)
  }, [])

  const handleDocumentSelect = useCallback((documentId: string) => {
    setSelectedDocumentId(documentId)
  }, [])

  const handleCreateDocument = useCallback(() => {
    // In a real app, this would open a create document modal
    console.log('Creating new document in folder:', selectedFolderId)
  }, [selectedFolderId])

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev)
  }, [])

  const toggleTheme = useCallback(() => {
    setIsDarkMode(prev => !prev)
  }, [])

  return (
    <ToastProvider>
      <div className="flex h-screen bg-[#0a0a0a] text-white">
        {/* Sidebar */}
        <div
          className={cn(
            'flex flex-col border-r border-[#333] transition-all duration-300',
            sidebarCollapsed ? 'w-16' : 'w-80'
          )}
        >
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#333]">
            {!sidebarCollapsed && (
              <>
                <h1 className="text-lg font-semibold studio-text">Trading Journal</h1>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={toggleTheme}
                    className="p-2 hover:bg-[#1a1a1a] rounded-lg transition-colors"
                    title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                  >
                    {isDarkMode ? (
                      <Sun className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Moon className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={toggleSidebar}
                    className="p-2 hover:bg-[#1a1a1a] rounded-lg transition-colors"
                    title="Collapse sidebar"
                  >
                    <PanelLeft className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </>
            )}
            {sidebarCollapsed && (
              <button
                onClick={toggleSidebar}
                className="p-2 hover:bg-[#1a1a1a] rounded-lg transition-colors mx-auto"
                title="Expand sidebar"
              >
                <PanelLeft className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>

          {/* Sidebar Content */}
          {!sidebarCollapsed && (
            <div className="flex-1 overflow-hidden">
              {/* Search */}
              <div className="p-4 border-b border-[#333]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm studio-text placeholder-gray-500"
                  />
                </div>
              </div>

              {/* Folder Tree */}
              <div className="flex-1 overflow-y-auto p-4">
                {isLoading ? (
                  <FolderTreeSkeleton />
                ) : (
                  <EnhancedFolderTree
                    folders={SAMPLE_FOLDERS}
                    onFolderSelect={handleFolderSelect}
                    onDocumentSelect={handleDocumentSelect}
                    selectedFolderId={selectedFolderId}
                    selectedDocumentId={selectedDocumentId}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#333]">
            <div className="flex flex-col space-y-2">
              {currentFolder && (
                <>
                  {/* Breadcrumb path */}
                  <div className="flex items-center space-x-1 text-sm text-gray-400">
                    {getFolderPath(currentFolder.id).split(' / ').map((folderName, index, array) => (
                      <React.Fragment key={index}>
                        <span className={index === array.length - 1 ? 'text-white font-medium' : 'hover:text-gray-300 cursor-pointer'}>
                          {folderName}
                        </span>
                        {index < array.length - 1 && <ChevronRight className="w-3 h-3" />}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Folder name and description */}
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <h2 className="text-lg font-semibold studio-text">{currentFolder.name}</h2>
                      {folderDocuments.length > 0 && (
                        <span className="text-sm text-gray-500 bg-[#1a1a1a] px-2 py-1 rounded">
                          {folderDocuments.length} {folderDocuments.length === 1 ? 'item' : 'items'}
                        </span>
                      )}
                    </div>
                    {currentFolder.description && (
                      <span className="text-sm text-gray-400">{currentFolder.description}</span>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {currentFolder && (
                <>
                  <button
                    onClick={handleCreateDocument}
                    className="inline-flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Document</span>
                  </button>
                  <button className="p-2 hover:bg-[#1a1a1a] rounded-lg transition-colors">
                    <Filter className="w-4 h-4 text-gray-400" />
                  </button>
                </>
              )}
              <button className="p-2 hover:bg-[#1a1a1a] rounded-lg transition-colors">
                <Settings className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden">
            {selectedDocumentId && currentDocument ? (
              // Document View
              <div className="h-full overflow-y-auto">
                <div className="max-w-4xl mx-auto p-6">
                  {/* Document Header */}
                  <div className="border-b border-[#333] pb-6 mb-6">
                    <h1 className="text-3xl font-bold studio-text mb-4">{currentDocument.title}</h1>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span className="capitalize">{currentDocument.type.replace('_', ' ')}</span>
                      <span>•</span>
                      <span>{new Date(currentDocument.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>Updated {new Date(currentDocument.updatedAt).toLocaleDateString()}</span>
                    </div>
                    {currentDocument.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {currentDocument.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 text-xs bg-primary/20 text-primary rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Document Content */}
                  <div className="prose prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap text-sm studio-text leading-relaxed">
                      {currentDocument.content}
                    </pre>
                  </div>
                </div>
              </div>
            ) : selectedFolderId && currentFolder ? (
              // Folder View
              <div className="h-full overflow-y-auto">
                {filteredDocuments.length > 0 ? (
                  <div className="p-6">
                    <div className="grid gap-4">
                      {filteredDocuments.map((document) => (
                        <div
                          key={document.id}
                          onClick={() => handleDocumentSelect(document.id)}
                          className="p-4 bg-[#1a1a1a] border border-[#333] rounded-lg hover:border-primary/50 cursor-pointer transition-all group"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-medium studio-text group-hover:text-primary transition-colors">
                                {document.title}
                              </h3>
                              <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                                {document.content.slice(0, 200)}...
                              </p>
                              <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                                <span className="capitalize">{document.type.replace('_', ' ')}</span>
                                <span>•</span>
                                <span>{new Date(document.updatedAt).toLocaleDateString()}</span>
                                {document.tags.length > 0 && (
                                  <>
                                    <span>•</span>
                                    <span>{document.tags.slice(0, 2).join(', ')}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <FileText className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : searchQuery ? (
                  <EmptyState
                    type="search"
                    title="No documents found"
                    message={`No documents match "${searchQuery}". Try a different search term.`}
                  />
                ) : (
                  <EmptyState
                    type="documents"
                    title="No documents yet"
                    message="This folder is empty. Create your first document to get started."
                    action={{
                      label: 'Create Document',
                      onClick: handleCreateDocument,
                      icon: <Plus className="w-4 h-4" />
                    }}
                  />
                )}
              </div>
            ) : (
              // Welcome View
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-md">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                  <h2 className="text-2xl font-semibold studio-text mb-4">
                    Welcome to Your Enhanced Trading Journal
                  </h2>
                  <p className="text-gray-400 mb-8">
                    Organize your trades, strategies, and research with our powerful folder system.
                    Select a folder from the sidebar to get started.
                  </p>
                  <div className="space-y-4">
                    <div className="text-left">
                      <h3 className="font-medium studio-text mb-2">Features:</h3>
                      <ul className="text-sm text-gray-400 space-y-1">
                        <li>• Hierarchical folder organization</li>
                        <li>• Drag and drop reordering</li>
                        <li>• Rich text document editing</li>
                        <li>• Advanced search and filtering</li>
                        <li>• Trade analysis templates</li>
                        <li>• Stable context menus</li>
                        <li>• Complete folder operations</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ToastProvider>
  )
}