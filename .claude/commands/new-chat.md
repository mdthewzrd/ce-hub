# New Chat Command

Create a new CE-Hub chat file with structured metadata and Vision Artifact alignment.

Run the chat manager to create a new chat session:

```bash
cd "/Users/michaeldurante/ai dev/ce-hub"
python3 scripts/chat_manager.py new-chat --topic "$1" --project "${2:-ce-hub}"
```

Usage: `/new-chat <topic> [project]`

Examples:
- `/new-chat "Testing Archon Integration"`
- `/new-chat "Frontend Development" frontend-project`