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
} from './articles';

// 分类相关
export {
  useCategories,
  useCategoryBySlug,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from './categories';

// 标签相关
export {
  useTags,
  useTagBySlug,
  useCreateTag,
  useUpdateTag,
  useDeleteTag,
} from './tags';

// 用户相关
export {
  useCurrentUser,
  useUpdateUser,
} from './users';

// 站长信息
export { useOwner } from './owner';

// 认证相关
export { useLogin, useLogout } from './auth';