/**
 * API 响应处理工具函数
 *
 * 提供统一的 API 响应数据提取方法，处理成功/失败状态
 */

import type { PagedResponse } from "@/types";

/** 从 API 响应中提取数据，失败时抛出错误 */
export function extractData<T>(response: {
	success?: boolean;
	data?: T;
	error?: { message?: string };
}): T {
	if (!response.success) {
		throw new Error(response.error?.message || "API请求失败");
	}
	return response.data as T;
}

/**
 * 从分页 API 响应中提取数据
 *
 * API 分页响应格式：
 * {
 *   success: boolean,
 *   data: T[],        // 数据数组（直接在 data 字段）
 *   page: number,
 *   pageSize: number,
 *   total: number,
 *   totalPages: number
 * }
 */
export function extractPagedData<T>(response: {
	success?: boolean;
	data?: T[];
	page?: number;
	pageSize?: number;
	total?: number;
	totalPages?: number;
	error?: { message?: string };
}): PagedResponse<T> {
	if (!response.success) {
		throw new Error(response.error?.message || "API请求失败");
	}
	return {
		data: response.data ?? [],
		page: response.page ?? 1,
		pageSize: response.pageSize ?? 10,
		total: response.total ?? 0,
		totalPages: response.totalPages ?? 0,
	};
}
