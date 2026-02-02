import { NextRequest, NextResponse } from 'next/server';
import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    console.log('🎨 Testing Canvas-only glasses overlay...');

    // Use the known test image
    const userImagePath = '/Users/michaeldurante/Downloads/SnapInsta.to_501164083_17959239593943917_3742289706627119932_n.jpg';

    // Find first glasses from pop daylight project
    const dataPath = path.join(process.cwd(), 'data', 'projects.json');
    if (!fs.existsSync(dataPath)) {
      return NextResponse.json({ error: 'Projects data not found' }, { status: 404 });
    }

    const projectsData = fs.readFileSync(dataPath, 'utf-8');
    const projects = JSON.parse(projectsData);
    const popDaylightProject = projects.find((p: any) => p.name.toLowerCase().includes('popp') && p.name.toLowerCase().includes('daylight'));

    if (!popDaylightProject || !popDaylightProject.glassesFiles || popDaylightProject.glassesFiles.length === 0) {
      return NextResponse.json({ error: 'Pop daylight project or glasses not found' }, { status: 404 });
    }

    const glassesPath = path.join(process.cwd(), 'public', popDaylightProject.glassesFiles[0].url);

    console.log(`📸 User image: ${userImagePath}`);
    console.log(`👓 Glasses: ${glassesPath}`);

    // Check if files exist
    if (!fs.existsSync(userImagePath)) {
      return NextResponse.json({ error: `User image not found: ${userImagePath}` }, { status: 404 });
    }

    if (!fs.existsSync(glassesPath)) {
      return NextResponse.json({ error: `Glasses image not found: ${glassesPath}` }, { status: 404 });
    }

    // Load the original image and glasses
    const img = await loadImage(userImagePath);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');

    // Draw the original image
    ctx.drawImage(img, 0, 0);

    // Load glasses image for overlay
    const glassesImage = await loadImage(glassesPath);

    // Calculate glasses placement following spec guidelines
    const glassesWidth = img.width * 0.3; // Scale glasses to face width
    const glassesHeight = glassesWidth * (glassesImage.height / glassesImage.width);

    // Position glasses on face (conservative placement) - adjusted higher
    const glassesX = (img.width - glassesWidth) / 2;
    const glassesY = img.height * 0.25; // Moved higher up on face

    // Create a temporary canvas for glasses extraction
    const glassesCanvas = createCanvas(glassesImage.width, glassesImage.height);
    const glassesCtx = glassesCanvas.getContext('2d');

    // Draw glasses image to temporary canvas
    glassesCtx.drawImage(glassesImage, 0, 0);

    // Get image data for pixel manipulation
    const glassesImageData = glassesCtx.getImageData(0, 0, glassesImage.width, glassesImage.height);
    const data = glassesImageData.data;

    // Create transparent background by removing white/light pixels
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // If pixel is very light/white, make it transparent
      const brightness = (r + g + b) / 3;
      if (brightness > 200) { // Threshold for white/light pixels
        data[i + 3] = 0; // Set alpha to transparent
      }
    }

    // Put the modified image data back
    glassesCtx.putImageData(glassesImageData, 0, 0);

    // Apply conservative blending with lighting match
    ctx.globalAlpha = 0.9; // Slightly higher opacity for extracted glasses
    ctx.globalCompositeOperation = 'source-over'; // Normal blend mode for extracted glasses

    // Draw glasses with subtle shadows
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;

    // Draw the extracted glasses
    ctx.drawImage(glassesCanvas, glassesX, glassesY, glassesWidth, glassesHeight);

    // Reset global state
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = 'source-over';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Add subtle lens reflection effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.ellipse(glassesX + glassesWidth * 0.3, glassesY + glassesHeight * 0.5,
                glassesWidth * 0.1, glassesHeight * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(glassesX + glassesWidth * 0.7, glassesY + glassesHeight * 0.5,
                glassesWidth * 0.1, glassesHeight * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();

    // Convert to buffer
    const resultImageData = canvas.toBuffer('image/jpeg', { quality: 0.95 });

    // Save result
    const resultPath = path.join(process.cwd(), 'public', 'canvas-test-result.jpg');
    fs.writeFileSync(resultPath, resultImageData);

    console.log(`✅ Canvas overlay completed! Result saved to: ${resultPath}`);
    console.log(`📊 Original: ${img.width}x${img.height}`);
    console.log(`👓 Glasses: ${glassesWidth}x${glassesHeight} at position (${glassesX}, ${glassesY})`);

    return NextResponse.json({
      success: true,
      message: 'Canvas glasses overlay completed successfully',
      resultUrl: '/canvas-test-result.jpg',
      dimensions: {
        original: { width: img.width, height: img.height },
        glasses: { width: glassesWidth, height: glassesHeight, x: glassesX, y: glassesY }
      }
    });

  } catch (error) {
    console.error('❌ Canvas test error:', error);
    console.error('Stack trace:', error.stack);
    return NextResponse.json(
      {
        error: 'Canvas test failed',
        details: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}