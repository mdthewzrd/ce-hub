"""
WebSocket manager for real-time AI agent communication
"""

from fastapi import WebSocket
from typing import List, Dict, Any
import logging
import json

logger = logging.getLogger(__name__)


class WebSocketManager:
    """Manages WebSocket connections and message routing"""

    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.user_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: str = None):
        """Accept a new WebSocket connection"""
        await websocket.accept()
        self.active_connections.append(websocket)

        if user_id:
            self.user_connections[user_id] = websocket

        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket, user_id: str = None):
        """Remove a WebSocket connection"""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

        if user_id and user_id in self.user_connections:
            del self.user_connections[user_id]

        logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")

    async def send_personal_message(self, message: Dict[str, Any], websocket: WebSocket):
        """Send a message to a specific WebSocket connection"""
        try:
            if websocket in self.active_connections:
                await websocket.send_json(message)
            else:
                logger.warning("Attempted to send message to inactive WebSocket")
        except Exception as e:
            logger.error(f"Error sending WebSocket message: {str(e)}")
            self.disconnect(websocket)

    async def send_user_message(self, message: Dict[str, Any], user_id: str):
        """Send a message to a specific user"""
        if user_id in self.user_connections:
            websocket = self.user_connections[user_id]
            await self.send_personal_message(message, websocket)
        else:
            logger.warning(f"User {user_id} not found in active connections")

    async def broadcast(self, message: Dict[str, Any]):
        """Broadcast a message to all active connections"""
        disconnected = []

        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting message: {str(e)}")
                disconnected.append(connection)

        # Clean up disconnected connections
        for connection in disconnected:
            self.disconnect(connection)

    async def send_progress_update(self, task_id: str, progress: int, message: str):
        """Send progress update to all connections"""
        await self.broadcast({
            "type": "progress_update",
            "task_id": task_id,
            "progress": progress,
            "message": message,
            "timestamp": self._get_timestamp()
        })

    async def send_agent_status(self, agent_name: str, status: str, data: Dict[str, Any] = None):
        """Send agent status update"""
        await self.broadcast({
            "type": "agent_status",
            "agent": agent_name,
            "status": status,
            "data": data or {},
            "timestamp": self._get_timestamp()
        })

    def _get_timestamp(self) -> str:
        """Get current timestamp"""
        from datetime import datetime
        return datetime.utcnow().isoformat()

    def get_connection_count(self) -> int:
        """Get number of active connections"""
        return len(self.active_connections)

    def get_user_count(self) -> int:
        """Get number of authenticated users"""
        return len(self.user_connections)