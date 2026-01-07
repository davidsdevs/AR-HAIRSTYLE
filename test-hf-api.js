// Test script to verify Hugging Face API key is working and real
import fetch from 'node-fetch';

// Set your API key via environment variable: HF_API_KEY
const HF_API_KEY = process.env.HF_API_KEY || '';

console.log('🧪 Testing Hugging Face API Key...');
console.log('🔑 API Key:', HF_API_KEY.substring(0, 10) + '...' + HF_API_KEY.substring(HF_API_KEY.length - 4));
console.log('');

async function testHuggingFaceAPI() {
  try {
    // Test 1: Check if API key is valid by making a simple request
    console.log('📡 Test 1: Checking API key validity...');
    
    // Use the new Hugging Face router endpoint
    const testUrl = 'https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0';
    
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: 'a simple test image of a cat',
        parameters: {
          num_inference_steps: 5, // Short test
          guidance_scale: 7.5,
        }
      })
    });

    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Headers:', Object.fromEntries(response.headers.entries()));

    // Check different status codes
    if (response.status === 200) {
      console.log('✅ SUCCESS! API key is VALID and working!');
      const imageBuffer = await response.arrayBuffer();
      console.log('✅ Image generated successfully! Size:', imageBuffer.byteLength, 'bytes');
      return { valid: true, working: true, message: 'API key is valid and working perfectly!' };
    } 
    else if (response.status === 401) {
      console.log('❌ FAILED! API key is INVALID or unauthorized');
      const errorText = await response.text();
      console.log('❌ Error details:', errorText);
      return { valid: false, working: false, message: 'API key is invalid or unauthorized' };
    }
    else if (response.status === 503) {
      console.log('⏳ Model is loading (this is normal for first request)');
      const errorData = await response.json().catch(() => ({}));
      console.log('⏳ Estimated wait time:', errorData.estimated_time || 'unknown', 'seconds');
      console.log('✅ API key is VALID (model just needs to load)');
      return { valid: true, working: true, message: 'API key is valid, model is loading' };
    }
    else if (response.status === 429) {
      console.log('⚠️ Rate limit exceeded (but API key is valid)');
      const errorText = await response.text();
      console.log('⚠️ Error details:', errorText);
      return { valid: true, working: false, message: 'API key is valid but rate limited' };
    }
    else {
      const errorText = await response.text();
      console.log('⚠️ Unexpected status:', response.status);
      console.log('⚠️ Response:', errorText.substring(0, 200));
      
      // If we get any response (not 401), the key is likely valid
      if (response.status !== 401) {
        console.log('✅ API key appears to be VALID (got response from API)');
        return { valid: true, working: false, message: `API key is valid but got status ${response.status}` };
      }
      
      return { valid: false, working: false, message: `Unexpected error: ${response.status}` };
    }
  } catch (error) {
    console.log('❌ ERROR testing API key:', error.message);
    console.log('❌ Error stack:', error.stack);
    return { valid: false, working: false, message: `Error: ${error.message}` };
  }
}

// Run the test
testHuggingFaceAPI()
  .then(result => {
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 TEST SUMMARY:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('API Key Valid:', result.valid ? '✅ YES' : '❌ NO');
    console.log('API Key Working:', result.working ? '✅ YES' : '❌ NO');
    console.log('Message:', result.message);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (result.valid) {
      console.log('✅ Your Hugging Face API key is REAL and VALID!');
      process.exit(0);
    } else {
      console.log('❌ Your Hugging Face API key is NOT valid or NOT working.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

