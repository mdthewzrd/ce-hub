#!/usr/bin/env python3
"""
CE-Hub Chat Knowledge System Manager
Archon-First Protocol compliant chat management for CE-Hub ecosystem
"""

import os
import sys
import yaml
import argparse
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import re
import glob

# Add project root to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

class ChatManager:
    """Core chat management functionality with Archon-First Protocol compliance"""

    def __init__(self, config_path: Optional[str] = None):
        self.project_root = Path(__file__).parent.parent
        self.config_path = config_path or self.project_root / "config" / "chat_config.yml"
        self.config = self._load_config()
        self._setup_logging()

        # Initialize directory structure
        self.chats_dir = self.project_root / "chats"
        self.active_dir = self.chats_dir / "active"
        self.summaries_dir = self.chats_dir / "summaries"
        self.archive_dir = self.chats_dir / "archive"

        # Ensure directories exist
        for dir_path in [self.active_dir, self.summaries_dir, self.archive_dir]:
            dir_path.mkdir(parents=True, exist_ok=True)

    def _load_config(self) -> Dict:
        """Load configuration with fallback defaults"""
        try:
            with open(self.config_path, 'r') as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            self._create_default_config()
            with open(self.config_path, 'r') as f:
                return yaml.safe_load(f)

    def _create_default_config(self):
        """Create default configuration if missing"""
        default_config = {
            'default_project': 'ce-hub',
            'projects': {
                'ce-hub': {
                    'description': 'Context Engineering Hub - Master Operating System',
                    'domain': 'context-engineering'
                }
            },
            'chat_format': {
                'timestamp_format': '%Y-%m-%d %H:%M',
                'default_tail': 20
            }
        }

        self.config_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.config_path, 'w') as f:
            yaml.dump(default_config, f, default_flow_style=False)

    def _setup_logging(self):
        """Setup logging configuration"""
        log_config = self.config.get('logging', {})
        log_file = self.project_root / log_config.get('file', 'chats/chat_system.log')
        log_file.parent.mkdir(parents=True, exist_ok=True)

        logging.basicConfig(
            level=getattr(logging, log_config.get('level', 'INFO')),
            format=log_config.get('format', '[%(asctime)s] %(levelname)s: %(message)s'),
            handlers=[
                logging.FileHandler(log_file),
                logging.StreamHandler(sys.stdout)
            ]
        )
        self.logger = logging.getLogger(__name__)

    def _generate_filename(self, topic: str, project: str, file_type: str = "chat") -> str:
        """Generate standardized filename for chat files"""
        # Clean topic for filename
        clean_topic = re.sub(r'[^\w\s-]', '', topic).strip()
        clean_topic = re.sub(r'[-\s]+', '-', clean_topic)

        date_str = datetime.now().strftime("%Y-%m-%d")

        if file_type == "chat":
            return f"{date_str}__{project}__{clean_topic}__v1.md"
        elif file_type == "summary":
            return f"{date_str}__{project}__{clean_topic}__S01.md"
        else:
            return f"{date_str}__{project}__{clean_topic}.md"

    def new_chat(self, topic: str, project: Optional[str] = None, dry_run: bool = False) -> str:
        """Create new chat file with Vision Artifact-aligned metadata"""
        project = project or self.config['default_project']
        filename = self._generate_filename(topic, project)
        filepath = self.active_dir / filename

        # Create YAML frontmatter
        frontmatter = {
            'topic': topic,
            'project': project,
            'created': datetime.now().isoformat(),
            'last_updated': datetime.now().isoformat(),
            'status': 'active',
            'version': 1,
            'tags': self._get_project_tags(project)
        }

        content = f"---\n{yaml.dump(frontmatter, default_flow_style=False)}---\n\n# {topic}\n\n"

        if dry_run:
            self.logger.info(f"DRY RUN - Would create: {filepath}")
            self.logger.info(f"Content preview:\n{content}")
            return str(filepath)

        # Write file
        with open(filepath, 'w') as f:
            f.write(content)

        self.logger.info(f"Created new chat: {filepath}")
        return str(filepath)

    def _get_project_tags(self, project: str) -> List[str]:
        """Get tags for project from configuration"""
        project_config = self.config.get('projects', {}).get(project, {})
        return project_config.get('tags', ['scope:project', 'type:chat'])

    def find_chat(self, topic: str, project: Optional[str] = None) -> Optional[Path]:
        """Find most recent matching chat file"""
        project = project or self.config['default_project']

        # Search pattern
        pattern = f"*__{project}__*{topic.replace(' ', '*')}*__*.md"

        # Search in active directory
        matches = list(self.active_dir.glob(pattern))

        if not matches:
            # Try fuzzy search
            all_files = list(self.active_dir.glob(f"*__{project}__*.md"))
            matches = [f for f in all_files if topic.lower() in f.name.lower()]

        if not matches:
            return None

        # Return most recent
        return sorted(matches, key=lambda x: x.stat().st_mtime)[-1]

    def load_chat(self, topic: str, project: Optional[str] = None, tail: int = None) -> str:
        """Load chat with context from summaries"""
        project = project or self.config['default_project']
        tail = tail or self.config['chat_format']['default_tail']

        # Handle "recent" keyword
        if topic.lower() == "recent":
            pattern = f"*__{project}__*.md"
            all_files = list(self.active_dir.glob(pattern))
            if not all_files:
                return "No recent chats found."
            chat_file = sorted(all_files, key=lambda x: x.stat().st_mtime)[-1]
        else:
            chat_file = self.find_chat(topic, project)
            if not chat_file:
                return f"No chat found matching '{topic}' for project '{project}'"

        # Load chat content
        try:
            with open(chat_file, 'r') as f:
                content = f.read()
        except Exception as e:
            return f"Error loading chat: {e}"

        # Extract entries for tail
        lines = content.split('\n')
        entry_lines = [line for line in lines if line.strip().startswith('- ')]

        if tail and len(entry_lines) > tail:
            entry_lines = entry_lines[-tail:]

        # Look for related summary
        summary_content = self._find_related_summary(chat_file.name, project)

        result = f"📁 Loaded: {chat_file.name}\n\n"

        if summary_content:
            result += f"📋 **Context Summary:**\n{summary_content}\n\n---\n\n"

        result += f"💬 **Last {len(entry_lines)} entries:**\n"
        result += '\n'.join(entry_lines)

        return result

    def _find_related_summary(self, chat_filename: str, project: str) -> Optional[str]:
        """Find related summary for context"""
        # Extract topic from filename
        parts = chat_filename.split('__')
        if len(parts) >= 3:
            topic_part = parts[2]
            pattern = f"*__{project}__{topic_part}*__S*.md"

            matches = list(self.summaries_dir.glob(pattern))
            if matches:
                # Get most recent summary
                recent_summary = sorted(matches, key=lambda x: x.stat().st_mtime)[-1]
                try:
                    with open(recent_summary, 'r') as f:
                        return f.read()
                except Exception:
                    pass

        return None

    def summarize_chat(self, topic: str, project: Optional[str] = None, dry_run: bool = False) -> str:
        """Create structured summary for Archon ingestion"""
        project = project or self.config['default_project']

        # Find chat file
        chat_file = self.find_chat(topic, project)
        if not chat_file:
            return f"No chat found matching '{topic}' for project '{project}'"

        # Read chat content
        try:
            with open(chat_file, 'r') as f:
                content = f.read()
        except Exception as e:
            return f"Error reading chat: {e}"

        # Generate summary filename
        summary_filename = self._generate_filename(topic, project, "summary")
        summary_path = self.summaries_dir / summary_filename

        # Create summary structure
        summary_content = self._create_summary_content(content, topic, project)

        if dry_run:
            self.logger.info(f"DRY RUN - Would create summary: {summary_path}")
            self.logger.info(f"Summary preview:\n{summary_content[:500]}...")
            return str(summary_path)

        # Write summary
        with open(summary_path, 'w') as f:
            f.write(summary_content)

        # Update original chat metadata
        self._update_chat_metadata(chat_file)

        self.logger.info(f"Created summary: {summary_path}")
        return str(summary_path)

    def _create_summary_content(self, chat_content: str, topic: str, project: str) -> str:
        """Create structured summary content for Archon ingestion"""
        # Extract metadata
        frontmatter_match = re.search(r'---\n(.*?)\n---', chat_content, re.DOTALL)
        metadata = {}
        if frontmatter_match:
            try:
                metadata = yaml.safe_load(frontmatter_match.group(1))
            except:
                pass

        # Create summary frontmatter
        summary_frontmatter = {
            'topic': topic,
            'project': project,
            'original_created': metadata.get('created', 'unknown'),
            'summary_created': datetime.now().isoformat(),
            'type': 'summary',
            'scope': 'project',
            'tags': self._get_summary_tags(project),
            'ready_for_ingestion': True
        }

        # Basic content analysis
        entry_count = len([line for line in chat_content.split('\n') if '- ' in line])

        summary_body = f"""# Chat Summary: {topic}

## Overview
- **Project**: {project}
- **Duration**: {metadata.get('created', 'Unknown')} - {datetime.now().strftime('%Y-%m-%d')}
- **Entries**: {entry_count} conversation exchanges
- **Status**: Ready for Archon ingestion

## Key Points
- Conversation topic: {topic}
- Project context: {project}
- Generated for CE-Hub knowledge graph integration

## Decisions/ADRs
*[This section would be populated by actual conversation analysis]*

## Open Questions
*[This section would be populated by actual conversation analysis]*

## Next Steps
- Ingest into Archon knowledge graph via weekly process
- Archive original chat file after successful ingestion
- Update project knowledge base

## Technical Notes
- File format: CE-Hub compliant summary
- Tags: {', '.join(self._get_summary_tags(project))}
- Archon ingestion ready: Yes
"""

        return f"---\n{yaml.dump(summary_frontmatter, default_flow_style=False)}---\n\n{summary_body}"

    def _get_summary_tags(self, project: str) -> List[str]:
        """Generate tags for summary ingestion"""
        base_tags = ['type:summary', 'scope:project', f'project:{project}']

        # Add domain from project config
        project_config = self.config.get('projects', {}).get(project, {})
        domain = project_config.get('domain')
        if domain:
            base_tags.append(f'domain:{domain}')

        return base_tags

    def _update_chat_metadata(self, chat_file: Path):
        """Update chat file metadata after summarization"""
        try:
            with open(chat_file, 'r') as f:
                content = f.read()

            # Update frontmatter
            if content.startswith('---'):
                parts = content.split('---', 2)
                if len(parts) >= 3:
                    try:
                        metadata = yaml.safe_load(parts[1])
                        metadata['last_updated'] = datetime.now().isoformat()
                        metadata['summary_created'] = True

                        updated_content = f"---\n{yaml.dump(metadata, default_flow_style=False)}---{parts[2]}"

                        with open(chat_file, 'w') as f:
                            f.write(updated_content)
                    except Exception as e:
                        self.logger.warning(f"Could not update metadata: {e}")
        except Exception as e:
            self.logger.warning(f"Could not update chat metadata: {e}")

def main():
    """Command line interface for chat management"""
    parser = argparse.ArgumentParser(description="CE-Hub Chat Knowledge System Manager")
    subparsers = parser.add_subparsers(dest='command', help='Available commands')

    # new-chat command
    new_parser = subparsers.add_parser('new-chat', help='Create new chat file')
    new_parser.add_argument('topic', help='Chat topic')
    new_parser.add_argument('--project', help='Project name')
    new_parser.add_argument('--dry-run', action='store_true', help='Show what would be created')

    # load-chat command
    load_parser = subparsers.add_parser('load-chat', help='Load existing chat')
    load_parser.add_argument('topic', help='Chat topic or "recent"')
    load_parser.add_argument('--project', help='Project name')
    load_parser.add_argument('--tail', type=int, help='Number of recent entries to show')

    # summarize-chat command
    sum_parser = subparsers.add_parser('summarize-chat', help='Create chat summary')
    sum_parser.add_argument('topic', help='Chat topic')
    sum_parser.add_argument('--project', help='Project name')
    sum_parser.add_argument('--dry-run', action='store_true', help='Show what would be created')

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    # Initialize chat manager
    manager = ChatManager()

    try:
        if args.command == 'new-chat':
            result = manager.new_chat(args.topic, args.project, args.dry_run)
            print(f"✅ Chat file: {result}")

        elif args.command == 'load-chat':
            result = manager.load_chat(args.topic, args.project, args.tail)
            print(result)

        elif args.command == 'summarize-chat':
            result = manager.summarize_chat(args.topic, args.project, args.dry_run)
            print(f"✅ Summary file: {result}")

    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()