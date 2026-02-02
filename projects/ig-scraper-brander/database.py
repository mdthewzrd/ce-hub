#!/usr/bin/env python3
"""
Database schema for Harmonatica Content Management
Extends the existing scraper with content preparation, scheduling, and delivery
"""

import sqlite3
import json
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional

# Database path - resolve to handle .. in paths correctly
DB_PATH = Path(__file__).resolve().parent.parent / "harmonatica.db"

def get_db_connection():
    """Get database connection."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_database():
    """Initialize all database tables."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Source Content - links scraped videos to the system
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS source_content (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            video_filename TEXT NOT NULL UNIQUE,
            video_path TEXT NOT NULL,
            account TEXT,
            original_caption TEXT,
            original_likes INTEGER DEFAULT 0,
            original_views INTEGER DEFAULT 0,
            engagement_rate REAL DEFAULT 0,
            scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'pending',
            notes TEXT,
            manychat_keyword TEXT DEFAULT '',
            manychat_notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Add manychat_keyword column if it doesn't exist (for existing databases)
    try:
        cursor.execute("ALTER TABLE source_content ADD COLUMN manychat_keyword TEXT DEFAULT ''")
        cursor.execute("ALTER TABLE source_content ADD COLUMN manychat_notes TEXT")
    except:
        pass  # Column already exists

    # Add isolate_vocals column if it doesn't exist (for existing databases)
    try:
        cursor.execute("ALTER TABLE source_content ADD COLUMN isolate_vocals INTEGER DEFAULT 0")
    except:
        pass  # Column already exists

    # Add brand_voice_id column if it doesn't exist (for existing databases)
    try:
        cursor.execute("ALTER TABLE source_content ADD COLUMN brand_voice_id INTEGER")
    except:
        pass  # Column already exists

    # Add new brand voice profile columns for existing databases
    new_brand_voice_columns = [
        "template_type TEXT DEFAULT 'blank'",
        "is_variant INTEGER DEFAULT 0",
        "parent_account TEXT",
        "is_clone INTEGER DEFAULT 0",
        "cloned_from TEXT",
        "brand_one_liner TEXT",
        "core_values TEXT",
        "audience_pain_points TEXT",
        "audience_desires TEXT",
        "writing_style TEXT",
        "caption_structure TEXT",
        "hashtag_strategy TEXT",
        "content_pillars TEXT",
        "content_goal TEXT"
    ]

    for column in new_brand_voice_columns:
        try:
            cursor.execute(f"ALTER TABLE brand_voice_profiles ADD COLUMN {column}")
        except:
            pass  # Column already exists

    # Ready Content - prepared content ready to post
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ready_content (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_id INTEGER,
            video_path TEXT,
            caption TEXT NOT NULL,
            hashtags TEXT,
            sound_name TEXT,
            sound_url TEXT,
            posting_schedule TIMESTAMP,
            status TEXT DEFAULT 'ready',
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (source_id) REFERENCES source_content(id)
        )
    """)

    # Posting Schedule
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS posting_schedule (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ready_content_id INTEGER NOT NULL,
            scheduled_for TIMESTAMP NOT NULL,
            posted_at TIMESTAMP,
            status TEXT DEFAULT 'scheduled',
            notification_sent INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (ready_content_id) REFERENCES ready_content(id)
        )
    """)

    # Posted Content - tracking what's been posted
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS posted_content (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ready_content_id INTEGER,
            posted_url TEXT,
            posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            likes INTEGER DEFAULT 0,
            comments INTEGER DEFAULT 0,
            views INTEGER DEFAULT 0,
            shares INTEGER DEFAULT 0,
            notes TEXT,
            FOREIGN KEY (ready_content_id) REFERENCES ready_content(id)
        )
    """)

    # Notifications - posting reminders
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ready_content_id INTEGER,
            scheduled_id INTEGER,
            type TEXT DEFAULT 'posting_reminder',
            title TEXT NOT NULL,
            message TEXT,
            sent_at TIMESTAMP,
            delivered_at TIMESTAMP,
            read_at TIMESTAMP,
            action_taken INTEGER DEFAULT 0,
            action_type TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (ready_content_id) REFERENCES ready_content(id),
            FOREIGN KEY (scheduled_id) REFERENCES posting_schedule(id)
        )
    """)

    # Content Queue - for batch processing
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS content_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_id INTEGER,
            status TEXT DEFAULT 'queued',
            priority INTEGER DEFAULT 0,
            processing_started_at TIMESTAMP,
            processing_completed_at TIMESTAMP,
            error_message TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (source_id) REFERENCES source_content(id)
        )
    """)

    # Brand Voice Profiles - enhanced brand voice management for posting accounts
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS brand_voice_profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_username TEXT NOT NULL UNIQUE,
            profile_name TEXT,
            manychat_keyword TEXT DEFAULT 'LINK',
            manychat_cta TEXT DEFAULT 'COMMENT',
            manychat_automation_name TEXT,

            -- Brand Voice Characteristics
            tone_style TEXT,  -- friendly, professional, witty, inspirational, educational
            personality_traits TEXT,  -- JSON array of traits
            communication_style TEXT,  -- conversational, direct, storytelling

            -- Content Guidelines
            content_themes TEXT,  -- JSON array of themes
            content_purpose TEXT,  -- educate, entertain, inspire, promote
            target_audience TEXT,

            -- Do's and Don'ts
            do_keywords TEXT,  -- JSON array of preferred topics/phrases
            dont_keywords TEXT,  -- JSON array of topics/phrases to avoid

            -- Custom Brand Voice Description
            brand_voice_description TEXT,

            -- Caption Preferences
            caption_length_preference TEXT DEFAULT 'medium',  -- short, medium, long
            emoji_usage TEXT DEFAULT 'moderate',  -- minimal, moderate, liberal
            hashtag_usage TEXT DEFAULT 'none',  -- none, minimal, moderate

            -- Template System Fields
            template_type TEXT DEFAULT 'blank',  -- ecommerce, personal, community, service, creator, blank
            is_variant INTEGER DEFAULT 0,  -- Boolean flag for variant profiles (same brand, different page)
            parent_account TEXT,  -- For variants - references parent account username
            is_clone INTEGER DEFAULT 0,  -- Boolean flag for cloned profiles (same style, different brand)
            cloned_from TEXT,  -- For clones - references source account username

            -- Enhanced Brand Identity Fields
            brand_one_liner TEXT,  -- Quick brand description
            core_values TEXT,  -- JSON array of core values
            audience_pain_points TEXT,  -- What problems does the audience face
            audience_desires TEXT,  -- What does the audience want
            writing_style TEXT,  -- Storytelling, educational, inspirational
            caption_structure TEXT,  -- Hook, body, CTA structure
            hashtag_strategy TEXT,  -- Hashtag approach
            content_pillars TEXT,  -- JSON array of content pillars
            content_goal TEXT,  -- Primary content objective

            -- Metadata
            is_active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Create indexes for brand voice profiles
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_brand_voice_account ON brand_voice_profiles(account_username)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_brand_voice_active ON brand_voice_profiles(is_active)")

    # Offers System - Store offers with ManyChat keywords for contextual CTAs
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS offers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            offer_type TEXT,  -- 'lead_magnet', 'discount', 'webinar', 'challenge', 'consultation', etc.
            manychat_keyword TEXT NOT NULL UNIQUE,  -- The keyword users comment to get this offer
            benefit_statement TEXT,  -- What they get (e.g., "Free 7-day meal plan")
            value_proposition TEXT,  -- Why they want it (e.g., "Lose 10lbs in 2 weeks")
            cta_template TEXT,  -- Template for CTA with placeholder: "Comment '{keyword}' for {benefit}"
            target_audience TEXT,  -- Who this is for
            account_id INTEGER,  -- Link to brand_voice_profiles
            is_active INTEGER DEFAULT 1,
            usage_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Create indexes for offers
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_offers_account ON offers(account_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_offers_keyword ON offers(manychat_keyword)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_offers_active ON offers(is_active)")

    # Video Usage Tracking - Track which accounts have used which videos
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS video_usage (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            video_filename TEXT NOT NULL,
            account_username TEXT NOT NULL,
            brand_voice_profile_id INTEGER,
            used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            caption_generated TEXT,
            notes TEXT,
            UNIQUE(video_filename, account_username)
        )
    """)

    # Create index for video usage lookups
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_video_usage_filename ON video_usage(video_filename)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_video_usage_account ON video_usage(account_username)")

    # Create indexes for performance
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_source_status ON source_content(status)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_ready_status ON ready_content(status)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_schedule_for ON posting_schedule(scheduled_for)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_noti_read ON notifications(read_at, action_taken)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_queue_status ON content_queue(status, priority)")

    conn.commit()
    conn.close()

    print(f"Database initialized: {DB_PATH}")

# ============================================================================
# SOURCE CONTENT MANAGEMENT
# ============================================================================

def add_source_content(video_data: Dict) -> int:
    """Add scraped video to source content."""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT OR REPLACE INTO source_content
            (video_filename, video_path, account, original_caption, original_likes, original_views, engagement_rate, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
        """, (
            video_data.get('filename'),
            video_data.get('path'),
            video_data.get('account'),
            video_data.get('caption', ''),
            video_data.get('likes', 0),
            video_data.get('views', 0),
            video_data.get('engagement_rate', 0)
        ))
        conn.commit()
        return cursor.lastrowid
    except Exception as e:
        print(f"Error adding source content: {e}")
        conn.rollback()
        return -1
    finally:
        conn.close()

def get_source_content(status: Optional[str] = None, limit: int = 100, offset: int = 0) -> List[Dict]:
    """Get source content with optional status filter."""
    conn = get_db_connection()
    cursor = conn.cursor()

    if status:
        cursor.execute("""
            SELECT * FROM source_content WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?
        """, (status, limit, offset))
    else:
        cursor.execute("""
            SELECT * FROM source_content ORDER BY created_at DESC LIMIT ? OFFSET ?
        """, (limit, offset))

    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]

def update_source_status(source_id: int, status: str) -> bool:
    """Update source content status."""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            UPDATE source_content SET status = ? WHERE id = ?
        """, (status, source_id))
        conn.commit()
        return True
    except Exception as e:
        print(f"Error updating source status: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

def delete_source_content(source_id: int) -> bool:
    """Delete source content by ID."""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("DELETE FROM source_content WHERE id = ?", (source_id,))
        conn.commit()
        return True
    except Exception as e:
        print(f"Error deleting source content: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

def update_processing_status(source_id: int, status: str, error: str = None) -> bool:
    """Update processing status and error for source content."""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        if status == 'processing':
            cursor.execute("""
                UPDATE source_content
                SET processing_status = ?, processing_started_at = CURRENT_TIMESTAMP,
                    processing_error = NULL
                WHERE id = ?
            """, (status, source_id))
        elif status == 'completed':
            cursor.execute("""
                UPDATE source_content
                SET processing_status = ?, processing_completed_at = CURRENT_TIMESTAMP,
                    processing_error = NULL
                WHERE id = ?
            """, (status, source_id))
        elif status == 'failed':
            cursor.execute("""
                UPDATE source_content
                SET processing_status = ?, processing_completed_at = CURRENT_TIMESTAMP,
                    processing_error = ?
                WHERE id = ?
            """, (status, error, source_id))
        else:
            cursor.execute("""
                UPDATE source_content
                SET processing_status = ?
                WHERE id = ?
            """, (status, source_id))

        conn.commit()
        return True
    except Exception as e:
        print(f"Error updating processing status: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

# ============================================================================
# READY CONTENT MANAGEMENT
# ============================================================================

def create_ready_content(source_id: int, content_data: Dict) -> int:
    """Create ready content from source."""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO ready_content
            (source_id, video_path, caption, hashtags, sound_name, sound_url, manychat_keyword, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'ready')
        """, (
            source_id,
            content_data.get('video_path'),
            content_data.get('caption'),
            content_data.get('hashtags'),
            content_data.get('sound_name'),
            content_data.get('sound_url'),
            content_data.get('manychat_keyword')
        ))
        conn.commit()

        # Update source status
        update_source_status(source_id, 'prepared')

        return cursor.lastrowid
    except Exception as e:
        print(f"Error creating ready content: {e}")
        conn.rollback()
        return -1
    finally:
        conn.close()

def get_ready_content(status: Optional[str] = None, limit: int = 50) -> List[Dict]:
    """Get ready content with optional status filter."""
    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
        SELECT rc.*, sc.account, sc.original_likes, sc.original_views
        FROM ready_content rc
        LEFT JOIN source_content sc ON rc.source_id = sc.id
    """

    if status:
        # Explicit status filter (including 'deleted' if requested)
        query += " WHERE rc.status = ?"
        cursor.execute(query + " ORDER BY rc.created_at DESC LIMIT ?", (status, limit))
    else:
        # Default: exclude deleted items
        query += " WHERE rc.status != 'deleted'"
        cursor.execute(query + " ORDER BY rc.created_at DESC LIMIT ?", (limit,))

    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]

def update_ready_content(ready_id: int, updates: Dict) -> bool:
    """Update ready content."""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        set_clause = ", ".join(f"{k} = ?" for k in updates.keys())
        values = list(updates.values()) + [ready_id]

        cursor.execute(f"""
            UPDATE ready_content SET {set_clause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?
        """, values)
        conn.commit()
        return True
    except Exception as e:
        print(f"Error updating ready content: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

# ============================================================================
# SCHEDULING
# ============================================================================

def schedule_content(ready_id: int, scheduled_for: datetime) -> int:
    """Schedule content for posting."""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO posting_schedule (ready_content_id, scheduled_for, status)
            VALUES (?, ?, 'scheduled')
        """, (ready_id, scheduled_for.isoformat()))
        conn.commit()

        # Update ready content status
        update_ready_content(ready_id, {'status': 'scheduled', 'posting_schedule': scheduled_for.isoformat()})

        return cursor.lastrowid
    except Exception as e:
        print(f"Error scheduling content: {e}")
        conn.rollback()
        return -1
    finally:
        conn.close()

def get_scheduled_content(upcoming: bool = True) -> List[Dict]:
    """Get scheduled content."""
    conn = get_db_connection()
    cursor = conn.cursor()

    if upcoming:
        cursor.execute("""
            SELECT ps.*, rc.caption, rc.video_path, sc.account
            FROM posting_schedule ps
            JOIN ready_content rc ON ps.ready_content_id = rc.id
            LEFT JOIN source_content sc ON rc.source_id = sc.id
            WHERE ps.status = 'scheduled' AND ps.scheduled_for > datetime('now')
            ORDER BY ps.scheduled_for ASC
        """)
    else:
        cursor.execute("""
            SELECT ps.*, rc.caption, rc.video_path, sc.account
            FROM posting_schedule ps
            JOIN ready_content rc ON ps.ready_content_id = rc.id
            LEFT JOIN source_content sc ON rc.source_id = sc.id
            ORDER BY ps.scheduled_for DESC
        """)

    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]

def mark_as_posted(schedule_id: int, posted_url: Optional[str] = None) -> bool:
    """Mark scheduled content as posted."""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Get schedule details
        cursor.execute("SELECT ready_content_id FROM posting_schedule WHERE id = ?", (schedule_id,))
        row = cursor.fetchone()
        if not row:
            return False

        ready_id = row['ready_content_id']

        # Update schedule
        cursor.execute("""
            UPDATE posting_schedule
            SET status = 'posted', posted_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (schedule_id,))

        # Update ready content
        update_ready_content(ready_id, {'status': 'posted'})

        # Add to posted content
        cursor.execute("""
            INSERT INTO posted_content (ready_content_id, posted_url)
            VALUES (?, ?)
        """, (ready_id, posted_url))

        conn.commit()
        return True
    except Exception as e:
        print(f"Error marking as posted: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

# ============================================================================
# NOTIFICATIONS
# ============================================================================

def create_notification(ready_content_id: int, scheduled_id: Optional[int],
                       title: str, message: str, notif_type: str = 'posting_reminder') -> int:
    """Create a notification."""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO notifications
            (ready_content_id, scheduled_id, type, title, message)
            VALUES (?, ?, ?, ?, ?)
        """, (ready_content_id, scheduled_id, notif_type, title, message))
        conn.commit()
        return cursor.lastrowid
    except Exception as e:
        print(f"Error creating notification: {e}")
        conn.rollback()
        return -1
    finally:
        conn.close()

def get_notifications(unread_only: bool = False, limit: int = 50) -> List[Dict]:
    """Get notifications."""
    conn = get_db_connection()
    cursor = conn.cursor()

    if unread_only:
        cursor.execute("""
            SELECT n.*, rc.caption as content_caption, rc.video_path, sc.account as source_account
            FROM notifications n
            LEFT JOIN ready_content rc ON n.ready_content_id = rc.id
            LEFT JOIN source_content sc ON rc.source_id = sc.id
            WHERE n.read_at IS NULL
            ORDER BY n.created_at DESC
            LIMIT ?
        """, (limit,))
    else:
        cursor.execute("""
            SELECT n.*, rc.caption as content_caption, rc.video_path, sc.account as source_account
            FROM notifications n
            LEFT JOIN ready_content rc ON n.ready_content_id = rc.id
            LEFT JOIN source_content sc ON rc.source_id = sc.id
            ORDER BY n.created_at DESC
            LIMIT ?
        """, (limit,))

    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]

def mark_notification_read(notification_id: int) -> bool:
    """Mark notification as read."""
    conn = get_db_connection()
    cursor = cursor = conn.cursor()

    try:
        cursor.execute("""
            UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE id = ?
        """, (notification_id,))
        conn.commit()
        return True
    except Exception as e:
        print(f"Error marking notification read: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

def mark_notification_action(notification_id: int, action_type: str = 'posted') -> bool:
    """Mark notification action as taken."""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            UPDATE notifications
            SET action_taken = 1, action_type = ?, read_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (action_type, notification_id))

        # Also update ready content status if posted
        if action_type == 'posted':
            cursor.execute("SELECT ready_content_id FROM notifications WHERE id = ?", (notification_id,))
            row = cursor.fetchone()
            if row and row['ready_content_id']:
                update_ready_content(row['ready_content_id'], {'status': 'posted'})

        conn.commit()
        return True
    except Exception as e:
        print(f"Error marking notification action: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

def get_notification_stats() -> Dict:
    """Get notification statistics."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            COUNT(*) as total,
            SUM(CASE WHEN read_at IS NULL THEN 1 ELSE 0 END) as unread,
            SUM(CASE WHEN action_taken = 0 THEN 1 ELSE 0 END) as pending_action
        FROM notifications
    """)

    row = cursor.fetchone()
    conn.close()

    return {
        'total': row['total'],
        'unread': row['unread'],
        'pending_action': row['pending_action']
    }

# ============================================================================
# STATS AND ANALYTICS
# ============================================================================

def get_system_stats() -> Dict:
    """Get comprehensive system statistics."""
    conn = get_db_connection()
    cursor = conn.cursor()

    stats = {}

    # Source content stats
    cursor.execute("SELECT COUNT(*) FROM source_content WHERE status = 'pending'")
    stats['pending_source'] = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM source_content")
    stats['total_source'] = cursor.fetchone()[0]

    # Ready content stats
    cursor.execute("SELECT COUNT(*) FROM ready_content WHERE status = 'ready'")
    stats['ready_content'] = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM ready_content WHERE status = 'scheduled'")
    stats['scheduled_content'] = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM ready_content WHERE status = 'posted'")
    stats['posted_content'] = cursor.fetchone()[0]

    # Notifications
    stats['notifications'] = get_notification_stats()

    # Posted content performance
    cursor.execute("""
        SELECT
            COUNT(*) as total_posts,
            SUM(likes) as total_likes,
            SUM(views) as total_views
        FROM posted_content
    """)
    row = cursor.fetchone()
    stats['total_posts'] = row['total_posts'] or 0
    stats['total_post_likes'] = row['total_likes'] or 0
    stats['total_post_views'] = row['total_views'] or 0

    conn.close()
    return stats

# ============================================================================
# BRAND VOICE PROFILES MANAGEMENT
# ============================================================================

def create_brand_voice_profile(profile_data: Dict) -> int:
    """Create or update a brand voice profile for a posting account."""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Convert lists to JSON for storage
        def to_json(data):
            return json.dumps(data) if data else None

        cursor.execute("""
            INSERT OR REPLACE INTO brand_voice_profiles
            (account_username, profile_name, manychat_keyword, manychat_cta, manychat_automation_name,
             tone_style, personality_traits, communication_style,
             content_themes, content_purpose, target_audience,
             do_keywords, dont_keywords, brand_voice_description,
             caption_length_preference, emoji_usage, hashtag_usage,
             template_type, is_variant, parent_account, is_clone, cloned_from,
             brand_one_liner, core_values, audience_pain_points, audience_desires, audience_familiarity,
             writing_style, caption_structure, hashtag_strategy, content_pillars, content_goal,
             grammar_style, slang_style, spacing_style,
             brand_name, automation_offer, cta_instructions,
             is_active, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        """, (
            profile_data.get('account_username'),
            profile_data.get('profile_name'),
            profile_data.get('manychat_keyword', 'LINK'),
            profile_data.get('manychat_cta', 'COMMENT'),
            profile_data.get('manychat_automation_name'),
            profile_data.get('tone_style'),
            to_json(profile_data.get('personality_traits')),
            profile_data.get('communication_style'),
            to_json(profile_data.get('content_themes')),
            profile_data.get('content_purpose'),
            profile_data.get('target_audience'),
            to_json(profile_data.get('do_keywords')),
            to_json(profile_data.get('dont_keywords')),
            profile_data.get('brand_voice_description'),
            profile_data.get('caption_length_preference', 'medium'),
            profile_data.get('emoji_usage', 'moderate'),
            profile_data.get('hashtag_usage', 'none'),
            profile_data.get('template_type', 'blank'),
            profile_data.get('is_variant', 0),
            profile_data.get('parent_account'),
            profile_data.get('is_clone', 0),
            profile_data.get('cloned_from'),
            profile_data.get('brand_one_liner'),
            to_json(profile_data.get('core_values')),
            profile_data.get('audience_pain_points'),
            profile_data.get('audience_desires'),
            profile_data.get('audience_familiarity'),
            profile_data.get('writing_style'),
            profile_data.get('caption_structure'),
            profile_data.get('hashtag_strategy'),
            to_json(profile_data.get('content_pillars')),
            profile_data.get('content_goal'),
            profile_data.get('grammar_style'),
            profile_data.get('slang_style'),
            profile_data.get('spacing_style'),
            profile_data.get('brand_name'),
            profile_data.get('automation_offer'),
            profile_data.get('cta_instructions'),
            profile_data.get('is_active', 1)
        ))

        conn.commit()
        return cursor.lastrowid
    except Exception as e:
        print(f"Error creating brand voice profile: {e}")
        conn.rollback()
        return -1
    finally:
        conn.close()

def get_brand_voice_profile(account_username: str) -> Optional[Dict]:
    """Get brand voice profile for an account."""
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT * FROM brand_voice_profiles
            WHERE account_username = ? AND is_active = 1
        """, (account_username,))

        row = cursor.fetchone()
        if row:
            profile = dict(row)
            # Parse JSON fields
            for field in ['personality_traits', 'content_themes', 'do_keywords', 'dont_keywords', 'core_values', 'content_pillars']:
                if profile.get(field):
                    try:
                        profile[field] = json.loads(profile[field])
                    except:
                        profile[field] = []
            return profile
        return None
    except Exception as e:
        print(f"Error getting brand voice profile: {e}")
        return None
    finally:
        conn.close()

def get_all_brand_voice_profiles() -> List[Dict]:
    """Get all brand voice profiles."""
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT * FROM brand_voice_profiles WHERE is_active = 1 ORDER BY account_username")
        rows = cursor.fetchall()

        profiles = []
        for row in rows:
            profile = dict(row)
            # Parse JSON fields
            for field in ['personality_traits', 'content_themes', 'do_keywords', 'dont_keywords', 'core_values', 'content_pillars']:
                if profile.get(field):
                    try:
                        profile[field] = json.loads(profile[field])
                    except:
                        profile[field] = []
            profiles.append(profile)

        return profiles
    except Exception as e:
        print(f"Error getting brand voice profiles: {e}")
        return []
    finally:
        conn.close()

def delete_brand_voice_profile(account_username: str) -> bool:
    """Soft delete a brand voice profile."""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            UPDATE brand_voice_profiles
            SET is_active = 0, updated_at = CURRENT_TIMESTAMP
            WHERE account_username = ?
        """, (account_username,))
        conn.commit()
        return True
    except Exception as e:
        print(f"Error deleting brand voice profile: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

def get_brand_voice_profile_by_id(profile_id: int) -> Optional[Dict]:
    """
    Get a specific brand voice profile by ID.
    Returns the profile with JSON fields parsed.
    """
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT * FROM brand_voice_profiles
            WHERE id = ? AND is_active = 1
        """, (profile_id,))

        row = cursor.fetchone()
        if row:
            profile = dict(row)
            # Parse JSON fields
            for field in ['personality_traits', 'content_themes', 'do_keywords', 'dont_keywords', 'core_values', 'content_pillars']:
                if profile.get(field):
                    try:
                        profile[field] = json.loads(profile[field])
                    except:
                        profile[field] = []
            return profile
        return None
    except Exception as e:
        print(f"Error getting brand voice profile by ID: {e}")
        return None
    finally:
        conn.close()


def get_brand_voice_for_caption_by_id(profile_id: int) -> Dict:
    """
    Get brand voice formatted for AI caption generation by profile ID.
    Returns a comprehensive brand voice prompt.
    """
    profile = get_brand_voice_profile_by_id(profile_id)

    if not profile:
        # Default brand voice
        return {
            "tone": "Authentic and engaging",
            "guidelines": "Be relatable, use line breaks, create emotional connection",
            "manychat_cta": "LINK",
            "preferences": {
                "length": "medium",
                "emojis": "moderate",
                "hashtags": "none"
            }
        }

    # Build comprehensive brand voice for AI
    brand_voice = {
        "tone": profile.get('tone_style', 'Authentic'),
        "manychat_cta": profile.get('manychat_keyword', 'LINK'),
        "guidelines": profile.get('brand_voice_description', ''),
        "preferences": {
            "length": profile.get('caption_length_preference', 'medium'),
            "emojis": profile.get('emoji_usage', 'moderate'),
            "hashtags": profile.get('hashtag_usage', 'none'),
            "grammar": profile.get('grammar_style', 'standard'),
            "slang": profile.get('slang_style', 'minimal'),
            "spacing": profile.get('spacing_style', 'standard')
        }
    }

    # Build detailed guidelines from profile data
    guidelines_parts = []

    if profile.get('brand_one_liner'):
        guidelines_parts.append(f"Brand: {profile['brand_one_liner']}")

    if profile.get('tone_style'):
        guidelines_parts.append(f"Tone: {profile['tone_style']}")

    if profile.get('writing_style'):
        guidelines_parts.append(f"Writing Style: {profile['writing_style']}")

    if profile.get('communication_style'):
        guidelines_parts.append(f"Style: {profile['communication_style']}")

    if profile.get('content_purpose'):
        guidelines_parts.append(f"Purpose: {profile['content_purpose']}")

    if profile.get('content_goal'):
        guidelines_parts.append(f"Goal: {profile['content_goal']}")

    if profile.get('target_audience'):
        guidelines_parts.append(f"Audience: {profile['target_audience']}")

    if profile.get('audience_pain_points'):
        guidelines_parts.append(f"Pain Points: {profile['audience_pain_points']}")

    if profile.get('audience_desires'):
        guidelines_parts.append(f"Desires: {profile['audience_desires']}")

    if profile.get('audience_familiarity'):
        guidelines_parts.append(f"Audience Familiarity: {profile['audience_familiarity']}")

    if profile.get('personality_traits'):
        traits = profile['personality_traits'] if isinstance(profile['personality_traits'], list) else []
        if traits:
            guidelines_parts.append(f"Personality: {', '.join(traits)}")

    if profile.get('core_values'):
        core_values = profile['core_values'] if isinstance(profile['core_values'], list) else []
        if core_values:
            guidelines_parts.append(f"Core Values: {', '.join(core_values)}")

    if profile.get('content_pillars'):
        content_pillars = profile['content_pillars'] if isinstance(profile['content_pillars'], list) else []
        if content_pillars:
            guidelines_parts.append(f"Content Pillars: {', '.join(content_pillars)}")

    # Add DO keywords
    if profile.get('do_keywords'):
        do_keywords = profile['do_keywords'] if isinstance(profile['do_keywords'], list) else []
        if do_keywords:
            guidelines_parts.append(f"DO include: {', '.join(do_keywords)}")

    # Add DON'T keywords
    if profile.get('dont_keywords'):
        dont_keywords = profile['dont_keywords'] if isinstance(profile['dont_keywords'], list) else []
        if dont_keywords:
            guidelines_parts.append(f"AVOID: {', '.join(dont_keywords)}")

    # Add grammar style
    if profile.get('grammar_style'):
        guidelines_parts.append(f"Grammar: {profile['grammar_style']}")

    # Add slang style
    if profile.get('slang_style'):
        guidelines_parts.append(f"Slang: {profile['slang_style']}")

    # Add spacing style
    if profile.get('spacing_style'):
        guidelines_parts.append(f"Spacing: {profile['spacing_style']}")

    # Combine with custom description
    if profile.get('brand_voice_description'):
        guidelines_parts.append(profile['brand_voice_description'])

    brand_voice['guidelines'] = '\n'.join(guidelines_parts) if guidelines_parts else "Be authentic and engaging"

    return brand_voice


def get_brand_voice_for_caption(account_username: str) -> Dict:
    """
    Get brand voice formatted for AI caption generation.
    Returns a comprehensive brand voice prompt.
    """
    profile = get_brand_voice_profile(account_username)

    if not profile:
        # Default brand voice
        return {
            "tone": "Authentic and engaging",
            "guidelines": "Be relatable, use line breaks, create emotional connection",
            "manychat_cta": "LINK",
            "preferences": {
                "length": "medium",
                "emojis": "moderate",
                "hashtags": "none"
            }
        }

    # Build comprehensive brand voice for AI
    brand_voice = {
        "tone": profile.get('tone_style', 'Authentic'),
        "manychat_cta": profile.get('manychat_keyword', 'LINK'),
        "guidelines": profile.get('brand_voice_description', ''),
        "preferences": {
            "length": profile.get('caption_length_preference', 'medium'),
            "emojis": profile.get('emoji_usage', 'moderate'),
            "hashtags": profile.get('hashtag_usage', 'none')
        }
    }

    # Build detailed guidelines from profile data
    guidelines_parts = []

    if profile.get('brand_one_liner'):
        guidelines_parts.append(f"Brand: {profile['brand_one_liner']}")

    if profile.get('tone_style'):
        guidelines_parts.append(f"Tone: {profile['tone_style']}")

    if profile.get('writing_style'):
        guidelines_parts.append(f"Writing Style: {profile['writing_style']}")

    if profile.get('communication_style'):
        guidelines_parts.append(f"Style: {profile['communication_style']}")

    if profile.get('content_purpose'):
        guidelines_parts.append(f"Purpose: {profile['content_purpose']}")

    if profile.get('content_goal'):
        guidelines_parts.append(f"Goal: {profile['content_goal']}")

    if profile.get('target_audience'):
        guidelines_parts.append(f"Audience: {profile['target_audience']}")

    if profile.get('audience_pain_points'):
        guidelines_parts.append(f"Pain Points: {profile['audience_pain_points']}")

    if profile.get('audience_desires'):
        guidelines_parts.append(f"Desires: {profile['audience_desires']}")

    if profile.get('personality_traits'):
        traits = json.loads(profile['personality_traits']) if isinstance(profile['personality_traits'], str) else profile['personality_traits']
        if traits:
            guidelines_parts.append(f"Personality: {', '.join(traits)}")

    if profile.get('core_values'):
        core_values = json.loads(profile['core_values']) if isinstance(profile['core_values'], str) else profile['core_values']
        if core_values:
            guidelines_parts.append(f"Core Values: {', '.join(core_values)}")

    if profile.get('content_pillars'):
        content_pillars = json.loads(profile['content_pillars']) if isinstance(profile['content_pillars'], str) else profile['content_pillars']
        if content_pillars:
            guidelines_parts.append(f"Content Pillars: {', '.join(content_pillars)}")

    # Add DO keywords
    if profile.get('do_keywords'):
        do_keywords = json.loads(profile['do_keywords']) if isinstance(profile['do_keywords'], str) else profile['do_keywords']
        if do_keywords:
            guidelines_parts.append(f"DO include: {', '.join(do_keywords)}")

    # Add DON'T keywords
    if profile.get('dont_keywords'):
        dont_keywords = json.loads(profile['dont_keywords']) if isinstance(profile['dont_keywords'], str) else profile['dont_keywords']
        if dont_keywords:
            guidelines_parts.append(f"AVOID: {', '.join(dont_keywords)}")

    # Combine with custom description
    if profile.get('brand_voice_description'):
        guidelines_parts.append(profile['brand_voice_description'])

    brand_voice['guidelines'] = '\n'.join(guidelines_parts) if guidelines_parts else "Be authentic and engaging"

    return brand_voice

def get_profile_variants(parent_account: str) -> List[Dict]:
    """Get all variant profiles for a parent account."""
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT * FROM brand_voice_profiles
            WHERE parent_account = ? AND is_variant = 1 AND is_active = 1
            ORDER BY profile_name
        """, (parent_account,))
        rows = cursor.fetchall()

        profiles = []
        for row in rows:
            profile = dict(row)
            # Parse JSON fields
            for field in ['personality_traits', 'content_themes', 'do_keywords', 'dont_keywords', 'core_values', 'content_pillars']:
                if profile.get(field):
                    try:
                        profile[field] = json.loads(profile[field])
                    except:
                        profile[field] = []
            profiles.append(profile)

        return profiles
    except Exception as e:
        print(f"Error getting profile variants: {e}")
        return []
    finally:
        conn.close()

def get_profile_clones(source_account: str) -> List[Dict]:
    """Get all profiles cloned from a source account."""
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT * FROM brand_voice_profiles
            WHERE cloned_from = ? AND is_clone = 1 AND is_active = 1
            ORDER BY profile_name
        """, (source_account,))
        rows = cursor.fetchall()

        profiles = []
        for row in rows:
            profile = dict(row)
            # Parse JSON fields
            for field in ['personality_traits', 'content_themes', 'do_keywords', 'dont_keywords', 'core_values', 'content_pillars']:
                if profile.get(field):
                    try:
                        profile[field] = json.loads(profile[field])
                    except:
                        profile[field] = []
            profiles.append(profile)

        return profiles
    except Exception as e:
        print(f"Error getting profile clones: {e}")
        return []
    finally:
        conn.close()

def update_brand_voice_profile(profile_id: int, profile_data: Dict) -> bool:
    """Update an existing brand voice profile."""
    print(f"[DB UPDATE] Starting update for profile_id: {profile_id}")
    print(f"[DB UPDATE] profile_data type: {type(profile_data)}")
    print(f"[DB UPDATE] profile_data keys: {list(profile_data.keys()) if profile_data else 'None'}")

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Get valid columns from the table
        cursor.execute("PRAGMA table_info(brand_voice_profiles)")
        valid_columns = {row[1] for row in cursor.fetchall()}

        print(f"[DB UPDATE] Valid columns in table: {sorted(valid_columns)}")

        # Convert lists to JSON for storage
        json_fields = [
            'personality_traits', 'core_values', 'content_pillars',
            'do_keywords', 'dont_keywords', 'content_themes'
        ]

        update_data = profile_data.copy()
        for field in json_fields:
            if field in update_data and isinstance(update_data[field], list):
                print(f"[DB UPDATE] Converting {field} to JSON: {update_data[field]}")
                update_data[field] = json.dumps(update_data[field])

        # Build UPDATE query - only include valid columns
        set_clauses = []
        values = []

        for key, value in update_data.items():
            # Skip if not a valid column
            if key not in valid_columns:
                print(f"[DB UPDATE] Skipping invalid column: {key}")
                continue
            # Skip read-only fields
            if key not in ['id', 'profile_id', 'account_username', 'created_at']:
                set_clauses.append(f"{key} = ?")
                values.append(value)
                print(f"[DB UPDATE] Will update: {key} = {str(value)[:50]}...")

        if not set_clauses:
            print(f"[DB UPDATE] No set clauses built, returning False")
            return False

        values.append(profile_id)
        query = f"""
            UPDATE brand_voice_profiles
            SET {', '.join(set_clauses)}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """

        print(f"[DB UPDATE] Executing query...")
        cursor.execute(query, values)
        conn.commit()
        print(f"[DB UPDATE] Successfully committed")
        return True
    except Exception as e:
        print(f"Error updating brand voice profile: {e}")
        import traceback
        traceback.print_exc()
        conn.rollback()
        return False
    finally:
        conn.close()

# ============================================================================
# VIDEO USAGE TRACKING
# ============================================================================

def record_video_usage(video_filename: str, account_username: str, caption: str = None, notes: str = None) -> int:
    """Record when a video is used by an account."""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT OR REPLACE INTO video_usage
            (video_filename, account_username, caption_generated, notes, used_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        """, (video_filename, account_username, caption, notes))
        conn.commit()
        return cursor.lastrowid
    except Exception as e:
        print(f"Error recording video usage: {e}")
        conn.rollback()
        return -1
    finally:
        conn.close()

def get_video_usage(video_filename: str) -> List[Dict]:
    """Get all usage records for a specific video."""
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT * FROM video_usage
            WHERE video_filename = ?
            ORDER BY used_at DESC
        """, (video_filename,))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Error getting video usage: {e}")
        return []
    finally:
        conn.close()

def get_account_videos_used(account_username: str) -> List[Dict]:
    """Get all videos used by a specific account."""
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT * FROM video_usage
            WHERE account_username = ?
            ORDER BY used_at DESC
        """, (account_username,))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Error getting account videos used: {e}")
        return []
    finally:
        conn.close()

def check_video_used_by_account(video_filename: str, account_username: str) -> bool:
    """Check if a video has been used by a specific account."""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT COUNT(*) as count FROM video_usage
            WHERE video_filename = ? AND account_username = ?
        """, (video_filename, account_username))
        result = cursor.fetchone()
        return result['count'] > 0 if result else False
    except Exception as e:
        print(f"Error checking video usage: {e}")
        return False
    finally:
        conn.close()

def get_all_video_usage() -> Dict[str, List[str]]:
    """Get a dictionary mapping video filenames to list of accounts that used them."""
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT video_filename, account_username FROM video_usage ORDER BY used_at DESC")
        rows = cursor.fetchall()

        usage_map = {}
        for row in rows:
            video = row['video_filename']
            account = row['account_username']
            if video not in usage_map:
                usage_map[video] = []
            if account not in usage_map[video]:
                usage_map[video].append(account)

        return usage_map
    except Exception as e:
        print(f"Error getting all video usage: {e}")
        return {}
    finally:
        conn.close()

# ============================================================================
# OFFERS MANAGEMENT
# ============================================================================

def create_offer(offer_data: Dict) -> int:
    """Create a new offer linked to ManyChat keyword."""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO offers
            (name, description, offer_type, manychat_keyword, benefit_statement,
             value_proposition, cta_template, target_audience, account_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            offer_data.get('name'),
            offer_data.get('description'),
            offer_data.get('offer_type'),
            offer_data.get('manychat_keyword'),
            offer_data.get('benefit_statement'),
            offer_data.get('value_proposition'),
            offer_data.get('cta_template'),
            offer_data.get('target_audience'),
            offer_data.get('account_id')
        ))
        conn.commit()
        return cursor.lastrowid
    except Exception as e:
        print(f"Error creating offer: {e}")
        conn.rollback()
        return -1
    finally:
        conn.close()

def get_all_offers(account_id: Optional[int] = None, active_only: bool = True) -> List[Dict]:
    """Get all offers, optionally filtered by account."""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        query = "SELECT * FROM offers WHERE 1=1"
        params = []

        if active_only:
            query += " AND is_active = 1"
        if account_id:
            query += " AND account_id = ?"
            params.append(account_id)

        query += " ORDER BY usage_count DESC, created_at DESC"

        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Error getting offers: {e}")
        return []
    finally:
        conn.close()

def get_offer_by_id(offer_id: int) -> Optional[Dict]:
    """Get a specific offer by ID."""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT * FROM offers WHERE id = ?", (offer_id,))
        row = cursor.fetchone()
        return dict(row) if row else None
    except Exception as e:
        print(f"Error getting offer: {e}")
        return None
    finally:
        conn.close()

def get_offer_by_keyword(keyword: str) -> Optional[Dict]:
    """Get an offer by its ManyChat keyword."""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT * FROM offers WHERE manychat_keyword = ? AND is_active = 1", (keyword,))
        row = cursor.fetchone()
        return dict(row) if row else None
    except Exception as e:
        print(f"Error getting offer by keyword: {e}")
        return None
    finally:
        conn.close()

def update_offer(offer_id: int, offer_data: Dict) -> bool:
    """Update an existing offer."""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        set_clause = []
        params = []

        for key in ['name', 'description', 'offer_type', 'manychat_keyword',
                    'benefit_statement', 'value_proposition', 'cta_template',
                    'target_audience', 'account_id', 'is_active']:
            if key in offer_data:
                set_clause.append(f"{key} = ?")
                params.append(offer_data[key])

        if not set_clause:
            return False

        params.append(offer_id)
        query = f"UPDATE offers SET {', '.join(set_clause)}, updated_at = CURRENT_TIMESTAMP WHERE id = ?"

        cursor.execute(query, params)
        conn.commit()
        return True
    except Exception as e:
        print(f"Error updating offer: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

def delete_offer(offer_id: int) -> bool:
    """Delete an offer (soft delete by setting is_active = 0)."""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("UPDATE offers SET is_active = 0 WHERE id = ?", (offer_id,))
        conn.commit()
        return True
    except Exception as e:
        print(f"Error deleting offer: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

def increment_offer_usage(offer_id: int) -> bool:
    """Track when an offer is used in a caption."""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("UPDATE offers SET usage_count = usage_count + 1 WHERE id = ?", (offer_id,))
        conn.commit()
        return True
    except Exception as e:
        print(f"Error incrementing offer usage: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

def get_offer_context_for_prompt(offer_id: int) -> str:
    """Get formatted offer context for AI prompt generation."""
    offer = get_offer_by_id(offer_id)
    if not offer:
        return ""

    return f"""
## Offer Context:
- Name: {offer.get('name')}
- Benefit: {offer.get('benefit_statement')}
- Value: {offer.get('value_proposition')}
- ManyChat Keyword: {offer.get('manychat_keyword')}
- Target Audience: {offer.get('target_audience', 'General')}

Use this to create contextual, benefit-driven CTAs that clearly communicate what they get and why they want it.
"""

# ============================================================================
# INITIALIZATION
# ============================================================================

if __name__ == '__main__':
    init_database()
    print("Database tables created successfully")
