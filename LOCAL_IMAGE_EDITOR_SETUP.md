# Local Image-to-Image Editor Setup Guide

## 🎉 FREE Image Editing - No API Credits Needed!

This setup allows you to run image-to-image models **locally** using Hugging Face Diffusers. This means:
- ✅ **100% FREE** - No API credits needed
- ✅ **True Image Editing** - Edits your actual photo (not text-to-image)
- ✅ **Privacy** - Images stay on your machine
- ✅ **No Rate Limits** - Use as much as you want

## 📋 Requirements

1. **Python 3.8+** installed
2. **GPU (recommended)** or CPU (slower but works)
   - GPU: NVIDIA with CUDA support (8GB+ VRAM recommended)
   - CPU: Will work but much slower (5-10 minutes per image)

## 🚀 Setup Instructions

### Step 1: Install Python Dependencies

```bash
pip install -r requirements.txt
```

This will install:
- Flask (web server)
- Diffusers (Hugging Face models)
- Transformers
- PyTorch
- Pillow (image processing)

**Note:** First installation may take 10-15 minutes as it downloads PyTorch and other large packages.

### Step 2: Start the Local Image Editor Service

```bash
python image_editor_service.py
```

**First Run:**
- The model will be downloaded automatically (~5GB)
- This may take 10-20 minutes depending on your internet speed
- After first download, it will be cached locally

**Subsequent Runs:**
- Model loads from cache (much faster, ~30 seconds)

### Step 3: Verify Service is Running

Open your browser and go to:
```
http://localhost:5000/health
```

You should see:
```json
{
  "status": "ok",
  "service": "Local Image-to-Image Editor",
  "model": "InstructPix2Pix",
  "device": "cuda" or "cpu"
}
```

### Step 4: Start Your Kiosk Application

In a **separate terminal**, start your Node.js servers:

```bash
npm run dev:all
```

This starts:
- Node.js proxy server (port 3001)
- Vite dev server (port 5173)
- Python image editor service (port 5000) - if running

## 🎯 How It Works

1. **User captures photo** in the kiosk
2. **User selects hairstyle** and clicks "Generate AI Image"
3. **Node.js server** receives the request
4. **Server tries LOCAL service first** (port 5000)
   - If available → Uses FREE local model
   - If not available → Falls back to cloud services
5. **Local Python service** edits the photo using InstructPix2Pix
6. **Edited image** is returned to the kiosk

## ⚙️ Model Details

**Model:** `timbrooks/instruct-pix2pix`
- Designed for image editing based on text instructions
- Preserves original image features while making edits
- Perfect for hairstyle changes!

**Performance:**
- **GPU (CUDA):** ~30-60 seconds per image
- **CPU:** ~5-10 minutes per image

## 🔧 Troubleshooting

### "Module not found" errors
```bash
pip install -r requirements.txt
```

### "CUDA out of memory" error
- Reduce image size in `image_editor_service.py` (change `max_size = 512`)
- Or use CPU mode (slower but works)

### "Connection refused" error
- Make sure Python service is running: `python image_editor_service.py`
- Check if port 5000 is available

### Model download is slow
- First download is large (~5GB)
- Be patient, it only downloads once
- Model is cached in `~/.cache/huggingface/`

## 💡 Tips

1. **GPU Recommended:** If you have an NVIDIA GPU, install CUDA-enabled PyTorch for much faster processing
2. **First Run:** Be patient on first run - model download takes time
3. **Keep Service Running:** Keep the Python service running while using the kiosk
4. **CPU Mode:** Works on CPU but is much slower (5-10 minutes per image)

## 🎉 You're All Set!

Now your kiosk will use **FREE local image editing** when the Python service is running!

The system will automatically:
1. Try local service first (FREE)
2. Fall back to cloud services if local service unavailable
3. Use Pollinations.AI as final free fallback

**No API credits needed!** 🚀






























