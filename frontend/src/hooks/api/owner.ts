import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api";
import { queryKeys } from "@/lib/queryKeys";
import { extractData } from "./utils";
import type { Owner } from "@/types";

/**
 * 获取站长公开信息
 */
export function useOwner() {
	return useQuery({
		queryKey: queryKeys.owner.profile(),
		queryFn: async () => {
			const response = await apiClient.owner.getOwner();
			return extractData<Owner>(response);
		},
		staleTime: 30 * 60 * 1000,
		gcTime: 60 * 60 * 1000,
	});
}
