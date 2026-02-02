"""
Instagram Caption Engine Database Schema
SQLite database for storing captions, templates, and performance tracking
"""

import sqlite3
from datetime import datetime
from typing import Optional, List, Dict
import json
import os

# Database path
DB_PATH = os.path.join(os.path.dirname(__file__), "instagram_captions.db")


def init_database():
    """Initialize all database tables"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Captions table (main caption storage)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS captions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id INTEGER,

            hook TEXT NOT NULL,
            story_body TEXT NOT NULL,
            value_prop TEXT,
            cta_comment TEXT NOT NULL,
            cta_follow TEXT,

            full_caption TEXT NOT NULL,
            hashtag_string TEXT,

            caption_style VARCHAR(50),
            tone VARCHAR(50),
            target_keyword VARCHAR(100),
            category VARCHAR(50),

            generation_model VARCHAR(100),
            ai_generated BOOLEAN DEFAULT 1,
            generation_params JSON,

            engagement_score FLOAT DEFAULT 0,
            used_count INTEGER DEFAULT 0,
            last_used_at DATETIME,

            status VARCHAR(20) DEFAULT 'pending',

            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 2. Caption templates library
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS caption_templates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            template_name VARCHAR(100) UNIQUE,
            category VARCHAR(50),

            hook_pattern TEXT,
            story_structure JSON,
            cta_patterns JSON,
            value_templates JSON,

            emoji_palette JSON,
            hashtag_pools JSON,

            performance_avg FLOAT DEFAULT 0,
            usage_count INTEGER DEFAULT 0,

            is_active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 3. Content queue
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS content_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            video_url TEXT UNIQUE,
            video_path TEXT,

            scraped_from VARCHAR(255),
            original_caption TEXT,
            views INTEGER,
            likes INTEGER,
            comments INTEGER,
            shares INTEGER,

            detected_category VARCHAR(50),
            detected_theme VARCHAR(100),
            target_emotion VARCHAR(50),

            caption_id INTEGER REFERENCES captions(id),

            scheduled_at DATETIME,
            posted_at DATETIME,
            post_status VARCHAR(20) DEFAULT 'pending',

            post_id VARCHAR(100),
            engagement_24h JSON,

            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 4. Caption analytics
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS caption_analytics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            caption_id INTEGER REFERENCES captions(id),
            content_queue_id INTEGER REFERENCES content_queue(id),

            likes_count INTEGER DEFAULT 0,
            comments_count INTEGER DEFAULT 0,
            shares_count INTEGER DEFAULT 0,
            saves_count INTEGER DEFAULT 0,
            views_count INTEGER DEFAULT 0,

            keyword_comments INTEGER DEFAULT 0,
            manychat_dms_sent INTEGER DEFAULT 0,
            email_captures INTEGER DEFAULT 0,

            affiliate_clicks INTEGER DEFAULT 0,
            sales_generated INTEGER DEFAULT 0,
            revenue_generated FLOAT DEFAULT 0,

            measured_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 5. Generation history
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS generation_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            caption_id INTEGER REFERENCES captions(id),
            model_used VARCHAR(100),

            prompt_tokens INTEGER,
            completion_tokens INTEGER,
            total_tokens INTEGER,
            cost_usd FLOAT,

            generation_time_ms INTEGER,

            human_edited BOOLEAN DEFAULT 0,
            human_feedback TEXT,

            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 6. Hashtag pools
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS hashtag_pools (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category VARCHAR(50),
            hashtag TEXT,
            volume INTEGER,
            effectiveness_score FLOAT DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

            UNIQUE(category, hashtag)
        )
    """)

    # Create indexes
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_captions_status ON captions(status)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_captions_category ON captions(category)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_content_queue_status ON content_queue(post_status)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_analytics_caption ON caption_analytics(caption_id)")

    conn.commit()
    conn.close()

    print(f"Database initialized at {DB_PATH}")


def insert_template(
    name: str,
    category: str,
    hook_pattern: str,
    story_structure: Dict,
    cta_patterns: List[str],
    emoji_palette: List[str],
    hashtag_pools: Dict[str, List[str]]
):
    """Insert a caption template into the database"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        INSERT OR REPLACE INTO caption_templates
        (template_name, category, hook_pattern, story_structure, cta_patterns, emoji_palette, hashtag_pools)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        name,
        category,
        hook_pattern,
        json.dumps(story_structure),
        json.dumps(cta_patterns),
        json.dumps(emoji_palette),
        json.dumps(hashtag_pools)
    ))

    conn.commit()
    conn.close()


def load_initial_templates():
    """Load initial caption templates for common categories"""

    # Motivation template
    insert_template(
        name="motivation_viral",
        category="motivation",
        hook_pattern="{bold_claim} {emoji}",
        story_structure={
            "opening": "Problem statement + personal story",
            "middle": "Struggle + turning point",
            "climax": "Discovery/breakthrough",
            "resolution": "Transformation + results"
        },
        cta_patterns=[
            "Comment '{keyword}' and I will send you {freebie}",
            "Type '{keyword}' below to get {freebie}",
            "Drop '{keyword}' for instant access to {freebie}"
        ],
        emoji_palette=["🔥", "💪", "💯", "⚡", "🎯", "🚀", "💸", "🏆", "✨", "😤"],
        hashtag_pools={
            "high_volume": ["#motivation", "#success", "#mindset", "#entrepreneur", "#hustle"],
            "medium_volume": ["#motivationdaily", "#successmindset", "#goals", "#grind"],
            "low_volume": ["#millennialemployee", "#entrepreneurtips", "#hustleharder"]
        }
    )

    # Fitness template
    insert_template(
        name="fitness_transformation",
        category="fitness",
        hook_pattern="{time_period} + {result} {emoji}",
        story_structure={
            "opening": "Before state (struggle)",
            "middle": "Discovery of technique",
            "climax": "Implementation + consistency",
            "resolution": "After state (results)"
        },
        cta_patterns=[
            "Comment 'WORKOUT' for the full routine",
            "Type 'FIT' to get my workout plan",
            "Drop 'GAINS' for the complete program"
        ],
        emoji_palette=["💪", "🔥", "💯", "⚡", "🎯", "🏋️", "🏃", "✅"],
        hashtag_pools={
            "high_volume": ["#fitness", "#workout", "#gym", "#fitfam", "#motivation"],
            "medium_volume": ["#fitnessmotivation", "#gymlife", "#bodybuilding", "#training"],
            "low_volume": ["#homeworkout", "#fitnessjourney", "#getfit", "#fitlife"]
        }
    )

    # Business/money template
    insert_template(
        name="business_money",
        category="business",
        hook_pattern="{problem} I did not know about {emoji}",
        story_structure={
            "opening": "Pain point + relatable struggle",
            "middle": "Realization + solution discovery",
            "climax": "Implementation + results",
            "resolution": "ROI + call to action"
        },
        cta_patterns=[
            "Comment 'PROFIT' for the exact strategy",
            "Type 'MONEY' to get my free guide",
            "Drop 'CASH' for the full breakdown"
        ],
        emoji_palette=["💰", "💸", "📈", "💵", "🎯", "🚀", "💼", "💹", "💎", "⚡"],
        hashtag_pools={
            "high_volume": ["#business", "#entrepreneur", "#money", "#success", "#marketing"],
            "medium_volume": ["#businesstips", "#smallbusiness", "#entrepreneurlife", "#finance"],
            "low_volume": ["#sidehustle", "#passiveincome", "#businessgrowth", "#moneytips"]
        }
    )

    print("Initial templates loaded")


def get_template_by_category(category: str) -> Optional[Dict]:
    """Get active template for a category"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        SELECT template_name, hook_pattern, story_structure, cta_patterns,
               emoji_palette, hashtag_pools
        FROM caption_templates
        WHERE category = ? AND is_active = 1
        LIMIT 1
    """, (category,))

    row = cursor.fetchone()
    conn.close()

    if row:
        return {
            "name": row[0],
            "hook_pattern": row[1],
            "story_structure": json.loads(row[2]),
            "cta_patterns": json.loads(row[3]),
            "emoji_palette": json.loads(row[4]),
            "hashtag_pools": json.loads(row[5])
        }
    return None


def insert_caption(caption_data: Dict) -> int:
    """Insert a generated caption into the database"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO captions (
            hook, story_body, value_prop, cta_comment, cta_follow,
            full_caption, hashtag_string, category, target_keyword,
            generation_model, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        caption_data.get("hook"),
        caption_data.get("story"),
        caption_data.get("value"),
        caption_data.get("cta_comment"),
        caption_data.get("cta_follow"),
        caption_data.get("full_caption"),
        caption_data.get("hashtags"),
        caption_data.get("category"),
        caption_data.get("target_keyword"),
        caption_data.get("generation_model"),
        "pending"
    ))

    caption_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return caption_id


def insert_generation_history(
    caption_id: int,
    model_used: str,
    input_tokens: int,
    output_tokens: int,
    cost: float,
    generation_time: float,
    success: bool = True
):
    """Insert a generation history record"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO generation_history (
            caption_id, model_used, input_tokens, output_tokens,
            estimated_cost, generation_time_ms, success
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (caption_id, model_used, input_tokens, output_tokens, cost, generation_time, success))

    conn.commit()
    conn.close()


def load_initial_categories():
    """Load initial content categories for Instagram automation"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Check if categories already exist
    cursor.execute("SELECT COUNT(*) FROM hashtag_pools")
    if cursor.fetchone()[0] > 0:
        conn.close()
        return

    # Load initial hashtag pools by category
    categories = {
        'fitness': [
            ('fitness', '#fitness', 5000000, 0.8),
            ('fitness', '#workout', 4500000, 0.8),
            ('fitness', '#gymlife', 2000000, 0.7),
            ('fitness', '#bodybuilding', 3000000, 0.7),
        ],
        'motivation': [
            ('motivation', '#motivation', 8000000, 0.9),
            ('motivation', '#success', 6000000, 0.8),
            ('motivation', '#mindset', 4000000, 0.8),
            ('motivation', '#hustle', 5000000, 0.7),
        ],
        'business': [
            ('business', '#business', 10000000, 0.8),
            ('business', '#entrepreneur', 7000000, 0.8),
            ('business', '#money', 9000000, 0.7),
            ('business', '#marketing', 5000000, 0.7),
        ]
    }

    for category, hashtag, volume, effectiveness in [
        item for items in categories.values() for item in items
    ]:
        cursor.execute("""
            INSERT OR IGNORE INTO hashtag_pools (category, hashtag, volume, effectiveness_score)
            VALUES (?, ?, ?, ?)
        """, (category, hashtag, volume, effectiveness))

    conn.commit()
    conn.close()
    print("Initial categories loaded")


def log_event(event_type: str, details: dict):
    """Log an event to the database"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO generation_history (model_used, prompt_tokens, completion_tokens, cost_usd, generation_time_ms)
        VALUES (?, ?, ?, ?, ?)
    """, (event_type, 0, 0, 0, 0))

    conn.commit()
    conn.close()


def get_database_stats() -> dict:
    """Get database statistics"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    stats = {}

    # Count captions
    cursor.execute("SELECT COUNT(*) FROM captions")
    stats['total_captions'] = cursor.fetchone()[0]

    # Count by status
    cursor.execute("SELECT status, COUNT(*) FROM captions GROUP BY status")
    stats['by_status'] = {row[0]: row[1] for row in cursor.fetchall()}

    # Count by category
    cursor.execute("SELECT category, COUNT(*) FROM captions GROUP BY category")
    stats['by_category'] = {row[0]: row[1] for row in cursor.fetchall()}

    conn.close()
    return stats


if __name__ == "__main__":
    init_database()
    load_initial_templates()
