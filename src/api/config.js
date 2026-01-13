// API Configuration
// In production, use relative URLs (same origin)
// In development, Vite proxy handles /api/* routes

// Check if we're running on localhost (development) or deployed (production)
const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// In production (not localhost), use relative URL (same server serves both frontend and API)
// In development (localhost), use localhost:3001
export const API_BASE_URL = isLocalhost ? 'http://localhost:3001' : '';

// Log for debugging
console.log('🔧 [CONFIG] hostname:', typeof window !== 'undefined' ? window.location.hostname : 'SSR');
console.log('🔧 [CONFIG] isLocalhost:', isLocalhost);
console.log('🔧 [CONFIG] API_BASE_URL:', API_BASE_URL || '(empty - using relative URLs)');
