# How to Run the Application

## Quick Start (Both Server and Frontend)

```bash
npm run dev:all
```

This will start both:
- Backend proxy server on `http://localhost:3001`
- Frontend Vite dev server on `http://localhost:5173`

## Or Run Separately

### Terminal 1 - Start Proxy Server:
```bash
npm run server
```

### Terminal 2 - Start Frontend:
```bash
npm run dev
```

## Why the Proxy Server?

The Hugging Face API doesn't allow direct browser requests due to CORS restrictions. The proxy server:
- Runs on your local machine (port 3001)
- Makes requests to Hugging Face API server-side (no CORS issues)
- Returns the image to your frontend
- Completely bypasses CORS problems

## Troubleshooting

If you see "Connection refused" errors:
1. Make sure the proxy server is running (`npm run server`)
2. Check that port 3001 is not in use
3. Try restarting both servers


































