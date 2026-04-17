/**
 * 应用根组件
 *
 * 结构：
 * - QueryClientProvider: React Query 状态管理
 * - BrowserRouter: 路由管理
 * - ThemeInitializer: 主题初始化
 * - Routes: 路由配置
 *
 * 性能优化：
 * - 路由级懒加载，减少首屏 JS 体积
 * - React Query 缓存优化
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense, useEffect } from "react";
import { useAuthStore, useThemeStore } from "@/stores";
import { useAutoHideScrollbar } from "@/hooks";
import { MainLayout, AuthLayout, AdminLayout } from "@/layouts";
import { PostCardSkeletonList } from "@/components";

// 路由懒加载 - 按页面分割代码
// 使用 .then() 提取命名导出，避免修改每个页面文件
const HomePage = lazy(() =>
	import("@/pages/HomePage").then((m) => ({ default: m.HomePage })),
);
const ArticleDetailPage = lazy(() =>
	import("@/pages/ArticleDetailPage").then((m) => ({
		default: m.ArticleDetailPage,
	})),
);
const ArchivePage = lazy(() =>
	import("@/pages/ArchivePage").then((m) => ({ default: m.ArchivePage })),
);
const CategoryPage = lazy(() =>
	import("@/pages/CategoryPage").then((m) => ({ default: m.CategoryPage })),
);
const TagPage = lazy(() =>
	import("@/pages/TagPage").then((m) => ({ default: m.TagPage })),
);
const LoginPage = lazy(() =>
	import("@/pages/auth/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const AdminArticlesPage = lazy(() =>
	import("@/pages/admin/AdminArticlesPage").then((m) => ({
		default: m.AdminArticlesPage,
	})),
);
const ArticleEditorPage = lazy(() =>
	import("@/pages/admin/ArticleEditorPage").then((m) => ({
		default: m.ArticleEditorPage,
	})),
);
const AdminCategoriesPage = lazy(() =>
	import("@/pages/admin/AdminCategoriesPage").then((m) => ({
		default: m.AdminCategoriesPage,
	})),
);
const AdminTagsPage = lazy(() =>
	import("@/pages/admin/AdminTagsPage").then((m) => ({
		default: m.AdminTagsPage,
	})),
);
const AdminPagesPage = lazy(() =>
	import("@/pages/admin/AdminPagesPage").then((m) => ({
		default: m.AdminPagesPage,
	})),
);
const PageEditorPage = lazy(() =>
	import("@/pages/admin/PageEditorPage").then((m) => ({
		default: m.PageEditorPage,
	})),
);
const PageDetailPage = lazy(() =>
	import("@/pages/PageDetailPage").then((m) => ({ default: m.PageDetailPage })),
);

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
		if (theme === "dark") {
			document.documentElement.classList.add("dark");
		} else {
			document.documentElement.classList.remove("dark");
		}
	}, [theme]);

	return null;
}

/** 开屏加载动画 - 仅首次加载显示，淡出后移除 */
function SplashScreen() {
	useEffect(() => {
		// 检查是否已显示过开屏动画
		if (sessionStorage.getItem("splashShown")) {
			const splash = document.getElementById("splash");
			if (splash) {
				splash.classList.add("hidden");
			}
			return;
		}

		// 标记已显示
		sessionStorage.setItem("splashShown", "true");

		// 等待应用加载完成后淡出
		const timer = setTimeout(() => {
			const splash = document.getElementById("splash");
			if (splash) {
				splash.classList.add("fade-out");
				// 淡出动画完成后移除 DOM
				setTimeout(() => {
					splash.classList.add("hidden");
				}, 500);
			}
		}, 800); // 最少显示 800ms

		return () => clearTimeout(timer);
	}, []);

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
			staleTime: 5 * 60 * 1000, // 5分钟内数据视为新鲜
			gcTime: 30 * 60 * 1000, // 缓存保留30分钟
			retry: 1,
			refetchOnWindowFocus: false, // 窗口聚焦不自动刷新
		},
	},
});

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<BrowserRouter>
				<ThemeInitializer />
				<ScrollbarController />
				<SplashScreen />
				<Routes>
					{/* 公开路由 - 主布局 */}
					<Route element={<MainLayout />}>
						<Route
							path="/"
							element={
								<Suspense fallback={<PostCardSkeletonList count={10} />}>
									<HomePage />
								</Suspense>
							}
						/>
						<Route
							path="/articles/:slug"
							element={
								<Suspense fallback={<PostCardSkeletonList count={1} />}>
									<ArticleDetailPage />
								</Suspense>
							}
						/>
						<Route
							path="/archive"
							element={
								<Suspense fallback={<PostCardSkeletonList count={5} />}>
									<ArchivePage />
								</Suspense>
							}
						/>
						<Route
							path="/categories/:slug"
							element={
								<Suspense fallback={<PostCardSkeletonList count={10} />}>
									<CategoryPage />
								</Suspense>
							}
						/>
						<Route
							path="/tags/:slug"
							element={
								<Suspense fallback={<PostCardSkeletonList count={10} />}>
									<TagPage />
								</Suspense>
							}
						/>
						<Route
							path="/pages/:slug"
							element={
								<Suspense fallback={<PostCardSkeletonList count={1} />}>
									<PageDetailPage />
								</Suspense>
							}
						/>
					</Route>

					{/* 认证路由 - 登录布局 */}
					<Route element={<AuthLayout />}>
						<Route
							path="/login"
							element={
								<Suspense
									fallback={
										<div className="flex items-center justify-center min-h-screen">
											加载中...
										</div>
									}
								>
									<LoginPage />
								</Suspense>
							}
						/>
					</Route>

					{/* 管理路由 - 需要登录 */}
					<Route
						element={
							<ProtectedRoute>
								<AdminLayout />
							</ProtectedRoute>
						}
					>
						<Route
							path="/admin"
							element={
								<Suspense fallback={<PostCardSkeletonList count={10} />}>
									<AdminArticlesPage />
								</Suspense>
							}
						/>
						<Route
							path="/admin/articles/new"
							element={
								<Suspense
									fallback={
										<div className="flex items-center justify-center min-h-screen">
											加载中...
										</div>
									}
								>
									<ArticleEditorPage />
								</Suspense>
							}
						/>
						<Route
							path="/admin/articles/:id/edit"
							element={
								<Suspense
									fallback={
										<div className="flex items-center justify-center min-h-screen">
											加载中...
										</div>
									}
								>
									<ArticleEditorPage />
								</Suspense>
							}
						/>
						<Route
							path="/admin/categories"
							element={
								<Suspense fallback={<PostCardSkeletonList count={5} />}>
									<AdminCategoriesPage />
								</Suspense>
							}
						/>
						<Route
							path="/admin/tags"
							element={
								<Suspense fallback={<PostCardSkeletonList count={5} />}>
									<AdminTagsPage />
								</Suspense>
							}
						/>
						<Route
							path="/admin/pages"
							element={
								<Suspense fallback={<PostCardSkeletonList count={5} />}>
									<AdminPagesPage />
								</Suspense>
							}
						/>
						<Route
							path="/admin/pages/new"
							element={
								<Suspense
									fallback={
										<div className="flex items-center justify-center min-h-screen">
											加载中...
										</div>
									}
								>
									<PageEditorPage />
								</Suspense>
							}
						/>
						<Route
							path="/admin/pages/:id/edit"
							element={
								<Suspense
									fallback={
										<div className="flex items-center justify-center min-h-screen">
											加载中...
										</div>
									}
								>
									<PageEditorPage />
								</Suspense>
							}
						/>
					</Route>

					{/* 回退路由 */}
					<Route path="*" element={<Navigate to="/" replace />} />
				</Routes>
			</BrowserRouter>
		</QueryClientProvider>
	);
}

export default App;
