#!/usr/bin/env python3
"""
Test script to explore Edge.dev interface structure and find upload functionality
"""

import asyncio
from playwright.async_api import async_playwright

async def explore_edge_dev_interface():
    """Explore the Edge.dev interface to understand its structure"""

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()
        page.set_default_timeout(30000)

        try:
            # Navigate to Edge.dev
            await page.goto("http://localhost:5656", wait_until="domcontentloaded")
            await page.wait_for_timeout(5000)

            print("🔍 EXPLORING EDGE.DEV INTERFACE")
            print("=" * 50)

            # Take initial screenshot
            await page.screenshot(path="/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/screenshots/interface_exploration_01_home.png")

            # Check page title and content
            title = await page.title()
            print(f"📄 Page Title: {title}")

            # Look for any upload-related elements
            upload_selectors = [
                'input[type="file"]',
                '[accept*=".py"]',
                '[accept*="text"]',
                'button:has-text("Upload")',
                'button:has-text("File")',
                'button:has-text("Browse")',
                '[class*="upload"]',
                '[class*="file"]',
                '[class*="drag"]',
                'a:has-text("Upload")',
                'a:has-text("File")',
                'a:has-text("Scanner")',
                'a:has-text("Import")',
            ]

            print("\n🔍 LOOKING FOR UPLOAD ELEMENTS:")
            found_elements = []

            for selector in upload_selectors:
                try:
                    elements = await page.query_selector_all(selector)
                    if elements:
                        print(f"✅ Found {len(elements)} element(s) with selector: {selector}")
                        found_elements.extend(elements)

                        # Get details for each element
                        for i, element in enumerate(elements):
                            try:
                                text = await element.inner_text()
                                visible = await element.is_visible()
                                enabled = await element.is_enabled()
                                print(f"   - Element {i+1}: Text='{text}', Visible={visible}, Enabled={enabled}")
                            except:
                                try:
                                    placeholder = await element.get_attribute('placeholder')
                                    visible = await element.is_visible()
                                    print(f"   - Element {i+1}: Placeholder='{placeholder}', Visible={visible}")
                                except:
                                    print(f"   - Element {i+1}: Unable to get text details")
                except:
                    continue

            # Look for navigation items
            nav_selectors = [
                'nav a',
                'button:has-text("Scanner")',
                'button:has-text("Scan")',
                'button:has-text("Analyze")',
                'a:has-text("Scanner")',
                'a:has-text("Scan")',
                'a:has-text("Analyze")',
                'a:has-text("Projects")',
                'a:has-text("Dashboard")',
            ]

            print("\n🧭 LOOKING FOR NAVIGATION:")
            for selector in nav_selectors:
                try:
                    elements = await page.query_selector_all(selector)
                    if elements:
                        print(f"✅ Found {len(elements)} nav element(s) with selector: {selector}")
                        for element in elements:
                            try:
                                text = await element.inner_text()
                                print(f"   - Nav: {text}")
                            except:
                                continue
                except:
                    continue

            # Check if there are any modals or popups
            modal_selectors = [
                '[class*="modal"]',
                '[class*="popup"]',
                '[class*="dialog"]',
                '[role="dialog"]',
            ]

            print("\n🪟 LOOKING FOR MODALS:")
            for selector in modal_selectors:
                try:
                    elements = await page.query_selector_all(selector)
                    if elements:
                        print(f"✅ Found {len(elements)} modal(s) with selector: {selector}")
                except:
                    continue

            # Look for any buttons
            button_selectors = [
                'button',
                '[role="button"]',
                'a[href]',
            ]

            print("\n🔘 LOOKING FOR ALL BUTTONS/LINKS:")
            all_buttons = []
            for selector in button_selectors:
                try:
                    elements = await page.query_selector_all(selector)
                    all_buttons.extend(elements)
                except:
                    continue

            # Get unique button texts
            button_texts = set()
            for button in all_buttons:
                try:
                    text = await button.inner_text()
                    if text and len(text.strip()) > 0 and len(text.strip()) < 50:
                        button_texts.add(text.strip())
                except:
                    continue

            for text in sorted(list(button_texts)):
                print(f"   - {text}")

            # Take a final screenshot
            await page.screenshot(path="/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/screenshots/interface_exploration_02_full.png")

            print("\n📸 Screenshots saved to screenshots directory")
            print("🔍 Interface exploration completed")

        except Exception as e:
            print(f"❌ Error during exploration: {e}")
            await page.screenshot(path="/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/screenshots/interface_exploration_error.png")

        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(explore_edge_dev_interface())