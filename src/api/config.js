// API Configuration
// In production, use relative URLs (same origin)
// In development, Vite proxy handles /api/* routes

// Check if we're in production (built app) or development
const isProduction = import.meta.env.PROD;

// In production, use relative URL (same server serves both frontend and API)
// In development, use localhost:3001 (Vite proxy will forward to it)
export const API_BASE_URL = isProduction ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3001');
