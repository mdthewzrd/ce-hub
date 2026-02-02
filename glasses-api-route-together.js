/**
 * Glasses Compositor API Route - Together AI Integration
 * Workflow: Claude Vision Analysis → Together AI SDXL Generation
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
  const cost = quality === 'draft' ? 0.001 : quality === 'high' ? 0.003 : 0.002;

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
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const togetherKey = process.env.TOGETHER_API_KEY;

  if (!openRouterKey) {
    throw new Error('OPENROUTER_API_KEY not configured for analysis');
  }

  if (!togetherKey) {
    throw new Error('TOGETHER_API_KEY not configured. Get one at https://together.ai (cheap!)');
  }

  // ============================================
  // PHASE 1: CLAUDE VISION ANALYSIS
  // ============================================
  job.status = 'analyzing';
  job.progress = 10;

  const analysisPrompt = `You are an expert image analyzer for AI glasses compositing. Analyze these two images:

IMAGE 1 (Person Photo): Analyze the person's face, position, lighting, and background.
IMAGE 2 (Glasses Photo): Analyze the glasses frame, color, style, and details.

Provide a detailed JSON response with:
{
  "face_analysis": {
    "position": "describe face position and angle",
    "lighting": "describe lighting direction and intensity",
    "skin_tone": "describe skin tone",
    "background": "describe background"
  },
  "glasses_analysis": {
    "frame_type": "type of frames",
    "frame_color": "exact color",
    "lens_type": "type of lenses",
    "style_description": "detailed style description"
  },
  "compositing_prompt": "A detailed prompt for SDXL to generate the person wearing these glasses with perfect photorealism"
}

Return ONLY valid JSON, no other text.`;

  try {
    const analysisResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
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
              { type: 'text', text: analysisPrompt },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${personImage}` } },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${glassesImage}` } }
            ]
          }
        ],
        max_tokens: 2048
      })
    });

    const analysisData = await analysisResponse.json();

    if (analysisData.error) {
      throw new Error(`Analysis API error: ${analysisData.error.message}`);
    }

    job.progress = 40;

    // Extract analysis from response
    const analysisContent = analysisData.choices?.[0]?.message?.content || '';
    const jsonMatch = analysisContent.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Failed to extract analysis from vision API');
    }

    const analysis = JSON.parse(jsonMatch[0]);
    job.faceAnalysis = analysis.face_analysis;
    job.glassesAnalysis = analysis.glasses_analysis;

    // ============================================
    // PHASE 2: TOGETHER AI SDXL GENERATION
    // ============================================
    job.status = 'compositing';
    job.progress = 60;

    // Enhanced prompt for SDXL
    const sdxlPrompt = `${analysis.compositing_prompt}

CRITICAL QUALITY REQUIREMENTS:
- Maintain 100% facial feature accuracy
- Perfect lighting match with original scene
- Photorealistic shadows and reflections on lenses
- Seamless integration, no artifacts
- Professional portrait photography quality
- Match original image style and mood

Negative prompt: (deformed, distorted, disfigured:1.3), poorly drawn face, mutation, mutated, extra limbs, ugly, poorly drawn hands, missing limb, floating limbs, disconnected limbs, malformed hands, blur, out of focus, long neck, long body, mutated hands and fingers, out of frame, extra limbs, disgusting, poorly drawn, childish, mutilated, mangled, old, surreal`;

    // Use Together AI SDXL for image generation
    const generationResponse = await fetch('https://api.together.xyz/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${togetherKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'stabilityai/stable-diffusion-xl-base-1.0',
        prompt: sdxlPrompt,
        negative_prompt: 'deformed, distorted, disfigured, poorly drawn, mutation, ugly, blur, out of focus',
        width: quality === 'high' ? 1024 : 768,
        height: quality === 'high' ? 1024 : 768,
        steps: quality === 'high' ? 50 : 30,
        seed: Math.floor(Math.random() * 1000000)
      })
    });

    job.progress = 80;

    const generationData = await generationResponse.json();

    if (generationData.error) {
      throw new Error(`Generation API error: ${generationData.error.message}`);
    }

    // Extract the generated image
    const imageUrl = generationData.data?.[0]?.url;

    if (!imageUrl) {
      throw new Error('No image URL in generation response');
    }

    // Download the image
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');

    job.status = 'complete';
    job.progress = 100;
    job.result = {
      imageUrl: `data:image/png;base64,${imageBase64}`,
      base64: imageBase64,
      generationUrl: imageUrl
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
