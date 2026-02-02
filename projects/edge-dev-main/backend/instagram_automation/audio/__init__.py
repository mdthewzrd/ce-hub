"""
Instagram Automation - Audio Module
Handles audio discovery, trending sounds, and audio attachment to posts
"""

from .database import AudioDatabase
from .spotify_client import SpotifyAudioClient
from .manager import AudioManager

__all__ = ['AudioDatabase', 'SpotifyAudioClient', 'AudioManager']
