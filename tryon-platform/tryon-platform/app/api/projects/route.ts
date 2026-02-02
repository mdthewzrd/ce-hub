import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

/**
 * Extract image URLs from HTML that might contain sizing charts
 */
function extractImageUrls(html: string, baseUrl: string): string[] {
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  const urls: string[] = [];
  let match;

  while ((match = imgRegex.exec(html)) !== null) {
    let imgSrc = match[1];

    // Convert relative URLs to absolute
    if (imgSrc.startsWith('//')) {
      imgSrc = 'https:' + imgSrc;
    } else if (imgSrc.startsWith('/')) {
      const urlObj = new URL(baseUrl);
      imgSrc = urlObj.origin + imgSrc;
    } else if (!imgSrc.startsWith('http')) {
      const urlObj = new URL(baseUrl);
      imgSrc = urlObj.origin + '/' + imgSrc;
    }

    // Filter for likely sizing chart images (by filename patterns)
    const lowerImgSrc = imgSrc.toLowerCase();
    if (lowerImgSrc.includes('size') ||
        lowerImgSrc.includes('chart') ||
        lowerImgSrc.includes('measurement') ||
        lowerImgSrc.includes('dimension') ||
        lowerImgSrc.includes('frame') ||
        lowerImgSrc.includes('fit') ||
        lowerImgSrc.includes('guide')) {
      urls.push(imgSrc);
    }
  }

  // Return up to 3 most likely sizing chart images
  return urls.slice(0, 3);
}

/**
 * Fetch sizing information from a URL using Gemini AI
 * This analyzes the sizing page (text + images) and extracts structured sizing data
 */
async function fetchSizingInfo(sizingUrl: string): Promise<any | null> {
  try {
    console.log(`Fetching sizing info from: ${sizingUrl}`);

    // Fetch the HTML content from the URL
    const response = await fetch(sizingUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(15000) // 15 second timeout for image fetching
    });

    if (!response.ok) {
      console.log(`Failed to fetch sizing page: ${response.status}`);
      return null;
    }

    const html = await response.text();

    // Extract brand name from URL
    const urlObj = new URL(sizingUrl);
    const domain = urlObj.hostname.replace('www.', '').replace('.com', '').replace('.net', '');
    const brandName = domain.charAt(0).toUpperCase() + domain.slice(1);

    // Extract image URLs that might contain sizing charts
    const imageUrls = extractImageUrls(html, sizingUrl);
    console.log(`Found ${imageUrls.length} potential sizing chart images`);

    // Use Gemini to analyze the HTML and images
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Build the prompt
    let prompt = `Analyze this glasses sizing information and extract structured data.

`;

    // Add image data if available
    const contents: any[] = [];

    // Fetch and include images
    for (let i = 0; i < imageUrls.length; i++) {
      try {
        console.log(`Fetching image ${i + 1}/${imageUrls.length}: ${imageUrls[i]}`);
        const imgResponse = await fetch(imageUrls[i], {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
          },
          signal: AbortSignal.timeout(5000)
        });

        if (imgResponse.ok) {
          const imgBuffer = await imgResponse.arrayBuffer();
          const base64Img = Buffer.from(imgBuffer).toString('base64');

          // Determine MIME type
          const imgUrl = imageUrls[i].toLowerCase();
          let mimeType = 'image/jpeg';
          if (imgUrl.endsWith('.png')) mimeType = 'image/png';
          else if (imgUrl.endsWith('.webp')) mimeType = 'image/webp';
          else if (imgUrl.endsWith('.gif')) mimeType = 'image/gif';

          contents.push({
            inlineData: {
              mimeType: mimeType,
              data: base64Img
            }
          });
          console.log(`Added image ${i + 1} to analysis`);
        }
      } catch (imgError) {
        console.log(`Failed to fetch image ${i + 1}:`, imgError);
      }
    }

    // Add the text prompt at the end
    prompt += `HTML Content (truncated to 15000 chars):
${html.substring(0, 15000)}

${imageUrls.length > 0 ? `I have also included ${imageUrls.length} images from this page that may contain sizing charts.` : ''}

IMPORTANT: This page may contain MULTIPLE frame models with different sizes. Your task is to:
1. Look at ALL the frame measurements shown across the page
2. Identify the PATTERNS to determine Small, Medium, and Large size ranges
3. Extract GENERAL size ranges (not specific to one model)

For example, if you see frames with measurements like:
- 48-16-135, 49-17-138 → These represent SMALL
- 51-17-140, 52-18-142, 53-19-145 → These represent MEDIUM
- 54-18-145, 55-19-148, 56-20-150 → These represent LARGE

Respond with ONLY a JSON object in this exact format (no markdown, no extra text):
{
  "brand": "Brand Name",
  "sizeChartUrl": "${sizingUrl}",
  "sizes": {
    "small": { "lensWidth": "48-50mm", "bridge": "16-18mm", "temple": "135-140mm", "faceWidth": "<130mm" },
    "medium": { "lensWidth": "51-53mm", "bridge": "17-19mm", "temple": "140-145mm", "faceWidth": "130-140mm" },
    "large": { "lensWidth": "54-56mm", "bridge": "18-20mm", "temple": "145-150mm", "faceWidth": ">140mm" }
  },
  "fittingGuide": "Brief fitting instructions based on the content"
}

Extract GENERAL size ranges based on patterns across all products shown. If a size category is not mentioned, use "N/A" for that size's measurements.
If no sizing information is found, return: { "error": "No sizing information found" }`;

    contents.push({ text: prompt });

    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: contents
    });

    let responseText = '';
    if (result.candidates && result.candidates[0]?.content?.parts) {
      for (const part of result.candidates[0].content.parts) {
        if (part.text) {
          responseText += part.text;
        }
      }
    }

    // Try to extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const sizingInfo = JSON.parse(jsonMatch[0]);

      if (sizingInfo.error) {
        console.log('AI could not extract sizing info:', sizingInfo.error);
        return null;
      }

      console.log('Successfully extracted sizing info:', sizingInfo.brand);
      return {
        brand: sizingInfo.brand || brandName,
        sizeChartUrl: sizingUrl,
        sizes: sizingInfo.sizes,
        fittingGuide: sizingInfo.fittingGuide || 'Frame width should equal face width at temples.'
      };
    }

    console.log('Could not parse AI response for sizing info');
    return null;

  } catch (error) {
    console.error('Error fetching sizing info:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const name = data.get('name') as string;
    const sizingUrl = data.get('sizingUrl') as string | null;
    const glassesFiles = data.getAll('glasses') as File[];

    // Manual measurement inputs
    const model = data.get('model') as string | null;
    const frame = data.get('frame') as string | null;
    const lensWidth = data.get('lensWidth') as string | null;
    const lensHeight = data.get('lensHeight') as string | null;
    const bridge = data.get('bridge') as string | null;
    const temple = data.get('temple') as string | null;
    const frameWidth = data.get('frameWidth') as string | null;

    if (!name || glassesFiles.length === 0) {
      return NextResponse.json(
        { error: 'Project name and at least one glasses photo required' },
        { status: 400 }
      );
    }

    // Create project ID
    const projectId = uuidv4();

    // Determine sizing info - manual measurements take priority over URL extraction
    let sizingInfo = null;

    // Check if manual measurements are provided
    const hasManualMeasurements = model && frame && (lensWidth || bridge || temple || frameWidth);

    if (hasManualMeasurements) {
      // Use manual measurements
      console.log(`Using manual measurements for ${model}`);
      const urlObj = sizingUrl ? new URL(sizingUrl) : null;
      const domain = urlObj ? urlObj.hostname.replace('www.', '').replace('.com', '').replace('.net', '') : name;
      const brandName = domain.charAt(0).toUpperCase() + domain.slice(1);

      sizingInfo = {
        brand: brandName,
        sizeChartUrl: sizingUrl || '',
        exact: {
          model: model,
          frame: frame,
          lensWidth: lensWidth || 'N/A',
          lensHeight: lensHeight || 'N/A',
          bridge: bridge || 'N/A',
          temple: temple || 'N/A',
          frameWidth: frameWidth || 'N/A'
        },
        sizes: {
          small: { lensWidth: '48-50mm', bridge: '16-18mm', temple: '135-140mm', faceWidth: '<130mm' },
          medium: { lensWidth: '51-53mm', bridge: '17-19mm', temple: '140-145mm', faceWidth: '130-140mm' },
          large: { lensWidth: '54-56mm', bridge: '18-20mm', temple: '145-150mm', faceWidth: '>140mm' }
        },
        fittingGuide: 'Frame width should equal face width at temples, extending 5-10mm past widest point. Eyes must be centered in lens frames.'
      };
    } else if (sizingUrl && sizingUrl.trim()) {
      // Fetch sizing info from URL
      console.log(`Sizing URL provided, attempting to fetch sizing info...`);
      sizingInfo = await fetchSizingInfo(sizingUrl.trim());
      if (sizingInfo) {
        console.log(`Successfully fetched sizing info for: ${sizingInfo.brand}`);
      } else {
        console.log('Could not fetch sizing info, continuing without it');
      }
    }

    // Process uploaded glasses files
    const uploadedGlassesFiles: any[] = [];
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'projects', projectId);
    fs.mkdirSync(uploadsDir, { recursive: true });

    for (let i = 0; i < glassesFiles.length; i++) {
      const file = glassesFiles[i];
      const buffer = Buffer.from(await file.arrayBuffer());
      const filename = `glasses_${i}_${file.name}`;
      const filepath = path.join(uploadsDir, filename);

      fs.writeFileSync(filepath, buffer);

      uploadedGlassesFiles.push({
        id: uuidv4(),
        name: file.name,
        type: 'glasses',
        url: `/uploads/projects/${projectId}/${filename}`,
        size: file.size,
        width: 0, // TODO: Get actual dimensions
        height: 0,
      });
    }

    // Create project object
    const project: any = {
      id: projectId,
      name,
      glassesFiles: uploadedGlassesFiles,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add sizing info if available (from manual measurements or URL extraction)
    if (sizingInfo) {
      project.sizingInfo = sizingInfo;
    }

    // Save project data
    const projectsDataPath = path.join(process.cwd(), 'data', 'projects.json');
    const projectsDataDir = path.dirname(projectsDataPath);

    if (!fs.existsSync(projectsDataDir)) {
      fs.mkdirSync(projectsDataDir, { recursive: true });
    }

    let existingProjects: any[] = [];
    if (fs.existsSync(projectsDataPath)) {
      const projectsData = fs.readFileSync(projectsDataPath, 'utf-8');
      existingProjects = JSON.parse(projectsData);
    }

    existingProjects.push(project);
    fs.writeFileSync(projectsDataPath, JSON.stringify(existingProjects, null, 2));

    return NextResponse.json(project, { status: 201 });

  } catch (error) {
    console.error('Project creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (projectId) {
      // Get specific project
      const projectsDataPath = path.join(process.cwd(), 'data', 'projects.json');

      if (!fs.existsSync(projectsDataPath)) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }

      const projectsData = fs.readFileSync(projectsDataPath, 'utf-8');
      const projects = JSON.parse(projectsData);
      const project = projects.find((p: any) => p.id === projectId);

      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }

      return NextResponse.json(project);
    } else {
      // List all projects
      const projectsDataPath = path.join(process.cwd(), 'data', 'projects.json');

      if (!fs.existsSync(projectsDataPath)) {
        return NextResponse.json([]);
      }

      const projectsData = fs.readFileSync(projectsDataPath, 'utf-8');
      const projects = JSON.parse(projectsData);

      return NextResponse.json(projects);
    }
  } catch (error) {
    console.error('Project fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID required' },
        { status: 400 }
      );
    }

    // Load existing projects
    const projectsDataPath = path.join(process.cwd(), 'data', 'projects.json');

    if (!fs.existsSync(projectsDataPath)) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const projectsData = fs.readFileSync(projectsDataPath, 'utf-8');
    const projects = JSON.parse(projectsData);

    // Find and remove the project
    const projectIndex = projects.findIndex((p: any) => p.id === projectId);

    if (projectIndex === -1) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const deletedProject = projects[projectIndex];
    projects.splice(projectIndex, 1);

    // Save updated projects
    fs.writeFileSync(projectsDataPath, JSON.stringify(projects, null, 2));

    // Optionally delete project files from filesystem
    const projectDir = path.join(process.cwd(), 'public', 'uploads', 'projects', projectId);
    if (fs.existsSync(projectDir)) {
      fs.rmSync(projectDir, { recursive: true, force: true });
    }

    return NextResponse.json({
      message: 'Project deleted successfully',
      project: deletedProject
    });

  } catch (error) {
    console.error('Project deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}