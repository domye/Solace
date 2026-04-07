/**
 * 日期格式化工具函数
 */

/** 格式化日期为 YYYY-MM-DD 格式 */
export function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toISOString().split('T')[0] ?? '';
}

/** 格式化日期为本地日期时间格式 */
export function formatDateTime(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString();
}

/** 格式化日期为 MM-DD 格式（用于归档时间线） */
export function formatShortDate(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${month}-${day}`;
}

/** 将标签数组格式化为 #tag1 #tag2 格式 */
export function formatTags(tags?: { id: number; name: string }[]): string {
  if (!tags || tags.length === 0) return '';
  return tags.map((t) => `#${t.name}`).join(' ');
}