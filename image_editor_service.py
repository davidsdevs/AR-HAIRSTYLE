#!/usr/bin/env python3
"""
Local Image-to-Image Editor Service using Stable Diffusion img2img
FREE - No API credits needed! Open source, self-hosted!
Uses Stable Diffusion img2img to edit images based on prompts
REST API: POST /edit-image with image + prompt + optional parameters
"""

import os
import sys
import json
import base64
import io
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import torch

app = Flask(__name__)
CORS(app)  # Allow CORS for frontend

# Global variable to store the pipeline (loaded once)
pipeline = None
model_source = None  # Track which model is loaded

def load_model(model_path=None, github_token=None):
    """
    Load Stable Diffusion img2img model from Hugging Face or GitHub
    
    Args:
        model_path: Model identifier. Can be:
            - Hugging Face model ID (e.g., "runwayml/stable-diffusion-v1-5")
            - GitHub repo (e.g., "username/repo-name")
            - Local path
        github_token: GitHub personal access token (for private repos)
    
    Returns:
        StableDiffusionImg2ImgPipeline instance
    """
    global pipeline, model_source
    
    # Use provided model or default to Stable Diffusion v1.5 (most popular, open source)
    if not model_path:
        model_path = os.environ.get('MODEL_PATH', 'runwayml/stable-diffusion-v1-5')
    
    # If same model already loaded, return it
    if pipeline is not None and model_source == model_path:
        print(f"✅ [LOCAL] Model already loaded: {model_path}")
        return pipeline
    
    try:
        print("=" * 60)
        print(f"🔄 [LOCAL] Loading Stable Diffusion img2img model from: {model_path}")
        print("🔄 [LOCAL] This may take a few minutes on first run (downloading model)...")
        print("=" * 60)
        
        # Check if GPU is available
        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"🔄 [LOCAL] Using device: {device}")
        
        # Determine if it's a GitHub repo
        is_github = 'github.com' in model_path
        
        if is_github:
            print(f"🔄 [LOCAL] Detected GitHub repository: {model_path}")
            # Convert GitHub URL to repo format if needed
            if 'github.com' in model_path:
                # Extract username/repo from URL
                parts = model_path.replace('https://github.com/', '').replace('http://github.com/', '').split('/')
                if len(parts) >= 2:
                    model_path = f"{parts[0]}/{parts[1]}"
                print(f"🔄 [LOCAL] Using GitHub repo: {model_path}")
            
            if github_token:
                print(f"🔑 [LOCAL] Using GitHub token for authentication")
        
        # Load Stable Diffusion img2img pipeline
        from diffusers import StableDiffusionImg2ImgPipeline
        
        print("🔄 [LOCAL] Loading StableDiffusionImg2ImgPipeline (image-to-image)...")
        print("🔄 [LOCAL] This is the standard Stable Diffusion img2img pipeline")
        
        if device == "cuda":
            print("🔄 [LOCAL] Loading with CUDA (GPU) support...")
            pipeline = StableDiffusionImg2ImgPipeline.from_pretrained(
                model_path,
                torch_dtype=torch.float16,
                safety_checker=None,  # Disable for faster processing
                requires_safety_checker=False,
                token=github_token if github_token and not is_github else None
            ).to(device)
        else:
            print("🔄 [LOCAL] Loading with CPU support (slower but works)...")
            pipeline = StableDiffusionImg2ImgPipeline.from_pretrained(
                model_path,
                torch_dtype=torch.float32,
                safety_checker=None,
                requires_safety_checker=False,
                token=github_token if github_token and not is_github else None
            ).to(device)
        
        model_source = model_path
        print("=" * 60)
        print(f"✅ [LOCAL] Stable Diffusion img2img model loaded successfully!")
        print(f"✅ [LOCAL] Model: {model_path}")
        print(f"✅ [LOCAL] Device: {device}")
        print("=" * 60)
        return pipeline
        
    except Exception as e:
        print(f"❌ [LOCAL] Error loading model: {e}")
        print("💡 [LOCAL] Make sure you have installed: pip install diffusers transformers torch torchvision")
        print("💡 [LOCAL] For GitHub models, make sure the repo is public or you have proper access")
        import traceback
        traceback.print_exc()
        raise

def base64_to_image(base64_string):
    """Convert base64 string to PIL Image"""
    # Remove data URL prefix if present
    if ',' in base64_string:
        base64_string = base64_string.split(',')[1]
    
    image_data = base64.b64decode(base64_string)
    image = Image.open(io.BytesIO(image_data)).convert("RGB")
    return image

def image_to_base64(image):
    """Convert PIL Image to base64 string"""
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    image_bytes = buffer.getvalue()
    base64_string = base64.b64encode(image_bytes).decode('utf-8')
    return f"data:image/png;base64,{base64_string}"

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    print("🏥 [LOCAL] Health check requested")
    status = {
        "status": "ok",
        "service": "Stable Diffusion img2img Editor",
        "model": model_source or "Not loaded yet",
        "device": "cuda" if torch.cuda.is_available() else "cpu",
        "pipeline_loaded": pipeline is not None,
        "model_type": "StableDiffusionImg2ImgPipeline"
    }
    print(f"🏥 [LOCAL] Health status: {json.dumps(status, indent=2)}")
    return jsonify(status)

@app.route('/edit-image', methods=['POST'])
def edit_image():
    """
    REST endpoint for Stable Diffusion img2img
    Takes: image (base64) + prompt + optional parameters
    Returns: transformed image (base64)
    """
    try:
        print("=" * 60)
        print("🎨 [LOCAL] ===== IMAGE EDIT REQUEST RECEIVED =====")
        print("=" * 60)
        
        data = request.json
        
        if not data:
            print("❌ [LOCAL] ERROR: No data provided")
            return jsonify({"error": "No data provided"}), 400
        
        prompt = data.get('prompt')
        image_base64 = data.get('image')
        model_path = data.get('model_path')  # Optional: specify model
        github_token = data.get('github_token')  # Optional: GitHub token
        
        # Optional parameters for Stable Diffusion img2img
        strength = data.get('strength', 0.6)  # How much to change (0.0-1.0)
        guidance_scale = data.get('guidance_scale', 7.5)  # How closely to follow prompt
        num_inference_steps = data.get('num_inference_steps', 30)  # Quality vs speed
        
        if not prompt:
            print("❌ [LOCAL] ERROR: Prompt is required")
            return jsonify({"error": "Prompt is required"}), 400
        
        if not image_base64:
            print("❌ [LOCAL] ERROR: Image is required")
            return jsonify({"error": "Image is required"}), 400
        
        print(f"✅ [LOCAL] Prompt: {prompt[:100]}...")
        print(f"✅ [LOCAL] Parameters: strength={strength}, guidance_scale={guidance_scale}, steps={num_inference_steps}")
        
        if model_path:
            print(f"🔄 [LOCAL] Using custom model: {model_path}")
        
        # Load model if not already loaded
        print("🔄 [LOCAL] Loading/checking Stable Diffusion model...")
        pipe = load_model(model_path=model_path, github_token=github_token)
        
        if pipe is None:
            print("❌ [LOCAL] ERROR: Failed to load model")
            return jsonify({
                "error": "Failed to load model",
                "details": "Model could not be loaded. Check logs for details."
            }), 500
        
        # Convert base64 to image
        print("🔄 [LOCAL] Converting base64 to image...")
        input_image = base64_to_image(image_base64)
        print(f"✅ [LOCAL] Input image size: {input_image.size}")
        
        # Resize image if too large (to save memory and speed up processing)
        max_size = 1024
        if max(input_image.size) > max_size:
            original_size = input_image.size
            input_image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
            print(f"🔄 [LOCAL] Resized image from {original_size} to {input_image.size}")
        
        # Generate edited image using Stable Diffusion img2img
        print("🔄 [LOCAL] Generating edited image with Stable Diffusion img2img...")
        print(f"🔄 [LOCAL] This may take {num_inference_steps * 2}-{num_inference_steps * 3} seconds...")
        print("🔄 [LOCAL] ⏳ Processing...")
        
        import time
        generation_start = time.time()
        
        # Stable Diffusion img2img pipeline
        edited_image = pipe(
            prompt=prompt,
            image=input_image,
            strength=strength,  # How much to change (0.0 = no change, 1.0 = full change)
            guidance_scale=guidance_scale,  # How closely to follow prompt
            num_inference_steps=num_inference_steps  # More steps = better quality but slower
        ).images[0]
        
        generation_duration = time.time() - generation_start
        print(f"✅ [LOCAL] Generation complete in {generation_duration:.2f} seconds")
        
        # Convert back to base64
        print("🔄 [LOCAL] Converting result to base64...")
        result_base64 = image_to_base64(edited_image)
        
        print("=" * 60)
        print("✅ [LOCAL] ✅✅✅ IMAGE EDITED SUCCESSFULLY! ✅✅✅")
        print("=" * 60)
        
        return jsonify({
            "success": True,
            "image": result_base64,
            "model": model_source,
            "parameters": {
                "strength": strength,
                "guidance_scale": guidance_scale,
                "num_inference_steps": num_inference_steps
            }
        })
        
    except Exception as e:
        print(f"❌ [LOCAL] ERROR: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "error": str(e),
            "details": "Failed to edit image. Make sure the model is loaded correctly."
        }), 500

if __name__ == '__main__':
    print("=" * 60)
    print("🚀 [LOCAL] Starting Stable Diffusion img2img Service...")
    print("🚀 [LOCAL] Open source, self-hosted - 100% FREE!")
    print("🚀 [LOCAL] No API credits needed, no vendor lock-in!")
    print("=" * 60)
    
    # Load model on startup (optional - can also lazy load)
    try:
        print("🔄 [LOCAL] Pre-loading model on startup...")
        load_model()
    except Exception as e:
        print(f"⚠️ [LOCAL] Model will be loaded on first request: {e}")
    
    # Run on port 5000 (or PORT env variable)
    port = int(os.environ.get('PORT', 5000))
    print("=" * 60)
    print(f"🌐 [LOCAL] Server starting on http://localhost:{port}")
    print(f"🌐 [LOCAL] Health check: http://localhost:{port}/health")
    print(f"🌐 [LOCAL] Edit endpoint: http://localhost:{port}/edit-image")
    print("=" * 60)
    print("📝 [LOCAL] REST API Usage:")
    print("   POST /edit-image")
    print("   Body: {")
    print("     'prompt': 'your prompt',")
    print("     'image': 'base64_image_data',")
    print("     'strength': 0.6,  // optional (0.0-1.0)")
    print("     'guidance_scale': 7.5,  // optional")
    print("     'num_inference_steps': 30  // optional")
    print("   }")
    print("=" * 60)
    
    app.run(host='0.0.0.0', port=port, debug=False)


