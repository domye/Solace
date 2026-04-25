/**
 * 页面相关 API Hooks
 *
 * 提供页面的查询、创建、更新、删除等操作
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api";
import { queryKeys } from "@/lib/queryKeys";
import { extractData, extractPagedData } from "./utils";
import type { Page, PageListItem, NavPage } from "@/types";
import type {
	request_CreatePageRequest,
	request_UpdatePageRequest,
} from "@/api";

/** 获取页面列表（管理用） */
export function usePages(params?: {
	page?: number;
	pageSize?: number;
	status?: string;
	template?: string;
}) {
	return useQuery({
		queryKey: queryKeys.pages.list(params),
		queryFn: async () => {
			const response = await apiClient.page.getPages(
				params?.page ?? 1,
				params?.pageSize ?? 10,
				params?.status,
				params?.template,
			);
			return extractPagedData<PageListItem>(response);
		},
		staleTime: 2 * 60 * 1000,
	});
}

/** 获取单个页面（按 ID） - 管理用 */
export function usePage(id: number) {
	return useQuery({
		queryKey: queryKeys.pages.detail(id),
		queryFn: async () => {
			const response = await apiClient.page.getPages1(id);
			return extractData<Page>(response);
		},
		enabled: id > 0,
		staleTime: 5 * 60 * 1000,
	});
}

/** 获取单个页面（按 slug） - 公开访问 */
export function usePageBySlug(slug: string) {
	return useQuery({
		queryKey: queryKeys.pages.bySlug(slug),
		queryFn: async () => {
			const response = await apiClient.page.getPagesSlug(slug);
			return extractData<Page>(response);
		},
		enabled: slug.length > 0,
		staleTime: 10 * 60 * 1000,
	});
}

/** 获取导航页面列表 */
export function useNavPages() {
	return useQuery({
		queryKey: queryKeys.pages.nav(),
		queryFn: async () => {
			const response = await apiClient.page.getPagesNav();
			return extractData<NavPage[]>(response);
		},
		staleTime: 10 * 60 * 1000,
	});
}

/** 创建页面 */
export function useCreatePage() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: request_CreatePageRequest) => {
			const response = await apiClient.page.postPages(data);
			return extractData<Page>(response);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.pages.list() });
			queryClient.invalidateQueries({ queryKey: queryKeys.pages.nav() });
		},
	});
}

/** 更新页面 */
export function useUpdatePage() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			id,
			data,
		}: {
			id: number;
			data: request_UpdatePageRequest;
		}) => {
			const response = await apiClient.page.putPages(id, data);
			return extractData<Page>(response);
		},
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: queryKeys.pages.list() });
			queryClient.invalidateQueries({ queryKey: queryKeys.pages.detail(id) });
			queryClient.invalidateQueries({ queryKey: queryKeys.pages.nav() });
		},
	});
}

/** 删除页面 */
export function useDeletePage() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: number) => {
			await apiClient.page.deletePages(id);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.pages.list() });
			queryClient.invalidateQueries({ queryKey: queryKeys.pages.nav() });
		},
	});
}