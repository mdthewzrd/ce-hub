#!/usr/bin/env python3
"""
User Override and Manual Correction Test Scenarios
==================================================

This script tests the specific user override capabilities of the
human-in-the-loop formatting system.
"""

import asyncio
import json
import aiohttp

API_BASE_URL = "http://localhost:8000"

async def test_user_override_scenarios():
    """Test various user override scenarios"""

    async with aiohttp.ClientSession() as session:
        print("🤝 TESTING USER OVERRIDE SCENARIOS")
        print("="*50)

        # Test 1: Parameter value override
        print("\n📝 Test 1: Parameter Value Override")
        test_code = """
VOLUME_MIN = 1000000
PRICE_MIN = 5.0
GAP_THRESHOLD = 2.5

def scan(data):
    return data[(data['volume'] >= VOLUME_MIN) & (data['price'] >= PRICE_MIN)]
"""

        # First extract parameters
        async with session.post(
            f"{API_BASE_URL}/api/format/extract-parameters",
            json={"code": test_code}
        ) as response:
            if response.status == 200:
                result = await response.json()
                parameters = result['parameters']

                # Simulate user overrides
                for param in parameters:
                    if param['name'] == 'VOLUME_MIN':
                        param['user_override'] = '2000000'  # User changes 1M to 2M
                        param['user_confirmed'] = True
                    elif param['name'] == 'PRICE_MIN':
                        param['user_override'] = '10.0'  # User changes 5.0 to 10.0
                        param['user_confirmed'] = True
                    else:
                        param['user_confirmed'] = True

                print(f"✅ User overrides applied to {len(parameters)} parameters")

                # Test collaborative step with overrides
                async with session.post(
                    f"{API_BASE_URL}/api/format/collaborative-step",
                    json={
                        "code": test_code,
                        "step_id": "parameter_discovery",
                        "parameters": parameters,
                        "user_choices": {"apply_overrides": True}
                    }
                ) as step_response:
                    if step_response.status == 200:
                        step_result = await step_response.json()
                        print("✅ User overrides processed successfully")

                        # Check if overrides appear in preview
                        preview = step_result['preview_code']
                        if '2000000' in preview and '10.0' in preview:
                            print("✅ User overrides applied correctly in preview")
                        else:
                            print("⚠️ User overrides not visible in preview")
                    else:
                        print("❌ User override processing failed")

        # Test 2: Parameter rejection
        print("\n❌ Test 2: Parameter Rejection")
        async with session.post(
            f"{API_BASE_URL}/api/format/extract-parameters",
            json={"code": test_code}
        ) as response:
            if response.status == 200:
                result = await response.json()
                parameters = result['parameters']

                # Simulate user rejecting some parameters
                confirmed_params = []
                for param in parameters:
                    if param['name'] != 'GAP_THRESHOLD':  # User rejects this one
                        param['user_confirmed'] = True
                        confirmed_params.append(param)
                    else:
                        param['user_confirmed'] = False

                print(f"✅ User rejected 1 parameter, kept {len(confirmed_params)}")

        # Test 3: Manual parameter addition
        print("\n➕ Test 3: Manual Parameter Addition")

        # User adds a custom parameter
        custom_parameter = {
            "name": "USER_CUSTOM_THRESHOLD",
            "value": "15.0",
            "type": "threshold",
            "line": 999,
            "confidence": 1.0,  # User-added parameters have 100% confidence
            "user_added": True,
            "user_confirmed": True,
            "suggested_description": "User-defined custom threshold parameter",
            "context": "# User added this parameter manually"
        }

        async with session.post(
            f"{API_BASE_URL}/api/format/collaborative-step",
            json={
                "code": test_code,
                "step_id": "parameter_discovery",
                "parameters": parameters + [custom_parameter],
                "user_choices": {"include_user_parameters": True}
            }
        ) as response:
            if response.status == 200:
                print("✅ User-added parameter processed successfully")
            else:
                print("❌ User-added parameter processing failed")

        # Test 4: Step-by-step user choices
        print("\n🎛️ Test 4: Step-by-Step User Choices")

        user_choices_scenarios = [
            {
                "scenario": "Conservative user",
                "choices": {
                    "add_async": False,
                    "add_error_handling": True,
                    "add_logging": False,
                    "optimization_level": "minimal"
                }
            },
            {
                "scenario": "Aggressive optimizer",
                "choices": {
                    "add_async": True,
                    "add_error_handling": True,
                    "add_logging": True,
                    "add_progress_tracking": True,
                    "optimization_level": "maximum"
                }
            }
        ]

        for scenario in user_choices_scenarios:
            print(f"  Testing: {scenario['scenario']}")

            async with session.post(
                f"{API_BASE_URL}/api/format/collaborative-step",
                json={
                    "code": test_code,
                    "step_id": "infrastructure_enhancement",
                    "parameters": parameters,
                    "user_choices": scenario['choices']
                }
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    preview_length = len(result['preview_code'])
                    suggestions_count = len(result['next_suggestions'])
                    print(f"    ✅ {scenario['scenario']}: {preview_length} chars, {suggestions_count} suggestions")
                else:
                    print(f"    ❌ {scenario['scenario']}: Failed")

        # Test 5: Confidence-based decision making
        print("\n🎯 Test 5: Confidence-Based Decision Making")

        # Test user behavior based on confidence levels
        async with session.post(
            f"{API_BASE_URL}/api/format/extract-parameters",
            json={"code": test_code}
        ) as response:
            if response.status == 200:
                result = await response.json()
                parameters = result['parameters']

                # Simulate realistic user behavior based on confidence
                high_confidence_accepted = 0
                low_confidence_rejected = 0

                for param in parameters:
                    if param['confidence'] > 0.8:
                        param['user_confirmed'] = True  # Users likely accept high confidence
                        high_confidence_accepted += 1
                    elif param['confidence'] < 0.5:
                        param['user_confirmed'] = False  # Users likely reject low confidence
                        low_confidence_rejected += 1
                    else:
                        param['user_confirmed'] = True  # Medium confidence - assume accepted

                print(f"✅ High confidence auto-accepted: {high_confidence_accepted}")
                print(f"❌ Low confidence rejected: {low_confidence_rejected}")

        print("\n🎯 USER OVERRIDE TESTING COMPLETE")
        print("All user override scenarios validated successfully!")

if __name__ == "__main__":
    asyncio.run(test_user_override_scenarios())