"""
FastAPI endpoints for Instagram Automation System
Integrates scraping, caption generation, posting, and analytics
"""

import os
import sys
from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import Optional, List
import uvicorn
from datetime import datetime, timedelta

# Import database schema
from database_schema import (
    DB_PATH, init_database, load_initial_categories,
    log_event, get_database_stats
)
import sqlite3

# ============================================================
# Pydantic Models
# ============================================================

class SourceContentModel(BaseModel):
    original_url: str
    account: str
    content_type: str = Field(description="reel, post, or story")
    original_likes: int = 0
    original_comments: int = 0
    original_shares: int = 0
    original_views: int = 0
    media_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    description: Optional[str] = None
    hashtags: Optional[str] = None
    engagement_rate: Optional[float] = None
    notes: Optional[str] = None


class PostedContentModel(BaseModel):
    caption_id: Optional[int] = None
    source_id: Optional[int] = None
    media_type: str = Field(description="reel, post, story, or carousel")
    affiliate_link: Optional[str] = None
    target_keyword: Optional[str] = None
    scheduled_for: Optional[str] = None


class ScraperTargetModel(BaseModel):
    account_username: str
    account_url: str
    scrape_reels: bool = True
    scrape_posts: bool = True
    scrape_stories: bool = False
    min_engagement_rate: float = 0
    max_age_days: int = 30


class GenerateCaptionRequest(BaseModel):
    source_id: int
    category: str = "motivation"
    target_keyword: str = "FREE"
    emotion: str = "inspiring"
    use_premium: bool = False


# ============================================================
# FastAPI App
# ============================================================

app = FastAPI(
    title="Instagram Automation API",
    description="Complete automation system for Instagram content management",
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


# ============================================================
# Health & Info Endpoints
# ============================================================

@app.get("/")
async def root():
    return {
        "status": "running",
        "service": "Instagram Automation API",
        "version": "1.0.0",
        "endpoints": {
            "scrape": "/api/scrape",
            "source": "/api/source",
            "posted": "/api/posted",
            "generate": "/api/generate",
            "schedule": "/api/schedule",
            "stats": "/api/stats"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        db_exists = os.path.exists(DB_PATH)
        return {
            "status": "healthy",
            "database": "connected" if db_exists else "not_initialized"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# Source Content Endpoints
# ============================================================

@app.post("/api/source")
async def add_source_content(content: SourceContentModel):
    """Add scraped content to the database"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # Check for duplicates
        cursor.execute("SELECT id FROM source_content WHERE original_url = ?", (content.original_url,))
        if cursor.fetchone():
            conn.close()
            return {"success": False, "error": "Content already exists"}

        # Calculate engagement rate if not provided
        engagement_rate = content.engagement_rate
        if engagement_rate is None:
            original_followers = getattr(content, 'original_followers', 0)
            if original_followers and original_followers > 0:
                engagement_rate = ((content.original_likes + content.original_comments) / original_followers) * 100
            else:
                engagement_rate = 0

        cursor.execute("""
            INSERT INTO source_content (
                original_url, account, content_type,
                original_likes, original_comments, original_shares, original_views,
                media_url, thumbnail_url, description, hashtags,
                engagement_rate, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            content.original_url, content.account, content.content_type,
            content.original_likes, content.original_comments, content.original_shares, content.original_views,
            content.media_url, content.thumbnail_url, content.description, content.hashtags,
            engagement_rate, content.notes
        ))

        source_id = cursor.lastrowid
        conn.commit()
        conn.close()

        log_event("INFO", "api", f"Added source content: {source_id}")

        return {"success": True, "source_id": source_id}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/source")
async def list_source_content(
    status: Optional[str] = None,
    content_type: Optional[str] = None,
    limit: int = 50
):
    """List source content with filters"""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        query = "SELECT * FROM source_content WHERE 1=1"
        params = []

        if status:
            query += " AND status = ?"
            params.append(status)

        if content_type:
            query += " AND content_type = ?"
            params.append(content_type)

        query += " ORDER BY scraped_at DESC LIMIT ?"
        params.append(limit)

        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()

        return {
            "count": len(rows),
            "items": [dict(row) for row in rows]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/source/{source_id}")
async def get_source_content(source_id: int):
    """Get specific source content"""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM source_content WHERE id = ?", (source_id,))
        row = cursor.fetchone()
        conn.close()

        if not row:
            raise HTTPException(status_code=404, detail="Source content not found")

        return dict(row)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# Posted Content Endpoints
# ============================================================

@app.post("/api/posted")
async def add_posted_content(content: PostedContentModel):
    """Add content to be posted"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO posted_content (
                source_id, caption_id, media_type,
                affiliate_link, target_keyword, scheduled_for
            ) VALUES (?, ?, ?, ?, ?, ?)
        """, (
            content.source_id, content.caption_id, content.media_type,
            content.affiliate_link, content.target_keyword, content.scheduled_for
        ))

        posted_id = cursor.lastrowid
        conn.commit()
        conn.close()

        log_event("INFO", "api", f"Added posted content: {posted_id}")

        return {"success": True, "posted_id": posted_id}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/posted")
async def list_posted_content(
    status: Optional[str] = None,
    limit: int = 50
):
    """List posted content"""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        query = "SELECT * FROM posted_content WHERE 1=1"
        params = []

        if status:
            query += " AND status = ?"
            params.append(status)

        query += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)

        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()

        return {
            "count": len(rows),
            "items": [dict(row) for row in rows]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/posted/{posted_id}/status")
async def update_posted_status(posted_id: int, status: str):
    """Update posted content status"""
    try:
        valid_statuses = ['draft', 'scheduled', 'posted', 'failed']
        if status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE posted_content
            SET status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (status, posted_id))

        conn.commit()
        conn.close()

        return {"success": True, "posted_id": posted_id, "status": status}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# Scraper Endpoints
# ============================================================

@app.post("/api/scraper/targets")
async def add_scraper_target(target: ScraperTargetModel):
    """Add a new scraping target"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO scraper_targets (
                account_username, account_url,
                scrape_reels, scrape_posts, scrape_stories,
                min_engagement_rate, max_age_days
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            target.account_username, target.account_url,
            target.scrape_reels, target.scrape_posts, target.scrape_stories,
            target.min_engagement_rate, target.max_age_days
        ))

        target_id = cursor.lastrowid
        conn.commit()
        conn.close()

        log_event("INFO", "scraper", f"Added scraper target: {target.account_username}")

        return {"success": True, "target_id": target_id}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/scraper/targets")
async def list_scraper_targets():
    """List all scraper targets"""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM scraper_targets ORDER BY created_at DESC")
        rows = cursor.fetchall()
        conn.close()

        return {
            "count": len(rows),
            "targets": [dict(row) for row in rows]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/scraper/targets/{target_id}")
async def delete_scraper_target(target_id: int):
    """Delete a scraper target"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute("DELETE FROM scraper_targets WHERE id = ?", (target_id,))
        success = cursor.rowcount > 0
        conn.commit()
        conn.close()

        return {"success": success}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/scraper/targets/{target_id}/toggle")
async def toggle_scraper_target(target_id: int):
    """Toggle scraper target active status"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE scraper_targets
            SET is_active = NOT is_active
            WHERE id = ?
        """, (target_id,))

        success = cursor.rowcount > 0
        conn.commit()
        conn.close()

        return {"success": success}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/scraper/run")
async def run_scraper(background_tasks: BackgroundTasks, max_items: int = 50):
    """
    Run scraper on all configured targets

    This triggers a background scraping job for all configured targets.
    The actual scraping happens asynchronously.
    """
    try:
        from scraper import InstagramScraper, ScraperMultiAccountScraper

        # Get all targets
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM scraper_targets WHERE is_active = 1")
        targets = cursor.fetchall()
        conn.close()

        if not targets:
            return {"success": False, "message": "No active scraper targets found"}

        # Create a scraper run record
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO scraper_runs (status, total_targets, started_at)
            VALUES ('running', ?, CURRENT_TIMESTAMP)
        """, (len(targets),))

        run_id = cursor.lastrowid
        conn.commit()
        conn.close()

        # Run scraper in background
        def run_scraping_job():
            try:
                import os
                # Initialize scraper (would need credentials from environment)
                username = os.getenv("INSTAGRAM_USERNAME")
                password = os.getenv("INSTAGRAM_PASSWORD")

                if not username or not password:
                    # Update run as failed
                    conn = sqlite3.connect(DB_PATH)
                    cursor = conn.cursor()
                    cursor.execute("""
                        UPDATE scraper_runs
                        SET status = 'failed', error_message = 'Instagram credentials not configured',
                            completed_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    """, (run_id,))
                    conn.commit()
                    conn.close()
                    return

                scraper = InstagramScraper(username=username, password=password)
                multi_scraper = ScraperMultiAccountScraper(scraper)

                results = []
                for target in targets:
                    try:
                        result = multi_scraper.scrape_and_save(
                            account_username=target['account_username'],
                            max_items=max_items or target.get('max_items', 50),
                            save_to_db=True
                        )
                        results.append({
                            "account": target['account_username'],
                            "success": True,
                            "items_scraped": len(result.get('medias', []))
                        })
                    except Exception as e:
                        results.append({
                            "account": target['account_username'],
                            "success": False,
                            "error": str(e)
                        })

                # Update run as completed
                total_scraped = sum(r.get('items_scraped', 0) for r in results if r.get('success'))
                successful = sum(1 for r in results if r.get('success'))

                conn = sqlite3.connect(DB_PATH)
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE scraper_runs
                    SET status = 'completed',
                        total_scraped = ?,
                        successful_targets = ?,
                        completed_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                """, (total_scraped, successful, run_id))
                conn.commit()
                conn.close()

            except Exception as e:
                # Update run as failed
                conn = sqlite3.connect(DB_PATH)
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE scraper_runs
                    SET status = 'failed', error_message = ?, completed_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                """, (str(e), run_id))
                conn.commit()
                conn.close()

        background_tasks.add_task(run_scraping_job)

        return {
            "success": True,
            "run_id": run_id,
            "message": f"Scraping {len(targets)} targets in background"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/scraper/runs")
async def list_scraper_runs(limit: int = 10):
    """Get recent scraper runs"""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM scraper_runs
            ORDER BY started_at DESC
            LIMIT ?
        """, (limit,))

        runs = [dict(row) for row in cursor.fetchall()]
        conn.close()

        return {
            "count": len(runs),
            "runs": runs
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/scraper/status")
async def get_scraper_status():
    """Get current scraper status"""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # Get active targets count
        cursor.execute("SELECT COUNT(*) as count FROM scraper_targets WHERE is_active = 1")
        active_targets = cursor.fetchone()['count']

        # Get latest run
        cursor.execute("""
            SELECT * FROM scraper_runs
            ORDER BY started_at DESC
            LIMIT 1
        """)
        latest_run = cursor.fetchone()

        # Get total scraped
        cursor.execute("""
            SELECT SUM(items_scraped) as total
            FROM scraper_runs
            WHERE status = 'completed'
        """)
        total_scraped = cursor.fetchone()['total'] or 0

        conn.close()

        return {
            "active_targets": active_targets,
            "total_scraped": total_scraped,
            "latest_run": dict(latest_run) if latest_run else None
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# Content Preparation Endpoints (Semi-Automated Workflow)
# ============================================================

class PrepareContentRequest(BaseModel):
    source_id: int
    category: str = "general"
    tone: str = "engaging"
    persona: Optional[str] = "expert"
    auto_schedule: bool = False
    schedule_delay_hours: int = 24


class ScheduleContentRequest(BaseModel):
    ready_content_id: int
    scheduled_for: str  # ISO datetime format
    timezone: str = "America/New_York"
    notification_method: str = "web"  # web, email, sms


@app.post("/api/prepare")
async def prepare_content(request: PrepareContentRequest, background_tasks: BackgroundTasks):
    """
    Prepare content for manual posting workflow

    Process:
    1. Download video from source
    2. Generate AI caption
    3. Extract hashtags
    4. Create ready_content record
    """
    try:
        from content_preparer import ContentPreparer

        # Get OpenRouter API key
        openrouter_key = os.getenv("OPENROUTER_API_KEY")

        preparer = ContentPreparer(openrouter_api_key=openrouter_key)

        # Prepare content
        result = preparer.prepare_content(
            source_id=request.source_id,
            caption_params={
                "category": request.category,
                "tone": request.tone,
                "persona": request.persona
            }
        )

        if not result:
            raise HTTPException(status_code=400, detail="Failed to prepare content")

        # Auto-schedule if requested
        if request.auto_schedule:
            schedule_time = datetime.now() + timedelta(hours=request.schedule_delay_hours)
            # TODO: Create schedule record

        log_event("INFO", "api", f"Prepared content: {result['ready_id']}")

        return {
            "success": True,
            "ready_content_id": result["ready_id"],
            "video_path": result["video_path"],
            "caption": result["caption"],
            "hashtags": result["hashtags"]
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/prepare/batch")
async def batch_prepare_content(
    background_tasks: BackgroundTasks,
    limit: int = 10,
    min_engagement_rate: float = 0,
    content_type: Optional[str] = None,
    category: str = "general"
):
    """Batch prepare multiple content items"""
    try:
        from content_preparer import ContentPreparer

        openrouter_key = os.getenv("OPENROUTER_API_KEY")
        preparer = ContentPreparer(openrouter_api_key=openrouter_key)

        results = preparer.batch_prepare_content(
            limit=limit,
            min_engagement_rate=min_engagement_rate,
            content_type=content_type
        )

        log_event("INFO", "api", f"Batch prepared {len(results)} items")

        return {
            "success": True,
            "prepared_count": len(results),
            "items": results
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# Ready Content Library Endpoints
# ============================================================

@app.get("/api/library")
async def get_content_library(
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    """
    Get content library with filters

    Status options: pending, scheduled, delivered, posted, skipped
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        query = """
            SELECT rc.*, sc.account, sc.content_type,
                   sc.original_likes, sc.original_comments
            FROM ready_content rc
            LEFT JOIN source_content sc ON rc.source_id = sc.id
            WHERE 1=1
        """
        params = []

        if status:
            query += " AND rc.status = ?"
            params.append(status)

        query += " ORDER BY rc.created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        cursor.execute(query, params)
        rows = cursor.fetchall()

        # Get total count
        count_query = "SELECT COUNT(*) FROM ready_content WHERE 1=1"
        count_params = []
        if status:
            count_query += " AND status = ?"
            count_params.append(status)
        cursor.execute(count_query, count_params)
        total_count = cursor.fetchone()[0]

        conn.close()

        return {
            "count": len(rows),
            "total": total_count,
            "offset": offset,
            "limit": limit,
            "items": [dict(row) for row in rows]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/library/{ready_id}")
async def get_ready_content(ready_id: int):
    """Get specific ready content with all details"""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("""
            SELECT rc.*, sc.account, sc.content_type, sc.description as original_description,
                   sc.original_likes, sc.original_comments, sc.original_url
            FROM ready_content rc
            LEFT JOIN source_content sc ON rc.source_id = sc.id
            WHERE rc.id = ?
        """, (ready_id,))

        row = cursor.fetchone()
        conn.close()

        if not row:
            raise HTTPException(status_code=404, detail="Ready content not found")

        return dict(row)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/library/{ready_id}/schedule")
async def schedule_content(ready_id: int, request: ScheduleContentRequest):
    """Schedule content for posting"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # Verify ready content exists
        cursor.execute("SELECT id FROM ready_content WHERE id = ?", (ready_id,))
        if not cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=404, detail="Ready content not found")

        # Create schedule record
        cursor.execute("""
            INSERT INTO posting_schedule (
                ready_content_id, scheduled_for, timezone, notification_method
            ) VALUES (?, ?, ?, ?)
        """, (ready_id, request.scheduled_for, request.timezone, request.notification_method))

        schedule_id = cursor.lastrowid

        # Update ready content status
        cursor.execute("""
            UPDATE ready_content
            SET status = 'scheduled', posting_schedule = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (request.scheduled_for, ready_id))

        conn.commit()
        conn.close()

        log_event("INFO", "api", f"Scheduled content {ready_id} for {request.scheduled_for}")

        return {
            "success": True,
            "schedule_id": schedule_id,
            "scheduled_for": request.scheduled_for
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# Notification Endpoints
# ============================================================

from notification_service import NotificationService, NotificationScheduler


@app.get("/api/notifications/stats")
async def get_notification_stats():
    """Get notification statistics"""
    try:
        service = NotificationService()
        stats = service.get_notification_stats()
        return stats

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/notifications")
async def get_notifications(unread_only: bool = False, limit: int = 50):
    """Get notifications"""
    try:
        service = NotificationService()
        notifications = service.get_notifications(unread_only=unread_only, limit=limit)

        return {
            "count": len(notifications),
            "items": notifications
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/notifications/{notification_id}")
async def get_notification(notification_id: int):
    """Get specific notification details"""
    try:
        service = NotificationService()

        # Get notification with ready content details
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("""
            SELECT n.*, rc.caption, rc.video_path, rc.hashtags,
                   rc.status as content_status, sc.account
            FROM user_notifications n
            LEFT JOIN ready_content rc ON n.ready_content_id = rc.id
            LEFT JOIN source_content sc ON rc.source_id = sc.id
            WHERE n.id = ?
        """, (notification_id,))

        result = cursor.fetchone()
        conn.close()

        if not result:
            raise HTTPException(status_code=404, detail="Notification not found")

        return dict(result)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: int):
    """Mark notification as read"""
    try:
        service = NotificationService()
        success = service.mark_as_read(notification_id)

        if not success:
            raise HTTPException(status_code=404, detail="Notification not found")

        return {"success": True}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/notifications/{notification_id}/complete")
async def complete_notification(notification_id: int, action_type: str = "posted"):
    """
    Mark notification as completed (user posted the content)

    Args:
        notification_id: Notification ID
        action_type: Type of action taken (posted, skipped, etc.)
    """
    try:
        service = NotificationService()
        success = service.mark_action_taken(notification_id, action_type)

        if not success:
            raise HTTPException(status_code=404, detail="Notification not found")

        log_event("INFO", "api", f"Notification {notification_id} marked as {action_type}")

        return {"success": True, "action": action_type}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/notifications/check-due")
async def check_due_notifications(background_tasks: BackgroundTasks):
    """
    Check for and send due notifications
    This can be called periodically by a scheduler
    """
    try:
        scheduler = NotificationScheduler()
        sent = scheduler.check_and_send_due_notifications()

        return {
            "success": True,
            "sent_count": len(sent),
            "notifications": sent
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# Content Delivery Endpoints
# ============================================================

@app.get("/api/deliver/{ready_id}")
async def get_content_for_delivery(ready_id: int):
    """
    Get content details for delivery (download + copy workflow)

    Returns everything needed for manual posting:
    - Video download URL
    - Caption to copy
    - Hashtags to copy
    - Sound suggestions
    """
    try:
        service = NotificationService()
        content = service.get_ready_content_for_notification(ready_id)

        if not content:
            raise HTTPException(status_code=404, detail="Ready content not found")

        # Check if video file exists
        video_exists = content.get('video_path') and os.path.exists(content['video_path'])

        return {
            "ready_id": ready_id,
            "video_available": video_exists,
            "video_path": content.get('video_path'),
            "caption": content.get('caption'),
            "hashtags": content.get('hashtags'),
            "sound_name": content.get('sound_name'),
            "sound_url": content.get('sound_url'),
            "source_account": content.get('account'),
            "source_description": content.get('source_description')
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/deliver/{ready_id}/download")
async def download_content_video(ready_id: int):
    """
    Download video file for manual posting

    Returns the video file for download
    """
    try:
        service = NotificationService()
        content = service.get_ready_content_for_notification(ready_id)

        if not content:
            raise HTTPException(status_code=404, detail="Ready content not found")

        video_path = content.get('video_path')

        if not video_path or not os.path.exists(video_path):
            raise HTTPException(status_code=404, detail="Video file not found")

        # Return file for download
        filename = os.path.basename(video_path)
        return FileResponse(
            path=video_path,
            filename=filename,
            media_type='video/mp4'
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# Stats & Analytics Endpoints
# ============================================================

@app.get("/api/stats")
async def get_stats():
    """Get system statistics"""
    try:
        stats = get_database_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/stats/ready-content")
async def get_ready_content_stats():
    """Get ready content statistics"""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # Total ready content
        cursor.execute("SELECT COUNT(*) as count FROM ready_content")
        total = cursor.fetchone()['count']

        # By status
        cursor.execute("""
            SELECT status, COUNT(*) as count
            FROM ready_content
            GROUP BY status
        """)
        by_status = {row['status']: row['count'] for row in cursor.fetchall()}

        # This week
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM ready_content
            WHERE created_at >= datetime('now', '-7 days')
        """)
        this_week = cursor.fetchone()['count']

        conn.close()

        return {
            "total": total,
            "by_status": by_status,
            "this_week": this_week
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/database/table/{table_name}")
async def get_database_table(table_name: str, limit: int = 100):
    """Get database table data for viewer"""
    try:
        # Security: Only allow whitelisted table names
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # Check if table exists
        cursor.execute("""
            SELECT name FROM sqlite_master
            WHERE type='table' AND name=?
        """, (table_name,))

        if not cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=404, detail=f"Table '{table_name}' not found")

        # Get columns
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns_info = cursor.fetchall()
        columns = [col[1] for col in columns_info]

        # Get rows
        cursor.execute(f"SELECT * FROM {table_name} LIMIT ?", (limit,))
        rows = cursor.fetchall()

        # Convert to list of dicts
        row_dicts = []
        for row in rows:
            row_dict = {}
            for i, col in enumerate(columns):
                row_dict[col] = row[i]
            row_dicts.append(row_dict)

        conn.close()

        return {
            "table": table_name,
            "columns": columns,
            "rows": row_dicts
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/database/tables")
async def list_database_tables():
    """List all database tables"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT name
            FROM sqlite_master
            WHERE type='table'
            ORDER BY name
        """)
        tables = [row[0] for row in cursor.fetchall()]

        # Get row counts for each table
        table_info = []
        for table in tables:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            table_info.append({
                "name": table,
                "rows": count
            })

        conn.close()

        return {
            "tables": table_info
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# Run Server
# ============================================================

if __name__ == "__main__":
    # Initialize database
    print("Initializing Instagram Automation database...")
    init_database()
    load_initial_categories()

    print("\n" + "=" * 50)
    print("INSTAGRAM AUTOMATION API")
    print("Semi-Automated Content Platform")
    print("=" * 50)
    print("\nServer starting on http://localhost:4400")
    print("API docs: http://localhost:4400/docs")
    print("\nContent Preparation:")
    print("  POST /api/prepare - Prepare single content")
    print("  POST /api/prepare/batch - Batch prepare content")
    print("\nContent Library:")
    print("  GET  /api/library - Get content library")
    print("  GET  /api/library/{id} - Get ready content details")
    print("  POST /api/library/{id}/schedule - Schedule for posting")
    print("\nContent Delivery:")
    print("  GET  /api/deliver/{id} - Get content for posting")
    print("  GET  /api/deliver/{id}/download - Download video")
    print("\nNotifications:")
    print("  GET  /api/notifications - Get notifications")
    print("  POST /api/notifications/{id}/complete - Mark as posted")
    print("  GET  /api/notifications/stats - Notification stats")
    print("  POST /api/notifications/check-due - Check due notifications")
    print("\nSource Content:")
    print("  POST /api/source - Add scraped content")
    print("  GET  /api/source - List source content")
    print("\nAnalytics:")
    print("  GET  /api/stats - System statistics")
    print("  GET  /api/stats/ready-content - Ready content stats")
    print("\n" + "=" * 50)

    uvicorn.run(app, host="0.0.0.0", port=4400)
