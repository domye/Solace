/**
 * 目录活动指示器 Hook
 *
 * 处理活动指示器位置计算和滚动同步
 */

import { useEffect, useState, type RefObject } from "react";

interface UseActiveIndicatorOptions {
	activeId: string | null;
	containerRef: RefObject<HTMLDivElement | null>;
}

interface IndicatorStyle {
	top: number;
	height: number;
	opacity: number;
}

export function useActiveIndicator({
	activeId,
	containerRef,
}: UseActiveIndicatorOptions) {
	const [indicatorStyle, setIndicatorStyle] = useState<IndicatorStyle>({
		top: 0,
		height: 0,
		opacity: 0,
	});

	useEffect(() => {
		if (!activeId || !containerRef.current) return;

		requestAnimationFrame(() => {
			if (!containerRef.current) return;

			const activeElement = containerRef.current.querySelector(
				`[data-id="${activeId}"]`,
			) as HTMLElement;
			const navElement = containerRef.current.querySelector(
				"nav",
			) as HTMLElement;

			if (activeElement && navElement) {
				const navRect = navElement.getBoundingClientRect();
				const activeRect = activeElement.getBoundingClientRect();

				setIndicatorStyle({
					top: activeRect.top - navRect.top,
					height: activeRect.height,
					opacity: 1,
				});

				// 滚动 TOC 容器使活动项可见
				const scrollContainer = containerRef.current.querySelector(
					".toc-scroll-container",
				);
				if (scrollContainer) {
					const { offsetTop, offsetHeight } = activeElement;
					const { scrollTop, clientHeight } = scrollContainer;

					if (
						offsetTop < scrollTop ||
						offsetTop + offsetHeight > scrollTop + clientHeight
					) {
						scrollContainer.scrollTo({
							top: offsetTop - clientHeight / 2 + offsetHeight / 2,
							behavior: "smooth",
						});
					}
				}
			} else {
				setIndicatorStyle((prev) => ({ ...prev, opacity: 0 }));
			}
		});
	}, [activeId, containerRef]);

	return indicatorStyle;
}
