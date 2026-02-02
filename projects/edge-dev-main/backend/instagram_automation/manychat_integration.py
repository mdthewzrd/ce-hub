"""
ManyChat Integration
Webhook handler for ManyChat keyword detection and automation
"""

import os
import json
from typing import Dict, Optional, List
from datetime import datetime
from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

# Local imports
from database_schema import DB_PATH, log_event
import sqlite3


# ============================================================
# Data Models
# ============================================================

class ManyChatWebhookPayload(BaseModel):
    """ManyChat webhook payload model"""
    triggered_at: str
    account_id: str
    comment_id: str
    comment_text: str
    post_id: str
    commenter_username: str
    commenter_id: str
    custom_fields: Optional[Dict] = None


class EmailCapture(BaseModel):
    """Email capture from ManyChat flow"""
    manychat_id: str
    instagram_username: str
    email: str
    source_keyword: str
    posted_id: Optional[int] = None


# ============================================================
# ManyChat Integration Service
# ============================================================

class ManyChatIntegration:
    """Service for handling ManyChat webhooks and interactions"""

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize ManyChat integration

        Args:
            api_key: ManyChat API key (optional, for API calls)
        """
        self.api_key = api_key or os.getenv("MANYCHAT_API_KEY")
        self.base_url = "https://api.manychat.com"

    def handle_comment_webhook(self, payload: Dict) -> Dict:
        """
        Handle incoming webhook from ManyChat when comment keyword is detected

        Args:
            payload: Webhook payload from ManyChat

        Returns:
            Response dict
        """
        try:
            # Extract relevant data
            comment_id = payload.get("comment_id")
            comment_text = payload.get("comment_text", "").strip().upper()
            post_id = payload.get("post_id")
            commenter_username = payload.get("commenter_username")
            commenter_id = payload.get("commenter_id")

            # Find matching post in our database
            posted_id = self._find_post_by_instagram_id(post_id)

            # Record interaction
            interaction_id = self._record_interaction(
                posted_id=posted_id,
                comment_id=comment_id,
                username=commenter_username,
                comment_text=comment_text,
                keyword_matched=comment_text
            )

            # Update keyword comment count
            if posted_id:
                self._update_keyword_count(posted_id)

            log_event(
                "INFO",
                "manychat",
                f"Comment webhook processed: {commenter_username} commented '{comment_text}'"
            )

            return {
                "success": True,
                "interaction_id": interaction_id,
                "keyword_matched": comment_text
            }

        except Exception as e:
            log_event(
                "ERROR",
                "manychat",
                f"Webhook processing failed: {str(e)}"
            )
            raise

    def capture_email(self, email_data: EmailCapture) -> Dict:
        """
        Capture email from ManyChat flow

        Args:
            email_data: Email capture data

        Returns:
            Response dict
        """
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()

            # Update interaction with email
            cursor.execute("""
                UPDATE manychat_interactions
                SET email_captured = 1,
                    captured_email = ?,
                    interaction_stage = 'email_captured'
                WHERE manychat_id = ?
                ORDER BY created_at DESC
                LIMIT 1
            """, (email_data.email, email_data.manychat_id))

            conn.commit()
            conn.close()

            log_event(
                "INFO",
                "manychat",
                f"Email captured: {email_data.email} from {email_data.instagram_username}"
            )

            return {"success": True, "email": email_data.email}

        except Exception as e:
            log_event("ERROR", "manychat", f"Email capture failed: {str(e)}")
            raise

    def get_keyword_stats(self, posted_id: int) -> Dict:
        """Get keyword statistics for a post"""
        try:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            # Get total keyword comments
            cursor.execute("""
                SELECT COUNT(*) as count
                FROM manychat_interactions
                WHERE posted_id = ? AND keyword_matched IS NOT NULL
            """, (posted_id,))
            total = cursor.fetchone()["count"]

            # Get unique keywords
            cursor.execute("""
                SELECT keyword_matched, COUNT(*) as count
                FROM manychat_interactions
                WHERE posted_id = ? AND keyword_matched IS NOT NULL
                GROUP BY keyword_matched
                ORDER BY count DESC
            """, (posted_id,))
            keywords = [dict(row) for row in cursor.fetchall()]

            # Get email captures
            cursor.execute("""
                SELECT COUNT(*) as count
                FROM manychat_interactions
                WHERE posted_id = ? AND email_captured = 1
            """, (posted_id,))
            emails = cursor.fetchone()["count"]

            conn.close()

            return {
                "total_keyword_comments": total,
                "keywords": keywords,
                "emails_captured": emails
            }

        except Exception as e:
            print(f"Error getting keyword stats: {e}")
            return {}

    # ============================================================
    # Helper Methods
    # ============================================================

    def _find_post_by_instagram_id(self, instagram_post_id: str) -> Optional[int]:
        """Find our posted_id from Instagram post ID"""
        try:
            # Note: We need to map Instagram post IDs to our posted_content table
            # This would require storing the Instagram post ID when posting
            # For now, we'll try to match by URL pattern

            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            # Try to find by media_url or similar field
            # This is a simplified approach - you may need to adjust based on your data
            cursor.execute("""
                SELECT id FROM posted_content
                WHERE media_url LIKE ?
                ORDER BY created_at DESC
                LIMIT 1
            """, (f"%{instagram_post_id}%",))

            row = cursor.fetchone()
            conn.close()

            return row["id"] if row else None

        except Exception as e:
            print(f"Error finding post: {e}")
            return None

    def _record_interaction(
        self,
        posted_id: Optional[int],
        comment_id: str,
        username: str,
        comment_text: str,
        keyword_matched: str
    ) -> int:
        """Record ManyChat interaction in database"""
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()

            cursor.execute("""
                INSERT INTO manychat_interactions (
                    posted_id, comment_id, username, comment_text,
                    keyword_matched, interaction_stage
                ) VALUES (?, ?, ?, ?, ?, 'keyword_matched')
            """, (posted_id, comment_id, username, comment_text, keyword_matched))

            interaction_id = cursor.lastrowid
            conn.commit()
            conn.close()

            return interaction_id

        except Exception as e:
            print(f"Error recording interaction: {e}")
            return 0

    def _update_keyword_count(self, posted_id: int):
        """Update keyword comment count for a post"""
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()

            cursor.execute("""
                UPDATE posted_content
                SET keyword_comments = keyword_comments + 1
                WHERE id = ?
            """, (posted_id,))

            conn.commit()
            conn.close()

        except Exception as e:
            print(f"Error updating keyword count: {e}")


# ============================================================
# FastAPI Webhook Endpoints
# ============================================================

def create_manychat_app() -> FastAPI:
    """Create FastAPI app for ManyChat webhooks"""
    app = FastAPI(title="ManyChat Integration API")

    manychat = ManyChatIntegration()

    @app.get("/")
    async def root():
        return {
            "service": "ManyChat Integration API",
            "status": "running",
            "endpoints": {
                "webhook": "/webhook/comment",
                "email": "/webhook/email",
                "stats": "/stats/{posted_id}"
            }
        }

    @app.post("/webhook/comment")
    async def comment_webhook(request: Request):
        """Handle ManyChat comment webhook"""
        try:
            # Get raw payload
            payload = await request.json()

            # Process webhook
            result = manychat.handle_comment_webhook(payload)

            return JSONResponse(content=result)

        except Exception as e:
            log_event("ERROR", "manychat", f"Webhook error: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    @app.post("/webhook/email")
    async def email_webhook(email_data: EmailCapture):
        """Handle email capture from ManyChat flow"""
        try:
            result = manychat.capture_email(email_data)
            return result
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @app.get("/stats/{posted_id}")
    async def get_stats(posted_id: int):
        """Get keyword statistics for a post"""
        try:
            stats = manychat.get_keyword_stats(posted_id)
            return stats
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @app.get("/health")
    async def health():
        """Health check"""
        return {"status": "healthy"}

    return app


# ============================================================
# ManyChat API Client
# ============================================================

class ManyChatAPIClient:
    """Client for making API calls to ManyChat"""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.manychat.com"

    def trigger_flow(
        self,
        manychat_id: str,
        flow_id: str,
        params: Optional[Dict] = None
    ) -> Optional[Dict]:
        """
        Trigger a ManyChat flow for a user

        Args:
            manychat_id: ManyChat user ID
            flow_id: Flow ID to trigger
            params: Optional parameters for the flow

        Returns:
            Response dict or None
        """
        import requests

        try:
            url = f"{self.base_url}/fb/flow/start"
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }

            data = {
                "subscriber_id": manychat_id,
                "flow_id": flow_id
            }

            if params:
                data["data"] = params

            response = requests.post(url, json=data, headers=headers, timeout=10)
            response.raise_for_status()

            return response.json()

        except Exception as e:
            print(f"Error triggering ManyChat flow: {e}")
            return None

    def get_subscriber_info(self, manychat_id: str) -> Optional[Dict]:
        """Get subscriber information from ManyChat"""
        import requests

        try:
            url = f"{self.base_url}/fb/subscriber/info"
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }

            params = {"subscriber_id": manychat_id}

            response = requests.get(url, params=params, headers=headers, timeout=10)
            response.raise_for_status()

            return response.json()

        except Exception as e:
            print(f"Error getting subscriber info: {e}")
            return None

    def set_custom_field(
        self,
        manychat_id: str,
        field_id: str,
        value: str
    ) -> bool:
        """Set a custom field for a subscriber"""
        import requests

        try:
            url = f"{self.base_url}/fb/subscriber/setCustomField"
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }

            data = {
                "subscriber_id": manychat_id,
                "field_id": field_id,
                "value": value
            }

            response = requests.post(url, json=data, headers=headers, timeout=10)
            response.raise_for_status()

            return True

        except Exception as e:
            print(f"Error setting custom field: {e}")
            return False


# ============================================================
# Command Line Interface
# ============================================================

if __name__ == "__main__":
    import uvicorn

    print("\n" + "=" * 50)
    print("MANYCHAT INTEGRATION API")
    print("=" * 50)
    print("\nServer starting on http://localhost:4401")
    print("Webhook URL: http://localhost:4401/webhook/comment")
    print("\n" + "=" * 50)

    app = create_manychat_app()
    uvicorn.run(app, host="0.0.0.0", port=4401)
