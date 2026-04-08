/**
 * 图片URL处理工具
 */

/** 已知的随机图片API域名列表 */
const RANDOM_IMAGE_DOMAINS = [
  'picapi.pai.al',
  'picsum.photos',
  'source.unsplash.com',
  'loremflickr.com',
  'placeimg.com',
];

/**
 * 检测URL是否为随机图片API
 */
function isRandomImageUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return RANDOM_IMAGE_DOMAINS.some(domain => hostname.includes(domain));
  } catch {
    return false;
  }
}

/**
 * 为URL添加缓存破坏参数
 *
 * 对于随机图片API，添加随机参数强制每次请求返回不同图片
 * 对于普通图片URL，保持原样（利用浏览器缓存）
 *
 * @param url - 图片URL
 * @param seed - 可选的种子值（用于生成可预测的随机参数）
 */
export function bustImageCache(url: string | undefined, seed?: number): string | undefined {
  if (!url) return undefined;

  // 只对随机图片API添加缓存破坏参数
  if (isRandomImageUrl(url)) {
    const separator = url.includes('?') ? '&' : '?';
    // 使用种子或随机数生成参数
    const randomParam = seed !== undefined ? seed : Math.floor(Math.random() * 1000000);
    return `${url}${separator}_r=${randomParam}`;
  }

  return url;
}

/**
 * 为文章列表中的随机图片URL添加缓存破坏参数
 *
 * 使用文章ID作为种子，确保：
 * - 不同文章显示不同图片
 * - 同一文章在页面刷新后保持相同的图片
 *
 * @param url - 图片URL
 * @param articleId - 文章ID（用作随机种子）
 */
export function processArticleCoverImage(url: string | undefined, articleId?: number): string | undefined {
  return bustImageCache(url, articleId);
}