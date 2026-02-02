#!/usr/bin/env python3
"""
Convert AZYR verified tags export to Shopify import CSV
Usage: python convert_to_shopify_import.py <verified_tags.csv> <shopify_export.csv> <output.csv>
"""

import csv
import sys
from pathlib import Path

def read_verified_tags(csv_path):
    """Read the exported verified tags CSV"""
    tags = {}
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Handle both capitalized and lowercase column names
            handle = row.get('Handle') or row.get('handle', '')
            if not handle:
                continue

            # Get values with fallback for case differences
            get_val = lambda key: row.get(key) or row.get(key.lower(), '') or ''

            tags[handle] = {
                'style': get_val('Style'),
                'material': get_val('Material'),
                'face_shapes': get_val('Face Shapes').split('; ') if get_val('Face Shapes') else [],
                'use_cases': get_val('Use Cases').split('; ') if get_val('Use Cases') else [],
                'lens_types': get_val('Lens Types').split('; ') if get_val('Lens Types') else [],
                'status': get_val('Status')
            }
    return tags

def build_azyr_tags(tags_data):
    """Build AZYR tag string from tags data"""
    azyr_tags = []

    if tags_data['style']:
        azyr_tags.append(f"style:{tags_data['style']}")
    if tags_data['material']:
        azyr_tags.append(f"material:{tags_data['material']}")
    for fs in tags_data['face_shapes']:
        azyr_tags.append(f"face_shape:{fs}")
    for uc in tags_data['use_cases']:
        azyr_tags.append(f"use_case:{uc}")
    for lt in tags_data['lens_types']:
        azyr_tags.append(f"lens:{lt}")

    return ', '.join(azyr_tags)

def escape_csv(value):
    """Escape value for CSV output"""
    if not value:
        return ''
    value = str(value)
    if any(c in value for c in [',', '"', '\n']):
        return '"' + value.replace('"', '""') + '"'
    return value

def convert_to_shopify(verified_tags_path, shopify_export_path, output_path):
    """Convert verified tags to Shopify import format"""

    # Read verified tags
    print(f"📖 Reading verified tags from: {verified_tags_path}")
    verified_tags = read_verified_tags(verified_tags_path)
    print(f"   Found {len(verified_tags)} products with tags")

    # Read Shopify export and create handle lookup
    print(f"📖 Reading Shopify export from: {shopify_export_path}")
    shopify_products = {}
    with open(shopify_export_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames

        for row in reader:
            handle = row.get('Handle', '')
            if handle:
                if handle not in shopify_products:
                    shopify_products[handle] = []

                # Store all variants for this product
                shopify_products[handle].append(row)

    print(f"   Found {len(shopify_products)} products in Shopify export")

    # Write output CSV
    print(f"📝 Writing Shopify import CSV to: {output_path}")

    with open(output_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

        updated_count = 0
        for handle, variants in shopify_products.items():
            if handle in verified_tags:
                # Build new tags
                azyr_tags = build_azyr_tags(verified_tags[handle])

                for variant in variants:
                    existing_tags = variant.get('Tags', '')

                    # Combine existing tags with AZYR tags
                    if existing_tags and existing_tags.strip():
                        new_tags = f"{existing_tags}, {azyr_tags}"
                    else:
                        new_tags = azyr_tags

                    # Update the tags column
                    variant['Tags'] = new_tags

                    writer.writerow(variant)

                updated_count += 1
            else:
                # No tags for this product, write as-is
                for variant in variants:
                    writer.writerow(variant)

    print(f"\n✅ Conversion complete!")
    print(f"   Updated: {updated_count} products with AZYR tags")
    print(f"   Total rows: {sum(len(v) for v in shopify_products.values())}")
    print(f"\n📦 Import {output_path} into Shopify Admin > Products > Import")

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python convert_to_shopify_import.py <verified_tags.csv> <shopify_export.csv> [output.csv]")
        print("\nExample:")
        print("  python convert_to_shopify_import.py azyr_verified_tags_2025-02-02.csv products_export_1.csv shopify_import.csv")
        sys.exit(1)

    verified_tags_path = sys.argv[1]
    shopify_export_path = sys.argv[2]
    output_path = sys.argv[3] if len(sys.argv) > 3 else 'shopify_import.csv'

    convert_to_shopify(verified_tags_path, shopify_export_path, output_path)
