/**
 * 点击外部关闭 Hook
 *
 * 检测点击是否发生在指定元素外部，触发回调
 */

import { useEffect, RefObject } from 'react';

/**
 * @param ref - 目标元素的 ref
 * @param handler - 点击外部时的回调函数
 * @param enabled - 是否启用监听（默认 true）
 */
export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  handler: () => void,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return;

    const listener = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      // 点击发生在元素内部时不触发
      if (!ref.current || ref.current.contains(target)) {
        return;
      }
      handler();
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler, enabled]);
}
