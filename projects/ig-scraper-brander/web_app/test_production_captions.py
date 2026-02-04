#!/usr/bin/env python3
"""
Test caption generation through the actual app API.
This tests the production caption generation with our formatting fixes.
"""

import os
import sys
import json
import sqlite3
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

# Import caption generation service
from ai_caption_service import CaptionGenerator, OpenRouterClient

# Database path
DB_PATH = Path(__file__).parent / 'harmonatica.db'


def get_test_video_data():
    """Get test video data from ready_content table"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, video_path, caption
        FROM ready_content
        WHERE caption IS NOT NULL
        LIMIT 3
    """)

    results = []
    for row in cursor.fetchall():
        # Create mock video_data similar to what the app expects
        video_data = {
            'id': row['id'],
            'video_path': row['video_path'],
            'original_caption': row['caption'],
            'video_filename': row['video_path'].split('/')[-1] if row['video_path'] else 'test_video.mp4'
        }
        results.append(video_data)

    conn.close()
    return results


def get_account_id():
    """Get or create a test account"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Check if harmonatica account exists
    cursor.execute('SELECT id FROM accounts WHERE username = ?', ('harmonatica',))
    row = cursor.fetchone()

    if row:
        account_id = row['id']
    else:
        # Create test account
        cursor.execute("""
            INSERT INTO accounts (username, platform, active)
            VALUES (?, ?, ?)
        """, ('harmonatica', 'instagram', 1))
        conn.commit()
        account_id = cursor.lastrowid
        print(f"Created test account with ID: {account_id}")

    conn.close()
    return account_id


def main():
    """Main test function"""
    print("\n" + "="*70)
    print("🧪 PRODUCTION CAPTION GENERATION TEST")
    print("="*70)

    # Get test data
    print("\n📦 Loading test data...")
    video_data_list = get_test_video_data()

    if not video_data_list:
        print("❌ No test video data found!")
        return

    print(f"   ✓ Found {len(video_data_list)} test videos")

    # Get account ID
    account_id = get_account_id()
    print(f"   ✓ Using account ID: {account_id}")

    # Initialize caption generator
    print("\n🤖 Initializing caption generator...")
    client = OpenRouterClient()
    generator = CaptionGenerator(client)

    # Test each video
    results = []
    for i, video_data in enumerate(video_data_list, 1):
        print("\n" + "="*70)
        print(f"Test {i}/{len(video_data_list)}: {video_data['video_filename']}")
        print("="*70)

        try:
            # Generate caption using the production pipeline
            print("  → Generating caption via production pipeline...")
            result = generator.generate_caption(
                video_data=video_data,
                account_id=account_id,
                caption_style='long_form',
                reference_count=3,
                manychat_keyword=None  # No CTA for testing
            )

            if result.get('success'):
                caption = result.get('caption', '')

                print(f"\n  📝 Generated Caption:")
                print("  " + "-"*66)
                # Print first 500 chars
                preview = caption[:500]
                if len(caption) > 500:
                    preview += "..."
                for line in preview.split('\n'):
                    print(f"  {line}")
                print("  " + "-"*66)

                # Check for formatting issues
                print(f"\n  🔍 Formatting Check:")
                issues = []

                # Check for markdown bold
                if '**' in caption:
                    issues.append("❌ Markdown bold (**text**) found")
                else:
                    print("  ✓ No markdown bold")

                # Check for meta-commentary
                first_line = caption.split('\n')[0].strip().lower()
                meta_patterns = ["here's a", "here is a", "here's your", "here is your", "here is the"]
                if any(pattern in first_line for pattern in meta_patterns):
                    issues.append(f"❌ Meta-commentary found: '{first_line[:50]}'")
                else:
                    print("  ✓ No meta-commentary in first line")

                # Check for emojis in hook
                hook_lines = []
                for line in caption.split('\n'):
                    if line.strip():
                        hook_lines.append(line.strip())
                    if len(hook_lines) >= 2:
                        break

                if hook_lines:
                    hook = '\n'.join(hook_lines)
                    emoji_count = sum(1 for c in hook if ord(c) > 127000)
                    if emoji_count > 0:
                        issues.append(f"❌ {emoji_count} emoji(s) in hook")
                    else:
                        print("  ✓ No emojis in hook")

                    # Check hook length
                    hook_length = len(hook)
                    if hook_length > 140:
                        issues.append(f"⚠️  Hook length: {hook_length} chars (exceeds 140)")
                    else:
                        print(f"  ✓ Hook length: {hook_length} chars (within 140 limit)")

                # Quality score
                quality_score = result.get('quality_score', 0)
                print(f"\n  📊 Quality Score: {quality_score:.1f}/10")

                if issues:
                    print(f"\n  ⚠️  Issues found:")
                    for issue in issues:
                        print(f"     {issue}")
                else:
                    print(f"\n  ✅ No formatting issues detected!")

                results.append({
                    'video_filename': video_data['video_filename'],
                    'success': True,
                    'caption': caption,
                    'quality_score': quality_score,
                    'issues': issues
                })
            else:
                print(f"  ❌ Generation failed: {result.get('error', 'Unknown error')}")
                results.append({
                    'video_filename': video_data['video_filename'],
                    'success': False,
                    'error': result.get('error')
                })

        except Exception as e:
            print(f"  ❌ Exception: {e}")
            import traceback
            traceback.print_exc()
            results.append({
                'video_filename': video_data['video_filename'],
                'success': False,
                'error': str(e)
            })

    # Summary
    print("\n" + "="*70)
    print("📊 TEST SUMMARY")
    print("="*70)

    successful = sum(1 for r in results if r.get('success'))
    print(f"\n✅ Successful: {successful}/{len(results)}")
    print(f"❌ Failed: {len(results) - successful}/{len(results)}")

    if successful > 0:
        avg_quality = sum(r.get('quality_score', 0) for r in results if r.get('success')) / successful
        print(f"📈 Average Quality Score: {avg_quality:.1f}/10")

        total_issues = sum(len(r.get('issues', [])) for r in results if r.get('success'))
        print(f"🔍 Total Formatting Issues: {total_issues}")

        # Save results
        timestamp = __import__('datetime').datetime.now().strftime('%Y%m%d_%H%M%S')
        output_file = Path(__file__).parent / f'production_test_results_{timestamp}.json'

        with open(output_file, 'w') as f:
            json.dump(results, f, indent=2)

        print(f"\n💾 Results saved to: {output_file}")

    print("\n✅ Testing complete!")


if __name__ == '__main__':
    main()
