'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ArrowLeft, ArrowRight, Search, Sparkles, CheckCircle2, Loader2 } from 'lucide-react'
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
  const [isSearching, setIsSearching] = useState(false)
  const [similarTasks, setSimilarTasks] = useState<SimilarTask[]>([])
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>([])

  const steps = [
    { number: 1, title: 'Describe', description: 'What do you want to build?' },
    { number: 2, title: 'Discover', description: 'Find similar patterns' },
    { number: 3, title: 'Refine', description: 'Review & customize' },
    { number: 4, title: 'Create', description: 'Start workflow' }
  ]

  const handleSearch = async () => {
    if (!taskTitle.trim()) return

    setIsSearching(true)
    // Simulate searching Archon
    setTimeout(() => {
      setSimilarTasks([
        {
          id: '101',
          title: 'JWT auth for API',
          completedAt: new Date('2024-12-15'),
          patterns: ['JWT setup', 'Token storage', 'Refresh logic', 'Password hashing'],
          similarity: 0.92
        },
        {
          id: '102',
          title: 'OAuth2 integration',
          completedAt: new Date('2024-11-20'),
          patterns: ['OAuth2 flow', 'Social login', 'Token management', 'User session'],
          similarity: 0.85
        },
        {
          id: '103',
          title: 'Session management',
          completedAt: new Date('2024-10-05'),
          patterns: ['Session storage', 'Cookie handling', 'Security middleware', 'Session timeout'],
          similarity: 0.78
        }
      ])
      setIsSearching(false)
    }, 1500)
  }

  const handleCreateTask = () => {
    // Create task and redirect
    router.push('/tasks/1')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-semibold">Create New Task</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-semibold
                    ${currentStep === step.number
                      ? 'bg-primary text-primary-foreground scale-110'
                      : currentStep > step.number
                      ? 'bg-green-500 text-white'
                      : 'bg-muted text-muted-foreground'
                    }
                    transition-all
                  `}>
                    {currentStep > step.number ? <CheckCircle2 className="h-5 w-5" /> : step.number}
                  </div>
                  <div className="text-xs mt-2 text-center">
                    <div className="font-medium">{step.title}</div>
                    <div className="text-muted-foreground hidden sm:block">{step.description}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    w-16 sm:w-24 h-0.5 mx-2
                    ${currentStep > step.number ? 'bg-green-500' : 'bg-muted'}
                    transition-colors
                  `} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardContent className="p-6">
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">What do you want to build?</h2>
                  <p className="text-muted-foreground">
                    Be specific. &quot;Add login&quot; is vague. &quot;Add JWT auth with token refresh&quot; is clear.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Task Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Implement user authentication"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description (optional)</Label>
                    <textarea
                      id="description"
                      placeholder="Add more details about what you want to accomplish..."
                      value={taskDescription}
                      onChange={(e) => setTaskDescription(e.target.value)}
                      className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1.5"
                    />
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Sparkles className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-700 dark:text-blue-300">Tip</p>
                        <p className="text-blue-600 dark:text-blue-400 mt-1">
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
                <div>
                  <h2 className="text-2xl font-bold mb-2">Searching Archon for similar tasks...</h2>
                  <p className="text-muted-foreground">
                    Found {similarTasks.length} similar tasks from your past work
                  </p>
                </div>

                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {similarTasks.map((task) => (
                      <Card key={task.id} className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-base">{task.title}</CardTitle>
                              <CardDescription className="mt-1">
                                Completed {task.completedAt.toLocaleDateString()}
                              </CardDescription>
                            </div>
                            <Badge variant="secondary">
                              {Math.round(task.similarity * 100)}% match
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex flex-wrap gap-1">
                            {task.patterns.map((pattern) => (
                              <Badge
                                key={pattern}
                                variant={selectedPatterns.includes(pattern) ? 'default' : 'outline'}
                                className="text-xs cursor-pointer"
                                onClick={() => {
                                  setSelectedPatterns(prev =>
                                    prev.includes(pattern)
                                      ? prev.filter(p => p !== pattern)
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
                  <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-green-700 dark:text-green-300">
                          {selectedPatterns.length} pattern{selectedPatterns.length > 1 ? 's' : ''} selected
                        </p>
                        <p className="text-green-600 dark:text-green-400 mt-1">
                          These patterns will be pre-loaded into your task
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Review & customize</h2>
                  <p className="text-muted-foreground">
                    Review your task before starting the workflow
                  </p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>{taskTitle || 'Untitled Task'}</CardTitle>
                    <CardDescription>{taskDescription || 'No description provided'}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedPatterns.length > 0 && (
                        <div>
                          <Label>Selected Patterns</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {selectedPatterns.map((pattern) => (
                              <Badge key={pattern} variant="secondary">
                                {pattern}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <Label>Workflow Settings</Label>
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <span className="text-sm">Auto-advance phases</span>
                            <input type="checkbox" className="rounded" defaultChecked />
                          </div>
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <span className="text-sm">Auto-ingest patterns</span>
                            <input type="checkbox" className="rounded" defaultChecked />
                          </div>
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <span className="text-sm">Enable real-time monitoring</span>
                            <input type="checkbox" className="rounded" defaultChecked />
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
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Task ready to create!</h2>
                    <p className="text-muted-foreground">
                      Click the button below to start the PRP workflow
                    </p>
                  </div>
                </div>

                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Title</span>
                        <span className="font-medium">{taskTitle}</span>
                      </div>
                      {selectedPatterns.length > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Patterns</span>
                          <span className="font-medium">{selectedPatterns.length} selected</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Starting phase</span>
                        <Badge>Planning</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1) as Step)}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {currentStep === 1 && (
            <Button onClick={() => { handleSearch(); setCurrentStep(2); }} disabled={!taskTitle.trim()}>
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
            <Button onClick={() => setCurrentStep(3)}>
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}

          {currentStep === 3 && (
            <Button onClick={() => setCurrentStep(4)}>
              Review
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}

          {currentStep === 4 && (
            <Button onClick={handleCreateTask} className="w-full sm:w-auto">
              <Sparkles className="h-4 w-4 mr-2" />
              Create Task & Start Workflow
            </Button>
          )}
        </div>
      </main>
    </div>
  )
}
