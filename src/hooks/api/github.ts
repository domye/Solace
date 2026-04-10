import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api";
import { extractData } from "./utils";
import { useOwner } from "./owner";

/**
 * GitHub 贡献日历数据类型
 * react-activity-calendar 要求的格式
 */
export interface ContributionDay {
	date: string; // YYYY-MM-DD 格式
	count: number; // 当天提交次数
	level: 0 | 1 | 2 | 3 | 4; // 热力等级
}

/**
 * 贡献数据响应类型
 */
interface ContributionsResponse {
	contributions: ContributionDay[];
}

/**
 * 从 GitHub URL 中提取用户名
 */
function extractGitHubUsername(url: string | undefined | null): string | null {
	if (!url) return null;
	// 匹配 https://github.com/username 或 github.com/username
	const match = url.match(/github\.com\/([^/]+)/);
	return match?.[1] ?? null;
}

/**
 * 获取 GitHub 贡献数据
 *
 * 通过后端代理调用 GitHub API，Token 在后端安全存储
 */
export function useGitHubContributions() {
	const { data: owner } = useOwner();
	const githubUsername = extractGitHubUsername(owner?.github_url);

	return useQuery({
		queryKey: ["github-contributions", githubUsername],
		queryFn: async (): Promise<ContributionDay[]> => {
			const response = await apiClient.github.getGithubContributions();
			const data = extractData<ContributionsResponse>(response);
			// 转换 level 类型
			return data.contributions.map((day) => ({
				date: day.date,
				count: day.count,
				level: day.level as 0 | 1 | 2 | 3 | 4,
			}));
		},
		enabled: !!githubUsername,
		staleTime: 60 * 60 * 1000, // 1小时缓存
		gcTime: 24 * 60 * 60 * 1000, // 24小时保留
		retry: 1,
	});
}

/**
 * 导出 GitHub 用户名提取函数（供组件使用）
 */
export { extractGitHubUsername };