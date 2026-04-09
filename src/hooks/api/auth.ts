import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/api";
import { useAuthStore } from "@/stores";
import { extractData } from "./utils";
import type { request_LoginRequest } from "@/api";

interface LoginResponse {
	access_token: string;
	refresh_token: string;
	expires_in: number;
	user: {
		id: number;
		username: string;
		email: string;
		nickname?: string;
		avatar_url?: string;
		bio?: string;
		github_url?: string;
		role: string;
	};
}

/**
 * 登录
 */
export function useLogin() {
	const { login } = useAuthStore();

	return useMutation({
		mutationFn: async (data: request_LoginRequest) => {
			const response = await apiClient.auth.postAuthLogin({
				email: data.email,
				password: data.password,
			});
			return extractData<LoginResponse>(response);
		},
		onSuccess: (response) => {
			login(response.access_token, response.refresh_token, response.user);
		},
	});
}

/**
 * 登出
 */
export function useLogout() {
	const { logout, refreshToken } = useAuthStore();

	return useMutation({
		mutationFn: async () => {
			if (refreshToken) {
				await apiClient.auth.postAuthLogout({ refresh_token: refreshToken });
			}
		},
		onSuccess: () => {
			logout();
		},
	});
}
