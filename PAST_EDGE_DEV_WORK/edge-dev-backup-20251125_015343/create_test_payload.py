#!/usr/bin/env python3
import json

# Read the scanner file
with open("/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (2).py", "r") as f:
    code_content = f.read()

# Create JSON payload
payload = {
    "code": code_content,
    "filename": "lc d2 scan - oct 25 new ideas (2).py"
}

# Write to JSON file
with open("test_user_scanner.json", "w") as f:
    json.dump(payload, f, indent=2)

print("JSON payload created successfully")