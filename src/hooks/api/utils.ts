/**
 * API 响应处理工具函数
 */

import type { PagedResponse } from '@/types';

/** 从 API 响应中提取数据，失败时抛出错误 */
export function extractData<T>(response: {
  success?: boolean;
  data?: T;
  error?: { message?: string };
}): T {
  if (!response.success) {
    throw new Error(response.error?.message || 'API请求失败');
  }
  return response.data as T;
}

/** 从分页 API 响应中提取数据 */
export function extractPagedData<T>(response: {
  success?: boolean;
  data?: {
    data?: T[];
    page?: number;
    pageSize?: number;
    total?: number;
    totalPages?: number;
  };
  error?: { message?: string };
}): PagedResponse<T> {
  if (!response.success) {
    throw new Error(response.error?.message || 'API请求失败');
  }
  const pagedData = response.data;
  return {
    data: pagedData?.data ?? [],
    page: pagedData?.page ?? 1,
    pageSize: pagedData?.pageSize ?? 10,
    total: pagedData?.total ?? 0,
    totalPages: pagedData?.totalPages ?? 0,
  };
}