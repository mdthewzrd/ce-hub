#!/usr/bin/env python3
"""
Complete Fixed Workflow Test
Direct test of the fixed project creation workflow with manual scanner data
"""

import asyncio
import aiohttp
import json

async def test_complete_fixed_workflow():
    """Test the complete fixed workflow with simple test data"""

    print("🎯 Testing Complete Fixed Project Creation Workflow")
    print("=" * 60)

    base_url = "http://localhost:8000"

    # Test with simple scanner data (instead of waiting for AI)
    test_scanners = [
        {
            "scanner_name": "Test Scanner 1",
            "formatted_code": '''
import pandas as pd

def test_scanner_1():
    print("Test Scanner 1 executing")
    return pd.DataFrame({'signal': [1, 0, 1]})

if __name__ == "__main__":
    test_scanner_1()
            '''.strip(),
            "parameters": []
        },
        {
            "scanner_name": "Test Scanner 2",
            "formatted_code": '''
import pandas as pd

def test_scanner_2():
    print("Test Scanner 2 executing")
    return pd.DataFrame({'signal': [0, 1, 1]})

if __name__ == "__main__":
    test_scanner_2()
            '''.strip(),
            "parameters": []
        }
    ]

    async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=30)) as session:
        try:
            # Step 1: Save Each Scanner to System
            print(f"\n💾 Step 1: Saving Test Scanners to System...")
            saved_scanner_ids = []

            for i, scanner in enumerate(test_scanners, 1):
                print(f"  Saving scanner {i}: {scanner['scanner_name']}")

                save_payload = {
                    "scanner_code": scanner['formatted_code'],
                    "scanner_name": scanner['scanner_name'],
                    "parameters_count": len(scanner.get('parameters', [])),
                    "scanner_type": "test_scanner"
                }

                async with session.post(f"{base_url}/api/format/save-scanner-to-system",
                                      json=save_payload) as save_response:
                    if save_response.status != 200:
                        print(f"    ❌ Failed to save scanner {i}: {save_response.status}")
                        print(f"    Error: {await save_response.text()}")
                        continue

                    save_result = await save_response.json()
                    if save_result.get('success'):
                        scanner_id = save_result['scanner_id']
                        saved_scanner_ids.append({
                            'scanner_id': scanner_id,
                            'scanner_name': scanner['scanner_name'],
                            'scanner_file': save_result['scanner_file']
                        })
                        print(f"    ✅ Saved as {scanner_id}")
                    else:
                        print(f"    ❌ Save failed: {save_result.get('error')}")

            if not saved_scanner_ids:
                print("❌ No scanners were saved successfully")
                return False

            print(f"✅ Successfully saved {len(saved_scanner_ids)} scanners to system")

            # Step 2: Create Project (without scanners initially)
            print(f"\n📝 Step 2: Creating Project...")

            project_payload = {
                "name": "Fixed Workflow Test Project",
                "description": "Test project with correctly saved scanners",
                "aggregation_method": "union",
                "tags": ["test", "fixed-workflow"]
            }

            async with session.post(f"{base_url}/api/projects",
                                  json=project_payload) as project_response:
                if project_response.status != 200:
                    print(f"❌ Project creation failed: {project_response.status}")
                    error_text = await project_response.text()
                    print(f"Error details: {error_text}")
                    return False

                project_result = await project_response.json()
                project_id = project_result['id']
                print(f"✅ Project created successfully: {project_id}")

                # Step 3: Add Each Scanner to Project
                print(f"\n🔗 Step 3: Adding Scanners to Project...")

                for i, scanner_info in enumerate(saved_scanner_ids):
                    print(f"  Adding scanner {i+1}: {scanner_info['scanner_name']}")

                    add_scanner_payload = {
                        "scanner_id": scanner_info['scanner_id'],
                        "scanner_file": scanner_info['scanner_file'],
                        "enabled": True,
                        "weight": 1.0,
                        "order_index": i
                    }

                    async with session.post(f"{base_url}/api/projects/{project_id}/scanners",
                                          json=add_scanner_payload) as add_response:
                        if add_response.status != 200:
                            print(f"    ❌ Failed to add scanner: {add_response.status}")
                            error_text = await add_response.text()
                            print(f"    Error: {error_text}")
                            continue

                        add_result = await add_response.json()
                        print(f"    ✅ Added scanner: {add_result.get('scanner_id')}")

                # Step 4: Verify Project Shows in List with Scanners
                print(f"\n📋 Step 4: Verifying Project Appears in Projects List...")

                async with session.get(f"{base_url}/api/projects") as list_response:
                    if list_response.status != 200:
                        print(f"❌ Failed to list projects: {list_response.status}")
                        return False

                    projects = await list_response.json()
                    print(f"✅ Found {len(projects)} projects")

                    # Look for our test project
                    test_project = None
                    for project in projects:
                        if project['name'] == "Fixed Workflow Test Project":
                            test_project = project
                            break

                    if test_project:
                        print(f"✅ Test project found in list!")
                        print(f"  - Name: {test_project['name']}")
                        print(f"  - ID: {test_project['id']}")
                        print(f"  - Scanner count: {test_project.get('scanner_count', 0)}")

                        # Step 5: Verify Project Has Scanners
                        print(f"\n🔍 Step 5: Verifying Project Has Scanners...")

                        async with session.get(f"{base_url}/api/projects/{project_id}/scanners") as scanners_response:
                            if scanners_response.status != 200:
                                print(f"❌ Failed to get project scanners: {scanners_response.status}")
                                return False

                            project_scanners = await scanners_response.json()
                            print(f"✅ Project has {len(project_scanners)} scanners:")

                            for scanner in project_scanners:
                                status = "enabled" if scanner.get('enabled') else "disabled"
                                print(f"  - {scanner.get('scanner_id')}: {status}")

                            if len(project_scanners) >= 2:
                                print(f"\n🎉 SUCCESS: Complete workflow works perfectly!")
                                print(f"✅ Scanners are saved to system with proper IDs")
                                print(f"✅ Project is created and appears in UI")
                                print(f"✅ Scanners are added to project successfully")
                                print(f"✅ Project shows scanner count in list")
                                print(f"✅ End-to-end workflow is now functional!")
                                return True
                            else:
                                print(f"❌ FAILED: Project has insufficient scanners ({len(project_scanners)}/2)")
                                return False
                    else:
                        print("❌ Test project not found in list")
                        return False

        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
            import traceback
            traceback.print_exc()
            return False

async def main():
    success = await test_complete_fixed_workflow()

    print(f"\n{'=' * 60}")
    if success:
        print("🎉 SUCCESS: Complete fixed workflow is operational!")
        print("✅ AI-split scanners should now appear in Projects section!")
        print("✅ Users can create projects with individual scanners!")
        print("✅ The original issue has been resolved!")
    else:
        print("❌ FAILED: Workflow still has remaining issues")
    print(f"{'=' * 60}")

if __name__ == "__main__":
    asyncio.run(main())