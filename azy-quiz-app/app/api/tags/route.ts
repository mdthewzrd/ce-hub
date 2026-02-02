import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const TAGS_FILE = path.join(process.cwd(), 'public', 'saved-tags.json');

export async function GET() {
  try {
    const data = await fs.readFile(TAGS_FILE, 'utf-8');
    const tags = JSON.parse(data);
    return NextResponse.json(tags);
  } catch (error) {
    // File doesn't exist yet, return empty
    return NextResponse.json({});
  }
}

export async function POST(request: Request) {
  try {
    const tags = await request.json();

    // Save to file
    await fs.writeFile(TAGS_FILE, JSON.stringify(tags, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving tags:', error);
    return NextResponse.json({ error: 'Failed to save tags' }, { status: 500 });
  }
}
