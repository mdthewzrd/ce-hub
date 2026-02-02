const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

async function generateGlassesShape() {
  try {
    console.log('🎨 Generating test with custom glasses shape...');

    // Your photo
    const userImagePath = '/Users/michaeldurante/Downloads/SnapInsta.to_501164083_17959239593943917_3742289706627119932_n.jpg';

    // Load your image
    const img = await loadImage(userImagePath);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');

    // Draw original image
    ctx.drawImage(img, 0, 0);

    console.log(`📊 Original image: ${img.width}x${img.height}`);

    // Calculate glasses dimensions and position
    const glassesWidth = img.width * 0.25; // Smaller for better proportion
    const glassesHeight = glassesWidth * 0.4; // Typical glasses aspect ratio
    const glassesX = (img.width - glassesWidth) / 2;
    const glassesY = img.height * 0.25; // Eye level

    console.log(`📍 Glasses position: x=${glassesX}, y=${glassesY}, width=${glassesWidth}, height=${glassesHeight}`);

    // Draw custom glasses shape directly
    ctx.strokeStyle = '#2c3e50'; // Dark blue-gray frame
    ctx.lineWidth = 4;
    ctx.fillStyle = 'rgba(52, 152, 219, 0.3)'; // Light blue tint for lenses

    // Left lens
    const leftLensX = glassesX + glassesWidth * 0.15;
    const leftLensY = glassesY + glassesHeight * 0.3;
    const lensWidth = glassesWidth * 0.35;
    const lensHeight = glassesHeight * 0.5;

    ctx.beginPath();
    ctx.roundRect(leftLensX, leftLensY, lensWidth, lensHeight, 8);
    ctx.fill();
    ctx.stroke();

    // Right lens
    const rightLensX = glassesX + glassesWidth * 0.5;
    const rightLensY = glassesY + glassesHeight * 0.3;

    ctx.beginPath();
    ctx.roundRect(rightLensX, rightLensY, lensWidth, lensHeight, 8);
    ctx.fill();
    ctx.stroke();

    // Bridge between lenses
    ctx.beginPath();
    ctx.moveTo(leftLensX + lensWidth, leftLensY + lensHeight * 0.3);
    ctx.lineTo(rightLensX, rightLensY + lensHeight * 0.3);
    ctx.stroke();

    // Left temple arm
    ctx.beginPath();
    ctx.moveTo(leftLensX, leftLensY + lensHeight * 0.6);
    ctx.lineTo(leftLensX - 30, leftLensY + lensHeight * 0.4);
    ctx.stroke();

    // Right temple arm
    ctx.beginPath();
    ctx.moveTo(rightLensX + lensWidth, rightLensY + lensHeight * 0.6);
    ctx.lineTo(rightLensX + lensWidth + 30, rightLensY + lensHeight * 0.4);
    ctx.stroke();

    // Add subtle shadow under frame
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 4;

    // Redraw the frame with shadow
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 3;
    ctx.shadowColor = 'transparent';

    // Add lens reflections
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';

    // Left lens reflection
    ctx.beginPath();
    ctx.ellipse(leftLensX + lensWidth * 0.3, leftLensY + lensHeight * 0.4,
                lensWidth * 0.15, lensHeight * 0.1, Math.PI / 8, 0, Math.PI * 2);
    ctx.fill();

    // Right lens reflection
    ctx.beginPath();
    ctx.ellipse(rightLensX + lensWidth * 0.7, rightLensY + lensHeight * 0.4,
                lensWidth * 0.15, lensHeight * 0.1, -Math.PI / 8, 0, Math.PI * 2);
    ctx.fill();

    // Convert and save
    const resultBuffer = canvas.toBuffer('image/jpeg', { quality: 0.95 });

    const outputPath = '/Users/michaeldurante/ai dev/ce-hub/tryon-platform/tryon-platform/public/glasses-shape-test.jpg';
    fs.writeFileSync(outputPath, resultBuffer);

    console.log('✅ Custom glasses shape generated!');
    console.log(`📁 Saved to: ${outputPath}`);
    console.log(`🌐 View at: http://localhost:7771/glasses-shape-test.jpg`);
    console.log(`📊 File size: ${(resultBuffer.length / 1024).toFixed(1)}KB`);

    // Open the result
    require('child_process').exec(`open ${outputPath}`);

    return outputPath;

  } catch (error) {
    console.error('❌ Failed to generate custom glasses shape:', error);
    console.error('Stack trace:', error.stack);
  }
}

generateGlassesShape();