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
  RegisterPage,
  AdminArticlesPage,
  ArticleEditorPage,
  AdminProfilePage,
} from '@/pages';
import { useAuthStore, useThemeStore } from '@/stores';
import { useEffect } from 'react';

// 受保护路由包装器
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, accessToken } = useAuthStore();

  if (!isAuthenticated || !accessToken) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// 初始化主题
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

// 查询客户端
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
        <Routes>
          {/* 公开路由 */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/articles/:slug" element={<ArticleDetailPage />} />
            <Route path="/archive" element={<ArchivePage />} />
            <Route path="/categories/:slug" element={<CategoryPage />} />
            <Route path="/tags/:slug" element={<TagPage />} />
          </Route>

          {/* 认证路由 */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* 管理后台路由（受保护） */}
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
            <Route path="/admin/profile" element={<AdminProfilePage />} />
          </Route>

          {/* 回退路由 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;