#!/usr/bin/env python3
"""
Shopify Product Tag Generator for AZYR
Processes exported CSV and generates quiz recommendation tags
"""

import csv
import re
from urllib.parse import quote

def generate_tags(title, description, existing_tags):
    """Generate quiz tags based on product title and description"""
    text = f"{title} {description}".lower()
    tags = []

    # Style detection
    if re.search(r'aviator|teardrop|pilot|double.bridge', text):
        tags.append('style:aviator')
    if re.search(r'cat.?eye|upswept', text):
        tags.append('style:cat_eye')
    if re.search(r'\bround\b|circle|circular', text):
        tags.append('style:round')
    if re.search(r'rectangle|rectangular', text):
        tags.append('style:rectangle')
    if re.search(r'square|boxy|geometric', text):
        tags.append('style:square')
    if re.search(r'wayfarer|trapezoid', text):
        tags.append('style:wayfarer')

    # Material detection
    if re.search(r'wire|metal|titanium|gold|silver|steel|bronze|copper', text):
        tags.append('material:wire')
    if re.search(r'acetate|plastic|tortoise|tortoise.shell|chunky|thick', text):
        tags.append('material:acetate')

    # Vibe detection
    if re.search(r'vintage|retro|80s|90s|70s|heritage', text):
        tags.append('vibe:retro')
    if re.search(r'modern|contemporary|minimal|minimalist', text):
        tags.append('vibe:modern')
    if re.search(r'luxury|premium|designer|high.end', text):
        tags.append('vibe:luxury')
    if re.search(r'edgy|bold|statement|dramatic', text):
        tags.append('vibe:edgy')
    if re.search(r'corporate|office|professional|business', text):
        tags.append('vibe:corporate')
    if re.search(r'trendy|fashion|stylish|chic', text):
        tags.append('vibe:trendy')
    if re.search(r'classic|timeless|elegant', text):
        tags.append('vibe:classic')
    if re.search(r'sport|athletic|performance', text):
        tags.append('vibe:athletic')

    # Lens detection
    if re.search(r'polarized', text):
        tags.append('lens:polarized')
    if re.search(r'prescription|rx|prescription.ready', text):
        tags.append('lens:rx')
    if re.search(r'blue.?light|computer|screen', text):
        tags.append('lens:blue_light')
    if re.search(r'tint|gradient|colored', text):
        tags.append('lens:tinted')
    if re.search(r'photochromic|transition', text):
        tags.append('lens:custom')

    # Face shape detection (default to versatile options if not specified)
    face_shapes = []
    if re.search(r'oval', text):
        face_shapes.append('face_shape:oval')
    if re.search(r'square|angular', text):
        face_shapes.extend(['face_shape:oval', 'face_shape:round', 'face_shape:heart'])
    if re.search(r'round', text):
        face_shapes.extend(['face_shape:square', 'face_shape:heart', 'face_shape:oval'])
    if re.search(r'heart', text):
        face_shapes.extend(['face_shape:oval', 'face_shape:square'])

    # Add default face shapes if none detected
    if not face_shapes:
        face_shapes = ['face_shape:oval', 'face_shape:heart', 'face_shape:square']

    tags.extend(face_shapes)

    return tags

def has_quiz_tags(tags_string):
    """Check if product already has quiz tags"""
    if not tags_string:
        return False
    quiz_tags = ['style:', 'material:', 'vibe:', 'face_shape:', 'lens:']
    return any(tag in tags_string for tag in quiz_tags)

def main():
    input_file = '/Users/michaeldurante/Downloads/products_export_1.csv'
    output_md = '/Users/michaeldurante/ai dev/ce-hub/azy-quiz-app/product-database/AZYR-Product-Tags.md'
    output_csv = '/Users/michaeldurante/ai dev/ce-hub/azy-quiz-app/product-database/AZYR-Product-Tags.csv'

    products = []

    print("📖 Reading CSV file...")

    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Skip image rows
            if not row.get('Handle') or row.get('Handle').startswith('structured-field') and row.get('Variant SKU') == '':
                continue

            # Skip if not a main product row (has empty Title)
            if not row.get('Title'):
                continue

            handle = row['Handle']
            title = row['Title']
            description = row.get('Body (HTML)', '')
            existing_tags = row.get('Tags', '')
            vendor = row.get('Vendor', '')
            status = row.get('Status', 'active')

            # Skip if draft/inactive
            if status == 'draft' or status == 'archived':
                continue

            products.append({
                'handle': handle,
                'title': title,
                'description': description,
                'existing_tags': existing_tags,
                'vendor': vendor,
                'status': status
            })

    print(f"✅ Found {len(products)} active products")
    print("🏷️  Generating quiz tags...")

    # Generate markdown output
    markdown = """# AZYR Product Tagging Reference

*Generated: {}*
*Total Products: {}*

---

## 📋 How to Use This Reference

1. Open your Shopify Admin → Products
2. Find the product by name or Ctrl+F search
3. Copy the tags from the "Suggested Tags" section
4. Paste into the product's Tags field
5. Save

---

## Products Needing Quiz Tags

"""

    needs_tagging = []
    already_tagged = []

    for product in products:
        if not has_quiz_tags(product['existing_tags']):
            suggested_tags = generate_tags(product['title'], product['description'], product['existing_tags'])
            product['suggested_tags'] = suggested_tags
            needs_tagging.append(product)
        else:
            already_tagged.append(product)

    # Add products needing tagging
    for i, product in enumerate(needs_tagging, 1):
        shopify_url = f"https://azyrspecs.com/products/{product['handle']}"
        admin_search_url = f"https://azyrspecs.com/admin/search?q={quote(product['title'])}"

        markdown += f"""### {i}. {product['title']}

**Vendor:** {product['vendor']}

**🔗 View Product:** [Shopify Page]({shopify_url}) | [Search in Admin]({admin_search_url})

**🏷️ Suggested Tags (copy-paste):**
```
{chr(10).join(product['suggested_tags'])}
```

**Existing Tags:** {product['existing_tags'] or 'None'}

---

"""

    # Add already tagged section
    if already_tagged:
        markdown += f"\n## ✅ Already Have Quiz Tags ({len(already_tagged)})\n\n"
        for product in already_tagged:
            quiz_tags = [t.strip() for t in product['existing_tags'].split(',')
                        if any(prefix in t for prefix in ['style:', 'material:', 'vibe:', 'face_shape:', 'lens:'])]
            markdown += f"- **{product['title']}** - `{', '.join(quiz_tags[:5])}...`\n"

    # Write markdown file
    with open(output_md, 'w', encoding='utf-8') as f:
        f.write(markdown)

    # Generate CSV for easy import
    csv_header = ['Product Name', 'Shopify URL', 'Search in Admin', 'Status', 'Suggested Tags']
    csv_lines = [','.join(csv_header)]

    for product in needs_tagging:
        shopify_url = f"https://azyrspecs.com/products/{product['handle']}"
        admin_search_url = f"https://azyrspecs.com/admin/search?q={quote(product['title'])}"
        tags = ' | '.join(product['suggested_tags'])

        csv_lines.append(f'"{product["title"]}","{shopify_url}","{admin_search_url}","NEEDS TAGGING","{tags}"')

    with open(output_csv, 'w', encoding='utf-8') as f:
        f.write('\n'.join(csv_lines))

    print(f"\n✅ Generated files:")
    print(f"   📄 Markdown: {output_md}")
    print(f"   📊 CSV: {output_csv}")
    print(f"\n📊 Summary:")
    print(f"   Total Products: {len(products)}")
    print(f"   Need Tagging: {len(needs_tagging)}")
    print(f"   Already Tagged: {len(already_tagged)}")
    print(f"\n🚀 Open the markdown file to start tagging!")

if __name__ == '__main__':
    main()
