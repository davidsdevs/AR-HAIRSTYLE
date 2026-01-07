# AR Kiosk - Minimum System Requirements

Based on the actual system architecture and technologies used, here are the **minimum requirements** to run the AR Hair Try-On Kiosk system.

## 🎯 System Overview

The AR Kiosk consists of:
1. **Frontend Application** (React + Vite) - Runs in browser
2. **Node.js API Server** (Express) - Handles API requests
3. **Python Image Editor Service** (Optional) - AI image generation
4. **Python Recommendation Service** (Optional) - AI recommendations

---

## 📋 Minimum Requirements (Basic Operation)

### **Core Requirements (Essential)**

#### **Processor**
- **Minimum:** Intel Core i3 (4th gen+) or AMD equivalent
- **Recommended:** Intel Core i5 (8th gen+) or AMD Ryzen 5
- **Why:** MediaPipe face detection and Three.js 3D rendering require moderate CPU power

#### **RAM**
- **Minimum:** 8 GB
- **Recommended:** 16 GB
- **Why:** 
  - Browser needs 2-4 GB for React app + MediaPipe
  - Node.js server needs ~500 MB
  - Python services (if used) need 4-8 GB for AI models

#### **Graphics/Display**
- **Minimum:** Integrated graphics with WebGL 2.0 support
- **Recommended:** Dedicated GPU (NVIDIA/AMD) with 2GB+ VRAM
- **Why:** Three.js 3D hair rendering uses WebGL for real-time graphics

#### **Camera**
- **Minimum:** 720p HD Webcam (30 FPS)
- **Recommended:** 1080p Full HD Webcam (30+ FPS)
- **Why:** MediaPipe face detection works with 720p, but 1080p provides better accuracy

#### **Display**
- **Minimum:** 1920x1080 (Full HD) Touchscreen
- **Recommended:** 3840x2160 (4K) Touchscreen
- **Why:** UI is optimized for 4K, but works on 1080p with scaling

#### **Storage**
- **Minimum:** 10 GB free space
- **Recommended:** 50 GB free space
- **Why:** 
  - Node.js + dependencies: ~500 MB
  - Python services + AI models: 5-20 GB (if using local AI)
  - Operating system overhead

#### **Operating System**
- **Windows:** Windows 10 (64-bit) or later
- **Linux:** Ubuntu 20.04+ or equivalent
- **macOS:** macOS 10.15+ (for development)

#### **Network**
- **Minimum:** Stable Wi-Fi or Ethernet connection
- **Why:** 
  - Required for API calls (OpenRouter AI services)
  - Optional: Download AI models on first run (if using local services)

#### **Browser**
- **Chrome/Edge:** Version 90+ (Recommended)
- **Firefox:** Version 88+
- **Safari:** Version 14+ (with limitations)
- **Why:** MediaPipe and WebGL support varies by browser

---

## 🚀 Enhanced Requirements (With Local AI Services)

If you want to run the **optional Python AI services** locally (image generation and recommendations):

### **Additional Requirements**

#### **GPU (Highly Recommended)**
- **Minimum:** NVIDIA GPU with 4GB VRAM (GTX 1050 Ti or better)
- **Recommended:** NVIDIA GPU with 8GB+ VRAM (RTX 3060 or better)
- **Why:** 
  - PyTorch/Stable Diffusion models require GPU for reasonable performance
  - CPU-only mode works but is **5-10x slower** (5-10 minutes per image vs 30-60 seconds)

#### **RAM (For AI Services)**
- **Minimum:** 16 GB
- **Recommended:** 32 GB
- **Why:** AI models load into RAM/VRAM (Stable Diffusion needs 4-8 GB)

#### **Storage (For AI Models)**
- **Additional:** 20-30 GB free space
- **Why:** 
  - Stable Diffusion model: ~5-7 GB
  - Language models: 2-7 GB each
  - Model cache: ~10-15 GB

#### **Python Environment**
- **Python:** 3.8 or higher
- **CUDA:** 11.8+ (if using GPU)
- **Why:** Required for PyTorch and AI model libraries

---

## 📊 Performance Expectations

### **Basic Mode (Cloud AI Services)**
- **Face Detection:** Real-time (30 FPS)
- **3D Hair Rendering:** 30-60 FPS (depends on GPU)
- **AI Recommendations:** 2-5 seconds (via OpenRouter API)
- **AI Image Generation:** 10-30 seconds (via OpenRouter API)

### **Full Local Mode (Local AI Services)**
- **Face Detection:** Real-time (30 FPS)
- **3D Hair Rendering:** 30-60 FPS
- **AI Recommendations:** 1-2 minutes (CPU) or 5-10 seconds (GPU)
- **AI Image Generation:** 5-10 minutes (CPU) or 30-60 seconds (GPU)

---

## 🎯 Recommended Configuration (Production Kiosk)

For a **production kiosk** that will be used by customers:

| Component | Specification |
|-----------|--------------|
| **Processor** | Intel Core i5 (10th gen+) or AMD Ryzen 5 3600+ |
| **RAM** | 16 GB DDR4 |
| **GPU** | NVIDIA GTX 1660 or better (6GB+ VRAM) |
| **Camera** | 1080p HD Webcam with autofocus |
| **Display** | 4K Touchscreen (3840x2160) |
| **Storage** | 256 GB SSD |
| **Network** | Gigabit Ethernet (preferred) or 5GHz Wi-Fi |
| **OS** | Windows 11 or Ubuntu 22.04 LTS |

---

## ⚠️ Important Notes

1. **Browser Performance:** Chrome/Edge typically perform best for WebGL and MediaPipe
2. **GPU Acceleration:** Even integrated graphics can run the frontend, but dedicated GPU improves 3D rendering
3. **AI Services:** Local AI services are **optional** - the system can use cloud APIs instead
4. **Network Dependency:** Cloud AI services require stable internet; local services work offline after initial setup
5. **Touchscreen:** Not strictly required but highly recommended for kiosk experience

---

## 🔍 Testing Your System

### Quick Compatibility Check

1. **WebGL Support:**
   - Visit: https://get.webgl.org/
   - Should show a spinning cube

2. **Camera Access:**
   - Browser should prompt for camera permission
   - Test at: https://webcamtests.com/

3. **MediaPipe Test:**
   - The app will automatically test MediaPipe on load
   - Check browser console for errors

4. **GPU Detection:**
   - Open browser DevTools → Console
   - Run: `navigator.gpu ? 'WebGPU available' : 'WebGPU not available'`
   - (WebGL is more important than WebGPU for this app)

---

## 📝 Summary

**Absolute Minimum (Basic Operation):**
- Intel Core i3 / 8GB RAM / 720p Webcam / 1080p Display / Chrome Browser

**Recommended (Good Experience):**
- Intel Core i5 / 16GB RAM / 1080p Webcam / 4K Display / Dedicated GPU / Chrome Browser

**Optimal (Production Kiosk):**
- Intel Core i5+ / 16GB+ RAM / 1080p Webcam / 4K Touchscreen / NVIDIA GPU (6GB+ VRAM) / Chrome Browser

---

*Last Updated: Based on codebase analysis of AR Hair Try-On Kiosk system*

