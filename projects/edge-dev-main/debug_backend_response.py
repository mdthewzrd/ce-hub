#!/usr/bin/env python3
"""
Debug script to check what the backend is actually returning
"""

import requests

def debug_backend_response():
    """Debug the backend response structure"""
    try:
        response = requests.get('http://localhost:5659/api/projects', timeout=5)
        print(f"Status code: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")

        # Get raw text first
        print(f"Raw response: {response.text[:500]}...")

        # Try to parse as JSON
        try:
            data = response.json()
            print(f"Parsed data type: {type(data)}")
            print(f"Data keys: {data.keys() if isinstance(data, dict) else 'Not a dict'}")

            if isinstance(data, list):
                print(f"List length: {len(data)}")
                if data:
                    print(f"First item keys: {data[0].keys() if isinstance(data[0], dict) else 'Not a dict'}")
                    print(f"First project: {data[0]}")
            elif isinstance(data, dict):
                print(f"Dict keys: {list(data.keys())}")
                if 'projects' in data:
                    print(f"Projects count: {len(data['projects'])}")
                    if data['projects']:
                        print(f"First project: {data['projects'][0]}")

        except Exception as json_error:
            print(f"JSON parsing error: {json_error}")

    except Exception as e:
        print(f"Request error: {e}")

if __name__ == "__main__":
    debug_backend_response()