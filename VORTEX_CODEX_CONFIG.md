# 🎯 VORTEX CODEX - MASTER CONFIGURATION

**Version**: 2.0
**Last Updated**: 2026-01-01
**Project ID**: 2859ee09-9e19-4b48-b6e3-f635ec8a7018

---

## 📊 **SYSTEM OVERVIEW**

Complete Video-to-Book Creation System with cost-optimized OpenRouter models.

### 🎯 **Primary Goal**
Transform video content into professionally formatted books with:
- **Cost**: ~$2-4/month (vs ~$1,200-1,500 with Claude 3.5)
- **Quality**: Frontier-model level output
- **Speed**: Parallel processing of multiple videos
- **Scalability**: Support for 400+ page books from 30+ videos

---

## 🤖 **MODEL CONFIGURATION**

### Primary Models (Production)

| Agent | Model | Model ID | Input Cost | Output Cost | Context |
|-------|-------|----------|------------|-------------|---------|
| **Video Transcription** | ByteDance Seed 1.6 Flash | `bytedance-seed/seed-1.6-flash` | $0.075/M | $0.30/M | 256K |
| **Book Writing** | Xiaomi MiMo-V2-Flash | `xiaomi/mimo-v2-flash:free` | **$0** | **$0** | 256K |
| **Diagram Generation** | Mistral Devstral 2 | `mistralai/devstral-2512:free` | **$0** | **$0** | 256K |
| **Orchestration** | GLM-4.6 | Z.ai integration | **$0** | **$0** | 128K |

### Fallback Models (If Primary Unavailable)

| Purpose | Model | Model ID | Input | Output | Context |
|---------|-------|----------|-------|--------|--------|
| **Ultra-Cheap Backup** | NVIDIA Nemotron 3 Nano | `nvidia/nemotron-3-nano-30b-a3b` | $0.06/M | $0.24/M | 256K |
| **Creative Writing** | Mistral Small Creative | `mistralai/mistral-small-creative` | $0.10/M | $0.30/M | 32K |
| **Programming Tasks** | EssentialAI Rnj 1 | `essentialai/rnj-1-instruct` | $0.15/M | $0.15/M | 32K |
| **Enhanced Reasoning** | GLM-4.7 | `z-ai/glm-4.7` | $0.40/M | $1.50/M | 202K |

---

## 💰 **COST BREAKDOWN**

### Per 200-Page Book (Typical Project)

| Component | Videos/Docs | Tokens | Cost |
|-----------|-------------|--------|------|
| **Video Transcription** | 30 videos × 1hr | 450K input / 900K output | ~$2-4 |
| **Book Writing** | 200 pages | 4M input / 1.6M output | **$0** |
| **Diagram Generation** | 50 diagrams | 250K input / 150K output | **$0** |
| **Orchestration** | Project mgmt | 100K tokens | **$0** |
| | | | |
| **TOTAL** | | | **~$2-4** |

### Comparison with Alternatives

| Solution | Monthly Cost | Annual Cost | Savings |
|----------|--------------|-------------|---------|
| **Vortex Codex (Optimized)** | ~$2-4 | ~$24-48 | **Baseline** |
| Claude 3.5 Sonnet (All Tasks) | ~$1,200-1,500 | ~$14,400-18,000 | **99.7%** |
| GPT-4o (All Tasks) | ~$800-1,000 | ~$9,600-12,000 | **99.5%** |
| Gemini Pro (All Tasks) | ~$400-600 | ~$4,800-7,200 | **99%** |

---

## 🔧 **OPENROUTER API SETUP**

### 1. Get API Key
```bash
# Visit: https://openrouter.ai/keys
# Create account and generate API key
export OPENROUTER_API_KEY="sk-or-v1-your-key-here"
```

### 2. Python Client Setup
```python
import openai

client = openai.OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key="YOUR_OPENROUTER_API_KEY"
)

# Example: Transcribe video
response = client.chat.completions.create(
    model="bytedance-seed/seed-1.6-flash",
    messages=[
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "Transcribe this video to book-ready text:"},
                {"type": "image_url", "image_url": {"url": "https://example.com/video.mp4"}}
            ]
        }
    ]
)
```

### 3. Model Configuration File
```python
# config/models.py
MODELS = {
    "transcription": {
        "primary": "bytedance-seed/seed-1.6-flash",
        "fallback": "z-ai/glm-4.6v",
        "pricing": {"input": 0.075, "output": 0.30},
        "context": 262144
    },
    "writing": {
        "primary": "xiaomi/mimo-v2-flash:free",
        "fallback": "mistralai/mistral-small-creative",
        "pricing": {"input": 0.0, "output": 0.0},
        "context": 262144
    },
    "diagram": {
        "primary": "mistralai/devstral-2512:free",
        "fallback": "nvidia/nemotron-3-nano-30b-a3b",
        "pricing": {"input": 0.0, "output": 0.0},
        "context": 262144
    },
    "orchestration": {
        "primary": "z-ai/glm-4.6",
        "fallback": "nvidia/nemotron-3-nano-30b-a3b",
        "pricing": {"input": 0.0, "output": 0.0},
        "context": 131072
    }
}
```

---

## 📁 **FILE STRUCTURE**

```
ce-hub/
├── agents/                                    # Agent specifications
│   ├── video-transcription-agent.md           # ByteDance Seed 1.6 Flash
│   ├── book-writing-agent.md                 # Xiaomi MiMo-V2-Flash (FREE)
│   ├── diagram-image-agent.md                # Mistral Devstral 2 (FREE)
│   └── orchestration-agent.md                 # GLM-4.6 coordination
│
├── config/                                    # Configuration files
│   ├── models.py                              # Model IDs and pricing
│   ├── openrouter.yaml                       # OpenRouter settings
│   └── project_template.json                 # Project structure template
│
└── workflows/                                 # Automation scripts
    ├── transcribe_videos.py                  # Video transcription workflow
    ├── generate_book.py                      # Book generation workflow
    ├── create_diagrams.py                     # Diagram creation workflow
    └── full_pipeline.py                       # End-to-end orchestration
```

---

## 🔄 **WORKFLOW PIPELINE**

### Sequential Workflow (Single Video)
```
┌─────────────┐
│  VIDEO URL  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  1. TRANSCRIPTION (ByteDance Seed 1.6 Flash)              │
│     Input: Video URL                                       │
│     Output: Book-ready transcript                          │
│     Cost: ~$0.006 per video                                │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  2. BOOK WRITING (MiMo-V2-Flash - FREE)                     │
│     Input: Transcript + chapter outline                     │
│     Output: Formatted chapter content                       │
│     Cost: $0.00                                            │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  3. DIAGRAM GENERATION (Devstral 2 - FREE)                  │
│     Input: Key concepts from chapter                        │
│     Output: Mermaid/PlantUML diagram code                   │
│     Cost: $0.00                                            │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  4. INTEGRATION (GLM-4.6 - FREE)                            │
│     Input: Chapter + diagrams                               │
│     Output: Complete chapter with visuals                    │
│     Cost: $0.00                                            │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────┐
│  COMPLETE   │
│   CHAPTER   │
└─────────────┘
```

### Parallel Workflow (Multiple Videos)
```
                    ┌──────────────────────────────────┐
                    │   ORCHESTRATOR (GLM-4.6)        │
                    └──────┬─────────────┬────────────┘
                           │             │
              ┌────────────┐       ┌────────────┐       ┌────────────┐
              │  VIDEO 1   │       │  VIDEO 2   │  ...  │  VIDEO N   │
              └─────┬──────┘       └─────┬──────┘       └─────┬──────┘
                    │                    │                    │
         ┌──────────┼──────────┐         │                    │
         │          │          │         │                    │
    Transcribe   Write    Diagram    (Repeat for each video)  │
         │          │          │         │                    │
         └──────────┴──────────┘         │                    │
                   │                     │                    │
                   └─────────────────────┴────────────────────┘
                                       │
                                       ▼
                              ┌────────────────┐
                              │ FINAL BOOK     │
                              │ ASSEMBLY       │
                              └────────────────┘
```

---

## 🎯 **QUALITY ASSURANCE**

### Model Quality Benchmarks

| Model | Benchmark | Score | Comparison |
|-------|-----------|-------|------------|
| **MiMo-V2-Flash** | SWE-bench Verified | #1 Open Source | Sonnet 4.5 level |
| **Devstral 2** | Agentic Coding | State-of-the-art | Frontier code gen |
| **ByteDance Seed 1.6** | Multimodal | High | Near-frontier video |
| **GLM-4.6** | General | Good | Sufficient for orchestration |

### Quality Gates

1. **Transcription Quality**: 95%+ accuracy on clear speech
2. **Writing Quality**: Professional prose, consistent style
3. **Diagram Accuracy**: Syntactically correct Mermaid/PlantUML
4. **Integration Quality**: Smooth transitions, no contradictions

### Escalation Triggers

- **Quality score < 85%**: Switch to higher-tier model
- **User dissatisfaction**: Manual review and revision
- **Complex edge cases**: Use GLM-4.7 or frontier models
- **Technical terminology**: Validate with domain expert

---

## 📋 **PROJECT TEMPLATE**

```json
{
  "project_id": "vortex-codex-001",
  "project_name": "Video Series to Book",
  "created_at": "2026-01-01T00:00:00Z",
  "status": "in_progress",

  "model_strategy": {
    "transcription": {
      "model": "bytedance-seed/seed-1.6-flash",
      "fallback": "z-ai/glm-4.6v",
      "cost_budget": 5.00,
      "current_spend": 0.00
    },
    "writing": {
      "model": "xiaomi/mimo-v2-flash:free",
      "fallback": "mistralai/mistral-small-creative",
      "cost_budget": 0.00,
      "current_spend": 0.00
    },
    "diagrams": {
      "model": "mistralai/devstral-2512:free",
      "fallback": "nvidia/nemotron-3-nano-30b-a3b",
      "cost_budget": 0.00,
      "current_spend": 0.00
    }
  },

  "content_sources": {
    "videos": [
      {
        "id": "v1",
        "url": "https://youtube.com/watch?v=xxx",
        "title": "Chapter 1: Introduction",
        "status": "pending",
        "transcript": null,
        "chapter": null
      }
    ],
    "diagrams": [
      {
        "id": "d1",
        "concept": "Identity search process",
        "chapter_ref": "v1",
        "status": "pending",
        "diagram_code": null
      }
    ]
  },

  "deliverables": {
    "formats": ["pdf", "epub", "markdown"],
    "page_count_target": 200,
    "current_page_count": 0
  },

  "quality_metrics": {
    "overall_quality": 0.0,
    "consistency_score": 0.0,
    "completeness": 0.0
  }
}
```

---

## 🚀 **QUICK START**

### 1. Initial Setup
```bash
# Install dependencies
pip install openai archon-mcp

# Set API key
export OPENROUTER_API_KEY="your-key-here"

# Test connection
python -c "import openai; client = openai.OpenAI(base_url='https://openrouter.ai/api/v1', api_key='$OPENROUTER_API_KEY'); print(client.models.list())"
```

### 2. Transcribe a Video
```python
from workflows.transcribe_videos import transcribe

url = "https://youtube.com/watch?v=xxx"
transcript = transcribe(url, model="bytedance-seed/seed-1.6-flash")
print(transcript)
```

### 3. Generate a Chapter
```python
from workflows.generate_book import write_chapter

chapter = write_chapter(
    transcript=transcript,
    chapter_number=1,
    model="xiaomi/mimo-v2-flash:free"
)
print(chapter)
```

### 4. Create Diagrams
```python
from workflows.create_diagrams import generate_diagram

diagram = generate_diagram(
    concept="Identity search process",
    diagram_type="flowchart",
    model="mistralai/devstral-2512:free"
)
print(diagram)  # Mermaid code
```

### 5. Run Full Pipeline
```python
from workflows.full_pipeline import create_book

book = create_book(
    video_urls=["url1", "url2", "url3"],
    project_name="My Book",
    output_formats=["pdf", "epub"]
)
print(f"Book created: {book['output_path']}")
```

---

## 📊 **MONITORING & TRACKING**

### Metrics to Track

| Metric | Description | Target |
|--------|-------------|--------|
| **Cost per project** | Total API spend | < $10 |
| **Quality score** | Content quality rating | > 0.85 |
| **Completion time** | End-to-end duration | < 24 hours |
| **Token efficiency** | Tokens per page | < 20K |

### Logging

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('vortex_codex.log'),
        logging.StreamHandler()
    ]
)
```

---

## 🔐 **SECURITY & BEST PRACTICES**

1. **API Key Management**: Never commit API keys to git
2. **Rate Limiting**: Implement exponential backoff for retries
3. **Cost Caps**: Set maximum spend limits per project
4. **Data Privacy**: Don't upload sensitive content to external APIs
5. **Quality Validation**: Always review generated content before publication

---

## 📞 **SUPPORT & RESOURCES**

- **Archon Project**: `2859ee09-9e19-4b48-b6e3-f635ec8a7018`
- **OpenRouter Docs**: https://openrouter.ai/docs
- **OpenRouter Models**: https://openrouter.ai/models
- **Agent Specifications**: `/Users/michaeldurante/ai dev/ce-hub/agents/`

---

**Configuration Last Updated**: 2026-01-01
**System Version**: 2.0
**Total Monthly Operating Cost**: ~$2-4
