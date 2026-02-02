#!/usr/bin/env python3
"""
Edge.dev File Upload Fix Test
Attempts to fix the file upload issue by trying different approaches
"""

import asyncio
import json
import os
from datetime import datetime
from playwright.async_api import async_playwright

# Configuration
EDGE_DEV_URL = "http://localhost:5656"
BACKSIDE_FILE_PATH = "/Users/michaeldurante/Downloads/backside para b copy.py"

class EdgeDevUploadFixTester:
    def __init__(self):
        self.browser = None
        self.page = None
        self.test_results = []

    async def setup(self):
        """Initialize browser and page"""
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(headless=False)
        self.page = await self.browser.new_page()
        self.page.set_default_timeout(30000)
        print("🚀 Browser initialized for upload fix testing")

    async def log_attempt(self, method: str, success: bool, details: str):
        """Log upload attempt"""
        result = {
            "method": method,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅" if success else "❌"
        print(f"{status} {method}: {details}")

    async def test_method_1_direct_file_input(self):
        """Method 1: Look for existing file inputs and use them"""
        try:
            # Navigate to Edge.dev
            await self.page.goto(EDGE_DEV_URL, wait_until="domcontentloaded")
            await self.page.wait_for_timeout(3000)

            # Look for all file inputs
            file_inputs = await self.page.query_selector_all('input[type="file"]')

            if file_inputs:
                # Try the first visible file input
                for i, file_input in enumerate(file_inputs):
                    try:
                        if await file_input.is_visible():
                            await file_input.set_input_files(BACKSIDE_FILE_PATH)
                            await self.page.wait_for_timeout(3000)

                            # Check if file was accepted
                            await self.page.screenshot(path=f"/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/screenshots/upload_fix_method1_{i}.png")
                            await self.log_attempt("Direct File Input", True, f"File uploaded to input #{i+1}")
                            return True
                    except Exception as e:
                        await self.log_attempt("Direct File Input", False, f"Input #{i+1} failed: {str(e)[:50]}")
                        continue

            await self.log_attempt("Direct File Input", False, "No visible file inputs found")
            return False

        except Exception as e:
            await self.log_attempt("Direct File Input", False, f"Method failed: {str(e)[:50]}")
            return False

    async def test_method_2_drag_and_drop_simulation(self):
        """Method 2: Simulate drag and drop"""
        try:
            # Look for drag/drop area
            drop_area = await self.page.query_selector('[class*="drag"], [class*="drop"], [class*="upload"]')

            if drop_area:
                # Read the file content as base64
                import base64
                with open(BACKSIDE_FILE_PATH, "rb") as f:
                    file_content = f.read()

                # Create data transfer object
                data_transfer = await self.page.evaluate_handle("""
                    (fileContent, fileName) => {
                        const data = new DataTransfer();
                        const blob = new Blob([fileContent], { type: 'text/x-python' });
                        data.items.add(blob, fileName);
                        return data;
                    }
                """, file_content, os.path.basename(BACKSIDE_FILE_PATH))

                # Simulate drop
                await drop_area.dispatch_event('drop', {'dataTransfer': data_transfer})
                await self.page.wait_for_timeout(3000)
                await self.page.screenshot(path="/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/screenshots/upload_fix_method2.png")
                await self.log_attempt("Drag and Drop", True, "File dropped successfully")
                return True

            await self.log_attempt("Drag and Drop", False, "No drag/drop area found")
            return False

        except Exception as e:
            await self.log_attempt("Drag and Drop", False, f"Method failed: {str(e)[:50]}")
            return False

    async def test_method_3_create_file_input(self):
        """Method 3: Create a new file input and trigger it"""
        try:
            # Create a file input element
            file_input_result = await self.page.evaluate("""
                () => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.py,.txt,text/plain';
                    input.style.position = 'fixed';
                    input.style.top = '10px';
                    input.style.left = '10px';
                    input.style.zIndex = '9999';
                    input.style.background = 'red';
                    input.style.border = '2px solid yellow';
                    document.body.appendChild(input);
                    return input.id = 'custom-file-input-' + Date.now();
                }
            """)

            await self.page.wait_for_timeout(2000)

            # Find and use the created input
            created_input = await self.page.query_selector('#custom-file-input')
            if created_input:
                await created_input.set_input_files(BACKSIDE_FILE_PATH)
                await self.page.wait_for_timeout(3000)
                await self.page.screenshot(path="/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/screenshots/upload_fix_method3.png")
                await self.log_attempt("Created File Input", True, "File uploaded to created input")
                return True

            await self.log_attempt("Created File Input", False, "Could not find created input")
            return False

        except Exception as e:
            await self.log_attempt("Created File Input", False, f"Method failed: {str(e)[:50]}")
            return False

    async def test_method_4_clipboard_paste(self):
        """Method 4: Try clipboard paste approach"""
        try:
            # Read file content
            with open(BACKSIDE_FILE_PATH, 'r') as f:
                code_content = f.read()

            # Look for textareas or code editors
            textareas = await self.page.query_selector_all('textarea, [contenteditable="true"], [class*="editor"]')

            if textareas:
                textarea = textareas[0]
                await textarea.click()
                await self.page.keyboard.press('Meta+a')  # Select all
                await self.page.keyboard.type(code_content, delay=10)
                await self.page.wait_for_timeout(3000)
                await self.page.screenshot(path="/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/screenshots/upload_fix_method4.png")
                await self.log_attempt("Clipboard Paste", True, "Code pasted into textarea")
                return True

            await self.log_attempt("Clipboard Paste", False, "No textarea found")
            return False

        except Exception as e:
            await self.log_attempt("Clipboard Paste", False, f"Method failed: {str(e)[:50]}")
            return False

    async def test_method_5_api_direct_upload(self):
        """Method 5: Try direct API upload if endpoints exist"""
        try:
            # Look for upload endpoints by checking network activity or common patterns
            # First, let's look for any forms that might handle file uploads
            forms = await self.page.query_selector_all('form')

            for i, form in enumerate(forms):
                try:
                    # Check if form has file input or enctype
                    enctype = await form.get_attribute('enctype')
                    action = await form.get_attribute('action')

                    if enctype and 'multipart' in enctype:
                        await self.log_attempt("API Direct Upload", True, f"Found multipart form #{i+1}: {action}")
                        return True
                except:
                    continue

            await self.log_attempt("API Direct Upload", False, "No upload forms found")
            return False

        except Exception as e:
            await self.log_attempt("API Direct Upload", False, f"Method failed: {str(e)[:50]}")
            return False

    async def cleanup(self):
        """Clean up resources"""
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()

    async def save_results(self):
        """Save test results"""
        results_file = "/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/test_results/upload_fix_test_results.json"
        with open(results_file, 'w') as f:
            json.dump(self.test_results, f, indent=2, default=str)
        print(f"💾 Upload fix test results saved to: {results_file}")

    async def run_upload_fix_test(self):
        """Run all upload fix methods"""
        print("🔧 STARTING EDGE.DEV FILE UPLOAD FIX TEST")
        print("=" * 60)

        try:
            await self.setup()

            # Test all methods
            methods = [
                self.test_method_1_direct_file_input,
                self.test_method_2_drag_and_drop_simulation,
                self.test_method_3_create_file_input,
                self.test_method_4_clipboard_paste,
                self.test_method_5_api_direct_upload
            ]

            for method in methods:
                await method()
                await self.page.wait_for_timeout(2000)  # Brief pause between methods

            # Save results
            await self.save_results()

            # Summary
            successful_methods = [r for r in self.test_results if r["success"]]
            print(f"\n📊 UPLOAD FIX TEST SUMMARY:")
            print(f"✅ Successful methods: {len(successful_methods)}/{len(self.test_results)}")

            if successful_methods:
                print(f"\nSuccessful methods:")
                for result in successful_methods:
                    print(f"  - {result['method']}: {result['details']}")
            else:
                print(f"\n❌ No upload methods were successful")
                print("🔍 Recommend checking Edge.dev file upload implementation")

        except Exception as e:
            print(f"❌ Upload fix test failed: {e}")

        finally:
            await self.cleanup()

async def main():
    """Main test runner"""
    if not os.path.exists(BACKSIDE_FILE_PATH):
        print(f"❌ Backside scanner file not found: {BACKSIDE_FILE_PATH}")
        return False

    print(f"📁 Testing file upload with: {BACKSIDE_FILE_PATH}")
    print(f"📏 File size: {os.path.getsize(BACKSIDE_FILE_PATH):,} bytes")

    tester = EdgeDevUploadFixTester()
    await tester.run_upload_fix_test()

if __name__ == "__main__":
    asyncio.run(main())