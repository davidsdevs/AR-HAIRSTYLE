# Firebase Configuration Update Instructions

## ✅ Local Environment Updated
The `.env` file has been updated with:
- Original OpenRouter API keys (2 keys for rotation)
- New Firebase configuration for `official-david-salon-a6450` project

## 🚀 Render Dashboard Update Required

You need to update the following environment variables in your Render dashboard at:
https://dashboard.render.com/web/david-salon-kiosk/env

### Firebase Environment Variables (UPDATE THESE):

```
VITE_FIREBASE_API_KEY=AIzaSyAehuymW1M3_OuAb0_QKGe5SvF50RQMXyc
VITE_FIREBASE_AUTH_DOMAIN=official-david-salon-a6450.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=official-david-salon-a6450
VITE_FIREBASE_STORAGE_BUCKET=official-david-salon-a6450.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=842310549544
VITE_FIREBASE_APP_ID=1:842310549544:web:751ba88fa246e6b362751d
VITE_FIREBASE_MEASUREMENT_ID=G-2KD6VW398N
```

### OpenRouter API Keys (VERIFY THESE):

```
OPENROUTER_API_KEYS=[Your OpenRouter API keys from .env file]
```

### Other Environment Variables (KEEP AS-IS):

```
GEMINI_API_KEY=[Your Gemini API key from .env file]
ORIGIN=https://david-salon-kiosk.onrender.com
VITE_CLOUDINARY_CLOUD_NAME=[Your Cloudinary cloud name]
VITE_CLOUDINARY_UPLOAD_PRESET=[Your Cloudinary upload preset]
BREVO_API_KEY=[Your Brevo API key from .env file]
BREVO_SENDER_EMAIL=[Your sender email]
BREVO_SENDER_NAME=David's Salon
NODE_ENV=production
PORT=10000
```

## 📝 Steps to Update:

1. Go to Render Dashboard: https://dashboard.render.com
2. Select your service: `ar-hairstyle-app` or `david-salon-kiosk`
3. Click on "Environment" in the left sidebar
4. Update the Firebase environment variables listed above
5. Verify the OpenRouter API keys are correct
6. Click "Save Changes"
7. Render will automatically redeploy with the new configuration

## ✅ What's Changed:

- **Firebase Project**: Changed from test project to `official-david-salon-a6450`
- **OpenRouter Keys**: Restored original 2 API keys for rotation
- **All other configs**: Remain the same (Brevo, Cloudinary, Gemini)

## 🔍 After Deployment:

Test the following features to ensure everything works:
1. Services section loads from Firebase
2. Products section loads from Firebase
3. AI recommendations work (OpenRouter)
4. Image generation works (OpenRouter)
5. Email sending works (Brevo)

Your site: https://david-salon-kiosk.onrender.com
