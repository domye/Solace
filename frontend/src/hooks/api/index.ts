/**
 * API Hooks 导出
 *
 * 按功能模块导出所有 API 相关的 React Query hooks
 */

// 文章相关
export {
  useArticles,
  useArticle,
  useArticleBySlug,
  useArchive,
  useSearch,
  useCreateArticle,
  useUpdateArticle,
  useDeleteArticle,
  useRandomArticles,
  useRecentArticles,
} from './articles';

// 分类相关
export {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from './categories';

// 标签相关
export {
  useTags,
  useCreateTag,
  useUpdateTag,
  useDeleteTag,
} from './tags';

// 用户相关
export { useCurrentUser } from './users';

// 站长信息
export { useOwner } from './owner';

// 认证相关
export { useLogin, useLogout } from './auth';

// GitHub 贡献日历
export { useGitHubContributions, useGitHubRepo, extractGitHubUsername } from './github';
export type { ContributionsResponse, ContributionsGroup } from './github';

// 页面相关
export {
  usePages,
  usePage,
  usePageBySlug,
  useNavPages,
  useCreatePage,
  useUpdatePage,
  useDeletePage,
} from './pages';

// 设置相关
export {
  imageSettingsQueryKey,
  useImageSettings,
  useUpdateImageSettings,
} from './settings';