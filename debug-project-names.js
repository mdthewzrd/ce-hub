const { chromium } = require('playwright');

async function debugProjectNames() {
  console.log('🔍 DEBUG: Checking actual project names in the system');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Step 1: Check the projects API directly
    console.log('🌐 Fetching projects from API...');

    const response = await fetch('http://localhost:5656/api/projects');
    const projectsData = await response.json();

    console.log('📊 Raw API Response:');
    console.log(JSON.stringify(projectsData, null, 2));

    if (projectsData.data && projectsData.data.length > 0) {
      console.log('\n📋 Project Analysis:');
      projectsData.data.forEach((project, index) => {
        console.log(`Project ${index + 1}:`);
        console.log(`  ID: ${project.id}`);
        console.log(`  Name: "${project.name}"`);
        console.log(`  Has Code: ${!!project.code}`);
        console.log(`  Code Length: ${project.code ? project.code.length : 0}`);
        console.log(`  Enhanced: ${project.enhanced}`);
        console.log('---');
      });

      // Check which names would match
      console.log('\n🔍 Name Matching Analysis:');
      const backsideVariations = [
        'Backside Para B Scanner',
        'backside para b copy',
        'backside',
        'Backside',
        'para b',
        'Para B'
      ];

      backsideVariations.forEach(variation => {
        const matches = projectsData.data.filter(p => p.name === variation);
        console.log(`"${variation}": ${matches.length} matches`);
        if (matches.length > 0) {
          matches.forEach(m => console.log(`  - ID: ${m.id}, Code: ${!!m.code}`));
        }
      });

      // Check for partial matches
      console.log('\n🔍 Partial Name Matching:');
      projectsData.data.forEach(project => {
        if (project.name.toLowerCase().includes('backside')) {
          console.log(`Contains "backside": "${project.name}" (ID: ${project.id}, Code: ${!!project.code})`);
        }
      });

    } else {
      console.log('❌ No projects found in API response');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the debug
debugProjectNames()
  .then(() => {
    console.log('\n🏁 Project name debug completed');
  })
  .catch(error => {
    console.error('\n💥 Debug failed:', error);
    process.exit(1);
  });