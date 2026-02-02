const fs = require('fs');
const path = require('path');

const projectsPath = path.join(__dirname, '../data/projects.json');
const publicDir = path.join(__dirname, '../public');

console.log('Loading projects...');
const projectsData = fs.readFileSync(projectsPath, 'utf-8');
const projects = JSON.parse(projectsData);

console.log(`Found ${projects.length} projects`);

let updatedCount = 0;
let photosAddedCount = 0;

projects.forEach(project => {
  if (!project.subjectPhotos) {
    project.subjectPhotos = [];
  }

  const existingPhotoUrls = new Set(project.subjectPhotos.map(p => p.url));
  let projectUpdated = false;

  // Extract subject photos from results
  if (project.results && Array.isArray(project.results)) {
    project.results.forEach(result => {
      if (result.subjectFile && result.subjectFile.url) {
        const subjectUrl = result.subjectFile.url;

        // Check if we can find the actual file
        let actualFilePath = null;

        // Try different possible paths
        const possiblePaths = [
          path.join(publicDir, subjectUrl.replace(/^\//, '')), // /uploads/... -> public/uploads/...
          path.join(publicDir, 'uploads', path.basename(subjectUrl)), // Try basename in uploads folder
        ];

        // Also try using result taskId as directory name (common pattern)
        const taskIdDir = path.join(publicDir, 'uploads', result.taskId);
        if (fs.existsSync(taskIdDir)) {
          const files = fs.readdirSync(taskIdDir);
          const subjectFile = files.find(f => f.startsWith('subject_'));
          if (subjectFile) {
            possiblePaths.push(path.join(taskIdDir, subjectFile));
          }
        }

        for (const tryPath of possiblePaths) {
          if (fs.existsSync(tryPath)) {
            actualFilePath = tryPath;
            break;
          }
        }

        // Create URL for the subject photo
        let photoUrl = subjectUrl;
        if (actualFilePath) {
          // File exists, create proper URL
          const relativePath = path.relative(publicDir, actualFilePath);
          photoUrl = '/' + relativePath.split(path.sep).join('/');
        }

        // Check if this subject photo is already in the collection
        if (!existingPhotoUrls.has(photoUrl) && !existingPhotoUrls.has(subjectUrl)) {
          const subjectPhoto = {
            id: result.taskId,
            name: result.subjectFile.name || `subject_${result.taskId.slice(0, 8)}`,
            type: 'subject',
            url: photoUrl,
            sourceUrl: subjectUrl,
            addedAt: result.completedAt || new Date().toISOString(),
            size: actualFilePath ? fs.statSync(actualFilePath).size : 0
          };

          project.subjectPhotos.push(subjectPhoto);
          existingPhotoUrls.add(photoUrl);
          photosAddedCount++;
          projectUpdated = true;

          console.log(`  ✓ Added subject photo for result ${result.taskId.slice(0, 8)}: ${photoUrl}`);
        }
      }
    });
  }

  if (projectUpdated) {
    updatedCount++;
    console.log(`✓ Updated project: ${project.name} (${project.subjectPhotos.length} subject photos)`);
  }
});

// Save updated projects
fs.writeFileSync(projectsPath, JSON.stringify(projects, null, 2));

console.log(`\n✅ Complete!`);
console.log(`- Updated ${updatedCount} projects`);
console.log(`- Added ${photosAddedCount} subject photos`);
