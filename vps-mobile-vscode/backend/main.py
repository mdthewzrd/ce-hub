"""
VPS Mobile VSCode - Main API Server
FastAPI application serving mobile VSCode interface
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from pathlib import Path
import json
import logging

from config import (
    API_HOST, API_PORT, FRONTEND_DIR, AVAILABLE_MODELS,
    WORKSPACE_DIR, MAX_INSTANCES_PER_USER
)
from auth import UserManager, TokenManager
from session_manager import get_session_manager, ClaudeInstance

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s"
)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="VPS Mobile VSCode API",
    description="Multi-instance Claude mobile interface",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Managers
user_manager = UserManager()
session_manager = get_session_manager()


# Pydantic models
class UserRegister(BaseModel):
    username: str
    password: str
    email: Optional[str] = ""

class UserLogin(BaseModel):
    username: str
    password: str

class InstanceCreate(BaseModel):
    model: str

class CommandSend(BaseModel):
    command: str

class FileEdit(BaseModel):
    path: str
    content: str


# Dependency: Get current user from token
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    """Get current user from JWT token"""
    token = credentials.credentials
    payload = TokenManager.verify_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )

    username = payload.get("sub")
    user = user_manager.get_user(username)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    return user


# WebSocket connection manager
class ConnectionManager:
    """Manages WebSocket connections for instance streaming"""

    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, instance_id: str, websocket: WebSocket):
        """Connect to instance"""
        await websocket.accept()
        self.active_connections[instance_id] = websocket

    def disconnect(self, instance_id: str):
        """Disconnect from instance"""
        if instance_id in self.active_connections:
            del self.active_connections[instance_id]

    async def send_message(self, instance_id: str, message: str):
        """Send message to instance connection"""
        if instance_id in self.active_connections:
            await self.active_connections[instance_id].send_text(message)

    async def broadcast(self, message: str):
        """Broadcast to all connections"""
        for connection in self.active_connections.values():
            await connection.send_text(message)


connection_manager = ConnectionManager()


# =============================================================================
# Authentication Endpoints
# =============================================================================

@app.post("/api/auth/register")
async def register(user_data: UserRegister):
    """Register new user"""
    try:
        user = user_manager.create_user(
            username=user_data.username,
            password=user_data.password,
            email=user_data.email,
            admin=False
        )
        return {
            "success": True,
            "message": "User created successfully",
            "user": user
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@app.post("/api/auth/login")
async def login(login_data: UserLogin):
    """Login user"""
    user = user_manager.authenticate_user(
        login_data.username,
        login_data.password
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    # Create token
    token = TokenManager.create_access_token({
        "sub": user["username"],
        "admin": user["is_admin"]
    })

    return {
        "success": True,
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }


@app.get("/api/auth/me")
async def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get current user info"""
    return current_user


# =============================================================================
# Instance Endpoints
# =============================================================================

@app.get("/api/models")
async def get_available_models():
    """Get available Claude models"""
    return {
        "models": [
            {
                "id": model_id,
                "name": config["name"],
                "memory_mb": config["memory_mb"]
            }
            for model_id, config in AVAILABLE_MODELS.items()
        ]
    }


@app.get("/api/instances")
async def list_instances(current_user: Dict[str, Any] = Depends(get_current_user)):
    """List user's instances"""
    instances = session_manager.list_instances(current_user["username"])
    return {
        "instances": instances,
        "total": len(instances),
        "max_instances": MAX_INSTANCES_PER_USER
    }


@app.post("/api/instances")
async def create_instance(
    instance_data: InstanceCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Create new Claude instance"""
    instance, error = session_manager.create_instance(
        username=current_user["username"],
        model=instance_data.model
    )

    if not instance:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error
        )

    return {
        "success": True,
        "instance": instance.to_dict()
    }


@app.get("/api/instances/{instance_id}")
async def get_instance(
    instance_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get instance details"""
    instance = session_manager.get_instance(instance_id)

    if not instance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Instance not found"
        )

    # Check ownership
    if instance.username != current_user["username"] and not current_user["is_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    return instance.to_dict()


@app.delete("/api/instances/{instance_id}")
async def stop_instance(
    instance_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Stop Claude instance"""
    instance = session_manager.get_instance(instance_id)

    if not instance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Instance not found"
        )

    # Check ownership
    if instance.username != current_user["username"] and not current_user["is_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    success, message = session_manager.stop_instance(instance_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )

    return {
        "success": True,
        "message": message
    }


@app.post("/api/instances/{instance_id}/command")
async def send_command(
    instance_id: str,
    command_data: CommandSend,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Send command to instance"""
    instance = session_manager.get_instance(instance_id)

    if not instance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Instance not found"
        )

    # Check ownership
    if instance.username != current_user["username"] and not current_user["is_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    success, message = session_manager.send_command(
        instance_id,
        command_data.command
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )

    return {
        "success": True,
        "message": message
    }


@app.get("/api/instances/{instance_id}/output")
async def get_output(
    instance_id: str,
    lines: int = 100,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get instance output"""
    instance = session_manager.get_instance(instance_id)

    if not instance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Instance not found"
        )

    # Check ownership
    if instance.username != current_user["username"] and not current_user["is_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    success, output = session_manager.get_output(instance_id, lines)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=output
        )

    return {
        "success": True,
        "output": output
    }


# =============================================================================
# WebSocket Endpoint
# =============================================================================

@app.websocket("/ws/instance/{instance_id}")
async def instance_websocket(websocket: WebSocket, instance_id: str):
    """WebSocket connection for instance streaming"""
    # Authenticate from query params
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    payload = TokenManager.verify_token(token)
    if not payload:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    username = payload.get("sub")

    # Verify instance ownership
    instance = session_manager.get_instance(instance_id)
    if not instance or instance.username != username:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Accept connection
    await connection_manager.connect(instance_id, websocket)

    try:
        while True:
            # Receive command from client
            data = await websocket.receive_text()

            # Parse command
            try:
                command_data = json.loads(data)
                command = command_data.get("command", "")

                if command:
                    # Send to instance
                    success, message = session_manager.send_command(instance_id, command)

                    # Get output
                    success, output = session_manager.get_output(instance_id, lines=50)

                    # Send response
                    await websocket.send_json({
                        "success": success,
                        "output": output
                    })

            except json.JSONDecodeError:
                # Plain text command
                success, message = session_manager.send_command(instance_id, data)
                success, output = session_manager.get_output(instance_id, lines=50)
                await websocket.send_json({
                    "success": success,
                    "output": output
                })

    except WebSocketDisconnect:
        connection_manager.disconnect(instance_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        connection_manager.disconnect(instance_id)


# =============================================================================
# File System Endpoints
# =============================================================================

@app.get("/api/files")
async def list_files(
    path: str = "",
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """List files in user workspace"""
    # Build safe path
    user_workspace = WORKSPACE_DIR / current_user["username"]
    target_path = user_workspace / path.lstrip("/")

    # Security check
    if not str(target_path).startswith(str(user_workspace)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    if not target_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Path not found"
        )

    if target_path.is_file():
        return {
            "type": "file",
            "name": target_path.name,
            "path": str(target_path.relative_to(user_workspace)),
            "size": target_path.stat().st_size
        }

    # List directory
    items = []
    for item in target_path.iterdir():
        if item.name.startswith("."):
            continue

        items.append({
            "name": item.name,
            "path": str(item.relative_to(user_workspace)),
            "type": "directory" if item.is_dir() else "file",
            "size": item.stat().st_size if item.is_file() else 0
        })

    # Sort: directories first
    items.sort(key=lambda x: (x["type"] != "directory", x["name"].lower()))

    return {
        "type": "directory",
        "path": path,
        "items": items
    }


@app.get("/api/files/content")
async def get_file_content(
    path: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get file content"""
    user_workspace = WORKSPACE_DIR / current_user["username"]
    target_path = user_workspace / path.lstrip("/")

    # Security check
    if not str(target_path).startswith(str(user_workspace)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    if not target_path.exists() or not target_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    try:
        content = target_path.read_text()
        return {
            "success": True,
            "content": content
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read file: {str(e)}"
        )


@app.post("/api/files/save")
async def save_file(
    file_data: FileEdit,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Save file content"""
    user_workspace = WORKSPACE_DIR / current_user["username"]
    target_path = user_workspace / file_data.path.lstrip("/")

    # Security check
    if not str(target_path).startswith(str(user_workspace)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    # Create parent directories
    target_path.parent.mkdir(parents=True, exist_ok=True)

    # Write file
    try:
        target_path.write_text(file_data.content)
        return {
            "success": True,
            "message": "File saved"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to save file: {str(e)}"
        )


# =============================================================================
# System Endpoints
# =============================================================================

@app.get("/api/system/stats")
async def get_system_stats(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get system statistics"""
    if not current_user["is_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    stats = session_manager.get_system_stats()
    return stats


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "instances_running": len(session_manager.instances)
    }


# =============================================================================
# Frontend
# =============================================================================

@app.get("/", response_class=HTMLResponse)
async def serve_frontend():
    """Serve mobile interface"""
    index_file = FRONTEND_DIR / "index.html"
    if index_file.exists():
        return HTMLResponse(content=index_file.read_text())
    return HTMLResponse(content="<h1>VPS Mobile VSCode</h1><p>Frontend not found. Please deploy frontend files.</p>")


# =============================================================================
# Startup
# =============================================================================

@app.on_event("startup")
async def startup_event():
    """Startup tasks"""
    logger.info("Starting VPS Mobile VSCode API...")

    # Ensure directories exist
    from config import ensure_directories
    ensure_directories()

    # Clean up idle instances
    cleaned = session_manager.cleanup_idle_instances()
    if cleaned > 0:
        logger.info(f"Cleaned up {cleaned} idle instances")

    logger.info(f"API ready on {API_HOST}:{API_PORT}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=API_HOST,
        port=API_PORT,
        workers=4,
        reload=False
    )
