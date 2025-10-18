# AGUI Integration Guide
## AI-Generated User Interface Development with CopilotKit

This guide provides comprehensive patterns and best practices for integrating AI-Generated User Interfaces (AGUI) with CopilotKit in CE-Hub projects.

## Table of Contents

1. [Setup & Configuration](#setup--configuration)
2. [Integration Patterns](#integration-patterns)
3. [Component Templates](#component-templates)
4. [State Management](#state-management)
5. [Sample Hooks & Examples](#sample-hooks--examples)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

## Setup & Configuration

### Project Structure

```
src/
├── components/
│   ├── agui/              # AI-enhanced components
│   │   ├── Chat/
│   │   ├── Forms/
│   │   └── DataDisplay/
│   ├── ui/                # Base UI components
│   └── layouts/
├── hooks/
│   ├── copilot/           # CopilotKit custom hooks
│   └── agui/              # AGUI-specific hooks
├── lib/
│   ├── copilot.ts         # CopilotKit configuration
│   └── agui-utils.ts      # AGUI utilities
└── types/
    ├── copilot.ts         # CopilotKit type definitions
    └── agui.ts            # AGUI type definitions
```

### Installation

```bash
# Core CopilotKit packages
npm install @copilotkit/react-core @copilotkit/react-ui @copilotkit/react-textarea

# Additional UI dependencies
npm install @headlessui/react @heroicons/react
npm install class-variance-authority clsx tailwind-merge

# Development dependencies
npm install -D @types/react @types/react-dom
```

### CopilotKit Configuration

```typescript
// lib/copilot.ts
import { CopilotKit } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";

export const copilotConfig = {
  publicApiKey: process.env.NEXT_PUBLIC_COPILOT_API_KEY,
  url: "/api/copilotkit",
  headers: {
    "Content-Type": "application/json",
  },
};

// Provider wrapper component
export function CopilotProvider({ children }: { children: React.ReactNode }) {
  return (
    <CopilotKit {...copilotConfig}>
      <div className="h-screen flex">
        <div className="flex-1">
          {children}
        </div>
        <CopilotSidebar
          instructions="You are an AI assistant helping with planning and project management."
          defaultOpen={false}
        />
      </div>
    </CopilotKit>
  );
}
```

## Integration Patterns

### 1. AI-Enhanced Form Pattern

Use AI to assist with form completion, validation, and data enrichment.

```typescript
// components/agui/SmartForm.tsx
import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { useState, useEffect } from "react";

interface FormData {
  title: string;
  description: string;
  tags: string[];
  priority: "low" | "medium" | "high";
}

export function SmartForm() {
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    tags: [],
    priority: "medium"
  });

  // Make form data readable by AI
  useCopilotReadable({
    description: "Current form data for project creation",
    value: formData,
  });

  // AI action to auto-complete form
  useCopilotAction({
    name: "autoCompleteForm",
    description: "Auto-complete form fields based on user input",
    parameters: [
      {
        name: "suggestions",
        type: "object",
        description: "Suggested form field values",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
          priority: { type: "string", enum: ["low", "medium", "high"] }
        }
      }
    ],
    handler: async ({ suggestions }) => {
      setFormData(prev => ({
        ...prev,
        ...suggestions,
        tags: [...prev.tags, ...(suggestions.tags || [])]
      }));
      return "Form auto-completed successfully";
    },
  });

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Project Title
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          placeholder="Enter project title..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          rows={4}
          placeholder="Describe your project..."
        />
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Ask AI to Complete Form
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Create Project
        </button>
      </div>
    </div>
  );
}
```

### 2. Intelligent Data Display Pattern

AI-powered data analysis and visualization suggestions.

```typescript
// components/agui/SmartDataTable.tsx
import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { useState } from "react";

interface DataPoint {
  id: string;
  name: string;
  value: number;
  category: string;
  timestamp: string;
}

interface AnalysisResult {
  insights: string[];
  recommendations: string[];
  visualizationType: "chart" | "table" | "cards";
}

export function SmartDataTable({ data }: { data: DataPoint[] }) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Make data readable by AI
  useCopilotReadable({
    description: "Dataset for analysis and visualization",
    value: { data, summary: { total: data.length, categories: [...new Set(data.map(d => d.category))] } },
  });

  // AI action to analyze data
  useCopilotAction({
    name: "analyzeData",
    description: "Analyze the dataset and provide insights",
    parameters: [
      {
        name: "analysisResult",
        type: "object",
        description: "Analysis results with insights and recommendations",
        properties: {
          insights: { type: "array", items: { type: "string" } },
          recommendations: { type: "array", items: { type: "string" } },
          visualizationType: { type: "string", enum: ["chart", "table", "cards"] }
        }
      }
    ],
    handler: async ({ analysisResult }) => {
      setAnalysis(analysisResult);
      return "Data analysis completed";
    },
  });

  const triggerAnalysis = async () => {
    setIsLoading(true);
    // The AI will call the analyzeData action automatically
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Data Analysis</h2>
        <button
          onClick={triggerAnalysis}
          disabled={isLoading}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
        >
          {isLoading ? "Analyzing..." : "Ask AI to Analyze"}
        </button>
      </div>

      {analysis && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-900">AI Insights</h3>
          <ul className="mt-2 space-y-1">
            {analysis.insights.map((insight, index) => (
              <li key={index} className="text-blue-800">• {insight}</li>
            ))}
          </ul>

          <h4 className="font-semibold text-blue-900 mt-4">Recommendations</h4>
          <ul className="mt-2 space-y-1">
            {analysis.recommendations.map((rec, index) => (
              <li key={index} className="text-blue-800">• {rec}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.value}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.category}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### 3. AI-Assisted Navigation Pattern

Smart routing and navigation suggestions based on user context.

```typescript
// components/agui/SmartNavigation.tsx
import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";

interface NavigationSuggestion {
  path: string;
  label: string;
  reason: string;
  priority: number;
}

export function SmartNavigation() {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<NavigationSuggestion[]>([]);
  const [userContext, setUserContext] = useState({
    currentPath: router.pathname,
    recentPages: [],
    userRole: "user",
    currentTask: ""
  });

  // Make navigation context readable
  useCopilotReadable({
    description: "User navigation context and current location",
    value: userContext,
  });

  // AI action for navigation suggestions
  useCopilotAction({
    name: "suggestNavigation",
    description: "Suggest relevant navigation options based on user context",
    parameters: [
      {
        name: "suggestions",
        type: "array",
        description: "Array of navigation suggestions",
        items: {
          type: "object",
          properties: {
            path: { type: "string" },
            label: { type: "string" },
            reason: { type: "string" },
            priority: { type: "number" }
          }
        }
      }
    ],
    handler: async ({ suggestions }) => {
      setSuggestions(suggestions.sort((a, b) => b.priority - a.priority));
      return "Navigation suggestions updated";
    },
  });

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <nav className="flex space-x-8">
            <a href="/dashboard" className="text-gray-900 hover:text-gray-600">Dashboard</a>
            <a href="/projects" className="text-gray-900 hover:text-gray-600">Projects</a>
            <a href="/tasks" className="text-gray-900 hover:text-gray-600">Tasks</a>
          </nav>

          {suggestions.length > 0 && (
            <div className="relative">
              <div className="bg-blue-100 px-3 py-1 rounded-full text-sm">
                <span className="text-blue-800">AI Suggestions: </span>
                {suggestions.slice(0, 2).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => router.push(suggestion.path)}
                    className="text-blue-600 hover:text-blue-800 ml-2"
                    title={suggestion.reason}
                  >
                    {suggestion.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

## Sample Hooks & Examples

### Custom Hook: useAGUIForm

```typescript
// hooks/agui/useAGUIForm.ts
import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { useState, useCallback } from "react";

export function useAGUIForm<T extends Record<string, any>>(
  initialData: T,
  options: {
    name: string;
    description: string;
    autoComplete?: boolean;
    validation?: (data: T) => string | null;
  }
) {
  const [formData, setFormData] = useState<T>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Make form data readable
  useCopilotReadable({
    description: `Form data for ${options.description}`,
    value: formData,
  });

  // Auto-completion action
  useCopilotAction({
    name: `autoComplete${options.name}`,
    description: `Auto-complete ${options.description}`,
    parameters: [
      {
        name: "completedData",
        type: "object",
        description: "Completed form data"
      }
    ],
    handler: async ({ completedData }) => {
      setFormData(prev => ({ ...prev, ...completedData }));
      if (options.validation) {
        const error = options.validation({ ...formData, ...completedData });
        if (error) setErrors({ general: error });
        else setErrors({});
      }
      return "Form auto-completed";
    },
  });

  const updateField = useCallback((field: keyof T, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field-specific errors
    setErrors(prev => ({ ...prev, [field as string]: "" }));
  }, []);

  const validateForm = useCallback(() => {
    if (!options.validation) return true;
    const error = options.validation(formData);
    if (error) {
      setErrors({ general: error });
      return false;
    }
    setErrors({});
    return true;
  }, [formData, options.validation]);

  return {
    formData,
    errors,
    updateField,
    validateForm,
    setFormData
  };
}
```

### Custom Hook: useAGUIChat

```typescript
// hooks/agui/useAGUIChat.ts
import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { useState, useCallback } from "react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export function useAGUIChat(systemPrompt?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Make chat context readable
  useCopilotReadable({
    description: "Current chat conversation and context",
    value: {
      messages: messages.slice(-10), // Last 10 messages for context
      messageCount: messages.length,
      systemPrompt
    },
  });

  // AI action to add assistant message
  useCopilotAction({
    name: "addAssistantMessage",
    description: "Add an assistant response to the chat",
    parameters: [
      {
        name: "content",
        type: "string",
        description: "The assistant's response content"
      },
      {
        name: "metadata",
        type: "object",
        description: "Optional metadata for the message"
      }
    ],
    handler: async ({ content, metadata }) => {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content,
        timestamp: new Date(),
        metadata
      };
      setMessages(prev => [...prev, newMessage]);
      setIsLoading(false);
      return "Assistant message added";
    },
  });

  const addUserMessage = useCallback((content: string, metadata?: Record<string, any>) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
      metadata
    };
    setMessages(prev => [...prev, newMessage]);
    setIsLoading(true);
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setIsLoading(false);
  }, []);

  return {
    messages,
    isLoading,
    addUserMessage,
    clearChat
  };
}
```

## Best Practices

### Do's ✅

1. **Progressive Enhancement**
   ```typescript
   // Always provide fallback UI
   const [aiEnabled, setAiEnabled] = useState(false);

   return (
     <div>
       {aiEnabled ? <AIEnhancedComponent /> : <StandardComponent />}
       <button onClick={() => setAiEnabled(!aiEnabled)}>
         {aiEnabled ? "Disable AI" : "Enable AI"}
       </button>
     </div>
   );
   ```

2. **Clear AI State Indicators**
   ```typescript
   {isAIProcessing && (
     <div className="flex items-center text-blue-600">
       <Spinner className="mr-2" />
       AI is analyzing...
     </div>
   )}
   ```

3. **Error Boundaries for AI Features**
   ```typescript
   function AIErrorBoundary({ children }: { children: React.ReactNode }) {
     return (
       <ErrorBoundary
         fallback={<div>AI features temporarily unavailable</div>}
         onError={(error) => console.error("AI feature error:", error)}
       >
         {children}
       </ErrorBoundary>
     );
   }
   ```

4. **Contextual AI Actions**
   ```typescript
   // Make actions specific to current context
   useCopilotAction({
     name: "suggestProjectTasks",
     description: "Suggest tasks based on current project context",
     // ... implementation
   });
   ```

### Don'ts ❌

1. **Don't Make Everything AI-Dependent**
   ```typescript
   // Bad: AI required for basic functionality
   if (!aiResponse) return <div>Loading...</div>;

   // Good: AI enhances existing functionality
   return (
     <div>
       <StandardInterface />
       {aiSuggestions && <AISuggestions />}
     </div>
   );
   ```

2. **Don't Expose Raw AI Responses**
   ```typescript
   // Bad: Direct AI output to user
   <div>{aiResponse}</div>

   // Good: Validated and formatted AI output
   <div>{validateAndFormatAIResponse(aiResponse)}</div>
   ```

3. **Don't Ignore Loading States**
   ```typescript
   // Bad: No loading indication
   const response = await aiAction();

   // Good: Clear loading states
   setIsLoading(true);
   try {
     const response = await aiAction();
   } finally {
     setIsLoading(false);
   }
   ```

## Troubleshooting

### Common Issues

1. **CopilotKit Actions Not Triggering**
   ```typescript
   // Ensure proper parameter definitions
   useCopilotAction({
     name: "myAction",
     description: "Clear, specific description",
     parameters: [
       {
         name: "param",
         type: "string", // Correct type specification
         description: "Detailed parameter description"
       }
     ],
     handler: async ({ param }) => {
       // Handle the action
       return "Success message"; // Always return a response
     },
   });
   ```

2. **Performance Issues with Large Datasets**
   ```typescript
   // Use pagination for large datasets
   useCopilotReadable({
     description: "Current page of data",
     value: {
       data: currentPageData, // Not full dataset
       pagination: { page, total, hasMore }
     },
   });
   ```

3. **AI Context Too Large**
   ```typescript
   // Summarize or limit context
   useCopilotReadable({
     description: "Relevant project summary",
     value: {
       summary: project.summary,
       recentActivity: project.activities.slice(-5)
       // Don't include entire project history
     },
   });
   ```

### Debug Mode

```typescript
// Enable debug logging for CopilotKit
const copilotConfig = {
  // ... other config
  debug: process.env.NODE_ENV === "development"
};
```

### Testing AI Features

```typescript
// Mock CopilotKit for testing
jest.mock("@copilotkit/react-core", () => ({
  useCopilotAction: jest.fn(),
  useCopilotReadable: jest.fn(),
}));

// Test component without AI dependencies
test("component works without AI", () => {
  render(<ComponentUnderTest />);
  expect(screen.getByText("Standard functionality")).toBeInTheDocument();
});
```

---

*This guide should be updated as new CopilotKit features and AGUI patterns emerge. Always refer to the latest CopilotKit documentation for breaking changes and new capabilities.*