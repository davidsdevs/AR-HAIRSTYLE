# AI Recommendation Service Setup

## 🎯 FREE AI Recommendations - No OpenAI Needed!

This service uses language models from GitHub/Hugging Face to generate hairstyle recommendations - **100% FREE, no API credits needed!**

## 📋 Requirements

1. **Python 3.8+** installed
2. **GPU (recommended)** or CPU (slower but works)
   - GPU: NVIDIA with CUDA support (8GB+ VRAM recommended)
   - CPU: Will work but much slower (1-2 minutes per recommendation)

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
pip install -r requirements.txt
```

This installs:
- Flask (web server)
- Transformers (Hugging Face models)
- PyTorch
- All other required packages

### Step 2: Start the Recommendation Service

```bash
python recommendation_service.py
```

**First Run:**
- The model will be downloaded automatically (~2-7GB depending on model)
- This may take 10-30 minutes depending on your internet speed
- After first download, it will be cached locally

**Subsequent Runs:**
- Model loads from cache (much faster, ~30-60 seconds)

### Step 3: Verify Service is Running

Open your browser and go to:
```
http://localhost:5001/health
```

You should see:
```json
{
  "status": "ok",
  "service": "AI Recommendation Service",
  "model": "microsoft/Phi-3-mini-4k-instruct",
  "device": "cuda" or "cpu",
  "model_loaded": true
}
```

### Step 4: Start Your Kiosk Application

In a **separate terminal**, start your Node.js servers:

```bash
npm run dev:full
```

This starts:
- Node.js proxy server (port 3001)
- Vite dev server (port 5173)
- Python image editor service (port 5000)
- Python recommendation service (port 5001)

## 🎯 How It Works

1. **User scans face** in the kiosk
2. **User data is analyzed** (face shape, skin tone, etc.)
3. **Frontend calls** `http://localhost:5001/recommend`
4. **Python service** uses language model to generate recommendations
5. **Recommendations** are returned to the kiosk

## ⚙️ Model Configuration

### Default Model

The service uses `microsoft/Phi-3-mini-4k-instruct` by default (small, fast, good quality).

### Using a Different Model

#### Option 1: Environment Variable

```bash
export RECOMMENDATION_MODEL="mistralai/Mistral-7B-Instruct-v0.2"
python recommendation_service.py
```

#### Option 2: Request Parameter

When calling the API, include in the request body:
```json
{
  "userData": {...},
  "hairstyleOptions": [...],
  "model_path": "username/repo-name",
  "github_token": "github_pat_..."  // Optional, for private repos
}
```

### Popular Free Models

**Small & Fast (Recommended for CPU):**
- `microsoft/Phi-3-mini-4k-instruct` (default) - ~2GB
- `microsoft/Phi-3-mini-128k-instruct` - ~2GB
- `Qwen/Qwen2-0.5B-Instruct` - ~1GB

**Medium Quality:**
- `mistralai/Mistral-7B-Instruct-v0.2` - ~7GB
- `meta-llama/Llama-3.2-3B-Instruct` - ~3GB

**High Quality (Requires GPU):**
- `mistralai/Mixtral-8x7B-Instruct-v0.1` - ~47GB
- `meta-llama/Llama-3-8B-Instruct` - ~16GB

Browse more: https://huggingface.co/models?pipeline_tag=text-generation

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

## 🧪 Testing the Service

1. Start the service:
   ```bash
   python recommendation_service.py
   ```

2. Test with curl:
   ```bash
   curl -X POST http://localhost:5001/recommend \
     -H "Content-Type: application/json" \
     -d '{
       "userData": {
         "faceShape": "oval",
         "skinTone": {"label": "medium"},
         "hairLength": "medium",
         "hairType": "straight"
       },
       "hairstyleOptions": [
         {"id": 1, "name": "Bob Cut", "category": "short", "hairType": "straight"},
         {"id": 2, "name": "Long Waves", "category": "long", "hairType": "wavy"}
       ]
     }'
   ```

## ⚠️ Important Notes

1. **First Download**: First time loading a model takes time (downloading)
2. **Model Size**: Larger models = better quality but slower and need more RAM/VRAM
3. **CPU Mode**: Works on CPU but is much slower (1-2 minutes per recommendation)
4. **GPU Recommended**: If you have an NVIDIA GPU, install CUDA-enabled PyTorch for much faster processing

## 💡 Tips

1. **Start Small**: Use `Phi-3-mini` for testing (fast, small)
2. **Upgrade Later**: Switch to larger models for better quality once it's working
3. **GPU Setup**: If you have a GPU, make sure PyTorch detects it:
   ```python
   import torch
   print(torch.cuda.is_available())  # Should be True
   ```
4. **Memory**: Make sure you have enough RAM/VRAM for the model you choose

## 🎉 You're Ready!

Your recommendation service now:
- ✅ Uses FREE language models (no API credits!)
- ✅ Supports GitHub/Hugging Face models
- ✅ Works offline (after first download)
- ✅ No rate limits
- ✅ Privacy (data stays local)

The kiosk will automatically use this service when it's running!





























