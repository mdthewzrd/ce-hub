"""
Notification Service for Semi-Automated Workflow
Manages posting reminders and notifications
"""

import os
import sqlite3
from typing import Dict, List, Optional
from datetime import datetime, timedelta

# Database - use absolute path
DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "instagram_automation.db"))


class NotificationService:
    """
    Manages notifications for posting reminders

    Types:
    - posting_reminder: Time to post notification
    - content_ready: Content has been prepared
    - trend_alert: Trending sound discovered
    - system: System notifications
    """

    def create_notification(
        self,
        ready_content_id: int,
        scheduled_id: Optional[int],
        notification_type: str = "posting_reminder",
        title: str = "",
        message: str = ""
    ) -> int:
        """
        Create a new notification

        Args:
            ready_content_id: Associated ready content
            scheduled_id: Associated schedule record
            notification_type: Type of notification
            title: Notification title
            message: Notification message

        Returns:
            Notification ID
        """
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # Generate default title/message if not provided
        if not title:
            title = self._get_default_title(notification_type)

        if not message:
            message = self._get_default_message(notification_type)

        cursor.execute("""
            INSERT INTO user_notifications (
                ready_content_id, scheduled_id, type, title, message,
                created_at
            ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        """, (ready_content_id, scheduled_id, notification_type, title, message))

        notification_id = cursor.lastrowid
        conn.commit()
        conn.close()

        return notification_id

    def get_pending_notifications(self, limit: int = 50) -> List[Dict]:
        """
        Get notifications that haven't been read/actioned

        Args:
            limit: Maximum number to return

        Returns:
            List of notification dicts
        """
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("""
            SELECT n.*, rc.caption, rc.status as content_status,
                   sc.account, sc.content_type
            FROM user_notifications n
            LEFT JOIN ready_content rc ON n.ready_content_id = rc.id
            LEFT JOIN source_content sc ON rc.source_id = sc.id
            WHERE n.action_taken = 0
            ORDER BY n.created_at DESC
            LIMIT ?
        """, (limit,))

        notifications = [dict(row) for row in cursor.fetchall()]
        conn.close()

        return notifications

    def mark_as_read(self, notification_id: int) -> bool:
        """Mark notification as read"""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE user_notifications
            SET read_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (notification_id,))

        success = cursor.rowcount > 0
        conn.commit()
        conn.close()

        return success

    def mark_action_taken(self, notification_id: int, action_type: str = "posted") -> bool:
        """
        Mark notification as actioned (user posted the content)

        Args:
            notification_id: Notification ID
            action_type: Type of action taken

        Returns:
            True if successful
        """
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE user_notifications
            SET action_taken = 1,
                action_type = ?,
                read_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (action_type, notification_id))

        success = cursor.rowcount > 0

        # Also update ready_content status
        if success:
            cursor.execute("""
                UPDATE ready_content
                SET status = 'posted', updated_at = CURRENT_TIMESTAMP
                WHERE id = (SELECT ready_content_id FROM user_notifications WHERE id = ?)
            """, (notification_id,))

        conn.commit()
        conn.close()

        return success

    def get_notifications(self, unread_only: bool = False, limit: int = 50) -> List[Dict]:
        """
        Get notifications with optional filtering

        Args:
            unread_only: Only return unread notifications
            limit: Maximum number to return

        Returns:
            List of notification dicts
        """
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        query = """
            SELECT n.*, rc.caption, rc.video_path,
                   rc.hashtags, rc.status as content_status,
                   sc.account, sc.description as source_description
            FROM user_notifications n
            LEFT JOIN ready_content rc ON n.ready_content_id = rc.id
            LEFT JOIN source_content sc ON rc.source_id = sc.id
        """

        if unread_only:
            query += " WHERE n.read_at IS NULL"

        query += " ORDER BY n.created_at DESC LIMIT ?"

        cursor.execute(query, (limit,))
        notifications = [dict(row) for row in cursor.fetchall()]
        conn.close()

        return notifications

    def get_ready_content_for_notification(self, ready_content_id: int) -> Optional[Dict]:
        """
        Get full ready content details for notification display

        Args:
            ready_content_id: Ready content ID

        Returns:
            Dict with all content details or None
        """
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("""
            SELECT rc.*, sc.account, sc.content_type, sc.description as source_description,
                   sc.original_url, sc.original_likes, sc.original_comments
            FROM ready_content rc
            LEFT JOIN source_content sc ON rc.source_id = sc.id
            WHERE rc.id = ?
        """, (ready_content_id,))

        result = cursor.fetchone()
        conn.close()

        return dict(result) if result else None

    def check_due_notifications(self) -> List[Dict]:
        """
        Check for notifications that should be sent now
        (scheduled content where posting time has arrived)

        Returns:
            List of due notifications
        """
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        now = datetime.now().isoformat()

        # Find scheduled items that are due
        cursor.execute("""
            SELECT ps.*, rc.id as ready_content_id, rc.caption,
                   sc.account, sc.description
            FROM posting_schedule ps
            JOIN ready_content rc ON ps.ready_content_id = rc.id
            JOIN source_content sc ON rc.source_id = sc.id
            WHERE ps.scheduled_for <= ? AND ps.notification_sent = 0
            ORDER BY ps.scheduled_for ASC
        """, (now,))

        due_items = [dict(row) for row in cursor.fetchall()]
        conn.close()

        return due_items

    def send_notification(self, notification_id: int) -> bool:
        """
        Mark notification as sent

        Args:
            notification_id: Notification ID

        Returns:
            True if successful
        """
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE user_notifications
            SET sent_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (notification_id,))

        success = cursor.rowcount > 0
        conn.commit()
        conn.close()

        return success

    def create_posting_reminder(self, ready_content_id: int, scheduled_for: str) -> int:
        """
        Create a posting reminder notification for scheduled content

        Args:
            ready_content_id: Ready content ID
            scheduled_for: When content is scheduled for posting

        Returns:
            Notification ID
        """
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # First create the schedule record
        cursor.execute("""
            INSERT INTO posting_schedule (ready_content_id, scheduled_for)
            VALUES (?, ?)
        """, (ready_content_id, scheduled_for))

        schedule_id = cursor.lastrowid
        conn.commit()
        conn.close()

        # Then create the notification
        return self.create_notification(
            ready_content_id=ready_content_id,
            scheduled_id=schedule_id,
            notification_type="posting_reminder",
            title="Time to Post! 📱",
            message=f"You have content scheduled for {scheduled_for}"
        )

    def get_notification_stats(self) -> Dict:
        """Get notification statistics"""
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # Total notifications
        cursor.execute("SELECT COUNT(*) as count FROM user_notifications")
        total = cursor.fetchone()['count']

        # Unread
        cursor.execute("SELECT COUNT(*) as count FROM user_notifications WHERE read_at IS NULL")
        unread = cursor.fetchone()['count']

        # Pending action
        cursor.execute("SELECT COUNT(*) as count FROM user_notifications WHERE action_taken = 0")
        pending = cursor.fetchone()['count']

        # By type
        cursor.execute("""
            SELECT type, COUNT(*) as count
            FROM user_notifications
            GROUP BY type
        """)
        by_type = {row['type']: row['count'] for row in cursor.fetchall()}

        conn.close()

        return {
            "total": total,
            "unread": unread,
            "pending_action": pending,
            "by_type": by_type
        }

    def _get_default_title(self, notification_type: str) -> str:
        """Get default title for notification type"""
        titles = {
            "posting_reminder": "Time to Post! 📱",
            "content_ready": "Content Ready ✅",
            "trend_alert": "New Trending Sound 🔥",
            "system": "System Notification ℹ️"
        }
        return titles.get(notification_type, "Notification")

    def _get_default_message(self, notification_type: str) -> str:
        """Get default message for notification type"""
        messages = {
            "posting_reminder": "Your scheduled content is ready to post. Download the video and copy the caption to post on Instagram.",
            "content_ready": "New content has been prepared and is ready for scheduling.",
            "trend_alert": "A new trending sound has been discovered. Consider using it in your next post!",
            "system": "System notification"
        }
        return messages.get(notification_type, "You have a new notification")


# ============================================================
# Notification Scheduler
# ============================================================

class NotificationScheduler:
    """
    Background scheduler for checking and sending notifications
    """

    def __init__(self):
        self.service = NotificationService()

    def check_and_send_due_notifications(self) -> List[Dict]:
        """
        Check for due notifications and send them

        Returns:
            List of sent notifications
        """
        due_items = self.service.check_due_notifications()
        sent = []

        for item in due_items:
            # Create notification if it doesn't exist
            notification_id = self.service.create_notification(
                ready_content_id=item['ready_content_id'],
                scheduled_id=item['id'],
                notification_type="posting_reminder",
                title="Time to Post! 📱",
                message=f"Content from @{item['account']} is scheduled for now."
            )

            # Mark as sent
            self.service.send_notification(notification_id)

            # Update posting_schedule to mark notification_sent
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE posting_schedule
                SET notification_sent = 1
                WHERE id = ?
            """, (item['id'],))
            conn.commit()
            conn.close()

            sent.append({
                "notification_id": notification_id,
                "ready_content_id": item['ready_content_id'],
                "scheduled_for": item['scheduled_for']
            })

        return sent


if __name__ == "__main__":
    # Test notification service
    print("Notification Service Test")
    print("=" * 50)

    service = NotificationService()

    # Get stats
    stats = service.get_notification_stats()
    print(f"\nNotification Stats:")
    print(f"  Total: {stats['total']}")
    print(f"  Unread: {stats['unread']}")
    print(f"  Pending Action: {stats['pending_action']}")

    # Get pending notifications
    pending = service.get_pending_notifications()
    print(f"\nPending Notifications: {len(pending)}")

    # Check for due notifications
    scheduler = NotificationScheduler()
    due = scheduler.check_and_send_due_notifications()
    print(f"\nDue Notifications: {len(due)}")
