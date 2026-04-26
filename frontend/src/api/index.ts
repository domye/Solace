import { OpenAPI, ApiClient } from './generated';
import { getApiBase } from '@/config/runtime';
import type { ImageSettings } from '@/types';

OpenAPI.BASE = getApiBase();

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

export function getStoredToken(): string | null {
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      return parsed?.state?.accessToken || null;
    }
  } catch {
    // Ignore malformed persisted auth state.
  }
  return null;
}

function getStoredRefreshToken(): string | null {
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      return parsed?.state?.refreshToken || null;
    }
  } catch {
    // Ignore malformed persisted auth state.
  }
  return null;
}

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
    // Ignore malformed persisted auth state.
  }
}

export function clearAuthStorage() {
  localStorage.removeItem('auth-storage');
  window.dispatchEvent(new CustomEvent('auth:logout'));
  if (window.location.pathname.startsWith('/admin')) {
    window.location.href = '/login';
  }
}

async function doRefreshToken(): Promise<string | null> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) {
    clearAuthStorage();
    return null;
  }

  try {
    const tempClient = new ApiClient({ BASE: getApiBase() });
    const response = await tempClient.auth.postAuthRefresh({ refresh_token: refreshToken });

    if (response.success && response.data) {
      const { access_token, refresh_token } = response.data;
      updateStoredTokens(access_token, refresh_token);

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

async function getOrRefreshToken(): Promise<string | null> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  const token = getStoredToken();
  const refreshToken = getStoredRefreshToken();

  if (token) {
    return token;
  }

  if (refreshToken) {
    isRefreshing = true;
    refreshPromise = doRefreshToken().finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });
    return refreshPromise;
  }

  return '';
}

OpenAPI.TOKEN = async (): Promise<string> => {
  const token = await getOrRefreshToken();
  return token || '';
};

const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
	const response = await originalFetch(input, init);

	if (response.status === 429) {
		try {
			const clonedResponse = response.clone();
			const data = await clonedResponse.json();
			const message = data?.error?.message || "请求过于频繁，请稍后再试";
			window.dispatchEvent(new CustomEvent('api:rate-limited', {
				detail: { message, code: data?.error?.code || 'TOO_MANY_REQUESTS' }
			}));
		} catch {
			window.dispatchEvent(new CustomEvent('api:rate-limited', {
				detail: { message: "请求过于频繁，请稍后再试", code: 'TOO_MANY_REQUESTS' }
			}));
		}
		return response;
	}

	if (response.status === 401) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;

    if (url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh')) {
      return response;
    }

    const refreshToken = getStoredRefreshToken();

    if (!refreshToken) {
      return response;
    }

    const newToken = await doRefreshToken();

    if (newToken && init?.headers) {
      const retryHeaders = new Headers(init.headers);
      retryHeaders.set('Authorization', `Bearer ${newToken}`);

      // Clone FormData to ensure body is fresh for retry
      let retryBody = init.body;
      if (init.body instanceof FormData) {
        const cloned = new FormData();
        init.body.forEach((value, key) => {
          cloned.append(key, value);
        });
        retryBody = cloned;
      }

      return originalFetch(input, {
        ...init,
        headers: retryHeaders,
        body: retryBody,
      });
    } else {
      clearAuthStorage();
      return new Response(JSON.stringify({ success: false, error: { code: 'SESSION_EXPIRED', message: '会话已过期，请重新登录' } }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return response;
};

export const apiClient = new ApiClient({
  BASE: getApiBase(),
  TOKEN: OpenAPI.TOKEN
});

export const setApiToken = (): void => { /* 无操作 */ };

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);

  const token = await getOrRefreshToken();
  const response = await fetch(`${getApiBase()}/uploads/images`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  if (response.status === 413) {
    throw new Error('图片文件过大，请上传 50MB 以内的图片');
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.success || !payload?.data?.url) {
    throw new Error(payload?.error?.message || 'Image upload failed');
  }

  return payload.data.url;
}

export async function getImageSettings(): Promise<ImageSettings> {
  const response = await fetch(`${getApiBase()}/settings/images`);
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.success || !payload?.data) {
    throw new Error(payload?.error?.message || 'Image settings load failed');
  }

  return payload.data;
}

export async function updateImageSettings(settings: ImageSettings): Promise<ImageSettings> {
  const token = await getOrRefreshToken();
  const response = await fetch(`${getApiBase()}/admin/settings/images`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(settings),
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.success || !payload?.data) {
    throw new Error(payload?.error?.message || 'Image settings save failed');
  }

  return payload.data;
}

export * from './generated';
