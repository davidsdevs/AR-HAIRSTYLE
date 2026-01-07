# 🚀 Quick Start Guide - Start All Services

## ⚠️ IMPORTANT: You're seeing "NOT AI-generated" because services aren't running!

To get **ACTUAL AI recommendations** and **image-to-image editing**, you need to start these services:

## 📋 Services Needed

1. **Recommendation Service** (Port 5001) - For AI recommendations
2. **Image Editor Service** (Port 5000) - For image-to-image editing
3. **Node.js Server** (Port 3001) - Proxy server
4. **Vite Dev Server** (Port 5173) - Frontend

## 🎯 EASIEST WAY: Start Everything at Once

```bash
npm run dev:full
```

This starts ALL services automatically!

## 🔧 OR Start Manually

### Terminal 1: Recommendation Service (AI Recommendations)
```bash
python recommendation_service.py
```

**Wait for:** "✅ Model loaded successfully" (first time takes 10-30 minutes to download model)

### Terminal 2: Image Editor Service (Image-to-Image)
```bash
python image_editor_service.py
```

**Wait for:** "✅ Stable Diffusion img2img model loaded successfully" (first time takes 10-30 minutes)

### Terminal 3: Node.js + Frontend
```bash
npm run dev:all
```

## ✅ Verify Services Are Running

### Check Recommendation Service:
```bash
curl http://localhost:5001/health
```

Should return:
```json
{
  "status": "ok",
  "service": "AI Recommendation Service",
  "model_loaded": true
}
```

### Check Image Editor Service:
```bash
curl http://localhost:5000/health
```

Should return:
```json
{
  "status": "ok",
  "service": "Stable Diffusion img2img Editor",
  "pipeline_loaded": true
}
```

## 🎯 What You'll See

### When Services Are Running:
- ✅ **Green banner**: "AI-Generated Recommendations"
- ✅ **Green badges**: "AI Generated" on each recommendation
- ✅ **Console**: "THESE ARE REAL AI RECOMMENDATIONS, NOT RULE-BASED!"

### When Services Are NOT Running:
- ⚠️ **Yellow banner**: "WARNING: These recommendations are NOT AI-generated"
- ⚠️ **Yellow badges**: "Not AI" on each recommendation
- ⚠️ **Console**: "FALLING BACK TO RULE-BASED RECOMMENDATIONS"

## 💡 Tips

1. **First Run**: Models download automatically (10-30 minutes) - be patient!
2. **Subsequent Runs**: Models load from cache (30-60 seconds)
3. **Check Console**: Browser console will show exactly what's happening
4. **Check Terminal**: Python services will show detailed logs

## 🐛 Troubleshooting

### "Connection refused" error
- Service isn't running - start it!

### "Model loading" message
- First time: Wait 10-30 minutes for download
- After download: Wait 30-60 seconds for model to load

### Still seeing "NOT AI-generated"
- Check if service is running: `curl http://localhost:5001/health`
- Check browser console for errors
- Make sure Python service started successfully





























