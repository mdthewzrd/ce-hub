#!/usr/bin/env python3
"""
Automatic Context Management System
Captures and preserves development session context
"""

import os
import json
import datetime
from pathlib import Path

class ContextManager:
    def __init__(self):
        self.base_dir = Path("/Users/michaeldurante/ai dev/ce-hub")
        self.session_dir = self.base_dir / "docs" / "sessions"
        self.context_dir = self.base_dir / "docs" / "context"
        self.decisions_dir = self.base_dir / "docs" / "decisions"

    def start_session(self, session_type="development"):
        """Start a new development session with context tracking"""
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        session_id = f"{session_type}_{timestamp}"

        session_context = {
            "session_id": session_id,
            "start_time": timestamp,
            "session_type": session_type,
            "context": {},
            "decisions": [],
            "agents_used": [],
            "files_modified": [],
            "screenshots_analyzed": []
        }

        session_file = self.session_dir / f"{session_id}.json"
        with open(session_file, 'w') as f:
            json.dump(session_context, f, indent=2)

        return session_id

    def save_decision(self, session_id, decision, reasoning, impact):
        """Save a development decision with context"""
        decision_entry = {
            "timestamp": datetime.datetime.now().isoformat(),
            "decision": decision,
            "reasoning": reasoning,
            "impact": impact,
            "session_id": session_id
        }

        decision_file = self.decisions_dir / f"decision_{session_id}.json"

        decisions = []
        if decision_file.exists():
            with open(decision_file, 'r') as f:
                decisions = json.load(f)

        decisions.append(decision_entry)

        with open(decision_file, 'w') as f:
            json.dump(decisions, f, indent=2)

    def save_screenshot_analysis(self, session_id, screenshot_path, analysis):
        """Save screenshot analysis results"""
        analysis_entry = {
            "timestamp": datetime.datetime.now().isoformat(),
            "screenshot_path": screenshot_path,
            "analysis": analysis,
            "session_id": session_id
        }

        screenshot_file = self.context_dir / f"screenshots_{session_id}.json"

        analyses = []
        if screenshot_file.exists():
            with open(screenshot_file, 'r') as f:
                analyses = json.load(f)

        analyses.append(analysis_entry)

        with open(screenshot_file, 'w') as f:
            json.dump(analyses, f, indent=2)

# Initialize context manager
context_manager = ContextManager()
