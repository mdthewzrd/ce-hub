"""
Local Knowledge Retriever

Simple retriever for chunks saved to disk.
Use this for development until MCP RAG is fully configured.
"""

import json
from pathlib import Path
from typing import List, Dict, Any
from collections import defaultdict


class LocalKnowledgeRetriever:
    """Retrieve knowledge chunks from local JSON files."""

    def __init__(self, chunks_dir: str):
        self.chunks_dir = Path(chunks_dir)
        self.chunks = []
        self.index = {}
        self._load_chunks()

    def _load_chunks(self):
        """Load all chunks from disk."""
        index_path = self.chunks_dir / "index.json"
        all_chunks_path = self.chunks_dir / "all_chunks.json"

        if not all_chunks_path.exists():
            raise FileNotFoundError(f"No chunks found at {all_chunks_path}")

        with open(all_chunks_path, "r") as f:
            self.chunks = json.load(f)

        with open(index_path, "r") as f:
            self.index = json.load(f)

        print(f"Loaded {len(self.chunks)} chunks from {self.chunks_dir}")

    def search(self, query: str, match_count: int = 5, chunk_type: str = None) -> List[Dict[str, Any]]:
        """Simple keyword-based search."""
        query_lower = query.lower()
        query_terms = query_lower.split()

        scores = []

        for chunk in self.chunks:
            # Filter by chunk type if specified
            if chunk_type and chunk.get("chunk_type") != chunk_type:
                continue

            # Calculate simple relevance score
            content_lower = chunk["content"].lower()
            tags = " ".join(chunk.get("tags", [])).lower()
            heading = " > ".join(chunk.get("heading_path", [])).lower()

            score = 0

            # Exact phrase match
            if query_lower in content_lower:
                score += 10

            # Individual term matches
            for term in query_terms:
                if term in content_lower:
                    score += 2
                if term in tags:
                    score += 3
                if term in heading:
                    score += 4

            # Tag matches
            for tag in chunk.get("tags", []):
                if tag in query_lower:
                    score += 3

            if score > 0:
                scores.append((score, chunk))

        # Sort by score (descending) and return top matches
        scores.sort(key=lambda x: x[0], reverse=True)
        return [chunk for score, chunk in scores[:match_count]]

    def get_by_tag(self, tag: str) -> List[Dict[str, Any]]:
        """Get all chunks with a specific tag."""
        return [
            chunk for chunk in self.chunks
            if tag in chunk.get("tags", [])
        ]

    def get_by_source(self, source_file: str) -> List[Dict[str, Any]]:
        """Get all chunks from a specific file."""
        return [
            chunk for chunk in self.chunks
            if chunk.get("source_file") == source_file
        ]

    def get_by_type(self, chunk_type: str) -> List[Dict[str, Any]]:
        """Get all chunks of a specific type."""
        return [
            chunk for chunk in self.chunks
            if chunk.get("chunk_type") == chunk_type
        ]

    def get_stats(self) -> Dict[str, Any]:
        """Get statistics about the knowledge base."""
        chunk_types = defaultdict(int)
        tags = defaultdict(int)
        sources = defaultdict(int)

        for chunk in self.chunks:
            chunk_types[chunk.get("chunk_type", "unknown")] += 1
            sources[chunk.get("source_file", "unknown")] += 1
            for tag in chunk.get("tags", []):
                tags[tag] += 1

        return {
            "total_chunks": len(self.chunks),
            "chunk_types": dict(chunk_types),
            "tags": dict(sorted(tags.items(), key=lambda x: x[1], reverse=True)[:20]),
            "sources": dict(sources),
        }

    def format_chunk(self, chunk: Dict[str, Any]) -> str:
        """Format a chunk for display in prompts."""
        heading = " > ".join(chunk.get("heading_path", [])[-2:])
        source = chunk.get("source_file", "Unknown")

        output = f"""From: {source}
Section: {heading}
Tags: {', '.join(chunk.get('tags', []))}

{chunk['content']}
"""
        return output

    def format_search_results(self, results: List[Dict[str, Any]], query: str) -> str:
        """Format search results for use in prompts."""
        output = f"Search Results for: '{query}'\n"
        output += "=" * 60 + "\n\n"

        for i, chunk in enumerate(results, 1):
            output += f"[{i}] {self.format_chunk(chunk)}\n"
            output += "-" * 60 + "\n\n"

        return output


def main():
    """Test the retriever."""
    print("=" * 60)
    print("  LOCAL KNOWLEDGE RETRIEVER TEST")
    print("=" * 60)

    chunks_dir = "/Users/michaeldurante/ai dev/ce-hub/edge-dev-ai-agent/data/chunks"

    retriever = LocalKnowledgeRetriever(chunks_dir)

    # Print stats
    print("\n" + "=" * 60)
    print("  KNOWLEDGE BASE STATISTICS")
    print("=" * 60)

    stats = retriever.get_stats()
    print(f"\nTotal Chunks: {stats['total_chunks']}")
    print(f"\nChunk Types:")
    for ct, count in stats['chunk_types'].items():
        print(f"  - {ct}: {count}")

    print(f"\nTop Tags:")
    for tag, count in list(stats['tags'].items())[:10]:
        print(f"  - {tag}: {count}")

    # Test searches
    print("\n" + "=" * 60)
    print("  TEST SEARCHES")
    print("=" * 60)

    test_queries = [
        "V31 scanner pipeline stages",
        "mean reversion patterns",
        "pyramiding strategy",
        "backtest optimization",
    ]

    for query in test_queries:
        print(f"\nQuery: '{query}'")
        results = retriever.search(query, match_count=3)

        print(f"Found {len(results)} results:")
        for i, r in enumerate(results, 1):
            heading = " > ".join(r.get("heading_path", [])[-2:])
            print(f"  {i}. [{r.get('source_file', 'Unknown')}] {heading}")

    print("\n" + "=" * 60)
    print("  COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    main()
