"""
Video Content Analyzer
Downloads videos, extracts frames, and uses vision models to analyze actual video content
"""

import os
import cv2
import requests
import tempfile
import base64
from pathlib import Path
from typing import List, Dict, Optional
from dotenv import load_dotenv

load_dotenv()

class VideoFrameExtractor:
    """Extract frames from video files for vision analysis"""

    def __init__(self, frames_to_extract: int = 12):
        self.frames_to_extract = frames_to_extract

    def extract_frames(self, video_path: str) -> List[str]:
        """
        Extract key frames from video file

        Returns list of base64-encoded image strings
        """
        if not os.path.exists(video_path):
            print(f"[VideoAnalyzer] Video file not found: {video_path}")
            return []

        try:
            # Open video file
            cap = cv2.VideoCapture(video_path)

            if not cap.isOpened():
                print(f"[VideoAnalyzer] Could not open video: {video_path}")
                return []

            # Get video properties
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            fps = cap.get(cv2.CAP_PROP_FPS)
            duration = total_frames / fps if fps > 0 else 0

            print(f"[VideoAnalyzer] Video info: {total_frames} frames, {fps:.2f} fps, {duration:.2f} seconds")

            # Calculate frame positions to extract (evenly distributed)
            frame_positions = []
            if total_frames > 0:
                step = total_frames // (self.frames_to_extract + 1)
                for i in range(1, self.frames_to_extract + 1):
                    frame_positions.append(min(i * step, total_frames - 1))

            frames_base64 = []

            # Extract frames at calculated positions
            for frame_num in frame_positions:
                cap.set(cv2.CAP_PROP_POS_FRAMES, frame_num)
                ret, frame = cap.read()

                if ret:
                    # Resize frame to reduce API payload size
                    height, width = frame.shape[:2]
                    if width > 720:
                        scale = 720 / width
                        frame = cv2.resize(frame, (720, int(height * scale)))

                    # Encode to JPEG
                    _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
                    frame_base64 = base64.b64encode(buffer).decode('utf-8')
                    frames_base64.append(frame_base64)
                    print(f"[VideoAnalyzer] Extracted frame {len(frames_base64)}/{self.frames_to_extract}")

            cap.release()
            print(f"[VideoAnalyzer] Successfully extracted {len(frames_base64)} frames")
            return frames_base64

        except Exception as e:
            print(f"[VideoAnalyzer] Error extracting frames: {e}")
            return []

class VisionVideoAnalyzer:
    """Analyze video content using vision models"""

    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("OPENROUTER_API_KEY")
        # Use vision-capable model
        self.vision_model = os.getenv("OPENROUTER_VISION_MODEL", "google/gemini-2.0-flash-exp:free")

    def analyze_video_frames(self, frames_base64: List[str], original_caption: str = "") -> Dict:
        """
        Send video frames to vision model for content analysis

        Returns analysis of actual visual content
        """
        if not frames_base64:
            print("[VisionAnalyzer] No frames to analyze")
            return self._fallback_analysis(original_caption)

        try:
            # Prepare messages with images
            content = [
                {
                    "type": "text",
                    "text": """You are analyzing an Instagram Reel video frame by frame.

IMPORTANT: You are seeing MULTIPLE frames from throughout the video. Analyze the TEMPORAL FLOW and NARRATIVE ARC - how the content progresses from start to finish.

Your task: Describe what is ACTUALLY happening across these video frames in sequence.

Provide a JSON response with these fields:
{
    "visual_description": "Detailed description of the full video narrative - describe how the content flows from beginning to middle to end, any transitions, multiple scenes, or progression",
    "content_type": "One of: tutorial, motivational, story, educational, promotional, entertainment, behind_scenes, interview, review, lifestyle, fitness, travel, food, tech",
    "activity": "What the people are doing - describe the action and any progression or changes throughout the video",
    "setting": "Where this takes place - note if setting changes during the video",
    "people_present": "Number and type of people (e.g., 'one person speaking to camera', 'group of friends')",
    "text_overlays": "Any text visible on screen (captions, titles, etc.)",
    "visual_style": "Production style - professional, casual, vlog, cinematic, etc.",
    "main_subject": "Primary focus of the video in one sentence",
    "engaging_elements": ["Visual element 1", "Visual element 2", "Visual element 3"],
    "narrative_arc": "Describe the story flow - how it begins, what changes or progresses, how it ends",
    "mood": "overall mood conveyed (energetic, calm, intense, playful, etc.)"
}

IMPORTANT: Analyze ALL frames to understand the FULL video narrative. Note any changes, transitions, or progression throughout the video."""
                }
            ]

            # Add frames as images (send up to 10 for comprehensive analysis)
            for i, frame_b64 in enumerate(frames_base64[:10]):
                content.append({
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{frame_b64}"
                    }
                })

            # Add original caption as context if available
            if original_caption:
                content.append({
                    "type": "text",
                    "text": f"\n\nORIGINAL CAPTION FOR CONTEXT:\n{original_caption}\n\nUse this to understand the topic, but focus your analysis on what you can SEE in the video frames."
                })

            messages = [{
                "role": "user",
                "content": content
            }]

            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://harmonatica.app",
                "X-Title": "Harmonatica Vision Analyzer"
            }

            payload = {
                "model": self.vision_model,
                "messages": messages,
                "temperature": 0.3,  # Lower temperature for more consistent analysis
                "max_tokens": 1000
            }

            print(f"[VisionAnalyzer] Sending {len(frames_base64[:3])} frames to {self.vision_model}...")

            response = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=60
            )

            if response.status_code == 200:
                result = response.json()
                content_response = result['choices'][0]['message']['content']

                # Parse JSON from response
                import json
                try:
                    # Extract JSON from markdown code block if present
                    if "```json" in content_response:
                        content_response = content_response.split("```json")[1].split("```")[0].strip()
                    elif "```" in content_response:
                        content_response = content_response.split("```")[1].split("```")[0].strip()

                    analysis = json.loads(content_response)
                    print(f"[VisionAnalyzer] Vision analysis complete: {analysis.get('content_type', 'unknown')}")
                    return analysis
                except json.JSONDecodeError as e:
                    print(f"[VisionAnalyzer] Failed to parse vision response: {e}")
                    print(f"[VisionAnalyzer] Raw response: {content_response}")
                    return self._fallback_analysis(original_caption)
            else:
                print(f"[VisionAnalyzer] API error: {response.status_code} - {response.text}")
                return self._fallback_analysis(original_caption)

        except Exception as e:
            print(f"[VisionAnalyzer] Error: {e}")
            return self._fallback_analysis(original_caption)

    def _fallback_analysis(self, original_caption: str) -> Dict:
        """Fallback when vision analysis fails"""
        return {
            "visual_description": "Video content analysis unavailable",
            "content_type": "general",
            "activity": "Content creation",
            "setting": "Unknown",
            "people_present": "Unknown",
            "text_overlays": "",
            "visual_style": "Unknown",
            "main_subject": "Engaging content",
            "engaging_elements": ["Interesting content", "Engaging presentation"],
            "mood": "neutral"
        }

def analyze_video_with_vision(video_path: str, original_caption: str = "", api_key: str = None) -> Dict:
    """
    Main function to analyze video content using vision models

    Args:
        video_path: Path to video file
        original_caption: Original Instagram caption for context
        api_key: OpenRouter API key

    Returns:
        Dictionary with visual analysis
    """
    extractor = VideoFrameExtractor(frames_to_extract=12)
    analyzer = VisionVideoAnalyzer(api_key)

    # Extract frames
    frames = extractor.extract_frames(video_path)

    if not frames:
        print("[VideoAnalyzer] No frames extracted, using fallback")
        return analyzer._fallback_analysis(original_caption)

    # Analyze with vision model
    analysis = analyzer.analyze_video_frames(frames, original_caption)

    return analysis


if __name__ == "__main__":
    # Test the analyzer
    import sys

    if len(sys.argv) < 2:
        print("Usage: python video_analyzer.py <video_path> [original_caption]")
        sys.exit(1)

    video_path = sys.argv[1]
    caption = sys.argv[2] if len(sys.argv) > 2 else ""

    print(f"Analyzing video: {video_path}")
    analysis = analyze_video_with_vision(video_path, caption)

    print("\n=== VISION ANALYSIS RESULT ===")
    import json
    print(json.dumps(analysis, indent=2))
