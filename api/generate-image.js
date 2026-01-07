// Vercel Serverless Function for Hugging Face Image Generation
// This runs server-side, so no CORS issues!

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, apiKey } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (prompt.length < 10) {
      return res.status(400).json({ error: 'Prompt is too short' });
    }

    console.log('🔄 [SERVERLESS] Generating image with Hugging Face...');
    
    const hfApiKey = apiKey || process.env.HUGGINGFACE_API_KEY;
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (hfApiKey) {
      headers['Authorization'] = `Bearer ${hfApiKey}`;
    }

    const response = await fetch(
      'https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0',
      {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            num_inference_steps: 30,
            guidance_scale: 7.5,
          }
        })
      }
    );

    if (response.status === 503) {
      const data = await response.json();
      return res.status(503).json({
        error: 'Model is loading',
        estimated_time: data.estimated_time || 20
      });
    }

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ [SERVERLESS] Hugging Face error:', errorData);
      return res.status(response.status).json({ error: errorData });
    }

    // Get the image buffer
    const imageBuffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') || 'image/png';
    
    console.log('✅ [SERVERLESS] Image generated successfully');
    
    // Send image as base64
    const base64Image = imageBuffer.toString('base64');
    res.json({
      image: `data:${contentType};base64,${base64Image}`
    });
  } catch (error) {
    console.error('❌ [SERVERLESS] Error:', error);
    res.status(500).json({ error: error.message });
  }
}





