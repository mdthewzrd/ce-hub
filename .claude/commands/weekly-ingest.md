# Weekly Ingest Command

Ingest chat summaries into Archon knowledge graph for systematic intelligence accumulation.

**PLAN MODE REQUIRED**: This command requires planning approval before execution.

Run the weekly ingestion script:

```bash
cd "/Users/michaeldurante/ai dev/ce-hub"
python3 scripts/weekly_ingest.py --since 7
```

Usage: `/weekly-ingest`

This command will:
1. Find all chat summaries from the last 7 days
2. Prepare them for Archon ingestion with proper tagging
3. Execute the ingestion via MCP protocol
4. Generate ingestion report