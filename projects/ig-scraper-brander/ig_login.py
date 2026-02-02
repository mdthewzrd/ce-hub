#!/usr/bin/env python3
"""
Create a fresh Instagram session with your burner account.
Run this in your terminal: python3 ig_login.py
"""

import instaloader
from pathlib import Path

L = instaloader.Instaloader()

print('=' * 50)
print('INSTAGRAM LOGIN - BURNER ACCOUNT')
print('=' * 50)
print()
print('Login with your burner Instagram account:')
print('(This account is used anonymously to browse content)')
print()

username = input('Instagram username: ')
password = input('Instagram password: ')

print()
print('Logging in...')

try:
    # Install 2FA handler
    def two_factor_input():
        code = input('Enter 2FA code (from your authenticator app): ')
        return code

    L.two_factor_login = two_factor_input

    # Login
    L.login(username, password)

    # Save the session
    session_file = Path(__file__).parent / "instagram_session"
    L.save_session_to_file(username, str(session_file))

    print()
    print('=' * 50)
    print('SUCCESS! Session saved.')
    print('=' * 50)
    print()
    print(f'Session file: {session_file}')
    print()
    print('You can now:')
    print('1. Go to http://localhost:4412/scrape')
    print('2. Search for any Instagram profile')
    print('3. Browse and download content')
    print()

except Exception as e:
    print()
    print(f'ERROR: {e}')
    print()
    print('Troubleshooting:')
    print('- Double-check your username and password')
    print('- If 2FA is enabled, you may need to disable it')
    print('- Try again in a few minutes if Instagram is blocking logins')
