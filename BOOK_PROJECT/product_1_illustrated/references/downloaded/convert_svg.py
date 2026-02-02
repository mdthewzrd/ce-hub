#!/usr/bin/env python3
"""Convert SVG to PNG using wand (ImageMagick binding) or PIL"""

import sys
import os

# Try wand first (ImageMagick binding)
try:
    from wand.image import Image
    from wand.color import Color

    svg_file = 'vitruvian_man_sacred_tech.svg'
    png_file = 'vitruvian_man_sacred_tech.png'

    with Image(filename=svg_file, resolution=300) as img:
        img.format = 'png'
        with Image(width=img.width * 2, height=img.height * 2) as resized:
            img.resize(resized.width, resized.height)
            img.save(filename=png_file)

    print(f"✅ Created: {png_file}")
    print(f"Size: 2800x2800px at 300 DPI")
    sys.exit(0)

except ImportError:
    print("wand not available, trying PIL approach...")

# Try PIL with svglib
try:
    from svglib.svglib import svg2rlg
    from reportlab.graphics import renderPM

    svg_file = 'vitruvian_man_sacred_tech.svg'
    png_file = 'vitruvian_man_sacred_tech.png'

    drawing = svg2rlg(svg_file)
    renderPM.drawToFile(drawing, png_file, dpi=(300, 300))

    print(f"✅ Created: {png_file}")
    sys.exit(0)

except ImportError:
    print("svglib/reportlab not available")

# Fallback: Use subprocess to call ImageMagick convert if available
import subprocess

svg_file = 'vitruvian_man_sacred_tech.svg'
png_file = 'vitruvian_man_sacred_tech.png'

try:
    # Try ImageMagick convert
    result = subprocess.run(
        ['convert', '-background', 'none', '-density', '300', svg_file, png_file],
        capture_output=True,
        text=True
    )
    if result.returncode == 0:
        print(f"✅ Created: {png_file} using ImageMagick")
        sys.exit(0)
except FileNotFoundError:
    pass

# Try rsvg-convert (part of librsvg)
try:
    result = subprocess.run(
        ['rsvg-convert', '-f', 'png', '-d', '300', '-o', png_file, svg_file],
        capture_output=True,
        text=True
    )
    if result.returncode == 0:
        print(f"✅ Created: {png_file} using rsvg-convert")
        sys.exit(0)
except FileNotFoundError:
    pass

# Try inkscape
try:
    result = subprocess.run(
        ['inkscape', '--export-type=png', '--export-dpi=300', f'--export-filename={png_file}', svg_file],
        capture_output=True,
        text=True
    )
    if result.returncode == 0:
        print(f"✅ Created: {png_file} using Inkscape")
        sys.exit(0)
except FileNotFoundError:
    pass

print("❌ No SVG conversion tools available.")
print("Please install one of:")
print("  - brew install imagemagick")
print("  - brew install librsvg")
print("  - brew install inkscape")
print("  - pip3 install wand svglib reportlab")
sys.exit(1)
