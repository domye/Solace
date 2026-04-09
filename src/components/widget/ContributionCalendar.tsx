/**
 * GitHub 贡献日历组件
 *
 * Mizuki 风格：传统日历布局，单月显示，可左右切换，使用主题色
 */

import { useMemo, useState, useEffect } from 'react';
import { useGitHubContributions, extractGitHubUsername } from '@/hooks';
import { useOwner } from '@/hooks';

interface ContributionCalendarProps {
  className?: string;
  style?: React.CSSProperties;
}

// 日历格子数据
interface CalendarCell {
  day: number;
  date: string;
  count: number;
  level: number;
  isToday: boolean;
  isEmpty: boolean;
}

// 中文月份
const MONTH_NAMES = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

// 星期标签
const WEEK_DAYS = ['日', '一', '二', '三', '四', '五', '六'];

// 获取月份的天数
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// 获取月份第一天是星期几
function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

// 构建日历格子
function buildCalendarCells(
  year: number,
  month: number,
  contributionsMap: Map<string, { count: number; level: number }>
): CalendarCell[] {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const daysInMonth = getDaysInMonth(year, month);
  const cells: CalendarCell[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const contribution = contributionsMap.get(dateStr);

    cells.push({
      day,
      date: dateStr,
      count: contribution?.count ?? 0,
      level: contribution?.level ?? 0,
      isToday: dateStr === todayStr,
      isEmpty: false,
    });
  }

  return cells;
}

// 计算总贡献数
function getTotalContributions(contributions: { date: string; count: number; level: number }[]): number {
  return contributions.reduce((sum, day) => sum + day.count, 0);
}

// 获取月份贡献数
function getMonthContributions(
  year: number,
  month: number,
  contributionsMap: Map<string, { count: number; level: number }>
): number {
  const daysInMonth = getDaysInMonth(year, month);
  let total = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const contribution = contributionsMap.get(dateStr);
    if (contribution) {
      total += contribution.count;
    }
  }

  return total;
}

export function ContributionCalendar({ className, style }: ContributionCalendarProps) {
  const { data: owner, isLoading: ownerLoading } = useOwner();
  const githubUsername = useMemo(
    () => extractGitHubUsername(owner?.github_url),
    [owner?.github_url]
  );

  const { data: contributions, isLoading, error } = useGitHubContributions();

  // 当前年月
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

  // 检测是否为深色模式
  const [isDark, setIsDark] = useState(false);
  // 监听 hue 变化
  const [hue, setHue] = useState('250');

  useEffect(() => {
    const updateTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
      const hueValue = getComputedStyle(document.documentElement).getPropertyValue('--hue').trim();
      setHue(hueValue || '250');
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style'],
    });

    return () => observer.disconnect();
  }, []);

  // 构建贡献数据 Map（快速查找）
  const contributionsMap = useMemo(() => {
    const map = new Map<string, { count: number; level: number }>();
    if (contributions) {
      contributions.forEach((day) => {
        map.set(day.date, { count: day.count, level: day.level });
      });
    }
    return map;
  }, [contributions]);

  // 日历格子
  const cells = useMemo(() => {
    return buildCalendarCells(currentYear, currentMonth, contributionsMap);
  }, [currentYear, currentMonth, contributionsMap]);

  // 月初空白格数
  const emptyCellsCount = useMemo(() => {
    return getFirstDayOfMonth(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  // 总贡献数
  const totalContributions = useMemo(() => {
    if (!contributions) return 0;
    return getTotalContributions(contributions);
  }, [contributions]);

  // 当月贡献数
  const monthContributions = useMemo(() => {
    return getMonthContributions(currentYear, currentMonth, contributionsMap);
  }, [currentYear, currentMonth, contributionsMap]);

  // 是否显示"返回今天"
  const isBackToTodayVisible = useMemo(() => {
    const today = new Date();
    return currentYear !== today.getFullYear() || currentMonth !== today.getMonth();
  }, [currentYear, currentMonth]);

  // 获取格子颜色（使用 useMemo 缓存，依赖 isDark 和 hue）
  const getCellBg = useMemo(() => {
    return (cell: CalendarCell): string => {
      if (cell.count > 0) {
        // 有贡献的格子，根据 level 显示不同深度的主题色
        if (isDark) {
          // 深色模式：level 越高越亮
          const lightness = 0.35 + cell.level * 0.08;
          const chroma = 0.03 + cell.level * 0.015;
          return `oklch(${lightness} ${chroma} ${hue})`;
        } else {
          // 浅色模式：level 越高越深，但保持淡雅
          const lightness = 0.92 - cell.level * 0.06;
          const chroma = 0.025 + cell.level * 0.01;
          return `oklch(${lightness} ${chroma} ${hue})`;
        }
      }

      // 无贡献的格子
      return isDark ? 'oklch(0.25 0.008 ' + hue + ')' : 'oklch(0.96 0.008 ' + hue + ')';
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

  // Owner 加载中
  if (ownerLoading) {
    return (
      <div className={`card-base pb-4 ${className || ''}`} style={style}>
        <div className="font-bold text-base text-90 relative ml-8 mt-4 mb-2 before:w-1 before:h-4 before:rounded-md before:bg-[var(--primary)] before:absolute before:-left-4 before:top-[5.5px]">
          贡献
        </div>
        <div className="px-4 py-2">
          <div className="h-[15rem] bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!githubUsername || !import.meta.env.VITE_GITHUB_TOKEN) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={`card-base pb-4 ${className || ''}`} style={style}>
        <div className="font-bold text-base text-90 relative ml-8 mt-4 mb-2 before:w-1 before:h-4 before:rounded-md before:bg-[var(--primary)] before:absolute before:-left-4 before:top-[5.5px]">
          贡献
        </div>
        <div className="px-4 py-2">
          <div className="h-[15rem] bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !contributions || contributions.length === 0) {
    return null;
  }

  return (
    <div className={`card-base pb-4 onload-animation ${className || ''}`} style={style}>
      {/* 标题栏 */}
      <div className="flex justify-between items-center mb-2 mt-2 px-4">
        <div className="font-bold text-base text-90 relative ml-4 flex items-center before:w-1 before:h-4 before:rounded-md before:bg-[var(--primary)] before:absolute before:-left-4 before:top-[5.5px]">
          <span className="text-base font-bold select-none">
            {currentYear}年{MONTH_NAMES[currentMonth]}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-2">
          {/* 返回今天 */}
          <button
            type="button"
            onClick={handleBackToToday}
            className={`p-1.5 rounded-md hover:bg-[var(--btn-plain-bg-hover)] text-[var(--primary)] transition-all ${isBackToTodayVisible ? '' : 'invisible'}`}
            aria-label="返回今天"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
          {/* 上一月 */}
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-md hover:bg-[var(--btn-plain-bg-hover)] text-neutral-600 dark:text-neutral-400 hover:text-[var(--primary)] transition-colors text-xl font-bold"
            aria-label="上一月"
          >
            ＜
          </button>
          {/* 下一月 */}
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-md hover:bg-[var(--btn-plain-bg-hover)] text-neutral-600 dark:text-neutral-400 hover:text-[var(--primary)] transition-colors text-xl font-bold"
            aria-label="下一月"
          >
            ＞
          </button>
        </div>
      </div>

      {/* 日历网格 */}
      <div className="px-4">
        {/* 星期标签 */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEK_DAYS.map((day) => (
            <div key={day} className="text-center text-[10px] text-neutral-400 dark:text-neutral-500 font-medium py-0.5">
              {day}
            </div>
          ))}
        </div>

        {/* 日期格子 */}
        <div className="grid grid-cols-7 gap-1">
          {/* 月初空白 */}
          {Array.from({ length: emptyCellsCount }).map((_, idx) => (
            <div key={`empty-${idx}`} className="aspect-square" />
          ))}

          {/* 日期 */}
          {cells.map((cell) => (
            <button
              key={cell.date}
              type="button"
              className={`aspect-square flex items-center justify-center rounded-md cursor-pointer relative transition-all duration-200
                ${cell.isToday
                  ? 'text-[var(--primary)] font-medium bg-[var(--primary)]/5 border border-[var(--primary)]/30'
                  : 'hover:bg-[var(--btn-plain-bg-hover)] border border-transparent'
                }`}
              style={{ backgroundColor: cell.isToday ? undefined : getCellBg(cell) }}
              title={`${cell.date}: ${cell.count} 次贡献`}
            >
              <span className={`text-[11px] ${cell.count > 0 ? 'font-medium text-neutral-700 dark:text-neutral-300' : 'text-neutral-400 dark:text-neutral-500'}`}>
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
      <div className="px-4 mt-2 flex items-center justify-between text-[10px] text-neutral-400 dark:text-neutral-500">
        <span>
          当月 <span className="font-medium text-[var(--primary)]">{monthContributions}</span> 次
        </span>
        <span>
          过去一年 <span className="font-medium text-[var(--primary)]">{totalContributions}</span> 次
        </span>
      </div>
    </div>
  );
}
