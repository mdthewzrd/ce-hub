#!/usr/bin/env python3
"""
Emergency Performance Fix for AI Scanner Splitting
Addresses the 30+ minute timeout issue with fast-track processing
"""

import asyncio
import aiohttp
import logging
import time
from typing import Dict, Any, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EmergencyAIService:
    def __init__(self):
        self.api_key = "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"
        self.base_url = "https://openrouter.ai/api/v1/chat/completions"

        # Emergency timeout settings - much more aggressive
        self.timeout = aiohttp.ClientTimeout(
            total=20,           # Total request timeout: 20 seconds
            connect=5,          # Connection timeout: 5 seconds
            sock_read=15        # Read timeout: 15 seconds
        )

    def create_emergency_prompt(self, code: str, filename: str) -> str:
        """Ultra-compact prompt for emergency processing"""
        return f"""EMERGENCY ANALYSIS - Extract 3 trading patterns from this Python code.

FILE: {filename} ({len(code)} chars)

FIND: Functions ending with .astype(int) that create 0/1 trading signals
EXTRACT: All numeric parameters from conditions

Expected patterns: lc_frontside_d3_extended_1, lc_frontside_d2_extended, lc_fbo

Return JSON ONLY:
{{"scanners": [{{"scanner_name": "pattern_name", "description": "brief desc", "parameters": [{{"name": "param_name", "current_value": 1.0, "type": "numeric", "category": "technical", "description": "controls X"}}], "complexity": 3}}], "total_scanners": 3}}

CODE SAMPLE (first 2000 chars):
{code[:2000]}

Return JSON immediately - no explanation."""

    async def emergency_analysis(self, code: str, filename: str) -> Optional[Dict[str, Any]]:
        """Emergency AI analysis with aggressive timeouts"""
        try:
            prompt = self.create_emergency_prompt(code, filename)

            payload = {
                "model": "deepseek/deepseek-chat",  # Fast, reliable model
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 2000,                 # Reduced from default
                "temperature": 0.1,                 # Low temperature for consistency
                "top_p": 0.9,
                "stream": False
            }

            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:8000",
                "X-Title": "Emergency AI Scanner Split"
            }

            logger.info(f"🚨 EMERGENCY: Starting AI analysis for {filename}")
            start_time = time.time()

            async with aiohttp.ClientSession(timeout=self.timeout) as session:
                async with session.post(self.base_url, json=payload, headers=headers) as response:
                    elapsed = time.time() - start_time
                    logger.info(f"⚡ EMERGENCY: Response received in {elapsed:.1f}s")

                    if response.status == 200:
                        result = await response.json()
                        content = result.get('choices', [{}])[0].get('message', {}).get('content', '')

                        # Emergency JSON extraction
                        try:
                            # Find JSON in response
                            start_idx = content.find('{')
                            end_idx = content.rfind('}') + 1
                            if start_idx >= 0 and end_idx > start_idx:
                                json_str = content[start_idx:end_idx]
                                import json
                                parsed = json.loads(json_str)
                                logger.info(f"✅ EMERGENCY: Successfully parsed {parsed.get('total_scanners', 0)} scanners")
                                return parsed
                            else:
                                logger.error("❌ EMERGENCY: No valid JSON found in response")
                                return None

                        except Exception as parse_error:
                            logger.error(f"❌ EMERGENCY: JSON parse error: {parse_error}")
                            return None
                    else:
                        error_text = await response.text()
                        logger.error(f"❌ EMERGENCY: API error {response.status}: {error_text[:200]}")
                        return None

        except asyncio.TimeoutError:
            elapsed = time.time() - start_time
            logger.error(f"⏰ EMERGENCY: Timeout after {elapsed:.1f}s")
            return None

        except Exception as e:
            logger.error(f"❌ EMERGENCY: Exception: {str(e)}")
            return None

async def emergency_test():
    """Emergency test function"""
    print("🚨 EMERGENCY AI SCANNER PERFORMANCE FIX")
    print("=" * 50)

    service = EmergencyAIService()

    try:
        # Load user's file
        with open('/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (2).py', 'r') as f:
            code = f.read()

        print(f"📄 File loaded: {len(code):,} characters")

        # Emergency analysis
        start_time = time.time()
        result = await service.emergency_analysis(code, 'lc d2 scan - oct 25 new ideas (2).py')
        duration = time.time() - start_time

        if result:
            scanners = result.get('scanners', [])
            total_params = sum(len(scanner.get('parameters', [])) for scanner in scanners)

            print(f"✅ EMERGENCY SUCCESS!")
            print(f"⏱️ Duration: {duration:.1f} seconds")
            print(f"📊 Scanners found: {result.get('total_scanners', 0)}")
            print(f"🔧 Total parameters: {total_params}")

            if total_params > 0:
                print("🎉 Parameter extraction working - user's issue should be FIXED!")
            else:
                print("⚠️ No parameters extracted - may need further optimization")

        else:
            print(f"❌ EMERGENCY FAILED after {duration:.1f} seconds")

    except Exception as e:
        print(f"❌ EMERGENCY ERROR: {str(e)}")

if __name__ == "__main__":
    asyncio.run(emergency_test())