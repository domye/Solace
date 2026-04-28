/**
 * 文章相关 API Hooks
 *
 * 提供文章的查询、创建、更新、删除等操作
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api";
import { queryKeys } from "@/lib/queryKeys";
import { extractData, extractPagedData } from "./utils";
import type { Article, ArticleSummary, ArchiveGroup } from "@/types";
import type {
	request_CreateArticleRequest,
	request_UpdateArticleRequest,
} from "@/api";

/** 获取文章列表（分页） */
export function useArticles(params: {
	page?: number;
	pageSize?: number;
	status?: string;
	category?: string;
	tag?: string;
}) {
	return useQuery({
		queryKey: queryKeys.articles.list(params),
		queryFn: async () => {
			const response = await apiClient.article.getArticles(
				params.page ?? 1,
				params.pageSize ?? 10,
				params.status,
				params.category,
				params.tag,
			);
			return extractPagedData<ArticleSummary>(response);
		},
		staleTime: 2 * 60 * 1000,
	});
}

/** 获取单篇文章（按 ID） */
export function useArticle(id: number) {
	return useQuery({
		queryKey: queryKeys.articles.detail(id),
		queryFn: async () => {
			const response = await apiClient.article.getArticles1(id);
			return extractData<Article>(response);
		},
		enabled: id > 0,
		staleTime: 5 * 60 * 1000,
	});
}

/** 获取单篇文章（按 slug） */
export function useArticleBySlug(slug: string) {
	return useQuery({
		queryKey: queryKeys.articles.bySlug(slug),
		queryFn: async () => {
			const response = await apiClient.article.getArticlesSlug(slug);
			return extractData<Article>(response);
		},
		enabled: slug.length > 0,
		staleTime: 5 * 60 * 1000,
	});
}

/** 获取归档列表 */
export function useArchive() {
	return useQuery({
		queryKey: queryKeys.articles.archive(),
		queryFn: async () => {
			const response = await apiClient.article.getArticlesArchive();
			return extractData<ArchiveGroup[]>(response);
		},
		staleTime: 10 * 60 * 1000,
	});
}

/** 搜索文章 */
export function useSearch(query: string, page = 1, pageSize = 10) {
	return useQuery({
		queryKey: queryKeys.articles.search(query, page, pageSize),
		queryFn: async () => {
			const response = await apiClient.article.getArticlesSearch(
				query,
				page,
				pageSize,
			);
			return extractPagedData<ArticleSummary>(response);
		},
		enabled: query.length >= 2,
	});
}

/** 创建文章 */
export function useCreateArticle() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: request_CreateArticleRequest) => {
			const response = await apiClient.article.postArticles(data);
			return extractData(response);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.articles.list() });
			queryClient.invalidateQueries({ queryKey: queryKeys.articles.archive() });
		},
	});
}

/** 更新文章 */
export function useUpdateArticle() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			id,
			data,
		}: {
			id: number;
			data: request_UpdateArticleRequest;
		}) => {
			const response = await apiClient.article.putArticles(id, data);
			return extractData(response);
		},
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: queryKeys.articles.list() });
			queryClient.invalidateQueries({ queryKey: queryKeys.articles.detail(id) });
			queryClient.invalidateQueries({ queryKey: queryKeys.articles.archive() });
		},
	});
}

/** 删除文章 */
export function useDeleteArticle() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: number) => {
			await apiClient.article.deleteArticles(id);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.articles.list() });
			queryClient.invalidateQueries({ queryKey: queryKeys.articles.archive() });
		},
	});
}

/** 获取随机文章 */
export function useRandomArticles(limit = 5) {
	return useQuery({
		queryKey: queryKeys.articles.random(limit),
		queryFn: async () => {
			const response = await apiClient.article.getArticlesRandom(limit);
			return extractData<ArticleSummary[]>(response);
		},
		staleTime: 5 * 60 * 1000,
	});
}

/** 获取最近文章 */
export function useRecentArticles(limit = 5) {
	return useQuery({
		queryKey: queryKeys.articles.recent(limit),
		queryFn: async () => {
			const response = await apiClient.article.getArticlesRecent(limit);
			return extractData<ArticleSummary[]>(response);
		},
		staleTime: 5 * 60 * 1000,
	});
}

/** 获取文章贡献日历 */
export function useArticleContributions() {
	return useQuery({
		queryKey: queryKeys.articles.contributions(),
		queryFn: async () => {
			const response = await fetch("/api/v1/articles/contributions");
			if (!response.ok) {
				throw new Error("获取文章贡献数据失败");
			}
			const result = await response.json();
			return result.data as {
				total: number;
				groups: Array<{
					year: number;
					contributions: Record<string, number>;
				}>;
			};
		},
		staleTime: 10 * 60 * 1000,
	});
}
