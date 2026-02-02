import fs from 'fs';
import http from 'http';

// Use the first project
const projectsData = JSON.parse(fs.readFileSync('data/projects.json', 'utf-8'));
const project = projectsData[0];

// Find subject image
const uploadsDir = 'public/uploads';
function findSubject(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      const found = findSubject(fullPath);
      if (found) return found;
    } else if (entry.name.includes('subject') && (entry.name.endsWith('.jpg') || entry.name.endsWith('.png'))) {
      return fullPath;
    }
  }
  return null;
}

const subjectPath = findSubject(uploadsDir);
console.log('Subject:', subjectPath);

const jobData = {
  name: 'Canvas Test Job',
  subjectFiles: [{ url: subjectPath.replace('public', '') }],
  glassesFiles: project.glassesFiles.map(g => ({ url: g.url }))
};

console.log('Sending:', JSON.stringify(jobData, null, 2).substring(0, 500));

const req = http.request({
  hostname: 'localhost',
  port: 7771,
  path: '/api/jobs',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('\nResponse status:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', (e) => console.error('Error:', e.message));
req.write(JSON.stringify(jobData));
req.end();
