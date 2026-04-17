/**
 * 返回顶部按钮组件
 * 滚动超过一定距离后显示，点击平滑滚动到顶部
 */

import { useState, useEffect, useCallback } from "react";
import { SafeIcon } from "./SafeIcon";

interface BackToTopProps {
	threshold?: number;
}

export function BackToTop({ threshold = 300 }: BackToTopProps) {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			setIsVisible(window.scrollY > threshold);
		};

		handleScroll();
		window.addEventListener("scroll", handleScroll, { passive: true });

		return () => window.removeEventListener("scroll", handleScroll);
	}, [threshold]);

	const scrollToTop = useCallback(() => {
		window.scrollTo({ top: 0, behavior: "smooth" });
	}, []);

	if (!isVisible) return null;

	return (
		<button
			onClick={scrollToTop}
			className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-[var(--card-bg)] border border-[var(--border-medium)] shadow-lg flex items-center justify-center hover:bg-[var(--btn-regular-bg-hover)] hover:border-[var(--primary)] transition-all duration-300 group"
			aria-label="返回顶部"
		>
			<SafeIcon
				icon="material-symbols:keyboard-arrow-up-rounded"
				size="1.5rem"
				className="text-[var(--text-75)] group-hover:text-[var(--primary)] transition-colors"
			/>
		</button>
	);
}
