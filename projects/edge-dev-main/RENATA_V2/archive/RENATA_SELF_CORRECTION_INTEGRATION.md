# Renata Self-Correction - Developer Integration Guide

## Overview

The self-correction system is implemented on the **server side** in the `/api/renata/chat` route. Any component that uses this endpoint automatically gets self-correction capabilities.

However, to properly **display** self-correction responses to users, frontend components should handle the `self_correction` response type.

## Automatic Benefits

All components using `/api/renata/chat` automatically get:

✅ Feedback detection
✅ Conversation memory
✅ Error classification
✅ AI-powered corrections
✅ Fixed code generation

## Optional Frontend Enhancements

To improve the user experience, components can optionally:

### 1. Handle Self-Correction Response Type

```typescript
interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  type?: 'conversion' | 'troubleshooting' | 'analysis' | 'general' | 'self_correction';
  data?: {
    correctedCode?: string;
    confidence?: number;
    appliedChanges?: string[];
    requiresManualIntervention?: boolean;
  };
}

// In your message handling
if (response.type === 'self_correction') {
  // Display with special styling
  message.type = 'self_correction';
  message.data = response.data;
}
```

### 2. Add Visual Indicators

```tsx
// Purple badge for self-correction
{message.type === 'self_correction' && (
  <span className="bg-purple-100 text-purple-700 border border-purple-300 px-2 py-1 rounded text-xs">
    ✓ Fixed
  </span>
)}

// Confidence indicator
{message.data?.confidence && (
  <div className="text-sm text-gray-500">
    Confidence: {Math.round(message.data.confidence * 100)}%
  </div>
)}

// Applied changes list
{message.data?.appliedChanges && message.data.appliedChanges.length > 0 && (
  <div className="mt-2 p-2 bg-purple-50 rounded">
    <div className="font-semibold text-sm mb-1">What changed:</div>
    <ul className="text-xs space-y-1">
      {message.data.appliedChanges.slice(0, 5).map((change, i) => (
        <li key={i}>• {change}</li>
      ))}
    </ul>
  </div>
)}
```

### 3. Display Corrected Code

```tsx
{message.data?.correctedCode && (
  <div className="mt-2">
    <div className="flex justify-between items-center mb-1">
      <span className="font-semibold text-sm">Corrected Code:</span>
      <button
        onClick={() => copyToClipboard(message.data.correctedCode!)}
        className="text-xs text-blue-600 hover:text-blue-800"
      >
        📋 Copy
      </button>
    </div>
    <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto">
      <code>{message.data.correctedCode}</code>
    </pre>
  </div>
)}
```

## Components Already Updated

✅ **GlobalRenataAgent.tsx** - Full self-correction UI support
✅ **StandaloneRenataChat.tsx** - Uses API (auto-correction works)
✅ **All components using `/api/renata/chat`** - Auto-correction enabled

## Components That May Need Updates

These components use the API but might benefit from UI enhancements:

- `src/components/AguiRenataChat.tsx`
- `src/components/RenataCompact.tsx`
- `src/components/RenataModal.tsx`
- `src/components/RenataPopup.tsx`

## Minimal Integration

If you want the bare minimum, just ensure your component:

1. **Passes session ID** in the context:
```typescript
const response = await fetch('/api/renata/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: userMessage,
    context: {
      sessionId: 'your-session-id',  // Important for memory!
      // ... other context
    }
  })
});
```

2. **Preserves response data**:
```typescript
const data = await response.json();
setMessage({
  content: data.message,
  data: data.data  // Preserve this for self-correction
});
```

## Testing Self-Correction

To test if self-correction works in your component:

1. Generate some code with Renata
2. Type: "That's wrong, fix it"
3. Verify:
   - Response has `type: 'self_correction'`
   - `data.correctedCode` contains fixed code
   - `data.appliedChanges` shows what changed
   - `data.confidence` shows confidence score

## API Response Format

### Self-Correction Response

```json
{
  "message": "✅ I've fixed the code...",
  "type": "self_correction",
  "data": {
    "correctedCode": "def scanner():...",
    "confidence": 0.85,
    "appliedChanges": [
      "Added line 5: import pandas as pd",
      "Modified line 42: volume calculation"
    ],
    "requiresManualIntervention": false
  },
  "timestamp": "2025-12-29T...",
  "context": {
    "selfCorrectionMode": true,
    "feedbackType": "auto_corrected"
  },
  "ai_engine": "Renata Self-Correction System"
}
```

### Normal Response (unchanged)

```json
{
  "message": "Here's your code...",
  "type": "format",
  "data": {
    "formattedCode": "def scanner():..."
  },
  "timestamp": "2025-12-29T...",
  "context": {...},
  "ai_engine": "Enhanced Renata..."
}
```

## Session Management Best Practices

### 1. Use Consistent Session IDs

```typescript
// Good: Persistent session
const sessionId = useMemo(() =>
  crypto.randomUUID?.() || `session-${Date.now()}`, []
);

// Bad: Random ID each request
const sessionId = `session-${Date.now()}`;  // New ID = No memory!
```

### 2. Include Session ID in Context

```typescript
const context = {
  sessionId: sessionId,
  page: window.location.pathname,
  timestamp: new Date().toISOString(),
  // ... other context
};
```

### 3. Handle Session Reset (Optional)

```typescript
// If you want to clear memory
const clearConversation = () => {
  // Just generate a new session ID
  setSessionId(crypto.randomUUID?.() || `session-${Date.now()}`);
};

<button onClick={clearConversation}>
  Start New Conversation
</button>
```

## Troubleshooting

**Issue**: Self-correction not working

**Check**:
1. Is `sessionId` in the context?
2. Was code generated in the current session?
3. Is the feedback phrase recognized?

**Debug**:
```typescript
console.log('Session ID:', context.sessionId);
console.log('Response type:', data.type);
console.log('Self-correction data:', data.data);
```

**Issue**: Can't see previous code in correction

**Check**:
1. Was code stored in conversation history?
2. Is the session ID consistent?

**Fix**: Make sure you're using the same session ID for the entire conversation

## Summary

The self-correction system works automatically for all components using `/api/renata/chat`. Frontend UI enhancements are optional but improve user experience by:

- Showing visual indicators (purple badge)
- Displaying confidence scores
- Listing applied changes
- Providing corrected code with copy button

**Minimum requirement**: Just pass a consistent `sessionId` in the context!

**For best UX**: Add visual indicators and proper styling for self-correction responses.
