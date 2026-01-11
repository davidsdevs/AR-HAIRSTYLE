# Render Deployment Guide

## Quick Deploy

### Option 1: Blueprint (Recommended)
1. Push code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click "New" → "Blueprint"
4. Connect your GitHub repo
5. Render will auto-detect `render.yaml` and create both services

### Option 2: Manual Setup

#### Step 1: Deploy Backend API
1. Go to Render Dashboard → "New" → "Web Service"
2. Connect your GitHub repo
3. Configure:
   - Name: `ar-hairstyle-api`
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `npm run start:prod`
4. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `OPENROUTER_API_KEYS` = your OpenRouter API keys (comma-separated)
   - `ORIGIN` = your frontend URL (after deploying frontend)
5. Deploy

#### Step 2: Deploy Frontend
1. Go to Render Dashboard → "New" → "Static Site"
2. Connect your GitHub repo
3. Configure:
   - Name: `ar-hairstyle-frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
4. Add Environment Variables:
   - `VITE_API_URL` = your backend URL (e.g., `https://ar-hairstyle-api.onrender.com`)
5. Deploy

#### Step 3: Update CORS
After both are deployed, update the backend's `ORIGIN` env var with the frontend URL.

## Environment Variables

### Backend (Web Service)
| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `OPENROUTER_API_KEYS` | API keys (comma-separated) | `sk-or-v1-xxx,sk-or-v1-yyy` |
| `ORIGIN` | Frontend URL for CORS | `https://ar-hairstyle-frontend.onrender.com` |
| `PORT` | Server port (auto-set by Render) | `10000` |

### Frontend (Static Site)
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://ar-hairstyle-api.onrender.com` |

## Notes
- Free tier services spin down after 15 mins of inactivity
- First request after spin-down takes ~30 seconds
- For production, consider paid tier for always-on
