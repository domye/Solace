/**
 * 贡献日历组件
 *
 * Mizuki 风格：传统日历布局，单月显示，可左右切换，使用主题色
 * 支持两种模式：GitHub 贡献日历 和 文章发布日历
 */

import { useMemo, useState, useEffect, useCallback, memo } from "react";
import {
	useGitHubContributions,
	extractGitHubUsername,
} from "@/hooks/api/github";
import { useArticleContributions } from "@/hooks/api/articles";
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

type CalendarMode = "github" | "articles";

// ============================================================
// 常量
// ============================================================

const MONTH_NAMES = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
const WEEK_DAYS = ["日", "一", "二", "三", "四", "五", "六"];
const SKELETON_CELLS = 35;

// ============================================================
// 工具函数（提取到组件外部，避免重复创建）
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

/** 构建日历格子 */
function buildCalendar(
	year: number,
	month: number,
	maxCount: number,
	yearGroup: ContributionsGroup | undefined,
): { cells: CalendarCell[]; monthTotal: number; emptyCellsCount: number } {
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

/** 获取格子背景色 */
function getCellBgColor(level: number, isDark: boolean, hue: string): string {
	if (level > 0) {
		if (isDark) {
			return `oklch(${0.35 + level * 0.08} ${0.03 + level * 0.015} ${hue})`;
		}
		return `oklch(${0.92 - level * 0.06} ${0.025 + level * 0.01} ${hue})`;
	}
	return isDark ? `oklch(0.25 0.008 ${hue})` : `oklch(0.96 0.008 ${hue})`;
}

/** 获取空白格子背景色 */
function getEmptyBgColor(isDark: boolean, hue: string): string {
	return isDark ? `oklch(0.25 0.008 ${hue})` : `oklch(0.96 0.008 ${hue})`;
}

// ============================================================
// 子组件（memo 优化）
// ============================================================

interface CalendarCellButtonProps {
	cell: CalendarCell;
	isDark: boolean;
	hue: string;
	mode: CalendarMode;
}

const CalendarCellButton = memo(function CalendarCellButton({
	cell,
	isDark,
	hue,
	mode,
}: CalendarCellButtonProps) {
	const bgColor = cell.isToday
		? getEmptyBgColor(isDark, hue)
		: getCellBgColor(cell.level, isDark, hue);

	return (
		<button
			type="button"
			className={`aspect-square flex items-center justify-center rounded cursor-pointer relative transition-all duration-200 ${cell.isToday ? "ring-1 ring-[var(--primary)]/50" : "hover:bg-[var(--btn-plain-bg-hover)]"}`}
			style={{ backgroundColor: bgColor }}
			title={mode === "github" ? `${cell.date}: ${cell.count} 次贡献` : `${cell.date}: ${cell.count} 篇文章`}
		>
			<span
				className={`text-[8px] lg:text-[10px] ${
					cell.isToday
						? "text-neutral-600 dark:text-neutral-300"
						: cell.count > 0
							? "font-medium text-neutral-700 dark:text-neutral-300"
							: "text-neutral-400 dark:text-neutral-500"
				}`}
			>
				{cell.day}
			</span>
			{cell.count > 0 && (
				<span className="absolute bottom-0.5 w-0.5 h-0.5 rounded-full bg-[var(--primary)]/60" />
			)}
		</button>
	);
});

interface ModeSwitcherProps {
	mode: CalendarMode;
	onModeChange: (mode: CalendarMode) => void;
}

const ModeSwitcher = memo(function ModeSwitcher({ mode, onModeChange }: ModeSwitcherProps) {
	return (
		<div className="flex items-center gap-1 bg-neutral-100/80 dark:bg-neutral-800/60 p-0.5 rounded-md">
			<button
				type="button"
				onClick={() => onModeChange("github")}
				className={`px-2 py-0.5 text-[8px] lg:text-[9px] rounded transition-all duration-200 ${mode === "github" ? "bg-white dark:bg-neutral-700 text-slate-600 dark:text-slate-300 shadow-sm" : "text-neutral-500 dark:text-neutral-400 hover:text-[var(--primary)]"}`}
			>
				GitHub
			</button>
			<button
				type="button"
				onClick={() => onModeChange("articles")}
				className={`px-2 py-0.5 text-[8px] lg:text-[9px] rounded transition-all duration-200 ${mode === "articles" ? "bg-white dark:bg-neutral-700 text-slate-600 dark:text-slate-300 shadow-sm" : "text-neutral-500 dark:text-neutral-400 hover:text-[var(--primary)]"}`}
			>
				文章
			</button>
		</div>
	);
});

// ============================================================
// 主组件
// ============================================================

export function ContributionCalendar({
	className,
	style,
}: ContributionCalendarProps) {
	const { data: owner, isLoading: ownerLoading } = useOwner();
	const githubUsername = useMemo(
		() => extractGitHubUsername(owner?.github_url),
		[owner?.github_url],
	);

	const [mode, setMode] = useState<CalendarMode>("github");

	const { data: githubData, isLoading: githubLoading, error: githubError } = useGitHubContributions();
	const { data: articleData, isLoading: articleLoading, error: articleError } = useArticleContributions();

	const sparseData = mode === "github" ? githubData : articleData;
	const isLoading = mode === "github" ? githubLoading : articleLoading;
	const error = mode === "github" ? githubError : articleError;

	const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
	const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

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

	const maxCount = useMemo(
		() => computeMaxCount(sparseData?.groups),
		[sparseData],
	);

	const currentYearGroup = useMemo(() => {
		if (!sparseData?.groups) return undefined;
		return sparseData.groups.find((g) => g.year === currentYear);
	}, [sparseData, currentYear]);

	const { cells, monthTotal, emptyCellsCount } = useMemo(
		() => buildCalendar(currentYear, currentMonth, maxCount, currentYearGroup),
		[currentYear, currentMonth, maxCount, currentYearGroup],
	);

	const isBackToTodayVisible = useMemo(() => {
		const today = new Date();
		return (
			currentYear !== today.getFullYear() || currentMonth !== today.getMonth()
		);
	}, [currentYear, currentMonth]);

	const handlePrevMonth = useCallback(() => {
		setCurrentMonth((prev) => {
			if (prev === 0) {
				setCurrentYear((y) => y - 1);
				return 11;
			}
			return prev - 1;
		});
	}, []);

	const handleNextMonth = useCallback(() => {
		setCurrentMonth((prev) => {
			if (prev === 11) {
				setCurrentYear((y) => y + 1);
				return 0;
			}
			return prev + 1;
		});
	}, []);

	const handleBackToToday = useCallback(() => {
		const today = new Date();
		setCurrentYear(today.getFullYear());
		setCurrentMonth(today.getMonth());
	}, []);

	const handleModeChange = useCallback((newMode: CalendarMode) => {
		setMode(newMode);
	}, []);

	if (ownerLoading) {
		return (
			<div className={`card-base pb-3 ${className || ""}`} style={style}>
				<SkeletonCalendar />
			</div>
		);
	}

	if (mode === "github" && !githubUsername) {
		return null;
	}

	if (isLoading) {
		return (
			<div className={`card-base pb-3 ${className || ""}`} style={style}>
				<SkeletonCalendar />
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
			<div className="flex justify-between items-center mb-1 lg:mb-1.5 px-2.5 lg:px-3">
				<div className="font-bold text-sm lg:text-base text-90 relative ml-5 lg:ml-6 mt-2.5 lg:mt-3 mb-1 lg:mb-1.5 before:w-0.5 before:h-3 lg:before:h-3.5 before:rounded-sm before:bg-[var(--primary)] before:absolute before:-left-2.5 lg:before:-left-3 before:top-[3.5px] lg:before:top-[4.5px]">
					<span className="text-xs lg:text-sm font-bold select-none">
						{currentYear}年{MONTH_NAMES[currentMonth]}
					</span>
				</div>

				<div className="flex items-center gap-0.5 shrink-0 ml-2">
					<button
						type="button"
						onClick={handleBackToToday}
						className={`p-0.5 lg:p-1 rounded hover:bg-[var(--btn-plain-bg-hover)] text-[var(--primary)] transition-all ${isBackToTodayVisible ? "" : "invisible"}`}
						aria-label="返回今天"
					>
						<svg className="w-3.5 lg:w-4 h-3.5 lg:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
							<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
							<path d="M3 3v5h5" />
						</svg>
					</button>
					<button type="button" onClick={handlePrevMonth} className="p-0.5 lg:p-1 rounded hover:bg-[var(--btn-plain-bg-hover)] text-neutral-600 dark:text-neutral-400 hover:text-[var(--primary)] transition-colors text-base lg:text-lg font-bold" aria-label="上一月">
						＜
					</button>
					<button type="button" onClick={handleNextMonth} className="p-0.5 lg:p-1 rounded hover:bg-[var(--btn-plain-bg-hover)] text-neutral-600 dark:text-neutral-400 hover:text-[var(--primary)] transition-colors text-base lg:text-lg font-bold" aria-label="下一月">
						＞
					</button>
				</div>
			</div>

			{/* 日历网格 */}
			<div className="px-2.5 lg:px-3">
				<div className="grid grid-cols-7 gap-0.5 mb-0.5">
					{WEEK_DAYS.map((day) => (
						<div key={day} className="text-center text-[8px] lg:text-[9px] text-neutral-400 dark:text-neutral-500 font-medium py-0.5">
							{day}
						</div>
					))}
				</div>

				<div className="grid grid-cols-7 gap-0.5">
					{Array.from({ length: emptyCellsCount }).map((_, idx) => (
						<div key={`empty-${idx}`} className="aspect-square" />
					))}
					{cells.map((cell) => (
						<CalendarCellButton
							key={cell.date}
							cell={cell}
							isDark={isDark}
							hue={hue}
							mode={mode}
						/>
					))}
				</div>
			</div>

			{/* 底部统计 */}
			<div className="px-2.5 lg:px-3 mt-1 lg:mt-1.5 flex items-center justify-between text-[8px] lg:text-[9px] text-neutral-400 dark:text-neutral-500">
				<span>
					当月 <span className="font-medium text-[var(--primary)]">{monthTotal}</span> {mode === "github" ? "次" : "篇"}
				</span>
				<ModeSwitcher mode={mode} onModeChange={handleModeChange} />
			</div>
		</div>
	);
}

// ============================================================
// 骨架屏组件
// ============================================================

function SkeletonCalendar() {
	return (
		<>
			<div className="flex justify-between items-center mb-1 lg:mb-1.5 px-2.5 lg:px-3">
				<div className="font-bold text-sm lg:text-base text-90 relative ml-5 lg:ml-6 mt-2.5 lg:mt-3 mb-1 lg:mb-1.5 before:w-0.5 before:h-3 lg:before:h-3.5 before:rounded-sm before:bg-[var(--primary)] before:absolute before:-left-2.5 lg:before:-left-3 before:top-[3.5px] lg:before:top-[4.5px]">
					<div className="h-3.5 lg:h-4 w-14 lg:w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
				</div>
				<div className="flex items-center gap-0.5 shrink-0 ml-2">
					{[1, 2, 3].map((i) => (
						<div key={i} className="p-0.5 lg:p-1 rounded">
							<div className="w-3.5 lg:w-4 h-3.5 lg:h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
						</div>
					))}
				</div>
			</div>

			<div className="px-2.5 lg:px-3">
				<div className="grid grid-cols-7 gap-0.5 mb-0.5">
					{WEEK_DAYS.map((day) => (
						<div key={day} className="text-center text-[8px] lg:text-[9px] text-neutral-400 dark:text-neutral-500 font-medium py-0.5">
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
							<div className="w-2 lg:w-2.5 h-2 lg:h-2.5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
						</div>
					))}
				</div>
			</div>

			<div className="px-2.5 lg:px-3 mt-1 lg:mt-1.5 flex items-center justify-between">
				<div className="h-2 lg:h-2.5 w-12 lg:w-14 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
				<div className="h-2 lg:h-2.5 w-14 lg:w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
			</div>
		</>
	);
}
