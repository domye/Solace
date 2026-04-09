import { useQuery } from '@tanstack/react-query';
import { useOwner } from './owner';

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
 * 使用 GitHub GraphQL API 获取用户的贡献日历数据
 * 需要 VITE_GITHUB_TOKEN 环境变量
 */
export function useGitHubContributions() {
  const { data: owner } = useOwner();
  const githubUsername = extractGitHubUsername(owner?.github_url);

  return useQuery({
    queryKey: ['github-contributions', githubUsername],
    queryFn: async (): Promise<ContributionDay[]> => {
      if (!githubUsername) {
        throw new Error('GitHub username not found');
      }

      const token = import.meta.env.VITE_GITHUB_TOKEN;
      if (!token) {
        throw new Error('GitHub token not configured');
      }

      // 计算日期范围：最近12个月
      const today = new Date();
      const from = new Date(today);
      from.setFullYear(from.getFullYear() - 1);

      // GitHub GraphQL API 要求 ISO 8601 格式
      const fromStr = from.toISOString();
      const toStr = today.toISOString();

      const response = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query($username: String!, $from: DateTime!, $to: DateTime!) {
              user(login: $username) {
                contributionsCollection(from: $from, to: $to) {
                  contributionCalendar {
                    weeks {
                      contributionDays {
                        date
                        contributionCount
                        contributionLevel
                      }
                    }
                  }
                }
              }
            }
          `,
          variables: {
            username: githubUsername,
            from: fromStr,
            to: toStr,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0]?.message || 'GitHub API error');
      }

      // 转换数据格式
      const weeks =
        result.data?.user?.contributionsCollection?.contributionCalendar?.weeks || [];

      const contributions: ContributionDay[] = [];
      const levelMap: Record<string, ContributionDay['level']> = {
        NONE: 0,
        FIRST_QUARTILE: 1,
        SECOND_QUARTILE: 2,
        THIRD_QUARTILE: 3,
        FOURTH_QUARTILE: 4,
      };

      for (const week of weeks) {
        for (const day of week.contributionDays) {
          contributions.push({
            date: day.date,
            count: day.contributionCount,
            level: levelMap[day.contributionLevel] || 0,
          });
        }
      }

      return contributions;
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
