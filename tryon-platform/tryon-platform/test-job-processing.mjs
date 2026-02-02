import fs from 'fs';
import http from 'http';

// Find existing project and subject images
const projectsData = JSON.parse(fs.readFileSync('data/projects.json', 'utf-8'));
const uploadsDir = 'public/uploads';

// Find a subject image
let subjectPath = null;
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

subjectPath = findSubject(uploadsDir);
if (!subjectPath) {
  console.log('No subject image found');
  process.exit(1);
}

// Use the first project's glasses
const project = projectsData[0];
const glassesFiles = project.glassesFiles.map(g => g.url);

console.log('Creating test job...');
console.log('Subject:', subjectPath);
console.log('Glasses:', glassesFiles.length, 'files');

// Create job via API
const jobData = {
  name: 'Canvas Test Job',
  subjectFiles: [{ url: subjectPath.replace('public', '') }],
  glassesFiles: glassesFiles.map(url => ({ url }))
};

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
    const response = JSON.parse(data);
    console.log('\nJob created!');
    console.log('Job ID:', response.job.id);
    console.log('Tasks:', response.job.tasks.length);
    
    // Poll for results
    console.log('\nPolling for results...');
    const pollInterval = setInterval(() => {
      http.get(`http://localhost:7771/api/jobs?jobId=${response.job.id}`, (pollRes) => {
        let pollData = '';
        pollRes.on('data', chunk => pollData += chunk);
        pollRes.on('end', () => {
          const job = JSON.parse(pollData);
          const task = job.tasks[0];
          
          console.log(`Status: ${task.status} (${task.progress}%)`);
          
          if (task.status === 'completed') {
            clearInterval(pollInterval);
            console.log('\nSUCCESS! Task completed!');
            console.log('Result:', task.result?.imageUrl || 'no image URL');
            console.log('\nCheck the result at:', task.result?.imageUrl);
          } else if (task.status === 'failed') {
            clearInterval(pollInterval);
            console.log('\nFAILED!');
            console.log('Error:', task.error || 'unknown error');
          }
        });
      });
    }, 2000);
  });
});

req.on('error', (e) => console.error('Request error:', e.message));
req.write(JSON.stringify(jobData));
req.end();
