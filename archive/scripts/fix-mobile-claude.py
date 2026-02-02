#!/usr/bin/env python3
"""
Fix for Mobile Claude Commands
Patches the mobile server to handle Claude commands with proper escaping
"""

import re
import shutil
from pathlib import Path

def patch_mobile_server():
    """Patch the mobile server to handle Claude commands properly"""

    server_file = Path("/Users/michaeldurante/ai dev/ce-hub/mobile-server-pro.py")
    backup_file = Path("/Users/michaeldurante/ai dev/ce-hub/mobile-server-pro.py.backup")

    print("🔧 Patching Mobile Server for Claude Commands")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

    # Create backup
    if not backup_file.exists():
        shutil.copy2(server_file, backup_file)
        print("✅ Created backup:", backup_file)

    # Read current file
    with open(server_file, 'r') as f:
        content = f.read()

    # Pattern to find the execute command handler
    execute_pattern = r'def handle_execute_command\(self\):.*?except Exception as e:'

    # New implementation with Claude command handling
    new_execute_handler = '''def handle_execute_command(self):
        """Execute terminal command with Claude support"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            command = data['command'].strip()

            # Security: whitelist allowed commands
            safe_commands = [
                'ls', 'pwd', 'git', 'npm', 'node', 'python3', 'claude', 'code',
                'clear', 'whoami', 'date', 'cat', 'grep', 'find', 'echo'
            ]

            cmd_parts = command.split()
            if not cmd_parts or cmd_parts[0] not in safe_commands:
                self.send_json_response({
                    'output': f"Command '{cmd_parts[0] if cmd_parts else command}' not allowed for security",
                    'error': True
                })
                return

            # Special handling for Claude commands
            if cmd_parts[0] == 'claude':
                output = self.handle_claude_command(command)
                self.send_json_response({'output': output, 'error': False})
                return

            # Execute regular command in CE-Hub directory
            result = subprocess.run(
                command,
                shell=True,
                cwd="/Users/michaeldurante/ai dev/ce-hub",
                capture_output=True,
                text=True,
                timeout=30
            )

            output = result.stdout
            if result.stderr:
                output += "\\n" + result.stderr

            self.send_json_response({
                'output': output or "Command completed",
                'error': result.returncode != 0
            })

        except subprocess.TimeoutExpired:
            self.send_json_response({
                'output': "Command timed out",
                'error': True
            })
        except Exception as e:'''

    # Add Claude command handler method
    claude_handler = '''
    def handle_claude_command(self, command):
        """Handle Claude commands with proper escaping"""
        try:
            import shlex

            # Parse the command properly
            parts = shlex.split(command)

            if len(parts) < 2:
                return "Usage: claude --print 'your question here'"

            # Check if it's a print command
            if '--print' not in parts:
                # Add --print for mobile compatibility
                parts.insert(1, '--print')

            # Find the question part
            question = None
            for i, part in enumerate(parts):
                if part == '--print' and i + 1 < len(parts):
                    # Join all remaining parts as the question
                    question = ' '.join(parts[i+1:])
                    break

            if not question:
                return "Error: No question provided for Claude"

            # Execute Claude with proper escaping
            claude_cmd = ['claude', '--print', question]
            result = subprocess.run(
                claude_cmd,
                cwd="/Users/michaeldurante/ai dev/ce-hub",
                capture_output=True,
                text=True,
                timeout=60
            )

            if result.returncode == 0:
                return result.stdout
            else:
                return f"Claude Error: {result.stderr or 'Unknown error'}"

        except Exception as e:
            return f"Claude Handler Error: {str(e)}"
'''

    # Replace the method if it exists, otherwise add it
    if 'def handle_claude_command' in content:
        # Replace existing method
        claude_pattern = r'def handle_claude_command\(self.*?\n(?=\s{4}def|\s{0,3}class|\Z)'
        content = re.sub(claude_pattern, claude_handler.strip(), content, flags=re.DOTALL)
    else:
        # Add new method before the last class method or at the end
        # Find a good place to insert (before the last method)
        insert_pos = content.rfind('def ')
        if insert_pos > 0:
            # Find the end of the last method
            lines = content[insert_pos:].split('\n')
            method_end = 0
            for i, line in enumerate(lines):
                if i > 0 and line and not line.startswith(' ') and not line.startswith('\t'):
                    method_end = i
                    break

            if method_end == 0:
                method_end = len(lines)

            insert_pos = insert_pos + len('\n'.join(lines[:method_end]))
            content = content[:insert_pos] + claude_handler + content[insert_pos:]
        else:
            content += claude_handler

    # Replace the execute handler
    if re.search(execute_pattern, content, re.DOTALL):
        content = re.sub(execute_pattern, new_execute_handler.strip() + '\n        except Exception as e:', content, flags=re.DOTALL)
        print("✅ Patched execute command handler")
    else:
        print("⚠️  Could not find execute command handler to patch")

    # Write the patched file
    with open(server_file, 'w') as f:
        f.write(content)

    print("✅ Mobile server patched for Claude commands")
    print(f"📁 Original backed up to: {backup_file}")
    print("")
    print("🔄 Restart the mobile server to apply changes:")
    print("   pkill -f 'mobile-server-pro.py.*8105'")
    print("   python3 mobile-server-pro.py --port 8105")

if __name__ == "__main__":
    patch_mobile_server()