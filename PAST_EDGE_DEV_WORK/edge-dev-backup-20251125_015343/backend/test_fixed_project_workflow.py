#!/usr/bin/env python3
"""
Fixed Project Workflow Test
Tests the correct workflow: AI Split -> Save Scanners -> Create Project -> Add Scanners -> Display in UI
"""

import asyncio
import aiohttp
import json

async def test_fixed_project_workflow():
    """Test the corrected project creation workflow"""

    print("🎯 Testing Fixed Project Creation Workflow")
    print("=" * 60)

    # Read the user's scanner file
    with open("/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (2).py", "r") as f:
        code_content = f.read()

    base_url = "http://localhost:8000"

    async with aiohttp.ClientSession() as session:
        try:
            # Step 1: AI Split the Scanner
            print("\n📊 Step 1: AI-Splitting the Scanner...")
            payload = {
                "code": code_content,
                "filename": "lc d2 scan - oct 25 new ideas (2).py"
            }

            async with session.post(f"{base_url}/api/format/ai-split-scanners",
                                  json=payload) as response:
                if response.status != 200:
                    print(f"❌ AI split failed: {response.status}")
                    print(await response.text())
                    return False

                split_result = await response.json()
                print(f"✅ AI Split successful: {split_result['total_scanners']} scanners generated")

                # Step 2: Save Each Scanner to System
                print(f"\n💾 Step 2: Saving Each Scanner to System...")
                saved_scanner_ids = []

                for i, scanner in enumerate(split_result['scanners'], 1):
                    print(f"  Saving scanner {i}: {scanner['scanner_name']}")

                    save_payload = {
                        "scanner_code": scanner['formatted_code'],
                        "scanner_name": scanner['scanner_name'],
                        "parameters_count": len(scanner.get('parameters', [])),
                        "scanner_type": "ai_generated"
                    }

                    async with session.post(f"{base_url}/api/format/save-scanner-to-system",
                                          json=save_payload) as save_response:
                        if save_response.status != 200:
                            print(f"    ❌ Failed to save scanner {i}: {save_response.status}")
                            continue

                        save_result = await save_response.json()
                        if save_result.get('success'):
                            scanner_id = save_result['scanner_id']
                            saved_scanner_ids.append({
                                'scanner_id': scanner_id,
                                'scanner_name': scanner['scanner_name'],
                                'scanner_file': f"../data/scanners/{scanner_id}.py"
                            })
                            print(f"    ✅ Saved as {scanner_id}")
                        else:
                            print(f"    ❌ Save failed: {save_result.get('error')}")

                if not saved_scanner_ids:
                    print("❌ No scanners were saved successfully")
                    return False

                print(f"✅ Successfully saved {len(saved_scanner_ids)} scanners to system")

                # Step 3: Create Project (without scanners initially)
                print(f"\n📝 Step 3: Creating Project...")

                project_payload = {
                    "name": "AI Split Test Project",
                    "description": "Test project with AI-split scanners",
                    "aggregation_method": "UNION",
                    "tags": ["test", "ai-split"]
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

                    # Step 4: Add Each Scanner to Project
                    print(f"\n🔗 Step 4: Adding Scanners to Project...")

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

                    # Step 5: Verify Project Shows in List
                    print(f"\n📋 Step 5: Verifying Project Appears in Projects List...")

                    async with session.get(f"{base_url}/api/projects") as list_response:
                        if list_response.status != 200:
                            print(f"❌ Failed to list projects: {list_response.status}")
                            return False

                        projects = await list_response.json()
                        print(f"✅ Found {len(projects)} projects")

                        # Look for our test project
                        test_project = None
                        for project in projects:
                            if project['name'] == "AI Split Test Project":
                                test_project = project
                                break

                        if test_project:
                            print(f"✅ Test project found in list!")
                            print(f"  - Name: {test_project['name']}")
                            print(f"  - ID: {test_project['id']}")
                            print(f"  - Scanner count: {test_project.get('scanner_count', 0)}")

                            # Step 6: Verify Project Has Scanners
                            print(f"\n🔍 Step 6: Verifying Project Has Scanners...")

                            async with session.get(f"{base_url}/api/projects/{project_id}/scanners") as scanners_response:
                                if scanners_response.status != 200:
                                    print(f"❌ Failed to get project scanners: {scanners_response.status}")
                                    return False

                                project_scanners = await scanners_response.json()
                                print(f"✅ Project has {len(project_scanners)} scanners:")

                                for scanner in project_scanners:
                                    print(f"  - {scanner.get('scanner_id')}: {scanner.get('enabled', 'Unknown status')}")

                                if len(project_scanners) > 0:
                                    print(f"🎉 SUCCESS: Project with scanners should now appear in UI!")
                                    return True
                                else:
                                    print(f"❌ FAILED: Project has no scanners")
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
    success = await test_fixed_project_workflow()

    print(f"\n{'=' * 60}")
    if success:
        print("🎉 SUCCESS: Complete project workflow works!")
        print("✅ AI-split scanners should now appear in Projects section!")
        print("✅ Users can now run the individual scanners from the UI!")
    else:
        print("❌ FAILED: Project workflow still has issues")
        print("❌ Need to debug the remaining problems")
    print(f"{'=' * 60}")

if __name__ == "__main__":
    asyncio.run(main())