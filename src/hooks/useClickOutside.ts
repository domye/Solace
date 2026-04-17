import { useEffect, RefObject } from "react";

/**
 * 检测点击是否发生在指定元素外部，触发回调
 * @param ref - 目标元素的 ref
 * @param handler - 点击外部时的回调函数
 * @param enabled - 是否启用监听
 * @param excludeRef - 排除的元素（点击该元素不触发 handler）
 */
export function useClickOutside(
	ref: RefObject<HTMLElement | null>,
	handler: () => void,
	enabled = true,
	excludeRef?: RefObject<HTMLElement | null>,
) {
	useEffect(() => {
		if (!enabled) return;

		const listener = (event: MouseEvent | TouchEvent) => {
			const target = event.target as Node;
			// 点击发生在元素内部时不触发
			if (!ref.current || ref.current.contains(target)) return;
			// 点击发生在排除元素上时不触发
			if (excludeRef?.current?.contains(target)) return;
			handler();
		};

		document.addEventListener("mousedown", listener);
		document.addEventListener("touchstart", listener);

		return () => {
			document.removeEventListener("mousedown", listener);
			document.removeEventListener("touchstart", listener);
		};
	}, [ref, handler, enabled, excludeRef]);
}
