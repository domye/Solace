/**
 * 主题切换按钮
 *
 * 切换深色/浅色模式
 */

import { useThemeStore } from "@/stores/theme";
import { SafeIcon } from "./SafeIcon";

export function ThemeToggle() {
	const { theme, toggleTheme } = useThemeStore();
	const isDark = theme === "dark";

	return (
		<button
			onClick={toggleTheme}
			className="btn-plain scale-animation rounded-lg h-11 w-11"
			aria-label="切换主题"
		>
			<SafeIcon
				icon={
					isDark
						? "material-symbols:light-mode-outline-rounded"
						: "material-symbols:dark-mode-outline-rounded"
				}
				size="1.25rem"
			/>
		</button>
	);
}
