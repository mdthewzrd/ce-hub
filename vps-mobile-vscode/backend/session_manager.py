"""
Claude Instance Manager
Manages multiple Claude instances with tmux sessions
"""

import subprocess
import time
import json
from pathlib import Path
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import psutil
import os

from config import (
    INSTANCES_DIR, SESSIONS_DIR, AVAILABLE_MODELS,
    MAX_INSTANCES_PER_USER, MAX_INSTANCES_TOTAL,
    MIN_FREE_MEMORY_MB, INSTANCE_IDLE_TIMEOUT_MINUTES
)


class ClaudeInstance:
    """Represents a single Claude instance"""

    def __init__(
        self,
        instance_id: str,
        username: str,
        model: str,
        tmux_session: str
    ):
        self.instance_id = instance_id
        self.username = username
        self.model = model
        self.tmux_session = tmux_session
        self.created_at = datetime.utcnow()
        self.last_activity = datetime.utcnow()
        self.status = "starting"  # starting, running, idle, stopping, stopped
        self.pid = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "instance_id": self.instance_id,
            "username": self.username,
            "model": self.model,
            "model_name": AVAILABLE_MODELS.get(self.model, {}).get("name", self.model),
            "tmux_session": self.tmux_session,
            "created_at": self.created_at.isoformat(),
            "last_activity": self.last_activity.isoformat(),
            "status": self.status,
            "pid": self.pid,
            "uptime_seconds": (datetime.utcnow() - self.created_at).total_seconds()
        }


class SessionManager:
    """Manages Claude instances using tmux"""

    def __init__(self):
        self.instances_dir = INSTANCES_DIR
        self.instances_dir.mkdir(parents=True, exist_ok=True)

        self.sessions_dir = SESSIONS_DIR
        self.sessions_dir.mkdir(parents=True, exist_ok=True)

        # Load existing instances
        self.instances: Dict[str, ClaudeInstance] = {}
        self._load_instances()

    def _load_instances(self):
        """Load existing instances from disk"""
        for instance_file in self.instances_dir.glob("*.json"):
            try:
                with open(instance_file, 'r') as f:
                    data = json.load(f)
                    instance = ClaudeInstance(
                        instance_id=data["instance_id"],
                        username=data["username"],
                        model=data["model"],
                        tmux_session=data["tmux_session"]
                    )
                    instance.created_at = datetime.fromisoformat(data["created_at"])
                    instance.last_activity = datetime.fromisoformat(data["last_activity"])
                    instance.status = data["status"]
                    instance.pid = data.get("pid")

                    # Check if still running
                    if instance.pid and self._is_process_running(instance.pid):
                        self.instances[instance.instance_id] = instance
                    else:
                        # Clean up dead instance
                        instance_file.unlink()
            except Exception as e:
                print(f"Error loading instance {instance_file}: {e}")

    def _is_process_running(self, pid: int) -> bool:
        """Check if process is running"""
        try:
            return psutil.pid_exists(pid) and psutil.Process(pid).is_running()
        except:
            return False

    def _get_free_memory_mb(self) -> int:
        """Get free memory in MB"""
        try:
            return psutil.virtual_memory().available // (1024 * 1024)
        except:
            return 2048

    def _can_create_instance(self, username: str, model: str) -> tuple[bool, str]:
        """Check if instance can be created"""
        # Check if model exists
        if model not in AVAILABLE_MODELS:
            return False, f"Model '{model}' not available"

        # Check total instances
        if len(self.instances) >= MAX_INSTANCES_TOTAL:
            return False, f"Maximum total instances ({MAX_INSTANCES_TOTAL}) reached"

        # Check user instances
        user_instances = [i for i in self.instances.values() if i.username == username]
        if len(user_instances) >= MAX_INSTANCES_PER_USER:
            return False, f"Maximum instances per user ({MAX_INSTANCES_PER_USER}) reached"

        # Check memory
        model_memory = AVAILABLE_MODELS[model]["memory_mb"]
        free_memory = self._get_free_memory_mb()
        if free_memory < model_memory + MIN_FREE_MEMORY_MB:
            return False, f"Insufficient memory ({free_memory}MB free, {model_memory}MB needed)"

        return True, ""

    def _find_claude_executable(self) -> Optional[str]:
        """Find Claude CLI executable"""
        possible_paths = [
            "/usr/local/bin/claude",
            "/opt/homebrew/bin/claude",
            "~/.local/bin/claude",
            str(Path.home() / ".local" / "bin" / "claude"),
            "/opt/mobile-vscode/venv/bin/claude"
        ]

        for path in possible_paths:
            expanded = Path(path).expanduser()
            if expanded.exists():
                return str(expanded)

        # Try which
        try:
            result = subprocess.run(['which', 'claude'], capture_output=True, text=True)
            if result.returncode == 0:
                return result.stdout.strip()
        except:
            pass

        return None

    def create_instance(
        self,
        username: str,
        model: str
    ) -> tuple[Optional[ClaudeInstance], str]:
        """Create new Claude instance"""

        # Check if can create
        can_create, error_msg = self._can_create_instance(username, model)
        if not can_create:
            return None, error_msg

        # Generate instance ID
        instance_id = f"{username}-{int(time.time())}"
        tmux_session = f"mobile-vscode-{instance_id}"

        # Create instance
        instance = ClaudeInstance(
            instance_id=instance_id,
            username=username,
            model=model,
            tmux_session=tmux_session
        )

        # Find claude executable
        claude_path = self._find_claude_executable()
        if not claude_path:
            return None, "Claude CLI not found. Install with: npm install -g @anthropic-ai/claude-code"

        try:
            # Create tmux session with Claude
            cmd = [
                "tmux", "new-session",
                "-d", "-s", tmux_session,
                f"{claude_path} --model {model} --dangerously-skip-permissions"
            ]

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=10
            )

            if result.returncode != 0:
                return None, f"Failed to start Claude: {result.stderr}"

            # Get session PID
            instance.status = "running"
            instance.pid = self._get_tmux_session_pid(tmux_session)

            # Save instance
            self.instances[instance_id] = instance
            self._save_instance(instance)

            return instance, "Instance created successfully"

        except subprocess.TimeoutExpired:
            return None, "Claude startup timeout"
        except Exception as e:
            return None, f"Failed to create instance: {str(e)}"

    def _get_tmux_session_pid(self, session_name: str) -> Optional[int]:
        """Get PID of tmux session"""
        try:
            result = subprocess.run(
                ["tmux", "list-panes", "-t", session_name, "-F", "#{pane_pid}"],
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                return int(result.stdout.strip())
        except:
            pass
        return None

    def _save_instance(self, instance: ClaudeInstance):
        """Save instance to disk"""
        instance_file = self.instances_dir / f"{instance.instance_id}.json"
        with open(instance_file, 'w') as f:
            json.dump(instance.to_dict(), f, indent=2)

    def get_instance(self, instance_id: str) -> Optional[ClaudeInstance]:
        """Get instance by ID"""
        return self.instances.get(instance_id)

    def list_instances(self, username: Optional[str] = None) -> List[Dict[str, Any]]:
        """List instances"""
        instances = list(self.instances.values())

        if username:
            instances = [i for i in instances if i.username == username]

        return [i.to_dict() for i in instances]

    def update_activity(self, instance_id: str):
        """Update instance last activity"""
        instance = self.instances.get(instance_id)
        if instance:
            instance.last_activity = datetime.utcnow()
            instance.status = "running"
            self._save_instance(instance)

    def stop_instance(self, instance_id: str) -> tuple[bool, str]:
        """Stop Claude instance"""
        instance = self.instances.get(instance_id)
        if not instance:
            return False, "Instance not found"

        try:
            # Kill tmux session
            subprocess.run(
                ["tmux", "kill-session", "-t", instance.tmux_session],
                capture_output=True
            )

            # Update status
            instance.status = "stopped"

            # Remove from memory
            del self.instances[instance_id]

            # Remove file
            instance_file = self.instances_dir / f"{instance_id}.json"
            if instance_file.exists():
                instance_file.unlink()

            return True, "Instance stopped"

        except Exception as e:
            return False, f"Failed to stop instance: {str(e)}"

    def send_command(
        self,
        instance_id: str,
        command: str
    ) -> tuple[bool, str]:
        """Send command to Claude instance"""
        instance = self.instances.get(instance_id)
        if not instance:
            return False, "Instance not found"

        if instance.status not in ["running", "idle"]:
            return False, f"Instance not ready (status: {instance.status})"

        try:
            # Send keys to tmux session
            cmd = [
                "tmux", "send-keys",
                "-t", instance.tmux_session,
                command,
                "C-m"
            ]

            result = subprocess.run(cmd, capture_output=True)

            if result.returncode == 0:
                self.update_activity(instance_id)
                return True, "Command sent"
            else:
                return False, f"Failed to send command: {result.stderr.decode()}"

        except Exception as e:
            return False, f"Error sending command: {str(e)}"

    def get_output(self, instance_id: str, lines: int = 100) -> tuple[bool, str]:
        """Get output from Claude instance"""
        instance = self.instances.get(instance_id)
        if not instance:
            return False, "Instance not found"

        try:
            # Capture tmux pane output
            cmd = [
                "tmux", "capture-pane",
                "-t", instance.tmux_session,
                "-p", "-S", f"-{lines}"
            ]

            result = subprocess.run(cmd, capture_output=True, text=True)

            if result.returncode == 0:
                return True, result.stdout
            else:
                return False, "Failed to capture output"

        except Exception as e:
            return False, f"Error getting output: {str(e)}"

    def cleanup_idle_instances(self) -> int:
        """Clean up idle instances"""
        cleaned = 0
        now = datetime.utcnow()
        timeout = timedelta(minutes=INSTANCE_IDLE_TIMEOUT_MINUTES)

        for instance_id, instance in list(self.instances.items()):
            if now - instance.last_activity > timeout:
                self.stop_instance(instance_id)
                cleaned += 1

        return cleaned

    def get_system_stats(self) -> Dict[str, Any]:
        """Get system resource statistics"""
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/opt/mobile-vscode')

            return {
                "cpu_percent": cpu_percent,
                "memory_used_mb": memory.used // (1024 * 1024),
                "memory_total_mb": memory.total // (1024 * 1024),
                "memory_percent": memory.percent,
                "disk_used_gb": disk.used // (1024 * 1024 * 1024),
                "disk_total_gb": disk.total // (1024 * 1024 * 1024),
                "disk_percent": disk.percent,
                "instances_running": len(self.instances),
                "instances_total_max": MAX_INSTANCES_TOTAL
            }
        except Exception as e:
            return {
                "error": str(e)
            }


# Global session manager
_session_manager = None

def get_session_manager() -> SessionManager:
    """Get global session manager instance"""
    global _session_manager
    if _session_manager is None:
        _session_manager = SessionManager()
    return _session_manager
