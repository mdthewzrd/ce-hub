#!/usr/bin/env python3
"""
Enhanced Smart Filtering System
Integrates with agent ecosystem for intelligent symbol universe reduction
"""

import asyncio
import logging
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
import pandas as pd
import numpy as np
import requests
import json
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class FilterCriteria:
    """Smart filtering criteria with agent-enhanced logic"""
    min_volume: float = 1000000
    min_price: float = 1.0
    max_price: float = 1000.0
    min_market_cap: Optional[float] = None
    sectors: Optional[List[str]] = None
    exclude_penny_stocks: bool = True
    exclude_etfs: bool = False
    volatility_threshold: Optional[float] = None
    momentum_threshold: Optional[float] = None
    agent_specific_filters: Dict[str, Any] = None

@dataclass
class FilterResult:
    """Result of smart filtering operation"""
    original_universe_size: int
    filtered_universe_size: int
    filtered_symbols: List[str]
    filter_reasons: Dict[str, List[str]]
    processing_time: float
    agent_insights: Dict[str, Any]

class EnhancedSmartFilter:
    """Production-ready smart filtering with agent integration"""

    def __init__(self):
        self.cache = {}
        self.cache_ttl = 3600  # 1 hour cache

        # Data sources
        self.data_sources = {
            'polygon': self._fetch_polygon_data,
            'finnhub': self._fetch_finnhub_data,
            'yahoo': self._fetch_yahoo_data
        }

        # Pre-computed filter sets
        self.penny_stocks = set()
        self.etf_list = set()
        self.sector_mappings = {}

    async def apply_smart_filter(self, symbols: List[str], criteria: Optional[FilterCriteria] = None,
                               agent_type: str = 'trading-scanner-researcher') -> FilterResult:
        """Apply intelligent filtering to symbol universe"""
        start_time = datetime.utcnow()

        if criteria is None:
            criteria = FilterCriteria()

        # Cache check
        cache_key = self._generate_cache_key(symbols, criteria, agent_type)
        if cache_key in self.cache:
            cached_result = self.cache[cache_key]
            if (datetime.utcnow() - cached_result['timestamp']).seconds < self.cache_ttl:
                logger.info(f"Using cached filter result for {len(symbols)} symbols")
                return cached_result['result']

        logger.info(f"Applying smart filter to {len(symbols)} symbols for {agent_type}")

        # Get enhanced criteria based on agent type
        enhanced_criteria = await self._get_agent_enhanced_criteria(criteria, agent_type)

        # Multi-stage filtering
        filtered_symbols = symbols.copy()
        filter_reasons = {}

        # Stage 1: Basic data quality filters
        filtered_symbols, reasons = await self._apply_basic_filters(filtered_symbols, enhanced_criteria)
        filter_reasons.update(reasons)

        # Stage 2: Market-based filters
        filtered_symbols, reasons = await self._apply_market_filters(filtered_symbols, enhanced_criteria)
        filter_reasons.update(reasons)

        # Stage 3: Agent-specific intelligent filters
        filtered_symbols, reasons, agent_insights = await self._apply_agent_specific_filters(
            filtered_symbols, enhanced_criteria, agent_type
        )
        filter_reasons.update(reasons)

        # Stage 4: Final quality control
        filtered_symbols, reasons = await self._apply_quality_control(filtered_symbols, enhanced_criteria)
        filter_reasons.update(reasons)

        processing_time = (datetime.utcnow() - start_time).total_seconds()

        result = FilterResult(
            original_universe_size=len(symbols),
            filtered_universe_size=len(filtered_symbols),
            filtered_symbols=filtered_symbols,
            filter_reasons=filter_reasons,
            processing_time=processing_time,
            agent_insights=agent_insights
        )

        # Cache result
        self.cache[cache_key] = {
            'result': result,
            'timestamp': datetime.utcnow()
        }

        logger.info(f"Smart filter completed: {len(symbols)} -> {len(filtered_symbols)} symbols in {processing_time:.2f}s")

        return result

    async def _get_agent_enhanced_criteria(self, criteria: FilterCriteria, agent_type: str) -> FilterCriteria:
        """Get criteria enhanced by agent-specific insights"""
        enhanced_criteria = criteria

        # Agent-specific filter enhancements
        if agent_type == 'trading-scanner-researcher':
            # For historical scanning, prioritize liquid, actively traded stocks
            enhanced_criteria.min_volume = max(enhanced_criteria.min_volume, 500000)
            enhanced_criteria.exclude_penny_stocks = True

        elif agent_type == 'realtime-trading-scanner':
            # For real-time scanning, need high liquidity and reliable data
            enhanced_criteria.min_volume = max(enhanced_criteria.min_volume, 1000000)
            enhanced_criteria.min_price = max(enhanced_criteria.min_price, 5.0)

        elif agent_type == 'quant-backtest-specialist':
            # For backtesting, include broader universe but ensure data quality
            enhanced_criteria.min_volume = max(enhanced_criteria.min_volume, 100000)
            enhanced_criteria.exclude_penny_stocks = False  # Include for completeness

        elif agent_type == 'quant-edge-developer':
            # For edge development, focus on stocks with good data history
            enhanced_criteria.min_volume = max(enhanced_criteria.min_volume, 200000)
            enhanced_criteria.exclude_penny_stocks = True

        return enhanced_criteria

    async def _apply_basic_filters(self, symbols: List[str], criteria: FilterCriteria) -> Tuple[List[str], Dict[str, List[str]]]:
        """Apply basic data quality and price filters"""
        filtered = []
        reasons = {'basic_filters': []}

        for symbol in symbols:
            try:
                # Get basic symbol data
                symbol_data = await self._get_basic_symbol_data(symbol)

                if not symbol_data:
                    reasons['basic_filters'].append(f"{symbol}: No data available")
                    continue

                # Price filters
                current_price = symbol_data.get('price', 0)
                if current_price < criteria.min_price:
                    reasons['basic_filters'].append(f"{symbol}: Price ${current_price:.2f} below minimum ${criteria.min_price}")
                    continue

                if criteria.max_price and current_price > criteria.max_price:
                    reasons['basic_filters'].append(f"{symbol}: Price ${current_price:.2f} above maximum ${criteria.max_price}")
                    continue

                # Penny stock filter
                if criteria.exclude_penny_stocks and current_price < 5.0:
                    reasons['basic_filters'].append(f"{symbol}: Penny stock excluded")
                    continue

                # ETF filter
                if criteria.exclude_etfs and self._is_etf(symbol):
                    reasons['basic_filters'].append(f"{symbol}: ETF excluded")
                    continue

                filtered.append(symbol)

            except Exception as e:
                reasons['basic_filters'].append(f"{symbol}: Error processing - {str(e)}")
                continue

        return filtered, reasons

    async def _apply_market_filters(self, symbols: List[str], criteria: FilterCriteria) -> Tuple[List[str], Dict[str, List[str]]]:
        """Apply market-based filters (volume, market cap, etc.)"""
        filtered = []
        reasons = {'market_filters': []}

        for symbol in symbols:
            try:
                market_data = await self._get_market_data(symbol)

                if not market_data:
                    reasons['market_filters'].append(f"{symbol}: No market data")
                    continue

                # Volume filter
                volume = market_data.get('volume', 0)
                if volume < criteria.min_volume:
                    reasons['market_filters'].append(f"{symbol}: Volume {volume:,} below minimum {criteria.min_volume:,}")
                    continue

                # Market cap filter
                if criteria.min_market_cap:
                    market_cap = market_data.get('market_cap', 0)
                    if market_cap < criteria.min_market_cap:
                        reasons['market_filters'].append(f"{symbol}: Market cap ${market_cap/1e9:.1f}B below minimum ${criteria.min_market_cap/1e9:.1f}B")
                        continue

                filtered.append(symbol)

            except Exception as e:
                reasons['market_filters'].append(f"{symbol}: Market data error - {str(e)}")
                continue

        return filtered, reasons

    async def _apply_agent_specific_filters(self, symbols: List[str], criteria: FilterCriteria,
                                         agent_type: str) -> Tuple[List[str], Dict[str, List[str]], Dict[str, Any]]:
        """Apply agent-specific intelligent filtering"""
        filtered = []
        reasons = {'agent_filters': []}
        insights = {}

        try:
            # Agent-specific filtering logic
            if agent_type == 'trading-scanner-researcher':
                filtered, agent_reasons, agent_insights = await self._filter_for_scanner_researcher(symbols, criteria)
                insights['scanner_researcher'] = agent_insights

            elif agent_type == 'realtime-trading-scanner':
                filtered, agent_reasons, agent_insights = await self._filter_for_realtime_scanner(symbols, criteria)
                insights['realtime_scanner'] = agent_insights

            elif agent_type == 'quant-backtest-specialist':
                filtered, agent_reasons, agent_insights = await self._filter_for_backtest_specialist(symbols, criteria)
                insights['backtest_specialist'] = agent_insights

            elif agent_type == 'quant-edge-developer':
                filtered, agent_reasons, agent_insights = await self._filter_for_edge_developer(symbols, criteria)
                insights['edge_developer'] = agent_insights
            else:
                filtered = symbols
                agent_reasons = []

            reasons['agent_filters'] = agent_reasons

        except Exception as e:
            logger.error(f"Agent-specific filtering failed: {e}")
            filtered = symbols
            reasons['agent_filters'] = [f"Agent filtering failed: {str(e)}"]

        return filtered, reasons, insights

    async def _filter_for_scanner_researcher(self, symbols: List[str], criteria: FilterCriteria) -> Tuple[List[str], List[str], Dict]:
        """Filter optimized for historical scanner research"""
        filtered = []
        reasons = []
        insights = {}

        # For scanner research, prioritize symbols with:
        # 1. Sufficient historical data
        # 2. Good liquidity
        # 3. Reasonable volatility
        # 4. Active trading patterns

        for symbol in symbols[:500]:  # Limit for processing efficiency
            try:
                # Check data availability
                has_sufficient_data = await self._check_historical_data_availability(symbol, 252)  # 1 year
                if not has_sufficient_data:
                    reasons.append(f"{symbol}: Insufficient historical data")
                    continue

                # Volatility check
                volatility = await self._calculate_volatility(symbol, 30)
                if volatility < 0.1 or volatility > 1.0:  # Filter extreme volatilities
                    reasons.append(f"{symbol}: Volatility {volatility:.2f} outside optimal range")
                    continue

                filtered.append(symbol)

            except Exception as e:
                reasons.append(f"{symbol}: Analysis error - {str(e)}")
                continue

        insights['focus_area'] = 'Historical pattern recognition'
        insights['data_requirements'] = 'Minimum 1 year history'
        insights['volatility_range'] = '0.1 - 1.0 (30-day)'
        insights['priority_factors'] = ['Data quality', 'Liquidity', 'Volatility consistency']

        return filtered, reasons, insights

    async def _filter_for_realtime_scanner(self, symbols: List[str], criteria: FilterCriteria) -> Tuple[List[str], List[str], Dict]:
        """Filter optimized for real-time scanning"""
        filtered = []
        reasons = []
        insights = {}

        # For real-time scanning, prioritize:
        # 1. High liquidity
        # 2. Reliable data feeds
        # 3. Active institutional interest
        # 4. Clear price action

        for symbol in symbols[:200]:  # Smaller universe for real-time
            try:
                # Ultra-high volume requirement
                market_data = await self._get_market_data(symbol)
                volume = market_data.get('volume', 0)

                if volume < 2000000:  # 2M minimum for real-time
                    reasons.append(f"{symbol}: Volume {volume:,} insufficient for real-time")
                    continue

                # Check real-time data reliability
                data_reliability = await self._check_realtime_data_quality(symbol)
                if data_reliability < 0.8:
                    reasons.append(f"{symbol}: Real-time data quality {data_reliability:.2f} below threshold")
                    continue

                # Institutional presence
                institutional_score = await self._calculate_institutional_score(symbol)
                if institutional_score < 0.3:
                    reasons.append(f"{symbol}: Low institutional presence {institutional_score:.2f}")
                    continue

                filtered.append(symbol)

            except Exception as e:
                reasons.append(f"{symbol}: Real-time analysis error - {str(e)}")
                continue

        insights['focus_area'] = 'Real-time signal detection'
        insights['volume_requirement'] = 'Minimum 2M daily volume'
        insights['data_reliability'] = '80%+ real-time quality score'
        insights['priority_factors'] = ['Liquidity', 'Data reliability', 'Institutional interest']

        return filtered, reasons, insights

    async def _filter_for_backtest_specialist(self, symbols: List[str], criteria: FilterCriteria) -> Tuple[List[str], List[str], Dict]:
        """Filter optimized for backtesting analysis"""
        filtered = []
        reasons = []
        insights = {}

        # For backtesting, we want:
        # 1. Diverse set of symbols
        # 2. Different market caps
        # 3. Various sectors
        # 4. Sufficient history

        for symbol in symbols[:1000]:  # Larger universe for backtesting
            try:
                # Check historical data length
                data_length = await self._get_data_length(symbol)
                if data_length < 504:  # 2 years minimum
                    reasons.append(f"{symbol}: Only {data_length} days of data, need 504+")
                    continue

                # Get market classification
                classification = await self._classify_symbol(symbol)

                # Ensure diversity
                if not self._maintains_diversity(filtered, classification):
                    reasons.append(f"{symbol}: Over-represented classification {classification}")
                    continue

                filtered.append(symbol)

            except Exception as e:
                reasons.append(f"{symbol}: Backtesting analysis error - {str(e)}")
                continue

        insights['focus_area'] = 'Comprehensive backtesting universe'
        insights['data_requirement'] = 'Minimum 2 years history'
        insights['diversity_goal'] = 'Balanced market cap and sector representation'
        insights['priority_factors'] = ['Data length', 'Classification diversity', 'Market completeness']

        return filtered, reasons, insights

    async def _filter_for_edge_developer(self, symbols: List[str], criteria: FilterCriteria) -> Tuple[List[str], List[str], Dict]:
        """Filter optimized for edge development"""
        filtered = []
        reasons = []
        insights = {}

        # For edge development, we need:
        # 1. High-quality data
        # 2. Reasonable trading patterns
        # 3. Sufficient volatility for edge detection
        # 4. Good statistical properties

        for symbol in symbols[:300]:
            try:
                # Data quality assessment
                data_quality = await self._assess_data_quality(symbol)
                if data_quality < 0.7:
                    reasons.append(f"{symbol}: Data quality {data_quality:.2f} below threshold")
                    continue

                # Trading frequency
                trading_frequency = await self._calculate_trading_frequency(symbol)
                if trading_frequency < 0.3:
                    reasons.append(f"{symbol}: Low trading frequency {trading_frequency:.2f}")
                    continue

                # Statistical properties
                stat_properties = await self._analyze_statistical_properties(symbol)
                if stat_properties.get('noise_ratio', 1.0) > 0.8:
                    reasons.append(f"{symbol}: High noise ratio {stat_properties['noise_ratio']:.2f}")
                    continue

                filtered.append(symbol)

            except Exception as e:
                reasons.append(f"{symbol}: Edge development analysis error - {str(e)}")
                continue

        insights['focus_area'] = 'Mathematical edge detection'
        insights['data_quality'] = '70%+ quality threshold'
        insights['statistical_requirements'] = 'Manageable noise ratio, sufficient trading frequency'
        insights['priority_factors'] = ['Data quality', 'Statistical properties', 'Edge potential']

        return filtered, reasons, insights

    async def _apply_quality_control(self, symbols: List[str], criteria: FilterCriteria) -> Tuple[List[str], Dict[str, List[str]]]:
        """Final quality control filtering"""
        filtered = []
        reasons = {'quality_control': []}

        # Remove duplicates
        unique_symbols = list(set(symbols))
        if len(unique_symbols) < len(symbols):
            reasons['quality_control'].append(f"Removed {len(symbols) - len(unique_symbols)} duplicates")

        # Sort by liquidity and keep top performers
        symbol_liquidity = []
        for symbol in unique_symbols:
            try:
                market_data = await self._get_market_data(symbol)
                symbol_liquidity.append((symbol, market_data.get('volume', 0)))
            except:
                symbol_liquidity.append((symbol, 0))

        # Sort by volume (descending)
        symbol_liquidity.sort(key=lambda x: x[1], reverse=True)

        # Keep top symbols (limit based on agent type and criteria)
        max_symbols = criteria.max_symbols if hasattr(criteria, 'max_symbols') else 500
        final_symbols = [symbol for symbol, volume in symbol_liquidity[:max_symbols]]

        if len(final_symbols) < len(unique_symbols):
            reasons['quality_control'].append(f"Limited to top {len(final_symbols)} symbols by liquidity")

        filtered = final_symbols
        return filtered, reasons

    # Helper methods
    async def _get_basic_symbol_data(self, symbol: str) -> Optional[Dict]:
        """Get basic symbol data"""
        try:
            # Try Polygon first
            data = await self._fetch_polygon_data(symbol, basic=True)
            if data:
                return data

            # Fallback to Yahoo
            data = await self._fetch_yahoo_data(symbol, basic=True)
            return data
        except:
            return None

    async def _get_market_data(self, symbol: str) -> Optional[Dict]:
        """Get comprehensive market data"""
        try:
            data = await self._fetch_polygon_data(symbol, basic=False)
            if data:
                return data
            return await self._fetch_yahoo_data(symbol, basic=False)
        except:
            return None

    async def _fetch_polygon_data(self, symbol: str, basic: bool = False) -> Optional[Dict]:
        """Fetch data from Polygon.io (mock implementation)"""
        # In production, this would use actual Polygon.io API
        return {
            'price': np.random.uniform(10, 200),
            'volume': np.random.randint(100000, 5000000),
            'market_cap': np.random.uniform(1e9, 100e9)
        }

    async def _fetch_yahoo_data(self, symbol: str, basic: bool = False) -> Optional[Dict]:
        """Fetch data from Yahoo Finance (mock implementation)"""
        # In production, this would use yfinance or similar
        return {
            'price': np.random.uniform(10, 200),
            'volume': np.random.randint(100000, 5000000),
            'market_cap': np.random.uniform(1e9, 100e9)
        }

    def _generate_cache_key(self, symbols: List[str], criteria: FilterCriteria, agent_type: str) -> str:
        """Generate cache key for filtering operation"""
        symbols_str = ','.join(sorted(symbols[:50]))  # Use first 50 for cache key
        criteria_str = f"{criteria.min_volume}_{criteria.min_price}_{criteria.max_price}"
        return f"{agent_type}_{hash(symbols_str + criteria_str)}"

    def _is_etf(self, symbol: str) -> bool:
        """Check if symbol is an ETF"""
        # Simplified check - in production, use proper ETF list
        return symbol.endswith('ETF') or symbol in ['SPY', 'QQQ', 'IWM', 'DIA', 'VTI']

# Production usage
if __name__ == "__main__":
    async def test_smart_filter():
        filter_system = EnhancedSmartFilter()

        # Test symbols
        test_symbols = [f'STOCK{i:03d}' for i in range(1000)]

        # Test filtering
        result = await filter_system.apply_smart_filter(
            test_symbols,
            FilterCriteria(min_volume=1000000, min_price=5.0),
            'trading-scanner-researcher'
        )

        print(f"Filter result: {result.original_universe_size} -> {result.filtered_universe_size}")
        print(f"Processing time: {result.processing_time:.2f}s")

    asyncio.run(test_smart_filter())