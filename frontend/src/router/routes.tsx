/**
 * 路由配置
 * 统一管理所有路由定义
 */
import { lazy } from "react";
import { PostCardSkeletonList } from "@/components";
import { MainLayout, AuthLayout, AdminLayout } from "@/layouts";

// ============ 懒加载页面 ============
// 使用 .then() 提取命名导出
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
const PageDetailPage = lazy(() =>
	import("@/pages/PageDetailPage").then((m) => ({ default: m.PageDetailPage })),
);
const NotFoundPage = lazy(() =>
	import("@/pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })),
);

// 认证页面
const LoginPage = lazy(() =>
	import("@/pages/auth/LoginPage").then((m) => ({ default: m.LoginPage })),
);

// 管理页面
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
const ImageSettingsPage = lazy(() =>
	import("@/pages/admin/ImageSettingsPage").then((m) => ({
		default: m.ImageSettingsPage,
	})),
);

// ============ Fallback 组件 ============
const skeletons = {
	list: <PostCardSkeletonList count={10} />,
	single: <PostCardSkeletonList count={1} />,
	few: <PostCardSkeletonList count={5} />,
	center: (
		<div className="flex items-center justify-center min-h-screen">
			加载中...
		</div>
	),
};

// ============ 路由配置 ============
export const routes = {
	// 公开路由
	public: [
		{ path: "/", Component: HomePage, fallback: skeletons.list },
		{
			path: "/articles/:slug",
			Component: ArticleDetailPage,
			fallback: skeletons.single,
		},
		{ path: "/archive", Component: ArchivePage, fallback: skeletons.few },
		{
			path: "/categories/:slug",
			Component: CategoryPage,
			fallback: skeletons.list,
		},
		{ path: "/tags/:slug", Component: TagPage, fallback: skeletons.list },
		{
			path: "/pages/:slug",
			Component: PageDetailPage,
			fallback: skeletons.single,
		},
	],

	// 认证路由
	auth: [{ path: "/login", Component: LoginPage, fallback: skeletons.center }],

	// 管理路由
	admin: [
		{ path: "/admin", Component: AdminArticlesPage, fallback: skeletons.list },
		{
			path: "/admin/articles/new",
			Component: ArticleEditorPage,
			fallback: skeletons.center,
		},
		{
			path: "/admin/articles/:id/edit",
			Component: ArticleEditorPage,
			fallback: skeletons.center,
		},
		{
			path: "/admin/categories",
			Component: AdminCategoriesPage,
			fallback: skeletons.few,
		},
		{ path: "/admin/tags", Component: AdminTagsPage, fallback: skeletons.few },
		{
			path: "/admin/pages",
			Component: AdminPagesPage,
			fallback: skeletons.few,
		},
		{
			path: "/admin/pages/new",
			Component: PageEditorPage,
			fallback: skeletons.center,
		},
		{
			path: "/admin/pages/:id/edit",
			Component: PageEditorPage,
			fallback: skeletons.center,
		},
		{
			path: "/admin/settings/images",
			Component: ImageSettingsPage,
			fallback: skeletons.center,
		},
	],

	// 404 页面
	notFound: { Component: NotFoundPage, fallback: skeletons.center },
} as const;

// ============ 布局组件 ============
export const layouts = {
	main: MainLayout,
	auth: AuthLayout,
	admin: AdminLayout,
} as const;
