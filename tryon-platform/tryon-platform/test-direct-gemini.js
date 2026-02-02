const { geminiService } = require('./lib/gemini');
const fs = require('fs');
const path = require('path');

async function testDirectGemini() {
  try {
    console.log('🧪 Testing Gemini AI glasses placement directly...');
    console.log('🤖 Model: gemini-2.5-flash-image (Nano Banana)');

    // User photo path
    const subjectImagePath = '/Users/michaeldurante/Downloads/SnapInsta.to_501164083_17959239593943917_3742289706627119932_n.jpg';

    // Get glasses from Ra Popp project
    const dataPath = path.join(process.cwd(), 'data', 'projects.json');
    const projectsData = fs.readFileSync(dataPath, 'utf-8');
    const projects = JSON.parse(projectsData);
    const raPoppProject = projects.find((p) => p.name.toLowerCase().includes('popp') && p.name.toLowerCase().includes('daylight'));

    if (!raPoppProject) {
      console.error('❌ Ra Popp project not found');
      return;
    }

    // Use the first glasses image
    const glassesUrl = raPoppProject.glassesFiles[0].url;
    const glassesPath = path.join(process.cwd(), 'public', glassesUrl);

    console.log(`👤 Subject: ${subjectImagePath}`);
    console.log(`👓 Glasses: ${glassesPath}`);

    // Check if files exist
    if (!fs.existsSync(subjectImagePath)) {
      console.error('❌ Subject image not found');
      return;
    }

    if (!fs.existsSync(glassesPath)) {
      console.error('❌ Glasses image not found');
      return;
    }

    // Generation parameters
    const params = {
      guidance: 0.7,
      refStrength: 0.9,
      lightingWeight: 0.8,
      reflectionWeight: 0.9,
      colorMatchWeight: 0.2,
      seed: 54321
    };

    console.log('🎨 Calling Gemini AI for realistic glasses placement...');
    console.log('⚙️ Parameters:', params);

    // Process with Gemini
    const result = await geminiService.processTryOn(
      subjectImagePath,
      [glassesPath],
      params,
      'test-gemini-direct'
    );

    console.log('✅ Gemini processing completed!');
    console.log(`📸 Result image: ${result.resultImagePath}`);
    console.log(`📊 Quality report:`, JSON.stringify(result.report, null, 2));

    // Open the result image
    console.log('🖼️ Opening result image...');
    require('child_process').exec(`open ${result.resultImagePath}`);

  } catch (error) {
    console.error('❌ Direct Gemini test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

testDirectGemini();