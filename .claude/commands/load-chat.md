# Load Chat Command

Load a previously saved chat conversation to continue work with full context.

**PLAN MODE REQUIRED**: This command requires planning approval before execution.

Load an existing chat file from the active chats directory:

```bash
cd "/Users/michaeldurante/ai dev/ce-hub"
python3 scripts/chat_manager.py load-chat "$1" --project ce-hub
```

Usage: `/load-chat <topic-or-pattern>`

The command will:
1. Search for matching chat files in `chats/active/`
2. Load the most recent matching chat
3. Display associated summary context if available
4. Show the last 20 conversation entries by default

Special keywords:
- `/load-chat recent` - Load the most recently modified chat file
- `/load-chat <partial-topic>` - Fuzzy search for matching topics

Example:
- `/load-chat "traderra-dashboard"` - Load chat about Traderra dashboard work
- `/load-chat recent` - Load the most recent chat session
- `/load-chat "winners-losers"` - Search for chats about winners/losers implementation

The loaded context will include:
- Original chat metadata and timeline
- Related summary information
- Recent conversation history
- Proper context for continuing the work session