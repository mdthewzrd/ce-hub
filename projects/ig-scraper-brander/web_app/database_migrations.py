"""
Database Schema Updates for AI Caption System
Adds tables for video analysis, caption patterns, account configuration
"""

import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent.parent.parent / "harmonatica.db"


def migrate_database():
    """Run all pending migrations"""
    print("Running database migrations...")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Migration 1: Add accounts table with ManyChat configuration
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS accounts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                platform TEXT DEFAULT 'instagram',
                brand_voice TEXT,
                tone_guidelines TEXT,
                content_strategy TEXT,
                manychat_cta TEXT DEFAULT 'LINK',
                manychat_keyword TEXT,
                manychat_automation_name TEXT,
                active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Migration 2: Add video_analysis table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS video_analysis (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_content_id INTEGER UNIQUE,
                visual_description TEXT,
                content_type TEXT,
                vibe TEXT,
                key_elements TEXT,
                emotional_tone TEXT,
                suggested_hooks TEXT,
                target_audience TEXT,
                engagement_triggers TEXT,
                analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                model_used TEXT,
                analysis_version INTEGER DEFAULT 1,
                FOREIGN KEY (source_content_id) REFERENCES source_content(id)
            )
        """)

        # Migration 3: Add caption_patterns table for learning
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS caption_patterns (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                account_id INTEGER,
                pattern_name TEXT,
                pattern_type TEXT,
                hook_template TEXT,
                body_structure TEXT,
                cta_template TEXT,
                success_rate REAL,
                usage_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (account_id) REFERENCES accounts(id)
            )
        """)

        # Migration 4: Add caption_generation_log table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS caption_generation_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_content_id INTEGER,
                ready_content_id INTEGER,
                account_id INTEGER,
                generated_caption TEXT,
                caption_style TEXT,
                model_used TEXT,
                quality_score REAL,
                uniqueness_score REAL,
                references_used TEXT,
                quality_checks TEXT,
                warnings TEXT,
                accepted INTEGER,
                feedback TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (source_content_id) REFERENCES source_content(id),
                FOREIGN KEY (ready_content_id) REFERENCES ready_content(id),
                FOREIGN KEY (account_id) REFERENCES accounts(id)
            )
        """)

        # Migration 5: Add columns to source_content for analysis status
        try:
            cursor.execute("ALTER TABLE source_content ADD COLUMN analysis_status TEXT DEFAULT 'pending'")
        except sqlite3.OperationalError:
            pass  # Column already exists

        try:
            cursor.execute("ALTER TABLE source_content ADD COLUMN analysis_id INTEGER")
        except sqlite3.OperationalError:
            pass

        # Migration 6: Add indexes for performance
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_video_analysis_source
            ON video_analysis(source_content_id)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_caption_generation_account
            ON caption_generation_log(account_id, created_at)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_source_analysis_status
            ON source_content(analysis_status)
        """)

        conn.commit()
        print("✅ Database migrations completed successfully")

    except Exception as e:
        conn.rollback()
        print(f"❌ Migration error: {e}")
        raise
    finally:
        conn.close()


def seed_default_accounts():
    """Seed default account configurations"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Get unique accounts from source_content
        cursor.execute("""
            SELECT DISTINCT account, COUNT(*) as video_count
            FROM source_content
            WHERE account IS NOT NULL
            GROUP BY account
        """)

        accounts = cursor.fetchall()

        for account_name, count in accounts:
            # Check if account exists
            cursor.execute(
                "SELECT id FROM accounts WHERE username = ?",
                (account_name,)
            )

            if not cursor.fetchone():
                # Insert with default config
                cursor.execute("""
                    INSERT INTO accounts (
                        username, brand_voice, tone_guidelines,
                        manychat_cta, manychat_keyword
                    ) VALUES (?, ?, ?, ?, ?)
                """, (
                    account_name,
                    "Authentic and engaging",
                    "Be relatable, use line breaks, create emotional journey",
                    "LINK",
                    account_name.upper().replace("@", "")[:10]
                ))
                print(f"✅ Created account: {account_name}")

        conn.commit()
        print("✅ Default accounts seeded")

    except Exception as e:
        conn.rollback()
        print(f"❌ Error seeding accounts: {e}")
    finally:
        conn.close()


if __name__ == "__main__":
    migrate_database()
    seed_default_accounts()
