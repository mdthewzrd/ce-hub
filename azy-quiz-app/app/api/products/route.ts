import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const TAGS_FILE = path.join(process.cwd(), 'tagged_products.csv');
const PRODUCTS_FILE = path.join(process.cwd(), 'public/products_export.csv');

// Simple CSV parser that handles quoted fields
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

export async function GET() {
  try {
    // Read tags
    const tagsText = await fs.readFile(TAGS_FILE, 'utf-8');
    const tagsLines = tagsText.split('\n');
    const tagsMap: Record<string, any> = {};

    for (let i = 1; i < tagsLines.length; i++) {
      if (!tagsLines[i].trim()) continue;
      const values = parseCSVLine(tagsLines[i]);
      const handle = values[0];
      if (!handle) continue;

      tagsMap[handle] = {
        style: values[2] || '',
        material: values[3] || '',
        face_shapes: values[4] ? values[4].split(', ').filter(Boolean) : [],
        use_cases: values[5] ? values[5].split(', ').filter(Boolean) : [],
        lens_types: values[7] ? values[7].split(', ').filter(Boolean) : [],
      };
    }

    // Read products with images
    const productsText = await fs.readFile(PRODUCTS_FILE, 'utf-8');
    const productsLines = productsText.split('\n');
    const headers = parseCSVLine(productsLines[0]);

    // Find column indices
    const handleIdx = headers.findIndex(h => h === 'Handle');
    const titleIdx = headers.findIndex(h => h === 'Title');
    const vendorIdx = headers.findIndex(h => h === 'Vendor');
    const imageIdx = headers.findIndex(h => h === 'Image Src');

    const products: any[] = [];
    const seen = new Set<string>();

    for (let i = 1; i < productsLines.length; i++) {
      if (!productsLines[i].trim()) continue;

      const values = parseCSVLine(productsLines[i]);
      const handle = values[handleIdx];

      if (!handle || seen.has(handle)) continue;
      seen.add(handle);

      const tags = tagsMap[handle];

      products.push({
        handle,
        title: values[titleIdx] || '',
        vendor: values[vendorIdx] || '',
        image: values[imageIdx] || '',
        style: tags?.style || '',
        material: tags?.material || '',
        face_shapes: tags?.face_shapes || [],
        use_cases: tags?.use_cases || [],
        lens_types: tags?.lens_types || [],
      });
    }

    return NextResponse.json(products);
  } catch (error: any) {
    console.error('Error reading products:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
