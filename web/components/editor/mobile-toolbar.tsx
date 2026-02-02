'use client'

import { Button } from '@/components/ui/button'
import { Play, Save, GitBranch, MoreVertical, Code } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileToolbarProps {
  onSave?: () => void
  onRun?: () => void
  onCommit?: () => void
  onMore?: () => void
  className?: string
}

export function MobileToolbar({
  onSave,
  onRun,
  onCommit,
  onMore,
  className
}: MobileToolbarProps) {
  return (
    <div className={cn(
      'fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-4 py-3',
      'md:hidden',
      className
    )}>
      <div className="flex items-center justify-around">
        <Button
          variant="ghost"
          size="sm"
          onClick={onRun}
          className="flex-col h-auto py-2 space-y-1"
        >
          <Play className="h-5 w-5" />
          <span className="text-xs">Run</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onSave}
          className="flex-col h-auto py-2 space-y-1"
        >
          <Save className="h-5 w-5" />
          <span className="text-xs">Save</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onCommit}
          className="flex-col h-auto py-2 space-y-1"
        >
          <GitBranch className="h-5 w-5" />
          <span className="text-xs">Commit</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onMore}
          className="flex-col h-auto py-2 space-y-1"
        >
          <MoreVertical className="h-5 w-5" />
          <span className="text-xs">More</span>
        </Button>
      </div>
    </div>
  )
}
