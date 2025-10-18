'use client'

import { useState, useEffect, useRef } from 'react'
import { Bold, Italic, List, Heading1, Heading2 } from 'lucide-react'

interface BlockNoteEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function BlockNoteEditor({ value, onChange, placeholder }: BlockNoteEditorProps) {
  const [content, setContent] = useState(value || '')
  const editorRef = useRef<HTMLDivElement>(null)

  // Update local content when value prop changes
  useEffect(() => {
    if (content !== value) {
      setContent(value || '')
      if (editorRef.current && editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || ''
      }
    }
  }, [value])

  const handleInput = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML
      setContent(newContent)
      onChange(newContent)
    }
  }

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    handleInput()
  }

  const formatBold = () => execCommand('bold')
  const formatItalic = () => execCommand('italic')
  const formatHeading1 = () => execCommand('formatBlock', 'h1')
  const formatHeading2 = () => execCommand('formatBlock', 'h2')
  const formatList = () => execCommand('insertUnorderedList')

  return (
    <div className="studio-surface rounded-lg border studio-border overflow-hidden">
      {/* Formatting Toolbar */}
      <div className="flex items-center space-x-1 p-3 border-b studio-border bg-[#0f0f0f]">
        <button
          type="button"
          onClick={formatBold}
          className="p-2 hover:bg-[#1a1a1a] rounded transition-colors group"
          title="Bold (Ctrl+B / Cmd+B)"
        >
          <Bold className="h-4 w-4 studio-muted group-hover:studio-text" />
        </button>
        <button
          type="button"
          onClick={formatItalic}
          className="p-2 hover:bg-[#1a1a1a] rounded transition-colors group"
          title="Italic (Ctrl+I / Cmd+I)"
        >
          <Italic className="h-4 w-4 studio-muted group-hover:studio-text" />
        </button>
        <div className="w-px h-6 bg-[#1a1a1a] mx-1" />
        <button
          type="button"
          onClick={formatHeading1}
          className="p-2 hover:bg-[#1a1a1a] rounded transition-colors group"
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4 studio-muted group-hover:studio-text" />
        </button>
        <button
          type="button"
          onClick={formatHeading2}
          className="p-2 hover:bg-[#1a1a1a] rounded transition-colors group"
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4 studio-muted group-hover:studio-text" />
        </button>
        <div className="w-px h-6 bg-[#1a1a1a] mx-1" />
        <button
          type="button"
          onClick={formatList}
          className="p-2 hover:bg-[#1a1a1a] rounded transition-colors group"
          title="Bullet List"
        >
          <List className="h-4 w-4 studio-muted group-hover:studio-text" />
        </button>
        <div className="flex-1" />
        <div className="text-xs studio-muted">
          Select text and click formatting buttons
        </div>
      </div>

      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="w-full min-h-[300px] p-4 bg-transparent text-studio-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary leading-relaxed prose prose-invert max-w-none [&_p]:mb-3 [&_p]:text-gray-300 [&_strong]:text-white [&_strong]:font-bold [&_em]:text-gray-400 [&_em]:italic [&_ul]:ml-4 [&_ul]:list-disc [&_ul]:text-gray-300 [&_li]:mb-1 [&_li]:text-gray-300 [&_h1]:text-white [&_h1]:font-bold [&_h1]:text-xl [&_h1]:mb-4 [&_h2]:text-white [&_h2]:font-semibold [&_h2]:text-lg [&_h2]:mb-3"
        style={{
          color: '#e5e5e5',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '14px',
          lineHeight: '1.6'
        }}
        onKeyDown={(e) => {
          // Keyboard shortcuts
          if (e.ctrlKey || e.metaKey) {
            if (e.key === 'b') {
              e.preventDefault()
              formatBold()
            } else if (e.key === 'i') {
              e.preventDefault()
              formatItalic()
            }
          }
        }}
        dangerouslySetInnerHTML={{ __html: content }}
      />

      <div className="p-2 text-xs studio-muted border-t studio-border bg-[#0a0a0a]">
        ✨ <strong>Tip:</strong> Select text and click formatting buttons, or use Ctrl+B/Ctrl+I (Windows) or Cmd+B/Cmd+I (Mac) shortcuts
      </div>
    </div>
  )
}