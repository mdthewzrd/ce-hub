"""
Knowledge Base Chunker

Breaks down markdown documents into logical chunks for Archon RAG storage.
"""

import re
from pathlib import Path
from typing import List, Dict, Any
from dataclasses import dataclass, field


@dataclass
class DocumentChunk:
    """A chunk of a document with metadata."""
    content: str
    chunk_id: str
    source_file: str
    chunk_type: str  # 'section', 'subsection', 'code', 'example'
    heading_path: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    tags: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for Archon storage."""
        return {
            "content": self.content,
            "chunk_id": self.chunk_id,
            "source_file": self.source_file,
            "chunk_type": self.chunk_type,
            "heading_path": self.heading_path,
            "metadata": self.metadata,
            "tags": self.tags,
        }


class MarkdownChunker:
    """Chunks markdown files into logical sections for RAG."""

    def __init__(self, max_chunk_size: int = 2000, overlap: int = 200):
        self.max_chunk_size = max_chunk_size
        self.overlap = overlap

    def chunk_file(self, file_path: str) -> List[DocumentChunk]:
        """Chunk a single markdown file."""
        path = Path(file_path)
        content = path.read_text()

        # Parse markdown structure
        sections = self._parse_markdown_sections(content)

        # Create chunks
        chunks = []
        for section in sections:
            chunks.extend(self._chunk_section(section, path.name))

        return chunks

    def _parse_markdown_sections(self, content: str) -> List[Dict[str, Any]]:
        """Parse markdown into hierarchical sections."""
        lines = content.split('\n')
        sections = []
        current_section = {
            "level": 0,
            "heading": "Root",
            "content": [],
            "heading_path": [],
        }

        for line in lines:
            # Check for heading
            heading_match = re.match(r'^(#{1,6})\s+(.+)$', line)
            if heading_match:
                # Save previous section
                if current_section["content"]:
                    sections.append(current_section.copy())

                # Start new section
                level = len(heading_match.group(1))
                heading = heading_match.group(2).strip()

                # Update heading path
                heading_path = current_section["heading_path"][:level-1]
                heading_path.append(heading)

                current_section = {
                    "level": level,
                    "heading": heading,
                    "content": [line],
                    "heading_path": heading_path,
                }
            else:
                current_section["content"].append(line)

        # Save last section
        if current_section["content"]:
            sections.append(current_section)

        return sections

    def _chunk_section(self, section: Dict[str, Any], source_file: str) -> List[DocumentChunk]:
        """Chunk a section if it's too large."""
        content = '\n'.join(section["content"])

        # If content fits in one chunk, return it
        if len(content) <= self.max_chunk_size:
            chunk_id = f"{source_file}::{'::'.join(section['heading_path'])}"
            return [
                DocumentChunk(
                    content=content,
                    chunk_id=chunk_id,
                    source_file=source_file,
                    chunk_type=self._determine_chunk_type(content),
                    heading_path=section["heading_path"],
                    metadata=self._extract_metadata(section),
                    tags=self._extract_tags(section),
                )
            ]

        # Split large content into smaller chunks
        chunks = []
        paragraphs = self._split_into_paragraphs(content)
        current_chunk = ""
        chunk_index = 0

        for para in paragraphs:
            if len(current_chunk) + len(para) <= self.max_chunk_size:
                current_chunk += para + "\n\n"
            else:
                # Save current chunk
                if current_chunk:
                    chunk_id = f"{source_file}::{'::'.join(section['heading_path'])}::chunk{chunk_index}"
                    chunks.append(
                        DocumentChunk(
                            content=current_chunk.strip(),
                            chunk_id=chunk_id,
                            source_file=source_file,
                            chunk_type=self._determine_chunk_type(current_chunk),
                            heading_path=section["heading_path"],
                            metadata=self._extract_metadata(section),
                            tags=self._extract_tags(section),
                        )
                    )
                    chunk_index += 1

                # Start new chunk with overlap
                current_chunk = self._add_overlap(current_chunk) + para + "\n\n"

        # Save final chunk
        if current_chunk:
            chunk_id = f"{source_file}::{'::'.join(section['heading_path'])}::chunk{chunk_index}"
            chunks.append(
                DocumentChunk(
                    content=current_chunk.strip(),
                    chunk_id=chunk_id,
                    source_file=source_file,
                    chunk_type=self._determine_chunk_type(current_chunk),
                    heading_path=section["heading_path"],
                    metadata=self._extract_metadata(section),
                    tags=self._extract_tags(section),
                )
            )

        return chunks

    def _split_into_paragraphs(self, content: str) -> List[str]:
        """Split content into paragraphs."""
        # Split by double newlines, but preserve code blocks
        paragraphs = []
        current_para = []
        in_code_block = False

        for line in content.split('\n'):
            if line.strip().startswith('```'):
                in_code_block = not in_code_block
                current_para.append(line)
            elif in_code_block:
                current_para.append(line)
            elif line.strip() == '':
                if current_para:
                    paragraphs.append('\n'.join(current_para))
                    current_para = []
            else:
                current_para.append(line)

        if current_para:
            paragraphs.append('\n'.join(current_para))

        return paragraphs

    def _add_overlap(self, previous_content: str) -> str:
        """Add overlap from previous chunk for context."""
        if not self.overlap:
            return ""

        # Get last N characters
        if len(previous_content) <= self.overlap:
            return previous_content

        return previous_content[-self.overlap:] + "\n\n[...previous chunk overlap...]\n\n"

    def _determine_chunk_type(self, content: str) -> str:
        """Determine the type of chunk based on content."""
        if '```' in content:
            return 'code'
        if any(word in content.lower() for word in ['example', 'sample', 'demo']):
            return 'example'
        return 'section'

    def _extract_metadata(self, section: Dict[str, Any]) -> Dict[str, Any]:
        """Extract metadata from section."""
        return {
            "level": section["level"],
            "heading": section["heading"],
        }

    def _extract_tags(self, section: Dict[str, Any]) -> List[str]:
        """Extract tags from section heading and content."""
        tags = []
        heading = section["heading"].lower()
        content = '\n'.join(section["content"]).lower()

        # Extract domain-specific tags
        tag_keywords = {
            'scanner': ['scanner', 'scan', 'screening'],
            'backtest': ['backtest', 'backtesting', 'testing'],
            'strategy': ['strategy', 'trading', 'execution'],
            'indicator': ['indicator', 'signal', 'metric'],
            'pattern': ['pattern', 'setup'],
            'v31': ['v31', 'stage', 'pipeline'],
            'archon': ['archon', 'mcp', 'knowledge'],
            'code': ['code', 'python', 'function'],
            'optimization': ['optimization', 'optimize', 'tune'],
            'risk': ['risk', 'stop', 'loss'],
            'position': ['position', 'size', 'sizing'],
            'pyramiding': ['pyramid', 'adding', 'scale'],
            'execution': ['execution', 'order', 'fill'],
        }

        for tag, keywords in tag_keywords.items():
            if any(kw in heading or kw in content for kw in keywords):
                tags.append(tag)

        return tags


def chunk_gold_standards(gold_standard_dir: str) -> Dict[str, List[DocumentChunk]]:
    """Chunk all Gold Standard documents."""
    chunker = MarkdownChunker()

    gold_standard_files = [
        "EDGEDEV_PRESUMED_GOLD_STANDARD_SPECIFICATION.md",
        "EDGEDEV_PATTERN_TYPE_CATALOG.md",
        "EDGEDEV_CODE_STRUCTURE_GUIDE.md",
        "EDGEDEV_BACKTEST_OPTIMIZATION_GOLD_STANDARD.md",
        "EDGEDEV_INDICATORS_EXECUTION_GOLD_STANDARD.md",
        "EDGEDEV_EXECUTION_SYSTEM_GOLD_STANDARD.md",
    ]

    all_chunks = {}

    for filename in gold_standard_files:
        file_path = Path(gold_standard_dir) / filename
        if file_path.exists():
            print(f"  Chunking {filename}...")
            chunks = chunker.chunk_file(str(file_path))
            all_chunks[filename] = chunks
            print(f"    Created {len(chunks)} chunks")
        else:
            print(f"  Warning: {filename} not found")

    return all_chunks
