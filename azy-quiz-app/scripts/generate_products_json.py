#!/usr/bin/env python3
"""
Generate products.json from Shopify export
"""
import csv
import json

def main():
    # Read tags
    tags = {}
    with open('tagged_products.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            handle = row.get('handle', '')
            if not handle:
                continue
            tags[handle] = {
                'style': row.get('style', ''),
                'material': row.get('material', ''),
                'face_shapes': row.get('face_shapes', '').split(',') if row.get('face_shapes') else [],
                'use_cases': row.get('use_cases', '').split(',') if row.get('use_cases') else [],
                'lens_types': row.get('lens_types', '').split(',') if row.get('lens_types') else [],
            }

    # Read products - only take first row per handle
    products = {}
    with open('public/products_export.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            handle = row.get('Handle', '')
            if not handle or handle in products:
                continue

            # Only add if we have tags for this product
            if handle in tags:
                products[handle] = {
                    'handle': handle,
                    'title': row.get('Title', ''),
                    'vendor': row.get('Vendor', ''),
                    'image': row.get('Image Src', ''),
                    **tags[handle]
                }

    # Convert to list
    products_list = list(products.values())

    # Write JSON
    with open('public/products.json', 'w', encoding='utf-8') as f:
        json.dump(products_list, f, indent=2)

    print(f"Generated products.json with {len(products_list)} products")

if __name__ == '__main__':
    main()
