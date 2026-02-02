'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RefreshCw, Pause, Play, Terminal, User, Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import Link from 'next/link'

interface Agent {
  id: string
  name: string
  status: 'idle' | 'active' | 'error'
  currentTask?: string
  lastActivity?: Date
}

interface Workflow {
  id: string
  title: string
  phase: string
  progress: number
  agent: string
  status: string
  startedAt: Date
  consoleOutput: string[]
}

export default function AgentMonitorPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    loadData()

    if (autoRefresh) {
      const interval = setInterval(() => {
        loadData()
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const loadData = () => {
    // Simulate loading data
    setAgents([
      {
        id: 'ce-hub-engineer',
        name: 'CE-Hub Engineer',
        status: 'active',
        currentTask: 'Implement user authentication',
        lastActivity: new Date()
      },
      {
        id: 'research-intelligence-specialist',
        name: 'Research Intelligence Specialist',
        status: 'active',
        currentTask: 'Vector database options',
        lastActivity: new Date(Date.now() - 2 * 60 * 1000)
      },
      {
        id: 'qa-tester',
        name: 'QA Tester',
        status: 'idle',
        lastActivity: new Date(Date.now() - 30 * 60 * 1000)
      },
      {
        id: 'documentation-specialist',
        name: 'Documentation Specialist',
        status: 'idle',
        lastActivity: new Date(Date.now() - 60 * 60 * 1000)
      }
    ])

    setWorkflows([
      {
        id: '1',
        title: 'Implement user authentication',
        phase: 'Phase 3: Producing',
        progress: 60,
        agent: 'ce-hub-engineer',
        status: 'active',
        startedAt: new Date(Date.now() - 45 * 60 * 1000),
        consoleOutput: [
          '> Created POST /auth/login',
          '> Added JWT token generation',
          '> Implemented password hashing',
          '> Testing endpoint...',
          '> ✓ Login endpoint working',
          '> Creating refresh token endpoint...',
          '> Added token validation middleware',
          '> Testing refresh flow...'
        ]
      },
      {
        id: '2',
        title: 'Research: Vector database options',
        phase: 'Phase 2: Researching',
        progress: 35,
        agent: 'research-intelligence-specialist',
        status: 'active',
        startedAt: new Date(Date.now() - 20 * 60 * 1000),
        consoleOutput: [
          '> Searching for vector database documentation...',
          '> Found PineDB documentation',
          '> Analyzing Weaviate features...',
          '> Comparing performance benchmarks...',
          '> Found 7 relevant sources'
        ]
      }
    ])
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      loadData()
      setIsRefreshing(false)
    }, 500)
  }

  const getAgentStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      case 'idle':
      default:
        return <Badge variant="secondary">Idle</Badge>
    }
  }

  const getAgentStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'idle':
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getTimeSince = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <Terminal className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-semibold">Agent Monitor</h1>
              <p className="text-xs text-muted-foreground">Real-time workflow tracking</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Auto-refresh ON
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Auto-refresh OFF
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
                <Play className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{workflows.filter(w => w.status === 'active').length}</div>
                <p className="text-xs text-muted-foreground">Currently running</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{agents.filter(a => a.status === 'active').length}</div>
                <p className="text-xs text-muted-foreground">of {agents.length} total</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Progress</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {workflows.length > 0
                    ? Math.round(workflows.reduce((acc, w) => acc + w.progress, 0) / workflows.length)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">average completion</p>
              </CardContent>
            </Card>
          </div>

          {/* Agent Pool Status */}
          <Card>
            <CardHeader>
              <CardTitle>Agent Pool Status</CardTitle>
              <CardDescription>Monitor all available agents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {agents.map((agent) => (
                  <Card key={agent.id} className={agent.status === 'active' ? 'border-green-500' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getAgentStatusIcon(agent.status)}
                          <h3 className="font-semibold text-sm">{agent.name}</h3>
                        </div>
                        {getAgentStatusBadge(agent.status)}
                      </div>
                      {agent.currentTask ? (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          {agent.currentTask}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-2">No active task</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Last activity: {agent.lastActivity ? getTimeSince(agent.lastActivity) : 'N/A'}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Active Workflows */}
          <Card>
            <CardHeader>
              <CardTitle>Active Workflows</CardTitle>
              <CardDescription>Real-time workflow monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              {workflows.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No active workflows
                </div>
              ) : (
                <div className="space-y-4">
                  {workflows.map((workflow) => (
                    <Card key={workflow.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <Play className="h-4 w-4 text-green-500 animate-pulse" />
                              <h3 className="font-semibold">{workflow.title}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {workflow.phase} • {workflow.progress}% complete
                            </p>
                          </div>
                          <Badge variant="secondary">{workflow.agent}</Badge>
                        </div>

                        <div className="space-y-2 mb-3">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Started {getTimeSince(workflow.startedAt)}</span>
                            <span>Running for {Math.round((Date.now() - workflow.startedAt.getTime()) / 60000)} minutes</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all"
                              style={{ width: `${workflow.progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="bg-slate-950 text-slate-50 p-3 rounded-md">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-mono text-slate-400">Console Output</span>
                            <Link href={`/tasks/${workflow.id}`}>
                              <Button variant="ghost" size="sm" className="text-xs">
                                View Full
                              </Button>
                            </Link>
                          </div>
                          <ScrollArea className="h-[120px]">
                            <div className="font-mono text-xs space-y-1">
                              {workflow.consoleOutput.map((line, i) => (
                                <div key={i} className="whitespace-pre-wrap">{line}</div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>

                        <div className="flex space-x-2 mt-3">
                          <Button variant="outline" size="sm">
                            <Pause className="h-3 w-3 mr-1" />
                            Pause
                          </Button>
                          <Button variant="outline" size="sm">
                            <Terminal className="h-3 w-3 mr-1" />
                            Logs
                          </Button>
                          <Link href={`/tasks/${workflow.id}`}>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
