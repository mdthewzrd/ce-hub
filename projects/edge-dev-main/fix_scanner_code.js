/**
 * Fix the Backside B scanner code in the project database
 */

const fs = require('fs');
const path = require('path');

// Read the correct Backside B scanner code
const correctScannerPath = path.join(__dirname, 'backend', 'backside para b copy.py');
const correctCode = fs.readFileSync(correctScannerPath, 'utf8');

// Read the projects.json file
const projectsPath = path.join(__dirname, 'data', 'projects.json');
const projectsData = JSON.parse(fs.readFileSync(projectsPath, 'utf8'));

// Update the Backside B project with the correct code
const backsideBProject = projectsData.data.find(p =>
  p.name?.includes('backside') || p.id === '1765294533456'
);

if (backsideBProject) {
  console.log('✅ Found Backside B project, updating code...');
  backsideBProject.code = correctCode;
  backsideBProject.updatedAt = new Date().toISOString();

  // Write back the updated projects.json
  fs.writeFileSync(projectsPath, JSON.stringify(projectsData, null, 2));
  console.log('✅ Updated project database with correct Backside B scanner code!');
  console.log('📝 Code length:', correctCode.length, 'characters');
} else {
  console.log('❌ Backside B project not found!');
  process.exit(1);
}

console.log('🎯 Backside B scanner code has been fixed!');