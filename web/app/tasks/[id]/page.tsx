'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Edit, Share, Pause, Play, ChevronRight, CheckCircle2, ExternalLink, Terminal, FileCode } from 'lucide-react'
import Link from 'next/link'

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [task, setTask] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading task
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
        prp: {
          problem: 'Users need secure login with JWT tokens that includes refresh mechanism',
          requirements: [
            'JWT-based authentication',
            'Token refresh mechanism',
            'Session management',
            'Secure password hashing'
          ],
          plan: [
            'Setup JWT library',
            'Create auth endpoints (/login, /refresh)',
            'Implement token refresh logic',
            'Add session management middleware'
          ]
        },
        phases: [
          { name: 'Planning', status: 'completed', startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), completedAt: new Date(Date.now() - 1.9 * 60 * 60 * 1000), notes: 'PRP template completed, similar tasks found' },
          { name: 'Research', status: 'completed', startedAt: new Date(Date.now() - 1.9 * 60 * 60 * 1000), completedAt: new Date(Date.now() - 1.75 * 60 * 60 * 1000), notes: 'Found 3 similar auth implementations in Archon' },
          { name: 'Producing', status: 'in_progress', startedAt: new Date(Date.now() - 1.75 * 60 * 60 * 1000), notes: 'ce-hub-engineer implementing auth endpoints', lastCheckpoint: new Date(Date.now() - 2 * 60 * 1000) },
          { name: 'Ingesting', status: 'pending', notes: 'Will auto-ingest patterns to Archon when complete' }
        ],
        similarTasks: [
          { id: '101', title: 'JWT auth for API', completedAt: new Date('2024-12-15'), patterns: ['JWT setup', 'Token storage', 'Refresh logic'] },
          { id: '102', title: 'OAuth2 integration', completedAt: new Date('2024-11-20'), patterns: ['OAuth2 flow', 'Social login', 'Token management'] }
        ],
        consoleOutput: [
          '> Created POST /auth/login',
          '> Added JWT token generation',
          '> Implemented password hashing with bcrypt',
          '> Testing endpoint...',
          '> ✓ Login endpoint working',
          '> Creating refresh token endpoint...'
        ]
      })
      setIsLoading(false)
    }, 300)
  }, [params.id])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Task not found</h2>
          <Link href="/">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500'
      case 'in_progress': return 'text-blue-500'
      case 'pending': return 'text-gray-400'
      default: return 'text-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4" />
      case 'in_progress': return <div className="h-4 w-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      case 'pending': return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-semibold">Task Detail</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Share className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-6">
          {/* Title Section */}
          <div>
            <h2 className="text-2xl font-bold mb-2">{task.title}</h2>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
              </Badge>
              <span>Phase {task.phases.findIndex((p: any) => p.status === 'in_progress') + 1} of 4</span>
              <span>{task.progress}% complete</span>
            </div>
            <Progress value={task.progress} className="mt-4 h-2" />
          </div>

          {/* PRP Overview */}
          <Card>
            <CardHeader>
              <CardTitle>PRP Overview</CardTitle>
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
                  <div className="prose prose-sm dark:prose-invert">
                    <p>{task.prp.problem}</p>
                  </div>
                </TabsContent>

                <TabsContent value="requirements" className="mt-4">
                  <ul className="space-y-2">
                    {task.prp.requirements.map((req: string, i: number) => (
                      <li key={i} className="flex items-start">
                        <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </TabsContent>

                <TabsContent value="plan" className="mt-4">
                  <ol className="space-y-2">
                    {task.prp.plan.map((step: string, i: number) => (
                      <li key={i} className="flex items-start">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center mr-2">
                          {i + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Workflow Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Workflow Progress</CardTitle>
              <CardDescription>Track the PRP lifecycle</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {task.phases.map((phase: any, index: number) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className={`flex-shrink-0 ${getStatusColor(phase.status)}`}>
                      {getStatusIcon(phase.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={`font-medium ${phase.status === 'in_progress' ? 'text-blue-500' : ''}`}>
                          Phase {index + 1}: {phase.name}
                        </h4>
                        {phase.status === 'in_progress' && (
                          <Badge variant="secondary">Active</Badge>
                        )}
                        {phase.status === 'completed' && (
                          <Badge variant="default">Complete</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{phase.notes}</p>
                      {phase.lastCheckpoint && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Last checkpoint: {Math.round((Date.now() - phase.lastCheckpoint.getTime()) / 60000)} minutes ago
                        </p>
                      )}
                      {phase.status === 'in_progress' && task.assignedAgent && (
                        <div className="mt-2 flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Terminal className="h-3 w-3 mr-1" />
                            View Console
                          </Button>
                          <Button variant="outline" size="sm">
                            <FileCode className="h-3 w-3 mr-1" />
                            View Code
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Console Output */}
          {task.consoleOutput && task.consoleOutput.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Console Output</CardTitle>
                <CardDescription>Real-time agent activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-950 text-slate-50 p-4 rounded-md font-mono text-sm">
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-1">
                      {task.consoleOutput.map((line: string, i: number) => (
                        <div key={i} className="whitespace-pre-wrap">{line}</div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Similar Tasks */}
          {task.similarTasks && task.similarTasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Similar Tasks from Archon</CardTitle>
                <CardDescription>Leverage existing patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {task.similarTasks.map((similar: any) => (
                    <div key={similar.id} className="flex items-start justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex-1">
                        <h4 className="font-medium flex items-center">
                          {similar.title}
                          <ExternalLink className="h-3 w-3 ml-2 text-muted-foreground" />
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Completed {similar.completedAt.toLocaleDateString()}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {similar.patterns.map((pattern: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {pattern}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        View patterns
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button variant="outline">
              <Pause className="h-4 w-4 mr-2" />
              Pause Workflow
            </Button>
            <Button>
              <Play className="h-4 w-4 mr-2" />
              Advance to Next Phase
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
