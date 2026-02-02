#!/usr/bin/env python3
"""
Edge.dev Dashboard Launcher
Quick script to start the Edge.dev Trading Platform Dashboard
"""

import subprocess
import sys
import os
from pathlib import Path

def install_requirements():
    """Install required packages if not present"""
    required_packages = [
        'streamlit',
        'plotly',
        'pandas',
        'numpy'
    ]

    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            print(f"Installing {package}...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", package])

def main():
    """Launch the Edge.dev dashboard"""
    print("🚀 Starting Edge.dev Trading Platform Dashboard...")
    print("=" * 50)

    # Install requirements
    install_requirements()

    # Get the dashboard path
    dashboard_path = Path(__file__).parent / "edge_dashboard.py"

    if not dashboard_path.exists():
        print("❌ Error: edge_dashboard.py not found!")
        return

    # Launch Streamlit
    print("🌐 Launching dashboard in your web browser...")
    print("📊 Dashboard will be available at: http://localhost:8501")
    print("🛑 Press Ctrl+C to stop the dashboard")
    print("=" * 50)

    try:
        subprocess.run([
            sys.executable, "-m", "streamlit", "run",
            str(dashboard_path),
            "--theme.base", "light",
            "--theme.primaryColor", "#3b82f6",
            "--theme.backgroundColor", "#ffffff",
            "--theme.secondaryBackgroundColor", "#f8fafc"
        ])
    except KeyboardInterrupt:
        print("\n👋 Dashboard stopped. Thanks for using Edge.dev!")

if __name__ == "__main__":
    main()