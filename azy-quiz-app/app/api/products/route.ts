import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const PRODUCTS_FILE = path.join(process.cwd(), 'tagged_products.csv');

export async function GET() {
  try {
    const csvText = await fs.readFile(PRODUCTS_FILE, 'utf-8');

    const lines = csvText.split('\n');
    const headers = lines[0].split(',');
    const products: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      // Parse CSV handling quoted fields
      const values: string[] = [];
      let current = '';
      let inQuotes = false;

      for (const char of lines[i]) {
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

      const handle = values[0];
      if (!handle) continue;

      products.push({
        handle: values[0],
        title: values[1],
        vendor: values[8] || '',
        image: values[9] || '',
        style: values[2] || '',
        material: values[3] || '',
        face_shapes: values[4] ? values[4].split(', ').filter(Boolean) : [],
        use_cases: values[5] ? values[5].split(', ').filter(Boolean) : [],
        lens_types: values[7] ? values[7].split(', ').filter(Boolean) : [],
      });
    }

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error reading products:', error);
    return NextResponse.json([], { status: 200 });
  }
}
