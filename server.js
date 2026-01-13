// Express server: Serves static files in production
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// OpenRouter API Configuration with Key Rotation
// Support multiple API keys separated by commas
const OPENROUTER_API_KEYS = (process.env.OPENROUTER_API_KEYS || process.env.OPENROUTER_API_KEY || '')
  .split(',')
  .map(key => key.trim())
  .filter(key => key.length > 0);

let currentKeyIndex = 0;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Get current API key
const getCurrentApiKey = () => {
  if (OPENROUTER_API_KEYS.length === 0) return null;
  return OPENROUTER_API_KEYS[currentKeyIndex];
};

// Rotate to next API key (called when rate limited)
const rotateApiKey = () => {
  if (OPENROUTER_API_KEYS.length <= 1) return false;
  const oldIndex = currentKeyIndex;
  currentKeyIndex = (currentKeyIndex + 1) % OPENROUTER_API_KEYS.length;
  console.log(`🔄 [API KEY] Rotated from key ${oldIndex + 1} to key ${currentKeyIndex + 1} of ${OPENROUTER_API_KEYS.length}`);
  return true;
};

// Legacy support
const OPENROUTER_API_KEY = getCurrentApiKey();

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// Enable CORS for all routes
app.use(cors());
// Increase body size limit for image uploads (50MB should be enough for base64 images)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Log all incoming API requests
app.all('/api/*', (req, res, next) => {
  console.log('📥 [SERVER] Incoming:', req.method, req.path);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const currentKey = getCurrentApiKey();
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    openrouter_configured: !!currentKey,
    openrouter_key_preview: currentKey ? currentKey.substring(0, 10) + '...' : 'NOT SET',
    total_api_keys: OPENROUTER_API_KEYS.length,
    current_key_index: currentKeyIndex + 1
  });
});

// Test endpoint to check OpenRouter API directly
app.post('/api/test-openrouter', async (req, res) => {
  console.log('🧪 [TEST] Testing OpenRouter API...');
  
  const apiKey = getCurrentApiKey();
  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error: 'OPENROUTER_API_KEYS not set in environment variables'
    });
  }
  
  try {
    const origin = process.env.ORIGIN || 'http://localhost:5173';
    console.log('🧪 [TEST] API Key:', apiKey.substring(0, 10) + '...');
    console.log('🧪 [TEST] Using key', currentKeyIndex + 1, 'of', OPENROUTER_API_KEYS.length);
    console.log('🧪 [TEST] Origin:', origin);
    console.log('🧪 [TEST] Model: google/gemini-2.5-flash-lite');
    
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': origin,
        'X-Title': 'Hair Recommendation System'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          {
            role: 'system',
            content: 'ONLY return valid JSON. Do not add commentary.'
          },
          {
            role: 'user',
            content: 'Return this JSON: {"test": "success"}'
          }
        ],
        temperature: 0.2,
        max_tokens: 100
      })
    });
    
    console.log('🧪 [TEST] Response status:', response.status);
    console.log('🧪 [TEST] Response ok:', response.ok);
    
    const responseText = await response.text();
    console.log('🧪 [TEST] Response body:', responseText.substring(0, 500));
    
    if (!response.ok) {
      // If rate limited, try rotating to next key
      if (response.status === 429 || responseText.includes('rate') || responseText.includes('limit')) {
        if (rotateApiKey()) {
          return res.status(response.status).json({
            success: false,
            error: 'Rate limited - rotated to next API key',
            status: response.status,
            response: responseText,
            rotated: true,
            new_key_index: currentKeyIndex + 1
          });
        }
      }
      return res.status(response.status).json({
        success: false,
        error: 'OpenRouter API error',
        status: response.status,
        response: responseText
      });
    }
    
    return res.json({
      success: true,
      status: response.status,
      response: responseText.substring(0, 500),
      current_key_index: currentKeyIndex + 1,
      total_keys: OPENROUTER_API_KEYS.length
    });
    
  } catch (error) {
    console.error('🧪 [TEST] Exception:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

// Validate API keys are set
// Validate API keys
if (OPENROUTER_API_KEYS.length === 0) {
  console.error('⚠️ [WARNING] OPENROUTER_API_KEYS is not set! AI features will not work.');
} else {
  console.log(`✅ [API KEYS] Loaded ${OPENROUTER_API_KEYS.length} OpenRouter key(s) for AI features`);
}

// Hair Recommendation endpoint using OpenRouter API
app.post('/api/recommendations', async (req, res) => {
  console.log('═'.repeat(60));
  console.log('🤖 [OPENROUTER] Received recommendation request');
  console.log('═'.repeat(60));
  
  // Check OpenRouter API key
  const apiKey = getCurrentApiKey();
  if (!apiKey) {
    console.error('❌ [ERROR] No OpenRouter API keys configured!');
    return res.status(401).json({
      success: false,
      error: 'OpenRouter API key not configured',
      fallback: 'rule_based'
    });
  }
  
  console.log(`🔑 [API KEY] Using key ${currentKeyIndex + 1} of ${OPENROUTER_API_KEYS.length}`);
  
  try {
    const { userData } = req.body;
    
    if (!userData) {
      return res.status(400).json({ 
        success: false, 
        error: 'userData is required',
        received: req.body
      });
    }
    
    console.log('✅ [VALIDATION] userData is valid, proceeding with OpenRouter AI');
    
    // Prepare user profile for AI
    const gender = userData.gender || '';
    const faceShape = userData.faceShape || 'unknown';
    const skinTone = userData.skinTone?.label || userData.skinTone?.value || userData.skinTone || 'unknown';
    const hairLength = userData.hairLength || 'any';
    const hairType = userData.hairType || 'any';
    const stylePreferences = userData.stylePreferences || [];
    const customDescription = userData.customDescription || '';
    
    // Create detailed prompt for AI
    const prompt = `You are a professional hairstylist AI. Based on the user's profile, recommend the BEST hairstyles.

USER PROFILE:
- Gender: ${gender || 'not specified'}
- Face Shape: ${faceShape}
- Skin Tone: ${skinTone}
- Hair Length Preference: ${hairLength}
- Hair Type Preference: ${hairType}
- Style Preferences: ${stylePreferences.length > 0 ? stylePreferences.join(', ') : 'none'}${customDescription ? `\n- Additional Requirements: ${customDescription}` : ''}

INSTRUCTIONS:
1. Generate exactly 5 hairstyle recommendations that BEST match the user
2. Recommend ANY real hairstyles - be specific (e.g., "Textured French Crop" not just "Short Hair")
3. Consider trending and classic styles
4. ${customDescription ? `Pay attention to: "${customDescription}"` : ''}

Return ONLY valid JSON (no markdown, no code blocks):
{
  "recommendations": [
    {
      "id": 1,
      "name": "Specific Hairstyle Name",
      "category": "Short/Medium/Long",
      "hairType": "straight/wavy/curly/coily",
      "matchScore": 95,
      "whyRecommendation": "2-3 sentence explanation why this suits them."
    }
  ]
}`;

    console.log('🤖 [OPENROUTER] Calling OpenRouter API...');
    const origin = process.env.ORIGIN || 'http://localhost:5173';
    
    // Call OpenRouter API
    let response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': origin,
        'X-Title': 'Hair Recommendation System'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages: [
          { role: 'system', content: 'Return ONLY valid JSON. No markdown, no commentary.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });
    
    // If rate limited, try rotating to next key
    if (response.status === 429 || response.status === 402) {
      console.log('⚠️ [OPENROUTER] Rate limited, trying next API key...');
      if (rotateApiKey()) {
        const newApiKey = getCurrentApiKey();
        response = await fetch(OPENROUTER_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${newApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': origin,
            'X-Title': 'Hair Recommendation System'
          },
          body: JSON.stringify({
            model: 'google/gemini-2.0-flash-001',
            messages: [
              { role: 'system', content: 'Return ONLY valid JSON. No markdown, no commentary.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 2000
          })
        });
      }
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [OPENROUTER] API Error:', response.status, errorText);
      return res.status(response.status).json({
        success: false,
        error: 'OpenRouter API error',
        details: errorText,
        fallback: 'rule_based'
      });
    }
    
    const data = await response.json();
    console.log('✅ [OPENROUTER] Got response from API');
    
    // Extract the AI response
    const aiResponse = data.choices?.[0]?.message?.content || '';
    console.log('🤖 [OPENROUTER] AI Response preview:', aiResponse.substring(0, 300));
    
    // Parse JSON from response
    let recommendations = null;
    let cleanedResponse = aiResponse.trim();
    
    // Remove markdown code blocks if present
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }
    
    try {
      const parsed = JSON.parse(cleanedResponse);
      recommendations = parsed.recommendations || parsed;
      
      if (!Array.isArray(recommendations)) {
        throw new Error('Response is not an array');
      }
    } catch (parseError) {
      console.error('❌ [OPENROUTER] JSON Parse Error:', parseError.message);
      
      // Try to extract JSON from text
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*"recommendations"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          recommendations = parsed.recommendations;
        } catch (e) {
          return res.status(500).json({
            success: false,
            error: 'Failed to parse AI response',
            fallback: 'rule_based'
          });
        }
      } else {
        return res.status(500).json({
          success: false,
          error: 'AI did not return valid JSON',
          fallback: 'rule_based'
        });
      }
    }
    
    // Format recommendations
    const formattedRecommendations = recommendations.slice(0, 5).map((aiRec, index) => ({
      id: aiRec.id || index + 1,
      name: aiRec.name,
      category: aiRec.category || 'Medium',
      hairType: aiRec.hairType || 'straight',
      gender: gender || 'both',
      matchScore: Math.min(100, Math.max(0, aiRec.matchScore || 85)),
      whyRecommendation: aiRec.whyRecommendation || 'AI-recommended based on your features',
      matchReasons: [aiRec.whyRecommendation || 'AI-recommended'],
      aiGenerated: true
    }));
    
    console.log('✅ [OPENROUTER] Generated', formattedRecommendations.length, 'recommendations');
    console.log('✅ [OPENROUTER] Hairstyles:', formattedRecommendations.map(r => r.name).join(', '));
    
    return res.json({
      success: true,
      recommendations: formattedRecommendations,
      source: 'openrouter_ai'
    });
    
  } catch (error) {
    console.error('❌ [OPENROUTER] Exception:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
      fallback: 'rule_based'
    });
  }
});

// AI Image Generation endpoint using OpenRouter Gemini 2.5 Flash Image
app.post('/api/generate-image', async (req, res) => {
  console.log('═'.repeat(60));
  console.log('🎨 [IMAGE GENERATION] Received image generation request');
  console.log('═'.repeat(60));
  
  try {
    const { userImage, hairstyle, userData } = req.body;
    
    // Validation
    if (!userImage) {
      return res.status(400).json({ 
        success: false, 
        error: 'userImage is required (base64 encoded image)' 
      });
    }
    
    if (!hairstyle || !hairstyle.name) {
      return res.status(400).json({ 
        success: false, 
        error: 'hairstyle with name is required' 
      });
    }
    
    // Get gender from userData or hairstyle
    const gender = userData?.gender || hairstyle?.gender || '';
    
    // Get hair color from userData
    const hairColor = userData?.hairColor || '';
    
    const imageApiKey = getCurrentApiKey();
    if (!imageApiKey) {
      return res.status(500).json({
        success: false,
        error: 'No API keys configured'
      });
    }
    
    console.log('🎨 [IMAGE] Generating image with hairstyle:', hairstyle.name);
    console.log('🎨 [IMAGE] User image length:', userImage.length, 'chars');
    console.log('🎨 [IMAGE] Hair color:', hairColor);
    console.log('🎨 [IMAGE] Using API key', currentKeyIndex + 1, 'of', OPENROUTER_API_KEYS.length);
    
    // Generate detailed hairstyle description based on name and gender
    const getHairstyleDescription = (name, category, hairType, genderParam = '') => {
      const nameLower = name.toLowerCase();
      const genderContext = genderParam ? ` for a ${genderParam}` : '';
      
      // Specific detailed descriptions for different hairstyles
      if (nameLower.includes('pixie')) {
        return `a Pixie Cut${genderContext} - a very short hairstyle with hair typically 1-3 inches long. The back and sides are cut very short and tapered, while the top is slightly longer and can be styled with texture and volume. The style features layered, textured hair that can be spiky, tousled, or smoothed down. It's a bold, edgy look with short bangs that frame the face. The hair should be cropped close to the head on the sides and back, with more length on the crown area for styling.`;
      } else if (nameLower.includes('bob')) {
        return `a Bob Cut${genderContext} - a classic chin-length or shoulder-length hairstyle that's cut straight around the head. The hair should be one length or slightly layered, ending at or just below the jawline. It can be straight or have soft waves, and frames the face beautifully.`;
      } else if (nameLower.includes('undercut')) {
        return `an Undercut${genderContext} - a modern short hairstyle where the sides and back are shaved very short or faded, while the top is left significantly longer. The contrast between the short sides and longer top creates a bold, edgy look. The top can be styled forward, swept to the side, or textured.`;
      } else if (nameLower.includes('fade')) {
        return `a Fade Cut${genderContext} - a short hairstyle featuring a gradual fade from very short at the bottom to longer on top. The sides and back fade smoothly, creating a clean, professional look. The top can be styled with texture, volume, or kept neat and polished.`;
      } else if (nameLower.includes('pompadour')) {
        return `a Pompadour${genderContext} - a classic hairstyle with volume and height at the front. The hair is swept up and back from the forehead, creating a voluminous, stylish look. The sides are typically shorter, and the top has significant height and volume.`;
      } else if (nameLower.includes('classic short')) {
        return `a Classic Short Cut${genderContext} - a traditional, clean-cut short hairstyle that's professional and timeless. The hair is evenly cut short all around, typically 1-2 inches in length, with a neat, polished appearance. It's versatile and works well for professional settings.`;
      } else if (nameLower.includes('medium length textured') || (nameLower.includes('medium') && nameLower.includes('textured'))) {
        return `Medium Length Textured${genderContext} - medium-length hair with added texture and movement. The hair falls between the ears and shoulders with natural or styled texture, creating a modern, casual look. It can be styled messy or neat depending on preference.`;
      } else if (nameLower.includes('long hair') && genderParam === 'male') {
        return `Long Hair${genderContext} - long hair that extends past the shoulders with a masculine styling. The hair can be worn straight, wavy, or with natural texture. It should be styled in a way that maintains a masculine appearance while showcasing the length and movement.`;
      } else if (nameLower.includes('long wavy') || nameLower.includes('long') && nameLower.includes('wavy')) {
        return `Long Wavy hair${genderContext} - hair that extends past the shoulders with natural or styled waves. The waves should be soft and flowing, creating movement and volume throughout the hair. The style should have texture and dimension.`;
      } else if (nameLower.includes('layered medium')) {
        return `Layered Medium hair${genderContext} - medium-length hair (between chin and shoulders) with multiple layers throughout. The layers should add volume and movement, with shorter layers framing the face and longer layers providing body.`;
      } else if (nameLower.includes('shag')) {
        return `a Shag cut${genderContext} - a layered hairstyle with lots of texture and movement. It features choppy, uneven layers throughout, typically with face-framing pieces and volume at the crown. The style should look effortless and slightly messy.`;
      } else if (nameLower.includes('afro') || nameLower.includes('curly')) {
        return `${name}${genderContext} - hair with tight curls or coils that form a voluminous, rounded shape. The curls should be well-defined and full-bodied, creating natural texture and volume.`;
      } else if (category && category.toLowerCase().includes('short')) {
        return `${name}${genderContext} - a short hairstyle. Ensure the hair is cut very short, typically 1-4 inches in length, with appropriate styling for the specific cut and gender.`;
      }
      
      // Generic fallback description
      return `${name}${genderContext} - a ${category || ''} ${hairType || ''} hairstyle. The hair should match the characteristics of this specific style name and be styled appropriately${genderContext ? ` for ${genderParam}` : ''}.`;
    };
    
    const hairstyleDescription = getHairstyleDescription(
      hairstyle.name,
      hairstyle.category,
      hairstyle.hairType,
      gender
    );
    
    // Prepare prompt for image editing with detailed description
    const genderInstruction = gender ? `Style the hair in a ${gender}-appropriate way. ` : '';
    
    // Format hair color instruction
    let hairColorInstruction = '';
    if (hairColor) {
      // Check if it's a hex code (starts with #) or a color name
      if (hairColor.startsWith('#')) {
        hairColorInstruction = `\n- CRITICAL: The hair color MUST be exactly ${hairColor} (hex color code). This is the user's selected hair color and must match precisely.`;
      } else {
        // It's a color name like "black", "brown", etc.
        const colorName = hairColor.charAt(0).toUpperCase() + hairColor.slice(1);
        hairColorInstruction = `\n- CRITICAL: The hair color MUST be ${colorName}. This is the user's selected hair color and must match exactly. Do not use any other hair color.`;
      }
    }
    
    const prompt = `Edit this person's photo to give them the hairstyle: "${hairstyle.name}". 
    
Hairstyle Details: ${hairstyleDescription}
${gender ? `\nGender: ${gender}` : ''}${hairColor ? `\nHair Color: ${hairColor}` : ''}

Requirements:
- Keep the person's face, facial features, and skin tone exactly the same
- Only change the hair to match the hairstyle description above
- ${genderInstruction}The hair must be styled exactly as described in the Hairstyle Details section${hairColorInstruction}
- Make it look natural and realistic with proper hair texture and styling
- Maintain the original image quality and lighting
- Keep the background unchanged
- The hair should fit naturally with the person's face shape
- Ensure the hairstyle matches all the specific characteristics described above, especially the length, texture, and styling details
${gender ? `- Style the hair in a way that is appropriate for ${gender}` : ''}${hairColor ? `\n- IMPORTANT: The generated hair color must be exactly ${hairColor}. This is non-negotiable and must be accurate.` : ''}

Generate the edited image showing this person with the new hairstyle applied accurately with the correct hair color.`;
    
    const origin = process.env.ORIGIN || 'http://localhost:5173';
    
    console.log('🎨 [IMAGE] Calling OpenRouter API with model: google/gemini-2.5-flash-image');
    
    // Call OpenRouter API for image generation with key rotation support
    let response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${imageApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': origin,
        'X-Title': 'Hair Recommendation System - Image Generation'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
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
                  url: userImage // Base64 data URL or URL
                }
              }
            ]
          }
        ],
        max_tokens: 1000
      })
    });
    
    // If rate limited, try rotating to next key and retry
    if (response.status === 429 || response.status === 402) {
      console.log('⚠️ [IMAGE] Rate limited, trying next API key...');
      
      if (rotateApiKey()) {
        const newApiKey = getCurrentApiKey();
        console.log('🔄 [IMAGE] Retrying with key', currentKeyIndex + 1);
        
        response = await fetch(OPENROUTER_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${newApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': origin,
            'X-Title': 'Hair Recommendation System - Image Generation'
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-image',
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
                      url: userImage
                    }
                  }
                ]
              }
            ],
            max_tokens: 1000
          })
        });
      }
    }
    
    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = 'Could not read error response: ' + e.message;
      }
      
      console.log('');
      console.log('⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️');
      console.log('⚠️ [IMAGE GENERATION] API ERROR');
      console.log('⚠️ [IMAGE GENERATION] HTTP Status:', response.status, response.statusText);
      console.log('⚠️ [IMAGE GENERATION] Error Response:', errorText);
      console.log('⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️');
      console.log('');
      
      return res.status(response.status).json({
        success: false,
        error: 'OpenRouter API error',
        details: errorText,
        status: response.status
      });
    }
    
    const data = await response.json();
    console.log('✅ [IMAGE GENERATION] Got response from API');
    console.log('🎨 [IMAGE GENERATION] Response structure:', JSON.stringify(data, null, 2).substring(0, 500));
    
    // Extract generated image from response
    // OpenRouter/Gemini can return images in different formats:
    // 1. data.choices[0].message.content (text with image_url)
    // 2. data.images[0].image_url.url (direct image array)
    // 3. data.choices[0].message.content[0].image_url.url (multimodal content)
    
    let generatedImage = null;
    
    // Try different response formats
    if (data.images && Array.isArray(data.images) && data.images.length > 0) {
      // Format: { images: [{ type: "image_url", image_url: { url: "..." } }] }
      const imageData = data.images[0];
      if (imageData.image_url && imageData.image_url.url) {
        generatedImage = imageData.image_url.url;
        console.log('✅ [IMAGE GENERATION] Found image in data.images[0].image_url.url');
      }
    } else if (data.choices && Array.isArray(data.choices) && data.choices.length > 0) {
      const choice = data.choices[0];
      
      // Check if content is an array (multimodal)
      if (Array.isArray(choice.message?.content)) {
        // Find image in content array
        const imageContent = choice.message.content.find(item => 
          item.type === 'image_url' || item.image_url
        );
        if (imageContent?.image_url?.url) {
          generatedImage = imageContent.image_url.url;
          console.log('✅ [IMAGE GENERATION] Found image in data.choices[0].message.content array');
        }
      } else if (typeof choice.message?.content === 'string') {
        // Content might be a JSON string containing image data
        try {
          const parsed = JSON.parse(choice.message.content);
          if (parsed.images && parsed.images[0]?.image_url?.url) {
            generatedImage = parsed.images[0].image_url.url;
            console.log('✅ [IMAGE GENERATION] Found image in parsed JSON string');
          }
        } catch (e) {
          // Not JSON, might be base64 directly or other format
          console.log('⚠️ [IMAGE GENERATION] Content is string but not JSON:', choice.message.content.substring(0, 100));
        }
      }
    }
    
    // If still no image, check for direct base64 in response
    if (!generatedImage) {
      // Check if response has base64 data directly
      const responseStr = JSON.stringify(data);
      const base64Match = responseStr.match(/data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/);
      if (base64Match) {
        generatedImage = base64Match[0];
        console.log('✅ [IMAGE GENERATION] Found base64 image in response string');
      }
    }
    
    if (!generatedImage) {
      console.error('❌ [IMAGE GENERATION] No image found in response');
      console.error('❌ [IMAGE GENERATION] Full response:', JSON.stringify(data, null, 2));
      return res.status(500).json({
        success: false,
        error: 'No image generated in API response',
        response: data
      });
    }
    
    // Handle data: URIs - they're already valid, just return them
    // Handle regular URLs - return as-is
    console.log('✅ [IMAGE GENERATION] Image extracted successfully');
    console.log('🎨 [IMAGE GENERATION] Image type:', generatedImage.startsWith('data:') ? 'Data URI' : 'URL');
    console.log('🎨 [IMAGE GENERATION] Image length:', generatedImage.length, 'chars');
    
    return res.json({
      success: true,
      image: generatedImage, // Can be data: URI or regular URL
      hairstyle: hairstyle.name
    });
    
  } catch (error) {
    console.error('');
    console.error('❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌');
    console.error('❌ [IMAGE GENERATION] EXCEPTION');
    console.error('❌ [IMAGE GENERATION] Error:', error.message);
    console.error('❌ [IMAGE GENERATION] Stack:', error.stack);
    console.error('❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌');
    console.error('');
    
    return res.status(500).json({
      success: false,
      error: error.message,
      fallback: 'image_generation_failed'
    });
  }
});

// Serve static files in production (AFTER API routes)
const distPath = join(__dirname, 'dist');
console.log('📁 [SERVER] Checking dist path:', distPath);
console.log('📁 [SERVER] Dist exists:', existsSync(distPath));
console.log('📁 [SERVER] NODE_ENV:', process.env.NODE_ENV);
console.log('📁 [SERVER] isProduction:', isProduction);

// Brevo Email Configuration
const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'noreply@example.com';
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || "David's Salon";

if (BREVO_API_KEY) {
  console.log('✅ [EMAIL] Brevo API configured');
} else {
  console.log('⚠️ [EMAIL] Brevo API key not set - email features disabled');
}

// Send email with generated image endpoint
app.post('/api/send-email', async (req, res) => {
  console.log('📧 [EMAIL] Received email request');
  
  if (!BREVO_API_KEY) {
    return res.status(500).json({
      success: false,
      error: 'Email service not configured'
    });
  }
  
  try {
    const { email, imageBase64, hairstyleName } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email address is required'
      });
    }
    
    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        error: 'Image is required'
      });
    }
    
    console.log('📧 [EMAIL] Sending to:', email);
    console.log('📧 [EMAIL] Hairstyle:', hairstyleName);
    
    // Extract base64 data (remove data:image/...;base64, prefix if present)
    let base64Data = imageBase64;
    if (imageBase64.includes('base64,')) {
      base64Data = imageBase64.split('base64,')[1];
    }
    
    // Send email via Brevo API
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: BREVO_SENDER_NAME,
          email: BREVO_SENDER_EMAIL
        },
        to: [{ email: email }],
        subject: `Your New Look - ${hairstyleName || 'Hairstyle Preview'} | David's Salon`,
        htmlContent: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
              .container { max-width: 600px; margin: 0 auto; background: white; }
              .header { background: linear-gradient(135deg, #160B53 0%, #6B21A8 100%); padding: 30px; text-align: center; }
              .header h1 { color: white; margin: 0; font-size: 28px; }
              .header p { color: rgba(255,255,255,0.9); margin: 10px 0 0; }
              .content { padding: 30px; text-align: center; }
              .image-container { margin: 20px 0; }
              .image-container img { max-width: 100%; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
              .hairstyle-name { font-size: 24px; color: #160B53; font-weight: bold; margin: 20px 0 10px; }
              .cta { margin: 30px 0; }
              .cta a { background: linear-gradient(135deg, #160B53 0%, #6B21A8 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 30px; font-weight: bold; display: inline-block; }
              .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✨ Your New Look is Ready! ✨</h1>
                <p>Thank you for visiting David's Salon</p>
              </div>
              <div class="content">
                <p>Here's your AI-generated hairstyle preview:</p>
                <div class="hairstyle-name">${hairstyleName || 'Your New Hairstyle'}</div>
                <div class="image-container">
                  <img src="cid:hairstyle-preview" alt="Your new look" />
                </div>
                <p style="color: #666; margin-top: 20px;">Love this look? Visit us to make it a reality!</p>
                <div class="cta">
                  <a href="#">Book an Appointment</a>
                </div>
              </div>
              <div class="footer">
                <p><strong>David's Salon</strong></p>
                <p>This image was generated using AI technology for preview purposes.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        attachment: [
          {
            content: base64Data,
            name: `${(hairstyleName || 'hairstyle').replace(/[^a-zA-Z0-9]/g, '-')}-preview.png`,
            contentId: 'hairstyle-preview'
          }
        ]
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('📧 [EMAIL] Brevo API error:', response.status, errorText);
      return res.status(response.status).json({
        success: false,
        error: 'Failed to send email',
        details: errorText
      });
    }
    
    const data = await response.json();
    console.log('✅ [EMAIL] Email sent successfully:', data);
    
    return res.json({
      success: true,
      message: 'Email sent successfully',
      messageId: data.messageId
    });
    
  } catch (error) {
    console.error('📧 [EMAIL] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

if (existsSync(distPath)) {
  app.use(express.static(distPath));
  console.log('📦 [SERVER] Serving static files from dist/');
  
  // Serve index.html for all non-API routes (SPA routing)
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ success: false, error: 'Not Found' });
    }
    res.sendFile(join(distPath, 'index.html'));
  });
} else {
  console.log('⚠️ [SERVER] dist folder not found! Make sure to run npm run build first.');
  // Fallback route when no dist
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ success: false, error: 'Not Found' });
    }
    res.status(404).send('App not built. Run npm run build first.');
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  if (isProduction) {
    console.log(`📦 [PRODUCTION] Serving app`);
  } else {
    console.log(`📡 [DEV] Server ready`);
  }
});
