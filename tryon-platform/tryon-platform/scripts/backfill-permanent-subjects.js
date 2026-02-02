/**
 * Backfill Script: Copy all existing result subject images to permanent storage
 *
 * This script:
 * 1. Reads all projects from data/projects.json
 * 2. For each result, copies the subject image to permanent storage
 * 3. Updates the subjectFile URL to point to the permanent location
 * 4. Adds subject photos to the project's subjectPhotos collection
 * 5. Saves the updated projects.json
 */

const fs = require('fs');
const path = require('path');

const projectsPath = path.join(__dirname, '../data/projects.json');
const publicDir = path.join(__dirname, '../public');

// Function to resolve URL to filesystem path
const resolveUrlToPath = (url) => {
  if (url.startsWith('http')) {
    const urlObj = new URL(url);
    return path.join(__dirname, '..', 'public', urlObj.pathname);
  } else if (url.startsWith('/uploads')) {
    return path.join(__dirname, '..', 'public', url);
  } else if (url.startsWith('/project-subjects')) {
    return path.join(__dirname, '..', 'public', url);
  } else {
    return path.join(__dirname, '..', url);
  }
};

// Read projects
console.log('Reading projects.json...');
const projectsData = fs.readFileSync(projectsPath, 'utf-8');
const projects = JSON.parse(projectsData);

let totalResults = 0;
let successfulCopies = 0;
let failedCopies = 0;
let alreadyPermanent = 0;

projects.forEach((project, projectIndex) => {
  console.log(`\nProcessing project: ${project.name} (${project.id})`);

  if (!project.results || project.results.length === 0) {
    console.log('  No results found.');
    return;
  }

  // Initialize subjectPhotos array if it doesn't exist
  if (!project.subjectPhotos) {
    project.subjectPhotos = [];
  }

  project.results.forEach((result, resultIndex) => {
    totalResults++;

    const subjectFile = result.subjectFile;
    if (!subjectFile) {
      console.log(`  Result ${resultIndex}: No subject file, skipping.`);
      return;
    }

    // Check if already permanent
    if (subjectFile.permanent) {
      alreadyPermanent++;
      console.log(`  Result ${resultIndex}: Already permanent, skipping.`);
      return;
    }

    const sourceUrl = subjectFile.url;
    console.log(`  Result ${resultIndex}: Processing ${sourceUrl}`);

    // Determine source path
    const sourcePath = resolveUrlToPath(sourceUrl);

    // Check if source exists
    if (!fs.existsSync(sourcePath)) {
      console.log(`    ❌ Source file not found: ${sourcePath}`);
      failedCopies++;
      return;
    }

    // Create permanent storage directory
    const permanentDir = path.join(publicDir, 'project-subjects', project.id);
    if (!fs.existsSync(permanentDir)) {
      fs.mkdirSync(permanentDir, { recursive: true });
      console.log(`    Created directory: ${permanentDir}`);
    }

    // Copy subject image
    const ext = path.extname(sourcePath) || '.jpg';
    const permanentFileName = `${result.taskId}${ext}`;
    const permanentPath = path.join(permanentDir, permanentFileName);

    try {
      fs.copyFileSync(sourcePath, permanentPath);
      const permanentSubjectUrl = `/project-subjects/${project.id}/${permanentFileName}`;
      console.log(`    ✅ Copied to: ${permanentSubjectUrl}`);

      // Update result's subjectFile
      project.results[resultIndex].subjectFile = {
        ...subjectFile,
        url: permanentSubjectUrl,
        permanent: true
      };

      // Add to project's subjectPhotos collection if not already there
      const existsInProject = project.subjectPhotos.some(
        p => p.url === permanentSubjectUrl || p.sourceUrl === sourceUrl
      );

      if (!existsInProject) {
        project.subjectPhotos.push({
          id: result.taskId,
          name: subjectFile.name || `subject_${result.taskId}`,
          type: 'subject',
          url: permanentSubjectUrl,
          sourceUrl: sourceUrl,
          addedAt: new Date().toISOString(),
          size: fs.statSync(sourcePath).size
        });
        console.log(`    ➕ Added to project subject photos`);
      }

      successfulCopies++;
    } catch (error) {
      console.log(`    ❌ Failed to copy: ${error.message}`);
      failedCopies++;
    }
  });

  // Update project timestamp
  project.updatedAt = new Date().toISOString();
});

// Save updated projects
console.log('\n\nSaving updated projects.json...');
fs.writeFileSync(projectsPath, JSON.stringify(projects, null, 2));

console.log('\n\n=== BACKFILL COMPLETE ===');
console.log(`Total results processed: ${totalResults}`);
console.log(`Successfully copied: ${successfulCopies}`);
console.log(`Already permanent: ${alreadyPermanent}`);
console.log(`Failed (source not found): ${failedCopies}`);
console.log('\nAll existing results now have permanent subject storage!');
