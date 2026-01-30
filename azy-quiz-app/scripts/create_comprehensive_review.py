#!/usr/bin/env python3
"""
Create comprehensive review page with Correct/Wrong/Edit buttons
ALL 5 categories: Frame Style, Material, Face Shapes, Use Cases, Lens Types
"""

import csv
import json

def read_products():
    products = {}
    seen = set()

    with open('/Users/michaeldurante/Downloads/products_export_1.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            handle = row.get('Handle', '')
            title = row.get('Title', '')

            if handle and handle not in seen and title:
                seen.add(handle)
                products[handle] = {
                    'handle': handle,
                    'title': title,
                    'vendor': row.get('Vendor', ''),
                    'image_src': row.get('Image Src', ''),
                }

    return products

def read_tags():
    tags = {}
    with open('/Users/michaeldurante/ai dev/ce-hub/azy-quiz-app/tagged_products.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            tags[row['handle']] = row
    return tags

def escape_js(s):
    """Escape string for JavaScript"""
    if not s:
        return ''
    return s.replace('\\', '\\\\').replace("'", "\\'").replace('"', '\\"')

def build_face_shapes_html(handle, existing_face_shapes):
    """Build face shapes selection HTML"""
    if existing_face_shapes and any(s.strip() for s in existing_face_shapes):
        tags = []
        for s in existing_face_shapes[:6]:
            if s.strip():
                safe_val = escape_js(s.strip())
                tags.append(f"<span class='selected-tag face-shape'>{s.strip()}<button class='remove-tag' onclick=\"removeTag('{handle}', 'face_shapes', '{safe_val}')\">&times;</button></span>")
        return ''.join(tags)
    return "<span class='no-selection'>Not tagged</span>"

def build_use_cases_html(handle, existing_use_cases):
    """Build use cases selection HTML"""
    if existing_use_cases and any(s.strip() for s in existing_use_cases):
        tags = []
        for s in existing_use_cases[:6]:
            if s.strip():
                label = s.strip().replace('_', ' ').title()
                safe_val = escape_js(s.strip())
                tags.append(f"<span class='selected-tag use-case'>{label}<button class='remove-tag' onclick=\"removeTag('{handle}', 'use_cases', '{safe_val}')\">&times;</button></span>")
        return ''.join(tags)
    return "<span class='no-selection'>Not tagged</span>"

def build_lens_types_html(handle, existing_lens_types):
    """Build lens types selection HTML"""
    if existing_lens_types and any(s.strip() for s in existing_lens_types):
        tags = []
        for s in existing_lens_types[:5]:
            if s.strip():
                safe_val = escape_js(s.strip())
                tags.append(f"<span class='selected-tag lens'>{s.strip()}<button class='remove-tag' onclick=\"removeTag('{handle}', 'lens_types', '{safe_val}')\">&times;</button></span>")
        return ''.join(tags)
    return "<span class='no-selection'>Not tagged</span>"

def build_style_html(handle, existing_style):
    """Build frame style selection HTML"""
    if existing_style:
        safe_val = escape_js(existing_style)
        return f"<span class='selected-tag style'>{existing_style}<button class='remove-tag' onclick=\"removeTag('{handle}', 'style', '{safe_val}')\">&times;</button></span>"
    return "<span class='no-selection'>Not tagged</span>"

def build_material_html(handle, existing_material):
    """Build material selection HTML"""
    if existing_material:
        safe_val = escape_js(existing_material)
        return f"<span class='selected-tag material'>{existing_material}<button class='remove-tag' onclick=\"removeTag('{handle}', 'material', '{safe_val}')\">&times;</button></span>"
    return "<span class='no-selection'>Not tagged</span>"

def build_init_js(handle, tag_data):
    """Build initialization JavaScript for a product"""
    existing_style = tag_data.get('style', '')
    existing_material = tag_data.get('material', '')
    existing_face_shapes = [s.strip() for s in tag_data.get('face_shapes', '').split(', ') if s.strip()]
    existing_use_cases = [s.strip() for s in tag_data.get('use_cases', '').split(', ') if s.strip()]
    existing_lens_types = [s.strip() for s in tag_data.get('lens_types', '').split(', ') if s.strip()]

    js_parts = []
    if existing_style:
        js_parts.append(f"productTags['{handle}'] = {{}};")
        js_parts.append(f"productTags['{handle}']['style'] = '{escape_js(existing_style)}';")
    if existing_material:
        if not existing_style:
            js_parts.append(f"productTags['{handle}'] = {{}};")
        js_parts.append(f"productTags['{handle}']['material'] = '{escape_js(existing_material)}';")
    if existing_face_shapes:
        if not existing_style and not existing_material:
            js_parts.append(f"productTags['{handle}'] = {{}};")
        shapes_json = json.dumps(existing_face_shapes)
        js_parts.append(f"productTags['{handle}']['face_shapes'] = {shapes_json};")
    if existing_use_cases:
        if not existing_style and not existing_material and not existing_face_shapes:
            js_parts.append(f"productTags['{handle}'] = {{}};")
        cases_json = json.dumps(existing_use_cases)
        js_parts.append(f"productTags['{handle}']['use_cases'] = {cases_json};")
    if existing_lens_types:
        if not existing_style and not existing_material and not existing_face_shapes and not existing_use_cases:
            js_parts.append(f"productTags['{handle}'] = {{}};")
        lenses_json = json.dumps(existing_lens_types)
        js_parts.append(f"productTags['{handle}']['lens_types'] = {lenses_json};")

    return '\n        '.join(js_parts)

def create_comprehensive_html(products, tags):
    with open('/Users/michaeldurante/ai dev/ce-hub/azy-quiz-app/public/verification/COMPREHENSIVE_REVIEW.html', 'w', encoding='utf-8') as f:
        # Write header
        f.write("""<!DOCTYPE html>
<html>
<head>
    <title>AZYR Products - Comprehensive Tag Review</title>
    <meta charset="UTF-8">
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 20px;
            background: #f5f5f5;
            margin: 0;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 30px;
            text-align: center;
        }
        .header h1 { margin: 0; font-size: 32px; }
        .header p { margin: 10px 0 0; opacity: 0.9; }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }
        .stat-box {
            background: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .stat-box h3 { margin: 0; font-size: 12px; color: #666; text-transform: uppercase; }
        .stat-box .number { font-size: 28px; font-weight: bold; color: #333; }

        .filters {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .filters h2 { margin: 0 0 15px 0; font-size: 18px; }
        .filter-buttons {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        .filter-btn {
            padding: 8px 16px;
            border: 1px solid #ddd;
            background: white;
            border-radius: 20px;
            cursor: pointer;
            font-size: 14px;
        }
        .filter-btn.active { background: #667eea; color: white; border-color: #667eea; }

        .products-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
            gap: 20px;
        }

        .product-card {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        }

        .product-image {
            width: 100%;
            aspect-ratio: 1;
            object-fit: cover;
            background: #f0f0f0;
        }

        .product-info { padding: 20px; }
        .product-vendor {
            font-size: 12px;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
        }
        .product-title {
            font-weight: 600;
            margin: 0 0 5px 0;
            font-size: 16px;
            line-height: 1.3;
        }
        .product-handle {
            font-family: monospace;
            font-size: 11px;
            color: #999;
            margin-bottom: 15px;
        }

        .tag-section {
            margin: 15px 0;
            padding: 12px;
            background: #f8f9fa;
            border-radius: 8px;
            border: 1px solid #e0e0e0;
        }

        .tag-label {
            font-size: 11px;
            font-weight: 700;
            color: #555;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 10px;
        }

        .current-selection {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 10px;
            flex-wrap: wrap;
            min-height: 30px;
        }

        .selected-tag {
            display: inline-flex;
            align-items: center;
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            gap: 5px;
        }

        .selected-tag.style { background: #fff3e0; color: #e65100; border: 1px solid #ffe0b2; }
        .selected-tag.material { background: #f3e5f5; color: #7b1fa2; border: 1px solid #e1bee7; }
        .selected-tag.face-shape { background: #e8f5e9; color: #2e7d32; border: 1px solid #c8e6c9; }
        .selected-tag.use-case { background: #fff9c4; color: #f57f17; border: 1px solid #ffe082; }
        .selected-tag.lens { background: #e3f2fd; color: #1565c0; border: 1px solid #bbdefb; }

        .remove-tag {
            background: none;
            border: none;
            color: inherit;
            cursor: pointer;
            font-size: 16px;
            opacity: 0.6;
            padding: 0;
        }
        .remove-tag:hover { opacity: 1; }

        .verification-buttons {
            display: flex;
            gap: 8px;
            margin-top: 10px;
        }

        .verify-btn {
            flex: 1;
            padding: 8px 12px;
            border: 1px solid #ddd;
            background: white;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            transition: all 0.2s;
        }

        .verify-btn:hover { background: #f5f5f5; }

        .verify-btn.correct { background: #4caf50; color: white; border-color: #4caf50; }
        .verify-btn.correct:hover { background: #45a049; }

        .verify-btn.wrong { background: #f44336; color: white; border-color: #f44336; }
        .verify-btn.wrong:hover { background: #da190b; }

        .verify-btn.edit { background: #2196f3; color: white; border-color: #2196f3; }
        .verify-btn.edit:hover { background: #1976d2; }

        .edit-options {
            display: none;
            margin-top: 10px;
            flex-wrap: wrap;
            gap: 6px;
        }

        .edit-options.show { display: flex; }

        .edit-option {
            padding: 6px 12px;
            border: 1px solid #ddd;
            background: white;
            border-radius: 20px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s;
        }

        .edit-option:hover { background: #f0f0f0; }
        .edit-option.selected { background: #667eea; color: white; border-color: #667eea; }

        .edit-option.style { background: #fff3e0; border-color: #ffe0b2; }
        .edit-option.style:hover { background: #ffe0b2; }
        .edit-option.style.selected { background: #e65100; border-color: #e65100; }

        .edit-option.custom {
            background: #e3f2fd;
            border-color: #2196f3;
            color: #1976d2;
            font-weight: 600;
            border-style: dashed;
            border-width: 2px;
        }
        .edit-option.custom:hover { background: #bbdefb; }

        .edit-option.material { background: #f3e5f5; border-color: #e1bee7; }
        .edit-option.material:hover { background: #e1bee7; }
        .edit-option.material.selected { background: #7b1fa2; border-color: #7b1fa2; }

        .edit-option.face-shape { background: #e8f5e9; border-color: #c8e6c9; }
        .edit-option.face-shape:hover { background: #c8e6c9; }
        .edit-option.face-shape.selected { background: #2e7d32; border-color: #2e7d32; }

        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-left: 8px;
        }
        .status-indicator.pending { background: #ff9800; }
        .status-indicator.verified { background: #4caf50; }
        .status-indicator.rejected { background: #f44336; }
        .status-indicator.edited { background: #2196f3; }

        .export-section {
            position: sticky;
            bottom: 20px;
            background: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }

        .export-section button {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            margin-right: 10px;
        }

        .btn-primary { background: #4caf50; color: white; }
        .btn-primary:hover { background: #45a049; }

        .btn-secondary { background: #2196f3; color: white; }
        .btn-secondary:hover { background: #1976d2; }

        .hidden { display: none; }

        .no-selection {
            color: #999;
            font-style: italic;
            font-size: 13px;
        }

        .ai-tagged {
            background: #e8f5e9;
            border: 2px solid #4caf50;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 15px;
        }

        .ai-tagged-label {
            font-size: 11px;
            font-weight: 700;
            color: #2e7d32;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }

        .needs-review-banner {
            background: #fff3e0;
            border-left: 4px solid #ff9800;
            padding: 10px 12px;
            margin-bottom: 15px;
            border-radius: 4px;
        }

        .needs-review-banner p {
            margin: 0;
            font-size: 13px;
            color: #e65100;
        }

        .custom-input {
            display: flex;
            gap: 5px;
            width: 100%;
            margin-top: 8px;
        }

        .custom-input input {
            flex: 1;
            padding: 6px 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 12px;
        }

        .custom-input button {
            padding: 6px 10px;
            background: #f44336;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }

        .verify-btn:disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>👓 AZYR Product Tag Review</h1>
        <p>Review existing tags: ✓ Correct | ✗ Wrong | ✏️ Edit to change</p>
    </div>

    <div class="stats">
        <div class="stat-box">
            <h3>Total Products</h3>
            <div class="number">""" + str(len(products)) + """</div>
        </div>
        <div class="stat-box">
            <h3>Reviewed</h3>
            <div class="number" id="reviewed-count">0</div>
        </div>
        <div class="stat-box">
            <h3>Remaining</h3>
            <div class="number" id="remaining-count">""" + str(len(products)) + """</div>
        </div>
    </div>

    <div class="filters">
        <h2>🔍 Filter:</h2>
        <div class="filter-buttons">
            <button class="filter-btn active" onclick="filterProducts('all')">Show All</button>
            <button class="filter-btn" onclick="filterProducts('reviewed')">Reviewed ✓</button>
            <button class="filter-btn" onclick="filterProducts('unreviewed')">Needs Review</button>
        </div>
    </div>

    <div class="products-grid" id="products-grid">
""")

        # Write product cards
        for handle, prod in list(products.items())[:150]:  # Limit to 150 for performance
            tag_data = tags.get(handle, {})

            # Get existing tags
            existing_style = tag_data.get('style', '')
            existing_material = tag_data.get('material', '')
            existing_face_shapes = tag_data.get('face_shapes', '').split(', ') if tag_data.get('face_shapes') else []
            existing_use_cases = tag_data.get('use_cases', '').split(', ') if tag_data.get('use_cases') else []
            existing_lens_types = tag_data.get('lens_types', '').split(', ') if tag_data.get('lens_types') else []

            # Build HTML for each section
            style_html = build_style_html(handle, existing_style)
            material_html = build_material_html(handle, existing_material)
            face_shapes_html = build_face_shapes_html(handle, existing_face_shapes)
            use_cases_html = build_use_cases_html(handle, existing_use_cases)
            lens_types_html = build_lens_types_html(handle, existing_lens_types)

            # Build initialization JS
            init_js = build_init_js(handle, tag_data)

            # Determine if edit options should be shown by default (for untagged items)
            style_show = ' show' if not existing_style else ''
            material_show = ' show' if not existing_material else ''
            face_shapes_show = ' show' if not existing_face_shapes or not any(existing_face_shapes) else ''
            use_cases_show = ' show' if not existing_use_cases or not any(existing_use_cases) else ''
            lens_types_show = ' show' if not existing_lens_types or not any(existing_lens_types) else ''

            # Check if product has any AI tags
            has_ai_tags = bool(existing_style or existing_material or (existing_face_shapes and any(existing_face_shapes)) or (existing_use_cases and any(existing_use_cases)) or (existing_lens_types and any(existing_lens_types)))

            # Write product card
            f.write(f"""        <div class="product-card" data-handle="{handle}" data-reviewed="no">
            <img src="{prod['image_src']}" class="product-image" alt="{prod['title']}">
            <div class="product-info">
                <div class="product-vendor">{prod['vendor']}</div>
                <h3 class="product-title">{prod['title'][:80]}...</h3>
                <div class="product-handle">{handle}</div>
""")

            # Add banner for untagged products
            if not has_ai_tags:
                f.write(f"""                <div class="needs-review-banner">
                    <p>⚠️ <strong>Needs Manual Tagging:</strong> AI couldn't auto-tag this product. Please select tags below.</p>
                </div>
""")

            f.write("""                <!-- Frame Style -->
                <div class="tag-section">
                    <div class="tag-label">📐 Frame Style <span class="status-indicator pending" id="style-status-{handle}"></span></div>
                    <div class="current-selection" id="style-selection-{handle}">
                        {style_html}
                    </div>
                    <div class="verification-buttons">
                        <button class="verify-btn correct" onclick="verifyTag('{handle}', 'style', '{escape_js(existing_style)}')" {'disabled' if not existing_style else ''}>✓ Correct</button>
                        <button class="verify-btn wrong" onclick="rejectTag('{handle}', 'style')" {'disabled' if not existing_style else ''}>✗ Wrong</button>
                        <button class="verify-btn edit" onclick="toggleEdit('{handle}', 'style')">✏️ Edit</button>
                    </div>
                    <div class="edit-options{style_show}" id="edit-style-{handle}">
                        <button class="edit-option style" onclick="selectTag('{handle}', 'style', 'aviator')">Aviator</button>
                        <button class="edit-option style" onclick="selectTag('{handle}', 'style', 'cat_eye')">Cat-Eye</button>
                        <button class="edit-option style" onclick="selectTag('{handle}', 'style', 'round')">Round</button>
                        <button class="edit-option style" onclick="selectTag('{handle}', 'style', 'rectangle')">Rectangle</button>
                        <button class="edit-option style" onclick="selectTag('{handle}', 'style', 'square')">Square</button>
                        <button class="edit-option style" onclick="selectTag('{handle}', 'style', 'wayfarer')">Wayfarer</button>
                        <button class="edit-option custom" onclick="showCustomInput('{handle}', 'style')">+ Add Custom Style</button>
                        <div class="custom-input hidden" id="custom-style-{handle}">
                            <input type="text" placeholder="Enter custom style (e.g., Oversized, Browline, Shield)..." onkeypress="handleCustomInput(event, '{handle}', 'style')">
                            <button type="button" onclick="hideCustomInput('{handle}', 'style')">×</button>
                        </div>
                    </div>
                </div>

                <!-- Material -->
                <div class="tag-section">
                    <div class="tag-label">🔧 Material <span class="status-indicator pending" id="material-status-{handle}"></span></div>
                    <div class="current-selection" id="material-selection-{handle}">
                        {material_html}
                    </div>
                    <div class="verification-buttons">
                        <button class="verify-btn correct" onclick="verifyTag('{handle}', 'material', '{escape_js(existing_material)}')" {'disabled' if not existing_material else ''}>✓ Correct</button>
                        <button class="verify-btn wrong" onclick="rejectTag('{handle}', 'material')" {'disabled' if not existing_material else ''}>✗ Wrong</button>
                        <button class="verify-btn edit" onclick="toggleEdit('{handle}', 'material')">✏️ Edit</button>
                    </div>
                    <div class="edit-options{material_show}" id="edit-material-{handle}">
                        <button class="edit-option material" onclick="selectTag('{handle}', 'material', 'wire')">Wire/Metal</button>
                        <button class="edit-option material" onclick="selectTag('{handle}', 'material', 'acetate')">Acetate/Plastic</button>
                    </div>
                </div>

                <!-- Face Shapes -->
                <div class="tag-section">
                    <div class="tag-label">👤 Face Shapes <span class="status-indicator pending" id="face_shapes-status-{handle}"></span></div>
                    <div class="current-selection" id="face_shapes-selection-{handle}">
                        {face_shapes_html}
                    </div>
                    <div class="verification-buttons">
                        <button class="verify-btn correct" onclick="verifyTagMultiple('{handle}', 'face_shapes')" {'disabled' if not existing_face_shapes or not any(existing_face_shapes) else ''}>✓ Correct</button>
                        <button class="verify-btn wrong" onclick="rejectTag('{handle}', 'face_shapes')" {'disabled' if not existing_face_shapes or not any(existing_face_shapes) else ''}>✗ Wrong</button>
                        <button class="verify-btn edit" onclick="toggleEdit('{handle}', 'face_shapes')">✏️ Edit</button>
                    </div>
                    <div class="edit-options{face_shapes_show}" id="edit-face_shapes-{handle}">
                        <button class="edit-option face-shape" onclick="toggleMultiple('{handle}', 'face_shapes', 'heart')">♥ Heart</button>
                        <button class="edit-option face-shape" onclick="toggleMultiple('{handle}', 'face_shapes', 'oval')">Oval</button>
                        <button class="edit-option face-shape" onclick="toggleMultiple('{handle}', 'face_shapes', 'round')">Round</button>
                        <button class="edit-option face-shape" onclick="toggleMultiple('{handle}', 'face_shapes', 'square')">Square</button>
                        <button class="edit-option face-shape" onclick="toggleMultiple('{handle}', 'face_shapes', 'rectangle')">Rectangle</button>
                        <button class="edit-option face-shape" onclick="toggleMultiple('{handle}', 'face_shapes', 'diamond')">◆ Diamond</button>
                    </div>
                </div>

                <!-- Use Cases -->
                <div class="tag-section">
                    <div class="tag-label">🎯 Use Cases <span class="status-indicator pending" id="use_cases-status-{handle}"></span></div>
                    <div class="current-selection" id="use_cases-selection-{handle}">
                        {use_cases_html}
                    </div>
                    <div class="verification-buttons">
                        <button class="verify-btn correct" onclick="verifyTagMultiple('{handle}', 'use_cases')" {'disabled' if not existing_use_cases or not any(existing_use_cases) else ''}>✓ Correct</button>
                        <button class="verify-btn wrong" onclick="rejectTag('{handle}', 'use_cases')" {'disabled' if not existing_use_cases or not any(existing_use_cases) else ''}>✗ Wrong</button>
                        <button class="verify-btn edit" onclick="toggleEdit('{handle}', 'use_cases')">✏️ Edit</button>
                    </div>
                    <div class="edit-options{use_cases_show}" id="edit-use_cases-{handle}">
                        <button class="edit-option" onclick="toggleMultiple('{handle}', 'use_cases', 'day')">☀️ Day</button>
                        <button class="edit-option" onclick="toggleMultiple('{handle}', 'use_cases', 'night')">🌙 Night</button>
                        <button class="edit-option" onclick="toggleMultiple('{handle}', 'use_cases', 'going_out')">🎉 Going Out</button>
                        <button class="edit-option" onclick="toggleMultiple('{handle}', 'use_cases', 'casual')">🌴 Casual</button>
                        <button class="edit-option" onclick="toggleMultiple('{handle}', 'use_cases', 'sport')">🏃 Sport</button>
                        <button class="edit-option" onclick="toggleMultiple('{handle}', 'use_cases', 'at_desk')">💻 At Desk</button>
                    </div>
                </div>

                <!-- Lens Types -->
                <div class="tag-section">
                    <div class="tag-label">👓 Lens Options <span class="status-indicator pending" id="lens_types-status-{handle}"></span></div>
                    <div class="current-selection" id="lens_types-selection-{handle}">
                        {lens_types_html}
                    </div>
                    <div class="verification-buttons">
                        <button class="verify-btn correct" onclick="verifyTagMultiple('{handle}', 'lens_types')" {'disabled' if not existing_lens_types or not any(existing_lens_types) else ''}>✓ Correct</button>
                        <button class="verify-btn wrong" onclick="rejectTag('{handle}', 'lens_types')" {'disabled' if not existing_lens_types or not any(existing_lens_types) else ''}>✗ Wrong</button>
                        <button class="verify-btn edit" onclick="toggleEdit('{handle}', 'lens_types')">✏️ Edit</button>
                    </div>
                    <div class="edit-options{lens_types_show}" id="edit-lens_types-{handle}">
                        <button class="edit-option" onclick="toggleMultiple('{handle}', 'lens_types', 'polarized')">🕶️ Polarized</button>
                        <button class="edit-option" onclick="toggleMultiple('{handle}', 'lens_types', 'shape')">✏️ Custom Shape</button>
                        <button class="edit-option" onclick="toggleMultiple('{handle}', 'lens_types', 'tinted')">🌈 Tinted</button>
                        <button class="edit-option" onclick="toggleMultiple('{handle}', 'lens_types', 'rx')">💊 Prescription</button>
                        <button class="edit-option" onclick="toggleMultiple('{handle}', 'lens_types', 'blue_light')">💡 Blue Light</button>
                    </div>
                </div>

                <!-- Done Button -->
                <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee;">
                    <button onclick="markReviewed('{handle}')" style="padding: 12px 30px; background: #4caf50; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 15px; font-weight: 600;">
                        ✓ Done - Next Product
                    </button>
                </div>
            </div>
        </div>
""")

        f.write("""    </div>

    <div class="export-section">
        <button class="btn-primary" onclick="exportAllTags()">Export Verified Tags</button>
        <button class="btn-secondary" onclick="window.scrollTo({top:0, behavior:'smooth'})">↑ Top</button>
        <div style="margin-top: 10px; font-size: 13px; color: #666;" id="export-progress"></div>
    </div>

    <script>
        const productTags = {};
        const reviewedProducts = new Set();

        // Initialize with existing tags
""")

        # Add initialization for each product
        for handle, tag_data in tags.items():
            init_js = build_init_js(handle, tag_data)
            if init_js:
                f.write("        " + init_js + "\n")

        f.write("""
        function verifyTag(handle, category, value) {
            if (!value) return;
            setStatus(handle, category, 'verified');
            productTags[handle] = productTags[handle] || {};
            productTags[handle][category] = value;
            console.log(`${handle} ${category}: ✓ ${value}`);
        }

        function verifyTagMultiple(handle, category) {
            setStatus(handle, category, 'verified');
            // Already stored in productTags on page load
            console.log(`${handle} ${category}: ✓ Verified`);
        }

        function rejectTag(handle, category) {
            setStatus(handle, category, 'rejected');
            delete productTags[handle]?.[category];
            console.log(`${handle} ${category}: ✗ Removed`);
        }

        function setStatus(handle, category, status) {
            const indicator = document.getElementById(`${category}-status-${handle}`);
            if (indicator) {
                indicator.className = `status-indicator ${status}`;
            }
        }

        function toggleEdit(handle, category) {
            const editOptions = document.getElementById(`edit-${category}-${handle}`);
            editOptions.classList.toggle('show');
        }

        function showCustomInput(handle, category) {
            const customInput = document.getElementById(`custom-${category}-${handle}`);
            customInput.classList.remove('hidden');
            customInput.querySelector('input').focus();
        }

        function hideCustomInput(handle, category) {
            const customInput = document.getElementById(`custom-${category}-${handle}`);
            customInput.classList.add('hidden');
            customInput.querySelector('input').value = '';
        }

        function handleCustomInput(event, handle, category) {
            if (event.key === 'Enter') {
                const value = event.target.value.trim();
                if (value) {
                    selectTag(handle, category, value);
                    hideCustomInput(handle, category);
                }
            }
        }

        function selectTag(handle, category, value) {
            productTags[handle] = productTags[handle] || {};
            productTags[handle][category] = value;

            // Update UI
            updateSelectionUI(handle, category);

            // Close edit options
            const editOptions = document.getElementById(`edit-${category}-${handle}`);
            editOptions.classList.remove('show');

            setStatus(handle, category, 'edited');
        }

        function toggleMultiple(handle, category, value) {
            productTags[handle] = productTags[handle] || {};
            if (!productTags[handle][category]) {
                productTags[handle][category] = [];
            }

            const index = productTags[handle][category].indexOf(value);
            if (index > -1) {
                productTags[handle][category].splice(index, 1);
            } else {
                productTags[handle][category].push(value);
            }

            updateSelectionUI(handle, category);
            setStatus(handle, category, 'edited');
        }

        function removeTag(handle, category, value) {
            if (productTags[handle]?.[category]) {
                if (Array.isArray(productTags[handle][category])) {
                    const index = productTags[handle][category].indexOf(value);
                    if (index > -1) {
                        productTags[handle][category].splice(index, 1);
                    }
                } else {
                    delete productTags[handle][category];
                }
                updateSelectionUI(handle, category);
                setStatus(handle, category, 'edited');
            }
        }

        function updateSelectionUI(handle, category) {
            const selectionDiv = document.getElementById(`${category}-selection-${handle}`);
            const value = productTags[handle]?.[category];

            if (category === 'face_shapes' || category === 'use_cases' || category === 'lens_types') {
                // Multi-select
                if (value && value.length > 0) {
                    selectionDiv.innerHTML = value.map(v =>
                        `<span class="selected-tag ${category === 'face_shapes' ? 'face-shape' : category === 'use_cases' ? 'use-case' : 'lens'}">${v.replace(/_/g, ' ')}<button class="remove-tag" onclick="removeTag('${handle}', '${category}', '${v}')">&times;</button></span>`
                    ).join('');
                } else {
                    selectionDiv.innerHTML = '<span class="no-selection">Not tagged</span>';
                }
            } else {
                // Single select
                if (value) {
                    selectionDiv.innerHTML = `<span class="selected-tag ${category}">${value}<button class="remove-tag" onclick="removeTag('${handle}', '${category}', '${value}')">&times;</button></span>`;
                } else {
                    selectionDiv.innerHTML = '<span class="no-selection">Not tagged</span>';
                }
            }
        }

        function markReviewed(handle) {
            const card = document.querySelector(`[data-handle="${handle}"]`);
            card.style.opacity = '0.6';
            card.setAttribute('data-reviewed', 'yes');
            reviewedProducts.add(handle);

            // Find next unreviewed product
            const nextCard = document.querySelector('.product-card:not([data-reviewed="yes"])');
            if (nextCard) {
                nextCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            // Update stats
            document.getElementById('reviewed-count').textContent = reviewedProducts.size;
            document.getElementById('remaining-count').textContent =
                document.querySelectorAll('.product-card:not([data-reviewed="yes"])').length;
        }

        function filterProducts(filter) {
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');

            document.querySelectorAll('.product-card').forEach(card => {
                const reviewed = card.getAttribute('data-reviewed') === 'yes';

                if (filter === 'all') {
                    card.classList.remove('hidden');
                } else if (filter === 'reviewed') {
                    card.classList.toggle('hidden', !reviewed);
                } else if (filter === 'unreviewed') {
                    card.classList.toggle('hidden', reviewed);
                }
            });
        }

        function exportAllTags() {
            let csv = 'Handle,Style,Material,Face Shapes,Use Cases,Lens Types,Status\\n';
            let count = 0;

            document.querySelectorAll('.product-card').forEach(card => {
                const handle = card.getAttribute('data-handle');
                const reviewed = card.getAttribute('data-reviewed') === 'yes';
                const tags = productTags[handle] || {};

                if (Object.keys(tags).length > 0 || reviewed) {
                    const style = tags.style || '';
                    const material = tags.material || '';
                    const faceShapes = tags.face_shapes ? tags.face_shapes.join('; ') : '';
                    const useCases = tags.use_cases ? tags.use_cases.join('; ') : '';
                    const lensTypes = tags.lens_types ? tags.lens_types.join('; ') : '';

                    csv += handle + ',';
                    csv += style + ',';
                    csv += material + ',';
                    csv += faceShapes + ',';
                    csv += useCases + ',';
                    csv += lensTypes + ',';
                    csv += (reviewed ? 'REVIEWED' : 'NEEDS REVIEW') + '\\n';
                    count++;
                }
            });

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'verified_product_tags.csv';
            a.click();

            document.getElementById('export-progress').textContent =
                `Exported ${count} products with verified tags`;
        }
    </script>
</body>
</html>""")

    print("✅ Created comprehensive review page:")
    print("   → https://azy-quiz-app.vercel.app/verification/COMPREHENSIVE_REVIEW.html")

if __name__ == '__main__':
    print("📖 Reading product data...")
    products = read_products()
    tags = read_tags()
    create_comprehensive_html(products, tags)
