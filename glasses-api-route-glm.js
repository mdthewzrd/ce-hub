/**
 * Glasses Compositor API Route - GLM (Zhipu AI) Integration
 * Workflow: GLM-4V Analysis → GLM Image Generation
 * Uses your existing GLM_API_KEY - no new keys needed!
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
  const cost = 0.001; // GLM is very cheap

  const job = {
    id: jobId,
    status: 'queued',
    progress: 0,
    cost,
    createdAt: new Date()
  };

  jobs.set(jobId, job);

  // Start processing
  processJob(jobId, personImage, glassesImage, quality).catch(err => {
    console.error(`Job ${jobId} failed:`, err);
    job.status = 'failed';
    job.error = err.message;
  });

  res.json({ success: true, jobId, estimatedCost: cost });
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
  const glmKey = process.env.GLM_API_KEY;
  const glmBaseURL = process.env.ZHIPU_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4';

  if (!glmKey || glmKey.includes('YOUR_KEY_HERE')) {
    throw new Error('GLM_API_KEY not properly configured');
  }

  try {
    // ============================================
    // PHASE 1: GLM-4V ANALYSIS
    // ============================================
    job.status = 'analyzing';
    job.progress = 20;

    const analysisPrompt = `You are an expert image analyzer. Analyze these two images and provide a detailed description for AI image generation:

IMAGE 1: A person's photo
IMAGE 2: Glasses photo

Please provide:
1. Detailed description of the person (face, hair, clothing, background, lighting)
2. Detailed description of the glasses (frame style, color, lens type)
3. A precise prompt for generating an image of this person wearing these glasses with perfect photorealism

Focus on details that will help recreate the person exactly, just with glasses added.`;

    const analysisResponse = await fetch(`${glmBaseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${glmKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'glm-4v',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: analysisPrompt },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${personImage}` } },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${glassesImage}` } }
            ]
          }
        ],
        max_tokens: 2048,
        temperature: 0.7
      })
    });

    job.progress = 40;

    const analysisData = await analysisResponse.json();

    if (analysisData.error) {
      throw new Error(`GLM analysis error: ${JSON.stringify(analysisData.error)}`);
    }

    const analysis = analysisData.choices?.[0]?.message?.content || '';

    job.faceAnalysis = { description: 'Analysis complete' };
    job.glassesAnalysis = { description: 'Glasses analyzed' };

    // ============================================
    // PHASE 2: GLM IMAGE GENERATION
    // ============================================
    job.status = 'compositing';
    job.progress = 60;

    const generationPrompt = `${analysis}

Based on the analysis above, generate a photorealistic image of the person wearing the glasses.

CRITICAL REQUIREMENTS:
1. Maintain 100% facial feature accuracy - the person must look exactly the same
2. Add only the glasses - do not change anything else about the person
3. Match lighting, shadows, and reflections perfectly
4. Professional portrait photography quality
5. Seamless integration, no artifacts or blurring

Generate the image now.`;

    // Use GLM's image generation (cogview)
    const generationResponse = await fetch(`${glmBaseURL}/images/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${glmKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'cogview-3',
        prompt: generationPrompt,
        size: quality === 'high' ? '1024x1024' : '768x768'
      })
    });

    job.progress = 80;

    const generationData = await generationResponse.json();

    if (generationData.error) {
      throw new Error(`GLM generation error: ${JSON.stringify(generationData.error)}`);
    }

    // Extract the generated image
    const imageData = generationData.data?.[0];

    if (!imageData) {
      throw new Error('No image data in generation response');
    }

    // GLM returns base64 directly
    const imageBase64 = imageData.b64_json || imageData.url;

    // If it's a URL, download it
    let finalBase64 = imageBase64;
    if (imageData.url && !imageData.b64_json) {
      const imageResponse = await fetch(imageData.url);
      const buffer = await imageResponse.arrayBuffer();
      finalBase64 = Buffer.from(buffer).toString('base64');
    }

    job.status = 'complete';
    job.progress = 100;
    job.result = {
      imageUrl: `data:image/png;base64,${finalBase64}`,
      base64: finalBase64
    };
    job.completedAt = new Date();

  } catch (error) {
    throw error;
  }
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
