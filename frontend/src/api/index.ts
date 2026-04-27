import { OpenAPI, ApiClient } from './generated';
import {
  getApiBase,
  getImgBedBase,
  getImgBedChunkSizeBytes,
  getImgBedChunkThresholdBytes,
  getImgBedUploadChannel,
  getImgBedUploadChannelName,
  getImgBedUploadField,
  getImgBedUploadFolder,
  getImgBedUploadToken,
} from '@/config/runtime';
import type { ImageSettings } from '@/types';

OpenAPI.BASE = getApiBase();

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

type ErrorPayload = {
  error?: {
    message?: string;
    code?: string;
  };
};

type ImgBedResponse = {
  success?: boolean;
  message?: string;
  msg?: string;
  data?: unknown;
};

type ImgBedUploadResult = {
  fileId: string;
  url: string;
};

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

      window.dispatchEvent(
        new CustomEvent('auth:token-refreshed', {
          detail: { accessToken: access_token, refreshToken: refresh_token },
        }),
      );

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
      const data = (await clonedResponse.json()) as ErrorPayload;
      const message = data?.error?.message || '请求过于频繁，请稍后再试';
      window.dispatchEvent(
        new CustomEvent('api:rate-limited', {
          detail: { message, code: data?.error?.code || 'TOO_MANY_REQUESTS' },
        }),
      );
    } catch {
      window.dispatchEvent(
        new CustomEvent('api:rate-limited', {
          detail: { message: '请求过于频繁，请稍后再试', code: 'TOO_MANY_REQUESTS' },
        }),
      );
    }
    return response;
  }

  if (response.status === 401) {
    const rawUrl =
      typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
    const requestUrl = new URL(rawUrl, window.location.origin);
    const apiBaseUrl = new URL(getApiBase(), window.location.origin);

    if (
      requestUrl.origin !== apiBaseUrl.origin ||
      !requestUrl.pathname.startsWith(apiBaseUrl.pathname) ||
      requestUrl.pathname.includes('/auth/login') ||
      requestUrl.pathname.includes('/auth/register') ||
      requestUrl.pathname.includes('/auth/refresh')
    ) {
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
    }

    clearAuthStorage();
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: 'SESSION_EXPIRED', message: '会话已过期，请重新登录' },
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  return response;
};

export const apiClient = new ApiClient({
  BASE: getApiBase(),
  TOKEN: OpenAPI.TOKEN,
});

export const setApiToken = (): void => {
  // Tokens are resolved lazily via OpenAPI.TOKEN.
};

function buildImgBedUrl(base: string): string {
  const trimmed = base.trim().replace(/\/+$/, '');
  if (!trimmed) {
    throw new Error('ImgBed upload is not configured');
  }
  return trimmed.endsWith('/upload') ? trimmed : `${trimmed}/upload`;
}

function ensureImgBedConfig(): { endpoint: string; token: string } | null {
  const base = getImgBedBase().trim();
  const token = getImgBedUploadToken().trim();
  if (!base || !token) {
    return null;
  }

  return {
    endpoint: buildImgBedUrl(base),
    token,
  };
}

function buildDatedUploadFolder(): string {
  const baseFolder = getImgBedUploadFolder().trim().replace(/^\/+|\/+$/g, '');
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return [baseFolder, year, month].filter(Boolean).join('/');
}

async function readResponseBody(response: Response): Promise<string> {
  try {
    return (await response.text()).trim();
  } catch {
    return '';
  }
}

async function parseJsonResponse<T>(response: Response): Promise<T | null> {
  const raw = await readResponseBody(response);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(raw);
  }
}

function getImgBedErrorMessage(payload: ImgBedResponse | null, fallback: string): string {
  return payload?.message || payload?.msg || fallback;
}

function extractFileIdFromUrl(rawUrl: string): string {
  if (!rawUrl) {
    return '';
  }

  try {
    const parsed = new URL(rawUrl);
    return parsed.pathname.replace(/^\/+/, '');
  } catch {
    return rawUrl.replace(/^https?:\/\/[^/]+\//i, '').replace(/^\/+/, '').split('?')[0] ?? '';
  }
}

function resolveUrl(raw: string, baseUrl?: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  try {
    const parsed = new URL(trimmed);
    parsed.searchParams.delete('md_width');
    return parsed.toString();
  } catch {
    if (baseUrl) {
      try {
        const resolved = new URL(trimmed, baseUrl);
        resolved.searchParams.delete('md_width');
        return resolved.toString();
      } catch {
        return trimmed;
      }
    }
    return trimmed;
  }
}

function parseImgBedUploadResult(payload: ImgBedResponse | null, imgBedBaseUrl?: string): ImgBedUploadResult {
  // Handle array responses: [{"src": "/file/..."}]
  if (Array.isArray(payload) && payload.length > 0) {
    const first = payload[0] as Record<string, unknown> | undefined;
    const src = first && (first.src || first.url || first.link || '');
    if (src && typeof src === 'string') {
      const url = resolveUrl(src, imgBedBaseUrl);
      const fileId = extractFileIdFromUrl(url);
      if (url && fileId) {
        return { url, fileId };
      }
    }
  }

  const data = payload && typeof payload === 'object' && !Array.isArray(payload)
    ? (payload as ImgBedResponse).data
    : undefined;

  if (typeof data === 'string') {
    const url = resolveUrl(data, imgBedBaseUrl);
    const fileId = extractFileIdFromUrl(url);
    if (url && fileId) {
      return { url, fileId };
    }
  }

  const objectData = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
  const url = resolveUrl(
    String(objectData.url || objectData.src || objectData.link || objectData.fullUrl || ''),
    imgBedBaseUrl,
  );
  const fileId = String(
    objectData.fileId ||
      objectData.file_id ||
      objectData.path ||
      objectData.key ||
      objectData.id ||
      extractFileIdFromUrl(url),
  ).trim();

  if (!url || !fileId) {
    throw new Error(getImgBedErrorMessage(payload as ImgBedResponse | null, 'Image upload failed'));
  }

  return { url, fileId };
}

function appendUploadOptions(formData: FormData) {
  const channel = getImgBedUploadChannel().trim();
  const channelName = getImgBedUploadChannelName().trim();
  const uploadFolder = buildDatedUploadFolder();

  if (channel) {
    formData.append('uploadChannel', channel);
  }
  if (channelName) {
    formData.append('channelName', channelName);
  }
  if (uploadFolder) {
    formData.append('uploadFolder', uploadFolder);
  }

  formData.append('returnFormat', 'full');
  formData.append('autoRetry', 'true');
  formData.append('uploadNameType', 'short');
}

async function registerUploadedMediaAsset(file: File, upload: ImgBedUploadResult): Promise<void> {
  const token = await getOrRefreshToken();
  const response = await fetch(`${getApiBase()}/admin/media/assets/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      provider: 'imgbed',
      file_id: upload.fileId,
      url: upload.url,
      original_name: file.name,
      content_type: file.type,
      size: file.size,
    }),
  });

  const payload = await parseJsonResponse<ImgBedResponse>(response).catch(() => null);
  if (!response.ok) {
    throw new Error(getImgBedErrorMessage(payload, 'Media asset registration failed'));
  }
}

async function uploadImageViaBackend(file: File): Promise<string> {
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

async function uploadImageDirectToImgBed(file: File, endpoint: string, token: string): Promise<ImgBedUploadResult> {
  const formData = new FormData();
  formData.append(getImgBedUploadField(), file, file.name);
  appendUploadOptions(formData);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const payload = await parseJsonResponse<ImgBedResponse>(response).catch((error) => {
    throw new Error(error instanceof Error ? error.message : 'Image upload failed');
  });

  if (!response.ok || payload?.success === false) {
    throw new Error(getImgBedErrorMessage(payload, 'Image upload failed'));
  }

  const baseUrl = getImgBedBase();
  return parseImgBedUploadResult(payload, baseUrl);
}

async function initChunkedUpload(file: File, endpoint: string, token: string): Promise<string> {
  const formData = new FormData();
  formData.append('initChunked', 'true');
  formData.append('fileName', file.name);
  formData.append('fileSize', String(file.size));
  formData.append('contentType', file.type || 'application/octet-stream');
  appendUploadOptions(formData);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const payload = await parseJsonResponse<ImgBedResponse>(response).catch((error) => {
    throw new Error(error instanceof Error ? error.message : 'Chunked upload initialization failed');
  });

  if (!response.ok || payload?.success === false) {
    throw new Error(getImgBedErrorMessage(payload, 'Chunked upload initialization failed'));
  }

  const data = payload?.data && typeof payload.data === 'object' ? (payload.data as Record<string, unknown>) : {};
  const uploadId = String(data.uploadId || data.upload_id || data.id || data.sessionId || '').trim();
  if (!uploadId) {
    throw new Error('Chunked upload initialization did not return uploadId');
  }

  return uploadId;
}

async function uploadChunk(
  chunk: Blob,
  file: File,
  endpoint: string,
  token: string,
  uploadId: string,
  chunkIndex: number,
  totalChunks: number,
): Promise<void> {
  const formData = new FormData();
  formData.append('chunked', 'true');
  formData.append('uploadId', uploadId);
  formData.append('chunkIndex', String(chunkIndex));
  formData.append('totalChunks', String(totalChunks));
  formData.append('fileName', file.name);
  formData.append(getImgBedUploadField(), chunk, file.name);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const payload = await parseJsonResponse<ImgBedResponse>(response).catch(() => null);
  if (!response.ok || payload?.success === false) {
    throw new Error(getImgBedErrorMessage(payload, `Chunk ${chunkIndex + 1} upload failed`));
  }
}

async function mergeChunkedUpload(
  file: File,
  endpoint: string,
  token: string,
  uploadId: string,
  totalChunks: number,
): Promise<ImgBedUploadResult> {
  const formData = new FormData();
  formData.append('chunked', 'true');
  formData.append('merge', 'true');
  formData.append('uploadId', uploadId);
  formData.append('totalChunks', String(totalChunks));
  formData.append('fileName', file.name);
  appendUploadOptions(formData);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const payload = await parseJsonResponse<ImgBedResponse>(response).catch((error) => {
    throw new Error(error instanceof Error ? error.message : 'Chunked upload merge failed');
  });

  if (!response.ok || payload?.success === false) {
    throw new Error(getImgBedErrorMessage(payload, 'Chunked upload merge failed'));
  }

  const baseUrl = getImgBedBase();
  return parseImgBedUploadResult(payload, baseUrl);
}

async function cleanupChunkedUpload(endpoint: string, token: string, uploadId: string): Promise<void> {
  if (!uploadId) {
    return;
  }

  const formData = new FormData();
  formData.append('chunked', 'true');
  formData.append('cleanup', 'true');
  formData.append('uploadId', uploadId);

  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
  } catch {
    // Best-effort cleanup for abandoned chunk sessions.
  }
}

async function uploadImageChunkedToImgBed(file: File, endpoint: string, token: string): Promise<ImgBedUploadResult> {
  const uploadId = await initChunkedUpload(file, endpoint, token);
  const chunkSize = getImgBedChunkSizeBytes();
  const totalChunks = Math.ceil(file.size / chunkSize);

  try {
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex += 1) {
      const start = chunkIndex * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      await uploadChunk(file.slice(start, end), file, endpoint, token, uploadId, chunkIndex, totalChunks);
    }

    return await mergeChunkedUpload(file, endpoint, token, uploadId, totalChunks);
  } catch (error) {
    await cleanupChunkedUpload(endpoint, token, uploadId);
    throw error;
  }
}

function shouldFallbackToBackendUpload(error: unknown): boolean {
  if (!(error instanceof TypeError)) {
    return false;
  }

  return /(failed to fetch|load failed|networkerror)/i.test(error.message);
}

export async function uploadImage(file: File): Promise<string> {
  const imgBedConfig = ensureImgBedConfig();
  if (!imgBedConfig) {
    return uploadImageViaBackend(file);
  }

  let upload: ImgBedUploadResult;
  try {
    upload =
      file.size > getImgBedChunkThresholdBytes()
        ? await uploadImageChunkedToImgBed(file, imgBedConfig.endpoint, imgBedConfig.token)
        : await uploadImageDirectToImgBed(file, imgBedConfig.endpoint, imgBedConfig.token);
  } catch (error) {
    if (shouldFallbackToBackendUpload(error)) {
      return uploadImageViaBackend(file);
    }
    throw error;
  }

  await registerUploadedMediaAsset(file, upload);
  return upload.url;
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
