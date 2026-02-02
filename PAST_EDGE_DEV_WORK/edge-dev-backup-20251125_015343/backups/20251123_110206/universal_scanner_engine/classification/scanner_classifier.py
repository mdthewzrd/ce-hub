#!/usr/bin/env python3
"""
Universal Scanner Classification System
Intelligently classifies uploaded scanners and determines optimal execution strategy
"""

import ast
import re
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
from enum import Enum
import logging

logger = logging.getLogger(__name__)

class ScannerType(Enum):
    ENTERPRISE = "enterprise"      # Full market, multi-year backtesting
    FOCUSED = "focused"           # Curated symbols, pattern-specific
    DAILY = "daily"              # Daily pattern scanning
    INTRADAY = "intraday"        # Intraday scanning
    UNKNOWN = "unknown"          # Fallback

@dataclass
class ScannerProfile:
    """Complete profile of uploaded scanner for resource allocation"""
    scanner_type: ScannerType
    symbol_strategy: str         # "full_market", "curated_list", "dynamic"
    estimated_symbols: int       # Estimated number of symbols
    data_timeframe: str         # "1D", "1M", "1Y", "5Y", "historical"
    processing_complexity: str   # "simple", "moderate", "complex", "enterprise"
    estimated_runtime: int      # seconds
    memory_requirements: str    # "low", "medium", "high", "enterprise"
    thread_strategy: str        # "symbol_parallel", "date_parallel", "hybrid"
    api_calls_estimated: int    # Estimated Polygon API calls
    requires_multiprocessing: bool
    confidence_score: float     # Classification confidence (0-1)
    detected_patterns: List[str]  # Pattern types detected

class UniversalScannerClassifier:
    """
    Intelligently classifies scanners based on code analysis
    """

    def __init__(self):
        self.enterprise_indicators = [
            "ProcessPoolExecutor", "multiprocessing", "cpu_count()",
            "pandas.concat", "pd.concat", "asyncio.gather",
            "DATES", "nyse.valid_days", "schedule",
            "400 days", "300 days", "START_DATE_DT", "END_DATE_DT"
        ]

        self.focused_indicators = [
            "ThreadPoolExecutor", "as_completed", "concurrent.futures",
            "SYMBOLS = [", "symbols = [", "curated", "watchlist"
        ]

        self.daily_indicators = [
            "datetime.today()", "current", "scan_daily",
            "daily", "today", "realtime"
        ]

        self.complexity_indicators = {
            "simple": ["basic", "simple", "lite"],
            "moderate": ["moderate", "standard", "regular"],
            "complex": ["complex", "sophisticated", "advanced"],
            "enterprise": ["enterprise", "backtest", "historical", "universe"]
        }

    async def classify_scanner(self, code: str, filename: str = "") -> ScannerProfile:
        """
        Comprehensively classify scanner and create execution profile
        """
        logger.info(f"🎯 Classifying scanner: {filename}")

        # Multi-layer analysis
        ast_analysis = self._analyze_ast(code)
        pattern_analysis = self._analyze_patterns(code)
        symbol_analysis = self._analyze_symbol_strategy(code)
        timeframe_analysis = self._analyze_timeframe(code)
        complexity_analysis = self._analyze_complexity(code)

        # Determine scanner type
        scanner_type = self._determine_scanner_type(
            ast_analysis, pattern_analysis, symbol_analysis, timeframe_analysis
        )

        # Create comprehensive profile
        profile = ScannerProfile(
            scanner_type=scanner_type,
            symbol_strategy=symbol_analysis["strategy"],
            estimated_symbols=symbol_analysis["symbol_count"],
            data_timeframe=timeframe_analysis["timeframe"],
            processing_complexity=complexity_analysis["complexity"],
            estimated_runtime=self._estimate_runtime(scanner_type, symbol_analysis, timeframe_analysis),
            memory_requirements=self._estimate_memory(scanner_type, symbol_analysis),
            thread_strategy=self._determine_thread_strategy(scanner_type, symbol_analysis),
            api_calls_estimated=self._estimate_api_calls(symbol_analysis, timeframe_analysis),
            requires_multiprocessing=ast_analysis["has_multiprocessing"],
            confidence_score=self._calculate_confidence(ast_analysis, pattern_analysis),
            detected_patterns=pattern_analysis["patterns"]
        )

        logger.info(f"✅ Scanner classified: {scanner_type.value} ({profile.confidence_score:.2f} confidence)")
        return profile

    def _analyze_ast(self, code: str) -> Dict:
        """Analyze code structure using AST"""
        try:
            tree = ast.parse(code)

            imports = []
            functions = []
            classes = []
            variables = []
            has_multiprocessing = False
            has_threading = False
            has_asyncio = False

            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        imports.append(alias.name)
                        if "multiprocessing" in alias.name or "ProcessPoolExecutor" in alias.name:
                            has_multiprocessing = True
                        if "threading" in alias.name or "ThreadPoolExecutor" in alias.name:
                            has_threading = True
                        if "asyncio" in alias.name:
                            has_asyncio = True

                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        imports.append(node.module)
                        if "multiprocessing" in node.module or "concurrent.futures" in node.module:
                            for alias in node.names:
                                if "ProcessPoolExecutor" in alias.name:
                                    has_multiprocessing = True
                                if "ThreadPoolExecutor" in alias.name:
                                    has_threading = True

                elif isinstance(node, ast.FunctionDef):
                    functions.append(node.name)

                elif isinstance(node, ast.ClassDef):
                    classes.append(node.name)

                elif isinstance(node, ast.Assign):
                    for target in node.targets:
                        if isinstance(target, ast.Name):
                            variables.append(target.id)

            return {
                "imports": imports,
                "functions": functions,
                "classes": classes,
                "variables": variables,
                "has_multiprocessing": has_multiprocessing,
                "has_threading": has_threading,
                "has_asyncio": has_asyncio,
                "ast_success": True
            }

        except Exception as e:
            logger.warning(f"AST analysis failed: {e}")
            return {
                "imports": [],
                "functions": [],
                "classes": [],
                "variables": [],
                "has_multiprocessing": False,
                "has_threading": False,
                "has_asyncio": False,
                "ast_success": False
            }

    def _analyze_patterns(self, code: str) -> Dict:
        """Analyze code for pattern indicators"""
        patterns = []

        # Enterprise patterns
        if any(indicator in code for indicator in self.enterprise_indicators):
            patterns.append("enterprise_backtesting")

        # LC patterns
        if any(lc in code for lc in ["lc", "LC", "lazy_cat", "gap", "atr", "ema"]):
            patterns.append("lc_pattern")

        # A+ patterns
        if any(ap in code for ap in ["A+", "para", "backside", "slope"]):
            patterns.append("aplus_pattern")

        # Volume patterns
        if any(vol in code for vol in ["volume", "VOL_AVG", "vol_mult"]):
            patterns.append("volume_analysis")

        # Technical indicators
        if any(tech in code for tech in ["EMA", "ATR", "RSI", "MACD", "slope"]):
            patterns.append("technical_indicators")

        # Multi-day analysis
        if any(multi in code for multi in ["shift(1)", "shift(2)", "prev", "lag"]):
            patterns.append("multi_day_analysis")

        return {"patterns": patterns}

    def _analyze_symbol_strategy(self, code: str) -> Dict:
        """Analyze how symbols are handled"""
        symbol_count = 0
        strategy = "unknown"

        # Look for explicit symbol lists
        symbol_list_match = re.search(r"SYMBOLS\s*=\s*\[(.*?)\]", code, re.DOTALL)
        if symbol_list_match:
            # Count symbols in list
            symbols_text = symbol_list_match.group(1)
            symbol_count = len(re.findall(r"['\"][A-Z]{1,5}['\"]", symbols_text))
            strategy = "curated_list"
        else:
            # Look for universe indicators
            if "fetch_intial_stock_list" in code or "universe" in code.lower():
                strategy = "full_market"
                symbol_count = 4000  # Estimated full market
            elif "polygon.io" in code and "grouped" in code:
                strategy = "market_scan"
                symbol_count = 4000
            else:
                strategy = "dynamic"
                symbol_count = 100  # Default estimate

        return {
            "strategy": strategy,
            "symbol_count": symbol_count
        }

    def _analyze_timeframe(self, code: str) -> Dict:
        """Analyze data timeframe requirements"""
        timeframe = "1D"  # Default

        # Look for date range patterns
        if "START_DATE" in code and "END_DATE" in code:
            timeframe = "historical"
        elif "2020-01-01" in code or "2019" in code:
            timeframe = "5Y"
        elif "365" in code or "year" in code.lower():
            timeframe = "1Y"
        elif "30" in code or "month" in code.lower():
            timeframe = "1M"
        elif "today" in code.lower() or "current" in code.lower():
            timeframe = "1D"

        return {"timeframe": timeframe}

    def _analyze_complexity(self, code: str) -> Dict:
        """Analyze processing complexity"""
        complexity = "simple"

        # Lines of code
        line_count = len(code.split('\n'))

        if line_count > 1000:
            complexity = "enterprise"
        elif line_count > 500:
            complexity = "complex"
        elif line_count > 200:
            complexity = "moderate"
        else:
            complexity = "simple"

        # Override based on patterns
        for complexity_level, indicators in self.complexity_indicators.items():
            if any(indicator in code.lower() for indicator in indicators):
                complexity = complexity_level
                break

        return {"complexity": complexity}

    def _determine_scanner_type(self, ast_analysis, pattern_analysis, symbol_analysis, timeframe_analysis) -> ScannerType:
        """Determine scanner type based on all analysis"""

        # Enterprise indicators
        if (ast_analysis["has_multiprocessing"] or
            "enterprise_backtesting" in pattern_analysis["patterns"] or
            symbol_analysis["symbol_count"] > 1000 or
            timeframe_analysis["timeframe"] == "historical"):
            return ScannerType.ENTERPRISE

        # Focused scanner indicators
        if (symbol_analysis["strategy"] == "curated_list" and
            symbol_analysis["symbol_count"] < 500):
            return ScannerType.FOCUSED

        # Daily scanner indicators
        if (timeframe_analysis["timeframe"] == "1D" and
            symbol_analysis["symbol_count"] < 1000):
            return ScannerType.DAILY

        return ScannerType.UNKNOWN

    def _estimate_runtime(self, scanner_type: ScannerType, symbol_analysis: Dict, timeframe_analysis: Dict) -> int:
        """Estimate execution time in seconds"""
        base_time = {
            ScannerType.ENTERPRISE: 1800,  # 30 minutes
            ScannerType.FOCUSED: 300,      # 5 minutes
            ScannerType.DAILY: 120,        # 2 minutes
            ScannerType.INTRADAY: 60,      # 1 minute
            ScannerType.UNKNOWN: 300       # 5 minutes default
        }

        # Adjust based on symbol count
        symbol_multiplier = max(1.0, symbol_analysis["symbol_count"] / 100)

        # Adjust based on timeframe
        timeframe_multiplier = {
            "1D": 1.0,
            "1M": 2.0,
            "1Y": 5.0,
            "5Y": 10.0,
            "historical": 15.0
        }.get(timeframe_analysis["timeframe"], 1.0)

        return int(base_time[scanner_type] * symbol_multiplier * timeframe_multiplier)

    def _estimate_memory(self, scanner_type: ScannerType, symbol_analysis: Dict) -> str:
        """Estimate memory requirements"""
        if scanner_type == ScannerType.ENTERPRISE or symbol_analysis["symbol_count"] > 2000:
            return "enterprise"
        elif symbol_analysis["symbol_count"] > 500:
            return "high"
        elif symbol_analysis["symbol_count"] > 100:
            return "medium"
        else:
            return "low"

    def _determine_thread_strategy(self, scanner_type: ScannerType, symbol_analysis: Dict) -> str:
        """Determine optimal threading strategy"""
        if scanner_type == ScannerType.ENTERPRISE:
            return "hybrid"
        elif symbol_analysis["symbol_count"] > 500:
            return "symbol_parallel"
        else:
            return "symbol_parallel"

    def _estimate_api_calls(self, symbol_analysis: Dict, timeframe_analysis: Dict) -> int:
        """Estimate Polygon API calls needed"""
        symbols = symbol_analysis["symbol_count"]

        # Calls per symbol based on timeframe
        calls_per_symbol = {
            "1D": 1,
            "1M": 1,
            "1Y": 1,
            "5Y": 1,
            "historical": 2  # adjusted + unadjusted
        }.get(timeframe_analysis["timeframe"], 1)

        return symbols * calls_per_symbol

    def _calculate_confidence(self, ast_analysis: Dict, pattern_analysis: Dict) -> float:
        """Calculate classification confidence score"""
        confidence = 0.5  # Base confidence

        # Boost confidence for successful AST analysis
        if ast_analysis["ast_success"]:
            confidence += 0.2

        # Boost confidence for recognized patterns
        if pattern_analysis["patterns"]:
            confidence += 0.2 * len(pattern_analysis["patterns"])

        # Boost confidence for clear imports
        if ast_analysis["imports"]:
            confidence += 0.1

        return min(1.0, confidence)


# Global classifier instance
scanner_classifier = UniversalScannerClassifier()


async def classify_uploaded_scanner(code: str, filename: str = "") -> ScannerProfile:
    """
    Main entry point for scanner classification
    """
    return await scanner_classifier.classify_scanner(code, filename)