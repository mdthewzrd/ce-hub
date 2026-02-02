
import sys
sys.path.insert(0, "/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main")

# Import the AI-formatted scanner
from backside_b_AI_FORMATTED_OUTPUT import BacksideBScanner

# Create scanner instance
scanner = BacksideBScanner(d0_start="2025-01-02", d0_end="2025-01-02")

# Run scan
print("Running AI-formatted scanner...")
results = scanner.run_scan()

# Output results
if results:
    df = pd.DataFrame(results)
    print(f"\nFound {len(results)} signals:")
    for col in df.columns:
        print(f"  {col}")
    print("\nFirst 5 signals:")
    print(df.head().to_string())
else:
    print("No signals found")
