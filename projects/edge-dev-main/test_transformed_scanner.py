"""
Test the transformed multi-scanner to verify it runs without errors
"""
import sys
sys.path.insert(0, '/Users/michaeldurante/Downloads')

# Import the transformed scanner
from LC_D2_Multi_Scanner_V31_FIXED import LC_D2_Multi_Scanner

def test_instantiation():
    """Test that the scanner can be instantiated without errors"""

    try:
        print("🚀 Testing scanner instantiation...")

        # Instantiate the scanner
        scanner = LC_D2_Multi_Scanner(
            d0_start="2024-01-01",
            d0_end="2024-01-31"
        )

        print("✅ Scanner instantiated successfully!")
        print(f"📊 Scanner has {len(scanner.pattern_assignments)} patterns")

        # Print pattern names
        print("\n🎯 Patterns:")
        for i, pattern in enumerate(scanner.pattern_assignments, 1):
            print(f"  {i}. {pattern['name']}")

        return True

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_instantiation()
    sys.exit(0 if success else 1)
