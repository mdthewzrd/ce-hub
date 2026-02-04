'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, ArrowRight, Search, Sparkles, CheckCircle2, Loader2, BookOpen, Zap } from 'lucide-react'
import Link from 'next/link'

type Step = 1 | 2 | 3 | 4

interface SimilarTask {
  id: string
  title: string
  completedAt: Date
  patterns: string[]
  similarity: number
}

export default function NewTaskPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
  const [isSearching, setIsSearching] = useState(false)
  const [similarTasks, setSimilarTasks] = useState<SimilarTask[]>([])
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>([])
  const [autoAdvance, setAutoAdvance] = useState(true)
  const [autoIngest, setAutoIngest] = useState(true)
  const { toast } = useToast()

  const steps = [
    { number: 1, title: 'Describe', description: 'What do you want to build?' },
    { number: 2, title: 'Discover', description: 'Find similar patterns' },
    { number: 3, title: 'Refine', description: 'Review & customize' },
    { number: 4, title: 'Create', description: 'Start workflow' },
  ]

  const handleSearch = async () => {
    if (!taskTitle.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter a task title to search',
        variant: 'destructive',
      })
      return
    }

    setIsSearching(true)
    setTimeout(() => {
      setSimilarTasks([
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
      ])
      setIsSearching(false)
    }, 1500)
  }

  const handleCreateTask = () => {
    toast({
      title: 'Task created',
      description: 'Your task has been created and the workflow is starting',
    })
    setTimeout(() => {
      router.push('/tasks/1')
    }, 500)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'high':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'medium':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'low':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
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
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="glow-purple">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-semibold">Create New Task</h1>
              <p className="text-xs text-muted-foreground">4-step guided workflow</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center w-full">
                  <div
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all
                      ${currentStep === step.number
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/30 scale-110'
                        : currentStep > step.number
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-800 text-slate-400'
                      }
                    `}
                  >
                    {currentStep > step.number ? <CheckCircle2 className="h-6 w-6" /> : step.number}
                  </div>
                  <div className="text-center mt-2">
                    <div className="font-medium text-sm">{step.title}</div>
                    <div className="text-xs text-muted-foreground hidden sm:block">{step.description}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`
                      h-0.5 flex-1 mx-2 transition-colors
                      ${currentStep > step.number ? 'bg-emerald-500' : 'bg-slate-800'}
                    `}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="glass-card gradient-border">
          <CardContent className="p-8">
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="h-8 w-8 text-blue-400" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">What do you want to build?</h2>
                  <p className="text-muted-foreground">
                    Be specific. &quot;Add login&quot; is vague. &quot;Add JWT auth with token refresh&quot; is clear.
                  </p>
                </div>

                <div className="space-y-5">
                  <div>
                    <Label htmlFor="title" className="text-base">Task Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Implement user authentication"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      className="mt-2 h-12 bg-background/50 text-base"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-base">Description</Label>
                    <textarea
                      id="description"
                      placeholder="Add more details about what you want to accomplish..."
                      value={taskDescription}
                      onChange={(e) => setTaskDescription(e.target.value)}
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-2"
                    />
                  </div>

                  <div>
                    <Label className="text-base">Priority</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(['urgent', 'high', 'medium', 'low'] as const).map((priority) => (
                        <button
                          key={priority}
                          onClick={() => setTaskPriority(priority)}
                          className={`
                            px-4 py-2 rounded-lg capitalize transition-all
                            ${taskPriority === priority
                              ? getPriorityColor(priority) + ' ring-2 ring-offset-2 ring-offset-background'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }
                          `}
                        >
                          {priority}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Sparkles className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-400">Pro tip</p>
                        <p className="text-blue-300/70 mt-1">
                          The more specific you are, the better Archon can find relevant patterns from your past work.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="h-16 w-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-purple-400" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Searching Archon for similar tasks...</h2>
                  <p className="text-muted-foreground">
                    Found {similarTasks.length} similar tasks from your past work
                  </p>
                </div>

                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-3">
                    {similarTasks.map((task) => (
                      <Card
                        key={task.id}
                        className="group hover:shadow-lg hover:shadow-purple-500/10 transition-all cursor-pointer border-border/50 hover:border-purple-500/30"
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-base group-hover:text-purple-400 transition-colors">
                                {task.title}
                              </CardTitle>
                              <CardDescription className="mt-1">
                                Completed {task.completedAt.toLocaleDateString()}
                              </CardDescription>
                            </div>
                            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                              {Math.round(task.similarity * 100)}% match
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex flex-wrap gap-2">
                            {task.patterns.map((pattern) => (
                              <Badge
                                key={pattern}
                                variant={selectedPatterns.includes(pattern) ? 'default' : 'secondary'}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => {
                                  setSelectedPatterns((prev) =>
                                    prev.includes(pattern)
                                      ? prev.filter((p) => p !== pattern)
                                      : [...prev, pattern]
                                  )
                                }}
                              >
                                {selectedPatterns.includes(pattern) && <CheckCircle2 className="h-3 w-3 mr-1" />}
                                {pattern}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>

                {selectedPatterns.length > 0 && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-emerald-400">
                          {selectedPatterns.length} pattern{selectedPatterns.length > 1 ? 's' : ''} selected
                        </p>
                        <p className="text-emerald-300/70 mt-1">
                          These patterns will be pre-loaded into your task for faster implementation.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="h-16 w-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="h-8 w-8 text-blue-400" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Review & customize</h2>
                  <p className="text-muted-foreground">Review your task before starting the workflow</p>
                </div>

                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{taskTitle || 'Untitled Task'}</CardTitle>
                      <Badge className={getPriorityColor(taskPriority)}>{taskPriority}</Badge>
                    </div>
                    <CardDescription>{taskDescription || 'No description provided'}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedPatterns.length > 0 && (
                      <div>
                        <Label>Selected Patterns ({selectedPatterns.length})</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedPatterns.map((pattern) => (
                            <Badge key={pattern} variant="secondary" className="text-xs">
                              {pattern}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <Label>Workflow Settings</Label>
                      <div className="space-y-2 mt-2">
                        <div
                          className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
                          onClick={() => setAutoAdvance(!autoAdvance)}
                        >
                          <span className="text-sm">Auto-advance phases</span>
                          <div
                            className={`w-12 h-6 rounded-full transition-colors ${
                              autoAdvance ? 'bg-blue-500' : 'bg-slate-700'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                                autoAdvance ? 'translate-x-6' : 'translate-x-0.5'
                              }`}
                            />
                          </div>
                        </div>
                        <div
                          className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
                          onClick={() => setAutoIngest(!autoIngest)}
                        >
                          <span className="text-sm">Auto-ingest patterns to Archon</span>
                          <div
                            className={`w-12 h-6 rounded-full transition-colors ${
                              autoIngest ? 'bg-blue-500' : 'bg-slate-700'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                                autoIngest ? 'translate-x-6' : 'translate-x-0.5'
                              }`}
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                          <span className="text-sm">Real-time monitoring</span>
                          <div className="w-12 h-6 rounded-full bg-blue-500">
                            <div className="w-5 h-5 rounded-full bg-white translate-x-6" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center space-y-4">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-r from-emerald-500/20 to-blue-500/20 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Ready to create!</h2>
                    <p className="text-muted-foreground">
                      Review the summary below and click to start your workflow
                    </p>
                  </div>
                </div>

                <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-2 border-b border-slate-700">
                        <span className="text-muted-foreground">Title</span>
                        <span className="font-medium">{taskTitle}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-slate-700">
                        <span className="text-muted-foreground">Priority</span>
                        <Badge className={getPriorityColor(taskPriority)}>{taskPriority}</Badge>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-slate-700">
                        <span className="text-muted-foreground">Patterns</span>
                        <span className="font-medium">{selectedPatterns.length} selected</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-slate-700">
                        <span className="text-muted-foreground">Starting phase</span>
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Planning</Badge>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-muted-foreground">Auto-advance</span>
                        <span className="font-medium">{autoAdvance ? 'Enabled' : 'Disabled'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex items-start space-x-3">
                  <Zap className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-400">What happens next?</p>
                    <p className="text-blue-300/70 mt-1">
                      Your task will enter the Planning phase. An agent will help create a detailed PRP (Problem,
                      Requirements, Plan) based on your description and any selected patterns.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1) as Step)}
            disabled={currentStep === 1}
            className="glow-purple"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {currentStep === 1 && (
            <Button size="lg" onClick={() => { handleSearch(); setCurrentStep(2); }} disabled={!taskTitle.trim()} className="glow">
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  Search Archon
                  <Search className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          )}

          {currentStep === 2 && (
            <Button size="lg" onClick={() => setCurrentStep(3)} className="glow">
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}

          {currentStep === 3 && (
            <Button size="lg" onClick={() => setCurrentStep(4)} className="glow">
              Review
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}

          {currentStep === 4 && (
            <Button size="lg" onClick={handleCreateTask} className="glow">
              <Sparkles className="h-4 w-4 mr-2" />
              Create Task & Start Workflow
            </Button>
          )}
        </div>
      </main>
    </div>
  )
}
