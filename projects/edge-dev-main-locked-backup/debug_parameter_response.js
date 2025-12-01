/**
 * Debug Parameter Response - Check what the API is actually returning
 */

const fs = require('fs');

async function debugParameterResponse() {
  console.log('🔍 Debugging Parameter API Response...\n');

  try {
    // Read the real scanner
    const scannerPath = './backend/backside para b copy.py';
    const scannerContent = fs.readFileSync(scannerPath, 'utf8');

    console.log(`Scanner file: ${scannerContent.length} characters`);

    // Make the API call and log the complete response
    const formatResponse = await fetch('http://localhost:8000/api/format/code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: scannerContent,
        filename: 'backside para b copy.py'
      })
    });

    const formatResult = await formatResponse.json();

    console.log('\n📊 Complete API Response:');
    console.log('==================================');
    console.log(JSON.stringify(formatResult, null, 2));
    console.log('==================================');

    console.log('\n🔍 Analysis:');
    console.log(`Status: ${formatResponse.status}`);
    console.log(`Success: ${formatResult.success}`);
    console.log(`Scanner Type: ${formatResult.scanner_type}`);
    console.log(`Has parameters field: ${formatResult.hasOwnProperty('parameters')}`);
    console.log(`Parameters type: ${typeof formatResult.parameters}`);
    console.log(`Parameters value: ${JSON.stringify(formatResult.parameters)}`);

    // Check all possible fields that might contain parameters
    const possibleParamFields = ['parameters', 'extracted_parameters', 'params', 'scanner_parameters'];
    possibleParamFields.forEach(field => {
      if (formatResult[field]) {
        console.log(`Found ${field}: ${JSON.stringify(formatResult[field])}`);
      }
    });

    // Check if parameters are nested somewhere
    if (formatResult.metadata) {
      console.log(`Metadata: ${JSON.stringify(formatResult.metadata, null, 2)}`);
    }

    if (formatResult.analysis) {
      console.log(`Analysis: ${JSON.stringify(formatResult.analysis, null, 2)}`);
    }

  } catch (error) {
    console.error('Debug error:', error.message);
  }
}

debugParameterResponse();