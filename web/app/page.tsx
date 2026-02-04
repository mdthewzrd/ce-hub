'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { useWorkflowStore } from '@/lib/state'
import { useToast } from '@/components/ui/use-toast'
import {
  Plus,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  RotateCw,
  BookOpen,
  Activity,
  Search,
  Filter,
  MoreVertical,
  TrendingUp,
  Zap,
  Target,
  Calendar,
  ArrowUpRight,
  Pause,
  Play,
  Archive,
  Trash2,
  Copy,
  ExternalLink,
} from 'lucide-react'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function DashboardPage() {
  const { tasks, setTasks } = useWorkflowStore()
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    setTimeout(() => {
      const mockTasks = [
        {
          id: '1',
          title: 'Implement user authentication',
          description: 'Add JWT-based authentication with token refresh',
          status: 'producing',
          currentPhase: 'produce',
          progress: 60,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          updatedAt: new Date(),
          assignedAgent: 'ce-hub-engineer',
          priority: 'high',
          tags: ['auth', 'security', 'backend'],
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
          priority: 'urgent',
          tags: ['bug', 'payments', 'urgent'],
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
          priority: 'medium',
          tags: ['auth', 'oauth', 'feature'],
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
          assignedAgent: 'research-intelligence-specialist',
          priority: 'low',
          tags: ['research', 'database', 'ai'],
        },
        {
          id: '5',
          title: 'Optimize database queries',
          description: 'Improve query performance for large datasets',
          status: 'planning',
          currentPhase: 'planning',
          progress: 5,
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
          updatedAt: new Date(),
          priority: 'medium',
          tags: ['performance', 'database'],
        },
        {
          id: '6',
          title: 'Add real-time notifications',
          description: 'Implement WebSocket-based notifications',
          status: 'producing',
          currentPhase: 'produce',
          progress: 45,
          createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
          updatedAt: new Date(),
          assignedAgent: 'ce-hub-engineer',
          priority: 'high',
          tags: ['feature', 'websocket', 'realtime'],
        },
      ]
      setTasks(mockTasks)
      setIsLoading(false)
    }, 500)
  }, [setTasks])

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.tags?.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesStatus = statusFilter === 'all' || task.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />
      case 'producing':
      case 'researching':
        return <RotateCw className="h-4 w-4 text-blue-400 animate-spin" />
      case 'planning':
        return <Clock className="h-4 w-4 text-amber-400" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-400" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      completed: 'default',
      producing: 'secondary',
      researching: 'secondary',
      planning: 'outline',
      failed: 'destructive',
      pending: 'outline',
    }
    const labels: Record<string, string> = {
      completed: 'Completed',
      producing: 'In Progress',
      researching: 'Researching',
      planning: 'Planning',
      failed: 'Failed',
      pending: 'Pending',
    }
    return (
      <Badge
        variant={variants[status] || 'outline'}
        className="capitalize"
      >
        {labels[status] || status}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: 'bg-red-500/20 text-red-400 border-red-500/30',
      high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      medium: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      low: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    }
    return (
      <Badge className={colors[priority] || colors.medium} variant="outline">
        {priority}
      </Badge>
    )
  }

  const getPhaseLabel = (phase: string) => {
    const labels: Record<string, string> = {
      planning: 'Phase 1: Planning',
      research: 'Phase 2: Research',
      produce: 'Phase 3: Producing',
      ingest: 'Phase 4: Ingesting',
    }
    return labels[phase] || phase
  }

  const handleDuplicateTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId)
    if (task) {
      const newTask = {
        ...task,
        id: Date.now().toString(),
        title: `${task.title} (Copy)`,
        status: 'pending' as const,
        progress: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      setTasks([...tasks, newTask])
      toast({
        title: 'Task duplicated',
        description: 'Task has been duplicated successfully.',
      })
    }
  }

  const handleArchiveTask = (taskId: string) => {
    setTasks(tasks.filter((t) => t.id !== taskId))
    toast({
      title: 'Task archived',
      description: 'Task has been archived.',
    })
  }

  const handleDeleteTask = () => {
    if (taskToDelete) {
      setTasks(tasks.filter((t) => t.id !== taskToDelete))
      setDeleteDialogOpen(false)
      setTaskToDelete(null)
      toast({
        title: 'Task deleted',
        description: 'Task has been permanently deleted.',
        variant: 'destructive',
      })
    }
  }

  const activeTasks = filteredTasks.filter((t) => !['completed', 'failed'].includes(t.status))
  const completedTasks = filteredTasks.filter((t) => t.status === 'completed')

  const stats = {
    total: tasks.length,
    active: activeTasks.length,
    inProgress: tasks.filter((t) => ['producing', 'researching'].includes(t.status)).length,
    completed: completedTasks.length,
    avgProgress: tasks.length > 0
      ? Math.round(tasks.reduce((acc, t) => acc + t.progress, 0) / tasks.length)
      : 0,
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Animated Background Gradient */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-slate-950 to-purple-950/20" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
                <Activity className="h-8 w-8 text-blue-400 relative" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  CE-Hub
                </h1>
                <p className="text-xs text-muted-foreground">AI Development Workflow</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Link href="/monitor">
                <Button variant="ghost" size="icon" className="relative">
                  <Activity className="h-5 w-5" />
                  {stats.inProgress > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-blue-500 rounded-full text-[10px] flex items-center justify-center">
                      {stats.inProgress}
                    </span>
                  )}
                </Button>
              </Link>
              <Button variant="ghost" size="icon">
                <BookOpen className="h-5 w-5" />
              </Button>
              <Link href="/new">
                <Button className="glow">
                  <Plus className="h-4 w-4 mr-2" />
                  New Task
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-400 mx-auto" />
              <p className="text-muted-foreground">Loading your workspace...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card className="glass-card gradient-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Tasks</p>
                      <p className="text-3xl font-bold mt-1">{stats.total}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Target className="h-6 w-6 text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card gradient-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active</p>
                      <p className="text-3xl font-bold mt-1 text-blue-400">{stats.active}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Zap className="h-6 w-6 text-emerald-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card gradient-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">In Progress</p>
                      <p className="text-3xl font-bold mt-1 text-amber-400">{stats.inProgress}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <RotateCw className="h-6 w-6 text-amber-400 animate-spin-slow" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card gradient-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Completed</p>
                      <p className="text-3xl font-bold mt-1 text-emerald-400">{stats.completed}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card gradient-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Progress</p>
                      <p className="text-3xl font-bold mt-1">{stats.avgProgress}%</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filter Bar */}
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tasks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-background/50"
                    />
                  </div>
                  <div className="flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="bg-background/50">
                          <Filter className="h-4 w-4 mr-2" />
                          {statusFilter === 'all'
                            ? 'All Status'
                            : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                          All Status
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setStatusFilter('planning')}>
                          Planning
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusFilter('researching')}>
                          Researching
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusFilter('producing')}>
                          Producing
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusFilter('completed')}>
                          Completed
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tasks List */}
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Your Tasks</CardTitle>
                    <CardDescription>
                      Manage and track your AI development workflows
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="active">
                  <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="active">
                      Active ({activeTasks.length})
                    </TabsTrigger>
                    <TabsTrigger value="completed">
                      Completed ({completedTasks.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="active" className="mt-6">
                    <ScrollArea className="h-[600px] pr-4">
                      <div className="space-y-4">
                        {activeTasks.length === 0 ? (
                          <div className="text-center py-16 border-2 border-dashed border-border rounded-lg">
                            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                              <Target className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No active tasks</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                              Create a new task to get started with your AI development workflow.
                            </p>
                            <Link href="/new">
                              <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Create Task
                              </Button>
                            </Link>
                          </div>
                        ) : (
                          activeTasks.map((task) => (
                            <Card
                              key={task.id}
                              className="group hover:glow transition-all duration-300 cursor-pointer border-border/50 hover:border-blue-500/50"
                            >
                              <CardContent className="p-6">
                                <div className="flex items-start justify-between gap-4">
                                  <Link href={`/tasks/${task.id}`} className="flex-1">
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex items-center space-x-3">
                                        {getStatusIcon(task.status)}
                                        <div>
                                          <h3 className="font-semibold text-lg group-hover:text-blue-400 transition-colors">
                                            {task.title}
                                          </h3>
                                          {task.description && (
                                            <p className="text-sm text-muted-foreground mt-1">
                                              {task.description}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mb-4">
                                      {getStatusBadge(task.status)}
                                      {task.priority && getPriorityBadge(task.priority)}
                                      {task.tags?.map((tag: string) => (
                                        <Badge key={tag} variant="outline" className="text-xs">
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>

                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">
                                          {getPhaseLabel(task.currentPhase)}
                                        </span>
                                        <span className="font-medium">{task.progress}%</span>
                                      </div>
                                      <Progress value={task.progress} className="h-2" />
                                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <div className="flex items-center space-x-1">
                                          <Calendar className="h-3 w-3" />
                                          <span>
                                            Added {Math.round((Date.now() - task.createdAt.getTime()) / (1000 * 60 * 60))}h ago
                                          </span>
                                        </div>
                                        {task.assignedAgent && (
                                          <div className="flex items-center space-x-1">
                                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-blue-400">{task.assignedAgent}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </Link>

                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuGroup>
                                        <DropdownMenuItem onClick={() => handleDuplicateTask(task.id)}>
                                          <Copy className="h-4 w-4 mr-2" />
                                          Duplicate
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                          <Pause className="h-4 w-4 mr-2" />
                                          Pause
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                          <Archive className="h-4 w-4 mr-2" />
                                          Archive
                                        </DropdownMenuItem>
                                      </DropdownMenuGroup>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="text-red-400"
                                        onClick={() => {
                                          setTaskToDelete(task.id)
                                          setDeleteDialogOpen(true)
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="completed" className="mt-6">
                    <ScrollArea className="h-[600px] pr-4">
                      <div className="space-y-4">
                        {completedTasks.length === 0 ? (
                          <div className="text-center py-16 border-2 border-dashed border-border rounded-lg">
                            <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No completed tasks</h3>
                            <p className="text-sm text-muted-foreground">
                              Completed tasks will appear here.
                            </p>
                          </div>
                        ) : (
                          completedTasks.map((task) => (
                            <Card
                              key={task.id}
                              className="group hover:border-emerald-500/30 transition-all duration-300"
                            >
                              <CardContent className="p-6">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-3">
                                      {getStatusIcon(task.status)}
                                      <div>
                                        <h3 className="font-semibold text-lg">{task.title}</h3>
                                        {task.description && (
                                          <p className="text-sm text-muted-foreground mt-1">
                                            {task.description}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                      {getStatusBadge(task.status)}
                                      {task.priority && getPriorityBadge(task.priority)}
                                      {task.tags?.map((tag: string) => (
                                        <Badge key={tag} variant="outline" className="text-xs">
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      Finished {Math.round((Date.now() - task.updatedAt.getTime()) / (1000 * 60 * 60))}h ago
                                    </div>
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleDuplicateTask(task.id)}>
                                        <Copy className="h-4 w-4 mr-2" />
                                        Duplicate
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        View Details
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="text-red-400"
                                        onClick={() => {
                                          setTaskToDelete(task.id)
                                          setDeleteDialogOpen(true)
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task and all associated
              data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTask} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
