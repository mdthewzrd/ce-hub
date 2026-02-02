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
    with open('/Users/michaeldurante/Downloads/products_export_1.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            handle = row.get('Handle', '')
            title = row.get('Title', '')
            image_src = row.get('Image Src', '')

            # Skip rows without a handle or title
            if not handle or not title:
                continue

            # Initialize product if not exists
            if handle not in products:
                products[handle] = {
                    'handle': handle,
                    'title': title,
                    'vendor': row.get('Vendor', ''),
                    'images': [],  # Will collect all images
                    'body_html': row.get('Body (HTML)', ''),
                    'type': row.get('Type', ''),
                    'tags': row.get('Tags', ''),
                    'variant_sku': row.get('Variant SKU', ''),
                    'variant_price': row.get('Variant Price', ''),
                    'variant_compare_at_price': row.get('Variant Compare At Price', ''),
                    'status': row.get('Status', 'active'),
                }

            # Collect all images for this product
            if image_src and image_src not in products[handle]['images']:
                products[handle]['images'].append(image_src)

    # Set image_src to first image for backward compatibility
    for handle in products:
        if products[handle]['images']:
            products[handle]['image_src'] = products[handle]['images'][0]
        else:
            products[handle]['image_src'] = ''
            products[handle]['images'] = ['']

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
    <title>CE-Hub | AZYR Product Tag Review</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        :root {
            --bg-primary: #0a0a0f;
            --bg-secondary: #13131a;
            --bg-card: #1a1a24;
            --border-color: #2a2a3a;
            --text-primary: #f0f0f0;
            --text-secondary: #a0a0b0;
            --accent-primary: #00dc82;
            --accent-secondary: #7c3aed;
            --accent-tertiary: #f59e0b;
            --sync-green: #22c55e;
            --sync-yellow: #eab308;
            --sync-red: #ef4444;
        }

        * { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 20px;
            background: var(--bg-primary);
            color: var(--text-primary);
            margin: 0;
        }

        .top-nav {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: var(--bg-secondary);
            padding: 16px 24px;
            border-radius: 12px;
            margin-bottom: 20px;
            border: 1px solid var(--border-color);
        }

        .nav-left {
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .nav-brand {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .nav-brand h1 {
            margin: 0;
            font-size: 20px;
            font-weight: 700;
            background: linear-gradient(135deg, #00dc82 0%, #7c3aed 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .nav-brand .badge {
            background: var(--bg-card);
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            color: var(--text-secondary);
            border: 1px solid var(--border-color);
        }

        .nav-link {
            color: var(--text-secondary);
            text-decoration: none;
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s;
            background: var(--bg-card);
            border: 1px solid var(--border-color);
        }

        .nav-link:hover {
            background: rgba(0, 220, 130, 0.1);
            color: var(--accent-primary);
            border-color: var(--accent-primary);
        }

        .sync-indicator {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            background: var(--bg-card);
            border-radius: 8px;
            border: 1px solid var(--border-color);
        }

        .sync-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }

        .sync-dot.green { background: var(--sync-green); box-shadow: 0 0 10px var(--sync-green); }
        .sync-dot.yellow { background: var(--sync-yellow); box-shadow: 0 0 10px var(--sync-yellow); animation: pulse 0.5s infinite; }
        .sync-dot.red { background: var(--sync-red); box-shadow: 0 0 10px var(--sync-red); }

        .sync-text {
            font-size: 13px;
            color: var(--text-secondary);
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        .header {
            background: linear-gradient(135deg, #00dc82 0%, #7c3aed 100%);
            color: white;
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 20px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0, 220, 130, 0.2);
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
            background: var(--bg-card);
            padding: 16px;
            border-radius: 8px;
            text-align: center;
            border: 1px solid var(--border-color);
        }
        .stat-box h3 { margin: 0; font-size: 11px; color: var(--text-secondary); text-transform: uppercase; }
        .stat-box .number { font-size: 24px; font-weight: bold; color: var(--text-primary); }

        .filters { background: var(--bg-card); padding: 16px; border-radius: 8px; margin-bottom: 16px; border: 1px solid var(--border-color); }
        .filters h2 { margin: 0 0 12px 0; font-size: 16px; }
        .filter-buttons { display: flex; gap: 8px; flex-wrap: wrap; }
        .filter-btn {
            padding: 8px 16px;
            border: 1px solid var(--border-color);
            background: var(--bg-secondary);
            color: var(--text-primary);
            border-radius: 20px;
            cursor: pointer;
            font-size: 13px;
            transition: all 0.2s;
        }
        .filter-btn:hover { background: var(--accent-primary); color: white; border-color: var(--accent-primary); }
        .filter-btn.active { background: var(--accent-primary); color: white; border-color: var(--accent-primary); }

        .sort-section { background: var(--bg-card); padding: 16px; border-radius: 8px; margin-bottom: 16px; border: 1px solid var(--border-color); }
        .sort-section h2 { margin: 0 0 12px 0; font-size: 16px; }
        .sort-buttons { display: flex; gap: 8px; flex-wrap: wrap; }
        .sort-btn {
            padding: 8px 16px;
            border: 1px solid var(--border-color);
            background: var(--bg-secondary);
            color: var(--text-primary);
            border-radius: 20px;
            cursor: pointer;
            font-size: 13px;
            transition: all 0.2s;
        }
        .sort-btn:hover { background: var(--accent-tertiary); color: white; border-color: var(--accent-tertiary); }
        .sort-btn.active { background: var(--accent-tertiary); color: white; border-color: var(--accent-tertiary); }

        .products-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
            gap: 16px;
        }

        .product-card {
            background: var(--bg-card);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            border: 1px solid var(--border-color);
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .product-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.4);
        }

        .product-image-container {
            position: relative;
            width: 100%;
            aspect-ratio: 1;
            background: var(--bg-secondary);
            overflow: hidden;
        }

        .product-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: opacity 0.2s ease;
        }

        .image-nav-arrow {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(0, 0, 0, 0.7);
            color: white;
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            opacity: 0;
            transition: all 0.2s ease;
            z-index: 10;
            user-select: none;
        }

        .image-nav-arrow:hover {
            background: rgba(0, 220, 130, 0.8);
            transform: translateY(-50%) scale(1.1);
        }

        .image-nav-arrow:active {
            transform: translateY(-50%) scale(0.95);
        }

        .product-image-container:hover .image-nav-arrow {
            opacity: 1;
        }

        .image-nav-arrow.prev {
            left: 10px;
        }

        .image-nav-arrow.next {
            right: 10px;
        }

        .image-counter {
            position: absolute;
            bottom: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            opacity: 0;
            transition: opacity 0.2s ease;
        }

        .product-image-container:hover .image-counter {
            opacity: 1;
        }

        .image-counter.always-visible {
            opacity: 1;
        }

        /* Show arrows on mobile by default */
        @media (max-width: 768px) {
            .image-nav-arrow {
                opacity: 1;
                width: 36px;
                height: 36px;
                font-size: 18px;
            }
            .image-counter {
                opacity: 1;
            }
        }

        .product-info { padding: 16px; }
        .product-vendor { font-size: 11px; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 4px; }
        .product-title { font-weight: 600; margin: 0 0 4px 0; font-size: 15px; line-height: 1.3; color: var(--text-primary); }
        .product-handle { font-family: monospace; font-size: 10px; color: var(--text-secondary); margin-bottom: 12px; }

        .tag-section {
            margin: 12px 0;
            padding: 12px;
            background: var(--bg-secondary);
            border-radius: 8px;
            border: 1px solid var(--border-color);
        }

        .tag-label {
            font-size: 11px;
            font-weight: 700;
            color: var(--text-secondary);
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
            border: 2px solid var(--border-color);
            background: var(--bg-secondary);
            color: var(--text-primary);
            border-radius: 20px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
            transition: all 0.15s;
            position: relative;
        }

        .option-btn:hover { border-color: var(--accent-primary); transform: scale(1.02); }

        .option-btn.pending {
            border: 3px dashed #ff9800;
            background: rgba(255, 152, 0, 0.15);
            color: #ff9800;
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
            border: 3px solid #22c55e;
            background: rgba(34, 197, 94, 0.2);
            color: #22c55e;
            font-weight: 700;
            box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.3);
        }

        .option-btn.selected::after {
            content: '✓';
            position: absolute;
            top: -6px;
            right: -6px;
            background: #22c55e;
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
        .option-btn.style { background: rgba(245, 158, 11, 0.1); border-color: rgba(245, 158, 11, 0.3); }
        .option-btn.style.selected { border-color: #f59e0b; background: rgba(245, 158, 11, 0.2); }
        .option-btn.style.selected::after { background: #f59e0b; }

        .option-btn.material { background: rgba(124, 58, 237, 0.1); border-color: rgba(124, 58, 237, 0.3); }
        .option-btn.material.selected { border-color: #7c3aed; background: rgba(124, 58, 237, 0.2); }
        .option-btn.material.selected::after { background: #7c3aed; }

        .option-btn.face-shape { background: rgba(34, 197, 94, 0.1); border-color: rgba(34, 197, 94, 0.3); }
        .option-btn.face-shape.selected { border-color: #22c55e; background: rgba(34, 197, 94, 0.2); }
        .option-btn.face-shape.selected::after { background: #22c55e; }

        .option-btn.use-case { background: rgba(251, 146, 60, 0.1); border-color: rgba(251, 146, 60, 0.3); }
        .option-btn.use-case.selected { border-color: #fb923c; background: rgba(251, 146, 60, 0.2); }
        .option-btn.use-case.selected::after { background: #fb923c; }

        .option-btn.lens { background: rgba(59, 130, 246, 0.1); border-color: rgba(59, 130, 246, 0.3); }
        .option-btn.lens.selected { border-color: #3b82f6; background: rgba(59, 130, 246, 0.2); }
        .option-btn.lens.selected::after { background: #3b82f6; }

        .custom-btn {
            background: rgba(245, 158, 11, 0.15);
            border-color: #f59e0b;
            color: #f59e0b;
            font-weight: 600;
            border-style: dashed;
        }

        .custom-input-container {
            display: none;
            width: 100%;
            margin-top: 10px;
            padding: 10px;
            background: var(--bg-secondary);
            border-radius: 8px;
            border: 2px dashed var(--accent-tertiary);
        }
        .custom-input-container.show { display: block; }

        .custom-input-container input {
            width: 100%;
            padding: 10px;
            border: 1px solid var(--border-color);
            border-radius: 6px;
            font-size: 13px;
            margin-bottom: 8px;
            background: var(--bg-card);
            color: var(--text-primary);
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
        .btn-save { background: #22c55e; color: white; }
        .btn-cancel { background: #ef4444; color: white; }

        .custom-trigger {
            background: rgba(245, 158, 11, 0.2) !important;
            border-color: #f59e0b !important;
            color: #f59e0b !important;
            border-style: dashed;
        }

        .custom-input-section {
            display: none;
            width: 100%;
            margin-top: 10px;
            padding: 10px;
            background: var(--bg-secondary);
            border-radius: 8px;
            border: 2px dashed #f59e0b;
        }

        .custom-input-section.show { display: block; }

        .custom-input {
            width: 100%;
            padding: 10px;
            border: 1px solid var(--border-color);
            border-radius: 6px;
            font-size: 13px;
            margin-bottom: 8px;
            background: var(--bg-card);
            color: var(--text-primary);
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
        .btn-custom-save { background: #22c55e; color: white; }
        .btn-custom-cancel { background: #ef4444; color: white; }

        .save-changes-section {
            margin-top: 16px;
            padding: 12px;
            background: rgba(34, 197, 94, 0.15);
            border-radius: 8px;
            border: 2px solid #22c55e;
            display: none;
        }

        .save-changes-section.show {
            display: block;
        }

        .btn-save-changes {
            width: 100%;
            padding: 12px;
            background: #22c55e;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
        }
        .btn-save-changes:hover { background: #16a34a; }

        .has-changes-badge {
            display: inline-block;
            background: #f59e0b;
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
            border-top: 1px solid var(--border-color);
        }

        .btn-done {
            width: 100%;
            padding: 12px;
            background: var(--accent-secondary);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
        }
        .btn-done:hover { background: #6d28d9; }

        .export-section {
            position: sticky;
            bottom: 16px;
            background: var(--bg-card);
            padding: 16px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.4);
            border: 1px solid var(--border-color);
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

        .btn-primary { background: var(--accent-primary); color: white; }
        .btn-secondary { background: var(--accent-secondary); color: white; }
        .btn-info { background: #ec4899; color: white; }

        .hidden { display: none; }

        @keyframes slideIn {
            from {
                transform: translateY(100px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }

        /* Floating Reference Button */
        .reference-fab {
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
            border-radius: 50%;
            box-shadow: 0 4px 20px rgba(0, 220, 130, 0.4);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            z-index: 1000;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: 3px solid var(--bg-primary);
        }

        .reference-fab:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 30px rgba(0, 220, 130, 0.6);
        }

        .reference-fab:active {
            transform: scale(0.95);
        }

        /* Reference Modal */
        .reference-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 1001;
            padding: 20px;
            overflow-y: auto;
            animation: fadeIn 0.2s ease;
        }

        .reference-modal.active {
            display: flex;
            align-items: flex-start;
            justify-content: center;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .reference-modal-content {
            background: var(--bg-secondary);
            border-radius: 16px;
            max-width: 1200px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            border: 1px solid var(--border-color);
            animation: slideUp 0.3s ease;
            margin-top: 20px;
        }

        @keyframes slideUp {
            from {
                transform: translateY(50px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }

        .reference-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 24px;
            border-bottom: 1px solid var(--border-color);
            position: sticky;
            top: 0;
            background: var(--bg-secondary);
            z-index: 10;
        }

        .reference-modal-header h2 {
            font-size: 24px;
            font-weight: 700;
            margin: 0;
            background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .reference-close-btn {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            color: var(--text-primary);
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }

        .reference-close-btn:hover {
            background: var(--accent-tertiary);
            border-color: var(--accent-tertiary);
            color: white;
        }

        .reference-modal-body {
            padding: 24px;
        }

        .reference-section {
            margin-bottom: 32px;
        }

        .reference-section:last-child {
            margin-bottom: 0;
        }

        .reference-section-title {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 16px;
            color: var(--accent-primary);
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .reference-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 16px;
        }

        .reference-item {
            background: var(--bg-card);
            border-radius: 10px;
            padding: 16px;
            border: 1px solid var(--border-color);
        }

        .reference-item-title {
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .reference-item-title.style { color: var(--accent-primary); }
        .reference-item-title.lens { color: var(--accent-tertiary); }
        .reference-item-title.usecase { color: var(--accent-secondary); }

        .reference-item-content {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }

        .reference-tag {
            background: rgba(0, 220, 130, 0.15);
            color: var(--accent-primary);
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            border: 1px solid rgba(0, 220, 130, 0.3);
        }

        .reference-tag.lens {
            background: rgba(245, 158, 11, 0.15);
            color: var(--accent-tertiary);
            border-color: rgba(245, 158, 11, 0.3);
        }

        .reference-tag.usecase {
            background: rgba(124, 58, 237, 0.15);
            color: var(--accent-secondary);
            border-color: rgba(124, 58, 237, 0.3);
        }

        /* Custom scrollbar for modal */
        .reference-modal-content::-webkit-scrollbar {
            width: 8px;
        }

        .reference-modal-content::-webkit-scrollbar-track {
            background: var(--bg-primary);
        }

        .reference-modal-content::-webkit-scrollbar-thumb {
            background: var(--border-color);
            border-radius: 4px;
        }

        .reference-modal-content::-webkit-scrollbar-thumb:hover {
            background: var(--accent-primary);
        }

        @media (max-width: 768px) {
            .reference-fab {
                width: 50px;
                height: 50px;
                font-size: 24px;
                bottom: 20px;
                right: 20px;
            }

            .reference-modal-content {
                margin: 10px;
                max-height: 95vh;
            }

            .reference-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="top-nav">
        <div class="nav-left">
            <div class="nav-brand">
                <h1>CE-Hub</h1>
                <span class="badge">AZYR Review</span>
            </div>
        </div>
        <div class="sync-indicator">
            <span class="sync-dot green" id="sync-dot"></span>
            <span class="sync-text" id="sync-text">Synced</span>
        </div>
    </div>

    <div class="header">
        <h1>👓 Product Tag Review</h1>
        <p>Click options to select/deselect (orange = pending). Click "Save Changes" to confirm. <strong>Changes auto-sync every 30 seconds - you and teammates will see each other's updates!</strong></p>
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
            <h3>Saved ✓</h3>
            <div class="number" id="saved-count">0</div>
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

    <div class="sort-section">
        <h2>📊 Sort (for team coordination):</h2>
        <div class="sort-buttons">
            <button class="sort-btn active" onclick="sortProducts('default')">Default</button>
            <button class="sort-btn" onclick="sortProducts('az')">A-Z (Start from top)</button>
            <button class="sort-btn" onclick="sortProducts('za')">Z-A (Start from bottom)</button>
            <button class="sort-btn" onclick="sortProducts('reviewed')">Reviewed First</button>
            <button class="sort-btn" onclick="sortProducts('unreviewed')">Unreviewed First</button>
        </div>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #666;">
            💡 Tip: One person sorts A-Z, another sorts Z-A to work from opposite ends simultaneously!
        </p>
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

            # Prepare images array for JavaScript
            images_json = json.dumps(prod['images'])
            image_count = len([img for img in prod['images'] if img])

            f.write(f"""        <div class="product-card" data-handle="{handle}" data-reviewed="no">
            <div class="product-image-container" data-handle="{handle}" data-current-index="0">
                <img src="{prod['image_src']}" class="product-image" alt="{prod['title']}" data-index="0">
                <button class="image-nav-arrow prev" onclick="navigateImage(event, '{handle}', -1)"&#8249;</button>
                <button class="image-nav-arrow next" onclick="navigateImage(event, '{handle}', 1)"&#8250;</button>
                <div class="image-counter{' always-visible' if image_count > 1 else ''}">1/{image_count}</div>
            </div>
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
            <li>Run the conversion script: <code>python scripts/convert_to_shopify_import.py exported.csv products_export_1.csv shopify_import.csv</code></li>
            <li>Import <code>shopify_import.csv</code> in Shopify Admin → Products → Import</li>
        </ol>
        <p style="background: #e3f2fd; padding: 12px; border-radius: 6px; font-size: 13px;">
            <strong>💡 Pro tip:</strong> Tags auto-sync between users! When you save, Maureen will see your updates within 10 seconds (and vice versa).
        </p>
        <button onclick="document.getElementById('export-info').style.display='none'" style="padding: 10px 20px; background: #4caf50; color: white; border: none; border-radius: 6px; cursor: pointer;">Got it!</button>
    </div>

    <script>
        const productTags = {};      // Saved tags (green)
        const pendingTags = {};       // Pending changes (orange)
        const reviewedProducts = new Set();
        const productImages = {};     // Store all images for each product

        // Initialize images
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

        # Add images data
        for handle, prod in products.items():
            images = prod.get('images', [])
            if images and len(images) > 0:
                f.write(f"        productImages['{handle}'] = {json.dumps(images)};\n")

        f.write("""
        // DEBUG: Log when script starts
        console.log('🟢 Script loaded, document.readyState:', document.readyState);
        console.log('🟢 productTags entries:', Object.keys(productTags).length);

        // Image navigation function
        function navigateImage(event, handle, direction) {
            event.stopPropagation();
            event.preventDefault();

            const container = document.querySelector(`.product-image-container[data-handle="${handle}"]`);
            if (!container) return;

            const images = productImages[handle] || [];
            if (images.length <= 1) return; // No navigation needed for single image

            let currentIndex = parseInt(container.dataset.currentIndex) || 0;
            const newIndex = (currentIndex + direction + images.length) % images.length;

            // Update image
            const img = container.querySelector('.product-image');
            if (img && images[newIndex]) {
                img.style.opacity = '0';
                setTimeout(() => {
                    img.src = images[newIndex];
                    img.dataset.index = newIndex;
                    img.style.opacity = '1';
                }, 100);
            }

            // Update counter
            const counter = container.querySelector('.image-counter');
            if (counter) {
                counter.textContent = `${newIndex + 1}/${images.length}`;
            }

            // Update current index
            container.dataset.currentIndex = newIndex;
        }

        // Initialize selected state - runs immediately if DOM is ready, or waits for DOMContentLoaded
        function initializeSelectedState() {
            console.log('🟢 initializeSelectedState() called, tags to initialize:', Object.keys(productTags).length);
            Object.keys(productTags).forEach(handle => {
                const tags = productTags[handle];

                // Frame style (single)
                if (tags.style) {
                    const btn = document.querySelector(`[data-handle="${handle}"] .option-btn.style[data-value="${tags.style}"]`);
                    if (btn) {
                        btn.classList.add('selected');
                        console.log(`   ✅ ${handle}: style=${tags.style}`);
                    } else {
                        console.warn(`   ❌ ${handle}: style=${tags.style} but button not found`);
                    }
                }

                // Material (single)
                if (tags.material) {
                    const btn = document.querySelector(`[data-handle="${handle}"] .option-btn.material[data-value="${tags.material}"]`);
                    if (btn) {
                        btn.classList.add('selected');
                        console.log(`   ✅ ${handle}: material=${tags.material}`);
                    } else {
                        console.warn(`   ❌ ${handle}: material=${tags.material} but button not found`);
                    }
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
        }

        // Call initialization immediately if DOM is ready, otherwise wait for DOMContentLoaded
        console.log('🟢 Checking document.readyState:', document.readyState);
        if (document.readyState === 'loading') {
            console.log('🟢 Waiting for DOMContentLoaded...');
            document.addEventListener('DOMContentLoaded', initializeSelectedState);
        } else {
            // DOM is already ready, initialize immediately
            console.log('🟢 DOM already ready, initializing immediately!');
            initializeSelectedState();
        }

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

                // Update saved count
                updateSavedCount();

                // Save to localStorage for persistence
                localStorage.setItem('azyrProductTags', JSON.stringify(productTags));

                // Sync to cloud (API)
                updateSyncStatus('syncing');
                saveTagsToAPI().then(success => {
                    if (success) {
                        updateSyncStatus('synced');
                    } else {
                        updateSyncStatus('error');
                    }
                });

                console.log(`Saved changes for ${handle}`);
            }
        }

        function updateSavedCount() {
            const savedCount = Object.keys(productTags).length;
            document.getElementById('saved-count').textContent = savedCount;
        }

        // Load saved progress from localStorage on page load
        function loadSavedProgress() {
            const saved = localStorage.getItem('azyrProductTags');
            if (saved) {
                try {
                    const savedTags = JSON.parse(saved);
                    Object.assign(productTags, savedTags);
                    Object.keys(savedTags).forEach(handle => {
                        ['style', 'material', 'face_shapes', 'use_cases', 'lens_types'].forEach(cat => {
                            updateUI(handle, cat);
                        });
                    });
                    updateSavedCount();
                    console.log('Loaded saved progress from localStorage');
                } catch(e) {
                    console.error('Failed to load saved progress:', e);
                }
            }
        }

        // Call loadSavedProgress on page load
        setTimeout(loadSavedProgress, 100);

        // ========== REAL-TIME SYNC FUNCTIONS ==========

        let lastSyncTime = Date.now();
        const SYNC_INTERVAL = 30000; // Check for updates every 30 seconds

        // Load tags from API (cloud sync)
        async function loadTagsFromAPI() {
            try {
                showSyncStatus('Loading cloud tags...');
                const response = await fetch('/api/tags');
                if (response.ok) {
                    const cloudTags = await response.json();

                    // Merge cloud tags with local (cloud takes precedence for conflicts)
                    let mergedCount = 0;
                    Object.keys(cloudTags).forEach(handle => {
                        if (cloudTags[handle]) {
                            productTags[handle] = productTags[handle] || {};

                            // Merge each category
                            ['style', 'material', 'face_shapes', 'use_cases', 'lens_types'].forEach(cat => {
                                if (cloudTags[handle][cat]) {
                                    // Only update if different
                                    const current = JSON.stringify(productTags[handle][cat]);
                                    const incoming = JSON.stringify(cloudTags[handle][cat]);
                                    if (current !== incoming) {
                                        productTags[handle][cat] = cloudTags[handle][cat];
                                        mergedCount++;
                                        // Update UI for this product
                                        updateUI(handle, cat);
                                    }
                                }
                            });
                        }
                    });

                    updateSavedCount();
                    lastSyncTime = Date.now();

                    if (mergedCount > 0) {
                        showSyncStatus(`Synced ${mergedCount} updates from cloud ✓`);
                        setTimeout(() => hideSyncStatus(), 3000);
                    } else {
                        showSyncStatus('All synced with cloud ✓');
                        setTimeout(() => hideSyncStatus(), 2000);
                    }
                }
            } catch (error) {
                console.error('Failed to load from API:', error);
                showSyncStatus('Cloud sync unavailable');
                setTimeout(() => hideSyncStatus(), 3000);
            }
        }

        // Save tags to API (cloud sync)
        async function saveTagsToAPI() {
            try {
                const response = await fetch('/api/tags', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(productTags)
                });

                if (response.ok) {
                    lastSyncTime = Date.now();
                    return true;
                } else {
                    console.error('Failed to save to API');
                    return false;
                }
            } catch (error) {
                console.error('Failed to save to API:', error);
                return false;
            }
        }

        // Check for updates from other users
        async function checkForUpdates() {
            try {
                const response = await fetch('/api/tags');
                if (response.ok) {
                    const cloudTags = await response.json();
                    const cloudHash = JSON.stringify(cloudTags);
                    const localHash = JSON.stringify(productTags);

                    if (cloudHash !== localHash) {
                        // Updates available!
                        showSyncStatus('🆕 New updates from team! Loading...');
                        await loadTagsFromAPI();
                    } else {
                        showSyncStatus('All synced ✓');
                        setTimeout(() => hideSyncStatus(), 1500);
                    }
                }
            } catch (error) {
                console.error('Failed to check for updates:', error);
            }
        }

        // Show sync status message
        function showSyncStatus(message) {
            const dot = document.getElementById('sync-dot');
            const text = document.getElementById('sync-text');

            if (message.includes('Syncing') || message.includes('Loading')) {
                dot.className = 'sync-dot yellow';
                text.textContent = 'Syncing...';
            } else if (message.includes('error') || message.includes('failed') || message.includes('unavailable')) {
                dot.className = 'sync-dot red';
                text.textContent = 'Sync Error';
            } else {
                dot.className = 'sync-dot green';
                text.textContent = 'Synced';
            }
        }

        function hideSyncStatus() {
            // Keep showing the synced status
        }

        function updateSyncStatus(status) {
            const dot = document.getElementById('sync-dot');
            const text = document.getElementById('sync-text');

            if (status === 'syncing') {
                dot.className = 'sync-dot yellow';
                text.textContent = 'Syncing...';
            } else if (status === 'error') {
                dot.className = 'sync-dot red';
                text.textContent = 'Sync Error';
            } else {
                dot.className = 'sync-dot green';
                text.textContent = 'Synced';
            }
        }

        // Start periodic sync
        function startPeriodicSync() {
            // Load from API on page load
            loadTagsFromAPI();

            // Check for updates periodically
            setInterval(checkForUpdates, SYNC_INTERVAL);
        }

        // Initialize sync
        setTimeout(startPeriodicSync, 500);

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

        function sortProducts(sortType) {
            document.querySelectorAll('.sort-btn').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');

            const grid = document.getElementById('products-grid');
            const cards = Array.from(document.querySelectorAll('.product-card'));

            cards.sort((a, b) => {
                const titleA = a.querySelector('.product-title').textContent.trim();
                const titleB = b.querySelector('.product-title').textContent.trim();
                const reviewedA = a.getAttribute('data-reviewed') === 'yes';
                const reviewedB = b.getAttribute('data-reviewed') === 'yes';

                switch(sortType) {
                    case 'az':
                        return titleA.localeCompare(titleB);
                    case 'za':
                        return titleB.localeCompare(titleA);
                    case 'reviewed':
                        if (reviewedA && !reviewedB) return -1;
                        if (!reviewedA && reviewedB) return 1;
                        return 0;
                    case 'unreviewed':
                        if (!reviewedA && reviewedB) return -1;
                        if (reviewedA && !reviewedB) return 1;
                        return 0;
                    default:
                        return 0;
                }
            });

            // Reappend cards in new order
            cards.forEach(card => grid.appendChild(card));
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

        // Reference Modal Functions
        function openReferenceModal() {
            document.getElementById('reference-modal').classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeReferenceModal() {
            document.getElementById('reference-modal').classList.remove('active');
            document.body.style.overflow = '';
        }

        // Close modal on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeReferenceModal();
            }
        });

        // Close modal when clicking outside
        document.getElementById('reference-modal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeReferenceModal();
            }
        });
    </script>

    <!-- Floating Reference Button -->
    <div class="reference-fab" onclick="openReferenceModal()" title="Open Reference Guide">
        📚
    </div>

    <!-- Reference Modal -->
    <div class="reference-modal" id="reference-modal">
        <div class="reference-modal-content">
            <div class="reference-modal-header">
                <h2>📚 Tagging Reference Guide</h2>
                <button class="reference-close-btn" onclick="closeReferenceModal()">&times;</button>
            </div>
            <div class="reference-modal-body">
                <!-- Frame Styles to Face Shapes -->
                <div class="reference-section">
                    <div class="reference-section-title">👓 Frame Styles → Compatible Face Shapes</div>
                    <div class="reference-grid">
                        <div class="reference-item">
                            <div class="reference-item-title style">✈️ Aviator</div>
                            <div class="reference-item-content">
                                <span class="reference-tag">Heart</span>
                                <span class="reference-tag">Oval</span>
                                <span class="reference-tag">Square</span>
                                <span class="reference-tag">Diamond</span>
                            </div>
                        </div>
                        <div class="reference-item">
                            <div class="reference-item-title style">🐱 Cat Eye</div>
                            <div class="reference-item-content">
                                <span class="reference-tag">Heart</span>
                                <span class="reference-tag">Oval</span>
                                <span class="reference-tag">Round</span>
                                <span class="reference-tag">Square</span>
                                <span class="reference-tag">Diamond</span>
                            </div>
                        </div>
                        <div class="reference-item">
                            <div class="reference-item-title style">⭕ Round</div>
                            <div class="reference-item-content">
                                <span class="reference-tag">Heart</span>
                                <span class="reference-tag">Square</span>
                                <span class="reference-tag">Diamond</span>
                            </div>
                        </div>
                        <div class="reference-item">
                            <div class="reference-item-title style">▭ Rectangle</div>
                            <div class="reference-item-content">
                                <span class="reference-tag">Heart</span>
                                <span class="reference-tag">Oval</span>
                                <span class="reference-tag">Round</span>
                                <span class="reference-tag">Diamond</span>
                            </div>
                        </div>
                        <div class="reference-item">
                            <div class="reference-item-title style">⬜ Square</div>
                            <div class="reference-item-content">
                                <span class="reference-tag">Oval</span>
                                <span class="reference-tag">Round</span>
                            </div>
                        </div>
                        <div class="reference-item">
                            <div class="reference-item-title style">🚧 Wayfarer</div>
                            <div class="reference-item-content">
                                <span class="reference-tag">Heart</span>
                                <span class="reference-tag">Oval</span>
                                <span class="reference-tag">Round</span>
                                <span class="reference-tag">Square</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Lens Types to Use Cases -->
                <div class="reference-section">
                    <div class="reference-section-title">🔆 Lens Types → Recommended Use Cases</div>
                    <div class="reference-grid">
                        <div class="reference-item">
                            <div class="reference-item-title lens">💻 Blue Light</div>
                            <div class="reference-item-content">
                                <span class="reference-tag lens">At Desk</span>
                            </div>
                        </div>
                        <div class="reference-item">
                            <div class="reference-item-title lens">☀️ Polarized</div>
                            <div class="reference-item-content">
                                <span class="reference-tag lens">Sport</span>
                                <span class="reference-tag lens">Day</span>
                            </div>
                        </div>
                        <div class="reference-item">
                            <div class="reference-item-title lens">👁️ Prescription (RX)</div>
                            <div class="reference-item-content">
                                <span class="reference-tag lens">Day</span>
                                <span class="reference-tag lens">Night</span>
                                <span class="reference-tag lens">Casual</span>
                                <span class="reference-tag lens">At Desk</span>
                                <span class="reference-tag lens">Going Out</span>
                                <span class="reference-tag lens">Sport</span>
                            </div>
                        </div>
                        <div class="reference-item">
                            <div class="reference-item-title lens">🌈 Tinted</div>
                            <div class="reference-item-content">
                                <span class="reference-tag lens">Day</span>
                                <span class="reference-tag lens">Night</span>
                            </div>
                        </div>
                        <div class="reference-item">
                            <div class="reference-item-title lens">✨ Custom</div>
                            <div class="reference-item-content">
                                <span class="reference-tag lens">Going Out</span>
                                <span class="reference-tag lens">Casual</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Use Cases to Frame Styles -->
                <div class="reference-section">
                    <div class="reference-section-title">🎯 Use Cases → Recommended Frame Styles</div>
                    <div class="reference-grid">
                        <div class="reference-item">
                            <div class="reference-item-title usecase">☀️ Day</div>
                            <div class="reference-item-content">
                                <span class="reference-tag usecase">Rectangle</span>
                                <span class="reference-tag usecase">Aviator</span>
                                <span class="reference-tag usecase">Wayfarer</span>
                                <span class="reference-tag usecase">Cat Eye</span>
                            </div>
                        </div>
                        <div class="reference-item">
                            <div class="reference-item-title usecase">🌙 Night</div>
                            <div class="reference-item-content">
                                <span class="reference-tag usecase">Square</span>
                                <span class="reference-tag usecase">Wayfarer</span>
                                <span class="reference-tag usecase">Round</span>
                            </div>
                        </div>
                        <div class="reference-item">
                            <div class="reference-item-title usecase">🎉 Going Out</div>
                            <div class="reference-item-content">
                                <span class="reference-tag usecase">Square</span>
                                <span class="reference-tag usecase">Aviator</span>
                                <span class="reference-tag usecase">Wayfarer</span>
                                <span class="reference-tag usecase">Cat Eye</span>
                                <span class="reference-tag usecase">Rectangle</span>
                            </div>
                        </div>
                        <div class="reference-item">
                            <div class="reference-item-title usecase">😌 Casual</div>
                            <div class="reference-item-content">
                                <span class="reference-tag usecase">Round</span>
                                <span class="reference-tag usecase">Cat Eye</span>
                                <span class="reference-tag usecase">Rectangle</span>
                                <span class="reference-tag usecase">Wayfarer</span>
                                <span class="reference-tag usecase">Square</span>
                                <span class="reference-tag usecase">Aviator</span>
                            </div>
                        </div>
                        <div class="reference-item">
                            <div class="reference-item-title usecase">🏃 Sport</div>
                            <div class="reference-item-content">
                                <span class="reference-tag usecase">Aviator</span>
                                <span class="reference-tag usecase">Rectangle</span>
                            </div>
                        </div>
                        <div class="reference-item">
                            <div class="reference-item-title usecase">💼 At Desk</div>
                            <div class="reference-item-content">
                                <span class="reference-tag usecase">Round</span>
                                <span class="reference-tag usecase">Rectangle</span>
                                <span class="reference-tag usecase">Square</span>
                                <span class="reference-tag usecase">Wayfarer</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Materials -->
                <div class="reference-section">
                    <div class="reference-section-title">🔧 Frame Materials - Detection Keywords</div>
                    <div class="reference-grid">
                        <div class="reference-item">
                            <div class="reference-item-title style">⚡ Wire / Metal</div>
                            <div class="reference-item-content">
                                <span class="reference-tag">Wire</span>
                                <span class="reference-tag">Metal</span>
                                <span class="reference-tag">Gold</span>
                                <span class="reference-tag">Silver</span>
                                <span class="reference-tag">Bronze</span>
                                <span class="reference-tag">Steel</span>
                                <span class="reference-tag">Titanium</span>
                                <span class="reference-tag">Thin Metal</span>
                            </div>
                        </div>
                        <div class="reference-item">
                            <div class="reference-item-title style">💪 Acetate / Plastic</div>
                            <div class="reference-item-content">
                                <span class="reference-tag">Acetate</span>
                                <span class="reference-tag">Plastic</span>
                                <span class="reference-tag">Thick Plastic</span>
                                <span class="reference-tag">Tortoise</span>
                                <span class="reference-tag">Tortoiseshell</span>
                                <span class="reference-tag">Thick Frame</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>""")

    print("✅ Created simple review page:")
    print("   → file:///Users/michaeldurante/ai%20dev/ce-hub/azy-quiz-app/public/verification/SIMPLE_REVIEW.html")

if __name__ == '__main__':
    print("📖 Reading product data...")
    products = read_products()
    tags = read_tags()
    create_html(products, tags)
