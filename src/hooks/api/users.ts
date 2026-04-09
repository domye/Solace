import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api";
import { useAuthStore } from "@/stores";
import { extractData } from "./utils";
import type { User } from "@/types";

/**
 * 获取当前用户信息
 */
export function useCurrentUser() {
	const { isAuthenticated, accessToken } = useAuthStore();

	return useQuery({
		queryKey: ["currentUser"],
		queryFn: async () => {
			try {
				const response = await apiClient.user.getUsersMe();
				return extractData<User>(response);
			} catch (error) {
				console.error("Failed to fetch current user:", error);
				return null;
			}
		},
		enabled: isAuthenticated && !!accessToken,
	});
}
