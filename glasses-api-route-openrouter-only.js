/**
 * Glasses Compositor API Route - Open Router ONLY
 * Using: Claude 3.5 Sonnet (analysis) + Nano Banana (generation)
 * ALL through Open Router - one API key for everything!
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
  const { personImage, glassesImage, quality = 'standard', apiKey: clientApiKey } = req.body;

  if (!personImage || !glassesImage) {
    return res.status(400).json({ success: false, error: 'Both personImage and glassesImage required' });
  }

  const jobId = generateId();
  const cost = quality === 'draft' ? 0.002 : quality === 'high' ? 0.01 : 0.005;

  const job = {
    id: jobId,
    status: 'queued',
    progress: 0,
    cost,
    createdAt: new Date()
  };

  jobs.set(jobId, job);

  // Start processing
  processJob(jobId, personImage, glassesImage, quality, clientApiKey).catch(err => {
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

async function processJob(jobId, personImage, glassesImage, quality, clientApiKey) {
  const job = jobs.get(jobId);
  // Use client-provided key first, fall back to environment variable
  const openRouterKey = clientApiKey || process.env.OPENROUTER_API_KEY;

  if (!openRouterKey || openRouterKey.includes('YOUR_KEY_HERE') || openRouterKey.length < 20) {
    throw new Error('OPENROUTER_API_KEY not configured. Please add it in Settings.');
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

COMPOSITING PROMPT FOR IMAGE GENERATION:
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

    console.log(`[${jobId}] Claude analysis complete, extracting prompt...`);

    // Extract the compositing prompt
    const promptMatch = analysisContent.match(/COMPOSITING PROMPT FOR IMAGE GENERATION:([\s\S]+)/i);
    const compositingPrompt = promptMatch
      ? promptMatch[1].trim()
      : analysisContent;

    job.faceAnalysis = { description: 'Claude 3.5 analysis complete' };
    job.glassesAnalysis = { description: 'Glasses analyzed' };

    job.progress = 50;

    // ============================================
    // PHASE 2: OPEN ROUTER - NANO BANANA GENERATION
    // ============================================
    job.status = 'compositing';
    job.progress = 60;

    console.log(`[${jobId}] Starting Nano Banana generation via Open Router...`);

    // Enhanced prompt for Nano Banana (Gemini 2.5 Flash)
    const finalPrompt = `${compositingPrompt}

CRITICAL TECHNICAL REQUIREMENTS FOR IMAGE GENERATION:
- Maintain 100% facial feature accuracy - the person must look identical
- Add ONLY the glasses - do not change face, hair, or body
- Match lighting direction and intensity from original photo
- Add photorealistic shadows where glasses touch face
- Add subtle lens reflections matching environment
- Professional portrait photography quality
- Seamless integration, no artifacts, no blurring
- Natural fit on face with proper bridge alignment
- Preserve original person's identity exactly

The output should be a single photorealistic portrait image showing the person wearing the glasses naturally.`;

    // Call Nano Banana through Open Router for image generation
    const generationResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:7712',
        'X-Title': 'Glasses Compositor'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-exp', // Nano Banana
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: finalPrompt },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${personImage}` } },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${glassesImage}` } }
            ]
          }
        ],
        modalities: ['image', 'text'], // KEY: Request both image and text output
        image_config: {
          aspect_ratio: quality === 'high' ? '1:1' : '3:4', // Portrait aspect ratio for faces
          image_size: quality === 'high' ? '2K' : '1K'
        },
        max_tokens: 4096
      })
    });

    job.progress = 80;

    const generationData = await generationResponse.json();

    if (generationData.error) {
      throw new Error(`Open Router generation error: ${generationData.error.message}`);
    }

    console.log(`[${jobId}] Nano Banana generation complete, processing result...`);

    // Extract image from response using Open Router's format
    const message = generationData.choices?.[0]?.message;
    const images = message?.images;

    if (!images || images.length === 0) {
      // Fallback: check if there's an image URL in content
      const resultContent = message?.content || '';

      // Try to extract base64 image from content
      const base64Match = resultContent.match(/data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/);
      if (base64Match) {
        const imageBase64 = base64Match[1];
        job.status = 'complete';
        job.progress = 100;
        job.result = {
          imageUrl: `data:image/png;base64,${imageBase64}`,
          base64: imageBase64
        };
        job.completedAt = new Date();
        console.log(`[${jobId}] Job complete! (extracted from content)`);
        return;
      }

      throw new Error('No images in response. The model may not support image generation or the request format was incorrect.');
    }

    // Extract base64 from the first image
    const imageDataUrl = images[0].image_url?.url;

    if (!imageDataUrl) {
      throw new Error('Image data URL not found in response');
    }

    // Remove the data:image/png;base64, prefix if present
    const imageBase64 = imageDataUrl.replace(/^data:image\/[^;]+;base64,/, '');

    job.status = 'complete';
    job.progress = 100;
    job.result = {
      imageUrl: imageDataUrl, // Keep the full data URL
      base64: imageBase64      // Just the base64 string
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
