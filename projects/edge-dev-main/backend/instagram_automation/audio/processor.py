"""
Audio Processor for Instagram
Mixes audio with video BEFORE uploading to Instagram
This bypasses Instagrapi's limitations by preparing the video with audio already embedded
"""

import os
import subprocess
import tempfile
from typing import Optional, Dict
from pathlib import Path


class AudioProcessor:
    """
    Process and prepare audio for Instagram posting

    Solution: Pre-mix audio with video using FFmpeg BEFORE uploading
    - Instagram will recognize the audio as a "sound"
    - Others can use the sound in their Reels
    - Works around Instagrapi limitations
    """

    def __init__(self, ffmpeg_path: str = "ffmpeg"):
        """
        Initialize audio processor

        Args:
            ffmpeg_path: Path to FFmpeg binary (default: system PATH)
        """
        self.ffmpeg_path = ffmpeg_path
        self.temp_dir = tempfile.mkdtemp()

        # Verify FFmpeg is available
        try:
            subprocess.run([ffmpeg_path, "-version"], capture_output=True, check=True)
        except (subprocess.CalledProcessError, FileNotFoundError):
            raise Exception(
                "FFmpeg not found. Install with:\n"
                "  brew install ffmpeg  # macOS\n"
                "  apt-get install ffmpeg  # Ubuntu/Debian\n"
                "  choco install ffmpeg  # Windows"
            )

    def download_audio_from_url(self, url: str) -> Optional[str]:
        """
        Download audio from URL (Spotify preview, etc.)

        Args:
            url: Audio file URL

        Returns:
            Path to downloaded file, or None if failed
        """
        import requests

        try:
            response = requests.get(url, stream=True, timeout=30)
            response.raise_for_status()

            # Determine file extension
            ext = ".mp3"
            content_type = response.headers.get("content-type", "")
            if "mpeg" in content_type:
                ext = ".mp3"
            elif "wav" in content_type:
                ext = ".wav"

            # Save to temp file
            local_path = os.path.join(self.temp_dir, f"audio_{os.urandom(8).hex()}{ext}")

            with open(local_path, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)

            return local_path

        except Exception as e:
            print(f"Error downloading audio: {e}")
            return None

    def mix_audio_with_video(
        self,
        video_path: str,
        audio_path: str,
        output_path: Optional[str] = None,
        audio_start: float = 0,
        audio_duration: Optional[float] = None,
        volume: float = 1.0,
        fade_in: float = 0,
        fade_out: float = 0
    ) -> Optional[str]:
        """
        Mix audio with video using FFmpeg

        This creates a NEW video file with the audio embedded.
        Instagram will recognize this as having a "sound" attached.

        Args:
            video_path: Path to source video
            audio_path: Path to audio file (MP3, WAV, etc.)
            output_path: Where to save (default: temp directory)
            audio_start: Start position in audio (seconds)
            audio_duration: Duration of audio to use (None = full audio)
            volume: Audio volume (0.0 to 1.0)
            fade_in: Fade in duration (seconds)
            fade_out: Fade out duration (seconds)

        Returns:
            Path to output video with mixed audio
        """
        if output_path is None:
            output_path = os.path.join(self.temp_dir, f"mixed_{os.urandom(8).hex()}.mp4")

        # Build FFmpeg command
        cmd = [
            self.ffmpeg_path,
            "-i", video_path,  # Input video
            "-i", audio_path,  # Input audio
            "-map", "0:v",  # Use video from first input
            "-map", "1:a",  # Use audio from second input
            "-c:v", "copy",  # Copy video stream (no re-encoding)
            "-c:a", "aac",  # Encode audio as AAC (Instagram requirement)
            "-b:a", "192k",  # Audio bitrate
            "-shortest",  # Finish at shortest input
        ]

        # Audio filters
        audio_filters = []

        # Volume adjustment
        if volume != 1.0:
            audio_filters.append(f"volume={volume}")

        # Fade in/out
        if fade_in > 0:
            audio_filters.append(f"afade=t=in:ss=0:d={fade_in}")

        if fade_out > 0:
            # Get video duration for fade out
            probe_cmd = [
                self.ffmpeg_path,
                "-i", video_path,
                "-f", "null",
                "-"
            ]
            # For now, we'll use a simpler approach
            audio_filters.append(f"afade=t=out:st=-{fade_out}:d={fade_out}")

        # Trim audio if needed
        if audio_start > 0 or audio_duration:
            trim_filter = f"atrim={audio_start}"
            if audio_duration:
                trim_filter += f",{audio_start + audio_duration}"
            audio_filters.append(trim_filter)

        # Apply filters
        if audio_filters:
            cmd.extend(["-af", ",".join(audio_filters)])

        cmd.append(output_path)

        # Execute FFmpeg
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=True
            )

            if os.path.exists(output_path):
                print(f"✅ Audio mixed successfully: {output_path}")
                return output_path
            else:
                print("❌ Output file not created")
                return None

        except subprocess.CalledProcessError as e:
            print(f"❌ FFmpeg error: {e.stderr}")
            return None

    def add_audio_from_spotify_preview(
        self,
        video_path: str,
        spotify_preview_url: str,
        output_path: Optional[str] = None,
        volume: float = 1.0
    ) -> Optional[str]:
        """
        Add Spotify preview audio to video

        Spotify previews are 30 seconds - perfect for Reels!

        Args:
            video_path: Path to video file
            spotify_preview_url: Spotify preview URL
            output_path: Where to save
            volume: Audio volume (0-1)

        Returns:
            Path to video with audio
        """
        # Download preview
        audio_path = self.download_audio_from_url(spotify_preview_url)
        if not audio_path:
            return None

        # Mix with video
        result = self.mix_audio_with_video(
            video_path=video_path,
            audio_path=audio_path,
            output_path=output_path,
            volume=volume
        )

        # Cleanup temp audio
        try:
            os.remove(audio_path)
        except:
            pass

        return result

    def add_audio_from_local_file(
        self,
        video_path: str,
        local_audio_path: str,
        output_path: Optional[str] = None,
        volume: float = 1.0
    ) -> Optional[str]:
        """
        Add local audio file to video

        Args:
            video_path: Path to video file
            local_audio_path: Path to local audio file (MP3, WAV, etc.)
            output_path: Where to save
            volume: Audio volume (0-1)

        Returns:
            Path to video with audio
        """
        return self.mix_audio_with_video(
            video_path=video_path,
            audio_path=local_audio_path,
            output_path=output_path,
            volume=volume
        )

    def trim_video_to_reel_duration(
        self,
        video_path: str,
        max_duration: float = 90,
        output_path: Optional[str] = None
    ) -> Optional[str]:
        """
        Trim video to Instagram Reel max duration (90 seconds)

        Args:
            video_path: Input video path
            max_duration: Maximum duration in seconds
            output_path: Output path

        Returns:
            Path to trimmed video
        """
        if output_path is None:
            output_path = os.path.join(self.temp_dir, f"trimmed_{os.urandom(8).hex()}.mp4")

        cmd = [
            self.ffmpeg_path,
            "-i", video_path,
            "-t", str(max_duration),
            "-c", "copy",
            output_path
        ]

        try:
            subprocess.run(cmd, capture_output=True, check=True)
            return output_path
        except subprocess.CalledProcessError as e:
            print(f"Error trimming video: {e}")
            return None

    def optimize_for_instagram(
        self,
        video_path: str,
        output_path: Optional[str] = None
    ) -> Optional[str]:
        """
        Optimize video for Instagram Reels

        - Trim to 90 seconds max
        - Ensure correct codec
        - Optimize for file size

        Args:
            video_path: Input video
            output_path: Output path

        Returns:
            Optimized video path
        """
        if output_path is None:
            output_path = os.path.join(self.temp_dir, f"optimized_{os.urandom(8).hex()}.mp4")

        cmd = [
            self.ffmpeg_path,
            "-i", video_path,
            "-t", "90",  # Max 90 seconds
            "-vf", "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2",  # 9:16 aspect ratio
            "-c:v", "libx264",
            "-preset", "medium",
            "-crf", "23",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            "-b:a", "128k",
            "-movflags", "+faststart",
            output_path
        ]

        try:
            subprocess.run(cmd, capture_output=True, check=True)
            return output_path
        except subprocess.CalledProcessError as e:
            print(f"Error optimizing video: {e}")
            return None

    def cleanup(self):
        """Remove temporary files"""
        import shutil
        try:
            shutil.rmtree(self.temp_dir)
        except:
            pass


# Convenience functions
def create_reel_with_sound(
    video_path: str,
    audio_source: str,
    output_path: Optional[str] = None
) -> Optional[str]:
    """
    Quick function to create a Reel with sound

    Args:
        video_path: Your video file
        audio_source: URL or local path to audio
        output_path: Where to save

    Returns:
        Path to ready-to-post Reel with sound
    """
    processor = AudioProcessor()

    # Check if audio is URL or local file
    if audio_source.startswith("http"):
        result = processor.add_audio_from_spotify_preview(
            video_path=video_path,
            spotify_preview_url=audio_source,
            output_path=output_path
        )
    else:
        result = processor.add_audio_from_local_file(
            video_path=video_path,
            local_audio_path=audio_source,
            output_path=output_path
        )

    processor.cleanup()
    return result


if __name__ == "__main__":
    print("Audio Processor for Instagram")
    print("=" * 50)
    print("\nThis tool adds audio to videos BEFORE uploading to Instagram.")
    print("Instagram will recognize the audio as a 'sound' that others can use.")
    print("\nUsage:")
    print("  from audio.processor import create_reel_with_sound")
    print("  result = create_reel_with_sound(")
    print("      video_path='my_reel.mp4',")
    print("      audio_source='https://preview.url/audio.mp3'")
    print("  )")
    print("\nRequirements:")
    print("  - FFmpeg (brew install ffmpeg)")
    print("\n" + "=" * 50)
