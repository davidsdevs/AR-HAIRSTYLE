# GitHub Model Setup Guide

## 🎯 Using Models from GitHub

This guide explains how to use AI models hosted on GitHub with the local image editor service.

## 📋 Important Notes

**Most models that work with Diffusers are on Hugging Face Hub, not GitHub directly.**

However, if you have a model on GitHub, here are the options:

### Option 1: Hugging Face Hub (Recommended)
If your model is on Hugging Face Hub (most common):
- Use format: `username/model-name`
- Example: `runwayml/stable-diffusion-v1-5`
- No GitHub token needed

### Option 2: GitHub Repository
If your model is actually on GitHub:
- The model needs to be in a format compatible with Diffusers
- You may need to clone it first or use a custom loader

## 🚀 Setup Instructions

### Step 1: Install Dependencies

```bash
pip install -r requirements.txt
```

This installs:
- `huggingface_hub` - For accessing models from Hugging Face Hub (or GitHub if compatible)
- `diffusers` - For running the models
- All other required packages

### Step 2: Configure Your Model

You can specify your model in three ways:

#### Method 1: Environment Variable (Recommended)

```bash
# For Hugging Face Hub model
export MODEL_PATH="runwayml/stable-diffusion-v1-5"

# For GitHub model (if compatible)
export MODEL_PATH="username/repo-name"

# If using private repo, add GitHub token
export GITHUB_TOKEN="github_pat_..."
```

#### Method 2: Request Parameter

When calling the API, include in the request body:
```json
{
  "prompt": "your prompt",
  "image": "base64_image_data",
  "model_path": "username/repo-name",
  "github_token": "github_pat_..."  // Optional, for private repos
}
```

#### Method 3: Default Model

If no model is specified, it uses: `timbrooks/instruct-pix2pix`

### Step 3: Start the Service

```bash
python image_editor_service.py
```

The service will:
1. Load your specified model on first request
2. Cache it for subsequent requests
3. Support both Hugging Face Hub and GitHub models (if compatible)

## 🔍 Finding Compatible Models

### Hugging Face Hub Models (Recommended)

Popular image-to-image models:
- `runwayml/stable-diffusion-v1-5` - Stable Diffusion 1.5 (supports img2img)
- `timbrooks/instruct-pix2pix` - InstructPix2Pix (default)
- `stabilityai/stable-diffusion-2-1` - Stable Diffusion 2.1

Browse more: https://huggingface.co/models?pipeline_tag=image-to-image

### GitHub Models

If you have a model on GitHub:
1. Make sure it's in Diffusers format
2. The repo should contain:
   - `model_index.json` or `config.json`
   - Model weights (`.safetensors` or `.bin` files)
   - Other required files

## 🔑 GitHub Token Setup

If using a **private GitHub repository**:

1. Create a GitHub Personal Access Token:
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Select scopes: `repo` (for private repos)
   - Copy the token (starts with `github_pat_...`)

2. Use the token:
   ```bash
   export GITHUB_TOKEN="github_pat_..."
   ```

   Or pass it in the request:
   ```json
   {
     "github_token": "github_pat_..."
   }
   ```

## ⚠️ Important Limitations

1. **GitHub vs Hugging Face**: Most models are on Hugging Face Hub, not GitHub
2. **Model Format**: GitHub models must be in Diffusers-compatible format
3. **Private Repos**: Require GitHub token with `repo` scope
4. **Model Size**: Large models may take time to download on first use

## 🧪 Testing Your Model

1. Start the service:
   ```bash
   python image_editor_service.py
   ```

2. Check health:
   ```bash
   curl http://localhost:5000/health
   ```

3. Test with your model:
   ```bash
   curl -X POST http://localhost:5000/edit-image \
     -H "Content-Type: application/json" \
     -d '{
       "prompt": "change hair to blonde",
       "image": "base64_image_data",
       "model_path": "your-username/your-model"
     }'
   ```

## 💡 Tips

1. **Use Hugging Face Hub**: Most models are there and easier to use
2. **Model Compatibility**: Make sure your model supports image-to-image
3. **First Download**: First time loading a model takes time (downloading)
4. **Caching**: Models are cached in `~/.cache/huggingface/`

## 🎉 You're Ready!

Your service now supports:
- ✅ Hugging Face Hub models
- ✅ GitHub models (if compatible)
- ✅ Private repos (with GitHub token)
- ✅ Custom model paths

Just specify your model and start editing images!





























