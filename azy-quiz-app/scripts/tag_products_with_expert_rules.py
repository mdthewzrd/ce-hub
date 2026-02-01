#!/usr/bin/env python3
"""
AZYR Product Tagging Script - Expert-Based Classification
Uses Maureen Ryza's expert questionnaire responses to tag products
"""

import csv
import re
from typing import Dict, List, Set, Tuple

# ============== EXPERT'S COMPATIBILITY RULES ==============

# Expert's face shape compatibility (from questionnaire)
FACE_SHAPE_COMPATIBILITY = {
    'aviator': ['heart', 'oval', 'square', 'diamond'],
    'cat_eye': ['heart', 'oval', 'round', 'square', 'diamond'],
    'round': ['heart', 'square', 'diamond'],
    'rectangle': ['heart', 'oval', 'round', 'diamond'],
    'square': ['oval', 'round'],
    'wayfarer': ['heart', 'oval', 'round', 'square'],
}

# Expert's use case recommendations (lower priority)
USE_CASE_STYLES = {
    'day': ['rectangle', 'aviator', 'wayfarer', 'cat_eye'],
    'night': ['square', 'wayfarer', 'round'],
    'going_out': ['square', 'aviator', 'wayfarer', 'cat_eye', 'rectangle'],
    'casual': ['round', 'cat_eye', 'rectangle', 'wayfarer', 'square', 'aviator'],  # all
    'sport': ['aviator', 'rectangle'],
    'at_desk': ['round', 'rectangle', 'square', 'wayfarer'],
}

# Material classifications
WIRE_KEYWORDS = [
    'wire', 'metal', 'gold', 'silver', 'bronze', 'steel', 'titanium',
    'thin metal', 'gold frame', 'silver frame', 'metal frame'
]

ACETATE_KEYWORDS = [
    'acetate', 'plastic', 'thick plastic', 'tortoise', 'tortoiseshell',
    'plastic frame', 'thick frame'
]

# Lens type to use case mapping
LENS_USE_CASES = {
    'blue_light': ['at_desk'],
    'polarized': ['sport', 'day'],
    'rx': ['day', 'night', 'casual', 'at_desk', 'going_out', 'sport'],
    'tinted': ['day', 'night'],
    'custom': ['going_out', 'casual'],
}

# ============== FRAME STYLE DETECTION ==============

FRAME_STYLE_PATTERNS = {
    'aviator': [
        r'aviator', r'teardrop', r'double bridge', r'pilot',
        r'drop.*shape', r'classic.*aviator'
    ],
    'cat_eye': [
        r'cat.?eye', r'cateye', r'upswept', r'upsweep',
        r'angled.*corner', r'winged.*out'
    ],
    'round': [
        r'\bound\b', r'circle', r'john.?lennon', r'round.*frame',
        r'circular', r'perfect.*circle'
    ],
    'oval': [
        r'\boval\b', r'oval.*shape', r'oval.*glasses', r'oval.*frame',
        r'egg.*shape', r'ellipse'
    ],
    'rectangle': [
        r'\brectangle\b', r'horizontal.*elongated', r'oblong',
        r'rectangular', r'horizontal.*lines', r'micro.*rectangular'
    ],
    'square': [
        r'\bsquare\b', r'geometric', r'angular.*square',
        r'boxy', r'squared', r'bold.*square'
    ],
    'wayfarer': [
        r'\bwayfarer\b', r'trapezoid', r'top.*heavy', r'wayfarer.?style',
        r'classic.*wayfarer', r'thick.*plastic.*slanted'
    ],
}

# ============== HELPER FUNCTIONS ==============

def detect_frame_style(title: str, body: str, tags: str, frame_design: str) -> str:
    """Detect frame style from product data"""
    text = f"{title} {body} {tags} {frame_design}".lower()

    for style, patterns in FRAME_STYLE_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, text, re.IGNORECASE):
                return style

    # Check existing tags/frame_design field
    if frame_design:
        frame_design_lower = frame_design.lower()
        if 'aviator' in frame_design_lower:
            return 'aviator'
        elif 'cat' in frame_design_lower or 'eye' in frame_design_lower:
            return 'cat_eye'
        elif 'round' in frame_design_lower:
            return 'round'
        elif 'square' in frame_design_lower:
            return 'square'
        elif 'rectangle' in frame_design_lower or 'oblong' in frame_design_lower:
            return 'rectangle'
        elif 'wayfarer' in frame_design_lower:
            return 'wayfarer'

    return None

def detect_material(title: str, body: str, tags: str, frame_material: str) -> str:
    """Detect frame material"""
    text = f"{title} {body} {tags} {frame_material}".lower()

    # Check explicit material field first
    if frame_material:
        material_lower = frame_material.lower()
        if any(kw in material_lower for kw in WIRE_KEYWORDS):
            return 'wire'
        elif any(kw in material_lower for kw in ACETATE_KEYWORDS):
            return 'acetate'

    # Check text
    for keyword in WIRE_KEYWORDS:
        if keyword in text:
            return 'wire'

    for keyword in ACETATE_KEYWORDS:
        if keyword in text:
            return 'acetate'

    return None

def get_face_shapes(frame_style: str) -> List[str]:
    """Get compatible face shapes based on frame style"""
    return FACE_SHAPE_COMPATIBILITY.get(frame_style, [])

def get_use_cases(frame_style: str) -> List[str]:
    """Get recommended use cases based on frame style"""
    # Return use cases where this frame style is recommended
    compatible = []
    for use_case, styles in USE_CASE_STYLES.items():
        if frame_style in styles:
            compatible.append(use_case)
    return compatible

def detect_vibes(title: str, body: str, tags: str, decade: str, vendor: str) -> List[str]:
    """Detect style vibes from product"""
    text = f"{title} {body} {tags} {vendor}".lower()
    vibes = []

    # Retro/Vintage
    if any(kw in text for kw in ['1980s', '1990s', '80s', '90s', 'vintage', 'retro', 'decade']):
        if decade or '1980' in text or '1990' in text or '80s' in text or '90s' in text:
            vibes.append('retro')

    # Luxury
    if any(kw in text for kw in ['luxury', 'designer', 'premium', 'high-end', 'couture']):
        if vendor not in ['Unknown', 'Unknown designer']:
            vibes.append('luxury')

    # Modern
    if any(kw in text for kw in ['modern', 'minimalist', 'contemporary', 'sleek', 'clean']):
        vibes.append('modern')

    # Classic
    if any(kw in text for kw in ['classic', 'timeless', 'heritage', 'traditional']):
        vibes.append('classic')

    # Trendy
    if any(kw in text for kw in ['trendy', 'fashion', 'bold', 'statement', 'edgy']):
        vibes.append('trendy')

    # Edgy
    if any(kw in text for kw in ['edgy', 'bold', 'dramatic', 'unusual', 'striking']):
        vibes.append('edgy')

    # Default to retro for vintage
    if not vibes and (decade or '1980' in text or '1990' in text):
        vibes.append('retro')
        vibes.append('classic')

    return vibes[:3]  # Max 3 vibes

def detect_lens_types(title: str, body: str, tags: str, lens_type: str,
                       lens_polarization: str) -> List[str]:
    """Detect available lens types"""
    text = f"{title} {body} {tags}".lower()
    lens_types = []

    # Polarized
    if lens_polarization and lens_polarization.lower() in ['yes', 'polarized', 'true']:
        lens_types.append('polarized')
    elif 'polarized' in text:
        lens_types.append('polarized')

    # RX/Prescription - only if explicitly mentioned
    if 'rx' in text or 'prescription' in text or 'prescri' in text or 'prescription-ready' in text:
        lens_types.append('rx')

    # Blue light
    if 'blue light' in text or 'blue-light' in text or 'computer' in text or 'gaming' in text:
        lens_types.append('blue_light')

    # Tinted
    if any(kw in text for kw in ['tinted', 'tint', 'gradient', 'photochromic', 'transition', 'mirrored']):
        lens_types.append('tinted')

    # Custom
    if any(kw in text for kw in ['custom lens', 'interchangeable', 'replaceable', 'custom-colored']):
        lens_types.append('custom')

    # Shield lens shape
    if any(kw in text for kw in ['shield', 'wrap', 'sport shield', 'full coverage']):
        lens_types.append('shield')

    # Butterfly lens shape
    if any(kw in text for kw in ['butterfly', 'oversized', 'large frame', 'maxi']):
        lens_types.append('butterfly')

    # Geometric/Angular lens
    if any(kw in text for kw in ['geometric', 'hexagonal', 'octagonal', 'angular lens']):
        lens_types.append('geometric')

    # NO DEFAULT - only tag what we're explicitly told
    # Most vintage eyewear is plano/standard lenses, not prescription

    return lens_types

def format_tags(tags_dict: Dict[str, any]) -> str:
    """Format tags as comma-separated string"""
    parts = []

    if tags_dict.get('style'):
        parts.append(f"style:{tags_dict['style']}")

    if tags_dict.get('material'):
        parts.append(f"material:{tags_dict['material']}")

    for vibe in tags_dict.get('vibes', []):
        parts.append(f"vibe:{vibe}")

    for face_shape in tags_dict.get('face_shapes', []):
        parts.append(f"face_shape:{face_shape}")

    for use_case in tags_dict.get('use_cases', []):
        parts.append(f"use_case:{use_case}")

    for lens_type in tags_dict.get('lens_types', []):
        parts.append(f"lens:{lens_type}")

    return ', '.join(parts)

# ============== MAIN PROCESSING ==============

def process_product(row: Dict[str, str]) -> Dict[str, any]:
    """Process a single product row and return tags"""

    handle = row.get('Handle', '')
    title = row.get('Title', '')
    body = row.get('Body (HTML)', '')
    tags = row.get('Tags', '')
    vendor = row.get('Vendor', '')
    decade = row.get('Decade (product.metafields.custom.decade)', '')

    # Metafields
    frame_design = row.get('Eyewear frame design (product.metafields.shopify.eyewear-frame-design)', '')
    frame_material = row.get('Eyewear frame material (product.metafields.shopify.eyewear-frame-material)', '')
    lens_type = row.get('Lens type (product.metafields.shopify.lens-type)', '')
    lens_polarization = row.get('Lens polarization (product.metafields.shopify.lens-polarization)', '')

    # Detect classifications
    style = detect_frame_style(title, body, tags, frame_design)
    material = detect_material(title, body, tags, frame_material)

    # Get derived attributes
    face_shapes = get_face_shapes(style) if style else []
    use_cases = get_use_cases(style) if style else []
    vibes = detect_vibes(title, body, tags, decade, vendor)
    lens_types = detect_lens_types(title, body, tags, lens_type, lens_polarization)

    return {
        'handle': handle,
        'title': title,
        'style': style,
        'material': material,
        'face_shapes': face_shapes,
        'use_cases': use_cases,
        'vibes': vibes,
        'lens_types': lens_types,
    }

def main():
    input_file = '/Users/michaeldurante/Downloads/products_export_1.csv'
    output_file = '/Users/michaeldurante/ai dev/ce-hub/azy-quiz-app/tagged_products.csv'
    summary_file = '/Users/michaeldurante/ai dev/ce-hub/azy-quiz-app/TAGGING_SUMMARY.md'

    print(f"🏷️  AZYR Product Tagging - Expert-Based Classification")
    print(f"📖 Reading: {input_file}")

    # Read input CSV
    products = []
    seen_handles = set()
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            handle = row.get('Handle', '')
            title = row.get('Title', '')

            # Only process first row for each product (skip image-only rows)
            if handle and handle not in seen_handles and title:
                seen_handles.add(handle)
                products.append(row)

    print(f"✅ Found {len(products)} unique products")

    # Process each product
    tagged_products = []
    style_counts = {}
    material_counts = {}
    untagged = []

    for i, product in enumerate(products, 1):
        if i % 50 == 0:
            print(f"   Processing {i}/{len(products)}...")

        tags = process_product(product)
        tagged_products.append(tags)

        # Track counts
        if tags['style']:
            style_counts[tags['style']] = style_counts.get(tags['style'], 0) + 1
        else:
            untagged.append(tags['handle'])

        if tags['material']:
            material_counts[tags['material']] = material_counts.get(tags['material'], 0) + 1

    # Write output CSV with tags
    print(f"\n📝 Writing tagged products to: {output_file}")

    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        fieldnames = ['handle', 'title', 'style', 'material', 'face_shapes',
                     'use_cases', 'vibes', 'lens_types', 'tags']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

        for tags in tagged_products:
            writer.writerow({
                'handle': tags['handle'],
                'title': tags['title'],
                'style': tags['style'] or '',
                'material': tags['material'] or '',
                'face_shapes': ', '.join(tags['face_shapes']),
                'use_cases': ', '.join(tags['use_cases']),
                'vibes': ', '.join(tags['vibes']),
                'lens_types': ', '.join(tags['lens_types']),
                'tags': format_tags(tags),
            })

    # Write summary
    print(f"📊 Writing summary to: {summary_file}")

    with open(summary_file, 'w', encoding='utf-8') as f:
        f.write("# AZYR Product Tagging Summary\n\n")
        f.write(f"**Total Products:** {len(products)}\n")
        f.write(f"**Successfully Tagged:** {len(products) - len(untagged)}\n")
        f.write(f"**Need Manual Review:** {len(untagged)}\n\n")

        f.write("## Frame Style Distribution\n\n")
        for style, count in sorted(style_counts.items(), key=lambda x: x[1], reverse=True):
            f.write(f"- **{style}:** {count} products\n")

        f.write("\n## Material Distribution\n\n")
        for material, count in sorted(material_counts.items(), key=lambda x: x[1], reverse=True):
            f.write(f"- **{material}:** {count} products\n")

        if untagged:
            f.write(f"\n## ⚠️  Products Needing Manual Review ({len(untagged)})\n\n")
            for handle in untagged[:20]:  # Show first 20
                f.write(f"- {handle}\n")
            if len(untagged) > 20:
                f.write(f"\n... and {len(untagged) - 20} more\n")

        f.write("\n---\n\n")
        f.write("## Tag Format\n\n")
        f.write("Tags are formatted as `category:value`:\n")
        f.write("- `style:aviator`, `style:cat_eye`, etc.\n")
        f.write("- `material:wire`, `material:acetate`\n")
        f.write("- `vibe:retro`, `vibe:luxury`, etc.\n")
        f.write("- `face_shape:heart`, `face_shape:oval`, etc.\n")
        f.write("- `use_case:day`, `use_case:night`, etc.\n")
        f.write("- `lens:polarized`, `lens:rx`, etc.\n\n")

        f.write("## Expert Compatibility Rules Applied\n\n")
        f.write("Based on Maureen Ryza's expert questionnaire:\n\n")
        f.write("| Frame Style | Compatible Face Shapes |\n")
        f.write("|-------------|----------------------|\n")
        for style, shapes in FACE_SHAPE_COMPATIBILITY.items():
            style_label = style.replace('_', ' ').title()
            f.write(f"| {style_label} | {', '.join(shapes)} |\n")

    print(f"\n✨ Tagging complete!")
    print(f"\n📈 Statistics:")
    print(f"   - Total unique products: {len(products)}")
    print(f"   - Successfully tagged: {len(products) - len(untagged)}")
    print(f"   - Frame styles identified: {len(style_counts)}")
    print(f"   - Materials identified: {len(material_counts)}")
    print(f"   - Products needing manual review: {len(untagged)}")
    print(f"\n📁 Output files:")
    print(f"   - {output_file}")
    print(f"   - {summary_file}")

if __name__ == '__main__':
    main()
