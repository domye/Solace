/**
 * 主题切换按钮
 *
 * 切换深色/浅色模式
 */

import { Icon } from '@iconify/react';
import { useThemeStore } from '@/stores/theme';

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="btn-plain scale-animation rounded-lg h-11 w-11"
      aria-label="切换主题"
    >
      <Icon
        icon={isDark ? 'material-symbols:light-mode-outline-rounded' : 'material-symbols:dark-mode-outline-rounded'}
        className="text-[1.25rem]"
      />
    </button>
  );
}