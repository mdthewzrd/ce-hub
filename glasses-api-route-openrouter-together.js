/**
 * Glasses Compositor API Route - Open Router + Together AI
 * BEST COMBO: Claude 3.5 Analysis → SDXL Generation
 * Cost: ~$0.0015 per image
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
  const cost = 0.0015; // $0.0005 for analysis + $0.001 for generation

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

  if (!openRouterKey || openRouterKey.includes('YOUR_KEY_HERE')) {
    throw new Error('OPENROUTER_API_KEY not configured. Add it to .env file.');
  }

  if (!togetherKey || togetherKey.includes('YOUR_KEY_HERE')) {
    throw new Error('TOGETHER_API_KEY not configured. Get free $5 credit at https://together.ai');
  }

  try {
    // ============================================
    // PHASE 1: OPEN ROUTER - CLAUDE 3.5 ANALYSIS
    // ============================================
    job.status = 'analyzing';
    job.progress = 10;

    console.log(`[${jobId}] Starting Claude 3.5 analysis via Open Router...`);

    const analysisPrompt = `You are an expert image analyzer for AI glasses compositing. Analyze these two images:

IMAGE 1 (Person Photo): Analyze the person's face, position, lighting, skin tone, hair, clothing, and background.
IMAGE 2 (Glasses Photo): Analyze the glasses frame type, color, lens type, size, and style.

Provide a detailed analysis in this format:

FACE ANALYSIS:
- Position and angle:
- Lighting direction and intensity:
- Skin tone:
- Hair color and style:
- Background description:
- Clothing description:

GLASSES ANALYSIS:
- Frame type:
- Frame color:
- Lens type:
- Frame size:
- Style details:

COMPOSITING PROMPT FOR SDXL:
[Create a detailed prompt that describes exactly how to generate the person from IMAGE 1 wearing the glasses from IMAGE 2. Include all the details above. Focus on photorealism, matching lighting, perfect positioning, and maintaining 100% facial accuracy.]`;

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
        max_tokens: 4096
      })
    });

    job.progress = 30;

    const analysisData = await analysisResponse.json();

    if (analysisData.error) {
      throw new Error(`Open Router analysis error: ${analysisData.error.message}`);
    }

    const analysisContent = analysisData.choices?.[0]?.message?.content || '';

    console.log(`[${jobId}] Claude analysis complete, generating prompt...`);

    // Extract the compositing prompt
    const promptMatch = analysisContent.match(/COMPOSITING PROMPT FOR SDXL:([\s\S]+)/i);
    const compositingPrompt = promptMatch
      ? promptMatch[1].trim()
      : analysisContent;

    job.faceAnalysis = { description: 'Claude 3.5 analysis complete' };
    job.glassesAnalysis = { description: 'Glasses analyzed' };

    job.progress = 50;

    // ============================================
    // PHASE 2: TOGETHER AI - SDXL GENERATION
    // ============================================
    job.status = 'compositing';
    job.progress = 60;

    console.log(`[${jobId}] Starting SDXL generation via Together AI...`);

    // Enhanced prompt for SDXL
    const sdxlPrompt = `${compositingPrompt}

CRITICAL TECHNICAL REQUIREMENTS:
- Maintain 100% facial feature accuracy - the person must look identical
- Add ONLY the glasses - do not change face, hair, or body
- Match lighting direction and intensity from original photo
- Add photorealistic shadows where glasses touch face
- Add subtle lens reflections matching environment
- Professional portrait photography quality
- Seamless integration, no artifacts, no blurring
- Natural fit on face with proper bridge alignment

QUALITY METRICS:
- Photorealism: 100%
- Facial accuracy: 100%
- Lighting match: Perfect
- Shadow consistency: Perfect
- No artifacts: Guaranteed`;

    const negativePrompt = `deformed, distorted, disfigured:1.5, poorly drawn face, mutation, mutated, extra limbs, ugly, poorly drawn hands, missing limb, floating limbs, disconnected limbs, malformed hands, blur, out of focus, long neck, long body, mutated hands and fingers, out of frame, extra limbs, disgusting, poorly drawn, childish, mutilated, mangled, old, surreal, different face, changed face, different person, glasses not matching, unnatural, fake, artificial, low quality, bad quality, artifacts`;

    const generationResponse = await fetch('https://api.together.xyz/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${togetherKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'stabilityai/stable-diffusion-xl-base-1.0',
        prompt: sdxlPrompt,
        negative_prompt: negativePrompt,
        width: quality === 'high' ? 1024 : 768,
        height: quality === 'high' ? 1024 : 768,
        steps: quality === 'high' ? 50 : 30,
        seed: Math.floor(Math.random() * 1000000),
        scheduler: 'DPMSolverMultistep'
      })
    });

    job.progress = 80;

    const generationData = await generationResponse.json();

    if (generationData.error) {
      throw new Error(`Together AI generation error: ${generationData.error.message}`);
    }

    console.log(`[${jobId}] SDXL generation complete, downloading image...`);

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

    console.log(`[${jobId}] Job complete!`);

  } catch (error) {
    console.error(`[${jobId}] Error:`, error);
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
