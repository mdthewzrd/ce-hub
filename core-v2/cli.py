#!/usr/bin/env python3
"""
CE Hub v2 CLI - Command Line Interface for v2 Agent System

Usage:
    python core-v2/cli.py build-agent --config agent.json
    python core-v2/cli.py validate-config --config agent.json
"""

import sys
import os
import json
import argparse
from pathlib import Path
from typing import Dict, Any

def load_json_config(config_path: str) -> Dict[str, Any]:
    """Load JSON configuration from file"""
    with open(config_path, 'r') as f:
        return json.load(f)


def cmd_build_agent(args):
    """Build agent from JSON configuration"""
    # Import here to avoid path issues
    sys.path.insert(0, str(Path(__file__).parent))
    from agent_framework.declarative.builders.agent_builder import AgentBuilder

    builder = AgentBuilder()

    success = builder.build(
        config_path=args.config,
        output_dir=args.output,
        include_tests=args.tests,
        include_docker=args.docker
    )

    if success:
        print(f"\n{'='*60}")
        print(f"✅ Agent Built Successfully!")
        print(f"{'='*60}")
        print(f"\n📁 Location: {args.output}")
        print(f"\n📋 Generated Files:")
        output_path = Path(args.output)
        for file in sorted(output_path.glob("*")):
            if file.is_file():
                size_kb = file.stat().st_size / 1024
                print(f"   - {file.name} ({size_kb:.1f} KB)")

        print(f"\n🚀 Next Steps:")
        print(f"   1. cd {args.output}")
        print(f"   2. Create .env file with required environment variables:")
        print(f"      NEO4J_URI=bolt://localhost:7687")
        print(f"      NEO4J_USERNAME=neo4j")
        print(f"      NEO4J_PASSWORD=password")
        print(f"   3. pip install -r requirements.txt")
        print(f"   4. python {list(output_path.glob('*_agent.py'))[0].name}")

        if args.docker:
            print(f"\n🐳 Docker Option:")
            print(f"   docker-compose up -d")

        return 0
    else:
        print(f"\n{'='*60}")
        print(f"❌ Agent Build Failed!")
        print(f"{'='*60}")
        return 1


def cmd_validate_config(args):
    """Validate agent JSON configuration"""
    try:
        config = load_json_config(args.config)
        agent_config = config.get("agent", {})

        print(f"\n{'='*60}")
        print(f"🔍 Validating Agent Configuration")
        print(f"{'='*60}")
        print(f"Config File: {args.config}")

        # Check required fields
        required_fields = ["name", "description", "max_tools", "system_prompt", "tools"]
        missing_fields = []

        for field in required_fields:
            if field not in agent_config:
                missing_fields.append(field)

        if missing_fields:
            print(f"\n❌ Missing required fields:")
            for field in missing_fields:
                print(f"   - {field}")
            return 1

        print(f"\n✅ All required fields present")

        # Display agent info
        print(f"\n📋 Agent Information:")
        print(f"   Name: {agent_config.get('name', 'Unknown')}")
        print(f"   Description: {agent_config.get('description', 'No description')}")
        print(f"   Type: {agent_config.get('type', 'simple')}")
        print(f"   Model: {agent_config.get('model', 'claude-3-5-sonnet-20241022')}")
        print(f"   Version: {agent_config.get('version', '1.0.0')}")

        # Validate tool count
        tools = agent_config.get("tools", [])
        max_tools = agent_config.get("max_tools", 10)

        print(f"\n📊 Tool Configuration:")
        print(f"   Tool Count: {len(tools)}")
        print(f"   Maximum Allowed: {max_tools}")

        if len(tools) > max_tools:
            print(f"   ⚠️  WARNING: Tool count exceeds maximum!")
            print(f"   This may degrade LLM performance.")
            print(f"   💡 Consider consolidating tools or splitting into sub-agents.")
        else:
            print(f"   ✅ Tool count within limits")

        # Validate tools
        print(f"\n🔧 Tools:")
        for i, tool in enumerate(tools, 1):
            tool_name = tool.get("name", "unnamed")
            tool_desc = tool.get("description", "No description")
            tool_type = tool.get("type", "unknown")

            params = tool.get("parameters", {})
            required_params = [k for k, v in params.items() if v.get("required", False)]

            print(f"   {i}. {tool_name} ({tool_type})")
            print(f"      {tool_desc}")
            if required_params:
                print(f"      Required params: {', '.join(required_params)}")

        # Validate system prompt
        sys_prompt = agent_config.get("system_prompt", {})
        print(f"\n💬 System Prompt:")
        print(f"   Role: {sys_prompt.get('role', 'Not defined')[:80]}...")
        if "responsibilities" in sys_prompt:
            print(f"   Responsibilities: {len(sys_prompt['responsibilities'])} items")
        if "guidelines" in sys_prompt:
            print(f"   Guidelines: {len(sys_prompt['guidelines'])} items")
        if "constraints" in sys_prompt:
            print(f"   Constraints: {len(sys_prompt['constraints'])} items")

        # Validate RAG config
        rag_config = agent_config.get("rag", {})
        rag_enabled = rag_config.get("enabled", False)

        print(f"\n🧠 RAG Configuration:")
        print(f"   Enabled: {rag_enabled}")

        if rag_enabled:
            vector_db = rag_config.get("vector_db", "neo4j")
            top_k = rag_config.get("top_k", 5)
            chunk_size = rag_config.get("chunk_size", 512)
            print(f"   Vector DB: {vector_db}")
            print(f"   Top K: {top_k}")
            print(f"   Chunk Size: {chunk_size}")
        else:
            print(f"   ⚠️  RAG is disabled. Consider enabling for knowledge retention.")

        # Validate integration
        integration = agent_config.get("integration", {})
        if integration:
            apis = integration.get("apis", [])
            databases = integration.get("databases", [])

            print(f"\n🔗 Integration:")
            if apis:
                print(f"   External APIs: {len(apis)}")
                for api in apis:
                    print(f"      - {api.get('name', 'Unknown')}: {api.get('purpose', 'No purpose')}")
            if databases:
                print(f"   Databases: {len(databases)}")
                for db in databases:
                    print(f"      - {db.get('name', 'Unknown')} ({db.get('type', 'unknown')})")

        # Validate validation rules
        validation = agent_config.get("validation", {})
        if validation:
            rules = validation.get("rules", [])
            quality_threshold = validation.get("quality_threshold", 0.7)

            print(f"\n✓ Validation:")
            print(f"   Level: {validation.get('level', 'moderate')}")
            print(f"   Quality Threshold: {quality_threshold}")
            if rules:
                print(f"   Rules: {len(rules)} custom rules")

        print(f"\n{'='*60}")
        print(f"✅ Configuration Valid!")
        print(f"{'='*60}")

        return 0

    except FileNotFoundError:
        print(f"\n❌ Error: File not found: {args.config}")
        return 1
    except json.JSONDecodeError as e:
        print(f"\n❌ Error: Invalid JSON")
        print(f"   {e}")
        return 1
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1


def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(
        description="CE Hub v2 CLI - Declarative Agent Building System",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Build agent from JSON
  python core-v2/cli.py build-agent --config my_agent.json

  # Build with custom output directory
  python core-v2/cli.py build-agent --config my_agent.json -o ./my_agent

  # Build with Docker files
  python core-v2/cli.py build-agent --config my_agent.json --docker

  # Validate configuration without building
  python core-v2/cli.py validate-config --config my_agent.json
        """
    )

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Build agent command
    build_parser = subparsers.add_parser(
        "build-agent",
        help="Build agent from JSON configuration"
    )
    build_parser.add_argument(
        "config",
        help="Path to agent JSON configuration file"
    )
    build_parser.add_argument(
        "-o", "--output",
        default="./output_agent",
        help="Output directory (default: ./output_agent)"
    )
    build_parser.add_argument(
        "--no-tests",
        action="store_false",
        dest="tests",
        help="Don't generate test files"
    )
    build_parser.add_argument(
        "--docker",
        action="store_true",
        help="Generate Docker files"
    )
    build_parser.set_defaults(func=cmd_build_agent)

    # Validate config command
    validate_parser = subparsers.add_parser(
        "validate-config",
        help="Validate agent JSON configuration"
    )
    validate_parser.add_argument(
        "config",
        help="Path to agent JSON configuration file"
    )
    validate_parser.set_defaults(func=cmd_validate_config)

    # Parse arguments
    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return 1

    # Execute command
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
