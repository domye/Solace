/**
 * 深色模式检测 Hook
 *
 * 监听 document 根元素的 dark 类变化，返回当前是否为深色模式
 */

import { useState, useEffect } from "react";

export function useDarkMode(): boolean {
	const [isDark, setIsDark] = useState(() => {
		if (typeof document === "undefined") return false;
		return document.documentElement.classList.contains("dark");
	});

	useEffect(() => {
		const observer = new MutationObserver(() => {
			setIsDark(document.documentElement.classList.contains("dark"));
		});

		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["class"],
		});

		return () => observer.disconnect();
	}, []);

	return isDark;
}
