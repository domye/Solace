/**
 * 主布局组件
 *
 * 三栏布局结构（参考 Mizuki 主题）：
 * ┌─────────────────────────────────────────────────────────┐
 * │                       Navbar                            │
 * ├─────────────┬─────────────────────┬─────────────────────┤
 * │  LeftSide   │     MainContent     │     RightSide       │
 * │  Profile    │      (Outlet)       │    Categories       │
 * │  TOC        │                     │       Tags          │
 * │ (文章详情页) │                     │                     │
 * ├─────────────┴─────────────────────┴─────────────────────┤
 * │              移动端侧边栏内容（lg以下显示）               │
 * ├─────────────────────────────────────────────────────────┤
 * │                       Footer                            │
 * └─────────────────────────────────────────────────────────┘
 *
 * 响应式：
 * - 移动端：单栏（主内容 + 底部侧边栏内容 + Footer）
 * - 平板：双栏（左侧边栏 + 主内容）
 * - 桂面：三栏（左侧边栏 + 主内容 + 右侧边栏）
 *
 * 性能优化：
 * - ContributionCalendar 懒加载，避免 GitHub API 阻塞首屏
 */

import { Outlet, useLocation } from "react-router-dom";
import { Navbar, Footer } from "@/components/common";
import {
	TableOfContents,
	Profile,
	Categories,
	Tags,
} from "@/components/widget";
import { BackToTop, MobileToc } from "@/components/common/ui";
import { useTocStore } from "@/stores";
import { useMediaQuery } from "@/hooks";
import { useMemo, lazy, Suspense } from "react";

// 懒加载 ContributionCalendar - 避免 GitHub API 阻塞首屏渲染
const ContributionCalendar = lazy(() =>
	import("@/components/widget/ContributionCalendar").then((m) => ({
		default: m.ContributionCalendar,
	})),
);

/** 左侧边栏组件 */
interface LeftSidebarProps {
	isArticlePage: boolean;
	headings: { id: string; text: string; depth: number }[];
}

function LeftSidebar({ isArticlePage, headings }: LeftSidebarProps) {
	const hasToc = isArticlePage && headings.length > 0;

	// 有 TOC 时：Profile 不固定，TOC 和 Tags 固定
	// 没有 TOC 时：Profile 和 Tags 都固定
	if (hasToc) {
		return (
			<aside className="w-64 flex-shrink-0">
				{/* Profile 不固定 */}
				<div className="flex flex-col w-full gap-4 mb-4">
					<Profile />
				</div>

				{/* 吸顶组件区域 */}
				<div className="sticky top-4 flex flex-col w-full gap-4">
					<Tags
						className="onload-animation"
						style={{ animationDelay: "150ms" }}
					/>
					<TableOfContents headings={headings} />
				</div>
			</aside>
		);
	}

	// 没有 TOC：Profile 和 Tags 都固定
	return (
		<aside className="w-64 flex-shrink-0">
			<div className="sticky top-4 flex flex-col w-full gap-4">
				<Profile />
				<Tags
					className="onload-animation"
					style={{ animationDelay: "150ms" }}
				/>
			</div>
		</aside>
	);
}

/** 贡献日历加载占位符 */
function ContributionCalendarFallback() {
	return (
		<div className="card-base pb-3 onload-animation">
			<div className="flex justify-between items-center mb-1.5 px-3">
				<div className="font-bold text-base text-90 relative ml-6 mt-3 mb-1.5 before:w-0.5 before:h-3.5 before:rounded-sm before:bg-[var(--primary)] before:absolute before:-left-3 before:top-[4.5px]">
					<div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
				</div>
			</div>
			<div className="px-3">
				<div className="grid grid-cols-7 gap-0.5">
					{Array.from({ length: 35 }).map((_, i) => (
						<div
							key={i}
							className="aspect-square bg-gray-100 dark:bg-gray-800 rounded animate-pulse"
						/>
					))}
				</div>
			</div>
		</div>
	);
}

/** 右侧边栏组件 - 显示分类 */
function RightSidebar() {
	return (
		<aside className="w-64 flex-shrink-0">
			<div className="sticky top-4 flex flex-col w-full gap-4">
				<Suspense fallback={<ContributionCalendarFallback />}>
					<ContributionCalendar
						className="onload-animation"
						style={{ animationDelay: "100ms" }}
					/>
				</Suspense>
				<Categories
					className="onload-animation"
					style={{ animationDelay: "150ms" }}
				/>
			</div>
		</aside>
	);
}

/** 移动端底部侧边栏内容 */
function MobileBottomSidebar() {
	return (
		<div className="lg:hidden flex flex-col gap-4 mt-4">
			{/* Profile */}
			<Profile />

			{/* 分类 */}
			<Categories className="onload-animation" />

			{/* Tags */}
			<Tags className="onload-animation" />
		</div>
	);
}

export function MainLayout() {
	const { headings } = useTocStore();
	const location = useLocation();

	const isLgOrLarger = useMediaQuery("(min-width: 1024px)");
	const isXlOrLarger = useMediaQuery("(min-width: 1280px)");

	// 判断是否为文章详情页
	const isArticlePage = useMemo(() => {
		return /^\/articles\//.test(location.pathname);
	}, [location.pathname]);

	return (
		<div className="min-h-screen flex flex-col">
			{/* 顶部导航栏 */}
			<Navbar />

			{/* 主内容区域 - 三栏布局 */}
			<div className="flex-1 max-w-[var(--page-width)] mx-auto w-full px-4 pt-4 pb-0">
				<div className="flex gap-4">
					{/* 左侧边栏 - Profile + TOC（lg 以上显示） */}
					{isLgOrLarger && (
						<LeftSidebar isArticlePage={isArticlePage} headings={headings} />
					)}

					{/* 主内容区 */}
					<main className="min-w-0 flex-1 flex flex-col gap-4">
						<Outlet />
					</main>

					{/* 右侧边栏 - 分类 + 标签（xl 以上显示） */}
					{isXlOrLarger && <RightSidebar />}
				</div>

				{/* 移动端底部侧边栏 - 在主内容下方、Footer 上方显示 */}
				<MobileBottomSidebar />
			</div>

			{/* 底部页脚 */}
			<Footer />

			{/* 返回顶部按钮 */}
			<BackToTop />
			<MobileToc />
		</div>
	);
}
