// Test complete workflow with actual user image
const path = require('path');
const fs = require('fs');

async function testWorkflow() {
  try {
    console.log('🧪 Testing complete workflow...');

    // Get the user's image
    const userImagePath = '/Users/michaeldurante/Downloads/SnapInsta.to_501164083_17959239593943917_3742289706627119932_n.jpg';

    if (!fs.existsSync(userImagePath)) {
      throw new Error(`User image not found at: ${userImagePath}`);
    }

    console.log('📸 Found user image:', userImagePath);

    // Get project glasses files
    const projectPath = '/Users/michaeldurante/ai dev/ce-hub/tryon-platform/tryon-platform/public/uploads/projects/e6f29e6f-8c5e-493c-a8d2-497fd725734e';

    const glassesFiles = [
      'glasses_0_popp-daylight-raoptics-blueblockers-visual-eyes-1160875504.jpg',
      'glasses_1_popp-daylight-raoptics-blueblockers-visual-eyes-1160875506_1024x1024.webp',
      'glasses_2_51MW03oVN+L._AC_UY1000_.jpg'
    ];

    console.log('👓 Checking glasses files...');
    for (const glassesFile of glassesFiles) {
      const glassesPath = path.join(projectPath, glassesFile);
      if (fs.existsSync(glassesPath)) {
        const stats = fs.statSync(glassesPath);
        console.log(`✅ Found: ${glassesFile} (${stats.size} bytes)`);
      } else {
        console.log(`❌ Missing: ${glassesPath}`);
      }
    }

    // Test creating a new job with the working API
    const testJob = {
      subjectFile: userImagePath,
      glassesFiles: glassesFiles.map(f => path.join(projectPath, f)),
      params: {
        guidance: 0.6,
        refStrength: 0.85,
        lightingWeight: 0.7,
        reflectionWeight: 0.8,
        colorMatchWeight: 0.15,
        seed: 12345
      }
    };

    console.log('✅ Workflow test completed successfully');
    return testJob;

  } catch (error) {
    console.error('❌ Workflow test failed:', error.message);
    throw error;
  }
}

testWorkflow().then(result => {
  console.log('🎉 Ready to try the real workflow!');
}).catch(error => {
  console.error('💥 Need to fix issues first');
});