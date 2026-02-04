"""
Resource Monitor
Monitors system resources and manages instance health
"""

import time
import logging
from datetime import datetime, timedelta
from pathlib import Path
import psutil

from config import (
    INSTANCES_DIR, LOGS_DIR,
    MONITOR_INTERVAL_SECONDS,
    ALERT_THRESHOLD_CPU_PERCENT,
    ALERT_THRESHOLD_MEMORY_PERCENT,
    ALERT_THRESHOLD_DISK_PERCENT,
    INSTANCE_IDLE_TIMEOUT_MINUTES
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s"
)
logger = logging.getLogger(__name__)


class ResourceMonitor:
    """Monitors system resources and instance health"""

    def __init__(self):
        self.running = False
        self.alerts_log = LOGS_DIR / "alerts.log"

    def get_cpu_usage(self) -> float:
        """Get CPU usage percentage"""
        try:
            return psutil.cpu_percent(interval=1)
        except:
            return 0.0

    def get_memory_usage(self) -> dict:
        """Get memory usage"""
        try:
            mem = psutil.virtual_memory()
            return {
                "used_mb": mem.used // (1024 * 1024),
                "total_mb": mem.total // (1024 * 1024),
                "percent": mem.percent,
                "available_mb": mem.available // (1024 * 1024)
            }
        except:
            return {
                "used_mb": 0,
                "total_mb": 4096,
                "percent": 0,
                "available_mb": 4096
            }

    def get_disk_usage(self) -> dict:
        """Get disk usage"""
        try:
            disk = psutil.disk_usage('/opt/mobile-vscode')
            return {
                "used_gb": disk.used // (1024 * 1024 * 1024),
                "total_gb": disk.total // (1024 * 1024 * 1024),
                "percent": disk.percent
            }
        except:
            return {
                "used_gb": 0,
                "total_gb": 50,
                "percent": 0
            }

    def get_instance_pids(self) -> list:
        """Get PIDs of all Claude instances"""
        pids = []

        # Read instance files
        if INSTANCES_DIR.exists():
            for instance_file in INSTANCES_DIR.glob("*.json"):
                try:
                    import json
                    with open(instance_file, 'r') as f:
                        data = json.load(f)
                        if data.get("pid") and data.get("status") in ["running", "idle"]:
                            pids.append(data["pid"])
                except:
                    pass

        return pids

    def get_instance_memory(self) -> int:
        """Get total memory used by instances"""
        total_mb = 0
        pids = self.get_instance_pids()

        for pid in pids:
            try:
                process = psutil.Process(pid)
                total_mb += process.memory_info().rss // (1024 * 1024)
            except:
                pass

        return total_mb

    def check_alerts(self) -> list:
        """Check for resource alerts"""
        alerts = []

        # CPU
        cpu = self.get_cpu_usage()
        if cpu > ALERT_THRESHOLD_CPU_PERCENT:
            alerts.append({
                "type": "cpu",
                "severity": "warning",
                "message": f"High CPU usage: {cpu:.1f}%",
                "value": cpu
            })

        # Memory
        mem = self.get_memory_usage()
        if mem["percent"] > ALERT_THRESHOLD_MEMORY_PERCENT:
            alerts.append({
                "type": "memory",
                "severity": "warning",
                "message": f"High memory usage: {mem['percent']:.1f}%",
                "value": mem["percent"]
            })

        # Disk
        disk = self.get_disk_usage()
        if disk["percent"] > ALERT_THRESHOLD_DISK_PERCENT:
            alerts.append({
                "type": "disk",
                "severity": "critical",
                "message": f"High disk usage: {disk['percent']:.1f}%",
                "value": disk["percent"]
            })

        return alerts

    def log_alert(self, alert: dict):
        """Log alert to file"""
        try:
            timestamp = datetime.utcnow().isoformat()
            log_entry = f"{timestamp} | {alert['severity']} | {alert['type']} | {alert['message']}\n"

            with open(self.alerts_log, 'a') as f:
                f.write(log_entry)
        except:
            pass

    def cleanup_idle_instances(self):
        """Clean up idle instances"""
        from session_manager import get_session_manager

        try:
            manager = get_session_manager()
            cleaned = manager.cleanup_idle_instances()

            if cleaned > 0:
                logger.info(f"Cleaned up {cleaned} idle instances")
        except Exception as e:
            logger.error(f"Error cleaning up instances: {e}")

    def run_monitoring_cycle(self):
        """Run one monitoring cycle"""
        # Get stats
        cpu = self.get_cpu_usage()
        memory = self.get_memory_usage()
        disk = self.get_disk_usage()
        instance_memory = self.get_instance_memory()

        # Log status
        logger.info(
            f"CPU: {cpu:.1f}% | "
            f"Memory: {memory['percent']:.1f}% ({memory['used_mb']}MB/{memory['total_mb']}MB) | "
            f"Disk: {disk['percent']:.1f}% | "
            f"Instances: {len(self.get_instance_pids())} ({instance_memory}MB)"
        )

        # Check alerts
        alerts = self.check_alerts()
        for alert in alerts:
            logger.warning(alert["message"])
            self.log_alert(alert)

        # Cleanup idle instances (every 10 cycles)
        if int(time.time()) % (MONITOR_INTERVAL_SECONDS * 10) == 0:
            self.cleanup_idle_instances()

    def start(self):
        """Start monitoring"""
        logger.info("Starting resource monitor...")
        self.running = True

        while self.running:
            try:
                self.run_monitoring_cycle()
                time.sleep(MONITOR_INTERVAL_SECONDS)
            except KeyboardInterrupt:
                logger.info("Monitor stopped by user")
                break
            except Exception as e:
                logger.error(f"Monitor error: {e}")
                time.sleep(MONITOR_INTERVAL_SECONDS)

    def stop(self):
        """Stop monitoring"""
        self.running = False


if __name__ == "__main__":
    monitor = ResourceMonitor()
    monitor.start()
