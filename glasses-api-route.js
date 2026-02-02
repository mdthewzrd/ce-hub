/**
 * Glasses Compositor API Route (Express)
 * Standalone implementation for port 7712 server
 */

const express = require('express');
const router = express.Router();

// In-memory job storage
const jobs = new Map();

// Helper: Generate UUID
function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// POST /api/glasses
router.post('/', async (req, res) => {
  const { action, ...data } = req.body;

  try {
    switch (action) {
      case 'compose':
        return await handleCompose(req, res);
      case 'status':
        return await handleStatus(req, res);
      default:
        return res.json({ success: false, error: `Unknown action: ${action}` });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

async function handleCompose(req, res) {
  const { personImage, glassesImage, quality = 'standard' } = req.body;

  if (!personImage || !glassesImage) {
    return res.status(400).json({ success: false, error: 'Both personImage and glassesImage required' });
  }

  const jobId = generateId();
  const job = {
    id: jobId,
    status: 'queued',
    progress: 0,
    cost: quality === 'draft' ? 0.005 : quality === 'high' ? 0.02 : 0.01,
    createdAt: new Date()
  };

  jobs.set(jobId, job);

  // Start processing
  processJob(jobId, personImage, glassesImage, quality).catch(err => {
    console.error(`Job ${jobId} failed:`, err);
    job.status = 'failed';
    job.error = err.message;
  });

  res.json({ success: true, jobId });
}

async function handleStatus(req, res) {
  const { jobId } = req.body;

  if (!jobId) {
    return res.status(400).json({ success: false, error: 'jobId required' });
  }

  const job = jobs.get(jobId);
  res.json({ success: true, job: job || null });
}

async function processJob(jobId, personImage, glassesImage, quality) {
  const job = jobs.get(jobId);
  const apiKey = process.env.OPENROUTER_API_KEY || '';

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  // Phase 1: Analyzing
  job.status = 'analyzing';
  job.progress = 20;

  // Analyze both images together and get composited result
  const prompt = `You are an expert image editor. I need you to add glasses from the second image onto the person in the first image.

CRITICAL INSTRUCTIONS:
1. You must CREATE A NEW IMAGE with the glasses added to the person
2. DO NOT just describe what to do - actually create/modify the image
3. The glasses should look photorealistic - matching lighting, shadows, and reflections
4. Position the glasses naturally on the person's face
5. Preserve the person's appearance exactly - only add the glasses
6. Match the lighting direction and intensity from the original photo
7. Add appropriate shadows where the glasses rest on the nose and ears

Please analyze both images and CREATE/RETURN a new base64 encoded image showing the person wearing the glasses.

Return your response as a base64 encoded image starting with "data:image/png;base64," followed by the base64 string.`;

  job.progress = 40;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:7712',
        'X-Title': 'Glasses Compositor'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${personImage}`
                }
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${glassesImage}`
                }
              }
            ]
          }
        ],
        max_tokens: 4096
      })
    });

    job.progress = 70;

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || 'Vision API error');
    }

    job.status = 'compositing';
    job.progress = 80;

    // Extract the result
    const content = data.choices?.[0]?.message?.content || '';

    // Try to extract base64 image from response
    let resultImage = extractBase64FromResponse(content);

    if (!resultImage) {
      // If no image was generated, the API can't actually modify images
      // This is a limitation - most vision APIs are analysis-only
      throw new Error('The vision API analyzed the images but cannot generate modified images. This feature requires an image generation/editing API like DALL-E 2 or Stable Diffusion with inpainting.');
    }

    job.status = 'complete';
    job.progress = 100;
    job.result = {
      imageUrl: `data:image/png;base64,${resultImage}`,
      base64: resultImage
    };
    job.completedAt = new Date();

  } catch (error) {
    throw error;
  }
}

function extractBase64FromResponse(content) {
  // Look for data:image pattern
  const dataImageMatch = content.match(/data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/);
  if (dataImageMatch) {
    return dataImageMatch[1];
  }

  // Look for just base64 pattern (long alphanumeric strings)
  const base64Match = content.match(/([A-Za-z0-9+/=]{10000,})/);
  if (base64Match) {
    return base64Match[1];
  }

  return null;
}

// Cleanup old jobs
setInterval(() => {
  const now = Date.now();
  for (const [id, job] of jobs.entries()) {
    const age = now - new Date(job.createdAt).getTime();
    if (age > 300000) { // 5 minutes
      jobs.delete(id);
    }
  }
}, 60000);

module.exports = router;
