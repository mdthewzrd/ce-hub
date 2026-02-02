"""
Edge.dev Trading Platform Dashboard
A comprehensive Streamlit dashboard for historical scanning, setup building, and execution testing.
"""

import streamlit as st
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import numpy as np
from datetime import datetime, timedelta, date
import json
import os
from typing import Dict, List, Optional, Any
import time

# Page configuration
st.set_page_config(
    page_title="Edge.dev Trading Platform",
    page_icon="📈",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for Edge to Trade-style interface
st.markdown("""
<style>
    /* Global styling */
    .main > div {
        padding-top: 2rem;
    }

    /* Sidebar styling */
    .css-1d391kg {
        background-color: #1e293b;
    }

    /* Header styling */
    .dashboard-header {
        background: linear-gradient(90deg, #1e293b 0%, #334155 100%);
        padding: 1rem;
        border-radius: 0.5rem;
        margin-bottom: 1rem;
        color: white;
    }

    /* Parameter panel styling */
    .parameter-panel {
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 0.5rem;
        padding: 1rem;
        margin-bottom: 1rem;
    }

    /* Stats panel styling */
    .stats-panel {
        background-color: #f1f5f9;
        border: 1px solid #cbd5e1;
        border-radius: 0.5rem;
        padding: 1rem;
        height: 100%;
    }

    /* Chart container */
    .chart-container {
        background-color: white;
        border: 1px solid #e2e8f0;
        border-radius: 0.5rem;
        padding: 0.5rem;
        height: 600px;
    }

    /* Scan results table */
    .scan-results {
        font-size: 0.9rem;
        line-height: 1.2;
    }

    /* Metric cards */
    .metric-card {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 0.5rem;
        padding: 1rem;
        text-align: center;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }

    /* Filter tag styling */
    .filter-tag {
        background-color: #3b82f6;
        color: white;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.8rem;
        margin: 0.1rem;
        display: inline-block;
    }

    /* Button styling */
    .stButton > button {
        width: 100%;
        background-color: #3b82f6;
        color: white;
        border: none;
        border-radius: 0.375rem;
        padding: 0.5rem 1rem;
    }

    .stButton > button:hover {
        background-color: #2563eb;
    }
</style>
""", unsafe_allow_html=True)

# Initialize session state
if 'scan_results' not in st.session_state:
    st.session_state.scan_results = None
if 'selected_ticker' not in st.session_state:
    st.session_state.selected_ticker = None
if 'current_scan' not in st.session_state:
    st.session_state.current_scan = None
if 'saved_scans' not in st.session_state:
    st.session_state.saved_scans = {}

# Mock data for demonstration
@st.cache_data
def generate_mock_scan_results():
    """Generate mock scan results for demonstration"""
    tickers = ['BYND', 'WOLF', 'HOUR', 'THAR', 'ATNF', 'ETHZ', 'MCVT', 'SUTG', 'PROK']

    data = []
    for i, ticker in enumerate(tickers):
        data.append({
            'Ticker': ticker,
            'Day 2 Date': f'2025-10-{23-i:02d}',
            'Day 1 EMA %': np.random.uniform(-50, 100),
            'Day 1 EMA diff': np.random.uniform(-20, 50),
            'Day 1 EMA Gap': np.random.uniform(-30, 40),
            'Day 1 Dollar Volume': np.random.uniform(100_000, 5_000_000),
            'Day 1 Dollar Avg': np.random.uniform(50_000, 1_000_000),
            'Day 1 ADT %': np.random.uniform(50, 500),
            'Vol %': np.random.uniform(10, 200),
            'Gap %': np.random.uniform(-20, 50),
            'High Low %': np.random.uniform(10, 100),
            'Close': np.random.uniform(1, 50),
            'Volume': np.random.uniform(100_000, 10_000_000),
        })

    return pd.DataFrame(data)

@st.cache_data
def generate_mock_ohlc_data(ticker: str, days: int = 30):
    """Generate mock OHLC data for charts"""
    dates = pd.date_range(start=datetime.now() - timedelta(days=days), periods=days, freq='D')

    # Generate realistic price movement
    base_price = np.random.uniform(10, 100)
    prices = []

    for i in range(days):
        if i == 0:
            open_price = base_price
        else:
            open_price = prices[-1]['close'] * np.random.uniform(0.95, 1.05)

        high = open_price * np.random.uniform(1.0, 1.15)
        low = open_price * np.random.uniform(0.85, 1.0)
        close = np.random.uniform(low, high)
        volume = np.random.uniform(100_000, 2_000_000)

        prices.append({
            'date': dates[i],
            'open': open_price,
            'high': high,
            'low': low,
            'close': close,
            'volume': volume
        })

    return pd.DataFrame(prices)

# Sidebar Navigation
st.sidebar.markdown("# 🎯 Edge.dev Platform")
st.sidebar.markdown("---")

# Navigation menu
nav_option = st.sidebar.selectbox(
    "Navigation",
    ["📊 Historical Scanner", "🔄 Execution Testing", "📚 Setup Library", "⚙️ Settings"],
    index=0
)

st.sidebar.markdown("---")

# Project/Setup selector
st.sidebar.markdown("### 📁 Projects & Setups")

if 'projects' not in st.session_state:
    st.session_state.projects = {
        "Recent Gappers": ["Day 2 Gap 50-100", "Day 2 Gap 25-50", "SMC Gappers"],
        "High Volatility": ["Intraday Movers", "Pennies", "Intraday Runners"],
        "Fundamentals": ["Day 1 Metrics", "Other Day Metrics"]
    }

selected_project = st.sidebar.selectbox("Select Project", list(st.session_state.projects.keys()))

if selected_project:
    selected_setup = st.sidebar.selectbox(
        "Select Setup",
        st.session_state.projects[selected_project]
    )

    if st.sidebar.button("📁 Load Setup"):
        st.sidebar.success(f"Loaded: {selected_setup}")

# Add new project/setup
st.sidebar.markdown("#### Add New")
col1, col2 = st.sidebar.columns(2)
with col1:
    if st.button("➕ Project"):
        st.sidebar.text_input("Project Name", key="new_project")
with col2:
    if st.button("📄 Setup"):
        st.sidebar.text_input("Setup Name", key="new_setup")

# Main Content Area
if nav_option == "📊 Historical Scanner":
    # Header
    st.markdown("""
    <div class="dashboard-header">
        <h1>📊 Historical Scanner Dashboard</h1>
        <p>Build, test, and optimize trading setups with historical data</p>
    </div>
    """, unsafe_allow_html=True)

    # Parameter Panel (Top)
    st.markdown("### 🔧 Scan Parameters")

    with st.container():
        st.markdown('<div class="parameter-panel">', unsafe_allow_html=True)

        # Current scan display
        if st.session_state.current_scan:
            st.markdown("**Active Scan:** " + st.session_state.current_scan)

            # Display active filters as tags
            filters = [
                "Date Range: 2025-01-01 → 2025-10-24",
                "Day 1 Gap %: >= 30",
                "Share Group: CS",
                "Day -1 High Low %: >= 100",
                "Day -1 Gap %: >= 20",
                "Day -1 Vol: >= 10M",
                "Day -1 Close > Day -1 Open"
            ]

            filter_html = "".join([f'<span class="filter-tag">{f}</span>' for f in filters])
            st.markdown(f"**Filters:** {filter_html}", unsafe_allow_html=True)

        # Control buttons
        col1, col2, col3, col4 = st.columns(4)
        with col1:
            if st.button("🔍 Run Scan"):
                st.session_state.scan_results = generate_mock_scan_results()
                st.session_state.current_scan = "Day 2 Gap Analysis"
                st.rerun()

        with col2:
            if st.button("⚙️ Edit Parameters"):
                st.session_state.show_parameter_editor = True

        with col3:
            if st.button("💾 Save Scan"):
                if st.session_state.current_scan:
                    st.session_state.saved_scans[st.session_state.current_scan] = {
                        'created': datetime.now(),
                        'filters': filters
                    }
                    st.success("Scan saved!")

        with col4:
            if st.button("📤 Export Results"):
                if st.session_state.scan_results is not None:
                    st.download_button(
                        "📥 Download CSV",
                        st.session_state.scan_results.to_csv(index=False),
                        file_name=f"scan_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
                        mime="text/csv"
                    )

        st.markdown('</div>', unsafe_allow_html=True)

    # Main Content Layout (2 columns)
    col_left, col_right = st.columns([2, 1])

    with col_left:
        # Results Table and Chart Area (2 rows)
        if st.session_state.scan_results is not None:
            st.markdown("### 📋 Scan Results")

            # Make results table clickable
            df = st.session_state.scan_results

            # Display table with click functionality
            event = st.dataframe(
                df,
                use_container_width=True,
                height=300,
                on_select="rerun",
                selection_mode="single-row"
            )

            # Handle row selection
            if event.selection and len(event.selection['rows']) > 0:
                selected_row = event.selection['rows'][0]
                st.session_state.selected_ticker = df.iloc[selected_row]['Ticker']

            # Chart Area
            st.markdown("### 📈 Chart Analysis")

            if st.session_state.selected_ticker:
                st.markdown(f"**Analyzing: {st.session_state.selected_ticker}**")

                # Generate and display chart
                ohlc_data = generate_mock_ohlc_data(st.session_state.selected_ticker)

                fig = go.Figure(data=go.Candlestick(
                    x=ohlc_data['date'],
                    open=ohlc_data['open'],
                    high=ohlc_data['high'],
                    low=ohlc_data['low'],
                    close=ohlc_data['close'],
                    name=st.session_state.selected_ticker
                ))

                fig.update_layout(
                    title=f"{st.session_state.selected_ticker} - Daily Chart",
                    height=400,
                    xaxis_title="Date",
                    yaxis_title="Price",
                    template="plotly_white"
                )

                st.plotly_chart(fig, use_container_width=True)
            else:
                st.info("👆 Click on a ticker in the results table to view its chart")

    with col_right:
        # Statistics Panel
        st.markdown("### 📊 Scan Statistics")
        st.markdown('<div class="stats-panel">', unsafe_allow_html=True)

        if st.session_state.scan_results is not None:
            df = st.session_state.scan_results

            # Key metrics
            col_a, col_b = st.columns(2)
            with col_a:
                st.metric("Total Results", len(df))
                st.metric("Avg Gap %", f"{df['Gap %'].mean():.1f}%")

            with col_b:
                st.metric("Avg Volume", f"{df['Volume'].mean()/1e6:.1f}M")
                st.metric("Date Range", "Oct 14-23")

            # Gap distribution chart
            st.markdown("**Gap % Distribution**")
            gap_hist = px.histogram(df, x='Gap %', nbins=10, template="plotly_white")
            gap_hist.update_layout(height=200, margin=dict(l=0, r=0, t=20, b=20))
            st.plotly_chart(gap_hist, use_container_width=True)

            # Volume distribution
            st.markdown("**Volume Distribution**")
            vol_hist = px.histogram(df, x='Volume', nbins=10, template="plotly_white")
            vol_hist.update_layout(height=200, margin=dict(l=0, r=0, t=20, b=20))
            st.plotly_chart(vol_hist, use_container_width=True)

            # Top performers
            st.markdown("**Top Gap %**")
            top_gappers = df.nlargest(5, 'Gap %')[['Ticker', 'Gap %']]
            for _, row in top_gappers.iterrows():
                st.write(f"**{row['Ticker']}**: {row['Gap %']:.1f}%")

        else:
            st.info("Run a scan to see statistics")

        st.markdown('</div>', unsafe_allow_html=True)

elif nav_option == "🔄 Execution Testing":
    st.markdown("""
    <div class="dashboard-header">
        <h1>🔄 Execution Testing Dashboard</h1>
        <p>Backtest and validate execution strategies</p>
    </div>
    """, unsafe_allow_html=True)

    st.info("🚧 Execution Testing dashboard coming soon! This will include:")
    st.markdown("""
    - **Strategy Builder**: Visual strategy construction
    - **Backtest Engine**: Historical performance validation
    - **Execution Simulator**: Real-time trade simulation
    - **Performance Analytics**: Win rate, profit factor, drawdown analysis
    - **Risk Management**: Position sizing and stop-loss optimization
    """)

elif nav_option == "📚 Setup Library":
    st.markdown("""
    <div class="dashboard-header">
        <h1>📚 Setup Library</h1>
        <p>Manage reusable trading setups and components</p>
    </div>
    """, unsafe_allow_html=True)

    st.info("🚧 Setup Library coming soon! This will include:")
    st.markdown("""
    - **Drag & Drop Components**: Reusable indicators and parameters
    - **Template Management**: Save and share trading setups
    - **Version Control**: Track setup evolution over time
    - **Performance History**: Track which setups work best
    - **Import/Export**: Share setups with team members
    """)

elif nav_option == "⚙️ Settings":
    st.markdown("""
    <div class="dashboard-header">
        <h1>⚙️ Settings</h1>
        <p>Configure dashboard preferences and data sources</p>
    </div>
    """, unsafe_allow_html=True)

    st.markdown("### 🔌 Data Sources")
    data_source = st.selectbox("Primary Data Source", ["Polygon.io", "Alpha Vantage", "Yahoo Finance", "Manual Upload"])

    if data_source == "Polygon.io":
        api_key = st.text_input("API Key", type="password")
        if st.button("Test Connection"):
            st.success("✅ Connection successful!")

    st.markdown("### 🎨 Display Preferences")
    theme = st.selectbox("Dashboard Theme", ["Light", "Dark", "Auto"])
    chart_style = st.selectbox("Chart Style", ["Candlestick", "Line", "Bar"])
    default_timeframe = st.selectbox("Default Timeframe", ["1D", "1H", "15M", "5M"])

    st.markdown("### 💾 Data Management")
    col1, col2 = st.columns(2)
    with col1:
        if st.button("🔄 Sync Historical Data"):
            st.info("Syncing historical data...")
    with col2:
        if st.button("🗑️ Clear Cache"):
            st.success("Cache cleared!")

# Parameter Editor Modal
if st.session_state.get('show_parameter_editor', False):
    with st.expander("🔧 Parameter Editor", expanded=True):
        st.markdown("### Build Your Scan Parameters")

        col1, col2 = st.columns(2)

        with col1:
            st.markdown("**Date & Time Filters**")
            start_date = st.date_input("Start Date", value=date(2025, 1, 1))
            end_date = st.date_input("End Date", value=date.today())

            st.markdown("**Price & Gap Filters**")
            min_gap = st.number_input("Min Gap %", value=30.0)
            max_gap = st.number_input("Max Gap %", value=1000.0)
            min_price = st.number_input("Min Price", value=1.0)
            max_price = st.number_input("Max Price", value=1000.0)

        with col2:
            st.markdown("**Volume Filters**")
            min_volume = st.number_input("Min Volume", value=1_000_000)
            min_dollar_volume = st.number_input("Min Dollar Volume", value=10_000_000)

            st.markdown("**Additional Filters**")
            share_group = st.multiselect("Share Group", ["CS", "A", "B"], default=["CS"])
            market_cap = st.selectbox("Market Cap", ["Any", "Small", "Mid", "Large"])

        col_save, col_cancel = st.columns(2)
        with col_save:
            if st.button("💾 Save Parameters"):
                st.session_state.show_parameter_editor = False
                st.success("Parameters saved!")
                st.rerun()

        with col_cancel:
            if st.button("❌ Cancel"):
                st.session_state.show_parameter_editor = False
                st.rerun()

# Footer
st.markdown("---")
st.markdown("""
<div style="text-align: center; color: #64748b; padding: 1rem;">
    Edge.dev Trading Platform v1.0 | Built with Streamlit |
    <a href="#" style="color: #3b82f6;">Documentation</a> |
    <a href="#" style="color: #3b82f6;">Support</a>
</div>
""", unsafe_allow_html=True)