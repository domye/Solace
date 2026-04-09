import { useEffect, useState } from "react";

/**
 * 自动隐藏滚动条 Hook
 *
 * 滚动时显示滚动条，闲置指定时间后自动隐藏
 * 同时保持滚动条空间，防止页面左右偏移
 *
 * @param hideDelay - 隐藏延迟时间（毫秒），默认 5000ms
 */
export function useAutoHideScrollbar(hideDelay: number = 5000) {
	const [isScrolling, setIsScrolling] = useState(false);

	useEffect(() => {
		let timeoutId: ReturnType<typeof setTimeout>;

		const handleScroll = () => {
			// 显示滚动条
			setIsScrolling(true);
			document.documentElement.classList.add("scrolling");

			// 清除之前的定时器
			if (timeoutId) {
				clearTimeout(timeoutId);
			}

			// 设置新的隐藏定时器
			timeoutId = setTimeout(() => {
				setIsScrolling(false);
				document.documentElement.classList.remove("scrolling");
			}, hideDelay);
		};

		// 监听滚动
		window.addEventListener("scroll", handleScroll, { passive: true });

		return () => {
			window.removeEventListener("scroll", handleScroll);
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		};
	}, [hideDelay]);

	return isScrolling;
}
