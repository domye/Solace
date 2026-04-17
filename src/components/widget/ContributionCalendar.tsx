/**
 * GitHub 贡献日历组件
 *
 * Mizuki 风格：传统日历布局，单月显示，可左右切换，使用主题色
 */

import { useMemo, useState, useEffect } from "react";
import {
	useGitHubContributions,
	extractGitHubUsername,
} from "@/hooks/api/github";
import type { ContributionsGroup } from "@/hooks/api/github";
import { useOwner } from "@/hooks";

// ============================================================
// 类型定义
// ============================================================

interface ContributionCalendarProps {
	className?: string;
	style?: React.CSSProperties;
}

interface CalendarCell {
	day: number;
	date: string;
	count: number;
	level: number;
	isToday: boolean;
}

interface CalendarBuildResult {
	cells: CalendarCell[];
	monthTotal: number;
	emptyCellsCount: number;
}

// ============================================================
// 常量
// ============================================================

const MONTH_NAMES = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
const WEEK_DAYS = ["日", "一", "二", "三", "四", "五", "六"];
const SKELETON_CELLS = 35; // 5周 * 7天

// ============================================================
// 工具函数
// ============================================================

/** 根据 count 计算 level (0-4)，四分位算法 */
function calculateLevel(count: number, maxCount: number): number {
	if (count === 0 || maxCount === 0) return 0;
	const quartile = maxCount / 4;
	if (count <= quartile) return 1;
	if (count <= quartile * 2) return 2;
	if (count <= quartile * 3) return 3;
	return 4;
}

/** 构建日历格子（单次遍历计算格子数据、月贡献总数、空白格数） */
function buildCalendar(
	year: number,
	month: number,
	maxCount: number,
	yearGroup: ContributionsGroup | undefined,
): CalendarBuildResult {
	const today = new Date();
	const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

	const daysInMonth = new Date(year, month + 1, 0).getDate();
	const emptyCellsCount = new Date(year, month, 1).getDay();
	const monthStr = String(month + 1).padStart(2, "0");

	const cells: CalendarCell[] = [];
	let monthTotal = 0;

	for (let day = 1; day <= daysInMonth; day++) {
		const dayStr = String(day).padStart(2, "0");
		const dateStr = `${year}-${monthStr}-${dayStr}`;
		const count = yearGroup?.contributions?.[`${monthStr}-${dayStr}`] ?? 0;

		monthTotal += count;
		cells.push({
			day,
			date: dateStr,
			count,
			level: calculateLevel(count, maxCount),
			isToday: dateStr === todayStr,
		});
	}

	return { cells, monthTotal, emptyCellsCount };
}

/** 计算所有年份的最大贡献数 */
function computeMaxCount(groups: ContributionsGroup[] | undefined): number {
	if (!groups) return 1;
	const allCounts = groups.flatMap((g) =>
		g.contributions ? Object.values(g.contributions) : [],
	);
	return Math.max(...allCounts, 1);
}

// ============================================================
// 样式常量
// ============================================================

const TITLE_STYLE = "font-bold text-base text-90 relative ml-6 mt-3 mb-1.5 before:w-0.5 before:h-3.5 before:rounded-sm before:bg-[var(--primary)] before:absolute before:-left-3 before:top-[4.5px]";
const WEEK_DAY_STYLE = "text-center text-[9px] text-neutral-400 dark:text-neutral-500 font-medium py-0.5";
const CELL_BASE_STYLE = "aspect-square flex items-center justify-center rounded cursor-pointer relative transition-all duration-200";
const NAV_BTN_STYLE = "p-1 rounded hover:bg-[var(--btn-plain-bg-hover)] text-neutral-600 dark:text-neutral-400 hover:text-[var(--primary)] transition-colors text-lg font-bold";

export function ContributionCalendar({
	className,
	style,
}: ContributionCalendarProps) {
	const { data: owner, isLoading: ownerLoading } = useOwner();
	const githubUsername = useMemo(
		() => extractGitHubUsername(owner?.github_url),
		[owner?.github_url],
	);

	const { data: sparseData, isLoading, error } = useGitHubContributions();

	// 当前年月
	const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
	const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

	// 检测是否为深色模式
	const [isDark, setIsDark] = useState(false);
	const [hue, setHue] = useState("250");

	useEffect(() => {
		const updateTheme = () => {
			setIsDark(document.documentElement.classList.contains("dark"));
			const hueValue = getComputedStyle(document.documentElement)
				.getPropertyValue("--hue")
				.trim();
			setHue(hueValue || "250");
		};

		updateTheme();

		const observer = new MutationObserver(updateTheme);
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["class", "style"],
		});

		return () => observer.disconnect();
	}, []);

	// 预计算 maxCount
	const maxCount = useMemo(
		() => computeMaxCount(sparseData?.groups),
		[sparseData],
	);

	// 获取当前年份对应的分组
	const currentYearGroup = useMemo(() => {
		if (!sparseData?.groups) return undefined;
		return sparseData.groups.find((g) => g.year === currentYear);
	}, [sparseData, currentYear]);

	// 日历构建（一次循环同时返回 cells、monthTotal 和 emptyCellsCount）
	const { cells, monthTotal, emptyCellsCount } = useMemo(
		() => buildCalendar(currentYear, currentMonth, maxCount, currentYearGroup),
		[currentYear, currentMonth, maxCount, currentYearGroup],
	);

	// 当前年份总贡献数（从顶层 total 获取）
	const yearTotal = sparseData?.total ?? 0;

	// 是否显示"返回今天"
	const isBackToTodayVisible = useMemo(() => {
		const today = new Date();
		return (
			currentYear !== today.getFullYear() || currentMonth !== today.getMonth()
		);
	}, [currentYear, currentMonth]);

	// 获取格子颜色
	const getCellBg = useMemo(() => {
		return (cell: CalendarCell): string => {
			if (cell.level > 0) {
				if (isDark) {
					const lightness = 0.35 + cell.level * 0.08;
					const chroma = 0.03 + cell.level * 0.015;
					return `oklch(${lightness} ${chroma} ${hue})`;
				} else {
					const lightness = 0.92 - cell.level * 0.06;
					const chroma = 0.025 + cell.level * 0.01;
					return `oklch(${lightness} ${chroma} ${hue})`;
				}
			}
			return isDark
				? "oklch(0.25 0.008 " + hue + ")"
				: "oklch(0.96 0.008 " + hue + ")";
		};
	}, [isDark, hue]);

	// 切换月份
	const handlePrevMonth = () => {
		setCurrentMonth((prev) => {
			if (prev === 0) {
				setCurrentYear((y) => y - 1);
				return 11;
			}
			return prev - 1;
		});
	};

	const handleNextMonth = () => {
		setCurrentMonth((prev) => {
			if (prev === 11) {
				setCurrentYear((y) => y + 1);
				return 0;
			}
			return prev + 1;
		});
	};

	const handleBackToToday = () => {
		const today = new Date();
		setCurrentYear(today.getFullYear());
		setCurrentMonth(today.getMonth());
	};

	// 骨架屏
	const renderSkeletonCalendar = () => (
		<>
			<div className="flex justify-between items-center mb-1.5 px-3">
				<div className={TITLE_STYLE}>
					<div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
				</div>
				<div className="flex items-center gap-0.5 shrink-0 ml-2">
					{[1, 2, 3].map((i) => (
						<div key={i} className="p-1 rounded">
							<div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
						</div>
					))}
				</div>
			</div>

			<div className="px-3">
				<div className="grid grid-cols-7 gap-0.5 mb-0.5">
					{WEEK_DAYS.map((day) => (
						<div key={day} className={WEEK_DAY_STYLE}>
							{day}
						</div>
					))}
				</div>

				<div className="grid grid-cols-7 gap-0.5">
					{Array.from({ length: SKELETON_CELLS }).map((_, idx) => (
						<div
							key={idx}
							className="aspect-square flex items-center justify-center rounded bg-gray-100 dark:bg-gray-800"
						>
							<div className="w-2.5 h-2.5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
						</div>
					))}
				</div>
			</div>

			<div className="px-3 mt-1.5 flex items-center justify-between">
				<div className="h-2.5 w-14 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
				<div className="h-2.5 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
			</div>
		</>
	);

	if (ownerLoading) {
		return (
			<div className={`card-base pb-3 ${className || ""}`} style={style}>
				{renderSkeletonCalendar()}
			</div>
		);
	}

	if (!githubUsername) {
		return null;
	}

	if (isLoading) {
		return (
			<div className={`card-base pb-3 ${className || ""}`} style={style}>
				{renderSkeletonCalendar()}
			</div>
		);
	}

	if (error || !sparseData) {
		return null;
	}

	return (
		<div
			className={`card-base pb-3 onload-animation ${className || ""}`}
			style={style}
		>
			{/* 标题栏 */}
			<div className="flex justify-between items-center mb-1.5 px-3">
				<div className={TITLE_STYLE}>
					<span className="text-sm font-bold select-none">
						{currentYear}年{MONTH_NAMES[currentMonth]}
					</span>
				</div>

				<div className="flex items-center gap-0.5 shrink-0 ml-2">
					{/* 返回今天 */}
					<button
						type="button"
						onClick={handleBackToToday}
						className={`p-1 rounded hover:bg-[var(--btn-plain-bg-hover)] text-[var(--primary)] transition-all ${isBackToTodayVisible ? "" : "invisible"}`}
						aria-label="返回今天"
					>
						<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
							<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
							<path d="M3 3v5h5" />
						</svg>
					</button>
					{/* 上一月 */}
					<button type="button" onClick={handlePrevMonth} className={NAV_BTN_STYLE} aria-label="上一月">
						＜
					</button>
					{/* 下一月 */}
					<button type="button" onClick={handleNextMonth} className={NAV_BTN_STYLE} aria-label="下一月">
						＞
					</button>
				</div>
			</div>

			{/* 日历网格 */}
			<div className="px-3">
				{/* 星期标签 */}
				<div className="grid grid-cols-7 gap-0.5 mb-0.5">
					{WEEK_DAYS.map((day) => (
						<div key={day} className={WEEK_DAY_STYLE}>
							{day}
						</div>
					))}
				</div>

				{/* 日期格子 */}
				<div className="grid grid-cols-7 gap-0.5">
					{/* 月初空白 */}
					{Array.from({ length: emptyCellsCount }).map((_, idx) => (
						<div key={`empty-${idx}`} className="aspect-square" />
					))}

					{/* 日期 */}
					{cells.map((cell) => (
						<button
							key={cell.date}
							type="button"
							className={`${CELL_BASE_STYLE} ${cell.isToday ? "font-bold ring-1.5 ring-[var(--primary)]/40" : "hover:bg-[var(--btn-plain-bg-hover)]"}`}
							style={{
								backgroundColor: cell.isToday
									? isDark ? "oklch(0.35 0.08 var(--hue))" : "oklch(0.88 0.06 var(--hue))"
									: getCellBg(cell),
							}}
							title={`${cell.date}: ${cell.count} 次贡献`}
						>
							<span
								className={`text-[10px] ${
									cell.isToday
										? "font-bold text-neutral-500 dark:text-neutral-200"
										: cell.count > 0
											? "font-medium text-neutral-700 dark:text-neutral-300"
											: "text-neutral-400 dark:text-neutral-500"
								}`}
							>
								{cell.day}
							</span>
							{/* 有贡献的小圆点 */}
							{cell.count > 0 && !cell.isToday && (
								<span className="absolute bottom-0.5 w-0.5 h-0.5 rounded-full bg-[var(--primary)]/60" />
							)}
						</button>
					))}
				</div>
			</div>

			{/* 底部统计 */}
			<div className="px-3 mt-1.5 flex items-center justify-between text-[9px] text-neutral-400 dark:text-neutral-500">
				<span>
					当月 <span className="font-medium text-[var(--primary)]">{monthTotal}</span> 次
				</span>
				<span>
					过去一年 <span className="font-medium text-[var(--primary)]">{yearTotal}</span> 次
				</span>
			</div>
		</div>
	);
}
