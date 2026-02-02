"""
Agent Health & Quality Tracking System
Monitors AI caption agent performance, tracks metrics, and enables continuous learning
"""

import os
import json
import sqlite3
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from pathlib import Path
from statistics import mean, median
import requests

# Database path
DB_PATH = Path(__file__).parent.parent.parent / "harmonatica.db"

# Archon MCP configuration
ARCHON_URL = os.getenv("ARCHON_URL", "http://localhost:8051")


class AgentMetricsTracker:
    """Track AI agent performance metrics over time"""

    def __init__(self):
        self.ensure_metrics_tables()

    def ensure_metrics_tables(self):
        """Create tables for tracking agent performance"""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # Agent performance log
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS agent_performance_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_id INTEGER,
                ready_content_id INTEGER,
                generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                model_used TEXT,
                vision_analysis_used BOOLEAN,
                processing_time_seconds REAL,
                caption_length INTEGER,
                hook_type TEXT,
                quality_score REAL,
                uniqueness_score REAL,
                brand_voice_adherence REAL,
                predicted_engagement REAL,
                status TEXT DEFAULT 'pending'
            )
        """)

        # Caption performance tracking (after posting to IG)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS caption_performance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ready_content_id INTEGER UNIQUE,
                posted_to_ig BOOLEAN DEFAULT FALSE,
                posted_at TIMESTAMP,
                likes_24h INTEGER DEFAULT 0,
                likes_7d INTEGER DEFAULT 0,
                comments_24h INTEGER DEFAULT 0,
                comments_7d INTEGER DEFAULT 0,
                shares_24h INTEGER DEFAULT 0,
                shares_7d INTEGER DEFAULT 0,
                views_24h INTEGER DEFAULT 0,
                views_7d INTEGER DEFAULT 0,
                engagement_rate_24h REAL DEFAULT 0,
                engagement_rate_7d REAL DEFAULT 0,
                benchmark_rating TEXT,  -- 'top_10%', 'top_25%', 'average', 'below_average'
                performance_vs_predicted REAL,  -- actual engagement / predicted
                last_synced TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Agent health metrics
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS agent_health (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                captions_generated_today INTEGER DEFAULT 0,
                avg_processing_time REAL DEFAULT 0,
                avg_quality_score REAL DEFAULT 0,
                avg_uniqueness_score REAL DEFAULT 0,
                vision_success_rate REAL DEFAULT 0,
                api_errors_today INTEGER DEFAULT 0,
                rate_limit_hits_today INTEGER DEFAULT 0,
                unique_hooks_today INTEGER DEFAULT 0,
                repetitive_hook_count INTEGER DEFAULT 0,
                model_version TEXT,
                health_status TEXT DEFAULT 'healthy'  -- 'healthy', 'degraded', 'critical'
            )
        """)

        # Top performing captions (for learning)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS top_performers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ready_content_id INTEGER,
                caption TEXT,
                hook TEXT,
                content_type TEXT,
                vibe TEXT,
                engagement_rate REAL,
                likes INTEGER,
                views INTEGER,
                performance_tier TEXT,  -- 'top_1%', 'top_5%', 'top_10%', 'top_25%'
                learned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(caption)
            )
        """)

        # Caption patterns that work (extracted from top performers)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS successful_patterns (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pattern TEXT,
                pattern_type TEXT,  -- 'hook', 'transition', 'cta', 'structure'
                usage_count INTEGER DEFAULT 1,
                avg_engagement_rate REAL DEFAULT 0,
                success_rate REAL DEFAULT 0,
                last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(pattern)
            )
        """)

        conn.commit()
        conn.close()
        print("[AgentHealth] Database tables initialized")

    def log_generation(
        self,
        source_id: int,
        ready_content_id: int,
        model_used: str,
        vision_used: bool,
        processing_time: float,
        caption: str,
        quality_scores: Dict
    ) -> int:
        """Log a caption generation event"""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # Extract hook from caption
        hook = self._extract_hook(caption)

        cursor.execute("""
            INSERT INTO agent_performance_log (
                source_id, ready_content_id, model_used, vision_analysis_used,
                processing_time_seconds, caption_length, hook_type,
                quality_score, uniqueness_score, brand_voice_adherence,
                predicted_engagement
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            source_id, ready_content_id, model_used, vision_used,
            processing_time, len(caption), hook,
            quality_scores.get('overall_score', 0),
            quality_scores.get('uniqueness_score', 0),
            quality_scores.get('brand_voice_adherence', 0),
            quality_scores.get('predicted_engagement', 0)
        ))

        log_id = cursor.lastrowid
        conn.commit()
        conn.close()

        return log_id

    def _extract_hook(self, caption: str) -> str:
        """Extract hook type from caption"""
        lines = caption.split('\n')
        if lines:
            first_line = lines[0].strip().lower()

            # Classify hook type
            if any(word in first_line for word in ['here\'s', 'this is', 'these are']):
                return 'informational'
            elif any(word in first_line for word in ['why', 'how', 'what', 'when', 'where']):
                return 'question'
            elif any(word in first_line for word in ['nobody', 'no one', 'rarely', 'secret']):
                return 'curiosity_gap'
            elif any(word in first_line for word in ['i wish', 'i learned', 'i found']):
                return 'personal_experience'
            elif any(word in first_line for word in ['stop', 'don\'t', 'never']):
                return 'negative_hook'
            else:
                return 'other'

        return 'unknown'

    def record_actual_performance(
        self,
        ready_content_id: int,
        likes: int,
        comments: int,
        shares: int,
        views: int
    ):
        """Record actual Instagram performance after posting"""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        engagement_rate = (likes + comments + shares) / views * 100 if views > 0 else 0

        cursor.execute("""
            INSERT OR REPLACE INTO caption_performance
            (ready_content_id, posted_to_ig, posted_at,
             likes_24h, comments_24h, shares_24h, views_24h, engagement_rate_24h)
            VALUES (?, TRUE, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?)
        """, (ready_content_id, likes, comments, shares, views, engagement_rate))

        conn.commit()
        conn.close()

        # Update benchmark rating
        self._update_benchmark_rating(ready_content_id)

    def _update_benchmark_rating(self, ready_content_id: int):
        """Calculate performance percentile vs other posts"""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # Get this post's engagement rate
        cursor.execute("""
            SELECT engagement_rate_24h FROM caption_performance
            WHERE ready_content_id = ?
        """, (ready_content_id,))
        result = cursor.fetchone()

        if not result:
            conn.close()
            return

        this_engagement = result[0]

        # Get percentile
        cursor.execute("""
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN engagement_rate_24h > ? THEN 1 ELSE 0 END) as better_count
            FROM caption_performance
            WHERE engagement_rate_24h > 0
        """, (this_engagement,))

        total, better_count = cursor.fetchone()

        if total > 0:
            percentile = (total - better_count) / total * 100

            if percentile >= 90:
                rating = 'top_10%'
            elif percentile >= 75:
                rating = 'top_25%'
            elif percentile >= 50:
                rating = 'above_average'
            elif percentile >= 25:
                rating = 'average'
            else:
                rating = 'below_average'

            cursor.execute("""
                UPDATE caption_performance
                SET benchmark_rating = ?
                WHERE ready_content_id = ?
            """, (rating, ready_content_id))

            # If top performer, add to learning database
            if percentile >= 75:  # Top 25%
                self._add_to_top_performers(ready_content_id, rating)

        conn.commit()
        conn.close()

    def _add_to_top_performers(self, ready_content_id: int, rating: str):
        """Add caption to top performers database for learning"""
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("""
            SELECT rc.caption, rc.id, cp.engagement_rate_24h,
                   cp.likes_24h, cp.views_24h, sc.original_caption
            FROM ready_content rc
            JOIN caption_performance cp ON rc.id = cp.ready_content_id
            LEFT JOIN source_content sc ON rc.source_id = sc.id
            WHERE rc.id = ?
        """, (ready_content_id,))

        row = cursor.fetchone()
        if row:
            caption = row['caption']
            hook = caption.split('\n')[0] if caption else ''

            cursor.execute("""
                INSERT OR IGNORE INTO top_performers
                (ready_content_id, caption, hook, engagement_rate, likes, views, performance_tier)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (ready_content_id, caption, hook, row['engagement_rate_24h'],
                  row['likes_24h'], row['views_24h'], rating))

            print(f"[AgentHealth] Added top performer: {rating} - {hook[:50]}...")

        conn.commit()
        conn.close()

    def get_health_report(self) -> Dict:
        """Generate comprehensive agent health report"""
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # Today's metrics
        today = datetime.now().strftime('%Y-%m-%d')

        cursor.execute("""
            SELECT
                COUNT(*) as generations_today,
                AVG(processing_time_seconds) as avg_processing_time,
                AVG(quality_score) as avg_quality,
                AVG(uniqueness_score) as avg_uniqueness,
                SUM(CASE WHEN vision_analysis_used = TRUE THEN 1 ELSE 0 END) * 1.0 / COUNT(*) as vision_success_rate
            FROM agent_performance_log
            WHERE DATE(generated_at) = ?
        """, (today,))

        today_metrics = dict(cursor.fetchone())

        # Hook variety (last 50 captions)
        cursor.execute("""
            SELECT hook_type, COUNT(*) as count
            FROM agent_performance_log
            WHERE generated_at > datetime('now', '-7 days')
            GROUP BY hook_type
            ORDER BY count DESC
        """)
        hook_distribution = {row['hook_type']: row['count'] for row in cursor.fetchall()}

        # Top performing hooks
        cursor.execute("""
            SELECT hook, AVG(engagement_rate) as avg_engagement, COUNT(*) as usage
            FROM top_performers
            GROUP BY hook
            HAVING usage >= 2
            ORDER BY avg_engagement DESC
            LIMIT 10
        """)
        top_hooks = [dict(row) for row in cursor.fetchall()]

        # Performance prediction accuracy
        cursor.execute("""
            SELECT
                AVG(apl.engagement_rate_24h) as actual_avg,
                AVG(apl.predicted_engagement) as predicted_avg,
                AVG(apl.engagement_rate_24h / NULLIF(apl.predicted_engagement, 0)) as prediction_ratio
            FROM agent_performance_log apl
            JOIN caption_performance cp ON apl.ready_content_id = cp.ready_content_id
            WHERE cp.engagement_rate_24h > 0
        """)
        prediction_accuracy = dict(cursor.fetchone())

        conn.close()

        # Calculate health status
        health_status = self._calculate_health_status(today_metrics)

        return {
            'timestamp': datetime.now().isoformat(),
            'health_status': health_status,
            'today_metrics': today_metrics,
            'hook_distribution': hook_distribution,
            'top_performing_hooks': top_hooks,
            'prediction_accuracy': prediction_accuracy
        }

    def _calculate_health_status(self, metrics: Dict) -> str:
        """Calculate overall agent health status"""
        issues = []

        if metrics.get('avg_quality', 0) < 60:
            issues.append('low_quality')
        if metrics.get('avg_uniqueness', 0) < 60:
            issues.append('low_uniqueness')
        if metrics.get('vision_success_rate', 0) < 0.5:
            issues.append('vision_failing')
        if metrics.get('avg_processing_time', 0) > 60:
            issues.append('slow_processing')

        if len(issues) >= 3:
            return 'critical'
        elif len(issues) >= 1:
            return 'degraded'
        else:
            return 'healthy'


class ArchonIntegration:
    """Integration with Archon MCP for knowledge graph and RAG"""

    def __init__(self, archon_url: str = None):
        self.archon_url = archon_url or ARCHON_URL
        self.enabled = self._test_connection()

    def _test_connection(self) -> bool:
        """Test if Archon MCP is available"""
        try:
            response = requests.get(f"{self.archon_url}/health", timeout=2)
            return response.status_code == 200
        except:
            print("[Archon] Connection failed - running without knowledge graph")
            return False

    def ingest_caption_knowledge(self, caption_data: Dict):
        """Send caption data to Archon for knowledge graph ingestion"""
        if not self.enabled:
            return False

        try:
            response = requests.post(
                f"{self.archon_url}/api/ingest/caption",
                json=caption_data,
                timeout=5
            )
            return response.status_code == 200
        except Exception as e:
            print(f"[Archon] Ingestion failed: {e}")
            return False

    def query_similar_captions(self, query_text: str, limit: int = 5) -> List[Dict]:
        """Query Archon for semantically similar captions"""
        if not self.enabled:
            return []

        try:
            response = requests.post(
                f"{self.archon_url}/api/query/similar",
                json={'query': query_text, 'limit': limit},
                timeout=10
            )

            if response.status_code == 200:
                return response.json().get('results', [])
        except Exception as e:
            print(f"[Archon] Query failed: {e}")

        return []

    def store_performance_feedback(self, caption_id: int, performance_data: Dict):
        """Store performance feedback for learning loop"""
        if not self.enabled:
            return False

        try:
            feedback_data = {
                'caption_id': caption_id,
                'timestamp': datetime.now().isoformat(),
                'engagement_rate': performance_data.get('engagement_rate', 0),
                'benchmark_rating': performance_data.get('benchmark_rating', 'unknown'),
                'feedback_type': 'performance'
            }

            response = requests.post(
                f"{self.archon_url}/api/feedback",
                json=feedback_data,
                timeout=5
            )
            return response.status_code == 200
        except Exception as e:
            print(f"[Archon] Feedback storage failed: {e}")
            return False


class QualityBenchmarker:
    """Benchmark caption quality against production library"""

    def __init__(self):
        self.metrics = AgentMetricsTracker()

    def compare_to_production(self, generated_caption: str) -> Dict:
        """Compare generated caption against production library"""
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # Get top 10% performing captions from production
        cursor.execute("""
            SELECT caption, engagement_rate_24h, hook, likes_24h
            FROM caption_performance cp
            JOIN ready_content rc ON cp.ready_content_id = rc.id
            WHERE cp.benchmark_rating IN ('top_10%', 'top_25%')
              AND cp.engagement_rate_24h > 0
            ORDER BY cp.engagement_rate_24h DESC
            LIMIT 20
        """)

        top_performers = [dict(row) for row in cursor.fetchall()]

        # Get generated caption hook
        generated_hook = generated_caption.split('\n')[0] if generated_caption else ''

        # Check hook uniqueness
        similar_hooks = [
            p for p in top_performers
            if self._hooks_are_similar(generated_hook, p['hook'])
        ]

        # Calculate metrics
        uniqueness_score = max(0, 100 - len(similar_hooks) * 10)

        conn.close()

        return {
            'uniqueness_vs_production': uniqueness_score,
            'similar_hooks_found': len(similar_hooks),
            'production_benchmark_count': len(top_performers),
            'recommendation': 'unique' if uniqueness_score > 70 else 'needs_revision'
        }

    def _hooks_are_similar(self, hook1: str, hook2: str) -> bool:
        """Check if two hooks are semantically similar"""
        hook1_clean = hook1.lower().strip()
        hook2_clean = hook2.lower().strip()

        # Exact match
        if hook1_clean == hook2_clean:
            return True

        # Check for similar structure
        words1 = set(hook1_clean.split())
        words2 = set(hook2_clean.split())

        # If more than 60% word overlap, consider similar
        intersection = words1.intersection(words2)
        union = words1.union(words2)

        if union:
            similarity = len(intersection) / len(union)
            return similarity > 0.6

        return False


# Singleton instances
_metrics_tracker = None
_archon = None
_benchmarker = None


def get_metrics_tracker() -> AgentMetricsTracker:
    """Get metrics tracker singleton"""
    global _metrics_tracker
    if _metrics_tracker is None:
        _metrics_tracker = AgentMetricsTracker()
    return _metrics_tracker


def get_archon() -> ArchonIntegration:
    """Get Archon integration singleton"""
    global _archon
    if _archon is None:
        _archon = ArchonIntegration()
    return _archon


def get_benchmarker() -> QualityBenchmarker:
    """Get benchmarker singleton"""
    global _benchmarker
    if _benchmarker is None:
        _benchmarker = QualityBenchmarker()
    return _benchmarker


if __name__ == "__main__":
    # Test the health system
    tracker = get_metrics_tracker()

    print("\n=== AGENT HEALTH REPORT ===")
    report = tracker.get_health_report()
    print(json.dumps(report, indent=2))

    print("\n=== BENCHMARK TEST ===")
    benchmarker = get_benchmarker()
    result = benchmarker.compare_to_production("Here's what I learned today that changed everything")
    print(json.dumps(result, indent=2))
