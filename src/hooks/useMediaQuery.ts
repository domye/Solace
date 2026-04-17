import { useState, useEffect } from "react";

/**
 * 媒体查询 hook
 * 用于响应式布局中检测屏幕尺寸
 *
 * @param query - CSS 媒体查询字符串，如 '(min-width: 1024px)'
 * @returns 是否匹配当前屏幕尺寸
 *
 * @example
 * const isLgOrLarger = useMediaQuery('(min-width: 1024px)');
 * if (isLgOrLarger) {
 *   // 渲染侧栏
 * }
 */
export function useMediaQuery(query: string): boolean {
	const [matches, setMatches] = useState(() => {
		if (typeof window !== "undefined") {
			return window.matchMedia(query).matches;
		}
		return false;
	});

	useEffect(() => {
		const mediaQuery = window.matchMedia(query);
		const handler = (e: MediaQueryListEvent) => setMatches(e.matches);

		// 初始化时同步状态
		setMatches(mediaQuery.matches);

		// 监听变化
		mediaQuery.addEventListener("change", handler);
		return () => mediaQuery.removeEventListener("change", handler);
	}, [query]);

	return matches;
}
