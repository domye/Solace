import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, setApiToken } from '@/api';
import { useAuthStore } from '@/stores';
import type {
  request_CreateArticleRequest,
  request_UpdateArticleRequest,
  request_LoginRequest,
  request_RegisterRequest,
  request_UpdateUserRequest,
} from '@/api';

// Helper to extract data from API response
function extractData<T>(response: { success?: boolean; data?: T; error?: { message?: string } }): T {
  if (!response.success) {
    throw new Error(response.error?.message || 'API request failed');
  }
  return response.data as T;
}

// Article hooks
export function useArticles(params: {
  page?: number;
  pageSize?: number;
  status?: string;
  authorId?: number;
}) {
  const { accessToken, isAuthenticated } = useAuthStore();

  // Set token if authenticated
  if (isAuthenticated && accessToken) {
    setApiToken(accessToken);
  }

  return useQuery({
    queryKey: ['articles', params],
    queryFn: async () => {
      const response = await apiClient.article.getApiV1Articles(
        params.page ?? 1,
        params.pageSize ?? 10,
        params.status,
        params.authorId
      );
      return extractData<{
        items: Array<{
          id: number;
          title: string;
          slug: string;
          content: string;
          summary?: string;
          cover_image?: string;
          author_id: number;
          author?: { id: number; username: string; nickname?: string };
          status: string;
          view_count: number;
          is_top: boolean;
          version: number;
          published_at?: string;
          created_at: string;
          updated_at: string;
        }>;
        page: number;
        pageSize: number;
        total: number;
      }>(response);
    },
  });
}

export function useArticle(id: number) {
  const { accessToken, isAuthenticated } = useAuthStore();

  if (isAuthenticated && accessToken) {
    setApiToken(accessToken);
  }

  return useQuery({
    queryKey: ['article', id],
    queryFn: async () => {
      const response = await apiClient.article.getApiV1Articles1(id);
      return extractData<{
        id: number;
        title: string;
        slug: string;
        content: string;
        summary?: string;
        cover_image?: string;
        author_id: number;
        author?: { id: number; username: string; nickname?: string };
        status: string;
        view_count: number;
        is_top: boolean;
        version: number;
        published_at?: string;
        created_at: string;
        updated_at: string;
      }>(response);
    },
    enabled: id > 0,
  });
}

export function useArticleBySlug(slug: string) {
  const { accessToken, isAuthenticated } = useAuthStore();

  if (isAuthenticated && accessToken) {
    setApiToken(accessToken);
  }

  return useQuery({
    queryKey: ['article', slug],
    queryFn: async () => {
      const response = await apiClient.article.getApiV1ArticlesSlug(slug);
      return extractData<{
        id: number;
        title: string;
        slug: string;
        content: string;
        summary?: string;
        cover_image?: string;
        author_id: number;
        author?: { id: number; username: string; nickname?: string };
        status: string;
        view_count: number;
        is_top: boolean;
        version: number;
        published_at?: string;
        created_at: string;
        updated_at: string;
      }>(response);
    },
    enabled: slug.length > 0,
  });
}

export function useCreateArticle() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();

  if (accessToken) {
    setApiToken(accessToken);
  }

  return useMutation({
    mutationFn: async (data: request_CreateArticleRequest) => {
      const response = await apiClient.article.postApiV1Articles(data);
      return extractData(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });
}

export function useUpdateArticle() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();

  if (accessToken) {
    setApiToken(accessToken);
  }

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: request_UpdateArticleRequest }) => {
      const response = await apiClient.article.putApiV1Articles(id, data);
      return extractData(response);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['article', id] });
    },
  });
}

export function useDeleteArticle() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();

  if (accessToken) {
    setApiToken(accessToken);
  }

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.article.deleteApiV1Articles(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });
}

// Auth hooks
export function useLogin() {
  const { login } = useAuthStore();

  return useMutation({
    mutationFn: async (data: request_LoginRequest) => {
      const response = await apiClient.auth.postApiV1AuthLogin({
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
      setApiToken(response.access_token);
    },
  });
}

export function useRegister() {
  const { login } = useAuthStore();

  return useMutation({
    mutationFn: async (data: request_RegisterRequest) => {
      const response = await apiClient.auth.postApiV1AuthRegister({
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
      setApiToken(response.access_token);
    },
  });
}

export function useLogout() {
  const { logout, refreshToken } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      if (refreshToken) {
        await apiClient.auth.postApiV1AuthLogout({ refresh_token: refreshToken });
      }
    },
    onSuccess: () => {
      logout();
      setApiToken(null);
    },
  });
}

// User hooks
export function useCurrentUser() {
  const { accessToken, isAuthenticated } = useAuthStore();

  if (accessToken) {
    setApiToken(accessToken);
  }

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await apiClient.user.getApiV1UsersMe();
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
  const { accessToken, setUser } = useAuthStore();

  if (accessToken) {
    setApiToken(accessToken);
  }

  return useMutation({
    mutationFn: async (data: request_UpdateUserRequest) => {
      const response = await apiClient.user.putApiV1UsersMe(data);
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