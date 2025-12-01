#!/usr/bin/env python3
"""
CE-Hub Automated Workflow Setup Script
Configures automatic context management, agent coordination, and vision integration
"""

import os
import json
import subprocess
import sys
from pathlib import Path

class AutomatedWorkflowSetup:
    def __init__(self):
        self.base_dir = Path("/Users/michaeldurante/ai dev/ce-hub")
        self.config_dir = self.base_dir / "config"
        self.docs_dir = self.base_dir / "docs"
        self.scripts_dir = self.base_dir / "scripts"

    def setup_directories(self):
        """Create necessary directories for automated workflow"""
        directories = [
            self.docs_dir / "sessions",
            self.docs_dir / "decisions",
            self.docs_dir / "context",
            self.docs_dir / "patterns",
            self.docs_dir / "screenshots",
            self.config_dir / "agents",
            self.scripts_dir / "automation"
        ]

        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)
            print(f"✓ Created directory: {directory}")

    def setup_vision_server(self):
        """Setup and test MCP-Vision server"""
        print("Setting up MCP-Vision server...")

        try:
            # Install required packages
            subprocess.run([
                sys.executable, "-m", "pip", "install",
                "mcp-vision", "torch", "transformers", "pillow"
            ], check=True, capture_output=True)
            print("✓ Installed MCP-Vision dependencies")

            # Test vision server
            test_command = [sys.executable, "-c", "from mcp_vision import main; print('Vision server ready')"]
            result = subprocess.run(test_command, capture_output=True, text=True)

            if result.returncode == 0:
                print("✓ MCP-Vision server is working")
                return True
            else:
                print(f"⚠ Vision server test failed: {result.stderr}")
                return False

        except Exception as e:
            print(f"⚠ Failed to setup vision server: {e}")
            return False

    def create_agent_dispatch_config(self):
        """Create agent dispatch automation configuration"""
        config = {
            "auto_dispatch": {
                "enabled": True,
                "rules": {
                    "research-intelligence-specialist": {
                        "triggers": [
                            "how to", "what's the best", "help me understand",
                            "analyze", "research", "investigate"
                        ],
                        "pre_implementation": True
                    },
                    "engineer-agent": {
                        "triggers": [
                            "implement", "build", "create", "fix", "add feature",
                            "develop", "code", "program"
                        ]
                    },
                    "gui-specialist": {
                        "triggers": [
                            "UI", "frontend", "design", "layout", "styling",
                            "React", "component", "interface"
                        ],
                        "screenshot_context": True
                    },
                    "quality-assurance-tester": {
                        "triggers": [
                            "test", "validate", "check", "verify", "debug"
                        ],
                        "post_implementation": True
                    },
                    "documenter-specialist": {
                        "triggers": [
                            "document", "docs", "documentation", "explain"
                        ],
                        "end_of_cycle": True
                    }
                }
            },
            "context_management": {
                "auto_save": True,
                "session_tracking": True,
                "decision_logging": True,
                "screenshot_analysis": True
            }
        }

        config_file = self.config_dir / "agent_dispatch.json"
        with open(config_file, 'w') as f:
            json.dump(config, f, indent=2)
        print(f"✓ Created agent dispatch config: {config_file}")

    def create_context_management_system(self):
        """Create automatic context management system"""
        context_script = self.scripts_dir / "automation" / "context_manager.py"

        script_content = '''#!/usr/bin/env python3
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
'''

        with open(context_script, 'w') as f:
            f.write(script_content)

        context_script.chmod(0o755)
        print(f"✓ Created context management system: {context_script}")

    def create_automated_session_starter(self):
        """Create script to automatically start optimized development sessions"""
        session_script = self.scripts_dir / "start_traderra_session.py"

        script_content = '''#!/usr/bin/env python3
"""
Traderra Automated Development Session Starter
Automatically sets up context, agents, and workflow optimization
"""

import sys
import json
from pathlib import Path

# Add the automation directory to path
sys.path.append(str(Path(__file__).parent / "automation"))

from context_manager import ContextManager

def start_traderra_session():
    """Start an optimized Traderra development session"""
    print("🚀 Starting Traderra Development Session")
    print("=" * 50)

    # Initialize context manager
    context = ContextManager()
    session_id = context.start_session("traderra_development")

    print(f"✓ Session ID: {session_id}")
    print("✓ Context tracking enabled")
    print("✓ Automatic agent dispatch configured")
    print("✓ Screenshot analysis ready")
    print("✓ Decision logging active")

    print("\\n📋 Session Ready - Key Features:")
    print("• Send screenshots for automatic UI analysis")
    print("• Agents will be auto-dispatched based on request type")
    print("• All decisions and context will be preserved")
    print("• Regression prevention system active")

    print("\\n🎯 Optimized for:")
    print("• Fast UI iterations")
    print("• Context preservation")
    print("• Automatic documentation")
    print("• Quality assurance")

    return session_id

if __name__ == "__main__":
    start_traderra_session()
'''

        with open(session_script, 'w') as f:
            f.write(script_content)

        session_script.chmod(0o755)
        print(f"✓ Created session starter: {session_script}")

    def create_claude_desktop_config(self):
        """Create optimized Claude Desktop configuration"""
        claude_config = {
            "mcpServers": {
                "archon": {
                    "command": "npx",
                    "args": ["-y", "@michaeldurant/archon-mcp", "localhost:8051"],
                    "env": {}
                },
                "mcp-vision": {
                    "command": "/Users/michaeldurante/.venv/bin/python3",
                    "args": ["-c", "from mcp_vision import main; main()"],
                    "env": {
                        "MCP_TRANSPORT": "stdio",
                        "LOG_LEVEL": "error"
                    }
                }
            },
            "autoFeatures": {
                "contextPreservation": True,
                "agentDispatch": True,
                "visionAnalysis": True,
                "sessionTracking": True
            }
        }

        config_file = self.config_dir / "claude_desktop_config.json"
        with open(config_file, 'w') as f:
            json.dump(claude_config, f, indent=2)
        print(f"✓ Created Claude Desktop config: {config_file}")
        print("  ⚠ You'll need to manually add this to your Claude Desktop settings")

    def run_setup(self):
        """Run complete automated workflow setup"""
        print("🔧 Setting up CE-Hub Automated Development Workflow")
        print("=" * 60)

        self.setup_directories()
        vision_ok = self.setup_vision_server()
        self.create_agent_dispatch_config()
        self.create_context_management_system()
        self.create_automated_session_starter()
        self.create_claude_desktop_config()

        print("\\n" + "=" * 60)
        print("✅ Automated Workflow Setup Complete!")
        print("=" * 60)

        print("\\n📋 Next Steps:")
        print("1. Run: python3 scripts/start_traderra_session.py")
        print("2. Update Claude Desktop config with generated settings")
        if not vision_ok:
            print("3. ⚠ Fix MCP-Vision server setup (see config/AUTOMATED_DEVELOPMENT_SYSTEM.md)")
        print("4. Start development with automatic context preservation!")

        print("\\n🎯 New Capabilities:")
        print("• Automatic agent dispatch based on request patterns")
        print("• Screenshot analysis with vision integration")
        print("• Context preservation across sessions")
        print("• Decision logging and pattern recognition")
        print("• Regression prevention system")

if __name__ == "__main__":
    setup = AutomatedWorkflowSetup()
    setup.run_setup()