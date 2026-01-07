#!/usr/bin/env python3
"""
AI Recommendation Service using Language Models
FREE - No API credits needed!
Uses language models from GitHub/Hugging Face for hairstyle recommendations
"""

import os
import sys
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import torch

app = Flask(__name__)
CORS(app)  # Allow CORS for frontend

# Global variable to store the model (loaded once)
model = None
tokenizer = None
model_source = None

def load_model(model_path=None, github_token=None):
    """
    Load a language model from Hugging Face or GitHub
    
    Args:
        model_path: Model identifier. Can be:
            - Hugging Face model ID (e.g., "mistralai/Mistral-7B-Instruct-v0.2")
            - GitHub repo (e.g., "username/repo-name")
        github_token: GitHub personal access token (for private repos)
    """
    global model, tokenizer, model_source
    
    # Use provided model or default to a small, fast model
    if not model_path:
        # Default to a small, fast model that works well for recommendations
        model_path = os.environ.get('RECOMMENDATION_MODEL', 'microsoft/Phi-3-mini-4k-instruct')
    
    # Check if it's a GitHub model
    is_github_model = 'github.com' in model_path
    
    if is_github_model:
        print(f"🔄 [REC] ✅✅✅ GITHUB MODEL DETECTED: {model_path}")
        if github_token:
            print(f"🔄 [REC] Using GitHub personal access token: {github_token[:20]}...")
        else:
            print(f"⚠️ [REC] No GitHub token provided for GitHub model!")
    
    # If same model already loaded, return it
    if model is not None and model_source == model_path:
        return model, tokenizer
    
    try:
        print(f"🔄 [REC] Loading recommendation model from: {model_path}")
        print("🔄 [REC] This may take a few minutes on first run (downloading model)...")
        
        from transformers import AutoModelForCausalLM, AutoTokenizer
        
        # Check if GPU is available
        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"🔄 [REC] Using device: {device}")
        
        # Load tokenizer
        print("🔄 [REC] Loading tokenizer...")
        # Use GitHub token if it's a GitHub model, otherwise None
        auth_token = github_token if (is_github_model and github_token) else None
        if auth_token:
            print(f"🔄 [REC] Using authentication token: {auth_token[:20]}...")
        
        tokenizer = AutoTokenizer.from_pretrained(
            model_path,
            token=auth_token,
            trust_remote_code=True
        )
        
        # Load model
        print("🔄 [REC] Loading model (this may take a while)...")
        if device == "cuda":
            model = AutoModelForCausalLM.from_pretrained(
                model_path,
                torch_dtype=torch.float16,
                device_map="auto",
                token=auth_token,
                trust_remote_code=True
            )
        else:
            # CPU mode - use a smaller model or quantized version
            model = AutoModelForCausalLM.from_pretrained(
                model_path,
                torch_dtype=torch.float32,
                token=auth_token,
                trust_remote_code=True
            ).to(device)
        
        model_source = model_path
        print(f"✅ [REC] Model loaded successfully from: {model_path}!")
        return model, tokenizer
        
    except Exception as e:
        print(f"❌ [REC] Error loading model: {e}")
        print("💡 [REC] Make sure you have installed: pip install transformers torch")
        print("💡 [REC] For GitHub models, make sure the repo is public or you have proper access")
        raise

def generate_recommendations(user_data, hairstyle_options, model, tokenizer):
    """Generate hairstyle recommendations using the language model"""
    
    print("🔄 [REC] Preparing user profile data...")
    
    # Prepare user profile text
    face_shape = user_data.get('faceShape', 'unknown')
    skin_tone = user_data.get('skinTone', {})
    if isinstance(skin_tone, dict):
        skin_tone = skin_tone.get('label', skin_tone.get('value', 'unknown'))
    else:
        skin_tone = str(skin_tone) if skin_tone else 'unknown'
    
    hair_length = user_data.get('hairLength', 'any')
    hair_type = user_data.get('hairType', 'any')
    style_preferences = user_data.get('stylePreferences', [])
    
    print(f"🔄 [REC] User profile: Face={face_shape}, Skin={skin_tone}, Hair={hair_type}, Length={hair_length}")
    
    # Prepare hairstyles list
    print(f"🔄 [REC] Processing {len(hairstyle_options)} hairstyle options...")
    hairstyles_text = "\n".join([
        f"- ID: {s.get('id')}, Name: {s.get('name')}, Category: {s.get('category', 'N/A')}, "
        f"Hair Type: {s.get('hairType', 'N/A')}, Tags: {', '.join(s.get('styleTags', []))}"
        for s in hairstyle_options[:20]  # Limit to first 20 for token efficiency
    ])
    
    print(f"🔄 [REC] Prepared {min(len(hairstyle_options), 20)} hairstyles for model")
    
    # Create prompt
    prompt = f"""You are a professional hairstylist AI. Analyze the user profile and recommend exactly 3 best matching hairstyles.

User Profile:
- Face Shape: {face_shape}
- Skin Tone: {skin_tone}
- Hair Length Preference: {hair_length}
- Hair Type Preference: {hair_type}
- Style Preferences: {', '.join(style_preferences) if style_preferences else 'None specified'}

Available Hairstyles:
{hairstyles_text}

Based on the user's facial structure, face shape, skin tone, and preferences, recommend EXACTLY 3 hairstyles from the available options above.

For each recommendation, provide:
1. The exact hairstyle ID and name from the available options
2. A match score (0-100)
3. A detailed explanation (2-3 sentences) explaining WHY this hairstyle is recommended

Return ONLY valid JSON in this exact format (no additional text):
[
  {{
    "id": 1,
    "name": "Exact Name from Available Options",
    "matchScore": 95,
    "whyRecommendation": "Detailed 2-3 sentence explanation of why this hairstyle is perfect for this user."
  }},
  {{
    "id": 2,
    "name": "Another Hairstyle Name",
    "matchScore": 88,
    "whyRecommendation": "Explanation here."
  }},
  {{
    "id": 3,
    "name": "Third Hairstyle Name",
    "matchScore": 85,
    "whyRecommendation": "Explanation here."
  }}
]"""

    try:
        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"🔄 [REC] Using device: {device}")
        
        # Tokenize input
        print("🔄 [REC] Tokenizing prompt...")
        inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=2048).to(device)
        print(f"🔄 [REC] ✅ Tokenization complete. Input tokens: {inputs['input_ids'].shape[1]}")
        
        # Generate response
        print("🔄 [REC] Generating recommendations (this may take 30-60 seconds)...")
        print("🔄 [REC] ⏳ Please wait, model is processing...")
        generation_start = __import__('time').time()
        
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=500,
                temperature=0.7,
                do_sample=True,
                pad_token_id=tokenizer.eos_token_id,
                use_cache=False  # Fix for Phi-3 compatibility issue with DynamicCache
            )
        
        generation_duration = __import__('time').time() - generation_start
        print(f"🔄 [REC] ✅ Generation complete in {generation_duration:.2f} seconds")
        
        # Decode response
        print("🔄 [REC] Decoding model response...")
        response_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        print(f"🔄 [REC] Response length: {len(response_text)} characters")
        print(f"🔄 [REC] Response preview: {response_text[:200]}...")
        
        # Extract JSON from response
        # Try to find JSON array in the response
        json_start = response_text.find('[')
        json_end = response_text.rfind(']') + 1
        
        if json_start != -1 and json_end > json_start:
            print(f"🔄 [REC] Found JSON array at positions {json_start}-{json_end}")
            json_text = response_text[json_start:json_end]
            print(f"🔄 [REC] Parsing JSON...")
            recommendations = json.loads(json_text)
            
            # Validate and limit to 3
            if isinstance(recommendations, list) and len(recommendations) > 0:
                print(f"✅ [REC] Successfully parsed {len(recommendations)} recommendations")
                return recommendations[:3]
            else:
                print(f"⚠️ [REC] Parsed JSON but got empty or invalid list")
        else:
            print(f"⚠️ [REC] Could not find JSON array in response")
        
        # If JSON parsing failed, return None
        print("⚠️ [REC] Could not parse model response as JSON")
        print(f"⚠️ [REC] Full response (first 1000 chars): {response_text[:1000]}")
        return None
        
    except Exception as e:
        print(f"❌ [REC] Error generating recommendations: {e}")
        import traceback
        traceback.print_exc()
        return None

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    print("🏥 [REC] Health check requested")
    status = {
        "status": "ok",
        "service": "AI Recommendation Service",
        "model": model_source or "Not loaded yet",
        "device": "cuda" if torch.cuda.is_available() else "cpu",
        "model_loaded": model is not None,
        "tokenizer_loaded": tokenizer is not None
    }
    print(f"🏥 [REC] Health status: {json.dumps(status, indent=2)}")
    return jsonify(status)

@app.route('/recommend', methods=['POST'])
def recommend():
    """Get AI-powered hairstyle recommendations"""
    try:
        print("=" * 60)
        print("🤖 [REC] ===== RECOMMENDATION REQUEST RECEIVED =====")
        print("=" * 60)
        
        data = request.json
        
        if not data:
            print("❌ [REC] ERROR: No data provided in request")
            return jsonify({"error": "No data provided"}), 400
        
        print("✅ [REC] Request data received successfully")
        
        user_data = data.get('userData')
        hairstyle_options = data.get('hairstyleOptions', [])
        model_path = data.get('model_path')  # Optional: specify model
        github_token = data.get('github_token')  # Optional: GitHub token
        
        if not user_data:
            print("❌ [REC] ERROR: userData is missing")
            return jsonify({"error": "userData is required"}), 400
        
        if not hairstyle_options or len(hairstyle_options) == 0:
            print("❌ [REC] ERROR: hairstyleOptions is missing or empty")
            return jsonify({"error": "hairstyleOptions is required"}), 400
        
        print(f"✅ [REC] User data received: {json.dumps(user_data, indent=2)}")
        print(f"✅ [REC] Hairstyle options count: {len(hairstyle_options)}")
        
        if model_path:
            print(f"🔄 [REC] Using custom model: {model_path}")
            if 'github.com' in model_path or (github_token and model_path.count('/') == 1):
                print(f"🔄 [REC] ✅✅✅ GITHUB MODEL DETECTED! Using GitHub repository!")
        else:
            print(f"🔄 [REC] Using default model (Hugging Face)")
        
        if github_token:
            print(f"🔑 [REC] GitHub token provided: {github_token[:20]}... (for GitHub models/private repos)")
        else:
            print(f"⚠️ [REC] No GitHub token provided - using public models only")
        
        # Check if model is loaded
        if model is None or tokenizer is None:
            print("⚠️ [REC] Model not loaded yet, loading now...")
        else:
            print(f"✅ [REC] Model already loaded: {model_source}")
        
        # Load model if not already loaded
        print("🔄 [REC] Loading/checking model...")
        current_model, current_tokenizer = load_model(model_path=model_path, github_token=github_token)
        
        if current_model is None or current_tokenizer is None:
            print("❌ [REC] ERROR: Failed to load model")
            return jsonify({
                "success": False,
                "error": "Failed to load model",
                "recommendations": []
            }), 500
        
        print("✅ [REC] Model loaded successfully!")
        print(f"🔄 [REC] Generating recommendations...")
        
        # Generate recommendations
        recommendations = generate_recommendations(user_data, hairstyle_options, current_model, current_tokenizer)
        
        if recommendations:
            print(f"✅ [REC] ✅✅✅ SUCCESS: Generated {len(recommendations)} ACTUAL AI RECOMMENDATIONS")
            print(f"📊 [REC] Recommendations:")
            for i, rec in enumerate(recommendations, 1):
                print(f"   {i}. ID: {rec.get('id')}, Name: {rec.get('name')}, Score: {rec.get('matchScore')}")
                print(f"      Reason: {rec.get('whyRecommendation', 'N/A')}")
            print("=" * 60)
            print("✅ [REC] ✅✅✅ USING GITHUB/HUGGING FACE MODELS (NO OPENAI) ✅✅✅")
            print("=" * 60)
            return jsonify({
                "success": True,
                "recommendations": recommendations,
                "source": "local_ai_model",
                "model": model_source
            })
        else:
            print("❌ [REC] ERROR: Failed to generate recommendations (model returned None)")
            print("❌ [REC] ⚠️⚠️⚠️ WILL FALL BACK TO RULE-BASED RECOMMENDATIONS ⚠️⚠️⚠️")
            print("=" * 60)
            return jsonify({
                "success": False,
                "error": "Failed to generate recommendations - model returned invalid response",
                "recommendations": [],
                "will_fallback": True
            }), 500
        
    except Exception as e:
        print(f"❌ [REC] Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "error": str(e),
            "details": "Failed to generate recommendations. Make sure the model is loaded correctly."
        }), 500

if __name__ == '__main__':
    print("🚀 [REC] Starting AI Recommendation Service...")
    print("🚀 [REC] This service uses language models - 100% FREE!")
    print("🚀 [REC] No API credits needed!")
    
    # Load model on startup (optional - can also lazy load)
    try:
        load_model()
    except Exception as e:
        print(f"⚠️ [REC] Model will be loaded on first request: {e}")
    
    # Run on port 5001 (different from image editor on 5000)
    port = int(os.environ.get('PORT', 5001))
    print(f"🌐 [REC] Server starting on http://localhost:{port}")
    print(f"🌐 [REC] Health check: http://localhost:{port}/health")
    print(f"🌐 [REC] Recommend endpoint: http://localhost:{port}/recommend")
    
    app.run(host='0.0.0.0', port=port, debug=False)

