'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useWorkflowStore } from '@/lib/state'
import { Plus, Loader2, CheckCircle2, Clock, AlertCircle, RotateCw, BookOpen, Activity } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { tasks, setTasks } = useWorkflowStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading tasks
    setTimeout(() => {
      setTasks([
        {
          id: '1',
          title: 'Implement user authentication',
          description: 'Add JWT-based authentication with token refresh',
          status: 'producing',
          currentPhase: 'produce',
          progress: 60,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          updatedAt: new Date(),
          assignedAgent: 'ce-hub-engineer'
        },
        {
          id: '2',
          title: 'Fix payment processing bug',
          description: 'Investigate and fix the payment gateway integration issue',
          status: 'planning',
          currentPhase: 'planning',
          progress: 10,
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
        {
          id: '3',
          title: 'Add OAuth2 login',
          description: 'Integrate OAuth2 providers for social login',
          status: 'completed',
          currentPhase: 'ingest',
          progress: 100,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        },
        {
          id: '4',
          title: 'Research: Vector database options',
          description: 'Compare and recommend vector database for embeddings',
          status: 'researching',
          currentPhase: 'research',
          progress: 35,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
          assignedAgent: 'research-intelligence-specialist'
        }
      ])
      setIsLoading(false)
    }, 500)
  }, [setTasks])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'producing':
      case 'researching':
        return <RotateCw className="h-4 w-4 text-blue-500 animate-spin" />
      case 'planning':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      completed: 'default',
      producing: 'secondary',
      researching: 'secondary',
      planning: 'outline',
      failed: 'destructive',
      pending: 'outline'
    }
    const labels: Record<string, string> = {
      completed: 'Completed',
      producing: 'In Progress',
      researching: 'Researching',
      planning: 'Planning',
      failed: 'Failed',
      pending: 'Pending'
    }
    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    )
  }

  const getPhaseLabel = (phase: string) => {
    const labels: Record<string, string> = {
      planning: 'Phase 1: Planning',
      research: 'Phase 2: Research',
      produce: 'Phase 3: Producing',
      ingest: 'Phase 4: Ingesting'
    }
    return labels[phase] || phase
  }

  const activeTasks = tasks.filter(t => !['completed', 'failed'].includes(t.status))
  const completedTasks = tasks.filter(t => t.status === 'completed')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-6 w-6" />
            <h1 className="text-xl font-bold">CE-Hub</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Link href="/monitor">
              <Button variant="ghost" size="icon">
                <Activity className="h-5 w-5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon">
              <BookOpen className="h-5 w-5" />
            </Button>
            <Link href="/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
                  <RotateCw className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeTasks.length}</div>
                  <p className="text-xs text-muted-foreground">Currently in progress</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {tasks.filter(t => ['producing', 'researching'].includes(t.status)).length}
                  </div>
                  <p className="text-xs text-muted-foreground">Agents working</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{completedTasks.length}</div>
                  <p className="text-xs text-muted-foreground">All phases complete</p>
                </CardContent>
              </Card>
            </div>

            {/* Tasks List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Your Tasks</CardTitle>
                    <CardDescription>Track your AI development workflows</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="active">
                  <TabsList>
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                  </TabsList>

                  <TabsContent value="active" className="mt-4">
                    <ScrollArea className="h-[500px]">
                      <div className="space-y-3">
                        {activeTasks.length === 0 ? (
                          <div className="text-center py-12 text-muted-foreground">
                            No active tasks. Create a new task to get started.
                          </div>
                        ) : (
                          activeTasks.map((task) => (
                            <Link key={task.id} href={`/tasks/${task.id}`}>
                              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                      {getStatusIcon(task.status)}
                                      <h3 className="font-semibold">{task.title}</h3>
                                    </div>
                                    {getStatusBadge(task.status)}
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                      <span>{getPhaseLabel(task.currentPhase)}</span>
                                      <span>{task.progress}%</span>
                                    </div>
                                    <Progress value={task.progress} className="h-2" />
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                      <span>Added {Math.round((Date.now() - task.createdAt.getTime()) / (1000 * 60 * 60))} hours ago</span>
                                      {task.assignedAgent && (
                                        <span className="text-blue-500">{task.assignedAgent} working</span>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </Link>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="completed" className="mt-4">
                    <ScrollArea className="h-[500px]">
                      <div className="space-y-3">
                        {completedTasks.length === 0 ? (
                          <div className="text-center py-12 text-muted-foreground">
                            No completed tasks yet.
                          </div>
                        ) : (
                          completedTasks.map((task) => (
                            <Card key={task.id}>
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center space-x-2">
                                    {getStatusIcon(task.status)}
                                    <h3 className="font-semibold">{task.title}</h3>
                                  </div>
                                  {getStatusBadge(task.status)}
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                                <div className="text-xs text-muted-foreground">
                                  Finished {Math.round((Date.now() - task.updatedAt.getTime()) / (1000 * 60 * 60))} hours ago
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
