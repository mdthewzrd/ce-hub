#!/usr/bin/env python3
"""
Test Project Creation with AI Split Scanners
"""

import asyncio
import aiohttp
import json

async def test_project_creation():
    """Test creating a project with AI-split scanners"""

    print("🧪 Testing Project Creation with AI-Split Scanners")
    print("=" * 60)

    base_url = "http://localhost:8000"

    async with aiohttp.ClientSession() as session:
        try:
            # First, get the AI split scanners
            with open("/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (2).py", "r") as f:
                code_content = f.read()

            print("📊 Step 1: Running AI Split...")
            split_payload = {
                "code": code_content,
                "filename": "lc d2 scan - oct 25 new ideas (2).py"
            }

            async with session.post(f"{base_url}/api/format/ai-split-scanners",
                                  json=split_payload) as response:
                if response.status != 200:
                    print(f"❌ AI split failed: {response.status}")
                    return False

                split_result = await response.json()
                print(f"✅ AI Split successful: {split_result['total_scanners']} scanners")

                # Step 2: Create project with the split scanners
                print("\n📝 Step 2: Creating project with split scanners...")

                project_payload = {
                    "name": "AI Split Test Project",
                    "description": "Test project with AI-split scanners",
                    "aggregation_method": "UNION",
                    "tags": ["test", "ai-split"],
                    "scanners": split_result['scanners']  # Include the scanners
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

                    # Step 3: List projects to verify
                    print("\n📋 Step 3: Verifying project in project list...")

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
                            print(f"  - Scanner count: {test_project['scanner_count']}")
                            return True
                        else:
                            print("❌ Test project not found in list")
                            return False

        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
            return False

async def main():
    success = await test_project_creation()

    print(f"\n{'=' * 60}")
    if success:
        print("🎉 SUCCESS: Project creation works with AI-split scanners!")
        print("✅ Scanners should now appear in the Projects section!")
    else:
        print("❌ FAILED: Project creation still has issues")
        print("❌ Need to fix project creation workflow")
    print(f"{'=' * 60}")

if __name__ == "__main__":
    asyncio.run(main())