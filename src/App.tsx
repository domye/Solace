/**
 * 应用根组件
 *
 * 结构：
 * - QueryClientProvider: React Query 状态管理
 * - BrowserRouter: 路由管理
 * - ThemeInitializer: 主题初始化
 * - UserInitializer: 用户信息初始化
 * - Routes: 路由配置
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MainLayout, AuthLayout, AdminLayout } from '@/layouts';
import {
  HomePage,
  ArticleDetailPage,
  ArchivePage,
  CategoryPage,
  TagPage,
  LoginPage,
  AdminArticlesPage,
  ArticleEditorPage,
  AdminCategoriesPage,
  AdminTagsPage,
} from '@/pages';
import { useAuthStore, useThemeStore } from '@/stores';
import { useCurrentUser, useAutoHideScrollbar } from '@/hooks';
import { useEffect } from 'react';

/** 受保护路由 - 未登录时跳转到登录页 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, accessToken } = useAuthStore();

  if (!isAuthenticated || !accessToken) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

/** 主题初始化组件 - 根据状态切换深色模式 */
function ThemeInitializer() {
  const { theme } = useThemeStore();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return null;
}

/** 用户初始化组件 - 刷新后恢复用户信息 */
function UserInitializer() {
  const { isAuthenticated, setUser } = useAuthStore();
  const { data: user } = useCurrentUser();

  useEffect(() => {
    if (isAuthenticated && user) {
      setUser(user);
    }
  }, [isAuthenticated, user, setUser]);

  return null;
}

/** 滚动条控制器 - 滚动时显示，闲置后隐藏 */
function ScrollbarController() {
  useAutoHideScrollbar(5000); // 5秒后隐藏
  return null;
}

/** React Query 客户端配置 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分钟
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeInitializer />
        <UserInitializer />
        <ScrollbarController />
        <Routes>
          {/* 公开路由 - 主布局 */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/articles/:slug" element={<ArticleDetailPage />} />
            <Route path="/archive" element={<ArchivePage />} />
            <Route path="/categories/:slug" element={<CategoryPage />} />
            <Route path="/tags/:slug" element={<TagPage />} />
          </Route>

          {/* 认证路由 - 登录布局 */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* 管理路由 - 需要登录 */}
          <Route
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/admin" element={<AdminArticlesPage />} />
            <Route path="/admin/articles/new" element={<ArticleEditorPage />} />
            <Route path="/admin/articles/:id/edit" element={<ArticleEditorPage />} />
            <Route path="/admin/categories" element={<AdminCategoriesPage />} />
            <Route path="/admin/tags" element={<AdminTagsPage />} />
          </Route>

          {/* 回退路由 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;