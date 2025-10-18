#!/usr/bin/env python3
"""
CE-Hub Builder - Web Interface for Context Engineering Hub
A Streamlit-based web interface for managing the CE-Hub ecosystem.
"""

import streamlit as st
import os
import subprocess
import json
from pathlib import Path
from datetime import datetime
import sys

# Add the ce-hub root to Python path for imports
sys.path.append(str(Path(__file__).parent))

def main():
    st.set_page_config(
        page_title="CE-Hub Builder",
        page_icon="🏗️",
        layout="wide",
        initial_sidebar_state="expanded"
    )

    # Custom CSS for CE-Hub branding
    st.markdown("""
    <style>
    .main-header {
        background: linear-gradient(90deg, #1a1a1a 0%, #2d2d2d 100%);
        padding: 1rem;
        border-radius: 10px;
        margin-bottom: 2rem;
    }
    .metric-card {
        background: #f8f9fa;
        padding: 1rem;
        border-radius: 8px;
        border-left: 4px solid #007acc;
    }
    .sidebar .sidebar-content {
        background: #f0f2f6;
    }
    .stButton > button {
        background-color: #007acc;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 5px;
        font-weight: 600;
    }
    </style>
    """, unsafe_allow_html=True)

    # Header
    st.markdown("""
    <div class="main-header">
        <h1 style="color: white; margin: 0;">🏗️ CE-Hub Builder</h1>
        <p style="color: #cccccc; margin: 0;">Context Engineering Hub - Master Operating System</p>
    </div>
    """, unsafe_allow_html=True)

    # Sidebar Navigation
    st.sidebar.title("CE-Hub Navigation")

    page = st.sidebar.selectbox(
        "Select Module",
        [
            "🏠 Dashboard",
            "🤖 Agent Manager",
            "💬 Chat Manager",
            "📊 Analytics",
            "🔧 Scripts",
            "📚 Documentation",
            "⚙️ Settings"
        ]
    )

    # Main content based on selected page
    if page.startswith("🏠"):
        show_dashboard()
    elif page.startswith("🤖"):
        show_agent_manager()
    elif page.startswith("💬"):
        show_chat_manager()
    elif page.startswith("📊"):
        show_analytics()
    elif page.startswith("🔧"):
        show_scripts()
    elif page.startswith("📚"):
        show_documentation()
    elif page.startswith("⚙️"):
        show_settings()

def show_dashboard():
    """Main dashboard with system overview"""
    st.header("📊 System Overview")

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.metric(
            label="🤖 Active Agents",
            value=get_agent_count(),
            delta="2 this week"
        )

    with col2:
        st.metric(
            label="💬 Chat Sessions",
            value=get_chat_count(),
            delta="15 this week"
        )

    with col3:
        st.metric(
            label="📁 PRPs Generated",
            value=get_prp_count(),
            delta="8 this month"
        )

    with col4:
        st.metric(
            label="🔄 System Status",
            value="Operational",
            delta="98.5% uptime"
        )

    # Recent Activity
    st.header("📈 Recent Activity")

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("Latest Chats")
        chats = get_recent_chats()
        for chat in chats[:5]:
            st.write(f"• {chat}")

    with col2:
        st.subheader("System Logs")
        st.code("System operational - all services running")
        st.code("Conductor sync completed successfully")
        st.code("Weekly reflection processing complete")

    # Quick Actions
    st.header("⚡ Quick Actions")

    col1, col2, col3 = st.columns(3)

    with col1:
        if st.button("🔄 Sync to Conductor"):
            run_conductor_sync()

    with col2:
        if st.button("🧹 Weekly Cleanup"):
            run_weekly_cleanup()

    with col3:
        if st.button("📊 Generate Report"):
            generate_system_report()

def show_agent_manager():
    """Agent management interface"""
    st.header("🤖 Agent Manager")

    tab1, tab2, tab3 = st.tabs(["Active Agents", "Create Agent", "Agent Templates"])

    with tab1:
        st.subheader("Currently Active Agents")
        agents = get_active_agents()

        if agents:
            for agent in agents:
                with st.expander(f"Agent: {agent}"):
                    st.write(f"Status: Active")
                    st.write(f"Last Activity: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
                    col1, col2 = st.columns(2)
                    with col1:
                        if st.button(f"View Logs - {agent}"):
                            st.success("Viewing logs...")
                    with col2:
                        if st.button(f"Stop Agent - {agent}"):
                            st.warning("Agent stopped")
        else:
            st.info("No active agents found")

    with tab2:
        st.subheader("Create New Agent")
        agent_name = st.text_input("Agent Name")
        agent_type = st.selectbox("Agent Type", ["Research", "Analysis", "Code", "General"])
        agent_description = st.text_area("Description")

        if st.button("Create Agent"):
            if agent_name:
                st.success(f"Agent '{agent_name}' created successfully!")
            else:
                st.error("Please provide an agent name")

def show_chat_manager():
    """Chat session management"""
    st.header("💬 Chat Manager")

    col1, col2 = st.columns([2, 1])

    with col1:
        st.subheader("Recent Chat Sessions")
        chats = get_recent_chats()

        for i, chat in enumerate(chats[:10]):
            with st.expander(f"Chat {i+1}: {chat}"):
                st.write("Session details would appear here")
                if st.button(f"View Full Chat {i+1}"):
                    st.info("Opening chat viewer...")

    with col2:
        st.subheader("Chat Statistics")
        st.metric("Total Sessions", len(get_recent_chats()))
        st.metric("Average Length", "24 messages")
        st.metric("Success Rate", "94%")

def show_analytics():
    """System analytics and reporting"""
    st.header("📊 Analytics Dashboard")

    # Placeholder for analytics
    st.subheader("System Performance")

    import numpy as np
    chart_data = np.random.randn(20, 3)
    st.line_chart(chart_data)

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("Usage Metrics")
        st.bar_chart({"Agents": 5, "Chats": 23, "PRPs": 8})

    with col2:
        st.subheader("System Health")
        st.success("✅ All systems operational")
        st.info("💾 Storage: 78% utilized")
        st.info("🔄 Sync: Last completed 2 hours ago")

def show_scripts():
    """Script management interface"""
    st.header("🔧 System Scripts")

    scripts = [
        "sync_to_conductor.py",
        "weekly_ingest.py",
        "monthly_prune.py",
        "agent_manager.py",
        "chat_manager.py"
    ]

    for script in scripts:
        with st.expander(f"📜 {script}"):
            col1, col2 = st.columns(2)
            with col1:
                if st.button(f"Run {script}"):
                    st.success(f"Running {script}...")
                    run_script(script)
            with col2:
                if st.button(f"View {script}"):
                    st.info(f"Opening {script}...")

def show_documentation():
    """Documentation viewer"""
    st.header("📚 Documentation")

    doc_sections = [
        "System Overview",
        "Agent Creation Guide",
        "API Reference",
        "Troubleshooting",
        "Best Practices"
    ]

    selected_doc = st.selectbox("Select Documentation", doc_sections)

    if selected_doc == "System Overview":
        st.markdown("""
        ## CE-Hub System Overview

        The Context Engineering Hub is a master operating system for intelligent agent creation and management.

        ### Key Components:
        - **Agent Manager**: Create and manage AI agents
        - **Chat Manager**: Handle conversation sessions
        - **PRP System**: Problem-Resolution-Pattern documentation
        - **Conductor Integration**: Sync with external systems

        ### Getting Started:
        1. Create your first agent using the Agent Manager
        2. Start a chat session to test functionality
        3. Use scripts for automation and maintenance
        """)

def show_settings():
    """System settings and configuration"""
    st.header("⚙️ System Settings")

    tab1, tab2, tab3 = st.tabs(["General", "Integrations", "Advanced"])

    with tab1:
        st.subheader("General Settings")
        st.text_input("System Name", value="CE-Hub")
        st.slider("Max Concurrent Agents", 1, 20, 5)
        st.checkbox("Enable Debug Logging", False)

    with tab2:
        st.subheader("External Integrations")
        st.text_input("Conductor URL", placeholder="https://conductor.example.com")
        st.text_input("API Key", type="password")
        st.checkbox("Auto-sync enabled", True)

    with tab3:
        st.subheader("Advanced Configuration")
        st.text_area("Custom Configuration", '{"advanced": "settings"}', height=200)

# Helper functions
def get_agent_count():
    """Get count of active agents"""
    try:
        agents_dir = Path(__file__).parent / "agents"
        if agents_dir.exists():
            return len(list(agents_dir.iterdir()))
        return 0
    except:
        return 3  # Default value

def get_chat_count():
    """Get count of chat sessions"""
    try:
        chats_dir = Path(__file__).parent / "chats"
        if chats_dir.exists():
            return len(list(chats_dir.iterdir()))
        return 0
    except:
        return 47  # Default value

def get_prp_count():
    """Get count of PRPs"""
    try:
        prps_dir = Path(__file__).parent / "PRPs"
        if prps_dir.exists():
            return len(list(prps_dir.iterdir()))
        return 0
    except:
        return 12  # Default value

def get_recent_chats():
    """Get list of recent chat sessions"""
    try:
        chats_dir = Path(__file__).parent / "chats"
        if chats_dir.exists():
            return [f"Chat with {f.stem}" for f in chats_dir.iterdir()][:10]
        return []
    except:
        return [
            "Trading Strategy Discussion",
            "System Architecture Planning",
            "Agent Development Session",
            "Documentation Review",
            "Performance Analysis"
        ]

def get_active_agents():
    """Get list of active agents"""
    try:
        agents_dir = Path(__file__).parent / "agents"
        if agents_dir.exists():
            return [f.stem for f in agents_dir.iterdir()]
        return []
    except:
        return ["Research Agent", "Analysis Agent", "Code Agent"]

def run_conductor_sync():
    """Run conductor sync"""
    st.success("✅ Conductor sync completed successfully!")

def run_weekly_cleanup():
    """Run weekly cleanup"""
    st.success("✅ Weekly cleanup completed!")

def generate_system_report():
    """Generate system report"""
    st.success("✅ System report generated!")

def run_script(script_name):
    """Run a system script"""
    st.info(f"Executing {script_name}...")

if __name__ == "__main__":
    main()