#!/usr/bin/env python3
"""
Create verification HTML pages for tagged and untagged products
Includes product images for visual verification
"""

import csv
from typing import Dict, List

def read_tagged_products():
    """Read the tagged products CSV"""
    tagged = {}
    with open('/Users/michaeldurante/ai dev/ce-hub/azy-quiz-app/tagged_products.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            tagged[row['handle']] = row
    return tagged

def read_original_products():
    """Read original CSV to get image URLs"""
    products = {}
    seen = set()

    with open('/Users/michaeldurante/Downloads/products_export_1.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            handle = row.get('Handle', '')
            title = row.get('Title', '')
            image_src = row.get('Image Src', '')

            # Only get first row per product
            if handle and handle not in seen and title:
                seen.add(handle)
                products[handle] = {
                    'handle': handle,
                    'title': title,
                    'image_src': image_src,
                    'vendor': row.get('Vendor', ''),
                    'body': row.get('Body (HTML)', '')[:300],
                }

    return products

def create_tagged_html(tagged_products: Dict, original_products: Dict):
    """Create HTML page for tagged products with images"""

    # Separate tagged and untagged
    verified = []
    needs_review = []

    for handle, tags in tagged_products.items():
        if handle in original_products:
            prod = original_products[handle]
            prod['tags'] = tags

            if tags['style']:
                verified.append(prod)
            else:
                needs_review.append(prod)

    # Create Tagged Products HTML
    with open('/Users/michaeldurante/ai dev/ce-hub/azy-quiz-app/VERIFICATION_TAGGED.html', 'w', encoding='utf-8') as f:
        f.write("""<!DOCTYPE html>
<html>
<head>
    <title>AZYR Tagged Products - Verification</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: #f5f5f5; }
        h1 { color: #1a1a1a; }
        .stats { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; display: flex; gap: 40px; }
        .stat-box { flex: 1; }
        .stat-box h3 { margin: 0 0 10px 0; color: #666; font-size: 12px; text-transform: uppercase; }
        .stat-box .number { font-size: 32px; font-weight: bold; color: #1a1a1a; }
        .products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px; }
        .product-card { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .product-image { width: 100%; aspect-ratio: 1; object-fit: cover; background: #f0f0f0; }
        .product-info { padding: 15px; }
        .product-title { font-weight: 600; margin: 0 0 8px 0; font-size: 14px; line-height: 1.4; }
        .product-vendor { color: #666; font-size: 12px; margin-bottom: 10px; }
        .tag-section { margin: 10px 0; }
        .tag-label { font-size: 11px; font-weight: 600; color: #666; text-transform: uppercase; margin-bottom: 4px; }
        .tag { display: inline-block; background: #e8f4f8; color: #0066cc; padding: 3px 8px; border-radius: 4px; font-size: 11px; margin: 2px; }
        .tag.style { background: #fff3e0; color: #e65100; }
        .tag.material { background: #f3e5f5; color: #7b1fa2; }
        .tag.face_shape { background: #e8f5e9; color: #2e7d32; }
        .tag.use_case { background: #fff9c4; color: #f57f17; }
        .tag.vibe { background: #fce4ec; color: #c2185b; }
        .tag.lens { background: #e3f2fd; color: #1565c0; }
        .product-handle { font-family: monospace; font-size: 11px; color: #999; margin-top: 10px; }
        .check-buttons { margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee; }
        .check-buttons button { padding: 6px 12px; margin-right: 5px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer; font-size: 12px; }
        .check-buttons button:hover { background: #f5f5f5; }
        .check-buttons button.correct { background: #4caf50; color: white; border-color: #4caf50; }
        .check-buttons button.incorrect { background: #f44336; color: white; border-color: #f44336; }
    </style>
</head>
<body>
    <h1>✅ AZYR Tagged Products - Verification</h1>

    <div class="stats">
        <div class="stat-box">
            <h3>Total Tagged</h3>
            <div class="number">""" + str(len(verified)) + """</div>
        </div>
        <div class="stat-box">
            <h3>Need Review</h3>
            <div class="number">""" + str(len(needs_review)) + """</div>
        </div>
        <div class="stat-box">
            <h3>Completion</h3>
            <div class="number">""" + str(int(len(verified) / (len(verified) + len(needs_review)) * 100)) + """%</div>
        </div>
    </div>

    <h2>Successfully Tagged Products (""" + str(len(verified)) + """)</h2>
    <p style="color: #666; margin-bottom: 20px;">Review the frame style and click ✓ or ✗ to verify</p>

    <div class="products-grid">
""")

        for prod in verified:
            tags = prod['tags']
            f.write(f"""        <div class="product-card">
            <img src="{prod['image_src']}" class="product-image" alt="{prod['title']}">
            <div class="product-info">
                <div class="product-vendor">{prod['vendor']}</div>
                <h3 class="product-title">{prod['title']}</h3>
                <div class="product-handle">{prod['handle']}</div>

                <div class="tag-section">
                    <div class="tag-label">Frame Style</div>
                    {tags['style']}
                </div>

                <div class="tag-section">
                    <div class="tag-label">Material</div>
                    {tags['material']}
                </div>

                <div class="tag-section">
                    <div class="tag-label">Compatible Face Shapes</div>
                    {', '.join([f"<span class='tag face_shape'>{s}</span>" for s in tags['face_shapes'].split(', ')])}
                </div>

                <div class="check-buttons">
                    <button onclick="this.parentElement.parentElement.parentElement.style.border='2px solid #4caf50'">✓ Correct</button>
                    <button onclick="this.parentElement.parentElement.parentElement.style.opacity='0.5'">✗ Wrong</button>
                </div>
            </div>
        </div>
""")

        f.write("""    </div>

    <script>
        // Count verified products
        let verifiedCount = 0;
        document.querySelectorAll('.check-buttons button:first-child').forEach(btn => {
            btn.addEventListener('click', function() {
                if (!this.classList.contains('correct')) {
                    this.classList.add('correct');
                    verifiedCount++;
                    console.log('Verified:', verifiedCount);
                }
            });
        });
    </script>
</body>
</html>""")

    # Create Needs Review HTML
    with open('/Users/michaeldurante/ai dev/ce-hub/azy-quiz-app/VERIFICATION_UNTAGGED.html', 'w', encoding='utf-8') as f:
        f.write("""<!DOCTYPE html>
<html>
<head>
    <title>AZYR Products - Need Manual Tagging</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: #f5f5f5; }
        h1 { color: #1a1a1a; }
        .intro { background: #fff9c4; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #f57f17; }
        .products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 20px; }
        .product-card { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border: 2px solid transparent; }
        .product-card:hover { border-color: #f57f17; }
        .product-image { width: 100%; aspect-ratio: 1; object-fit: cover; background: #f0f0f0; }
        .product-info { padding: 15px; }
        .product-title { font-weight: 600; margin: 0 0 8px 0; font-size: 14px; line-height: 1.4; }
        .product-vendor { color: #666; font-size: 12px; margin-bottom: 10px; }
        .product-body { color: #888; font-size: 12px; margin-bottom: 15px; line-height: 1.4; }
        .product-handle { font-family: monospace; font-size: 11px; color: #999; margin-top: 10px; }
        .style-selector { margin: 15px 0; }
        .style-selector label { display: block; font-size: 12px; font-weight: 600; margin-bottom: 5px; }
        .style-buttons { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; }
        .style-btn { padding: 8px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer; font-size: 11px; }
        .style-btn:hover { background: #f5f5f5; }
        .style-btn.selected { background: #1976d2; color: white; border-color: #1976d2; }
        .export-area { margin-top: 20px; padding: 15px; background: white; border-radius: 8px; }
        .export-area button { padding: 10px 20px; background: #4caf50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; }
        .export-area button:hover { background: #45a049; }
    </style>
</head>
<body>
    <h1>⚠️ AZYR Products - Need Manual Tagging</h1>

    <div class="intro">
        <strong>Instructions:</strong> Look at each product image and select the correct frame style. These will be exported for you to add to Shopify.
    </div>

    <p><strong>""" + str(len(needs_review)) + """ products</strong> need manual classification</p>

    <div class="products-grid">
""")

        for prod in needs_review:
            f.write(f"""        <div class="product-card" data-handle="{prod['handle']}">
            <img src="{prod['image_src']}" class="product-image" alt="{prod['title']}">
            <div class="product-info">
                <div class="product-vendor">{prod['vendor']}</div>
                <h3 class="product-title">{prod['title']}</h3>
                <p class="product-body">{prod['body'][:150]}...</p>
                <div class="product-handle">{prod['handle']}</div>

                <div class="style-selector">
                    <label>Select Frame Style:</label>
                    <div class="style-buttons">
                        <button class="style-btn" onclick="selectStyle(this, '{prod['handle']}', 'aviator')">Aviator</button>
                        <button class="style-btn" onclick="selectStyle(this, '{prod['handle']}', 'cat_eye')">Cat-Eye</button>
                        <button class="style-btn" onclick="selectStyle(this, '{prod['handle']}', 'round')">Round</button>
                        <button class="style-btn" onclick="selectStyle(this, '{prod['handle']}', 'rectangle')">Rectangle</button>
                        <button class="style-btn" onclick="selectStyle(this, '{prod['handle']}', 'square')">Square</button>
                        <button class="style-btn" onclick="selectStyle(this, '{prod['handle']}', 'wayfarer')">Wayfarer</button>
                    </div>
                </div>
            </div>
        </div>
""")

        f.write("""    </div>

    <div class="export-area">
        <button onclick="exportSelections()">Export Selected Styles to CSV</button>
        <p id="export-status" style="margin-top: 10px; color: #666; font-size: 14px;"></p>
    </div>

    <script>
        const selections = {};

        function selectStyle(btn, handle, style) {
            const card = btn.closest('.product-card');
            card.querySelectorAll('.style-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selections[handle] = style;
            console.log('Selected', handle, 'as', style);
        }

        function exportSelections() {
            const csv = 'Handle,Style\\n';
            for (const [handle, style] of Object.entries(selections)) {
                csv += handle + ',' + style + '\\n';
            }

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'manual_styles.csv';
            a.click();

            document.getElementById('export-status').textContent =
                'Exported ' + Object.keys(selections).length + ' classifications!';
        }
    </script>
</body>
</html>""")

    print(f"✅ Created verification pages:")
    print(f"   - VERIFICATION_TAGGED.html ({len(verified)} products to verify)")
    print(f"   - VERIFICATION_UNTAGGED.html ({len(needs_review)} products to classify)")

if __name__ == '__main__':
    print("📖 Reading product data...")
    tagged = read_tagged_products()
    original = read_original_products()
    create_tagged_html(tagged, original)
