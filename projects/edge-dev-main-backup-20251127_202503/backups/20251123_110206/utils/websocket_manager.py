"""
WebSocket connection manager for real-time scan progress updates
"""

import json
import logging
from typing import Dict, List
from fastapi import WebSocket
from models.schemas import ScanProgress, WebSocketMessage

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections for real-time updates"""

    def __init__(self):
        # Store active connections by scan_id
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, scan_id: str):
        """Accept a new WebSocket connection for a specific scan"""
        await websocket.accept()

        if scan_id not in self.active_connections:
            self.active_connections[scan_id] = []

        self.active_connections[scan_id].append(websocket)
        logger.info(f"WebSocket connected for scan {scan_id}. Total connections: {len(self.active_connections[scan_id])}")

    def disconnect(self, websocket: WebSocket, scan_id: str):
        """Remove a WebSocket connection"""
        if scan_id in self.active_connections:
            if websocket in self.active_connections[scan_id]:
                self.active_connections[scan_id].remove(websocket)
                logger.info(f"WebSocket disconnected for scan {scan_id}. Remaining connections: {len(self.active_connections[scan_id])}")

                # Clean up empty connection lists
                if not self.active_connections[scan_id]:
                    del self.active_connections[scan_id]

    async def send_progress_update(self, scan_id: str, progress: ScanProgress):
        """Send progress update to all connected clients for a specific scan"""
        if scan_id not in self.active_connections:
            return

        message = WebSocketMessage(
            type="progress",
            scan_id=scan_id,
            data=progress.dict()
        )

        # Send to all connected clients for this scan
        disconnected_clients = []
        for websocket in self.active_connections[scan_id]:
            try:
                await websocket.send_text(message.json())
            except Exception as e:
                logger.error(f"Error sending WebSocket message to client: {str(e)}")
                disconnected_clients.append(websocket)

        # Remove disconnected clients
        for websocket in disconnected_clients:
            self.disconnect(websocket, scan_id)

    async def send_error(self, scan_id: str, error_message: str, details: str = None):
        """Send error message to all connected clients for a specific scan"""
        if scan_id not in self.active_connections:
            return

        message = WebSocketMessage(
            type="error",
            scan_id=scan_id,
            data={
                "error": error_message,
                "details": details
            }
        )

        disconnected_clients = []
        for websocket in self.active_connections[scan_id]:
            try:
                await websocket.send_text(message.json())
            except Exception as e:
                logger.error(f"Error sending WebSocket error to client: {str(e)}")
                disconnected_clients.append(websocket)

        # Remove disconnected clients
        for websocket in disconnected_clients:
            self.disconnect(websocket, scan_id)

    async def send_completion(self, scan_id: str, results_summary: dict):
        """Send completion message to all connected clients for a specific scan"""
        if scan_id not in self.active_connections:
            return

        message = WebSocketMessage(
            type="complete",
            scan_id=scan_id,
            data=results_summary
        )

        disconnected_clients = []
        for websocket in self.active_connections[scan_id]:
            try:
                await websocket.send_text(message.json())
            except Exception as e:
                logger.error(f"Error sending WebSocket completion to client: {str(e)}")
                disconnected_clients.append(websocket)

        # Remove disconnected clients
        for websocket in disconnected_clients:
            self.disconnect(websocket, scan_id)

    async def broadcast_system_message(self, message_type: str, data: dict):
        """Broadcast a system message to all connected clients"""
        message = WebSocketMessage(
            type=message_type,
            scan_id="system",
            data=data
        )

        for scan_id, connections in self.active_connections.items():
            disconnected_clients = []
            for websocket in connections:
                try:
                    await websocket.send_text(message.json())
                except Exception as e:
                    logger.error(f"Error broadcasting system message: {str(e)}")
                    disconnected_clients.append(websocket)

            # Remove disconnected clients
            for websocket in disconnected_clients:
                self.disconnect(websocket, scan_id)

    def get_connection_count(self, scan_id: str = None) -> int:
        """Get the number of active connections for a specific scan or total"""
        if scan_id:
            return len(self.active_connections.get(scan_id, []))
        else:
            return sum(len(connections) for connections in self.active_connections.values())

    def get_active_scans(self) -> List[str]:
        """Get list of scan IDs with active WebSocket connections"""
        return list(self.active_connections.keys())