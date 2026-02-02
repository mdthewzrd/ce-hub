"""
Visual Regression Testing System
Advanced visual validation that goes beyond PlayWright's limited approach
"""

import asyncio
import hashlib
import json
import time
from typing import (
    Any, Dict, List, Optional, Tuple, Union,
    BinaryIO, Callable, Set
)
from dataclasses import dataclass, field, asdict
from enum import Enum
from pathlib import Path
import logging
from PIL import Image, ImageChops, ImageDraw, ImageFont
import numpy as np
from dataclasses_json import dataclass_json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ComparisonMethod(Enum):
    """Methods for comparing images"""
    PIXEL_PERFECT = "pixel_perfect"
    STRUCTURAL_SIMILARITY = "ssim"
    PERCEPTUAL_HASH = "perceptual_hash"
    FEATURE_DETECTION = "feature_detection"
    LAYOUT_BASED = "layout_based"

class SeverityLevel(Enum):
    """Severity levels for visual differences"""
    CRITICAL = "critical"  # Blocking differences
    MAJOR = "major"  # Significant differences
    MINOR = "minor"  # Small differences
    INFO = "info"  # Informational differences only

@dataclass_json
@dataclass
class BoundingBox:
    """Bounding box for visual regions"""
    x: int
    y: int
    width: int
    height: int

    @property
    def area(self) -> int:
        return self.width * self.height

    def contains(self, x: int, y: int) -> bool:
        return (self.x <= x < self.x + self.width and
                self.y <= y < self.y + self.height)

    def intersects(self, other: 'BoundingBox') -> bool:
        return not (self.x + self.width <= other.x or
                   other.x + other.width <= self.x or
                   self.y + self.height <= other.y or
                   other.y + other.height <= self.y)

@dataclass_json
@dataclass
class VisualDifference:
    """Description of a visual difference"""
    bbox: BoundingBox
    severity: SeverityLevel
    description: str
    pixel_count: int = 0
    percentage_diff: float = 0.0
    affected_components: List[str] = field(default_factory=list)

@dataclass_json
@dataclass
class RegressionResult:
    """Result of visual regression test"""
    passed: bool
    overall_score: float  # 0.0 to 1.0, higher is better
    differences: List[VisualDifference] = field(default_factory=list)
    comparison_method: ComparisonMethod = ComparisonMethod.PIXEL_PERFECT
    execution_time: float = 0.0
    image_hash: str = ""
    baseline_hash: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class RegressionConfig:
    """Configuration for regression testing"""
    comparison_method: ComparisonMethod = ComparisonMethod.STRUCTURAL_SIMILARITY
    similarity_threshold: float = 0.95
    pixel_diff_threshold: int = 5
    ignore_regions: List[BoundingBox] = field(default_factory=list)
    ignore_animations: bool = True
    ignore_dynamic_content: bool = True
    crop_regions: List[BoundingBox] = field(default_factory=list)
    resize_max_dimension: Optional[int] = 2048
    enable_caching: bool = True
    severity_config: Dict[SeverityLevel, float] = field(default_factory=lambda: {
        SeverityLevel.CRITICAL: 0.8,
        SeverityLevel.MAJOR: 0.6,
        SeverityLevel.MINOR: 0.3,
        SeverityLevel.INFO: 0.1
    })

class ImageProcessor:
    """Advanced image processing utilities"""

    @staticmethod
    def load_image(source: Union[str, Path, BinaryIO, bytes]) -> Image.Image:
        """Load image from various sources"""
        if isinstance(source, (str, Path)):
            return Image.open(source)
        elif isinstance(source, bytes):
            from io import BytesIO
            return Image.open(BytesIO(source))
        else:
            return Image.open(source)

    @staticmethod
    def resize_image(image: Image.Image, max_dimension: Optional[int] = None) -> Image.Image:
        """Resize image while maintaining aspect ratio"""
        if max_dimension is None:
            return image

        width, height = image.size
        if max(width, height) <= max_dimension:
            return image

        ratio = max_dimension / max(width, height)
        new_width = int(width * ratio)
        new_height = int(height * ratio)

        return image.resize((new_width, new_height), Image.Resampling.LANCZOS)

    @staticmethod
    def crop_regions(image: Image.Image, regions: List[BoundingBox]) -> Image.Image:
        """Crop image to specified regions (or remove regions)"""
        if not regions:
            return image

        # For now, implement simple cropping to the first region
        # TODO: Implement region masking/compositing
        region = regions[0]
        return image.crop((region.x, region.y, region.x + region.width, region.y + region.height))

    @staticmethod
    def apply_mask(image: Image.Image, mask_regions: List[BoundingBox]) -> Image.Image:
        """Apply masks to ignore certain regions"""
        if not mask_regions:
            return image

        # Convert to RGBA if not already
        if image.mode != 'RGBA':
            image = image.convert('RGBA')

        # Create mask for ignored regions
        for region in mask_regions:
            draw = ImageDraw.Draw(image)
            draw.rectangle(
                [region.x, region.y, region.x + region.width, region.y + region.height],
                fill=(0, 0, 0, 0)  # Transparent
            )

        return image

    @staticmethod
    def calculate_phash(image: Image.Image) -> str:
        """Calculate perceptual hash of image"""
        # Resize to 8x8 and convert to grayscale
        small = image.resize((8, 8), Image.Resampling.LANCZOS).convert('L')

        # Calculate average color
        pixels = list(small.getdata())
        avg = sum(pixels) / len(pixels)

        # Generate hash bits
        bits = []
        for pixel in pixels:
            bits.append('1' if pixel > avg else '0')

        # Convert to hexadecimal
        hash_hex = hex(int(''.join(bits), 2))[2:].zfill(16)
        return hash_hex

class ComparisonEngine:
    """Engine for comparing images using various methods"""

    @staticmethod
    def pixel_perfect_compare(
        image1: Image.Image,
        image2: Image.Image,
        threshold: int = 0
    ) -> Tuple[bool, float, List[BoundingBox]]:
        """Perfect pixel comparison with threshold"""
        if image1.size != image2.size:
            # Resize to match
            image2 = image2.resize(image1.size, Image.Resampling.LANCZOS)

        # Convert to grayscale for comparison
        gray1 = image1.convert('L')
        gray2 = image2.convert('L')

        diff = ImageChops.difference(gray1, gray2)
        diff_pixels = np.array(diff)

        # Find pixels above threshold
        above_threshold = diff_pixels > threshold
        diff_count = np.sum(above_threshold)
        total_pixels = diff_pixels.size

        similarity = 1.0 - (diff_count / total_pixels)

        # Find bounding boxes of differences
        diff_regions = []
        if diff_count > 0:
            # Simple region detection - find connected components
            diff_mask = above_threshold.astype(np.uint8) * 255
            # TODO: Implement proper connected component analysis
            # For now, create single bounding box around all differences
            y_indices, x_indices = np.where(above_threshold)
            if len(x_indices) > 0:
                x_min, x_max = x_indices.min(), x_indices.max()
                y_min, y_max = y_indices.min(), y_indices.max()
                diff_regions.append(BoundingBox(x_min, y_min, x_max - x_min + 1, y_max - y_min + 1))

        return similarity >= 0.95, similarity, diff_regions

    @staticmethod
    def structural_similarity_compare(
        image1: Image.Image,
        image2: Image.Image
    ) -> Tuple[bool, float, List[BoundingBox]]:
        """Structural Similarity Index comparison"""
        try:
            from skimage.metrics import structural_similarity as ssim
        except ImportError:
            logger.warning("scikit-image not available, falling back to pixel comparison")
            return ComparisonEngine.pixel_perfect_compare(image1, image2)

        # Ensure same size
        if image1.size != image2.size:
            image2 = image2.resize(image1.size, Image.Resampling.LANCZOS)

        # Convert to grayscale
        gray1 = np.array(image1.convert('L'))
        gray2 = np.array(image2.convert('L'))

        # Calculate SSIM
        similarity, diff = ssim(gray1, gray2, full=True)

        # Find regions with significant differences
        diff_threshold = 0.1  # Threshold for significant differences
        diff_mask = np.abs(diff) > diff_threshold

        diff_regions = []
        if np.any(diff_mask):
            y_indices, x_indices = np.where(diff_mask)
            if len(x_indices) > 0:
                x_min, x_max = x_indices.min(), x_indices.max()
                y_min, y_max = y_indices.min(), y_indices.max()
                diff_regions.append(BoundingBox(x_min, y_min, x_max - x_min + 1, y_max - y_min + 1))

        return similarity >= 0.9, float(similarity), diff_regions

    @staticmethod
    def perceptual_hash_compare(
        image1: Image.Image,
        image2: Image.Image,
        threshold: int = 5  # Hamming distance threshold
    ) -> Tuple[bool, float, List[BoundingBox]]:
        """Compare using perceptual hashing"""
        hash1 = ImageProcessor.calculate_phash(image1)
        hash2 = ImageProcessor.calculate_phash(image2)

        # Calculate Hamming distance
        hamming_distance = sum(c1 != c2 for c1, c2 in zip(hash1, hash2))

        # Convert to similarity score
        max_distance = 16  # Maximum possible Hamming distance for 16-character hash
        similarity = 1.0 - (hamming_distance / max_distance)

        # For perceptual hashing, we don't get specific regions
        return similarity >= (1.0 - threshold/max_distance), similarity, []

class VisualRegressionTester:
    """
    Main visual regression testing system
    """

    def __init__(self, config: RegressionConfig = None, baseline_dir: Union[str, Path] = "visual_baselines"):
        self.config = config or RegressionConfig()
        self.baseline_dir = Path(baseline_dir)
        self.baseline_dir.mkdir(exist_ok=True)
        self.logger = logging.getLogger(__name__)
        self.image_processor = ImageProcessor()
        self.comparison_engine = ComparisonEngine()

    async def capture_screenshot(
        self,
        page_or_element: Any,
        name: str,
        wait_for_stable: bool = True
    ) -> Image.Image:
        """Capture screenshot with optional stability waiting"""
        if wait_for_stable:
            # Wait for DOM to be stable before capture
            await self._wait_for_visual_stability(page_or_element)

        # Capture screenshot
        if hasattr(page_or_element, 'screenshot'):
            screenshot_data = page_or_element.screenshot(type='png')
        else:
            raise ValueError("Object doesn't support screenshot capture")

        return self.image_processor.load_image(screenshot_data)

    async def compare_with_baseline(
        self,
        current_image: Image.Image,
        baseline_name: str,
        update_baseline: bool = False
    ) -> RegressionResult:
        """Compare current image with baseline"""
        start_time = time.time()

        # Preprocess current image
        processed_current = self._preprocess_image(current_image)

        # Get or create baseline
        baseline_path = self.baseline_dir / f"{baseline_name}.png"
        if update_baseline or not baseline_path.exists():
            # Save current as baseline
            processed_current.save(baseline_path)
            self.logger.info(f"Created/updated baseline: {baseline_path}")

            return RegressionResult(
                passed=True,
                overall_score=1.0,
                comparison_method=self.config.comparison_method,
                execution_time=time.time() - start_time,
                image_hash=self.image_processor.calculate_phash(processed_current),
                metadata={"baseline_updated": True}
            )

        # Load baseline
        baseline_image = self.image_processor.load_image(baseline_path)
        processed_baseline = self._preprocess_image(baseline_image)

        # Compare images
        passed, similarity, diff_regions = await self._compare_images(
            processed_current, processed_baseline
        )

        # Analyze differences
        differences = await self._analyze_differences(
            diff_regions, processed_current, processed_baseline
        )

        # Calculate overall score
        overall_score = self._calculate_overall_score(similarity, differences)

        execution_time = time.time() - start_time

        result = RegressionResult(
            passed=passed,
            overall_score=overall_score,
            differences=differences,
            comparison_method=self.config.comparison_method,
            execution_time=execution_time,
            image_hash=self.image_processor.calculate_phash(processed_current),
            baseline_hash=self.image_processor.calculate_phash(processed_baseline),
            metadata={
                "baseline_path": str(baseline_path),
                "similarity_score": similarity,
                "diff_region_count": len(diff_regions)
            }
        )

        self.logger.info(f"Regression test '{baseline_name}': {'PASSED' if passed else 'FAILED'} "
                        f"(score: {overall_score:.3f}, time: {execution_time:.3f}s)")

        return result

    def _preprocess_image(self, image: Image.Image) -> Image.Image:
        """Preprocess image for comparison"""
        processed = image.copy()

        # Resize if needed
        if self.config.resize_max_dimension:
            processed = self.image_processor.resize_image(processed, self.config.resize_max_dimension)

        # Crop to specified regions
        if self.config.crop_regions:
            processed = self.image_processor.crop_regions(processed, self.config.crop_regions)

        # Apply ignore masks
        if self.config.ignore_regions:
            processed = self.image_processor.apply_mask(processed, self.config.ignore_regions)

        return processed

    async def _compare_images(
        self,
        image1: Image.Image,
        image2: Image.Image
    ) -> Tuple[bool, float, List[BoundingBox]]:
        """Compare two images using configured method"""
        method = self.config.comparison_method

        if method == ComparisonMethod.PIXEL_PERFECT:
            return self.comparison_engine.pixel_perfect_compare(
                image1, image2, self.config.pixel_diff_threshold
            )
        elif method == ComparisonMethod.STRUCTURAL_SIMILARITY:
            return self.comparison_engine.structural_similarity_compare(image1, image2)
        elif method == ComparisonMethod.PERCEPTUAL_HASH:
            return self.comparison_engine.perceptual_hash_compare(image1, image2)
        else:
            # Default to structural similarity
            return self.comparison_engine.structural_similarity_compare(image1, image2)

    async def _analyze_differences(
        self,
        diff_regions: List[BoundingBox],
        current_image: Image.Image,
        baseline_image: Image.Image
    ) -> List[VisualDifference]:
        """Analyze and classify differences"""
        differences = []

        for region in diff_regions:
            # Calculate difference metrics
            pixel_count = region.area
            total_pixels = current_image.width * current_image.height
            percentage = (pixel_count / total_pixels) * 100

            # Determine severity based on size and configuration
            severity = self._determine_severity(pixel_count, percentage, region)

            # Generate description
            description = self._generate_difference_description(region, severity)

            differences.append(VisualDifference(
                bbox=region,
                severity=severity,
                description=description,
                pixel_count=pixel_count,
                percentage_diff=percentage
            ))

        return differences

    def _determine_severity(
        self,
        pixel_count: int,
        percentage: float,
        region: BoundingBox
    ) -> SeverityLevel:
        """Determine severity level of difference"""
        # Check if region intersects with ignored areas (shouldn't happen due to masking)
        for ignore_region in self.config.ignore_regions:
            if region.intersects(ignore_region):
                return SeverityLevel.INFO

        # Determine severity based on size
        if percentage > 10.0:  # More than 10% of image
            return SeverityLevel.CRITICAL
        elif percentage > 5.0:  # More than 5% of image
            return SeverityLevel.MAJOR
        elif percentage > 1.0:  # More than 1% of image
            return SeverityLevel.MINOR
        else:
            return SeverityLevel.INFO

    def _generate_difference_description(self, region: BoundingBox, severity: SeverityLevel) -> str:
        """Generate human-readable description of difference"""
        return f"{severity.value.upper()} visual difference detected at position ({region.x}, {region.y}) " \
               f"spanning {region.width}x{region.height} pixels"

    def _calculate_overall_score(
        self,
        similarity: float,
        differences: List[VisualDifference]
    ) -> float:
        """Calculate overall regression score"""
        # Start with similarity score
        score = similarity

        # Penalize based on differences
        for diff in differences:
            penalty = self.config.severity_config.get(diff.severity, 0.1)
            score -= penalty * (diff.percentage_diff / 100.0)

        # Ensure score is between 0 and 1
        return max(0.0, min(1.0, score))

    async def _wait_for_visual_stability(self, page_or_element: Any) -> None:
        """Wait for visual content to stabilize"""
        # This would integrate with the waiting strategies
        # For now, implement basic waiting
        await asyncio.sleep(0.5)

    def generate_diff_report(
        self,
        result: RegressionResult,
        current_image: Image.Image,
        baseline_image: Image.Image,
        output_path: Optional[Union[str, Path]] = None
    ) -> Image.Image:
        """Generate visual diff report image"""
        if not result.differences:
            return current_image

        # Create diff image
        diff = ImageChops.difference(current_image, baseline_image)
        diff = diff.convert('RGB')

        # Convert to numpy array for drawing
        diff_array = np.array(diff)

        # Highlight difference regions
        draw = ImageDraw.Draw(diff)

        for diff_info in result.differences:
            region = diff_info.bbox

            # Choose color based on severity
            colors = {
                SeverityLevel.CRITICAL: (255, 0, 0),    # Red
                SeverityLevel.MAJOR: (255, 165, 0),     # Orange
                SeverityLevel.MINOR: (255, 255, 0),    # Yellow
                SeverityLevel.INFO: (0, 255, 0)        # Green
            }
            color = colors.get(diff_info.severity, (255, 0, 0))

            # Draw rectangle around difference
            draw.rectangle(
                [region.x, region.y, region.x + region.width, region.y + region.height],
                outline=color,
                width=3
            )

        # Save if path provided
        if output_path:
            diff.save(output_path)

        return diff

# Global instance for easy access
default_regression_tester = VisualRegressionTester()

# Utility functions for common operations
async def regression_test(
    current_image: Image.Image,
    baseline_name: str,
    config: Optional[RegressionConfig] = None
) -> RegressionResult:
    """Quick visual regression test"""
    if config:
        tester = VisualRegressionTester(config)
    else:
        tester = default_regression_tester

    return await tester.compare_with_baseline(current_image, baseline_name)