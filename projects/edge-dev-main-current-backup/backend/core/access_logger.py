# Comprehensive Access Logging
import logging
import json
import time
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from pathlib import Path
import hashlib

class SecurityAccessLogger:
    """Enhanced access logging for security monitoring"""

    def __init__(self, log_dir: str = "/var/log/edge-dev"):
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(parents=True, exist_ok=True)

        # Setup loggers
        self.setup_loggers()

    def setup_loggers(self):
        """Setup security loggers"""
        # Access logger
        self.access_logger = logging.getLogger('security.access')
        self.access_logger.setLevel(logging.INFO)

        # Security events logger
        self.security_logger = logging.getLogger('security.events')
        self.security_logger.setLevel(logging.WARNING)

        # Performance logger
        self.perf_logger = logging.getLogger('security.performance')
        self.perf_logger.setLevel(logging.INFO)

        # Create handlers
        self.create_handlers()

    def create_handlers(self):
        """Create log handlers"""
        # Access log handler
        access_handler = logging.FileHandler(self.log_dir / 'access.log')
        access_handler.setFormatter(
            logging.Formatter('%(asctime)s - %(message)s')
        )
        self.access_logger.addHandler(access_handler)

        # Security events handler
        security_handler = logging.FileHandler(self.log_dir / 'security.log')
        security_handler.setFormatter(
            logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
        )
        self.security_logger.addHandler(security_handler)

        # Performance log handler
        perf_handler = logging.FileHandler(self.log_dir / 'performance.log')
        perf_handler.setFormatter(
            logging.Formatter('%(asctime)s - %(message)s')
        )
        self.perf_logger.addHandler(perf_handler)

    def log_access(
        self,
        endpoint: str,
        method: str,
        user_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        response_time: Optional[float] = None,
        status_code: Optional[int] = None
    ):
        """Log API access"""
        access_data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "endpoint": endpoint,
            "method": method,
            "user_id": user_id,
            "ip_address": self._hash_ip(ip_address) if ip_address else None,
            "user_agent": user_agent,
            "response_time_ms": response_time * 1000 if response_time else None,
            "status_code": status_code
        }

        self.access_logger.info(json.dumps(access_data))

    def log_security_event(
        self,
        event_type: str,
        severity: str,
        details: Dict[str, Any],
        user_id: Optional[str] = None,
        ip_address: Optional[str] = None
    ):
        """Log security event"""
        security_data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": event_type,
            "severity": severity,
            "details": details,
            "user_id": user_id,
            "ip_address": self._hash_ip(ip_address) if ip_address else None
        }

        log_method = getattr(self.security_logger, severity.lower(), self.security_logger.warning)
        log_method(json.dumps(security_data))

    def log_performance(
        self,
        operation: str,
        duration: float,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Log performance metrics"""
        perf_data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "operation": operation,
            "duration_ms": duration * 1000,
            "metadata": metadata or {}
        }

        self.perf_logger.info(json.dumps(perf_data))

    def _hash_ip(self, ip_address: str) -> str:
        """Hash IP address for privacy"""
        return hashlib.sha256(ip_address.encode()).hexdigest()[:16]

# Initialize security logger
security_logger = SecurityAccessLogger()
