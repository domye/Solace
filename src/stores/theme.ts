/** 主题状态管理 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ThemeState {
	hue: number;
	theme: "light" | "dark";
	setHue: (hue: number) => void;
	toggleTheme: () => void;
	setTheme: (theme: "light" | "dark") => void;
}

const DEFAULT_HUE = 250;

export function applyHue(hue: number) {
	document.documentElement.style.setProperty("--hue", String(hue));
}

export function applyTheme(theme: "light" | "dark") {
	document.documentElement.classList.toggle("dark", theme === "dark");
}

export const useThemeStore = create<ThemeState>()(
	persist(
		(set, get) => ({
			hue: DEFAULT_HUE,
			theme: "light",
			setHue: (hue) => {
				set({ hue });
				applyHue(hue);
			},
			toggleTheme: () => {
				const t = get().theme === "light" ? "dark" : "light";
				set({ theme: t });
				applyTheme(t);
			},
			setTheme: (theme) => {
				set({ theme });
				applyTheme(theme);
			},
		}),
		{
			name: "theme-storage",
			onRehydrateStorage: () => (state) =>
				state && (applyHue(state.hue), applyTheme(state.theme)),
		},
	),
);
