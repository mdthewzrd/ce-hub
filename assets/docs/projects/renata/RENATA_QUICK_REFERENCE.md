# Renata AI - Quick Reference Card

## Visual Identity at a Glance

### Primary Colors
- **Yellow (Brand)**: `#FBBF24` (Tailwind: `yellow-500`, `yellow-600`, `yellow-700`)
- **Black (Background)**: `#000000` (Tailwind: `black`)
- **Dark Gray**: `#111111`, `#1F2937` (Tailwind: `gray-900`, `gray-800`, `gray-700`)
- **White (Text)**: `#FFFFFF` (Tailwind: `white`)
- **Green (Live)**: `#4ADE80` (Tailwind: `green-500`, `green-400`)

### Accent Colors by Mode
- **Analyst**: Blue (`#3B82F6`, `text-blue-400` or `text-blue-500`)
- **Coach/Optimizer**: Green (`#22C55E`, `text-green-400` or `text-green-500`)
- **Debugger/Mentor**: Red (`#EF4444`, `text-red-400` or `text-red-500`)

---

## Component Layout Formula

```
┌─ HEADER (p-4, border-b border-yellow-500/30, h-120px)
├─ Messages (flex-1, overflow-y-auto, p-4, space-y-4)
├─ Quick Actions (p-3, border-t border-yellow-500/30, h-80px)
└─ Input (p-3, border-t border-yellow-500/30, h-70px)
```

---

## Key CSS Classes Quick Copy

### Container
```tsx
className="h-full bg-black text-white flex flex-col"
className="w-[480px] bg-black text-white flex flex-col"  // Sidebar
className="w-96 h-[500px] bg-gray-900 border border-gray-700"  // Floating
```

### Header
```tsx
className="p-4 border-b border-yellow-500/30"
className="flex items-center justify-between mb-3"
className="font-semibold text-yellow-500"
className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
```

### Messages
```tsx
// User message
className="bg-yellow-500 text-black font-medium rounded-lg p-3"

// AI message
className="bg-gray-900 text-gray-100 border border-gray-700 rounded-lg p-3"

// Type badge
className="inline-block px-2 py-1 rounded text-xs mb-2"
className="bg-blue-100 text-blue-800 border border-blue-300"
```

### Buttons
```tsx
// Send button
className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded px-4 py-2 transition-colors"

// Quick action (green)
className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded"

// Mode selector (active)
className="bg-yellow-500 text-black font-bold px-3 py-1 rounded text-xs"
```

### Input
```tsx
className="flex-1 bg-gray-900 text-white border border-yellow-500/30 rounded px-3 py-2 text-sm"
className="focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
```

---

## Message Type Styling

```tsx
const getMessageTypeColor = (type?: string) => {
  switch (type) {
    case 'analysis': return 'bg-blue-100 text-blue-800 border border-blue-300';
    case 'optimization': return 'bg-green-100 text-green-800 border border-green-300';
    case 'troubleshooting': return 'bg-red-100 text-red-800 border border-red-300';
    default: return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
  }
};
```

---

## Multi-Personality Configuration

```tsx
const personalities = [
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
```

---

## Key Lucide Icons Used

- `Bot` - Renata personality
- `BarChart3` / `TrendingUp` - Analyst
- `Target` / `Brain` - Coach/Optimizer
- `Settings` / `Wrench` - Debugger
- `Send` - Send message
- `Loader2` - Loading/thinking
- `MessageCircle` - Minimize/expand
- `Trash2` - Clear chat
- `User` - User message icon
- `Minimize2` / `Maximize2` - Window controls

---

## Animation Classes

```tsx
// Pulsing indicator
className="animate-pulse"

// Spinning loader
className="animate-spin"

// Smooth transitions
className="transition-all duration-200"
className="transition-colors"

// Hover scale
className="hover:scale-105"
```

---

## File Paths for Reference

**Source Components:**
1. `/Users/michaeldurante/ai dev/ce-hub/edge-dev/src/components/StandaloneRenataChat.tsx` ← USE THIS
2. `/Users/michaeldurante/ai dev/ce-hub/edge-dev/src/components/GlobalRenataAgent.tsx`
3. `/Users/michaeldurante/ai dev/ce-hub/traderra/frontend/src/components/dashboard/renata-chat.tsx`

**Screenshot:**
- `/Users/michaeldurante/ai dev/ce-hub/.playwright-mcp/renata-chat-comprehensive-testing-success.png`

---

## Quick Implementation Checklist

- [ ] Import icons from `lucide-react`
- [ ] Define `Message` interface with `role`, `content`, `timestamp`, `type`
- [ ] Define `AIPersonality` interface with `id`, `name`, `icon`, `color`
- [ ] Create personalities array
- [ ] Setup message state with `useState`
- [ ] Create header with personality selector
- [ ] Create scrollable message area with type badges
- [ ] Add quick action buttons
- [ ] Create input with send button
- [ ] Add auto-scroll on new messages
- [ ] Add loading/thinking state
- [ ] Style with provided Tailwind classes

---

## Pro Tips

1. **Border Accent**: Use `border-yellow-500/30` (30% opacity) for subtle separators
2. **Live Indicator**: Combine green dot + "Live" text for status
3. **Message Width**: Limit to `max-w-[85%]` for readability
4. **Timestamps**: Use `toLocaleTimeString()` and `opacity-60` for muted look
5. **Type Badges**: Position at top of AI message with light background
6. **Loading State**: Show spinner + "Thinking..." message
7. **Color Consistency**: Always use same yellow shade for primary accent
8. **Dark Theme**: Use black/gray-900 for main background, gray-800 for sections

---

**Full Guide**: See `RENATA_AI_STYLING_GUIDE.md` for comprehensive documentation

