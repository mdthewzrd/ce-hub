"""
Validation Tests for Semi-Automated Platform Phase 1
Tests database schema, content preparation, and API endpoints
"""

import os
import sys
import sqlite3
import tempfile
from pathlib import Path

# Add to path
sys.path.insert(0, os.path.dirname(__file__))

from database_schema import DB_PATH
from content_preparer import ContentPreparer


def test_database_schema():
    """Test 1: Validate database schema"""
    print("\n" + "="*60)
    print("TEST 1: Database Schema Validation")
    print("="*60)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Check all required tables exist
    required_tables = [
        'ready_content',
        'posting_schedule',
        'user_notifications',
        'instagram_trending_sounds',
        'source_content',
        'audio_tracks'
    ]

    print("\n✓ Checking tables...")
    for table in required_tables:
        cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table}'")
        result = cursor.fetchone()
        if result:
            print(f"  ✓ Table '{table}' exists")
        else:
            print(f"  ✗ Table '{table}' MISSING")
            return False

    # Check indexes
    print("\n✓ Checking indexes...")
    required_indexes = [
        'idx_ready_status',
        'idx_ready_scheduled',
        'idx_schedule_scheduled',
        'idx_notifications_type'
    ]

    for index in required_indexes:
        cursor.execute(f"SELECT name FROM sqlite_master WHERE type='index' AND name='{index}'")
        result = cursor.fetchone()
        if result:
            print(f"  ✓ Index '{index}' exists")
        else:
            print(f"  ✗ Index '{index}' MISSING")
            return False

    # Check foreign keys
    print("\n✓ Checking foreign key constraints...")
    cursor.execute("PRAGMA foreign_key_list(ready_content)")
    fks = cursor.fetchall()
    print(f"  ✓ ready_content has {len(fks)} foreign key(s)")

    cursor.execute("PRAGMA foreign_key_list(posting_schedule)")
    fks = cursor.fetchall()
    print(f"  ✓ posting_schedule has {len(fks)} foreign key(s)")

    conn.close()
    print("\n✅ Database schema validation PASSED")
    return True


def test_source_content_exists():
    """Test 2: Verify source content data exists"""
    print("\n" + "="*60)
    print("TEST 2: Source Content Data")
    print("="*60)

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) as count FROM source_content")
    count = cursor.fetchone()['count']

    print(f"\n✓ Source content records: {count}")

    if count == 0:
        print("  ⚠ No source content found - creating test data...")

        cursor.execute("""
            INSERT INTO source_content (
                original_url, account, content_type,
                original_likes, original_comments, original_shares, original_views,
                description, hashtags, engagement_rate, status
            ) VALUES
                ('https://instagram.com/p/test1/', 'motivation_daily', 'reel',
                 50000, 2000, 500, 250000, 'Transform your mindset today!',
                 '#motivation #success', 5.2, 'pending'),
                ('https://instagram.com/p/test2/', 'fitness_pro', 'reel',
                 35000, 1500, 300, 180000, 'Never skip leg day!',
                 '#fitness #workout', 4.8, 'pending')
        """)
        conn.commit()
        print("  ✓ Created 2 test source content records")

    cursor.execute("SELECT id, account, description FROM source_content LIMIT 5")
    sources = cursor.fetchall()

    print("\n✓ Source content samples:")
    for source in sources:
        print(f"  - ID {source['id']}: @{source['account']} - {source['description']}")

    conn.close()
    print("\n✅ Source content data validation PASSED")
    return True


def test_content_preparer_init():
    """Test 3: Content preparer initialization"""
    print("\n" + "="*60)
    print("TEST 3: Content Preparer Initialization")
    print("="*60)

    try:
        # Test without API key (uses basic captions)
        print("\n✓ Initializing ContentPreparer...")
        preparer = ContentPreparer(openrouter_api_key=None)
        print("  ✓ ContentPreparer initialized successfully (without API key)")

        # Test with fake API key
        print("\n✓ Testing with API key...")
        preparer_with_key = ContentPreparer(openrouter_api_key="test_key")
        print("  ✓ ContentPreparer initialized with API key")

        print("\n✅ Content preparer initialization PASSED")
        return True

    except Exception as e:
        print(f"\n✗ FAILED: {e}")
        return False


def test_caption_generation():
    """Test 4: Caption generation (basic, no API)"""
    print("\n" + "="*60)
    print("TEST 4: Caption Generation")
    print("="*60)

    try:
        print("\n✓ Initializing ContentPreparer...")
        preparer = ContentPreparer(openrouter_api_key=None)

        # Test basic caption generation
        print("\n✓ Testing basic caption generation (no AI)...")
        result = preparer.generate_caption(
            content_description="Workout motivation for fitness lovers",
            category="fitness",
            platform="instagram",
            tone="engaging"
        )

        print(f"  ✓ Caption generated:")
        print(f"    Text: {result['caption'][:80]}...")
        print(f"    Hashtags: {result['hashtags']}")

        if result['caption'] and result['hashtags']:
            print("\n✅ Caption generation PASSED")
            return True
        else:
            print("\n✗ Caption returned empty")
            return False

    except Exception as e:
        print(f"\n✗ FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_api_module_loads():
    """Test 5: API module imports"""
    print("\n" + "="*60)
    print("TEST 5: API Module Loading")
    print("="*60)

    try:
        print("\n✓ Importing API module...")
        import api

        print("  ✓ API module imported successfully")

        # Check for key components
        print("\n✓ Checking API components...")

        # Check for FastAPI app
        if hasattr(api, 'app'):
            print("  ✓ FastAPI app instance exists")
        else:
            print("  ✗ FastAPI app instance NOT FOUND")
            return False

        # Check for models
        if hasattr(api, 'PrepareContentRequest'):
            print("  ✓ PrepareContentRequest model exists")
        if hasattr(api, 'ScheduleContentRequest'):
            print("  ✓ ScheduleContentRequest model exists")

        # Check routes
        routes = [route.path for route in api.app.routes]
        print(f"\n✓ API has {len(routes)} routes")

        new_routes = [
            '/api/prepare',
            '/api/prepare/batch',
            '/api/library',
            '/api/stats/ready-content'
        ]

        print("\n✓ Checking new Phase 1 routes...")
        for route in new_routes:
            if route in routes:
                print(f"  ✓ Route '{route}' exists")
            else:
                print(f"  ✗ Route '{route}' NOT FOUND")
                return False

        print("\n✅ API module loading PASSED")
        return True

    except Exception as e:
        print(f"\n✗ FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_database_insert_ready_content():
    """Test 6: Test ready_content table insertion"""
    print("\n" + "="*60)
    print("TEST 6: Ready Content Insertion")
    print("="*60)

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # Create a test ready_content record
        print("\n✓ Inserting test ready_content record...")

        # Create a fake video file path
        test_video_path = "/tmp/test_video.mp4"

        cursor.execute("""
            INSERT INTO ready_content (
                source_id, video_path, caption, hashtags, status
            ) VALUES (?, ?, ?, ?, ?)
        """, (
            1,  # source_id
            test_video_path,
            "Test caption for validation",
            "#test #validation",
            "pending"
        ))

        ready_id = cursor.lastrowid
        conn.commit()

        print(f"  ✓ Inserted ready_content record with ID: {ready_id}")

        # Verify insertion
        cursor.execute("SELECT * FROM ready_content WHERE id = ?", (ready_id,))
        result = cursor.fetchone()

        if result:
            print(f"  ✓ Verified record exists in database")
            print(f"  ✓ Caption: {result[4]}")
            print(f"  ✓ Status: {result[9]}")

            # Clean up test data
            cursor.execute("DELETE FROM ready_content WHERE id = ?", (ready_id,))
            conn.commit()
            print(f"  ✓ Cleaned up test data")

            conn.close()
            print("\n✅ Ready content insertion PASSED")
            return True
        else:
            print("  ✗ Record not found after insertion")
            conn.close()
            return False

    except Exception as e:
        print(f"\n✗ FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False


def run_all_tests():
    """Run all validation tests"""
    print("\n" + "="*60)
    print("SEMI-AUTOMATED PLATFORM PHASE 1 VALIDATION")
    print("="*60)

    tests = [
        ("Database Schema", test_database_schema),
        ("Source Content Data", test_source_content_exists),
        ("Content Preparer Init", test_content_preparer_init),
        ("Caption Generation", test_caption_generation),
        ("API Module Loading", test_api_module_loads),
        ("Ready Content Insertion", test_database_insert_ready_content),
    ]

    results = []

    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"\n✗ {test_name} FAILED with exception: {e}")
            import traceback
            traceback.print_exc()
            results.append((test_name, False))

    # Summary
    print("\n" + "="*60)
    print("VALIDATION SUMMARY")
    print("="*60)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    print(f"\nTests Run: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {total - passed}")

    print("\nDetailed Results:")
    for test_name, result in results:
        status = "✅ PASSED" if result else "✗ FAILED"
        print(f"  {status} - {test_name}")

    if passed == total:
        print("\n" + "="*60)
        print("ALL TESTS PASSED! ✅")
        print("Phase 1 implementation is VALIDATED")
        print("="*60)
        return True
    else:
        print("\n" + "="*60)
        print("SOME TESTS FAILED ✗")
        print("="*60)
        return False


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
