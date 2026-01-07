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

// OpenRouter API Configuration
// SECURITY: API key must be set via environment variable - never hardcode!
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

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
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    openrouter_configured: !!OPENROUTER_API_KEY,
    openrouter_key_preview: OPENROUTER_API_KEY ? OPENROUTER_API_KEY.substring(0, 10) + '...' : 'NOT SET'
  });
});

// Test endpoint to check OpenRouter API directly
app.post('/api/test-openrouter', async (req, res) => {
  console.log('🧪 [TEST] Testing OpenRouter API...');
  
  if (!OPENROUTER_API_KEY) {
    return res.status(500).json({
      success: false,
      error: 'OPENROUTER_API_KEY not set in environment variables'
    });
  }
  
  try {
    const origin = process.env.ORIGIN || 'http://localhost:5173';
    console.log('🧪 [TEST] API Key:', OPENROUTER_API_KEY.substring(0, 10) + '...');
    console.log('🧪 [TEST] Origin:', origin);
    console.log('🧪 [TEST] Model: google/gemini-2.5-flash-lite');
    
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
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
      response: responseText.substring(0, 500)
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

// Validate API key is set
if (!OPENROUTER_API_KEY) {
  console.error('⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️');
  console.error('❌ [ERROR] OPENROUTER_API_KEY is not set!');
  console.error('❌ [ERROR] Please create a .env file with: OPENROUTER_API_KEY=your_key_here');
  console.error('❌ [ERROR] AI recommendations will not work without an API key.');
  console.error('⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️');
}

// Hair Recommendation endpoint using OpenRouter
app.post('/api/recommendations', async (req, res) => {
  console.log('═'.repeat(60));
  console.log('🤖 [OPENROUTER] Received recommendation request');
  console.log('═'.repeat(60));
  
  // Check API key before processing
  if (!OPENROUTER_API_KEY) {
    console.error('❌ [ERROR] OPENROUTER_API_KEY is not set!');
    return res.status(401).json({
      success: false,
      error: 'OpenRouter API error',
      details: JSON.stringify({
        error: {
          message: 'No auth credentials found',
          code: 401
        }
      }),
      status: 401,
      fallback: 'rule_based'
    });
  }
  
  // 🔥 DEBUG: Log raw request body
  console.log('🔥 [DEBUG] RAW REQUEST BODY:', JSON.stringify(req.body, null, 2));
  console.log('🔥 [DEBUG] Request body keys:', req.body ? Object.keys(req.body) : 'req.body is null/undefined');
  console.log('🔥 [DEBUG] userData exists:', !!req.body?.userData);
  console.log('🔥 [DEBUG] hairstyleOptions exists:', !!req.body?.hairstyleOptions);
  console.log('🔥 [DEBUG] hairstyleOptions is array:', Array.isArray(req.body?.hairstyleOptions));
  console.log('🔥 [DEBUG] hairstyleOptions length:', req.body?.hairstyleOptions?.length || 0);
  
  try {
    const { userData, hairstyleOptions } = req.body;
    
    if (!userData) {
      console.log('');
      console.log('❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌');
      console.log('❌ [VALIDATION] userData is MISSING');
      console.log('❌ [VALIDATION] Request body:', JSON.stringify(req.body, null, 2));
      console.log('❌ [VALIDATION] Returning 400 Bad Request');
      console.log('❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌');
      console.log('');
      return res.status(400).json({ 
        success: false, 
        error: 'userData is required',
        received: req.body
      });
    }
    
    if (!hairstyleOptions || !Array.isArray(hairstyleOptions) || hairstyleOptions.length === 0) {
      console.log('');
      console.log('❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌');
      console.log('❌ [VALIDATION] hairstyleOptions is MISSING or EMPTY');
      console.log('❌ [VALIDATION] hairstyleOptions type:', typeof hairstyleOptions);
      console.log('❌ [VALIDATION] hairstyleOptions is array:', Array.isArray(hairstyleOptions));
      console.log('❌ [VALIDATION] hairstyleOptions length:', hairstyleOptions?.length || 0);
      console.log('❌ [VALIDATION] Request body:', JSON.stringify(req.body, null, 2));
      console.log('❌ [VALIDATION] Returning 400 Bad Request');
      console.log('❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌');
      console.log('');
      return res.status(400).json({ 
        success: false, 
        error: 'hairstyleOptions array is required and must not be empty',
        received: {
          hairstyleOptions,
          hairstyleOptionsType: typeof hairstyleOptions,
          hairstyleOptionsIsArray: Array.isArray(hairstyleOptions),
          hairstyleOptionsLength: hairstyleOptions?.length || 0
        }
      });
    }
    
    // Prepare user profile for AI
    const gender = userData.gender || '';
    const faceShape = userData.faceShape || 'unknown';
    const skinTone = userData.skinTone?.label || userData.skinTone?.value || userData.skinTone || 'unknown';
    const hairLength = userData.hairLength || 'any';
    const hairType = userData.hairType || 'any';
    const stylePreferences = userData.stylePreferences || [];
    const facialStructure = userData.facialStructure || 'analyzed';
    const skinColor = userData.skinColor || 'unknown';
    const customDescription = userData.customDescription || '';
    
    // Prepare available hairstyles for AI
    const availableHairstyles = hairstyleOptions.map(style => ({
      id: style.id,
      name: style.name,
      category: style.category,
      hairType: style.hairType,
      styleTags: style.styleTags || [],
      faceShapeCompatibility: style.faceShapeCompatibility || {},
      skinToneCompatibility: style.skinToneCompatibility || {}
    }));
    
    // Create detailed prompt for AI
    const prompt = `You are a professional hairstylist AI. Analyze the user's profile and recommend exactly 3 best matching hairstyles from the available options.

USER PROFILE:
- Gender: ${gender || 'not specified'}
- Face Shape: ${faceShape}
- Skin Tone: ${skinTone}
- Facial Structure: ${facialStructure}
- Skin Color: ${skinColor}
- Hair Length Preference: ${hairLength}
- Hair Type Preference: ${hairType}
- Style Preferences: ${stylePreferences.length > 0 ? stylePreferences.join(', ') : 'none'}${customDescription ? `\n- Additional Requirements/Preferences: ${customDescription}` : ''}

AVAILABLE HAIRSTYLES:
${JSON.stringify(availableHairstyles, null, 2)}

INSTRUCTIONS:
1. Select exactly 5 hairstyles from the available options above that best match the user's profile (minimum 5, we will show top 3)
2. ${customDescription ? `IMPORTANT: Pay special attention to the user's additional requirements/preferences: "${customDescription}". This should strongly influence your recommendations. ` : ''}For each recommendation, provide:
   - The exact hairstyle ID and name from the available options
   - A match score (0-100) based on compatibility
   - A detailed explanation (2-3 sentences) explaining WHY this hairstyle is recommended based on:
     * Gender appropriateness (${gender ? `for ${gender}` : 'if specified'})
     * Face shape compatibility
     * Skin tone compatibility
     * Hair length preference match
     * Hair type preference match
     * Style preference alignment${customDescription ? `\n     * User's specific requirements: "${customDescription}"` : ''}

Return ONLY valid JSON in this exact format (no markdown, no code blocks, just JSON):
{
  "recommendations": [
    {
      "id": 1,
      "name": "Exact Name from Available Options",
      "matchScore": 95,
      "whyRecommendation": "Detailed 2-3 sentence explanation of why this hairstyle is perfect for this user."
    },
    {
      "id": 2,
      "name": "Another Hairstyle Name",
      "matchScore": 88,
      "whyRecommendation": "Explanation here."
    },
    {
      "id": 3,
      "name": "Third Hairstyle Name",
      "matchScore": 85,
      "whyRecommendation": "Explanation here."
    }
  ]
}`;

    console.log('🤖 [OPENROUTER] Calling OpenRouter API...');
    console.log('🤖 [OPENROUTER] Model: google/gemini-2.5-flash-lite');
    console.log('🤖 [OPENROUTER] API URL:', OPENROUTER_API_URL);
    
    // Use API key from environment variable
    const apiKey = OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error('❌ [ERROR] OPENROUTER_API_KEY is not set in environment!');
      throw new Error('OPENROUTER_API_KEY is not configured');
    }
    
    console.log('🤖 [OPENROUTER] API Key (first 10 chars):', apiKey.substring(0, 10) + '...');
    console.log('🤖 [OPENROUTER] API Key length:', apiKey.length);
    
    // Get origin from environment or default to localhost for development
    const origin = process.env.ORIGIN || 'http://localhost:5173';
    
    // Prepare headers
    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': origin, // Required by OpenRouter - matches your app's domain
      'X-Title': 'Hair Recommendation System' // Required by OpenRouter - your app name
    };
    
    console.log('🤖 [OPENROUTER] Request headers:', {
      'Authorization': `Bearer ${apiKey.substring(0, 10)}...`,
      'Content-Type': headers['Content-Type'],
      'HTTP-Referer': headers['HTTP-Referer'],
      'X-Title': headers['X-Title']
    });
    
    // Call OpenRouter API
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite', // Valid OpenRouter Gemini model
        messages: [
          {
            role: 'system',
            content: 'ONLY return valid JSON. Do not add commentary. Return only the JSON object with recommendations array.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2, // Lower temperature for more consistent JSON output
        max_tokens: 2000
      })
    });
    
    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = 'Could not read error response: ' + e.message;
      }
      
      console.log('');
      console.log('⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️');
      console.log('⚠️ [OPENROUTER] API ERROR - WILL FALL BACK TO RULE-BASED');
      console.log('⚠️ [OPENROUTER] HTTP Status:', response.status, response.statusText);
      console.log('⚠️ [OPENROUTER] Error Response:', errorText);
      console.log('⚠️ [OPENROUTER] Possible reasons:');
      console.log('   - Invalid API key');
      console.log('   - Rate limit exceeded');
      console.log('   - Insufficient credits');
      console.log('   - Model unavailable');
      console.log('⚠️ [OPENROUTER] Frontend will use rule-based recommendations');
      console.log('⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️');
      console.log('');
      
      return res.status(response.status).json({
        success: false,
        error: 'OpenRouter API error',
        details: errorText,
        status: response.status,
        fallback: 'rule_based'
      });
    }
    
    const data = await response.json();
    console.log('✅ [OPENROUTER] Got response from API');
    
    // Extract the AI response
    const aiResponse = data.choices?.[0]?.message?.content || '';
    console.log('🤖 [OPENROUTER] AI Response preview:', aiResponse.substring(0, 500));
    
    // Parse JSON from response (may be wrapped in markdown code blocks)
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
      
      // Ensure it's an array
      if (!Array.isArray(recommendations)) {
        throw new Error('Response is not an array');
      }
    } catch (parseError) {
      console.log('');
      console.log('⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️');
      console.log('⚠️ [OPENROUTER] JSON PARSE ERROR - WILL FALL BACK TO RULE-BASED');
      console.log('⚠️ [OPENROUTER] Parse error:', parseError.message);
      console.log('⚠️ [OPENROUTER] Raw response (first 500 chars):', cleanedResponse.substring(0, 500));
      console.log('⚠️ [OPENROUTER] Frontend will use rule-based recommendations');
      console.log('⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️');
      console.log('');
      
      // Try to extract JSON array from text
      const jsonMatch = cleanedResponse.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        try {
          recommendations = JSON.parse(jsonMatch[0]);
        } catch (e) {
          return res.status(500).json({
            success: false,
            error: 'Failed to parse AI response as JSON',
            details: cleanedResponse.substring(0, 500),
            fallback: 'rule_based'
          });
        }
      } else {
        return res.status(500).json({
          success: false,
          error: 'AI did not return valid JSON',
          details: cleanedResponse.substring(0, 500),
          fallback: 'rule_based'
        });
      }
    }
    
    // Map AI recommendations to match frontend format (get minimum 5, frontend shows top 3)
    const formattedRecommendations = recommendations.slice(0, Math.max(5, recommendations.length)).map(aiRec => {
      // Find the matching hairstyle from available options
      const matchingStyle = hairstyleOptions.find(s => 
        s.id === aiRec.id || 
        s.name.toLowerCase() === aiRec.name.toLowerCase()
      );
      
      if (!matchingStyle) {
        console.warn(`⚠️ [OPENROUTER] Could not find hairstyle: ${aiRec.name} (ID: ${aiRec.id})`);
        return null;
      }
      
      return {
        ...matchingStyle,
        matchScore: Math.min(100, Math.max(0, aiRec.matchScore || 85)),
        whyRecommendation: aiRec.whyRecommendation || aiRec.reason || 'AI-recommended based on your features',
        matchReasons: [aiRec.whyRecommendation || aiRec.reason || 'AI-recommended based on your features'],
        aiGenerated: true
      };
    }).filter(Boolean); // Remove null entries
    
    console.log('✅ [OPENROUTER] Successfully generated', formattedRecommendations.length, 'recommendations');
    console.log('═'.repeat(60));
    
    return res.json({
      success: true,
      recommendations: formattedRecommendations,
      source: 'openrouter_ai'
    });
    
  } catch (error) {
    console.log('');
    console.log('❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌');
    console.log('❌ [OPENROUTER] EXCEPTION - WILL FALL BACK TO RULE-BASED');
    console.log('❌ [OPENROUTER] Error Type:', error.constructor.name);
    console.log('❌ [OPENROUTER] Error Message:', error.message);
    console.log('❌ [OPENROUTER] Error Stack:', error.stack);
    console.log('❌ [OPENROUTER] Possible reasons:');
    console.log('   - Network error (check internet connection)');
    console.log('   - OpenRouter API down');
    console.log('   - Timeout (request took too long)');
    console.log('❌ [OPENROUTER] Frontend will use rule-based recommendations');
    console.log('❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌');
    console.log('');
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      type: error.constructor.name,
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
    
    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'OPENROUTER_API_KEY not configured'
      });
    }
    
    console.log('🎨 [IMAGE] Generating image with hairstyle:', hairstyle.name);
    console.log('🎨 [IMAGE] User image length:', userImage.length, 'chars');
    console.log('🎨 [IMAGE] Hair color:', hairColor);
    
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
    
    // Call OpenRouter API for image generation
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
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
if (isProduction) {
  const distPath = join(__dirname, 'dist');
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
  }
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  if (isProduction) {
    console.log(`📦 [PRODUCTION] Serving app`);
  } else {
    console.log(`📡 [DEV] Server ready`);
  }
});
