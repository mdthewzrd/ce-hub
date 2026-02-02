'use client'

import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface FileNode {
  name: string
  path: string
  type: 'file' | 'folder'
  children?: FileNode[]
  language?: string
}

interface FileTreeProps {
  files: FileNode[]
  selectedFile: string
  onFileSelect: (path: string, language?: string) => void
}

export function FileTree({ files, selectedFile, onFileSelect }: FileTreeProps) {
  return (
    <div className="p-2">
      {files.map((file) => (
        <FileTreeNode
          key={file.path}
          node={file}
          selectedFile={selectedFile}
          onFileSelect={onFileSelect}
          level={0}
        />
      ))}
    </div>
  )
}

interface FileTreeNodeProps {
  node: FileNode
  selectedFile: string
  onFileSelect: (path: string, language?: string) => void
  level: number
}

function FileTreeNode({ node, selectedFile, onFileSelect, level }: FileTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 1)

  const handleClick = () => {
    if (node.type === 'folder') {
      setIsExpanded(!isExpanded)
    } else {
      onFileSelect(node.path, node.language)
    }
  }

  const isSelected = selectedFile === node.path

  return (
    <div>
      <div
        className={cn(
          'flex items-center space-x-1 py-1 px-2 rounded cursor-pointer hover:bg-accent/50 transition-colors',
          isSelected && 'bg-accent'
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleClick}
      >
        {node.type === 'folder' ? (
          <>
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 text-blue-400" />
            ) : (
              <Folder className="h-4 w-4 text-blue-400" />
            )}
            <span className="text-sm">{node.name}</span>
          </>
        ) : (
          <>
            <div className="w-4" />
            <File className="h-4 w-4 text-slate-400" />
            <span className="text-sm">{node.name}</span>
          </>
        )}
      </div>
      {node.type === 'folder' && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              selectedFile={selectedFile}
              onFileSelect={onFileSelect}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
