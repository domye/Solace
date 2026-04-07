import { OpenAPI, ApiClient } from './generated';

// Configure OpenAPI base URL
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080/api/v1';
OpenAPI.BASE = API_BASE;

// Token refresh state
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

// Get token from localStorage (zustand persist storage)
export function getStoredToken(): string | null {
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      return parsed?.state?.accessToken || null;
    }
  } catch {
    // ignore
  }
  return null;
}

// Get refresh token from localStorage
function getStoredRefreshToken(): string | null {
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      return parsed?.state?.refreshToken || null;
    }
  } catch {
    // ignore
  }
  return null;
}

// Update tokens in localStorage
function updateStoredTokens(accessToken: string, refreshToken: string) {
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      parsed.state.accessToken = accessToken;
      parsed.state.refreshToken = refreshToken;
      localStorage.setItem('auth-storage', JSON.stringify(parsed));
    }
  } catch {
    // ignore
  }
}

// Clear auth storage and redirect to login
export function clearAuthStorage() {
  localStorage.removeItem('auth-storage');
  window.dispatchEvent(new CustomEvent('auth:logout'));
  // 重定向到登录页
  if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
    window.location.href = '/login';
  }
}

// Refresh token API call
async function doRefreshToken(): Promise<string | null> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) {
    clearAuthStorage();
    return null;
  }

  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      clearAuthStorage();
      return null;
    }

    const data = await response.json();
    if (data.success && data.data) {
      const { access_token, refresh_token } = data.data;
      updateStoredTokens(access_token, refresh_token);

      // Dispatch event to update zustand state
      window.dispatchEvent(new CustomEvent('auth:token-refreshed', {
        detail: { accessToken: access_token, refreshToken: refresh_token }
      }));

      return access_token;
    }
  } catch {
    clearAuthStorage();
  }

  return null;
}

// Get or refresh token (with deduplication)
async function getOrRefreshToken(): Promise<string | null> {
  // If already refreshing, wait for the result
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  const token = getStoredToken();
  if (token) {
    return token;
  }

  // Token missing, try refresh
  isRefreshing = true;
  refreshPromise = doRefreshToken().finally(() => {
    isRefreshing = false;
    refreshPromise = null;
  });

  return refreshPromise;
}

// Dynamic token resolver for OpenAPI
OpenAPI.TOKEN = async (): Promise<string> => {
  const token = await getOrRefreshToken();
  return token || '';
};

// Override fetch to handle 401 and retry
const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const response = await originalFetch(input, init);

  // Check if it's a 401 and not an auth endpoint
  if (response.status === 401) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;

    // Don't retry for auth endpoints
    if (url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh')) {
      return response;
    }

    // Try to refresh token
    const newToken = await doRefreshToken();

    if (newToken && init?.headers) {
      // Retry the request with new token
      const headers = new Headers(init.headers);
      headers.set('Authorization', `Bearer ${newToken}`);

      return originalFetch(input, {
        ...init,
        headers,
      });
    } else {
      // Clear auth and redirect to login
      clearAuthStorage();
      // 返回一个新的错误响应，避免原始 401 响应被处理
      return new Response(JSON.stringify({ success: false, error: { code: 'SESSION_EXPIRED', message: '会话已过期，请重新登录' } }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return response;
};

// Export the API client instance
export const apiClient = new ApiClient();

// Export utility functions
// Note: Token is now handled via OpenAPI.TOKEN resolver and fetch interceptor
// This function is kept for API compatibility but does nothing
export const setApiToken = (): void => { /* no-op */ };

// Re-export generated types and services
export * from './generated';