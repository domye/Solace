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
import { useEffect, useRef, useState, useMemo } from "react";
import { useCategories, useArchive } from "@/hooks";
import { SafeIcon } from "@/components/common/ui";

interface CategoryBarProps {
	className?: string;
}

export function CategoryBar({ className }: CategoryBarProps) {
	const { data: categories, isLoading } = useCategories();
	const { data: archiveData } = useArchive();
	const location = useLocation();
	const scrollRef = useRef<HTMLDivElement>(null);
	const [showFadeLeft, setShowFadeLeft] = useState(false);
	const [showFadeRight, setShowFadeRight] = useState(false);

	// 计算总文章数
	const totalPosts = useMemo(() => {
		if (!archiveData) return 0;
		return archiveData.reduce((sum, group) => sum + group.count, 0);
	}, [archiveData]);

	// 计算当前路径状态
	const { isHome, isArchive, activeCategory, shouldShow } = useMemo(() => {
		const pathname = location.pathname;
		const isHome = pathname === "/" || /^\/\d+$/.test(pathname);
		const isArchive = pathname === "/archive";

		// 从路径获取分类 /categories/{slug}
		const categoryMatch = pathname.match(/^\/categories\/(.+)$/);
		const isCategoryPage = !!categoryMatch;
		const activeCategory = categoryMatch ? categoryMatch[1] : "";

		// 在首页、归档页、分类页和标签页显示
		const isTagPage = /^\/tags\//.test(pathname);
		const shouldShow = isHome || isArchive || isCategoryPage || isTagPage;

		return { isHome, isArchive, activeCategory, shouldShow };
	}, [location.pathname]);

	// 更新滚动渐变提示
	const updateScrollHint = () => {
		const scroll = scrollRef.current;
		if (!scroll) return;

		const hasOverflow = scroll.scrollWidth > scroll.clientWidth + 1;
		const atStart = scroll.scrollLeft <= 1;
		const atEnd =
			scroll.scrollLeft + scroll.clientWidth >= scroll.scrollWidth - 1;

		setShowFadeLeft(hasOverflow && !atStart);
		setShowFadeRight(hasOverflow && !atEnd);
	};

	// 滚动到当前高亮的分类
	useEffect(() => {
		if (!shouldShow) return;

		const scroll = scrollRef.current;
		if (!scroll) return;

		const activePill = scroll.querySelector("[data-active]") as HTMLElement;
		if (activePill) {
			const scrollLeft =
				activePill.offsetLeft -
				scroll.offsetLeft -
				(scroll.clientWidth - activePill.offsetWidth) / 2;
			scroll.scrollTo({
				left: Math.max(0, scrollLeft),
				behavior: "smooth",
			});
		}

		updateScrollHint();
	}, [activeCategory, isHome, isArchive, categories, shouldShow]);

	// 监听滚动和窗口大小变化
	useEffect(() => {
		if (!shouldShow) return;

		const scroll = scrollRef.current;
		if (!scroll) return;

		scroll.addEventListener("scroll", updateScrollHint);
		window.addEventListener("resize", updateScrollHint);

		return () => {
			scroll.removeEventListener("scroll", updateScrollHint);
			window.removeEventListener("resize", updateScrollHint);
		};
	}, [shouldShow]);

	// 鼠标滚轮横向滚动
	const handleWheel = (e: React.WheelEvent) => {
		const scroll = scrollRef.current;
		if (!scroll || scroll.scrollWidth <= scroll.clientWidth) return;

		e.preventDefault();
		scroll.scrollLeft += e.deltaY;
	};

	// 不显示时返回 null
	if (!shouldShow) return null;

	return (
		<div className={`card-base p-3 onload-animation${className || ""}`}>
			<div className="flex gap-2">
				{/* 首页按钮 */}
				<Link
					to="/"
					onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
					className={`category-pill text-sm px-2 py-1 rounded-lg flex-shrink-0
            transition-colors duration-200 flex items-center justify-center
            border-[1.5px] ${
							isHome
								? "bg-[var(--primary)] border-[var(--primary)] text-white"
								: "border-[var(--line-divider)] text-[var(--btn-content)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
						}`}
					data-active={isHome || undefined}
				>
					<SafeIcon icon="material-symbols:home" size="1.125rem" />
				</Link>

				{/* 归档按钮 - Mizuki 风格带计数 */}
				<Link
					to="/archive"
					onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
					className={`category-pill text-sm px-3 py-1 rounded-lg whitespace-nowrap flex-shrink-0
            transition-colors duration-200 flex items-center justify-center
            border-[1.5px] ${
							isArchive && !activeCategory
								? "bg-[var(--primary)] border-[var(--primary)] text-white"
								: "border-[var(--line-divider)] text-[var(--btn-content)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
						}`}
					data-active={(isArchive && !activeCategory) || undefined}
				>
					归档
					{totalPosts > 0 && (
						<span className="text-xs opacity-60 ml-1">{totalPosts}</span>
					)}
				</Link>

				{/* 分隔线 */}
				<div className="w-[1px] flex-shrink-0 bg-[var(--line-divider)]" />

				{/* 分类滚动区域 */}
				<div className="flex-1 min-w-0 relative">
					{/* 左侧渐变 */}
					{showFadeLeft && (
						<div
							className="absolute left-0 top-0 bottom-0 w-10 z-10 pointer-events-none
              bg-gradient-to-r from-[var(--card-bg)] to-transparent"
						/>
					)}

					{/* 分类列表 - Mizuki 风格带计数 */}
					<div
						ref={scrollRef}
						onWheel={handleWheel}
						className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth"
						style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
					>
						{isLoading
							? // 骨架屏
								[...Array(5)].map((_, i) => (
									<div
										key={i}
										className="h-7 w-16 bg-[var(--btn-regular-bg)] rounded-lg animate-pulse flex-shrink-0"
									/>
								))
							: categories?.map((category) => (
									<Link
										key={category.id}
										to={`/categories/${category.slug || category.name}`}
										onClick={() =>
											window.scrollTo({ top: 0, behavior: "smooth" })
										}
										className={`category-pill text-sm px-3 py-1 rounded-lg whitespace-nowrap flex-shrink-0
                    transition-colors duration-200 flex items-center justify-center
                    border-[1.5px] ${
											activeCategory === category.slug ||
											activeCategory === category.name
												? "bg-[var(--primary)] border-[var(--primary)] text-white"
												: "border-[var(--line-divider)] text-[var(--btn-content)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
										}`}
										data-active={
											activeCategory === category.slug ||
											activeCategory === category.name ||
											undefined
										}
									>
										{category.name}
										{category.article_count !== undefined &&
											category.article_count > 0 && (
												<span className="text-xs opacity-60 ml-1">
													{category.article_count}
												</span>
											)}
									</Link>
								))}
					</div>

					{/* 右侧渐变 */}
					{showFadeRight && (
						<div
							className="absolute right-0 top-0 bottom-0 w-10 z-10 pointer-events-none
              bg-gradient-to-l from-[var(--card-bg)] to-transparent"
						/>
					)}
				</div>
			</div>

			{/* 隐藏滚动条样式 */}
			<style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
		</div>
	);
}
