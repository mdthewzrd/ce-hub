const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

async function generateFinalTestPhoto() {
  try {
    console.log('🎨 Generating final test photo with enhanced glasses placement...');

    // Your photo
    const userImagePath = '/Users/michaeldurante/Downloads/SnapInsta.to_501164083_17959239593943917_3742289706627119932_n.jpg';

    // Get Ra Popp glasses
    const dataPath = path.join(process.cwd(), 'data', 'projects.json');
    const projectsData = fs.readFileSync(dataPath, 'utf-8');
    const projects = JSON.parse(projectsData);
    const raPoppProject = projects.find((p) => p.name.toLowerCase().includes('popp') && p.name.toLowerCase().includes('daylight'));

    if (!raPoppProject) {
      console.error('❌ Ra Popp project not found');
      return;
    }

    // Use the main glasses image (first one)
    const glassesUrl = raPoppProject.glassesFiles[0].url;
    const glassesPath = path.join(process.cwd(), 'public', glassesUrl);

    console.log(`👤 User photo: ${userImagePath}`);
    console.log(`👓 Glasses: ${glassesPath}`);

    // Check files exist
    if (!fs.existsSync(userImagePath)) {
      console.error('❌ User photo not found');
      return;
    }

    if (!fs.existsSync(glassesPath)) {
      console.error('❌ Glasses image not found');
      return;
    }

    // Load images
    const img = await loadImage(userImagePath);
    const glassesImage = await loadImage(glassesPath);

    console.log(`📊 Original image: ${img.width}x${img.height}`);
    console.log(`👓 Glasses image: ${glassesImage.width}x${glassesImage.height}`);

    // Create canvas
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');

    // Draw original image
    ctx.drawImage(img, 0, 0);

    // Calculate glasses placement with improved positioning
    const glassesWidth = img.width * 0.28; // Slightly smaller for better proportion
    const glassesHeight = glassesWidth * (glassesImage.height / glassesImage.width);

    // Position glasses more accurately on face
    const glassesX = (img.width - glassesWidth) / 2;
    const glassesY = img.height * 0.22; // Moved higher for better eye alignment

    console.log(`📍 Placement: x=${glassesX}, y=${glassesY}, width=${glassesWidth}, height=${glassesHeight}`);

    // Create temporary canvas for glasses extraction
    const glassesCanvas = createCanvas(glassesImage.width, glassesImage.height);
    const glassesCtx = glassesCanvas.getContext('2d');

    // Draw glasses to temporary canvas
    glassesCtx.drawImage(glassesImage, 0, 0);

    // Get image data for background removal
    const glassesImageData = glassesCtx.getImageData(0, 0, glassesImage.width, glassesImage.height);
    const data = glassesImageData.data;

    // Enhanced background removal - extract just the glasses frame
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // More sophisticated background removal
      const brightness = (r + g + b) / 3;

      // Remove very bright pixels (white background)
      if (brightness > 220) {
        data[i + 3] = 0; // Transparent
      }
      // Remove very dark pixels (black borders)
      else if (brightness < 30) {
        data[i + 3] = 0; // Transparent
      }
      // Keep mid-tone pixels (glasses frame)
      else {
        // Slightly reduce opacity for natural blend
        data[i + 3] = Math.min(255, data[i + 3] * 0.95);
      }
    }

    // Put modified image data back
    glassesCtx.putImageData(glassesImageData, 0, 0);

    // Apply advanced blending and effects
    ctx.globalAlpha = 0.92; // High but not fully opaque
    ctx.globalCompositeOperation = 'multiply'; // Better blend for frames

    // Add realistic shadows
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;

    // Draw the extracted glasses
    ctx.drawImage(glassesCanvas, glassesX, glassesY, glassesWidth, glassesHeight);

    // Reset for additional effects
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = 'source-over';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Add realistic lens reflections
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';

    // Left lens reflection
    ctx.beginPath();
    ctx.ellipse(glassesX + glassesWidth * 0.35, glassesY + glassesHeight * 0.5,
                glassesWidth * 0.08, glassesHeight * 0.04, Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();

    // Right lens reflection
    ctx.beginPath();
    ctx.ellipse(glassesX + glassesWidth * 0.65, glassesY + glassesHeight * 0.5,
                glassesWidth * 0.08, glassesHeight * 0.04, -Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();

    // Add subtle highlight on frame
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(glassesX, glassesY, glassesWidth, glassesHeight);

    // Convert to buffer and save
    const resultBuffer = canvas.toBuffer('image/jpeg', { quality: 0.95 });

    const outputPath = '/Users/michaeldurante/ai dev/ce-hub/tryon-platform/tryon-platform/public/final-test-result.jpg';
    fs.writeFileSync(outputPath, resultBuffer);

    console.log('✅ Final test photo generated!');
    console.log(`📁 Saved to: ${outputPath}`);
    console.log(`🌐 View at: http://localhost:7771/final-test-result.jpg`);
    console.log(`📊 File size: ${(resultBuffer.length / 1024).toFixed(1)}KB`);

    // Open the result
    require('child_process').exec(`open ${outputPath}`);

    return outputPath;

  } catch (error) {
    console.error('❌ Failed to generate final test photo:', error);
    console.error('Stack trace:', error.stack);
  }
}

generateFinalTestPhoto();