# ⚠️ QUICK FIX: "NOT AI-generated" Warning

## 🔴 Problem
You're seeing: **"⚠️ WARNING: These recommendations are NOT AI-generated"**

This means the **recommendation service is NOT running**.

## ✅ Solution: Start the Recommendation Service

### Option 1: Start Everything (Recommended)
```bash
npm run dev:full
```

This starts:
- ✅ Recommendation service (port 5001) - AI recommendations
- ✅ Image editor service (port 5000) - Image-to-image
- ✅ Node.js server (port 3001) - Proxy
- ✅ Vite dev server (port 5173) - Frontend

### Option 2: Start Just Recommendation Service
```bash
python recommendation_service.py
```

**OR** in a new terminal:
```bash
npm run recommendation
```

## ⏱️ First Time Setup

**First run takes 10-30 minutes** (downloading AI model):
- Model: `microsoft/Phi-3-mini-4k-instruct` (~2GB)
- You'll see: "Loading recommendation model..."
- Wait for: "✅ Model loaded successfully!"

**After first download:**
- Loads in 30-60 seconds from cache

## ✅ Verify It's Working

1. **Check service is running:**
   - Open: http://localhost:5001/health
   - Should show: `{"status": "ok", "model_loaded": true}`

2. **Refresh your kiosk page**

3. **Check the console:**
   - Should see: "✅✅✅ THESE ARE REAL AI RECOMMENDATIONS, NOT RULE-BASED!"

4. **Check the UI:**
   - Should see: **Green banner** "✅ AI-Generated Recommendations"
   - Should see: **Green badges** "AI Generated" on cards

## 🐛 Still Not Working?

1. **Check if Python is installed:**
   ```bash
   python --version
   ```

2. **Check if dependencies are installed:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Check the terminal** where you started the service:
   - Look for errors
   - Make sure it says "Server starting on http://localhost:5001"

4. **Check browser console:**
   - Look for connection errors
   - Should see attempts to connect to `http://localhost:5001/recommend`

## 💡 Pro Tip

Keep the Python service terminal open so you can see:
- When model is loading
- When requests are received
- Any errors that occur





























