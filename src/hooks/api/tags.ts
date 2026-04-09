import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api";
import { extractData } from "./utils";
import type { Tag } from "@/types";
import type { request_CreateTagRequest, request_UpdateTagRequest } from "@/api";

/**
 * 获取标签列表
 */
export function useTags() {
	return useQuery({
		queryKey: ["tags"],
		queryFn: async () => {
			const response = await apiClient.tag.getTags();
			return extractData<Tag[]>(response);
		},
		staleTime: 10 * 60 * 1000,
	});
}

/**
 * 获取单个标签（按 slug）
 */
export function useTagBySlug(slug: string) {
	return useQuery({
		queryKey: ["tag", slug],
		queryFn: async () => {
			const response = await apiClient.tag.getTagsSlug(slug);
			return extractData<Tag>(response);
		},
		enabled: slug.length > 0,
	});
}

/**
 * 创建标签
 */
export function useCreateTag() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: request_CreateTagRequest) => {
			const response = await apiClient.tag.postTags(data);
			return extractData<Tag>(response);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["tags"] });
		},
	});
}

/**
 * 更新标签
 */
export function useUpdateTag() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			id,
			data,
		}: {
			id: number;
			data: request_UpdateTagRequest;
		}) => {
			const response = await apiClient.tag.putTags(id, data);
			return extractData<Tag>(response);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["tags"] });
		},
	});
}

/**
 * 删除标签
 */
export function useDeleteTag() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: number) => {
			await apiClient.tag.deleteTags(id);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["tags"] });
		},
	});
}
