#!/usr/bin/env python3
import instaloader
from pathlib import Path

L = instaloader.Instaloader()

print('Instagram Login Script')
print('=' * 30)
username = input('Username: ')
password = input('Password: ')

try:
    L.login(username, password)
    session_file = Path(__file__).parent / "instagram_session"
    L.save_session_to_file(username, str(session_file))
    print(f'\nSession saved to: {session_file}')
except Exception as e:
    print(f'\nError: {e}')
    if 'challenge' in str(e).lower() or 'checkpoint' in str(e).lower():
        print('\nInstagram is asking for verification.')
        print('Try:')
        print('1. Open Instagram on your phone and approve the login')
        print('2. Then run this script again')
