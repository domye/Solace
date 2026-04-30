import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api";
import { queryKeys } from "@/lib/queryKeys";
import { extractData } from "./utils";
import type { Tag } from "@/types";
import type { request_CreateTagRequest, request_UpdateTagRequest } from "@/api";

/**
 * 获取标签列表
 */
export function useTags() {
	return useQuery({
		queryKey: queryKeys.tags.all(),
		queryFn: async () => {
			const response = await apiClient.tag.getTags();
			return extractData<Tag[]>(response);
		},
		staleTime: 10 * 60 * 1000,
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
			queryClient.invalidateQueries({ queryKey: queryKeys.tags.all() });
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
			queryClient.invalidateQueries({ queryKey: queryKeys.tags.all() });
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
			queryClient.invalidateQueries({ queryKey: queryKeys.tags.all() });
		},
	});
}
