#!/usr/bin/env python3
"""
Main Ingestion Script for EdgeDev Gold Standards

This script loads all Gold Standard documents into Archon knowledge base
for retrieval by the AI agent.

Usage:
    python -m src.ingest.ingest_gold_standards
"""

import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.ingest.chunker import chunk_gold_standards, DocumentChunk
from src.ingest.archon_client import ArchonClient


# Configuration
GOLD_STANDARD_DIR = "/Users/michaeldurante/ai dev/ce-hub"
ARCHON_PROJECT_NAME = "EdgeDev AI Agent"
ARCHON_PROJECT_DESC = "AI agent for trading strategy development with EdgeDev platform"


def print_section(title: str):
    """Print a formatted section header."""
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)


def create_archon_project(client: ArchonClient) -> str:
    """Create or get the EdgeDev AI Agent project in Archon."""
    print_section("STEP 1: Creating Archon Project")

    # Check if project already exists
    result = client.list_projects(query=ARCHON_PROJECT_NAME)

    if "result" in result and result["result"]:
        projects = result["result"].get("projects", [])
        for project in projects:
            if project.get("title") == ARCHON_PROJECT_NAME:
                project_id = project.get("project_id")
                print(f"  ✓ Found existing project: {project_id}")
                print(f"    Title: {project.get('title')}")
                return project_id

    # Create new project
    print(f"  Creating new project: {ARCHON_PROJECT_NAME}")
    result = client.create_project(
        title=ARCHON_PROJECT_NAME,
        description=ARCHON_PROJECT_DESC
    )

    if "error" in result:
        print(f"  ✗ Error creating project: {result['error']}")
        print(f"    Note: Project may already exist or MCP method not available")
        print(f"    Using default project ID for now")
        return "edge-dev-ai-agent"

    if "result" in result:
        project_id = result["result"].get("project_id", "edge-dev-ai-agent")
        print(f"  ✓ Created project: {project_id}")
        return project_id

    print(f"  ⚠️  Unexpected response, using default ID")
    return "edge-dev-ai-agent"


def ingest_chunks(
    client: ArchonClient,
    project_id: str,
    chunks: dict[str, list[DocumentChunk]]
) -> dict[str, int]:
    """Ingest all chunks into Archon."""
    print_section("STEP 3: Ingesting Chunks into Archon")

    stats = {}
    total_chunks = sum(len(c) for c in chunks.values())

    print(f"  Total chunks to ingest: {total_chunks}")

    for filename, file_chunks in chunks.items():
        print(f"\n  Processing {filename}...")
        stats[filename] = {"success": 0, "failed": 0}

        for i, chunk in enumerate(file_chunks):
            # Prepare document content
            doc_content = chunk.content

            # Add metadata header
            metadata_header = f"""---
chunk_id: {chunk.chunk_id}
source_file: {chunk.source_file}
chunk_type: {chunk.chunk_type}
heading_path: {' > '.join(chunk.heading_path)}
tags: {', '.join(chunk.tags)}
---

"""

            full_content = metadata_header + doc_content

            # Try to create document
            result = client.create_document(
                project_id=project_id,
                title=chunk.chunk_id,
                content=full_content,
                document_type="gold_standard"
            )

            if "error" not in result:
                stats[filename]["success"] += 1
                if (i + 1) % 5 == 0:
                    print(f"    Progress: {i + 1}/{len(file_chunks)} chunks")
            else:
                stats[filename]["failed"] += 1
                print(f"    ✗ Failed to ingest chunk {chunk.chunk_id}")
                error_msg = result['error']
                if isinstance(error_msg, dict):
                    error_msg = str(error_msg)
                elif not isinstance(error_msg, str):
                    error_msg = repr(error_msg)
                print(f"      Error: {error_msg[:100]}")

        # Print file summary
        print(f"  ✓ {filename}: {stats[filename]['success']} succeeded, {stats[filename]['failed']} failed")

    return stats


def test_retrieval(client: ArchonClient, project_id: str):
    """Test knowledge retrieval with sample queries."""
    print_section("STEP 4: Testing Knowledge Retrieval")

    test_queries = [
        "V31 scanner architecture pipeline stages",
        "mean reversion pattern types",
        "pyramiding and position sizing strategies",
        "backtest optimization parameters",
        "execution system components",
    ]

    print(f"  Running {len(test_queries)} test queries...")

    for query in test_queries:
        print(f"\n  Query: '{query}'")

        result = client.search_knowledge(
            project_id=project_id,
            query=query,
            match_count=3
        )

        if "error" in result:
            error_msg = result['error']
            if isinstance(error_msg, dict):
                error_msg = str(error_msg)
            elif not isinstance(error_msg, str):
                error_msg = repr(error_msg)
            print(f"    ⚠️  Error: {error_msg[:100]}")
            print(f"    Note: RAG search may not be fully configured yet")
        elif "result" in result:
            matches = result["result"].get("matches", [])
            print(f"    ✓ Found {len(matches)} matches")
            for match in matches[:2]:
                content_preview = match.get("content", "")[:100].replace("\n", " ")
                print(f"      - {content_preview}...")
        else:
            print(f"    ⚠️  Unexpected response format")


def main():
    """Main ingestion workflow."""
    print_section("EDGEDEV GOLD STANDARDS INGESTION")
    print(f"\n  Gold Standard Directory: {GOLD_STANDARD_DIR}")
    print(f"  Archon Project: {ARCHON_PROJECT_NAME}")

    # Initialize Archon client
    print_section("Initializing Archon Client")
    client = ArchonClient()

    # Health check
    print("  Checking Archon server status...")
    health = client.health_check()
    if "error" not in health:
        print(f"  ✓ Archon server is running")
        if isinstance(health, dict):
            if "service" in health:
                print(f"    Service: {health['service']}")
            if "version" in health:
                print(f"    Version: {health['version']}")
    else:
        print(f"  ⚠️  Health check returned: {health.get('error', 'unknown')}")
        print(f"    Continuing anyway...")

    # Create/get project
    project_id = create_archon_project(client)

    # Chunk documents
    print_section("STEP 2: Chunking Gold Standard Documents")
    chunks = chunk_gold_standards(GOLD_STANDARD_DIR)

    total_chunks = sum(len(c) for c in chunks.values())
    print(f"\n  ✓ Chunked {len(chunks)} files into {total_chunks} chunks")

    for filename, file_chunks in chunks.items():
        print(f"    - {filename}: {len(file_chunks)} chunks")

    # Ingest chunks
    stats = ingest_chunks(client, project_id, chunks)

    # Print final summary
    print_section("INGESTION COMPLETE")

    total_success = sum(s["success"] for s in stats.values())
    total_failed = sum(s["failed"] for s in stats.values())

    print(f"\n  Summary:")
    print(f"    Files processed: {len(chunks)}")
    print(f"    Total chunks: {total_chunks}")
    print(f"    Successfully ingested: {total_success}")
    print(f"    Failed: {total_failed}")

    if total_success == total_chunks:
        print(f"\n  ✓ All chunks successfully ingested!")
    elif total_success > 0:
        print(f"\n  ⚠️  Partial success: {total_success}/{total_chunks} chunks ingested")
        print(f"     This is OK - MCP document methods may need adjustment")
    else:
        print(f"\n  ⚠️  No chunks were ingested")
        print(f"     Note: Documents have been chunked and are ready")
        print(f"           MCP integration may need further configuration")

    # Test retrieval
    test_retrieval(client, project_id)

    print_section("DONE")
    print(f"\n  Next steps:")
    print(f"    1. Verify knowledge in Archon UI (http://localhost:8051)")
    print(f"    2. Proceed to Phase 2: System Prompts")
    print(f"    3. Test queries with the AI agent")

    return 0


if __name__ == "__main__":
    sys.exit(main())
