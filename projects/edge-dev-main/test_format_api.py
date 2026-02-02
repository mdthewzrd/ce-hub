import requests
import json

# Use a shorter test version (first 100 lines)
with open('backside_b_MESSY_TEST.py', 'r') as f:
    lines = f.readlines()
    code = ''.join(lines[:100])  # Only first 100 lines

print(f"Testing with {len(code)} characters...")

# Call API with faster model and longer timeout
response = requests.post(
    'http://localhost:5665/api/format-scan',
    json={
        "code": code,
        "filename": "test.py",
        "model": "qwen/qwen-2.5-coder-32b-instruct"  # Try faster model
    },
    timeout=180  # 3 minutes
)

print(f"Status: {response.status_code}")
result = response.json()

# Check if it worked
if 'formattedCode' in result:
    print("✅ SUCCESS - AI returned formatted code!")
    print(f"Scanner Type: {result.get('scannerType')}")
    
    with open('backside_b_AI_FORMATTED_OUTPUT.py', 'w') as f:
        f.write(result['formattedCode'])
    
    lines_count = len(result['formattedCode'].split('\n'))
    print(f"Saved to backside_b_AI_FORMATTED_OUTPUT.py ({lines_count} lines)")
else:
    print("Result keys:", list(result.keys()))
    if 'error' in result:
        print(f"Error: {result['error']}")
