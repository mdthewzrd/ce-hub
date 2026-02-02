#!/usr/bin/env python3
"""
Simple tag review page with direct selection
- Click to select/deselect options
- Green ring shows selected state
- Custom input always available for frame style
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
                    'title': row.get('Title', ''),
                    'body_html': row.get('Body (HTML)', ''),
                    'type': row.get('Type', ''),
                    'tags': row.get('Tags', ''),
                    'variant_sku': row.get('Variant SKU', ''),
                    'variant_price': row.get('Variant Price', ''),
                    'variant_compare_at_price': row.get('Variant Compare At Price', ''),
                    'status': row.get('Status', 'active'),
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
    if not s:
        return ''
    return s.replace('\\', '\\\\').replace("'", "\\'")

def create_html(products, tags):
    with open('/Users/michaeldurante/ai dev/ce-hub/azy-quiz-app/public/verification/SIMPLE_REVIEW.html', 'w', encoding='utf-8') as f:
        f.write("""<!DOCTYPE html>
<html>
<head>
    <title>AZYR Product Tag Review</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
            margin-bottom: 20px;
            text-align: center;
        }
        .header h1 { margin: 0; font-size: 28px; }
        .header p { margin: 8px 0 0; opacity: 0.9; font-size: 14px; }

        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 12px;
            margin-bottom: 20px;
        }
        .stat-box {
            background: white;
            padding: 16px;
            border-radius: 8px;
            text-align: center;
        }
        .stat-box h3 { margin: 0; font-size: 11px; color: #666; text-transform: uppercase; }
        .stat-box .number { font-size: 24px; font-weight: bold; color: #333; }

        .filters { background: white; padding: 16px; border-radius: 8px; margin-bottom: 16px; }
        .filters h2 { margin: 0 0 12px 0; font-size: 16px; }
        .filter-buttons { display: flex; gap: 8px; flex-wrap: wrap; }
        .filter-btn {
            padding: 8px 16px;
            border: 1px solid #ddd;
            background: white;
            border-radius: 20px;
            cursor: pointer;
            font-size: 13px;
        }
        .filter-btn.active { background: #667eea; color: white; border-color: #667eea; }

        .products-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
            gap: 16px;
        }

        .product-card {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .product-image {
            width: 100%;
            aspect-ratio: 1;
            object-fit: cover;
            background: #f0f0f0;
        }

        .product-info { padding: 16px; }
        .product-vendor { font-size: 11px; color: #888; text-transform: uppercase; margin-bottom: 4px; }
        .product-title { font-weight: 600; margin: 0 0 4px 0; font-size: 15px; line-height: 1.3; }
        .product-handle { font-family: monospace; font-size: 10px; color: #999; margin-bottom: 12px; }

        .tag-section {
            margin: 12px 0;
            padding: 12px;
            background: #fafafa;
            border-radius: 8px;
            border: 1px solid #eee;
        }

        .tag-label {
            font-size: 11px;
            font-weight: 700;
            color: #555;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 10px;
        }

        .option-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }

        .option-btn {
            padding: 8px 12px;
            border: 2px solid #ddd;
            background: white;
            border-radius: 20px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
            transition: all 0.15s;
            position: relative;
        }

        .option-btn:hover { border-color: #999; transform: scale(1.02); }

        .option-btn.pending {
            border: 3px dashed #ff9800;
            background: #fff3e0;
            color: #e65100;
        }

        .option-btn.pending::after {
            content: '•';
            position: absolute;
            top: -6px;
            right: -6px;
            background: #ff9800;
            color: white;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: bold;
        }

        /* GREEN SELECTION - Very prominent */
        .option-btn.selected {
            border: 3px solid #4caf50;
            background: #e8f5e9;
            color: #2e7d32;
            font-weight: 700;
            box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.25);
        }

        .option-btn.selected::after {
            content: '✓';
            position: absolute;
            top: -6px;
            right: -6px;
            background: #4caf50;
            color: white;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: bold;
        }

        /* Category colors */
        .option-btn.style { background: #fff3e0; border-color: #ffe0b2; }
        .option-btn.style.selected { border-color: #e65100; background: #ffe0b2; }
        .option-btn.style.selected::after { background: #e65100; }

        .option-btn.material { background: #f3e5f5; border-color: #e1bee7; }
        .option-btn.material.selected { border-color: #7b1fa2; background: #e1bee7; }
        .option-btn.material.selected::after { background: #7b1fa2; }

        .option-btn.face-shape { background: #e8f5e9; border-color: #c8e6c9; }
        .option-btn.face-shape.selected { border-color: #2e7d32; background: #c8e6c9; }
        .option-btn.face-shape.selected::after { background: #2e7d32; }

        .option-btn.use-case { background: #fff9c4; border-color: #ffe082; }
        .option-btn.use-case.selected { border-color: #f57f17; background: #ffe082; }
        .option-btn.use-case.selected::after { background: #f57f17; }

        .option-btn.lens { background: #e3f2fd; border-color: #bbdefb; }
        .option-btn.lens.selected { border-color: #1565c0; background: #bbdefb; }
        .option-btn.lens.selected::after { background: #1565c0; }

        .custom-btn {
            background: #e3f2fd;
            border-color: #2196f3;
            color: #1976d2;
            font-weight: 600;
            border-style: dashed;
        }

        .custom-input-container {
            display: none;
            width: 100%;
            margin-top: 10px;
            padding: 10px;
            background: #f0f7ff;
            border-radius: 8px;
            border: 2px dashed #2196f3;
        }
        .custom-input-container.show { display: block; }

        .custom-input-container input {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 13px;
            margin-bottom: 8px;
        }

        .custom-input-actions { display: flex; gap: 8px; }
        .custom-input-actions button {
            flex: 1;
            padding: 10px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
        }
        .btn-save { background: #4caf50; color: white; }
        .btn-cancel { background: #f44336; color: white; }

        .custom-trigger {
            background: #fff3e0 !important;
            border-color: #ff9800 !important;
            color: #e65100 !important;
            border-style: dashed;
        }

        .custom-input-section {
            display: none;
            width: 100%;
            margin-top: 10px;
            padding: 10px;
            background: #fff8f0;
            border-radius: 8px;
            border: 2px dashed #ff9800;
        }

        .custom-input-section.show { display: block; }

        .custom-input {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 13px;
            margin-bottom: 8px;
        }

        .custom-buttons { display: flex; gap: 8px; }
        .custom-buttons button {
            flex: 1;
            padding: 10px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
        }
        .btn-custom-save { background: #4caf50; color: white; }
        .btn-custom-cancel { background: #f44336; color: white; }

        .save-changes-section {
            margin-top: 16px;
            padding: 12px;
            background: #e8f5e9;
            border-radius: 8px;
            border: 2px solid #4caf50;
            display: none;
        }

        .save-changes-section.show {
            display: block;
        }

        .btn-save-changes {
            width: 100%;
            padding: 12px;
            background: #4caf50;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
        }
        .btn-save-changes:hover { background: #45a049; }

        .has-changes-badge {
            display: inline-block;
            background: #ff9800;
            color: white;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            margin-left: 8px;
        }

        .done-section {
            margin-top: 16px;
            padding-top: 12px;
            border-top: 1px solid #eee;
        }

        .btn-done {
            width: 100%;
            padding: 12px;
            background: #4caf50;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
        }
        .btn-done:hover { background: #45a049; }

        .export-section {
            position: sticky;
            bottom: 16px;
            background: white;
            padding: 16px;
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
            margin-right: 8px;
        }

        .btn-primary { background: #4caf50; color: white; }
        .btn-secondary { background: #2196f3; color: white; }
        .btn-info { background: #9c27b0; color: white; }

        .hidden { display: none; }
    </style>
</head>
<body>
    <div class="header">
        <h1>👓 AZYR Product Tag Review</h1>
        <p>Click options to select/deselect (orange = pending). Click "Save Changes" to confirm.</p>
    </div>

    <div class="stats">
        <div class="stat-box">
            <h3>Total</h3>
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

        # Write product cards (all products)
        for handle, prod in list(products.items()):
            tag_data = tags.get(handle, {})

            # Get existing tags
            existing_style = tag_data.get('style', '')
            existing_material = tag_data.get('material', '')
            existing_face_shapes = [s.strip() for s in tag_data.get('face_shapes', '').split(', ') if s.strip()]
            existing_use_cases = [s.strip() for s in tag_data.get('use_cases', '').split(', ') if s.strip()]
            existing_lens_types = [s.strip() for s in tag_data.get('lens_types', '').split(', ') if s.strip()]

            # Build initialization data
            init_data = {
                'style': existing_style,
                'material': existing_material,
                'face_shapes': existing_face_shapes,
                'use_cases': existing_use_cases,
                'lens_types': existing_lens_types,
            }

            f.write(f"""        <div class="product-card" data-handle="{handle}" data-reviewed="no">
            <img src="{prod['image_src']}" class="product-image" alt="{prod['title']}">
            <div class="product-info">
                <div class="product-vendor">{prod['vendor']}</div>
                <h3 class="product-title">{prod['title'][:70]}...</h3>
                <div class="product-handle">{handle}</div>

                <!-- Frame Style (single select) -->
                <div class="tag-section">
                    <div class="tag-label">📐 Frame Style</div>
                    <div class="option-grid" id="style-options-{handle}">
                        <button class="option-btn style" data-value="aviator" onclick="toggleSingle('{handle}', 'style', 'aviator')">Aviator</button>
                        <button class="option-btn style" data-value="cat_eye" onclick="toggleSingle('{handle}', 'style', 'cat_eye')">Cat-Eye</button>
                        <button class="option-btn style" data-value="round" onclick="toggleSingle('{handle}', 'style', 'round')">Round</button>
                        <button class="option-btn style" data-value="rectangle" onclick="toggleSingle('{handle}', 'style', 'rectangle')">Rectangle</button>
                        <button class="option-btn style" data-value="square" onclick="toggleSingle('{handle}', 'style', 'square')">Square</button>
                        <button class="option-btn style" data-value="wayfarer" onclick="toggleSingle('{handle}', 'style', 'wayfarer')">Wayfarer</button>
                        <button class="option-btn custom-btn" onclick="showCustomInput('{handle}')">+ Custom</button>
                    </div>
                    <div class="custom-input-container" id="custom-input-{handle}">
                        <input type="text" id="custom-text-{handle}" placeholder="Enter custom frame style (e.g., Oversized, Browline, Shield)...">
                        <div class="custom-input-actions">
                            <button class="btn-save" onclick="saveCustom('{handle}')">Save</button>
                            <button class="btn-cancel" onclick="hideCustomInput('{handle}')">Cancel</button>
                        </div>
                    </div>
                </div>

                <!-- Material (single select) -->
                <div class="tag-section">
                    <div class="tag-label">🔧 Material</div>
                    <div class="option-grid" id="material-options-{handle}">
                        <button class="option-btn material" data-value="wire" onclick="toggleSingle('{handle}', 'material', 'wire')">Wire/Metal</button>
                        <button class="option-btn material" data-value="acetate" onclick="toggleSingle('{handle}', 'material', 'acetate')">Acetate/Plastic</button>
                    </div>
                </div>

                <!-- Face Shapes (multi-select) -->
                <div class="tag-section">
                    <div class="tag-label">👤 Face Shapes</div>
                    <div class="option-grid" id="face-shapes-options-{handle}">
                        <button class="option-btn face-shape" data-value="heart" onclick="toggleMultiple('{handle}', 'face_shapes', 'heart')">♥ Heart</button>
                        <button class="option-btn face-shape" data-value="oval" onclick="toggleMultiple('{handle}', 'face_shapes', 'oval')">Oval</button>
                        <button class="option-btn face-shape" data-value="round" onclick="toggleMultiple('{handle}', 'face_shapes', 'round')">Round</button>
                        <button class="option-btn face-shape" data-value="square" onclick="toggleMultiple('{handle}', 'face_shapes', 'square')">Square</button>
                        <button class="option-btn face-shape" data-value="rectangle" onclick="toggleMultiple('{handle}', 'face_shapes', 'rectangle')">Rectangle</button>
                        <button class="option-btn face-shape" data-value="diamond" onclick="toggleMultiple('{handle}', 'face_shapes', 'diamond')">◆ Diamond</button>
                    </div>
                </div>

                <!-- Use Cases (multi-select) -->
                <div class="tag-section">
                    <div class="tag-label">🎯 Use Cases</div>
                    <div class="option-grid" id="use-cases-options-{handle}">
                        <button class="option-btn use-case" data-value="day" onclick="toggleMultiple('{handle}', 'use_cases', 'day')">☀️ Day</button>
                        <button class="option-btn use-case" data-value="night" onclick="toggleMultiple('{handle}', 'use_cases', 'night')">🌙 Night</button>
                        <button class="option-btn use-case" data-value="going_out" onclick="toggleMultiple('{handle}', 'use_cases', 'going_out')">🎉 Going Out</button>
                        <button class="option-btn use-case" data-value="casual" onclick="toggleMultiple('{handle}', 'use_cases', 'casual')">🌴 Casual</button>
                        <button class="option-btn use-case" data-value="sport" onclick="toggleMultiple('{handle}', 'use_cases', 'sport')">🏃 Sport</button>
                        <button class="option-btn use-case" data-value="at_desk" onclick="toggleMultiple('{handle}', 'use_cases', 'at_desk')">💻 At Desk</button>
                    </div>
                </div>

                <!-- Lens Types (multi-select) -->
                <div class="tag-section">
                    <div class="tag-label">👓 Lens Options</div>
                    <div class="option-grid" id="lens-types-options-{handle}">
                        <button class="option-btn lens" data-value="polarized" onclick="toggleMultiple('{handle}', 'lens_types', 'polarized')">🕶️ Polarized</button>
                        <button class="option-btn lens" data-value="shield" onclick="toggleMultiple('{handle}', 'lens_types', 'shield')">🛡️ Shield</button>
                        <button class="option-btn lens" data-value="butterfly" onclick="toggleMultiple('{handle}', 'lens_types', 'butterfly')">🦋 Butterfly</button>
                        <button class="option-btn lens" data-value="geometric" onclick="toggleMultiple('{handle}', 'lens_types', 'geometric')">📐 Geometric</button>
                        <button class="option-btn lens" data-value="tinted" onclick="toggleMultiple('{handle}', 'lens_types', 'tinted')">🌈 Tinted</button>
                        <button class="option-btn lens" data-value="rx" onclick="toggleMultiple('{handle}', 'lens_types', 'rx')">💊 Prescription</button>
                        <button class="option-btn lens" data-value="blue_light" onclick="toggleMultiple('{handle}', 'lens_types', 'blue_light')">💡 Blue Light</button>
                        <button class="option-btn lens custom-trigger" onclick="showCustomLensInput('{handle}')">+ Custom</button>
                    </div>
                    <div class="custom-input-section" id="custom-lens-section-{handle}" style="display: none;">
                        <input type="text" class="custom-input" id="custom-lens-input-{handle}" placeholder="Enter custom lens type/shape...">
                        <div class="custom-buttons">
                            <button class="btn-custom-save" onclick="saveCustomLens('{handle}')">Save</button>
                            <button class="btn-custom-cancel" onclick="cancelCustomLens('{handle}')">Cancel</button>
                        </div>
                    </div>
                </div>

                <!-- Save Changes Section -->
                <div class="save-changes-section" id="save-section-{handle}">
                    <button class="btn-save-changes" onclick="saveChanges('{handle}')">💾 Save Changes</button>
                </div>

                <div class="done-section">
                    <button class="btn-done" onclick="markReviewed('{handle}')">✓ Done - Next Product</button>
                </div>
            </div>
        </div>
""")

        f.write("""    </div>

    <div class="export-section">
        <button class="btn-primary" onclick="exportVerifiedTags()">📋 Export Verified Tags</button>
        <button class="btn-info" onclick="showExportInfo()">ℹ️ How to Import to Shopify</button>
        <button class="btn-secondary" onclick="window.scrollTo({top:0, behavior:'smooth'})">↑ Top</button>
    </div>

    <div id="export-info" style="display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); z-index: 1000; max-width: 500px;">
        <h3 style="margin-top: 0;">How to Import to Shopify</h3>
        <ol style="line-height: 1.8;">
            <li>Click <strong>Export Verified Tags</strong> to download the CSV</li>
            <li>Email the CSV to: <strong>your-email@example.com</strong></li>
            <li>We'll convert it to Shopify import format</li>
            <li>Import the updated CSV in Shopify Admin</li>
        </ol>
        <button onclick="document.getElementById('export-info').style.display='none'" style="padding: 10px 20px; background: #4caf50; color: white; border: none; border-radius: 6px; cursor: pointer;">Got it!</button>
    </div>

    <script>
        const productTags = {};      // Saved tags (green)
        const pendingTags = {};       // Pending changes (orange)
        const reviewedProducts = new Set();

        // Initialize with existing tags
""")

        # Add initialization for each product
        for handle, tag_data in tags.items():
            existing_style = tag_data.get('style', '')
            existing_material = tag_data.get('material', '')
            existing_face_shapes = [s.strip() for s in tag_data.get('face_shapes', '').split(', ') if s.strip()]
            existing_use_cases = [s.strip() for s in tag_data.get('use_cases', '').split(', ') if s.strip()]
            existing_lens_types = [s.strip() for s in tag_data.get('lens_types', '').split(', ') if s.strip()]

            parts = []
            if existing_style:
                parts.append(f"productTags['{handle}'] = {{}};")
                parts.append(f"productTags['{handle}']['style'] = '{escape_js(existing_style)}';")
            if existing_material:
                if not existing_style:
                    parts.append(f"productTags['{handle}'] = {{}};")
                parts.append(f"productTags['{handle}']['material'] = '{escape_js(existing_material)}';")
            if existing_face_shapes:
                if not existing_style and not existing_material:
                    parts.append(f"productTags['{handle}'] = {{}};")
                parts.append(f"productTags['{handle}']['face_shapes'] = {json.dumps(existing_face_shapes)};")
            if existing_use_cases:
                if not existing_style and not existing_material and not existing_face_shapes:
                    parts.append(f"productTags['{handle}'] = {{}};")
                parts.append(f"productTags['{handle}']['use_cases'] = {json.dumps(existing_use_cases)};")
            if existing_lens_types:
                if not existing_style and not existing_material and not existing_face_shapes and not existing_use_cases:
                    parts.append(f"productTags['{handle}'] = {{}};")
                parts.append(f"productTags['{handle}']['lens_types'] = {json.dumps(existing_lens_types)};")

            if parts:
                f.write("        " + "\n        ".join(parts) + "\n")

        f.write("""
        // Initialize selected state on page load
        document.addEventListener('DOMContentLoaded', function() {
            Object.keys(productTags).forEach(handle => {
                const tags = productTags[handle];

                // Frame style (single)
                if (tags.style) {
                    const btn = document.querySelector(`[data-handle="${handle}"] .option-btn.style[data-value="${tags.style}"]`);
                    if (btn) btn.classList.add('selected');
                }

                // Material (single)
                if (tags.material) {
                    const btn = document.querySelector(`[data-handle="${handle}"] .option-btn.material[data-value="${tags.material}"]`);
                    if (btn) btn.classList.add('selected');
                }

                // Face shapes (multi)
                if (tags.face_shapes) {
                    tags.face_shapes.forEach(val => {
                        const btn = document.querySelector(`[data-handle="${handle}"] .option-btn.face-shape[data-value="${val}"]`);
                        if (btn) btn.classList.add('selected');
                    });
                }

                // Use cases (multi)
                if (tags.use_cases) {
                    tags.use_cases.forEach(val => {
                        const btn = document.querySelector(`[data-handle="${handle}"] .option-btn.use-case[data-value="${val}"]`);
                        if (btn) btn.classList.add('selected');
                    });
                }

                // Lens types (multi)
                if (tags.lens_types) {
                    tags.lens_types.forEach(val => {
                        const btn = document.querySelector(`[data-handle="${handle}"] .option-btn.lens[data-value="${val}"]`);
                        if (btn) btn.classList.add('selected');
                    });
                }
            });
        });

        function toggleSingle(handle, category, value) {
            pendingTags[handle] = pendingTags[handle] || {};
            const currentSaved = productTags[handle]?.[category];
            const currentPending = pendingTags[handle][category];

            // Toggle in pending state
            if (currentPending === value) {
                // Already pending this value, remove it
                delete pendingTags[handle][category];
            } else {
                // Set new pending value
                pendingTags[handle][category] = value;
            }

            updateUI(handle, category);
            showSaveButton(handle);
        }

        function toggleMultiple(handle, category, value) {
            pendingTags[handle] = pendingTags[handle] || {};
            if (!pendingTags[handle][category]) {
                // Start with saved values as base
                const saved = productTags[handle]?.[category] || [];
                pendingTags[handle][category] = [...saved];
            }

            const arr = pendingTags[handle][category];
            const index = arr.indexOf(value);

            if (index > -1) {
                arr.splice(index, 1);
                if (arr.length === 0) {
                    delete pendingTags[handle][category];
                }
            } else {
                arr.push(value);
            }

            updateUI(handle, category);
            showSaveButton(handle);
        }

        function showSaveButton(handle) {
            const saveSection = document.getElementById(`save-section-${handle}`);
            if (saveSection && Object.keys(pendingTags[handle] || {}).length > 0) {
                saveSection.classList.add('show');
            }
        }

        function saveChanges(handle) {
            // Apply all pending changes to saved tags
            if (pendingTags[handle]) {
                Object.keys(pendingTags[handle]).forEach(category => {
                    const value = pendingTags[handle][category];
                    if (Array.isArray(value)) {
                        if (value.length === 0) {
                            delete productTags[handle]?.[category];
                        } else {
                            productTags[handle] = productTags[handle] || {};
                            productTags[handle][category] = value;
                        }
                    } else {
                        productTags[handle] = productTags[handle] || {};
                        productTags[handle][category] = value;
                    }
                });

                // Clear pending state
                delete pendingTags[handle];

                // Hide save button
                const saveSection = document.getElementById(`save-section-${handle}`);
                saveSection.classList.remove('show');

                // Update all categories for this product
                ['style', 'material', 'face_shapes', 'use_cases', 'lens_types'].forEach(cat => {
                    updateUI(handle, cat);
                });

                console.log(`Saved changes for ${handle}`);
            }
        }

        function updateUI(handle, category) {
            if (category === 'face_shapes' || category === 'use_cases' || category === 'lens_types') {
                // Multi-select
                const container = document.querySelector(`[data-handle="${handle}"] #${category.replace('_', '-')}-options-${handle}`);
                const buttons = container.querySelectorAll('.option-btn');
                const savedValues = productTags[handle]?.[category] || [];
                const pendingValues = pendingTags[handle]?.[category] || savedValues; // Default to saved if no pending

                buttons.forEach(btn => {
                    const val = btn.getAttribute('data-value');
                    btn.classList.remove('selected', 'pending');

                    if (pendingValues.includes(val)) {
                        btn.classList.add('pending');
                    } else if (savedValues.includes(val)) {
                        btn.classList.add('selected');
                    }
                });
            } else {
                // Single select
                const container = document.querySelector(`[data-handle="${handle}"] #${category.replace('_', '-')}-options-${handle}`);
                const buttons = container.querySelectorAll('.option-btn');
                const savedValue = productTags[handle]?.[category];
                const pendingValue = pendingTags[handle]?.[category];

                buttons.forEach(btn => {
                    const val = btn.getAttribute('data-value');
                    btn.classList.remove('selected', 'pending');

                    if (pendingValue === val) {
                        btn.classList.add('pending');
                    } else if (savedValue === val) {
                        btn.classList.add('selected');
                    }
                });
            }
        }

        function showCustomInput(handle) {
            document.getElementById(`custom-input-${handle}`).classList.add('show');
            document.getElementById(`custom-text-${handle}`).focus();
        }

        function hideCustomInput(handle) {
            document.getElementById(`custom-input-${handle}`).classList.remove('show');
            document.getElementById(`custom-text-${handle}`).value = '';
        }

        function saveCustom(handle) {
            const input = document.getElementById(`custom-text-${handle}`);
            const value = input.value.trim();
            if (value) {
                // Add to pending state
                pendingTags[handle] = pendingTags[handle] || {};
                pendingTags[handle]['style'] = value;

                // Update UI to show pending state
                updateUI(handle, 'style');
                showSaveButton(handle);
                hideCustomInput(handle);
            }
        }

        function showCustomLensInput(handle) {
            document.getElementById(`custom-lens-section-${handle}`).classList.add('show');
            document.getElementById(`custom-lens-input-${handle}`).focus();
        }

        function cancelCustomLens(handle) {
            document.getElementById(`custom-lens-section-${handle}`).classList.remove('show');
            document.getElementById(`custom-lens-input-${handle}`).value = '';
        }

        function saveCustomLens(handle) {
            const input = document.getElementById(`custom-lens-input-${handle}`);
            const value = input.value.trim();
            if (value) {
                // Add to pending state for lens_types (multi-select)
                pendingTags[handle] = pendingTags[handle] || {};
                if (!pendingTags[handle]['lens_types']) {
                    pendingTags[handle]['lens_types'] = [];
                }
                // Check if already in pending
                if (!pendingTags[handle]['lens_types'].includes(value)) {
                    pendingTags[handle]['lens_types'].push(value);
                }

                // Update UI to show pending state
                updateUI(handle, 'lens_types');
                showSaveButton(handle);
                cancelCustomLens(handle);
            }
        }

        function markReviewed(handle) {
            const card = document.querySelector(`[data-handle="${handle}"]`);
            card.style.opacity = '0.5';
            card.setAttribute('data-reviewed', 'yes');
            reviewedProducts.add(handle);

            // Find next unreviewed product
            const nextCard = document.querySelector('.product-card:not([data-reviewed="yes"])');
            if (nextCard) {
                nextCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

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

        function exportVerifiedTags() {
            let csv = 'Handle,Style,Material,Face Shapes,Use Cases,Lens Types,Status\\n';
            let count = 0;

            document.querySelectorAll('.product-card').forEach(card => {
                const handle = card.getAttribute('data-handle');
                const reviewed = card.getAttribute('data-reviewed') === 'yes';
                const tags = productTags[handle] || {};

                csv += handle + ',';
                csv += (tags.style || '') + ',';
                csv += (tags.material || '') + ',';
                csv += (tags.face_shapes ? tags.face_shapes.join('; ') : '') + ',';
                csv += (tags.use_cases ? tags.use_cases.join('; ') : '') + ',';
                csv += (tags.lens_types ? tags.lens_types.join('; ') : '') + ',';
                csv += (reviewed ? 'REVIEWED' : 'NEEDS REVIEW') + '\\n';
                count++;
            });

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const date = new Date().toISOString().slice(0,10);
            a.download = 'azyr_verified_tags_' + date + '.csv';
            a.click();

            alert('Exported ' + count + ' products!\\n\\nEmail this file to be converted to Shopify import format.');
        }

        function showExportInfo() {
            document.getElementById('export-info').style.display = 'block';
        }
    </script>
</body>
</html>""")

    print("✅ Created simple review page:")
    print("   → file:///Users/michaeldurante/ai%20dev/ce-hub/azy-quiz-app/public/verification/SIMPLE_REVIEW.html")

if __name__ == '__main__':
    print("📖 Reading product data...")
    products = read_products()
    tags = read_tags()
    create_html(products, tags)
