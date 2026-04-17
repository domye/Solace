/**
 * 阅读进度条组件
 * 显示在页面顶部，仅在文章详情页显示
 * 进度计算：文章顶部进入视口时 0%，文章底部离开视口时 100%
 */

import { useState, useEffect, RefObject } from "react";

interface ReadingProgressProps {
	show?: boolean;
	articleRef?: RefObject<HTMLElement | null>;
}

export function ReadingProgress({
	show = true,
	articleRef,
}: ReadingProgressProps) {
	const [progress, setProgress] = useState(0);
	const [hasScrolled, setHasScrolled] = useState(false);

	useEffect(() => {
		if (!show) return;

		let ticking = false;

		const updateProgress = () => {
			// 第一次滚动时才标记为已滚动
			if (!hasScrolled && window.scrollY > 0) {
				setHasScrolled(true);
			}

			if (articleRef?.current) {
				const article = articleRef.current;
				const rect = article.getBoundingClientRect();
				const viewportHeight = window.innerHeight;
				const scrollTop = window.scrollY;

				const articleTop = rect.top + scrollTop;
				const articleHeight = article.offsetHeight;
				const articleBottom = articleTop + articleHeight;

				const scrollableDistance = articleHeight;
				const viewportBottom = scrollTop + viewportHeight;

				let newProgress = 0;
				if (viewportBottom <= articleTop) {
					newProgress = 0;
				} else if (scrollTop >= articleBottom) {
					newProgress = 100;
				} else {
					const scrolled = viewportBottom - articleTop;
					newProgress = Math.min(
						100,
						Math.max(0, (scrolled / scrollableDistance) * 100),
					);
				}

				setProgress(newProgress);
			} else {
				const scrollTop = window.scrollY;
				const docHeight =
					document.documentElement.scrollHeight - window.innerHeight;
				const newProgress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
				setProgress(Math.min(100, Math.max(0, newProgress)));
			}

			ticking = false;
		};

		const onScroll = () => {
			if (!ticking) {
				requestAnimationFrame(updateProgress);
				ticking = true;
			}
		};

		window.addEventListener("scroll", onScroll, { passive: true });
		window.addEventListener("resize", updateProgress, { passive: true });

		return () => {
			window.removeEventListener("scroll", onScroll);
			window.removeEventListener("resize", updateProgress);
		};
	}, [show, articleRef, hasScrolled]);

	if (!show || progress >= 100) return null;

	return (
		<div className="fixed top-0 left-0 right-0 h-1 z-[100]">
			<div
				className="h-full bg-gradient-to-r from-[var(--primary)] via-[var(--sky-blue)] to-[var(--primary)] will-change-transform origin-left transition-transform duration-150 ease-out"
				style={{
					transform: `scaleX(${hasScrolled ? progress / 100 : 0})`,
				}}
			/>
		</div>
	);
}
