/**
 * Escape 键关闭 Hook
 *
 * 监听 Escape 键按下，触发回调
 */

import { useEffect, useCallback } from "react";

/**
 * @param handler - Escape 键按下时的回调函数
 * @param active - 是否启用监听（默认 true）
 */
export function useEscapeKey(handler: () => void, active = true) {
	// 使用 useCallback 保持 handler 引用稳定
	const handleEscape = useCallback(
		(event: KeyboardEvent) => {
			if (event.key === "Escape") {
				event.preventDefault();
				handler();
			}
		},
		[handler],
	);

	useEffect(() => {
		if (!active) return;

		document.addEventListener("keydown", handleEscape);
		return () => document.removeEventListener("keydown", handleEscape);
	}, [handleEscape, active]);
}
