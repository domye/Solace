/** 认证状态管理 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";

interface AuthState {
	accessToken: string | null;
	refreshToken: string | null;
	user: User | null;
	isAuthenticated: boolean;
	setTokens: (accessToken: string, refreshToken: string) => void;
	setUser: (user: User) => void;
	login: (accessToken: string, refreshToken: string, user: User) => void;
	logout: () => void;
}

export const useAuthStore = create<AuthState>()(
	persist(
		(set) => ({
			accessToken: null,
			refreshToken: null,
			user: null,
			isAuthenticated: false,
			setTokens: (accessToken, refreshToken) =>
				set({ accessToken, refreshToken, isAuthenticated: true }),
			setUser: (user) => set({ user }),
			login: (accessToken, refreshToken, user) =>
				set({ accessToken, refreshToken, user, isAuthenticated: true }),
			logout: () =>
				set({
					accessToken: null,
					refreshToken: null,
					user: null,
					isAuthenticated: false,
				}),
		}),
		{ name: "auth-storage", partialize: (state) => state },
	),
);

// 监听 API 拦截器的令牌刷新事件
if (typeof window !== "undefined") {
	window.addEventListener("auth:token-refreshed", ((e: CustomEvent) => {
		useAuthStore
			.getState()
			.setTokens(e.detail.accessToken, e.detail.refreshToken);
	}) as EventListener);
	window.addEventListener("auth:logout", () =>
		useAuthStore.getState().logout(),
	);
}
