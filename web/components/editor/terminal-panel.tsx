'use client'

import { useState, useEffect, useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Terminal, X, Maximize2, Minimize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TerminalOutput {
  id: string
  timestamp: Date
  type: 'info' | 'success' | 'error' | 'command'
  content: string
}

interface TerminalPanelProps {
  outputs: TerminalOutput[]
  onCommand?: (command: string) => void
  className?: string
}

export function TerminalPanel({ outputs, onCommand, className }: TerminalPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [command, setCommand] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [outputs])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (command.trim() && onCommand) {
      onCommand(command)
      setCommand('')
    }
  }

  const getOutputColor = (type: TerminalOutput['type']) => {
    switch (type) {
      case 'error':
        return 'text-red-400'
      case 'success':
        return 'text-green-400'
      case 'command':
        return 'text-blue-400'
      default:
        return 'text-slate-300'
    }
  }

  return (
    <div className={cn(
      'bg-slate-950 border-t border-slate-800',
      isExpanded ? 'h-96' : 'h-48',
      'transition-all duration-200',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Terminal className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-300">Terminal</span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-slate-800 rounded"
          >
            {isExpanded ? (
              <Minimize2 className="h-4 w-4 text-slate-400" />
            ) : (
              <Maximize2 className="h-4 w-4 text-slate-400" />
            )}
          </button>
        </div>
      </div>

      {/* Output */}
      <ScrollArea className="h-[calc(100%-8rem)]">
        <div ref={scrollRef} className="p-4 font-mono text-sm space-y-1">
          {outputs.length === 0 ? (
            <div className="text-slate-500">No output yet. Run a command to see results.</div>
          ) : (
            outputs.map((output) => (
              <div key={output.id} className={getOutputColor(output.type)}>
                <span className="text-slate-600">
                  [{output.timestamp.toLocaleTimeString()}]
                </span>{' '}
                {output.type === 'command' && <span className="text-blue-400">$ </span>}
                {output.content}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      {onCommand && (
        <form onSubmit={handleSubmit} className="flex items-center px-4 py-2 border-t border-slate-800">
          <span className="text-blue-400 font-mono mr-2">$</span>
          <input
            ref={inputRef}
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Type a command..."
            className="flex-1 bg-transparent border-none outline-none text-slate-300 font-mono text-sm placeholder:text-slate-600"
          />
        </form>
      )}
    </div>
  )
}
