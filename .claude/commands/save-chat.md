# Save Chat Command

Save the current conversation to a CE-Hub chat file for future loading and context management.

**PLAN MODE REQUIRED**: This command requires planning approval before execution.

Create a comprehensive summary of the current conversation and save it to the active chats directory:

```bash
cd "/Users/michaeldurante/ai dev/ce-hub"
python3 scripts/chat_manager.py save-chat "$1" "$2" --project ce-hub
```

Usage: `/save-chat <topic> <content-summary>`

The command will:
1. Create a properly formatted chat file in `chats/active/`
2. Include CE-Hub compliant metadata with tags
3. Format content for future loading and context management
4. Enable the chat to be loaded in future sessions

Example:
- `/save-chat "traderra-dashboard-implementation" "Winners/Losers dashboard reorganization, trade data updates, component architecture decisions"`

The saved chat can then be loaded using:
- `/load-chat traderra-dashboard-implementation`