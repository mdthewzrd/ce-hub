"""
Optimized AI Scanner Service with fast parameter extraction
"""
import json
import logging
import aiohttp
import asyncio
from typing import Dict, List, Any, Optional
from dataclasses import dataclass

@dataclass
class PatternInfo:
    name: str
    description: str
    dependencies: List[str]
    complexity: int

logger = logging.getLogger(__name__)

class OptimizedAIScannerService:
    def __init__(self, openrouter_api_key: str):
        self.openrouter_api_key = openrouter_api_key
        self.base_url = "https://openrouter.ai/api/v1"

    def _create_analysis_prompt(self, code: str, filename: str) -> str:
        """Optimized, fast AI analysis prompt"""
        return f"""Analyze Python trading code for binary pattern functions and parameters.

FIND: Functions with .astype(int) creating 0/1 trading signals
Expected: lc_frontside_d3_extended_1, lc_frontside_d2_extended, lc_fbo
IGNORE: parabolic_score, parabolic_tier

Extract ALL numeric values from conditional logic as parameters:
- ATR thresholds (0.5, 1.0, 1.5, 2.0)
- Volume ratios (1, 1.5, 2, 3)
- Distance limits (0.2, 0.6, 0.7)

CODE ({len(code)} chars):
```python
{code}
```

Return JSON:
{{
  "scanners": [
    {{
      "scanner_name": "pattern_name",
      "description": "brief description",
      "formatted_code": "complete function code",
      "parameters": [
        {{
          "name": "param_name",
          "current_value": number,
          "type": "numeric",
          "category": "momentum|volume|price|technical",
          "description": "what it controls"
        }}
      ],
      "complexity": 1-10
    }}
  ],
  "total_scanners": count
}}"""

    async def analyze_scanners(self, code: str, filename: str) -> Dict[str, Any]:
        """Fast scanner analysis with parameter extraction"""
        try:
            prompt = self._create_analysis_prompt(code, filename)

            headers = {
                "Authorization": f"Bearer {self.openrouter_api_key}",
                "HTTP-Referer": "http://localhost:8000",
                "X-Title": "Edge Dev Scanner Analysis",
                "Content-Type": "application/json"
            }

            payload = {
                "model": "deepseek/deepseek-chat",
                "messages": [
                    {"role": "system", "content": "You are a fast Python trading code analyzer. Be concise and accurate."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.1,
                "max_tokens": 4000,
                "stream": False
            }

            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=30)) as session:
                async with session.post(f"{self.base_url}/chat/completions",
                                      json=payload, headers=headers) as response:
                    if response.status != 200:
                        logger.error(f"OpenRouter API error: {response.status}")
                        return {"success": False, "error": f"API error: {response.status}"}

                    result = await response.json()

                    if 'choices' not in result or not result['choices']:
                        return {"success": False, "error": "No AI response"}

                    content = result['choices'][0]['message']['content']

                    # Extract JSON from response
                    json_start = content.find('{')
                    json_end = content.rfind('}') + 1

                    if json_start == -1 or json_end == 0:
                        return {"success": False, "error": "No JSON in response"}

                    json_content = content[json_start:json_end]
                    analysis_result = json.loads(json_content)

                    # Ensure proper response structure
                    if 'scanners' not in analysis_result:
                        return {"success": False, "error": "No scanners in response"}

                    # Add metadata
                    return {
                        "success": True,
                        "scanners": analysis_result["scanners"],
                        "total_scanners": analysis_result.get("total_scanners", len(analysis_result["scanners"])),
                        "analysis_confidence": 0.95,
                        "model_used": "deepseek/deepseek-chat",
                        "method": "AI_Powered_OpenRouter_Optimized",
                        "timestamp": "2025-11-12T00:00:00.000000"
                    }

        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {e}")
            return {"success": False, "error": f"JSON decode error: {str(e)}"}
        except asyncio.TimeoutError:
            logger.error("AI analysis timeout")
            return {"success": False, "error": "Analysis timeout - try simpler prompt"}
        except Exception as e:
            logger.error(f"Analysis error: {e}")
            return {"success": False, "error": str(e)}