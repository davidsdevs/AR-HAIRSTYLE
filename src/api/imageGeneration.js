/**
 * Image Generation API Client
 * Handles AI image generation using OpenRouter
 */

export async function generateHairImage(userImage, hairstyle, userData = {}) {
  console.log('═'.repeat(60));
  console.log('🎨 [IMAGE GENERATION] Starting image generation');
  console.log('🎨 [IMAGE GENERATION] Hairstyle:', hairstyle?.name);
  console.log('🎨 [IMAGE GENERATION] User image length:', userImage?.length || 0);
  console.log('═'.repeat(60));
  
  try {
    if (!userImage) {
      console.error('❌ [IMAGE GENERATION] No user image provided');
      return null;
    }
    
    if (!hairstyle || !hairstyle.name) {
      console.error('❌ [IMAGE GENERATION] No hairstyle provided');
      return null;
    }
    
    const requestBody = {
      userImage, // Base64 data URL
      hairstyle: {
        name: hairstyle.name,
        category: hairstyle.category,
        hairType: hairstyle.hairType,
        styleTags: hairstyle.styleTags
      },
      userData
    };
    
    console.log('🎨 [IMAGE GENERATION] Request body prepared');
    console.log('🎨 [IMAGE GENERATION] Sending request to:', 'http://localhost:3001/api/generate-image');
    
    const url = 'http://localhost:3001/api/generate-image';
    const t0 = performance.now();
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    const t1 = performance.now();
    console.log(`🎨 [IMAGE GENERATION] Fetch done in ${(t1 - t0).toFixed(0)} ms`);
    console.log('🎨 [IMAGE GENERATION] Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
        console.error('❌ [IMAGE GENERATION] Error response:', errorText);
      } catch (e) {
        errorText = 'Could not read error response: ' + e.message;
      }
      
      console.error('');
      console.error('❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌');
      console.error('❌ [IMAGE GENERATION] REQUEST FAILED');
      console.error('❌ [IMAGE GENERATION] HTTP Status:', response.status);
      console.error('❌ [IMAGE GENERATION] Error:', errorText);
      console.error('❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌');
      console.error('');
      
      throw new Error(`Image generation failed: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('🎨 [IMAGE GENERATION] Response received:', data.success ? '✅ Success' : '❌ Failed');
    
    if (data.success && data.image) {
      console.log('✅ [IMAGE GENERATION] Image generated successfully!');
      return data.image; // Return the generated image (base64 data URL or URL)
    } else {
      console.error('❌ [IMAGE GENERATION] No image in response:', data);
      return null;
    }
    
  } catch (error) {
    console.error('');
    console.error('❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌');
    console.error('❌ [IMAGE GENERATION] EXCEPTION');
    console.error('❌ [IMAGE GENERATION] Error:', error.message);
    console.error('❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌');
    console.error('');
    
    return null;
  }
}

