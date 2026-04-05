import { ApiClient, OpenAPI } from './generated';

// Configure OpenAPI base URL - can be overridden via environment variable
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080/api/v1';
OpenAPI.BASE = API_BASE;

// Dynamic token resolver - returns current token for each request
// This ensures the token is always fresh from localStorage/zustand persist
OpenAPI.TOKEN = async () => {
  // Read from localStorage directly (zustand persist stores there)
  const authStorage = localStorage.getItem('auth-storage');
  if (authStorage) {
    try {
      const parsed = JSON.parse(authStorage);
      const token = parsed?.state?.accessToken;
      if (token) {
        return token;
      }
    } catch {
      // ignore parse errors
    }
  }
  return undefined;
};

// Token management for authenticated requests (deprecated - use OpenAPI.TOKEN instead)
let currentToken: string | null = null;

export function setApiToken(token: string | null) {
  currentToken = token;
  // Note: OpenAPI.TOKEN resolver will handle this dynamically now
}

export function getApiToken() {
  return currentToken;
}

// Export the API client instance
export const apiClient = new ApiClient();

// Export generated types and services
export * from './generated';