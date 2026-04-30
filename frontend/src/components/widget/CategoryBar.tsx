/**
 * 分类导航栏组件（参考 Mizuki 主题）
 *
 * 在文章列表顶部显示分类快捷导航：
 * [首页] [归档(n)] | [分类1(n)] [分类2(n)] ...
 *
 * 特性：
 * - 横向滚动支持
 * - 鼠标滚轮横向滚动
 * - 高亮当前分类
 * - 滚动渐变提示
 * - 显示文章计数
 */
import { Link, useLocation } from "react-router-dom";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useCategories, useArchive } from "@/hooks";
import { SafeIcon } from "@/components/common/ui";

// ============ 类型定义 ============

interface CategoryBarProps {
	className?: string;
}

// ============ 常量 ============

/** 按钮基础样式 */
const PILL_BASE_CLASS =
	"category-pill text-xs lg:text-sm px-2 lg:px-3 py-0.5 lg:py-1 rounded-lg whitespace-nowrap flex-shrink-0 transition-colors duration-200 flex items-center justify-center border-[1.5px]";

/** 活动状态样式 */
const PILL_ACTIVE_CLASS =
	"bg-[var(--primary)] border-[var(--primary)] text-white";

/** 非活动状态样式 */
const PILL_INACTIVE_CLASS =
	"border-[var(--line-divider)] text-[var(--btn-content)] hover:border-[var(--primary)] hover:text-[var(--primary)]";

// ============ 子组件 ============

/** 滚动渐变遮罩 */
function FadeMask({ side }: { side: "left" | "right" }) {
	const gradientClass =
		side === "left"
			? "bg-gradient-to-r from-[var(--card-bg)] to-transparent"
			: "bg-gradient-to-l from-[var(--card-bg)] to-transparent";

	return (
		<div
			className={`absolute ${side}-0 top-0 bottom-0 w-10 z-10 pointer-events-none ${gradientClass}`}
		/>
	);
}

/** 骨架屏项 */
function SkeletonItem() {
	return (
		<div className="h-6 lg:h-7 w-14 lg:w-16 bg-[var(--btn-regular-bg)] rounded-lg animate-pulse flex-shrink-0" />
	);
}

/** 分类按钮 */
function CategoryPill({
	category,
	isActive,
	onClick,
}: {
	category: { id: number; name: string; slug?: string; article_count?: number };
	isActive: boolean;
	onClick: () => void;
}) {
	return (
		<Link
			to={`/categories/${category.slug || category.name}`}
			onClick={onClick}
			className={`${PILL_BASE_CLASS} ${isActive ? PILL_ACTIVE_CLASS : PILL_INACTIVE_CLASS}`}
			data-active={isActive || undefined}
		>
			{category.name}
			{(category.article_count ?? 0) > 0 && (
				<span className="text-[10px] lg:text-xs opacity-60 ml-0.5 lg:ml-1">
					{category.article_count}
				</span>
			)}
		</Link>
	);
}

/** 导航按钮（首页/归档） */
function NavPill({
	to,
	label,
	isActive,
	onClick,
	icon,
	count,
	className,
	ariaLabel,
}: {
	to: string;
	label: string;
	isActive: boolean;
	onClick: () => void;
	icon?: string;
	count?: number;
	className?: string;
	ariaLabel?: string;
}) {
	return (
		<Link
			to={to}
			onClick={onClick}
			className={`${className || PILL_BASE_CLASS} ${isActive ? PILL_ACTIVE_CLASS : PILL_INACTIVE_CLASS}`}
			data-active={isActive || undefined}
			aria-label={ariaLabel}
		>
			{icon ? <SafeIcon icon={icon} size="1rem" className="lg:!size-[1.125rem]" /> : label}
			{!icon && count !== undefined && count > 0 && (
				<span className="text-[10px] lg:text-xs opacity-60 ml-0.5 lg:ml-1">{count}</span>
			)}
		</Link>
	);
}

// ============ 主组件 ============

export function CategoryBar({ className }: CategoryBarProps) {
	const { data: categories, isLoading } = useCategories();
	const { data: archiveData } = useArchive();
	const location = useLocation();

	const scrollRef = useRef<HTMLDivElement>(null);
	const [showFadeLeft, setShowFadeLeft] = useState(false);
	const [showFadeRight, setShowFadeRight] = useState(false);

	// 计算总文章数
	const totalPosts = useMemo(
		() => archiveData?.reduce((sum, group) => sum + group.count, 0) ?? 0,
		[archiveData],
	);

	// 一次性解析路径状态（合并 shouldShow 判断避免重复）
	const routeState = useMemo(() => {
		const pathname = location.pathname;
		const isHome = pathname === "/" || /^\/\d+$/.test(pathname);
		const isArchive = pathname === "/archive";
		const categoryMatch = pathname.match(/^\/categories\/(.+)$/);
		const activeCategory = categoryMatch?.[1] ?? "";
		const shouldShow =
			isHome ||
			isArchive ||
			pathname.startsWith("/categories/") ||
			pathname.startsWith("/tags/");

		return { isHome, isArchive, activeCategory, shouldShow };
	}, [location.pathname]);

	const { isHome, isArchive, activeCategory, shouldShow } = routeState;

	// 点击后滚动到顶部
	const scrollToTop = useCallback(
		() => window.scrollTo({ top: 0, behavior: "smooth" }),
		[],
	);

	// 更新滚动渐变提示
	const updateScrollHint = useCallback(() => {
		const scroll = scrollRef.current;
		if (!scroll) return;

		const { scrollWidth, clientWidth, scrollLeft } = scroll;
		const hasOverflow = scrollWidth > clientWidth;

		setShowFadeLeft(hasOverflow && scrollLeft > 0);
		setShowFadeRight(hasOverflow && scrollLeft + clientWidth < scrollWidth);
	}, []);

	// 滚动到当前高亮分类 + 更新渐变提示
	useEffect(() => {
		if (!shouldShow) return;

		const scroll = scrollRef.current;
		if (!scroll) return;

		const activePill = scroll.querySelector(
			"[data-active]",
		) as HTMLElement | null;
		if (activePill) {
			const centerOffset = (scroll.clientWidth - activePill.offsetWidth) / 2;
			scroll.scrollTo({
				left: Math.max(0, activePill.offsetLeft - centerOffset),
				behavior: "smooth",
			});
		}

		updateScrollHint();
	}, [activeCategory, isHome, categories, shouldShow, updateScrollHint]);

	// 监听滚动和窗口大小变化
	useEffect(() => {
		if (!shouldShow) return;

		const scroll = scrollRef.current;
		if (!scroll) return;

		const onScroll = () => updateScrollHint();
		scroll.addEventListener("scroll", onScroll);
		window.addEventListener("resize", updateScrollHint);

		return () => {
			scroll.removeEventListener("scroll", onScroll);
			window.removeEventListener("resize", updateScrollHint);
		};
	}, [shouldShow, updateScrollHint]);

	// 鼠标滚轮横向滚动
	const handleWheel = useCallback((e: React.WheelEvent) => {
		const scroll = scrollRef.current;
		if (!scroll || scroll.scrollWidth <= scroll.clientWidth) return;

		e.preventDefault();
		scroll.scrollLeft += e.deltaY;
	}, []);

	// 不显示时返回 null
	if (!shouldShow) return null;

	return (
		<div
			className={`card-base p-2 lg:p-3 onload-animation${className ? ` ${className}` : ""}`}
		>
			<div className="flex gap-1.5 lg:gap-2">
				{/* 首页按钮 */}
				<NavPill
					to="/"
					label=""
					isActive={isHome}
					onClick={scrollToTop}
					icon="material-symbols:home"
					className={PILL_BASE_CLASS.replace("px-2 lg:px-3", "px-1.5 lg:px-2")}
					ariaLabel="首页"
				/>

				{/* 归档按钮 */}
				<NavPill
					to="/archive"
					label="归档"
					isActive={isArchive && !activeCategory}
					onClick={scrollToTop}
					count={totalPosts}
				/>

				{/* 分隔线 */}
				<div className="w-[1px] flex-shrink-0 bg-[var(--line-divider)]" />

				{/* 分类滚动区域 */}
				<div className="flex-1 min-w-0 relative">
					{showFadeLeft && <FadeMask side="left" />}
					{showFadeRight && <FadeMask side="right" />}

					{/* 分类列表 */}
					<div
						ref={scrollRef}
						onWheel={handleWheel}
						className="flex gap-1.5 lg:gap-2 overflow-x-auto scrollbar-hide scroll-smooth"
						style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
					>
						{isLoading
							? Array.from({ length: 5 }).map((_, i) => (
									<SkeletonItem key={i} />
								))
							: categories?.map((category) => (
									<CategoryPill
										key={category.id}
										category={category}
										isActive={
											activeCategory === category.slug ||
											activeCategory === category.name
										}
										onClick={scrollToTop}
									/>
								))}
					</div>
				</div>
			</div>

			{/* 隐藏滚动条样式 */}
			<style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
		</div>
	);
}
