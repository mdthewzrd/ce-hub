import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const PRODUCTS_FILE = path.join(process.cwd(), 'public/products.json');

export async function GET() {
  try {
    const data = await fs.readFile(PRODUCTS_FILE, 'utf-8');
    const products = JSON.parse(data);

    console.log(`Loaded ${products.length} products from JSON`);
    if (products.length > 0) {
      console.log(`First product: ${products[0].handle}, image: ${products[0].image?.substring(0, 80) || 'none'}`);
    }

    return NextResponse.json(products);
  } catch (error: any) {
    console.error('Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
