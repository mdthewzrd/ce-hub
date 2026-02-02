#!/usr/bin/env python3
"""
Format Scanner Files Using Renata Rebuild

This script formats user scanner files using the Renata Rebuild system.
"""

import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from processing_engine.code_generator import CodeGenerator


def format_scanner_file(input_file: str, output_file: str = None):
    """Format a single scanner file"""

    print(f"\n{'='*70}")
    print(f"FORMATTING: {input_file}")
    print(f"{'='*70}")

    # Read input file
    input_path = Path(input_file)
    if not input_path.exists():
        print(f"❌ File not found: {input_file}")
        return False

    code = input_path.read_text()

    # Initialize generator
    templates_dir = Path(__file__).parent / "templates"
    generator = CodeGenerator(str(templates_dir))

    # Transform the code
    print("\n🔄 Transforming...")
    result = generator.generate_from_code(code, input_path.name)

    # Show report
    print("\n" + generator.get_generation_report(result))

    # Determine output file
    if output_file is None:
        output_path = input_path.parent / f"{input_path.stem}_RENATA{input_path.suffix}"
    else:
        output_path = Path(output_file)

    # Write formatted code
    output_path.write_text(result.transformed_code)

    print(f"\n✅ Formatted code saved to: {output_path}")

    return True


def main():
    """Format the three scanner files"""

    print("""
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║              RENATA REBUILD - AUTOMATED FORMATTING                  ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
    """)

    # Files to format
    scanners = [
        "/Users/michaeldurante/.anaconda/working code/backside daily para/backside para b copy.py",
        "/Users/michaeldurante/.anaconda/working code/Daily Para/half A+ scan.py",
        "/Users/michaeldurante/.anaconda/working code/extended gaps/scan2.0.py"
    ]

    results = []

    for scanner_file in scanners:
        try:
            success = format_scanner_file(scanner_file)
            results.append((scanner_file, success))
        except Exception as e:
            print(f"\n❌ Error formatting {scanner_file}: {e}")
            import traceback
            traceback.print_exc()
            results.append((scanner_file, False))

    # Summary
    print(f"\n{'='*70}")
    print("SUMMARY")
    print(f"{'='*70}")

    for file_path, success in results:
        status = "✅ SUCCESS" if success else "❌ FAILED"
        print(f"{status}: {Path(file_path).name}")

    total_success = sum(1 for _, success in results if success)
    print(f"\nTotal: {total_success}/{len(results)} files formatted successfully")

    print(f"\n{'='*70}")
    print("RENATA REBUILD FORMATTING COMPLETE")
    print(f"{'='*70}\n")


if __name__ == "__main__":
    main()
