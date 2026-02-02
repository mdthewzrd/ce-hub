"""
Video Processing Module
Handles blurring watermarks and overlaying logos
"""

import ffmpeg
import cv2
import numpy as np
from pathlib import Path
import logging
from typing import Optional, Tuple
from PIL import ImageFont, ImageDraw, Image

class VideoProcessor:
    """Process videos with blur effects and text/logo overlays."""

    def __init__(self, config: dict):
        """
        Initialize the video processor.

        Args:
            config: Configuration dictionary
        """
        self.config = config
        self.processing_config = config.get('processing', {})
        self.regions = config.get('watermark_regions', {})

        self.logger = logging.getLogger(__name__)

    def blur_region(self, input_path: str, output_path: str, region: dict) -> bool:
        """
        Apply blur effect to a specific region of the video.

        Args:
            input_path: Path to input video
            output_path: Path to save processed video
            region: Dictionary with x, y, width, height for the blur region

        Returns:
            True if successful, False otherwise
        """
        try:
            self.logger.info(f"Processing video: {input_path}")

            # Open video
            cap = cv2.VideoCapture(input_path)
            if not cap.isOpened():
                self.logger.error(f"Could not open video: {input_path}")
                return False

            # Get video properties
            fps = int(cap.get(cv2.CAP_PROP_FPS))
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

            self.logger.debug(f"Video: {width}x{height}, {fps} fps, {total_frames} frames")

            # Calculate blur region (support percentages)
            x = region.get('x', 0)
            y = region.get('y', 0)

            # Handle percentage-based coordinates
            if isinstance(x, str) and '%' in x:
                x = int(float(x.rstrip('%')) / 100 * width)
            if isinstance(y, str) and '%' in y:
                y = int(float(y.rstrip('%')) / 100 * height)

            blur_width = region.get('width', 200)
            blur_height = region.get('height', 80)

            # Handle percentage-based dimensions
            if isinstance(blur_width, str) and '%' in blur_width:
                blur_width = int(float(blur_width.rstrip('%')) / 100 * width)
            if isinstance(blur_height, str) and '%' in blur_height:
                blur_height = int(float(blur_height.rstrip('%')) / 100 * height)

            # Ensure values are integers
            x, y, blur_width, blur_height = int(x), int(y), int(blur_width), int(blur_height)

            # Validate region is within video bounds
            if x >= width or y >= height:
                self.logger.warning(f"Blur region outside video bounds: ({x}, {y}) vs ({width}, {height})")
                return False

            # Adjust if region extends beyond video
            if x + blur_width > width:
                blur_width = width - x
            if y + blur_height > height:
                blur_height = height - y

            blur_intensity = self.processing_config.get('blur_intensity', 20)

            # Setup output video
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

            # Process each frame
            frame_count = 0
            while True:
                ret, frame = cap.read()
                if not ret:
                    break

                # Extract region
                roi = frame[y:y+blur_height, x:x+blur_width]

                # Apply blur
                if roi.size > 0:
                    blurred = cv2.GaussianBlur(roi, (99, 99), blur_intensity)
                    frame[y:y+blur_height, x:x+blur_width] = blurred

                out.write(frame)
                frame_count += 1

                # Log progress
                if frame_count % 30 == 0:
                    self.logger.debug(f"Processed {frame_count}/{total_frames} frames")

            cap.release()
            out.release()

            self.logger.info(f"Saved processed video to: {output_path}")
            return True

        except Exception as e:
            self.logger.error(f"Error processing video: {e}")
            return False

    def add_logo_overlay(self, input_path: str, output_path: str, logo_path: str) -> bool:
        """
        Overlay a logo image onto the video.

        Args:
            input_path: Path to input video
            output_path: Path to save video with logo
            logo_path: Path to logo image (PNG with transparency)

        Returns:
            True if successful, False otherwise
        """
        try:
            if not Path(logo_path).exists():
                self.logger.warning(f"Logo file not found: {logo_path}")
                # Just copy the video if no logo
                import shutil
                shutil.copy(input_path, output_path)
                return True

            # Load logo
            logo = cv2.imread(logo_path, cv2.IMREAD_UNCHANGED)
            if logo is None:
                self.logger.error(f"Could not load logo: {logo_path}")
                return False

            # Get logo size from config or use default
            logo_size = self.processing_config.get('logo_size', 80)

            # Resize logo
            logo = cv2.resize(logo, (logo_size, logo_size))

            # Open video
            cap = cv2.VideoCapture(input_path)
            fps = int(cap.get(cv2.CAP_PROP_FPS))
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

            # Calculate logo position
            position = self.processing_config.get('logo_position', 'bottom_right')
            margin = 20

            if position == 'top_left':
                x, y = margin, margin
            elif position == 'top_right':
                x, y = width - logo_size - margin, margin
            elif position == 'bottom_left':
                x, y = margin, height - logo_size - margin
            elif position == 'bottom_center':
                x, y = (width - logo_size) // 2, height - logo_size - margin
            else:  # bottom_right (default)
                x, y = width - logo_size - margin, height - logo_size - margin

            # Setup output
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

            # Process each frame
            while True:
                ret, frame = cap.read()
                if not ret:
                    break

                # Overlay logo with alpha blending
                if logo.shape[2] == 4:  # Has alpha channel
                    for c in range(0, 3):
                        frame[y:y+logo_size, x:x+logo_size, c] = (
                            logo[:, :, 3] / 255.0 * logo[:, :, c] +
                            (1 - logo[:, :, 3] / 255.0) * frame[y:y+logo_size, x:x+logo_size, c]
                        )
                else:
                    frame[y:y+logo_size, x:x+logo_size] = logo

                out.write(frame)

            cap.release()
            out.release()

            self.logger.info(f"Added logo overlay to: {output_path}")
            return True

        except Exception as e:
            self.logger.error(f"Error adding logo overlay: {e}")
            return False

    def add_text_overlay(self, input_path: str, output_path: str) -> bool:
        """
        Overlay text (like @harmonatica) onto the video - CapCut style.

        Args:
            input_path: Path to input video
            output_path: Path to save video with text overlay

        Returns:
            True if successful, False otherwise
        """
        try:
            text_content = self.processing_config.get('overlay_text_content', '@harmonatica')
            text_size = self.processing_config.get('text_size', 40)
            text_color_hex = self.processing_config.get('text_color', '#FFFFFF')
            text_position = self.processing_config.get('text_position', 'bottom_right')
            has_background = self.processing_config.get('text_background', True)
            bg_color_hex = self.processing_config.get('text_background_color', '#000000AA')

            # Convert hex colors to BGR (OpenCV uses BGR)
            text_color = self._hex_to_bgr(text_color_hex)
            bg_color = self._hex_to_bgr(bg_color_hex) if has_background else None

            # Open video
            cap = cv2.VideoCapture(input_path)
            fps = int(cap.get(cv2.CAP_PROP_FPS))
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

            # Get font size
            font = cv2.FONT_HERSHEY_DUPLEX
            font_scale = text_size / 30  # Scale relative to base size
            thickness = max(1, int(text_size / 15))

            # Get text size for positioning
            (text_width, text_height), baseline = cv2.getTextSize(
                text_content, font, font_scale, thickness
            )

            # Add padding for background
            padding = 10
            text_width += padding * 2
            text_height += padding * 2

            # Calculate text position
            margin = 20
            if text_position == 'top_left':
                x, y = margin, margin
            elif text_position == 'top_right':
                x, y = width - text_width - margin, margin
            elif text_position == 'bottom_left':
                x, y = margin, height - text_height - margin
            elif text_position == 'bottom_center':
                x, y = (width - text_width) // 2, height - text_height - margin
            else:  # bottom_right (default)
                x, y = width - text_width - margin, height - text_height - margin

            # Setup output
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

            # Process each frame
            while True:
                ret, frame = cap.read()
                if not ret:
                    break

                # Draw background rectangle if enabled
                if has_background and bg_color:
                    # Handle alpha in background color
                    bg_bgr = bg_color[:3]
                    alpha = bg_color[3] / 255.0 if len(bg_color) > 3 else 1.0

                    # Create overlay with alpha blending
                    overlay = frame.copy()
                    cv2.rectangle(overlay, (x, y), (x + text_width, y + text_height), bg_bgr, -1)
                    cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0, frame)

                # Draw text
                text_x = x + padding
                text_y = y + text_height - padding - baseline
                cv2.putText(frame, text_content, (text_x, text_y), font, font_scale, text_color, thickness)

                out.write(frame)

            cap.release()
            out.release()

            self.logger.info(f"Added text overlay '@harmonatica' to: {output_path}")
            return True

        except Exception as e:
            self.logger.error(f"Error adding text overlay: {e}")
            return False

    def _hex_to_bgr(self, hex_color: str) -> tuple:
        """Convert hex color to BGR tuple with optional alpha."""
        hex_color = hex_color.lstrip('#')

        # Parse RGB
        r = int(hex_color[0:2], 16)
        g = int(hex_color[2:4], 16)
        b = int(hex_color[4:6], 16)

        # Check for alpha
        if len(hex_color) > 6:
            a = int(hex_color[6:8], 16)
            return (b, g, r, a)  # OpenCV uses BGR order
        return (b, g, r)

    def process_video(self, input_path: str, output_path: str) -> bool:
        """
        Full processing pipeline: blur regions and add logo.

        Args:
            input_path: Path to input video
            output_path: Path to save final processed video

        Returns:
            True if successful, False otherwise
        """
        try:
            temp_path = None

            # Step 1: Apply blur to enabled regions
            blur_enabled = self.processing_config.get('blur_username', True)
            if blur_enabled:
                for region_name, region_config in self.regions.items():
                    if region_config.get('enabled', False):
                        self.logger.info(f"Applying blur to region: {region_name}")
                        temp_path = output_path.replace('.mp4', '_temp.mp4')
                        if not self.blur_region(input_path, temp_path, region_config):
                            self.logger.error(f"Failed to blur region: {region_name}")
                            if temp_path and Path(temp_path).exists():
                                Path(temp_path).unlink()
                            return False
                        input_path = temp_path  # Use blurred video for next step

            # Step 2: Add text or logo overlay
            text_overlay_enabled = self.processing_config.get('overlay_text', False)
            logo_enabled = self.processing_config.get('overlay_logo', False)
            logo_path = self.processing_config.get('logo_path', '')

            if text_overlay_enabled:
                self.logger.info("Adding text overlay...")
                if not self.add_text_overlay(input_path, output_path):
                    self.logger.error("Failed to add text overlay")
                    return False
            elif logo_enabled and logo_path:
                self.logger.info("Adding logo overlay...")
                if not self.add_logo_overlay(input_path, output_path, logo_path):
                    self.logger.error("Failed to add logo overlay")
                    return False
            else:
                # No overlay, just rename temp to final
                if temp_path and Path(temp_path).exists():
                    import shutil
                    shutil.move(temp_path, output_path)
                else:
                    import shutil
                    shutil.copy(input_path, output_path)

            # Clean up temp file
            if temp_path and Path(temp_path).exists():
                Path(temp_path).unlink()

            self.logger.info(f"Video processing complete: {output_path}")
            return True

        except Exception as e:
            self.logger.error(f"Error in process_video: {e}")
            return False

    def process_batch(self, video_files: list, output_dir: Path) -> dict:
        """
        Process multiple videos.

        Args:
            video_files: List of video file paths
            output_dir: Directory to save processed videos

        Returns:
            Dictionary with processing results
        """
        results = {
            "successful": [],
            "failed": [],
            "total": len(video_files)
        }

        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        for video_path in video_files:
            video_path = Path(video_path)
            output_path = output_dir / f"processed_{video_path.name}"

            self.logger.info(f"Processing: {video_path.name}")

            if self.process_video(str(video_path), str(output_path)):
                results["successful"].append({
                    "original": str(video_path),
                    "processed": str(output_path)
                })
            else:
                results["failed"].append({
                    "file": str(video_path),
                    "error": "Processing failed"
                })

        return results
