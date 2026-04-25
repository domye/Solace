import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api";
import { queryKeys } from "@/lib/queryKeys";
import { extractData } from "./utils";
import { useOwner } from "./owner";
import type { service_ContributionsResponse, service_ContributionsGroup } from "@/api/generated";
import type { GitHubRepoInfo } from "@/types";

/**
 * 从 GitHub URL 中提取用户名
 */
function extractGitHubUsername(url: string | undefined | null): string | null {
	if (!url) return null;
	const match = url.match(/github\.com\/([^/]+)/);
	return match?.[1] ?? null;
}

/**
 * 获取 GitHub 贡献数据
 */
export function useGitHubContributions() {
	const { data: owner } = useOwner();
	const githubUsername = extractGitHubUsername(owner?.github_url);

	return useQuery({
		queryKey: queryKeys.github.contributions(githubUsername ?? undefined),
		queryFn: async (): Promise<service_ContributionsResponse> => {
			const response = await apiClient.github.getGithubContributions();
			return extractData<service_ContributionsResponse>(response as unknown as {
				success?: boolean;
				data?: service_ContributionsResponse;
				error?: { message?: string };
			});
		},
		enabled: !!githubUsername,
		staleTime: 60 * 60 * 1000,
		gcTime: 24 * 60 * 60 * 1000,
		retry: 1,
	});
}

/**
 * 获取单个 GitHub 仓库信息（直接调用 GitHub API，使用 no-referrer 避免 CORS）
 */
export function useGitHubRepo(repo: string | undefined) {
	return useQuery({
		queryKey: ["github-repo", repo],
		queryFn: async (): Promise<GitHubRepoInfo> => {
			const response = await fetch(`https://api.github.com/repos/${repo}`, {
				referrerPolicy: "no-referrer",
			});
			if (!response.ok) {
				throw new Error("获取仓库信息失败");
			}
			return response.json();
		},
		enabled: !!repo,
		staleTime: 60 * 60 * 1000,
		gcTime: 24 * 60 * 60 * 1000,
		retry: 1,
	});
}

export { extractGitHubUsername };
export type { service_ContributionsResponse as ContributionsResponse, service_ContributionsGroup as ContributionsGroup };