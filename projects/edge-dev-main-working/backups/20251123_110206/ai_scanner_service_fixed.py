#!/usr/bin/env python3
"""
FIXED AI-Powered Scanner Splitting Service
Intelligent trading algorithm analysis and splitting using OpenRouter + GLM
"""

import os
import json
import asyncio
import aiohttp
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime

@dataclass
class TradingParameter:
    name: str
    default_value: Any
    description: str
    category: str  # 'momentum', 'volume', 'price', 'technical', 'risk'
    importance: str  # 'critical', 'high', 'medium', 'low'

@dataclass
class PatternInfo:
    name: str
    description: str
    code_snippet: str
    dependencies: List[str]
    complexity: int
    trading_parameters: List[TradingParameter]

@dataclass
class ScannerAnalysis:
    patterns: List[PatternInfo]
    dependencies: List[str]
    imports: List[str]
    confidence: float
    total_complexity: int

class AIScannerServiceFixed:
    def __init__(self):
        self.api_key = os.getenv('OPENROUTER_API_KEY', '')
        self.base_url = 'https://openrouter.ai/api/v1'
        self.model = 'deepseek/deepseek-chat'  # Cost-effective model

        # Emergency performance optimization - aggressive timeouts
        self.timeout = aiohttp.ClientTimeout(
            total=25,           # Total request timeout: 25 seconds
            connect=5,          # Connection timeout: 5 seconds
            sock_read=20        # Read timeout: 20 seconds
        )

        if not self.api_key:
            raise ValueError("OPENROUTER_API_KEY environment variable not set")

    async def analyze_scanner(self, code: str, filename: str) -> ScannerAnalysis:
        """
        Analyze Python scanner code to identify distinct trading patterns
        """
        prompt = self._create_analysis_prompt(code, filename)

        async with aiohttp.ClientSession(timeout=self.timeout) as session:
            try:
                response = await self._make_ai_request(session, prompt, 'analysis')
                analysis = self._parse_analysis_response(response)
                return analysis
            except Exception as e:
                raise Exception(f"AI analysis failed: {str(e)}")

    async def generate_scanner(self, pattern: PatternInfo, original_code: str, base_imports: List[str]) -> str:
        """
        Generate complete executable scanner from pattern
        """
        prompt = self._create_generation_prompt(pattern, original_code, base_imports)

        async with aiohttp.ClientSession(timeout=self.timeout) as session:
            try:
                response = await self._make_ai_request(session, prompt, 'generation')
                generated_code = self._extract_generated_code(response)
                return generated_code
            except Exception as e:
                raise Exception(f"Scanner generation failed: {str(e)}")

    async def split_scanner_intelligent(self, code: str, filename: str) -> Dict[str, Any]:
        """
        Main function: Intelligently split scanner into individual patterns
        """
        try:
            # Step 1: Analyze the code to identify patterns
            print(f"AI Analyzing {filename} with enhanced detection...")
            analysis = await self.analyze_scanner(code, filename)

            print(f"Found {len(analysis.patterns)} distinct patterns")

            # Step 2: Generate individual scanners for each pattern
            generated_scanners = []

            for i, pattern in enumerate(analysis.patterns):
                print(f"Generating scanner {i+1}: {pattern.name}")

                scanner_code = await self.generate_scanner(pattern, code, analysis.imports)

                generated_scanner = {
                    'scanner_name': f"{pattern.name}_AI_Generated",
                    'description': pattern.description,
                    'formatted_code': scanner_code,
                    'parameters': [
                        {
                            'name': param.name,
                            'default_value': param.default_value,
                            'description': param.description,
                            'category': param.category,
                            'importance': param.importance
                        }
                        for param in pattern.trading_parameters
                    ],
                    'complexity': pattern.complexity,
                    'dependencies': pattern.dependencies
                }

                generated_scanners.append(generated_scanner)

            return {
                'success': True,
                'total_scanners': len(generated_scanners),
                'scanners': generated_scanners,
                'analysis_confidence': analysis.confidence,
                'total_complexity': analysis.total_complexity,
                'method': 'AI_Powered_OpenRouter_Fixed',
                'model_used': self.model,
                'timestamp': datetime.now().isoformat()
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'method': 'AI_Powered_OpenRouter_Fixed',
                'timestamp': datetime.now().isoformat()
            }

    async def _make_ai_request(self, session: aiohttp.ClientSession, prompt: str, request_type: str) -> str:
        """Make request to OpenRouter API"""

        system_prompts = {
            'analysis': self._get_analysis_system_prompt(),
            'generation': self._get_generation_system_prompt()
        }

        max_tokens = {
            'analysis': 4000,
            'generation': 8000
        }

        payload = {
            'model': self.model,
            'messages': [
                {
                    'role': 'system',
                    'content': system_prompts[request_type]
                },
                {
                    'role': 'user',
                    'content': prompt
                }
            ],
            'temperature': 0.0,  # Zero temperature for maximum consistency
            'max_tokens': max_tokens[request_type],
            'top_p': 0.1,
        }

        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://ce-hub.ai',
            'X-Title': 'CE-Hub AI Scanner Splitting Fixed',
        }

        async with session.post(
            f'{self.base_url}/chat/completions',
            headers=headers,
            json=payload
        ) as response:
            if not response.ok:
                error_text = await response.text()
                raise Exception(f"OpenRouter API error {response.status}: {error_text}")

            data = await response.json()
            return data['choices'][0]['message']['content']

    def _get_analysis_system_prompt(self) -> str:
        return """You are an expert trading algorithm analyst specialized in identifying BINARY PATTERN DETECTION functions.

CRITICAL SCANNER DETECTION RULES:

1. INCLUDE: Functions that assign .astype(int) to DataFrame columns to create 0/1 binary signals
2. INCLUDE: Complex boolean logic with & and | operators checking trading conditions
3. INCLUDE: Pattern detection that outputs trading signals (buy/sell/watch signals)
4. EXCLUDE: Scoring/grading functions that calculate numerical scores (0-100 range)
5. EXCLUDE: Functions with "score", "grade", "tier", "parabolic" in name or logic

EXPECTED PATTERNS TO FIND:
- lc_frontside_d3_extended_1: Complex D3 pattern with ATR and volume conditions
- lc_frontside_d2_extended: D2 pattern with momentum criteria
- lc_fbo: Front breakout pattern with specific triggers

PARAMETER EXTRACTION REQUIREMENTS:
Extract ALL numeric values from conditional logic as configurable parameters:
- ATR thresholds (0.5, 1.0, 1.5, 2.0, etc.)
- Volume ratio requirements (1.0, 1.5, 2.0, 3.0, etc.)
- Distance limits (0.2, 0.6, 0.7, etc.)
- Price movement percentages
- Technical indicator periods and multipliers

OUTPUT: Valid JSON with ONLY binary pattern detection functions and their extracted parameters."""

    def _get_generation_system_prompt(self) -> str:
        return """You are an expert Python trading algorithm developer.

GENERATION OBJECTIVES:
1. Create complete, executable Python scanner from the pattern
2. Preserve ALL original trading logic and conditions exactly
3. Include ALL required dependencies and imports
4. Maintain exact mathematical calculations
5. Add proper error handling and execution wrapper

CRITICAL REQUIREMENTS:
- Never modify trading logic or thresholds
- Include complete data processing pipeline
- Maintain all variable transformations
- Add async/await for API calls
- Include proper main() execution wrapper
- Preserve exact condition logic from original

OUTPUT: Complete Python file ready for execution."""

    def _create_analysis_prompt(self, code: str, filename: str) -> str:
        """Enhanced prompt for finding specific scanner functions with parameter extraction"""
        return f"""ANALYZE: Trading scanner code for binary pattern functions with parameter extraction.

FILE: {filename} ({len(code)} chars)

FIND EXACTLY THESE 3 SCANNER FUNCTIONS:
1. lc_frontside_d3_extended_1 - Should have .astype(int) creating binary signals
2. lc_frontside_d2_extended - Should have .astype(int) creating binary signals
3. lc_fbo - Should have .astype(int) creating binary signals

PARAMETER EXTRACTION RULES:
Extract ALL numeric values used in conditional logic as configurable parameters.

Examples of parameters to extract:
- ATR multipliers: high_chg_atr >= 0.5 -> Extract "0.5" as "atr_threshold_min"
- Volume ratios: v_ua >= 1.5 -> Extract "1.5" as "volume_ratio_min"
- Distance limits: dist_h_9ema_atr >= 0.2 -> Extract "0.2" as "distance_ema_min"
- Price changes: c > h1 * 1.02 -> Extract "1.02" as "price_breakout_factor"

REQUIRED JSON OUTPUT:
{{
  "patterns": [
    {{
      "name": "lc_frontside_d3_extended_1",
      "description": "D3 extended pattern with ATR and volume analysis",
      "code_snippet": "def lc_frontside_d3_extended_1...",
      "dependencies": [],
      "complexity": 5,
      "trading_parameters": [
        {{
          "name": "atr_threshold_min",
          "default_value": 0.5,
          "description": "Minimum ATR threshold for pattern activation",
          "category": "technical",
          "importance": "high"
        }},
        {{
          "name": "volume_ratio_min",
          "default_value": 1.5,
          "description": "Minimum volume ratio requirement",
          "category": "volume",
          "importance": "medium"
        }}
      ]
    }}
  ],
  "dependencies": [],
  "imports": [],
  "confidence": 0.95,
  "total_complexity": 15
}}

CODE TO ANALYZE:
{code}"""

    def _create_generation_prompt(self, pattern: PatternInfo, original_code: str, base_imports: List[str]) -> str:
        return f"""Generate complete executable Python scanner for this pattern:

PATTERN: {pattern.name}
DESCRIPTION: {pattern.description}
DEPENDENCIES: {', '.join(pattern.dependencies)}

CRITICAL REQUIREMENTS:
1. Create complete executable scanner
2. Include ALL dependencies from original code
3. Preserve exact trading logic
4. Add API integration and main() wrapper
5. Include all imports: {', '.join(base_imports)}
6. MANDATORY: Include data type conversion for all trading columns

DATA TYPE CONVERSION REQUIREMENT:
You MUST include this function and call it on all DataFrames before any calculations:

```python
def fix_data_types(df):
    \"\"\"Fix data types for trading calculations\"\"\"
    if df is None or df.empty:
        return df

    # Convert critical trading columns to numeric
    numeric_columns = ['h', 'l', 'o', 'c', 'h1', 'h2', 'h3', 'l1', 'l2', 'c1', 'c2', 'c3', 'o1', 'o2',
                      'pdc', 'v', 'v_ua', 'v1', 'v2', 'v_ua1', 'dol_v', 'dol_v1', 'dol_v2',
                      'atr', 'true_range', 'ema9', 'ema20', 'ema50', 'ema200',
                      'high_chg_atr', 'high_chg_from_pdc_atr', 'dist_h_9ema_atr', 'dist_h_20ema_atr']

    for col in numeric_columns:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

    return df
```

YOU MUST CALL fix_data_types(df) immediately after creating any DataFrame and before any calculations.

ORIGINAL CODE REFERENCE:
```python
{original_code[:5000]}  # Truncated for context
```

PATTERN LOGIC TO IMPLEMENT:
{pattern.code_snippet}

Generate complete Python file with:
- All required imports
- fix_data_types function (MANDATORY)
- All helper functions from dependencies
- Complete pattern implementation with data type fixes
- API integration for data fetching
- Async main() execution wrapper
- Error handling

Return ONLY the Python code, no explanations."""

    def _parse_analysis_response(self, response: str) -> ScannerAnalysis:
        """Parse AI analysis response into structured data"""
        try:
            # Extract JSON from response
            json_match = None
            if '```json' in response:
                json_match = response.split('```json')[1].split('```')[0].strip()
            elif '```' in response:
                json_match = response.split('```')[1].strip()
            elif '{' in response:
                start = response.find('{')
                end = response.rfind('}') + 1
                json_match = response[start:end]

            if not json_match:
                raise ValueError("No JSON found in AI response")

            data = json.loads(json_match)

            # Convert to structured objects
            patterns = []
            for pattern_data in data.get('patterns', []):
                parameters = []
                for param_data in pattern_data.get('trading_parameters', []):
                    # Handle both dict and string formats
                    if isinstance(param_data, dict):
                        parameters.append(TradingParameter(
                            name=param_data.get('name', 'unknown'),
                            default_value=param_data.get('default_value', 0),
                            description=param_data.get('description', ''),
                            category=param_data.get('category', 'technical'),
                            importance=param_data.get('importance', 'medium')
                        ))
                    # Skip if it's not a dict (could be a string or other format)

                patterns.append(PatternInfo(
                    name=pattern_data['name'],
                    description=pattern_data['description'],
                    code_snippet=pattern_data['code_snippet'],
                    dependencies=pattern_data['dependencies'],
                    complexity=pattern_data['complexity'],
                    trading_parameters=parameters
                ))

            return ScannerAnalysis(
                patterns=patterns,
                dependencies=data.get('dependencies', []),
                imports=data.get('imports', []),
                confidence=data.get('confidence', 0.8),
                total_complexity=data.get('total_complexity', 5)
            )

        except Exception as e:
            raise Exception(f"Failed to parse AI analysis: {str(e)}")

    def _extract_generated_code(self, response: str) -> str:
        """Extract Python code from AI generation response"""
        # Extract Python code from response
        if '```python' in response:
            code_match = response.split('```python')[1].split('```')[0].strip()
        elif '```' in response:
            code_match = response.split('```')[1].strip()
        else:
            # If no code blocks, assume entire response is code
            code_match = response.strip()

        return code_match

    async def test_connection(self) -> bool:
        """Test connection to OpenRouter API"""
        try:
            async with aiohttp.ClientSession(timeout=self.timeout) as session:
                headers = {
                    'Authorization': f'Bearer {self.api_key}',
                }

                async with session.get(
                    f'{self.base_url}/models',
                    headers=headers
                ) as response:
                    return response.ok

        except Exception as e:
            print(f"OpenRouter connection test failed: {e}")
            return False

# Global instance
ai_scanner_service_fixed = AIScannerServiceFixed()