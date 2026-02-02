const fs = require('fs');

// Read the scanner file
const sourceCode = fs.readFileSync('/Users/michaeldurante/Downloads/backside para b copy 3.py', 'utf8');

// Create the transformation request
const payload = {
  source_code: sourceCode,
  scanner_name: 'backside_para_b_copy_3',
  date_range: '2024-01-01 to 2024-12-31',
  verbose: true
};

console.log('📤 Sending request to Next.js API route...');
console.log('   Source code length:', sourceCode.length, 'characters');

// Send the request
fetch('http://localhost:5665/api/renata_v2/transform', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload)
})
.then(response => {
  console.log('\n📥 Response status:', response.status);
  return response.json();
})
.then(result => {
  console.log('\n📥 Response received from Next.js:');
  console.log('   success:', result.success);
  console.log('   generated_code exists:', result.generated_code ? 'Yes' : 'No');
  console.log('   generated_code length:', result.generated_code?.length || 0);
  console.log('   corrections_made:', result.corrections_made || 0);
  console.log('   errors:', result.errors?.length || 0);

  if (!result.success) {
    console.log('\n❌ Next.js API returned success: false!');
    console.log('   Full response:', JSON.stringify(result, null, 2));
  } else {
    console.log('\n✅ Next.js API returned success: true!');
  }
})
.catch(error => {
  console.error('❌ Error:', error.message);
});
