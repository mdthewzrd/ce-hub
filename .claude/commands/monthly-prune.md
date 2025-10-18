# Monthly Prune Command

Archive old chat files and cleanup the CE-Hub chat system.

**PLAN MODE REQUIRED**: This command requires planning approval before execution.

Run the monthly pruning script:

```bash
cd "/Users/michaeldurante/ai dev/ce-hub"
python3 scripts/monthly_prune.py --days 30
```

Usage: `/monthly-prune`

This command will:
1. Find chat files older than 30 days
2. Ensure summaries exist before archival
3. Move old files to archive directory
4. Generate cleanup report