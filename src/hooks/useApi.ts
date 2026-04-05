import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api';
import { useAuthStore } from '@/stores';
import type {
  request_CreateArticleRequest,
  request_UpdateArticleRequest,
  request_LoginRequest,
  request_RegisterRequest,
  request_UpdateUserRequest,
} from '@/api';
import type {
  Article,
  ArticleSummary,
  Category,
  Tag,
  ArchiveGroup,
  PagedResponse,
} from '@/types';

// 从 API 响应中提取数据的辅助函数
function extractData<T>(response: { success?: boolean; data?: T; error?: { message?: string } }): T {
  if (!response.success) {
    throw new Error(response.error?.message || 'API请求失败');
  }
  return response.data as T;
}

// ============ 文章相关钩子 ============

export function useArticles(params: {
  page?: number;
  pageSize?: number;
  status?: string;
  authorId?: number;
  category?: string;
  tag?: string;
}) {
  return useQuery({
    queryKey: ['articles', params],
    queryFn: async () => {
      const response = await apiClient.article.getArticles(
        params.page ?? 1,
        params.pageSize ?? 10,
        params.status,
        params.authorId,
        params.category,
        params.tag
      );
      return extractData<PagedResponse<ArticleSummary>>(response);
    },
  });
}

export function useArticle(id: number) {
  return useQuery({
    queryKey: ['article', id],
    queryFn: async () => {
      const response = await apiClient.article.getArticles1(id);
      return extractData<Article>(response);
    },
    enabled: id > 0,
  });
}

export function useArticleBySlug(slug: string) {
  return useQuery({
    queryKey: ['article', slug],
    queryFn: async () => {
      const response = await apiClient.article.getArticlesSlug(slug);
      return extractData<Article>(response);
    },
    enabled: slug.length > 0,
  });
}

export function useArchive() {
  return useQuery({
    queryKey: ['archive'],
    queryFn: async () => {
      const response = await apiClient.article.getArticlesArchive();
      return extractData<ArchiveGroup[]>(response);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useSearch(query: string, page = 1, pageSize = 10) {
  return useQuery({
    queryKey: ['search', query, page, pageSize],
    queryFn: async () => {
      const response = await apiClient.article.getArticlesSearch(query, page, pageSize);
      return extractData<PagedResponse<ArticleSummary>>(response);
    },
    enabled: query.length >= 2,
  });
}

export function useCreateArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: request_CreateArticleRequest) => {
      const response = await apiClient.article.postArticles(data);
      return extractData(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['archive'] });
    },
  });
}

export function useUpdateArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: request_UpdateArticleRequest }) => {
      const response = await apiClient.article.putArticles(id, data);
      return extractData(response);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['article', id] });
      queryClient.invalidateQueries({ queryKey: ['archive'] });
    },
  });
}

export function useDeleteArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.article.deleteArticles(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['archive'] });
    },
  });
}

// ============ 分类相关钩子 ============

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await apiClient.category.getCategories();
      return extractData<Category[]>(response);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useCategoryBySlug(slug: string) {
  return useQuery({
    queryKey: ['category', slug],
    queryFn: async () => {
      const response = await apiClient.category.getCategoriesSlug(slug);
      return extractData<Category>(response);
    },
    enabled: slug.length > 0,
  });
}

// ============ 标签相关钩子 ============

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const response = await apiClient.tag.getTags();
      return extractData<Tag[]>(response);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useTagBySlug(slug: string) {
  return useQuery({
    queryKey: ['tag', slug],
    queryFn: async () => {
      const response = await apiClient.tag.getTagsSlug(slug);
      return extractData<Tag>(response);
    },
    enabled: slug.length > 0,
  });
}

// ============ 认证相关钩子 ============
export function useLogin() {
  const { login } = useAuthStore();

  return useMutation({
    mutationFn: async (data: request_LoginRequest) => {
      const response = await apiClient.auth.postAuthLogin({
        email: data.email,
        password: data.password,
      });
      return extractData<{
        access_token: string;
        refresh_token: string;
        expires_in: number;
        user: { id: number; username: string; email: string; nickname?: string; role: string };
      }>(response);
    },
    onSuccess: (response) => {
      login(response.access_token, response.refresh_token, response.user);
    },
  });
}

export function useRegister() {
  const { login } = useAuthStore();

  return useMutation({
    mutationFn: async (data: request_RegisterRequest) => {
      const response = await apiClient.auth.postAuthRegister({
        username: data.username,
        email: data.email,
        password: data.password,
      });
      return extractData<{
        access_token: string;
        refresh_token: string;
        expires_in: number;
        user: { id: number; username: string; email: string; nickname?: string; role: string };
      }>(response);
    },
    onSuccess: (response) => {
      login(response.access_token, response.refresh_token, response.user);
    },
  });
}

export function useLogout() {
  const { logout, refreshToken } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      if (refreshToken) {
        await apiClient.auth.postAuthLogout({ refresh_token: refreshToken });
      }
    },
    onSuccess: () => {
      logout();
    },
  });
}

// 用户相关钩子
export function useCurrentUser() {
  const { isAuthenticated, accessToken } = useAuthStore();

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await apiClient.user.getUsersMe();
      return extractData<{
        id: number;
        username: string;
        email: string;
        nickname?: string;
        avatar_url?: string;
        bio?: string;
        role: string;
        created_at: string;
      }>(response);
    },
    enabled: isAuthenticated && !!accessToken,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: async (data: request_UpdateUserRequest) => {
      const response = await apiClient.user.putUsersMe(data);
      return extractData<{
        id: number;
        username: string;
        email: string;
        nickname?: string;
        avatar_url?: string;
        bio?: string;
        role: string;
      }>(response);
    },
    onSuccess: (user) => {
      setUser(user as any);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}