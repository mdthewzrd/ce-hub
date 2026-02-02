"""
Instagram Automation Database Schema
Single database with separate tables for:
1. Source content (scraping library)
2. Posted content (performance tracking)
"""

import sqlite3
import os
from datetime import datetime
from typing import Optional, List, Dict

# Database path - use absolute path
DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "instagram_automation.db"))


def init_database() -> None:
    """Initialize the Instagram automation database with all tables"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # ============================================================
    # SOURCE CONTENT TABLES (Scraping Library)
    # ============================================================

    # Main source content table - stores scraped content from other accounts
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS source_content (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            original_url TEXT NOT NULL UNIQUE,
            account TEXT NOT NULL,
            content_type TEXT NOT NULL CHECK(content_type IN ('reel', 'post', 'story')),
            original_likes INTEGER DEFAULT 0,
            original_comments INTEGER DEFAULT 0,
            original_shares INTEGER DEFAULT 0,
            original_views INTEGER DEFAULT 0,
            media_url TEXT,
            thumbnail_url TEXT,
            description TEXT,
            hashtags TEXT,
            scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            engagement_rate REAL,
            status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processed', 'skipped', 'duplicate')),
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Source content analytics - tracks performance of source content over time
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS source_content_analytics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_id INTEGER NOT NULL,
            recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            likes INTEGER,
            comments INTEGER,
            shares INTEGER,
            views INTEGER,
            engagement_rate REAL,
            FOREIGN KEY (source_id) REFERENCES source_content(id) ON DELETE CASCADE
        )
    """)

    # Categories for organizing scraped content
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS content_categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            parent_id INTEGER,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (parent_id) REFERENCES content_categories(id)
        )
    """)

    # Source content to categories mapping
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS source_content_categories (
            source_id INTEGER NOT NULL,
            category_id INTEGER NOT NULL,
            assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (source_id, category_id),
            FOREIGN KEY (source_id) REFERENCES source_content(id) ON DELETE CASCADE,
            FOREIGN KEY (category_id) REFERENCES content_categories(id) ON DELETE CASCADE
        )
    """)

    # ============================================================
    # POSTED CONTENT TABLES (Performance Tracking)
    # ============================================================

    # Posted content table - tracks our published posts and links back to source
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS posted_content (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_id INTEGER,
            caption_id INTEGER,
            media_url TEXT,
            media_type TEXT NOT NULL CHECK(media_type IN ('reel', 'post', 'story', 'carousel')),
            thumbnail_url TEXT,
            posted_at DATETIME,
            scheduled_for DATETIME,
            status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'scheduled', 'posted', 'failed')),

            -- Our performance metrics
            our_likes INTEGER DEFAULT 0,
            our_comments INTEGER DEFAULT 0,
            our_shares INTEGER DEFAULT 0,
            our_views INTEGER DEFAULT 0,
            our_saves INTEGER DEFAULT 0,

            -- Engagement calculations
            engagement_rate REAL,
            engagement_velocity REAL, -- engagements per hour

            -- Affiliate tracking
            affiliate_link TEXT,
            affiliate_clicks INTEGER DEFAULT 0,
            affiliate_conversions INTEGER DEFAULT 0,
            affiliate_revenue REAL DEFAULT 0,

            -- Comment keyword tracking
            target_keyword TEXT,
            keyword_comments INTEGER DEFAULT 0,

            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (source_id) REFERENCES source_content(id) ON DELETE SET NULL,
            FOREIGN KEY (caption_id) REFERENCES captions(id) ON DELETE SET NULL
        )
    """)

    # Posted content analytics - tracks our content performance over time
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS posted_content_analytics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            posted_id INTEGER NOT NULL,
            recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            likes INTEGER,
            comments INTEGER,
            shares INTEGER,
            views INTEGER,
            saves INTEGER,
            engagement_rate REAL,
            affiliate_clicks INTEGER,
            FOREIGN KEY (posted_id) REFERENCES posted_content(id) ON DELETE CASCADE
        )
    """)

    # ============================================================
    # READY CONTENT (Semi-Automated Workflow)
    # ============================================================

    # Stores content that's been prepared for manual posting
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ready_content (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_id INTEGER,

            -- Video files (downloaded and ready)
            video_path TEXT,
            thumbnail_path TEXT,

            -- AI-generated content
            caption TEXT,
            hashtags TEXT,

            -- Sound/track information
            sound_name TEXT,
            sound_url TEXT,
            audio_track_id INTEGER,

            -- Scheduling
            posting_schedule DATETIME,

            -- Status tracking
            status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'scheduled', 'delivered', 'posted', 'skipped')),

            -- Metadata
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (source_id) REFERENCES source_content(id) ON DELETE SET NULL,
            FOREIGN KEY (audio_track_id) REFERENCES audio_tracks(id) ON DELETE SET NULL
        )
    """)

    # ============================================================
    # POSTING SCHEDULE
    # ============================================================

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS posting_schedule (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ready_content_id INTEGER NOT NULL,
            scheduled_for DATETIME NOT NULL,
            timezone TEXT DEFAULT 'America/New_York',
            notification_sent BOOLEAN DEFAULT FALSE,
            notification_method TEXT,
            delivered_at DATETIME,
            posted_at DATETIME,
            skipped_at DATETIME,
            skip_reason TEXT,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (ready_content_id) REFERENCES ready_content(id) ON DELETE CASCADE
        )
    """)

    # ============================================================
    # USER NOTIFICATIONS
    # ============================================================

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ready_content_id INTEGER,
            scheduled_id INTEGER,
            type TEXT DEFAULT 'posting_reminder' CHECK(type IN ('posting_reminder', 'trend_alert', 'content_ready', 'system')),
            title TEXT NOT NULL,
            message TEXT,
            sent_at DATETIME,
            delivered_at DATETIME,
            read_at DATETIME,
            action_taken BOOLEAN DEFAULT FALSE,
            action_type TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (ready_content_id) REFERENCES ready_content(id) ON DELETE SET NULL,
            FOREIGN KEY (scheduled_id) REFERENCES posting_schedule(id) ON DELETE SET NULL
        )
    """)

    # ============================================================
    # TRENDING SOUNDS (Extended)
    # ============================================================

    # Extended trending sounds with Instagram-specific tracking
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS instagram_trending_sounds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sound_name TEXT NOT NULL,
            sound_url TEXT,
            instagram_url TEXT,
            usage_count INTEGER DEFAULT 0,
            reels_using INTEGER DEFAULT 0,
            first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_trending BOOLEAN DEFAULT 1,
            trend_score REAL,
            genre TEXT,
            mood TEXT
        )
    """)

    # ============================================================
    # CONTENT QUEUE (Posting Workflow) - DEPRECATED
    # Keeping for backward compatibility but using new scheduling system
    # ============================================================

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS content_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            posted_content_id INTEGER,
            scheduled_for DATETIME NOT NULL,
            status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
            priority INTEGER DEFAULT 0,
            attempt_count INTEGER DEFAULT 0,
            last_attempt_at DATETIME,
            error_message TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (posted_content_id) REFERENCES posted_content(id) ON DELETE CASCADE
        )
    """)

    # ============================================================
    # SCRAPER CONFIGURATION
    # ============================================================

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS scraper_targets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_username TEXT NOT NULL,
            account_url TEXT NOT NULL UNIQUE,
            is_active BOOLEAN DEFAULT 1,
            scrape_reels BOOLEAN DEFAULT 1,
            scrape_posts BOOLEAN DEFAULT 1,
            scrape_stories BOOLEAN DEFAULT 0,
            min_engagement_rate REAL DEFAULT 0,
            max_age_days INTEGER DEFAULT 30,
            last_scraped_at DATETIME,
            scrape_count INTEGER DEFAULT 0,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS scraper_runs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            target_id INTEGER,
            started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            completed_at DATETIME,
            status TEXT DEFAULT 'running' CHECK(status IN ('running', 'completed', 'failed', 'cancelled')),
            items_scraped INTEGER DEFAULT 0,
            items_added INTEGER DEFAULT 0,
            items_skipped INTEGER DEFAULT 0,
            error_message TEXT,
            FOREIGN KEY (target_id) REFERENCES scraper_targets(id) ON DELETE SET NULL
        )
    """)

    # ============================================================
    # AFFILIATE TRACKING
    # ============================================================

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS affiliate_campaigns (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            affiliate_network TEXT,
            product_name TEXT,
            affiliate_link TEXT NOT NULL,
            commission_rate REAL,
            tracking_code TEXT,
            is_active BOOLEAN DEFAULT 1,
            total_clicks INTEGER DEFAULT 0,
            total_conversions INTEGER DEFAULT 0,
            total_revenue REAL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS affiliate_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            campaign_id INTEGER,
            posted_id INTEGER,
            event_type TEXT NOT NULL CHECK(event_type IN ('click', 'conversion', 'refund')),
            event_value REAL,
            recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (campaign_id) REFERENCES affiliate_campaigns(id) ON DELETE SET NULL,
            FOREIGN KEY (posted_id) REFERENCES posted_content(id) ON DELETE SET NULL
        )
    """)

    # ============================================================
    # MANYCHAT INTEGRATION
    # ============================================================

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS manychat_interactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            posted_id INTEGER,
            comment_id TEXT,
            username TEXT,
            comment_text TEXT,
            keyword_matched TEXT,
            triggered_flow TEXT,
            email_captured BOOLEAN DEFAULT 0,
            captured_email TEXT,
            interaction_stage TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (posted_id) REFERENCES posted_content(id) ON DELETE SET NULL
        )
    """)

    # ============================================================
    # ACCOUNT CREDENTIALS (ENCRYPTED)
    # ============================================================

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS instagram_accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password_encrypted TEXT,
            proxy_url TEXT,
            is_active BOOLEAN DEFAULT 1,
            last_login_at DATETIME,
            login_success_count INTEGER DEFAULT 0,
            login_failure_count INTEGER DEFAULT 0,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # ============================================================
    # SYSTEM LOGS
    # ============================================================

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS system_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            log_level TEXT NOT NULL CHECK(log_level IN ('INFO', 'WARNING', 'ERROR', 'DEBUG')),
            component TEXT NOT NULL,
            message TEXT NOT NULL,
            details TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # ============================================================
    # INDEXES FOR PERFORMANCE
    # ============================================================

    # Source content indexes
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_source_status ON source_content(status)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_source_account ON source_content(account)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_source_type ON source_content(content_type)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_source_engagement ON source_content(engagement_rate)")

    # Posted content indexes
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_posted_status ON posted_content(status)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_posted_posted_at ON posted_content(posted_at)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_posted_source ON posted_content(source_id)")

    # Ready content indexes (NEW)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_ready_status ON ready_content(status)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_ready_scheduled ON ready_content(posting_schedule)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_ready_source ON ready_content(source_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_ready_created ON ready_content(created_at)")

    # Posting schedule indexes (NEW)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_schedule_scheduled ON posting_schedule(scheduled_for)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_schedule_ready ON posting_schedule(ready_content_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_schedule_notification ON posting_schedule(notification_sent)")

    # User notifications indexes (NEW)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_notifications_ready ON user_notifications(ready_content_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_notifications_type ON user_notifications(type)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_notifications_sent ON user_notifications(sent_at)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_notifications_action ON user_notifications(action_taken)")

    # Queue indexes
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_queue_status ON content_queue(status)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_queue_scheduled ON content_queue(scheduled_for)")

    # Analytics indexes
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_posted_analytics_posted ON posted_content_analytics(posted_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_source_analytics_source ON source_content_analytics(source_id)")

    # Scraper indexes
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_scraper_target_active ON scraper_targets(is_active)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_scraper_runs_status ON scraper_runs(status)")

    # Trending sounds indexes (NEW)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_trending_sounds_name ON instagram_trending_sounds(sound_name)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_trending_sounds_trending ON instagram_trending_sounds(is_trending)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_trending_sounds_score ON instagram_trending_sounds(trend_score)")

    conn.commit()
    conn.close()


def load_initial_categories() -> None:
    """Load initial content categories"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    categories = [
        (None, "Motivation", "Motivational and inspirational content"),
        (None, "Fitness", "Health, fitness, and workout content"),
        (None, "Business", "Business, money, and entrepreneurship"),
        (None, "Lifestyle", "Lifestyle and daily routine content"),
        (None, "Education", "Educational and how-to content"),
        (None, "Entertainment", "Entertainment and humor"),
    ]

    for parent_id, name, description in categories:
        cursor.execute(
            "INSERT OR IGNORE INTO content_categories (parent_id, name, description) VALUES (?, ?, ?)",
            (parent_id, name, description)
        )

    conn.commit()
    conn.close()


def log_event(level: str, component: str, message: str, details: Optional[str] = None) -> None:
    """Log a system event"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        """INSERT INTO system_logs (log_level, component, message, details)
           VALUES (?, ?, ?, ?)""",
        (level, component, message, details)
    )
    conn.commit()
    conn.close()


def get_database_stats() -> Dict:
    """Get database statistics"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    stats = {}

    # Source content stats
    cursor.execute("SELECT COUNT(*) FROM source_content")
    stats['total_source_content'] = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM source_content WHERE status = 'pending'")
    stats['pending_source_content'] = cursor.fetchone()[0]

    cursor.execute("SELECT AVG(engagement_rate) FROM source_content WHERE engagement_rate IS NOT NULL")
    result = cursor.fetchone()[0]
    stats['avg_source_engagement'] = round(result, 2) if result else 0

    # Posted content stats
    cursor.execute("SELECT COUNT(*) FROM posted_content")
    stats['total_posted_content'] = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM posted_content WHERE status = 'posted'")
    stats['total_published'] = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM posted_content WHERE status = 'scheduled'")
    stats['total_scheduled'] = cursor.fetchone()[0]

    cursor.execute("SELECT AVG(engagement_rate) FROM posted_content WHERE engagement_rate IS NOT NULL")
    result = cursor.fetchone()[0]
    stats['avg_posted_engagement'] = round(result, 2) if result else 0

    # Affiliate stats
    cursor.execute("SELECT SUM(affiliate_clicks) FROM posted_content")
    result = cursor.fetchone()[0]
    stats['total_affiliate_clicks'] = result if result else 0

    cursor.execute("SELECT SUM(affiliate_revenue) FROM posted_content")
    result = cursor.fetchone()[0]
    stats['total_affiliate_revenue'] = round(result, 2) if result else 0

    # Queue stats
    cursor.execute("SELECT COUNT(*) FROM content_queue WHERE status = 'pending'")
    stats['pending_queue_items'] = cursor.fetchone()[0]

    conn.close()
    return stats


if __name__ == "__main__":
    print("Initializing Instagram Automation Database...")
    init_database()
    load_initial_categories()
    log_event("INFO", "database", "Database initialized successfully")

    stats = get_database_stats()
    print("\n" + "=" * 50)
    print("DATABASE STATISTICS")
    print("=" * 50)
    print(f"Source Content: {stats['total_source_content']} total, {stats['pending_source_content']} pending")
    print(f"Posted Content: {stats['total_posted_content']} total, {stats['total_published']} published, {stats['total_scheduled']} scheduled")
    print(f"Average Engagement: Source {stats['avg_source_engagement']}%, Posted {stats['avg_posted_engagement']}%")
    print(f"Affiliate: {stats['total_affiliate_clicks']} clicks, ${stats['total_affiliate_revenue']} revenue")
    print(f"Queue: {stats['pending_queue_items']} pending items")
    print("=" * 50)
    print(f"\nDatabase created at: {DB_PATH}")
