import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api';
import { queryKeys } from '@/lib/queryKeys';
import { extractData } from './utils';
import type { Category } from '@/types';
import type { request_CreateCategoryRequest, request_UpdateCategoryRequest } from '@/api';

/**
 * 获取分类列表
 */
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.all(),
    queryFn: async () => {
      const response = await apiClient.category.getCategories();
      return extractData<Category[]>(response);
    },
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * 创建分类
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: request_CreateCategoryRequest) => {
      const response = await apiClient.category.postCategories(data);
      return extractData<Category>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all() });
    },
  });
}

/**
 * 更新分类
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: request_UpdateCategoryRequest }) => {
      const response = await apiClient.category.putCategories(id, data);
      return extractData<Category>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all() });
    },
  });
}

/**
 * 删除分类
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.category.deleteCategories(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all() });
    },
  });
}