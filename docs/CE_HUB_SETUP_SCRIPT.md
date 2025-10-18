# 📘 CE‑Hub Setup Script (Claude Code × Archon × Context Engineering)
**Use this inside Claude Code / Cursor in Plan Mode.**  
Copy each **Message** into a fresh chat turn, review the Plan Claude proposes, then **Approve** when ready.

---

## ✅ Pre‑Flight Checklist (do once, before messaging Claude)
1) **Archon running**  
   - Terminal:
     ```bash
     cd ~/ai-dev/archon
     docker compose up -d
     curl http://localhost:8051/health
     ```
     Expect: `{"status":"ok"}`

2) **Open IDE at your hub**  
   - `~/ai-dev/ce-hub` (this is your working repo)
   - In IDE settings: turn ON **Include CLAUDE.md in context**
   - Ensure **Auto-Accept** is **OFF** (we stay in Plan Mode unless approved).

3) **Minimum files present** (Claude can scaffold if missing)
```
ce-hub/
├─ CLAUDE.md
├─ docs/
│  ├─ ARCHITECTURE.md
│  ├─ CE_GUIDE.md
│  ├─ CE_RULES.md
│  ├─ DECISIONS.md
│  └─ VISION_ARTIFACT.md        # you can create this during Step 5.5
├─ tools/prompts/prp-template.md
├─ agents/
│  ├─ orchestrator.md
│  ├─ researcher.md
│  ├─ engineer.md
│  ├─ tester.md
│  ├─ documenter.md
│  └─ registry.json
└─ .claude/settings.json
```

---

## 🧩 Step 1 — Initialize Context & Scan Repo
**Message:**  
> You are the **Orchestrator** for my Context Engineering Hub. Read: `CLAUDE.md`, `docs/ARCHITECTURE.md`, `docs/CE_GUIDE.md`, `docs/CE_RULES.md`, and all files in `agents/`. Summarize your understanding in ≤10 bullets, then list any missing/empty/incomplete files. Propose a file creation plan and **wait for approval**.

**Approve when:** The summary matches your intent and the file plan looks sensible.

---

## ⚙️ Step 2 — Scaffold Missing/Incomplete Files
**Message:**  
> Proceed to create all missing/empty files from your plan. Show the write plan (paths + brief contents) before writing. After approval, write them and report a list of created files.

**Approve when:** Paths and contents are correct and minimal.

---

## 🔗 Step 3 — Verify Archon MCP Connection
**Message:**  
> Verify Archon MCP at `http://localhost:8051`. List available MCP tools with one‑line descriptions. If unreachable, propose exact fix steps and **pause**.

**Approve when:** Tools are listed (e.g., `find_projects`, `manage_task`, `rag_search_knowledge_base`, etc.).

---

## 🧱 Step 4 — Ensure/Create Archon Project “CE Hub Setup”
**Message:**  
> Using MCP, list projects. If “CE Hub Setup” is missing, create it with: description “Initialize and test the full CE ecosystem.” Tags: `scope:meta`, `status:active`. Show the MCP plan (create/list requests) before executing.

**Approve when:** The project exists and Claude returns its `project_id`.

---

## 🧾 Step 5 — Create Initial Setup Tasks in Archon
**Message:**  
> In project “CE Hub Setup”, create tasks (**status: "todo"**; include descriptions + task_order):  
> - **PRP‑01**: Validate Knowledge Sources and Tagging — check that RAG sources are indexed, tags present, embedding health OK; produce a knowledge report.  
> - **PRP‑02**: Create Agent SOP Files — generate detailed SOPs for Architect, Researcher, Engineer, Tester, Documenter.  
> - **PRP‑03**: Configure Claude Code Integration — validate `.claude/settings.json` and subagent paths.  
> - **PRP‑04**: Run First CE Cycle Test — full CE loop demo.  
> Show MCP plan, then execute and return the **task_ids**.

**Approve when:** You see 4 task IDs. Save them.

---

## 📦 Step 5.5 — Add Knowledge Sources (before starting PRP‑01)
*(Do this so PRP‑01 has content to analyze)*

**Message:**  
> Using Archon MCP, add these knowledge sources (show create plan first; then execute, then verify index status):  
> 1) Git repo: `https://github.com/coleam00/context-engineering-intro` (depth=2; tags: `scope:global`, `domain:context-engineering`, `type:guide`)  
> 2) Git repo (subfolder okay at depth 2): `https://github.com/coleam00/context-engineering-intro/tree/main/use-cases/agent-factory-with-subagents` (tags: `scope:agent`, `domain:context-engineering`, `type:examples`)  
> 3) Upload or index my local CE‑Hub docs (`docs/*.md`) with tags: `scope:meta`, `type:docs`.  
> After ingestion, verify each source shows **Indexed** with non‑zero embeddings. If any fail, propose recrawl or fix steps.

**Approve when:** You see sources indexed and tagged as requested.

---

## 🌟 Step 5.6 — Create/Refine Vision Artifact (recommended)
**Message:**  
> Create or refine `docs/VISION_ARTIFACT.md` summarizing the CE‑Hub mission, philosophy, environment layers (Archon/CE‑Hub/Subagents/IDE), workflow (Plan→Research→Produce→Ingest), success criteria, and roadmap. Show the plan first; then write the file. Prepare to ingest it into Archon with tags `scope:meta`, `type:docs`.

**Approve when:** The artifact matches your intent.

---

## 🧠 Step 6 — Begin CE Cycle for **PRP‑01** (Knowledge Validation)
**Message:**  
> Start CE cycle for project “CE Hub Setup”, task **PRP‑01**. Follow Archon‑First protocol. Draft a PRP using `tools/prompts/prp-template.md`. Plan should include: listing all sources, checking tags, running a tag‑filtered search in the RAG console, confirming embeddings present, and enumerating remediation steps. **Show PRP only; do not execute yet.**

**Approve when:** The PRP has: Intent, Proposed Changes/Checks, Research plan, Risks/Rollback, Acceptance checks, and will write `docs/KNOWLEDGE_REPORT.md`.

---

## ⚙️ Step 7 — Execute **PRP‑01** and Produce Knowledge Report
**Message:**  
> Execute PRP‑01. Verify sources and tag filters. Produce `docs/KNOWLEDGE_REPORT.md` including: source list, tag taxonomy in use, embedding counts, filtered query results, gaps/misses, and recommended actions (recrawls, new tags, or new sources).

**Approve when:** The report is created and informative.

---

## 🧩 Step 8 — Start CE Cycle for **PRP‑02** (Generate Agent SOPs)
**Message:**  
> Start CE cycle for **PRP‑02**. Using `docs/CE_RULES.md`, `docs/ARCHITECTURE.md`, and `docs/VISION_ARTIFACT.md`, generate detailed SOPs for **Orchestrator, Researcher, Engineer, Tester, Documenter**. Each SOP must include: Purpose, Responsibilities, Inputs, Outputs, Triggers, Protocol (step list), Escalation/rollback, End‑of‑task behaviors, and RAG utilization notes. Show PRP plan; then **wait for approval**.

**Approve when:** The SOP outlines fit your voice and workflow.

**Execute message (after approval):**  
> Execute PRP‑02 and write SOP files under `/agents/`. Confirm paths and summarize each file’s key bullets.

---

## 🔧 Step 9 — Start CE Cycle for **PRP‑03** (Integration Configuration)
**Message:**  
> Start CE cycle for **PRP‑03**. Validate `.claude/settings.json`: correct MCP URL (`http://localhost:8051`), subagent file paths, Plan Mode enabled, Auto‑Accept disabled. Validate `agents/registry.json` includes all new SOPs under `core`. Show the proposed **diffs**; **wait for approval** before writing.

**Approve when:** Diffs are correct (no path mistakes).

**Execute message (after approval):**  
> Execute PRP‑03, write the config updates, then re‑check MCP connectivity and report the tool list again.

---

## 🧪 Step 10 — Start CE Cycle for **PRP‑04** (First Full Workflow Test)
**Message:**  
> Start CE cycle for **PRP‑04**. Simulate a small project named “Agent Playground”. Orchestrator: pull next task; Researcher: RAG search on “Supabase authentication”; Architect/Orchestrator: draft PRP; Engineer: implement a minimal example (function or small module); Tester: validate acceptance checks; Documenter: write summary. Prepare to write `/PRPs/PRP‑04.md`. **Show the PRP plan; wait for approval.**

**Execute message (after approval):**  
> Execute PRP‑04. After completion, present the files changed, test output, and the path of the PRP file. Propose ingestion commands for the PRP and summary docs.

---

## 🧾 Step 11 — Close Tasks & Ingest Artifacts
**Message:**  
> Mark PRP‑01→PRP‑04 tasks **done** in Archon. Ingest `docs/KNOWLEDGE_REPORT.md`, `/PRPs/PRP‑04.md`, and any ADR updates into Archon with tags: `scope:meta`, `type:setup`. Confirm ingestion (source_ids).

**Approve when:** Claude lists source_ids returned by Archon.

---

## 🧠 Step 12 — System Verification & Next Steps
**Message:**  
> Create `docs/STATUS_REPORT.md` that summarizes: existing agents and files, Archon MCP health and tools, completed PRPs and where they were ingested, and confirmation that Plan Mode → PRP → Execute → Ingest loop is functional. Recommend the next three expansions (e.g., add AGUI+CopilotKit specialist, create domain collections, visualize PRP graph). Write the file and show a short summary here.

**Approve when:** The report is accurate and actionable.

---

## 🎯 Acceptance Criteria (end‑to‑end)
- **Archon**: reachable; knowledge sources indexed; tag filters work.
- **Claude Code**: Plan Mode honored; `.claude/settings.json` correct.
- **Agents**: SOPs exist and are loaded; Orchestrator can staff tasks.
- **Artifacts**: `docs/KNOWLEDGE_REPORT.md`, `/PRPs/PRP‑04.md`, `docs/STATUS_REPORT.md` exist.
- **Ingestion**: PRPs and docs are in Archon with tags; source_ids returned.

---

## 🆘 Troubleshooting Quickies
- **MCP fails** → `docker compose ps` (all healthy?), `curl http://localhost:8051/health`, check port 8051 conflicts.  
- **Tags don’t filter** → use the Knowledge Base/Console **Filter UI** (current builds don’t support inline `tag:` text).  
- **Subagent not found** → fix path in `.claude/settings.json` and ensure file exists in `/agents`.

---

## ✅ After this script
You’re ready to clone this CE‑Hub as a template for any new agent project and start adding specialists (e.g., `agents/agui-copilotkit-builder.md`) with their own domain collections in Archon.

