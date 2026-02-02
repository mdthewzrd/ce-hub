"""
FastAPI Endpoints for Instagram Caption Engine
RESTful API for generating, managing, and scoring captions
"""

import os
import sys
from pathlib import Path
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
import uvicorn

# Load environment variables from .env.local
env_path = Path(__file__).parent.parent.parent / ".env.local"
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key.strip()] = value.strip()

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from caption_generator import CaptionGenerator, CaptionData, format_caption_for_display
from quality_scorer import score_caption_and_suggest
from database_schema import DB_PATH, init_database
import sqlite3
import json


# Pydantic models for API
class CaptionRequest(BaseModel):
    category: str = Field(description="Content category (fitness, motivation, business, etc.)")
    theme: str = Field(description="Specific theme or topic")
    target_keyword: str = Field(default="FREE", description="ManyChat trigger keyword")
    context: str = Field(default="", description="Additional context")
    emotion: str = Field(default="inspiring", description="Target emotion")
    use_premium: bool = Field(default=False, description="Use premium model")


class BatchCaptionRequest(BaseModel):
    items: List[CaptionRequest]
    use_premium: bool = Field(default=False, description="Use premium model for all")


class ScoreRequest(BaseModel):
    caption: str = Field(description="Caption text to score")
    category: str = Field(default="general", description="Content category")


class CaptionResponse(BaseModel):
    success: bool
    caption_id: Optional[int] = None
    hook: Optional[str] = None
    story: Optional[str] = None
    value: Optional[str] = None
    cta_comment: Optional[str] = None
    cta_follow: Optional[str] = None
    full_caption: Optional[str] = None
    hashtags: Optional[str] = None
    model_used: Optional[str] = None
    cost: Optional[float] = None
    error: Optional[str] = None


class ScoreResponse(BaseModel):
    overall_score: float
    grade: str
    breakdown: dict
    issues: List[str]
    suggestions: List[str]


class QueueItem(BaseModel):
    video_url: str
    caption_id: int
    scheduled_at: Optional[str] = None


# Initialize FastAPI app
app = FastAPI(
    title="Instagram Caption Engine",
    description="AI-powered caption generation for Instagram automation",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize caption generator (lazy load)
generator = None


def get_generator():
    """Get or initialize caption generator"""
    global generator
    if generator is None:
        api_key = os.getenv("OPENROUTER_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=500,
                detail="OPENROUTER_API_KEY not configured"
            )
        generator = CaptionGenerator(openrouter_api_key=api_key)
    return generator


# Health check
@app.get("/")
async def root():
    return {
        "status": "running",
        "service": "Instagram Caption Engine",
        "version": "1.0.0",
        "endpoints": {
            "generate": "/api/generate",
            "batch": "/api/batch",
            "score": "/api/score",
            "captions": "/api/captions",
            "queue": "/api/queue"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check database exists
        if os.path.exists(DB_PATH):
            db_status = "connected"
        else:
            db_status = "not_initialized"

        # Check API key
        api_key = os.getenv("OPENROUTER_API_KEY")
        api_status = "configured" if api_key else "not_configured"

        return {
            "status": "healthy",
            "database": db_status,
            "openrouter_api": api_status
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Generate single caption
@app.post("/api/generate", response_model=CaptionResponse)
async def generate_caption(request: CaptionRequest):
    """Generate a single caption"""
    try:
        gen = get_generator()
        caption = gen.generate_caption(
            category=request.category,
            theme=request.theme,
            target_keyword=request.target_keyword,
            context=request.context,
            emotion=request.emotion,
            use_premium=request.use_premium
        )

        if not caption:
            return CaptionResponse(
                success=False,
                error="Failed to generate caption"
            )

        # Get caption ID from database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id FROM captions ORDER BY created_at DESC LIMIT 1"
        )
        row = cursor.fetchone()
        caption_id = row[0] if row else None
        conn.close()

        return CaptionResponse(
            success=True,
            caption_id=caption_id,
            hook=caption.hook,
            story=caption.story,
            value=caption.value,
            cta_comment=caption.cta_comment,
            cta_follow=caption.cta_follow,
            full_caption=caption.full_caption,
            hashtags=caption.hashtags,
            model_used=caption.generation_model,
            cost=gen.stats["total_cost"]
        )

    except Exception as e:
        return CaptionResponse(
            success=False,
            error=str(e)
        )


# Generate batch captions
@app.post("/api/batch")
async def generate_batch(request: BatchCaptionRequest, background_tasks: BackgroundTasks):
    """Generate multiple captions in background"""
    try:
        gen = get_generator()

        # Run in background
        def generate_in_background():
            gen.generate_batch(
                items=[item.dict() for item in request.items],
                use_premium=request.use_premium
            )

        background_tasks.add_task(generate_in_background)

        return {
            "success": True,
            "message": f"Generating {len(request.items)} captions in background",
            "count": len(request.items)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Score caption
@app.post("/api/score", response_model=ScoreResponse)
async def score_caption(request: ScoreRequest):
    """Score a caption for quality"""
    try:
        result = score_caption_and_suggest(
            caption=request.caption,
            category=request.category
        )
        return ScoreResponse(**result)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Get caption from database
@app.get("/api/captions/{caption_id}")
async def get_caption(caption_id: int):
    """Retrieve a caption by ID"""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM captions WHERE id = ?
        """, (caption_id,))

        row = cursor.fetchone()
        conn.close()

        if not row:
            raise HTTPException(status_code=404, detail="Caption not found")

        return dict(row)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# List captions with filters
@app.get("/api/captions")
async def list_captions(
    status: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 50
):
    """List captions with optional filters"""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        query = "SELECT * FROM captions WHERE 1=1"
        params = []

        if status:
            query += " AND status = ?"
            params.append(status)

        if category:
            query += " AND category = ?"
            params.append(category)

        query += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)

        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()

        return {
            "count": len(rows),
            "captions": [dict(row) for row in rows]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Update caption status
@app.put("/api/captions/{caption_id}/status")
async def update_caption_status(caption_id: int, status: str):
    """Update caption status (pending, approved, rejected, posted)"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE captions
            SET status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (status, caption_id))

        conn.commit()
        conn.close()

        return {"success": True, "caption_id": caption_id, "status": status}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Add to content queue
@app.post("/api/queue")
async def add_to_queue(item: QueueItem):
    """Add caption + video to content posting queue"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO content_queue
            (video_url, caption_id, scheduled_at, post_status)
            VALUES (?, ?, ?, 'pending')
        """, (item.video_url, item.caption_id, item.scheduled_at))

        queue_id = cursor.lastrowid
        conn.commit()
        conn.close()

        return {
            "success": True,
            "queue_id": queue_id,
            "message": "Added to posting queue"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Get queue status
@app.get("/api/queue")
async def get_queue(status: Optional[str] = None):
    """Get content posting queue"""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        query = """
            SELECT cq.*, c.full_caption, c.category
            FROM content_queue cq
            LEFT JOIN captions c ON cq.caption_id = c.id
            WHERE 1=1
        """
        params = []

        if status:
            query += " AND cq.post_status = ?"
            params.append(status)

        query += " ORDER BY cq.created_at DESC"

        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()

        return {
            "count": len(rows),
            "items": [dict(row) for row in rows]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Get generation stats
@app.get("/api/stats")
async def get_stats():
    """Get generation statistics"""
    try:
        gen = get_generator()
        return {
            "total_generated": gen.stats["total_generated"],
            "ai_generated": gen.stats["ai_generated"],
            "template_fallback": gen.stats["template_fallback"],
            "total_cost": gen.stats["total_cost"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Run server
if __name__ == "__main__":
    # Initialize database
    init_database()

    print("\n" + "=" * 50)
    print("🚀 INSTAGRAM CAPTION ENGINE API")
    print("=" * 50)
    print("\nServer starting on http://localhost:3132")
    print("API docs: http://localhost:3132/docs")
    print("\nEndpoints:")
    print("  POST /api/generate - Generate single caption")
    print("  POST /api/batch - Generate batch captions")
    print("  POST /api/score - Score caption quality")
    print("  GET  /api/captions - List captions")
    print("  POST /api/queue - Add to posting queue")
    print("  GET  /api/stats - Generation statistics")
    print("\n" + "=" * 50)

    uvicorn.run(app, host="0.0.0.0", port=3132)
