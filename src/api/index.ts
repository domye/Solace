/**
 * API 客户端配置模块
 *
 * 功能：
 * - 配置 OpenAPI 基础 URL
 * - 提供动态 Token 解析器（从 localStorage 读取）
 * - 实现 Token 自动刷新机制
 * - 拦截 401 响应并自动重试
 */

import { OpenAPI, ApiClient } from './generated';

// 配置 OpenAPI 基础 URL
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080/api/v1';
OpenAPI.BASE = API_BASE;

// Token 刷新状态（防止并发刷新）
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

/**
 * 从 localStorage 获取存储的 Token
 * zustand persist 使用 'auth-storage' 作为存储键
 */
export function getStoredToken(): string | null {
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      return parsed?.state?.accessToken || null;
    }
  } catch {
    // 解析失败时忽略
  }
  return null;
}

/**
 * 从 localStorage 获取存储的刷新 Token
 */
function getStoredRefreshToken(): string | null {
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      return parsed?.state?.refreshToken || null;
    }
  } catch {
    // 解析失败时忽略
  }
  return null;
}

/**
 * 更新 localStorage 中的 Token
 */
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
    // 更新失败时忽略
  }
}

/**
 * 清除认证存储并重定向到登录页
 */
export function clearAuthStorage() {
  localStorage.removeItem('auth-storage');
  window.dispatchEvent(new CustomEvent('auth:logout'));
  // 重定向到登录页（排除登录和注册页面）
  if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
    window.location.href = '/login';
  }
}

/**
 * 执行 Token 刷新
 * 调用后端 refresh 接口获取新的 access_token 和 refresh_token
 */
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

      // 通知 zustand 状态更新
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

/**
 * 获取或刷新 Token（带去重机制）
 * 如果正在刷新，等待刷新完成；如果 Token 存在，直接返回
 */
async function getOrRefreshToken(): Promise<string | null> {
  // 如果正在刷新，等待刷新结果
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  const token = getStoredToken();
  if (token) {
    return token;
  }

  // Token 不存在，尝试刷新
  isRefreshing = true;
  refreshPromise = doRefreshToken().finally(() => {
    isRefreshing = false;
    refreshPromise = null;
  });

  return refreshPromise;
}

// 配置 OpenAPI 动态 Token 解析器
OpenAPI.TOKEN = async (): Promise<string> => {
  const token = await getOrRefreshToken();
  return token || '';
};

/**
 * 拦截 fetch 请求，处理 401 响应
 * 对于非认证接口的 401，尝试刷新 Token 并重试请求
 */
const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const response = await originalFetch(input, init);

  // 检查是否为 401 响应且非认证接口
  if (response.status === 401) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;

    // 认证接口（登录、注册、刷新）不重试
    if (url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh')) {
      return response;
    }

    // 尝试刷新 Token
    const newToken = await doRefreshToken();

    if (newToken && init?.headers) {
      // 使用新 Token 重试请求
      const headers = new Headers(init.headers);
      headers.set('Authorization', `Bearer ${newToken}`);

      return originalFetch(input, {
        ...init,
        headers,
      });
    } else {
      // Token 刷新失败，清除认证并返回错误响应
      clearAuthStorage();
      return new Response(JSON.stringify({ success: false, error: { code: 'SESSION_EXPIRED', message: '会话已过期，请重新登录' } }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return response;
};

// 创建 API 客户端实例，传递 Token 解析器
export const apiClient = new ApiClient({ TOKEN: OpenAPI.TOKEN });

// 工具函数（已废弃，Token 现通过解析器自动处理）
export const setApiToken = (): void => { /* 无操作 */ };

// 导出生成的类型和服务
export * from './generated';