'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import {
  ArrowLeft,
  Edit,
  Share,
  Pause,
  Play,
  ChevronRight,
  CheckCircle2,
  ExternalLink,
  Terminal,
  FileCode,
  Settings,
  Loader2,
  Clock,
  Zap,
  Target,
  BookOpen,
  AlertCircle,
  RotateCw,
  Copy,
  Download,
} from 'lucide-react'
import Link from 'next/link'

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [task, setTask] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPausing, setIsPausing] = useState(false)
  const [isAdvancing, setIsAdvancing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setTimeout(() => {
      setTask({
        id: params.id,
        title: 'Implement user authentication',
        description: 'Add JWT-based authentication with token refresh mechanism',
        status: 'producing',
        currentPhase: 'produce',
        progress: 60,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        updatedAt: new Date(),
        assignedAgent: 'ce-hub-engineer',
        priority: 'high',
        tags: ['auth', 'security', 'backend'],
        prp: {
          problem: 'Users need secure login with JWT tokens that includes refresh mechanism and session management',
          requirements: [
            'JWT-based authentication with access tokens',
            'Token refresh mechanism with rotation',
            'Secure session management',
            'Password hashing with bcrypt',
            'httpOnly cookie storage for refresh tokens',
          ],
          plan: [
            'Setup and configure JWT library',
            'Create auth endpoints (/login, /refresh, /logout)',
            'Implement token generation and validation',
            'Add token refresh logic with rotation',
            'Create session management middleware',
            'Add security headers and CORS configuration',
          ],
        },
        phases: [
          {
            name: 'Planning',
            status: 'completed',
            startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
            completedAt: new Date(Date.now() - 1.9 * 60 * 60 * 1000),
            notes: 'PRP template completed, similar tasks found in Archon',
          },
          {
            name: 'Research',
            status: 'completed',
            startedAt: new Date(Date.now() - 1.9 * 60 * 60 * 1000),
            completedAt: new Date(Date.now() - 1.75 * 60 * 60 * 1000),
            notes: 'Found 3 similar auth implementations in Archon knowledge graph',
          },
          {
            name: 'Producing',
            status: 'in_progress',
            startedAt: new Date(Date.now() - 1.75 * 60 * 60 * 1000),
            notes: 'ce-hub-engineer is implementing auth endpoints',
            lastCheckpoint: new Date(Date.now() - 2 * 60 * 1000),
          },
          {
            name: 'Ingesting',
            status: 'pending',
            notes: 'Will auto-ingest patterns to Archon when production phase completes',
          },
        ],
        similarTasks: [
          {
            id: '101',
            title: 'JWT auth for API',
            completedAt: new Date('2024-12-15'),
            patterns: ['JWT setup', 'Token storage', 'Refresh logic', 'Password hashing'],
            similarity: 0.92,
          },
          {
            id: '102',
            title: 'OAuth2 integration',
            completedAt: new Date('2024-11-20'),
            patterns: ['OAuth2 flow', 'Social login', 'Token management', 'User session'],
            similarity: 0.85,
          },
          {
            id: '103',
            title: 'Session management',
            completedAt: new Date('2024-10-05'),
            patterns: ['Session storage', 'Cookie handling', 'Security middleware', 'Session timeout'],
            similarity: 0.78,
          },
        ],
        consoleOutput: [
          '> Created POST /auth/login',
          '> Added JWT token generation with 15min expiry',
          '> Implemented password hashing with bcrypt (salt rounds: 10)',
          '> Testing login endpoint...',
          '> ✓ Login endpoint working - returning access + refresh tokens',
          '> Creating refresh token endpoint...',
          '> Added token validation middleware',
          '> Implemented token rotation on refresh',
          '> Testing refresh flow...',
          '> ✓ Refresh working correctly with rotation',
        ],
      })
      setIsLoading(false)
    }, 300)
  }, [params.id])

  const handlePauseWorkflow = () => {
    setIsPausing(true)
    setTimeout(() => {
      setTask({ ...task, status: 'paused' })
      setIsPausing(false)
      toast({
        title: 'Workflow paused',
        description: 'The workflow has been paused. You can resume it later.',
      })
    }, 1000)
  }

  const handleAdvancePhase = () => {
    setIsAdvancing(true)
    setTimeout(() => {
      const nextPhaseIndex = task.phases.findIndex((p: any) => p.status === 'in_progress') + 1
      const updatedPhases = [...task.phases]
      if (updatedPhases[nextPhaseIndex]) {
        updatedPhases[nextPhaseIndex].status = 'in_progress'
        updatedPhases[nextPhaseIndex - 1].status = 'completed'
      }
      setTask({
        ...task,
        phases: updatedPhases,
        currentPhase: ['planning', 'research', 'produce', 'ingest'][nextPhaseIndex],
        progress: Math.min(100, task.progress + 25),
      })
      setIsAdvancing(false)
      toast({
        title: 'Phase advanced',
        description: `Moved to ${updatedPhases[nextPhaseIndex]?.name} phase`,
      })
    }, 1000)
  }

  const handleCopyPatterns = (patterns: string[]) => {
    navigator.clipboard.writeText(patterns.join(', '))
    toast({
      title: 'Patterns copied',
      description: 'Patterns have been copied to clipboard',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-emerald-400'
      case 'in_progress':
        return 'text-blue-400'
      case 'pending':
        return 'text-gray-500'
      default:
        return 'text-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5" />
      case 'in_progress':
        return <div className="h-5 w-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      case 'pending':
        return <Clock className="h-5 w-5" />
      default:
        return null
    }
  }

  const getPhaseNumber = (phaseName: string) => {
    const phases = ['Planning', 'Research', 'Producing', 'Ingesting']
    return phases.indexOf(phaseName) + 1
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-400 mx-auto" />
          <p className="text-muted-foreground">Loading task details...</p>
        </div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-semibold">Task not found</h2>
          <Link href="/">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-slate-950 to-purple-950/20" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="icon" className="glow-purple">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-bold">{task.title}</h1>
                  <Badge
                    className={
                      task.priority === 'urgent'
                        ? 'bg-red-500/20 text-red-400 border-red-500/30'
                        : task.priority === 'high'
                        ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                        : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                    }
                  >
                    {task.priority}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{task.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon">
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Share className="h-4 w-4" />
              </Button>
              <Link href={`/editor/${task.id}`}>
                <Button variant="outline" className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10">
                  <FileCode className="h-4 w-4 mr-2" />
                  Open in Editor
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Overview */}
            <Card className="glass-card gradient-border">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Status</p>
                      <p className="text-2xl font-bold mt-1 capitalize">
                        {task.status === 'producing' ? 'In Progress' : task.status}
                      </p>
                    </div>
                    <div className="h-16 w-16 rounded-full bg-blue-500/20 flex items-center justify-center">
                      {task.status === 'producing' ? (
                        <Zap className="h-8 w-8 text-blue-400 animate-pulse" />
                      ) : (
                        <Target className="h-8 w-8 text-blue-400" />
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Phase {getPhaseNumber(task.phases.find((p: any) => p.status === 'in_progress')?.name || '')} of 4
                      </span>
                      <span className="font-medium text-blue-400">{task.progress}% Complete</span>
                    </div>
                    <Progress value={task.progress} className="h-3" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {task.tags?.map((tag: string) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* PRP Overview */}
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-blue-400" />
                  <CardTitle>PRP Overview</CardTitle>
                </div>
                <CardDescription>Problem, Requirements, Plan</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="problem">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="problem">Problem</TabsTrigger>
                    <TabsTrigger value="requirements">Requirements</TabsTrigger>
                    <TabsTrigger value="plan">Plan</TabsTrigger>
                  </TabsList>

                  <TabsContent value="problem" className="mt-4">
                    <div className="prose prose-invert max-w-none">
                      <p className="text-muted-foreground">{task.prp.problem}</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="requirements" className="mt-4">
                    <ul className="space-y-3">
                      {task.prp.requirements.map((req: string, i: number) => (
                        <li key={i} className="flex items-start">
                          <CheckCircle2 className="h-5 w-5 mr-3 mt-0.5 text-emerald-400 flex-shrink-0" />
                          <span className="text-sm">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </TabsContent>

                  <TabsContent value="plan" className="mt-4">
                    <ol className="space-y-3">
                      {task.prp.plan.map((step: string, i: number) => (
                        <li key={i} className="flex items-start">
                          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 text-sm font-semibold flex items-center justify-center mr-3">
                            {i + 1}
                          </span>
                          <span className="text-sm pt-1">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Workflow Progress */}
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <RotateCw className="h-5 w-5 text-purple-400" />
                  <CardTitle>Workflow Progress</CardTitle>
                </div>
                <CardDescription>Track the PRP lifecycle</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {task.phases.map((phase: any, index: number) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className={`flex-shrink-0 ${getStatusColor(phase.status)} pt-1`}>
                        {getStatusIcon(phase.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4
                            className={`font-medium ${
                              phase.status === 'in_progress' ? 'text-blue-400' : ''
                            }`}
                          >
                            Phase {index + 1}: {phase.name}
                          </h4>
                          {phase.status === 'in_progress' && (
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                              Active
                            </Badge>
                          )}
                          {phase.status === 'completed' && (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                              Complete
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{phase.notes}</p>
                        {phase.startedAt && (
                          <p className="text-xs text-muted-foreground">
                            Started:{' '}
                            {phase.completedAt
                              ? `${Math.round((phase.completedAt.getTime() - phase.startedAt.getTime()) / 60000)}min`
                              : 'In progress'}
                          </p>
                        )}
                        {phase.lastCheckpoint && (
                          <p className="text-xs text-blue-400">
                            Last checkpoint: {Math.round((Date.now() - phase.lastCheckpoint.getTime()) / 60000)}{' '}
                            minutes ago
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Console Output */}
            {task.consoleOutput && task.consoleOutput.length > 0 && (
              <Card className="glass-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Terminal className="h-5 w-5 text-emerald-400" />
                      <CardTitle>Console Output</CardTitle>
                    </div>
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                      {task.consoleOutput.length} lines
                    </Badge>
                  </div>
                  <CardDescription>Real-time agent activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-950 rounded-lg p-4 border border-slate-800">
                    <ScrollArea className="h-[300px]">
                      <div className="font-mono text-sm space-y-1">
                        {task.consoleOutput.map((line: string, i: number) => (
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
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Workflow Controls */}
            <Card className="glass-card glow-purple">
              <CardHeader>
                <CardTitle className="text-lg">Workflow Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full glow"
                  onClick={handleAdvancePhase}
                  disabled={isAdvancing || task.currentPhase === 'ingest'}
                >
                  {isAdvancing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Advance Phase
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handlePauseWorkflow}
                  disabled={isPausing}
                >
                  {isPausing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Pause className="h-4 w-4 mr-2" />
                  )}
                  Pause Workflow
                </Button>
                <Button variant="outline" className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure
                </Button>
              </CardContent>
            </Card>

            {/* Agent Status */}
            {task.assignedAgent && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg">Active Agent</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Zap className="h-6 w-6 text-blue-400 animate-pulse" />
                    </div>
                    <div>
                      <p className="font-medium">{task.assignedAgent}</p>
                      <p className="text-sm text-muted-foreground">Working on task</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Similar Tasks */}
            {task.similarTasks && task.similarTasks.length > 0 && (
              <Card className="glass-card">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-purple-400" />
                    <CardTitle className="text-lg">Similar from Archon</CardTitle>
                  </div>
                  <CardDescription>Leverage existing patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {task.similarTasks.map((similar: any) => (
                      <div
                        key={similar.id}
                        className="p-3 rounded-lg border border-border/50 hover:border-purple-500/30 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm group-hover:text-purple-400 transition-colors">
                            {similar.title}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {Math.round(similar.similarity * 100)}%
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          Completed {similar.completedAt.toLocaleDateString()}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {similar.patterns.slice(0, 2).map((pattern: string) => (
                            <Badge key={pattern} variant="secondary" className="text-xs">
                              {pattern}
                            </Badge>
                          ))}
                          {similar.patterns.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{similar.patterns.length - 2}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleCopyPatterns(similar.patterns)}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy Patterns
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 text-xs">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Export PRP
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate Task
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View in Archon
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
