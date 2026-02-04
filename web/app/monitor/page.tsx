'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/components/ui/use-toast'
import {
  RefreshCw,
  Pause,
  Play,
  Terminal,
  User,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  Activity,
  Settings,
  MoreVertical,
} from 'lucide-react'
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
  const { toast } = useToast()

  useEffect(() => {
    loadData()

    if (autoRefresh) {
      const interval = setInterval(() => {
        loadData()
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const loadData = () => {
    setAgents([
      {
        id: 'ce-hub-engineer',
        name: 'CE-Hub Engineer',
        status: 'active',
        currentTask: 'Implement user authentication',
        lastActivity: new Date(),
      },
      {
        id: 'research-intelligence-specialist',
        name: 'Research Intelligence Specialist',
        status: 'active',
        currentTask: 'Vector database options',
        lastActivity: new Date(Date.now() - 2 * 60 * 1000),
      },
      {
        id: 'qa-tester',
        name: 'QA Tester',
        status: 'idle',
        lastActivity: new Date(Date.now() - 30 * 60 * 1000),
      },
      {
        id: 'documentation-specialist',
        name: 'Documentation Specialist',
        status: 'idle',
        lastActivity: new Date(Date.now() - 60 * 60 * 1000),
      },
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
          '> Added token validation',
          '> Testing refresh...',
          '> ✓ Refresh flow working',
        ],
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
          '> Searching vector database docs...',
          '> Found PineDB documentation',
          '> Analyzing Weaviate features...',
          '> Comparing performance benchmarks...',
          '> Found 7 relevant sources',
          '> Extracting key features...',
        ],
      },
    ])
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      loadData()
      setIsRefreshing(false)
      toast({
        title: 'Refreshed',
        description: 'Agent status has been updated',
      })
    }, 500)
  }

  const handlePauseWorkflow = (workflowId: string) => {
    toast({
      title: 'Workflow paused',
      description: 'The workflow has been paused',
    })
  }

  const getAgentStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            Active
          </Badge>
        )
      case 'error':
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Error</Badge>
        )
      case 'idle':
      default:
        return (
          <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Idle</Badge>
        )
    }
  }

  const getAgentStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />
      case 'idle':
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
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
    <div className="min-h-screen bg-background">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950/20 via-slate-950 to-blue-950/20" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="icon" className="glow-purple">
                  <Terminal className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold">Agent Monitor</h1>
                <p className="text-xs text-muted-foreground">Real-time workflow tracking</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={autoRefresh ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={autoRefresh ? 'glow' : ''}
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
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="glass-card gradient-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Workflows</p>
                    <p className="text-3xl font-bold mt-1 text-blue-400">
                      {workflows.filter((w) => w.status === 'active').length}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Play className="h-6 w-6 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card gradient-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Agents</p>
                    <p className="text-3xl font-bold mt-1 text-emerald-400">
                      {agents.filter((a) => a.status === 'active').length}
                    </p>
                    <p className="text-xs text-muted-foreground">of {agents.length} total</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <User className="h-6 w-6 text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card gradient-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Progress</p>
                    <p className="text-3xl font-bold mt-1">
                      {workflows.length > 0
                        ? Math.round(
                            workflows.reduce((acc, w) => acc + w.progress, 0) / workflows.length
                          )
                        : 0}
                      %
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Activity className="h-6 w-6 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Agent Pool Status */}
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-blue-400" />
                <CardTitle>Agent Pool Status</CardTitle>
              </div>
              <CardDescription>Monitor all available agents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {agents.map((agent) => (
                  <Card
                    key={agent.id}
                    className={`${
                      agent.status === 'active'
                        ? 'border-emerald-500/30 bg-emerald-500/5'
                        : 'border-border/50'
                    } transition-all`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
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
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-purple-400" />
                <CardTitle>Active Workflows</CardTitle>
              </div>
              <CardDescription>Real-time workflow monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              {workflows.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-border rounded-lg">
                  <Terminal className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No active workflows</h3>
                  <p className="text-sm text-muted-foreground">Workflows will appear here when agents are working</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {workflows.map((workflow) => (
                    <Card
                      key={workflow.id}
                      className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <Play className="h-4 w-4 text-emerald-400" />
                              <h3 className="font-semibold">{workflow.title}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {workflow.phase} • {workflow.progress}% complete
                            </p>
                          </div>
                          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                            {workflow.agent}
                          </Badge>
                        </div>

                        <div className="space-y-2 mb-3">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Started {getTimeSince(workflow.startedAt)}</span>
                            <span>
                              Running for{' '}
                              {Math.round((Date.now() - workflow.startedAt.getTime()) / 60000)} minutes
                            </span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                              style={{ width: `${workflow.progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-mono text-slate-400">Console Output</span>
                            <Link href={`/tasks/${workflow.id}`}>
                              <Button variant="ghost" size="sm" className="text-xs h-6">
                                View Full
                              </Button>
                            </Link>
                          </div>
                          <ScrollArea className="h-[120px]">
                            <div className="font-mono text-xs space-y-1">
                              {workflow.consoleOutput.map((line, i) => (
                                <div
                                  key={i}
                                  className={
                                    line.includes('✓')
                                      ? 'text-emerald-400'
                                      : line.includes('>')
                                      ? 'text-blue-400'
                                      : 'text-slate-300'
                                  }
                                >
                                  {line}
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePauseWorkflow(workflow.id)}
                          >
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
