#!/usr/bin/env python3
"""
Save Gold Standard chunks to disk for later Archon ingestion.

This is a fallback while MCP document methods are being implemented.
"""

import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.ingest.chunker import chunk_gold_standards


def save_chunks_to_disk(chunks: dict, output_dir: str):
    """Save all chunks to disk as JSON files."""
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    # Save index
    index = {
        "total_files": len(chunks),
        "total_chunks": sum(len(c) for c in chunks.values()),
        "files": list(chunks.keys()),
    }

    with open(output_path / "index.json", "w") as f:
        json.dump(index, f, indent=2)

    # Save each file's chunks
    for filename, file_chunks in chunks.items():
        file_data = {
            "source_file": filename,
            "chunk_count": len(file_chunks),
            "chunks": [chunk.to_dict() for chunk in file_chunks],
        }

        safe_filename = filename.replace(".md", "").replace("/", "_")
        with open(output_path / f"{safe_filename}.json", "w") as f:
            json.dump(file_data, f, indent=2)

    # Also save a combined file for easy loading
    all_chunks = []
    for filename, file_chunks in chunks.items():
        for chunk in file_chunks:
            all_chunks.append(chunk.to_dict())

    with open(output_path / "all_chunks.json", "w") as f:
        json.dump(all_chunks, f, indent=2)

    print(f"\n  ✓ Saved {index['total_chunks']} chunks to {output_dir}")
    print(f"    - index.json: Overall index")
    print(f"    - all_chunks.json: All chunks in one file")
    print(f"    - [filename].json: Individual files")


def main():
    """Main workflow."""
    print("=" * 60)
    print("  SAVING GOLD STANDARD CHUNKS TO DISK")
    print("=" * 60)

    # Chunk documents
    print("\nChunking Gold Standard documents...")
    gold_standard_dir = "/Users/michaeldurante/ai dev/ce-hub"
    chunks = chunk_gold_standards(gold_standard_dir)

    total_chunks = sum(len(c) for c in chunks.values())
    print(f"\n✓ Chunked {len(chunks)} files into {total_chunks} chunks")

    # Save to disk
    output_dir = "/Users/michaeldurante/ai dev/ce-hub/edge-dev-ai-agent/data/chunks"
    save_chunks_to_disk(chunks, output_dir)

    print("\n" + "=" * 60)
    print("  COMPLETE")
    print("=" * 60)
    print(f"\nChunks saved to: {output_dir}")
    print("\nThese chunks are ready for:")
    print("  1. Direct ingestion into Archon when MCP methods are ready")
    print("  2. Use by the AI agent for knowledge retrieval")
    print("  3. Reference for system prompt development")

    return 0


if __name__ == "__main__":
    sys.exit(main())
