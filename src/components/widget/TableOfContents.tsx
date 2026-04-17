/**
 * 目录组件
 *
 * - 只展示一级、二级、三级标题
 * - 支持独立滚动，防止页面短但 TOC 长的情况
 * - 样式与 SideBar 卡片组件保持一致
 */

import { useRef, useMemo, memo } from "react";
import { useTocScroll, useActiveIndicator } from "@/hooks";

export interface TocHeading {
	id: string;
	text: string;
	depth: number;
}

interface TableOfContentsProps {
	headings: TocHeading[];
	maxDepth?: number;
}

export const TableOfContents = memo(function TableOfContents({
	headings,
	maxDepth = 3,
}: TableOfContentsProps) {
	const tocRef = useRef<HTMLDivElement>(null);

	// 过滤只显示 depth <= maxDepth 的标题
	const filteredHeadings = useMemo(
		() => headings.filter((h) => h.depth <= maxDepth),
		[headings, maxDepth],
	);

	// 最小层级（用于计算缩进）
	const minDepth =
		filteredHeadings.length > 0
			? Math.min(...filteredHeadings.map((h) => h.depth))
			: 1;

	// 滚动逻辑
	const { activeId, handleClick } = useTocScroll({
		headings: filteredHeadings,
	});

	// 活动指示器位置
	const indicatorStyle = useActiveIndicator({ activeId, containerRef: tocRef });

	if (filteredHeadings.length === 0) return null;

	return (
		<div ref={tocRef} className="card-base pb-4 onload-animation">
			{/* 标题 - 与 Categories 组件样式一致 */}
			<div
				className="font-bold text-lg text-90 relative ml-8 mt-4 mb-2
        before:w-1 before:h-4 before:rounded-md before:bg-[var(--primary)]
        before:absolute before:-left-4 before:top-[5.5px]"
			>
				目录
			</div>

			{/* 可滚动的导航区域 */}
			<nav className="relative flex flex-col px-4">
				{/* 背景线条 */}
				<div className="absolute left-4 top-1 bottom-1 w-[2px] bg-[var(--border-light)] z-0 rounded-full" />

				{/* 活动指示器 */}
				<div
					className="absolute left-4 w-[2px] bg-[var(--primary)] z-10 transition-all duration-300 ease-out rounded-full shadow-[0_0_8px_var(--primary)]"
					style={{
						top: `${indicatorStyle.top}px`,
						height: `${indicatorStyle.height}px`,
						opacity: indicatorStyle.opacity,
					}}
				/>

				{/* 可滚动的标题列表 */}
				<div
					className="toc-scroll-container overflow-y-auto overflow-x-hidden max-h-[calc(100vh-280px)]
            scrollbar-thin scrollbar-thumb-[var(--border-light)] scrollbar-track-transparent
            hover:scrollbar-thumb-[var(--primary)]"
					style={{ scrollbarGutter: "stable" }}
				>
					{filteredHeadings.map((heading) => {
						const isActive = activeId === heading.id;
						const indentLevel = heading.depth - minDepth;

						return (
							<TocItem
								key={heading.id}
								heading={heading}
								isActive={isActive}
								indentLevel={indentLevel}
								minDepth={minDepth}
								onClick={(e) => handleClick(e, heading.id)}
							/>
						);
					})}
				</div>
			</nav>
		</div>
	);
});

/** 目录项组件 */
function TocItem({
	heading,
	isActive,
	indentLevel,
	minDepth,
	onClick,
}: {
	heading: TocHeading;
	isActive: boolean;
	indentLevel: number;
	minDepth: number;
	onClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
	return (
		<a
			data-id={heading.id}
			href={`#${heading.id}`}
			onClick={onClick}
			className={`
        w-full h-9 rounded-lg bg-none transition-all pl-2
        flex items-center group
        ${
					isActive
						? "text-[var(--primary)] pl-3 bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]"
						: "text-75 hover:bg-[var(--btn-plain-bg-hover)] hover:pl-3 hover:text-[var(--primary)]"
				}
      `}
			style={{
				marginLeft: `${indentLevel * 0.5}rem`,
			}}
		>
			<span
				className={`
        overflow-hidden text-left whitespace-nowrap overflow-ellipsis text-sm
        ${isActive ? "font-bold" : "font-medium"}
        ${heading.depth > minDepth ? "text-[0.8rem] opacity-90" : ""}
      `}
			>
				{heading.text}
			</span>
		</a>
	);
}
