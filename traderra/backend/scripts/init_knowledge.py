#!/usr/bin/env python3
"""
Traderra Knowledge Initialization Script

This script initializes Archon with trading-specific knowledge sources,
patterns, and base insights to bootstrap the AI system.

Usage:
    python scripts/init_knowledge.py

This implements the INGEST phase of CE-Hub workflow by seeding
the knowledge graph with foundational trading patterns.
"""

import asyncio
import logging
import sys
from pathlib import Path
from typing import Dict, List, Any

# Add app to path
sys.path.append(str(Path(__file__).parent.parent))

from app.core.config import settings
from app.core.archon_client import ArchonClient, ArchonConfig, TradingInsight

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Base trading knowledge patterns
TRADING_PATTERNS = [
    {
        "title": "Risk Management Fundamentals",
        "content": {
            "topic": "risk_management",
            "principles": [
                "Position sizing should be based on account risk, not trade conviction",
                "Maximum risk per trade typically 1-2% of account",
                "Stop losses should be placed based on market structure, not arbitrary percentages",
                "Risk-reward ratio minimum 1:1.5, preferably 1:2 or better"
            ],
            "common_mistakes": [
                "Risking too much per trade during winning streaks",
                "Moving stop losses against positions",
                "Ignoring correlation when multiple positions are open",
                "Position sizing based on gut feeling rather than system"
            ],
            "best_practices": [
                "Calculate position size before entry",
                "Use portfolio heat to limit overall exposure",
                "Document risk parameters for each strategy",
                "Regular review of risk metrics and adherence"
            ]
        },
        "tags": ["risk_management", "position_sizing", "fundamentals"],
        "insight_type": "foundational_knowledge"
    },
    {
        "title": "Performance Analysis Metrics",
        "content": {
            "topic": "performance_metrics",
            "key_metrics": [
                "Expectancy: Average $ per trade (includes winners and losers)",
                "Profit Factor: Gross profit / Gross loss (>1.0 required for profitability)",
                "Win Rate: Percentage of winning trades",
                "Average Winner vs Average Loser: Size relationship",
                "Maximum Drawdown: Largest peak-to-trough decline",
                "Sharpe Ratio: Risk-adjusted returns"
            ],
            "metric_relationships": [
                "High win rate often correlates with smaller average winners",
                "Low win rate strategies need higher profit factor",
                "Expectancy = (Win Rate × Avg Winner) - (Loss Rate × Avg Loser)",
                "Consistent positive expectancy more important than high win rate"
            ],
            "interpretation_guidelines": [
                "Focus on expectancy rather than win rate alone",
                "Look for consistency in performance metrics over time",
                "Identify when metrics deviate from historical norms",
                "Compare metrics across different market conditions"
            ]
        },
        "tags": ["performance_analysis", "metrics", "statistics"],
        "insight_type": "analytical_framework"
    },
    {
        "title": "Trading Psychology Patterns",
        "content": {
            "topic": "trading_psychology",
            "emotional_states": [
                "Overconfidence after winning streaks leads to larger position sizes",
                "Fear after losses leads to hesitation and missed opportunities",
                "Revenge trading after significant losses destroys accounts",
                "FOMO (Fear of Missing Out) leads to poor entry timing"
            ],
            "cognitive_biases": [
                "Confirmation bias: Seeing only information that supports position",
                "Anchoring: Over-relying on first piece of information",
                "Loss aversion: Feeling losses more strongly than equivalent gains",
                "Recency bias: Overweighting recent events in decision making"
            ],
            "management_strategies": [
                "Pre-define rules and follow them mechanically",
                "Keep detailed journal of emotional state during trades",
                "Take breaks after significant wins or losses",
                "Use position sizing to manage emotional impact",
                "Focus on process rather than outcomes"
            ]
        },
        "tags": ["psychology", "emotions", "discipline"],
        "insight_type": "behavioral_pattern"
    },
    {
        "title": "Market Regime Recognition",
        "content": {
            "topic": "market_regimes",
            "regime_types": [
                "Trending: Sustained directional movement with momentum",
                "Range-bound: Price oscillates between support and resistance",
                "Volatile: High price movement with frequent direction changes",
                "Low volatility: Compressed price action, potential breakout setup"
            ],
            "adaptation_strategies": [
                "Trending markets favor breakout and momentum strategies",
                "Range-bound markets favor mean reversion approaches",
                "High volatility requires wider stops and smaller positions",
                "Low volatility periods often precede significant moves"
            ],
            "indicators": [
                "ADX for trend strength measurement",
                "Bollinger Band width for volatility assessment",
                "Volume patterns for regime confirmation",
                "Multiple timeframe analysis for context"
            ]
        },
        "tags": ["market_regimes", "adaptation", "strategy"],
        "insight_type": "market_analysis"
    },
    {
        "title": "Common Trading Mistakes",
        "content": {
            "topic": "common_mistakes",
            "entry_mistakes": [
                "Chasing price after breakouts without waiting for pullbacks",
                "Entering trades without clear invalidation levels",
                "FOMO entries when setup criteria not fully met",
                "Overleveraging on 'sure thing' trades"
            ],
            "exit_mistakes": [
                "Moving stop losses against losing positions",
                "Taking profits too early on winning trades",
                "Letting small losses become large losses",
                "Not following predetermined exit rules"
            ],
            "management_mistakes": [
                "Trading too large during drawdown periods",
                "Not documenting trades and lessons learned",
                "Abandoning strategy after short-term poor performance",
                "Mixing timeframes and conflicting signals"
            ],
            "prevention_strategies": [
                "Create and follow detailed trading plan",
                "Use checklists for entry and exit criteria",
                "Regular review of trades and decision process",
                "Maintain consistent position sizing methodology"
            ]
        },
        "tags": ["mistakes", "learning", "improvement"],
        "insight_type": "error_prevention"
    }
]

# Coaching response patterns for different scenarios
COACHING_PATTERNS = [
    {
        "title": "Losing Streak Coaching Approaches",
        "content": {
            "scenario": "losing_streak",
            "analyst_approach": [
                "Expectancy declined X% over Y trades",
                "Win rate deviation: Z standard deviations below mean",
                "Position sizing remained consistent/increased inappropriately",
                "Risk parameters: within/outside acceptable ranges"
            ],
            "coach_approach": [
                "Review last 10 trades for pattern deviations",
                "Focus on process adherence rather than outcomes",
                "Reduce position size until confidence returns",
                "Identify specific areas for improvement"
            ],
            "mentor_approach": [
                "Losing streaks test psychological resilience and system conviction",
                "Examine emotional responses and decision-making changes",
                "Connect current experience with previous recovery periods",
                "Focus on maintaining long-term perspective and process discipline"
            ]
        },
        "tags": ["coaching", "losing_streaks", "psychology"],
        "insight_type": "coaching_strategy"
    },
    {
        "title": "Overconfidence After Wins",
        "content": {
            "scenario": "overconfidence",
            "warning_signs": [
                "Increasing position sizes after winning streak",
                "Taking trades outside normal criteria",
                "Reduced attention to risk management",
                "Feeling invincible or 'in the zone'"
            ],
            "intervention_strategies": [
                "analyst: 'Risk per trade increased X% above normal parameters'",
                "coach: 'Maintain consistent position sizing regardless of recent outcomes'",
                "mentor: 'Success often creates the conditions for the next failure - stay humble'"
            ],
            "prevention_measures": [
                "Automated position sizing calculations",
                "Regular review of risk metrics",
                "Predetermined maximum position sizes",
                "Cooling off periods after significant wins"
            ]
        },
        "tags": ["coaching", "overconfidence", "risk_management"],
        "insight_type": "preventive_coaching"
    }
]


async def initialize_knowledge_base():
    """Initialize Archon with foundational trading knowledge"""

    logger.info("Initializing Traderra knowledge base...")

    # Create Archon client
    archon_config = ArchonConfig(
        base_url=settings.archon_base_url,
        project_id=settings.archon_project_id,
        timeout=60  # Longer timeout for batch operations
    )

    async with ArchonClient(archon_config) as archon:

        # Test connection first
        health = await archon.health_check()
        if not health.success:
            logger.error(f"Failed to connect to Archon: {health.error}")
            return False

        logger.info(f"✅ Connected to Archon: {settings.archon_base_url}")

        # Ingest trading patterns
        logger.info("Ingesting foundational trading patterns...")
        pattern_count = 0

        for pattern in TRADING_PATTERNS:
            try:
                insight = TradingInsight(
                    content=pattern["content"],
                    tags=pattern["tags"],
                    insight_type=pattern["insight_type"]
                )

                result = await archon.ingest_trading_insight(
                    insight,
                    title=pattern["title"]
                )

                if result.success:
                    pattern_count += 1
                    logger.info(f"✅ Ingested: {pattern['title']}")
                else:
                    logger.error(f"❌ Failed to ingest {pattern['title']}: {result.error}")

            except Exception as e:
                logger.error(f"Error ingesting {pattern['title']}: {e}")

        # Ingest coaching patterns
        logger.info("Ingesting coaching patterns...")
        coaching_count = 0

        for coaching in COACHING_PATTERNS:
            try:
                insight = TradingInsight(
                    content=coaching["content"],
                    tags=coaching["tags"],
                    insight_type=coaching["insight_type"]
                )

                result = await archon.ingest_trading_insight(
                    insight,
                    title=coaching["title"]
                )

                if result.success:
                    coaching_count += 1
                    logger.info(f"✅ Ingested: {coaching['title']}")
                else:
                    logger.error(f"❌ Failed to ingest {coaching['title']}: {result.error}")

            except Exception as e:
                logger.error(f"Error ingesting {coaching['title']}: {e}")

        # Test knowledge retrieval
        logger.info("Testing knowledge retrieval...")

        test_queries = [
            "risk management position sizing",
            "trading psychology losing streaks",
            "performance analysis metrics",
            "market regime recognition"
        ]

        for query in test_queries:
            try:
                result = await archon.search_trading_knowledge(query, match_count=3)
                if result.success:
                    logger.info(f"✅ Query '{query}': {len(result.data)} results")
                else:
                    logger.warning(f"⚠️  Query '{query}' failed: {result.error}")

            except Exception as e:
                logger.error(f"Error testing query '{query}': {e}")

        logger.info(f"""
🎯 Knowledge base initialization complete!

📊 Summary:
   - Trading patterns ingested: {pattern_count}/{len(TRADING_PATTERNS)}
   - Coaching patterns ingested: {coaching_count}/{len(COACHING_PATTERNS)}
   - Total insights: {pattern_count + coaching_count}
   - Project ID: {settings.archon_project_id}

✅ Traderra AI knowledge backend is ready for use.
""")

        return True


async def verify_knowledge_base():
    """Verify knowledge base is properly set up"""

    logger.info("Verifying knowledge base setup...")

    archon_config = ArchonConfig()
    async with ArchonClient(archon_config) as archon:

        # Test various query patterns
        test_cases = [
            ("risk management", "Should find position sizing and risk control patterns"),
            ("performance analysis", "Should find metrics and evaluation frameworks"),
            ("trading psychology", "Should find emotional control and discipline patterns"),
            ("coaching strategies", "Should find different coaching approaches"),
            ("losing streaks", "Should find specific coaching for difficult periods"),
        ]

        for query, description in test_cases:
            result = await archon.search_trading_knowledge(query, match_count=3)

            if result.success and result.data:
                logger.info(f"✅ '{query}': {len(result.data)} results - {description}")

                # Show first result summary
                first_result = result.data[0]
                content_preview = str(first_result.get("content", ""))[:100]
                logger.info(f"   Preview: {content_preview}...")

            else:
                logger.warning(f"⚠️  '{query}': No results - {description}")

        return True


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Initialize Traderra knowledge base")
    parser.add_argument("--verify", action="store_true", help="Verify existing knowledge base")
    parser.add_argument("--reinit", action="store_true", help="Reinitialize (dangerous)")

    args = parser.parse_args()

    if args.verify:
        asyncio.run(verify_knowledge_base())
    else:
        logger.info("🚀 Starting Traderra knowledge base initialization...")
        success = asyncio.run(initialize_knowledge_base())

        if success:
            logger.info("🎉 Knowledge base initialization successful!")
            logger.info("💡 Run with --verify to test knowledge retrieval")
        else:
            logger.error("💥 Knowledge base initialization failed!")
            sys.exit(1)