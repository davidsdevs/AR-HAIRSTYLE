// Hair Recommendation API - Using OpenRouter AI
// Uses OpenRouter API Key through backend proxy

import { API_BASE_URL } from './config.js';

/**
 * Get AI-powered hairstyle recommendations using OpenRouter AI models via Node.js proxy
 * AI generates dynamic hairstyle recommendations based on user's features
 * @param {Object} userData - User profile data (faceShape, skinTone, facialStructure, skinColor, preferences)
 */
export async function getHairRecommendations(userData) {
  console.log('═'.repeat(60));
  console.log('🤖 [OPENROUTER] START: getHairRecommendations');
  console.log('🤖 [OPENROUTER] AI will generate dynamic hairstyle recommendations');
  console.log('🤖 [OPENROUTER] userData:', JSON.stringify(userData, null, 2));
  console.log('═'.repeat(60));
  
  try {
    // Validation: Check if userData is valid
    if (!userData) {
      console.error('❌ [VALIDATION] userData is missing!');
      return null;
    }
    
    console.log('✅ [VALIDATION] userData is valid');
    
    const requestBody = {
      userData: {
        gender: userData.gender || '',
        faceShape: userData.faceShape || 'unknown',
        skinTone: userData.skinTone?.label || userData.skinTone?.value || userData.skinTone || 'unknown',
        hairLength: userData.hairLength || 'any',
        hairType: userData.hairType || 'any',
        hairColor: userData.hairColor || '',
        stylePreferences: userData.stylePreferences || [],
        facialStructure: userData.facialStructure || 'analyzed',
        skinColor: userData.skinColor || 'unknown',
        customDescription: userData.customDescription || ''
      }
    };
    
    console.log('🔥 [DEBUG] Request body being sent:', JSON.stringify(requestBody, null, 2));

    // Use API_BASE_URL for backend
    const url = `${API_BASE_URL}/api/recommendations`;
    console.log('🤖 [OPENROUTER] Fetch →', url);
    const t0 = performance.now();
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    const t1 = performance.now();
    console.log(`🤖 [OPENROUTER] Fetch done in ${(t1 - t0).toFixed(0)} ms`);
    console.log('🤖 [OPENROUTER] Response URL:', response.url);
    console.log('🤖 [OPENROUTER] Response status:', response.status, response.statusText);
    console.log('🤖 [OPENROUTER] Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('');
      console.log('⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️');
      console.log('⚠️ [OPENROUTER] REQUEST FAILED - WILL FALL BACK TO RULE-BASED');
      console.log('❌ [OPENROUTER] Status:', response.status, response.statusText);
      console.log('❌ [OPENROUTER] From URL:', response.url);
      console.log('❌ [OPENROUTER] Error:', errorText);
      console.log('⚠️ [OPENROUTER] Frontend will use rule-based recommendations');
      console.log('⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️');
      console.log('');
      return null;
    }

    const data = await response.json();
    console.log('✅ [OPENROUTER] Response JSON:', JSON.stringify(data, null, 2));
    
    if (data.success && Array.isArray(data.recommendations) && data.recommendations.length > 0) {
      console.log('✅ [OPENROUTER] Recommendations count:', data.recommendations.length);
      return data.recommendations.slice(0, 3).map(rec => ({
        id: rec.id,
        name: rec.name,
        matchScore: rec.matchScore || rec.score || 85,
        whyRecommendation: rec.whyRecommendation || rec.reason || 'AI-recommended based on your features',
        matchReasons: rec.matchReasons || [rec.whyRecommendation || rec.reason || 'AI-recommended based on your features'],
        aiGenerated: true,
        category: rec.category,
        hairType: rec.hairType,
        ...rec // Include all other properties
      }));
    }
    
    console.log('');
    console.log('⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️');
    console.log('⚠️ [OPENROUTER] NO RECOMMENDATIONS FOUND - WILL FALL BACK TO RULE-BASED');
    console.log('⚠️ [OPENROUTER] Response data:', data);
    console.log('⚠️ [OPENROUTER] Frontend will use rule-based recommendations');
    console.log('⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️');
    console.log('');
    return null;
  } catch (error) {
    console.log('');
    console.log('❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌');
    console.log('❌ [OPENROUTER] EXCEPTION - WILL FALL BACK TO RULE-BASED');
    console.log('❌ [OPENROUTER] Error:', error?.message);
    console.log('❌ [OPENROUTER] Stack:', error?.stack);
    console.log('⚠️ [OPENROUTER] Frontend will use rule-based recommendations');
    if (String(error?.message || '').includes('Failed to fetch')) {
      console.log('⚠️ [OPENROUTER] Tip: Ensure server.js is running on http://localhost:3001 and Vite proxy is active.');
    }
    console.log('❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌');
    console.log('');
    return null;
  }
}

/**
 * Test if OpenRouter API is working via proxy server
 */
export async function testOpenRouterAPI() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ [OPENROUTER] Proxy server is running');
      return { valid: true, response: data };
    } else {
      return { valid: false, error: `Server not available: ${response.status}` };
    }
  } catch (error) {
    console.error('❌ [OPENROUTER] Server not running:', error.message);
    return { valid: false, error: error.message || 'Server not running' };
  }
}

