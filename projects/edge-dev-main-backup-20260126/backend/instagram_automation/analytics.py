"""
Instagram Analytics Module
Provides performance analytics and insights
"""

import os
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from statistics import mean, median
import sqlite3

# Local imports
from database_schema import DB_PATH


# ============================================================
# Analytics Engine
# ============================================================

class InstagramAnalytics:
    """Analytics engine for Instagram automation"""

    def __init__(self):
        self.db_path = DB_PATH

    # ============================================================
    # Overview Stats
    # ============================================================

    def get_overview_stats(self) -> Dict:
        """Get overview statistics for the dashboard"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        stats = {}

        # Content library stats
        cursor.execute("SELECT COUNT(*) as count FROM source_content")
        stats["total_scraped"] = cursor.fetchone()["count"]

        cursor.execute("SELECT COUNT(*) as count FROM source_content WHERE status = 'pending'")
        stats["pending_source"] = cursor.fetchone()["count"]

        # Posted content stats
        cursor.execute("SELECT COUNT(*) as count FROM posted_content")
        stats["total_posted"] = cursor.fetchone()["count"]

        cursor.execute("SELECT COUNT(*) as count FROM posted_content WHERE status = 'posted'")
        stats["total_published"] = cursor.fetchone()["count"]

        cursor.execute("SELECT COUNT(*) as count FROM posted_content WHERE status = 'scheduled'")
        stats["total_scheduled"] = cursor.fetchone()["count"]

        # Engagement stats
        cursor.execute("""
            SELECT AVG(engagement_rate) as avg_rate
            FROM posted_content
            WHERE engagement_rate IS NOT NULL
        """)
        result = cursor.fetchone()["avg_rate"]
        stats["avg_engagement_rate"] = round(result, 2) if result else 0

        # Affiliate stats
        cursor.execute("SELECT SUM(affiliate_clicks) as total FROM posted_content")
        result = cursor.fetchone()["total"]
        stats["total_affiliate_clicks"] = result if result else 0

        cursor.execute("SELECT SUM(affiliate_revenue) as total FROM posted_content")
        result = cursor.fetchone()["total"]
        stats["total_affiliate_revenue"] = round(result, 2) if result else 0

        # Keyword stats
        cursor.execute("SELECT SUM(keyword_comments) as total FROM posted_content")
        result = cursor.fetchone()["total"]
        stats["total_keyword_comments"] = result if result else 0

        # ManyChat email captures
        cursor.execute("SELECT COUNT(*) as count FROM manychat_interactions WHERE email_captured = 1")
        stats["total_emails_captured"] = cursor.fetchone()["count"]

        conn.close()
        return stats

    # ============================================================
    # Content Performance
    # ============================================================

    def get_top_performing_posts(self, limit: int = 10) -> List[Dict]:
        """Get top performing posts by engagement rate"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("""
            SELECT pc.*, c.full_caption,
                   (pc.our_likes + pc.our_comments + pc.our_shares) as total_engagement
            FROM posted_content pc
            LEFT JOIN captions c ON pc.caption_id = c.id
            WHERE pc.status = 'posted' AND pc.engagement_rate IS NOT NULL
            ORDER BY pc.engagement_rate DESC
            LIMIT ?
        """, (limit,))

        results = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return results

    def get_worst_performing_posts(self, limit: int = 10) -> List[Dict]:
        """Get worst performing posts by engagement rate"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("""
            SELECT pc.*, c.full_caption,
                   (pc.our_likes + pc.our_comments + pc.our_shares) as total_engagement
            FROM posted_content pc
            LEFT JOIN captions c ON pc.caption_id = c.id
            WHERE pc.status = 'posted' AND pc.engagement_rate IS NOT NULL
            ORDER BY pc.engagement_rate ASC
            LIMIT ?
        """, (limit,))

        results = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return results

    # ============================================================
    # Engagement Analytics
    # ============================================================

    def get_engagement_trends(
        self,
        days: int = 30
    ) -> Dict[str, List[Dict]]:
        """Get engagement trends over time"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()

        # Posted content trends
        cursor.execute("""
            SELECT
                DATE(posted_at) as date,
                COUNT(*) as posts,
                AVG(engagement_rate) as avg_engagement,
                SUM(our_likes) as total_likes,
                SUM(our_comments) as total_comments
            FROM posted_content
            WHERE posted_at >= ?
            GROUP BY DATE(posted_at)
            ORDER BY date ASC
        """, (cutoff_date,))

        posted_trends = [dict(row) for row in cursor.fetchall()]

        # Source content trends
        cursor.execute("""
            SELECT
                DATE(scraped_at) as date,
                COUNT(*) as items,
                AVG(engagement_rate) as avg_engagement
            FROM source_content
            WHERE scraped_at >= ?
            GROUP BY DATE(scraped_at)
            ORDER BY date ASC
        """, (cutoff_date,))

        source_trends = [dict(row) for row in cursor.fetchall()]

        conn.close()

        return {
            "posted": posted_trends,
            "source": source_trends
        }

    # ============================================================
    # Category Analytics
    # ============================================================

    def get_performance_by_category(self) -> List[Dict]:
        """Get performance breakdown by content category"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # This requires linking through captions or source categories
        # For now, we'll group by content_type
        cursor.execute("""
            SELECT
                media_type as category,
                COUNT(*) as posts,
                AVG(engagement_rate) as avg_engagement,
                SUM(our_likes) as total_likes,
                SUM(our_comments) as total_comments,
                SUM(affiliate_clicks) as total_clicks
            FROM posted_content
            WHERE status = 'posted'
            GROUP BY media_type
            ORDER BY avg_engagement DESC
        """)

        results = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return results

    # ============================================================
    # Affiliate Analytics
    # ============================================================

    def get_affiliate_performance(self, days: int = 30) -> Dict:
        """Get affiliate performance metrics"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()

        # Total clicks and revenue
        cursor.execute("""
            SELECT
                SUM(affiliate_clicks) as total_clicks,
                SUM(affiliate_conversions) as total_conversions,
                SUM(affiliate_revenue) as total_revenue,
                COUNT(*) as posts_with_affiliate
            FROM posted_content
            WHERE affiliate_link IS NOT NULL
              AND posted_at >= ?
        """, (cutoff_date,))

        summary = dict(cursor.fetchone())

        # Top performing affiliate posts
        cursor.execute("""
            SELECT
                pc.*,
                (pc.affiliate_clicks * 1.0 / NULLIF(pc.our_views, 0)) * 100 as ctr
            FROM posted_content pc
            WHERE affiliate_link IS NOT NULL
              AND pc.posted_at >= ?
            ORDER BY pc.affiliate_revenue DESC
            LIMIT 10
        """, (cutoff_date,))

        top_posts = [dict(row) for row in cursor.fetchall()]

        conn.close()

        return {
            **summary,
            "top_posts": top_posts
        }

    # ============================================================
    # Keyword & ManyChat Analytics
    # ============================================================

    def get_keyword_performance(self, limit: int = 20) -> List[Dict]:
        """Get performance by keyword"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                pc.target_keyword,
                COUNT(*) as posts,
                SUM(pc.keyword_comments) as total_comments,
                AVG(pc.engagement_rate) as avg_engagement,
                SUM(pc.affiliate_clicks) as total_clicks
            FROM posted_content pc
            WHERE pc.target_keyword IS NOT NULL
            GROUP BY pc.target_keyword
            ORDER BY total_comments DESC
            LIMIT ?
        """, (limit,))

        results = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return results

    def get_email_capture_stats(self, days: int = 30) -> Dict:
        """Get email capture statistics"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()

        # Total email captures
        cursor.execute("""
            SELECT COUNT(*) as total
            FROM manychat_interactions
            WHERE email_captured = 1
              AND created_at >= ?
        """, (cutoff_date,))

        total = cursor.fetchone()["total"]

        # Captures by keyword
        cursor.execute("""
            SELECT
                keyword_matched,
                COUNT(*) as captures
            FROM manychat_interactions
            WHERE email_captured = 1
              AND created_at >= ?
            GROUP BY keyword_matched
            ORDER BY captures DESC
        """, (cutoff_date,))

        by_keyword = [dict(row) for row in cursor.fetchall()]

        # Capture rate (emails / keyword comments)
        cursor.execute("""
            SELECT
                SUM(CASE WHEN email_captured = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as capture_rate
            FROM manychat_interactions
            WHERE keyword_matched IS NOT NULL
              AND created_at >= ?
        """, (cutoff_date,))

        rate_row = cursor.fetchone()
        capture_rate = rate_row["capture_rate"] if rate_row["capture_rate"] else 0

        conn.close()

        return {
            "total_captures": total,
            "by_keyword": by_keyword,
            "capture_rate": round(capture_rate, 2)
        }

    # ============================================================
    # Recommendations
    # ============================================================

    def get_recommendations(self) -> List[Dict]:
        """Get actionable recommendations based on analytics"""
        recommendations = []

        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # Check for pending content
        cursor.execute("SELECT COUNT(*) as count FROM source_content WHERE status = 'pending'")
        pending = cursor.fetchone()["count"]
        if pending > 0:
            recommendations.append({
                "type": "content_generation",
                "priority": "high",
                "message": f"You have {pending} unprocessed source items. Generate captions to build your queue."
            })

        # Check for content ready to post
        cursor.execute("SELECT COUNT(*) as count FROM posted_content WHERE status = 'approved'")
        approved = cursor.fetchone()["count"]
        if approved > 0:
            recommendations.append({
                "type": "scheduling",
                "priority": "high",
                "message": f"You have {approved} approved posts ready to schedule."
            })

        # Check engagement rate
        cursor.execute("""
            SELECT AVG(engagement_rate) as avg_rate
            FROM posted_content
            WHERE status = 'posted' AND engagement_rate IS NOT NULL
        """)
        result = cursor.fetchone()
        if result and result["avg_rate"] and result["avg_rate"] < 5:
            recommendations.append({
                "type": "engagement",
                "priority": "medium",
                "message": f"Average engagement rate is {result['avg_rate']:.1f}%. Consider testing different caption styles or posting times."
            })

        conn.close()

        return recommendations


# ============================================================
# Report Generator
# ============================================================

class AnalyticsReport:
    """Generate formatted analytics reports"""

    def __init__(self):
        self.analytics = InstagramAnalytics()

    def generate_daily_report(self) -> str:
        """Generate a daily performance report"""
        stats = self.analytics.get_overview_stats()
        top_posts = self.analytics.get_top_performing_posts(limit=5)
        recommendations = self.analytics.get_recommendations()

        report = f"""
{'='*60}
INSTAGRAM AUTOMATION - DAILY REPORT
{'='*60}
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

OVERVIEW
-------
Content Library: {stats['total_scraped']} items
Published Posts: {stats['total_published']}
Scheduled Posts: {stats['total_scheduled']}
Avg Engagement: {stats['avg_engagement_rate']}%

AFFILIATE PERFORMANCE
---------------------
Total Clicks: {stats['total_affiliate_clicks']}
Total Revenue: ${stats['total_affiliate_revenue']:.2f}
Email Captures: {stats['total_emails_captured']}

TOP PERFORMING POSTS
--------------------
"""

        for i, post in enumerate(top_posts, 1):
            report += f"\n{i}. Engagement: {post.get('engagement_rate', 0):.1f}%"
            if post.get('full_caption'):
                caption_preview = post['full_caption'][:50] + "..."
                report += f"\n   Caption: {caption_preview}"

        if recommendations:
            report += f"\n\nRECOMMENDATIONS\n{'-'*20}"
            for rec in recommendations:
                report += f"\n[{rec['priority'].upper()}] {rec['message']}"

        report += f"\n{'='*60}\n"

        return report


if __name__ == "__main__":
    report = AnalyticsReport()
    print(report.generate_daily_report())
