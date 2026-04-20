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
import { HelmetProvider } from "react-helmet-async";
import { useEffect } from "react";
import { useAuthStore, useThemeStore } from "@/stores";
import { useAutoHideScrollbar } from "@/hooks";
import { routes, layouts, LazyRoute } from "@/router";
import { ToastContainer, showToast } from "@/components";

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

/** API 错误监听器 - 处理限流等错误 */
function ApiErrorListener() {
	useEffect(() => {
		const handleRateLimited = (e: CustomEvent<{ message: string }>) => {
			showToast(e.detail.message, "error");
		};

		window.addEventListener("api:rate-limited", handleRateLimited as EventListener);
		return () => {
			window.removeEventListener("api:rate-limited", handleRateLimited as EventListener);
		};
	}, []);
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
		<HelmetProvider>
			<QueryClientProvider client={queryClient}>
				<BrowserRouter>
					<ThemeInitializer />
					<ScrollbarController />
					<ApiErrorListener />
					<ToastContainer />
					<SplashScreen />
					<Routes>
					{/* 公开路由 - 主布局 */}
					<Route element={<layouts.main />}>
						{routes.public.map((route) => (
							<Route
								key={route.path}
								path={route.path}
								element={<LazyRoute Component={route.Component} fallback={route.fallback} />}
							/>
						))}
						{/* 404 页面 - 也在主布局内 */}
						<Route
							path="*"
							element={<LazyRoute Component={routes.notFound.Component} fallback={routes.notFound.fallback} />}
						/>
					</Route>

					{/* 认证路由 - 登录布局 */}
					<Route element={<layouts.auth />}>
						{routes.auth.map((route) => (
							<Route
								key={route.path}
								path={route.path}
								element={<LazyRoute Component={route.Component} fallback={route.fallback} />}
							/>
						))}
					</Route>

					{/* 管理路由 - 需要登录 */}
					<Route
						element={
							<ProtectedRoute>
								<layouts.admin />
							</ProtectedRoute>
						}
					>
						{routes.admin.map((route) => (
							<Route
								key={route.path}
								path={route.path}
								element={<LazyRoute Component={route.Component} fallback={route.fallback} />}
							/>
						))}
					</Route>
				</Routes>
			</BrowserRouter>
		</QueryClientProvider>
		</HelmetProvider>
	);
}

export default App;
