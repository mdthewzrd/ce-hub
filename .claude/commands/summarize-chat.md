# Summarize Chat Command

Create a structured summary of the current chat for Archon ingestion.

**PLAN MODE REQUIRED**: This command requires planning approval before execution.

Run the chat manager to create a summary:

```bash
cd "/Users/michaeldurante/ai dev/ce-hub"
python3 scripts/chat_manager.py summarize-chat --file "$1"
```

Usage: `/summarize-chat <chat-file>`

Example:
- `/summarize-chat "chats/active/2025-10-10__ce-hub__testing__v1.md"`