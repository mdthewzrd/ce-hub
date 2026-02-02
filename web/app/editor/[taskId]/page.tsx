'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MonacoEditor } from '@/components/editor/monaco-editor'
import { FileTree } from '@/components/editor/file-tree'
import { TerminalPanel } from '@/components/editor/terminal-panel'
import { MobileToolbar } from '@/components/editor/mobile-toolbar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Play,
  Save,
  GitBranch,
  Settings,
  X,
  ArrowLeft,
  FileText,
  GitCommit,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

interface FileNode {
  name: string
  path: string
  type: 'file' | 'folder'
  children?: FileNode[]
  language?: string
}

const mockFiles: FileNode[] = [
  {
    name: 'src',
    path: '/src',
    type: 'folder',
    children: [
      {
        name: 'lib',
        path: '/src/lib',
        type: 'folder',
        children: [
          { name: 'jwt.ts', path: '/src/lib/jwt.ts', type: 'file', language: 'typescript' },
          { name: 'auth.ts', path: '/src/lib/auth.ts', type: 'file', language: 'typescript' }
        ]
      },
      {
        name: 'routes',
        path: '/src/routes',
        type: 'folder',
        children: [
          { name: 'auth.ts', path: '/src/routes/auth.ts', type: 'file', language: 'typescript' }
        ]
      }
    ]
  },
  {
    name: 'package.json',
    path: '/package.json',
    type: 'file',
    language: 'json'
  },
  {
    name: 'tsconfig.json',
    path: '/tsconfig.json',
    type: 'file',
    language: 'json'
  }
]

const mockFileContents: Record<string, string> = {
  '/src/lib/auth.ts': `import { sign, verify } from './jwt'

export interface User {
  id: string
  email: string
  password: string
}

export async function login(email: string, password: string) {
  // Find user by email
  const user = await findUserByEmail(email)

  if (!user) {
    throw new Error('User not found')
  }

  // Verify password
  const isValid = await verifyPassword(password, user.password)

  if (!isValid) {
    throw new Error('Invalid password')
  }

  // Generate tokens
  const accessToken = await sign({ userId: user.id }, '15m')
  const refreshToken = await sign({ userId: user.id }, '7d')

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email }
  }
}

export async function refreshAccessToken(token: string) {
  try {
    const payload = await verify(token)

    if (!payload.userId) {
      throw new Error('Invalid token')
    }

    const newAccessToken = await sign({ userId: payload.userId }, '15m')

    return { accessToken: newAccessToken }
  } catch (error) {
    throw new Error('Invalid refresh token')
  }
}`,
  '/src/lib/jwt.ts': `import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function sign(payload: any, expiresIn: string) {
  return jwt.sign(payload, SECRET, { expiresIn })
}

export async function verify(token: string) {
  try {
    return jwt.verify(token, SECRET)
  } catch (error) {
    throw new Error('Invalid token')
  }
}`,
  '/src/routes/auth.ts': `import { login, refreshAccessToken } from '../lib/auth'
import { Router } from 'express'

const router = Router()

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' })
    }

    const result = await login(email, password)

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })

    res.json({
      accessToken: result.accessToken,
      user: result.user
    })
  } catch (error) {
    res.status(401).json({ error: error.message })
  }
})

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.cookies

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' })
    }

    const result = await refreshAccessToken(refreshToken)

    res.json(result)
  } catch (error) {
    res.status(401).json({ error: error.message })
  }
})

export default router`,
  '/package.json': `{
  "name": "ce-hub-auth",
  "version": "1.0.0",
  "description": "Authentication module for CE-Hub",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "dev": "ts-node src/index.ts",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "bcrypt": "^5.1.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.17",
    "@types/jsonwebtoken": "^9.0.2",
    "@types/bcrypt": "^5.0.0",
    "typescript": "^5.2.2",
    "ts-node": "^10.9.1"
  }
}`,
  '/tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}`
}

export default function EditorPage() {
  const params = useParams()
  const [selectedFile, setSelectedFile] = useState('/src/lib/auth.ts')
  const [openTabs, setOpenTabs] = useState(['/src/lib/auth.ts'])
  const [activeTab, setActiveTab] = useState('/src/lib/auth.ts')
  const [terminalOutputs, setTerminalOutputs] = useState([
    {
      id: '1',
      timestamp: new Date(Date.now() - 5000),
      type: 'command' as const,
      content: 'npm test'
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 3000),
      type: 'info' as const,
      content: 'Running tests...'
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 1000),
      type: 'success' as const,
      content: '✓ All tests passed (3/3)'
    }
  ])
  const [isSaving, setIsSaving] = useState(false)

  const handleFileSelect = (path: string) => {
    setSelectedFile(path)
    if (!openTabs.includes(path)) {
      setOpenTabs([...openTabs, path])
    }
    setActiveTab(path)
  }

  const handleCloseTab = (path: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newTabs = openTabs.filter(t => t !== path)
    setOpenTabs(newTabs)
    if (activeTab === path) {
      setActiveTab(newTabs[newTabs.length - 1] || '')
      setSelectedFile(newTabs[newTabs.length - 1] || '')
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate save
    setTimeout(() => {
      setIsSaving(false)
      setTerminalOutputs([
        ...terminalOutputs,
        {
          id: Date.now().toString(),
          timestamp: new Date(),
          type: 'success',
          content: `✓ Saved ${selectedFile}`
        }
      ])
    }, 500)
  }

  const handleRun = () => {
    setTerminalOutputs([
      ...terminalOutputs,
      {
        id: Date.now().toString(),
        timestamp: new Date(),
        type: 'command',
        content: 'npm run dev'
      },
      {
        id: (Date.now() + 1).toString(),
        timestamp: new Date(),
        type: 'info',
        content: 'Starting development server...'
      }
    ])
  }

  const handleTerminalCommand = (command: string) => {
    setTerminalOutputs([
      ...terminalOutputs,
      {
        id: Date.now().toString(),
        timestamp: new Date(),
        type: 'command',
        content: command
      }
    ])
  }

  const currentFile = mockFileContents[selectedFile] || '// File not found'
  const getLanguageFromPath = (path: string): string => {
    if (path.endsWith('.ts')) return 'typescript'
    if (path.endsWith('.js')) return 'javascript'
    if (path.endsWith('.json')) return 'json'
    if (path.endsWith('.html')) return 'html'
    if (path.endsWith('.css')) return 'css'
    return 'typescript'
  }

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Header */}
      <header className="h-14 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <Link href={`/tasks/${params.id}`}>
            <Button variant="ghost" size="icon" className="text-slate-300">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-sm font-semibold text-slate-200">CE-Hub Editor</h1>
            <p className="text-xs text-slate-400">Implement user authentication</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={handleRun} className="text-slate-300">
            <Play className="h-4 w-4 mr-2" />
            Run
          </Button>
          <Button variant="ghost" size="sm" onClick={handleSave} disabled={isSaving} className="text-slate-300">
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save
          </Button>
          <Button variant="ghost" size="sm" className="text-slate-300">
            <GitBranch className="h-4 w-4 mr-2" />
            Commit
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - File Tree */}
        <div className="w-56 bg-slate-850 border-r border-slate-700 hidden md:block overflow-y-auto">
          <div className="p-2">
            <FileTree
              files={mockFiles}
              selectedFile={selectedFile}
              onFileSelect={handleFileSelect}
            />
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="h-10 bg-slate-800 border-b border-slate-700 flex items-center overflow-x-auto">
            {openTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => handleFileSelect(tab)}
                className={`
                  flex items-center space-x-2 px-4 h-full text-sm border-r border-slate-700
                  ${activeTab === tab
                    ? 'bg-slate-900 text-slate-100 border-t-2 border-t-blue-500'
                    : 'text-slate-400 hover:bg-slate-850'
                  }
                `}
              >
                <FileText className="h-4 w-4" />
                <span className="max-w-[150px] truncate">{tab.split('/').pop()}</span>
                <X
                  className="h-3 w-3 hover:bg-slate-700 rounded"
                  onClick={(e) => handleCloseTab(tab, e)}
                />
              </button>
            ))}
          </div>

          {/* Editor */}
          <div className="flex-1 overflow-hidden">
            <MonacoEditor
              file={{
                path: selectedFile,
                content: currentFile,
                language: getLanguageFromPath(selectedFile)
              }}
            />
          </div>

          {/* Terminal */}
          <TerminalPanel
            outputs={terminalOutputs}
            onCommand={handleTerminalCommand}
          />
        </div>
      </div>

      {/* Mobile Toolbar */}
      <MobileToolbar
        onSave={handleSave}
        onRun={handleRun}
      />
    </div>
  )
}
