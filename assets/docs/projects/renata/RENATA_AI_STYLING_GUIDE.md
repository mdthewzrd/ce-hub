# Renata AI - Complete Styling & Branding Guide

## Executive Summary

This document provides a comprehensive analysis of the Renata AI implementation found in the Traderra codebase (running on port 6565). It covers styling, branding, components, layout, and design patterns you can apply to your current AI chat sidebar.

---

## 1. Visual Design & Color Scheme

### Primary Brand Colors

**Renata Yellow** (Primary Brand Color)
- Tailwind: `bg-yellow-500`, `text-yellow-500`
- RGB: Golden yellow (#FBBF24 or similar)
- Usage: Main accent color for buttons, icons, branding, highlights
- Personality: Energetic, approachable, AI intelligence indicator

**Dark Backgrounds**
- Container background: `bg-gray-900` or `bg-black`
- Header/Section backgrounds: `bg-gray-800`
- Subtle element backgrounds: `bg-gray-700`
- Input fields: `bg-gray-900` with `border-yellow-500/30` (30% opacity)

**Text Colors**
- Primary text: `text-white`
- Secondary text: `text-gray-400`
- Muted text: `text-gray-500`
- Status indicators: `text-green-400` (live), `text-red-400` (offline)

### Color Coding by Message Type

The system uses colored badges and icons for different message categories:

```
Analysis Messages:        bg-blue-100 text-blue-800 border-blue-300
Optimization Messages:    bg-green-100 text-green-800 border-green-300
Troubleshooting Messages: bg-red-100 text-red-800 border-red-300
General Messages:         bg-yellow-100 text-yellow-800 border-yellow-300
```

### Mode-Specific Colors (Multi-Personality System)

Each AI mode has its own color to help users identify which assistant they're talking to:

```
Renata Mode (Orchestrator):        text-yellow-500  →  bg-yellow-600
Analyst Mode:                       text-blue-400    →  bg-blue-600
Coach/Optimizer Mode:               text-green-400   →  bg-green-600
Mentor/Debugger Mode:               text-red-400     →  bg-red-600
```

---

## 2. Component Structure & Layout

### Chat Container

**Full Standalone Implementation** (Sidebar Layout)
```
┌─────────────────────────────────────┐
│          HEADER SECTION (1)         │  Height: 120-150px
├─────────────────────────────────────┤
│                                     │
│      MESSAGE AREA (SCROLLABLE) (2)  │  Flex: 1 (fill remaining space)
│                                     │
│      - User messages (right-aligned)│
│      - AI messages (left-aligned)   │
│      - Timestamps & type badges     │
│                                     │
├─────────────────────────────────────┤
│      QUICK ACTIONS BAR (3)          │  Height: 60-80px
├─────────────────────────────────────┤
│      INPUT AREA (4)                 │  Height: 70px
└─────────────────────────────────────┘
```

### 1. Header Section

**Structure:**
```
┌────────────────────────────────────┐
│ [Icon] Renata AI                   │
│ Standalone Trading Assistant       │
│ [Live • Green Indicator]           │
├────────────────────────────────────┤
│ [Renata] [Analyst] [Coach] [Mentor]│  Mode selector buttons
└────────────────────────────────────┘
```

**Key Elements:**
- Bot icon (color-coded by mode)
- Title: "{Personality} AI" (e.g., "Renata AI")
- Subtitle: Role description (e.g., "Standalone Trading Assistant")
- Live status indicator (green dot + "Live" text)
- Mode selector buttons (tabs)
- Control buttons (minimize, clear, close)

**Styling:**
```tsx
// Header container
className="p-4 border-b border-yellow-500/30"

// Title section
className="flex items-center justify-between mb-3"

// Personality name
className="font-semibold text-yellow-500"

// Live indicator
className="flex items-center gap-1"
className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
className="text-xs text-green-400"
```

### 2. Message Area

**Message Bubble Structure:**

**User Messages (Right-Aligned):**
```
                                    ┌──────────────────┐
                                    │  User's message  │
                                    │  text goes here  │
                                    │  12:34 PM        │
                                    └──────────────────┘
```
- Background: `bg-yellow-500`
- Text: `text-black`
- Font weight: `font-medium` or `font-semibold`
- Border radius: `rounded-lg`
- Padding: `p-3` or `p-4`
- Max width: `max-w-[85%]`

**AI Messages (Left-Aligned):**
```
┌─────────────────────────────────┐
│ [icon]                          │
│ [Analysis] (optional badge)     │
│  AI's response text goes here   │
│  Multiple paragraphs supported  │
│  12:34 PM                       │
└─────────────────────────────────┘
```
- Background: `bg-gray-900 text-gray-100`
- Border: `border border-gray-700`
- Border radius: `rounded-lg`
- Padding: `p-3` or `p-4`
- Max width: `max-w-[85%]`

**Message Container Spacing:**
```tsx
className="flex gap-3 max-w-[85%]"
className="space-y-4"  // Gap between messages
```

**Type Badges:**
```tsx
// Positioned at top of AI message
className="inline-block px-2 py-1 rounded text-xs mb-2"
className="bg-blue-100 text-blue-800 border border-blue-300"  // Analysis
className="bg-green-100 text-green-800 border border-green-300" // Optimization
className="bg-red-100 text-red-800 border border-red-300"  // Troubleshooting
className="bg-yellow-100 text-yellow-800 border border-yellow-300" // General
```

**Timestamps:**
```tsx
className="text-xs opacity-60 mt-2"
// Format: "12:34 PM" or "HH:MM:SS"
message.timestamp.toLocaleTimeString()
```

### 3. Quick Actions Bar

**Structure:**
```
┌──────────────────────────────────────────┐
│ [Optimize] [Analyze] [Debug Issues]      │
└──────────────────────────────────────────┘
```

**Button Styling:**
```tsx
// Default style
className="text-xs px-3 py-1 rounded text-white"
className="hover:opacity-90 disabled:opacity-50"

// Color variants
className="bg-green-600 hover:bg-green-700"    // Optimize
className="bg-blue-600 hover:bg-blue-700"      // Analyze
className="bg-red-600 hover:bg-red-700"        // Debug

// Icon + text
className="flex items-center gap-1"
<TrendingUp className="h-3 w-3" />
"Optimize Scanner"
```

**Quick Action Examples:**
- "Optimize Scanner" with trending icon
- "Analyze Results" with chart icon
- "Debug Issues" with settings icon

### 4. Input Area

**Structure:**
```
┌─────────────────────────────┬──────┐
│ [Text Input Field]          │[Send]│
└─────────────────────────────┴──────┘
```

**Input Field Styling:**
```tsx
className="flex-1 bg-gray-900 text-white"
className="border border-yellow-500/30"
className="rounded px-3 py-2 text-sm"
className="focus:outline-none"
className="focus:ring-2 focus:ring-yellow-500"
className="focus:border-yellow-500"
```

**Send Button Styling:**
```tsx
className="bg-yellow-500 hover:bg-yellow-600"
className="text-black font-medium"
className="disabled:opacity-50 disabled:cursor-not-allowed"
className="transition-colors"
className="border border-yellow-400"
className="rounded px-4 py-2"
```

**Placeholder Text:**
```
"Ask Renata about scanners, patterns, or trading strategies..."
"Ask {PersonalityName} about scanners, parameters, or analysis..."
```

---

## 3. Typography & Fonts

### Font Stack
- Primary font: System fonts (defaults to Tailwind's sans-serif)
- Mono font: System monospace for code/technical content

### Text Styles

**Headers & Titles:**
- Font weight: `font-semibold` (600) or `font-bold` (700)
- Size: `text-base` (main title), `text-sm` (secondary)
- Color: `text-white` or `text-yellow-500` for branding

**Body Text:**
- Font weight: `font-normal` (400)
- Size: `text-sm` (messages), `text-xs` (metadata)
- Color: `text-gray-100` (primary), `text-gray-400` (secondary)

**Special Elements:**
- Disabled text: `opacity-50`
- Muted text: `opacity-60`
- Code/technical: `font-mono text-xs`

---

## 4. AI Personality System

### Multi-Mode Architecture

The Renata implementation supports **4 different AI personalities**, each with distinct characteristics:

#### **Renata Mode** (Default Orchestrator)
- **Color:** Yellow (`text-yellow-500`)
- **Description:** "AI orchestrator & general assistant"
- **Purpose:** Overall coordination and general trading help
- **Message tone:** Helpful, balanced, informative
- **System prompt focus:** General trading intelligence, pattern analysis, strategy optimization

#### **Analyst Mode**
- **Color:** Blue (`text-blue-400` or `text-blue-500`)
- **Description:** "Direct, data-focused analysis"
- **Purpose:** Technical analysis and metrics interpretation
- **Message tone:** Data-driven, precise, metrics-focused
- **System prompt focus:** Trading data analysis, chart interpretation, performance metrics

#### **Coach Mode**
- **Color:** Green (`text-green-400` or `text-green-500`)
- **Description:** "Constructive guidance"
- **Purpose:** Trading psychology and strategy improvement
- **Message tone:** Supportive, educational, encouraging
- **System prompt focus:** Strategy coaching, performance improvement, learning focus

#### **Mentor Mode**
- **Color:** Red (`text-red-400` or `text-red-500`)
- **Description:** "Reflective insights"
- **Purpose:** Deep analysis and educational guidance
- **Message tone:** Insightful, comprehensive, reflective
- **System prompt focus:** Trading education, deep learning, strategic thinking

### Mode Selector Button Styling

**Active Mode Button:**
```tsx
className="bg-yellow-500 text-black font-bold"
className="px-3 py-1 rounded text-xs"
className="flex items-center gap-1 transition-colors"
```

**Inactive Mode Button:**
```tsx
className="bg-gray-800 text-gray-400"
className="hover:text-white hover:bg-yellow-600 hover:text-black"
className="px-3 py-1 rounded text-xs"
className="flex items-center gap-1 transition-colors"
```

### Mode Icon System

Each mode has an associated icon (from Lucide):
- Renata: `<Bot />`
- Analyst: `<BarChart3 />` or `<TrendingUp />`
- Coach: `<Target />` or `<Brain />`
- Mentor: `<Settings />` or `<Wrench />`

---

## 5. Interactive Elements & Animations

### Button Interactions

**Hover States:**
```tsx
className="hover:bg-yellow-700"  // Darken on hover
className="hover:scale-105"      // Subtle scale effect
className="transition-all duration-200"  // Smooth transition
```

**Loading State:**
```tsx
// Animated loading spinner
<Loader2 className="h-4 w-4 animate-spin text-yellow-500" />

// Thinking message
<div className="flex items-center gap-2">
  <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
  <span>Thinking...</span>
</div>
```

**Status Indicators:**
```tsx
// Live indicator (green pulsing dot)
<div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
<span className="text-xs text-green-400">Live</span>

// Processing indicator
<div className="animate-spin h-4 w-4 border border-white border-t-transparent rounded-full" />
```

### Scroll Behavior

```tsx
// Auto-scroll to latest messages
scrollToBottom = () => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}

// Use dependency to trigger on new messages
useEffect(() => {
  scrollToBottom();
}, [messages]);
```

---

## 6. Responsive Design Considerations

### Container Sizing

**Collapsed/Floating Button:**
```tsx
className="fixed bottom-6 right-6 z-50"
className="rounded-full w-14 h-14"  // 56px square
className="flex items-center justify-center"
className="bg-yellow-600 hover:bg-yellow-700"
className="text-black shadow-lg"
className="transition-all duration-200 hover:scale-105"
```

**Expanded Sidebar (Main Implementation):**
```tsx
className="w-[480px] bg-black text-white flex flex-col"  // Full height
className="h-full"  // Takes full height of parent
className="border-l border-yellow-500/30"  // Left border accent
```

**Floating Window (Alternative):**
```tsx
className="fixed bottom-6 right-6 z-50"
className="w-96 h-[500px]"  // 384px × 500px
className="bg-gray-900 border border-gray-700 rounded-lg"
className="shadow-lg"
```

### Flex Layout Structure

```tsx
// Main container: full flex column
className="flex flex-col h-full"

// Header: fixed height
className="p-4 border-b border-yellow-500/30"

// Messages: flex-1 (fill available space, scrollable)
className="flex-1 overflow-y-auto p-4 space-y-4"

// Quick actions: fixed height
className="p-3 border-t border-yellow-500/30"

// Input: fixed height
className="p-3 border-t border-yellow-500/30"
className="flex gap-2"
```

---

## 7. Implementation Reference Files

### Key Component Files from Traderra (Port 6565)

**Main Standalone Chat Component:**
```
/Users/michaeldurante/ai dev/ce-hub/edge-dev/src/components/StandaloneRenataChat.tsx
```
- Multi-mode personality system
- Full chat interface with history
- Quick action buttons
- Complete styling reference

**Global Floating Agent:**
```
/Users/michaeldurante/ai dev/ce-hub/edge-dev/src/components/GlobalRenataAgent.tsx
```
- Floating button implementation
- Minimizable chat window
- Alternative layout approach

**Traderra Dashboard Implementation:**
```
/Users/michaeldurante/ai dev/ce-hub/traderra/frontend/src/components/dashboard/renata-chat.tsx
```
- Integrated sidebar chat
- Performance metrics context
- Advanced features (AGUI components)

---

## 8. Key Styling Patterns & Classes

### Border & Separator Styles

```tsx
// Yellow border accent (30% opacity)
className="border-t border-yellow-500/30"
className="border-b border-yellow-500/30"
className="border-l border-yellow-500/30"
className="border border-yellow-500/30"

// Dark borders
className="border border-gray-700"
className="border-b border-gray-700"
```

### Spacing & Padding

```tsx
// Standard padding increments
className="p-3"  // Compact sections
className="p-4"  // Default sections
className="px-3 py-2"  // Input fields
className="px-4 py-2"  // Buttons

// Gaps and margins
className="gap-1"  // Tight spacing
className="gap-2"  // Medium spacing
className="gap-3"  // Default spacing
className="gap-4"  // Loose spacing
className="space-y-4"  // Vertical spacing
```

### Opacity & States

```tsx
// Standard opacity values
className="opacity-50"   // Disabled/inactive
className="opacity-60"   // Muted/secondary
className="opacity-80"   // Semi-visible
className="opacity-100"  // Full visibility

// Hover & focus states
className="hover:opacity-90"
className="focus:ring-2 focus:ring-yellow-500"
```

---

## 9. Complete Code Examples

### Minimal Chat Component Structure

```tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Bot, User, Send, Loader2, MessageCircle,
  Minimize2, X, Trash2, TrendingUp, BarChart3, Settings
} from 'lucide-react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  type?: 'analysis' | 'optimization' | 'troubleshooting' | 'general';
}

interface AIPersonality {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
}

const personalities: AIPersonality[] = [
  {
    id: 'renata',
    name: 'Renata',
    icon: <Bot className="h-4 w-4" />,
    color: 'text-yellow-500'
  },
  {
    id: 'analyst',
    name: 'Analyst',
    icon: <BarChart3 className="h-4 w-4" />,
    color: 'text-blue-500'
  },
  {
    id: 'optimizer',
    name: 'Optimizer',
    icon: <TrendingUp className="h-4 w-4" />,
    color: 'text-green-500'
  },
  {
    id: 'debugger',
    name: 'Debugger',
    icon: <Settings className="h-4 w-4" />,
    color: 'text-red-500'
  }
];

export default function RenataChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPersonality, setCurrentPersonality] = useState(personalities[0]);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isMinimized) {
    return (
      <div className="h-12 bg-black border-t border-yellow-500/30 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className={currentPersonality.color}>
            {currentPersonality.icon}
          </div>
          <span className="text-white text-sm font-medium">{currentPersonality.name}</span>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </div>
        <button onClick={() => setIsMinimized(false)} className="text-gray-400 hover:text-white">
          <MessageCircle className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="h-full bg-black text-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-yellow-500/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={currentPersonality.color}>
              {currentPersonality.icon}
            </div>
            <span className="font-semibold">{currentPersonality.name} AI</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-400">Live</span>
            </div>
          </div>
          <button onClick={() => setIsMinimized(true)} className="text-gray-400 hover:text-white p-1 rounded">
            <Minimize2 className="h-4 w-4" />
          </button>
        </div>

        {/* Personality Selector */}
        <div className="flex gap-1">
          {personalities.map((personality) => (
            <button
              key={personality.id}
              onClick={() => setCurrentPersonality(personality)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                currentPersonality.id === personality.id
                  ? 'bg-yellow-500 text-black font-bold'
                  : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-yellow-600 hover:text-black'
              }`}
            >
              <span className={personality.color}>{personality.icon}</span>
              {personality.name}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className="flex-shrink-0 mt-1">
                {message.role === 'user' ? (
                  <User className="h-4 w-4 text-blue-400" />
                ) : (
                  <div className={currentPersonality.color}>
                    {currentPersonality.icon}
                  </div>
                )}
              </div>
              <div className={`rounded-lg p-3 text-sm ${
                message.role === 'user'
                  ? 'bg-yellow-500 text-black font-medium'
                  : 'bg-gray-900 text-gray-100 border border-gray-700'
              }`}>
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div className="text-xs opacity-60 mt-2">{message.timestamp.toLocaleTimeString()}</div>
              </div>
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex gap-3 justify-start">
            <div className="flex gap-3 max-w-[85%]">
              <div className="flex-shrink-0 mt-1">
                <div className={currentPersonality.color}>
                  {currentPersonality.icon}
                </div>
              </div>
              <div className="bg-gray-800 text-gray-100 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
                  <span>Thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-yellow-500/30">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={`Ask ${currentPersonality.name} for help...`}
            disabled={isProcessing}
            className="flex-1 bg-gray-900 text-white border border-yellow-500/30 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isProcessing}
            className="bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed text-black font-medium rounded px-4 py-2 transition-colors border border-yellow-400"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 10. Summary of Key Takeaways

### Design Principles

1. **Yellow as Primary Brand Color**: Use `yellow-500` through `yellow-700` for all Renata branding
2. **Dark Theme**: Black/dark gray backgrounds with high contrast text
3. **Multi-Personality System**: Support different AI modes with color-coding
4. **Clean, Minimal UI**: Maximum content visibility with focused controls
5. **Responsive Layout**: Sidebar or floating window implementations both viable
6. **Type-Based Message Categorization**: Use colored badges for message types
7. **Live Status Indicators**: Green pulsing dots for connection status
8. **Smooth Animations**: Transition effects on hover/focus states

### Color Quick Reference

| Element | Tailwind Class | Usage |
|---------|----------------|-------|
| Primary Accent | `bg-yellow-500` | Buttons, highlights, branding |
| Dark Container | `bg-gray-900` | Messages, inputs, main background |
| Dark Background | `bg-black` | Overall container |
| Secondary Container | `bg-gray-800` | Sections, secondary elements |
| Border Accent | `border-yellow-500/30` | Input focus rings, subtle separators |
| Text Primary | `text-white` | Main content text |
| Text Secondary | `text-gray-400` | Metadata, labels |
| Live Status | `text-green-400` | Online indicator |
| Success | `text-green-500` | Positive states |
| Analysis | `text-blue-400` | Analysis mode, detailed info |
| Warning | `text-red-400` | Errors, issues |

---

## File References for Implementation

**Direct Copy Sources (Traderra - Port 6565):**

1. **Standalone Chat Component** (Most useful for reference)
   - Path: `/Users/michaeldurante/ai\ dev/ce-hub/edge-dev/src/components/StandaloneRenataChat.tsx`
   - Contains: Complete multi-mode chat UI, all styling patterns

2. **Global Floating Agent** (Alternative approach)
   - Path: `/Users/michaeldurante/ai\ dev/ce-hub/edge-dev/src/components/GlobalRenataAgent.tsx`
   - Contains: Floating button, popup window, expandable interface

3. **Traderra Dashboard Integration**
   - Path: `/Users/michaeldurante/ai\ dev/ce-hub/traderra/frontend/src/components/dashboard/renata-chat.tsx`
   - Contains: Sidebar integration patterns, advanced features

**Screenshot Evidence:**
- Path: `/Users/michaeldurante/ai\ dev/ce-hub/.playwright-mcp/renata-chat-comprehensive-testing-success.png`
- Shows: Live implementation with Traderra dashboard integration

---

## End of Styling Guide

You now have everything needed to implement or enhance an AI chat sidebar with the proven Renata design system!
