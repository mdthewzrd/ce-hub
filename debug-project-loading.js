const fs = require('fs');
const path = require('path');

async function debugProjectLoading() {
  console.log('🔍 DEBUGGING PROJECT LOADING');
  console.log('============================');

  // Load projects from the exact same location as the frontend API
  const projectsFile = path.join(__dirname, 'projects/edge-dev-main/data/projects.json');

  if (!fs.existsSync(projectsFile)) {
    console.error('❌ Projects file not found:', projectsFile);
    return;
  }

  console.log('📂 Projects file path:', projectsFile);

  let projects;
  try {
    const data = fs.readFileSync(projectsFile, 'utf8');
    projects = JSON.parse(data);
    console.log(`✅ Loaded ${projects.length} projects`);
  } catch (error) {
    console.error('❌ Failed to load projects:', error.message);
    return;
  }

  // Find the specific project
  const projectId = '1765041068338';
  const project = projects.find(p => p.id === projectId);

  if (!project) {
    console.error('❌ Project not found:', projectId);
    console.log('Available projects:');
    projects.forEach(p => {
      console.log(`  - ${p.id}: ${p.name}`);
    });
    return;
  }

  console.log('\n📋 PROJECT DETAILS:');
  console.log(`ID: ${project.id}`);
  console.log(`Name: ${project.name}`);
  console.log(`Function Name: ${project.functionName}`);
  console.log(`Code Length: ${project.code?.length || 0} characters`);

  if (!project.code) {
    console.error('❌ No code found in project!');
    return;
  }

  // Analyze the code to see what functions it contains
  const code = project.code;
  console.log('\n🔍 CODE ANALYSIS:');

  // Extract function names using regex
  const functionMatches = code.match(/def\s+(\w+)\s*\(/g);
  if (functionMatches) {
    const functionNames = functionMatches.map(match => match.replace('def ', '').replace('(', ''));
    console.log('Functions found:', functionNames);

    // Check if main_sync exists
    if (functionNames.includes('main_sync')) {
      console.log('✅ main_sync function found in code');
    } else {
      console.log('❌ main_sync function NOT found in code');
    }

    // Check if scan_symbol exists
    if (functionNames.includes('scan_symbol')) {
      console.log('✅ scan_symbol function found in code');
    } else {
      console.log('❌ scan_symbol function NOT found in code');
    }
  } else {
    console.log('❌ No functions found in code!');
  }

  // Look for specific patterns that indicate the scanner type
  console.log('\n🎯 SCANNER TYPE IDENTIFICATION:');

  if (code.includes('FIXED BACKSIDE B SCANNER')) {
    console.log('✅ Code contains "FIXED BACKSIDE B SCANNER" - This is the correct scanner!');
  } else if (code.includes('enhanced_a_plus') || code.includes('fetch_and_scan_a_plus')) {
    console.log('❌ Code contains A+ scanner patterns - WRONG SCANNER!');
  } else if (code.includes('run_enhanced_a_plus_scan')) {
    console.log('❌ Code contains enhanced A+ scan - WRONG SCANNER!');
  } else {
    console.log('⚠️  Unknown scanner type');
  }

  // Show first few lines of code for verification
  const codeLines = code.split('\n').slice(0, 10);
  console.log('\n📝 FIRST 10 LINES OF CODE:');
  codeLines.forEach((line, i) => {
    console.log(`${String(i + 1).padStart(2)}: ${line}`);
  });

  // Test the exact request body that would be sent
  console.log('\n🚀 TESTING REQUEST BODY CONSTRUCTION:');

  const requestBody = {
    uploaded_code: code,
    scanner_type: 'uploaded',
    start_date: '2025-01-01',
    end_date: '2025-11-01',
    function_name: project.functionName,
    parallel_execution: true,
    timeout_seconds: 180
  };

  console.log('Request body size:', JSON.stringify(requestBody).length, 'characters');
  console.log('Function name in request:', requestBody.function_name);

  return {
    project,
    requestBody,
    codeAnalysis: {
      hasMainSync: functionMatches && functionMatches.some(match => match.includes('main_sync')),
      hasScanSymbol: functionMatches && functionMatches.some(match => match.includes('scan_symbol')),
      hasBacksideMarker: code.includes('FIXED BACKSIDE B SCANNER'),
      hasAPlusMarker: code.includes('enhanced_a_plus') || code.includes('fetch_and_scan_a_plus')
    }
  };
}

// Execute the debugging
debugProjectLoading()
  .then(result => {
    if (result) {
      console.log('\n🎯 SUMMARY:');
      console.log('===========');

      if (result.codeAnalysis.hasBacksideMarker && result.codeAnalysis.hasMainSync) {
        console.log('✅ CORRECT: This looks like the right backside B scanner code');
        console.log('✅ The project loading is working correctly');
        console.log('✅ The issue must be elsewhere (backend routing, request handling, etc.)');
      } else if (result.codeAnalysis.hasAPlusMarker) {
        console.log('❌ PROBLEM IDENTIFIED: Wrong scanner code in project file');
        console.log('❌ The A+ scanner code is stored instead of backside B scanner');
        console.log('❌ Need to fix the project data in projects.json');
      } else {
        console.log('⚠️  UNCLEAR: Scanner type could not be clearly identified');
        console.log('⚠️  Need further investigation');
      }
    }
  })
  .catch(error => {
    console.error('💥 Debug failed:', error);
  });