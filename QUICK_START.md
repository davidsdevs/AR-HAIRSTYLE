# 🚀 Quick Start Guide - Local Image Editing

## Option 1: Full Setup (Recommended - FREE Local Editing)

### Step 1: Install Python Dependencies
```bash
pip install -r requirements.txt
```

### Step 2: Start Everything
```bash
npm run dev:full
```

This starts:
- ✅ Python image editor service (port 5000) - **FREE local editing**
- ✅ Node.js proxy server (port 3001)
- ✅ Vite dev server (port 5173)

**First time:** Model download takes 10-20 minutes. Be patient!

---

## Option 2: Without Local Editor (Cloud Services Only)

If you don't want to run the local Python service:

```bash
npm run dev:all
```

This starts:
- ✅ Node.js proxy server (port 3001)
- ✅ Vite dev server (port 5173)

**Note:** Will use cloud services (may require credits) or Pollinations.AI fallback.

---

## 🎯 Access Your Kiosk

Open your browser:
```
http://localhost:5173
```

---

## ✅ Verify Local Service is Running

Check: http://localhost:5000/health

Should see:
```json
{
  "status": "ok",
  "service": "Local Image-to-Image Editor",
  "model": "InstructPix2Pix",
  "device": "cuda" or "cpu"
}
```

---

## 💡 Tips

1. **First Run:** Model download is large (~5GB), be patient!
2. **GPU Recommended:** Much faster (30-60 seconds vs 5-10 minutes on CPU)
3. **Keep Running:** Keep all services running while using the kiosk
4. **Free Forever:** Local service = no API credits ever needed! 🎉

---

## 🆘 Troubleshooting

**Python not found?**
- Install Python 3.8+ from python.org

**Module errors?**
```bash
pip install -r requirements.txt
```

**Port 5000 in use?**
- Change port in `image_editor_service.py`: `port = 5001`

**Model download slow?**
- Normal! First time only. Model is cached after download.

---

## 🎉 You're Ready!

Your kiosk now has **FREE local image editing**! No API credits needed! 🚀






























